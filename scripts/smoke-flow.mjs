#!/usr/bin/env node

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3006';
const email = process.env.SMOKE_TEST_EMAIL;
const password = process.env.SMOKE_TEST_PASSWORD;

const cookieJar = new Map();

function parseAndStoreSetCookie(setCookieHeader) {
  if (!setCookieHeader) return;
  const cookiePairs = setCookieHeader.split(/,(?=\s*[^;]+=)/g);
  for (const pair of cookiePairs) {
    const firstPart = pair.split(';')[0];
    const eqIndex = firstPart.indexOf('=');
    if (eqIndex > 0) {
      const key = firstPart.slice(0, eqIndex).trim();
      const value = firstPart.slice(eqIndex + 1).trim();
      cookieJar.set(key, value);
    }
  }
}

function getCookieHeader() {
  if (cookieJar.size === 0) return '';
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const cookieHeader = getCookieHeader();
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    redirect: options.redirect || 'manual',
    headers,
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    parseAndStoreSetCookie(setCookie);
  }

  return response;
}

async function expectStatus(path, allowedStatuses, options = {}) {
  const response = await request(path, options);
  if (!allowedStatuses.includes(response.status)) {
    const body = await response.text();
    throw new Error(`Expected ${path} in [${allowedStatuses.join(', ')}], got ${response.status}. Body: ${body.slice(0, 300)}`);
  }
  console.log(`OK ${path} -> ${response.status}`);
  return response;
}

async function run() {
  console.log(`Running smoke flow against ${baseUrl}`);

  await expectStatus('/', [200, 307, 308]);
  await expectStatus('/login', [200]);
  await expectStatus('/compare', [200, 307, 308]);

  if (!email || !password) {
    console.log('Skipping authenticated smoke checks (set SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD).');
    return;
  }

  const csrfRes = await expectStatus('/api/auth/csrf', [200]);
  const csrf = await csrfRes.json();
  if (!csrf?.csrfToken) {
    throw new Error('CSRF token not found in /api/auth/csrf response');
  }

  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password,
    callbackUrl: `${baseUrl}/dashboard`,
    json: 'true',
  });

  await expectStatus('/api/auth/callback/credentials', [200, 302], {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  await expectStatus('/dashboard', [200]);
  await expectStatus('/manage', [200, 307, 308]);
  await expectStatus('/settings', [200, 307, 308]);
  await expectStatus('/api/regulations', [200]);

  // Destructive endpoint smoke (invalid ids to avoid data mutation)
  await expectStatus('/api/versions/non-existent-id', [400, 404, 500], { method: 'DELETE' });
  await expectStatus('/api/regulations/non-existent-id/manage', [400, 404, 500], { method: 'DELETE' });

  console.log('Authenticated smoke checks passed.');
}

run().catch((error) => {
  console.error('Smoke flow failed:', error.message);
  process.exit(1);
});

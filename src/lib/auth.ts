import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { LRUCache } from "lru-cache";

// Validation schema for login
const loginSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
});

// Failed login rate limiter: per email+IP, 5 attempts in 15 minutes
const loginRateLimit = new LRUCache<string, number[]>({
    max: 1000,
    ttl: 15 * 60 * 1000,
});

const MAX_LOGIN_ATTEMPTS = 5;

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, request) {
                // Validate input
                const result = loginSchema.safeParse(credentials);
                if (!result.success) {
                    return null;
                }

                const { email, password } = result.data;

                // Rate limit check per email
                const ip = (request as Request)?.headers?.get('x-forwarded-for') ?? 'anonymous';
                const rateLimitKey = `login:${email}:${ip}`;
                const attempts = loginRateLimit.get(rateLimitKey) || [0];
                if (attempts[0] >= MAX_LOGIN_ATTEMPTS) {
                    return null;
                }

                // Find user
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    attempts[0] += 1;
                    loginRateLimit.set(rateLimitKey, attempts);
                    return null;
                }

                // Verify password
                const isValid = await compare(password, user.password);
                if (!isValid) {
                    attempts[0] += 1;
                    loginRateLimit.set(rateLimitKey, attempts);
                    return null;
                }

                // Successful login — clear rate limit
                loginRateLimit.delete(rateLimitKey);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id ?? "";
                token.role = user.role ?? "VIEWER";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
});

// Type augmentation for session
declare module "next-auth" {
    interface User {
        role?: string;
    }
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            role: string;
        };
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        role: string;
    }
}

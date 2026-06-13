/**
 * Polyfills for browser APIs that are missing in the Node.js environment
 * but required by libraries like pdfjs-dist.
 */

interface GlobalWithPolyfills {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
}

if (typeof global !== 'undefined') {
    const g = global as unknown as GlobalWithPolyfills;
    if (!('DOMMatrix' in g)) {
        g.DOMMatrix = class DOMMatrix {
            constructor() {}
        };
    }
    if (!('ImageData' in g)) {
        g.ImageData = class ImageData {
            constructor() {}
        };
    }
    if (!('Path2D' in g)) {
        g.Path2D = class Path2D {
            constructor() {}
        };
    }
}

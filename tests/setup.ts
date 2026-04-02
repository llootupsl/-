import { afterEach, vi } from 'vitest';
import { logger } from '@/core/utils/Logger';

afterEach(() => {
  vi.restoreAllMocks();
});

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList);
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 16);
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (handle: number) => window.clearTimeout(handle);
  }

  if (!window.ResizeObserver) {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  }

  if (!window.IntersectionObserver) {
    class IntersectionObserverMock {
      root: Element | Document | null = null;
      rootMargin = '';
      thresholds: ReadonlyArray<number> = [];
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }

    window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
  }
}

Object.defineProperty(globalThis, 'logger', {
  configurable: true,
  value: logger,
});

Object.defineProperty(globalThis, 'GPUShaderStage', {
  configurable: true,
  value: {
    VERTEX: 1,
    FRAGMENT: 2,
    COMPUTE: 4,
  },
});

Object.defineProperty(globalThis, 'GPUBufferUsage', {
  configurable: true,
  value: {
    MAP_READ: 1,
    MAP_WRITE: 2,
    COPY_SRC: 4,
    COPY_DST: 8,
    INDEX: 16,
    VERTEX: 32,
    UNIFORM: 64,
    STORAGE: 128,
    INDIRECT: 256,
    QUERY_RESOLVE: 512,
  },
});

Object.defineProperty(globalThis, 'GPUTextureUsage', {
  configurable: true,
  value: {
    COPY_SRC: 1,
    COPY_DST: 2,
    TEXTURE_BINDING: 4,
    STORAGE_BINDING: 8,
    RENDER_ATTACHMENT: 16,
  },
});

Object.defineProperty(globalThis, 'GPUColorWrite', {
  configurable: true,
  value: {
    RED: 1,
    GREEN: 2,
    BLUE: 4,
    ALPHA: 8,
    ALL: 15,
  },
});

Object.defineProperty(globalThis, 'GPUMapMode', {
  configurable: true,
  value: {
    READ: 1,
    WRITE: 2,
  },
});

if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
}

if (typeof navigator !== 'undefined' && !('gpu' in navigator)) {
  Object.defineProperty(navigator, 'gpu', {
    configurable: true,
    value: {
      requestAdapter: vi.fn().mockResolvedValue(null),
      getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
    },
  });
}

if (typeof navigator !== 'undefined' && !navigator.storage) {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: {
      estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 0 }),
      getDirectory: vi.fn(),
    },
  });
}

if (typeof window !== 'undefined' && !window.scrollTo) {
  window.scrollTo = vi.fn();
}

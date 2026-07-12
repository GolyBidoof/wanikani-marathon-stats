/// <reference types="vite/client" />

interface GiflerAnimator {
  onDrawFrame: (
    ctx: CanvasRenderingContext2D,
    frame: { buffer: CanvasImageSource; x: number; y: number },
  ) => void;
  animateInCanvas: (canvas: HTMLCanvasElement) => void;
  start: () => void;
  stop: () => void;
}

interface GiflerInstance {
  get: (callback: (animator: GiflerAnimator) => void) => void;
}

interface Window {
  gifler?: (src: string) => GiflerInstance;
}

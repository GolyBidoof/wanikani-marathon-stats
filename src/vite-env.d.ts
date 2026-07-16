/// <reference types="vite/client" />

declare module '../data/site.json' {
  const site: {
    name: string;
    title: string;
    description: string;
    url: string;
    forumsUrl: string;
    latestMarathon: {
      name: string;
      threadUrl: string;
    };
  };
  export default site;
}

declare module '../data/gifs.json' {
  const gifs: string[];
  export default gifs;
}

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

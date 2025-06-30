// Visual Viewport API types for Safari viewport handling
interface VisualViewport extends EventTarget {
  readonly height: number;
  readonly width: number;
  readonly offsetLeft: number;
  readonly offsetTop: number;
  readonly pageLeft: number;
  readonly pageTop: number;
  readonly scale: number;
}

declare global {
  interface Window {
    visualViewport?: VisualViewport;
  }
} 
declare module '*.json' {
  const value: {
    version: string;
    timestamp: string;
    settings: {
      toneMapping: {
        mode: number;
        exposure: number;
        whitePoint: number;
        middleGrey: number;
        adaptation: number;
      };
      bloom: {
        intensity: number;
        luminanceThreshold: number;
        luminanceSmoothing: number;
        mipmapBlur: boolean;
        opacity: number;
      };
      chromaticAberration: {
        enabled: boolean;
        offset: [number, number];
        redOffset: [number, number];
        greenOffset: [number, number];
        blueOffset: [number, number];
        radialModulation: boolean;
        modulationOffset: number;
        blur: number;
        intensity: number;
        radialIntensity: number;
      };
      filmGrain: {
        intensity: number;
        opacity: number;
      };
      ssao: {
        intensity: number;
        radius: number;
        bias: number;
        samples: number;
        rings: number;
        distanceThreshold: number;
        distanceFalloff: number;
      };
      blur: {
        enabled: boolean;
        intensity: number;
        kernelSize: number;
        iterations: number;
      };
      depthOfField: {
        enabled: boolean;
        focusDistance: number;
        focalLength: number;
        bokehScale: number;
      };
      lensDistortion: {
        enabled: boolean;
        barrelDistortion: number;
        chromaticAberration: number;
        vignette: number;
        center: [number, number];
      };
      motionBlur: {
        intensity: number;
        velocityScale: number;
        samples: number;
        enabled: boolean;
      };
      hdri: {
        enabled: boolean;
        url: string;
        intensity: number;
        rotation: number;
        background: boolean;
      };
      godRays: {
        enabled: boolean;
        density: number;
        decay: number;
        weight: number;
        exposure: number;
        intensity: number;
      };
      material: {
        roughness: number;
        metalness: number;
        reflectivity: number;
        envMapIntensity: number;
        clearcoat: number;
        clearcoatRoughness: number;
        ior: number;
        color: string;
      };
    };
  };
  export default value;
} 
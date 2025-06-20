import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  EffectComposer, 
  RenderPass, 
  ShaderPass,
  EffectPass,
  ToneMappingEffect as CoreToneMappingEffect,
  BloomEffect as CoreBloomEffect,
  NoiseEffect,
  SSAOEffect,
  VignetteEffect,
  ToneMappingMode,
  BlendFunction,
  KernelSize
} from 'postprocessing';
import * as THREE from 'three';

// Define shaders inline to avoid import issues
const lensDistortionVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const lensDistortionFragmentShader = `
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
    // Simple passthrough for testing
    gl_FragColor = texture2D(tDiffuse, vUv);
}
`;

export interface LensDistortionSettings {
  barrelDistortion: number;
  chromaticAberration: number;
  vignette: number;
  center: [number, number];
}

export interface PostProcessingSettings {
  lensDistortion: LensDistortionSettings;
  toneMapping: {
    mode: ToneMappingMode;
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
}

interface LensDistortionEffectProps {
  lensDistortion: LensDistortionSettings;
  toneMapping: PostProcessingSettings['toneMapping'];
  bloom: PostProcessingSettings['bloom'];
  filmGrain: PostProcessingSettings['filmGrain'];
  ssao: PostProcessingSettings['ssao'];
}

const LensDistortionEffect: React.FC<LensDistortionEffectProps> = ({
  lensDistortion,
  toneMapping,
  bloom,
  filmGrain,
  ssao,
}) => {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const lensPassRef = useRef<ShaderPass | null>(null);
  const effectsRef = useRef<{
    toneMapping: CoreToneMappingEffect;
    bloom: CoreBloomEffect;
    noise: NoiseEffect;
    ssao: SSAOEffect;
    vignette: VignetteEffect;
  } | null>(null);

  // Create lens distortion shader material
  const lensDistortionMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
      },
      vertexShader: lensDistortionVertexShader,
      fragmentShader: lensDistortionFragmentShader,
    });
  }, []);

  // Initialize the composer with HDR support
  useEffect(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 4,
    });

    // Add render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add custom lens distortion pass
    const lensPass = new ShaderPass(lensDistortionMaterial);
    composer.addPass(lensPass);
    lensPassRef.current = lensPass;

    // Create other effects
    const toneMappingEffect = new CoreToneMappingEffect({
      mode: toneMapping.mode,
      resolution: 256,
      whitePoint: toneMapping.whitePoint,
      middleGrey: toneMapping.middleGrey,
      minLuminance: 0.01,
      averageLuminance: 1.0,
      adaptationRate: toneMapping.adaptation,
    });

    const bloomEffect = new CoreBloomEffect({
      intensity: bloom.intensity,
      kernelSize: KernelSize.LARGE,
      luminanceThreshold: bloom.luminanceThreshold,
      luminanceSmoothing: bloom.luminanceSmoothing,
      mipmapBlur: bloom.mipmapBlur,
    });
    bloomEffect.blendMode.opacity.value = bloom.opacity;

    const noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.COLOR_DODGE,
      premultiply: false,
    });
    noiseEffect.blendMode.opacity.value = filmGrain.opacity;

    const ssaoEffect = new SSAOEffect(camera, undefined, {
      intensity: ssao.intensity,
      radius: ssao.radius,
      samples: ssao.samples,
      rings: ssao.rings,
      distanceThreshold: ssao.distanceThreshold,
      distanceFalloff: ssao.distanceFalloff,
      minRadiusScale: 0.1,
      fade: 0.01,
      color: new THREE.Color(0x000000),
    });

    const vignetteEffect = new VignetteEffect({
      darkness: 0.2,
      offset: 0.2,
    });

    // Store effects for updates
    effectsRef.current = {
      toneMapping: toneMappingEffect,
      bloom: bloomEffect,
      noise: noiseEffect,
      ssao: ssaoEffect,
      vignette: vignetteEffect,
    };

    // Create effect pass with remaining effects
    const effects = [
      ssaoEffect,
      bloomEffect,
      noiseEffect,
      vignetteEffect,
      toneMappingEffect,
    ];

    const effectPass = new EffectPass(camera, ...effects);
    composer.addPass(effectPass);

    composerRef.current = composer;

    return () => {
      composer.dispose();
      effectsRef.current = null;
      lensPassRef.current = null;
    };
  }, [gl, scene, camera]);

  // Update lens distortion uniforms when settings change
  useEffect(() => {
    if (!lensPassRef.current) return;
    // Temporarily disabled for debugging
    console.log('Lens distortion settings updated:', lensDistortion);
  }, [lensDistortion]);

  // Update other effects when settings change
  useEffect(() => {
    if (!effectsRef.current) return;
    const { toneMapping: tm } = effectsRef.current;
    tm.mode = toneMapping.mode;
    tm.adaptiveLuminanceMaterial.adaptationRate = toneMapping.adaptation;
  }, [toneMapping]);

  useEffect(() => {
    if (!effectsRef.current) return;
    const { bloom: b } = effectsRef.current;
    b.intensity = bloom.intensity;
    b.blendMode.opacity.value = bloom.opacity;
  }, [bloom]);

  useEffect(() => {
    if (!effectsRef.current) return;
    const { noise } = effectsRef.current;
    noise.blendMode.opacity.value = filmGrain.opacity;
  }, [filmGrain]);

  useEffect(() => {
    if (!effectsRef.current) return;
    const { ssao: s } = effectsRef.current;
    s.intensity = ssao.intensity;
    s.radius = ssao.radius;
  }, [ssao]);

  // Update renderer exposure for tone mapping
  useEffect(() => {
    gl.toneMappingExposure = toneMapping.exposure;
  }, [gl, toneMapping.exposure]);

  // Update resolution when size changes
  useEffect(() => {
    if (!lensPassRef.current) return;
    // Temporarily disabled for debugging
    console.log('Size updated:', size.width, size.height);
  }, [size.width, size.height]);

  // Render using the composer
  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1);

  return null;
};

export default LensDistortionEffect; 
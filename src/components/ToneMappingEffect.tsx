import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  EffectComposer, 
  RenderPass, 
  EffectPass,
  ToneMappingEffect as CoreToneMappingEffect,
  BloomEffect as CoreBloomEffect,
  NoiseEffect,
  SSAOEffect,
  DepthOfFieldEffect,
  GodRaysEffect,
  VignetteEffect,
  GaussianBlurPass,
  ToneMappingMode,
  BlendFunction,
  KernelSize,
  Effect
} from 'postprocessing';
import * as THREE from 'three';
// Custom RGB Chromatic Aberration Effect
class RGBChromaticAberrationEffect extends Effect {
  constructor() {
    const fragmentShader = `
      uniform vec2 redOffset;
      uniform vec2 greenOffset;
      uniform vec2 blueOffset;
      uniform float blur;

      void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
        // Use depth to determine if we should apply chromatic aberration
        // Closer objects (lower depth values) get less aberration
        // This keeps the main SAO logo sharp while affecting the background
        float depthFactor = smoothstep(0.98, 0.995, depth); // Adjust these values to fine-tune
        
        if (depthFactor < 0.1) {
          // Very close objects (SAO logo) - keep original with minimal effect
          outputColor = inputColor;
          return;
        }
        
        // Apply chromatic aberration based on depth
        vec2 scaledRedOffset = redOffset * depthFactor;
        vec2 scaledGreenOffset = greenOffset * depthFactor;
        vec2 scaledBlueOffset = blueOffset * depthFactor;
        
        // Sample each color channel with its own scaled offset
        float r = texture2D(inputBuffer, uv + scaledRedOffset).r;
        float g = texture2D(inputBuffer, uv + scaledGreenOffset).g;
        float b = texture2D(inputBuffer, uv + scaledBlueOffset).b;
        
        // Combine the separated channels
        vec3 color = vec3(r, g, b);
        
        // Apply blur effect with proper sampling
        if (blur > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(inputBuffer, 0));
          vec3 blurred = vec3(0.0);
          float blurRadius = blur * 20.0; // Increase multiplier for more noticeable effect
          
          // 3x3 blur kernel for performance
          for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
              vec2 offset = vec2(float(x), float(y)) * texelSize * blurRadius;
              
              float rBlur = texture2D(inputBuffer, uv + scaledRedOffset + offset).r;
              float gBlur = texture2D(inputBuffer, uv + scaledGreenOffset + offset).g;
              float bBlur = texture2D(inputBuffer, uv + scaledBlueOffset + offset).b;
              
              blurred += vec3(rBlur, gBlur, bBlur);
            }
          }
          blurred /= 9.0; // Average of 3x3 samples
          
          // Mix between sharp chromatic aberration and blurred version
          color = mix(color, blurred, blur * 100.0); // Strong blur mixing
        }
        
        // Mix between original and chromatic aberration based on depth
        color = mix(inputColor.rgb, color, depthFactor);
        
        outputColor = vec4(color, inputColor.a);
      }
    `;

    super("RGBChromaticAberration", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["redOffset", new THREE.Uniform(new THREE.Vector2(0.01, 0.0))],
        ["greenOffset", new THREE.Uniform(new THREE.Vector2(0.0, 0.0))],
        ["blueOffset", new THREE.Uniform(new THREE.Vector2(-0.01, 0.0))],
        ["blur", new THREE.Uniform(0.0)]
      ])
    });
  }

  get redOffset() {
    return this.uniforms.get("redOffset")!.value;
  }

  set redOffset(value: THREE.Vector2) {
    this.uniforms.get("redOffset")!.value = value;
  }

  get greenOffset() {
    return this.uniforms.get("greenOffset")!.value;
  }

  set greenOffset(value: THREE.Vector2) {
    this.uniforms.get("greenOffset")!.value = value;
  }

  get blueOffset() {
    return this.uniforms.get("blueOffset")!.value;
  }

  set blueOffset(value: THREE.Vector2) {
    this.uniforms.get("blueOffset")!.value = value;
  }

  get blur() {
    return this.uniforms.get("blur")!.value;
  }

  set blur(value: number) {
    this.uniforms.get("blur")!.value = value;
  }
}

// Custom Lens Distortion Effect
class LensDistortionEffect extends Effect {
  constructor() {
    const fragmentShader = `
      uniform float barrelDistortion;
      uniform float chromaticAberration;
      uniform float vignette;
      uniform vec2 center;

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec2 centeredUV = uv - center;
        float distance = length(centeredUV);
        
        // Barrel/Pincushion distortion
        float distortionFactor = 1.0 + barrelDistortion * distance * distance;
        vec2 distortedUV = center + centeredUV * distortionFactor;
        
        // Chromatic aberration (lens distortion type)
        float aberrationIntensity = chromaticAberration * distance;
        vec2 redOffset = vec2(aberrationIntensity, 0.0);
        vec2 blueOffset = vec2(-aberrationIntensity, 0.0);
        
        // Sample with aberration offsets
        float r = texture2D(inputBuffer, distortedUV + redOffset).r;
        float g = texture2D(inputBuffer, distortedUV).g;
        float b = texture2D(inputBuffer, distortedUV + blueOffset).b;
        
        vec3 color = vec3(r, g, b);
        
        // Vignette effect
        float vignetteAmount = 1.0 - vignette * distance * distance;
        color *= vignetteAmount;
        
        // Ensure we stay within UV bounds
        if (distortedUV.x < 0.0 || distortedUV.x > 1.0 || distortedUV.y < 0.0 || distortedUV.y > 1.0) {
          color = vec3(0.0);
        }
        
        outputColor = vec4(color, inputColor.a);
      }
    `;

    super("LensDistortion", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["barrelDistortion", new THREE.Uniform(0.0)],
        ["chromaticAberration", new THREE.Uniform(0.0)],
        ["vignette", new THREE.Uniform(0.0)],
        ["center", new THREE.Uniform(new THREE.Vector2(0.5, 0.5))]
      ])
    });
  }

  get barrelDistortion() {
    return this.uniforms.get("barrelDistortion")!.value;
  }

  set barrelDistortion(value: number) {
    this.uniforms.get("barrelDistortion")!.value = value;
  }

  get chromaticAberration() {
    return this.uniforms.get("chromaticAberration")!.value;
  }

  set chromaticAberration(value: number) {
    this.uniforms.get("chromaticAberration")!.value = value;
  }

  get vignette() {
    return this.uniforms.get("vignette")!.value;
  }

  set vignette(value: number) {
    this.uniforms.get("vignette")!.value = value;
  }

  get center() {
    return this.uniforms.get("center")!.value;
  }

  set center(value: THREE.Vector2) {
    this.uniforms.get("center")!.value = value;
  }
}

export interface ToneMappingSettings {
  mode: ToneMappingMode;
  exposure: number;
  whitePoint: number;
  middleGrey: number;
  adaptation: number;
}

export interface BloomSettings {
  intensity: number;
  luminanceThreshold: number;
  luminanceSmoothing: number;
  mipmapBlur: boolean;
  opacity: number;
}

export interface ChromaticAberrationSettings {
  offset: [number, number];
  redOffset: [number, number];
  greenOffset: [number, number];
  blueOffset: [number, number];
  radialModulation: boolean;
  modulationOffset: number;
  blur: number;
}

export interface FilmGrainSettings {
  intensity: number;
  opacity: number;
}

export interface SSAOSettings {
  intensity: number;
  radius: number;
  bias: number;
  samples: number;
  rings: number;
  distanceThreshold: number;
  distanceFalloff: number;
}

export interface BlurSettings {
  enabled: boolean;
  intensity: number;
  kernelSize: number;
  iterations: number;
}

// New enhanced settings for cinematic quality
export interface DepthOfFieldSettings {
  focusDistance: number;
  focalLength: number;
  bokehScale: number;
  enabled: boolean;
}

export interface GodRaysSettings {
  intensity: number;
  density: number;
  decay: number;
  weight: number;
  exposure: number;
  enabled: boolean;
}

export interface LensDistortionSettings {
  barrelDistortion: number;
  chromaticAberration: number;
  vignette: number;
  center: [number, number];
  enabled: boolean;
}

export interface PostProcessingSettings {
  toneMapping: ToneMappingSettings;
  bloom: BloomSettings;
  chromaticAberration: ChromaticAberrationSettings;
  filmGrain: FilmGrainSettings;
  ssao: SSAOSettings;
  blur: BlurSettings;
  depthOfField: DepthOfFieldSettings;
  lensDistortion: LensDistortionSettings;
  godRays?: GodRaysSettings;
}

interface PostProcessingEffectsProps {
  toneMapping: ToneMappingSettings;
  bloom: BloomSettings;
  chromaticAberration: ChromaticAberrationSettings;
  filmGrain: FilmGrainSettings;
  ssao: SSAOSettings;
  blur: BlurSettings;
  depthOfField: DepthOfFieldSettings;
  lensDistortion: LensDistortionSettings;
  godRays?: GodRaysSettings;
}

const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = ({
  toneMapping,
  bloom,
  chromaticAberration,
  filmGrain,
  ssao,
  blur,
  depthOfField,
  lensDistortion,
  godRays,
}) => {
  const { gl, scene, camera } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const blurPassRef = useRef<GaussianBlurPass | null>(null);
  const effectsRef = useRef<{
    toneMapping: CoreToneMappingEffect;
    bloom: CoreBloomEffect;
    chromaticAberration: RGBChromaticAberrationEffect;
    lensDistortion: LensDistortionEffect;
    noise: NoiseEffect;
    ssao: SSAOEffect;
    depthOfField?: DepthOfFieldEffect;
    godRays?: GodRaysEffect;
    vignette: VignetteEffect;
  } | null>(null);

  // Initialize the composer with HDR support for better quality
  useEffect(() => {
    // Create composer with high precision frame buffers
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType, // HDR workflow for better color precision
      multisampling: 4, // Anti-aliasing
    });

    // Set size with proper pixel ratio
    composer.setSize(gl.domElement.width, gl.domElement.height);

    // Add render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Blur pass will be added/removed dynamically based on settings
    // No blur pass initialization here

    // Create all effects with correct API
    const toneMappingEffect = new CoreToneMappingEffect({
      mode: toneMapping.mode,
      resolution: 1024, // Increased from 256 to prevent pixelation
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
      height: 720, // Higher resolution for smoother bloom
    });
    bloomEffect.blendMode.opacity.value = bloom.opacity;

    // Restore custom RGB chromatic aberration with fixed shader
    const chromaticAberrationEffect = new RGBChromaticAberrationEffect();
    
    // Set initial values for RGB channels with safe fallbacks
    chromaticAberrationEffect.redOffset.set(
      chromaticAberration.redOffset?.[0] || 0.015, 
      chromaticAberration.redOffset?.[1] || 0.0
    );
    chromaticAberrationEffect.greenOffset.set(
      chromaticAberration.greenOffset?.[0] || 0.0, 
      chromaticAberration.greenOffset?.[1] || 0.0
    );
    chromaticAberrationEffect.blueOffset.set(
      chromaticAberration.blueOffset?.[0] || -0.015, 
      chromaticAberration.blueOffset?.[1] || 0.0
    );
    chromaticAberrationEffect.blur = chromaticAberration.blur || 0.0;

    const noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.COLOR_DODGE,
      premultiply: false,
    });
    noiseEffect.blendMode.opacity.value = filmGrain.opacity;

    const ssaoEffect = new SSAOEffect(camera, undefined, {
      intensity: ssao.intensity,
      radius: ssao.radius,
      samples: Math.max(16, ssao.samples), // Ensure minimum sample count for quality
      rings: Math.max(4, ssao.rings), // Ensure minimum ring count
      distanceThreshold: ssao.distanceThreshold,
      distanceFalloff: ssao.distanceFalloff,
      minRadiusScale: 0.1,
      fade: 0.01,
      color: new THREE.Color(0x000000),
      resolutionScale: 1.0, // Full resolution for SSAO to prevent pixelation
    });

    // Enhanced cinematic effects
    const vignetteEffect = new VignetteEffect({
      darkness: 0.3,
      offset: 0.3,
    });

    // Lens distortion effect
    const lensDistortionEffect = new LensDistortionEffect();
    lensDistortionEffect.barrelDistortion = lensDistortion.barrelDistortion || 0.0;
    lensDistortionEffect.chromaticAberration = lensDistortion.chromaticAberration || 0.0;
    lensDistortionEffect.vignette = lensDistortion.vignette || 0.0;
    lensDistortionEffect.center.set(
      lensDistortion.center?.[0] || 0.5,
      lensDistortion.center?.[1] || 0.5
    );

    let depthOfFieldEffect: DepthOfFieldEffect | undefined;
    if (depthOfField?.enabled) {
      depthOfFieldEffect = new DepthOfFieldEffect(camera, {
        focusDistance: depthOfField.focusDistance || 10.0,
        focalLength: depthOfField.focalLength || 50.0,
        bokehScale: depthOfField.bokehScale || 1.0,
        height: 480,
      });
    }

    let godRaysEffect: GodRaysEffect | undefined;
    if (godRays?.enabled) {
      // Create a simple mesh for god rays light source
      const lightSource = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      lightSource.position.set(2, 1, -1);
      scene.add(lightSource);
      
      godRaysEffect = new GodRaysEffect(camera, lightSource, {
        height: 480,
        kernelSize: KernelSize.SMALL,
        density: godRays.density,
        decay: godRays.decay,
        weight: godRays.weight,
        exposure: godRays.exposure,
        samples: 60,
        clampMax: 1.0,
      });
    }

    // Store effects for updates
    effectsRef.current = {
      toneMapping: toneMappingEffect,
      bloom: bloomEffect,
      chromaticAberration: chromaticAberrationEffect,
      lensDistortion: lensDistortionEffect,
      noise: noiseEffect,
      ssao: ssaoEffect,
      depthOfField: depthOfFieldEffect,
      godRays: godRaysEffect,
      vignette: vignetteEffect,
    };

    // Create effect pass with all effects in optimal order
    const effects = [
      ssaoEffect, // Depth-based effects first
      depthOfFieldEffect,
      lensDistortion.enabled ? lensDistortionEffect : null, // Lens distortion when enabled
      chromaticAberrationEffect, // RGB chromatic aberration
      bloomEffect, // HDR bloom
      godRaysEffect,
      noiseEffect, // Film grain
      vignetteEffect, // Subtle vignette
      toneMappingEffect, // Final color grading
    ].filter(Boolean) as any[];

    const effectPass = new EffectPass(camera, ...effects);
    composer.addPass(effectPass);

    composerRef.current = composer;

    // Cleanup
    return () => {
      composer.dispose();
      effectsRef.current = null;
    };
  }, [gl, scene, camera, depthOfField?.enabled, depthOfField?.focusDistance, depthOfField?.focalLength, depthOfField?.bokehScale, lensDistortion.enabled]);

  // Update effects when settings change
  useEffect(() => {
    if (!effectsRef.current) return;

    const { toneMapping: tm } = effectsRef.current;
    tm.mode = toneMapping.mode;
    // Note: whitePoint and middleGrey are readonly after construction
    tm.adaptiveLuminanceMaterial.adaptationRate = toneMapping.adaptation;
    // Note: exposure is handled through renderer.toneMappingExposure or the ToneMapping uniforms
  }, [toneMapping]);

  useEffect(() => {
    if (!effectsRef.current) return;

    const { bloom: b } = effectsRef.current;
    b.intensity = bloom.intensity;
    // Note: luminanceThreshold and luminanceSmoothing are constructor-only parameters
    b.blendMode.opacity.value = bloom.opacity;
  }, [bloom]);

  useEffect(() => {
    if (!effectsRef.current) return;

    const { chromaticAberration: ca } = effectsRef.current;
    ca.redOffset.set(
      chromaticAberration.redOffset?.[0] || 0.015, 
      chromaticAberration.redOffset?.[1] || 0.0
    );
    ca.greenOffset.set(
      chromaticAberration.greenOffset?.[0] || 0.0, 
      chromaticAberration.greenOffset?.[1] || 0.0
    );
    ca.blueOffset.set(
      chromaticAberration.blueOffset?.[0] || -0.015, 
      chromaticAberration.blueOffset?.[1] || 0.0
    );
    ca.blur = chromaticAberration.blur || 0.0;
  }, [chromaticAberration]);

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
    // Note: samples, rings, bias, etc. are constructor-only parameters
  }, [ssao]);

  useEffect(() => {
    if (!effectsRef.current) return;

    const { lensDistortion: ld } = effectsRef.current;
    ld.barrelDistortion = lensDistortion.barrelDistortion || 0.0;
    ld.chromaticAberration = lensDistortion.chromaticAberration || 0.0;
    ld.vignette = lensDistortion.vignette || 0.0;
    ld.center.set(
      lensDistortion.center?.[0] || 0.5,
      lensDistortion.center?.[1] || 0.5
    );
  }, [lensDistortion]);

  // Handle dynamic blur pass creation/removal
  useEffect(() => {
    if (!composerRef.current) return;

    const composer = composerRef.current;
    
    // Remove existing blur pass if it exists
    if (blurPassRef.current) {
      composer.removePass(blurPassRef.current);
      blurPassRef.current = null;
    }

    // Add new blur pass if enabled
    if (blur.enabled) {
      const gaussianBlurPass = new GaussianBlurPass({
        kernelSize: blur.kernelSize,
        iterations: blur.iterations,
        resolutionScale: Math.max(0.5, blur.intensity), // Prevent too low resolution
      });
      
      // Insert blur pass after render pass (index 1) but before effect pass
      composer.addPass(gaussianBlurPass, 1);
      blurPassRef.current = gaussianBlurPass;
    }
  }, [blur.enabled, blur.kernelSize, blur.iterations, blur.intensity]);

  // Update renderer exposure for tone mapping
  useEffect(() => {
    gl.toneMappingExposure = toneMapping.exposure;
  }, [gl, toneMapping.exposure]);

  // Handle resize events to maintain quality
  useEffect(() => {
    const handleResize = () => {
      if (composerRef.current) {
        const canvas = gl.domElement;
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        composerRef.current.setSize(canvas.width / pixelRatio, canvas.height / pixelRatio);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [gl]);

  // Render using the composer
  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1); // Lower priority to render after scene

  return null; // No JSX needed - we're using imperative rendering
};

export default PostProcessingEffects; 
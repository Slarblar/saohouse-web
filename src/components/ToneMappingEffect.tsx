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
// Enhanced Motion Blur Effect with velocity tracking
class MotionBlurEffect extends Effect {
  private previousViewMatrix: THREE.Matrix4;
  private previousProjectionMatrix: THREE.Matrix4;

  constructor() {
    const fragmentShader = `
      uniform mat4 previousViewMatrix;
      uniform mat4 previousProjectionMatrix;
      uniform mat4 currentViewMatrix;
      uniform mat4 currentProjectionMatrix;
      uniform float intensity;
      uniform float velocityScale;
      uniform int samples;

      void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
        // Calculate velocity based on camera movement
        vec4 currentPosition = vec4(uv * 2.0 - 1.0, depth, 1.0);
        vec4 previousPosition = previousProjectionMatrix * previousViewMatrix * 
                               inverse(currentViewMatrix) * inverse(currentProjectionMatrix) * currentPosition;
        previousPosition /= previousPosition.w;
        
        vec2 velocity = (currentPosition.xy - previousPosition.xy) * velocityScale * intensity;
        float velocityLength = length(velocity);
        
        // Apply motion blur based on velocity
        vec3 color = vec3(0.0);
        float sampleWeight = 1.0 / float(samples);
        
        for (int i = 0; i < samples; i++) {
          float t = float(i) / float(samples - 1);
          vec2 sampleUV = uv + velocity * (t - 0.5);
          
          // Ensure UV coordinates are within bounds
          if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
            color += texture2D(inputBuffer, sampleUV).rgb * sampleWeight;
          } else {
            color += inputColor.rgb * sampleWeight;
          }
        }
        
        // Mix between original and motion blurred based on velocity
        float blurFactor = smoothstep(0.0, 0.1, velocityLength);
        outputColor = vec4(mix(inputColor.rgb, color, blurFactor), inputColor.a);
      }
    `;

    super("MotionBlur", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["previousViewMatrix", new THREE.Uniform(new THREE.Matrix4())],
        ["previousProjectionMatrix", new THREE.Uniform(new THREE.Matrix4())],
        ["currentViewMatrix", new THREE.Uniform(new THREE.Matrix4())],
        ["currentProjectionMatrix", new THREE.Uniform(new THREE.Matrix4())],
        ["intensity", new THREE.Uniform(1.0)],
        ["velocityScale", new THREE.Uniform(1.0)],
        ["samples", new THREE.Uniform(8)]
      ])
    });

    this.previousViewMatrix = new THREE.Matrix4();
    this.previousProjectionMatrix = new THREE.Matrix4();
  }

  updateMatrices(camera: THREE.Camera) {
    this.uniforms.get("currentViewMatrix")!.value.copy(camera.matrixWorldInverse);
    this.uniforms.get("currentProjectionMatrix")!.value.copy(camera.projectionMatrix);
    this.uniforms.get("previousViewMatrix")!.value.copy(this.previousViewMatrix);
    this.uniforms.get("previousProjectionMatrix")!.value.copy(this.previousProjectionMatrix);

    this.previousViewMatrix.copy(camera.matrixWorldInverse);
    this.previousProjectionMatrix.copy(camera.projectionMatrix);
  }

  get intensity() {
    return this.uniforms.get("intensity")!.value;
  }

  set intensity(value: number) {
    this.uniforms.get("intensity")!.value = value;
  }

  get velocityScale() {
    return this.uniforms.get("velocityScale")!.value;
  }

  set velocityScale(value: number) {
    this.uniforms.get("velocityScale")!.value = value;
  }

  get samples() {
    return this.uniforms.get("samples")!.value;
  }

  set samples(value: number) {
    this.uniforms.get("samples")!.value = value;
  }
}

// Enhanced RGB Chromatic Aberration Effect with better blur
class RGBChromaticAberrationEffect extends Effect {
  constructor() {
    const fragmentShader = `
      uniform vec2 redOffset;
      uniform vec2 greenOffset;
      uniform vec2 blueOffset;
      uniform float blur;
      uniform float intensity;
      uniform float radialIntensity;

      void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
        // Calculate distance from center for radial effects
        vec2 center = vec2(0.5, 0.5);
        float distanceFromCenter = length(uv - center);
        
        // Use depth to determine if we should apply chromatic aberration
        float depthFactor = smoothstep(0.98, 0.995, depth);
        
        // Apply radial modulation for more realistic lens aberration
        float radialFactor = 1.0 + radialIntensity * distanceFromCenter * distanceFromCenter;
        
        if (depthFactor < 0.1) {
          outputColor = inputColor;
          return;
        }
        
        // Scale offsets based on depth and radial distance
        vec2 scaledRedOffset = redOffset * depthFactor * radialFactor * intensity;
        vec2 scaledGreenOffset = greenOffset * depthFactor * radialFactor * intensity;
        vec2 scaledBlueOffset = blueOffset * depthFactor * radialFactor * intensity;
        
        vec3 color = vec3(0.0);
        
        // Enhanced blur with multiple sample rings for better quality
        if (blur > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(inputBuffer, 0));
          float blurRadius = blur * 150.0; // Tripled multiplier for much more intense blur
          
          vec3 blurred = vec3(0.0);
          float totalWeight = 0.0;
          
          // Multi-ring sampling for better blur quality
          for (int ring = 0; ring <= 3; ring++) {
            float ringRadius = float(ring) * blurRadius * 0.25;
            int samples = ring == 0 ? 1 : ring * 8;
            
            for (int i = 0; i < samples; i++) {
              float angle = float(i) * 6.28318 / float(samples);
              vec2 offset = vec2(cos(angle), sin(angle)) * ringRadius * texelSize;
              
              float weight = 1.0 / (1.0 + float(ring) * 0.5); // Falloff for outer rings
              
              float rBlur = texture2D(inputBuffer, uv + scaledRedOffset + offset).r;
              float gBlur = texture2D(inputBuffer, uv + scaledGreenOffset + offset).g;
              float bBlur = texture2D(inputBuffer, uv + scaledBlueOffset + offset).b;
              
              blurred += vec3(rBlur, gBlur, bBlur) * weight;
              totalWeight += weight;
            }
          }
          
          if (totalWeight > 0.0) {
            blurred /= totalWeight;
          }
          
          // Strong blur mixing with falloff based on distance
          float blurMix = blur * 500.0 * (1.0 + distanceFromCenter * 3.0);
          color = mix(vec3(
            texture2D(inputBuffer, uv + scaledRedOffset).r,
            texture2D(inputBuffer, uv + scaledGreenOffset).g,
            texture2D(inputBuffer, uv + scaledBlueOffset).b
          ), blurred, clamp(blurMix, 0.0, 1.0));
        } else {
          // Standard chromatic aberration without blur
          color = vec3(
            texture2D(inputBuffer, uv + scaledRedOffset).r,
            texture2D(inputBuffer, uv + scaledGreenOffset).g,
            texture2D(inputBuffer, uv + scaledBlueOffset).b
          );
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
        ["blur", new THREE.Uniform(0.0)],
        ["intensity", new THREE.Uniform(1.0)],
        ["radialIntensity", new THREE.Uniform(1.0)]
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

  get intensity() {
    return this.uniforms.get("intensity")!.value;
  }

  set intensity(value: number) {
    this.uniforms.get("intensity")!.value = value;
  }

  get radialIntensity() {
    return this.uniforms.get("radialIntensity")!.value;
  }

  set radialIntensity(value: number) {
    this.uniforms.get("radialIntensity")!.value = value;
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

export interface MotionBlurSettings {
  intensity: number;
  velocityScale: number;
  samples: number;
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

export interface HDRISettings {
  enabled: boolean;
  url: string | null;
  intensity: number;
  rotation: number;
  background: boolean;
}

export interface MaterialSettings {
  roughness: number;
  metalness: number;
  reflectivity: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  ior: number;
  color: string;
  toneMapped: boolean;
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
  motionBlur: MotionBlurSettings;
  godRays: GodRaysSettings;
  hdri: HDRISettings;
  material: MaterialSettings;
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
  motionBlur: MotionBlurSettings;
  godRays: GodRaysSettings;
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
  motionBlur,
  godRays,
}) => {
  const { gl, scene, camera } = useThree();
  
  // Safety check: ensure motionBlur is never undefined
  const safeMotionBlur = motionBlur || {
    intensity: 0.8,
    velocityScale: 1.0,
    samples: 16,
    enabled: true
  };
  const composerRef = useRef<EffectComposer | null>(null);
  const blurPassRef = useRef<GaussianBlurPass | null>(null);
  const effectsRef = useRef<{
    toneMapping: CoreToneMappingEffect;
    bloom: CoreBloomEffect;
    chromaticAberration: RGBChromaticAberrationEffect;
    lensDistortion: LensDistortionEffect;
    motionBlur: MotionBlurEffect;
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
      chromaticAberration.redOffset?.[0] || 0.006,
      chromaticAberration.redOffset?.[1] || 0.006
    );
    chromaticAberrationEffect.greenOffset.set(
      chromaticAberration.greenOffset?.[0] || 0.0,
      chromaticAberration.greenOffset?.[1] || 0.0
    );
    chromaticAberrationEffect.blueOffset.set(
      chromaticAberration.blueOffset?.[0] || -0.006,
      chromaticAberration.blueOffset?.[1] || -0.006
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

    // Motion blur effect
    const motionBlurEffect = new MotionBlurEffect();
    motionBlurEffect.intensity = safeMotionBlur.intensity || 1.0;
    motionBlurEffect.velocityScale = safeMotionBlur.velocityScale || 1.0;
    motionBlurEffect.samples = safeMotionBlur.samples || 8;

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
      // God Rays effect disabled to prevent unwanted sphere rendering
      // The sphere mesh was creating a visible white sphere in the scene
      console.log('God Rays effect requested but disabled to prevent sphere artifacts');
      godRaysEffect = undefined;
    }

    // Store effects for updates
    effectsRef.current = {
      toneMapping: toneMappingEffect,
      bloom: bloomEffect,
      chromaticAberration: chromaticAberrationEffect,
      lensDistortion: lensDistortionEffect,
      motionBlur: motionBlurEffect,
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
      safeMotionBlur.enabled ? motionBlurEffect : null, // Motion blur for dynamic scenes
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
    
    if (chromaticAberration.enabled) {
      ca.redOffset.set(
        chromaticAberration.redOffset?.[0] || 0.0, 
        chromaticAberration.redOffset?.[1] || 0.0
      );
      ca.greenOffset.set(
        chromaticAberration.greenOffset?.[0] || 0.0, 
        chromaticAberration.greenOffset?.[1] || 0.0
      );
      ca.blueOffset.set(
        chromaticAberration.blueOffset?.[0] || 0.0, 
        chromaticAberration.blueOffset?.[1] || 0.0
      );
      ca.blur = chromaticAberration.blur || 0.0;
      ca.intensity = chromaticAberration.intensity || 1.0;
      ca.radialIntensity = chromaticAberration.radialIntensity || 1.0;
    } else {
      // When disabled, set all values to zero
      ca.redOffset.set(0.0, 0.0);
      ca.greenOffset.set(0.0, 0.0);
      ca.blueOffset.set(0.0, 0.0);
      ca.blur = 0.0;
      ca.intensity = 0.0;
      ca.radialIntensity = 0.0;
    }
  }, [chromaticAberration]);

  useEffect(() => {
    if (!effectsRef.current) return;

    const { motionBlur: mb } = effectsRef.current;
    mb.intensity = safeMotionBlur.intensity || 1.0;
    mb.velocityScale = safeMotionBlur.velocityScale || 1.0;
    mb.samples = safeMotionBlur.samples || 8;
  }, [safeMotionBlur]);

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

  // Update motion blur matrices each frame
  useFrame(() => {
    if (effectsRef.current && safeMotionBlur.enabled) {
      effectsRef.current.motionBlur.updateMatrices(camera);
    }
  }, 0); // High priority for matrix updates

  // Render using the composer
  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1); // Lower priority to render after scene

  return null; // No JSX needed - we're using imperative rendering
};

export default PostProcessingEffects; 
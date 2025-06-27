import React, { forwardRef, useMemo } from 'react';
import { Effect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Custom Electrical Materialization Effect for 3D model entrance - high performance
class BlurInEffectImpl extends Effect {
  constructor(blurAmount = 0.0, opacity = 1.0) {
    const fragmentShader = `
      uniform float blurAmount;
      uniform float opacity;

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = inputColor;
        
        if (blurAmount > 0.01) {
          // ELECTRICAL MATERIALIZATION EFFECT
          vec2 texelSize = 1.0 / vec2(textureSize(inputBuffer, 0));
          
          // Electrical progress (inverted blur amount)
          float electricalProgress = 1.0 - (blurAmount / 3.0);
          float intensity = blurAmount * 0.8;
          
          // Digital noise pattern for electrical effect
          float noise = fract(sin(dot(uv * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
          float timeNoise = fract(sin(blurAmount * 1000.0) * 43758.5453);
          
          // Create electrical "static" lines
          float staticLines = step(0.85, fract((uv.y + timeNoise * 0.1) * 200.0));
          float horizontalStatic = step(0.9, fract((uv.x + timeNoise * 0.15) * 150.0));
          
          // Chromatic aberration for electrical distortion
          float aberrationStrength = intensity * 0.02;
          vec2 redOffset = vec2(aberrationStrength, 0.0);
          vec2 blueOffset = vec2(-aberrationStrength, 0.0);
          
          float r = texture2D(inputBuffer, uv + redOffset).r;
          float g = texture2D(inputBuffer, uv).g;
          float b = texture2D(inputBuffer, uv + blueOffset).b;
          
          // Digital pixelation effect
          float pixelSize = intensity * 8.0;
          vec2 pixelatedUV = uv;
          if (pixelSize > 1.0) {
            pixelatedUV = floor(uv * (200.0 / pixelSize)) / (200.0 / pixelSize);
          }
          
          // Sample pixelated colors
          vec3 pixelatedColor = texture2D(inputBuffer, pixelatedUV).rgb;
          
          // Electrical color shifts (cyan/magenta digital artifacts)
          vec3 electricalColor = vec3(r, g, b);
          electricalColor += vec3(0.0, 0.1, 0.3) * staticLines * intensity; // Cyan static
          electricalColor += vec3(0.3, 0.0, 0.1) * horizontalStatic * intensity; // Magenta glitch
          
          // Digital noise overlay
          float digitalNoise = noise * intensity * 0.3;
          electricalColor += vec3(digitalNoise);
          
          // Smooth transition from electrical to normal
          float materialFactor = smoothstep(0.0, 1.0, electricalProgress);
          materialFactor = materialFactor * materialFactor * (3.0 - 2.0 * materialFactor); // Smooth step
          
          // Mix electrical effect with normal color
          color.rgb = mix(electricalColor, inputColor.rgb, materialFactor);
          
          // Add electrical "scan lines" 
          float scanLine = sin(uv.y * 800.0 + timeNoise * 10.0) * intensity * 0.1;
          color.rgb += vec3(scanLine * 0.2, scanLine * 0.4, scanLine * 0.6);
        }
        
        outputColor = vec4(color.rgb, color.a * opacity);
      }
    `;

    super("BlurInEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["blurAmount", new THREE.Uniform(blurAmount)],
        ["opacity", new THREE.Uniform(opacity)]
      ])
    });
  }

  get blurAmount() {
    return this.uniforms.get("blurAmount")!.value;
  }

  set blurAmount(value: number) {
    this.uniforms.get("blurAmount")!.value = value;
  }

  get opacity() {
    return this.uniforms.get("opacity")!.value;
  }

  set opacity(value: number) {
    this.uniforms.get("opacity")!.value = value;
  }
}

interface BlurInEffectProps {
  blurAmount?: number;
  opacity?: number;
}

const BlurInEffect = forwardRef<BlurInEffectImpl, BlurInEffectProps>(
  ({ blurAmount = 0.0, opacity = 1.0 }, ref) => {
    const effect = useMemo(() => new BlurInEffectImpl(blurAmount, opacity), []);
    
    // Update effect properties when props change
    React.useEffect(() => {
      if (effect) {
        effect.blurAmount = blurAmount;
        effect.opacity = opacity;
      }
    }, [effect, blurAmount, opacity]);

    return <primitive ref={ref} object={effect} />;
  }
);

BlurInEffect.displayName = 'BlurInEffect';

export default BlurInEffect; 
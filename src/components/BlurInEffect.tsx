import React, { forwardRef, useMemo } from 'react';
import { Effect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Custom Blur-In Effect for 3D model entrance
class BlurInEffectImpl extends Effect {
  constructor(blurAmount = 0.0, opacity = 1.0) {
    const fragmentShader = `
      uniform float blurAmount;
      uniform float opacity;

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = inputColor;
        
        if (blurAmount > 0.001) {
          // Sample surrounding pixels for blur effect
          vec2 texelSize = 1.0 / vec2(textureSize(inputBuffer, 0));
          vec4 blurredColor = vec4(0.0);
          
          // Enhanced 7-tap blur kernel for cinematic quality
          float kernel[7];
          kernel[0] = 0.1964825503;
          kernel[1] = 0.1828424832;
          kernel[2] = 0.1231256203;
          kernel[3] = 0.0613395873;
          kernel[4] = 0.0221591667;
          kernel[5] = 0.0058050766;
          kernel[6] = 0.0011178252;
          
          // Multi-pass blur for smooth out-of-focus effect
          blurredColor = texture2D(inputBuffer, uv) * kernel[0];
          for (int i = 1; i < 7; i++) {
            float offset = float(i) * blurAmount * texelSize.x * 0.8;
            blurredColor += texture2D(inputBuffer, uv + vec2(offset, 0.0)) * kernel[i];
            blurredColor += texture2D(inputBuffer, uv - vec2(offset, 0.0)) * kernel[i];
            blurredColor += texture2D(inputBuffer, uv + vec2(0.0, offset)) * kernel[i];
            blurredColor += texture2D(inputBuffer, uv - vec2(0.0, offset)) * kernel[i];
          }
          
          // Ultra-smooth progressive materialization 
          float focusProgress = 1.0 - exp(-blurAmount * 0.3); // Slower exponential curve
          float mistEffect = smoothstep(0.0, 15.0, blurAmount); // Mist-like effect for high blur
          color = mix(inputColor, blurredColor, focusProgress * mistEffect);
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
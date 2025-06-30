import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import FPSCounter from './FPSCounter';
import DeviceInfo from './DeviceInfo';

// Read the lens distortion shaders
const lensDistortionVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const lensDistortionFragmentShader = `
uniform sampler2D tDiffuse;
uniform float barrelDistortion;
uniform float chromaticAberration;
uniform float vignette;
uniform vec2 center;

varying vec2 vUv;

vec2 distort(vec2 uv, float strength) {
  vec2 coord = uv - center;
  float dist = length(coord);
  float factor = 1.0 + strength * dist * dist;
  return center + coord * factor;
}

void main() {
  vec2 uv = vUv;
  
  // Apply barrel distortion
  if (barrelDistortion != 0.0) {
    uv = distort(uv, barrelDistortion);
  }
  
  vec4 color;
  
  // Apply chromatic aberration
  if (chromaticAberration > 0.0) {
    float r = texture2D(tDiffuse, distort(vUv, chromaticAberration * 0.5)).r;
    float g = texture2D(tDiffuse, distort(vUv, chromaticAberration * 0.25)).g;
    float b = texture2D(tDiffuse, distort(vUv, chromaticAberration * 0.0)).b;
    color = vec4(r, g, b, 1.0);
  } else {
    color = texture2D(tDiffuse, uv);
  }
  
  // Apply vignette
  if (vignette > 0.0) {
    vec2 vignetteCoord = vUv - 0.5;
    float vignetteValue = 1.0 - vignette * length(vignetteCoord);
    color.rgb *= vignetteValue;
  }
  
  gl_FragColor = color;
}
`;

// 3D Logo with minimal material settings
const TestLogo: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF('/objects/sao-logo.glb');

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#cccccc',
      metalness: 1.0,
      roughness: 0.1,
    });
  }, []);

  React.useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });
    }
  }, [gltf.scene, material]);

  if (!gltf.scene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
};

// Post-processing effect with lens distortion shader
const LensDistortionEffect: React.FC = () => {
  const { scene, camera, gl } = useThree();
  const renderTarget = useMemo(() => new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight
  ), []);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: renderTarget.texture },
        barrelDistortion: { value: 0.1 },
        chromaticAberration: { value: 0.02 },
        vignette: { value: 0.3 },
        center: { value: [0.5, 0.5] },
      },
      vertexShader: lensDistortionVertexShader,
      fragmentShader: lensDistortionFragmentShader,
    });
  }, [renderTarget]);

  const quad = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    return new THREE.Mesh(geometry, material);
  }, [material]);

  useFrame(() => {
    // Render scene to render target
    gl.setRenderTarget(renderTarget);
    gl.render(scene, camera);
    
    // Clear the main canvas and render the post-processed quad
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(new THREE.Scene().add(quad), new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  });

  return null;
};

const MinimalShaderTest: React.FC = () => {
  return (
    <>
      <FPSCounter position="top-right" showDetails={true} />
      <DeviceInfo position="bottom-right" collapsed={true} />
      
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#000',
        position: 'relative'
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{
            powerPreference: 'high-performance',
            antialias: false, // Disable for performance testing
            alpha: false,
            preserveDrawingBuffer: false,
          }}
          dpr={[1, 2]} // Limit device pixel ratio for mobile
        >
          {/* Basic lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          
          {/* 3D Logo geometry */}
          <TestLogo />
          
          {/* Lens distortion post-processing */}
          <LensDistortionEffect />
        </Canvas>
        
        {/* Performance info overlay */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '4px',
        }}>
          <div>Minimal Shader Test</div>
          <div>• SAO logo 3D model</div>
          <div>• Lens distortion shader</div>
          <div>• Basic material settings</div>
          <div>• No post-processing effects</div>
          <div>• No particle effects</div>
        </div>
      </div>
    </>
  );
};

export default MinimalShaderTest; 
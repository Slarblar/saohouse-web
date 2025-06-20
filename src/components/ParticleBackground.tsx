import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleBackground: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const geometricShapesRef = useRef<THREE.Group>(null);

  // Create elegant particle system
  const { positions, colors, sizes } = useMemo(() => {
    const count = 60; // Reduced for subtlety
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Warm, earthy color palette
    const colorPalette = [
      new THREE.Color('#d4af37'), // Warm gold
      new THREE.Color('#b87333'), // Soft copper
      new THREE.Color('#9caf88'), // Muted sage
      new THREE.Color('#c0c0c0'), // Chrome silver
      new THREE.Color('#9b8c7a'), // Warm grey
    ];

    for (let i = 0; i < count; i++) {
      // Spread particles in a larger, more natural distribution
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Apply warm colors
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varied sizes for depth
      sizes[i] = Math.random() * 3 + 1;
    }

    return { positions, colors, sizes };
  }, []);

  // Create particle material
  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Create floating geometric shapes
  const geometricShapes = useMemo(() => {
    const shapes = [];
    for (let i = 0; i < 8; i++) {
      const shape = {
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 15,
        ] as [number, number, number],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ] as [number, number, number],
        scale: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.02 + 0.01,
      };
      shapes.push(shape);
    }
    return shapes;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Gentle particle movement
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Subtle floating motion
        positions[i + 1] += Math.sin(time * 0.5 + positions[i] * 0.1) * 0.002;
        positions[i] += Math.cos(time * 0.3 + positions[i + 1] * 0.1) * 0.001;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Gentle rotation
      particlesRef.current.rotation.y = time * 0.05;
    }

    // Animate geometric shapes
    if (geometricShapesRef.current) {
      const time = state.clock.getElapsedTime();
      
      geometricShapesRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          const shape = geometricShapes[index];
          
          // Gentle floating
          child.position.y += Math.sin(time * shape.speed + index) * 0.01;
          
          // Slow rotation
          child.rotation.x += shape.speed * 0.5;
          child.rotation.y += shape.speed * 0.3;
          child.rotation.z += shape.speed * 0.2;
        }
      });
    }
  });

  return (
    <group>
      {/* Elegant particle system */}
      <points ref={particlesRef} material={particleMaterial}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[sizes, 1]}
          />
        </bufferGeometry>
      </points>

      {/* Floating geometric shapes */}
      <group ref={geometricShapesRef}>
        {geometricShapes.map((shape, index) => (
          <mesh
            key={index}
            position={shape.position}
            rotation={shape.rotation}
            scale={[shape.scale, shape.scale, shape.scale]}
          >
            {index % 3 === 0 ? (
              <boxGeometry args={[0.5, 0.5, 0.5]} />
            ) : index % 3 === 1 ? (
              <octahedronGeometry args={[0.3, 0]} />
            ) : (
              <tetrahedronGeometry args={[0.4, 0]} />
            )}
            <meshPhysicalMaterial
              color={index % 2 === 0 ? '#d4af37' : '#b87333'}
              metalness={0.8}
              roughness={0.2}
              transparent
              opacity={0.15}
            />
          </mesh>
        ))}
      </group>

      {/* Subtle ambient lighting */}
      <ambientLight intensity={0.3} color="#f4f1eb" />
      
      {/* Soft directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.5}
        color="#e8e2d5"
      />
    </group>
  );
};

export default ParticleBackground; 
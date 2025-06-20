import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

interface ChromeObjectProps {
  position?: [number, number, number]
}

const ChromeObject: React.FC<ChromeObjectProps> = () => {
  const meshRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/objects/sao-logo.glb')
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isIdle, setIsIdle] = useState(false)
  const lastMoveTime = useRef(Date.now())
  const idleTimeout = useRef<number | null>(null)

  // Track mouse movement with idle detection
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const newMouse = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      }
      
      setMouse(newMouse)
      setIsIdle(false)
      lastMoveTime.current = Date.now()
      
      // Clear existing timeout
      if (idleTimeout.current) {
        clearTimeout(idleTimeout.current)
      }
      
      // Set new idle timeout
      idleTimeout.current = setTimeout(() => {
        setIsIdle(true)
      }, 3000) // 3 seconds
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    // Initial idle timeout
    idleTimeout.current = setTimeout(() => {
      setIsIdle(true)
    }, 3000)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (idleTimeout.current) {
        clearTimeout(idleTimeout.current)
      }
    }
  }, [])

  // Create realistic chrome material (similar to the example)
  const realisticChromeMaterial = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xcccccc), // Slightly darker than pure white
      metalness: 1.0, // Full metallic for chrome
      roughness: 0.01, // Ultra smooth for mirror-like reflections
      reflectivity: 1.0, // Maximum reflectivity like the example
      envMapIntensity: 4.0, // Slightly reduced environment map intensity
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      ior: 2.4,
      // Enhanced quality settings
      transparent: false,
      opacity: 1.0,
      side: THREE.FrontSide,
    })
    return material
  }, [])

  // Clone and apply the chrome material to ALL parts
  const clonedScene = useMemo(() => {
    const cloned = scene.clone()
    
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Apply the realistic chrome material to every mesh part
        child.material = realisticChromeMaterial
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    return cloned
  }, [scene, realisticChromeMaterial])

  // Center the model based on its bounding box
  const centeredScene = useMemo(() => {
    const centered = clonedScene.clone()
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(centered)
    const center = box.getCenter(new THREE.Vector3())
    
    // Offset the entire model to center it at origin
    centered.position.copy(center).multiplyScalar(-1)
    
    return centered
  }, [clonedScene])

  // Enhanced cursor interaction and idle reset
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime()
      
      if (isIdle) {
        // Smooth reset to neutral position when idle
        const targetRotationY = 0
        const targetRotationX = 0
        
        meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.02
        meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.02
             } else {
         // Enhanced cursor following - swapped controls
         const targetRotationX = mouse.x * 0.4 // Left/right mouse controls X-axis
         const targetRotationY = mouse.y * 0.6 // Up/down mouse controls Y-axis (horizontal spinning)
         
         meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.08
         meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.08
       }
      
             // Gentle floating animation (always active)
       meshRef.current.position.y = 0.6 + Math.sin(time * 0.8) * 0.1
      meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.02
    }
  })

  return (
    <group ref={meshRef} position={[0.1, 0.6, 0]} scale={[0.0675, 0.0675, 0.0675]}>
      {/* Environment mapping for realistic chrome reflections */}
      <Environment 
        preset="city" 
        background={false}
        environmentIntensity={2.0}
      />
      
      <primitive object={centeredScene} />
      
      {/* Clean lighting setup for chrome */}
      <ambientLight intensity={0.3} color="#ffffff" />
      
      {/* Main directional light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Subtle RGB accent lights for artistic touch */}
      
      {/* Red accent */}
      <pointLight
        position={[4, 2, 4]}
        intensity={0.6}
        color="#ff4466"
        distance={15}
      />
      
      {/* Blue accent */}
      <pointLight
        position={[-4, 2, 4]}
        intensity={0.6}
        color="#4466ff"
        distance={15}
      />
      
      {/* Green accent */}
      <pointLight
        position={[0, -3, 4]}
        intensity={0.4}
        color="#44ff66"
        distance={12}
      />
      
      {/* Purple accent */}
      <pointLight
        position={[0, 4, -2]}
        intensity={0.3}
        color="#8844ff"
        distance={18}
      />
      
      {/* Cyan rim light */}
      <pointLight
        position={[-3, 0, -3]}
        intensity={0.5}
        color="#44ffff"
        distance={15}
      />
      
      {/* Orange warm light */}
      <pointLight
        position={[3, -2, -2]}
        intensity={0.4}
        color="#ff6644"
        distance={12}
      />
      
      {/* Additional fill lights */}
      <directionalLight
        position={[-3, 4, 2]}
        intensity={1.0}
        color="#ffffff"
      />
      
      <directionalLight
        position={[0, -2, 5]}
        intensity={0.8}
        color="#ffffff"
      />
    </group>
  )
}

// Clear the cache for the model to force reload of updated file
useGLTF.clear('/objects/sao-logo.glb')

// Preload the updated model
useGLTF.preload('/objects/sao-logo.glb?v=' + Date.now())

export default ChromeObject 
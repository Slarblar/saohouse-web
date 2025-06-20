import { useState, useEffect } from 'react'
// useLoader import removed - not currently used
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import * as THREE from 'three'

interface Use3DObjectLoaderResult {
  object: THREE.Object3D | null
  loading: boolean
  error: string | null
}

export const use3DObjectLoader = (path: string): Use3DObjectLoaderResult => {
  const [object, setObject] = useState<THREE.Object3D | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!path) {
      setLoading(false)
      return
    }

    const loadObject = async () => {
      try {
        setLoading(true)
        setError(null)

        const extension = path.split('.').pop()?.toLowerCase()
        
        if (extension === 'gltf' || extension === 'glb') {
          const gltf = await new GLTFLoader().loadAsync(path)
          setObject(gltf.scene)
        } else if (extension === 'obj') {
          const obj = await new OBJLoader().loadAsync(path)
          setObject(obj)
        } else {
          throw new Error(`Unsupported file format: ${extension}`)
        }
      } catch (err) {
        console.error('Error loading 3D object:', err)
        setError(err instanceof Error ? err.message : 'Failed to load 3D object')
        setObject(null)
      } finally {
        setLoading(false)
      }
    }

    loadObject()
  }, [path])

  return { object, loading, error }
} 
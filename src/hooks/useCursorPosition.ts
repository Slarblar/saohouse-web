import { useState, useEffect, useRef } from 'react'

interface CursorPosition {
  x: number
  y: number
  normalizedX: number
  normalizedY: number
}

export const useCursorPosition = (): CursorPosition => {
  const [position, setPosition] = useState<CursorPosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  })
  
  const smoothPositionRef = useRef({ normalizedX: 0, normalizedY: 0 })
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX
      const y = event.clientY
      const targetNormalizedX = (x / window.innerWidth) * 2 - 1
      const targetNormalizedY = -(y / window.innerHeight) * 2 + 1

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

             // Smooth interpolation for floating feeling
       const smoothUpdate = () => {
         const lerpFactor = 0.03 // Very slow smoothing for subtle cursor input
        
        smoothPositionRef.current.normalizedX += 
          (targetNormalizedX - smoothPositionRef.current.normalizedX) * lerpFactor
        smoothPositionRef.current.normalizedY += 
          (targetNormalizedY - smoothPositionRef.current.normalizedY) * lerpFactor

        setPosition({
          x,
          y,
          normalizedX: smoothPositionRef.current.normalizedX,
          normalizedY: smoothPositionRef.current.normalizedY,
        })

        // Continue smoothing if we haven't reached the target
        const distanceX = Math.abs(targetNormalizedX - smoothPositionRef.current.normalizedX)
        const distanceY = Math.abs(targetNormalizedY - smoothPositionRef.current.normalizedY)
        
        if (distanceX > 0.001 || distanceY > 0.001) {
          animationFrameRef.current = requestAnimationFrame(smoothUpdate)
        }
      }

      smoothUpdate()
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return position
} 
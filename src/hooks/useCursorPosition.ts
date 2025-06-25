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
  const lastMoveTimeRef = useRef<number>(0)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX
      const y = event.clientY
      const targetNormalizedX = (x / window.innerWidth) * 2 - 1
      const targetNormalizedY = -(y / window.innerHeight) * 2 + 1

      const now = performance.now()
      lastMoveTimeRef.current = now

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Adaptive smoothing based on movement speed for ultra-smooth transitions
      const smoothUpdate = () => {
        // Calculate movement distance for adaptive smoothing
        const distanceX = Math.abs(targetNormalizedX - smoothPositionRef.current.normalizedX)
        const distanceY = Math.abs(targetNormalizedY - smoothPositionRef.current.normalizedY)
        const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
        
        // Adaptive lerp factor: faster for larger movements, smoother for fine adjustments
        const baseLerpFactor = 0.06
        const speedMultiplier = Math.min(totalDistance * 8 + 1, 3) // Responsive to movement speed
        const adaptiveLerpFactor = baseLerpFactor * speedMultiplier
        
        smoothPositionRef.current.normalizedX += 
          (targetNormalizedX - smoothPositionRef.current.normalizedX) * adaptiveLerpFactor
        smoothPositionRef.current.normalizedY += 
          (targetNormalizedY - smoothPositionRef.current.normalizedY) * adaptiveLerpFactor

        setPosition({
          x,
          y,
          normalizedX: smoothPositionRef.current.normalizedX,
          normalizedY: smoothPositionRef.current.normalizedY,
        })

        // Continue smoothing with adaptive threshold
        const adaptiveThreshold = Math.max(0.0002, totalDistance * 0.1) // Dynamic threshold
        
        if (distanceX > adaptiveThreshold || distanceY > adaptiveThreshold) {
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
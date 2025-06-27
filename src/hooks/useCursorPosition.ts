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
  
  const lastMoveTimeRef = useRef<number>(0)
  // PERFORMANCE: Debug counter removed for optimal build size
  // const debugCounter = useRef<number>(0)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX
      const y = event.clientY
      
      // Direct normalized calculation without smoothing
      const normalizedX = (x / window.innerWidth) * 2 - 1
      const normalizedY = -(y / window.innerHeight) * 2 + 1

      lastMoveTimeRef.current = performance.now()

      // PERFORMANCE: Cursor movement logging disabled for optimal FPS
      // debugCounter.current++;
      // if (debugCounter.current === 100) {
      //   console.log('🖱️ Cursor tracking active:', {
      //     normalized: { x: normalizedX.toFixed(3), y: normalizedY.toFixed(3) }
      //   });
      //   debugCounter.current = 0; // Reset counter to prevent endless accumulation
      // }

      // Immediate position update
      setPosition({
        x,
        y,
        normalizedX,
        normalizedY,
      })
    }

    // PERFORMANCE: Initialization logging disabled for optimal FPS
    // console.log('🖱️ useCursorPosition Hook: Initializing mouse move listener');
    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    
    return () => {
      // PERFORMANCE: Cleanup logging disabled for optimal FPS
      // console.log('🖱️ useCursorPosition Hook: Cleaning up mouse move listener');
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, []) // Empty dependency array to avoid re-initialization

  return position
} 
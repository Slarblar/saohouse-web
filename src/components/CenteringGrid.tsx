import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

interface CenteringGridProps {
  visible?: boolean;
  gridSize?: number;
  divisions?: number;
  centerLineWidth?: number;
  centerLineColor?: string;
  gridColor?: string;
  opacity?: number;
}

const CenteringGrid: React.FC<CenteringGridProps> = ({
  visible = true,
  gridSize = 10,
  divisions = 20,
  centerLineWidth = 4,
  centerLineColor = '#ff0000',
  gridColor = '#444444',
  opacity = 0.8,
}) => {
  const { viewport, size } = useThree();
  const deviceInfo = useDeviceDetection();

  // Calculate grid dimensions based on viewport
  const gridDimensions = useMemo(() => {
    const aspectRatio = size.width / size.height;
    const maxDimension = Math.max(viewport.width, viewport.height);
    
    return {
      width: maxDimension * 1.2,
      height: maxDimension * 1.2,
      aspectRatio,
    };
  }, [viewport.width, viewport.height, size.width, size.height]);

  // Create grid geometry
  const gridGeometry = useMemo(() => {
    const { width, height } = gridDimensions;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];

    // Helper function to add line
    const addLine = (x1: number, y1: number, x2: number, y2: number, color: THREE.Color) => {
      vertices.push(x1, y1, 0, x2, y2, 0);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    };

    const gridColorObj = new THREE.Color(gridColor);
    const centerColorObj = new THREE.Color(centerLineColor);

    // Create grid lines
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const stepX = width / divisions;
    const stepY = height / divisions;

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = -halfWidth + (i * stepX);
      const isCenter = Math.abs(x) < 0.01; // Center line
      const color = isCenter ? centerColorObj : gridColorObj;
      addLine(x, -halfHeight, x, halfHeight, color);
    }

    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const y = -halfHeight + (i * stepY);
      const isCenter = Math.abs(y) < 0.01; // Center line
      const color = isCenter ? centerColorObj : gridColorObj;
      addLine(-halfWidth, y, halfWidth, y, color);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return geometry;
  }, [gridDimensions, divisions, gridColor, centerLineColor]);

  // Create crosshair at exact center
  const crosshairGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const crosshairSize = Math.min(viewport.width, viewport.height) * 0.1;
    
    // Horizontal crosshair line
    vertices.push(-crosshairSize, 0, 0.01, crosshairSize, 0, 0.01);
    
    // Vertical crosshair line  
    vertices.push(0, -crosshairSize, 0.01, 0, crosshairSize, 0.01);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [viewport.width, viewport.height]);

  // Create coordinate text geometry positions
  const coordinatePositions = useMemo(() => {
    const positions = [];
    const halfWidth = gridDimensions.width / 2;
    const halfHeight = gridDimensions.height / 2;
    
    // Add coordinate markers
    positions.push(
      { position: [0, 0, 0.02], text: '(0,0)' },
      { position: [halfWidth * 0.8, 0, 0.02], text: '+X' },
      { position: [-halfWidth * 0.8, 0, 0.02], text: '-X' },
      { position: [0, halfHeight * 0.8, 0.02], text: '+Y' },
      { position: [0, -halfHeight * 0.8, 0.02], text: '-Y' },
    );

    return positions;
  }, [gridDimensions]);

  if (!visible) return null;

  return (
    <group>
      {/* Main grid */}
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial 
          vertexColors 
          transparent 
          opacity={opacity} 
        />
      </lineSegments>

      {/* Enhanced center crosshair */}
      <lineSegments geometry={crosshairGeometry}>
        <lineBasicMaterial 
          color={centerLineColor} 
          transparent 
          opacity={1} 
        />
      </lineSegments>

      {/* Center point marker */}
      <mesh position={[0, 0, 0.01]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={centerLineColor} />
      </mesh>

      {/* Device info overlay */}
      <mesh position={[gridDimensions.width * 0.35, gridDimensions.height * 0.4, 0.01]}>
        <planeGeometry args={[2, 1]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.7} 
        />
      </mesh>

      {/* Viewport bounds indicator */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(viewport.width, viewport.height)]} />
        <lineBasicMaterial color="#00ff00" transparent opacity={0.5} />
      </lineSegments>

      {/* Device-specific guidelines */}
      {deviceInfo.type === 'mobile' && (
        <group>
          {/* Mobile safe area indicators */}
          <lineSegments position={[0, 0, 0.005]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(viewport.width * 0.9, viewport.height * 0.85)]} />
            <lineBasicMaterial color="#ffaa00" transparent opacity={0.6} />
          </lineSegments>
        </group>
      )}

      {/* Tablet guidelines */}
      {deviceInfo.type === 'tablet' && (
        <group>
          <lineSegments position={[0, 0, 0.005]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(viewport.width * 0.8, viewport.height * 0.8)]} />
            <lineBasicMaterial color="#0088ff" transparent opacity={0.6} />
          </lineSegments>
        </group>
      )}
    </group>
  );
};

export default CenteringGrid; 
# Centering Grid Guide 📐

## Overview
The centering grid is a temporary development tool to help you perfectly center your 3D logo across all devices. It provides visual guidelines and accurate center lines to ensure proper positioning.

## How to Use

### 1. **Enable the Grid**
- **Development Only**: The grid only appears when `SHOW_CONTROLS` is true (localhost/development)
- **Toggle Button**: Click the "📐 Centering Grid" toggle in the top-right corner
- The grid will overlay your 3D scene with clear guidelines

### 2. **Grid Features**

#### **Red Center Lines** 🔴
- **Horizontal & Vertical**: Strong red lines mark the exact center (0,0)
- **Center Point**: Red sphere at the exact center coordinates
- **Crosshair**: Enhanced crosshair for precise positioning

#### **Gray Grid Lines** ⬜
- **Background Grid**: Helps visualize distances and spacing
- **20x20 Divisions**: Fine grid for precise adjustments
- **Viewport Bounds**: Green lines show the actual viewport boundaries

#### **Device-Specific Guidelines**
- **Mobile** (Orange): Safe area indicators for mobile screens
- **Tablet** (Blue): Optimal viewing area for tablets
- **Desktop**: Full viewport usage

### 3. **Using the Grid to Center Your Logo**

#### **Current Issue (From Your Image)**
Your SAO logo appears off-center on mobile devices. Here's how to fix it:

#### **Step 1: Identify the Problem**
1. Enable the grid
2. Look at how your logo aligns with the red center lines
3. Note the offset on different devices

#### **Step 2: Adjust Position Settings**
In your `useResponsive3D` hook (`src/hooks/useResponsive3D.ts`), adjust the position values:

```typescript
const defaultSettings: ResponsiveSettings = {
  mobile: {
    portrait: { 
      scale: 0.028, 
      position: [-0.15, 0.2, 0] // ← Adjust these values
    },
    landscape: { 
      scale: 0.024, 
      position: [0.05, 0.35, 0] // ← Adjust these values
    }
  },
  // ... other device settings
};
```

#### **Step 3: Visual Positioning Guide**
- **X-axis (left/right)**: 
  - Negative values = Move left
  - Positive values = Move right
  - **Target**: Align with vertical red center line
  
- **Y-axis (up/down)**:
  - Negative values = Move down  
  - Positive values = Move up
  - **Target**: Align with horizontal red center line

#### **Step 4: Device-Specific Adjustments**
Based on your image, try these adjustments:

```typescript
mobile: {
  portrait: { 
    scale: 0.028, 
    position: [0.0, 0.1, 0] // Center horizontally, slight up
  },
  landscape: { 
    scale: 0.024, 
    position: [0.0, 0.2, 0] // Center horizontally, more up
  }
}
```

### 4. **Visual Center vs Mathematical Center**

Sometimes the **visual center** differs from **mathematical center** due to:
- **Model geometry**: Your logo might not be perfectly centered in its 3D file
- **Perspective**: Camera angle affects perceived center
- **Optical illusions**: Visual weight can make centered objects appear off-center

#### **Using the Grid to Find Visual Center**
1. Enable the grid
2. Position your logo at mathematical center (red lines)
3. If it looks off-center, adjust position slightly
4. Trust your eyes more than the numbers!

### 5. **Grid Customization**
You can customize the grid in `CenteringGrid.tsx`:

```tsx
<CenteringGrid 
  visible={showCenteringGrid}
  gridSize={10}           // Grid area size
  divisions={20}          // Number of grid lines
  centerLineColor="#ff0000" // Red center lines
  gridColor="#444444"     // Gray grid lines
  opacity={0.8}           // Grid transparency
/>
```

### 6. **Testing Workflow**

#### **Multi-Device Testing**
1. **Desktop**: Enable grid, position logo at center
2. **Mobile**: Test on actual device or dev tools
3. **Tablet**: Verify positioning on medium screens
4. **Orientation**: Test both portrait and landscape

#### **Quick Test Settings**
For faster iteration, temporarily set different position values:

```typescript
// Quick test values
mobile: {
  portrait: { scale: 0.028, position: [0.1, 0.0, 0] },  // Test right
  landscape: { scale: 0.024, position: [-0.1, 0.0, 0] } // Test left
}
```

### 7. **Common Fixes for Off-Center Issues**

#### **Logo Appears Too Far Left** (like in your image)
```typescript
position: [0.1, 0.2, 0] // Move right with positive X
```

#### **Logo Appears Too High**
```typescript
position: [0.0, 0.0, 0] // Move down with lower Y
```

#### **Logo Too Small/Large**
```typescript
scale: 0.035 // Increase scale for larger
scale: 0.025 // Decrease scale for smaller
```

### 8. **When You're Done**
1. **Disable the Grid**: Turn off the toggle
2. **Test on Real Devices**: Always verify on actual mobile devices
3. **Remove Grid**: For production, the grid won't show (SHOW_CONTROLS = false)

### 9. **Advanced Tips**

#### **Fine-Tuning**
- Use increments of 0.05 for position adjustments
- Use increments of 0.002 for scale adjustments
- Test each change on multiple screen sizes

#### **Visual Balance**
- Consider the visual weight of your logo
- Account for any text or UI elements below
- Remember that perfect mathematical center might not look perfectly centered

### 10. **Troubleshooting**

#### **Grid Not Showing**
- Check that `SHOW_CONTROLS` is true (development environment)
- Verify you're on localhost or development server
- Check browser console for any errors

#### **Grid Appears But Logo Doesn't**
- Check that your ChromeObject is loading properly
- Verify the 3D model file is accessible
- Check browser console for loading errors

#### **Performance Issues**
- The grid is lightweight but disable it when not needed
- Only uses basic Three.js lines and geometry
- Automatically hidden in production

---

## Quick Reference Commands

```bash
# Start development server (enables grid controls)
npm run dev

# Grid appears only when:
# - localhost or development environment
# - SHOW_CONTROLS = true
# - Grid toggle is enabled
```

**Remember**: The grid is a development tool - it won't appear in production builds, so feel free to use it extensively during development! 🚀 
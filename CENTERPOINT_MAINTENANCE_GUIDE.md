# Centerpoint Maintenance Guide

## 🎯 **Maintaining 3D Logo Center Across Screen Sizes**

This guide provides multiple approaches to ensure your 3D logo stays perfectly centered regardless of screen size changes, orientation shifts, or device types.

## **Approach 1: Mathematical Viewport Center (Recommended)**

### **Benefits**:
- ✅ **True mathematical center** - Always perfectly centered
- ✅ **Responsive scaling** - Proportional size adjustments  
- ✅ **Smooth transitions** - No jumping during resize
- ✅ **Device agnostic** - Works on all devices

### **Implementation**:
```javascript
// Replace your current useResponsive3D with:
import { useResponsiveCenterPosition } from './hooks/useResponsiveCenterPosition';

const { position, scale } = useResponsiveCenterPosition(0.03);
```

### **How It Works**:
1. **Calculates mathematical center** using viewport dimensions
2. **Applies proportional scaling** based on screen size
3. **Adds device-specific fine-tuning** for optimal visual balance
4. **Handles resize/orientation changes** smoothly

---

## **Approach 2: Camera Field of View Based**

### **For Three.js Camera Integration**:
```javascript
// In your component or hook:
const camera = useThree((state) => state.camera);

useEffect(() => {
  // Adjust FOV based on aspect ratio to maintain consistent size
  const aspectRatio = window.innerWidth / window.innerHeight;
  
  if (camera instanceof THREE.PerspectiveCamera) {
    // Wider screens get wider FOV to maintain center focus
    camera.fov = 75 + (aspectRatio - 1) * 10;
    camera.updateProjectionMatrix();
  }
}, [camera]);
```

---

## **Approach 3: CSS + 3D Hybrid**

### **For Maximum Compatibility**:
```css
/* Container always centered */
.three-canvas-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100vh;
}

/* 3D object uses mathematical center */
.logo-3d {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: center center;
}
```

---

## **Approach 4: Update Your Current System**

### **Enhance Your Existing `useResponsive3D`**:

```javascript
// Add to your existing useResponsive3D.ts:
const defaultSettings: ResponsiveSettings = {
  mobile: {
    portrait: { 
      scale: 0.0322, 
      position: [0.0, 0.0, 0] // Mathematical center
    },
    landscape: { 
      scale: 0.07728, 
      position: [0.0, 0.0, 0] // Mathematical center
    }
  },
  tablet: {
    portrait: { 
      scale: 0.035, 
      position: [0.0, 0.0, 0] // Mathematical center
    },
    landscape: { 
      scale: 0.03, 
      position: [0.0, 0.0, 0] // Mathematical center
    }
  },
  desktop: {
    landscape: { 
      scale: 0.04, 
      position: [0.0, 0.0, 0] // Mathematical center
    }
  }
};
```

---

## **Quick Fix for Current Setup**

### **Immediate Solution**:
Replace all your position arrays with `[0.0, 0.0, 0]` for true mathematical center:

```javascript
// In useResponsive3D.ts, change from:
landscape: { scale: 0.07728, position: [0.25, 0.53, 0] }

// To:
landscape: { scale: 0.07728, position: [0.0, 0.0, 0] }
```

### **Add Viewport Monitoring**:
```javascript
// Add to your useResponsive3D hook:
useEffect(() => {
  const handleResize = () => {
    // Force recalculation on resize
    const newConfig = calculateResponsiveConfig();
    setConfig(newConfig);
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## **Testing Checklist**

### **Verify Center Maintenance**:
- [ ] **iPhone Portrait** - Logo appears centered
- [ ] **iPhone Landscape** - Logo stays centered  
- [ ] **iPad Portrait** - Logo remains centered
- [ ] **iPad Landscape** - Logo stays centered
- [ ] **Desktop** - Logo perfectly centered
- [ ] **Window Resize** - Logo stays centered during resize
- [ ] **DevTools Responsive** - Center maintained across all sizes

### **Performance Verification**:
- [ ] **Smooth Transitions** - No jumping during size changes
- [ ] **60fps Performance** - Maintains frame rate during resize
- [ ] **Memory Usage** - No memory leaks from resize listeners

---

## **Advanced Techniques**

### **1. Aspect Ratio Compensation**:
```javascript
const getAspectRatioScale = (aspectRatio: number) => {
  // Compensate for extreme aspect ratios
  if (aspectRatio > 2) return 0.8; // Very wide screens
  if (aspectRatio < 0.6) return 1.2; // Very tall screens
  return 1.0; // Standard aspect ratios
};
```

### **2. Safe Area Consideration**:
```javascript
// Account for mobile safe areas (notches, etc.)
const getSafeAreaOffset = () => {
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-top') || '0');
  return safeAreaTop > 0 ? 0.05 : 0; // Slight offset if safe area exists
};
```

### **3. Smooth Scale Transitions**:
```javascript
// In your component:
const [targetScale, setTargetScale] = useState(initialScale);
const [currentScale, setCurrentScale] = useState(initialScale);

useFrame(() => {
  // Smooth lerp to target scale
  const newScale = currentScale + (targetScale - currentScale) * 0.1;
  setCurrentScale(newScale);
});
```

---

## **Recommended Implementation Order**

1. **Start with Quick Fix** - Set all positions to `[0, 0, 0]`
2. **Add Viewport Monitoring** - Handle resize events
3. **Implement Mathematical Center** - Use the new hooks
4. **Add Device Fine-tuning** - Adjust for specific devices
5. **Performance Optimize** - Add debouncing and smooth transitions

This approach ensures your 3D logo maintains perfect centering across all screen sizes while providing smooth, performant transitions. 
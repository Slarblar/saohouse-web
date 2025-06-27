# 🎯 Modular Settings Discovery System

## Overview
The SAO House 3D experience now features an **intelligent, modular settings discovery system** that automatically detects and loads visual configuration files from the `/public/importsettings` folder.

## How It Works

### 🔍 **Auto-Discovery Process**
1. **Smart Pattern Generation**: The system generates file patterns based on:
   - Current date (highest priority)
   - Yesterday's date (second priority)  
   - Recent weeks (third priority)
   - Generic fallback names (lowest priority)

2. **Intelligent File Detection**: Scans for JSON files in priority order
3. **Content Validation**: Ensures files contain valid settings data
4. **Graceful Fallbacks**: Falls back to localStorage → defaults if no files found

### 📁 **Supported File Naming Patterns**

#### **Date-Based Patterns (Auto-Generated)**
- `saohouse-settings-2025-06-27 (1).json` ✅ Current format
- `saohouse-settings-YYYY-MM-DD (N).json` ✅ Any date with version number
- `saohouse-settings-YYYY-MM-DD.json` ✅ Simple date format

#### **Generic Patterns**
- `latest.json` ✅ Simple and clean
- `current.json` ✅ Production ready
- `settings.json` ✅ Classic naming
- `production.json` ✅ Environment-specific
- `config.json` ✅ Configuration files

## 🚀 **Usage Instructions**

### **Method 1: Drop & Go (Recommended)**
1. Export your settings from the controls panel
2. Drop the `.json` file into `/public/importsettings/`
3. Refresh the page - settings auto-load!

### **Method 2: Smart Naming**
```bash
# For daily iterations
saohouse-settings-2025-06-27 (1).json
saohouse-settings-2025-06-27 (2).json  # Higher numbers = higher priority

# For production
latest.json
current.json
production.json
```

### **Method 3: Custom Names**
- Add your pattern to the `generateFilePatterns()` function
- System will check your pattern automatically

## 🎨 **Benefits**

### **For Developers**
- ✅ **Zero Configuration**: Just drop files and go
- ✅ **Automatic Prioritization**: Latest files load first
- ✅ **Graceful Fallbacks**: Never breaks the experience
- ✅ **Smart Date Detection**: Handles today/yesterday automatically

### **For Designers** 
- ✅ **Easy File Management**: No code changes needed
- ✅ **Quick Iterations**: Drop new files for instant updates
- ✅ **Version Control**: Multiple numbered files supported
- ✅ **Production Ready**: Clean naming for deployment

### **For Users**
- ✅ **Seamless Loading**: Always finds the right settings
- ✅ **Performance Optimized**: Smart caching and fallbacks
- ✅ **Error Resilient**: Handles missing/corrupt files gracefully

## 📊 **File Structure Example**

```
public/
└── importsettings/
    ├── backup/                          # Ignored automatically
    ├── saohouse-settings-2025-06-27 (1).json  # ← Loads this (newest)
    ├── saohouse-settings-2025-06-26 (1).json  # Fallback
    ├── latest.json                      # Generic fallback
    └── current.json                     # Production fallback
```

## 🔧 **Technical Implementation**

### **Discovery Priority**
1. **Today's date patterns** (highest)
2. **Yesterday's date patterns** 
3. **Recent weeks hardcoded patterns**
4. **Generic/fallback patterns** (lowest)

### **Validation Process**
```typescript
// File must contain valid settings structure
if (data && (data.settings || data.toneMapping || data.material)) {
  // ✅ Valid settings file
} else {
  // ❌ Skip and try next file
}
```

### **Console Output**
```
🔍 Auto-discovering settings in /public/importsettings...
📁 Checking 25 potential file patterns...
✅ Found and loaded settings: saohouse-settings-2025-06-27 (1).json
📊 Settings timestamp: 2025-06-27T09:24:47.577Z
```

## 🎯 **Best Practices**

### **File Naming**
- Use date-based naming for iterations: `saohouse-settings-2025-06-27 (1).json`
- Use generic naming for stable versions: `latest.json`
- Higher numbers = higher priority: `(3).json` > `(2).json` > `(1).json`

### **File Management**
- Keep backup folder for old settings
- Remove obsolete files to reduce discovery time
- Use descriptive timestamps in exported files

### **Development Workflow**
1. Adjust settings in controls panel
2. Export to `/public/importsettings/`
3. Refresh browser to test
4. Rename to `latest.json` when ready for production

## 🚨 **Error Handling**

The system gracefully handles:
- ✅ Missing `/importsettings` directory
- ✅ Empty directory
- ✅ Corrupt JSON files
- ✅ Invalid settings structure
- ✅ Network failures
- ✅ Browser cache issues

**Fallback Chain**: Import Files → localStorage → Default Settings

## 🔄 **Migration from Old System**

### **Before** (Manual)
```typescript
// Hard-coded filename
const response = await fetch('/importsettings/specific-file.json');
```

### **After** (Automatic)
```typescript
// Auto-discovery with smart fallbacks
const settings = await discoverAndLoadSettings();
```

No code changes needed - just drop your settings files in the folder! 🎉 
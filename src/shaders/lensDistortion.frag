uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float barrelDistortion;
uniform float chromaticAberration;
uniform float vignette;
uniform vec2 center;

varying vec2 vUv;

vec2 distort(vec2 uv, float strength) {
    vec2 offset = uv - center;
    float dist = length(offset);
    float factor = 1.0 + strength * dist * dist;
    return center + offset * factor;
}

vec3 sampleWithAberration(sampler2D tex, vec2 uv, float aberration) {
    vec2 offset = (uv - center) * aberration;
    
    float r = texture2D(tex, distort(uv + offset, barrelDistortion)).r;
    float g = texture2D(tex, distort(uv, barrelDistortion)).g;
    float b = texture2D(tex, distort(uv - offset, barrelDistortion)).b;
    
    return vec3(r, g, b);
}

void main() {
    vec2 uv = vUv;
    
    // Sample with chromatic aberration and barrel distortion
    vec3 color = sampleWithAberration(tDiffuse, uv, chromaticAberration);
    
    // Apply vignette effect
    if (vignette > 0.0) {
        vec2 vignetteUv = uv - center;
        float vignetteDistance = length(vignetteUv);
        float vignetteFactor = smoothstep(vignette * 0.5, vignette, vignetteDistance);
        color *= 1.0 - vignetteFactor;
    }
    
    gl_FragColor = vec4(color, 1.0);
} 
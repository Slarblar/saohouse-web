uniform sampler2D uTexture;
uniform float uAberrationIntensity;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5, 0.5);
  
  // Calculate distance from center
  float dist = distance(uv, center);
  
  // Create time-based oscillation
  float timeOffset = sin(uTime * 2.0) * 0.1;
  
  // Calculate aberration offset based on distance from center
  float aberration = uAberrationIntensity * dist * (1.0 + timeOffset);
  
  // Sample RGB channels with different offsets
  vec2 direction = normalize(uv - center);
  
  float r = texture2D(uTexture, uv + direction * aberration * 0.01).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - direction * aberration * 0.01).b;
  
  // Combine channels
  vec3 color = vec3(r, g, b);
  
  // Add subtle color shift
  color.r += sin(uTime * 3.0 + dist * 10.0) * 0.05;
  color.b += cos(uTime * 2.0 + dist * 8.0) * 0.05;
  
  gl_FragColor = vec4(color, 1.0);
} 
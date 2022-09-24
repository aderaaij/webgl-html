#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')
uniform sampler2D tDiffuse;
uniform float uScrollSpeed;
uniform float uTime;
      
varying vec2 vUv;

void main() {
  vec2 newUv = vUv;
  
  // Area for top noise
  float areaTop = smoothstep(1., 0.8, vUv.y) * 2. -1.;  
  
  // Area for bottom effect
  float areaBottom = smoothstep(0.4,0.0,vUv.y);
  areaBottom = pow(areaBottom, 4.);

  float noise = 0.5 * (cnoise3(vec3(vUv*10., uScrollSpeed * 2. + uTime / 5.)) + 1.);
  float n = smoothstep(0.5, 0.51, noise + areaTop / 2.);

  newUv.x -= (vUv.x - 0.5) * 0.1 * areaBottom * uScrollSpeed;
  
  // Texture2D
  vec4 texture = texture2D(tDiffuse, newUv);
  // Output
  // Just output noise to see what we have
  gl_FragColor = vec4(n, 0.,0., 1.);
  // Mix noice with Texture
  gl_FragColor = mix(vec4( 0.), texture, n);
}
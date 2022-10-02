#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')

uniform float uTime;
varying float vNoise;
varying vec2 vUv;

void main() {
  vec3 newPosition = position;
  float PI = 3.14159265359;
  // newPosition.z += 0.1*sin((newPosition.x  + 0.25 + uTime)* 2.*PI);
  // float noise = cnoise3(5. * vec3(position.x + uTime * 0.1, position.y + uTime * 0.1, position.z));
  // float dist = distance(uv, vec2(0.5));
  // newPosition.z += 0.1 * noise;
  // newPosition.z += 0.05 * sin(noise * 20. + -(uTime * 0.5));
  // newPosition += 0.1*normal * noise;
  // vNoise = noise;
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  // gl_Position = vec4(newPosition, 1.0);
}
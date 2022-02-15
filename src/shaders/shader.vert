#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')

uniform float uTime;

void main() {
  vec3 newPosition = position;
  float PI = 3.14159265359;
  newPosition.z += 0.1*sin((newPosition.x  + 0.25)* 2.*PI);
  // newPosition.z += cnoise3(vec3(position.x * 4., position.y * 4., 0. ) + uTime * 0.3 ) * 0.1;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
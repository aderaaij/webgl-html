#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')

uniform float uTime;
uniform vec2 uHover;
uniform float uHoverState;

varying float vNoise;
varying vec2 vUv;

void main() {
  vec3 newPosition = position;
  float PI = 3.14159265359;
  // newPosition.z += 0.1*sin((newPosition.x  + 0.25 + uTime)* 2.*PI);
  float noise = cnoise3(5. * vec3(position.x + uTime * 0.1, position.y + uTime * 0.1, position.z));
  // float dist = distance(uv, vec2(0.5));
  float dist = distance(uv, uHover);

  // newPosition.z += 100. * sin( dist* 5. );
  // newPosition.z += 0.1 * noise;
  newPosition.z = uHoverState * 10. * sin(dist * 20. + uTime * 1.);
  // newPosition += 0.1*normal * noise;
  vNoise = uHoverState * sin(dist * 10. - uTime);
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
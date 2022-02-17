varying float vNoise;
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uImageTexture;

void main() {
  vec3 color1 = vec3(vUv, 0.);
  vec3 color2 = vec3(0., vUv);
  vec3 finalColor = mix(color1, color2, 0.5 * (vNoise + 1.));
  vec2 newUv = vUv;
  // newUv =  vec2(newUv.x,  newUv.x + newUv.y + vNoise);
  newUv =  vec2(newUv.x + 0.01*sin(newUv.y * 10. + (uTime * 0.5)), newUv.y);
  vec3 imageView = texture2D(uImageTexture, newUv).rgb;
  gl_FragColor = vec4(vUv, 0., 1.0);
  gl_FragColor = vec4(finalColor, 1.0);
  // gl_FragColor = vec4(imageView, 1.0) + vec4(vec3(vNoise), 1.);
  gl_FragColor = vec4(imageView, 1.0) + vec4(vec3(vNoise * 0.5), 1.);
  // gl_FragColor = vec4(vec3(vNoise), 1.);
}
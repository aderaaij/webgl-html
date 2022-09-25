varying float vNoise;
varying vec2 vUv;

uniform float uTime;
uniform sampler2D uImage;
uniform float uHoverState;

void main() {
  // vec3 color1 = vec3(vUv, 1.);
  // vec3 color2 = vec3(1., vUv);
  // vec3 finalColor = mix(color1, color2, 0.5 * (vNoise + 1.));
  
  vec2 newUv = vUv;
  
  // newUv =  vec2(newUv.x,  newUv.x + newUv.y + vNoise);
  // newUv =  vec2(newUv.x + 0.01*sin(newUv.y * 10. + (uTime * 0.5)), newUv.y);
  
  vec4 imageView = texture2D(uImage, newUv);
  float normalNoise = 0.5 * (vNoise + 0.5);

  
  // Transition Between two images
  // vec2 p = newUv;  
  // float x = uHoverState;  
  // x = smoothstep(.0,1.0,(x*2.0+p.y-1.0));    
  // vec4 f = mix(
  //   texture2D(uImage, (p-.5)*(1.-x)+.5), 
  //   texture2D(uImage, (p-.5)*x+.5), 
  //   x);

  // Output
  gl_FragColor = imageView;
  // gl_FragColor = vec4(vUv, 0., 1.0);
  // gl_FragColor = vec4(finalColor, 1.0);
  // gl_FragColor = vec4(imageView, 1.0);
  // gl_FragColor = vec4(imageView, 1.0) + vec4(vec3(vNoise * 0.5), 1.);
  // gl_FragColor = vec4(vec3(vNoise), 1.);  
  // gl_FragColor = vec4(vNoise, 0., 0., 1.);
  // gl_FragColor = imageView;
  // gl_FragColor = imageView * vec4(normalNoise, normalNoise, normalNoise, 1.);
}
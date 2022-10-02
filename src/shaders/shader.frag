varying float vNoise;
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uImageTexture;
uniform float uProgress;

float rand(float n){
  return fract(sin(n) * 43758.5453123);
}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

// float noise(float p){
// 	float fl = floor(p);
//   float fc = fract(p);
// 	return mix(rand(fl), rand(fl + 1.0), fc);
// }
	
float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

void main() {
  float x = floor(vUv.x * 10.); 
  float y = floor(vUv.y * 10.);
  float nois = noise(vec2(x,y));
  
  float p0 = uProgress;
  p0 = smoothstep(p0,p0+0.5, vUv.x);

  gl_FragColor = vec4(vec3(nois)*uProgress, 1.);
//   vec3 color1 = vec3(vUv, 0.);
//   vec3 color2 = vec3(0., vUv);
//   vec3 finalColor = mix(color1, color2, 0.5 * (vNoise + 1.));
//   vec2 newUv = vUv;
//   // newUv =  vec2(newUv.x,  newUv.x + newUv.y + vNoise);
//   newUv =  vec2(newUv.x + 0.01*sin(newUv.y * 10. + (uTime * 0.5)), newUv.y);
//   vec3 imageView = texture2D(uImageTexture, newUv).rgb;
//   gl_FragColor = vec4(vUv, 0., 1.0);
//   gl_FragColor = vec4(finalColor, 1.0);
//   // gl_FragColor = vec4(imageView, 1.0) + vec4(vec3(vNoise), 1.);
//   // gl_FragColor = vec4(imageView, 1.0) + vec4(vec3(vNoise * 0.5), 1.);
//   gl_FragColor = vec4(1.0, 0.,0.0, 1.);
//   // gl_FragColor = vec4(vec3(vNoise), 1.);
}


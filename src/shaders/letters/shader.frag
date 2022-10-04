// Varyings
precision mediump float;

uniform float uProgressText01;
uniform float uProgressText02;
uniform float uProgressText03;
uniform float uProgressText04;
uniform float uRatio;

#include <three_msdf_varyings>
// Uniforms
#include <three_msdf_common_uniforms>
#include <three_msdf_strokes_uniforms>
// Utils
#include <three_msdf_median>

// https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float noise(vec2 n) {
  const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
  return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

// Custom function to output a layer mix for checkered pattern reveal
// Takes in the progress value, the vUv X coordinate and the pattern
float layerMix(float progress, float x, float pattern){
  float p = progress;
  p = map(p, 0., 1., -1., 1.);
  p = smoothstep(p, p+1., vLayoutUv.x);
  float mix = 2.*p - pattern;
  return clamp(mix, 0.,1.);
}

void main() {
  float progresses[4] = float[](uProgressText01, uProgressText02, uProgressText03, uProgressText04);
  // Common
  #include <three_msdf_common>
  // Strokes
  #include <three_msdf_strokes>
  // Alpha Test
  #include <three_msdf_alpha_test>

  float x = floor(vLayoutUv.x * 15. * uRatio);
  float y = floor(vLayoutUv.y * 15.);

  float pattern = noise(vec2(x,y));

  float mixes[4] = float[](0.,0.,0.,0.);

  for(int i = 0; i < 4; ++i) {
    float p = progresses[i];
    p = map(p, 0., 1., -1., 1.);
    p = smoothstep(p, p+1., vLayoutUv.x);
    float mix = 2.*p - pattern;
    mixes[i] = clamp(mix, 0.,1.);  
  } 

  // Outputs
  #include <three_msdf_strokes_output>
  vec3 magenta = vec3(0.925,0.,0.549);
  
  vec4 borderMagenta = vec4(magenta, border);
  vec4 borderFull = vec4(vec3(.9),border * 1.);
  vec4 bgMagenta = vec4(magenta,1.);
  vec4 bgWhite = vec4(vec3(1.),1.);


  vec4 layer_01 = mix(vec4(0.), borderMagenta, 1. -mixes[0]);
  vec4 layer_02 = mix(layer_01, borderFull, 1. -mixes[1]);
  vec4 layer_03 = mix(layer_02, bgMagenta, 1. -mixes[2]);
  vec4 layer_04 = mix(layer_03, bgWhite, 1. -mixes[3]);
  

  gl_FragColor = layer_04;
}
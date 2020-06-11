uniform float cycleColors;

varying float vAlpha;
varying float vUpdated;
varying vec4 vCurrentPosition;

void main(){

  vec3 color = vec3(0.);
  // vec3 color = vec3(1.);

  /*if (cycleColors == 1.0) {
    if (vUpdated > 1.) {
      float amount = min(1., vUpdated - 1.);
      color = mix(vec3(.09, .274, .627), vec3(.7, .7, .7), amount);
    } else {
      color = mix(vec3(0.921, 0.133, 0.337), vec3(.09, .274, .627), vUpdated);
    }
  }*/

  // if (length(vCurrentPosition.xyz) < 499.0) {
  //   gl_FragColor = vec4(0.0);
  // } else {


    float a = vAlpha;
    float distToCenter = length(vCurrentPosition.xyz);
    a *= pow(distToCenter, 2.0) * 0.0000055;
    // a = 0.0;
    gl_FragColor = vec4(color, a);
  // }

}
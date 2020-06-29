uniform float cycleColors;
uniform float theme;
uniform float uBokeh;

varying float vAlpha;
varying float vUpdated;
varying vec4 vCurrentPosition;
varying vec4 vMvPosition;

uniform float backSideOnly;
uniform float frontSideOnly;
varying vec3 vCamPos;

void main(){

    vec3 color = vec3(0.);
    if (theme == 1.0) {
      color = vec3(1.);
    }

    float a = vAlpha;
    float distToCenter = length(vCurrentPosition.xyz);
    if (uBokeh == 1.0) {
      a *= pow(distToCenter, 2.0) * 0.000009;
    } else {
      a *= pow(distToCenter, 2.0) * 0.0000048;
    }
    a *= (15000.0 / length(vMvPosition.xyz)) * 0.06;

    vec3 newCamPos = vCamPos - (normalize(vCamPos) * 600.0);
    // float distToCamPos = distance(vCurrentPosition.xyz, newCamPos);

    float backside = 1.0;
    if (dot( vCurrentPosition.xyz - normalize(vCamPos) * 150.0, normalize(vCamPos) ) > 0.0) {
      backside = 0.0;
    }

    if (backSideOnly == 1.0 && backside == 0.0) {
      a = 0.0;
      discard;
    }

    if (frontSideOnly == 1.0 && backside == 1.0) {
      a = 0.0;
      discard;
    }

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

      // a = 0.0;
    gl_FragColor = vec4(color, a);
    // }

}
uniform sampler2D positionTexture;
uniform vec3 camPos;
uniform float camDistToCenter;
uniform float uTime;
uniform float backSideOnly;
uniform float frontSideOnly;
uniform float uCamPosZOffset;
uniform float theme;

attribute float updated;
attribute vec2 texLocation;

varying float vAlpha;
varying float vUpdated;
varying vec4 vCurrentPosition;
varying vec4 vMvPosition;
varying float vBackside;
varying float vBackSideOnly;
varying float vFrontSideOnly;
varying vec3 vCamPos;
varying float vDist;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
  vec4 currentPosition = vec4(texture2D(positionTexture, texLocation.xy));

    // node index stored in w component (2.0 is root)
    if (currentPosition.w == 2.0) {
      currentPosition.xyz = vec3(0.);
    }

    vCurrentPosition = currentPosition;

    vUpdated = updated;

    currentPosition.w = 1.0;

    vec4 mvPosition = modelViewMatrix * currentPosition;

    vMvPosition = mvPosition;

    // vAlpha = 2000.0 / dot(mvPosition.xyz, mvPosition.xyz);
    vAlpha = 0.18;

    float dofAmount = clamp(map(camDistToCenter, 0., 800., 0., 1.), 0., 1.);

    float scaledTime = uTime * 0.13;
    if (scaledTime < 1.) {
      vAlpha -= (1.0 - scaledTime);
      //dofAmount -= (1.0 - scaledTime);
    }

    // vAlpha = mix(vAlpha, .15, dofAmount);

    vCamPos = camPos;

    vec3 newCamPos = camPos - (normalize(camPos) * 600.0);
    float distToCamPos = distance(currentPosition.xyz, newCamPos);

    // vBackside = 1.0;
    // if (dot( currentPosition.xyz - normalize(camPos) * uCamPosZOffset, normalize(camPos) ) > 0.0) {
    //   vBackside = 0.0;
    // }
  
    gl_Position = projectionMatrix * mvPosition;

}
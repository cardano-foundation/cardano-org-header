uniform float isDepth;
uniform sampler2D positionTexture;
uniform float uTime;
uniform float decayTime;
uniform float scale;
uniform float cycleColors;
uniform float camDistToCenter;
uniform vec3 camPos;
uniform float nodeIsHovered;
uniform float nodeIsSelected;
uniform float backSideOnly;
uniform float frontSideOnly;
uniform float uCamPosZOffset;

attribute vec3 pickerColor;
attribute float isHovered; // id of hovered node
attribute float isSelected; // id of selected node
attribute float id;
attribute vec4 color;

varying vec4 vColor;
varying vec3 vPickerColor;
varying float vDecay;
varying float vDist;
varying float vDistSq;
varying float vIsHovered;
varying float vIsSelected;
varying float vId;
varying float vBackside;
varying float vBackSideOnly;
varying float vFrontSideOnly;

void main() {
    vId = id;
    vColor = color;
    vPickerColor = pickerColor; // color for GPU picker
    vIsHovered = isHovered;
    vIsSelected = isSelected;

    vec3 currentPosition = texture2D(positionTexture, position.xy).xyz;

    if (id == 0.0) {
        currentPosition = vec3(0.);
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPosition, 1.);

    if (vColor.a == 0.) {
        vDecay = 2. - (decayTime * 0.05);
        vDecay = max(0.0, vDecay);
    }

    float decayScale = scale * ((vDecay * 0.75) + 1.0);

    vDist = decayScale / length(mvPosition.xyz);

    vec3 newCamPos = camPos - (normalize(camPos) * 600.0);
    float distToCamPos = distance(currentPosition.xyz, newCamPos);

    vBackside = 1.0;
    float sizeMultiplier = 1.0;
    if (dot( currentPosition.xyz - normalize(camPos) * uCamPosZOffset, normalize(camPos) ) > 0.0) {
      vBackside = 0.0;
    }

    vBackSideOnly = backSideOnly;
    vFrontSideOnly = frontSideOnly;

    if (backSideOnly == 1.0) {
      if (vBackside == 0.0) {
        sizeMultiplier = 0.0;
      }
    }

    if (frontSideOnly == 1.0  ) {
      if (vBackside == 1.0) {
        sizeMultiplier = 0.0;
      }
    }

    gl_PointSize = vDist * sizeMultiplier;

    gl_Position = projectionMatrix * mvPosition;


}
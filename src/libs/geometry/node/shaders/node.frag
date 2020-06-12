uniform float uTime;

varying float vDecay;
varying vec4 vColor;
varying float vDist;
varying float vIsHovered;
varying float vIsSelected;
varying float vId;
varying float vBackside;
varying float vBackSideOnly;
varying float vFrontSideOnly;

void main() {

  vec4 diffuse = vec4(vColor.rgb, 1.0);

  if (vBackSideOnly == 1.0 && vBackside == 0.0) {
    diffuse = vec4(0.0);
    discard;
  }

  if (vFrontSideOnly == 1.0 && vBackside == 1.0) {
    diffuse = vec4(0.0);
    discard;
  }
  
  if (vId == 0.0) {
    discard;
  } else {

    // round particles
    vec2 uv = (  vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
    vec4 diffuse = vec4(vColor.rgb, 1.0);

    diffuse.rgb += vDecay;
    diffuse.rgb += (vIsHovered * 0.4);
    diffuse.rgb += (vIsSelected);

    float border = 0.1;
    float radius = 0.3;
    float dist = radius - distance(uv, vec2(0.5));
    float t = smoothstep(0.0, border, dist);

    diffuse.a = t;

    if (diffuse.a < 0.6) {
      discard;
    }

    gl_FragColor = vec4(diffuse.rgb, diffuse.a * clamp(uTime * 0.2, 0.0, 1.0) );
    
  }
  
}

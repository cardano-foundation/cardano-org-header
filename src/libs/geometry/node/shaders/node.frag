uniform sampler2D map;
uniform sampler2D mapBlur;
uniform sampler2D uMap;
uniform float uTime;
uniform float cycleColors;

varying float vDecay;
varying vec4 vColor;
varying float vDist;
varying float vSpriteMix;
varying float vIsHovered;
varying float vIsSelected;
varying float vId;
varying float vBackside;
varying float vBackSideOnly;
varying float vFrontSideOnly;

void main() {

	// round particles
	vec2 uv = (  vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	// vec2 toCenter = (uv - 0.5) * 2.0;
	// if (length(toCenter) > 0.4) {
	// 	discard;
	// }

  if (vBackSideOnly == 1.0  ) {
    if (vBackside == 0.0) {
      discard;
    }
  }

  if (vFrontSideOnly == 1.0  ) {
    if (vBackside == 1.0) {
      discard;
    }
  }
  

   if (vId == 0.0) {
     discard;
   } else {



  vec4 sprite = vec4(1.);
  vec4 spriteBlur = vec4(1.);
  if (vDecay > 0.) {
    sprite = texture2D(uMap, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
    spriteBlur = texture2D(uMap, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
  } else {
    sprite = texture2D(map, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
    spriteBlur = texture2D(mapBlur, vec2(gl_PointCoord.x, 1. - gl_PointCoord.y));
  }

   //vec4 diffuse = mix(sprite, spriteBlur, vBackside);

  // if (cycleColors == 1.0) {
  //   if (vColor.a > 1.) {
  //     float amount = min(1., vColor.a - 1.);
  //     sprite.rgb = mix(vec3(.09, .274, .627), vec3(.7, .7, .7), amount);
  //   } else {
  //     sprite.rgb = mix(vColor.rgb, vec3(.09, .274, .627), vColor.a);
  //   }
  // } else {
     vec4 diffuse = vec4(vColor.rgb, 1.0);
    // diffuse.rgb = vColor.rgb;
  //}

  diffuse.rgb += vDecay;

  // diffuse.a = mix(diffuse.a, diffuse.a * (vDist * 0.01), vSpriteMix * 1.0);
  // diffuse.a = clamp(diffuse.a, 0.0, 1.0);

  diffuse.rgb += (vIsHovered * 0.4);
  diffuse.rgb += (vIsSelected);

  float border = 0.1;
	float radius = 0.3;
	float dist = radius - distance(uv, vec2(0.5));
	float t = smoothstep(0.0, border, dist);

  // if (vBackside == 0.0) {

     diffuse.a = t;

    if (diffuse.a < 0.6) {
      discard;
    }

  // }
    // diffuse.rgb = mix(diffuse.rgb, vec3(1.0), vSpriteMix);

    gl_FragColor = vec4(diffuse.rgb, diffuse.a * clamp(uTime*0.2, 0.0, 1.0) );
    
   }
  
}

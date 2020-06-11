#if DEPTH_PACKING == 3200

	uniform float opacity;

#endif

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>


varying vec2 vHighPrecisionZW;
varying float vBackside;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {

	
	

	// round particles
	vec2 uv = (  vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	 vec2 toCenter = (uv - 0.5) * 2.0;

	if (vBackside == 0.0) {
		if (length(toCenter) > 0.5) {
		 	discard;
		 }
	} else {
	 if (length(toCenter) > 1.0) {
		 discard;
	 }
	}


	// float border = 0.1;
	// float radius = 0.3;
	// float dist = radius - distance(uv, vec2(0.5));
	// float t = smoothstep(0.0, border, dist);

	// if (t < 0.6 && vBackside == 0.0) {
	// 	discard;
	// }

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( 1.0 );

	

	#if DEPTH_PACKING == 3200

		diffuseColor.a = opacity;

	#endif

	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>

	#include <logdepthbuf_fragment>

	// Higher precision equivalent of gl_FragCoord.z. This assumes depthRange has been left to its default values.
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

	#if DEPTH_PACKING == 3200

		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );

	#elif DEPTH_PACKING == 3201

		gl_FragColor = packDepthToRGBA( fragCoordZ );

	#endif

}

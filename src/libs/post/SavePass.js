import {
  WebGLRenderTarget,
  UniformsUtils,
  ShaderMaterial,
  LinearFilter,
  RGBFormat
} from 'three'

import Pass from './Pass'
import CopyShader from './CopyShader'

/**
 * @author alteredq / http://alteredqualia.com/
 */

const SavePass = function (renderTarget) {
  Pass.call(this)

  if (CopyShader === undefined) { console.error('THREE.SavePass relies on THREE.CopyShader') }

  var shader = CopyShader

  this.textureID = 'tDiffuse'

  this.uniforms = UniformsUtils.clone(shader.uniforms)

  this.material = new ShaderMaterial({

    uniforms: this.uniforms

  })

  this.renderTarget = renderTarget

  if (this.renderTarget === undefined) {
    this.renderTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat, stencilBuffer: false })
    this.renderTarget.texture.name = 'SavePass.rt'
  }

  this.needsSwap = false

  this.fsQuad = new Pass.FullScreenQuad(this.material)
}

SavePass.prototype = Object.assign(Object.create(Pass.prototype), {

  constructor: SavePass,

  render: function (renderer, writeBuffer, readBuffer) {
    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture
    }

    renderer.setRenderTarget(this.renderTarget)
    if (this.clear) renderer.clear()
    this.fsQuad.render(renderer)
  }

})

export default SavePass

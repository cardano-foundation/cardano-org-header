
import React, { Component } from 'react'
import Medusa from '../../src/Medusa'

class App extends Component {
  constructor (props) {
    super(props)

    this.enabled = this.canRun()
  }

  canRun () {
    if (!window.WebGLRenderingContext) {
      console.log('Your browser does not support WebGL')
      return false
    }

    let glContext = document.createElement('canvas').getContext('webgl')
    if (glContext === null) {
      glContext = document.createElement('canvas').getContext('experimental-webgl')
    }

    if (glContext === null) {
      console.log('Your browser does not support WebGL')
      return false
    }

    const gl = glContext.getSupportedExtensions()

    if (gl.indexOf('ANGLE_instanced_arrays') === -1) {
      console.log('ANGLE_instanced_arrays support is required to run this app')
      return false
    }

    if (gl.indexOf('OES_texture_float') === -1) {
      console.log('OES_texture_float support is required to run this app')
      return false
    }

    if (gl.indexOf('OES_texture_float_linear') === -1) {
      console.log('OES_texture_float support is required to run this app')
      return false
    }

    if (gl.indexOf('OES_texture_half_float') === -1) {
      console.log('OES_texture_float support is required to run this app')
      return false
    }

    if (gl.indexOf('OES_texture_half_float_linear') === -1) {
      console.log('OES_texture_float support is required to run this app')
      return false
    }

    return true
  }

  render () {
    if (this.enabled) {
      return (
        <div>
          <Medusa
            ariaLabel='Directory Structure for the ouroboros-network git repository'
            theme='dark'
            className='medusa-container'
            camPosZ={600}
            colorPalette={[
              '#ff5454',
              '#3b7882',
              '#ffffff'
            ]}
          />
        </div>
      )
    }
  }
}

export default App

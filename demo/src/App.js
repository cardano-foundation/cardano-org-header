
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

    return true
  }

  render () {
    if (this.enabled) {
      return (
        <div>
          <Medusa
            theme='dark'
            className='medusa-container'
            camPosZ={600}
            colorPalette={[
              '#ff5454',
              '#3b7882',
              '#ffffff'
            ]}
            ref='demo'
          />
        </div>
      )
    }
  }
}

export default App

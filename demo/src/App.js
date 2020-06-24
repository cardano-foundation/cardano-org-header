
import React, { Component } from 'react'
import Medusa from '../../src/Medusa'

class App extends Component {
  constructor () {
    super()
  }

  render () {
    return (
      <Medusa ref='demo' />
    )
  }
}

export default App

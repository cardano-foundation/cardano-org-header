import {
  PlaneBufferGeometry,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  ShaderMaterial,
  Mesh,
  AdditiveBlending
} from 'three'

import TextureHelper from '../../TextureHelper'

// shaders
import FragmentShader from './shaders/text.frag'
import VertexShader from './shaders/text.vert'

// font
import UbuntuMono from './fonts/UbuntuMono'

// images
import fontImgFile from '../../../assets/images/UbuntuMono.png'

export default class TextGeometry {
  constructor (config) {
    this.config = config
    this.textureHelper = new TextureHelper()
    this.font = UbuntuMono(fontImgFile)
    this.fontSize = 15
    this.kerning = 1.5
    this.textureSize = 1024 // size of the font texture (aspect 1:1)
    this.material = null
    this.geometry = null
  }

  setAttributes (
    nodeData,
    labelPositionsArray,
    textCoordsArray,
    textureLocationArray,
    scaleArray
  ) {
    let iter = 0

    for (let index = 0; index < textCoordsArray.length; index++) {
      textCoordsArray[index] = 0.0
    }

    for (const nodeId in nodeData) {
      if (nodeData.hasOwnProperty(nodeId)) {
        const node = nodeData[nodeId]

        if (node === null) {
          continue
        }

        let fileNameArray = node.p.split('/')
        let fileName = fileNameArray[fileNameArray.length - 1]

        if (node.p === '/') {
          fileName = this.config.git.repo
        }

        if (fileName.length > this.config.FDG.filePathCharLimit) {
          fileName = fileName.substr(0, this.config.FDG.filePathCharLimit) + '..'
        }

        for (let charIndex = 0; charIndex < fileName.length; charIndex++) {
          const char = fileName[charIndex]

          let coords = this.getCharCoordinates(char)

          if (!coords) {
            continue
          }

          scaleArray[iter * 2 + 0] = coords.width * this.fontSize
          scaleArray[iter * 2 + 1] = coords.height * this.fontSize

          let charPosition = charIndex * this.kerning

          labelPositionsArray[iter * 2 + 0] = charPosition
          labelPositionsArray[iter * 2 + 1] = coords.yOffset * this.fontSize

          let texLocation = this.textureHelper.getNodeTextureLocation(nodeId)

          textureLocationArray[iter * 2 + 0] = texLocation.x
          textureLocationArray[iter * 2 + 1] = texLocation.y

          textCoordsArray[iter * 4 + 0] = coords.left
          textCoordsArray[iter * 4 + 1] = coords.top
          textCoordsArray[iter * 4 + 2] = coords.width
          textCoordsArray[iter * 4 + 3] = coords.height

          iter++
        }
      }
    }
  }

  create (nodeData, nodeCount) {
    this.textureHelper.setTextureSize(nodeCount)

    if (this.geometry) {
      this.geometry.dispose()
    }

    this.geometry = new InstancedBufferGeometry().copy(new PlaneBufferGeometry(1, 1))

    let scaleArray = new Float32Array(nodeCount * 20)
    let labelPositionsArray = new Float32Array(nodeCount * 20)
    let textCoordsArray = new Float32Array(nodeCount * 2 * 20)
    let textureLocationArray = new Float32Array(nodeCount * 20)

    this.setAttributes(
      nodeData,
      labelPositionsArray,
      textCoordsArray,
      textureLocationArray,
      scaleArray
    )

    let scale = new InstancedBufferAttribute(scaleArray, 2)
    let textCoords = new InstancedBufferAttribute(textCoordsArray, 4)
    let labelPositions = new InstancedBufferAttribute(labelPositionsArray, 2)
    let textureLocation = new InstancedBufferAttribute(textureLocationArray, 2)

    this.geometry.setAttribute('scale', scale)
    this.geometry.setAttribute('labelPositions', labelPositions)
    this.geometry.setAttribute('textCoord', textCoords)
    this.geometry.setAttribute('textureLocation', textureLocation)

    if (!this.material) {
      this.material = new ShaderMaterial({
        uniforms: {
          fontTexture: {
            type: 't', value: this.font.texture
          },
          positionTexture: {
            type: 't',
            value: null
          },
          uTime: {
            type: 'f',
            value: null
          }
        },
        vertexShader: VertexShader,
        fragmentShader: FragmentShader,
        blending: AdditiveBlending,
        depthTest: false,
        transparent: true
      })
    }

    this.text = new Mesh(this.geometry, this.material)
    return this.text
  }

  getCharCoordinates (char) {
    let charCode = char.charCodeAt(0)

    if (typeof this.font[charCode] === 'undefined') {
      return null
    }

    let charData = this.font[charCode]

    return {
      left: charData[0] / this.textureSize,
      top: charData[1] / this.textureSize,
      width: charData[2] / this.textureSize,
      height: charData[3] / this.textureSize,
      xOffset: charData[4] / this.textureSize,
      yOffset: charData[5] / this.textureSize
    }
  }

  update (camera, frame, dt) {
    if (this.material) {
      this.material.uniforms.uTime.value += dt
    }
  }
}

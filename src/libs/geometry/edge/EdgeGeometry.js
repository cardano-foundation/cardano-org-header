import {
  Vector3,
  ShaderMaterial,
  BufferAttribute,
  LineSegments,
  BufferGeometry
} from 'three'

// shaders
import FragmentShader from './shaders/edge.frag'
import VertexShader from './shaders/edge.vert'

export default class EdgeGeometry {
  constructor (config) {
    this.config = config
    this.material = null
    this.geometry = null
  }

  setUpdated (nodeData, nodeCount, uArray, edgeData) {
    if (!this.config.FDG.cycleColors) {
      return
    }

    for (let i = 0; i < (nodeCount * 2); i += 2) {
      let node1 = nodeData[edgeData[i]]
      let node2 = nodeData[edgeData[i + 1]]

      if (!node1) {
        uArray[i * 2 + 0] = 0.0
      }
      if (!node2) {
        uArray[i * 2 + 1] = 0.0
      }

      if (node1 && node1.u) {
        uArray[i * 2 + 0] = 0.0
      } else {
        if (uArray[i * 2 + 0] < 2.0) {
          uArray[i * 2 + 0] += this.config.FDG.colorCooldownSpeed
        }
      }

      if (node2 && node2.u) {
        uArray[i * 2 + 1] = 0.0
      } else {
        if (uArray[i * 2 + 1] < 2.0) {
          uArray[i * 2 + 1] += this.config.FDG.colorCooldownSpeed
        }
      }
    }
  }

  create (edgeCount, forceArray, nodeData, nodeCount, edgeData) {
    if (this.geometry) {
      this.geometry.dispose()
    }

    this.geometry = new BufferGeometry()

    let updatedArray = new Float32Array(edgeCount * 2)
    this.setUpdated(nodeData, nodeCount, updatedArray, edgeData)
    let updated = new BufferAttribute(updatedArray, 1)
    this.geometry.setAttribute('updated', updated)

    let texLocation = new BufferAttribute(forceArray, 2)
    this.geometry.setAttribute('texLocation', texLocation)

    let position = new BufferAttribute(new Float32Array((edgeCount * 2) * 3), 3)
    this.geometry.setAttribute('position', position)

    if (!this.material) {
      this.material = new ShaderMaterial({
        uniforms: {
          camDistToCenter: {
            type: 'f',
            value: null
          },
          cycleColors: {
            type: 'f',
            value: this.config.cycleColors ? 1.0 : 0.0
          },
          positionTexture: {
            type: 't',
            value: null
          },
          uTime: {
            type: 'f',
            value: null
          },
          backSideOnly: {
            type: 'f',
            value: 1.0
          },
          frontSideOnly: {
            type: 'f',
            value: 0.0
          },
          camPos: {
            type: 'v3',
            value: new Vector3()
          },
          uCamPosZOffset: {
            type: 'f',
            value: 150
          }
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        vertexShader: VertexShader,
        fragmentShader: FragmentShader
      })
    }

    this.edges = new LineSegments(this.geometry, this.material)

    this.edges.geometry.setDrawRange(0, nodeData.length * 4)

    return this.edges
  }

  update (camera, frame, dt) {
    let camPos = camera.getWorldPosition(new Vector3())
    const center = new Vector3(0.0, 0.0, 0.0)
    this.material.uniforms.camDistToCenter.value = camPos.distanceTo(center)
    this.material.uniforms.uTime.value += dt
    this.material.uniforms.camPos.value = camPos

    this.material.uniforms.uCamPosZOffset.value = this.config.FDG.focusPlaneOffset
  }
}

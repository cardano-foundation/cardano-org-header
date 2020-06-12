// 3rd Party
import {
  Vector2,
  Scene,
  OrthographicCamera,
  WebGLRenderTarget,
  LinearFilter,
  ClampToEdgeWrapping,
  NearestFilter,
  RGBAFormat,
  DataTexture,
  LuminanceAlphaFormat,
  FloatType,
  ShaderMaterial,
  PlaneBufferGeometry,
  Mesh,
  BufferGeometry,
  BufferAttribute,
  AdditiveBlending,
  Points
} from 'three'

// Helpers
import TextureHelper from './TextureHelper'

// Geometry
import NodeGeometry from './geometry/node/NodeGeometry'
import EdgeGeometry from './geometry/edge/EdgeGeometry'
import TextGeometry from './geometry/text/TextGeometry'

// Shaders
import PullVert from '../shaders/pull.vert'
import PushVert from '../shaders/push.vert'
import ForceFrag from '../shaders/force.frag'
import PositionFrag from '../shaders/position.frag'
import PassThroughVert from '../shaders/passThrough.vert'
import PassThroughFrag from '../shaders/passThrough.frag'

import { gsap } from 'gsap'

/**
 * GPGPU Force Directed Graph Simulation
 */
export default class FDG {
  constructor (
    renderer,
    scene,
    config,
    camera,
    mousePos,
    App
  ) {
    this.renderer = renderer
    this.scene = scene
    this.config = config
    this.camera = camera
    this.mousePos = mousePos
    this.lastMousePos = new Vector2(0, 0)
    this.app = App // application instance

    this.frame = 0 // current frame of the animation

    this.textureHelper = new TextureHelper()
    this.nodeGeometry = new NodeGeometry(this.config)
    this.edgeGeometry = new EdgeGeometry(this.config)
    this.textGeometry = new TextGeometry(this.config)

    this.firstRun = true // if this is the first time the class has been run
    this.textureWidth = 0
    this.textureHeight = 0
    this.enabled = false
    this.storedPositions = new Float32Array()
    this.positionMaterial = null
    this.nodes = null
    this.edges = null
    this.forceMaterial = null
    this.pullGeometry = null
    this.pushGeometry = null
    this.text = null
    this.newNodes = []
    this.nodeIsHovered = false

    this.initCamera()
    this.initPicker()
  }

  animateSphere () {
    this.tl = gsap.timeline()

    this.tl.to(this.config.FDG, {
      sphereRadius: 210,
      duration: 3.5
    })

    this.tl.to(this.config.FDG, {
      sphereRadius: 500,
      duration: 4.3,
      ease: 'back.out(1.7)',
      focusPlaneOffset: 150
    })
  }

  initCamera () {
    this.quadCamera = new OrthographicCamera()
    this.quadCamera.position.z = 1
  }

  initPicker () {
    this.lastHoveredNodeID = -1
    this.lastSelectedNodeID = -1
    this.pickingScene = new Scene()
    this.pickingTexture = new WebGLRenderTarget(window.innerWidth, window.innerHeight)
    this.pickingTexture.texture.minFilter = LinearFilter
    this.pickingTexture.texture.generateMipmaps = false
  }

  updatePicker () {
    // this.renderer.setClearColor(0)
    this.renderer.setRenderTarget(this.pickingTexture)
    this.renderer.render(this.pickingScene, this.camera)

    let pixelBuffer = new Uint8Array(4)

    let canvasOffset = this.renderer.domElement.getBoundingClientRect()

    this.renderer.readRenderTargetPixels(
      this.pickingTexture,
      this.mousePos.x - canvasOffset.left,
      this.pickingTexture.height - (this.mousePos.y - canvasOffset.top),
      1,
      1,
      pixelBuffer
    )

    let id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2] - 1)

    /* if (id !== -1) {
      this.movementPaused = true
    } else {
      this.movementPaused = false
    } */

    if (this.lastHoveredNodeID !== id) {
      this.lastHoveredNodeID = id

      if (typeof this.nodeData[id] !== 'undefined') {
        this.hoveredNodeData = this.nodeData[id]
        // this.app.emit('nodeMouseOver', {
        //   nodeData: this.hoveredNodeData,
        //   mousePos: this.mousePos
        // })
        this.nodes.material.uniforms.nodeIsHovered.value = 1.0
        // this.nodeIsHovered = true
      } else {
        this.app.emit('nodeMouseOut', {
          mousePos: this.mousePos
        })
        this.nodes.material.uniforms.nodeIsHovered.value = 0.0
        this.nodeIsHovered = false
      }

      let hoveredArray = new Float32Array(this.nodeCount)
      hoveredArray[this.lastHoveredNodeID] = 1.0

      this.nodes.geometry.attributes.isHovered.array = hoveredArray
      this.nodes.geometry.attributes.isHovered.needsUpdate = true
    }
  }

  onMouseUp () {
    let mouseMoveVec = this.mousePos.clone().sub(this.lastMousePos)

    // clicking on the same node twice deselects
    if (this.lastSelectedNodeID === this.lastHoveredNodeID) {
      this.movementPaused = false
      this.lastSelectedNodeID = -1

      this.app.emit('nodeDeselect', {})
    } else {
      if (mouseMoveVec.lengthSq() > 200) {
        return
      }

      // pause movement on click
      if (this.nodeIsHovered) {
        this.lastSelectedNodeID = this.lastHoveredNodeID
        this.movementPaused = true

        if (typeof this.nodeData[this.lastHoveredNodeID] !== 'undefined') {
          this.selectedNodeData = this.nodeData[this.lastHoveredNodeID]

          this.app.emit('nodeSelect', {
            nodeData: this.selectedNodeData,
            mousePos: this.mousePos
          })
        }
      } else {
        this.movementPaused = false
        this.lastSelectedNodeID = -1
        this.app.emit('nodeDeselect', {})
      }
    }

    this.nodes.material.uniforms.nodeIsSelected.value = this.lastSelectedNodeID === -1 ? 0.0 : 1.0

    let selectedArray = new Float32Array(this.nodeCount)
    selectedArray[this.lastSelectedNodeID] = 1.0

    this.nodes.geometry.attributes.isSelected.array = selectedArray
    this.nodes.geometry.attributes.isSelected.needsUpdate = true
  }

  onMouseDown () {
    this.lastMousePos = new Vector2(this.mousePos.x, this.mousePos.y)
  }

  /**
   * Grab data from position texture
   */
  storePositions () {
    this.storedPositions = new Float32Array(this.textureWidth * this.textureHeight * 4)

    this.renderer.readRenderTargetPixels(
      this.outputPositionRenderTarget,
      0,
      0,
      this.textureWidth,
      this.textureHeight,
      this.storedPositions
    )

    this.storedPositions = this.storedPositions.slice(0, this.nodeCount * 4)
  }

  refresh () {
    this.nodeGeometry.setDecayTime(0.0)
  }

  init ({
    nodeData,
    edgeData,
    nodeCount
  } = {}) {
    this.nodeData = nodeData
    this.edgeData = edgeData
    this.nodeCount = nodeCount

    if (this.firstRun) {
      this.initPassThrough()
    }

    this.setTextureDimensions()

    if (this.firstRun) {
      this.positionRenderTarget1 = new WebGLRenderTarget(this.textureWidth, this.textureHeight, {
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        type: this.config.floatType,
        depthWrite: false,
        depthBuffer: false,
        stencilBuffer: false
      })

      this.positionRenderTarget2 = this.positionRenderTarget1.clone()
      this.pullRenderTarget = this.positionRenderTarget1.clone()
      this.pushRenderTarget = this.positionRenderTarget1.clone()

      this.outputPositionRenderTarget = this.positionRenderTarget1
    }

    if (this.firstRun) {
      this.passThroughTexture(
        this.textureHelper.createPositionTexture({ storedPositions: this.storedPositions }),
        this.positionRenderTarget1
      )
      this.passThroughTexture(this.positionRenderTarget1.texture, this.positionRenderTarget2)
    }

    this.initForces()
    this.initPositions()
    this.initEdges()
    this.initNodes()
    this.initText()

    this.animateSphere()

    this.setEnabled(true)
  }

  setEnabled () {
    this.enabled = true
  }

  /**
   * Force reload of the scene if config settings have changed
   */
  triggerUpdate () {
    this.refresh()
    this.init({
      nodeData: this.nodeData,
      edgeData: this.edgeData,
      nodeCount: this.nodeCount
    })
  }

  setTextureDimensions () {
    this.textureHelper.setTextureSize(this.nodeCount)
    this.textureWidth = this.textureHelper.textureWidth
    this.textureHeight = this.textureHelper.textureHeight
  }

  setFirstRun (firstRun) {
    this.firstRun = firstRun
  }

  calculatePositions () {
    this.frame++

    this.positionMaterial.uniforms.sphereProject.value = this.config.FDG.sphereProject
    this.positionMaterial.uniforms.sphereRadius.value = this.config.FDG.sphereRadius

    // update forces
    let inputForceRenderTarget = this.positionRenderTarget1
    if (this.frame % 2 === 0) {
      inputForceRenderTarget = this.positionRenderTarget2
    }

    this.pullMaterial.uniforms.positionTexture.value = inputForceRenderTarget.texture
    this.pushMaterial.uniforms.positionTexture.value = inputForceRenderTarget.texture

    // update positions
    let inputPositionRenderTarget = this.positionRenderTarget1
    this.outputPositionRenderTarget = this.positionRenderTarget2
    if (this.frame % 2 === 0) {
      inputPositionRenderTarget = this.positionRenderTarget2
      this.outputPositionRenderTarget = this.positionRenderTarget1
    }
    this.positionMaterial.uniforms.positionTexture.value = inputPositionRenderTarget.texture

    // pull
    this.renderer.setRenderTarget(this.pullRenderTarget)
    this.renderer.render(this.pullScene, this.quadCamera)
    this.positionMaterial.uniforms.pullTexture.value = this.pullRenderTarget.texture

    // push
    this.renderer.setRenderTarget(this.pushRenderTarget)
    this.renderer.render(this.pushScene, this.quadCamera)
    this.positionMaterial.uniforms.pushTexture.value = this.pushRenderTarget.texture

    // position
    this.renderer.setRenderTarget(this.outputPositionRenderTarget)
    this.renderer.render(this.positionScene, this.quadCamera)

    this.nodes.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture

    this.edges.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture

    if (this.config.FDG.usePicker) {
      this.pickingMesh.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture
    }

    if (this.config.FDG.showFilePaths && this.text) {
      this.text.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture
    }
  }

  update (dt) {
    if (this.enabled) {
      if (this.movementPaused) {
        return
      }

      // picker
      if (this.config.FDG.usePicker && this.frame % 10 === 0) {
        // this.updatePicker()
      }

      // for (let index = 0; index < 1; index++) {
      this.calculatePositions()
      // }

      // update nodes
      this.nodeGeometry.update(this.camera, this.frame, dt)
      this.edgeGeometry.update(this.camera, this.frame, dt)
      this.textGeometry.update(this.camera, this.frame, dt)
    }
  }

  resize (width, height) {
    this.pickingTexture.setSize(width, height)
    this.nodeGeometry.resize()
  }

  initEdges () {
    this.setForceTextureLocations()
    if (this.firstRun) {
      this.edges = this.edgeGeometry.create(this.nodeCount * 2, this.pullGeometry.attributes.texLocation.array, this.nodeData, this.nodeCount, this.edgeData)
      this.scene.add(this.edges)
    } else {
      this.edgeGeometry.setUpdated(this.nodeData, this.nodeCount, this.edges.geometry.attributes.updated.array, this.edgeData)
      this.edges.geometry.setDrawRange(0, this.nodeData.length * 4)
      this.edges.geometry.attributes.position.needsUpdate = true
      this.edges.geometry.attributes.texLocation.needsUpdate = true
      this.edges.geometry.attributes.updated.needsUpdate = true
    }
  }

  initNodes () {
    if (this.firstRun) {
      this.nodes = this.nodeGeometry.create(this.nodeData, this.nodeCount)
      this.scene.add(this.nodes)
      this.pickingMesh = this.nodeGeometry.getPickingMesh()
      this.pickingScene.add(this.pickingMesh)
    } else {
      this.nodeGeometry.setTextureLocations(
        this.nodeData,
        this.nodeCount,
        this.nodes.geometry.attributes.position.array,
        this.nodes.geometry.attributes.color.array,
        this.pickingMesh.geometry.attributes.pickerColor
      )
      this.nodes.geometry.setDrawRange(0, this.nodeData.length)
      this.nodes.geometry.attributes.position.needsUpdate = true
      this.nodes.geometry.attributes.color.needsUpdate = true
      this.pickingMesh.geometry.setDrawRange(0, this.nodeData.length)
      this.pickingMesh.geometry.attributes.pickerColor.needsUpdate = true
    }
  }

  initText () {
    if (!this.config.FDG.showFilePaths) {
      if (this.text) {
        this.scene.remove(this.text)
      }
      return
    }

    if (!this.text) {
      this.text = this.textGeometry.create(this.nodeData, this.nodeCount)
      this.scene.add(this.text)
    } else {
      this.textGeometry.setAttributes(
        this.nodeData,
        this.text.geometry.attributes.labelPositions.array,
        this.text.geometry.attributes.textCoord.array,
        this.text.geometry.attributes.textureLocation.array,
        this.text.geometry.attributes.scale.array
      )
      this.text.geometry.attributes.labelPositions.needsUpdate = true
      this.text.geometry.attributes.textCoord.needsUpdate = true
      this.text.geometry.attributes.textureLocation.needsUpdate = true
      this.text.geometry.attributes.scale.needsUpdate = true
    }
  }

  passThroughTexture (input, output) {
    this.passThroughMaterial.uniforms.texture.value = input
    this.renderer.setRenderTarget(output)
    this.renderer.render(this.passThroughScene, this.quadCamera)
  }

  setPositionTextureLocations () {
    this.texLocationWidth = Object.keys(this.nodeData).length
    this.texLocationHeight = 1.0

    let dataArr = new Float32Array(this.texLocationWidth * this.texLocationHeight * 2)

    for (let i = 0; i < Object.keys(this.nodeData).length; i++) {
      let nodeTextureLocation = this.textureHelper.getNodeTextureLocation(i)
      dataArr[i * 2 + 0] = nodeTextureLocation.x
      dataArr[i * 2 + 1] = nodeTextureLocation.y
    }

    let texLocation = new DataTexture(dataArr, this.texLocationWidth, this.texLocationHeight, LuminanceAlphaFormat, FloatType)

    texLocation.needsUpdate = true
    texLocation.minFilter = NearestFilter
    texLocation.magFilter = NearestFilter
    texLocation.generateMipmaps = false
    texLocation.flipY = false

    return texLocation
  }

  initPositions () {
    let texLocation = this.setPositionTextureLocations()

    if (!this.positionMaterial) {
      this.positionMaterial = new ShaderMaterial({
        uniforms: {
          texLocation: {
            type: 't',
            value: texLocation
          },
          positionTexture: {
            type: 't',
            value: null
          },
          pullTexture: {
            type: 't',
            value: null
          },
          pushTexture: {
            type: 't',
            value: null
          },
          sphereProject: {
            type: 'f',
            value: 0.0
          },
          sphereRadius: {
            type: 'f',
            value: 0.0
          }
        },
        defines: {
          texLocationWidth: 1.0 / this.texLocationWidth.toFixed(2),
          width: 1.0 / this.textureWidth.toFixed(2),
          height: 1.0 / this.textureHeight.toFixed(2)
        },
        vertexShader: PassThroughVert,
        fragmentShader: PositionFrag
      })

      this.positionScene = new Scene()

      this.positionMesh = new Mesh(new PlaneBufferGeometry(2, 2), this.positionMaterial)
      this.positionScene.add(this.positionMesh)
    } else {
      this.positionMesh.material.uniforms.texLocation.value = texLocation
      this.positionMesh.material.defines = {
        width: 1.0 / this.textureWidth.toFixed(2),
        height: 1.0 / this.textureHeight.toFixed(2),
        texLocationWidth: 1.0 / this.texLocationWidth.toFixed(2)
      }
      this.positionMesh.material.needsUpdate = true
    }
  }

  initForces () {
    if (this.firstRun) {
      // pull
      this.pullGeometry = new BufferGeometry()
      let pullPosition = new BufferAttribute(new Float32Array((this.nodeCount * 2) * 3), 3)
      let texLocation = new BufferAttribute(new Float32Array((this.nodeCount * 2) * 4), 4)

      this.pullGeometry.setAttribute('position', pullPosition)
      this.pullGeometry.setAttribute('texLocation', texLocation)

      this.pullMaterial = new ShaderMaterial({
        uniforms: {
          positionTexture: {
            type: 't',
            value: null
          }
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        vertexShader: PullVert,
        fragmentShader: ForceFrag
      })
      this.pullScene = new Scene()
      this.pullMesh = new Points(this.pullGeometry, this.pullMaterial)
      this.pullScene.add(this.pullMesh)

      // push
      this.pushGeometry = new BufferGeometry()
      let pushPosition = new BufferAttribute(new Float32Array((this.nodeCount * 2) * 3), 3)

      this.pushGeometry.setAttribute('position', pushPosition)
      this.pushGeometry.setAttribute('texLocation', texLocation)

      this.pushMaterial = new ShaderMaterial({
        uniforms: {
          positionTexture: {
            type: 't',
            value: null
          }
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        vertexShader: PushVert,
        fragmentShader: ForceFrag
      })
      this.pushScene = new Scene()
      this.pushMesh = new Points(this.pushGeometry, this.pushMaterial)
      this.pushScene.add(this.pushMesh)
    }

    this.pullMesh.geometry.setDrawRange(0, this.nodeData.length * 2)
    this.pushMesh.geometry.setDrawRange(0, this.nodeData.length * 2)

    this.pullGeometry.attributes.position.needsUpdate = true
    this.pullGeometry.attributes.texLocation.needsUpdate = true
    this.pushGeometry.attributes.position.needsUpdate = true
    this.pushGeometry.attributes.texLocation.needsUpdate = true
  }

  /**
   * Get coords of nodes in position texture and set in attribute of
   * push and pull geometry so we can look these up in the shader
   */
  setForceTextureLocations () {
    let texLocationAttribute = this.pullGeometry.attributes.texLocation.array
    for (let i = 0; i < this.nodeCount * 2 * 4; i += 2) {
      let startVertexTextureLocation = {
        x: 0,
        y: 0
      }
      let endVertexTextureLocation = {
        x: 0,
        y: 0
      }

      if (typeof this.edgeData[i] !== 'undefined') {
        startVertexTextureLocation = this.textureHelper.getNodeTextureLocation(this.edgeData[i])
      }
      if (typeof this.edgeData[i + 1] !== 'undefined') {
        endVertexTextureLocation = this.textureHelper.getNodeTextureLocation(this.edgeData[i + 1])
      }

      texLocationAttribute[i * 4 + 0] = startVertexTextureLocation.x
      texLocationAttribute[i * 4 + 1] = startVertexTextureLocation.y

      texLocationAttribute[i * 4 + 2] = endVertexTextureLocation.x
      texLocationAttribute[i * 4 + 3] = endVertexTextureLocation.y
    }
  }

  initPassThrough () {
    this.passThroughScene = new Scene()
    this.passThroughMaterial = new ShaderMaterial({
      uniforms: {
        texture: {
          type: 't',
          value: null
        }
      },
      vertexShader: PassThroughVert,
      fragmentShader: PassThroughFrag
    })
    let mesh = new Mesh(new PlaneBufferGeometry(2, 2), this.passThroughMaterial)
    this.passThroughScene.add(mesh)
  }
}

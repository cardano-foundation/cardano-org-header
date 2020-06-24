import {
  HalfFloatType,
  FloatType
} from 'three'

import Detector from './libs/Detector'

import { getGPUTier } from 'detect-gpu'

const GPUTier = getGPUTier()

const detector = new Detector()

const Config = {
  git: {
    owner: 'input-output-hk',
    repo: 'ouroboros-network',
    branch: 'master',
    commitHash: '', // hash of commit to load
    commitDate: '', // date to load (YYYY-MM-DD)
    loadLatest: true, // load latest commit in db
    supportedRepos: [
      'cardano-sl',
      'plutus',
      'ouroboros-network',
      'jormungandr',
      'cardano-wallet',
      'cardano-ledger-specs',
      'marlowe',
      'daedalus',
      'symphony-2',
      'rust-cardano',
      'cardano-chain',
      'cardano-js-sdk',
      'cardano-shell'
    ]
  },
  display: {
    showUI: false,
    showSidebar: false,
    sidebarCommitLimit: 5,
    showClose: true
  },
  client: {
    url: ''
  },
  widget: {
    head: {
      title: 'MEDUSA',
      subtitle: 'Github project activity',
      slug: 'head',
      content: 'Introduction'
    },
    about: {
      title: 'About',
      slug: 'about',
      content: 'Custom about content'
    },
    commitList: {
      title: 'Commit List',
      showing: 'Showing',
      addition: 'Addition',
      removal: 'Removal',
      change: 'Change',
      additions: 'Additions',
      removals: 'Removals',
      changes: 'Changes',
      slug: 'commit-list',
      viewfile: 'View file',
      viewcommit: 'View commit'
    },
    milestones: {
      title: 'Milestones',
      slug: 'milestones',
      content: ''
    },
    calendar: {
      title: 'Calendar',
      slug: 'calendar'
    }
  },
  legend: {
    committed: {
      title: 'Committed file',
      icon: ''
    },
    updated: {
      title: 'Updated file',
      icon: ''
    },
    cold: {
      title: 'Cold file',
      icon: ''
    }
  },
  fireBase: {
    apiKey: 'AIzaSyCwfdzrjQ5GRqyz-napBM29T7Zel_6KIUY',
    authDomain: 'webgl-gource-1da99.firebaseapp.com',
    databaseURL: 'https://webgl-gource-1da99.firebaseio.com',
    projectId: 'webgl-gource-1da99',
    storageBucket: 'webgl-gource-1da99.appspot.com',
    messagingSenderId: '532264380396',
    useChangesDB: true, // in play mode only load in data which has changed
    useIndexedDB: false // enable firebase indexedDB (currently this seems buggy)
  },
  FDG: {
    nodeSpritePath: 'textures/dot.png', // path to node texture
    nodeUpdatedSpritePath: 'textures/dot-concentric.png', // path to node updated state texture
    fontTexturePath: 'textures/UbuntuMono.png', // path to font texture
    autoPlay: false,
    delayAmount: 0, // time in between new commits being added to the graph
    sphereProject: 1, // project graph onto sphere? 1 == true, 0 == false
    usePicker: true, // show file commit details on click
    pickerLoadingPath: '/assets/images/loading.svg', // show file commit details on click
    sphereRadius: 250, // radius of sphere if in sphere projection mode
    showFilePaths: false, // display filepath overlay on nodes
    colorCooldownSpeed: 0.05, // speed at which node colors cycle
    cycleColors: false, // cycle colors based on file edit time from red to blue to white
    colorPalette: [ // colors to use if cycleColors is switched off (colors cannot contain)
      '#ff5454',
      '#3b7882',
      '#0033ad',
      '#0033ad'
      // '#ffffff',
      // '#ffffff'
    ],
    nodeCount: 2500, // max number of nodes the scene can contain
    filePathCharLimit: 20, // speed at which node colors cycle
    focusPlaneOffset: 250
  },
  scene: {
    fullScreen: true,
    width: window.innerWidth,
    height: window.innerHeight,
    bgColor: 0xFDFDFB,
    // bgColor: 0x0033ad,
    antialias: false,
    canvasID: 'medusa-stage', // ID of webgl canvas element
    autoRotate: false, // auto rotate camera around target
    autoRotateSpeed: 0.001 // speed of auto rotation
  },
  post: {
    vignette: false
  },
  camera: {
    fov: 45,
    initPos: { x: 0, y: 0, z: 600 },
    enableZoom: true, // enable camera zoom on mousewheel/pinch gesture
    zPosMinimized: 1600
  },
  dev: {
    debugPicker: false
  },
  floatType: detector.isIOS ? HalfFloatType : FloatType,
  GPUTier: GPUTier
}

export default Config

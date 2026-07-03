import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import GUI from 'lil-gui'
import { createRagingSeaMaterial } from './materials/ragingSeaMaterial'
import { PRAY_GLB_BASE64 } from './models/prayModelData'

const defaultSelector = '.canvas-wrapper'
const dracoDecoderUrl = 'https://www.gstatic.com/draco/v1/decoders/'
const storageKey = 'prayx-venezuela-scene-config-v1'

class PrayScene {
	constructor() {
		this.wrapper = null
		this.renderer = null
		this.scene = null
		this.camera = null
		this.model = null
		this.sceneGroup = null
		this.modelGroup = null
		this.videoElement = null
		this.videoTexture = null
		this.videoMaterial = null
		this.videoFrameSize = new THREE.Vector2(16, 9)
		this.videoMeshBoundsMin = new THREE.Vector2(-1, -1)
		this.videoMeshBoundsSize = new THREE.Vector2(2, 2)
		this.floorMaterial = null
		this.volumetricGroup = null
		this.volumetricMaterial = null
		this.volumetricTexture = null
		this.volumetricSpotLight = null
		this.volumetricSpotLightTarget = null
		this.voidBackdrop = null
		this.voidBackdropMaterial = null
		this.rainGroup = null
		this.rainMesh = null
		this.rainGeometry = null
		this.rainMaterial = null
		this.rainDrops = []
		this.rainDummy = new THREE.Object3D()
		this.meshScaleBases = new Map()
		this.meshPositionBases = new Map()
		this.loader = null
		this.dracoLoader = null
		this.gui = null
		this.resizeObserver = null
		this.rafId = null
		this.timer = new THREE.Timer()
		this.timer.connect(document)
		this.cameraBasePosition = new THREE.Vector3(0, 0.2, 7)
		this.cameraLookAt = new THREE.Vector3(0, 0, 0)
		this.targetPointerOffset = new THREE.Vector2()
		this.targetDeviceOffset = new THREE.Vector2()
		this.combinedCameraOffset = new THREE.Vector2()
		this.currentCameraOffset = new THREE.Vector2()
		this.hasDeviceOrientationListener = false
		this.deviceOrientationPermissionRequested = false
		this.parameters = this.loadParameters({
			backgroundColor: '#101413',
			voidEnabled: true,
			voidColor: '#000000',
			voidOpacity: 0.68,
			voidScale: 24,
			voidZ: -8,
			groupX: 0,
			groupY: 0,
			groupZ: 0,
			groupRotationY: 0,
			groupScale: 1,
			videoMeshX: 0,
			videoMeshY: 0,
			videoMeshZ: 0,
			videoMeshScale: 1,
			videoOpacity: 1,
			videoEmissiveIntensity: 0.85,
			videoGrayscale: 1,
			videoToneMapped: false,
			floorX: 0,
			floorY: 0,
			floorZ: 0,
			floorScale: 1,
			seaDepthColor: '#032f46',
			seaSurfaceColor: '#9bd8ff',
			seaBigWavesElevation: 0.2,
			seaBigWavesFrequencyX: 4,
			seaBigWavesFrequencyY: 1.5,
			seaBigWavesSpeed: 0.75,
			seaSmallWavesElevation: 0.15,
			seaSmallWavesFrequency: 3,
			seaSmallWavesSpeed: 0.2,
			seaSmallIterations: 4,
			seaColorOffset: 0.08,
			seaColorMultiplier: 5,
			seaEdgeFadeEnabled: true,
			seaEdgeFadeSoftness: 0.22,
			cameraX: 0,
			cameraY: 0.2,
			cameraZ: 7,
			cameraFov: 32,
			pointerParallaxEnabled: true,
			pointerStrengthX: 0.45,
			pointerStrengthY: 0.28,
			deviceParallaxEnabled: true,
			deviceStrengthX: 0.42,
			deviceStrengthY: 0.26,
			fogEnabled: true,
			fogColor: '#101413',
			fogDensity: 0.045,
			volumetricEnabled: true,
			volumetricColor: '#d9f2ff',
			volumetricOpacity: 0.055,
			volumetricX: -1.4,
			volumetricY: 2.7,
			volumetricZ: -2.2,
			volumetricRotationX: -0.52,
			volumetricRotationY: 0.18,
			volumetricRotationZ: -0.28,
			volumetricScaleX: 1.2,
			volumetricScaleY: 4.8,
			volumetricScaleZ: 1.2,
			volumetricPulse: 0.025,
			volumetricSpotIntensity: 0.75,
			volumetricSpotDistance: 10,
			volumetricSpotAngle: 0.46,
			volumetricSpotPenumbra: 0.92,
			rainEnabled: true,
			rainCount: 700,
			rainColor: '#b9dfff',
			rainOpacity: 0.34,
			rainSpeed: 7.5,
			rainLength: 0.72,
			rainRadius: 0.008,
			rainSpreadX: 14,
			rainSpreadY: 9,
			rainSpreadZ: 12,
			rainWindX: -0.58,
			rainWindZ: 0.14,
		})

		this.handlePointerMove = this.handlePointerMove.bind(this)
		this.handlePointerLeave = this.handlePointerLeave.bind(this)
		this.handleTouchMove = this.handleTouchMove.bind(this)
		this.handleDeviceOrientation = this.handleDeviceOrientation.bind(this)
		this.requestDeviceOrientationPermission = this.requestDeviceOrientationPermission.bind(this)
		this.resize = this.resize.bind(this)
		this.animate = this.animate.bind(this)
	}

	mount(selector = defaultSelector) {
		const wrapper = document.querySelector(selector)

		if (!wrapper) {
			this.unmount()
			return
		}

		this.wrapper = wrapper
		this.prepareWrapper()
		this.initScene()
		this.attachRenderer()
		this.setupInteractionListeners()
		this.observeWrapper()
		this.resize()
		this.loadModel()
		this.start()
	}

	prepareWrapper() {
		const computed = window.getComputedStyle(this.wrapper)

		if (computed.position === 'static') {
			this.wrapper.style.position = 'relative'
		}

		if (this.wrapper.clientHeight === 0) {
			this.wrapper.style.minHeight = '100vh'
		}
	}

	initScene() {
		if (this.renderer) return

		this.scene = new THREE.Scene()
		this.scene.background = new THREE.Color(this.parameters.backgroundColor)

		this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
		this.camera.position.copy(this.cameraBasePosition)

		this.sceneGroup = new THREE.Group()
		this.modelGroup = new THREE.Group()
		this.sceneGroup.add(this.modelGroup)
		this.scene.add(this.sceneGroup)

		this.createLighting()
		this.createVoidBackdrop()
		this.createVolumetricLights()
		this.createRain()
		this.createRenderer()
		this.setupLoader()
		this.setupGui()
	}

	createLighting() {
		const ambientLight = new THREE.AmbientLight('#f7efe4', 1.45)
		const keyLight = new THREE.DirectionalLight('#fff3df', 2.35)
		const rimLight = new THREE.DirectionalLight('#5cc8ff', 1.1)
		const fillLight = new THREE.PointLight('#ff4d4d', 1.4, 12)

		keyLight.position.set(3, 4, 5)
		rimLight.position.set(-4, 2, -3)
		fillLight.position.set(-2.5, -1.5, 3)

		this.scene.add(ambientLight, keyLight, rimLight, fillLight)
	}

	createVolumetricLights() {
		this.volumetricGroup = new THREE.Group()
		this.volumetricTexture = this.createVolumetricTexture()
		this.volumetricMaterial = new THREE.SpriteMaterial({
			map: this.volumetricTexture,
			color: new THREE.Color(this.parameters.volumetricColor),
			opacity: this.parameters.volumetricOpacity,
			transparent: true,
			depthWrite: false,
			depthTest: false,
			blending: THREE.AdditiveBlending,
		})

		const atmosphericGlow = new THREE.Sprite(this.volumetricMaterial)
		this.volumetricGroup.add(atmosphericGlow)
		this.scene.add(this.volumetricGroup)

		this.volumetricSpotLight = new THREE.SpotLight(
			this.parameters.volumetricColor,
			this.parameters.volumetricSpotIntensity,
			this.parameters.volumetricSpotDistance,
			this.parameters.volumetricSpotAngle,
			this.parameters.volumetricSpotPenumbra,
			1.2,
		)
		this.volumetricSpotLightTarget = new THREE.Object3D()
		this.volumetricSpotLightTarget.position.copy(this.cameraLookAt)
		this.volumetricSpotLight.target = this.volumetricSpotLightTarget
		this.scene.add(this.volumetricSpotLight, this.volumetricSpotLightTarget)

		this.updateVolumetricLights()
	}

	createVolumetricTexture() {
		const size = 256
		const canvas = document.createElement('canvas')
		canvas.width = size
		canvas.height = size
		const context = canvas.getContext('2d')
		const gradient = context.createRadialGradient(
			size * 0.5,
			size * 0.42,
			0,
			size * 0.5,
			size * 0.5,
			size * 0.52,
		)

		gradient.addColorStop(0, 'rgba(255, 255, 255, 0.58)')
		gradient.addColorStop(0.24, 'rgba(255, 255, 255, 0.22)')
		gradient.addColorStop(0.56, 'rgba(255, 255, 255, 0.07)')
		gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

		context.fillStyle = gradient
		context.fillRect(0, 0, size, size)

		const texture = new THREE.CanvasTexture(canvas)
		texture.colorSpace = THREE.SRGBColorSpace
		texture.needsUpdate = true
		return texture
	}

	createVoidBackdrop() {
		this.voidBackdropMaterial = new THREE.MeshBasicMaterial({
			color: new THREE.Color(this.parameters.voidColor),
			transparent: true,
			opacity: this.parameters.voidOpacity,
			depthWrite: false,
			depthTest: false,
		})
		this.voidBackdrop = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1, 1, 1),
			this.voidBackdropMaterial,
		)
		this.voidBackdrop.renderOrder = -10
		this.scene.add(this.voidBackdrop)
		this.updateVoidBackdrop()
	}

	createRain() {
		this.disposeRain()

		const count = Math.max(1, Math.floor(this.parameters.rainCount))
		this.rainGroup = new THREE.Group()
		this.rainGeometry = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true)
		this.rainMaterial = new THREE.MeshBasicMaterial({
			color: new THREE.Color(this.parameters.rainColor),
			transparent: true,
			opacity: this.parameters.rainOpacity,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		})
		this.rainMesh = new THREE.InstancedMesh(this.rainGeometry, this.rainMaterial, count)
		this.rainMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
		this.rainMesh.frustumCulled = false

		this.rainDrops = Array.from({ length: count }, (_, index) => ({
			x: (this.seededRandom(index + 11) - 0.5) * this.parameters.rainSpreadX,
			y: (this.seededRandom(index + 23) - 0.5) * this.parameters.rainSpreadY,
			z: (this.seededRandom(index + 37) - 0.5) * this.parameters.rainSpreadZ,
			speed: 0.72 + this.seededRandom(index + 53) * 0.68,
			phase: this.seededRandom(index + 71),
		}))

		this.rainGroup.add(this.rainMesh)
		this.scene.add(this.rainGroup)
		this.updateRainSettings()
		this.updateRain(0, 0)
	}

	seededRandom(seed) {
		return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1
	}

	createRenderer() {
		this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
			powerPreference: 'high-performance',
		})
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
		this.renderer.outputColorSpace = THREE.SRGBColorSpace
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping
		this.renderer.toneMappingExposure = 1.1

		const canvas = this.renderer.domElement
		canvas.style.position = 'absolute'
		canvas.style.inset = '0'
		canvas.style.display = 'block'
		canvas.style.width = '100%'
		canvas.style.height = '100%'
		canvas.style.touchAction = 'none'
	}

	setupLoader() {
		this.loader = new GLTFLoader()
		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath(dracoDecoderUrl)
		this.loader.setDRACOLoader(this.dracoLoader)
	}

	setupGui() {
		if (this.gui) return

		this.gui = new GUI({ title: 'Pray Scene' })
		const groupFolder = this.gui.addFolder('Scene Group')

		groupFolder
			.addColor(this.parameters, 'backgroundColor')
			.name('Background')
			.onChange(() => this.updateBackground())
		groupFolder
			.add(this.parameters, 'voidEnabled')
			.name('Void Backdrop')
			.onChange(() => this.updateVoidBackdrop())
		groupFolder
			.addColor(this.parameters, 'voidColor')
			.name('Void Color')
			.onChange(() => this.updateVoidBackdrop())
		groupFolder
			.add(this.parameters, 'voidOpacity', 0, 1, 0.001)
			.name('Void Opacity')
			.onChange(() => this.updateVoidBackdrop())
		groupFolder
			.add(this.parameters, 'voidScale', 1, 80, 0.01)
			.name('Void Scale')
			.onChange(() => this.updateVoidBackdrop())
		groupFolder
			.add(this.parameters, 'voidZ', -40, 10, 0.01)
			.name('Void Z')
			.onChange(() => this.updateVoidBackdrop())
		groupFolder
			.add(this.parameters, 'groupX', -15, 15, 0.01)
			.name('Position X')
			.onChange(() => this.updateSceneGroupPosition())
		groupFolder
			.add(this.parameters, 'groupY', -15, 15, 0.01)
			.name('Position Y')
			.onChange(() => this.updateSceneGroupPosition())
		groupFolder
			.add(this.parameters, 'groupZ', -15, 15, 0.01)
			.name('Position Z')
			.onChange(() => this.updateSceneGroupPosition())
		groupFolder
			.add(this.parameters, 'groupRotationY', -Math.PI, Math.PI, 0.01)
			.name('Rotation Y')
			.onChange(() => this.updateSceneGroupRotation())
		groupFolder
			.add(this.parameters, 'groupScale', 0.1, 20, 0.01)
			.name('Scale')
			.onChange(() => this.updateSceneGroupScale())

		const videoMeshFolder = this.gui.addFolder('Video Mesh')
		videoMeshFolder
			.add(this.parameters, 'videoMeshX', -15, 15, 0.01)
			.name('Position X')
			.onChange(() => this.updateMeshPosition('video-mesh', 'videoMesh'))
		videoMeshFolder
			.add(this.parameters, 'videoMeshY', -30, 30, 0.01)
			.name('Position Y')
			.onChange(() => this.updateMeshPosition('video-mesh', 'videoMesh'))
		videoMeshFolder
			.add(this.parameters, 'videoMeshZ', -30, 30, 0.01)
			.name('Position Z')
			.onChange(() => this.updateMeshPosition('video-mesh', 'videoMesh'))
		videoMeshFolder
			.add(this.parameters, 'videoMeshScale', 0.1, 20, 0.01)
			.name('Scale')
			.onChange(() => this.updateMeshScale('video-mesh', this.parameters.videoMeshScale))
		videoMeshFolder
			.add(this.parameters, 'videoOpacity', 0, 1, 0.001)
			.name('Video Opacity')
			.onChange(() => this.updateVideoMaterial())
		videoMeshFolder
			.add(this.parameters, 'videoEmissiveIntensity', 0, 5, 0.01)
			.name('Video Brightness')
			.onChange(() => this.updateVideoMaterial())
		videoMeshFolder
			.add(this.parameters, 'videoGrayscale', 0, 1, 0.001)
			.name('Grayscale')
			.onChange(() => this.updateVideoMaterial())
		videoMeshFolder
			.add(this.parameters, 'videoToneMapped')
			.name('Tone Mapped')
			.onChange(() => this.updateVideoMaterial())

		const floorFolder = this.gui.addFolder('Floor')
		floorFolder
			.add(this.parameters, 'floorX', -15, 15, 0.01)
			.name('Position X')
			.onChange(() => this.updateMeshPosition('floor', 'floor'))
		floorFolder
			.add(this.parameters, 'floorY', -15, 15, 0.01)
			.name('Position Y')
			.onChange(() => this.updateMeshPosition('floor', 'floor'))
		floorFolder
			.add(this.parameters, 'floorZ', -15, 15, 0.01)
			.name('Position Z')
			.onChange(() => this.updateMeshPosition('floor', 'floor'))
		floorFolder
			.add(this.parameters, 'floorScale', 0.1, 20, 0.01)
			.name('Scale')
			.onChange(() => this.updateMeshScale('floor', this.parameters.floorScale))

		const seaFolder = this.gui.addFolder('Raging Sea')
		seaFolder
			.addColor(this.parameters, 'seaDepthColor')
			.name('Depth Color')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.addColor(this.parameters, 'seaSurfaceColor')
			.name('Surface Color')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaBigWavesElevation', 0, 1, 0.001)
			.name('Big Elevation')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaBigWavesFrequencyX', 0, 10, 0.001)
			.name('Big Frequency X')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaBigWavesFrequencyY', 0, 10, 0.001)
			.name('Big Frequency Y')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaBigWavesSpeed', 0, 4, 0.001)
			.name('Big Speed')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaSmallWavesElevation', 0, 1, 0.001)
			.name('Small Elevation')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaSmallWavesFrequency', 0, 30, 0.001)
			.name('Small Frequency')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaSmallWavesSpeed', 0, 4, 0.001)
			.name('Small Speed')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaSmallIterations', 1, 8, 1)
			.name('Small Iterations')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaColorOffset', 0, 1, 0.001)
			.name('Color Offset')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaColorMultiplier', 0, 10, 0.001)
			.name('Color Multiplier')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaEdgeFadeEnabled')
			.name('Fade Edges')
			.onChange(() => this.updateSeaUniforms())
		seaFolder
			.add(this.parameters, 'seaEdgeFadeSoftness', 0.001, 0.5, 0.001)
			.name('Edge Softness')
			.onChange(() => this.updateSeaUniforms())

		const cameraFolder = this.gui.addFolder('Camera')
		cameraFolder
			.add(this.parameters, 'cameraX', -15, 15, 0.01)
			.name('Position X')
			.onChange(() => this.updateCameraSettings())
		cameraFolder
			.add(this.parameters, 'cameraY', -15, 15, 0.01)
			.name('Position Y')
			.onChange(() => this.updateCameraSettings())
		cameraFolder
			.add(this.parameters, 'cameraZ', 0.5, 30, 0.01)
			.name('Position Z')
			.onChange(() => this.updateCameraSettings())
		cameraFolder
			.add(this.parameters, 'cameraFov', 10, 90, 0.1)
			.name('FOV')
			.onChange(() => this.updateCameraSettings())
		cameraFolder
			.add(this.parameters, 'pointerParallaxEnabled')
			.name('Pointer Parallax')
			.onChange(() => this.updateInteractionSettings())
		cameraFolder
			.add(this.parameters, 'pointerStrengthX', 0, 2, 0.001)
			.name('Pointer X')
			.onChange(() => this.updateInteractionSettings())
		cameraFolder
			.add(this.parameters, 'pointerStrengthY', 0, 2, 0.001)
			.name('Pointer Y')
			.onChange(() => this.updateInteractionSettings())
		cameraFolder
			.add(this.parameters, 'deviceParallaxEnabled')
			.name('Device Motion')
			.onChange(() => this.updateInteractionSettings())
		cameraFolder
			.add(this.parameters, 'deviceStrengthX', 0, 2, 0.001)
			.name('Device X')
			.onChange(() => this.updateInteractionSettings())
		cameraFolder
			.add(this.parameters, 'deviceStrengthY', 0, 2, 0.001)
			.name('Device Y')
			.onChange(() => this.updateInteractionSettings())

		const fogFolder = this.gui.addFolder('Fog')
		fogFolder
			.add(this.parameters, 'fogEnabled')
			.name('Enabled')
			.onChange(() => this.updateFog())
		fogFolder
			.addColor(this.parameters, 'fogColor')
			.name('Color')
			.onChange(() => this.updateFog())
		fogFolder
			.add(this.parameters, 'fogDensity', 0, 0.2, 0.001)
			.name('Density')
			.onChange(() => this.updateFog())

		const volumetricFolder = this.gui.addFolder('Volumetric Light')
		volumetricFolder
			.add(this.parameters, 'volumetricEnabled')
			.name('Enabled')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.addColor(this.parameters, 'volumetricColor')
			.name('Color')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricOpacity', 0, 1, 0.001)
			.name('Opacity')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricX', -15, 15, 0.01)
			.name('Position X')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricY', -15, 15, 0.01)
			.name('Position Y')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricZ', -15, 15, 0.01)
			.name('Position Z')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricRotationX', -Math.PI, Math.PI, 0.01)
			.name('Rotation X')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricRotationY', -Math.PI, Math.PI, 0.01)
			.name('Rotation Y')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricRotationZ', -Math.PI, Math.PI, 0.01)
			.name('Rotation Z')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricScaleX', 0.1, 20, 0.01)
			.name('Glow Width')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricScaleY', 0.1, 20, 0.01)
			.name('Glow Height')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricScaleZ', 0.1, 10, 0.01)
			.name('Reserved Depth')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricPulse', 0, 0.5, 0.001)
			.name('Pulse')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricSpotIntensity', 0, 20, 0.01)
			.name('Light Intensity')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricSpotDistance', 1, 30, 0.01)
			.name('Light Distance')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricSpotAngle', 0.05, 1.2, 0.001)
			.name('Light Angle')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricSpotPenumbra', 0, 1, 0.001)
			.name('Light Penumbra')
			.onChange(() => this.updateVolumetricLights())

		const rainFolder = this.gui.addFolder('Rain')
		rainFolder
			.add(this.parameters, 'rainEnabled')
			.name('Enabled')
			.onChange(() => this.updateRainSettings())
		rainFolder
			.add(this.parameters, 'rainCount', 50, 2500, 1)
			.name('Count')
			.onFinishChange(() => this.createRain())
		rainFolder
			.addColor(this.parameters, 'rainColor')
			.name('Color')
			.onChange(() => this.updateRainSettings())
		rainFolder
			.add(this.parameters, 'rainOpacity', 0, 1, 0.001)
			.name('Opacity')
			.onChange(() => this.updateRainSettings())
		rainFolder
			.add(this.parameters, 'rainSpeed', 0, 24, 0.01)
			.name('Speed')
		rainFolder
			.add(this.parameters, 'rainLength', 0.05, 3, 0.01)
			.name('Length')
		rainFolder
			.add(this.parameters, 'rainRadius', 0.001, 0.04, 0.001)
			.name('Radius')
		rainFolder
			.add(this.parameters, 'rainSpreadX', 1, 40, 0.01)
			.name('Spread X')
			.onFinishChange(() => this.createRain())
		rainFolder
			.add(this.parameters, 'rainSpreadY', 1, 30, 0.01)
			.name('Spread Y')
			.onFinishChange(() => this.createRain())
		rainFolder
			.add(this.parameters, 'rainSpreadZ', 1, 40, 0.01)
			.name('Spread Z')
			.onFinishChange(() => this.createRain())
		rainFolder
			.add(this.parameters, 'rainWindX', -5, 5, 0.01)
			.name('Wind X')
		rainFolder
			.add(this.parameters, 'rainWindZ', -5, 5, 0.01)
			.name('Wind Z')

		const actions = {
			copyConfig: () => this.copyParameters(),
			resetSavedConfig: () => {
				window.localStorage.removeItem(storageKey)
				console.info('[PrayScene] saved config cleared. Refresh to return to code defaults.')
			},
		}
		const configFolder = this.gui.addFolder('Config')
		configFolder.add(actions, 'copyConfig').name('Copy Config')
		configFolder.add(actions, 'resetSavedConfig').name('Reset Saved')

		this.gui.onChange(() => this.saveParameters())
		groupFolder.open()
		videoMeshFolder.open()
		floorFolder.open()
		seaFolder.open()
		cameraFolder.open()
		fogFolder.open()
		volumetricFolder.open()
		rainFolder.open()
		configFolder.open()

		this.updateSceneGroupPosition()
		this.updateSceneGroupRotation()
		this.updateSceneGroupScale()
		this.updateBackground()
		this.updateVoidBackdrop()
		this.updateCameraSettings()
		this.updateInteractionSettings()
		this.updateSeaUniforms()
		this.updateFog()
		this.updateVolumetricLights()
		this.updateRainSettings()
		this.saveParameters()
	}

	loadParameters(defaultParameters) {
		try {
			const storedParameters = window.localStorage.getItem(storageKey)
			if (!storedParameters) return defaultParameters

			return {
				...defaultParameters,
				...JSON.parse(storedParameters),
			}
		} catch {
			return defaultParameters
		}
	}

	saveParameters() {
		try {
			const config = { ...this.parameters }

			window.localStorage.setItem(storageKey, JSON.stringify(config, null, 2))
			window.__praySceneConfig = config
		} catch {
			// localStorage can be unavailable in embedded/private contexts.
		}
	}

	copyParameters() {
		const config = JSON.stringify(this.parameters, null, 2)
		console.info('[PrayScene] current config:', config)

		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(config).catch(() => {})
		}
	}

	updateBackground() {
		const backgroundColor = new THREE.Color(this.parameters.backgroundColor)

		if (this.scene) {
			this.scene.background = backgroundColor
		}

		if (this.renderer) {
			this.renderer.setClearColor(backgroundColor, 1)
		}
	}

	updateVoidBackdrop() {
		if (!this.voidBackdrop || !this.voidBackdropMaterial) return

		this.voidBackdrop.visible = this.parameters.voidEnabled
		this.voidBackdrop.position.set(0, 0, this.parameters.voidZ)
		this.voidBackdrop.scale.setScalar(this.parameters.voidScale)
		this.voidBackdropMaterial.color.set(this.parameters.voidColor)
		this.voidBackdropMaterial.opacity = this.parameters.voidOpacity
	}

	updateFog() {
		if (!this.scene) return

		this.scene.fog = this.parameters.fogEnabled
			? new THREE.FogExp2(this.parameters.fogColor, this.parameters.fogDensity)
			: null
	}

	updateVolumetricLights() {
		if (!this.volumetricGroup || !this.volumetricMaterial) return

		this.volumetricGroup.visible = this.parameters.volumetricEnabled
		this.volumetricGroup.position.set(
			this.parameters.volumetricX,
			this.parameters.volumetricY,
			this.parameters.volumetricZ,
		)
		this.volumetricGroup.rotation.set(
			this.parameters.volumetricRotationX,
			this.parameters.volumetricRotationY,
			this.parameters.volumetricRotationZ,
		)
		this.volumetricGroup.scale.set(
			this.parameters.volumetricScaleX,
			this.parameters.volumetricScaleY,
			1,
		)

		this.volumetricMaterial.color.set(this.parameters.volumetricColor)
		this.volumetricMaterial.opacity = this.parameters.volumetricOpacity

		if (this.volumetricSpotLight) {
			this.volumetricSpotLight.visible = this.parameters.volumetricEnabled
			this.volumetricSpotLight.color.set(this.parameters.volumetricColor)
			this.volumetricSpotLight.intensity = this.parameters.volumetricSpotIntensity
			this.volumetricSpotLight.distance = this.parameters.volumetricSpotDistance
			this.volumetricSpotLight.angle = this.parameters.volumetricSpotAngle
			this.volumetricSpotLight.penumbra = this.parameters.volumetricSpotPenumbra
			this.volumetricSpotLight.position.set(
				this.parameters.volumetricX,
				this.parameters.volumetricY,
				this.parameters.volumetricZ,
			)
		}
	}

	updateRainSettings() {
		if (!this.rainGroup || !this.rainMaterial) return

		this.rainGroup.visible = this.parameters.rainEnabled
		this.rainMaterial.color.set(this.parameters.rainColor)
		this.rainMaterial.opacity = this.parameters.rainOpacity
	}

	updateRain(delta, elapsed) {
		if (!this.rainMesh || !this.rainDrops.length) return

		const halfY = this.parameters.rainSpreadY * 0.5
		const fallDistance = Math.max(this.parameters.rainSpreadY, 0.001)
		const direction = new THREE.Vector3(
			this.parameters.rainWindX,
			-1,
			this.parameters.rainWindZ,
		).normalize()
		const quaternion = new THREE.Quaternion().setFromUnitVectors(
			new THREE.Vector3(0, 1, 0),
			direction,
		)

		this.rainDrops.forEach((drop, index) => {
			drop.y -= delta * this.parameters.rainSpeed * drop.speed
			drop.x += delta * this.parameters.rainWindX * drop.speed
			drop.z += delta * this.parameters.rainWindZ * drop.speed

			if (drop.y < -halfY) {
				drop.y += fallDistance
				drop.x = (this.seededRandom(index + 101 + Math.floor(elapsed * 10)) - 0.5) * this.parameters.rainSpreadX
				drop.z = (this.seededRandom(index + 211 + Math.floor(elapsed * 10)) - 0.5) * this.parameters.rainSpreadZ
			}

			this.rainDummy.position.set(drop.x, drop.y, drop.z)
			this.rainDummy.quaternion.copy(quaternion)
			this.rainDummy.scale.set(
				this.parameters.rainRadius,
				this.parameters.rainLength,
				this.parameters.rainRadius,
			)
			this.rainDummy.updateMatrix()
			this.rainMesh.setMatrixAt(index, this.rainDummy.matrix)
		})

		this.rainMesh.instanceMatrix.needsUpdate = true
	}

	disposeRain() {
		if (this.rainMesh) {
			this.rainGroup?.remove(this.rainMesh)
		}

		if (this.rainGroup) {
			this.scene?.remove(this.rainGroup)
		}

		this.rainGeometry?.dispose()
		this.rainMaterial?.dispose()
		this.rainGroup = null
		this.rainMesh = null
		this.rainGeometry = null
		this.rainMaterial = null
		this.rainDrops = []
	}

	updateSceneGroupPosition() {
		if (!this.sceneGroup) return

		this.sceneGroup.position.set(
			this.parameters.groupX,
			this.parameters.groupY,
			this.parameters.groupZ,
		)
	}

	updateSceneGroupScale() {
		if (!this.sceneGroup) return

		this.sceneGroup.scale.setScalar(this.parameters.groupScale)
	}

	updateSceneGroupRotation() {
		if (!this.sceneGroup) return

		this.sceneGroup.rotation.set(
			0,
			this.parameters.groupRotationY,
			0,
		)
	}

	updateMeshScale(meshName, scale) {
		if (!this.model) return

		const mesh = this.model.getObjectByName(meshName)
		const baseScale = this.meshScaleBases.get(meshName)

		if (!mesh || !baseScale) return

		mesh.scale.copy(baseScale).multiplyScalar(scale)

		if (meshName === 'video-mesh') {
			this.updateVideoFrameSize()
		}
	}

	updateMeshPosition(meshName, parameterPrefix) {
		if (!this.model) return

		const mesh = this.model.getObjectByName(meshName)
		const basePosition = this.meshPositionBases.get(meshName)

		if (!mesh || !basePosition) return

		mesh.position.set(
			basePosition.x + this.parameters[`${parameterPrefix}X`],
			basePosition.y + this.parameters[`${parameterPrefix}Y`],
			basePosition.z + this.parameters[`${parameterPrefix}Z`],
		)
	}

	resolveVideoSource() {
		const videoWrap = document.querySelector('.video-wrap[data-video-src]')
		const source =
			videoWrap?.getAttribute('data-video-src') ||
			videoWrap?.dataset?.videoSrc ||
			videoWrap?.querySelector('video source')?.getAttribute('src') ||
			videoWrap?.querySelector('video')?.getAttribute('src')

		if (!source) return ''

		try {
			return new URL(source, window.location.href).href
		} catch {
			return source
		}
	}

	prepareVideoTexture() {
		if (this.videoTexture) return

		const videoSrc = this.resolveVideoSource()

		if (!videoSrc) {
			console.warn('[PrayScene] No video source found on .video-wrap[data-video-src].')
			return
		}

		this.videoElement = document.createElement('video')
		this.videoElement.src = videoSrc
		this.videoElement.crossOrigin = 'anonymous'
		this.videoElement.muted = true
		this.videoElement.loop = true
		this.videoElement.autoplay = true
		this.videoElement.playsInline = true
		this.videoElement.preload = 'auto'
		this.videoElement.setAttribute('playsinline', '')
		this.videoElement.style.display = 'none'

		this.videoElement.addEventListener('loadedmetadata', () => {
			this.updateVideoMaterial()
		})

		this.videoTexture = new THREE.VideoTexture(this.videoElement)
		this.videoTexture.colorSpace = THREE.SRGBColorSpace
		this.videoTexture.minFilter = THREE.LinearFilter
		this.videoTexture.magFilter = THREE.LinearFilter
		this.videoTexture.generateMipmaps = false

		this.videoMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uTexture: { value: this.videoTexture },
				uTextureSize: { value: new THREE.Vector2(16, 9) },
				uQuadSize: { value: this.videoFrameSize.clone() },
				uBoundsMin: { value: this.videoMeshBoundsMin.clone() },
				uBoundsSize: { value: this.videoMeshBoundsSize.clone() },
				uOpacity: { value: this.parameters.videoOpacity },
				uBrightness: { value: this.parameters.videoEmissiveIntensity },
				uGrayscale: { value: this.parameters.videoGrayscale },
			},
			vertexShader: `
				varying vec2 vUv;

				void main()
				{
					vUv = position.xy;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform sampler2D uTexture;
				uniform vec2 uTextureSize;
				uniform vec2 uQuadSize;
				uniform vec2 uBoundsMin;
				uniform vec2 uBoundsSize;
				uniform float uOpacity;
				uniform float uBrightness;
				uniform float uGrayscale;

				varying vec2 vUv;

				vec2 getUV(vec2 uv, vec2 textureSize, vec2 quadSize)
				{
					vec2 tempUV = uv - vec2(0.5);
					float quadAspect = quadSize.x / quadSize.y;
					float textureAspect = textureSize.x / textureSize.y;

					if (quadAspect < textureAspect) {
						tempUV *= vec2(quadAspect / textureAspect, 1.0);
					} else {
						tempUV *= vec2(1.0, textureAspect / quadAspect);
					}

					tempUV += 0.5;
					return tempUV;
				}

				void main()
				{
					vec2 baseUv = (vUv - uBoundsMin) / uBoundsSize;
					vec2 uv = getUV(baseUv, uTextureSize, uQuadSize);
					vec4 videoColor = texture2D(uTexture, uv);
					float grayscale = dot(videoColor.rgb, vec3(0.299, 0.587, 0.114));
					videoColor.rgb = mix(videoColor.rgb, vec3(grayscale), uGrayscale);
					videoColor.rgb *= uBrightness;
					videoColor.a *= uOpacity;

					gl_FragColor = videoColor;
					#include <colorspace_fragment>
				}
			`,
			transparent: this.parameters.videoOpacity < 1,
			toneMapped: this.parameters.videoToneMapped,
			side: THREE.DoubleSide,
		})
		this.videoMaterial.userData.isVideoTextureMaterial = true

		this.videoElement.play().catch(() => {})
		this.updateVideoMaterial()
	}

	applyVideoTexture() {
		const videoMesh = this.model?.getObjectByName('video-mesh')

		if (!videoMesh?.isMesh) return

		this.prepareVideoTexture()
		this.updateVideoFrameSize()

		if (!this.videoMaterial) return

		if (Array.isArray(videoMesh.material)) {
			videoMesh.material.forEach((material) => material.dispose())
		} else {
			videoMesh.material?.dispose()
		}

		videoMesh.material = this.videoMaterial
	}

	updateVideoFrameSize() {
		const videoMesh = this.model?.getObjectByName('video-mesh')

		if (!videoMesh?.isMesh || !videoMesh.geometry) return

		videoMesh.geometry.computeBoundingBox()
		const size = videoMesh.geometry.boundingBox.getSize(new THREE.Vector3())
		const width = Math.abs(size.x * videoMesh.scale.x)
		const height = Math.abs(size.y * videoMesh.scale.y)

		if (width > 0 && height > 0) {
			this.videoFrameSize.set(width, height)
			this.videoMeshBoundsMin.set(
				videoMesh.geometry.boundingBox.min.x,
				videoMesh.geometry.boundingBox.min.y,
			)
			this.videoMeshBoundsSize.set(
				Math.max(size.x, 0.0001),
				Math.max(size.y, 0.0001),
			)
		}

		this.updateVideoMaterial()
	}

	updateVideoMaterial() {
		if (!this.videoMaterial) return

		const videoWidth = this.videoElement?.videoWidth || 16
		const videoHeight = this.videoElement?.videoHeight || 9

		this.videoMaterial.uniforms.uTextureSize.value.set(videoWidth, videoHeight)
		this.videoMaterial.uniforms.uQuadSize.value.copy(this.videoFrameSize)
		this.videoMaterial.uniforms.uBoundsMin.value.copy(this.videoMeshBoundsMin)
		this.videoMaterial.uniforms.uBoundsSize.value.copy(this.videoMeshBoundsSize)
		this.videoMaterial.uniforms.uOpacity.value = this.parameters.videoOpacity
		this.videoMaterial.uniforms.uBrightness.value = this.parameters.videoEmissiveIntensity
		this.videoMaterial.uniforms.uGrayscale.value = this.parameters.videoGrayscale
		this.videoMaterial.transparent = this.parameters.videoOpacity < 1
		this.videoMaterial.toneMapped = this.parameters.videoToneMapped
		this.videoMaterial.needsUpdate = true
	}

	updateCameraSettings() {
		if (!this.camera) return

		this.cameraBasePosition.set(
			this.parameters.cameraX,
			this.parameters.cameraY,
			this.parameters.cameraZ,
		)
		this.camera.fov = this.parameters.cameraFov
		this.camera.updateProjectionMatrix()
	}

	updateSeaUniforms() {
		if (!this.floorMaterial) return

		const uniforms = this.floorMaterial.uniforms
		uniforms.uBigWavesElevation.value = this.parameters.seaBigWavesElevation
		uniforms.uBigWavesFrequency.value.set(
			this.parameters.seaBigWavesFrequencyX,
			this.parameters.seaBigWavesFrequencyY,
		)
		uniforms.uBigWavesSpeed.value = this.parameters.seaBigWavesSpeed
		uniforms.uSmallWavesElevation.value = this.parameters.seaSmallWavesElevation
		uniforms.uSmallWavesFrequency.value = this.parameters.seaSmallWavesFrequency
		uniforms.uSmallWavesSpeed.value = this.parameters.seaSmallWavesSpeed
		uniforms.uSmallIterations.value = this.parameters.seaSmallIterations
		uniforms.uDepthColor.value.set(this.parameters.seaDepthColor)
		uniforms.uSurfaceColor.value.set(this.parameters.seaSurfaceColor)
		uniforms.uColorOffset.value = this.parameters.seaColorOffset
		uniforms.uColorMultiplier.value = this.parameters.seaColorMultiplier
		uniforms.uEdgeFadeEnabled.value = this.parameters.seaEdgeFadeEnabled ? 1 : 0
		uniforms.uEdgeFadeSoftness.value = this.parameters.seaEdgeFadeSoftness
	}

	attachRenderer() {
		if (this.renderer.domElement.parentNode === this.wrapper) return
		this.wrapper.appendChild(this.renderer.domElement)
	}

	setupInteractionListeners() {
		window.addEventListener('pointermove', this.handlePointerMove, { passive: true })
		window.addEventListener('touchmove', this.handleTouchMove, { passive: true })
		window.addEventListener('blur', this.handlePointerLeave)
		document.addEventListener('mouseleave', this.handlePointerLeave)
		this.wrapper.addEventListener('pointerdown', this.requestDeviceOrientationPermission, { passive: true })
		this.wrapper.addEventListener('touchend', this.requestDeviceOrientationPermission, { passive: true })

		this.updateInteractionSettings()
	}

	updateInteractionSettings() {
		if (!this.parameters.pointerParallaxEnabled) {
			this.targetPointerOffset.set(0, 0)
		}

		if (!this.parameters.deviceParallaxEnabled) {
			this.targetDeviceOffset.set(0, 0)
			this.removeDeviceOrientationListener()
			return
		}

		this.addDeviceOrientationListener()
	}

	addDeviceOrientationListener() {
		if (this.hasDeviceOrientationListener || !window.DeviceOrientationEvent) return

		window.addEventListener('deviceorientation', this.handleDeviceOrientation, { passive: true })
		this.hasDeviceOrientationListener = true
	}

	removeDeviceOrientationListener() {
		if (!this.hasDeviceOrientationListener) return

		window.removeEventListener('deviceorientation', this.handleDeviceOrientation)
		this.hasDeviceOrientationListener = false
	}

	async requestDeviceOrientationPermission() {
		if (
			this.deviceOrientationPermissionRequested ||
			!this.parameters.deviceParallaxEnabled ||
			!window.DeviceOrientationEvent ||
			typeof window.DeviceOrientationEvent.requestPermission !== 'function'
		) {
			return
		}

		this.deviceOrientationPermissionRequested = true

		try {
			const permission = await window.DeviceOrientationEvent.requestPermission()
			if (permission === 'granted') {
				this.addDeviceOrientationListener()
			}
		} catch {
			this.targetDeviceOffset.set(0, 0)
		}
	}

	observeWrapper() {
		if (!this.resizeObserver) {
			this.resizeObserver = new ResizeObserver(this.resize)
		}

		this.resizeObserver.disconnect()
		this.resizeObserver.observe(this.wrapper)
	}

	loadModel() {
		if (this.model) return

		this.loader.parse(
			this.decodeBase64ToArrayBuffer(PRAY_GLB_BASE64),
			'',
			(gltf) => {
				this.model = gltf.scene
				this.prepareModel(this.model)
				this.modelGroup.add(this.model)
			},
			(error) => {
				console.error('[PrayScene] Could not load pray.glb', error)
			},
		)
	}

	decodeBase64ToArrayBuffer(base64String) {
		const binaryString = window.atob(base64String)
		const byteLength = binaryString.length
		const bytes = new Uint8Array(byteLength)

		for (let index = 0; index < byteLength; index += 1) {
			bytes[index] = binaryString.charCodeAt(index)
		}

		return bytes.buffer
	}

	prepareModel(model) {
		model.updateWorldMatrix(true, true)
		const bounds = new THREE.Box3().setFromObject(model)
		const center = bounds.getCenter(new THREE.Vector3())
		const size = bounds.getSize(new THREE.Vector3())
		const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
		const targetSize = 4.3

		model.position.sub(center)
		model.scale.setScalar(targetSize / maxDimension)
		model.rotation.set(0.08, -0.36, 0)

		model.traverse((child) => {
			if (!child.isMesh) return

			this.meshScaleBases.set(child.name, child.scale.clone())
			this.meshPositionBases.set(child.name, child.position.clone())
			child.castShadow = true
			child.receiveShadow = true

			if (child.material?.isMeshStandardMaterial) {
				child.material.roughness = Math.min(child.material.roughness ?? 0.55, 0.62)
				child.material.metalness = child.material.metalness ?? 0.08
				child.material.needsUpdate = true
			}
		})

		this.updateMeshPosition('video-mesh', 'videoMesh')
		this.updateMeshScale('video-mesh', this.parameters.videoMeshScale)
		this.applyVideoTexture()
		this.updateMeshPosition('floor', 'floor')
		this.updateMeshScale('floor', this.parameters.floorScale)
		this.prepareFloorSea()
	}

	prepareFloorSea() {
		const floor = this.model?.getObjectByName('floor')

		if (!floor?.isMesh) return

		floor.geometry?.dispose()
		floor.geometry = new THREE.PlaneGeometry(2, 2, 256, 256)
		floor.geometry.rotateX(-Math.PI * 0.5)

		if (Array.isArray(floor.material)) {
			floor.material.forEach((material) => material.dispose())
		} else {
			floor.material?.dispose()
		}

		this.floorMaterial = createRagingSeaMaterial(this.parameters)
		floor.material = this.floorMaterial
		this.updateSeaUniforms()
	}

	resize() {
		if (!this.wrapper || !this.renderer || !this.camera) return

		const width = Math.max(1, Math.floor(this.wrapper.clientWidth || window.innerWidth))
		const height = Math.max(1, Math.floor(this.wrapper.clientHeight || window.innerHeight))

		this.renderer.setSize(width, height, false)
		this.camera.aspect = width / height
		this.camera.updateProjectionMatrix()
	}

	handlePointerMove(event) {
		if (!this.parameters.pointerParallaxEnabled) return

		this.updatePointerOffset(event.clientX, event.clientY)
	}

	handleTouchMove(event) {
		if (!this.parameters.pointerParallaxEnabled || !event.touches?.length) return

		const touch = event.touches[0]
		this.updatePointerOffset(touch.clientX, touch.clientY)
	}

	updatePointerOffset(clientX, clientY) {
		if (!this.wrapper) return

		const rect = this.wrapper.getBoundingClientRect()
		const normalizedX = THREE.MathUtils.clamp(
			((clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2,
			-1,
			1,
		)
		const normalizedY = THREE.MathUtils.clamp(
			((clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2,
			-1,
			1,
		)

		this.targetPointerOffset.set(
			normalizedX * this.parameters.pointerStrengthX,
			normalizedY * -this.parameters.pointerStrengthY,
		)
	}

	handlePointerLeave() {
		this.targetPointerOffset.set(0, 0)
	}

	handleDeviceOrientation(event) {
		if (!this.parameters.deviceParallaxEnabled) return

		const gamma = THREE.MathUtils.clamp(event.gamma || 0, -35, 35) / 35
		const beta = THREE.MathUtils.clamp((event.beta || 0) - 45, -35, 35) / 35

		this.targetDeviceOffset.set(
			gamma * this.parameters.deviceStrengthX,
			beta * -this.parameters.deviceStrengthY,
		)
	}

	start() {
		if (this.rafId) return

		this.animate()
	}

	animate(timestamp) {
		this.rafId = requestAnimationFrame(this.animate)

		this.timer.update(timestamp)
		const elapsed = this.timer.getElapsed()
		const delta = this.timer.getDelta()
		this.combinedCameraOffset.set(
			this.targetPointerOffset.x + this.targetDeviceOffset.x,
			this.targetPointerOffset.y + this.targetDeviceOffset.y,
		)
		this.currentCameraOffset.lerp(this.combinedCameraOffset, 0.075)

		if (this.floorMaterial) {
			this.floorMaterial.uniforms.uTime.value = elapsed
		}

		if (this.volumetricMaterial) {
			this.volumetricMaterial.opacity =
				this.parameters.volumetricOpacity *
				(1 + Math.sin(elapsed * 0.38) * this.parameters.volumetricPulse)
		}

		this.updateRain(delta, elapsed)

		if (this.camera) {
			this.camera.position.set(
				this.cameraBasePosition.x + this.currentCameraOffset.x,
				this.cameraBasePosition.y + this.currentCameraOffset.y,
				this.cameraBasePosition.z,
			)
			this.camera.lookAt(this.cameraLookAt)
		}

		this.renderer.render(this.scene, this.camera)
	}

	unmount() {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}

		if (this.resizeObserver && this.wrapper) {
			this.resizeObserver.unobserve(this.wrapper)
		}

		if (this.renderer?.domElement) {
			this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement)
		}

		window.removeEventListener('pointermove', this.handlePointerMove)
		window.removeEventListener('touchmove', this.handleTouchMove)
		window.removeEventListener('blur', this.handlePointerLeave)
		document.removeEventListener('mouseleave', this.handlePointerLeave)
		this.wrapper?.removeEventListener('pointerdown', this.requestDeviceOrientationPermission)
		this.wrapper?.removeEventListener('touchend', this.requestDeviceOrientationPermission)
		this.removeDeviceOrientationListener()

		this.model?.traverse((child) => {
			if (!child.isMesh) return
			child.geometry?.dispose()
			if (Array.isArray(child.material)) {
				child.material.forEach((material) => {
					if (!material.userData?.isVideoTextureMaterial) material.dispose()
				})
			} else {
				if (!child.material?.userData?.isVideoTextureMaterial) child.material?.dispose()
			}
		})

		this.dracoLoader?.dispose()
		this.timer?.dispose()
		this.gui?.destroy()
		this.videoElement?.pause()
		this.videoElement?.removeAttribute('src')
		this.videoElement?.load()
		this.videoTexture?.dispose()
		this.videoMaterial?.dispose()
		this.disposeRain()
		this.volumetricGroup?.traverse((child) => {
			if (!child.isMesh) return
			child.geometry?.dispose()
		})
		this.volumetricMaterial?.dispose()
		this.volumetricTexture?.dispose()
		this.voidBackdrop?.geometry?.dispose()
		this.voidBackdropMaterial?.dispose()
		this.volumetricSpotLight = null
		this.volumetricSpotLightTarget = null
		this.renderer?.dispose()

		this.wrapper = null
		this.renderer = null
		this.scene = null
		this.camera = null
		this.model = null
		this.sceneGroup = null
		this.modelGroup = null
		this.videoElement = null
		this.videoTexture = null
		this.videoMaterial = null
		this.floorMaterial = null
		this.volumetricGroup = null
		this.volumetricMaterial = null
		this.volumetricTexture = null
		this.voidBackdrop = null
		this.voidBackdropMaterial = null
		this.timer = null
		this.meshScaleBases.clear()
		this.meshPositionBases.clear()
		this.loader = null
		this.dracoLoader = null
		this.gui = null
	}
}

export default new PrayScene()

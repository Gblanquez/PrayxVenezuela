import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import GUI from 'lil-gui'
import { createRagingSeaMaterial } from './materials/ragingSeaMaterial'
import prayModelUrl from '../static/pray.glb?url'

const defaultSelector = '.canvas-wrapper'
const dracoDecoderUrl = 'https://www.gstatic.com/draco/v1/decoders/'
const storageKey = 'prayx-venezuela-scene-config-v5'

class PrayScene {
	constructor() {
		this.wrapper = null
		this.renderer = null
		this.scene = null
		this.camera = null
		this.model = null
		this.sceneGroup = null
		this.modelGroup = null
		this.videoGroup = null
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
		this.spotLight = null
		this.spotLightTarget = null
		this.voidBackdrop = null
		this.voidBackdropMaterial = null
		this.rainGroup = null
		this.rainMesh = null
		this.rainGeometry = null
		this.rainMaterial = null
		this.rainDrops = []
		this.rainDummy = new THREE.Object3D()
		this.rainRippleIndex = 0
		this.rainRippleVectors = Array.from({ length: 16 }, () => new THREE.Vector3(0, 0, -1000))
		this.holderImpactMesh = null
		this.holderImpactGeometry = null
		this.holderImpactMaterial = null
		this.holderImpacts = []
		this.holderImpactIndex = 0
		this.holderImpactDummy = new THREE.Object3D()
		this.floorBounds = new THREE.Box3()
		this.videoGroupBounds = new THREE.Box3()
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
		this.cameraFocusTarget = new THREE.Vector3()
		this.targetPointerOffset = new THREE.Vector2()
		this.targetDeviceOffset = new THREE.Vector2()
		this.combinedCameraOffset = new THREE.Vector2()
		this.currentCameraOffset = new THREE.Vector2()
		this.hasDeviceOrientationListener = false
		this.deviceOrientationPermissionRequested = false
		this.deviceOrientationBase = null
		this.parameters = this.loadParameters({
			backgroundColor: '#000000',
			voidEnabled: true,
			voidColor: '#000000',
			voidOpacity: 0.57,
			voidScale: 80,
			voidZ: -8,
			groupX: 0,
			groupY: 0,
			groupZ: 0,
			groupRotationY: -0.00159265358979299,
			groupScale: 4.59,
			videoMeshX: -4.18,
			videoMeshY: 0,
			videoMeshZ: -6,
			videoMeshRotationY: 0.288407346410207,
			videoMeshScale: 0.4,
			videoOpacity: 0.988,
			videoEmissiveIntensity: 0.14,
			videoGrayscale: 1,
			videoRotation: -0.00159265358979299,
			videoToneMapped: true,
			floorX: 0,
			floorY: 4.67,
			floorZ: 0,
			floorScale: 20,
			seaDepthColor: '#7a000c',
			seaSurfaceColor: '#c7dcff',
			seaBigWavesElevation: 0.041,
			seaBigWavesFrequencyX: 0.412,
			seaBigWavesFrequencyY: 0.781,
			seaBigWavesSpeed: 1.001,
			seaSmallWavesElevation: 0.078,
			seaSmallWavesFrequency: 11.562,
			seaSmallWavesSpeed: 0.361,
			seaSmallIterations: 4,
			seaColorOffset: 0.029,
			seaColorMultiplier: 3.116,
			seaEdgeFadeEnabled: true,
			seaEdgeFadeSoftness: 0.365,
			cameraX: 0,
			cameraY: 0.2,
			cameraZ: 7,
			cameraFov: 35,
			pointerParallaxEnabled: true,
			pointerStrengthX: 0.45,
			pointerStrengthY: 0.28,
			deviceParallaxEnabled: true,
			deviceStrengthX: 0.82,
			deviceStrengthY: 0.92,
			fogEnabled: true,
			fogColor: '#000000',
			fogDensity: 0.048,
			volumetricEnabled: true,
			volumetricColor: '#ffe0e5',
			volumetricOpacity: 0.213,
			volumetricX: 0.99,
			volumetricY: 0.25,
			volumetricZ: 5.78,
			volumetricRotationX: -0.021592653589793,
			volumetricRotationY: 0.208407346410207,
			volumetricRotationZ: -1.41159265358979,
			volumetricScaleX: 50,
			volumetricScaleY: 30,
			volumetricScaleZ: 0.1,
			volumetricPulse: 0.088,
			volumetricCore: 0.307,
			volumetricSoftness: 1.173,
			volumetricFalloff: 1.55,
			volumetricNoise: 0.302,
			volumetricSpotIntensity: 3.04,
			volumetricSpotDistance: 10.04,
			volumetricSpotAngle: 1.2,
			volumetricSpotPenumbra: 0,
			spotLightEnabled: true,
			spotLightColor: '#ffffff',
			spotLightIntensity: 4.51,
			spotLightDistance: 50,
			spotLightAngle: 0.707,
			spotLightPenumbra: 1,
			spotLightDecay: 0,
			spotLightX: 0.330000000000002,
			spotLightY: 8.69,
			spotLightZ: -11.3,
			spotLightTargetX: 0,
			spotLightTargetY: 0,
			spotLightTargetZ: 0.5,
			rainEnabled: true,
			rainCount: 2500,
			rainColor: '#b9dfff',
			rainOpacity: 0.02,
			rainSpeed: 3.94,
			rainLength: 0.15,
			rainRadius: 0.008,
			rainSpreadX: 14,
			rainSpreadY: 9,
			rainSpreadZ: 12,
			rainWindX: -0.16,
			rainWindZ: 0.0800000000000001,
			rainRippleEnabled: true,
			rainRippleStrength: 0.004,
			rainRippleRadius: 0.098,
			rainRippleSpeed: 0.1,
			rainRippleFade: 0.1,
			holderImpactEnabled: true,
			holderImpactColor: '#d8f2ff',
			holderImpactOpacity: 0.029,
			holderImpactSize: 0.016,
			holderImpactFade: 0.23,
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
		this.createHolderImpacts()
		this.createRenderer()
		this.setupLoader()
		this.setupGui()
		this.applyParameters()
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
		this.createSceneSpotLight()
	}

	createSceneSpotLight() {
		this.spotLight = new THREE.SpotLight(
			this.parameters.spotLightColor,
			this.parameters.spotLightIntensity,
			this.parameters.spotLightDistance,
			this.parameters.spotLightAngle,
			this.parameters.spotLightPenumbra,
			this.parameters.spotLightDecay,
		)
		this.spotLightTarget = new THREE.Object3D()
		this.scene.add(this.spotLight, this.spotLightTarget)
		this.spotLight.target = this.spotLightTarget
		this.updateSceneSpotLight()
	}

	createVolumetricLights() {
		this.volumetricGroup = new THREE.Group()
		this.volumetricMaterial = this.createVolumetricShaderMaterial()

		const atmosphericGlow = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1, 1, 1),
			this.volumetricMaterial,
		)
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

	createVolumetricShaderMaterial() {
		return new THREE.ShaderMaterial({
			uniforms: {
				uColor: { value: new THREE.Color(this.parameters.volumetricColor) },
				uOpacity: { value: this.parameters.volumetricOpacity },
				uCore: { value: this.parameters.volumetricCore },
				uSoftness: { value: this.parameters.volumetricSoftness },
				uFalloff: { value: this.parameters.volumetricFalloff },
				uNoise: { value: this.parameters.volumetricNoise },
			},
			vertexShader: `
				varying vec2 vUv;

				void main()
				{
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform vec3 uColor;
				uniform float uOpacity;
				uniform float uCore;
				uniform float uSoftness;
				uniform float uFalloff;
				uniform float uNoise;

				varying vec2 vUv;

				float hash(vec2 point)
				{
					return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
				}

				void main()
				{
					vec2 centeredUv = vUv - vec2(0.5);
					centeredUv.y *= 0.82;

					float radius = length(centeredUv);
					float core = 1.0 - smoothstep(uCore, max(uCore + uSoftness, uCore + 0.001), radius);
					float verticalFade = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.78, 1.0, vUv.y));
					float edgeFade = smoothstep(0.5, 0.02, radius);
					float grain = mix(1.0, hash(vUv * 256.0), uNoise);
					float alpha = pow(max(core, 0.0), uFalloff) * verticalFade * edgeFade * grain * uOpacity;

					gl_FragColor = vec4(uColor, alpha);
					#include <colorspace_fragment>
				}
			`,
			transparent: true,
			depthWrite: false,
			depthTest: false,
			blending: THREE.AdditiveBlending,
		})
	}

	createVolumetricTexture() {
		const size = 256
		const canvas = document.createElement('canvas')
		canvas.width = size
		canvas.height = size
		const context = canvas.getContext('2d')
		const softGlow = context.createRadialGradient(
			size * 0.5,
			size * 0.46,
			size * 0.04,
			size * 0.5,
			size * 0.5,
			size * 0.78,
		)

		softGlow.addColorStop(0, 'rgba(255, 255, 255, 0.42)')
		softGlow.addColorStop(0.18, 'rgba(255, 255, 255, 0.25)')
		softGlow.addColorStop(0.42, 'rgba(255, 255, 255, 0.11)')
		softGlow.addColorStop(0.72, 'rgba(255, 255, 255, 0.025)')
		softGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')

		context.filter = 'blur(18px)'
		context.fillStyle = softGlow
		context.fillRect(-size * 0.12, -size * 0.12, size * 1.24, size * 1.24)
		context.filter = 'none'

		const haze = context.createLinearGradient(0, 0, 0, size)
		haze.addColorStop(0, 'rgba(255, 255, 255, 0)')
		haze.addColorStop(0.35, 'rgba(255, 255, 255, 0.055)')
		haze.addColorStop(0.62, 'rgba(255, 255, 255, 0.035)')
		haze.addColorStop(1, 'rgba(255, 255, 255, 0)')

		context.globalCompositeOperation = 'lighter'
		context.fillStyle = haze
		context.fillRect(0, 0, size, size)
		context.globalCompositeOperation = 'source-over'

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

	createHolderImpacts() {
		const count = 72

		this.holderImpactGeometry = new THREE.SphereGeometry(1, 8, 6)
		this.holderImpactMaterial = new THREE.MeshBasicMaterial({
			color: new THREE.Color(this.parameters.holderImpactColor),
			transparent: true,
			opacity: this.parameters.holderImpactOpacity,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		})
		this.holderImpactMesh = new THREE.InstancedMesh(
			this.holderImpactGeometry,
			this.holderImpactMaterial,
			count,
		)
		this.holderImpactMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
		this.holderImpactMesh.frustumCulled = false
		this.holderImpactMesh.visible = this.parameters.holderImpactEnabled
		this.holderImpacts = Array.from({ length: count }, () => ({
			active: false,
			x: 0,
			y: 0,
			z: 0,
			time: -1000,
			scale: 0,
		}))

		this.scene.add(this.holderImpactMesh)
		this.updateHolderImpacts(0)
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
		if (window.location.hash !== '#debug') return

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

		const videoMeshFolder = this.gui.addFolder('Video Group')
		videoMeshFolder
			.add(this.parameters, 'videoMeshX', -15, 15, 0.01)
			.name('Position X')
			.onChange(() => this.updateVideoGroupPosition())
		videoMeshFolder
			.add(this.parameters, 'videoMeshY', -30, 30, 0.01)
			.name('Position Y')
			.onChange(() => this.updateVideoGroupPosition())
		videoMeshFolder
			.add(this.parameters, 'videoMeshZ', -30, 30, 0.01)
			.name('Position Z')
			.onChange(() => this.updateVideoGroupPosition())
		videoMeshFolder
			.add(this.parameters, 'videoMeshRotationY', -Math.PI, Math.PI, 0.01)
			.name('Rotation Y')
			.onChange(() => this.updateVideoGroupRotation())
		videoMeshFolder
			.add(this.parameters, 'videoMeshScale', 0.1, 20, 0.01)
			.name('Scale')
			.onChange(() => this.updateVideoGroupScale())
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
			.add(this.parameters, 'videoRotation', -Math.PI, Math.PI, 0.01)
			.name('Video Rotation')
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
			.add(this.parameters, 'volumetricScaleX', 0.1, 50, 0.01)
			.name('Glow Width')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricScaleY', 0.1, 30, 0.01)
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
			.add(this.parameters, 'volumetricCore', 0.01, 0.5, 0.001)
			.name('Shader Core')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricSoftness', 0.02, 1.5, 0.001)
			.name('Shader Softness')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricFalloff', 0.2, 5, 0.001)
			.name('Shader Falloff')
			.onChange(() => this.updateVolumetricLights())
		volumetricFolder
			.add(this.parameters, 'volumetricNoise', 0, 0.4, 0.001)
			.name('Shader Noise')
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

		const spotLightFolder = this.gui.addFolder('Spotlight')
		spotLightFolder
			.add(this.parameters, 'spotLightEnabled')
			.name('Enabled')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.addColor(this.parameters, 'spotLightColor')
			.name('Color')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightIntensity', 0, 20, 0.01)
			.name('Intensity')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightDistance', 0, 50, 0.01)
			.name('Distance')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightAngle', 0.01, Math.PI / 2, 0.001)
			.name('Angle')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightPenumbra', 0, 1, 0.001)
			.name('Penumbra')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightDecay', 0, 4, 0.01)
			.name('Decay')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightX', -20, 20, 0.01)
			.name('Position X')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightY', -20, 20, 0.01)
			.name('Position Y')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightZ', -30, 30, 0.01)
			.name('Position Z')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightTargetX', -20, 20, 0.01)
			.name('Target X')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightTargetY', -20, 20, 0.01)
			.name('Target Y')
			.onChange(() => this.updateSceneSpotLight())
		spotLightFolder
			.add(this.parameters, 'spotLightTargetZ', -30, 30, 0.01)
			.name('Target Z')
			.onChange(() => this.updateSceneSpotLight())

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
		rainFolder
			.add(this.parameters, 'rainRippleEnabled')
			.name('Sea Ripples')
			.onChange(() => this.updateSeaUniforms())
		rainFolder
			.add(this.parameters, 'rainRippleStrength', 0, 0.24, 0.001)
			.name('Ripple Strength')
			.onChange(() => this.updateSeaUniforms())
		rainFolder
			.add(this.parameters, 'rainRippleRadius', 0.02, 1.2, 0.001)
			.name('Ripple Width')
			.onChange(() => this.updateSeaUniforms())
		rainFolder
			.add(this.parameters, 'rainRippleSpeed', 0.1, 5, 0.01)
			.name('Ripple Speed')
			.onChange(() => this.updateSeaUniforms())
		rainFolder
			.add(this.parameters, 'rainRippleFade', 0.1, 4, 0.01)
			.name('Ripple Fade')
			.onChange(() => this.updateSeaUniforms())
		rainFolder
			.add(this.parameters, 'holderImpactEnabled')
			.name('Holder Hits')
			.onChange(() => this.updateHolderImpactSettings())
		rainFolder
			.addColor(this.parameters, 'holderImpactColor')
			.name('Hit Color')
			.onChange(() => this.updateHolderImpactSettings())
		rainFolder
			.add(this.parameters, 'holderImpactOpacity', 0, 1, 0.001)
			.name('Hit Opacity')
			.onChange(() => this.updateHolderImpactSettings())
		rainFolder
			.add(this.parameters, 'holderImpactSize', 0.01, 0.4, 0.001)
			.name('Hit Size')
		rainFolder
			.add(this.parameters, 'holderImpactFade', 0.05, 2, 0.01)
			.name('Hit Fade')

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
		spotLightFolder.open()
		rainFolder.open()
		configFolder.open()

		this.saveParameters()
	}

	applyParameters() {
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
		this.updateSceneSpotLight()
		this.updateRainSettings()
		this.updateHolderImpactSettings()
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

		this.volumetricMaterial.uniforms.uColor.value.set(this.parameters.volumetricColor)
		this.volumetricMaterial.uniforms.uOpacity.value = this.parameters.volumetricOpacity
		this.volumetricMaterial.uniforms.uCore.value = this.parameters.volumetricCore
		this.volumetricMaterial.uniforms.uSoftness.value = this.parameters.volumetricSoftness
		this.volumetricMaterial.uniforms.uFalloff.value = this.parameters.volumetricFalloff
		this.volumetricMaterial.uniforms.uNoise.value = this.parameters.volumetricNoise

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

	updateSceneSpotLight() {
		if (!this.spotLight || !this.spotLightTarget) return

		this.spotLight.visible = this.parameters.spotLightEnabled
		this.spotLight.color.set(this.parameters.spotLightColor)
		this.spotLight.intensity = this.parameters.spotLightIntensity
		this.spotLight.distance = this.parameters.spotLightDistance
		this.spotLight.angle = this.parameters.spotLightAngle
		this.spotLight.penumbra = this.parameters.spotLightPenumbra
		this.spotLight.decay = this.parameters.spotLightDecay
		this.spotLight.position.set(
			this.parameters.spotLightX,
			this.parameters.spotLightY,
			this.parameters.spotLightZ,
		)
		this.spotLightTarget.position.set(
			this.parameters.spotLightTargetX,
			this.parameters.spotLightTargetY,
			this.parameters.spotLightTargetZ,
		)
		this.spotLightTarget.updateMatrixWorld()
	}

	updateRainSettings() {
		if (!this.rainGroup || !this.rainMaterial) return

		this.rainGroup.visible = this.parameters.rainEnabled
		this.rainMaterial.color.set(this.parameters.rainColor)
		this.rainMaterial.opacity = this.parameters.rainOpacity
	}

	updateHolderImpactSettings() {
		if (!this.holderImpactMesh || !this.holderImpactMaterial) return

		this.holderImpactMesh.visible = this.parameters.holderImpactEnabled
		this.holderImpactMaterial.color.set(this.parameters.holderImpactColor)
		this.holderImpactMaterial.opacity = this.parameters.holderImpactOpacity
	}

	updateRain(delta, elapsed) {
		if (!this.rainMesh || !this.rainDrops.length) return

		const halfY = this.parameters.rainSpreadY * 0.5
		const fallDistance = Math.max(this.parameters.rainSpreadY, 0.001)
		const floorContact = this.getFloorContactData()
		const holderBounds = this.getVideoGroupBounds()
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
			const previousY = drop.y

			drop.y -= delta * this.parameters.rainSpeed * drop.speed
			drop.x += delta * this.parameters.rainWindX * drop.speed
			drop.z += delta * this.parameters.rainWindZ * drop.speed

			if (
				floorContact &&
				previousY >= floorContact.y &&
				drop.y < floorContact.y &&
				drop.x >= floorContact.minX &&
				drop.x <= floorContact.maxX &&
				drop.z >= floorContact.minZ &&
				drop.z <= floorContact.maxZ
			) {
				this.spawnRainRipple(drop.x, drop.z, elapsed)
			}

			if (holderBounds && this.parameters.holderImpactEnabled) {
				drop.hitCooldown = Math.max((drop.hitCooldown ?? 0) - delta, 0)

				if (drop.hitCooldown <= 0 && holderBounds.containsPoint(drop)) {
					this.spawnHolderImpact(drop.x, drop.y, drop.z, elapsed, index)
					drop.hitCooldown = 0.16 + this.seededRandom(index + Math.floor(elapsed * 60)) * 0.26
				}
			}

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
		this.updateHolderImpacts(elapsed)
	}

	getFloorContactData() {
		const floor = this.model?.getObjectByName('floor')

		if (!floor?.isMesh) return null

		this.floorBounds.setFromObject(floor)

		return {
			y: this.floorBounds.max.y,
			minX: this.floorBounds.min.x,
			maxX: this.floorBounds.max.x,
			minZ: this.floorBounds.min.z,
			maxZ: this.floorBounds.max.z,
		}
	}

	getVideoGroupBounds() {
		if (!this.videoGroup) return null

		this.videoGroupBounds.setFromObject(this.videoGroup)
		this.videoGroupBounds.expandByScalar(0.08)

		return this.videoGroupBounds
	}

	spawnRainRipple(x, z, elapsed) {
		if (!this.floorMaterial || !this.parameters.rainRippleEnabled) return

		const ripple = this.rainRippleVectors[this.rainRippleIndex]
		ripple.set(x, z, elapsed)
		this.rainRippleIndex = (this.rainRippleIndex + 1) % this.rainRippleVectors.length
		this.floorMaterial.uniforms.uRainRipples.value = this.rainRippleVectors
	}

	spawnHolderImpact(x, y, z, elapsed, seed) {
		if (!this.holderImpactMesh || !this.parameters.holderImpactEnabled) return

		const impact = this.holderImpacts[this.holderImpactIndex]
		impact.active = true
		impact.x = x + (this.seededRandom(seed + 313) - 0.5) * 0.08
		impact.y = y
		impact.z = z + (this.seededRandom(seed + 719) - 0.5) * 0.08
		impact.time = elapsed
		impact.scale = 0.65 + this.seededRandom(seed + 997) * 0.7
		this.holderImpactIndex = (this.holderImpactIndex + 1) % this.holderImpacts.length
	}

	updateHolderImpacts(elapsed) {
		if (!this.holderImpactMesh || !this.holderImpacts.length) return

		const fade = Math.max(this.parameters.holderImpactFade, 0.001)

		this.holderImpacts.forEach((impact, index) => {
			const age = elapsed - impact.time
			const normalizedAge = THREE.MathUtils.clamp(age / fade, 0, 1)
			const life = impact.active ? 1 - normalizedAge : 0
			const scale = this.parameters.holderImpactSize * impact.scale * life

			if (life <= 0) {
				impact.active = false
			}

			this.holderImpactDummy.position.set(impact.x, impact.y, impact.z)
			this.holderImpactDummy.scale.setScalar(scale)
			this.holderImpactDummy.updateMatrix()
			this.holderImpactMesh.setMatrixAt(index, this.holderImpactDummy.matrix)
		})

		this.holderImpactMesh.instanceMatrix.needsUpdate = true
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

	updateVideoGroupScale() {
		if (!this.videoGroup) return

		const baseScale = this.meshScaleBases.get('video-group')

		if (!baseScale) return

		this.videoGroup.scale.copy(baseScale).multiplyScalar(this.parameters.videoMeshScale)
		this.updateVideoFrameSize()
	}

	updateVideoGroupRotation() {
		if (!this.videoGroup) return

		this.videoGroup.rotation.set(0, this.parameters.videoMeshRotationY, 0)
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

	updateVideoGroupPosition() {
		if (!this.videoGroup) return

		const basePosition = this.meshPositionBases.get('video-group')

		if (!basePosition) return

		this.videoGroup.position.set(
			basePosition.x + this.parameters.videoMeshX,
			basePosition.y + this.parameters.videoMeshY,
			basePosition.z + this.parameters.videoMeshZ,
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
				uRotation: { value: this.parameters.videoRotation },
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
				uniform float uRotation;

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
					vec2 centeredUv = uv - vec2(0.5);
					float rotationCos = cos(uRotation);
					float rotationSin = sin(uRotation);
					uv = vec2(
						(centeredUv.x * rotationCos) - (centeredUv.y * rotationSin),
						(centeredUv.x * rotationSin) + (centeredUv.y * rotationCos)
					) + vec2(0.5);
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
		this.videoMaterial.uniforms.uRotation.value = this.parameters.videoRotation
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
		uniforms.uRainRippleStrength.value = this.parameters.rainRippleEnabled
			? this.parameters.rainRippleStrength
			: 0
		uniforms.uRainRippleRadius.value = this.parameters.rainRippleRadius
		uniforms.uRainRippleSpeed.value = this.parameters.rainRippleSpeed
		uniforms.uRainRippleFade.value = this.parameters.rainRippleFade
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
		document.addEventListener('pointerdown', this.requestDeviceOrientationPermission, { passive: true })
		document.addEventListener('touchend', this.requestDeviceOrientationPermission, { passive: true })
		document.addEventListener('click', this.requestDeviceOrientationPermission, { passive: true })

		this.updateInteractionSettings()
	}

	updateInteractionSettings() {
		if (!this.parameters.pointerParallaxEnabled) {
			this.targetPointerOffset.set(0, 0)
		}

		if (!this.parameters.deviceParallaxEnabled) {
			this.targetDeviceOffset.set(0, 0)
			this.deviceOrientationBase = null
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
				this.deviceOrientationBase = null
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

		const modelUrl = this.resolveModelUrl()

		this.loader.load(
			modelUrl,
			(gltf) => {
				this.model = gltf.scene
				this.prepareModel(this.model)
				this.modelGroup.add(this.model)
			},
			undefined,
			(error) => {
				console.error('[PrayScene] Could not load pray.glb', error)
			},
		)
	}

	resolveModelUrl() {
		if (window.PRAYX_MODEL_URL) {
			return window.PRAYX_MODEL_URL
		}

		if (/^(https?:|data:|blob:)/.test(prayModelUrl)) {
			return prayModelUrl
		}

		const scriptUrl = this.resolveScriptUrl()

		if (scriptUrl) {
			return new URL(prayModelUrl, scriptUrl).href
		}

		return prayModelUrl
	}

	resolveScriptUrl() {
		if (document.currentScript?.src) {
			return document.currentScript.src
		}

		const scripts = Array.from(document.scripts)
		const script = scripts.find((item) =>
			item.src.includes('/src/main.js') ||
			item.src.endsWith('/main.js') ||
			item.src.includes('/main.js?')
		)

		return script?.src || window.location.href
	}

	prepareModel(model) {
		model.updateWorldMatrix(true, true)
		const bounds = new THREE.Box3().setFromObject(model)
		const center = bounds.getCenter(new THREE.Vector3())
		const size = bounds.getSize(new THREE.Vector3())
		const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
		const targetSize = 4.3
		const normalizedScale = targetSize / maxDimension

		model.scale.setScalar(normalizedScale)
		model.position.copy(center).multiplyScalar(-normalizedScale)
		model.rotation.set(0.08, -0.36, 0)

		model.traverse((child) => {
			if (!child.isMesh) return

			this.meshScaleBases.set(child.name, child.scale.clone())
			this.meshPositionBases.set(child.name, child.position.clone())
			child.castShadow = true
			child.receiveShadow = true

			this.prepareModelMaterial(child)
		})

		this.createVideoGroup()
		this.updateVideoGroupPosition()
		this.updateVideoGroupRotation()
		this.updateVideoGroupScale()
		this.applyVideoTexture()
		this.updateMeshPosition('floor', 'floor')
		this.updateMeshScale('floor', this.parameters.floorScale)
		this.prepareFloorSea()
	}

	createVideoGroup() {
		const holder = this.model?.getObjectByName('video-holder')
		const videoMesh = this.model?.getObjectByName('video-mesh')

		if (!this.model || !holder || !videoMesh || this.videoGroup) return

		this.model.updateWorldMatrix(true, true)

		const bounds = new THREE.Box3()
			.setFromObject(holder)
			.union(new THREE.Box3().setFromObject(videoMesh))
		const groupCenter = bounds.getCenter(new THREE.Vector3())

		this.videoGroup = new THREE.Group()
		this.videoGroup.name = 'video-group'
		this.videoGroup.position.copy(this.model.worldToLocal(groupCenter.clone()))
		this.model.add(this.videoGroup)

		this.model.updateWorldMatrix(true, true)
		this.videoGroup.updateWorldMatrix(true, true)
		this.videoGroup.attach(holder)
		this.videoGroup.attach(videoMesh)

		this.meshPositionBases.set('video-group', this.videoGroup.position.clone())
		this.meshScaleBases.set('video-group', this.videoGroup.scale.clone())
	}

	prepareModelMaterial(mesh) {
		if (!mesh.material) {
			mesh.material = new THREE.MeshStandardMaterial({
				color: mesh.name === 'video-holder' ? '#161616' : '#f3f0ea',
				roughness: 0.68,
				metalness: 0.04,
				side: THREE.DoubleSide,
			})
			return
		}

		const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

		materials.forEach((material) => {
			material.side = THREE.DoubleSide

			if (material.isMeshStandardMaterial) {
				material.roughness = Math.min(material.roughness ?? 0.55, 0.68)
				material.metalness = material.metalness ?? 0.04

				if (mesh.name === 'video-holder' && !material.map) {
					material.color.set('#161616')
				}
			}

			material.needsUpdate = true
		})
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

		const gamma = event.gamma
		const beta = event.beta

		if (typeof gamma !== 'number' || typeof beta !== 'number') return

		if (!this.deviceOrientationBase) {
			this.deviceOrientationBase = { gamma, beta }
		}

		const relativeGamma = THREE.MathUtils.clamp(gamma - this.deviceOrientationBase.gamma, -20, 20) / 20
		const relativeBeta = THREE.MathUtils.clamp(beta - this.deviceOrientationBase.beta, -14, 14) / 14

		this.targetDeviceOffset.set(
			relativeGamma * this.parameters.deviceStrengthX,
			relativeBeta * -this.parameters.deviceStrengthY,
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
			this.volumetricMaterial.uniforms.uOpacity.value =
				this.parameters.volumetricOpacity *
				(1 + Math.sin(elapsed * 0.38) * this.parameters.volumetricPulse)
		}

		this.updateRain(delta, elapsed)

		if (this.camera) {
			this.cameraFocusTarget.copy(this.cameraLookAt)

			if (this.videoGroup) {
				this.videoGroup.getWorldPosition(this.cameraFocusTarget)
			}

			this.camera.position.set(
				this.cameraBasePosition.x + this.currentCameraOffset.x,
				this.cameraBasePosition.y + this.currentCameraOffset.y,
				this.cameraBasePosition.z,
			)
			this.camera.lookAt(this.cameraFocusTarget)
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
		document.removeEventListener('pointerdown', this.requestDeviceOrientationPermission)
		document.removeEventListener('touchend', this.requestDeviceOrientationPermission)
		document.removeEventListener('click', this.requestDeviceOrientationPermission)
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
		this.holderImpactGeometry?.dispose()
		this.holderImpactMaterial?.dispose()
		this.holderImpactMesh = null
		this.holderImpactGeometry = null
		this.holderImpactMaterial = null
		this.holderImpacts = []
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
		this.spotLight = null
		this.spotLightTarget = null
		this.renderer?.dispose()

		this.wrapper = null
		this.renderer = null
		this.scene = null
		this.camera = null
		this.model = null
		this.sceneGroup = null
		this.modelGroup = null
		this.videoGroup = null
		this.deviceOrientationBase = null
		this.videoElement = null
		this.videoTexture = null
		this.videoMaterial = null
		this.floorMaterial = null
		this.volumetricGroup = null
		this.volumetricMaterial = null
		this.volumetricTexture = null
		this.spotLight = null
		this.spotLightTarget = null
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

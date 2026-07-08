import * as THREE from 'three'

const planeWidth = 1
const planeHeight = 0.59

class AboutTimeline {
	constructor() {
		this.section = null
		this.wrapper = null
		this.scene = null
		this.camera = null
		this.group = null
		this.items = []
		this.raycaster = new THREE.Raycaster()
		this.pointer = new THREE.Vector2()
		this.activeAmount = 0
		this.scrollProgress = 0
		this.targetScroll = 0
		this.currentScroll = 0
		this.previousScroll = 0
		this.scrollVelocity = 0
		this.touchY = 0
		this.selectedItem = null
		this.isEnabled = false
		this.triggers = []
		this.handlePointerDown = this.handlePointerDown.bind(this)
		this.handleTriggerClick = this.handleTriggerClick.bind(this)
		this.handleWheel = this.handleWheel.bind(this)
		this.handleTouchStart = this.handleTouchStart.bind(this)
		this.handleTouchMove = this.handleTouchMove.bind(this)
	}

	mount({ scene, camera, wrapper }) {
		this.section = document.querySelector('.about-section')

		if (!this.section || !scene || !camera || !wrapper) return

		this.scene = scene
		this.camera = camera
		this.wrapper = wrapper
		this.group = new THREE.Group()
		this.group.name = 'about-timeline'
		this.group.visible = false
		this.group.position.set(0, 0.15, 0)
		this.scene.add(this.group)

		this.createItems()
		this.setupTriggers()
		window.addEventListener('pointerdown', this.handlePointerDown, { passive: true })
		window.addEventListener('wheel', this.handleWheel, { passive: false })
		window.addEventListener('touchstart', this.handleTouchStart, { passive: true })
		window.addEventListener('touchmove', this.handleTouchMove, { passive: false })
	}

	setupTriggers() {
		this.triggers = Array.from(document.querySelectorAll('.about-trigger'))
		this.triggers.forEach((trigger) => {
			trigger.addEventListener('click', this.handleTriggerClick)
		})
	}

	handleTriggerClick(event) {
		event.preventDefault()

		this.isEnabled = true
		this.clearSelection()
		const sectionTop = this.section.getBoundingClientRect().top + window.scrollY

		window.scrollTo({
			top: sectionTop,
			behavior: 'smooth',
		})
	}

	createItems() {
		const cmsItems = Array.from(this.section.querySelectorAll('.collection-item'))

		cmsItems.forEach((element, index) => {
			const videoSource = this.resolveVideoSource(element)
			if (!videoSource) return

			const dateElement = element.querySelector('[collection="date"], .collection-content')
			const explanationElement = element.querySelector('.collection-explanation')
			const video = this.createVideoElement(videoSource)
			const texture = new THREE.VideoTexture(video)
			texture.colorSpace = THREE.SRGBColorSpace
			texture.minFilter = THREE.LinearFilter
			texture.magFilter = THREE.LinearFilter
			texture.generateMipmaps = false

			const material = this.createVideoMaterial(texture)
			const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.59, 24, 14), material)
			mesh.name = `about-video-${index}`
			mesh.userData.aboutIndex = index

			const datePlane = this.createDatePlane(dateElement?.textContent?.trim() || '')
			datePlane.position.set(0, 0, 0.02)
			mesh.add(datePlane)

			this.group.add(mesh)

			const item = {
				element,
				explanationElement,
				video,
				texture,
				material,
				mesh,
				datePlane,
				index,
				expandProgress: 0,
			}

			video.addEventListener('loadedmetadata', () => {
				material.uniforms.uTextureSize.value.set(video.videoWidth || 16, video.videoHeight || 9)
			})
			video.play().catch(() => {})
			this.items.push(item)
		})
	}

	resolveVideoSource(element) {
		const videoElement = element.querySelector('.collection-video')
		const source =
			videoElement?.getAttribute('data-video-src') ||
			videoElement?.dataset?.videoSrc ||
			videoElement?.getAttribute('src') ||
			videoElement?.querySelector('source')?.getAttribute('src') ||
			videoElement?.querySelector('video source')?.getAttribute('src') ||
			videoElement?.querySelector('video')?.getAttribute('src')

		if (!source) return ''

		try {
			return new URL(source, window.location.href).href
		} catch {
			return source
		}
	}

	createVideoElement(src) {
		const video = document.createElement('video')
		video.src = src
		video.crossOrigin = 'anonymous'
		video.muted = true
		video.loop = true
		video.autoplay = true
		video.playsInline = true
		video.preload = 'auto'
		video.setAttribute('playsinline', '')
		return video
	}

	createVideoMaterial(texture) {
		return new THREE.ShaderMaterial({
			uniforms: {
				uTexture: { value: texture },
				uTextureSize: { value: new THREE.Vector2(16, 9) },
				uQuadSize: { value: new THREE.Vector2(1, 0.59) },
				uOpacity: { value: 0 },
				uGrayscale: { value: 1 },
				uFogColor: { value: new THREE.Color('#000000') },
				uFogDensity: { value: 0.048 },
				uEdgeFade: { value: 0.18 },
				uTime: { value: 0 },
				uCornerTopLeft: { value: 0 },
				uCornerTopRight: { value: 0 },
				uCornerBottomLeft: { value: 0 },
				uCornerBottomRight: { value: 0 },
				uExpandScale: { value: new THREE.Vector2(1, 1) },
				uExpandTopLeft: { value: 0 },
				uExpandTopRight: { value: 0 },
				uExpandBottomLeft: { value: 0 },
				uExpandBottomRight: { value: 0 },
			},
			vertexShader: `
				varying vec2 vUv;
				varying float vFogDepth;

				uniform float uTime;
				uniform float uCornerTopLeft;
				uniform float uCornerTopRight;
				uniform float uCornerBottomLeft;
				uniform float uCornerBottomRight;
				uniform vec2 uExpandScale;
				uniform float uExpandTopLeft;
				uniform float uExpandTopRight;
				uniform float uExpandBottomLeft;
				uniform float uExpandBottomRight;

				void main()
				{
					vUv = uv;
					float topLeft = (1.0 - uv.x) * uv.y;
					float topRight = uv.x * uv.y;
					float bottomLeft = (1.0 - uv.x) * (1.0 - uv.y);
					float bottomRight = uv.x * (1.0 - uv.y);
					float cornerWave =
						(topLeft * uCornerTopLeft) +
						(topRight * uCornerTopRight) +
						(bottomLeft * uCornerBottomLeft) +
						(bottomRight * uCornerBottomRight);
					float cornerExpand =
						(topLeft * uExpandTopLeft) +
						(topRight * uExpandTopRight) +
						(bottomLeft * uExpandBottomLeft) +
						(bottomRight * uExpandBottomRight);
					float innerWave = sin((uv.x * 5.2) + (uv.y * 4.1) + (uTime * 2.4));
					float edgeMask = 1.0 - smoothstep(0.12, 0.5, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
					vec3 warpedPosition = position;
					warpedPosition.xy = mix(warpedPosition.xy, position.xy * uExpandScale, cornerExpand);
					warpedPosition.z += cornerWave + (innerWave * abs(cornerWave) * 0.34 * edgeMask);
					warpedPosition.xy += normalize(position.xy + vec2(0.0001)) * cornerWave * 0.055 * edgeMask;
					warpedPosition.z += cornerExpand * 0.22;
					warpedPosition.xy += normalize(position.xy + vec2(0.0001)) * cornerExpand * 0.035;
					vec4 modelViewPosition = modelViewMatrix * vec4(warpedPosition, 1.0);
					vFogDepth = -modelViewPosition.z;
					gl_Position = projectionMatrix * modelViewPosition;
				}
			`,
			fragmentShader: `
				uniform sampler2D uTexture;
				uniform vec2 uTextureSize;
				uniform vec2 uQuadSize;
				uniform float uOpacity;
				uniform float uGrayscale;
				uniform vec3 uFogColor;
				uniform float uFogDensity;
				uniform float uEdgeFade;

				varying vec2 vUv;
				varying float vFogDepth;

				vec2 coverUv(vec2 uv, vec2 textureSize, vec2 quadSize)
				{
					vec2 centeredUv = uv - vec2(0.5);
					float quadAspect = quadSize.x / quadSize.y;
					float textureAspect = textureSize.x / textureSize.y;

					if (quadAspect < textureAspect) {
						centeredUv *= vec2(quadAspect / textureAspect, 1.0);
					} else {
						centeredUv *= vec2(1.0, textureAspect / quadAspect);
					}

					return centeredUv + vec2(0.5);
				}

				void main()
				{
					vec4 color = texture2D(uTexture, coverUv(vUv, uTextureSize, uQuadSize));
					float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114));
					color.rgb = mix(color.rgb, vec3(grayscale), uGrayscale);
					vec2 edgeUv = min(vUv, 1.0 - vUv);
					float edgeAlpha = smoothstep(0.0, uEdgeFade, min(edgeUv.x, edgeUv.y));
					float fogAmount = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
					fogAmount = clamp(fogAmount, 0.0, 1.0);
					color.rgb = mix(color.rgb, uFogColor, fogAmount);
					color.a *= uOpacity * edgeAlpha * (1.0 - fogAmount * 0.36);

					gl_FragColor = color;
					#include <colorspace_fragment>
				}
			`,
			transparent: true,
			depthWrite: true,
			depthTest: true,
			side: THREE.DoubleSide,
		})
	}

	createDatePlane(text) {
		const canvas = document.createElement('canvas')
		const width = 512
		const height = 128
		canvas.width = width
		canvas.height = height
		const context = canvas.getContext('2d')

		context.clearRect(0, 0, width, height)
		context.font = '500 44px Arial, sans-serif'
		context.textAlign = 'center'
		context.textBaseline = 'middle'
		context.fillStyle = 'rgba(255, 255, 255, 0.92)'
		context.fillText(text, width * 0.5, height * 0.5)

		const texture = new THREE.CanvasTexture(canvas)
		texture.colorSpace = THREE.SRGBColorSpace

		const material = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
		})
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), material)
		mesh.userData.dateTexture = texture
		return mesh
	}

	handleWheel(event) {
		if (!this.canUseVirtualScroll()) return

		event.preventDefault()
		this.targetScroll += event.deltaY * 0.006
		this.scrollVelocity += event.deltaY * 0.003
	}

	handleTouchStart(event) {
		if (!event.touches?.length) return

		this.touchY = event.touches[0].clientY
	}

	handleTouchMove(event) {
		if (!this.canUseVirtualScroll() || !event.touches?.length) return

		event.preventDefault()
		const nextY = event.touches[0].clientY
		const delta = this.touchY - nextY
		this.targetScroll += delta * 0.018
		this.scrollVelocity += delta * 0.008
		this.touchY = nextY
	}

	canUseVirtualScroll() {
		return this.isEnabled && this.activeAmount > 0.05
	}

	update() {
		if (!this.section || !this.group || !this.items.length) return 0

		const rect = this.section.getBoundingClientRect()
		const viewportHeight = Math.max(window.innerHeight, 1)
		const sectionLength = rect.height + viewportHeight
		const rawProgress = (viewportHeight - rect.top) / sectionLength
		const isVisible = rect.top < viewportHeight && rect.bottom > 0
		const targetAmount = this.isEnabled && isVisible ? 1 : 0

		this.activeAmount += (targetAmount - this.activeAmount) * 0.08
		this.scrollProgress = rawProgress
		this.currentScroll += (this.targetScroll - this.currentScroll) * 0.12
		const scrollDelta = this.currentScroll - this.previousScroll
		this.previousScroll = this.currentScroll
		this.scrollVelocity += scrollDelta * 0.45
		this.scrollVelocity *= 0.86
		this.group.visible = this.activeAmount > 0.01

		const spacing = 4.4
		const travelLength = Math.max(this.items.length * spacing, spacing)
		const scrollDistance = (rawProgress * travelLength) - this.currentScroll
		const waveVelocity = THREE.MathUtils.clamp(this.scrollVelocity, -0.42, 0.42)
		const waveTime = performance.now() * 0.001
		const selectedAmount = this.selectedItem?.expandProgress || 0

		this.items.forEach((item) => {
			const loopedZ = THREE.MathUtils.euclideanModulo(
				item.index * spacing - scrollDistance + travelLength * 10,
				travelLength,
			) - travelLength * 0.5
			const centerFade = 1 - THREE.MathUtils.smoothstep(Math.abs(loopedZ), travelLength * 0.28, travelLength * 0.5)
			const worldZ = loopedZ - 8.5
			const nearFade = THREE.MathUtils.smoothstep(-1.15, -2.75, worldZ)
			const targetExpand = this.selectedItem === item ? 1 : 0
			item.expandProgress += (targetExpand - item.expandProgress) * 0.019
			const selectedBoost = item.expandProgress * 0.55
			const inactiveFade = this.selectedItem && this.selectedItem !== item
				? 1 - selectedAmount
				: 1
			const baseOpacity = this.activeAmount * inactiveFade * nearFade * THREE.MathUtils.clamp(centerFade + selectedBoost, 0, 1)
			const opacity = THREE.MathUtils.lerp(baseOpacity, this.activeAmount, item.expandProgress)
			const scale = 0.95 + centerFade * 0.16
			const x = item.index % 2 === 0 ? -0.9 : 0.9
			const y = 0.1 + centerFade * 0.18
			const expandedPosition = new THREE.Vector3(0, 0.2, -3.5)
			const expandedScale = this.getExpandedScale(expandedPosition.z)
			const cornerTopRight = this.easeCorner(item.expandProgress, 0)
			const cornerBottomLeft = this.easeCorner(item.expandProgress, 0.05)
			const cornerTopLeft = this.easeCorner(item.expandProgress, 0.1)
			const cornerBottomRight = this.easeCorner(item.expandProgress, 0.15)
			const cornerAverage = (cornerTopRight + cornerBottomRight + cornerBottomLeft + cornerTopLeft) * 0.25
			const restingPosition = new THREE.Vector3(
				x * (1 - centerFade * 0.45),
				y,
				worldZ,
			)

			item.mesh.position.copy(restingPosition).lerp(expandedPosition, this.easeValue(item.expandProgress))
			item.mesh.scale.setScalar(THREE.MathUtils.lerp(scale, 1, cornerAverage))
			item.mesh.rotation.set(
				0,
				THREE.MathUtils.lerp(x * -0.08 * (1 - centerFade), 0, this.easeValue(item.expandProgress)),
				0,
			)
			item.material.uniforms.uOpacity.value = opacity
			item.material.uniforms.uFogColor.value.copy(this.scene?.fog?.color || new THREE.Color('#000000'))
			item.material.uniforms.uFogDensity.value = this.scene?.fog?.density || 0.048
			item.material.uniforms.uTime.value = waveTime + item.index * 0.33
			item.material.uniforms.uCornerTopLeft.value = waveVelocity * 0.95
			item.material.uniforms.uCornerTopRight.value = waveVelocity * -0.76
			item.material.uniforms.uCornerBottomLeft.value = waveVelocity * -0.62
			item.material.uniforms.uCornerBottomRight.value = waveVelocity * 0.84
			item.material.uniforms.uExpandScale.value.copy(expandedScale)
			item.material.uniforms.uExpandTopRight.value = cornerTopRight
			item.material.uniforms.uExpandBottomRight.value = cornerBottomRight
			item.material.uniforms.uExpandBottomLeft.value = cornerBottomLeft
			item.material.uniforms.uExpandTopLeft.value = cornerTopLeft
			item.datePlane.material.opacity = opacity
		})

		return this.activeAmount
	}

	getExpandedScale(zPosition) {
		if (!this.camera) {
			return new THREE.Vector2(4, 2)
		}

		const cameraDistance = Math.max(this.camera.position.z - zPosition, 0.1)
		const viewportHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5) * cameraDistance
		const viewportWidth = viewportHeight * this.camera.aspect

		return new THREE.Vector2(
			(viewportWidth * 0.6) / planeWidth,
			(viewportHeight * 0.3) / planeHeight,
		)
	}

	easeCorner(progress, delay) {
		const duration = 0.78
		const normalized = THREE.MathUtils.clamp((progress - delay) / duration, 0, 1)

		return this.easeValue(normalized)
	}

	easeValue(value) {
		return value < 0.5
			? 4 * value * value * value
			: 1 - Math.pow(-2 * value + 2, 3) * 0.5
	}

	handlePointerDown(event) {
		if (!this.isEnabled || !this.group?.visible || !this.wrapper || !this.camera) return

		const rect = this.wrapper.getBoundingClientRect()
		this.pointer.set(
			((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
			-(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1),
		)

		this.raycaster.setFromCamera(this.pointer, this.camera)
		const hits = this.raycaster.intersectObjects(this.items.map((item) => item.mesh), false)
		const selectedIndex = hits[0]?.object?.userData?.aboutIndex

		if (typeof selectedIndex !== 'number') return

		this.selectItem(this.items[selectedIndex])
	}

	selectItem(item) {
		if (this.selectedItem === item) {
			this.clearSelection()
			return
		}

		this.clearSelection()
		this.selectedItem = item
		item.element.classList.add('is-about-active')

		if (item.explanationElement) {
			item.explanationElement.style.display = 'block'
		}
	}

	clearSelection() {
		if (!this.selectedItem) return

		this.selectedItem.element.classList.remove('is-about-active')

		if (this.selectedItem.explanationElement) {
			this.selectedItem.explanationElement.style.display = 'none'
		}

		this.selectedItem = null
	}

	dispose() {
		window.removeEventListener('pointerdown', this.handlePointerDown)
		window.removeEventListener('wheel', this.handleWheel)
		window.removeEventListener('touchstart', this.handleTouchStart)
		window.removeEventListener('touchmove', this.handleTouchMove)
		this.triggers?.forEach((trigger) => {
			trigger.removeEventListener('click', this.handleTriggerClick)
		})
		this.clearSelection()

		this.items.forEach((item) => {
			item.video.pause()
			item.video.removeAttribute('src')
			item.video.load()
			item.texture.dispose()
			item.material.dispose()
			item.mesh.geometry.dispose()
			item.datePlane.geometry.dispose()
			item.datePlane.material.map?.dispose()
			item.datePlane.material.dispose()
		})

		this.group?.parent?.remove(this.group)
		this.items = []
		this.group = null
	}
}

export default AboutTimeline

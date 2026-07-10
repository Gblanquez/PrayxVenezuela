import * as THREE from 'three'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import heroText from '../text/heroText'

gsap.registerPlugin(SplitText)

const planeWidth = 1
const planeHeight = 0.59
const closeTriggerSelector = '.about-close-trigger'
const closeCanvasClass = 'about-close-canvas'
const closeStyleId = 'pray-about-close-styles'
const expandOpenLerp = 0.019
const expandCloseLerp = 0.036
const expandCloseDelay = 0.22

class AboutTimeline {
	constructor() {
		this.section = null
		this.wrapper = null
		this.scene = null
		this.camera = null
		this.assetCoordinator = null
		this.group = null
		this.contentOpenWrapper = null
		this.items = []
		this.raycaster = new THREE.Raycaster()
		this.pointer = new THREE.Vector2()
		this.activeAmount = 0
		this.scrollProgress = 0
		this.targetScroll = 0
		this.currentScroll = 0
		this.previousScroll = 0
		this.scrollVelocity = 0
		this.introVelocity = 0
		this.introTween = null
		this.introVelocityTween = null
		this.touchY = 0
		this.selectedItem = null
		this.heroSplit = null
		this.heroTitleSplit = null
		this.heroLabelSplit = null
		this.bodyTextSplit = null
		this.entryTimeline = null
		this.entryStartTimer = null
		this.entryStartFrames = []
		this.openContentSplit = null
		this.openContentTimeline = null
		this.isEnabled = false
		this.visualsEnabled = false
		this.closeHideTween = null
		this.sequenceCalls = []
		this.triggers = []
		this.closeTriggers = []
		this.closeIconStates = new Map()
		this.handlePointerDown = this.handlePointerDown.bind(this)
		this.handleTriggerClick = this.handleTriggerClick.bind(this)
		this.handleCloseClick = this.handleCloseClick.bind(this)
		this.handleTriggerProximity = this.handleTriggerProximity.bind(this)
		this.handleTriggerPreload = this.handleTriggerPreload.bind(this)
		this.handleWheel = this.handleWheel.bind(this)
		this.handleTouchStart = this.handleTouchStart.bind(this)
		this.handleTouchMove = this.handleTouchMove.bind(this)
	}

	mount({ scene, camera, wrapper, assetCoordinator = null }) {
		this.section = document.querySelector('.about-section')

		if (!this.section || !scene || !camera || !wrapper) return

		this.scene = scene
		this.camera = camera
		this.wrapper = wrapper
		this.assetCoordinator = assetCoordinator
		this.contentOpenWrapper = document.querySelector('.content-open-wrapper')
		this.group = new THREE.Group()
		this.group.name = 'about-timeline'
		this.group.visible = false
		this.group.position.set(0, 0.15, 0)
		this.scene.add(this.group)

		this.injectCloseStyles()
		this.hideOpenContent()
		this.createItems()
		this.setupTriggers()
		this.assetCoordinator?.setAboutPreloadCallback(() => this.preloadVideoTextures())
		this.assetCoordinator?.scheduleAboutPreload(3000)
		window.addEventListener('pointerdown', this.handlePointerDown, { passive: true })
		window.addEventListener('pointermove', this.handleTriggerProximity, { passive: true })
		window.addEventListener('wheel', this.handleWheel, { passive: false })
		window.addEventListener('touchstart', this.handleTouchStart, { passive: true })
		window.addEventListener('touchmove', this.handleTouchMove, { passive: false })
	}

	setupTriggers() {
		this.triggers = Array.from(document.querySelectorAll('.about-trigger'))
		this.triggers.forEach((trigger) => {
			trigger.addEventListener('click', this.handleTriggerClick)
			trigger.addEventListener('pointerenter', this.handleTriggerPreload)
			trigger.addEventListener('focus', this.handleTriggerPreload)
		})

		this.closeTriggers = Array.from(document.querySelectorAll(closeTriggerSelector))
		this.closeTriggers.forEach((trigger) => {
			trigger.addEventListener('click', this.handleCloseClick)
			trigger.setAttribute('role', trigger.getAttribute('role') || 'button')
			trigger.setAttribute('aria-label', trigger.getAttribute('aria-label') || 'Close about section')
			const canvas = this.ensureCloseCanvas(trigger)
			this.closeIconStates.set(trigger, {
				ring: 0,
				lineA: 0,
				lineB: 0,
			})
			this.drawCloseIcon(canvas, this.closeIconStates.get(trigger))
			if (!this.isEnabled) {
				trigger.style.display = 'none'
				trigger.style.pointerEvents = 'none'
			}
		})
	}

	handleTriggerClick(event) {
		event.preventDefault()

		if (this.isEnabled) return

		this.assetCoordinator?.preloadAboutVideos('click')
		this.isEnabled = true
		this.visualsEnabled = false
		this.clearSequenceCalls()
		this.updateAboutTriggerState()
		heroText.animateOut({
			bodyDelay: 0,
			titleDelay: 0,
			labelsDelay: 0.24,
			includeBodyText: false,
			includeAboutText: true,
			includeCtaText: false,
		})
		this.queueSequenceCall(0.32, () => {
			this.visualsEnabled = true
			this.startIntroAnimation()
			this.showCloseTriggers()
		})
		this.clearSelection({ animateContent: false, deferPlane: false })
		const sectionTop = this.section.getBoundingClientRect().top + window.scrollY

		window.scrollTo({
			top: sectionTop,
			behavior: 'smooth',
		})
	}

	handleTriggerPreload() {
		this.assetCoordinator?.preloadAboutVideos('trigger')
	}

	handleTriggerProximity(event) {
		if (!this.triggers.length || this.assetCoordinator?.aboutPreloadStarted) return

		const threshold = Math.min(220, Math.max(window.innerWidth * 0.16, 96))
		const isNear = this.triggers.some((trigger) => {
			const rect = trigger.getBoundingClientRect()
			const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right)
			const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom)
			return Math.hypot(dx, dy) <= threshold
		})

		if (isNear) {
			this.assetCoordinator?.preloadAboutVideos('proximity')
		}
	}

	handleCloseClick(event) {
		event.preventDefault()

		if (this.selectedItem) {
			this.clearSelection()
			return
		}

		this.clearSequenceCalls()
		this.isEnabled = false
		this.visualsEnabled = false
		this.updateAboutTriggerState()
		this.stopIntroAnimation()
		this.clearSelection()
		heroText.animateIn({
			bodyDelay: 0,
			titleDelay: 0,
			labelsDelay: 0.18,
			includeBodyText: false,
			includeAboutText: true,
			includeCtaText: false,
			includeControls: false,
		})
		this.hideCloseTriggers()
	}

	queueSequenceCall(delay, callback) {
		const call = gsap.delayedCall(delay, () => {
			this.sequenceCalls = this.sequenceCalls.filter((item) => item !== call)
			callback()
		})
		this.sequenceCalls.push(call)
		return call
	}

	clearSequenceCalls() {
		this.sequenceCalls.forEach((call) => call.kill())
		this.sequenceCalls = []
	}

	startIntroAnimation() {
		this.introTween?.kill()
		this.introVelocityTween?.kill()
		this.introVelocity = 1.1
		this.scrollVelocity += 0.4

		this.items.forEach((item) => {
			item.introProgress = 0
		})

		this.introTween = gsap.to(this.items, {
			introProgress: 1,
			duration: 2.2,
			ease: 'power3.out',
			stagger: 0.1,
			onComplete: () => {
				this.introTween = null
			},
		})
		this.introVelocityTween = gsap.to(this, {
			introVelocity: 0,
			duration: 2.2,
			ease: 'power2.out',
			onComplete: () => {
				this.introVelocityTween = null
			},
		})
	}

	stopIntroAnimation() {
		this.introTween?.kill()
		this.introVelocityTween?.kill()
		this.introTween = null
		this.introVelocityTween = null
		this.introVelocity = 0

		this.items.forEach((item) => {
			item.introProgress = 0
		})
	}

	showCloseTriggers() {
		this.closeHideTween?.kill()
		this.closeHideTween = null

		this.closeTriggers.forEach((trigger) => {
			trigger.style.display = 'flex'
			gsap.set(trigger, {
				autoAlpha: 0,
				pointerEvents: 'auto',
			})
			const state = this.closeIconStates.get(trigger)
			const canvas = trigger.querySelector(`canvas.${closeCanvasClass}`)
			if (!state || !canvas) return

			gsap.killTweensOf(state)
			state.ring = 0
			state.lineA = 0
			state.lineB = 0
			this.drawCloseIcon(canvas, state)

			gsap.to(trigger, {
				autoAlpha: 1,
				duration: 0.18,
				delay: 0.05,
				ease: 'power2.out',
			})

			gsap.to(state, {
				ring: 1,
				duration: 1.6,
				delay: 0.05,
				ease: 'expo.out',
				onUpdate: () => this.drawCloseIcon(canvas, state),
			})
			gsap.to(state, {
				lineA: 1,
				duration: 1.6,
				delay: 0.1,
				ease: 'expo.out',
				onUpdate: () => this.drawCloseIcon(canvas, state),
			})
			gsap.to(state, {
				lineB: 1,
				duration: 1.6,
				delay: 0.15,
				ease: 'expo.out',
				onUpdate: () => this.drawCloseIcon(canvas, state),
			})
		})
	}

	hideCloseTriggers() {
		this.closeHideTween?.kill()
		const timeline = gsap.timeline({
			delay: 0.2,
			onComplete: () => {
				this.closeTriggers.forEach((trigger) => {
					trigger.style.display = 'none'
					trigger.style.pointerEvents = 'none'
				})
				this.closeHideTween = null
			},
		})

		this.closeTriggers.forEach((trigger) => {
			const state = this.closeIconStates.get(trigger)
			const canvas = trigger.querySelector(`canvas.${closeCanvasClass}`)
			if (!state || !canvas) return

			gsap.killTweensOf(state)
			timeline
				.to(state, {
					lineB: 0,
					duration: 1.05,
					ease: 'expo.out',
					onUpdate: () => this.drawCloseIcon(canvas, state),
				}, 0)
				.to(state, {
					lineA: 0,
					duration: 1.05,
					ease: 'expo.out',
					onUpdate: () => this.drawCloseIcon(canvas, state),
				}, 0.05)
				.to(state, {
					ring: 0,
					duration: 1.15,
					ease: 'expo.out',
					onUpdate: () => this.drawCloseIcon(canvas, state),
				}, 0.1)
				.to(trigger, {
					autoAlpha: 0,
					duration: 0.24,
					ease: 'power2.out',
				}, 0.84)
		})

		this.closeHideTween = timeline
	}

	animateHeroTextOut({
		bodyDelay = 0,
		titleDelay = 0,
		labelsDelay = 0,
	} = {}) {
		this.ensureHeroSplit()

		if (this.heroSplit?.lines?.length) {
			gsap.to(this.heroSplit.lines, {
				y: '-110%',
				duration: 1.05,
				ease: 'power3.inOut',
				stagger: 0.045,
				delay: bodyDelay,
				overwrite: true,
			})
		}

		this.animateHeroTitleOut(titleDelay)
		this.animateHeroLabelsOut(labelsDelay)
	}

	animateHeroTextIn({
		bodyDelay = 0,
		titleDelay = 0,
		labelsDelay = 0,
	} = {}) {
		this.ensureHeroSplit()

		if (!this.heroSplit?.lines?.length) {
			this.animateHeroTitleIn(titleDelay)
			this.animateHeroLabelsIn(labelsDelay)
			return
		}

		const bodyLines = this.getHeroBodyLines()
		const otherLines = this.heroSplit.lines.filter((line) => !bodyLines.includes(line))

		if (otherLines.length) {
			gsap.to(otherLines, {
				y: '0%',
				duration: 0.95,
				ease: 'power3.inOut',
				stagger: 0.035,
				overwrite: true,
			})
		}

		if (bodyLines.length) {
			gsap.fromTo(bodyLines, {
				y: '110%',
			}, {
				y: '0%',
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.035,
				delay: bodyDelay,
				overwrite: true,
			})
		}

		this.animateHeroTitleIn(titleDelay)
		this.animateHeroLabelsIn(labelsDelay)
	}

	animateHeroTitleOut(delay = 0) {
		const chars = this.getHeroTitleChars()
		if (!chars.length) return

		gsap.to(chars, {
			x: (index) => ((index + 1) % 3 === 0 ? '0%' : '-40%'),
			y: (index) => ((index + 1) % 3 === 0 ? '40%' : '0%'),
			opacity: 0,
			marginRight: '0.08em',
			duration: 0.95,
			ease: 'power3.inOut',
			stagger: 0.018,
			delay,
			overwrite: true,
		})
	}

	animateHeroTitleIn(delay = 0) {
		const chars = this.getHeroTitleChars()
		if (!chars.length) return

		gsap.fromTo(chars, {
			x: (index) => ((index + 1) % 3 === 0 ? '0%' : '-40%'),
			y: (index) => ((index + 1) % 3 === 0 ? '40%' : '0%'),
			opacity: 0,
			marginRight: '0.08em',
		}, {
			x: '0%',
			y: '0%',
			opacity: 1,
			marginRight: '0.025em',
			duration: 1.2,
			ease: 'power3.out',
			stagger: 0.018,
			delay,
			overwrite: true,
		})
	}

	animateHeroLabelsOut(delay = 0) {
		this.getHeroLabelGroups().forEach((chars, index) => {
			if (!chars.length) return

			gsap.to(chars, {
				x: index < 2 ? '-100%' : '100%',
				opacity: 0,
				duration: 0.85,
				ease: 'power3.inOut',
				stagger: 0.012,
				delay,
				overwrite: true,
			})
		})
	}

	animateHeroLabelsIn(delay = 0) {
		this.getHeroLabelGroups().forEach((chars, index) => {
			if (!chars.length) return

			gsap.fromTo(chars, {
				x: index < 2 ? '-100%' : '100%',
				opacity: 0,
			}, {
				x: '0%',
				opacity: 1,
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.012,
				delay,
				overwrite: true,
			})
		})
	}

	animateBodyTextOut(delay = 0) {
		const chars = this.getBodyTextChars()
		if (!chars.length) return

		gsap.to(chars, {
			x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
			opacity: 0,
			duration: 0.85,
			ease: 'power3.inOut',
			stagger: 0.004,
			delay,
			overwrite: true,
		})
	}

	animateBodyTextIn(delay = 0) {
		const chars = this.getBodyTextChars()
		if (!chars.length) return

		gsap.fromTo(chars, {
			x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
			opacity: 0,
		}, {
			x: '0%',
			opacity: 1,
			duration: 1.15,
			ease: 'power3.out',
			stagger: 0.004,
			delay,
			overwrite: true,
		})
	}

	animateAboutTextOut() {
		const targets = Array.from(document.querySelectorAll('[about="text"]'))
		if (!targets.length) return

		gsap.to(targets, {
			y: '-110%',
			opacity: 0,
			duration: 0.85,
			ease: 'power3.inOut',
			stagger: 0.035,
			overwrite: true,
		})
	}

	animateAboutTextIn() {
		const targets = Array.from(document.querySelectorAll('[about="text"]'))
		if (!targets.length) return

		gsap.fromTo(targets, {
			y: '110%',
			opacity: 0,
		}, {
			y: '0%',
			opacity: 1,
			duration: 0.9,
			ease: 'power3.out',
			stagger: 0.035,
			overwrite: true,
		})
	}

	updateAboutTriggerState() {
		this.triggers.forEach((trigger) => {
			trigger.classList.toggle('is-about-active', this.isEnabled)
			trigger.style.pointerEvents = this.isEnabled ? 'none' : ''
			trigger.setAttribute('aria-disabled', this.isEnabled ? 'true' : 'false')
		})
	}

	ensureHeroSplit() {
		if (!this.heroSplit) {
			const elements = Array.from(document.querySelectorAll('[data-a="hero-body"]'))

			if (elements.length) {
				this.heroSplit = SplitText.create(elements, {
					type: 'lines',
					mask: 'lines',
					linesClass: 'hero-split-line',
				})

				gsap.set(this.heroSplit.lines, {
					display: 'block',
					y: '0%',
					opacity: 1,
					willChange: 'transform',
					force3D: true,
				})
			}
		}

		if (!this.heroTitleSplit) {
			const titles = Array.from(document.querySelectorAll('[data-a="hero-title"]'))

			if (titles.length) {
				this.heroTitleSplit = SplitText.create(titles, {
					type: 'chars',
					charsClass: 'hero-title-char',
				})

				gsap.set(this.heroTitleSplit.chars, {
					display: 'inline-block',
					x: '0%',
					y: '0%',
					opacity: 1,
					marginRight: '0.025em',
					willChange: 'transform, opacity',
					force3D: true,
				})
			}
		}

		if (!this.heroLabelSplit) {
			const labels = Array.from(document.querySelectorAll('[data-a="hero-label"]'))

			if (labels.length) {
				this.heroLabelSplit = SplitText.create(labels, {
					type: 'chars',
					charsClass: 'hero-label-char',
				})

				gsap.set(this.heroLabelSplit.chars, {
					display: 'inline-block',
					x: '0%',
					opacity: 1,
					willChange: 'transform, opacity',
					force3D: true,
				})
			}
		}

		if (!this.bodyTextSplit) {
			const bodyText = Array.from(document.querySelectorAll('[data-a="body-text"]'))

			if (!bodyText.length) return

			this.bodyTextSplit = SplitText.create(bodyText, {
				type: 'chars',
				charsClass: 'body-text-char',
			})

			gsap.set(this.bodyTextSplit.chars, {
				display: 'inline-block',
				x: '0%',
				opacity: 1,
				willChange: 'transform, opacity',
				force3D: true,
			})
		}
	}

	prepareEntryTextState() {
		const titleChars = this.getHeroTitleChars()
		const bodyLines = this.getHeroBodyLines()
		const bodyTextChars = this.getBodyTextChars()

		if (titleChars.length) {
			gsap.set(titleChars, {
				x: (index) => ((index + 1) % 3 === 0 ? '0%' : '-40%'),
				y: (index) => ((index + 1) % 3 === 0 ? '40%' : '0%'),
				opacity: 0,
				marginRight: '0.08em',
			})
		}

		if (bodyLines.length) {
			gsap.set(bodyLines, {
				y: '110%',
			})
		}

		this.getHeroLabelGroups().forEach((chars, index) => {
			gsap.set(chars, {
				x: index < 2 ? '-100%' : '100%',
				opacity: 0,
			})
		})

		if (bodyTextChars.length) {
			gsap.set(bodyTextChars, {
				x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
				opacity: 0,
			})
		}
	}

	cancelScheduledEntryAnimation() {
		if (this.entryStartTimer) {
			window.clearTimeout(this.entryStartTimer)
			this.entryStartTimer = null
		}

		this.entryStartFrames.forEach((frame) => window.cancelAnimationFrame(frame))
		this.entryStartFrames = []
	}

	scheduleEntryTextAnimation() {
		const start = () => {
			const firstFrame = window.requestAnimationFrame(() => {
				const secondFrame = window.requestAnimationFrame(() => {
					this.entryStartFrames = []
					this.playEntryTextAnimation()
				})
				this.entryStartFrames.push(secondFrame)
			})
			this.entryStartFrames.push(firstFrame)
		}

		if (document.fonts?.ready) {
			const fontReady = document.fonts.ready.catch(() => {})
			const maxWait = new Promise((resolve) => {
				this.entryStartTimer = window.setTimeout(resolve, 320)
			})

			Promise.race([fontReady, maxWait]).then(() => {
				if (this.entryStartTimer) {
					window.clearTimeout(this.entryStartTimer)
					this.entryStartTimer = null
				}
				start()
			})
			return
		}

		this.entryStartTimer = window.setTimeout(() => {
			this.entryStartTimer = null
			start()
		}, 80)
	}

	playEntryTextAnimation() {
		this.entryTimeline?.kill()
		this.entryTimeline = gsap.timeline()

		const titleChars = this.getHeroTitleChars()
		const bodyLines = this.getHeroBodyLines()
		const bodyTextChars = this.getBodyTextChars()

		if (titleChars.length) {
			this.entryTimeline.to(titleChars, {
				x: '0%',
				y: '0%',
				opacity: 1,
				marginRight: '0.025em',
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.018,
			}, 0)
		}

		if (bodyLines.length) {
			this.entryTimeline.to(bodyLines, {
				y: '0%',
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.035,
			}, 0.08)
		}

		this.getHeroLabelGroups().forEach((chars, index) => {
			if (!chars.length) return

			this.entryTimeline.to(chars, {
				x: '0%',
				opacity: 1,
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.012,
			}, index < 2 ? 0.08 : 0.14)
		})

		if (bodyTextChars.length) {
			this.entryTimeline.to(bodyTextChars, {
				x: '0%',
				opacity: 1,
				duration: 1.15,
				ease: 'power3.out',
				stagger: 0.004,
			}, 0.18)
		}
	}

	getHeroBodyLines() {
		const bodyElements = Array.from(document.querySelectorAll('[data-a="hero-body"]'))
		if (!bodyElements.length) return []

		return this.heroSplit.lines.filter((line) =>
			bodyElements.some((element) => element.contains(line)),
		)
	}

	getHeroTitleChars() {
		return this.heroTitleSplit?.chars || []
	}

	getBodyTextChars() {
		return this.bodyTextSplit?.chars || []
	}

	getHeroLabelGroups() {
		if (!this.heroLabelSplit?.chars?.length) return []

		return Array.from(document.querySelectorAll('[data-a="hero-label"]'))
			.map((label) => this.heroLabelSplit.chars.filter((char) => label.contains(char)))
	}

	ensureCloseCanvas(trigger) {
		let canvas = trigger.querySelector(`canvas.${closeCanvasClass}`)
		if (canvas) return canvas

		canvas = document.createElement('canvas')
		canvas.className = closeCanvasClass
		canvas.width = 100
		canvas.height = 100
		canvas.setAttribute('aria-hidden', 'true')
		trigger.appendChild(canvas)

		return canvas
	}

	drawCloseIcon(canvas, state = { ring: 1, lineA: 1, lineB: 1 }) {
		const context = canvas.getContext('2d')
		const size = canvas.width
		const center = size * 0.5
		const scale = size / 19
		const color = '#ffffff'

		context.clearRect(0, 0, size, size)
		context.save()
		context.translate(center, center)
		context.strokeStyle = color
		context.lineWidth = 0.92 * scale
		context.lineCap = 'round'
		context.lineJoin = 'round'

		context.beginPath()
		context.arc(0, 0, 8.2 * scale, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * state.ring)
		context.stroke()

		context.beginPath()
		this.drawCenteredLine(context, -1.8 * scale, -1.8 * scale, 1.8 * scale, 1.8 * scale, state.lineA)
		this.drawCenteredLine(context, 1.8 * scale, -1.8 * scale, -1.8 * scale, 1.8 * scale, state.lineB)
		context.stroke()
		context.restore()
	}

	drawCenteredLine(context, x1, y1, x2, y2, progress) {
		const centerX = (x1 + x2) * 0.5
		const centerY = (y1 + y2) * 0.5
		const halfX = (x2 - x1) * 0.5 * progress
		const halfY = (y2 - y1) * 0.5 * progress

		context.moveTo(centerX - halfX, centerY - halfY)
		context.lineTo(centerX + halfX, centerY + halfY)
	}

	injectCloseStyles() {
		if (document.getElementById(closeStyleId)) return

		const style = document.createElement('style')
		style.id = closeStyleId
		style.textContent = `
			${closeTriggerSelector} {
				cursor: pointer;
				align-items: center;
				justify-content: center;
				transform-origin: center;
			}

			${closeTriggerSelector} .${closeCanvasClass} {
				display: block;
				width: 28px;
				height: 28px;
				color: #ffffff;
				flex: 0 0 auto;
				transition: transform 180ms ease;
				transform-origin: center;
			}

			${closeTriggerSelector}:hover .${closeCanvasClass},
			${closeTriggerSelector}:focus-visible .${closeCanvasClass} {
				transform: scale(1.05);
			}
		`

		document.head.appendChild(style)
	}

	createItems() {
		const cmsItems = Array.from(this.section.querySelectorAll('.collection-item'))

		cmsItems.forEach((element, index) => {
			const videoSource = this.resolveVideoSource(element)
			if (!videoSource) return

			const dateElement = element.querySelector('[collection="date"], .collection-content')
			const explanationElement = element.querySelector('.collection-explanation')
			const texture = this.createBlankTexture()
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
				video: null,
				videoSource,
				texture,
				material,
				mesh,
				datePlane,
				index,
				expandProgress: 0,
				expandCloseHold: 0,
				introProgress: 0,
				isVideoPrepared: false,
			}

			this.items.push(item)
		})
	}

	createBlankTexture() {
		const data = new Uint8Array([0, 0, 0, 255])
		const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat)
		texture.colorSpace = THREE.SRGBColorSpace
		texture.needsUpdate = true
		return texture
	}

	preloadVideoTextures() {
		this.items.forEach((item) => {
			this.prepareItemVideo(item)
		})
	}

	prepareItemVideo(item) {
		if (!item || item.isVideoPrepared || !item.videoSource) return

		const video = this.createVideoElement(item.videoSource)
		const texture = new THREE.VideoTexture(video)
		texture.colorSpace = THREE.SRGBColorSpace
		texture.minFilter = THREE.LinearFilter
		texture.magFilter = THREE.LinearFilter
		texture.generateMipmaps = false

		item.video = video
		item.texture.dispose()
		item.texture = texture
		item.isVideoPrepared = true
		item.material.uniforms.uTexture.value = texture

		video.addEventListener('loadedmetadata', () => {
			item.material.uniforms.uTextureSize.value.set(video.videoWidth || 16, video.videoHeight || 9)
		})
		video.load()
		video.play().catch(() => {})
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
		context.font = '500 30px Arial, sans-serif'
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
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.12), material)
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
		const targetAmount = this.visualsEnabled && isVisible ? 1 : 0

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
		const waveVelocity = THREE.MathUtils.clamp(this.scrollVelocity + this.introVelocity, -0.48, 0.48)
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
			const isSelected = this.selectedItem === item
			const targetExpand = isSelected || item.expandCloseHold > 0 ? 1 : 0
			item.expandCloseHold = Math.max(0, item.expandCloseHold - (1 / 60))
			const expandLerp = targetExpand > item.expandProgress ? expandOpenLerp : expandCloseLerp
			item.expandProgress += (targetExpand - item.expandProgress) * expandLerp
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
			const introProgress = this.easeValue(item.introProgress)
			const introRemaining = 1 - introProgress
			const stackedPosition = new THREE.Vector3(
				0.18,
				0.02,
				-16 - item.index * 0.12,
			)
			const introPosition = stackedPosition.clone().lerp(restingPosition, introProgress)
			const introRotationX = Math.PI * 0.25 * introRemaining
			const introBendPulse = Math.sin(introProgress * Math.PI) * 0.34

			item.mesh.position.copy(introPosition).lerp(expandedPosition, this.easeValue(item.expandProgress))
			item.mesh.scale.setScalar(THREE.MathUtils.lerp(scale, 1, cornerAverage))
			item.mesh.rotation.set(
				THREE.MathUtils.lerp(introRotationX, 0, this.easeValue(item.expandProgress)),
				THREE.MathUtils.lerp(x * -0.08 * (1 - centerFade), 0, this.easeValue(item.expandProgress)),
				0,
			)
			item.material.uniforms.uOpacity.value = opacity * introProgress
			item.material.uniforms.uFogColor.value.copy(this.scene?.fog?.color || new THREE.Color('#000000'))
			item.material.uniforms.uFogDensity.value = this.scene?.fog?.density || 0.048
			item.material.uniforms.uTime.value = waveTime + item.index * 0.33
			item.material.uniforms.uCornerTopLeft.value = (waveVelocity * 0.95) + introBendPulse
			item.material.uniforms.uCornerTopRight.value = (waveVelocity * -0.76) - introBendPulse * 0.72
			item.material.uniforms.uCornerBottomLeft.value = (waveVelocity * -0.62) - introBendPulse * 0.48
			item.material.uniforms.uCornerBottomRight.value = (waveVelocity * 0.84) + introBendPulse * 0.62
			item.material.uniforms.uExpandScale.value.copy(expandedScale)
			item.material.uniforms.uExpandTopRight.value = cornerTopRight
			item.material.uniforms.uExpandBottomRight.value = cornerBottomRight
			item.material.uniforms.uExpandBottomLeft.value = cornerBottomLeft
			item.material.uniforms.uExpandTopLeft.value = cornerTopLeft
			item.datePlane.material.opacity = opacity * introProgress
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
		const isMobile = window.innerWidth < 768
		const widthRatio = isMobile ? 0.9 : 0.5
		const heightRatio = 0.3

		return new THREE.Vector2(
			(viewportWidth * widthRatio) / planeWidth,
			(viewportHeight * heightRatio) / planeHeight,
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

		this.clearSelection({ animateContent: false, deferPlane: false })
		this.selectedItem = item
		item.element.classList.add('is-about-active')
		this.updateCloseTriggerMode()
		this.showOpenContent(item)
	}

	clearSelection({ animateContent = true, deferPlane = true } = {}) {
		const item = this.selectedItem

		if (!item) {
			this.hideOpenContent(false)
			this.updateCloseTriggerMode()
			return
		}

		if (animateContent && deferPlane && this.contentOpenWrapper?.innerHTML.trim()) {
			item.element.classList.remove('is-about-active')
			item.expandCloseHold = expandCloseDelay
			if (this.selectedItem === item) {
				this.selectedItem = null
			}
			this.updateCloseTriggerMode()
			this.hideOpenContent(true)
			return
		}

		item.element.classList.remove('is-about-active')
		this.hideOpenContent(false)
		if (this.selectedItem === item) {
			this.selectedItem = null
		}
		this.updateCloseTriggerMode()
	}

	updateCloseTriggerMode() {
		this.closeTriggers.forEach((trigger) => {
			trigger.classList.toggle('is-plane-open', Boolean(this.selectedItem))
		})
	}

	showOpenContent(item) {
		if (!this.contentOpenWrapper || !item.explanationElement) return

		this.contentOpenWrapper.innerHTML = item.explanationElement.innerHTML
		this.contentOpenWrapper.style.display = 'flex'
		this.contentOpenWrapper.setAttribute('aria-hidden', 'false')
		this.animateOpenContentIn()
	}

	hideOpenContent(animate = false, onComplete = null) {
		if (!this.contentOpenWrapper) return

		this.openContentTimeline?.kill()

		if (!animate || !this.contentOpenWrapper.innerHTML.trim()) {
			this.clearOpenContentNow()
			onComplete?.()
			return
		}

		const lines = Array.from(this.contentOpenWrapper.querySelectorAll('[collection="content"]'))
		const contentLines = this.openContentSplit?.lines || []
		const targets = contentLines.length ? contentLines : lines
		const line = this.contentOpenWrapper.querySelector('.collection-line')

		if (line) {
			gsap.set(line, { transformOrigin: 'right center' })
		}

		this.openContentTimeline = gsap.timeline({
			onComplete: () => {
				this.clearOpenContentNow()
				onComplete?.()
			},
		})

		if (targets.length) {
			this.openContentTimeline.to(targets, {
				y: '-110%',
				duration: 0.48,
				ease: 'power3.in',
				stagger: 0.01,
			}, 0)
		}

		if (line) {
			this.openContentTimeline.to(line, {
				scaleX: 0,
				duration: 0.42,
				ease: 'power3.inOut',
			}, 0.03)
		}
	}

	animateOpenContentIn() {
		if (!this.contentOpenWrapper) return

		this.openContentTimeline?.kill()
		this.openContentSplit?.revert()
		this.openContentSplit = null

		const line = this.contentOpenWrapper.querySelector('.collection-line')
		const contentTargets = Array.from(this.contentOpenWrapper.querySelectorAll('[collection="content"]'))

		if (line) {
			gsap.set(line, {
				scaleX: 0,
				transformOrigin: 'left center',
			})
		}

		if (contentTargets.length) {
			this.openContentSplit = SplitText.create(contentTargets, {
				type: 'lines',
				mask: 'lines',
				linesClass: 'about-content-line',
			})

			gsap.set(this.openContentSplit.lines, {
				y: '110%',
				display: 'block',
				willChange: 'transform',
			})
		}

		this.openContentTimeline = gsap.timeline()

		if (line) {
			this.openContentTimeline.to(line, {
				scaleX: 1,
				duration: 0.82,
				ease: 'power3.out',
			}, 0)
		}

		if (this.openContentSplit?.lines?.length) {
			this.openContentTimeline.to(this.openContentSplit.lines, {
				y: '0%',
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.02,
			}, 0.12)
		}
	}

	clearOpenContentNow() {
		if (!this.contentOpenWrapper) return

		this.openContentTimeline?.kill()
		this.openContentTimeline = null
		this.openContentSplit?.revert()
		this.openContentSplit = null
		this.contentOpenWrapper.innerHTML = ''
		this.contentOpenWrapper.style.display = 'none'
		this.contentOpenWrapper.setAttribute('aria-hidden', 'true')
	}

	dispose() {
		window.removeEventListener('pointerdown', this.handlePointerDown)
		window.removeEventListener('pointermove', this.handleTriggerProximity)
		window.removeEventListener('wheel', this.handleWheel)
		window.removeEventListener('touchstart', this.handleTouchStart)
		window.removeEventListener('touchmove', this.handleTouchMove)
		this.triggers?.forEach((trigger) => {
			trigger.removeEventListener('click', this.handleTriggerClick)
			trigger.removeEventListener('pointerenter', this.handleTriggerPreload)
			trigger.removeEventListener('focus', this.handleTriggerPreload)
		})
		this.closeTriggers?.forEach((trigger) => {
			trigger.removeEventListener('click', this.handleCloseClick)
		})
		this.closeHideTween?.kill()
		this.cancelScheduledEntryAnimation()
		this.entryTimeline?.kill()
		this.clearSequenceCalls()
		this.heroSplit?.revert()
		this.heroTitleSplit?.revert()
		this.heroLabelSplit?.revert()
		this.bodyTextSplit?.revert()
		this.openContentTimeline?.kill()
		this.openContentSplit?.revert()
		this.clearSelection({ animateContent: false, deferPlane: false })

		this.items.forEach((item) => {
			if (item.video) {
				item.video.pause()
				item.video.removeAttribute('src')
				item.video.load()
			}
			item.texture?.dispose()
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

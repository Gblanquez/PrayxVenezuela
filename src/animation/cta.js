import { gsap } from 'gsap'

const donateLinkSelector = '[data-a="donate-link"]'
const ctaTextSelector = '[data-a="cta-txt"]'
const canvasClass = 'cta-canvas'
const styleId = 'pray-cta-animation-styles'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

class CtaAnimation {
	constructor() {
		this.links = []
		this.canvases = new Map()
		this.hoverStates = new Map()
		this.rafId = null
		this.startTime = 0
		this.entryProgress = 0
		this.entryTween = null
		this.hasEntered = false
		this.handlePointerEnter = this.handlePointerEnter.bind(this)
		this.handlePointerLeave = this.handlePointerLeave.bind(this)
		this.animate = this.animate.bind(this)
	}

	mount() {
		this.injectStyles()
		this.collectLinks()
		this.start()
	}

	collectLinks() {
		this.links.forEach((link) => {
			link.removeEventListener('pointerenter', this.handlePointerEnter)
			link.removeEventListener('pointerleave', this.handlePointerLeave)
			link.removeEventListener('focus', this.handlePointerEnter)
			link.removeEventListener('blur', this.handlePointerLeave)
		})

		this.links = Array.from(document.querySelectorAll(donateLinkSelector))

		this.links.forEach((link) => {
			this.prepareLink(link)
			link.addEventListener('pointerenter', this.handlePointerEnter)
			link.addEventListener('pointerleave', this.handlePointerLeave)
			link.addEventListener('focus', this.handlePointerEnter)
			link.addEventListener('blur', this.handlePointerLeave)
		})
	}

	prepareLink(link) {
		const wrapper = this.findCanvasWrapper(link)
		if (!wrapper) return

		wrapper.classList.add('is-cta-canvas-wrapper')

		const canvas = this.ensureCanvas(wrapper)
		this.canvases.set(link, canvas)
		this.hoverStates.set(link, {
			mode: 'idle',
			startTime: 0,
			loopRestartTime: 0,
		})
		this.drawCanvas(canvas, 0)
	}

	findCanvasWrapper(link) {
		return (
			link.querySelector('.cta-svg-wrapper') ||
			link.querySelector('.cta-embed-wrap') ||
			link.closest('.cta-svg-wrapper') ||
			link.parentElement?.querySelector('.cta-svg-wrapper') ||
			link.parentElement?.querySelector('.cta-embed-wrap') ||
			link
		)
	}

	ensureCanvas(wrapper) {
		let canvas = wrapper.querySelector(`canvas.${canvasClass}`)
		if (canvas) return canvas

		canvas = document.createElement('canvas')
		canvas.className = canvasClass
		canvas.width = 220
		canvas.height = 80
		canvas.setAttribute('aria-hidden', 'true')
		canvas.style.display = 'block'
		canvas.style.width = '110px'
		canvas.style.height = '40px'
		canvas.style.pointerEvents = 'none'
		wrapper.appendChild(canvas)

		return canvas
	}

	handlePointerEnter(event) {
		const state = this.hoverStates.get(event.currentTarget)
		if (!state) return

		state.mode = 'in'
		state.startTime = performance.now() * 0.001
		state.yellowHold = 0
		state.blueHold = 0
	}

	handlePointerLeave(event) {
		const state = this.hoverStates.get(event.currentTarget)
		if (!state || state.mode === 'idle') return

		state.mode = 'out'
		state.startTime = performance.now() * 0.001
		state.yellowHold = 1
		state.blueHold = 1
	}

	start() {
		if (this.rafId) return

		this.startTime = performance.now()
		this.rafId = requestAnimationFrame(this.animate)
	}

	animate(time) {
		const elapsed = (time - this.startTime) * 0.001

		this.links.forEach((link, index) => {
			const canvas = this.canvases.get(link)
			const hoverState = this.hoverStates.get(link)

			if (canvas) {
				this.drawCanvas(canvas, elapsed + index * 0.23, hoverState)
			}
		})

		this.rafId = requestAnimationFrame(this.animate)
	}

	drawCanvas(canvas, time, hoverState = null) {
		const context = canvas.getContext('2d')
		const width = canvas.width
		const height = canvas.height
		const dprScale = width / 110
		const baseColor = '#ffffff'
		const loopBlue = '#0700CC'
		const hoverBlue = '#0700CC'
		const hoverYellow = '#ffd84d'
		const lineWidth = 1.35 * dprScale
		const y = 2 * dprScale
		const centerX = 54.75 * dprScale
		const bottomY = 40 * dprScale
		const cycle = 2.9
		const progressBase = (time % cycle) / cycle

		context.clearRect(0, 0, width, height)
		context.save()
		context.lineWidth = lineWidth
		context.lineCap = 'round'
		context.lineJoin = 'round'

		this.drawBaseShape(context, baseColor, dprScale, this.entryProgress)

		if (!this.hasEntered) {
			context.restore()
			return
		}

		const loopTime = Math.max(0, time - (hoverState?.loopRestartTime || 0))
		const loopProgress = (loopTime % cycle) / cycle
		this.drawLoopPass(context, loopBlue, loopProgress, dprScale)

		if (hoverState && hoverState.mode !== 'idle') {
			this.drawHoverAnimation(context, hoverState, time, hoverYellow, hoverBlue, dprScale)
		}

		context.restore()
	}

	playEntry(delay = 0) {
		this.entryTween?.kill()
		this.hasEntered = false
		this.entryProgress = 0

		this.entryTween = gsap.to(this, {
			entryProgress: 1,
			duration: 1.6,
			delay,
			ease: 'power3.out',
			onComplete: () => {
				this.hasEntered = true
				this.startTime = performance.now()
				this.entryTween = null
			},
		})
	}

	drawBaseShape(context, color, scale, progress = 1) {
		const y = 2 * scale
		const centerX = 54.75 * scale
		const leftProgress = this.easeOutCubic(clamp(progress / 0.96, 0, 1))
		const rightProgress = this.easeOutCubic(clamp((progress - 0.02) / 0.96, 0, 1))
		const verticalProgress = this.easeOutCubic(clamp((progress - 0.04) / 0.96, 0, 1))

		context.globalAlpha = 1
		context.strokeStyle = color
		context.beginPath()
		context.moveTo(0, y)
		context.lineTo(centerX * leftProgress, y)
		context.moveTo(109.5 * scale, y)
		context.lineTo(109.5 * scale + (centerX - 109.5 * scale) * rightProgress, y)
		context.moveTo(centerX, 40 * scale)
		context.lineTo(centerX, 40 * scale + (y - 40 * scale) * verticalProgress)
		context.stroke()
		context.globalAlpha = 1
	}

	drawAnimatedLine(context, color, startX, startY, endX, endY, progress) {
		const startProgress = typeof progress === 'number' ? 0 : progress.start
		const endProgress = typeof progress === 'number' ? progress : progress.end
		const alpha = this.lineAlpha(progress)

		if (endProgress <= startProgress || alpha <= 0) return

		context.strokeStyle = color
		context.globalAlpha = alpha
		context.beginPath()
		context.moveTo(
			startX + (endX - startX) * startProgress,
			startY + (endY - startY) * startProgress,
		)
		context.lineTo(
			startX + (endX - startX) * endProgress,
			startY + (endY - startY) * endProgress,
		)
		context.stroke()
		context.globalAlpha = 1
	}

	drawLoopPass(context, color, progressBase, scale) {
		const y = 2 * scale
		const centerX = 54.75 * scale
		const bottomY = 40 * scale

		this.drawAnimatedLine(context, color, 0, y, centerX, y, this.segmentProgress(progressBase, 0))
		this.drawAnimatedLine(context, color, 109.5 * scale, y, centerX, y, this.segmentProgress(progressBase, 0.045))
		this.drawAnimatedLine(context, color, centerX, bottomY, centerX, y, this.segmentProgress(progressBase, 0.09))
	}

	drawHoverAnimation(context, state, time, yellow, blue, scale) {
		const elapsed = Math.max(0, performance.now() * 0.001 - state.startTime)
		const isOut = state.mode === 'out'
		const y = 2 * scale
		const centerX = 54.75 * scale
		const bottomY = 40 * scale
		const yellowOffset = 0
		const blueOffset = 0.18
		const duration = 0.52
		const lineStagger = 0.035
		const totalDuration = blueOffset + lineStagger * 2 + duration
		const createYellow = (offset) => isOut
			? this.hoverOutSegment(elapsed, offset, duration)
			: this.hoverInSegment(elapsed, offset, duration)
		const createBlue = (offset) => isOut
			? this.hoverOutSegment(elapsed, offset + 0.08, duration)
			: this.hoverInSegment(elapsed, offset, duration)

		context.save()
		context.globalCompositeOperation = 'source-over'
		this.drawAnimatedLine(context, yellow, 0, y, centerX, y, createYellow(yellowOffset))
		this.drawAnimatedLine(context, yellow, 109.5 * scale, y, centerX, y, createYellow(yellowOffset + lineStagger))
		this.drawAnimatedLine(context, yellow, centerX, bottomY, centerX, y, createYellow(yellowOffset + lineStagger * 2))
		context.restore()

		context.save()
		context.globalCompositeOperation = 'source-over'
		this.drawAnimatedLine(context, blue, 0, y, centerX, y, createBlue(blueOffset))
		this.drawAnimatedLine(context, blue, 109.5 * scale, y, centerX, y, createBlue(blueOffset + lineStagger))
		this.drawAnimatedLine(context, blue, centerX, bottomY, centerX, y, createBlue(blueOffset + lineStagger * 2))
		context.restore()

		if (isOut && elapsed > totalDuration + 0.05) {
			state.mode = 'idle'
			state.loopRestartTime = time
		}
	}

	hoverInSegment(elapsed, delay, duration) {
		const progress = this.easeOutCubic(clamp((elapsed - delay) / duration, 0, 1))

		return {
			alpha: progress,
			start: 0,
			end: progress,
		}
	}

	hoverOutSegment(elapsed, delay, duration) {
		const progress = this.easeInCubic(clamp((elapsed - delay) / duration, 0, 1))

		return {
			alpha: 1,
			start: progress,
			end: 1,
		}
	}

	segmentProgress(cycleProgress, delay) {
		const shifted = (cycleProgress - delay + 1) % 1

		if (shifted < 0.42) {
			return {
				alpha: 1,
				start: 0,
				end: this.easeOutCubic(shifted / 0.42),
			}
		}

		if (shifted < 0.58) {
			return {
				alpha: 1,
				start: 0,
				end: 1,
			}
		}

		if (shifted < 0.92) {
			return {
				alpha: 1,
				start: this.easeInCubic((shifted - 0.58) / 0.34),
				end: 1,
			}
		}

		return {
			alpha: 0,
			start: 0,
			end: 0,
		}
	}

	lineAlpha(progress) {
		if (typeof progress === 'number') {
			return Math.min(1, Math.max(0, progress * 1.4))
		}

		return progress.alpha
	}

	easeOutCubic(value) {
		return 1 - Math.pow(1 - value, 3)
	}

	easeInCubic(value) {
		return value * value * value
	}

	injectStyles() {
		if (document.getElementById(styleId)) return

		const style = document.createElement('style')
		style.id = styleId
		style.textContent = `
			.cta-svg-wrapper.is-cta-canvas-wrapper {
				position: relative;
				line-height: 0;
			}

			.is-cta-canvas-wrapper .${canvasClass},
			${donateLinkSelector} > .${canvasClass} {
				display: block;
				width: 110px;
				height: 40px;
				pointer-events: none;
			}

		`

		document.head.appendChild(style)
	}
}

export default new CtaAnimation()

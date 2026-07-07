const audioUrl = 'https://cdn.prod.website-files.com/6a46821c4db8359b8ad81f12/6a4cbbc0aa76c72f5f9b75e5_Tonada%20De%20Luna%20Llena.mp3'
const triggerSelector = '.sound-trigger'
const existingIconSelector = 'svg.sound'
const canvasClass = 'sound-canvas'
const styleId = 'pray-sound-styles'

class BackgroundSound {
	constructor() {
		this.audio = null
		this.triggers = []
		this.rafId = null
		this.isPlaying = false
		this.handleTriggerClick = this.handleTriggerClick.bind(this)
		this.animate = this.animate.bind(this)
	}

	mount() {
		this.injectStyles()
		this.createAudio()
		this.collectTriggers()
		this.drawAll(0)
	}

	createAudio() {
		if (this.audio) return

		this.audio = new Audio(audioUrl)
		this.audio.preload = 'auto'
		this.audio.loop = true
		this.audio.crossOrigin = 'anonymous'

		this.audio.addEventListener('play', () => this.setPlaying(true))
		this.audio.addEventListener('pause', () => this.setPlaying(false))
		this.audio.addEventListener('ended', () => this.setPlaying(false))
	}

	collectTriggers() {
		this.triggers.forEach((trigger) => {
			trigger.removeEventListener('click', this.handleTriggerClick)
		})

		this.triggers = Array.from(document.querySelectorAll(triggerSelector))

		this.triggers.forEach((trigger) => {
			trigger.addEventListener('click', this.handleTriggerClick)
			trigger.setAttribute('role', trigger.getAttribute('role') || 'button')
			trigger.setAttribute('aria-pressed', this.isPlaying ? 'true' : 'false')
			trigger.classList.toggle('is-playing', this.isPlaying)
			this.ensureCanvas(trigger)
		})
	}

	ensureCanvas(trigger) {
		const existingIcon = trigger.querySelector(existingIconSelector)
		if (existingIcon) {
			existingIcon.style.display = 'none'
		}

		let canvas = trigger.querySelector(`canvas.${canvasClass}`)
		if (canvas) return canvas

		canvas = document.createElement('canvas')
		canvas.className = canvasClass
		canvas.width = 100
		canvas.height = 100
		canvas.setAttribute('aria-hidden', 'true')
		trigger.appendChild(canvas)

		return canvas
	}

	async handleTriggerClick(event) {
		event.preventDefault()

		if (!this.audio) return

		if (this.audio.paused) {
			try {
				await this.audio.play()
			} catch (error) {
				console.warn('[BackgroundSound] Could not play audio:', error)
			}
			return
		}

		this.audio.pause()
	}

	setPlaying(isPlaying) {
		this.isPlaying = isPlaying

		this.triggers.forEach((trigger) => {
			trigger.classList.toggle('is-playing', isPlaying)
			trigger.setAttribute('aria-pressed', isPlaying ? 'true' : 'false')
		})

		if (isPlaying) {
			if (!this.rafId) {
				this.rafId = requestAnimationFrame(this.animate)
			}
			return
		}

		if (this.rafId) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}

		this.drawAll(0)
	}

	animate(time) {
		this.drawAll(time)
		this.rafId = requestAnimationFrame(this.animate)
	}

	drawAll(time) {
		this.triggers.forEach((trigger, index) => {
			const canvas = this.ensureCanvas(trigger)
			this.drawIcon(canvas, this.isPlaying, time * 0.004 + index * 1.7)
		})
	}

	drawIcon(canvas, isPlaying, phase) {
		const context = canvas.getContext('2d')
		const size = canvas.width
		const center = size * 0.5
		const scale = size / 19
		const color = getComputedStyle(canvas).color || '#000000'

		context.clearRect(0, 0, size, size)
		context.save()
		context.lineWidth = isPlaying ? 1.15 * scale : 0.92 * scale
		context.lineCap = 'round'
		context.lineJoin = 'round'
		context.strokeStyle = color
		context.translate(center, center)

		if (isPlaying) {
			this.drawWavyRing(context, phase, scale)
		} else {
			this.drawCleanArc(context, scale)
		}

		context.restore()
	}

	drawCleanArc(context, scale) {
		const radius = 8.2 * scale
		const start = Math.PI * 0.62
		const end = Math.PI * 2.05

		context.beginPath()
		context.arc(0, 0, radius, start, end)
		context.stroke()
	}

	drawWavyRing(context, phase, scale) {
		const baseRadius = 8.2 * scale
		const start = Math.PI * 0.55
		const end = Math.PI * 2.05
		const segments = 84

		context.beginPath()

		for (let index = 0; index <= segments; index += 1) {
			const progress = index / segments
			const angle = start + (end - start) * progress
			const wave =
				Math.sin(angle * 5.0 + phase) * 0.36 +
				Math.sin(angle * 8.0 - phase * 0.72) * 0.16 +
				Math.sin(angle * 2.0 + phase * 1.45) * 0.1
			const radius = baseRadius + wave * scale
			const x = Math.cos(angle) * radius
			const y = Math.sin(angle) * radius

			if (index === 0) {
				context.moveTo(x, y)
			} else {
				context.lineTo(x, y)
			}
		}

		context.stroke()
	}

	injectStyles() {
		if (document.getElementById(styleId)) return

		const style = document.createElement('style')
		style.id = styleId
		style.textContent = `
			${triggerSelector} {
				animation: pray-sound-spin 7s linear infinite;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				transform-origin: center;
				will-change: transform;
			}

			${triggerSelector} .${canvasClass} {
				display: block;
				width: 28px;
				height: 28px;
				color: currentColor;
				flex: 0 0 auto;
				transition: transform 180ms ease;
				transform-origin: center;
			}

			${triggerSelector}:hover .${canvasClass},
			${triggerSelector}:focus-visible .${canvasClass} {
				transform: scale(1.05);
			}

			@keyframes pray-sound-spin {
				from { transform: rotate(0deg); }
				to { transform: rotate(360deg); }
			}
		`

		document.head.appendChild(style)
	}
}

export default new BackgroundSound()

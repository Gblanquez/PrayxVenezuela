import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import ctaAnimation from '../animation/cta'
import backgroundSound from '../sound/background'

gsap.registerPlugin(SplitText)

class HeroText {
	constructor() {
		this.heroBodySplit = null
		this.heroTitleSplit = null
		this.heroLabelSplit = null
		this.bodyTextSplit = null
		this.aboutTextSplit = null
		this.ctaTextSplit = null
		this.entryTimeline = null
		this.entryStartTimer = null
		this.entryStartFrames = []
		this.hasMounted = false
		this.mountAttempts = 0
	}

	mount() {
		if (this.hasMounted) return
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this.mount(), { once: true })
			return
		}

		if (!this.hasTextTargets()) {
			if (this.mountAttempts < 40) {
				this.mountAttempts += 1
				window.setTimeout(() => this.mount(), 50)
			}
			return
		}

		this.hasMounted = true
		this.ensureSplits()
		this.prepareEntryState()
		this.updateDebugState('prepared')
		this.scheduleEntryAnimation()
	}

	hasTextTargets() {
		return Boolean(document.querySelector(
			'[data-a="hero-title"], [data-a="hero-label"], [data-a="hero-body"], [data-a="body-text"], [about="text"], [data-a="cta-txt"]',
		))
	}

	ensureSplits() {
		if (!this.heroBodySplit) {
			const heroBody = Array.from(document.querySelectorAll('[data-a="hero-body"]'))

			if (heroBody.length) {
				this.heroBodySplit = SplitText.create(heroBody, {
					type: 'lines',
					mask: 'lines',
					linesClass: 'hero-split-line',
				})

				gsap.set(this.heroBodySplit.lines, {
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

			if (bodyText.length) {
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

		if (!this.aboutTextSplit) {
			const aboutText = Array.from(document.querySelectorAll('[about="text"]'))

			if (aboutText.length) {
				this.aboutTextSplit = SplitText.create(aboutText, {
					type: 'chars',
					charsClass: 'about-text-char',
				})

				gsap.set(this.aboutTextSplit.chars, {
					display: 'inline-block',
					x: '0%',
					opacity: 1,
					willChange: 'transform, opacity',
					force3D: true,
				})
			}
		}

		if (!this.ctaTextSplit) {
			const ctaText = Array.from(document.querySelectorAll('[data-a="cta-txt"]'))

			if (ctaText.length) {
				this.ctaTextSplit = SplitText.create(ctaText, {
					type: 'chars',
					charsClass: 'cta-text-char',
				})

				gsap.set(this.ctaTextSplit.chars, {
					display: 'inline-block',
					x: '0%',
					opacity: 1,
					willChange: 'transform, opacity',
					force3D: true,
				})
			}
		}
	}

	prepareEntryState() {
		gsap.set(this.getTitleChars(), {
			x: (index) => ((index + 1) % 3 === 0 ? '0%' : '-40%'),
			y: (index) => ((index + 1) % 3 === 0 ? '40%' : '0%'),
			opacity: 0,
			marginRight: '0.08em',
		})

		gsap.set(this.getBodyLines(), {
			y: '110%',
		})

		this.getLabelGroups().forEach((chars, index) => {
			gsap.set(chars, {
				x: index < 2 ? '-100%' : '100%',
				opacity: 0,
			})
		})

		gsap.set(this.getBodyTextChars(), {
			x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
			opacity: 0,
		})

		gsap.set(this.getAboutTextChars(), {
			x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
			opacity: 0,
		})

		gsap.set(this.getCtaTextChars(), {
			x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
			opacity: 0,
		})
	}

	scheduleEntryAnimation() {
		const start = () => {
			const firstFrame = window.requestAnimationFrame(() => {
				const secondFrame = window.requestAnimationFrame(() => {
					this.entryStartFrames = []
					this.animateIn()
				})
				this.entryStartFrames.push(secondFrame)
			})
			this.entryStartFrames.push(firstFrame)
		}

		const startAfterVisibleBeat = () => {
			this.entryStartTimer = window.setTimeout(() => {
				this.entryStartTimer = null
				start()
			}, 520)
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
				startAfterVisibleBeat()
			})
			return
		}

		this.entryStartTimer = window.setTimeout(() => {
			this.entryStartTimer = null
			startAfterVisibleBeat()
		}, 120)
	}

	cancelScheduledEntryAnimation() {
		if (this.entryStartTimer) {
			window.clearTimeout(this.entryStartTimer)
			this.entryStartTimer = null
		}

		this.entryStartFrames.forEach((frame) => window.cancelAnimationFrame(frame))
		this.entryStartFrames = []
	}

	animateIn({
		bodyDelay = 0.08,
		titleDelay = 0,
		labelsDelay = 0.08,
		bodyTextDelay = 0.18,
		decorativeDelay = 0.22,
		controlsDelay = 0.32,
		includeBodyText = true,
		includeAboutText = true,
		includeCtaText = true,
		includeControls = true,
	} = {}) {
		this.ensureSplits()
		this.entryTimeline?.kill()
		this.entryTimeline = gsap.timeline()
		this.updateDebugState('animating')

		const titleChars = this.getTitleChars()
		const bodyLines = this.getBodyLines()
		const bodyTextChars = this.getBodyTextChars()
		const aboutTextChars = this.getAboutTextChars()
		const ctaTextChars = this.getCtaTextChars()

		if (titleChars.length) {
			this.entryTimeline.fromTo(titleChars, {
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
			}, titleDelay)
		}

		if (bodyLines.length) {
			this.entryTimeline.fromTo(bodyLines, {
				y: '110%',
			}, {
				y: '0%',
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.035,
			}, bodyDelay)
		}

		this.getLabelGroups().forEach((chars, index) => {
			if (!chars.length) return

			this.entryTimeline.fromTo(chars, {
				x: index < 2 ? '-100%' : '100%',
				opacity: 0,
			}, {
				x: '0%',
				opacity: 1,
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.012,
			}, labelsDelay + (index >= 2 ? 0.06 : 0))
		})

		if (includeBodyText && bodyTextChars.length) {
			this.entryTimeline.fromTo(bodyTextChars, {
				x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
				opacity: 0,
			}, {
				x: '0%',
				opacity: 1,
				duration: 1.15,
				ease: 'power3.out',
				stagger: 0.004,
			}, bodyTextDelay)
		}

		if (includeAboutText && aboutTextChars.length) {
			this.entryTimeline.fromTo(aboutTextChars, {
				x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
				opacity: 0,
			}, {
				x: '0%',
				opacity: 1,
				duration: 1.15,
				ease: 'power3.out',
				stagger: 0.004,
			}, decorativeDelay)
		}

		if (includeCtaText && ctaTextChars.length) {
			this.entryTimeline.fromTo(ctaTextChars, {
				x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
				opacity: 0,
			}, {
				x: '0%',
				opacity: 1,
				duration: 1.15,
				ease: 'power3.out',
				stagger: 0.004,
			}, decorativeDelay)
		}

		if (includeControls) {
			this.entryTimeline.call(() => {
				ctaAnimation.playEntry(0)
				backgroundSound.playEntry(0.08)
			}, null, controlsDelay)
		}

		this.entryTimeline.eventCallback('onComplete', () => {
			this.updateDebugState('complete')
		})
	}

	animateOut({
		bodyDelay = 0,
		titleDelay = 0,
		labelsDelay = 0.24,
		bodyTextDelay = 0.08,
		decorativeDelay = 0.08,
		includeBodyText = true,
		includeAboutText = true,
		includeCtaText = true,
	} = {}) {
		this.cancelScheduledEntryAnimation()
		this.entryTimeline?.kill()

		gsap.to(this.getBodyLines(), {
			y: '-110%',
			duration: 1.05,
			ease: 'power3.inOut',
			stagger: 0.045,
			delay: bodyDelay,
			overwrite: true,
		})

		gsap.to(this.getTitleChars(), {
			x: (index) => ((index + 1) % 3 === 0 ? '0%' : '-40%'),
			y: (index) => ((index + 1) % 3 === 0 ? '40%' : '0%'),
			opacity: 0,
			marginRight: '0.08em',
			duration: 0.95,
			ease: 'power3.inOut',
			stagger: 0.018,
			delay: titleDelay,
			overwrite: true,
		})

		this.getLabelGroups().forEach((chars, index) => {
			gsap.to(chars, {
				x: index < 2 ? '-100%' : '100%',
				opacity: 0,
				duration: 0.85,
				ease: 'power3.inOut',
				stagger: 0.012,
				delay: labelsDelay,
				overwrite: true,
			})
		})

		if (includeBodyText) {
			gsap.to(this.getBodyTextChars(), {
				x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
				opacity: 0,
				duration: 0.85,
				ease: 'power3.inOut',
				stagger: 0.004,
				delay: bodyTextDelay,
				overwrite: true,
			})
		}

		if (includeAboutText) {
			gsap.to(this.getAboutTextChars(), {
				x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
				opacity: 0,
				duration: 0.85,
				ease: 'power3.inOut',
				stagger: 0.004,
				delay: decorativeDelay,
				overwrite: true,
			})
		}

		if (includeCtaText) {
			gsap.to(this.getCtaTextChars(), {
				x: (index) => (index % 2 === 0 ? '-42%' : '42%'),
				opacity: 0,
				duration: 0.85,
				ease: 'power3.inOut',
				stagger: 0.004,
				delay: decorativeDelay,
				overwrite: true,
			})
		}
	}

	dispose() {
		this.cancelScheduledEntryAnimation()
		this.entryTimeline?.kill()
		this.heroBodySplit?.revert()
		this.heroTitleSplit?.revert()
		this.heroLabelSplit?.revert()
		this.bodyTextSplit?.revert()
		this.aboutTextSplit?.revert()
		this.ctaTextSplit?.revert()
	}

	getBodyLines() {
		return this.heroBodySplit?.lines || []
	}

	getTitleChars() {
		return this.heroTitleSplit?.chars || []
	}

	getBodyTextChars() {
		return this.bodyTextSplit?.chars || []
	}

	getAboutTextChars() {
		return this.aboutTextSplit?.chars || []
	}

	getCtaTextChars() {
		return this.ctaTextSplit?.chars || []
	}

	getLabelGroups() {
		if (!this.heroLabelSplit?.chars?.length) return []

		return Array.from(document.querySelectorAll('[data-a="hero-label"]'))
			.map((label) => this.heroLabelSplit.chars.filter((char) => label.contains(char)))
	}

	updateDebugState(status) {
		window.__prayHeroTextState = {
			status,
			titleChars: this.getTitleChars().length,
			bodyLines: this.getBodyLines().length,
			labelChars: this.heroLabelSplit?.chars?.length || 0,
			bodyTextChars: this.getBodyTextChars().length,
			aboutTextChars: this.getAboutTextChars().length,
			ctaTextChars: this.getCtaTextChars().length,
			attempts: this.mountAttempts,
		}
	}
}

export default new HeroText()

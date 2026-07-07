const donateLinkSelector = '[data-a="donate-link"]'
const ctaTextSelector = '[data-a="cta-txt"]'
const originalSvgSelector = '.svg-cta'
const styleId = 'pray-cta-animation-styles'
const svgNamespace = 'http://www.w3.org/2000/svg'

class CtaAnimation {
	constructor() {
		this.links = []
		this.handlePointerEnter = this.handlePointerEnter.bind(this)
		this.handlePointerLeave = this.handlePointerLeave.bind(this)
	}

	mount() {
		this.injectStyles()
		this.collectLinks()
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
		const originalSvg = this.findOriginalSvg(link)
		if (!originalSvg) return

		const wrapper = originalSvg.closest('.cta-svg-wrapper') || originalSvg.parentElement
		if (!wrapper || originalSvg.dataset.ctaAnimationReady === 'true') return

		originalSvg.dataset.ctaAnimationReady = 'true'
		const overlayHost = this.createOverlayHost(originalSvg)

		originalSvg.classList.add('is-cta-source')

		const ambientSvg = this.createLineSvg('cta-line-ambient')

		overlayHost.append(ambientSvg)
	}

	createOverlayHost(originalSvg) {
		const host = document.createElement('span')
		host.className = 'cta-line-host'
		originalSvg.parentNode.insertBefore(host, originalSvg)
		host.appendChild(originalSvg)

		return host
	}

	findOriginalSvg(link) {
		return (
			link.querySelector(originalSvgSelector) ||
			link.closest('.cta-svg-wrapper')?.querySelector(originalSvgSelector) ||
			link.parentElement?.querySelector(originalSvgSelector) ||
			link.parentElement?.parentElement?.querySelector(originalSvgSelector)
		)
	}

	handlePointerEnter(event) {
		const link = event.currentTarget
		const overlayHost = this.findOverlayHost(link)

		link.classList.add('is-cta-hovering')

		if (overlayHost) {
			this.showHoverSvg(overlayHost)
		}
	}

	handlePointerLeave(event) {
		const link = event.currentTarget
		const overlayHost = this.findOverlayHost(link)

		link.classList.remove('is-cta-hovering')

		if (overlayHost) {
			this.hideHoverSvg(overlayHost)
		}
	}

	findOverlayHost(link) {
		const originalSvg = this.findOriginalSvg(link)

		return originalSvg?.closest('.cta-line-host') || null
	}

	showHoverSvg(overlayHost) {
		let hoverSvg = overlayHost.querySelector('.cta-line-hover')

		if (!hoverSvg) {
			hoverSvg = this.createLineSvg('cta-line-hover')
			overlayHost.appendChild(hoverSvg)
		}

		hoverSvg.classList.remove('is-hover-out')
		hoverSvg.classList.remove('is-hover-in')
		void hoverSvg.offsetWidth
		hoverSvg.classList.add('is-hover-in')
	}

	hideHoverSvg(overlayHost) {
		const hoverSvg = overlayHost.querySelector('.cta-line-hover')

		if (!hoverSvg) return

		hoverSvg.classList.remove('is-hover-in')
		hoverSvg.classList.remove('is-hover-out')
		void hoverSvg.offsetWidth
		hoverSvg.classList.add('is-hover-out')
		window.setTimeout(() => {
			hoverSvg.remove()
		}, 1150)
	}

	createLineSvg(className) {
		const svg = document.createElementNS(svgNamespace, 'svg')
		svg.classList.add('cta-line-svg', ...className.split(' '))
		svg.setAttribute('width', '110')
		svg.setAttribute('height', '40')
		svg.setAttribute('viewBox', '0 0 110 40')
		svg.setAttribute('fill', 'none')
		svg.setAttribute('aria-hidden', 'true')

		const lines = [
			{ name: 'left', d: 'M0 0.5H54.75', length: 54.75 },
			{ name: 'right', d: 'M109.5 0.5H54.75', length: 54.75 },
			{ name: 'middle', d: 'M54.75 40V0.5', length: 39.5 },
		]

		lines.forEach((line) => {
			const path = document.createElementNS(svgNamespace, 'path')
			path.classList.add('cta-line', `cta-line-${line.name}`)
			path.setAttribute('d', line.d)
			path.setAttribute('pathLength', '1')
			path.style.setProperty('--line-length', line.length)
			svg.appendChild(path)
		})

		return svg
	}

	injectStyles() {
		if (document.getElementById(styleId)) return

		const style = document.createElement('style')
		style.id = styleId
		style.textContent = `
			.cta-svg-wrapper {
				position: relative;
			}

			.cta-line-host {
				position: relative;
				display: inline-block;
				width: max-content;
				height: max-content;
				line-height: 0;
			}

			.cta-line-host .svg-cta {
				display: block;
			}

			.cta-svg-wrapper .svg-cta.is-cta-source {
				opacity: 1;
			}

			${donateLinkSelector} ${ctaTextSelector} {
				transition: opacity 320ms cubic-bezier(0.16, 1, 0.3, 1);
			}

			${donateLinkSelector}.is-cta-hovering ${ctaTextSelector} {
				opacity: 0.5;
			}

			.cta-line-svg {
				position: absolute;
				top: 0;
				left: 0;
				width: 110px;
				height: 40px;
				color: #ffffff;
				pointer-events: none;
				overflow: visible;
				z-index: 2;
			}

			.cta-line {
				stroke: #ffffff;
				stroke-width: 1;
				stroke-linecap: round;
				stroke-linejoin: round;
				fill: none;
				stroke-dasharray: 1;
				stroke-dashoffset: 1;
				vector-effect: non-scaling-stroke;
			}

			.cta-line-ambient .cta-line {
				animation-name: pray-cta-draw-loop;
				animation-duration: 3.8s;
				animation-timing-function: cubic-bezier(0.65, 0, 0.2, 1);
				animation-iteration-count: infinite;
			}

			.cta-line-ambient .cta-line-left {
				animation-delay: 0s;
			}

			.cta-line-ambient .cta-line-right {
				animation-delay: 0.12s;
			}

			.cta-line-ambient .cta-line-middle {
				animation-delay: 0.26s;
			}

			.cta-line-hover {
				z-index: 3;
			}

			.cta-line-hover .cta-line {
				stroke: #ffd84d;
				stroke-dashoffset: 1;
				opacity: 0;
			}

			.cta-line-hover.is-hover-in .cta-line {
				animation-name: pray-cta-draw-hover-in;
				animation-duration: 0.92s;
				animation-timing-function: cubic-bezier(0.65, 0, 0.2, 1);
				animation-fill-mode: forwards;
			}

			.cta-line-hover.is-hover-out .cta-line {
				animation-name: pray-cta-draw-hover-out;
				animation-duration: 0.92s;
				animation-timing-function: cubic-bezier(0.65, 0, 0.2, 1);
				animation-fill-mode: forwards;
				stroke-dashoffset: 0;
				opacity: 1;
			}

			.cta-line-hover .cta-line-left {
				animation-delay: 0s;
			}

			.cta-line-hover .cta-line-right {
				animation-delay: 0.12s;
			}

			.cta-line-hover .cta-line-middle {
				animation-delay: 0.26s;
			}

			@keyframes pray-cta-draw-loop {
				0% {
					stroke-dashoffset: 1;
					opacity: 0.25;
				}
				12% {
					opacity: 1;
				}
				42% {
					stroke-dashoffset: 0;
					opacity: 1;
				}
				70% {
					stroke-dashoffset: 0;
					opacity: 1;
				}
				100% {
					stroke-dashoffset: -1;
					opacity: 0.25;
				}
			}

			@keyframes pray-cta-draw-hover-in {
				0% {
					stroke-dashoffset: 1;
					opacity: 0;
				}
				12% {
					opacity: 1;
				}
				100% {
					stroke-dashoffset: 0;
					opacity: 1;
				}
			}

			@keyframes pray-cta-draw-hover-out {
				0% {
					stroke-dashoffset: 0;
					opacity: 1;
				}
				70% {
					opacity: 1;
				}
				100% {
					stroke-dashoffset: -1;
					opacity: 0;
				}
			}

		`

		document.head.appendChild(style)
	}
}

export default new CtaAnimation()

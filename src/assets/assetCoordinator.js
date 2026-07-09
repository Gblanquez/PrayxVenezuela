import * as THREE from 'three'

class AssetCoordinator {
	constructor() {
		this.loadingManager = new THREE.LoadingManager()
		this.aboutPreloadTimer = null
		this.aboutPreloadStarted = false
		this.aboutPreloadCallback = null
		this.state = {
			loaded: 0,
			total: 0,
			isLoading: false,
			isReady: false,
		}

		this.loadingManager.onStart = (_url, loaded, total) => {
			this.updateState({ loaded, total, isLoading: true, isReady: false })
		}

		this.loadingManager.onProgress = (_url, loaded, total) => {
			this.updateState({ loaded, total, isLoading: true })
		}

		this.loadingManager.onLoad = () => {
			this.updateState({ isLoading: false, isReady: true })
		}

		this.loadingManager.onError = (url) => {
			this.updateState({ lastError: url })
		}
	}

	getLoadingManager() {
		return this.loadingManager
	}

	setAboutPreloadCallback(callback) {
		this.aboutPreloadCallback = callback
	}

	scheduleAboutPreload(delay = 3000) {
		if (this.aboutPreloadStarted || this.aboutPreloadTimer) return

		this.aboutPreloadTimer = window.setTimeout(() => {
			this.aboutPreloadTimer = null
			this.preloadAboutVideos('delay')
		}, delay)
	}

	preloadAboutVideos(reason = 'manual') {
		if (this.aboutPreloadStarted) return

		this.aboutPreloadStarted = true
		if (this.aboutPreloadTimer) {
			window.clearTimeout(this.aboutPreloadTimer)
			this.aboutPreloadTimer = null
		}

		this.updateState({ aboutPreloadReason: reason })
		this.aboutPreloadCallback?.()
	}

	dispose() {
		if (this.aboutPreloadTimer) {
			window.clearTimeout(this.aboutPreloadTimer)
			this.aboutPreloadTimer = null
		}
		this.aboutPreloadCallback = null
	}

	updateState(values) {
		this.state = {
			...this.state,
			...values,
		}
		window.__prayAssetState = this.state
	}
}

export default new AssetCoordinator()

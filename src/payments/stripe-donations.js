const DEFAULT_CHECKOUT_ENDPOINT = '/api/create-checkout-session'
const DEFAULT_CURRENCY = 'usd'

function getConfig() {
	return {
		checkoutEndpoint:
			window.PRAYX_STRIPE_CHECKOUT_ENDPOINT || DEFAULT_CHECKOUT_ENDPOINT,
		currency: window.PRAYX_DONATION_CURRENCY || DEFAULT_CURRENCY,
	}
}

function getDonationPayload(source, config) {
	const form = source instanceof HTMLFormElement ? source : source.closest('form')
	const formData = form ? new FormData(form) : null
	const dataset = source.dataset || {}

	const rawAmount =
		formData?.get('amount') ||
		dataset.donationAmount ||
		dataset.amount ||
		source.value
	const amount = Number.parseFloat(rawAmount)

	if (!Number.isFinite(amount) || amount <= 0) {
		throw new Error('Choose a valid donation amount.')
	}

	return {
		amount: Math.round(amount * 100),
		currency: formData?.get('currency') || dataset.currency || config.currency,
		email: formData?.get('email') || dataset.email || undefined,
		campaign: formData?.get('campaign') || dataset.campaign || 'pray-for-venezuela',
	}
}

async function createCheckoutSession(payload, endpoint) {
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		throw new Error('Could not start checkout.')
	}

	return response.json()
}

function setBusy(source, isBusy) {
	if (source instanceof HTMLButtonElement) {
		source.disabled = isBusy
		source.setAttribute('aria-busy', String(isBusy))
	}
}

function redirectToStripe(session) {
	if (!session?.url) {
		throw new Error('Checkout session is missing a redirect URL.')
	}

	window.location.href = session.url
}

export function initDonationCheckout() {
	const triggers = document.querySelectorAll('[data-donation-checkout]')

	triggers.forEach((trigger) => {
		const eventName = trigger instanceof HTMLFormElement ? 'submit' : 'click'

		trigger.addEventListener(eventName, async (event) => {
			event.preventDefault()

			const config = getConfig()
			const source = event.currentTarget

			try {
				setBusy(source, true)
				const payload = getDonationPayload(source, config)
				const session = await createCheckoutSession(
					payload,
					config.checkoutEndpoint,
				)
				redirectToStripe(session)
			} catch (error) {
				window.dispatchEvent(
					new CustomEvent('prayx:donation-error', {
						detail: { message: error.message },
					}),
				)
				console.error(error)
			} finally {
				setBusy(source, false)
			}
		})
	})
}

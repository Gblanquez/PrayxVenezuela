const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const ALLOWED_CURRENCIES = new Set(['usd', 'eur'])
const MIN_DONATION_CENTS = 100
const MAX_DONATION_CENTS = 1000000

function getOrigin(req) {
	return (
		process.env.SITE_URL ||
		req.headers.origin ||
		`https://${req.headers.host}`
	).replace(/\/$/, '')
}

function sendJson(res, statusCode, payload) {
	res.statusCode = statusCode
	res.setHeader('Content-Type', 'application/json')
	res.end(JSON.stringify(payload))
}

module.exports = async function handler(req, res) {
	const allowedOrigin = process.env.WEBFLOW_ORIGIN || req.headers.origin || '*'
	res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

	if (req.method === 'OPTIONS') {
		res.statusCode = 204
		res.end()
		return
	}

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		sendJson(res, 405, { error: 'Method not allowed' })
		return
	}

	if (!process.env.STRIPE_SECRET_KEY) {
		sendJson(res, 500, { error: 'Stripe is not configured.' })
		return
	}

	const amount = Number(req.body?.amount)
	const currency = String(req.body?.currency || 'usd').toLowerCase()

	if (
		!Number.isInteger(amount) ||
		amount < MIN_DONATION_CENTS ||
		amount > MAX_DONATION_CENTS
	) {
		sendJson(res, 400, { error: 'Donation amount is invalid.' })
		return
	}

	if (!ALLOWED_CURRENCIES.has(currency)) {
		sendJson(res, 400, { error: 'Donation currency is not supported.' })
		return
	}

	const origin = getOrigin(req)
	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		success_url: `${process.env.STRIPE_SUCCESS_URL || `${origin}/donation-success`}?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: process.env.STRIPE_CANCEL_URL || `${origin}/donate`,
		customer_email: req.body?.email || undefined,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency,
					unit_amount: amount,
					product_data: {
						name: 'Pray for Venezuela donation',
						description: 'Aid and relief support for Venezuela',
					},
				},
			},
		],
		metadata: {
			campaign: req.body?.campaign || 'pray-for-venezuela',
		},
	})

	sendJson(res, 200, { id: session.id, url: session.url })
}

import './styles/style.css'
import { initDonationCheckout } from './payments/stripe-donations'
import prayScene from './sketch/sketch'

initDonationCheckout()
prayScene.mount()

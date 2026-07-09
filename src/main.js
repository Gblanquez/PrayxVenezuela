import './styles/style.css'
import prayScene from './sketch/sketch'
import backgroundSound from './sound/background'
import ctaAnimation from './animation/cta'
import heroText from './text/heroText'
import smoothCornersUrl from 'smooth-corners?url';

if ('paintWorklet' in CSS) {

  CSS.paintWorklet.addModule(smoothCornersUrl);

}

heroText.mount()
prayScene.mount()
backgroundSound.mount()
ctaAnimation.mount()

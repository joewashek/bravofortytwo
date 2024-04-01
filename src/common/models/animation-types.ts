import { Animation } from "@babylonjs/core";

const animationFps = 30;

const flipAnimation = new Animation("flip", "rotation.x", animationFps, Animation.ANIMATIONTYPE_FLOAT, 0, true);
const fadeAnimation = new Animation("entranceAndExitFade", "visibility", animationFps, Animation.ANIMATIONTYPE_FLOAT, 0, true);
const scaleAnimation = new Animation("scaleTarget", "scaling", animationFps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE, true);

export {
  flipAnimation,
  fadeAnimation,
  scaleAnimation,
  animationFps
}
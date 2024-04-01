import { Scene } from "@babylonjs/core";

export default interface IGameScene{
  scene: Scene
  update: (deltaTime: number | null)=> void
  attachControls: ()=>void
  detachControls: ()=>void
}
import { AnimationGroup, Observable, Scene } from "@babylonjs/core";

export default class CutSceneSegment{

  private _animationGroup: AnimationGroup;
  private _onEnd: Observable<AnimationGroup>;
  private _loopAnimation: boolean = false;

  constructor(
    private _target:any,
    private _scene:Scene,
    private _animationSequences: any[]
    ){
      this._animationGroup = new AnimationGroup(_target.name + "-animGroupCS",_scene);
      for(const aniseq of _animationSequences){
        this._animationGroup.addTargetedAnimation(aniseq,_target);
      }
      this._onEnd = this._animationGroup.onAnimationGroupEndObservable;
  }

  get onEnd(){
    return this._onEnd;
  }

  public start(){
    this._animationGroup.start(this._loopAnimation);
  }

  public stop(){
    this._animationGroup.stop();
  }
}
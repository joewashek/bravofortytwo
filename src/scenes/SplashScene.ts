import {
  ArcRotateCamera,
  Color3,
  Color4,
  CreatePlane,
  Engine,
  HemisphericLight,
  Mesh,
  Observable,
  Scene,
  Sound,
  StandardMaterial,
  Texture,
  Vector3,
} from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import {
  animationFps,
  fadeAnimation,
  flipAnimation,
  scaleAnimation,
} from "../common/models/animation-types";
import CutSceneSegment from "../common/models/CutSceneSegment";
import logger from "../infrastructure/logger";
import poweredByUrl from "../assets/powered-by.png";
import communityUrl from "../assets/splash-screen-community.png";
import spaceTruckerRigUrl from "../assets/space-trucker-and-rig.png";
import babylonLogoUrl from "../assets/babylonjs_identity_color.png";
import GameInputProcessor from "../infrastructure/GameInputProcessor";
import IGameScene from "../common/interfaces/IGameScene";
import GameSoundManager from "../infrastructure/GameSoundManager";
import { SoundId } from "../infrastructure/GameSoundMap";

const actionList = [{ action: "ACTIVATE", shouldBounce: () => true }];

export default class SplashScene implements IGameScene {
  private _skipRequested: boolean;
  private _onReadyObservable: Observable<unknown>;
  private _scene: Scene;
  private _camera: ArcRotateCamera;
  private _light: HemisphericLight;
  private _billboard: Mesh;
  private _callToActionTexture: AdvancedDynamicTexture;
  private _currentSegment: CutSceneSegment | null = null;
  private _poweredBy: CutSceneSegment;
  private _babylonBillboard: CutSceneSegment;
  private _communityProduction: CutSceneSegment;
  private _callToAction: CutSceneSegment;
  private _actionProcessor: GameInputProcessor;
  private _audioManager: GameSoundManager;

  constructor(private _engine: Engine, inputManager: any) {
    this._skipRequested = false;
    this._onReadyObservable = new Observable();
    this._scene = new Scene(this._engine);
    this._scene.clearColor = Color4.FromColor3(Color3.Black());
    this._camera = new ArcRotateCamera(
      "camera",
      0,
      Math.PI / 2,
      5,
      Vector3.Zero(),
      this._scene
    );
    this._light = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      this._scene
    );
    this._light.groundColor = Color3.White();
    this._light.intensity = 0.5;
    this._billboard = CreatePlane(
      "billboard",
      {
        width: 5,
        height: 3,
      },
      this._scene
    );
    this._billboard.rotation.z = Math.PI;
    this._billboard.rotation.x = Math.PI;
    this._billboard.rotation.y = Math.PI / 2;
    const billMat = new StandardMaterial("stdMat", this._scene);
    this._billboard.material = billMat;

    const poweredTexture = new Texture(poweredByUrl, this._scene);
    billMat.diffuseTexture = poweredTexture;

    const babylonTexture = new Texture(babylonLogoUrl, this._scene);
    const communityTexture = new Texture(communityUrl, this._scene);
    const rigTexture = new Texture(spaceTruckerRigUrl, this._scene);

    this._callToActionTexture =
      AdvancedDynamicTexture.CreateFullscreenUI("splashGui");
    let ctaBlock = new TextBlock(
      "ctaBlock",
      "Press any key or tap the screen to continue..."
    );
    //ctaBlock.textWrapping = TextWrapping.WordWrap;
    ctaBlock.textWrapping = 1;
    ctaBlock.color = "white";
    ctaBlock.fontSize = "18pt";
    ctaBlock.verticalAlignment = ctaBlock.textVerticalAlignment =
      TextBlock.VERTICAL_ALIGNMENT_BOTTOM;
    ctaBlock.paddingBottom = "12%";
    ctaBlock.isVisible = false;
    this._callToActionTexture.addControl(ctaBlock);

    this._poweredBy = this.buildPoweredByAnimations();
    this._babylonBillboard = this.buildBabylonAnimations();
    this._communityProduction = this.buildCommunityProductionAnimations();
    this._callToAction = this.buildcallToActionAnimation();

    this._poweredBy.onEnd.addOnce(() => {
      billMat.diffuseTexture = babylonTexture;
      this._billboard.rotation.x = Math.PI;
      this._light.intensity = 0.667;
      this._billboard.visibility = 0;
      this._currentSegment = this._babylonBillboard;
    });

    this._babylonBillboard.onEnd.addOnce(() => {
      billMat.diffuseTexture = communityTexture;
      this._billboard.rotation.x = Math.PI;
      this._billboard.visibility = 0;
      this._currentSegment = this._communityProduction;
    });

    this._communityProduction.onEnd.addOnce(() => {
      this._billboard.visibility = 0;
      this._currentSegment = this._callToAction;
      billMat.diffuseTexture = rigTexture;
    });

    this._callToAction.onEnd.addOnce(() => {
      ctaBlock.isVisible = true;
    });

    this._actionProcessor = new GameInputProcessor(
      this,
      inputManager,
      actionList
    );

    this._audioManager = new GameSoundManager(this._scene, SoundId.TITLE);
    this._audioManager.onReadyObservable.addOnce((_) =>
      this.onReadyObservable.notifyObservers(null)
    );
  }

  get music() {
    return this._audioManager.sound(SoundId.TITLE);
  }

  get scene() {
    return this._scene;
  }

  attachControls() {
    this._actionProcessor.attachControl();
  }

  detachControls() {
    this._actionProcessor.detachControl();
  }

  get onReadyObservable() {
    return this._onReadyObservable;
  }

  get skipRequested() {
    return this._skipRequested;
  }

  run() {
    logger.logInfo("Running splash scene");
    this._currentSegment = this._poweredBy;
    this.music.play();
    this.music.setVolume(0.998, 400);
    this._currentSegment.start();
    // this.scene.onBeforeRenderObservable.add(() => {

    // });
  }

  update() {
    let prior,
      curr = this._currentSegment;
    this._actionProcessor?.update();
    if (this._skipRequested) {
      this?._currentSegment?.stop();
      this._currentSegment = null;
      return;
    }
    curr = this._currentSegment;
    if (prior !== curr) {
      this._currentSegment?.start();
    }
  }

  ACTIVATE(state: any): boolean {
    const lastState = state.priorState;
    if (!this._skipRequested && !lastState) {
      logger.logInfo("Key press detected. Skipping cut scene.");
      this._skipRequested = true;
      this.music?.stop();
      return true;
    }
    return false;
  }

  private buildcallToActionAnimation() {
    const start = 0;
    const enterTime = 3.0;
    const exitTime = enterTime + 2.5;
    const end = exitTime + 3.0;
    const entranceFrame = enterTime * animationFps;
    const beginExitFrame = exitTime * animationFps;
    const endFrame = end * animationFps;
    const keys = [
      { frame: start, value: 0 },
      { frame: entranceFrame, value: 1 },
      { frame: beginExitFrame, value: 0.998 },
      { frame: endFrame, value: 1 },
    ];

    const startVector = new Vector3(1, 1, 1);
    const scaleKeys = [
      { frame: start, value: startVector },
      { frame: entranceFrame, value: new Vector3(1.25, 1, 1.25) },
      { frame: beginExitFrame, value: new Vector3(1.5, 1, 1.5) },
      { frame: endFrame, value: new Vector3(1, 1, 1) },
    ];

    fadeAnimation.setKeys(keys);
    scaleAnimation.setKeys(scaleKeys);

    const seg = new CutSceneSegment(this._billboard, this._scene, [
      fadeAnimation,
      scaleAnimation,
    ]);
    return seg;
  }

  private buildCommunityProductionAnimations() {
    const start = 0;
    const enterTime = 4.0;
    const exitTime = enterTime + 2.5;
    const end = exitTime + 3.0;
    const entranceFrame = enterTime * animationFps;
    const beginExitFrame = exitTime * animationFps;
    const endFrame = end * animationFps;
    const keys = [
      { frame: start, value: 0 },
      { frame: entranceFrame, value: 1 },
      { frame: beginExitFrame, value: 0.998 },
      { frame: endFrame, value: 0 },
    ];

    fadeAnimation.setKeys(keys);

    const seg2 = new CutSceneSegment(this._billboard, this._scene, [
      fadeAnimation,
    ]);
    return seg2;
  }

  private buildBabylonAnimations() {
    const start = 0;
    const enterTime = 2.5;
    const exitTime = enterTime + 2.5;
    const end = exitTime + 2.5;
    const entranceFrame = enterTime * animationFps;
    const beginExitFrame = exitTime * animationFps;
    const endFrame = end * animationFps;
    const keys = [
      { frame: start, value: 0 },
      { frame: entranceFrame, value: 1 },
      { frame: beginExitFrame, value: 0.998 },
      { frame: endFrame, value: 0 },
    ];
    fadeAnimation.setKeys(keys);

    const seg1 = new CutSceneSegment(this._billboard, this._scene, [
      fadeAnimation,
    ]);
    return seg1;
  }

  private buildPoweredByAnimations() {
    const start = 0;
    const enterTime = 3.5;
    const exitTime = enterTime + 2.5;
    const end = exitTime + 2.5;

    const entranceFrame = enterTime * animationFps;
    const beginExitFrame = exitTime * animationFps;
    const endFrame = end * animationFps;
    const keys = [
      { frame: start, value: 0 },
      { frame: entranceFrame, value: 1 },
      { frame: beginExitFrame, value: 0.998 },
      { frame: endFrame, value: 0 },
    ];
    fadeAnimation.setKeys(keys);

    const flipKeys = [
      { frame: start, value: Math.PI },
      { frame: entranceFrame, value: 0 },
      { frame: beginExitFrame, value: Math.PI },
      { frame: endFrame, value: 2 * Math.PI },
    ];
    flipAnimation.setKeys(flipKeys);

    const seg0 = new CutSceneSegment(this._billboard, this._scene, [
      fadeAnimation,
      flipAnimation,
    ]);
    return seg0;
  }
}

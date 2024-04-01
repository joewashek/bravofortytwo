import { ArcRotateCamera, Color4, Engine, FreeCamera, HemisphericLight, MeshBuilder, Observable, Scalar, Scene, Vector3, setAndStartTimer } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle,Image, Grid, TextBlock, TextWrapping, Control, Button } from "@babylonjs/gui";
import menuBackground from '../assets/world_war_forest.png';
import IGameScene from "../common/interfaces/IGameScene";
import GameInputProcessor from "../infrastructure/GameInputProcessor";
import GameInputManager from "../infrastructure/GameInputManager";
import logger from "../infrastructure/logger";

const menuActionList: { [key:string]: any} = [
  { action: 'ACTIVATE', shouldBounce: () => true },
  { action: 'MOVE_UP', shouldBounce: () => true },
  { action: 'MOVE_DOWN', shouldBounce: () => true },
  { action: 'MOVE_RIGHT', shouldBounce: () => true },
  { action: 'MOVE_LEFT', shouldBounce: () => true },
  { action: 'GO_BACK', shouldBounce: () => true }
];

class MainMenuScene implements IGameScene{

  private _scene: Scene;
  private _actionProcessor: GameInputProcessor;
  private _menuGrid: Grid = new Grid("menuGrid");
  private _menuContainer: Rectangle = new Rectangle("menuContainer");
  private _onPlayActionObservable = new Observable();

  constructor(private _engine: Engine,inputManager:GameInputManager){

    const scene = new Scene(_engine);
    this._scene = scene;

    //scene.clearColor = new Color4(0, 0, 0, 1);
    
    //const camera = new ArcRotateCamera("menuCam", 0, 0, -30, Vector3.Zero(), scene, true);

    this.setupBackgroundEnvironment(scene);
    this.setupUI();
    this.addMenuItems();

    this._actionProcessor = new GameInputProcessor(this,inputManager,menuActionList);
  }
  
  get scene(){
    return this._scene;
  }

  get onPlayActionObservable(){
    return this._onPlayActionObservable;
  }

  update(){
   this._actionProcessor.update();
  }

  attachControls(){
    this._actionProcessor.attachControl();
  }

  detachControls(){
    this._actionProcessor.detachControl();
  }

  private setupBackgroundEnvironment(scene:Scene){
   // This creates and positions a free camera (non-mesh)
    const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene)

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero())

    const canvas = scene.getEngine().getRenderingCanvas()

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true)

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7

    // Our built-in 'box' shape.
    const box = MeshBuilder.CreateBox('box', { size: 2 }, scene)

    // Move the box upward 1/2 its height
    box.position.y = 1

    // Our built-in 'ground' shape.
    MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene)
  }

  private setupUI(){
    const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    gui.renderAtIdealSize = true;
    //this._guiMenu = gui;
    this._menuContainer = new Rectangle("menuContainer");
    this._menuContainer.width = 0.8;
    this._menuContainer.thickness = 5;
    this._menuContainer.cornerRadius = 13;

    gui.addControl(this._menuContainer);
    //this._menuContainer = menuContainer;

    const menuBg = new Image("menuBg", menuBackground);
    this._menuContainer.addControl(menuBg);

    this._menuGrid.addColumnDefinition(0.33);
    this._menuGrid.addColumnDefinition(0.33);
    this._menuGrid.addColumnDefinition(0.33);
    this._menuGrid.addRowDefinition(0.5);
    this._menuGrid.addRowDefinition(0.5);
    this._menuContainer.addControl(this._menuGrid);

    const titleText = new TextBlock("title", "Bravo 1942");
    titleText.resizeToFit = true;
    titleText.textWrapping = TextWrapping.WordWrap;
    titleText.fontSize = "72pt";
    titleText.color = "white";
    titleText.width = 0.9;
    titleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    titleText.paddingTop = titleText.paddingBottom = "18px";
    titleText.shadowOffsetX = 3;
    titleText.shadowOffsetY = 6;
    titleText.shadowBlur = 2;
    this._menuContainer.addControl(titleText);
  }

  private addMenuItems(){
    function createMenuItem(opts:any) {
      const btn = Button.CreateSimpleButton(opts.name || "", opts.title);
      btn.color = opts.color || "white";
      btn.background = opts.background || "green";
      btn.height = "80px";
      btn.thickness = 4;
      btn.cornerRadius = 80;
      btn.shadowOffsetY = 12;
      btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      btn.fontSize = "36pt";

      if (opts.onInvoked) {
          btn.onPointerClickObservable.add((ed, es) => opts.onInvoked(ed, es));
      }

      return btn;
    }

    const pbOpts = {
      name: "btPlay",
      title: "Play",
      background: "red",
      color: "white",
      onInvoked: () => {
          logger.logInfo("Play button clicked");
          this.onMenuLeave(1000, () => this._onPlayActionObservable.notifyObservers(null))
      }
    };
    const playButton = createMenuItem(pbOpts);
    this._menuGrid.addControl(playButton, this._menuGrid.children.length, 1);
  }

  private onMenuLeave(duration:number,onEndedAction:()=>void){
    let fadeOut = 0;
    const fadeTime = duration;

    this._menuContainer.isVisible = false;

    const timer = setAndStartTimer({
      timeout: fadeTime,
      contextObservable: this._scene.onBeforeRenderObservable,
      onTick: () => {
          const dT = this._scene.getEngine().getDeltaTime();
          fadeOut += dT;
          const currAmt = Scalar.SmoothStep(1, 0, fadeOut / fadeTime);
          this._menuContainer.alpha = currAmt;

      },
      onEnded: () => {
        onEndedAction();
        //this._music.stop();
      }
    });
    return timer;
  }
}

export default MainMenuScene;
import { ArcRotateCamera,HavokPlugin, Color3, Color4, Engine,HemisphericLight,MeshBuilder,Observable,Scene, SceneLoader, Texture, Vector3, PhysicsAggregate, PhysicsShapeType, AbstractMesh, AssetContainer, ISceneLoaderProgressEvent, AnimationGroup, KeyboardInfo, StandardMaterial, CubeTexture } from "@babylonjs/core";
import GameInputManager, { KeyData } from "../../infrastructure/GameInputManager";
import IGameScene from "../../common/interfaces/IGameScene";
import "@babylonjs/loaders/glTF";
import HavokPhysics from '@babylonjs/havok';
import { TerrainMaterial } from "@babylonjs/materials/terrain";
import GameInputProcessor from "../../infrastructure/GameInputProcessor";
import GameSoundManager from "../../infrastructure/GameSoundManager";
import FirstPersonCharacter, { CharacterDirection } from "../../players/FirstPersonCharacter";
import { defaultSkybox } from "../../common/models/environment/standard-env-models";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";

const actionList = [
  {action: "RELOAD", shouldBounce: () => false },
  {action: "MOVE_FORWARD", shouldBounce: () => false },
  {action: "MOVE_BACK", shouldBounce: () => false },
  {action: "MOVE_RIGHT", shouldBounce: () => false },
  {action: "MOVE_LEFT", shouldBounce: () => false },
  {action: "SHIFT_DOWN", shouldBounce: () => false },
]

const TUTORIAL_STATE = Object.freeze({
  CREATED: 0,
  INITIALIZED: 2,
  RUNNING: 3,
  EXITING: 4
})
 
export default class TutorialScene implements IGameScene{

  private _scene: Scene;
  private _camera: ArcRotateCamera;
  private _actionProcessor: GameInputProcessor;
  
  private _audioManager: GameSoundManager;
  private _onStateChangeObservable = new Observable();
  private _state: number = TUTORIAL_STATE.CREATED;
  private _previousState: number = TUTORIAL_STATE.CREATED;
  private _gameState: number;
  //private _playerMesh?: AbstractMesh;
  private _localPlayer: FirstPersonCharacter;
  private charDropHeight = 14; //y pos where character enters scene, should be higher than max ground height
  private gunAnimations: AnimationGroup[] = [];
  private _inputMap = {};
  private _groundAggregate: PhysicsAggregate;

  // UI
  private _positionBox = new TextBlock("positionBox","");

  constructor(
    private _engine: Engine,
    private inputManager: GameInputManager
  ){
    
    this._onStateChangeObservable.add((s:any) => console.log(`${s.currentState} is new state. Prev was ${s.priorState}`));
    const scene = new Scene(this._engine);
    scene.useRightHandedSystem = true;
    
    //sound manager
    scene.clearColor = new Color4(0.75,0.75,0.75,1);
    scene.ambientColor = new Color3(1,1,1);
    
    this._camera = new ArcRotateCamera("camera1",  0, 0, 0.45, Vector3.Zero(), scene);
    this._camera.upperRadiusLimit = this._camera.radius;
    this._camera.lowerRadiusLimit = this._camera.radius;
    this._camera.attachControl(this._engine.getRenderingCanvas(), false);

    this._gameState = TUTORIAL_STATE.INITIALIZED;

    const earthGravity = -9.81;
    HavokPhysics()
    .then(havokInstance => {
      this._scene.enablePhysics(new Vector3(0, earthGravity , 0), new HavokPlugin(true,havokInstance))
      this.setupTestEnv();
      this.setupUI();
    });
   
    this._scene = scene;

    scene.onPointerDown = (evt) => {
      if (evt.button === 0) this._engine.enterPointerlock();
      if (evt.button === 1) this._engine.exitPointerlock();
    };

    this._actionProcessor = new GameInputProcessor(this, inputManager, actionList);
  }
  

  get gameState(){
    return this._state;
  }

  set gameState(value:number){
    if(this._state !== value){
      this._previousState = this._state;
      this._state = value;
      this._onStateChangeObservable.notifyObservers({priorState: this._previousState,currentState: value});
    }
  }
  private setupUI(){
    const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    //const positionBox = new TextBlock("positionBox","init");
    this._positionBox.fontSize = "18pt";
    this._positionBox.color = "white";
    this._positionBox.width = 0.20;
    this._positionBox.outlineColor = "red";
    this._positionBox.top = "-45%";
    //positionBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    gui.addControl(this._positionBox);
    // this._scene.onAfterRenderObservable.add(()=>{
    //   positionBox.text = `X: ${this._playerMesh?.position?.x ?? 0} - Y: ${this._playerMesh?.position?.y ?? 0} - Z: ${this._playerMesh?.position?.z ?? 0}`
    // })
    
  }
  private async setupTestEnv(){
    //Skybox
    defaultSkybox(this._scene,800)

    var light1 = new HemisphericLight("light1", new Vector3(1, 0.5, 0), this._scene);
	  light1.intensity = 0.7;
	 
    
   // Ground
   var groundMaterial = new StandardMaterial("ground", this._scene);
   groundMaterial.diffuseTexture = new Texture(process.env.PUBLIC_URL+"/textures/tutorial4texture.jpg", this._scene);

    const groundMesh = MeshBuilder.CreateGroundFromHeightMap("groundMesh",`${process.env.PUBLIC_URL}/textures/tutorial4terrain.png`,{
      height:500,
      width: 500,
      maxHeight: 100,
      subdivisions: 200,
      onReady: (mesh, heightBuffer) => {
        this._groundAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0 });
        this.loadPlayer();
      },
    });
    
    groundMesh.position.y = -10;
    groundMesh.checkCollisions = true;
    groundMesh.isPickable = false;
    groundMesh.receiveShadows = true;
    groundMesh.material = groundMaterial;
  }

  get scene(): Scene{
    return this._scene;
  }

  public update (deltaTime:number | null){
    const dT = deltaTime ?? (this.scene.getEngine().getDeltaTime() / 1000);
    this._actionProcessor?.update();
    this._localPlayer?.update(dT);
    this.updateUI();

    switch (this.gameState) {
      case TUTORIAL_STATE.CREATED:
          break;
      case TUTORIAL_STATE.RUNNING:
          break;
      default:
          break;
    }
  };

  private updateUI(){
    if(this._localPlayer){
      this._positionBox.text = `X: ${this._localPlayer.PlayerMesh.position.x.toFixed(2)} - Y: ${this._localPlayer.PlayerMesh.position.y.toFixed(2)} - Z: ${this._localPlayer?.PlayerMesh.position.z.toFixed(2)}`
    }
  }

  public async loadPlayer(){
    
    this._localPlayer = new FirstPersonCharacter(this._scene,this._camera,new Vector3(150,55,-150),{maxPosX:245,maxPosZ:245});
    this.loadPistol();

  }

  public loadAsset(
    rootUrl: string,
    sceneFilename: string,
    callback?: (event: ISceneLoaderProgressEvent) => void
  ): Promise<AssetContainer> {
      return new Promise((resolve, reject) => {
          SceneLoader.LoadAssetContainer(
              rootUrl,
              sceneFilename,
              this.scene,
              (container) => {
                  resolve(container);
              },
              (evt) => {
                  callback && callback(evt);
              },
              () => {
                  reject(null);
              }
          );
      });
  }

  private fireWeapon(){
    //scene.animationGroups[0].start(false, 1.0, .035, 0.4);
    this.gunAnimations[1].start(false,1,220,246);
    this.gunAnimations[1].onAnimationGroupEndObservable.add(()=>{
      console.log('gun anim done.')
    })
  }

  private async loadPistol(){
    const weaponImportResult = await SceneLoader.ImportMeshAsync(
      "",
      "https://raw.githubusercontent.com/joewashek/babylon-assets/main/weapons/","hk_pistol.glb",
      this._scene,
      undefined,
      ".glb");

     weaponImportResult.animationGroups.forEach((aniGrp,index)=>{
      aniGrp.stop();
     })

     this.gunAnimations = weaponImportResult.animationGroups;
    
    const weaponMesh = weaponImportResult.meshes[0];
    weaponMesh.isPickable = false;
    weaponMesh.scaling = new Vector3(2, 2,2);
    weaponMesh.parent = this._camera;
    weaponMesh.position.z -=0.5;
    weaponMesh.rotation = new Vector3(0,0,-0.1);

    const cubeTarget = weaponImportResult.meshes.find(m => m.name === "Cube.001_Texture.002_0");
    if(cubeTarget)cubeTarget.isVisible = false;
    const enemyTarget = weaponImportResult.meshes.find(m => m.name === "enemy_model_Texture.002_0");
    if(enemyTarget)enemyTarget.isVisible = false;
  }
  
  attachControls(){
    this._actionProcessor.attachControl();
  }

  detachControls(){
    this._actionProcessor.detachControl();
  }

  public setTutorialRunningState(){
    this._gameState = TUTORIAL_STATE.RUNNING;
  }

  private RELOAD(state:any,data:any){
    console.log('RELOAD Fired!!!!!')
    console.log(data)
  }

  private MOVE_FORWARD(state:any,data:KeyData){
    
    if(data){
      const isMovingForward = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.FORWARD,isMovingForward)
    }
    return "moving forward"
    
  }

  private MOVE_BACK(state:any,data:KeyData){
    
    if(data){
      const isMovingBack = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.BACK,isMovingBack)
    }
    return "moving back"
    
  }

  private MOVE_LEFT(state:any,data:KeyData){
    
    if(data){
      const isMovingLeft = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.LEFT,isMovingLeft)
    }
    return "moving left"
    
  }

  private MOVE_RIGHT(state:any,data:KeyData){
    
    if(data){
      const isMovingRight = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.RIGHT,isMovingRight)
    }
    return "moving right"
    
  }

  private SHIFT_DOWN(state:any,data:KeyData){
    
    if(data){
      const isShiftDown = data.type === 1;
      this._localPlayer.sprint(isShiftDown)
    }
    return "shift down"
    
  }

}
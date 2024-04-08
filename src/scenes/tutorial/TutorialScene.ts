import { ArcRotateCamera,HavokPlugin, Color3, Color4, Engine,HemisphericLight,MeshBuilder,Observable,Scene, SceneLoader, Texture, Vector3, PhysicsAggregate, PhysicsShapeType, AbstractMesh, AssetContainer, ISceneLoaderProgressEvent, AnimationGroup, KeyboardInfo } from "@babylonjs/core";
import GameInputManager from "../../infrastructure/GameInputManager";
import IGameScene from "../../common/interfaces/IGameScene";
import "@babylonjs/loaders/glTF";
//import { ThirdPersonController } from "../../players/ThirdPersonController";
import HavokPhysics from '@babylonjs/havok';
import { TerrainMaterial } from "@babylonjs/materials/terrain";
import GameInputProcessor from "../../infrastructure/GameInputProcessor";
import GameSoundManager from "../../infrastructure/GameSoundManager";
import FirstPersonCharacter, { CharacterDirection } from "../../players/FirstPersonCharacter";

const actionList = [
  {action: "RELOAD", shouldBounce: () => false },
  {action: "MOVE_FORWARD", shouldBounce: () => false },
  {action: "MOVE_BACK", shouldBounce: () => false },
  {action: "MOVE_RIGHT", shouldBounce: () => false },
  {action: "MOVE_LEFT", shouldBounce: () => false },
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
  private _playerMesh?: AbstractMesh;
  //private _characterController: ThirdPersonController;
  private _localPlayer: FirstPersonCharacter;
  private charDropHeight = 14; //y pos where character enters scene, should be higher than max ground height
  private gunAnimations: AnimationGroup[] = [];
  private _inputMap = {};
  private _groundAggregate: PhysicsAggregate;

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
      this.setupEnvironment();
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

  private async setupEnvironment(){

    var light1 = new HemisphericLight("light1", new Vector3(1, 0.5, 0), this._scene);
	  light1.intensity = 0.7;
	  var light2 = new HemisphericLight("light2", new Vector3(-1, -0.5, 0), this._scene);
	  light2.intensity = 0.2;
    
    var terrainMaterial = new TerrainMaterial("terrainMaterial",this._scene);
    terrainMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
    //terrainMaterial.specularColor = new Color3(0, 0, 0);
    terrainMaterial.specularPower = 64;
    
    // Set the mix texture (represents the RGB values)
    terrainMaterial.mixTexture = new Texture(process.env.PUBLIC_URL+"/textures/mixMap_test.png",this._scene);

    // Diffuse textures following the RGB values of the mix map
    // diffuseTexture1: Red
    // diffuseTexture2: Green
    // diffuseTexture3: Blue
    terrainMaterial.diffuseTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor.png",this._scene);
    terrainMaterial.diffuseTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rock.png",this._scene);
    terrainMaterial.diffuseTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grass.png",this._scene);
    
    // Bump textures according to the previously set diffuse textures
    terrainMaterial.bumpTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor_bump.png",this._scene);
    terrainMaterial.bumpTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rockn.png",this._scene);
    terrainMaterial.bumpTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grassn.png",this._scene);

    // Rescale textures according to the terrain
    terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 10;
    terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 10;
    terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 10;

    const groundMesh = MeshBuilder.CreateGroundFromHeightMap("groundMesh",`${process.env.PUBLIC_URL}/textures/height_map1.png`,{
      height:250,
      width: 250,
      maxHeight: 35,
      subdivisions: 30,
      onReady: (mesh, heightBuffer) => {
        this._groundAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0 });
        this.loadPlayer();
      },
    });
    //groundMesh.position = new Vector3(0, 0, 0)
    groundMesh.position.y = -10;
    groundMesh.checkCollisions = true;
    groundMesh.isPickable = false;
    groundMesh.receiveShadows = true;
    groundMesh.material = terrainMaterial;

  }

  get scene(): Scene{
    return this._scene;
  }

  public update (deltaTime:number | null){
    const dT = deltaTime ?? (this.scene.getEngine().getDeltaTime() / 1000);
    this._actionProcessor?.update();
    this._localPlayer?.update(dT);

    switch (this.gameState) {
      case TUTORIAL_STATE.CREATED:
          break;
      case TUTORIAL_STATE.RUNNING:
          break;
      default:
          break;
    }
  };

  public async loadPlayer(){
    
    this._localPlayer = new FirstPersonCharacter(this._scene,this._camera,new Vector3(10,15,10));
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

  private MOVE_FORWARD(state:any,data:KeyboardInfo){
    
    if(data){
      const isMovingForward = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.FORWARD,isMovingForward)
    }
    return "moving forward"
    
  }

  private MOVE_BACK(state:any,data:KeyboardInfo){
    
    if(data){
      const isMovingBack = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.BACK,isMovingBack)
    }
    return "moving back"
    
  }

  private MOVE_LEFT(state:any,data:KeyboardInfo){
    
    if(data){
      const isMovingLeft = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.LEFT,isMovingLeft)
    }
    return "moving left"
    
  }

  private MOVE_RIGHT(state:any,data:KeyboardInfo){
    
    if(data){
      const isMovingRight = data.type === 1;
      this._localPlayer.moveDirection(CharacterDirection.RIGHT,isMovingRight)
    }
    return "moving right"
    
  }
}
import { ArcRotateCamera,HavokPlugin, Color3, Color4, CubeTexture, DirectionalLight, Engine,FreeCamera,HemisphericLight,Mesh,MeshBuilder,Observable,Scene, SceneLoader, StandardMaterial, Texture, Vector3, PhysicsAggregate, PhysicsShapeType, AbstractMesh, PhysicsMotionType, PhysicsViewer, TransformNode, CubeMapToSphericalPolynomialTools, Quaternion, UniversalCamera } from "@babylonjs/core";
import GameInputManager from "../../infrastructure/GameInputManager";
import IGameScene from "../../common/interfaces/IGameScene";
import "@babylonjs/loaders/glTF";
import { ThirdPersonController } from "../../players/ThirdPersonController";
import HavokPhysics, { HavokPhysicsWithBindings, Result } from '@babylonjs/havok';
import { TerrainMaterial } from "@babylonjs/materials/terrain";
import { CharacterController } from "../../players/CharacterController";

//https://playground.babylonjs.com/#GZYGLJ#34
//mark_23__animated__free.glb
import playerMeshPath from "../../assets/player/Vincent.babylon";
import PlayerCamera, { PLAYER_CAMERA } from "../../players/player_camera";

async function getInitializedHavok() {
  
  return await HavokPhysics();
}

const TUTORIAL_STATE = Object.freeze({
  CREATED: 0,
  INITIALIZED: 2,
  RUNNING: 3,
  EXITING: 4
})
 
export default class TutorialScene implements IGameScene{

  private _scene: Scene;
  private _camera: ArcRotateCamera;
  private _playerCamera: PlayerCamera;
  //private _cameraTest: FreeCamera | null = null;
  private _onStateChangeObservable = new Observable();
  private _state: number = TUTORIAL_STATE.CREATED;
  private _previousState: number = TUTORIAL_STATE.CREATED;
  private _gameState: number;
  private _playerMesh?: AbstractMesh;
  //private _cc?: typeof CharacterController;
  private charDropHeight = 14; //y pos where character enters scene, should be higher than max ground height

  constructor(
    private _engine: Engine,
    private _inputManager: GameInputManager
  ){
    this._onStateChangeObservable.add((s:any) => console.log(`${s.currentState} is new state. Prev was ${s.priorState}`));
    const scene = new Scene(this._engine);
    
    //sound manager
    scene.clearColor = new Color4(0.75,0.75,0.75,1);
    scene.ambientColor = new Color3(1,1,1);
    
    this._camera = new ArcRotateCamera("camera1",  3 * Math.PI / 8, 3 * Math.PI / 8, 15, new Vector3(0, 2, 0), scene);
    this._camera.upperBetaLimit = Math.PI / 2.2;
    this._camera.attachControl(this._engine.getRenderingCanvas(), true);

    const testCamera = new UniversalCamera("universal",new Vector3(0,12,0),this._scene);
    testCamera.attachControl();
    

    this._gameState = TUTORIAL_STATE.INITIALIZED;

    //const havokInstance = await HavokPhysics();
    const assumedFramesPerSecond = 60;
const earthGravity = -9.81;
    HavokPhysics()
    .then(havokInstance => {
      this._scene.enablePhysics(new Vector3(0, earthGravity / assumedFramesPerSecond, 0), new HavokPlugin(true,havokInstance))
      this.setupEnvironment();
      
      //this.loadPlayerCamera();
    });
   

    //this.testEnv(scene);
    //this.setupEnvironment();
    //this.loadPlayer();
    //this.loadPlayerCamera();
    this._scene = scene;

    // scene.onPointerDown = (evt) => {
    //   if (evt.button === 0) this._engine.enterPointerlock();
    //   if (evt.button === 1) this._engine.exitPointerlock();
    // };
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
    
    // w

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
        const groundAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0 });
        //this.loadPlayer();
        
      },
    });
    groundMesh.position = new Vector3(1,1,-10);
    //groundMesh.position.y = -2.05;
    groundMesh.position.y = -10;
   // groundMesh.checkCollisions = true;
    groundMesh.isPickable = true;
    groundMesh.receiveShadows = true;
    groundMesh.material = terrainMaterial;

    //static box for reference 
    // var box = MeshBuilder.CreateBox("Box", {width:2, height:2,updatable:true}, this._scene);
    // box.material = new StandardMaterial("", this._scene);
    // box.position.x+=3
    // box.position.y=6.5
    // //box.position.z = 24;
    // box.checkCollisions = true;
   

  }

  get scene(): Scene{
    return this._scene;
  }

  public update (deltaTime:number | null){
    const dT = deltaTime ?? (this.scene.getEngine().getDeltaTime() / 1000);
    //this.actionProcessor?.update();

    switch (this.gameState) {
      case TUTORIAL_STATE.CREATED:
          break;
      case TUTORIAL_STATE.RUNNING:
          break;
      default:
          break;
    }
  };

  public async loadPlayerCamera(){
    
    this._playerCamera = new PlayerCamera(new Vector3(0,12,0),this._scene);
    this._playerCamera.attachControl();
    this._scene.setActiveCameraByName(PLAYER_CAMERA);

    // Character
    const characterMesh = MeshBuilder.CreateCapsule("character", {height: 1.8, radius: 0.45 });
    const characterMaterial = new StandardMaterial("character");
    characterMaterial.diffuseColor = new Color3(1, 0.56, 0.56);
    characterMesh.material = characterMaterial;
    characterMesh.position.set(0,1,-3);
    const characterAggregate = new PhysicsAggregate(characterMesh,
                                                            PhysicsShapeType.CAPSULE,
                                                            { mass: 1, friction: 0.5, restitution: 0 },
                                                            this.scene);
    const characterBody = characterAggregate.body;
    characterBody.disablePreStep = false;
    characterBody.setMassProperties({ inertia: Vector3.ZeroReadOnly });

    characterMesh.parent = this._playerCamera;
    characterMesh.setParent(this._playerCamera);
    
  }

  public async loadPlayer(){

    SceneLoader.ImportMesh("",process.env.PUBLIC_URL+"/meshes/","Vincent.babylon",this._scene,(meshes,particleSystems,skeletons)=>{
      let player:Mesh = meshes[0] as Mesh;
      let skeleton = skeletons[0];
      player.skeleton = skeleton;

      skeleton.enableBlending(0.1);
      //if the skeleton does not have any animation ranges then set them as below
      // setAnimationRanges(skeleton);

      let sm = player.material as StandardMaterial;
      if(sm.diffuseTexture!=null){
          sm.backFaceCulling = true;
          sm.ambientColor = new Color3(1,1,1);
      }


      player.position = new Vector3(0,12,0);
      player.checkCollisions = true;
      player.ellipsoid = new Vector3(0.5,1,0.5);
      player.ellipsoidOffset = new Vector3(0,1,0);

      //rotate the camera behind the player
      let alpha = -player.rotation.y-4.69;
      let beta = Math.PI/2.5;
      let target = new Vector3(player.position.x,player.position.y+1.5,player.position.z);
      
      let camera = new ArcRotateCamera("ArcRotateCamera",alpha,beta,0.5,target,this._scene);
      this._camera = camera;
      //standard camera setting
      camera.wheelPrecision = 15;
      camera.checkCollisions = false;
      //make sure the keyboard keys controlling camera are different from those controlling player
      //here we will not use any keyboard keys to control camera
      camera.keysLeft = [];
      camera.keysRight = [];
      camera.keysUp = [];
      camera.keysDown = [];
      //how close can the camera come to player
      camera.lowerRadiusLimit = 0.5;
      //how far can the camera go from the player
      camera.upperRadiusLimit = 5;
      camera.attachControl(this._engine.getRenderingCanvas(),false);

      //let CharacterController = org.ssatguru.babylonjs.component.CharacterController;
      let cc = new CharacterController(player,camera,this._scene);
      //below makes the controller point the camera at the player head which is approx
      //1.5m above the player origin
      cc.setCameraTarget(new Vector3(0,1.5,0));

      //if the camera comes close to the player we want to enter first person mode.
      cc.setNoFirstPerson(false);
      //the height of steps which the player can climb
      cc.setStepOffset(0.4);
      //the minimum and maximum slope the player can go up
      //between the two the player will start sliding down if it stops
      cc.setSlopeLimit(30,60);

      //tell controller 
      // - which animation range should be used for which player animation
      // - rate at which to play that animation range
      // - wether the animation range should be looped
      //use this if name, rate or looping is different from default
      cc.setIdleAnim("idle",1,true);
      cc.setTurnLeftAnim("turnLeft",0.5,true);
      cc.setTurnRightAnim("turnRight",0.5,true);
      cc.setWalkBackAnim("walkBack",0.5,true);
      cc.setIdleJumpAnim("idleJump",.5,false);
      cc.setRunJumpAnim("runJump",0.6,false);
      //set the animation range name to "null" to prevent the controller from playing
      //a player animation.
      //here even though we have an animation range called "fall" we donot want to play 
      //the fall animation
      cc.setFallAnim(null,2,false);
      cc.setSlideBackAnim("slideBack",1,false);
      //cc.setStrafeRightKey("")

      cc.start();
      this._playerMesh = player;
      //console.log('checking player mesh',this._playerMesh)
      this.loadWeapon()
      // this._engine.runRenderLoop(function(){
      //     scene.render();
      // });

    });
  }

  private async loadWeapon(){
    const weaponImportResult = await SceneLoader.ImportMeshAsync(
      "",
      process.env.PUBLIC_URL+"/meshes/","mark_23__animated__free.glb",
      this._scene,
      undefined,
      ".glb");

     

    const weaponMesh = weaponImportResult.meshes[0];
    //weaponMesh.skeleton = weaponImportResult.skeletons[0];
    //console.log(weaponMesh)
    //console.log('weapon',weaponMesh)
    //weaponMesh.scaling.x = 2.05;
    //weaponMesh.scaling.y = 2.05;
    //weaponMesh.scaling.z = 2.05;
    //weaponMesh.scaling = new Vector3(1.025,1.025,-1.025);
    //weaponMesh.parent = this._playerMesh;
      weaponMesh.setParent(this._playerMesh)
    //this._playerMesh.addChild(weaponMesh)
    // good scaling here!!!!!!!!!
    //weaponMesh.scaling = new Vector3(0.025,0.025,-0.025);
   // weaponMesh.position.y = 3;

    //
    
    //weaponMesh.position = this._playerMesh.position.clone();
    //weaponMesh.setParent(gun);
    
    
    
    weaponMesh.isPickable = false;
    //weaponMesh.rotation = playerNode.rotation;

    // akm.parent = this._playerMesh;
    // akm.position = new Vector3(0.5, -0.7, 0.5);
    // akm.rotation.x = -0.01;
    console.log('mesh result')
  console.log(weaponImportResult)
   console.log(weaponImportResult.meshes)
  weaponMesh.scaling = new Vector3(0.5, 0.5,0.5);
  weaponMesh.position = this._playerMesh.position.clone();

  weaponMesh.rotationQuaternion = Quaternion.FromEulerVector(new Vector3(0.9, 1.2, 1.4));
  setTimeout(() => {
    weaponMesh.attachToBone(this._playerMesh.skeleton.bones[3],this._playerMesh)
  }, 3000);
    
    //weaponMesh.scaling = new Vector3(5, 5,5);
    
		//weaponMesh.scaling.x = -0.05;
    //weaponMesh.scaling.y = 0.05;
    //weaponMesh.scaling.z = 0.05;
    var sphere = MeshBuilder.CreateSphere("sphere1", {diameter:5, segments:16}, this._scene);

    // Move the sphere upward 1/2 its height    
	sphere.scaling = new Vector3(0.1, 0.1, 0.1);
	var materialSphere = new StandardMaterial("texture1", this._scene);
	materialSphere.diffuseColor = Color3.Red();
	sphere.material = materialSphere;

  sphere.attachToBone(this._playerMesh.skeleton.bones[2], this._playerMesh);
		sphere.scaling = new Vector3(0.05, 0.05, 0.05);
   // weaponMesh.scaling.x = 2.05;
   // weaponMesh.scaling.y = 2.05;
    //weaponMesh.scaling.z = 2.05;
    
    //weaponMesh.parent = akm;
    //weaponMesh.scaling = new Vector3(1,1,1)
    //const skels = weaponImportResult.skeletons;


    this._scene.registerBeforeRender(()=>{
      //weaponMesh.position = this._playerMesh.position;
      //weaponMesh.position = this._playerMesh.position;
      //weaponMesh.rotation.y = -this._camera.alpha;
      //weaponMesh.rotation = playerNode.rotation;
    })
  }
  
  public attachControls(){

  }

  public detachControls(){

  }

  public setTutorialRunningState(){
    this._gameState = TUTORIAL_STATE.RUNNING;
  }
}
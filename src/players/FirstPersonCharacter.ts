import { ArcRotateCamera, Axis, Color3, KeyboardEventTypes, Matrix, Mesh, MeshBuilder, Quaternion, Ray, RayHelper, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

interface Command {
  frameTime: number,
  moveForwardKeyDown: boolean,
  moveBackwardKeyDown: boolean,
  moveLeftKeyDown: boolean,
  moveRightKeyDown: boolean,
  jumpKeyDown: boolean,
  cameraAlpha: number,
  cameraBeta: number
}

class FirstPersonCharacter{

  private _playerMesh:Mesh;
  private _cameraTargetMesh:Mesh;
  private _prevFrameTime: number;
  private _direction: Vector3 = new Vector3();
  private _velocity: Vector3 = new Vector3();
  private _ray: Ray;
  private _rayHelper: RayHelper;
  private _onObject: boolean = false;
  private _walkSpeedRatio: number = 300;
  private _sprintSpeedRatio: number = 100;

  private _command: Command = {
      frameTime: 0,
      moveForwardKeyDown: false,
      moveBackwardKeyDown: false,
      moveLeftKeyDown: false,
      moveRightKeyDown: false,
      jumpKeyDown: false,
      cameraAlpha: 0,
      cameraBeta: 0
  }

  constructor(
    private _scene:Scene,
    private _camera:ArcRotateCamera,
    private _initialLocation:Vector3){
      this._camera.angularSensibilityX = 500;
      this._camera.angularSensibilityY = 500;
      this._camera.inertia = 0;
      this._camera.minZ = 0.05;
      // @ts-ignore
      this._ray = new Ray();
      this._rayHelper = new RayHelper(this._ray);
      this.setupPlayerMesh()
      this.setupRay();
      this.setupMovement();
  }

  private setupPlayerMesh(){
      
      this._playerMesh = MeshBuilder.CreateSphere('player', {diameterX:2,diameterY:5, segments: 32}, this._scene);
      this._playerMesh.isPickable = false;
      this._playerMesh.isVisible = false;
      this._playerMesh.position = this._initialLocation;
      const playerMeshMaterial = new StandardMaterial('material', this._scene);
      playerMeshMaterial.diffuseColor = new Color3(0, 0, 1);
      playerMeshMaterial.alpha = 0.5;
      this._playerMesh.material = playerMeshMaterial;
  }

  private setupRay(){
      this._rayHelper.attachToMesh(this._playerMesh, new Vector3(0, -0.995, 0), new Vector3(0, -1, 0), 0.1);
      this._rayHelper.show(this._scene, new Color3(1, 0, 0));
  }

  private jump(){
      this._velocity.y = 0.15;
      this._onObject = false;
  }

  private move(command:Command){
      if (this._prevFrameTime === undefined) {
              this._prevFrameTime = this._command.frameTime;
              return;
          }

          const delta = this._command.frameTime - this._prevFrameTime;

          // Raycast Method 1
          const pick = this._scene.pickWithRay(this._ray);
          if (pick) this._onObject = pick.hit;

          // Raycast Method 2
          // for (const obstacle of obstacles) {
          //     if (ray.intersectsBox(obstacle.getBoundingInfo().boundingBox)) {
          //         onObject = true;
          //     }
          // }

          const viewAngleY = 2 * Math.PI - this._command.cameraAlpha;
          this._playerMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, viewAngleY, 0);

          this._direction.x = -(Number(this._command.moveForwardKeyDown) - Number(this._command.moveBackwardKeyDown));
          this._direction.z = Number(this._command.moveRightKeyDown) - Number(this._command.moveLeftKeyDown); // left hand system
          this._direction.z = Number(this._command.moveLeftKeyDown) - Number(this._command.moveRightKeyDown); // right hand system
          this._direction.normalize();

          this._velocity.x = 0;
          this._velocity.z = 0;
          if (this._command.moveRightKeyDown || this._command.moveLeftKeyDown) this._velocity.z = this._direction.z * delta / this._sprintSpeedRatio;
          if (this._command.moveForwardKeyDown || this._command.moveBackwardKeyDown) this._velocity.x = this._direction.x * delta / this._sprintSpeedRatio;

          // velocity.y = command.startVelocityY;
          this._velocity.y -= delta / 3000;
          if (this._onObject) this._velocity.y = Math.max(0, this._velocity.y);
          
          if (this._command.jumpKeyDown && this._onObject) this.jump();

          const rotationAxis = Matrix.RotationAxis(Axis.Y, viewAngleY);
          const rotatedVelocity = Vector3.TransformCoordinates(this._velocity, rotationAxis);
          this._playerMesh.moveWithCollisions(rotatedVelocity);

          this._prevFrameTime = this._command.frameTime;
  }
  
  private setupMovement(){
      this._scene.onKeyboardObservable.add(kbInfo => {
          switch (kbInfo.type) {
              case KeyboardEventTypes.KEYDOWN:
                  switch (kbInfo.event.key) {
                      case 'w':
                      case 'W':
                          this._command.moveForwardKeyDown = true;
                          break;
                      case 'a':
                      case 'A':
                          this._command.moveLeftKeyDown = true;
                          break;
                      case 's':
                      case 'S':
                          this._command.moveBackwardKeyDown = true;
                          break;
                      case 'd':
                      case 'D':
                          this._command.moveRightKeyDown = true;
                          break;
                      case ' ':
                          this._command.jumpKeyDown = true;
                          break;
                  }
                  break;
              case KeyboardEventTypes.KEYUP:
                  switch (kbInfo.event.key) {
                      case 'w':
                      case 'W':
                          this._command.moveForwardKeyDown = false;
                          break;
                      case 'a':
                      case 'A':
                          this._command.moveLeftKeyDown = false;
                          break;
                      case 's':
                      case 'S':
                          this._command.moveBackwardKeyDown = false;
                          break;
                      case 'd':
                      case 'D':
                          this._command.moveRightKeyDown = false;
                          break;
                      case ' ':
                          this._command.jumpKeyDown = false;
                          break;
                  }
                  break;
          }
      });

      this._scene.registerBeforeRender(() => {
          // Update camera target
          //const cameraTargetMeshOffsetPosition = this._cameraTargetMesh.absolutePosition.add(new Vector3(0, 1, 0));
          const cameraTargetMeshOffsetPosition = this._playerMesh.absolutePosition.add(new Vector3(0, 1, 0));
          this._camera.target.copyFrom(cameraTargetMeshOffsetPosition);

          // Player move
          this._command.frameTime = Date.now();
          this._command.cameraAlpha = this._camera.alpha;
          this._command.cameraBeta = this._camera.beta;
          this.move(this._command);
      });
  } 
}

export default FirstPersonCharacter;
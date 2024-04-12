import { ArcRotateCamera, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";

export type CharacterOptions = {
  maxPosX: number,
  maxPosZ: number
}

export enum CharacterDirection{
  FORWARD = "forward",
  BACK = "back",
  RIGHT = "right",
  LEFT = "left"
}

interface Command {
  frameTime: number,
  deltaTime: number,
  moveForwardKeyDown: boolean,
  moveBackwardKeyDown: boolean,
  moveLeftKeyDown: boolean,
  moveRightKeyDown: boolean,
  weaponMainAction: boolean,
  jumpKeyDown: boolean,
  cameraAlpha: number,
  cameraBeta: number
}

class FirstPersonCharacter{

  private _playerMesh:Mesh;
  private _velocity: Vector3 = new Vector3();
  private _onObject: boolean;
  // velocity determined by inpout arrow keys pressed. It's more a local direction vector than a velocity.
  private _characterStartPosition: Vector3 = new Vector3(0,0,0);
  private _inFreeFall: boolean = false;
  //distance by which AV would move down if in freefall
  private _freeFallDist: number = 0;
  //how many minimum contiguos frames should the AV have been in free fall
  //before we assume AV is in big freefall.
  //we will use this to remove animation flicker during move down a slope (fall, move, fall move etc)
  //TODO: base this on slope - large slope large count
  private _fallFrameCountMin: number = 50;
  private _fallFrameCount: number = 0;
  //for how long has the av been falling while moving
  private _movFallTime: number = 0;
  private _gravity: number = 9.8;

  private _moveVector: Vector3;
  private _ffSign: number = 1; //this._av2cam = b ? Math.PI / 2 : 3 * Math.PI / 2;
  private _av2cam: number = 0;

  private _isSprinting: boolean = false;
  private _runSpeed: number = 10;
  private _sprintSpeed: number = this._runSpeed * 2;
  private _backSpeed: number = this._runSpeed / 2;
  private _jumpSpeed: number = this._runSpeed * 2;
  private _leftSpeed: number = this._runSpeed / 2;
  private _rightSpeed: number = this._runSpeed / 2;

  //slopeLimit in degrees
  private _minSlopeLimit: number = 30;
  private _maxSlopeLimit: number = 45;
  //slopeLimit in radians
  private _sl: number = Math.PI * this._minSlopeLimit / 180;
  private _sl2: number = Math.PI * this._maxSlopeLimit / 180;

  //The av will step up a stair only if it is closer to the ground than the indicated value.
  private _stepOffset: number = 0.25;
  //toal amount by which the av has moved up
  private _vMoveTot: number = 0;
  //position of av when it started moving up
  private _vMovStartPos: Vector3 = Vector3.Zero();

  // map restrictions
  private _maxPosX: number = 0;
  private _maxPosZ: number = 0;

  private _command: Command = {
      frameTime: 0,
      deltaTime: 0,
      moveForwardKeyDown: false,
      moveBackwardKeyDown: false,
      moveLeftKeyDown: false,
      moveRightKeyDown: false,
      weaponMainAction: false,
      jumpKeyDown: false,
      cameraAlpha: 0,
      cameraBeta: 0
  }

  constructor(
    private _scene:Scene,
    private _camera:ArcRotateCamera,
    private _initialLocation:Vector3,
    private _options?:CharacterOptions){
      this._camera.angularSensibilityX = 500;
      this._camera.angularSensibilityY = 500;
      this._camera.inertia = 0;
      this._camera.minZ = 0.05;
      this.setupPlayerMesh();
      if(_options){
        this._maxPosX = _options.maxPosX;
        this._maxPosZ = _options.maxPosZ;
      }
  }

  private setupPlayerMesh(){
      
      this._playerMesh = MeshBuilder.CreateSphere('localPlayer', {diameterX:2,diameterY:5, segments: 32}, this._scene);
      this._playerMesh.id = "localPlayer";
      this._playerMesh.isPickable = false;
      this._playerMesh.isVisible = false;
      this._playerMesh.checkCollisions = true;
      this._playerMesh.position = this._initialLocation;
      this._playerMesh.setDirection(this._camera.rotation)
    //   this._physicsAggregate = new PhysicsAggregate(this._playerMesh,PhysicsShapeType.SPHERE,{mass:1,friction: 0.5, restitution: 0});
    //   this._physicsAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    //   this._physicsAggregate.body.setCollisionCallbackEnabled(true);

    //   this._physicsAggregate.body.setMassProperties({
    //     inertia: new Vector3(0, 0, 0)
    // });
  }

  private jump(){
      this._velocity.y = 0.15;
      this._onObject = false;
  }

  public get PlayerMesh(){
    return this._playerMesh;
  }

  public update(delta:number){
    // Update camera target
    //const cameraTargetMeshOffsetPosition = this._cameraTargetMesh.absolutePosition.add(new Vector3(0, 1, 0));
    const cameraTargetMeshOffsetPosition = this._playerMesh.absolutePosition.add(new Vector3(0, 1, 0));
    this._camera.target.copyFrom(cameraTargetMeshOffsetPosition);

    // Player move
    this._command.deltaTime = delta;
    this._command.cameraAlpha = this._camera.alpha;
    this._command.cameraBeta = this._camera.beta;

    this.move(delta);
    this.weaponAction(delta);
  }

  private weaponAction(delta){

  }

  public moveDirection(direction:CharacterDirection,isMoving:boolean){
    this._command.moveForwardKeyDown = direction === CharacterDirection.FORWARD && isMoving;
    this._command.moveBackwardKeyDown = direction === CharacterDirection.BACK && isMoving;
    this._command.moveLeftKeyDown = direction === CharacterDirection.LEFT && isMoving;
    this._command.moveRightKeyDown = direction === CharacterDirection.RIGHT && isMoving; 
  }

  public sprint(isSprinting:boolean){
    this._isSprinting = isSprinting;
  }

  private move(delta:number){
    this._characterStartPosition.copyFrom(this._playerMesh.position);

    const dt:number = delta;

    //initial down velocity
    const u: number = this._movFallTime * this._gravity
    //calculate the distance by which av should fall down since last frame
    //assuming it is in freefall
    this._freeFallDist = u * dt + this._gravity * dt * dt / 2;

    this._movFallTime = this._movFallTime + dt;

    let moving: boolean = false;
    //console.log('starting move function: '+ moving)
    if(this._inFreeFall){
      this._moveVector.y = -this._freeFallDist;
      moving = true;
    }
    else{
      
      this._av2cam =  Math.PI / 2;
      this._playerMesh.rotation.y = this._av2cam - this._camera.alpha;

      let sign: number;
      if(this._command.moveForwardKeyDown){
        let forwardDist: number = 0;

        forwardDist = this._isSprinting ? this._sprintSpeed * dt : this._runSpeed * dt;

        this._moveVector = this._playerMesh.calcMovePOV(0, -this._freeFallDist, this._ffSign * forwardDist);
        moving = true;
      }else if(this._command.moveBackwardKeyDown){
        this._moveVector = this._playerMesh.calcMovePOV(0, -this._freeFallDist, -this._ffSign * (this._backSpeed * dt));
        moving = true;
      }else if(this._command.moveLeftKeyDown){
        //sign = this._signRHS * this._isAvFacingCamera();
        sign = 1;
        this._moveVector = this._playerMesh.calcMovePOV(sign * (this._leftSpeed * dt), -this._freeFallDist, 0);
        moving = true;
      }else if(this._command.moveRightKeyDown){
        //sign = -this._signRHS * this._isAvFacingCamera();
        sign = -1;
        this._moveVector = this._playerMesh.calcMovePOV(sign * (this._rightSpeed * dt), -this._freeFallDist, 0);
        moving = true;
      }
    }

    if(moving){
      if (this._moveVector.length() > 0.001) {

        if(this._playerMesh.position.x === this._maxPosX || this._playerMesh.position.x === -this._maxPosX){
          console.log('max z reached')
          return;
        }
        if(this._playerMesh.position.z === this._maxPosZ || this._playerMesh.position.z === -this._maxPosZ){
          console.log('max x reached')
          return;
        }
        
        const moveDirectionLimited = new Vector3(
          ((this._playerMesh.position.x > this._maxPosX && this._moveVector.x > 0) || (this._playerMesh.position.x < -(this._maxPosX) && this._moveVector.x < 0))? 0 : this._moveVector.x,
          this._moveVector.y,
          ((this._playerMesh.position.z > this._maxPosZ && this._moveVector.z > 0) || (this._playerMesh.position.z < -(this._maxPosZ) && this._moveVector.z < 0))? 0 : this._moveVector.z,
      );

        //console.log('yes moving')
        this._playerMesh.moveWithCollisions(moveDirectionLimited);
        //walking up a slope
        if (this._playerMesh.position.y > this._characterStartPosition.y) {
            const actDisp: Vector3 = this._playerMesh.position.subtract(this._characterStartPosition);
            const _sl: number = this._verticalSlope(actDisp);
            if (_sl >= this._sl2) {
                //this._climbingSteps=true;
                //is av trying to go up steps
                if (this._stepOffset > 0) {
                    if (this._vMoveTot === 0) {
                        //if just started climbing note down the position
                        this._vMovStartPos.copyFrom(this._characterStartPosition);
                    }
                    this._vMoveTot = this._vMoveTot + (this._playerMesh.position.y - this._characterStartPosition.y);
                    if (this._vMoveTot > this._stepOffset) {
                        //move av back to its position at begining of steps
                        this._vMoveTot = 0;
                        this._playerMesh.position.copyFrom(this._vMovStartPos);
                        this._endFreeFall();
                    }
                } else {
                    //move av back to old position
                    this._playerMesh.position.copyFrom(this._characterStartPosition);
                    this._endFreeFall();
                }
            } else {
                this._vMoveTot = 0;
                if (_sl > this._sl) {
                    //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                    this._fallFrameCount = 0;
                    this._inFreeFall = false;
                } else {
                    //continue walking
                    this._endFreeFall();
                }
            }
        } else if ((this._playerMesh.position.y) < this._characterStartPosition.y) {
            const actDisp: Vector3 = this._playerMesh.position.subtract(this._characterStartPosition);
            if (!(this._areVectorsEqual(actDisp, this._moveVector, 0.001))) {
                //AV is on slope
                //Should AV continue to slide or walk?
                //if slope is less steeper than acceptable then walk else slide
                if (this._verticalSlope(actDisp) <= this._sl) {
                    this._endFreeFall();
                } else {
                    //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                    this._fallFrameCount = 0;
                    this._inFreeFall = false;
                }
            } else {
                this._inFreeFall = true;
                this._fallFrameCount++;
            }
        } else {
            this._endFreeFall();
        }
      }else{
        //console.log('not moving enough')
      }
    }else{
      //console.log('not moving')
    }
  }

  /*
     * returns the slope (in radians) of a vector in the vertical plane
     */
  private _verticalSlope(v: Vector3): number {
    return Math.atan(Math.abs(v.y / Math.sqrt(v.x * v.x + v.z * v.z)));
  }

  /**
     * checks if two vectors v1 and v2 are equal within a precision of p
     */
  private _areVectorsEqual(v1: Vector3, v2: Vector3, p: number) {
    return ((Math.abs(v1.x - v2.x) < p) && (Math.abs(v1.y - v2.y) < p) && (Math.abs(v1.z - v2.z) < p));
  }
  
  private _endFreeFall(): void {
    this._movFallTime = 0;
    this._fallFrameCount = 0;
    this._inFreeFall = false;
  }
}

export default FirstPersonCharacter;
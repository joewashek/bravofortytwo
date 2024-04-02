import { FreeCamera, KeyboardInfo, Nullable, Observer, Scene, Vector3 } from "@babylonjs/core";

export const PLAYER_CAMERA: string = "PlayerCamera";

export default class PlayerCamera extends FreeCamera {

    private _walkingSpeed: number = 1.5;
    private _runningSpeed: number = 2;
    private _isRunning: boolean = false;
    private _wantToJump: boolean = false;

    private onKeyboardObservable: Nullable<Observer<KeyboardInfo>> = null;
    
    public constructor(location:Vector3,scene:Scene){
        super(PLAYER_CAMERA,location,scene);
        this.setup();
    }


    private setup():void{
        
      this.fov =1;
      //this.inertia = 0;
      
        //this.applyGravity = true;
        this.checkCollisions = true;
        //this.ellipsoid = new Vector3(2, 4, 1);
       this.ellipsoid = new Vector3(1.5, 3.0, 1.5);
        this.ellipsoidOffset = new Vector3(0, 3, 0);
        
        this.minZ = 0.45;
        this.speed = this._walkingSpeed;
        this.angularSensibility = 4000;
        
        this.keysUp.push(87);
        this.keysLeft.push(65);
        this.keysDown.push(83);
        this.keysRight.push(68);
        
        this.onKeyboardObservable = this.getScene().onKeyboardObservable.add((info)=>{
          this._isRunning = (info.type === 1 && info.event.code === 'ShiftLeft');
          this._wantToJump = (info.type === 1 && info.event.code === 'Space');
          
        });

        this.getScene().onPointerDown = (evt)=>{
          
          if (evt.button === 0){
            if(!this.getEngine().isPointerLock){
              this.getEngine().enterPointerlock();
            }else{
              this.leftClick();
            }
          }else if(evt.button === 2) {
            this.rightClick();
          }
        }
        
        this.getScene().onBeforeRenderObservable.add(()=>{
          this.speed = this._walkingSpeed;
          if (this._isRunning) {
              this.speed = this._runningSpeed;
          }
          
          
        })
        
    }


    private leftClick():void{
      console.log('left click')
    }

    private rightClick():void{
      console.log('right click')
    }

}
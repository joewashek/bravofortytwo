import { Observable, Observer } from "@babylonjs/core/Misc/observable";
import logger from "./logger";
import { setAndStartTimer } from "@babylonjs/core/Misc/timer";
import IGameScene from "../common/interfaces/IGameScene";
import { Scene } from "@babylonjs/core";
import GameInputManager from "./GameInputManager";

function bounce(funcToBounce:any, bounceInMilliseconds:number, inputProcessor:GameInputProcessor) {
    var isBounced = false;
    const observableContext = inputProcessor.screen.scene.onBeforeRenderObservable;
    return (...args:any) => {
        if (isBounced) {
            return false;
        }
        isBounced = true;
        setAndStartTimer({ 
            timeout: bounceInMilliseconds, 
            onEnded: () => isBounced = false,
            contextObservable: observableContext
        });
        return funcToBounce.call(inputProcessor.screen, args);
    };
}

class GameInputProcessor {
    onCommandObservable = new Observable();
    private _actionState: any = {};
    private _actionMap: any = {};
    //private _actionList: { [key:string]: any};
    private _lastActionState: any = null;
    private _controlsAttached = false;
    private _scene: Scene;
    private _onInputObserver: Observer<{action: string;lastEvent: any;}[]> | null = null;
    private _onInputDoneObserver: Observer<{action: string;lastEvent: any;}[]> | null = null;

    private _inputQueue:{action: string;lastEvent: any;}[][] = [];

    get inputQueue() {
        return this._inputQueue;
    }

    get screen(){
      return this._screen;
    }

    constructor(
      private _screen:IGameScene, 
      private _inputManager: GameInputManager,
      private _actionList:{ [key:string]: any}) {
      this._scene = this._screen.scene;
      this.buildActionMap(_actionList, false);

      //this.scene.onBeforeRenderObservable.add(() => this.update());
      //this.onCommandObservable.add(inputs => this.inputCommandHandler(inputs));

    }
    attachControl() {
      if (!this._controlsAttached) {
        logger.logInfo("input processor attaching control for screen ");
        this._scene.attachControl();
        this._inputManager.registerInputForScene(this._scene);
        this._onInputObserver = this._inputManager.onInputAvailableObservable.add((inputs) => {
            this.inputAvailableHandler(inputs);
        });
        this._onInputDoneObserver = this._inputManager.onInputDoneAvailableObservable.add((inputs) => {
            this.inputAvailableHandler(inputs);
        });
        this._controlsAttached = true;
      }
    }
    detachControl() {
        if (this._controlsAttached) {
            logger.logInfo("input processor detaching control for screen ");

            this._inputManager.onInputAvailableObservable.remove(this._onInputObserver);
            this._inputManager.unregisterInputForScene(this._scene);
            this._controlsAttached = false;
            this._inputQueue = [];
        }
    }
    update() {

        if (!this._controlsAttached) {
            return;
        }

        this._inputManager.getInputs(this._scene);
        this._inputManager.getInputsDone(this._scene);
        this._lastActionState = this._actionState;
        this._actionState = {};

        const inputQueue = this.inputQueue;
        while (inputQueue.length > 0) {
          
          let input = inputQueue.pop();

          this.inputCommandHandler(input);
        }
        
    }

    inputAvailableHandler(inputs:{action: string;lastEvent: any;}[]) {
        this._inputQueue.push(inputs);
    }

    buildActionMap(actionList:any, createNew:boolean) {
        if (createNew) {
            this._actionMap = {};
        }
        
        actionList.forEach((actionDef:any) => {
            const action = actionDef.action;
            const actionFn = (this._screen as any)[action];
            if (!actionFn) {
                return;
            }

            this._actionMap[action] = actionDef.shouldBounce() ? bounce(actionFn, 250, this) : actionFn.bind(this._screen);
        });
    }

    inputCommandHandler(input:any) {
        input.forEach((i:any) => {
            const inputParam = i.lastEvent;
            const actionFn = this._actionMap[i.action];

            if (actionFn) {
                const priorState = this._lastActionState ? this._lastActionState[i.action] : null;
                
                // the way we're dispatching this function in this context results in a loss of the "this" context for the
                // function being dispatched. Calling bind on the function object returns a new function with the correct
                // "this" set as expected. That function is immediately invoked with the target and magnitude parameter values.
                
                const returnValue = actionFn({priorState}, inputParam);
                this._actionState[i.action] = returnValue;
                // use the return value of the actionFn to allow handlers to maintain individual states (if they choose).
                // handlers that don't need to maintain state also don't need to know what to return, 
                // since undefined == null == false.

            }else{
              console.log('no action')
            }
        });
    }
}

export default GameInputProcessor;
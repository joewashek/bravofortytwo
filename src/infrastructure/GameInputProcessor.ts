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
    private _actionList: { [key:string]: any};
    actionList = [];
    private lastActionState: any = null;
    controlsAttached = false;
    inputManager;
    private _screen: IGameScene;
    private _scene: Scene;
    private _onInputObserver: Observer<unknown> | null = null;

    private _inputQueue:any = [];

    get inputQueue() {
        return this._inputQueue;
    }

    get screen(){
      return this._screen;
    }

    constructor(screen:IGameScene, inputManager: GameInputManager,actionList:{ [key:string]: any}) {
      this._scene = screen.scene;
      this._screen = screen;
      this.inputManager = inputManager;
      this._actionList = actionList;
      this._inputQueue = [];
    

      this.buildActionMap(actionList, false);
      //this.scene.onBeforeRenderObservable.add(() => this.update());


      //this.onCommandObservable.add(inputs => this.inputCommandHandler(inputs));

    }
    attachControl() {
      if (!this.controlsAttached) {
        logger.logInfo("input processor attaching control for screen ");
        this._scene.attachControl();
        this.inputManager.registerInputForScene(this._scene);
        this._onInputObserver = this.inputManager.onInputAvailableObservable.add((inputs:any) => {
            this.inputAvailableHandler(inputs);
        });
        this.controlsAttached = true;
      }
    }
    detachControl() {
        if (this.controlsAttached) {
            logger.logInfo("input processor detaching control for screen ");

            this.inputManager.onInputAvailableObservable.remove(this._onInputObserver);
            this.inputManager.unregisterInputForScene(this._scene);
            this.controlsAttached = false;
            this._inputQueue = [];
        }
    }
    update() {

        if (!this.controlsAttached) {
            return;
        }
        this.inputManager.getInputs(this._scene);
        this.lastActionState = this._actionState;

        const inputQueue = this.inputQueue;
        while (inputQueue.length > 0) {
            let input = inputQueue.pop();
            this.inputCommandHandler(input);
        }
    }

    inputAvailableHandler(inputs:any) {
        this._inputQueue.push(inputs);
    }

    buildActionMap(actionList:any, createNew:boolean) {
        if (createNew) {
            this._actionMap = {};
        }
        //const actionList = keyboardControlMap.menuActionList
        actionList.forEach((actionDef:any) => {
            const action = actionDef.action;
            const actionFn = (this._screen as any)[action];
            if (!actionFn) {
                return;
            }
            this._actionMap[action] = actionDef.shouldBounce() ? bounce(actionFn, 250, this) : actionFn;
        });
    }

    inputCommandHandler(input:any) {
        input.forEach((i:any) => {
            const inputParam = i.lastEvent;
            const actionFn = this._actionMap[i.action];
            if (actionFn) {
              
                const priorState = this.lastActionState ? this.lastActionState[i.action] : null;
                
                // the way we're dispatching this function in this context results in a loss of the "this" context for the
                // function being dispatched. Calling bind on the function object returns a new function with the correct
                // "this" set as expected. That function is immediately invoked with the target and magnitude parameter values.
                
                this._actionState[i.action] = actionFn({priorState}, inputParam);
                // use the return value of the actionFn to allow handlers to maintain individual states (if they choose).
                // handlers that don't need to maintain state also don't need to know what to return, 
                // since undefined == null == false.

            }
        });
    }
}

export default GameInputProcessor;
import { Engine, KeyboardEventTypes, PointerEventTypes, Scene } from "@babylonjs/core";
import {Observable} from "@babylonjs/core/Misc/observable";
import logger from "./logger";

export type KeyData = {
  type: number,
  key: string,
  shiftDown: boolean
}

class GameInputManager {

    private _onInputAvailable: Observable<{
      action: string;
      lastEvent: any;
  }[]>;
    private _onInputDoneAvailable: Observable<{
      action: string;
      lastEvent: any;
  }[]>;
    private _inputSubscriptions:any = [];
    private _inputMap: { [key:string]: any} = {};
    private _inputDoneMap: { [key:string]: any} = {};
    private _inputKeys = [];

    get hasInput() {
        return this._inputKeys?.length > 0;
    }

    get inputMap() {
        if (!this._inputMap) {
            this._inputMap = {};
        }
        return this._inputMap;
    }
    get inputDoneMap() {
      if (!this._inputDoneMap) {
          this._inputDoneMap = {};
      }
      return this._inputDoneMap;
  }

    get onInputAvailableObservable() {
        return this._onInputAvailable;
    }
    get onInputDoneAvailableObservable() {
      return this._onInputDoneAvailable;
  }

    get inputSubscriptions() {
        if (!this._inputSubscriptions) {
            this._inputSubscriptions = [];
        }
        return this._inputSubscriptions;
    }
    constructor(
      private _engine:Engine,
      private _controlsMap: { [key:string]: string}
      ) {
        this._onInputAvailable = new Observable();
        this._onInputDoneAvailable = new Observable();
    }
    

    registerInputForScene(sceneToRegister:Scene) {
        logger.logInfo("registering input for scene", sceneToRegister);
        const inputSubscriptions = this.inputSubscriptions;
        const registration = {
            scene: sceneToRegister, 
            subscriptions: [
                this.enableKeyboard(sceneToRegister),
                this.enableMouse(sceneToRegister)
            ]
        };

        sceneToRegister.onDisposeObservable.add(() => this.unregisterInputForScene(sceneToRegister));
        inputSubscriptions.push(registration);
        sceneToRegister.attachControl();
    }

    unregisterInputForScene(sceneToUnregister:Scene) {
        logger.logInfo("unregistering input controls for scene", sceneToUnregister);
        const subs = this.inputSubscriptions.find((s:any) => s.scene === sceneToUnregister);
        if (!subs) {
            logger.logWarning("didn't find any subscriptions to unregister...", this.inputSubscriptions);
            return;
        }
        subs.subscriptions.forEach((sub:any) => sub.dispose());
        sceneToUnregister.detachControl();
    }

    getInputs(scene:Scene) {

        const sceneInputHandler = this.inputSubscriptions.find((is:any) => is.scene === scene);
        if (!sceneInputHandler) {
            return;
        }
        // gamepad i think
        sceneInputHandler.subscriptions.forEach((s:any) => s.checkInputs());
        const im = this.inputMap;
        const ik = Object.keys(im);

        const inputs = ik
            .map((key:string) => {
                return { action: this._controlsMap[key], lastEvent: im[key] };
            });
        if (inputs && inputs.length > 0) {
            this.onInputAvailableObservable.notifyObservers(inputs);
        }
        return inputs;
    }
    getInputsDone(scene:Scene) {

      const sceneInputHandler = this.inputSubscriptions.find((is:any) => is.scene === scene);
      if (!sceneInputHandler) {
          return;
      }
      // gamepad i think
      sceneInputHandler.subscriptions.forEach((s:any) => s.checkInputs());
      const im = this.inputDoneMap;
      const ik = Object.keys(im);

      const inputs = ik
          .map((key:string) => {
              return { action: this._controlsMap[key], lastEvent: im[key] };
          });
      if (inputs && inputs.length > 0) {
          this.onInputDoneAvailableObservable.notifyObservers(inputs);
      }
      ik.forEach(k => delete this.inputDoneMap[k])
      return inputs;
  }

    enableMouse(scene:Scene) {
        const obs = scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                this._inputMap["PointerTap"] = pointerInfo.event;
            }
            else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                if (this.inputMap["PointerTap"] != null) {
                    delete this.inputMap["PointerTap"];
                }
            }
        });

        const checkInputs = () => { };
        return { checkInputs, dispose: () => scene.onPointerObservable.remove(obs) };
    }

    enableKeyboard(scene:Scene) {
      
        const observer = scene.onKeyboardObservable.add((kbInfo) => {
          
          const key = kbInfo.event.key;
          const keyMapped = this._controlsMap[key];
          
          if (!keyMapped) {
            console.log("Unmapped key processed by app", key);
            return;
          }

          const data: KeyData = {
            type: kbInfo.type,
            key: kbInfo.event.key,
            shiftDown: kbInfo.event.shiftKey
          }
          

          if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
            this.inputMap[key] = data;
          }
          else if(kbInfo.type === KeyboardEventTypes.KEYUP){
            delete this.inputMap[key];
            this.inputDoneMap[key] = data;
          }
      });

        const checkInputs = () => { };
        return {
            checkInputs,
            dispose: () => {
                scene.onKeyboardObservable.remove(observer);
            }
        };
    }

}
export default GameInputManager;
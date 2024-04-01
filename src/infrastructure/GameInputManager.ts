import { Engine, KeyboardEventTypes, Logger, PointerEventTypes, Scene, SceneComponentConstants } from "@babylonjs/core";
import {Observable} from "@babylonjs/core/Misc/observable";
import logger from "./logger";

import InputControls from "./input-action-maps";

const controlsMap = InputControls.inputControlsMap;

class GameInputManager {

    private _onInputAvailable: Observable<unknown>;
    private _inputSubscriptions:any = [];
    private _inputMap: { [key:string]: any} = {};
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

    get onInputAvailableObservable() {
        return this._onInputAvailable;
    }

    get inputSubscriptions() {
        if (!this._inputSubscriptions) {
            this._inputSubscriptions = [];
        }
        return this._inputSubscriptions;
    }
    constructor(private _engine:Engine) {
        this._onInputAvailable = new Observable();
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
                return { action: controlsMap[key], lastEvent: im[key] };
            });
        if (inputs && inputs.length > 0) {
            this.onInputAvailableObservable.notifyObservers(inputs);
        }
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
            const keyMapped = InputControls.inputControlsMap[key];

            if (!keyMapped) {
                return;
            }

            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                this.inputMap[key] = kbInfo.event;
            }
            else {
                delete this.inputMap[key];
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
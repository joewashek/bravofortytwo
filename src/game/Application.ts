import logger from '../infrastructure/logger';
//import AppStates from './appstates';
import AppStates from './AppStates';
import MainMenuScene from '../scenes/MainMenuScene';
import SplashScene from '../scenes/SplashScene';
import { Engine, Scene } from '@babylonjs/core';
import { delay } from '../common/utility/time-utility';
import GameInputManager from '../infrastructure/GameInputManager';
import IGameScene from '../common/interfaces/IGameScene';
import TutorialScene from '../scenes/tutorial/TutorialScene';
import characterControls from '../players/characterControlsMap';

class Application{

  private _currentScene: IGameScene | null;
  private _engine: Engine;
  private _stateMachine: Generator<number,number,number>;

  // Scenes
  private _mainMenu: MainMenuScene | null;
  private _splashScreen: SplashScene | null = null;
  private _tutorialScreen: TutorialScene | null = null;

  private _inputManager: GameInputManager | null = null;

  *appStateMachine(){
    let previousState: number | null = null;
    let currentState: number | null = null;

    function setState(newState:number):number{
      
      previousState = currentState;
      currentState = newState;
      logger.logInfo(`App State changed. Previous state: ${previousState} - New State: ${newState}`);
      return newState;
    }

    while(true){
      let nextState:number | null = yield currentState;
      if(nextState !== null && nextState !== undefined){
        setState(nextState);
        if(nextState === AppStates.EXITING){
          return currentState;
        }
      }
    }
  }

  get currentState():IteratorResult<number> {
    return this._stateMachine.next() as IteratorResult<number>;
  }

  get activeScene() {
    return this._currentScene;
  }

  private moveNextAppState(state:number) {
    return this._stateMachine.next(state).value;
  }

  constructor(engine:Engine){
    this._engine = engine;
    this._currentScene = null;
    this._stateMachine = this.appStateMachine();
    this._mainMenu = null;

    this.moveNextAppState(AppStates.CREATED);
  }

  private initialize(){
    logger.logInfo("Initializing application")
    //this._engine.enterFullscreen(false);

    // note: this will be replaced with the call done internally from AssetManager at some point
    this._engine.displayLoadingUI();

    this.moveNextAppState(AppStates.INITIALIZING);
    this._inputManager = new GameInputManager(this._engine);

    this._splashScreen = new SplashScene(this._engine,this._inputManager);

    this._mainMenu = new MainMenuScene(this._engine,this._inputManager);

    this._splashScreen.onReadyObservable.addOnce(()=>{
      logger.logInfo("Splash screen ready, opening cut scene")
      this.goToOpeningCutscene();
    });

    //this._mainMenu.onExitActionObservable.addOnce(() => this.exit());
    this._mainMenu.onPlayActionObservable.add(() => {
      this._engine.displayLoadingUI();
      this.goToRunningState();
    });

    //this._tutorialScreen = new TutorialScene(this._engine,this._inputManager);
  }

  run(){
    this.initialize();
    this._engine.runRenderLoop(()=> this.onRender())
  }

  onRender(){
    let stateResult = this.currentState
    const gameTime = this._engine.getDeltaTime() / 1000
    switch(stateResult.value){
      case AppStates.CREATED:
      case AppStates.INITIALIZING:
          break;
      case AppStates.CUTSCENE:
          if(this._splashScreen?.skipRequested){
            this.goToMainMenu();
            logger.logInfo("in application onRender - skipping splash screen message");
          }
          this._splashScreen?.update();
          break;
      case AppStates.MENU:
          this._mainMenu?.update();
          break;
      case AppStates.RUNNING:
          this._tutorialScreen?.update(gameTime);
          break;
      case AppStates.EXITING:
          this.exit();
          break;
      default:
          logger.logFatal("Unrecognized AppState value " + stateResult.value);
          break;
    }
    
    this.activeScene?.scene.render();
  }

  private goToOpeningCutscene(){
    this.moveNextAppState(AppStates.CUTSCENE);

    
    this._splashScreen?.attachControls();
    this._currentScene = this._splashScreen;
    this._splashScreen?.run();
    this._engine.hideLoadingUI();
  }

  private async goToMainMenu(){
    logger.logInfo("Loading main menu")
    this._currentScene = this._mainMenu;
    this.moveNextAppState(AppStates.MENU);
    this._mainMenu?.attachControls();
  }

  private goToRunningState(){
    this._engine.displayLoadingUI();
    this._currentScene?.detachControls();
    this._tutorialScreen = new TutorialScene(this._engine,new GameInputManager(this._engine,characterControls.characterControlsMap));
    this._tutorialScreen?.scene.onReadyObservable.add(()=>{
      this._engine.hideLoadingUI();
    })
    this._currentScene = this._tutorialScreen;
    this.moveNextAppState(AppStates.RUNNING);
    this._currentScene?.attachControls();
    this._tutorialScreen?.setTutorialRunningState();
  }

  private exit(){
    this._engine.exitFullscreen();
    this.moveNextAppState(AppStates.EXITING);
    if(window){
      this._engine.dispose();
      window.location?.reload();
    }
  }
}

export default Application;
import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  SceneLoader,
  Sprite,
  SpriteManager,
  Vector3,
} from "@babylonjs/core";
import IGameScene from "../common/interfaces/IGameScene";
import GameInputManager from "../infrastructure/GameInputManager";

export default class ValleyVillageScene implements IGameScene {
  private _scene: Scene;

  constructor(private _engine: Engine, private inputManager: GameInputManager) {
    this._scene = new Scene(this._engine);
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      15,
      new Vector3(0, 0, 0)
    );
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.attachControl(this._engine.getRenderingCanvas(), true);
    const light = new HemisphericLight("light", new Vector3(1, 1, 0));

    const spriteManagerTrees = new SpriteManager(
      "treesManager",
      "textures/palm.png",
      2000,
      { width: 512, height: 1024 },
      this._scene
    );

    //We create trees at random positions
    for (let i = 0; i < 500; i++) {
      const tree = new Sprite("tree", spriteManagerTrees);
      tree.position.x = Math.random() * -30;
      tree.position.z = Math.random() * 20 + 8;
      tree.position.y = 0.5;
    }

    for (let i = 0; i < 500; i++) {
      const tree = new Sprite("tree", spriteManagerTrees);
      tree.position.x = Math.random() * 25 + 7;
      tree.position.z = Math.random() * -35 + 8;
      tree.position.y = 0.5;
    }

    SceneLoader.ImportMeshAsync(
      "",
      "https://assets.babylonjs.com/meshes/",
      "valleyvillage.glb"
    );
  }

  get scene() {
    return this._scene;
  }

  public update(deltaTime: number | null) {}

  public attachControls() {}

  public detachControls() {}
}

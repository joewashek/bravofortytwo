import { Engine } from "@babylonjs/core/Engines";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { FC } from "react";
import Application from "./Application";

const CanvasName = "game-canvas";

registerBuiltInLoaders();

const Game: FC = () => {
  const gameCanvas = document.createElement("canvas");
  gameCanvas.id = CanvasName;
  gameCanvas.classList.add("game-canvas");
  document.body.appendChild(gameCanvas);
  const engine = new Engine(gameCanvas, true, undefined, true);
  const gameApplication = new Application(engine);
  gameApplication.run();
  return <></>;
};

export default Game;

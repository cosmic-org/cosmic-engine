import InGame from "./scenes/InGame";
import MainMenu from "./scenes/MainMenu";
import Matchmaking from "./scenes/Matchmaking";
import { AUTO, Game } from "phaser";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 400, // 1024,
  height: 550, // 768,
  mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
  parent: "game-container",
  backgroundColor: "#000000",
  scene: [MainMenu, InGame, Matchmaking],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;

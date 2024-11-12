"use client";

import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";

export const PhaserPage = () => {
  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    console.log("Current Scene: ", scene);
  };

  return (
    <>
      <div className="text-center p-5">
        <div className="flex justify-center items-center">
          <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
      </div>
    </>
  );
};

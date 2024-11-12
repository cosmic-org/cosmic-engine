"use client";

import dynamic from "next/dynamic";
import { PhaserPage } from "./PhaserPage";
import type { NextPage } from "next";

const PhaserPageWithNoSSR = dynamic(() => Promise.resolve(PhaserPage), { ssr: false });

const TicTacToePage: NextPage = () => {
  return (
    <>
      <PhaserPageWithNoSSR />
    </>
  );
};

export default TicTacToePage;

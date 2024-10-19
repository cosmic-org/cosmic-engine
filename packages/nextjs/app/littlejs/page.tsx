"use client";
"use strict";

// import module
import { useEffect } from "react";

export default function Page() {
  /*
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    if (LittleJS.mouseWasPressed(0))
    {
        // play sound when mouse is pressed
        sound_click.play(LittleJS.mousePos);

        // change particle color and set to fade out
        particleEmitter.colorStartA = hsl();
        particleEmitter.colorStartB = LittleJS.randColor();
        particleEmitter.colorEndA = particleEmitter.colorStartA.scale(1,0);
        particleEmitter.colorEndB = particleEmitter.colorStartB.scale(1,0);

        // unlock medals
        medal_example.unlock();
    }

    // move particles to mouse location if on screen
    if (LittleJS.mousePosScreen.x)
        particleEmitter.pos = LittleJS.mousePos;
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{

}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // draw a grey square in the background without using webgl
    LittleJS.drawRect(vec2(16,8), vec2(20,14), hsl(0,0,.6), 0, false);
    
    // draw the logo as a tile
    LittleJS.drawTile(vec2(21,5), vec2(4.5), tile(3,128));
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // draw to overlay canvas for hud rendering
    LittleJS.drawTextScreen('LittleJS with TypeScript', vec2(LittleJS.mainCanvasSize.x/2, 80), 80);
}
*/

  ///////////////////////////////////////////////////////////////////////////////
  // Startup LittleJS Engine
  // const {tile, vec2, hsl} = LittleJS;

  // sound effects
  // const sound_click = new LittleJS.Sound([1,.5]);

  // // medals
  // const medal_example = new LittleJS.Medal(0, 'Example Medal', 'Welcome to LittleJS!');
  // LittleJS.medalsInit('Hello World');

  let LittleJS: any;
  let tile: any, vec2: any, hsl: any;
  let particleEmitter: any;
  let sound_click: any;
  let medal_example: any;

  function gameInit() {
    // create tile collision and visible tile layer
    const tileCollisionSize = vec2(32, 16);
    LittleJS.initTileCollision(tileCollisionSize);
    const pos = vec2();
    const tileLayer = new LittleJS.TileLayer(pos, tileCollisionSize);

    // get level data from the tiles image
    const mainContext = LittleJS.mainContext;
    const tileImage = LittleJS.textureInfos[0].image;

    console.log(tileImage);

    mainContext.drawImage(tileImage, 0, 0);
    const imageData = mainContext.getImageData(0, 0, tileImage.width, tileImage.height).data;
    for (pos.x = tileCollisionSize.x; pos.x--; )
      for (pos.y = tileCollisionSize.y; pos.y--; ) {
        // check if this pixel is set
        const i = pos.x + tileImage.width * (15 + tileCollisionSize.y - pos.y);
        if (!imageData[4 * i]) continue;

        // set tile data
        const tileIndex = 1;
        const direction = LittleJS.randInt(4);
        const mirror = !LittleJS.randInt(2);
        const color = LittleJS.randColor();
        const data = new LittleJS.TileLayerData(tileIndex, direction, mirror, color);
        tileLayer.setData(pos, data);
        LittleJS.setTileCollisionData(pos, 1);
      }

    // draw tile layer with new data
    tileLayer.redraw();

    // move camera to center of collision
    LittleJS.setCameraPos(tileCollisionSize.scale(0.5));
    LittleJS.setCameraScale(48);

    // enable gravity
    LittleJS.setGravity(-0.01);

    // create particle emitter
    particleEmitter = new LittleJS.ParticleEmitter(
      vec2(16, 9),
      0, // emitPos, emitAngle
      1,
      0,
      500,
      Math.PI, // emitSize, emitTime, emitRate, emiteCone
      tile(0, 16), // tileIndex, tileSize
      hsl(1, 1, 1),
      hsl(0, 0, 0), // colorStartA, colorStartB
      hsl(0, 0, 0, 0),
      hsl(0, 0, 0, 0), // colorEndA, colorEndB
      2,
      0.2,
      0.2,
      0.1,
      0.05, // time, sizeStart, sizeEnd, speed, angleSpeed
      0.99,
      1,
      1,
      Math.PI, // damping, angleDamping, gravityScale, cone
      0.05,
      0.5,
      true,
      true, // fadeRate, randomness, collide, additive
    );
    particleEmitter.elasticity = 0.3; // bounce when it collides
    particleEmitter.trailScale = 2; // stretch in direction of motion
  }

  function gameUpdate() {
    if (LittleJS.mouseWasPressed(0)) {
      // play sound when mouse is pressed
      sound_click.play(LittleJS.mousePos);

      // change particle color and set to fade out
      particleEmitter.colorStartA = hsl();
      particleEmitter.colorStartB = LittleJS.randColor();
      particleEmitter.colorEndA = particleEmitter.colorStartA.scale(1, 0);
      particleEmitter.colorEndB = particleEmitter.colorStartB.scale(1, 0);

      // unlock medals
      medal_example.unlock();
    }

    // move particles to mouse location if on screen
    if (LittleJS.mousePosScreen.x) particleEmitter.pos = LittleJS.mousePos;
  }
  function gameUpdatePost() {
    if (true) return;
  }
  function gameRender() {
    // draw a grey square in the background without using webgl
    LittleJS.drawRect(vec2(16, 8), vec2(20, 14), hsl(0, 0, 0.6), 0, false);

    // draw the logo as a tile
    LittleJS.drawTile(vec2(21, 5), vec2(4.5), tile(3, 128));
  }
  function gameRenderPost() {
    // draw to overlay canvas for hud rendering
    LittleJS.drawTextScreen("LittleJS with TypeScript", vec2(LittleJS.mainCanvasSize.x / 2, 80), 80);
  }

  function initializeLittleJS() {
    LittleJS = require("littlejsengine/dist/littlejs.esm");

    // show the LittleJS splash screen
    // LittleJS.setShowSplashScreen(true);

    tile = LittleJS.tile;
    vec2 = LittleJS.vec2;
    hsl = LittleJS.hsl;

    sound_click = new LittleJS.Sound([1, 0.5]);

    medal_example = new LittleJS.Medal(0, "Example Medal", "Welcome to LittleJS!");
    LittleJS.medalsInit("Hello World");

    LittleJS.engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
  }

  useEffect(() => {
    initializeLittleJS();
  }, []);

  return <main></main>;
}

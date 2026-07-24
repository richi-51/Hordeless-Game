import InputHandler from "./InputHandler.js";
import Player from "./Player.js";
import Game from "./Game.js";
import EnemyManager from "./EnemyManager.js";
import BossManager from "./BossManager.js";
import ItemManager from "./ItemManager.js";
import PlatformManager from "./PlatformManager.js";
import EffectManager from "./EffectManager.js";
import BoxManager from "./BoxManager.js";
import TrampolineManager from "./TrampolineManager.js";
import Sprite from "./Sprite.js";

import { Levels } from "./LevelData.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;
let LEVEL_WIDTH = 3000;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const game = new Game(GAME_WIDTH, GAME_HEIGHT);
const input = new InputHandler();
const platforms = new PlatformManager(GAME_WIDTH, GAME_HEIGHT);
const effects = new EffectManager();
const boxes = new BoxManager(game);
const trampolines = new TrampolineManager();

input.platforms = platforms.platforms;

const player = new Player(GAME_WIDTH, GAME_HEIGHT, game);
const enemies = new EnemyManager(GAME_WIDTH, GAME_HEIGHT, game);
const bossManager = new BossManager(GAME_WIDTH, GAME_HEIGHT, game);
const items = new ItemManager(GAME_HEIGHT, game);

const bgImage = new Image();
let bgPattern = null;
bgImage.onload = () => {
  bgPattern = ctx.createPattern(bgImage, "repeat");
};

const spikeImage = new Image();
spikeImage.src = "/Assets/Free/Traps/Spikes/Idle.png"; // 16x16

// Start and End flags
const startFlag = new Sprite(
  "/Assets/Free/Items/Checkpoints/Start/Start (Moving) (64x64).png",
  64,
  64,
  17,
  0.05,
);
const endFlag = new Sprite(
  "/Assets/Free/Items/Checkpoints/End/End (Idle).png",
  64,
  64,
  1,
  0.1,
);
let startX = 50;
let endX = LEVEL_WIDTH - 150;

let cameraX = 0;
let currentLevel = null;

let overviewMode = false;

window.Levels = Levels;

game.onStartRun = (upgrades) => {
  player.applyUpgrades(upgrades);

  currentLevel = Levels[game.currentLevelIndex] || Levels[0];
  game.currentLevel = currentLevel;

  bgImage.src = currentLevel.bgImage;
  LEVEL_WIDTH = currentLevel.length;
  startX = 50;
  endX = LEVEL_WIDTH - 150;

  platforms.reset(
    currentLevel.platforms,
    currentLevel.terrain,
    currentLevel.terrainColor,
    currentLevel.grassColor,
  );
  enemies.reset(currentLevel.enemies, effects, currentLevel.gaps, currentLevel.terrain);
  bossManager.reset(currentLevel, player);
  items.reset(LEVEL_WIDTH);
  effects.reset();
  boxes.reset(currentLevel.boxes, currentLevel.terrain, currentLevel.gaps);
  trampolines.reset(currentLevel.trampolines);

  // Spawn confetti at start for polish
  effects.addEffect(startX, GAME_HEIGHT - 40, "confetti");

  cameraX = 0;
};

// Normal game flow starts from menu and level 1 prep only.
// Debug auto-start removed.
window.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") {
    overviewMode = !overviewMode;
  }
});
window.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    exportLevelMap();
  }
});

let lastTime = 0;

function drawTerrain(ctx, cameraX) {
  if (!currentLevel) return;

  const baseColor = currentLevel.baseColor || "#8B4513";
  const topColor = currentLevel.terrainColor || "#800000";
  const grassColor = currentLevel.grassColor || "#228B22";
  const groundLevel = GAME_HEIGHT - 40;

  // Render ground segments, skipping gaps
  let groundSegments = [];
  if (currentLevel.gaps && currentLevel.gaps.length > 0) {
    let currentX = 0;
    const sortedGaps = [...currentLevel.gaps].sort((a, b) => a.x - b.x);
    for (let gap of sortedGaps) {
      if (gap.x > currentX) {
        groundSegments.push({ x: currentX, width: gap.x - currentX });
      }
      currentX = gap.x + gap.width;
    }
    if (currentX < LEVEL_WIDTH) {
      groundSegments.push({ x: currentX, width: LEVEL_WIDTH - currentX });
    }
  } else {
    groundSegments.push({ x: 0, width: LEVEL_WIDTH });
  }

  for (let seg of groundSegments) {
    // Base bulk of the ground (dirt)
    ctx.fillStyle = baseColor;
    ctx.fillRect(seg.x - cameraX, groundLevel + 8, seg.width, 40 - 8);

    // Top band of terrain (colored)
    ctx.fillStyle = topColor;
    ctx.fillRect(seg.x - cameraX, groundLevel, seg.width, 8);

    // Thin grass/highlight on very top
    ctx.fillStyle = grassColor;
    ctx.fillRect(seg.x - cameraX, groundLevel, seg.width, 4);
  }

  // Draw Spikes in specific areas
  if (spikeImage.complete && currentLevel.spikes) {
    for (let spikeZone of currentLevel.spikes) {
      const spikeY = spikeZone.y || (groundLevel - 16);
      for (let i = 0; i < spikeZone.count; i++) {
        ctx.drawImage(
          spikeImage,
          spikeZone.x + i * 16 - cameraX,
          spikeY,
          16,
          16,
        );
      }
    }
  }
}

function exportLevelMap() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = LEVEL_WIDTH;
  exportCanvas.height = GAME_HEIGHT;

  const ectx = exportCanvas.getContext("2d");

  // Background
  if (bgPattern) {
    ectx.fillStyle = bgPattern;
    ectx.fillRect(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
  } else {
    ectx.fillStyle = "#000";
    ectx.fillRect(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
  }

  // Terrain
  drawTerrain(ectx, 0);

  // Flags
  startFlag.draw(ectx, startX, GAME_HEIGHT - 40 - 64);
  endFlag.draw(ectx, endX, GAME_HEIGHT - 40 - 64);

  // Semua object
  platforms.draw(ectx, 0, true);
  boxes.draw(ectx, 0);
  trampolines.draw(ectx, 0);
  items.draw(ectx, 0);
  enemies.draw(ectx, 0);

  // Player Spawn
  player.draw(ectx, 0);

  const img = exportCanvas.toDataURL("image/png");

  const win = window.open("");
  win.document.write(`
        <title>Level Overview</title>
        <body style="margin:0;background:#333">
            <img src="${img}" style="display:block">
        </body>
    `);
}

function gameLoop(timestamp) {
  let deltaTime = (timestamp - lastTime) / 1000;
  if (isNaN(deltaTime)) deltaTime = 0;
  lastTime = timestamp;
  if (deltaTime > 0.1) deltaTime = 0.1;

  // Draw scrolling background
  if (bgPattern) {
    ctx.save();
    ctx.fillStyle = bgPattern;
    // Parallax effect on background
    ctx.translate(-(cameraX * 0.5) % 64, 0);
    ctx.fillRect(-64, 0, GAME_WIDTH + 128, GAME_HEIGHT);
    ctx.restore();
  } else {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  if (bossManager.redAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(200, 0, 0, ${bossManager.redAlpha})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();
  }

  if (overviewMode) {
    const scale = GAME_WIDTH / LEVEL_WIDTH;

    ctx.save();

    ctx.scale(scale, scale);

    drawTerrain(ctx, 0);

    startFlag.draw(ctx, startX, GAME_HEIGHT - 40 - 64);
    endFlag.draw(ctx, endX, GAME_HEIGHT - 40 - 64);

    platforms.draw(ctx, 0);
    boxes.draw(ctx, 0);
    trampolines.draw(ctx, 0);
    items.draw(ctx, 0);
    enemies.draw(ctx, 0);
    effects.draw(ctx, 0);

    player.draw(ctx, 0);

    ctx.restore();

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("OVERVIEW MODE (Press M)", 20, 25);

    requestAnimationFrame(gameLoop);
    return;
  }

  if (game.currentState === game.states.PLAYING) {
    // Update Game Logic
    input.update(deltaTime);
    platforms.update(deltaTime);
    effects.update(deltaTime);
    startFlag.update(deltaTime);
    endFlag.update(deltaTime);
    input.platforms = platforms.platforms;
    input.boxes = boxes.boxes;

    player.update(input, deltaTime, effects);
    enemies.update(deltaTime, player, platforms.platforms, effects);
    bossManager.update(deltaTime, player, platforms.platforms, effects);
    items.update(deltaTime, player, effects);
    boxes.update(deltaTime, player, items);
    trampolines.update(deltaTime, player);
    game.updateScore(deltaTime);

    // Camera Follows Player (centered horizontally)
    if (!overviewMode) {
      cameraX = player.x - GAME_WIDTH / 2 + player.width / 2;

      if (cameraX < 0) cameraX = 0;
      if (bossManager.boss && bossManager.boss.alive && bossManager.triggered) {
        const bossLock = bossManager.boss.cameraLockX ?? cameraX;
        cameraX = bossLock;
      } else if (cameraX > LEVEL_WIDTH - GAME_WIDTH) {
        cameraX = LEVEL_WIDTH - GAME_WIDTH;
      }
    }

    // Check Spike Collision
    if (
      player.y + player.height >= GAME_HEIGHT - 40 - 16 &&
      currentLevel.spikes
    ) {
      for (let spikeZone of currentLevel.spikes) {
        if (
          player.x + player.width > spikeZone.x &&
          player.x < spikeZone.x + spikeZone.count * 16
        ) {
          if (player.takeDamage) player.takeDamage();
          break;
        }
      }
    }

    // Check End Goal Collision
    if (
      player.x + player.width > endX &&
      player.y + player.height >= GAME_HEIGHT - 40 - 64
    ) {
      if (!bossManager.boss || !bossManager.boss.alive) {
        if (game.currentLevelIndex < 2) {
          // Completed a level, unlock the next one and move to its preparation screen
          game.score += 500;
          game.unlockLevel(game.currentLevelIndex + 1);
          game.prepareLevel(game.currentLevelIndex + 1);
        } else {
          game.score += 500;
          game.unlockLevel(2);
          game.victory = true;
          game.endRun();
        }
      }
    }

    // Render everything with cameraX offset
    drawTerrain(ctx, cameraX);
    startFlag.draw(ctx, startX - cameraX, GAME_HEIGHT - 40 - 64);
    endFlag.draw(ctx, endX - cameraX, GAME_HEIGHT - 40 - 64);

    platforms.draw(ctx, cameraX, overviewMode);
    boxes.draw(ctx, cameraX);
    trampolines.draw(ctx, cameraX);
    items.draw(ctx, cameraX);
    enemies.draw(ctx, cameraX);
    bossManager.draw(ctx, cameraX);
    effects.draw(ctx, cameraX);
    player.draw(ctx, cameraX);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

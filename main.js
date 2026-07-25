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
spikeImage.src = "./Assets/Free/Traps/Spikes/Idle.png";

// Start and End flags
const startFlag = new Sprite(
  "./Assets/Free/Items/Checkpoints/Start/Start (Moving) (64x64).png",
  64,
  64,
  17,
  0.05
);
const endFlag = new Sprite(
  "./Assets/Free/Items/Checkpoints/End/End (Idle).png",
  64,
  64,
  1,
  0.1
);

// End NPC companion sprite tracking
let endNpcSprite = null;
let endNpcImage = new Image();

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

  // Safe NPC Image Preloader & Sprite Handler
  if (currentLevel.npcBoss) {
    endNpcImage = new Image();
    endNpcImage.src = currentLevel.npcBoss.sprite;

    endNpcSprite = new Sprite(
      currentLevel.npcBoss.sprite,
      currentLevel.npcBoss.frameWidth,
      currentLevel.npcBoss.frameHeight,
      currentLevel.npcBoss.frameCount,
      currentLevel.npcBoss.frameDuration
    );
  } else {
    endNpcSprite = null;
  }

  platforms.reset(
    currentLevel.platforms,
    currentLevel.terrain,
    currentLevel.terrainColor,
    currentLevel.grassColor
  );
  enemies.reset(currentLevel.enemies, effects, currentLevel.gaps, currentLevel.terrain);
  bossManager.reset(currentLevel, player);
  bossManager.onBossDefeated = () => {
    if (game.currentLevelIndex === 1) {
      game.startDialog(
        [
          "Following strange energy signals left behind by the fleeing corruption, the Wanderer reaches another planet.",
          "A frozen ocean world. Snow never melts. Auroras cover the sky. Ice stretches beyond the horizon.",
          "But once again... the inhabitants have become monsters.",
          "While searching abandoned ice temples, the explorer discovers Glacielle, the Penguin Spirit.",
          'Glacielle: "Free my people... before this world becomes another empty shell."',
          "The sacred seal is broken. Glacielle grants the Sacred Penguin Fruit.",
          "By consuming it, the explorer gains the ability to transform into the Penguin Spirit.",
          "Together, they push through corrupted glaciers and frozen temples until finally reaching the Devil himself.",
          "Press Space or click to continue to Level 3.",
        ],
        "Glacielle",
        () => {
          game.score += 500;
          game.unlockLevel(2);
          game.prepareLevel(2);
        }
      );
    }
  };
  items.reset(LEVEL_WIDTH);
  effects.reset();
  boxes.reset(currentLevel.boxes, currentLevel.terrain, currentLevel.gaps);
  trampolines.reset(currentLevel.trampolines);

  effects.addEffect(startX, GAME_HEIGHT - 40, "confetti");

  cameraX = 0;
};

// Key bindings
window.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") {
    overviewMode = !overviewMode;
  }
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
    ctx.fillStyle = baseColor;
    ctx.fillRect(seg.x - cameraX, groundLevel + 8, seg.width, 40 - 8);

    ctx.fillStyle = topColor;
    ctx.fillRect(seg.x - cameraX, groundLevel, seg.width, 8);

    ctx.fillStyle = grassColor;
    ctx.fillRect(seg.x - cameraX, groundLevel, seg.width, 4);
  }

  if (spikeImage.complete && currentLevel.spikes) {
    for (let spikeZone of currentLevel.spikes) {
      const spikeY = spikeZone.y || groundLevel - 16;
      for (let i = 0; i < spikeZone.count; i++) {
        ctx.drawImage(
          spikeImage,
          spikeZone.x + i * 16 - cameraX,
          spikeY,
          16,
          16
        );
      }
    }
  }
}

/**
 * Draws the companion NPC right next to the level goal trophy
 */
function drawEndNPC(ctx, cameraOffsetX) {
  if (!currentLevel || !currentLevel.npcBoss) return;

  const npcData = currentLevel.npcBoss;
  const scale = npcData.scale || 0.5;
  const renderWidth = npcData.frameWidth * scale;
  const renderHeight = npcData.frameHeight * scale;

  // Render position directly right of trophy on ground level
  const npcX = endX + (npcData.offsetX || 48) - cameraOffsetX;
  const npcY = GAME_HEIGHT - 40 - renderHeight;

  // Draw sprite when loaded, otherwise render colored debugging placeholder
  if (endNpcImage && endNpcImage.complete && endNpcImage.naturalWidth > 0) {
    const currentFrame = endNpcSprite ? endNpcSprite.frame : 0;

    ctx.save();
    if (npcData.facingLeft) {
      ctx.translate(npcX + renderWidth / 2, npcY + renderHeight / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(
        endNpcImage,
        currentFrame * npcData.frameWidth,
        0,
        npcData.frameWidth,
        npcData.frameHeight,
        -renderWidth / 2,
        -renderHeight / 2,
        renderWidth,
        renderHeight
      );
    } else {
      ctx.drawImage(
        endNpcImage,
        currentFrame * npcData.frameWidth,
        0,
        npcData.frameWidth,
        npcData.frameHeight,
        npcX,
        npcY,
        renderWidth,
        renderHeight
      );
    }
    ctx.restore();
  } else {
    // Visible Fallback (Green for Dino, Cyan for Pengu) if asset fails to load
    ctx.save();
    ctx.fillStyle = npcData.type === "dino" ? "#228B22" : "#00FFFF";
    ctx.fillRect(npcX, npcY, renderWidth, renderHeight);
    ctx.restore();
  }
}

function exportLevelMap() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = LEVEL_WIDTH;
  exportCanvas.height = GAME_HEIGHT;

  const ectx = exportCanvas.getContext("2d");

  if (bgPattern) {
    ectx.fillStyle = bgPattern;
    ectx.fillRect(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
  } else {
    ectx.fillStyle = "#000";
    ectx.fillRect(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
  }

  drawTerrain(ectx, 0);

  startFlag.draw(ectx, startX, GAME_HEIGHT - 40 - 64);
  endFlag.draw(ectx, endX, GAME_HEIGHT - 40 - 64);
  drawEndNPC(ectx, 0);

  platforms.draw(ectx, 0, true);
  boxes.draw(ectx, 0);
  trampolines.draw(ectx, 0);
  items.draw(ectx, 0);
  enemies.draw(ectx, 0);

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
  // Toggle attack control visibility: only show when player is Dino (rex/tri)
  try {
    const attackEl = document.getElementById('controls-attack');
    if (attackEl) {
      if (player.form === 'rex' || player.form === 'tri') {
        attackEl.style.display = '';
      } else {
        attackEl.style.display = 'none';
      }
    }
  } catch (e) {
    // ignore DOM errors in non-browser contexts
  }
  if (bgPattern) {
    ctx.save();
    ctx.fillStyle = bgPattern;
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
    drawEndNPC(ctx, 0);

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
    input.update(deltaTime);
    platforms.update(deltaTime);
    effects.update(deltaTime);
    startFlag.update(deltaTime);
    endFlag.update(deltaTime);

    if (endNpcSprite) {
      endNpcSprite.update(deltaTime);
    }

    input.platforms = platforms.platforms;
    input.boxes = boxes.boxes;

    player.update(input, deltaTime, effects);
    enemies.update(deltaTime, player, platforms.platforms, effects);
    bossManager.update(deltaTime, player, platforms.platforms, effects);
    items.update(deltaTime, player, effects);
    boxes.update(deltaTime, player, items);
    trampolines.update(deltaTime, player);
    game.updateScore(deltaTime);

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

    if (
      player.x + player.width > endX &&
      player.y + player.height >= GAME_HEIGHT - 40 - 64
    ) {
      if (!bossManager.boss || !bossManager.boss.alive) {
        if (game.currentLevelIndex === 0) {
          game.startDialog(
            [
              "A traveller from the stars...",
              "You are not one of the Devil's servants, are you?",
              "Long ago, the Horned Devil descended upon this world.",
              "He poisoned the hearts of my people. Those who once lived in peace now fight as mindless beasts.",
              "As long as his corruption remains... this planet can never heal.",
              "I no longer possess the strength to oppose him.",
              "Take this Sacred Dino Fruit.",
              "It carries a fragment of my soul.",
              "Whenever you consume one, your body will resonate with my spirit, allowing you to become me for a short time.",
              "Use my strength. Break the Devil's corruption.",
              "Save my people... and continue your journey.",
              "Transformation Unlocked: Dino Spirit.",
              "Press Space or click to continue to Level 2.",
            ],
            "Terranox",
            () => {
              game.score += 500;
              game.unlockLevel(1);
              game.prepareLevel(1);
            }
          );
        } else if (game.currentLevelIndex === 1) {
          game.startDialog(
            [
              "A visitor... from beyond the stars.",
              "Terranox has entrusted you with his power.",
              "Then there is still hope.",
              "The Horned Devil reached this world after yours.",
              "He buried my heart beneath eternal ice and twisted my people into his servants.",
              "Their bodies remain... but their wills are no longer their own.",
              "You have come farther than anyone before.",
              "Allow me to lend you my strength.",
              "This is the Sacred Penguin Fruit.",
              "When you eat one, your spirit will unite with mine.",
              "For a brief moment, you shall take my form and wield the power of frost.",
              "Together... we may yet stop the Devil before another world falls.",
              "Transformation Unlocked: Penguin Spirit.",
              "Press Space or click to continue to Level 3.",
            ],
            "Glacielle",
            () => {
              game.score += 500;
              game.unlockLevel(2);
              game.prepareLevel(2);
            }
          );
        } else {
          game.score += 500;
          game.unlockLevel(2);
          game.victory = true;
          game.startDialog(
            [
              "Back aboard ARK-01, the explorer reviews the ship's navigation system.",
              "The scanner suddenly activates.",
              "One.",
              "Two.",
              "Ten.",
              "Hundreds.",
              "Thousands.",
              "Across the galaxy...",
              "Planet after planet emits the same corrupted energy.",
              "The Devil has already reached countless civilizations.",
              "The Wanderer is no longer searching only for humanity's new home.",
              "He has become the guardian of every world still worth saving.",
              "The navigation computer highlights the next destination.",
              "UNKNOWN PLANET DETECTED",
              "Corruption Level: ██████████",
              "Guardian Spirit: Unknown",
              "The explorer grips his helmet.",
              "The engines ignite.",
              "His journey continues.",
            ],
            "Wanderer",
            () => game.endRun()
          );
        }
      }
    }

    drawTerrain(ctx, cameraX);
    startFlag.draw(ctx, startX - cameraX, GAME_HEIGHT - 40 - 64);
    endFlag.draw(ctx, endX - cameraX, GAME_HEIGHT - 40 - 64);

    drawEndNPC(ctx, cameraX);

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
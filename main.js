import InputHandler from './InputHandler.js';
import Player from './Player.js';
import Game from './Game.js';
import EnemyManager from './EnemyManager.js';
import ItemManager from './ItemManager.js';
import PlatformManager from './PlatformManager.js';
import EffectManager from './EffectManager.js';
import BoxManager from './BoxManager.js';
import TrampolineManager from './TrampolineManager.js';
import Sprite from './Sprite.js';

import { Levels } from './LevelData.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
const items = new ItemManager(GAME_HEIGHT, game);

const bgImage = new Image();
let bgPattern = null;
bgImage.onload = () => {
    bgPattern = ctx.createPattern(bgImage, 'repeat');
};

const spikeImage = new Image();
spikeImage.src = '/Assets/Free/Traps/Spikes/Idle.png'; // 16x16

// Start and End flags
const startFlag = new Sprite('/Assets/Free/Items/Checkpoints/Start/Start (Moving) (64x64).png', 64, 64, 17, 0.05);
const endFlag = new Sprite('/Assets/Free/Items/Checkpoints/End/End (Idle).png', 64, 64, 1, 0.1);
let startX = 50;
let endX = LEVEL_WIDTH - 150;

let cameraX = 0;
let currentLevel = null;

game.onStartRun = (upgrades) => {
    player.applyUpgrades(upgrades);
    
    currentLevel = Levels[game.currentLevelIndex] || Levels[0];
    
    bgImage.src = currentLevel.bgImage;
    LEVEL_WIDTH = currentLevel.length;
    startX = 50;
    endX = LEVEL_WIDTH - 150;

    platforms.reset(currentLevel.platforms);
    enemies.reset(currentLevel.enemies, effects);
    items.reset(LEVEL_WIDTH);
    effects.reset();
    boxes.reset(currentLevel.boxes);
    trampolines.reset(currentLevel.trampolines);
    
    // Spawn confetti at start for polish
    effects.addEffect(startX, GAME_HEIGHT - 40, 'confetti');
    
    cameraX = 0;
};

let lastTime = 0;

function drawTerrain(ctx, cameraX) {
    if (!currentLevel) return;
    
    ctx.fillStyle = currentLevel.terrainColor;
    ctx.fillRect(-cameraX, GAME_HEIGHT - 40, LEVEL_WIDTH, 40); 
    
    ctx.fillStyle = currentLevel.grassColor;
    ctx.fillRect(-cameraX, GAME_HEIGHT - 40, LEVEL_WIDTH, 8); 

    // Draw Spikes in a specific area
    if (spikeImage.complete && currentLevel.spikes) {
        for (let spikeZone of currentLevel.spikes) {
            for (let i = 0; i < spikeZone.count; i++) {
                ctx.drawImage(spikeImage, spikeZone.x + i * 16 - cameraX, GAME_HEIGHT - 40 - 16, 16, 16);
            }
        }
    }
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
        items.update(deltaTime, player, effects);
        boxes.update(deltaTime, player, items);
        trampolines.update(deltaTime, player);
        game.updateScore(deltaTime);

        // Camera Follows Player (centered horizontally)
        cameraX = player.x - GAME_WIDTH / 2 + player.width / 2;
        
        // Clamp camera to level bounds
        if (cameraX < 0) cameraX = 0;
        if (cameraX > LEVEL_WIDTH - GAME_WIDTH) cameraX = LEVEL_WIDTH - GAME_WIDTH;

        // Check Spike Collision
        if (player.y + player.height >= GAME_HEIGHT - 40 - 16 && currentLevel.spikes) {
            for (let spikeZone of currentLevel.spikes) {
                if (player.x + player.width > spikeZone.x && player.x < spikeZone.x + spikeZone.count * 16) {
                    if (player.takeDamage) player.takeDamage();
                    break;
                }
            }
        }

        // Check End Goal Collision
        if (player.x + player.width > endX && player.y + player.height >= GAME_HEIGHT - 40 - 64) {
            // Level Complete!
            game.score += 500; // Bonus for completing
            game.endRun(); 
        }

        // Render everything with cameraX offset
        drawTerrain(ctx, cameraX);
        startFlag.draw(ctx, startX - cameraX, GAME_HEIGHT - 40 - 64);
        endFlag.draw(ctx, endX - cameraX, GAME_HEIGHT - 40 - 64);
        
        platforms.draw(ctx, cameraX);
        boxes.draw(ctx, cameraX);
        trampolines.draw(ctx, cameraX);
        items.draw(ctx, cameraX);
        enemies.draw(ctx, cameraX);
        effects.draw(ctx, cameraX);
        player.draw(ctx, cameraX);
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

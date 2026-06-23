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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;
const LEVEL_WIDTH = 3000;

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
const items = new ItemManager(GAME_WIDTH, GAME_HEIGHT, game);

const bgImage = new Image();
bgImage.src = '/Assets/Free/Background/Blue.png';
let bgPattern = null;
bgImage.onload = () => {
    bgPattern = ctx.createPattern(bgImage, 'repeat');
};

const spikeImage = new Image();
spikeImage.src = '/Assets/Free/Traps/Spikes/Idle.png'; // 16x16

// Start and End flags
const startFlag = new Sprite('/Assets/Free/Items/Checkpoints/Start/Start (Moving) (64x64).png', 64, 64, 17, 0.05);
const endFlag = new Sprite('/Assets/Free/Items/Checkpoints/End/End (Idle).png', 64, 64, 1, 0.1);
const startX = 50;
const endX = LEVEL_WIDTH - 150;

let cameraX = 0;

game.onStartRun = (upgrades) => {
    player.applyUpgrades(upgrades);
    enemies.reset(effects);
    items.reset(LEVEL_WIDTH);
    effects.reset();
    boxes.reset();
    trampolines.reset();
    cameraX = 0;
};

let lastTime = 0;

function drawTerrain(ctx, cameraX) {
    ctx.fillStyle = '#8B4513';
    // Draw the ground across the whole level
    ctx.fillRect(-cameraX, GAME_HEIGHT - 40, LEVEL_WIDTH, 40); 
    
    ctx.fillStyle = '#228B22';
    ctx.fillRect(-cameraX, GAME_HEIGHT - 40, LEVEL_WIDTH, 8); 

    // Draw Spikes in a specific area
    if (spikeImage.complete) {
        for (let i = 0; i < 6; i++) {
            ctx.drawImage(spikeImage, 600 + i * 16 - cameraX, GAME_HEIGHT - 40 - 16, 16, 16);
            ctx.drawImage(spikeImage, 1300 + i * 16 - cameraX, GAME_HEIGHT - 40 - 16, 16, 16);
            ctx.drawImage(spikeImage, 2100 + i * 16 - cameraX, GAME_HEIGHT - 40 - 16, 16, 16);
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
        
        player.update(input, deltaTime);
        enemies.update(deltaTime, player, platforms.platforms, effects);
        items.update(deltaTime, player);
        boxes.update(deltaTime, player, items);
        trampolines.update(deltaTime, player);
        game.updateScore(deltaTime);

        // Camera Follows Player (centered horizontally)
        cameraX = player.x - GAME_WIDTH / 2 + player.width / 2;
        
        // Clamp camera to level bounds
        if (cameraX < 0) cameraX = 0;
        if (cameraX > LEVEL_WIDTH - GAME_WIDTH) cameraX = LEVEL_WIDTH - GAME_WIDTH;

        // Check Spike Collision
        if (player.y + player.height >= GAME_HEIGHT - 40 - 16) {
            // Check against spike zones
            if ((player.x + player.width > 600 && player.x < 600 + 6*16) ||
                (player.x + player.width > 1300 && player.x < 1300 + 6*16) ||
                (player.x + player.width > 2100 && player.x < 2100 + 6*16)) {
                if (player.takeDamage) player.takeDamage();
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

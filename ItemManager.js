import Sprite from './Sprite.js';

export default class ItemManager {
    constructor(gameWidth, gameHeight, game) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.game = game;
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2; // spawn a fruit every 2 seconds
        
        // Using Apple as the coin/item (17 frames)
        this.sprite = new Sprite('/Assets/Free/Items/Fruits/Apple.png', 32, 32, 17, 0.05);
    }

    update(deltaTime, player) {
        this.sprite.update(deltaTime);

        // Spawning logic
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
        }

        // Update items & collision
        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];

            // Collision with player
            if (player.x < item.x + item.width &&
                player.x + player.width > item.x &&
                player.y < item.y + item.height &&
                player.y + player.height > item.y) {
                
                this.game.addCoin();
                this.items.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraX) {
        for (let item of this.items) {
            this.sprite.draw(ctx, item.x - cameraX, item.y);
        }
    }

    spawn(levelWidth) {
        const y = this.gameHeight - 40 - 32;
        // Spawn randomly across the level width
        const x = 200 + Math.random() * (levelWidth - 400); 
        this.items.push({ x, y, width: 32, height: 32 });
    }

    reset(levelWidth = 3000) {
        this.items = [];
        this.spawnTimer = 0;
        // Pre-spawn some items
        for(let i = 0; i < 15; i++) {
            this.spawn(levelWidth);
        }
    }
}

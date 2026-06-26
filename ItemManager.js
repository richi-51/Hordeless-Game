import Sprite from './Sprite.js';
import { audioManager } from './AudioManager.js';

export default class ItemManager {
    constructor(gameHeight, game) {
        this.gameHeight = gameHeight;
        this.game = game;
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3;

        this.sprites = {
            'coin': new Sprite('/Assets/Free/Items/Fruits/Apple.png', 32, 32, 17, 0.05),
            'fruit-rex': new Sprite('/Assets/Free/Items/Fruits/Pineapple.png', 32, 32, 17, 0.05),
            'fruit-tri': new Sprite('/Assets/Free/Items/Fruits/Melon.png', 32, 32, 17, 0.05),
            'fruit-pengu': new Sprite('/Assets/Free/Items/Fruits/Orange.png', 32, 32, 17, 0.05)
        };
    }

    update(deltaTime, player, effects) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            // Spawning is handled externally usually, but if dynamic:
            // this.spawn(levelWidth);
        }

        for (let s in this.sprites) {
            this.sprites[s].update(deltaTime);
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];

            // Collision with player
            if (player.x < item.x + item.width &&
                player.x + player.width > item.x &&
                player.y < item.y + item.height &&
                player.y + player.height > item.y) {
                
                if (item.type === 'coin') {
                    this.game.addCoin();
                    if (player.health < player.maxHealth) {
                        player.health++;
                        this.game.updateHUD(player.health);
                    }
                } else if (item.type === 'fruit-rex' || item.type === 'fruit-tri' || item.type === 'fruit-pengu') {
                    player.transform(item.type.replace('fruit-', ''));
                }
                
                audioManager.play('fruit');
                if (effects) effects.addEffect(item.x, item.y, 'collected');
                this.items.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraX) {
        for (let item of this.items) {
            let sprite = this.sprites[item.type] || this.sprites['coin'];
            sprite.draw(ctx, item.x - cameraX, item.y);
        }
    }

    spawn(levelWidth) {
        const y = this.gameHeight - 40 - 32;
        const x = 200 + Math.random() * (levelWidth - 400); 
        
        let type = 'coin';
        let r = Math.random();
        
        // Spawn transformation fruits if upgraded, with some probability
        if (this.game.loadout && r > 0.8) {
            let options = [];
            if (this.game.loadout.rex) options.push('fruit-rex');
            if (this.game.loadout.tri) options.push('fruit-tri');
            if (this.game.loadout.pengu) options.push('fruit-pengu');
            
            if (options.length > 0) {
                type = options[Math.floor(Math.random() * options.length)];
            }
        }

        this.items.push({ x, y, width: 32, height: 32, type: type });
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

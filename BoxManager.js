import Sprite from './Sprite.js';

export default class BoxManager {
    constructor(game) {
        this.game = game;
        this.boxes = [];
        this.idleSprite = new Sprite('/Assets/Free/Items/Boxes/Box1/Idle.png', 28, 24, 1, 0.1);
        this.breakSprite = new Sprite('/Assets/Free/Items/Boxes/Box1/Break.png', 28, 24, 4, 0.05); // Assume 4 frames? Let me just use 1 frame if it doesn't animate properly, actually we should just remove it and spawn an effect.

        // For simplicity, we just use the first frame of break or particle.
        // Let's rely on EffectManager or just not render after breaking.

        this.initialBoxes = [
            { x: 400, y: 150 },
            { x: 450, y: 150 },
            { x: 1000, y: 150 },
            { x: 1200, y: 100 },
        ];
    }

    reset() {
        this.boxes = [];
        for (let b of this.initialBoxes) {
            this.boxes.push({
                x: b.x,
                y: b.y,
                width: 28,
                height: 24,
                state: 'idle', // 'idle' or 'breaking'
                breakTimer: 0
            });
        }
    }

    update(deltaTime, player, itemsManager) {
        for (let i = this.boxes.length - 1; i >= 0; i--) {
            let box = this.boxes[i];
            
            if (box.state === 'breaking') {
                box.breakTimer += deltaTime;
                if (box.breakTimer > 0.2) { // 200ms break anim
                    this.boxes.splice(i, 1);
                    // Spawn fruit!
                    itemsManager.items.push({ x: box.x, y: box.y - 32, width: 32, height: 32 });
                }
                continue;
            }

            // Player hits box from below
            if (player.vy < 0) {
                // If player top is hitting box bottom
                let prevTop = (player.y - player.vy * deltaTime);
                let currentTop = player.y;

                if (prevTop >= box.y + box.height && currentTop <= box.y + box.height) {
                    // Check horizontal overlap
                    if (player.x + player.width > box.x && player.x < box.x + box.width) {
                        player.y = box.y + box.height;
                        player.vy = 0; // Bonk!
                        
                        box.state = 'breaking';
                        this.game.score += 50;
                    }
                }
            }
            
            // Player lands on box
            if (player.vy >= 0) {
                let prevBottom = (player.y - player.vy * deltaTime) + player.height;
                let currentBottom = player.y + player.height;

                if (prevBottom <= box.y && currentBottom >= box.y) {
                    if (player.x + player.width > box.x && player.x < box.x + box.width) {
                        player.y = box.y - player.height;
                        player.vy = 0;
                        player.grounded = true;
                    }
                }
            }
        }
    }

    draw(ctx, cameraX) {
        for (let box of this.boxes) {
            if (box.state === 'idle') {
                this.idleSprite.draw(ctx, box.x - cameraX, box.y);
            } else {
                this.breakSprite.update(0.016); // force update
                this.breakSprite.draw(ctx, box.x - cameraX, box.y);
            }
        }
    }
}

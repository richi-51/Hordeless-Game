import Sprite from './Sprite.js';

export default class TrampolineManager {
    constructor() {
        this.trampolines = [];
        this.idleSprite = new Sprite('/Assets/Free/Traps/Trampoline/Idle.png', 28, 28, 1, 0.1);
        this.jumpSprite = new Sprite('/Assets/Free/Traps/Trampoline/Jump (28x28).png', 28, 28, 8, 0.05);
    }

    reset(trampolineData) {
        this.trampolines = [];
        if (!trampolineData) return;
        for (let t of trampolineData) {
            this.trampolines.push({
                x: t.x,
                y: t.y,
                width: 28,
                height: 28,
                state: 'idle', // 'idle' or 'jumping'
                animTimer: 0
            });
        }
    }

    update(deltaTime, player) {
        for (let t of this.trampolines) {
            if (t.state === 'jumping') {
                t.animTimer += deltaTime;
                if (t.animTimer > 0.4) { // 8 frames * 0.05
                    t.state = 'idle';
                    t.animTimer = 0;
                }
            }

            // Player collision with trampoline
            if (player.vy >= 0) {
                let playerBottom = player.y + player.height;
                let playerRight = player.x + player.width;
                
                // If player's bottom overlaps the trampoline vertically and they overlap horizontally
                if (playerBottom >= t.y && playerBottom <= t.y + t.height && playerRight > t.x && player.x < t.x + t.width) {
                    player.y = t.y - player.height;
                    player.vy = -750; // Extra smooth big bounce!
                    t.state = 'jumping';
                    t.animTimer = 0;
                }
            }
        }
    }

    draw(ctx, cameraX) {
        for (let t of this.trampolines) {
            if (t.state === 'idle') {
                this.idleSprite.draw(ctx, t.x - cameraX, t.y);
            } else {
                // Calculate frame based on animTimer so it doesn't speed up with multiple trampolines
                let frameIndex = Math.floor(t.animTimer / 0.05);
                if (frameIndex > 7) frameIndex = 7;
                this.jumpSprite.currentFrame = frameIndex;
                this.jumpSprite.draw(ctx, t.x - cameraX, t.y);
            }
        }
    }
}

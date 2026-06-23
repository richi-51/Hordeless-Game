import Sprite from './Sprite.js';

export default class TrampolineManager {
    constructor() {
        this.trampolines = [];
        this.idleSprite = new Sprite('/Assets/Free/Traps/Trampoline/Idle.png', 28, 28, 1, 0.1);
        this.jumpSprite = new Sprite('/Assets/Free/Traps/Trampoline/Jump (28x28).png', 28, 28, 8, 0.05);

        this.initialData = [
            { x: 900, y: 360 - 40 - 28 },
            { x: 1700, y: 360 - 40 - 28 }
        ];
    }

    reset() {
        this.trampolines = [];
        for (let t of this.initialData) {
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
                this.jumpSprite.update(deltaTime);
                if (t.animTimer > 0.4) { // 8 frames * 0.05
                    t.state = 'idle';
                    t.animTimer = 0;
                }
            }

            // Player lands on trampoline
            if (player.vy >= 0) {
                let prevBottom = (player.y - player.vy * deltaTime) + player.height;
                let currentBottom = player.y + player.height;

                if (prevBottom <= t.y + 10 && currentBottom >= t.y + 10) {
                    if (player.x + player.width > t.x && player.x < t.x + t.width) {
                        player.y = t.y + 10 - player.height;
                        player.vy = -700; // Big bounce!
                        t.state = 'jumping';
                        t.animTimer = 0;
                        this.jumpSprite.currentFrame = 0;
                    }
                }
            }
        }
    }

    draw(ctx, cameraX) {
        for (let t of this.trampolines) {
            if (t.state === 'idle') {
                this.idleSprite.draw(ctx, t.x - cameraX, t.y);
            } else {
                this.jumpSprite.draw(ctx, t.x - cameraX, t.y);
            }
        }
    }
}

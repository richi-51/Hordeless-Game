import Sprite from './Sprite.js';

export default class EffectManager {
    constructor() {
        this.effects = [];
        this.dustImage = new Image();
        this.dustImage.src = '/Assets/Free/Other/Dust Particle.png';
        
        this.confettiSprite = new Sprite('/Assets/Free/Other/Confetti (16x16).png', 16, 16, 1, 0.1); 
        this.appearSprite = new Sprite('/Assets/Free/Main Characters/Appearing (96x96).png', 96, 96, 7, 0.05);
        this.disappearSprite = new Sprite('/Assets/Free/Main Characters/Desappearing (96x96).png', 96, 96, 7, 0.05);
        this.collectedSprite = new Sprite('/Assets/Free/Items/Fruits/Collected.png', 32, 32, 6, 0.05);
    }

    reset() {
        this.effects = [];
    }

    addEffect(x, y, type) {
        if (type === 'dust') {
            this.effects.push({
                x: x, y: y, type: 'dust',
                life: 0.5, maxLife: 0.5,
                vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 50
            });
            return;
        } else if (type === 'confetti') {
            for (let i = 0; i < 20; i++) {
                this.effects.push({
                    x: x, y: y, type: 'confetti',
                    life: 2.0, maxLife: 2.0,
                    vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 200 - 100,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`
                });
            }
            return;
        }

        let spriteToUse = null;
        if (type === 'appear') spriteToUse = this.appearSprite;
        else if (type === 'disappear') spriteToUse = this.disappearSprite;
        else if (type === 'collected') spriteToUse = this.collectedSprite;

        if (spriteToUse) {
            this.effects.push({
                x: x,
                y: y,
                type: type,
                sprite: spriteToUse,
                frame: 0,
                timer: 0,
                maxFrames: spriteToUse.frameCount,
                frameDuration: spriteToUse.frameDuration
            });
        }
    }

    update(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            let effect = this.effects[i];
            if (effect.type === 'dust' || effect.type === 'confetti') {
                effect.life -= deltaTime;
                effect.x += effect.vx * deltaTime;
                effect.y += effect.vy * deltaTime;
                if (effect.type === 'confetti') {
                    effect.vy += 400 * deltaTime; // gravity for confetti
                }
                if (effect.life <= 0) {
                    this.effects.splice(i, 1);
                }
            } else {
                effect.timer += deltaTime;
                if (effect.timer >= effect.frameDuration) {
                    effect.timer = 0;
                    effect.frame++;
                    if (effect.frame >= effect.maxFrames) {
                        this.effects.splice(i, 1);
                    }
                }
            }
        }
    }

    draw(ctx, cameraX) {
        for (let effect of this.effects) {
            if (effect.type === 'dust') {
                ctx.globalAlpha = effect.life / effect.maxLife;
                ctx.drawImage(this.dustImage, effect.x - cameraX, effect.y);
                ctx.globalAlpha = 1.0;
            } else if (effect.type === 'confetti') {
                ctx.globalAlpha = effect.life / effect.maxLife;
                this.confettiSprite.draw(ctx, effect.x - cameraX, effect.y);
                ctx.globalAlpha = 1.0;
            } else {
                let sprite = effect.sprite;
                if (sprite) {
                    sprite.currentFrame = effect.frame;
                    sprite.draw(ctx, effect.x - cameraX, effect.y);
                }
            }
        }
    }

    reset() {
        this.effects = [];
    }
}

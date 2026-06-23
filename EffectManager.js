import Sprite from './Sprite.js';

export default class EffectManager {
    constructor() {
        this.effects = [];
        this.appearingSprite = new Sprite('/Assets/Free/Main Characters/Appearing (96x96).png', 96, 96, 7, 0.05);
        this.disappearingSprite = new Sprite('/Assets/Free/Main Characters/Desappearing (96x96).png', 96, 96, 7, 0.05);
    }

    addEffect(x, y, type) {
        // type is 'appear' or 'disappear'
        this.effects.push({
            x: x - 32, // Offset because effect is 96x96 and character is 32x32
            y: y - 32,
            type: type,
            frameTimer: 0,
            frameIndex: 0,
            maxFrames: 7,
            frameDuration: 0.05
        });
    }

    update(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            let effect = this.effects[i];
            effect.frameTimer += deltaTime;
            if (effect.frameTimer >= effect.frameDuration) {
                effect.frameTimer = 0;
                effect.frameIndex++;
                if (effect.frameIndex >= effect.maxFrames) {
                    this.effects.splice(i, 1);
                }
            }
        }
    }

    draw(ctx, cameraX) {
        for (let effect of this.effects) {
            let sprite = effect.type === 'appear' ? this.appearingSprite : this.disappearingSprite;
            sprite.currentFrame = effect.frameIndex;
            sprite.draw(ctx, effect.x - cameraX, effect.y);
        }
    }

    reset() {
        this.effects = [];
    }
}

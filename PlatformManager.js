import Sprite from './Sprite.js';

export default class PlatformManager {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // Load the 32x8 platform. It has an animation, but let's just draw the first frame or use the sprite.
        this.sprite = new Sprite('/Assets/Free/Traps/Platforms/Brown On (32x8).png', 32, 8, 8, 0.1);
        this.platforms = [];
    }

    reset(platformsData) {
        this.platforms = platformsData || [];
    }

    update(deltaTime) {
        this.sprite.update(deltaTime);
    }

    draw(ctx, cameraX) {
        for (let plat of this.platforms) {
            // Only draw if within screen roughly
            if (plat.x + plat.width < cameraX - 100 || plat.x > cameraX + this.gameWidth + 100) continue;
            
            for (let i = 0; i < plat.width / 32; i++) {
                this.sprite.draw(ctx, plat.x + i * 32 - cameraX, plat.y);
            }
        }
    }
}

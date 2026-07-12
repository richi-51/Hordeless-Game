import Sprite from "./Sprite.js";

export default class PlatformManager {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    // Load the 32x8 platform. It has an animation, but let's just draw the first frame or use the sprite.
    this.sprite = new Sprite(
      "/Assets/Free/Traps/Platforms/Brown On (32x8).png",
      32,
      8,
      8,
      0.1,
    );
    this.image = this.sprite.image;
    this.platforms = [];
  }

  reset(platformsData) {
    this.platforms = platformsData || [];
  }

  update(deltaTime) {
    this.sprite.update(deltaTime);
  }

  draw(ctx, cameraX, overview = false) {
    if (!this.image.complete) return;

    const frameX = this.sprite.currentFrame * 32;

    for (let plat of this.platforms) {
      if (
        !overview &&
        (plat.x + plat.width < cameraX - 100 ||
          plat.x > cameraX + this.gameWidth + 100)
      )
        continue;

      const tileCount = Math.ceil(plat.width / 32);

      for (let i = 0; i < tileCount; i++) {
        ctx.drawImage(
          this.image,

          frameX,
          0,
          32,
          8,

          plat.x + i * 32 - cameraX,
          plat.y,

          32,
          8,
        );
      }
    }
  }
}

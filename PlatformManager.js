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

  reset(platformsData, terrainData = [], terrainColor = "#8B4513", grassColor = "#228B22") {
    const mappedPlatforms = Array.isArray(platformsData)
      ? platformsData.map((plat) => ({
          ...plat,
          oneWay: true,
          isPlatform: true,
        }))
      : [];

    const mappedTerrain = Array.isArray(terrainData)
      ? terrainData.map((terrain) => ({
          ...terrain,
          oneWay: false,
          isTerrain: true,
          color: terrain.color || terrainColor,
          grassColor: terrain.grassColor || grassColor,
        }))
      : [];

    this.platforms = [...mappedPlatforms, ...mappedTerrain];
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

      if (plat.isTerrain) {
        const topBandHeight = Math.min(8, plat.height || 8);
        const baseHeight = Math.max(0, (plat.height || 8) - topBandHeight);
        const baseColor = plat.baseColor || "#8B4513"; // brown base to show elevation
        const topColor = plat.color || "#800000"; // terrain main color (purple/maroon)
        const grassHeight = Math.min(4, topBandHeight);

        // Draw base/bulk of terrain in brown
        if (baseHeight > 0) {
          ctx.fillStyle = baseColor;
          ctx.fillRect(plat.x - cameraX, plat.y + topBandHeight, plat.width, baseHeight);
        }

        // Draw top band in the terrain color
        ctx.fillStyle = topColor;
        ctx.fillRect(plat.x - cameraX, plat.y, plat.width, topBandHeight);

        // Draw a thin grass/highlight strip on the very top
        ctx.fillStyle = plat.grassColor || "#228B22";
        ctx.fillRect(plat.x - cameraX, plat.y, plat.width, grassHeight);
        continue;
      }

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

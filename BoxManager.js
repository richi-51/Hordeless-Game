import Sprite from "./Sprite.js";

export default class BoxManager {
  constructor(game) {
    this.game = game;
    this.boxes = [];
    this.idleSprite = new Sprite(
      "/Assets/Free/Items/Boxes/Box1/Idle.png",
      28,
      24,
      1,
      0.1,
    );
    this.breakSprite = new Sprite(
      "/Assets/Free/Items/Boxes/Box1/Break.png",
      28,
      24,
      4,
      0.05,
    ); // Assume 4 frames? Let me just use 1 frame if it doesn't animate properly, actually we should just remove it and spawn an effect.

    // For simplicity, we just use the first frame of break or particle.
    // Let's rely on EffectManager or just not render after breaking.

    this.initialBoxes = [
      { x: 400, y: 150 },
      { x: 450, y: 150 },
      { x: 1000, y: 150 },
      { x: 1200, y: 100 },
    ];
  }

  reset(levelBoxes = null, terrainData = [], gapsData = []) {
    this.boxes = [];
    const groundLevel = 280; // gameHeight (320) - 40
    const boxesToLoad = Array.isArray(levelBoxes)
      ? levelBoxes
      : this.initialBoxes;

    for (let b of boxesToLoad) {
      // Find the highest standing surface (lowest y) at this box's x
      const boxCenterX = b.x + 16;
      let surfaceY = groundLevel;

      // Check if over a gap (no ground beneath)
      const overGap =
        Array.isArray(gapsData) &&
        gapsData.some(
          (gap) => boxCenterX > gap.x && boxCenterX < gap.x + gap.width,
        );
      if (overGap) surfaceY = Infinity;

      // Check terrain — use the highest terrain surface at this x
      if (Array.isArray(terrainData)) {
        for (let t of terrainData) {
          if (boxCenterX >= t.x && boxCenterX <= t.x + t.width && t.y < surfaceY) {
            surfaceY = t.y;
          }
        }
      }

      // Fallback if no surface found (shouldn't happen)
      if (!isFinite(surfaceY)) surfaceY = groundLevel;

      // Calculate hittable box Y position:
      // Player standing head: surfaceY - 32
      // Player jump peak head: surfaceY - 32 - 67 ≈ surfaceY - 99
      // Box must satisfy:
      //   box.y + 28 < surfaceY - 32  (player can walk under)
      //   box.y > surfaceY - 99        (player can reach by jumping)
      // Sweet spot: surfaceY - 115 (elevated high above ground, easily hittable with jump)
      const boxY = surfaceY - 115;

      this.boxes.push({
        x: b.x + 2, // collision digeser sedikit ke kanan
        y: boxY,
        width: 32, // collision dipersempit
        height: 28,
        drawX: b.x, // posisi gambar asli
        state: "idle",
        breakTimer: 0,
        isBox: true,
      });
    }
  }

  update(deltaTime, player, itemsManager) {
    for (let i = this.boxes.length - 1; i >= 0; i--) {
      let box = this.boxes[i];

      if (box.state === "breaking") {
        box.breakTimer += deltaTime;
        if (box.breakTimer > 0.2) {
          // 200ms break anim
          this.boxes.splice(i, 1);

          // Determine fruit type based on loadout
          let type = "coin";
          let r = Math.random();
          if (this.game.loadout && r > 0.5) {
            // 50% chance from box
            let options = [];
            if (this.game.loadout.rex) options.push("fruit-rex");
            if (this.game.loadout.tri) options.push("fruit-tri");
            if (this.game.loadout.pengu) options.push("fruit-pengu");

            if (options.length > 0) {
              type = options[Math.floor(Math.random() * options.length)];
            }
          }

          // Spawn fruit!
          itemsManager.items.push({
            x: box.x,
            y: box.y - 32,
            width: 32,
            height: 32,
            type: type,
          });
        }
      }
    }
  }

  draw(ctx, cameraX) {
    for (let box of this.boxes) {
      const scaleX = box.width / this.idleSprite.frameWidth;
      const scaleY = box.height / this.idleSprite.frameHeight;

      if (box.state === "idle") {
        this.idleSprite.draw(
          ctx,
          box.drawX - cameraX,
          box.y,
          false,
          scaleX,
          scaleY,
        );
      } else {
        this.breakSprite.update(0.016); // force update
        this.breakSprite.draw(
          ctx,
          box.drawX - cameraX,
          box.y,
          false,
          scaleX,
          scaleY,
        );
      }
    }
  }
}

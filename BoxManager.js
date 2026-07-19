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

  reset(levelBoxes = null) {
    this.boxes = [];
    const boxesToLoad = Array.isArray(levelBoxes)
      ? levelBoxes
      : this.initialBoxes;
    for (let b of boxesToLoad) {
      this.boxes.push({
        x: b.x,
        y: b.y,
        width: 32,
        height: 28,
        state: "idle", // 'idle' or 'breaking'
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
          box.x - cameraX,
          box.y,
          false,
          scaleX,
          scaleY,
        );
      } else {
        this.breakSprite.update(0.016); // force update
        this.breakSprite.draw(
          ctx,
          box.x - cameraX,
          box.y,
          false,
          scaleX,
          scaleY,
        );
      }
    }
  }
}

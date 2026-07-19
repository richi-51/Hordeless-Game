import Sprite from "./Sprite.js";
import { audioManager } from "./AudioManager.js";

export default class BossManager {
  constructor(gameWidth, gameHeight, game) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.game = game;

    this.sprites = {
      idle: new Sprite("/Assets/Demon/IDLE.png", 79, 69, 4, 0.12),
      attack: new Sprite("/Assets/Demon/ATTACK.png", 79, 69, 8, 0.08),
      flying: new Sprite("/Assets/Demon/FLYING.png", 79, 69, 4, 0.12),
      hurt: new Sprite("/Assets/Demon/HURT.png", 79, 69, 4, 0.12),
      death: new Sprite("/Assets/Demon/DEATH.png", 79, 69, 7, 0.1),
      projectile: new Sprite("/Assets/Demon/projectile.png", 48, 32, 1, 0.1),
    };

    this.frameBounds = {
      idle: [
        { top: 7, bottom: 63 },
        { top: 4, bottom: 66 },
        { top: 5, bottom: 62 },
        { top: 6, bottom: 62 },
      ],
      attack: [
        { top: 3, bottom: 66 },
        { top: 1, bottom: 66 },
        { top: 0, bottom: 65 },
        { top: 6, bottom: 66 },
        { top: 3, bottom: 65 },
        { top: 4, bottom: 63 },
        { top: 5, bottom: 64 },
        { top: 6, bottom: 65 },
      ],
      flying: [
        { top: 6, bottom: 62 },
        { top: 3, bottom: 66 },
        { top: 4, bottom: 62 },
        { top: 5, bottom: 62 },
      ],
      hurt: [
        { top: 3, bottom: 66 },
        { top: 0, bottom: 60 },
        { top: 0, bottom: 60 },
        { top: 1, bottom: 66 },
      ],
      death: [
        { top: 3, bottom: 66 },
        { top: 15, bottom: 66 },
        { top: 15, bottom: 66 },
        { top: 14, bottom: 67 },
        { top: 14, bottom: 67 },
        { top: 13, bottom: 68 },
        { top: 15, bottom: 68 },
      ],
    };

    this.projectiles = [];
    this.redAlpha = 0;
    this.triggered = false;
    this.boss = null;
  }

  getFrameBounds() {
    if (!this.boss) return { top: 0, bottom: 68 };
    const state =
      this.boss.state in this.frameBounds ? this.boss.state : "flying";
    const bounds = this.frameBounds[state];
    if (!bounds || bounds.length === 0) return { top: 0, bottom: 68 };
    const frameIndex = Math.min(
      this.sprites[state].currentFrame,
      bounds.length - 1,
    );
    return bounds[frameIndex] || bounds[0];
  }

  reset(level, player) {
    this.projectiles = [];
    this.redAlpha = 0;
    this.triggered = false;
    this.boss = null;

    if (level && level.boss) {
      this.boss = {
        x: level.boss.x,
        y: level.boss.y,
        width: 79,
        height: 69,
        health: level.boss.health,
        maxHealth: level.boss.health,
        state: "idle",
        stateTimer: 0,
        attackCooldown: 2.0,
        attackInterval: 2.5,
        alive: true,
        deathEnded: false,
        facingRight: false,
        triggerX: level.boss.triggerX || level.boss.x - 400,
      };
    }
  }

  update(deltaTime, player, platforms, effects) {
    if (!this.boss) return;

    if (!this.triggered && player.x > this.boss.triggerX) {
      this.triggered = true;
      this.boss.state = "flying";
      this.boss.stateTimer = 0;
    }

    if (this.triggered) {
      this.redAlpha = Math.min(0.45, this.redAlpha + deltaTime * 0.35);
    } else {
      this.redAlpha = Math.max(0, this.redAlpha - deltaTime * 0.35);
    }

    for (let key of Object.keys(this.sprites)) {
      this.sprites[key].update(deltaTime);
    }

    if (!this.boss.alive) {
      if (this.boss.state === "death") {
        this.boss.stateTimer += deltaTime;
        if (!this.boss.deathEnded && this.boss.stateTimer > 1.2) {
          this.boss.deathEnded = true;
          // remove boss entity after death animation finished so it disappears from map
          this.projectiles = [];
          this.triggered = false;
          this.boss = null;
        }
      }
      return;
    }

    // Prevent passing behind boss while alive by clamping crossing based on previous position
    if (player.prevX !== undefined) {
      const prevRight = player.prevX + player.width;
      const prevLeft = player.prevX;
      const curRight = player.x + player.width;
      const curLeft = player.x;

      // Approaching from left
      if (prevRight <= this.boss.x && curRight > this.boss.x) {
        // block horizontal crossing
        player.x = this.boss.x - player.width;
        player.vx = 0;
      }
      // Approaching from right
      if (
        prevLeft >= this.boss.x + this.boss.width &&
        curLeft < this.boss.x + this.boss.width
      ) {
        player.x = this.boss.x + this.boss.width;
        player.vx = 0;
      }
    }

    // Stomp detection: only when player is falling and crosses boss visible top between frames
    const prevBottom =
      player.prevY !== undefined
        ? player.prevY + player.height
        : player.y + player.height - player.vy * 0.016;
    const currBottom = player.y + player.height;
    const visibleBounds = this.getFrameBounds();
    const bossTop = this.boss.y + visibleBounds.top;
    const bossBottom = this.boss.y + visibleBounds.bottom;
    const crossedTop = prevBottom <= bossTop && currBottom >= bossTop;

    if (
      crossedTop &&
      player.vy > 0 &&
      player.x + player.width > this.boss.x &&
      player.x < this.boss.x + this.boss.width
    ) {
      // damage 1 for normal stomp; if player is in a powered attack animation, allow 2
      const damage = player.form === "normal" ? 1 : player.isAttacking ? 2 : 1;
      this.boss.health -= damage;
      this.boss.state = "hurt";
      this.boss.stateTimer = 0;
      player.vy = -280;
      // place player standing on top of visible boss graphic
      player.y = bossTop - player.height;
      player.attackHitRegistered = true;
      effects.addEffect(
        this.boss.x + this.boss.width / 2,
        this.boss.y + 16,
        "disappear",
      );
      audioManager.play("hurt");

      if (this.boss.health <= 0) {
        this.boss.health = 0;
        this.boss.alive = false;
        this.boss.state = "death";
        this.boss.stateTimer = 0;
        audioManager.play("kill");
      }
    } else {
      // side contact hurts player
      if (player.y < bossBottom && player.y + player.height > bossTop) {
        if (
          player.x + player.width > this.boss.x &&
          player.x < this.boss.x + this.boss.width
        ) {
          if (player.takeDamage) player.takeDamage();
        }
      }
    }

    if (this.boss.state === "flying") {
      if (this.boss.stateTimer > 1.0) {
        this.boss.state = "attack";
        this.boss.stateTimer = 0;
      }
    } else if (this.boss.state === "attack") {
      if (this.boss.stateTimer > 0.7) {
        this.fireProjectile(player);
        this.boss.state = "flying";
        this.boss.stateTimer = 0;
        this.boss.attackCooldown = this.boss.attackInterval;
      }
    } else if (this.boss.state === "hurt") {
      if (this.boss.stateTimer > 0.45) {
        this.boss.state = "flying";
        this.boss.stateTimer = 0;
      }
    }

    this.boss.stateTimer += deltaTime;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.vy += 1200 * deltaTime;
      proj.x += proj.vx * deltaTime;
      proj.y += proj.vy * deltaTime;

      if (
        proj.y > this.gameHeight ||
        proj.x < player.x - 500 ||
        proj.x > player.x + this.gameWidth + 500
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (
        proj.x < player.x + player.width &&
        proj.x + proj.width > player.x &&
        proj.y < player.y + player.height &&
        proj.y + proj.height > player.y
      ) {
        if (player.takeDamage) player.takeDamage();
        this.projectiles.splice(i, 1);
        continue;
      }
    }

    if (player.isAttacking && !player.attackHitRegistered) {
      const attackHitbox = {
        x: player.facingRight ? player.x : player.x - 60,
        y: player.y,
        width: player.width + 60,
        height: player.height,
      };

      if (
        attackHitbox.x < this.boss.x + this.boss.width &&
        attackHitbox.x + attackHitbox.width > this.boss.x &&
        attackHitbox.y < this.boss.y + this.boss.height &&
        attackHitbox.y + attackHitbox.height > this.boss.y
      ) {
        let damage = player.form === "normal" ? 1 : 2;
        this.boss.health -= damage;
        this.boss.state = "hurt";
        this.boss.stateTimer = 0;
        player.attackHitRegistered = true;
        effects.addEffect(
          this.boss.x + this.boss.width / 2,
          this.boss.y + 16,
          "disappear",
        );
        audioManager.play("hurt");

        if (this.boss.health <= 0) {
          this.boss.health = 0;
          this.boss.alive = false;
          this.boss.state = "death";
          this.boss.stateTimer = 0;
          audioManager.play("kill");
        }
      }
    }
  }

  fireProjectile(player) {
    if (!this.boss) return;

    const originX = this.boss.x + this.boss.width / 2 - 24;
    const originY = this.boss.y + 26;
    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;
    const dx = targetX - (this.boss.x + this.boss.width / 2);
    const dy = targetY - (this.boss.y + this.boss.height / 2);
    const distance = Math.max(1, Math.abs(dx));
    const speed = 240;
    let vx = (dx / distance) * speed;
    if (Math.abs(vx) < 120) vx = dx < 0 ? -120 : 120;
    const vy = Math.min(350, dy * 0.55);

    this.projectiles.push({
      x: originX,
      y: originY,
      vx,
      vy,
      width: 48,
      height: 32,
    });
  }

  draw(ctx, cameraX) {
    if (!this.boss || !this.triggered) return;

    if (this.boss.alive) {
      const sprite =
        this.boss.state === "attack"
          ? this.sprites.attack
          : this.boss.state === "hurt"
            ? this.sprites.hurt
            : this.sprites.flying;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(
        this.boss.x - cameraX + 12,
        this.boss.y + this.boss.height - 6,
        56,
        8,
      );
      sprite.draw(
        ctx,
        this.boss.x - cameraX,
        this.boss.y,
        this.boss.facingRight,
      );
    } else {
      this.sprites.death.draw(
        ctx,
        this.boss.x - cameraX,
        this.boss.y,
        this.boss.facingRight,
      );
    }

    const bounds = this.getFrameBounds();
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    const bossTextY = this.boss.y + bounds.top - 12;
    ctx.fillText(
      `Health: ${this.boss.health}`,
      this.boss.x - cameraX,
      bossTextY,
    );

    for (let proj of this.projectiles) {
      this.sprites.projectile.draw(ctx, proj.x - cameraX, proj.y);
    }
  }
}

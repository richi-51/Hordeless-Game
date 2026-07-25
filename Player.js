import Sprite from './Sprite.js';
import { audioManager } from './AudioManager.js';

export default class Player {
    constructor(gameWidth, gameHeight, game) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.game = game;
        
        this.width = 32;
        this.height = 32;
        
        // Base Stats
        this.baseMaxSpeed = 200;
        this.baseJumpStrength = -400;
        this.baseMaxHealth = 3;
        
        this.maxSpeed = this.baseMaxSpeed;
        this.acceleration = 400;
        this.friction = 300;
        this.gravity = 1200;
        this.jumpStrength = this.baseJumpStrength;
        this.trampolineBoostTimer = 0;
        this.maxTrampolineBoostTime = 0.16;
        this.maxTrampolineHeight = 140;
        this.trampolineBoostOriginY = null;
        
        this.health = this.baseMaxHealth;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 1.5;
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 1.2;
        this.deathFinished = false;
        this.attackHitRegistered = false;
        this.dropDownTimer = 0;

        this.x = 50;
        this.y = this.gameHeight - this.height - 40;
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx = 0;
        this.vy = 0;
        
        this.grounded = false;
        this.jumpCutMultiplier = 0.4; 
        this.coyoteTime = 0.15;
        this.coyoteCounter = 0;
        this.facingRight = true;
        this.maxJumps = 1;
        this.jumpCount = 0;

        this.canWallJump = false;
        this.wallSliding = false;
        this.wallSlideSpeed = 50;
        
        // Sprites
        const basePath = '/Assets/Free/Main Characters/Virtual Guy';
        this.sprites = {
            normal: {
                idle: new Sprite(`${basePath}/Idle (32x32).png`, 32, 32, 11, 0.05),
                run: new Sprite(`${basePath}/Run (32x32).png`, 32, 32, 12, 0.05),
                jump: new Sprite(`${basePath}/Jump (32x32).png`, 32, 32, 1, 0.1),
                djump: new Sprite(`${basePath}/Double Jump (32x32).png`, 32, 32, 6, 0.05),
                wjump: new Sprite(`${basePath}/Wall Jump (32x32).png`, 32, 32, 5, 0.05),
                fall: new Sprite(`${basePath}/Fall (32x32).png`, 32, 32, 1, 0.1),
                hit: new Sprite(`${basePath}/Hit (32x32).png`, 32, 32, 7, 0.05),
                attack: new Sprite(`${basePath}/Run (32x32).png`, 32, 32, 12, 0.05)
            },
            rex: {
                idle: new Sprite('/Assets/Free/Bosses_Dino_Rex/Dino Rex/dino_rex_idle.png', 128, 128, 5, 0.1),
                run: new Sprite('/Assets/Free/Bosses_Dino_Rex/Dino Rex/dino_rex_move.png', 384, 128, 8, 0.05),
                jump: new Sprite('/Assets/Free/Bosses_Dino_Rex/Dino Rex/dino_rex_idle.png', 128, 128, 1, 0.1),
                djump: new Sprite('/Assets/Free/Bosses_Dino_Rex/Dino Rex/dino_rex_idle.png', 128, 128, 1, 0.1),
                wjump: new Sprite('/Assets/Free/Bosses_Dino_Rex/Dino Rex/dino_rex_idle.png', 128, 128, 1, 0.1),
                fall: new Sprite('/Assets/Free/Bosses_Dino_Rex/Dino Rex/dino_rex_idle.png', 128, 128, 1, 0.1),
                attack: new Sprite('/Assets/Free/Bosses_Dino_Rex/Dino Rex/dino_rex_attack_A.png', 384, 128, 21, 0.05)
            },
            tri: {
                idle: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_idle.png', 384, 128, 6, 0.1),
                run: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_move.png', 384, 128, 8, 0.05),
                jump: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_idle.png', 384, 128, 1, 0.1),
                djump: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_idle.png', 384, 128, 1, 0.1),
                wjump: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_idle.png', 384, 128, 1, 0.1),
                fall: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_idle.png', 384, 128, 1, 0.1),
                attack: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_attack_A.png', 384, 128, 21, 0.05)
            },
            pengu: {
                idle: new Sprite('/Assets/Free/Bosses_Pengu/Pengu/pengu_idle.png', 128, 128, 5, 0.1),
                run: new Sprite('/Assets/Free/Bosses_Pengu/Pengu/pengu_move.png', 384, 128, 8, 0.05),
                jump: new Sprite('/Assets/Free/Bosses_Pengu/Pengu/pengu_idle.png', 128, 128, 1, 0.1),
                djump: new Sprite('/Assets/Free/Bosses_Pengu/Pengu/pengu_idle.png', 128, 128, 1, 0.1),
                wjump: new Sprite('/Assets/Free/Bosses_Pengu/Pengu/pengu_idle.png', 128, 128, 1, 0.1),
                fall: new Sprite('/Assets/Free/Bosses_Pengu/Pengu/pengu_idle.png', 128, 128, 1, 0.1),
                attack: new Sprite('/Assets/Free/Bosses_Pengu/Pengu/pengu_attack_peck.png', 384, 128, 11, 0.05)
            }
        };
        this.form = 'normal';
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 0;
        this.currentSprite = this.sprites.normal.idle;
        this.deathSprite = new Sprite('/Assets/Jesus/HandsUp2.png', 89, 128, 1, 0.1);

        if (!Player.shadowImage) {
            Player.shadowImage = new Image();
            Player.shadowImage.src = '/Assets/Free/Other/Shadow.png';
        }
    }

    transform(formName) {
        if (this.sprites[formName]) {
            this.form = formName;
            let oldHeight = this.height;
            if (formName === 'normal') {
                this.width = 24;
                this.height = 24;
            } else if (formName === 'rex') {
                this.width = 40;
                this.height = 48;
            } else if (formName === 'tri') {
                this.width = 80;
                this.height = 36;
            } else if (formName === 'pengu') {
                this.width = 40;
                this.height = 50;
            } else {
                this.width = 32;
                this.height = 32;
            }
            this.y -= (this.height - oldHeight);
            this.isAttacking = false;
            this.attackTimer = 0;
            this.attackDuration = 0;
            this.currentSprite = this.sprites[formName].idle;
        }
    }

    revertForm() {
        if (this.form !== 'normal') {
            this.transform('normal');
            this.invulnerableTimer = this.invulnerableDuration;
            this.vy = -300;
        }
    }

    startDeathSequence() {
        this.isDying = true;
        this.deathTimer = 0;
        this.deathFinished = false;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 0;
        this.vx = 0;
        this.vy = -180;
        this.grounded = false;
        this.form = 'jesus';
        this.currentSprite = this.deathSprite;
        this.width = 28;
        this.height = 28;
        this.game.updateHUD(0);

        audioManager.stop('heavenly');
        audioManager.play('heavenly');
    }

    takeDamage() {
        if (this.invulnerableTimer > 0 || this.isDying) return;
        
        audioManager.play('hurt');

        if (this.form !== 'normal') {
            this.revertForm();
            return;
        }

        this.health--;
        this.invulnerableTimer = this.invulnerableDuration;
        this.vy = -300;
        this.game.updateHUD(this.health);

        if (this.health <= 0) {
            this.startDeathSequence();
        }
    }

    applyUpgrades(upgrades) {
        let speedMultiplier = 1;
        if (upgrades.speed === 1) speedMultiplier = 1.02;
        else if (upgrades.speed === 2) speedMultiplier = 1.05;
        else if (upgrades.speed >= 3) speedMultiplier = 1.10;
        
        this.maxSpeed = this.baseMaxSpeed * speedMultiplier;
        this.jumpStrength = this.baseJumpStrength;
        this.health = this.baseMaxHealth + upgrades.health;
        this.maxJumps = upgrades.djump ? 2 : 1;
        this.canWallJump = upgrades.wjump;
        
        this.isDying = false;
        this.deathTimer = 0;
        this.deathFinished = false;
        this.transform('normal');
        this.x = 50;
        this.y = this.gameHeight - this.height - 40;
        this.vx = 0;
        this.vy = 0;
        this.jumpCount = 0;
        this.grounded = false;
        this.currentSprite = this.sprites.normal.idle;
    }

    draw(ctx, cameraX) {
        if (!this.currentSprite) return;
        
        if (this.invulnerableTimer > 0 && !this.isDying) {
            if (Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
                return;
            }
        }
        
        if (!this.isDying && Player.shadowImage && Player.shadowImage.complete) {
            ctx.drawImage(Player.shadowImage, this.x + this.width / 2 - 16 - cameraX, this.y + this.height - 4, 32, 8);
        }

        ctx.save();
        
        let scale = this.isDying ? 0.45 : (this.form === 'normal' ? 1.0 : 0.5);
        let renderWidth = this.currentSprite.frameWidth * scale;
        let renderHeight = this.currentSprite.frameHeight * scale;

        let drawX = Math.floor((this.x - cameraX) + (this.width / 2) - (renderWidth / 2));
        let drawY = Math.floor(this.y + this.height - renderHeight);

        this.currentSprite.draw(ctx, drawX, drawY, !this.facingRight, scale);
        
        ctx.restore();
    }

    update(input, deltaTime, effects) {
        this.prevX = this.x;
        this.prevY = this.y;

        if (this.isDying) {
            this.deathTimer += deltaTime;
            this.vx = 0;
            this.x += Math.sin(this.deathTimer * 6) * 20 * deltaTime;
            this.y += this.vy * deltaTime;
            this.vy -= 40 * deltaTime;
            if (this.currentSprite) this.currentSprite.update(deltaTime);

            if (this.deathTimer >= this.deathDuration && !this.deathFinished) {
                this.deathFinished = true;
                this.game.endRun();
            }
            return;
        }

        const wasGrounded = this.grounded;
        
        if (this.dropDownTimer > 0) {
            this.dropDownTimer -= deltaTime;
        }

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= deltaTime;
        }

        // Handle Attacks
        if (input.keys.attack && !this.isAttacking && this.form !== 'normal' && this.sprites[this.form]?.attack) {
            this.isAttacking = true;
            this.attackTimer = this.sprites[this.form].attack.frameCount * this.sprites[this.form].attack.frameDuration;
            this.sprites[this.form].attack.currentFrame = 0;
            this.sprites[this.form].attack.frameTimer = 0;
        }

        // --- ACCELERATION & DECELERATION (FIXED FOR BOTH DIRECTIONS) ---
        if (input.keys.right) {
            this.vx += this.acceleration * deltaTime;
            this.facingRight = true;
        } else if (input.keys.left) {
            this.vx -= this.acceleration * deltaTime;
            this.facingRight = false;
        } else {
            // Apply friction cleanly in both directions
            if (this.vx > 0) {
                this.vx -= this.friction * deltaTime;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += this.friction * deltaTime;
                if (this.vx > 0) this.vx = 0; // Fixed: stopped zeroing out immediately
            }
        }
        
        // Clamp maximum speed symmetrically
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        let solids = [];
        if (input.platforms) solids = solids.concat(input.platforms);
        if (input.boxes) solids = solids.concat(input.boxes);

        // --- STEP 1: HORIZONTAL MOVEMENT & RESOLUTION ---
        this.x += this.vx * deltaTime;
        this.wallSliding = false;

        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
            if (this.canWallJump && !wasGrounded && input.keys.left && this.vy > 0) {
                this.wallSliding = true;
                this.facingRight = false; 
            }
        }

        for (let solid of solids) {
            if (solid.oneWay) continue;

            const solidH = solid.height || 24;
            if (this.x < solid.x + solid.width && 
                this.x + this.width > solid.x &&
                this.y < solid.y + solidH && 
                this.y + this.height > solid.y) {
                    
                if (this.vx > 0) {
                    this.x = solid.x - this.width;
                    this.vx = 0;
                    if (this.canWallJump && !wasGrounded && input.keys.right && this.vy > 0) {
                        this.wallSliding = true;
                        this.facingRight = true;
                    }
                } else if (this.vx < 0) {
                    this.x = solid.x + solid.width;
                    this.vx = 0;
                    if (this.canWallJump && !wasGrounded && input.keys.left && this.vy > 0) {
                        this.wallSliding = true;
                        this.facingRight = false;
                    }
                }
            }
        }

        // --- STEP 2: VERTICAL MOVEMENT & RESOLUTION ---
        let effectiveGravity = this.gravity;
        if (this.trampolineBoostTimer > 0) {
            this.trampolineBoostTimer -= deltaTime;
            if (this.trampolineBoostTimer < 0) this.trampolineBoostTimer = 0;
        }

        if (this.trampolineBoostOriginY !== null && this.y <= this.trampolineBoostOriginY - this.maxTrampolineHeight) {
            this.vy = 0;
            this.trampolineBoostOriginY = null;
            this.trampolineBoostTimer = 0;
        }

        this.vy += effectiveGravity * deltaTime;

        if (this.wallSliding && this.vy > this.wallSlideSpeed) {
            this.vy = this.wallSlideSpeed;
        }

        this.y += this.vy * deltaTime;

        // Re-evaluate ground state for current frame
        this.grounded = false; 

        const groundLevel = this.gameHeight - 40; 
        const currentLevelData = this.game?.currentLevelIndex !== undefined && window.Levels ? window.Levels[this.game.currentLevelIndex] : null;
        let overGap = false;
        if (currentLevelData && currentLevelData.gaps) {
            const playerCenterX = this.x + this.width / 2;
            overGap = currentLevelData.gaps.some(gap => playerCenterX > gap.x && playerCenterX < gap.x + gap.width);
        }

        if (!overGap && this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height;
            this.vy = 0;
            this.grounded = true;
        }

        if (this.y > this.gameHeight + 30) {
            this.takeDamage();
            if (!this.isDying) {
                this.x = Math.max(50, this.x - 250);
                this.y = groundLevel - this.height - 40;
                this.vy = -100;
            } else {
                this.x = Math.max(50, this.x - 100);
                this.y = groundLevel - this.height - 60;
                this.vy = -180;
                return;
            }
        }

        // Vertical Collision Pass
        for (let solid of solids) {
            const solidH = solid.height || 24;
            if (this.x < solid.x + solid.width && 
                this.x + this.width > solid.x &&
                this.y < solid.y + solidH && 
                this.y + this.height > solid.y) {

                if (solid.oneWay) {
                    const prevBottom = this.prevY + this.height;
                    const solidTop = solid.y;

                    if (this.dropDownTimer > 0 || this.vy <= 0 || prevBottom > solidTop + 4) {
                        continue;
                    }
                }
                
                if (this.vy > 0) {
                    this.y = solid.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                } else if (this.vy < 0) {
                    this.y = solid.y + solidH;
                    this.vy = 0;
                    if (solid.isBox && solid.state === 'idle') {
                        solid.state = 'breaking';
                    }
                }
            }
        }

        // --- STEP 3: COYOTE TIME & JUMP RESOLUTION ---
        if (this.grounded) {
            this.coyoteCounter = this.coyoteTime;
            this.jumpCount = 0;
        } else {
            this.coyoteCounter -= deltaTime;
        }

        // Jump Handling
        if (input.jumpBufferCounter > 0) {
            const onOneWayPlatform = solids.some(solid => 
                solid.oneWay &&
                this.x < solid.x + solid.width &&
                this.x + this.width > solid.x &&
                Math.abs((this.y + this.height) - solid.y) <= 4
            );

            if (input.keys.down && onOneWayPlatform) {
                input.jumpBufferCounter = 0;
                this.dropDownTimer = 0.25;
                this.y += 4;
                this.vy = 100;
                this.grounded = false;
            } else if (this.coyoteCounter > 0 || this.grounded || this.jumpCount < this.maxJumps) {
                this.vy = this.jumpStrength;
                
                if (this.coyoteCounter <= 0 && !this.grounded) {
                    this.jumpCount++;
                } else {
                    this.jumpCount = 1;
                }

                audioManager.play('jump');
                
                if (this.jumpCount > 1 && this.sprites[this.form]?.djump) {
                    this.sprites[this.form].djump.currentFrame = 0; 
                }

                input.jumpBufferCounter = 0; 
                this.coyoteCounter = 0; 
                this.grounded = false;
            } else if (this.wallSliding) {
                this.vy = this.jumpStrength;
                this.vx = this.facingRight ? -this.maxSpeed : this.maxSpeed;
                input.jumpBufferCounter = 0; 
                this.wallSliding = false;
            }
        }

        if (!input.keys.up && this.vy < 0) {
            this.vy *= this.jumpCutMultiplier;
        }

        // --- STEP 4: SPRITES & PARTICLES ---
        let activeSprites = this.sprites[this.form] || this.sprites.normal;
        
        if (this.isAttacking && activeSprites.attack) {
            this.attackTimer -= deltaTime;
            this.currentSprite = activeSprites.attack;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackHitRegistered = false;
            }
        } else if (this.invulnerableTimer > 0 && this.invulnerableTimer > this.invulnerableDuration - 0.3 && activeSprites.hit) {
            this.currentSprite = activeSprites.hit;
        } else {
            if (!this.grounded) {
                if (this.wallSliding && activeSprites.wjump) {
                    this.currentSprite = activeSprites.wjump;
                } else if (this.jumpCount > 1 && activeSprites.djump) {
                    this.currentSprite = activeSprites.djump;
                } else if (this.vy < 0 && activeSprites.jump) {
                    this.currentSprite = activeSprites.jump;
                } else if (activeSprites.fall) {
                    this.currentSprite = activeSprites.fall;
                }
            } else {
                if (Math.abs(this.vx) > 10 && activeSprites.run) {
                    this.currentSprite = activeSprites.run;
                } else if (activeSprites.idle) {
                    this.currentSprite = activeSprites.idle;
                }
            }
        }
        
        if (this.grounded && !wasGrounded && effects) {
            for (let i = 0; i < 3; i++) {
                effects.addEffect(this.x + this.width / 2, this.y + this.height, 'dust');
            }
        }

        if (this.grounded && Math.abs(this.vx) > 50 && effects) {
            if (!this.dustTimer) this.dustTimer = 0;
            this.dustTimer -= deltaTime;
            if (this.dustTimer <= 0) {
                effects.addEffect(this.x + this.width / 2, this.y + this.height, 'dust');
                this.dustTimer = 0.15;
            }
        }

        if (this.currentSprite) {
            this.currentSprite.update(deltaTime);
        }
    }
}
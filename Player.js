import Sprite from './Sprite.js';

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
        this.acceleration = 400; // Decreased to show acceleration clearly
        this.friction = 300;     // Decreased to show deceleration (sliding) clearly
        this.gravity = 1200;
        this.jumpStrength = this.baseJumpStrength;
        this.trampolineBoostTimer = 0;
        
        this.health = this.baseMaxHealth;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 1.5;

        this.x = 50; // Start at left
        this.y = this.gameHeight - this.height - 40;
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
                hit: new Sprite(`${basePath}/Hit (32x32).png`, 32, 32, 7, 0.05)
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
                attack: new Sprite('/Assets/Free/Bosses_Dino_Tri/Dino Tri/dino_tri_attack_A.png', 384, 128, 21, 0.05) // Capped at 21 frames (8064 pixels) to prevent 8192 browser texture limit cut off
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
        // Load shadow image
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
                this.height = 24; // Trimmed top transparent pixels for 32x32 frog
            } else if (formName === 'rex') {
                this.width = 40;
                this.height = 48; // Trimmed top transparent pixels for 64x64 rex
            } else if (formName === 'tri') {
                this.width = 80;
                this.height = 36; // Very flat dinosaur
            } else if (formName === 'pengu') {
                this.width = 40;
                this.height = 50;
            } else {
                this.width = 32;
                this.height = 32;
            }
            this.y -= (this.height - oldHeight); // Adjust y position so we don't clip into ground
            this.isAttacking = false; // Reset attack state upon transformation to prevent missing sprite crashes
        }
    }

    revertForm() {
        if (this.form !== 'normal') {
            this.transform('normal');
            this.isInvulnerable = true;
            this.invulnerableTimer = this.invulnerableDuration; // Actually use duration instead of 0
            this.vy = -300; // Knockback
        }
    }

    takeDamage() {
        if (this.isInvulnerable) return;
        
        if (this.form !== 'normal') {
            this.revertForm();
            return;
        }

        this.health--;
        this.isInvulnerable = true;
        this.invulnerableTimer = this.invulnerableDuration;
        this.vy = -300; // Add knockback for normal form too
        this.game.updateHUD(this.health);

        if (this.health <= 0) {
            this.game.endRun();
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
        
        this.width = 24;
        this.height = 24;
        this.x = 50;
        this.y = this.gameHeight - this.height - 40;
        this.vx = 0;
        this.vy = 0;
        this.jumpCount = 0;
    }

    draw(ctx, cameraX) {
        if (!this.currentSprite) return;
        
        if (this.invulnerableTimer > 0) {
            if (Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
                return;
            }
        }
        
        // Draw Shadow
        if (Player.shadowImage && Player.shadowImage.complete) {
            ctx.drawImage(Player.shadowImage, this.x + this.width / 2 - 16 - cameraX, this.y + this.height - 4, 32, 8);
        }

        ctx.save();
        
        let scale = this.form === 'normal' ? 1.0 : 0.5; // Bosses scaled down, main characters 1.0
        let renderWidth = this.currentSprite.frameWidth * scale;
        let renderHeight = this.currentSprite.frameHeight * scale;

        let drawX = Math.floor((this.x - cameraX) + (this.width / 2) - (renderWidth / 2));
        let drawY = Math.floor(this.y + this.height - renderHeight);

        this.currentSprite.draw(ctx, drawX, drawY, !this.facingRight, scale);
        
        ctx.restore();
    }

    update(input, deltaTime, effects) {
        let wasGrounded = this.grounded;
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
            }
        }

        // --- Horizontal Movement & Collision ---
        if (input.keys.attack && !this.isAttacking && this.form !== 'normal') {
            this.isAttacking = true;
            this.attackTimer = this.sprites[this.form].attack.frameCount * this.sprites[this.form].attack.frameDuration;
            this.sprites[this.form].attack.currentFrame = 0;
            this.sprites[this.form].attack.frameTimer = 0;
        }

        if (input.keys.right) {
            this.vx += this.acceleration * deltaTime;
            this.facingRight = true;
        } else if (input.keys.left) {
            this.vx -= this.acceleration * deltaTime;
            this.facingRight = false;
        } else {
            if (this.vx > 0) {
                this.vx -= this.friction * deltaTime;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += this.friction * deltaTime;
                if (this.vx > 0) this.vx = 0;
            }
        }
        
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        this.x += this.vx * deltaTime;

        this.wallSliding = false;

        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
            if (this.canWallJump && !this.grounded && input.keys.left) {
                this.wallSliding = true;
                this.facingRight = false; 
            }
        }
        
        // Collect solid objects
        let solids = [];
        if (input.platforms) solids = solids.concat(input.platforms);
        if (input.boxes) solids = solids.concat(input.boxes);

        // Horizontal Collision
        for (let solid of solids) {
            // If bounding boxes overlap (adding a small vertical threshold to prevent floor snags)
            if (this.x < solid.x + solid.width && this.x + this.width > solid.x &&
                this.y < solid.y + (solid.height || 24) && this.y + this.height > solid.y + 4) {
                    
                    // Moving right
                    if (this.vx > 0) {
                        this.x = solid.x - this.width;
                        this.vx = 0;
                        if (this.canWallJump && !this.grounded && input.keys.right) {
                            this.wallSliding = true;
                            this.facingRight = true;
                        }
                    }
                    // Moving left
                    else if (this.vx < 0) {
                        this.x = solid.x + solid.width;
                        this.vx = 0;
                        if (this.canWallJump && !this.grounded && input.keys.left) {
                            this.wallSliding = true;
                            this.facingRight = false;
                        }
                    }
                }
        }

        // --- Vertical Movement & Physics ---
        let effectiveGravity = this.gravity;
        if (this.trampolineBoostTimer > 0) {
            effectiveGravity *= 0.65;
            this.trampolineBoostTimer -= deltaTime;
            if (this.trampolineBoostTimer < 0) this.trampolineBoostTimer = 0;
        }

        this.vy += effectiveGravity * deltaTime;

        if (this.wallSliding) {
            if (this.vy > this.wallSlideSpeed) {
                this.vy = this.wallSlideSpeed;
            }
        }

        // Coyote Time Logic
        if (this.grounded) {
            this.coyoteCounter = this.coyoteTime;
            this.jumpCount = 0;
        } else {
            this.coyoteCounter -= deltaTime;
        }

        // Jump (Consumes Input Buffer)
        if (input.jumpBufferCounter > 0) {
            if (this.wallSliding) {
                // Wall Jump
                this.vy = this.jumpStrength;
                this.vx = this.facingRight ? -this.maxSpeed : this.maxSpeed;
                input.jumpBufferCounter = 0; 
                this.wallSliding = false;
            } else if (this.coyoteCounter > 0 || this.jumpCount < this.maxJumps) {
                this.vy = this.jumpStrength;
                this.jumpCount++;
                
                if (this.coyoteCounter <= 0 && this.jumpCount > 1) {
                    this.sprites[this.form].djump.currentFrame = 0; 
                }

                input.jumpBufferCounter = 0; 
                this.coyoteCounter = 0; 
                this.grounded = false;
            }
        }

        // Variable Jump Height
        if (!input.keys.up && this.vy < 0) {
            this.vy *= this.jumpCutMultiplier;
        }

        this.y += this.vy * deltaTime;

        // Ground bounds
        const groundLevel = this.gameHeight - 40; 
        this.grounded = false; 

        if (this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height;
            this.vy = 0;
            this.grounded = true;

        }

        // Vertical Collision (Platforms and Boxes)
        for (let solid of solids) {
            if (this.x < solid.x + solid.width && this.x + this.width > solid.x &&
                this.y < solid.y + (solid.height || 24) && this.y + this.height > solid.y) {
                
                // Moving down (falling onto platform)
                if (this.vy > 0) {
                    this.y = solid.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                }
                // Moving up (hitting head on platform/box)
                else if (this.vy < 0) {
                    this.y = solid.y + (solid.height || 24);
                    this.vy = 0;
                    if (solid.isBox && solid.state === 'idle') {
                        solid.state = 'breaking';
                    }
                }
            }
        }

        // Sprite Animation Logic
        let activeSprites = this.sprites[this.form];
        
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            this.currentSprite = activeSprites.attack;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        } else if (this.invulnerableTimer > 0 && this.invulnerableTimer > this.invulnerableDuration - 0.3 && this.form === 'normal') {
             this.currentSprite = activeSprites.hit;
        } else {
            // Animation State
            if (!this.grounded) {
                if (this.wallSliding) {
                    this.currentSprite = activeSprites.wjump;
                } else if (this.jumpCount > 1) {
                    this.currentSprite = activeSprites.djump;
                } else if (this.vy < 0) {
                    this.currentSprite = activeSprites.jump;
                } else {
                    this.currentSprite = activeSprites.fall;
                }
            } else {
                if (Math.abs(this.vx) > 10) {
                    this.currentSprite = activeSprites.run;
                } else {
                    this.currentSprite = activeSprites.idle;
                }
            }
        }
        
        if (this.grounded && !wasGrounded && effects) {
            for (let i=0; i<3; i++) {
                effects.addEffect(this.x + this.width / 2, this.y + this.height, 'dust');
            }
        }

        // Running dust
        if (this.grounded && Math.abs(this.vx) > 50 && effects) {
            if (!this.dustTimer) this.dustTimer = 0;
            this.dustTimer -= deltaTime;
            if (this.dustTimer <= 0) {
                effects.addEffect(this.x + this.width / 2, this.y + this.height, 'dust');
                this.dustTimer = 0.15;
            }
        }

        this.currentSprite.update(deltaTime);
    }
}

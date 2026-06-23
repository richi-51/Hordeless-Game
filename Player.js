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
            idle: new Sprite(`${basePath}/Idle (32x32).png`, 32, 32, 11, 0.05),
            run: new Sprite(`${basePath}/Run (32x32).png`, 32, 32, 12, 0.05),
            jump: new Sprite(`${basePath}/Jump (32x32).png`, 32, 32, 1, 0.1),
            djump: new Sprite(`${basePath}/Double Jump (32x32).png`, 32, 32, 6, 0.05),
            wjump: new Sprite(`${basePath}/Wall Jump (32x32).png`, 32, 32, 5, 0.05),
            fall: new Sprite(`${basePath}/Fall (32x32).png`, 32, 32, 1, 0.1),
            hit: new Sprite(`${basePath}/Hit (32x32).png`, 32, 32, 7, 0.05)
        };
        this.currentSprite = this.sprites.idle;
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
        
        this.x = 50;
        this.y = this.gameHeight - this.height - 40;
        this.vx = 0;
        this.vy = 0;
        this.jumpCount = 0;
    }

    takeDamage() {
        if (this.invulnerableTimer <= 0) {
            this.health--;
            this.game.updateHUD(this.health);
            this.invulnerableTimer = this.invulnerableDuration;
            
            // Knockback
            this.vy = -300; 
            
            if (this.health <= 0) {
                this.game.endRun();
            }
        }
    }

    draw(ctx, cameraX) {
        if (this.invulnerableTimer > 0) {
            if (Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
                return;
            }
        }
        
        this.currentSprite.draw(ctx, this.x - cameraX, this.y, !this.facingRight);
    }

    update(input, deltaTime) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= deltaTime;
        }

        // --- Horizontal Movement ---
        if (input.keys.right) {
            this.vx += this.acceleration * deltaTime;
            this.facingRight = true;
        } else if (input.keys.left) {
            this.vx -= this.acceleration * deltaTime;
            this.facingRight = false;
        } else {
            // Deceleration (Friction)
            if (this.vx > 0) {
                this.vx -= this.friction * deltaTime;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += this.friction * deltaTime;
                if (this.vx > 0) this.vx = 0;
            }
        }
        
        // Cap horizontal speed
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        this.x += this.vx * deltaTime;

        // Wall Sliding Detection
        this.wallSliding = false;

        // Block against left map edge as a makeshift wall for wall jump testing
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
            if (this.canWallJump && !this.grounded && input.keys.left) {
                this.wallSliding = true;
                this.facingRight = false; 
            }
        }
        
        // Check collision against platforms as solid blocks to allow Wall Jump
        if (input.platforms) {
            for (let plat of input.platforms) {
                if (this.y + this.height > plat.y && this.y < plat.y + plat.height) {
                    // Hitting right side of platform
                    if (this.vx < 0 && this.x < plat.x + plat.width && this.x + this.width > plat.x + plat.width) {
                        this.x = plat.x + plat.width;
                        this.vx = 0;
                        if (this.canWallJump && !this.grounded && input.keys.left) {
                            this.wallSliding = true;
                            this.facingRight = false;
                        }
                    }
                    // Hitting left side of platform
                    if (this.vx > 0 && this.x + this.width > plat.x && this.x < plat.x) {
                        this.x = plat.x - this.width;
                        this.vx = 0;
                        if (this.canWallJump && !this.grounded && input.keys.right) {
                            this.wallSliding = true;
                            this.facingRight = true;
                        }
                    }
                }
            }
        }

        // --- Vertical Movement & Physics ---
        this.vy += this.gravity * deltaTime;

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
                    this.sprites.djump.currentFrame = 0; // reset double jump animation
                }

                input.jumpBufferCounter = 0; 
                this.coyoteCounter = 0; 
                this.grounded = false;
            }
        }

        // Variable Jump Height (cut jump short if key released)
        if (!input.keys.up && this.vy < 0) {
            this.vy *= this.jumpCutMultiplier;
        }

        this.y += this.vy * deltaTime;

        // Simple Ground Detection (Platform at bottom)
        const groundLevel = this.gameHeight - 40; 
        this.grounded = false; 

        if (this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height;
            this.vy = 0;
            this.grounded = true;
        }

        // Floating Platforms Collision (only from above)
        if (input.platforms && this.vy >= 0) { 
            for (let plat of input.platforms) {
                let prevBottom = (this.y - this.vy * deltaTime) + this.height;
                let currentBottom = this.y + this.height;

                if (prevBottom <= plat.y && currentBottom >= plat.y) {
                    if (this.x + this.width > plat.x && this.x < plat.x + plat.width) {
                        this.y = plat.y - this.height;
                        this.vy = 0;
                        this.grounded = true;
                    }
                }
            }
        }

        // Sprite Animation Logic
        if (this.invulnerableTimer > 0 && this.invulnerableTimer > this.invulnerableDuration - 0.3) {
             this.currentSprite = this.sprites.hit;
        } else if (this.wallSliding) {
             this.currentSprite = this.sprites.wjump;
        } else if (!this.grounded) {
            if (this.vy < 0) {
                if (this.jumpCount > 1) {
                    this.currentSprite = this.sprites.djump;
                } else {
                    this.currentSprite = this.sprites.jump;
                }
            } else {
                this.currentSprite = this.sprites.fall;
            }
        } else if (Math.abs(this.vx) > 0.1) {
            this.currentSprite = this.sprites.run;
        } else {
            this.currentSprite = this.sprites.idle;
        }

        this.currentSprite.update(deltaTime);
    }
}

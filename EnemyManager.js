import Sprite from './Sprite.js';
import { audioManager } from './AudioManager.js';

export default class EnemyManager {
    constructor(gameWidth, gameHeight, game) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.game = game; 
        this.enemies = [];
        this.gaps = [];
        
        const basePath = '/Assets/Free/Main Characters';
        this.enemyTypes = [
            { name: 'Mask Dude', spritePath: `${basePath}/Mask Dude/Run (32x32).png`, frameWidth: 32, frameHeight: 32, frames: 12, speed: 100, type: 'walker' },
            { name: 'Pink Man', spritePath: `${basePath}/Pink Man/Run (32x32).png`, frameWidth: 32, frameHeight: 32, frames: 12, speed: 180, type: 'runner' },
            { name: 'Ninja Frog', spritePath: `${basePath}/Ninja Frog/Idle (32x32).png`, frameWidth: 32, frameHeight: 32, frames: 11, speed: 80, type: 'jumper' }
        ];

        this.sightRange = gameWidth * (2 / 3);
        this.chaseYTolerance = 24; 
        this.chaseGraceTime = 0.25; 

        this.shadowImage = new Image();
        this.shadowImage.src = '/Assets/Free/Other/Shadow.png';
    }

    update(deltaTime, player, platforms, effects) {
        const groundLevel = this.gameHeight - 40;
        const activeDistance = 1000;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            // Skip processing enemies far off-screen
            if (Math.abs(enemy.x - player.x) > activeDistance) continue;

            // Update sprite animation frame
            if (enemy.sprite) {
                enemy.sprite.update(deltaTime);
            }

            if (!enemy.state) {
                enemy.state = 'patrol';
            }

            // Decrement wall cooldown timer
            if (enemy.wallStuckTimer > 0) {
                enemy.wallStuckTimer -= deltaTime;
            }

            // Player detection logic
            const playerCenterX = player.x + player.width / 2;
            const enemyCenterX = enemy.x + enemy.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            const horizontalDistance = Math.abs(playerCenterX - enemyCenterX);
            const verticalDistance = Math.abs(playerCenterY - enemyCenterY);
            const sameYLevel = verticalDistance <= this.chaseYTolerance;
            const inSight = horizontalDistance <= this.sightRange;
            const facingPlayer = (playerCenterX < enemyCenterX && enemy.vx <= 0) || (playerCenterX > enemyCenterX && enemy.vx >= 0);
            const playerVisible = inSight && sameYLevel && (facingPlayer || horizontalDistance <= this.sightRange * 0.45 || player.vy < -80);
            
            // Initiate Chase (Blocked if recently collided with a wall)
            const canChase = (enemy.wallStuckTimer <= 0 || enemy.wallStuckTimer === undefined);
            if (canChase && playerVisible) {
                enemy.state = 'chase';
            }

            // Handle States & Movement Speeds
            if (enemy.state === 'chase') {
                if (!playerVisible && horizontalDistance > this.sightRange * 1.1) {
                    enemy.state = 'patrol';
                    enemy.spawnX = enemy.x; 
                } else {
                    const chaseSpeed = enemy.baseSpeed * 1.15;
                    enemy.vx = playerCenterX < enemyCenterX ? -chaseSpeed : chaseSpeed;
                }
            } else if (enemy.state === 'return') {
                const offsetFromSpawn = enemy.x - enemy.spawnX;
                if (Math.abs(offsetFromSpawn) <= 10) {
                    enemy.state = 'patrol';
                } else {
                    enemy.vx = offsetFromSpawn > 0 ? -enemy.baseSpeed : enemy.baseSpeed;
                }
            }

            if (enemy.state === 'patrol') {
                if (enemy.x < enemy.spawnX - 150) enemy.vx = Math.abs(enemy.baseSpeed);
                if (enemy.x > enemy.spawnX + 150) enemy.vx = -Math.abs(enemy.baseSpeed);
                if (!enemy.vx) enemy.vx = -enemy.baseSpeed;
            }
            
            // 1. Horizontal Movement
            enemy.x += enemy.vx * deltaTime;

            // 2. Wall / Terrain Collisions
            if (platforms) {
                for (let plat of platforms) {
                    if (!plat.isTerrain) continue;

                    const horizOverlap = enemy.x < plat.x + plat.width && enemy.x + enemy.width > plat.x;
                    const vertOverlap = enemy.y + enemy.height > plat.y + 4 && enemy.y < plat.y + (plat.height || 40);

                    if (horizOverlap && vertOverlap) {
                        // Bounce off wall
                        if (enemy.vx > 0) {
                            enemy.x = plat.x - enemy.width - 1;
                            enemy.vx = -Math.abs(enemy.baseSpeed);
                        } else if (enemy.vx < 0) {
                            enemy.x = plat.x + plat.width + 1;
                            enemy.vx = Math.abs(enemy.baseSpeed);
                        }

                         // Set new home base on current side of wall & start cooldown
                        enemy.spawnX = enemy.x;
                        enemy.state = 'patrol';
                        enemy.wallStuckTimer = 1.5; 
                        break;
                    }
                }
            }

            // 3. Gravity & Vertical Movement
            enemy.vy += 1200 * deltaTime; 
            enemy.y += enemy.vy * deltaTime;

            let grounded = false;
            const enemyCenterXPos = enemy.x + enemy.width / 2;
            const overEnemyGap = this.gaps.some(gap => enemyCenterXPos > gap.x && enemyCenterXPos < gap.x + gap.width);

            if (!overEnemyGap && enemy.y + enemy.height >= groundLevel) {
                enemy.y = groundLevel - enemy.height;
                enemy.vy = 0;
                grounded = true;
            }

            if (platforms && enemy.vy >= 0) {
                for (let plat of platforms) {
                    const prevBottom = (enemy.y - enemy.vy * deltaTime) + enemy.height;
                    const currentBottom = enemy.y + enemy.height;
                    const verticalOverlap = prevBottom <= plat.y + 8 && currentBottom >= plat.y - 2;
                    const horizontalOverlap = enemy.x + enemy.width > plat.x && enemy.x < plat.x + plat.width;

                    if (verticalOverlap && horizontalOverlap) {
                        enemy.y = plat.y - enemy.height;
                        enemy.vy = 0;
                        grounded = true;
                        break;
                    }
                }
            }

            enemy.grounded = grounded;

            // Fell into pit
            if (enemy.y > this.gameHeight + 100) {
                this.enemies.splice(i, 1);
                continue;
            }

            // Jumper behavior
            if (enemy.behaviorType === 'jumper' && grounded) {
                if (Math.random() < 0.02) {
                    enemy.vy = -450 - Math.random() * 200; 
                }
            }

            // Edge / Gap Detection (turn around before falling off ledges when patrolling)
            if (enemy.grounded && enemy.state === 'patrol') {
                const lookAhead = enemy.vx > 0 ? enemy.x + enemy.width + 8 : enemy.x - 8;
                const nearGapEdge = this.gaps.some(gap => lookAhead > gap.x && lookAhead < gap.x + gap.width);
                if (nearGapEdge) {
                    enemy.vx *= -1;
                    enemy.spawnX = enemy.x;
                }
            }

            // Attack Hitbox Detection
            let attackHitbox = null;
            if (player.isAttacking) {
                attackHitbox = {
                    x: player.facingRight ? player.x : player.x - 60,
                    y: player.y,
                    width: player.width + 60,
                    height: player.height
                };
            }

            if (attackHitbox &&
                attackHitbox.x < enemy.x + enemy.width &&
                attackHitbox.x + attackHitbox.width > enemy.x &&
                attackHitbox.y < enemy.y + enemy.height &&
                attackHitbox.y + attackHitbox.height > enemy.y) {
                
                if (effects) effects.addEffect(enemy.x - 32, enemy.y - 32, 'disappear');
                this.enemies.splice(i, 1);
                this.game.score += 200; 
                audioManager.play('kill');
                continue;
            }
            
            // Stomp & Body Collision
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {
                
                const stompMargin = enemy.height * 0.75;
                const wasAbove = (player.prevY !== undefined ? player.prevY : player.y) + player.height <= enemy.y + stompMargin;

                if (player.vy > 0 && wasAbove) {
                    if (effects) effects.addEffect(enemy.x - 32, enemy.y - 32, 'disappear');
                    this.enemies.splice(i, 1);
                    this.game.score += 100; 
                    player.vy = -300; 
                    audioManager.play('kill');
                    continue; 
                } else {
                    if (player.takeDamage) player.takeDamage();
                }
            }
        }
    }

    draw(ctx, cameraX) {
        for (let enemy of this.enemies) {
            if (this.shadowImage && this.shadowImage.complete) {
                ctx.drawImage(this.shadowImage, enemy.x - cameraX + 8, enemy.y + enemy.height - 4, 16, 8);
            }
            
            if (enemy.sprite) {
                enemy.sprite.draw(ctx, enemy.x - cameraX, enemy.y, enemy.vx < 0);
            }
        }
    }

    reset(enemyData, effects, levelGaps = [], terrainData = []) {
        this.enemies = [];
        this.gaps = Array.isArray(levelGaps) ? levelGaps : [];
        if (!enemyData) return;
        
        const groundLevel = this.gameHeight - 40;

        for (let e of enemyData) {
            let typeDef = this.enemyTypes[e.type] || this.enemyTypes[0];
            let spawnX = e.x;

            for (let gap of this.gaps) {
                if (spawnX + 16 > gap.x && spawnX < gap.x + gap.width) {
                    const distToLeft = Math.abs(spawnX - gap.x);
                    const distToRight = Math.abs(spawnX - (gap.x + gap.width));
                    spawnX = distToLeft < distToRight ? gap.x - 40 : gap.x + gap.width + 8;
                }
            }

            let spawnY = groundLevel - 32;
            if (Array.isArray(terrainData)) {
                for (let t of terrainData) {
                    if (spawnX + 28 > t.x && spawnX + 4 < t.x + t.width) {
                        if (t.y < spawnY + 32) {
                            spawnY = t.y - 32;
                        }
                    }
                }
            }

            const enemySprite = new Sprite(typeDef.spritePath, typeDef.frameWidth, typeDef.frameHeight, typeDef.frames, 0.05);

            this.enemies.push({
                x: spawnX,
                y: spawnY,
                spawnX: spawnX,
                width: 32,
                height: 32,
                vx: -typeDef.speed,
                vy: 0,
                baseSpeed: typeDef.speed,
                behaviorType: typeDef.type,
                sprite: enemySprite,
                grounded: true,
                dead: false,
                state: 'patrol',
                wallStuckTimer: 0
            });
        }
    }
}
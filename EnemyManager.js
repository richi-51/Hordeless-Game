import Sprite from './Sprite.js';
import { audioManager } from './AudioManager.js';

export default class EnemyManager {
    constructor(gameWidth, gameHeight, game) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.game = game; 
        this.enemies = [];
        
        const basePath = '/Assets/Free/Main Characters';
        this.enemyTypes = [
            { name: 'Mask Dude', sprite: new Sprite(`${basePath}/Mask Dude/Run (32x32).png`, 32, 32, 12, 0.05), type: 'walker', speed: 100 },
            { name: 'Pink Man', sprite: new Sprite(`${basePath}/Pink Man/Run (32x32).png`, 32, 32, 12, 0.05), type: 'runner', speed: 180 },
            { name: 'Ninja Frog', sprite: new Sprite(`${basePath}/Ninja Frog/Idle (32x32).png`, 32, 32, 11, 0.05), type: 'jumper', speed: 80 }
        ];
        
        // Static enemy positions for the level
        this.initialSpawns = [
            { x: 500, type: 0 },
            { x: 800, type: 2 },
            { x: 1200, type: 1 },
            { x: 1500, type: 0 },
            { x: 1800, type: 2 },
            { x: 2200, type: 1 },
            { x: 2500, type: 0 },
        ];

        this.sightRange = gameWidth * (2 / 3);
        this.chaseYTolerance = 18; // tightened vertical tolerance to reduce false on-sight when player is above terrain
        this.chaseGraceTime = 0.25; // allow a short window before abandoning chase
        this.returnRange = 260;
    }

    update(deltaTime, player, platforms, effects) {
        for (let type of this.enemyTypes) {
            type.sprite.update(deltaTime);
        }

        const groundLevel = this.gameHeight - 40;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            // Only update enemies that are somewhat near the camera
            if (enemy.x > player.x + 800 || enemy.x < player.x - 800) continue;

            if (!enemy.state) {
                enemy.state = 'patrol';
            }

            const playerCenterX = player.x + player.width / 2;
            const enemyCenterX = enemy.x + enemy.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            const horizontalDistance = Math.abs(playerCenterX - enemyCenterX);
            const verticalDistance = Math.abs(playerCenterY - enemyCenterY);
            const sameYLevel = verticalDistance <= this.chaseYTolerance; // no extra allowance for jumping
            const inSight = horizontalDistance <= this.sightRange;
            const facingPlayer = (playerCenterX < enemyCenterX && enemy.vx <= 0) || (playerCenterX > enemyCenterX && enemy.vx >= 0);
            const playerVisible = inSight && sameYLevel && (facingPlayer || horizontalDistance <= this.sightRange * 0.45 || player.vy < -80);
            const shouldChase = !enemy.chaseLocked && playerVisible;

            if (shouldChase) {
                enemy.state = 'chase';
                enemy.chaseLocked = true;
                enemy.chaseSightLostTimer = this.chaseGraceTime;
                const chaseSpeed = enemy.type.speed * 1.15;
                enemy.vx = player.x < enemy.x ? -chaseSpeed : chaseSpeed;
            }

            if (enemy.state === 'chase') {
                const chaseSpeed = enemy.type.speed * 1.15;
                enemy.vx = player.x < enemy.x ? -chaseSpeed : chaseSpeed;

                // While chasing, avoid elevated terrain directly in front to prevent clipping
                const lookAheadDist = Math.max(32, Math.abs(enemy.vx) * deltaTime * 2);
                const eyeY = enemy.y + enemy.height / 2;
                const boxLeft = enemy.vx < 0 ? enemy.x - lookAheadDist : enemy.x + enemy.width;
                const boxRight = enemy.vx < 0 ? enemy.x : enemy.x + enemy.width + lookAheadDist;
                const groundThreshold = groundLevel - 8;

                let frontPlat = null;
                const terrainAhead = platforms?.some((plat) => {
                    if (!plat.isTerrain) return false;
                    if (plat.y >= groundThreshold) return false; // ignore main ground
                    const horizOverlap = boxRight > plat.x && boxLeft < plat.x + plat.width;
                    const vertOverlap = eyeY > plat.y - 2 && eyeY < plat.y + plat.height + 2;
                    if (horizOverlap && vertOverlap) frontPlat = plat;
                    return horizOverlap && vertOverlap;
                });

                if (terrainAhead && frontPlat) {
                    // Nudge enemy out of collision and abort chase so it doesn't clip
                    if (enemy.vx > 0) {
                        enemy.x = frontPlat.x - enemy.width - 1;
                    } else {
                        enemy.x = frontPlat.x + frontPlat.width + 1;
                    }
                    enemy.chaseLocked = false;
                    enemy.state = 'return';
                    enemy.vx = enemy.vx > 0 ? -enemy.type.speed : enemy.type.speed;
                    continue;
                }

                const stillVisible = horizontalDistance <= this.sightRange * 1.1 &&
                    verticalDistance <= this.chaseYTolerance &&
                    (playerCenterX < enemyCenterX ? enemy.vx <= 0 : enemy.vx >= 0 || horizontalDistance <= this.sightRange * 0.45);
                if (stillVisible) {
                    enemy.chaseSightLostTimer = this.chaseGraceTime;
                } else {
                    enemy.chaseSightLostTimer -= deltaTime;
                    if (enemy.chaseSightLostTimer <= 0) {
                        enemy.state = 'return';
                    }
                }
            }

            if (enemy.state === 'return') {
                const offsetFromSpawn = enemy.x - enemy.spawnX;
                if (Math.abs(offsetFromSpawn) <= 8) {
                    enemy.state = 'patrol';
                    enemy.chaseLocked = false;
                    enemy.vx = enemy.vx >= 0 ? -enemy.type.speed : enemy.type.speed;
                } else {
                    enemy.vx = offsetFromSpawn > 0 ? -enemy.type.speed : enemy.type.speed;
                }
            }

            if (enemy.state === 'patrol') {
                enemy.vx = enemy.vx || -enemy.type.speed;
            }
            
            enemy.x += enemy.vx * deltaTime;
            enemy.vy += 1200 * deltaTime; 
            enemy.y += enemy.vy * deltaTime;

            // Determine grounding for this frame, then write it back to enemy.grounded
            let grounded = false;
            if (enemy.y + enemy.height >= groundLevel) {
                enemy.y = groundLevel - enemy.height;
                enemy.vy = 0;
                grounded = true;
            }

            if (platforms && enemy.vy >= 0) {
                for (let plat of platforms) {
                    const prevBottom = (enemy.y - enemy.vy * deltaTime) + enemy.height;
                    const currentBottom = enemy.y + enemy.height;
                    // Allow a small epsilon to avoid tunnelling issues
                    const verticalOverlap = prevBottom <= plat.y + 2 && currentBottom >= plat.y - 2;
                    const horizontalOverlap = enemy.x + enemy.width > plat.x && enemy.x < plat.x + plat.width;

                    if (verticalOverlap && horizontalOverlap) {
                        enemy.y = plat.y - enemy.height;
                        enemy.vy = 0;
                        grounded = true;
                        break;
                    }
                }
            }

            // Keep enemy.grounded in sync so later logic uses up-to-date state
            enemy.grounded = grounded;

            if (enemy.type.type === 'jumper' && grounded) {
                if (Math.random() < 0.02) {
                    enemy.vy = -450 - Math.random() * 200; 
                }
            }
            
            // Reverse direction if hitting patrol boundary or terrain edge
            if (enemy.state === 'patrol') {
                if (enemy.x < enemy.spawnX - 200) enemy.vx = Math.abs(enemy.type.speed);
                if (enemy.x > enemy.spawnX + 200) enemy.vx = -Math.abs(enemy.type.speed);
            }

            // Detect terrain directly in front of the enemy within a small vision box.
            // Treat only elevated terrain (not the main ground) as obstacles.
            if (enemy.state !== 'chase' && enemy.grounded) {
                const lookAheadDist = 40; // how far ahead to check for obstacles
                const eyeY = enemy.y + enemy.height / 2;
                const lookLeft = enemy.vx < 0;
                const boxLeft = lookLeft ? enemy.x - lookAheadDist : enemy.x + enemy.width;
                const boxRight = lookLeft ? enemy.x : enemy.x + enemy.width + lookAheadDist;
                const groundThreshold = groundLevel - 8; // terrain at or below this is treated as ground

                const terrainAhead = platforms?.some((plat) => {
                    if (!plat.isTerrain) return false;
                    // ignore terrain that is essentially ground
                    if (plat.y >= groundThreshold) return false;
                    // horizontal overlap between look box and platform
                    const horizOverlap = boxRight > plat.x && boxLeft < plat.x + plat.width;
                    // vertical overlap with enemy eye/height
                    const vertOverlap = eyeY > plat.y - 2 && eyeY < plat.y + plat.height + 2;
                    return horizOverlap && vertOverlap;
                });

                if (terrainAhead) {
                    // Nudge back and flip direction to avoid clipping into the elevated terrain
                    enemy.vx *= -1;
                    if (enemy.vx > 0) enemy.x -= 2; else enemy.x += 2;
                }
            }

            if (enemy.state !== 'chase' && enemy.grounded) {
                // Compute the actual future X for this frame (enemy.x already updated above)
                const prevX = enemy.x - enemy.vx * deltaTime;
                const nextX = enemy.x;
                let collisionPlat = null;
                const wouldClipIntoTerrain = platforms?.some((plat) => {
                    if (!plat.isTerrain) return false;
                    const futureRight = nextX + enemy.width;
                    const futureLeft = nextX;
                    // Use a slightly tightened vertical range to detect edge clipping
                    const verticalTouch = enemy.y + enemy.height >= plat.y - 2 && enemy.y + enemy.height <= plat.y + 6;
                    const overlap = verticalTouch && futureRight > plat.x && futureLeft < plat.x + plat.width;
                    if (overlap) collisionPlat = plat;
                    return overlap;
                });

                if (wouldClipIntoTerrain) {
                    // Nudge enemy back outside the platform to avoid clipping
                    if (enemy.vx > 0) {
                        enemy.x = collisionPlat.x - enemy.width - 1;
                    } else {
                        enemy.x = collisionPlat.x + collisionPlat.width + 1;
                    }
                    enemy.vx *= -1;
                }
            }

            // Collision with player
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
                
                effects.addEffect(enemy.x - 32, enemy.y - 32, 'disappear');
                this.enemies.splice(i, 1);
                this.game.score += 200; 
                audioManager.play('kill');
                continue;
            }
            
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {
                
                const stompMargin = enemy.height / 2;
                if (player.vy > 0 && player.y + player.height < enemy.y + stompMargin) {
                    effects.addEffect(enemy.x - 32, enemy.y - 32, 'disappear');
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
        // Load shadow image
        if (!this.shadowImage) {
            this.shadowImage = new Image();
            this.shadowImage.src = '/Assets/Free/Other/Shadow.png';
        }
        for (let enemy of this.enemies) {
            if (this.shadowImage && this.shadowImage.complete) {
                ctx.drawImage(this.shadowImage, enemy.x - cameraX + 8, enemy.y + enemy.height - 4, 16, 8);
            }
            enemy.type.sprite.draw(ctx, enemy.x - cameraX, enemy.y, enemy.vx < 0);
        }
    }

    reset(enemyData, effects) {
        this.enemies = [];
        if (!enemyData) return;
        
        for (let e of enemyData) {
            let typeDef = this.enemyTypes[e.type];
            this.enemies.push({
                x: e.x,
                y: this.gameHeight - 40 - 32, // all on ground for now
                spawnX: e.x,
                width: 32,
                height: 32,
                vx: -typeDef.speed,
                vy: 0,
                type: typeDef,
                grounded: true,
                dead: false,
                state: 'patrol',
                chaseSightLostTimer: this.chaseGraceTime,
            });
        }
    }
}


import Sprite from './Sprite.js';

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
            { name: 'Ninja Frog', sprite: new Sprite(`${basePath}/Ninja Frog/Jump (32x32).png`, 32, 32, 1, 0.1), type: 'jumper', speed: 80 }
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
            
            enemy.x += enemy.vx * deltaTime;
            enemy.vy += 1200 * deltaTime; 
            enemy.y += enemy.vy * deltaTime;

            let grounded = false;
            if (enemy.y + enemy.height >= groundLevel) {
                enemy.y = groundLevel - enemy.height;
                enemy.vy = 0;
                grounded = true;
            }

            if (platforms && enemy.vy >= 0) {
                for (let plat of platforms) {
                    let prevBottom = (enemy.y - enemy.vy * deltaTime) + enemy.height;
                    let currentBottom = enemy.y + enemy.height;
                    if (prevBottom <= plat.y && currentBottom >= plat.y) {
                        if (enemy.x + enemy.width > plat.x && enemy.x < plat.x + plat.width) {
                            enemy.y = plat.y - enemy.height;
                            enemy.vy = 0;
                            grounded = true;
                        }
                    }
                }
            }

            if (enemy.typeData.type === 'jumper' && grounded) {
                if (Math.random() < 0.02) {
                    enemy.vy = -450 - Math.random() * 200; 
                }
            }
            
            // Reverse direction if hitting "walls" (just using arbitrary patrol zones for now)
            if (enemy.x < enemy.spawnX - 200) enemy.vx = Math.abs(enemy.vx);
            if (enemy.x > enemy.spawnX + 200) enemy.vx = -Math.abs(enemy.vx);

            // Collision with player
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {
                
                const stompMargin = enemy.height / 2;
                if (player.vy > 0 && player.y + player.height < enemy.y + stompMargin) {
                    effects.addEffect(enemy.x, enemy.y, 'disappear');
                    this.enemies.splice(i, 1);
                    this.game.score += 100; 
                    this.game.updateHUD(player.health);
                    player.vy = -300; 
                    continue; 
                } else {
                    if (player.takeDamage) player.takeDamage();
                }
            }
        }
    }

    draw(ctx, cameraX) {
        for (let enemy of this.enemies) {
            enemy.typeData.sprite.draw(ctx, enemy.x - cameraX, enemy.y, enemy.vx < 0);
        }
    }

    reset(effects) {
        this.enemies = [];
        const groundY = this.gameHeight - 40 - 32;
        
        for (let spawn of this.initialSpawns) {
            let typeData = this.enemyTypes[spawn.type];
            this.enemies.push({
                x: spawn.x,
                y: groundY,
                spawnX: spawn.x,
                width: 32,
                height: 32,
                vx: -typeData.speed,
                vy: 0,
                typeData: typeData
            });
            if (effects) {
                effects.addEffect(spawn.x, groundY, 'appear');
            }
        }
    }
}

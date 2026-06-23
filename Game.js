export default class Game {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // Game States
        this.states = {
            MENU: 0,
            UPGRADES: 1,
            PLAYING: 2,
            GAMEOVER: 3
        };
        this.currentState = this.states.MENU;

        // UI Elements
        this.ui = {
            menu: document.getElementById('main-menu'),
            upgrades: document.getElementById('upgrade-menu'),
            hud: document.getElementById('hud'),
            gameOver: document.getElementById('game-over'),
            
            // Stats
            menuSP: document.getElementById('menu-sp'),
            hudCoins: document.getElementById('hud-coins'),
            hudScore: document.getElementById('hud-score'),
            hudHealth: document.getElementById('hud-health'),
            goScore: document.getElementById('go-score'),
            goCoins: document.getElementById('go-coins'),
            
            // Upgrade Levels
            lvlSpeed: document.getElementById('lvl-speed'),
            lvlHealth: document.getElementById('lvl-health'),
            lvlDjump: document.getElementById('lvl-djump'),
            lvlWjump: document.getElementById('lvl-wjump'),
        };

        // Data Persistence for total coins (for score purposes now)
        this.totalCoins = parseInt(localStorage.getItem('hordeless_coins')) || 0;

        // Loadout State (Resets every run)
        this.maxSP = 100;
        this.currentSP = 100;
        this.loadout = {
            speed: 0,
            health: 0,
            djump: false,
            wjump: false
        };

        // Session Variables
        this.score = 0;
        this.survivalTime = 0;
        this.sessionCoins = 0;
        
        this.setupButtons();
        this.updateUI();
    }

    resetLoadout() {
        this.currentSP = this.maxSP;
        this.loadout = { speed: 0, health: 0, djump: false, wjump: false };
        this.updateUI();
    }

    setupButtons() {
        document.getElementById('btn-play').addEventListener('click', () => {
            // Play music if not playing
            const bgMusic = document.getElementById('bg-music');
            if (bgMusic && bgMusic.paused) {
                bgMusic.volume = 0.5;
                bgMusic.play().catch(e => console.log("Audio play blocked by browser", e));
            }
            this.resetLoadout();
            this.setState(this.states.UPGRADES);
        });

        // Add dummy alerts for new menu buttons
        ['btn-levels', 'btn-leaderboard', 'btn-achievements', 'btn-settings'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    alert(id.replace('btn-', '').toUpperCase() + " coming soon!");
                });
            }
        });

        document.getElementById('btn-start-run').addEventListener('click', () => {
            this.startRun();
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            this.setState(this.states.MENU);
        });

        // Loadout buttons
        const costs = { speed: 20, health: 30, djump: 20, wjump: 20 };
        
        // Double Jump
        document.getElementById('btn-upg-djump').addEventListener('click', () => {
            if (this.loadout.djump) {
                this.loadout.djump = false;
                this.currentSP += costs.djump;
            } else if (this.currentSP >= costs.djump) {
                this.loadout.djump = true;
                this.currentSP -= costs.djump;
            }
            this.updateUI();
        });

        // Wall Jump
        document.getElementById('btn-upg-wjump').addEventListener('click', () => {
            if (this.loadout.wjump) {
                this.loadout.wjump = false;
                this.currentSP += costs.wjump;
            } else if (this.currentSP >= costs.wjump) {
                this.loadout.wjump = true;
                this.currentSP -= costs.wjump;
            }
            this.updateUI();
        });

        // Speed
        document.getElementById('btn-upg-speed-add').addEventListener('click', () => {
            if (this.loadout.speed < 3 && this.currentSP >= costs.speed) {
                this.loadout.speed++;
                this.currentSP -= costs.speed;
                this.updateUI();
            }
        });
        document.getElementById('btn-upg-speed-sub').addEventListener('click', () => {
            if (this.loadout.speed > 0) {
                this.loadout.speed--;
                this.currentSP += costs.speed;
                this.updateUI();
            }
        });

        // Health
        document.getElementById('btn-upg-health-add').addEventListener('click', () => {
            if (this.loadout.health < 2 && this.currentSP >= costs.health) {
                this.loadout.health++;
                this.currentSP -= costs.health;
                this.updateUI();
            }
        });
        document.getElementById('btn-upg-health-sub').addEventListener('click', () => {
            if (this.loadout.health > 0) {
                this.loadout.health--;
                this.currentSP += costs.health;
                this.updateUI();
            }
        });
    }

    saveData() {
        localStorage.setItem('hordeless_coins', this.totalCoins);
    }

    updateUI() {
        if (!this.ui.menuSP) return;
        this.ui.menuSP.innerText = this.currentSP;
        this.ui.lvlSpeed.innerText = `Lv ${this.loadout.speed}`;
        this.ui.lvlHealth.innerText = `Lv ${this.loadout.health}`;
        this.ui.lvlDjump.innerText = this.loadout.djump ? "ON" : "OFF";
        this.ui.lvlDjump.style.color = this.loadout.djump ? "#4CAF50" : "white";
        this.ui.lvlWjump.innerText = this.loadout.wjump ? "ON" : "OFF";
        this.ui.lvlWjump.style.color = this.loadout.wjump ? "#4CAF50" : "white";
    }

    setState(newState) {
        this.currentState = newState;
        
        // Hide all screens
        this.ui.menu.classList.remove('active');
        this.ui.upgrades.classList.remove('active');
        this.ui.hud.classList.remove('active');
        this.ui.gameOver.classList.remove('active');

        // Show current screen
        switch (newState) {
            case this.states.MENU:
                this.ui.menu.classList.add('active');
                break;
            case this.states.UPGRADES:
                this.updateUI();
                this.ui.upgrades.classList.add('active');
                break;
            case this.states.PLAYING:
                this.ui.hud.classList.add('active');
                break;
            case this.states.GAMEOVER:
                this.ui.gameOver.classList.add('active');
                this.ui.goScore.innerText = Math.floor(this.score);
                this.ui.goCoins.innerText = this.sessionCoins;
                break;
        }
    }

    startRun() {
        this.score = 0;
        this.survivalTime = 0;
        this.sessionCoins = 0;
        
        // Setup Player Stats based on loadout
        if (this.onStartRun) {
            this.onStartRun(this.loadout);
        }

        this.updateHUD();
        this.setState(this.states.PLAYING);
    }

    endRun() {
        this.totalCoins += this.sessionCoins;
        this.saveData();
        this.setState(this.states.GAMEOVER);
    }

    addCoin() {
        this.sessionCoins++;
        this.score += 50; // Points for coin
        this.updateHUD();
    }

    updateScore(deltaTime) {
        this.survivalTime += deltaTime;
        this.score += deltaTime * 10; // 10 points per second
        this.updateHUD();
    }

    updateHUD(health = 0) {
        this.ui.hudScore.innerText = Math.floor(this.score);
        this.ui.hudCoins.innerText = this.sessionCoins;
        if (health !== 0) {
            this.ui.hudHealth.innerText = health;
        }
    }
}

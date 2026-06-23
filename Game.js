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
            menuCoins: document.getElementById('menu-coins'),
            hudCoins: document.getElementById('hud-coins'),
            hudScore: document.getElementById('hud-score'),
            hudHealth: document.getElementById('hud-health'),
            goScore: document.getElementById('go-score'),
            goCoins: document.getElementById('go-coins'),
            
            // Upgrade Levels
            lvlSpeed: document.getElementById('lvl-speed'),
            lvlJump: document.getElementById('lvl-jump'),
            lvlHealth: document.getElementById('lvl-health'),
        };

        // Data Persistence
        this.data = {
            coins: parseInt(localStorage.getItem('hordeless_coins')) || 0,
            upgrades: {
                speed: parseInt(localStorage.getItem('hordeless_upg_speed')) || 0,
                jump: parseInt(localStorage.getItem('hordeless_upg_jump')) || 0,
                health: parseInt(localStorage.getItem('hordeless_upg_health')) || 0
            }
        };

        // Session Variables
        this.score = 0;
        this.survivalTime = 0;
        this.sessionCoins = 0;
        
        this.setupButtons();
        this.updateUI();
    }

    setupButtons() {
        document.getElementById('btn-play').addEventListener('click', () => {
            this.setState(this.states.UPGRADES);
        });

        document.getElementById('btn-start-run').addEventListener('click', () => {
            this.startRun();
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            this.setState(this.states.MENU);
        });

        // Upgrades
        const upgradeCosts = { speed: 10, jump: 15, health: 20 };
        
        document.getElementById('btn-upg-speed').addEventListener('click', () => {
            if (this.data.coins >= upgradeCosts.speed) {
                this.data.coins -= upgradeCosts.speed;
                this.data.upgrades.speed++;
                this.saveData();
                this.updateUI();
            }
        });
        document.getElementById('btn-upg-jump').addEventListener('click', () => {
            if (this.data.coins >= upgradeCosts.jump) {
                this.data.coins -= upgradeCosts.jump;
                this.data.upgrades.jump++;
                this.saveData();
                this.updateUI();
            }
        });
        document.getElementById('btn-upg-health').addEventListener('click', () => {
            if (this.data.coins >= upgradeCosts.health) {
                this.data.coins -= upgradeCosts.health;
                this.data.upgrades.health++;
                this.saveData();
                this.updateUI();
            }
        });
    }

    saveData() {
        localStorage.setItem('hordeless_coins', this.data.coins);
        localStorage.setItem('hordeless_upg_speed', this.data.upgrades.speed);
        localStorage.setItem('hordeless_upg_jump', this.data.upgrades.jump);
        localStorage.setItem('hordeless_upg_health', this.data.upgrades.health);
    }

    updateUI() {
        this.ui.menuCoins.innerText = this.data.coins;
        this.ui.lvlSpeed.innerText = this.data.upgrades.speed;
        this.ui.lvlJump.innerText = this.data.upgrades.jump;
        this.ui.lvlHealth.innerText = this.data.upgrades.health;
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
        
        // Setup Player Stats based on upgrades
        if (this.onStartRun) {
            this.onStartRun(this.data.upgrades);
        }

        this.updateHUD();
        this.setState(this.states.PLAYING);
    }

    endRun() {
        this.data.coins += this.sessionCoins;
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

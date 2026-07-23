import { audioManager } from "./AudioManager.js";

export default class Game {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    // Game States
    this.states = {
      MENU: 0,
      UPGRADES: 1,
      PLAYING: 2,
      GAMEOVER: 3,
    };
    this.currentState = this.states.MENU;

    // UI Elements
    this.ui = {
      menu: document.getElementById("main-menu"),
      upgrades: document.getElementById("upgrade-menu"),
      hud: document.getElementById("hud"),
      gameOver: document.getElementById("game-over"),

      // Stats
      menuSP: document.getElementById("menu-sp"),
      hudCoins: document.getElementById("hud-coins"),
      hudScore: document.getElementById("hud-score"),
      hudHealth: document.getElementById("hud-health"),
      goScore: document.getElementById("go-score"),
      goCoins: document.getElementById("go-coins"),

      // Upgrade Levels
      lvlSpeed: document.getElementById("lvl-speed"),
      lvlHealth: document.getElementById("lvl-health"),
      lvlDjump: document.getElementById("lvl-djump"),
      lvlWjump: document.getElementById("lvl-wjump"),
      lvlRex: document.getElementById("lvl-rex"),
      lvlTri: document.getElementById("lvl-tri"),
      lvlPengu: document.getElementById("lvl-pengu"),
    };

    // Persistent skill point bank
    const storedSkillPoints = Number.parseInt(
      localStorage.getItem("hordeless_skill_points"),
      10,
    );
    const legacySkillPoints = Number.parseInt(
      localStorage.getItem("hordeless_coins"),
      10,
    );
    this.totalSkillPoints = Number.isNaN(storedSkillPoints)
      ? Number.isNaN(legacySkillPoints)
        ? 20
        : legacySkillPoints
      : storedSkillPoints;

    // Loadout State (Resets every run)
    this.currentSP = this.totalSkillPoints;
    this.loadout = {
      speed: 0,
      health: 0,
      djump: false,
      wjump: false,
      rex: false,
      tri: false,
      pengu: false,
    };

    // Session Variables
    this.score = 0;
    this.survivalTime = 0;
    this.sessionSkillPoints = 0;

    this.currentLevelIndex = 0;
    this.totalLevels = 3;
    const storedUnlockedLevel = Number.parseInt(
      localStorage.getItem("hordeless_unlocked_level"),
      10,
    );
    this.unlockedLevelIndex = Number.isNaN(storedUnlockedLevel)
      ? 0
      : Math.max(0, Math.min(this.totalLevels - 1, storedUnlockedLevel));
    this.audioSettings = {
      music: localStorage.getItem("hordeless_music") !== "false",
      sound: localStorage.getItem("hordeless_sound") !== "false",
    };
    audioManager.setMusicEnabled(this.audioSettings.music);
    audioManager.setSoundEnabled(this.audioSettings.sound);

    this.setupButtons();
    this.updateUI();
  }

  resetLoadout() {
    this.updateUI();
  }

  prepareLevel(levelIndex = 0) {
    if (levelIndex > this.unlockedLevelIndex) {
      return false;
    }

    this.currentLevelIndex = levelIndex;
    this.bankSessionSkillPoints();
    this.resetLoadout();
    this.setState(this.states.UPGRADES);
    return true;
  }

  bankSessionSkillPoints() {
    if (this.sessionSkillPoints <= 0) return;

    this.totalSkillPoints += this.sessionSkillPoints;
    this.sessionSkillPoints = 0;
    this.currentSP = this.totalSkillPoints;
    this.saveData();
    this.updateUI();
  }

  isLevelUnlocked(levelIndex) {
    return levelIndex <= this.unlockedLevelIndex;
  }

  unlockLevel(levelIndex) {
    if (levelIndex <= this.unlockedLevelIndex) return;
    this.unlockedLevelIndex = Math.max(
      0,
      Math.min(this.totalLevels - 1, levelIndex),
    );
    localStorage.setItem("hordeless_unlocked_level", this.unlockedLevelIndex);
    this.updateLevelButtons();
  }

  updateLevelButtons() {
    for (let i = 1; i <= this.totalLevels; i++) {
      const btn = document.getElementById(`btn-select-lvl${i}`);
      if (!btn) continue;

      const levelIndex = i - 1;
      const unlocked = this.isLevelUnlocked(levelIndex);
      btn.disabled = !unlocked;
      btn.style.opacity = unlocked ? "1" : "0.55";
      btn.style.cursor = unlocked ? "pointer" : "not-allowed";
      btn.title = unlocked ? "" : "Complete the previous level first";
    }
  }

  unlockAllLevels() {
    this.unlockedLevelIndex = this.totalLevels - 1;
    localStorage.setItem("hordeless_unlocked_level", this.unlockedLevelIndex);
    this.updateLevelButtons();
  }

  setupButtons() {
    // Carousel Navigation Logic
    const carousel = document.getElementById("upgrade-list");
    const btnPrev = document.getElementById("btn-carousel-prev");
    const btnNext = document.getElementById("btn-carousel-next");
    let currentScroll = 0;
    const cardWidth = 215; // 200px width + 15px gap

    if (btnPrev && btnNext && carousel) {
      btnPrev.addEventListener("click", () => {
        currentScroll -= cardWidth * 2; // scroll 2 cards
        if (currentScroll < 0) currentScroll = 0;
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        audioManager.play("hover");
      });
      btnNext.addEventListener("click", () => {
        // Max scroll is total width - window width
        let maxScroll =
          carousel.scrollWidth - carousel.parentElement.clientWidth;
        if (maxScroll < 0) maxScroll = 0;
        currentScroll += cardWidth * 2;
        if (currentScroll > maxScroll) currentScroll = maxScroll;
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        audioManager.play("hover");
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "\\") {
        this.unlockAllLevels();
      }
    });

    // Add hover sound to all buttons
    const allButtons = document.querySelectorAll("button, .pixel-btn");
    allButtons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        audioManager.play("hover");
      });
    });

    // Main Play Button now opens Skill Preparation for Level 1
    const btnPlay = document.getElementById("btn-play");
    if (btnPlay) {
      btnPlay.addEventListener("click", () => {
        const bgMusic = document.getElementById("bg-music");
        if (bgMusic && this.audioSettings.music) {
          if (bgMusic.paused) {
            bgMusic.volume = 0.2; // Adjust BGM volume here so it's not too loud
            bgMusic
              .play()
              .catch((e) => console.log("Audio play blocked by browser", e));
          }
        } else if (bgMusic) {
          bgMusic.pause();
        }
        if (carousel) {
          currentScroll = 0;
          carousel.style.transform = `translateX(0px)`;
        }
        this.prepareLevel(0);
      });
    }

    this.updateLevelButtons();

    // Level selection buttons
    for (let i = 1; i <= this.totalLevels; i++) {
      const btn = document.getElementById(`btn-select-lvl${i}`);
      if (btn) {
        btn.addEventListener("click", () => {
          const levelIndex = i - 1;
          if (!this.isLevelUnlocked(levelIndex)) return;

          document.getElementById("level-menu").classList.remove("active");
          this.currentLevelIndex = levelIndex;
          this.resetLoadout();

          // Reset carousel position
          if (carousel) {
            currentScroll = 0;
            carousel.style.transform = `translateX(0px)`;
          }

          this.setState(this.states.UPGRADES);
        });
      }
    }

    const btnBackLevels = document.getElementById("btn-back-levels");
    if (btnBackLevels) {
      btnBackLevels.addEventListener("click", () => {
        document.getElementById("level-menu").classList.remove("active");
        document.getElementById("main-menu").classList.add("active");
      });
    }

    const settingsPanel = document.getElementById("settings-panel");
    const btnSettings = document.getElementById("btn-settings");
    const btnSettingsClose = document.getElementById("btn-settings-close");
    const toggleMusic = document.getElementById("toggle-music");
    const toggleSound = document.getElementById("toggle-sound");

    const updateSettingsUI = () => {
      if (toggleMusic) {
        toggleMusic.innerText = this.audioSettings.music ? "On" : "Off";
        toggleMusic.classList.toggle("off", !this.audioSettings.music);
      }
      if (toggleSound) {
        toggleSound.innerText = this.audioSettings.sound ? "On" : "Off";
        toggleSound.classList.toggle("off", !this.audioSettings.sound);
      }
    };

    if (btnSettings && settingsPanel) {
      btnSettings.addEventListener("click", () => {
        settingsPanel.classList.add("active");
        document.getElementById("main-menu").classList.add("settings-open");
      });
    }

    if (btnSettingsClose && settingsPanel) {
      btnSettingsClose.addEventListener("click", () => {
        settingsPanel.classList.remove("active");
        document.getElementById("main-menu").classList.remove("settings-open");
      });
    }

    if (toggleMusic) {
      toggleMusic.addEventListener("click", () => {
        this.setAudioSetting("music", !this.audioSettings.music);
      });
    }

    if (toggleSound) {
      toggleSound.addEventListener("click", () => {
        this.setAudioSetting("sound", !this.audioSettings.sound);
      });
    }

    ["btn-levels", "btn-leaderboard", "btn-achievements"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          alert(id.replace("btn-", "").toUpperCase() + " coming soon!");
        });
      }
    });

    updateSettingsUI();

    document.getElementById("btn-start-run").addEventListener("click", () => {
      this.startRun();
    });

    const btnBackUpgrades = document.getElementById("btn-back-upgrades");
    if (btnBackUpgrades) {
      btnBackUpgrades.addEventListener("click", () => {
        this.ui.upgrades.classList.remove("active");
        this.ui.menu.classList.remove("active");
        document.getElementById("level-menu").classList.add("active");
      });
    }

    document.getElementById("btn-menu").addEventListener("click", () => {
      this.setState(this.states.MENU);
    });

    // Loadout buttons
    const costs = { speed: 20, health: 30, djump: 20, wjump: 20 };

    // Double Jump
    document.getElementById("btn-upg-djump").addEventListener("click", () => {
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
    document.getElementById("btn-upg-wjump").addEventListener("click", () => {
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
    document
      .getElementById("btn-upg-speed-add")
      .addEventListener("click", () => {
        if (this.loadout.speed < 3 && this.currentSP >= costs.speed) {
          this.loadout.speed++;
          this.totalCoins -= costs.speed;
          this.currentSP = this.totalCoins;
          localStorage.setItem("hordeless_coins", this.totalCoins);
          this.updateUI();
        }
      });
    document
      .getElementById("btn-upg-speed-sub")
      .addEventListener("click", () => {
        if (this.loadout.speed > 0) {
          this.loadout.speed--;
          this.currentSP += costs.speed;
          this.updateUI();
        }
      });

    // Health
    document
      .getElementById("btn-upg-health-add")
      .addEventListener("click", () => {
        if (this.loadout.health < 2 && this.currentSP >= costs.health) {
          this.loadout.health++;
          this.currentSP -= costs.health;
          this.updateUI();
        }
      });
    document
      .getElementById("btn-upg-health-sub")
      .addEventListener("click", () => {
        if (this.loadout.health > 0) {
          this.loadout.health--;
          this.currentSP += costs.health;
          this.updateUI();
        }
      });

    // Transformations
    const toggleTransformation = (type) => {
      if (this.loadout[type]) {
        this.loadout[type] = false;
        this.currentSP += 30; // Cost is 30 SP
      } else if (this.currentSP >= 30) {
        this.loadout[type] = true;
        this.currentSP -= 30;
      }
      this.updateUI();
    };

    document
      .getElementById("btn-upg-rex")
      .addEventListener("click", () => toggleTransformation("rex"));
    document
      .getElementById("btn-upg-tri")
      .addEventListener("click", () => toggleTransformation("tri"));
    document
      .getElementById("btn-upg-pengu")
      .addEventListener("click", () => toggleTransformation("pengu"));
  }

  setAudioSetting(type, enabled) {
    this.audioSettings[type] = enabled;
    localStorage.setItem(`hordeless_${type}`, enabled ? "true" : "false");

    if (type === "music") {
      audioManager.setMusicEnabled(enabled);
    } else {
      audioManager.setSoundEnabled(enabled);
    }

    const toggleButton = document.getElementById(
      type === "music" ? "toggle-music" : "toggle-sound",
    );
    if (toggleButton) {
      toggleButton.innerText = enabled ? "On" : "Off";
      toggleButton.classList.toggle("off", !enabled);
    }
  }

  saveData() {
    localStorage.setItem("hordeless_skill_points", this.totalSkillPoints);
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

    if (this.ui.lvlRex) {
      this.ui.lvlRex.innerText = this.loadout.rex ? "ON" : "OFF";
      this.ui.lvlRex.style.color = this.loadout.rex ? "#4CAF50" : "white";
      this.ui.lvlTri.innerText = this.loadout.tri ? "ON" : "OFF";
      this.ui.lvlTri.style.color = this.loadout.tri ? "#4CAF50" : "white";
      this.ui.lvlPengu.innerText = this.loadout.pengu ? "ON" : "OFF";
      this.ui.lvlPengu.style.color = this.loadout.pengu ? "#4CAF50" : "white";
    }
  }

  setState(newState) {
    this.currentState = newState;

    // Hide all screens
    this.ui.menu.classList.remove("active");
    this.ui.upgrades.classList.remove("active");
    this.ui.hud.classList.remove("active");
    this.ui.gameOver.classList.remove("active");

    // Show current screen
    switch (newState) {
      case this.states.MENU:
        this.ui.menu.classList.add("active");
        break;
      case this.states.UPGRADES:
        this.updateUI();
        this.ui.upgrades.classList.add("active");
        break;
      case this.states.PLAYING:
        this.ui.hud.classList.add("active");
        break;
      case this.states.GAMEOVER:
        this.ui.gameOver.classList.add("active");
        const header = this.ui.gameOver.querySelector("h2");
        if (header) {
          header.innerText = this.victory ? "YOU WIN!!!!" : "GAME OVER";
        }
        this.ui.goScore.innerText = Math.floor(this.score);
        this.ui.goCoins.innerText = this.sessionSkillPoints;
        break;
    }
  }

  startRun() {
    this.victory = false;
    this.survivalTime = 0;
    this.sessionSkillPoints = 0;
    this.updateHUD();

    this.setState(this.states.PLAYING);
    audioManager.play("start");

    // Setup Player Stats based on loadout
    if (this.onStartRun) {
      this.onStartRun(this.loadout);
    }
  }

  endRun() {
    this.bankSessionSkillPoints();

    const heavenlySound = audioManager.sounds?.heavenly;
    const shouldDelayGameOver =
      heavenlySound &&
      !heavenlySound.paused &&
      heavenlySound.currentTime < heavenlySound.duration;
    const audioKey = this.victory ? "win" : "over";

    if (shouldDelayGameOver) {
      setTimeout(
        () => {
          this.setState(this.states.GAMEOVER);
          audioManager.play(audioKey);
          this.ui.goScore.innerText = Math.floor(this.score);
          this.ui.goCoins.innerText = this.sessionSkillPoints;
          this.updateUI();
        },
        (heavenlySound.duration - heavenlySound.currentTime + 1.0) * 1000,
      );
      return;
    }

    this.setState(this.states.GAMEOVER);
    audioManager.play(audioKey);
    this.updateUI();
  }

  addSkillPoint() {
    this.sessionSkillPoints++;
    this.score += 50; // Keep the score reward for collecting fruit
    this.updateHUD();
  }

  updateScore(deltaTime) {
    this.survivalTime += deltaTime;
    this.score += deltaTime * 10; // 10 points per second
    this.updateHUD();
  }

  updateHUD(health = 0) {
    this.ui.hudScore.innerText = Math.floor(this.score);
    this.ui.hudCoins.innerText = this.sessionSkillPoints;
    if (health !== 0) {
      this.ui.hudHealth.innerText = health;
    }
  }
}

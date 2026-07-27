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
      DIALOG: 3,
      GAMEOVER: 4,
    };
    this.currentState = this.states.MENU;
    this.dialogLines = [];
    this.dialogLineIndex = 0;
    this.dialogSpeaker = "Terranox";
    this.dialogCallback = null;

    // UI Elements
    this.ui = {
      menu: document.getElementById("main-menu"),
      upgrades: document.getElementById("upgrade-menu"),
      hud: document.getElementById("hud"),
      dialog: document.getElementById("dialog-screen"),
      dialogSpeaker: document.getElementById("dialog-speaker"),
      dialogText: document.getElementById("dialog-text"),
      dialogPrompt: document.getElementById("dialog-prompt"),
      dialogPlayerBox: document.querySelector(".dialog-player"),
      dialogOtherBox: document.querySelector(".dialog-other"),
      dialogOtherName: document.querySelector(".dialog-other-name"),
      dialogOtherSprite: document.querySelector(".dialog-sprite-other"),
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

    // Cost definition map
    this.costs = {
      speed: 20,
      health: 30,
      djump: 20,
      wjump: 20,
      rex: 30,
      tri: 30,
      pengu: 30,
    };

    // Load saved loadout or set defaults
    const defaultLoadout = {
      speed: 0,
      health: 0,
      djump: false,
      wjump: false,
      rex: false,
      tri: false,
      pengu: false,
    };

    let savedLoadout = null;
    try {
      savedLoadout = JSON.parse(localStorage.getItem("hordeless_loadout"));
    } catch (e) {
      savedLoadout = null;
    }
    this.loadout = savedLoadout
      ? { ...defaultLoadout, ...savedLoadout }
      : defaultLoadout;

    // Load banked SP
    const storedSP = Number.parseInt(
      localStorage.getItem("hordeless_skill_points"),
      10,
    );
    this.bankedSP = Number.isNaN(storedSP) ? 20 : storedSP;

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

    window.addEventListener("beforeunload", () => {
      sessionStorage.removeItem("hordeless_top_scores");
    });
  }

  // Calculate total spent points directly from current loadout
  calculateSpentSP() {
    let spent = 0;
    spent += this.loadout.speed * this.costs.speed;
    spent += this.loadout.health * this.costs.health;
    if (this.loadout.djump) spent += this.costs.djump;
    if (this.loadout.wjump) spent += this.costs.wjump;
    if (this.loadout.rex) spent += this.costs.rex;
    if (this.loadout.tri) spent += this.costs.tri;
    if (this.loadout.pengu) spent += this.costs.pengu;
    return spent;
  }

  // Hard Reset (e.g. Press 'R' or 'Delete')
  resetProgress(startingSP = 20) {
    this.bankedSP = startingSP;
    this.unlockedLevelIndex = 0;
    localStorage.setItem("hordeless_unlocked_level", 0);

    this.loadout = {
      speed: 0,
      health: 0,
      djump: false,
      wjump: false,
      rex: false,
      tri: false,
      pengu: false,
    };

    this.saveData();
    this.updateLevelButtons();
    this.updateUI();
  }

  prepareLevel(levelIndex = 0) {
    if (levelIndex > this.unlockedLevelIndex) {
      return false;
    }

    this.currentLevelIndex = levelIndex;
    this.bankSessionSkillPoints();
    this.setState(this.states.UPGRADES);
    return true;
  }

  bankSessionSkillPoints() {
    if (this.sessionSkillPoints <= 0) return;

    this.bankedSP += this.sessionSkillPoints;
    this.sessionSkillPoints = 0;
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
    this.updateUI();
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
    this.updateUI();
  }

  setupButtons() {
    const carousel = document.getElementById("upgrade-list");
    const btnPrev = document.getElementById("btn-carousel-prev");
    const btnNext = document.getElementById("btn-carousel-next");
    let currentScroll = 0;
    const cardWidth = 215;

    if (btnPrev && btnNext && carousel) {
      btnPrev.addEventListener("click", () => {
        currentScroll -= cardWidth * 2;
        if (currentScroll < 0) currentScroll = 0;
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        audioManager.play("hover");
      });
      btnNext.addEventListener("click", () => {
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
      if (event.key === "r" || event.key === "Delete") {
        this.resetProgress(20);
      }
    });

    const allButtons = document.querySelectorAll("button, .pixel-btn");
    allButtons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        audioManager.play("hover");
      });
    });

    const btnPlay = document.getElementById("btn-play");
    if (btnPlay) {
      btnPlay.addEventListener("click", () => {
        const bgMusic = document.getElementById("bg-music");

        if (bgMusic && this.audioSettings.music) {
          if (bgMusic.paused) {
            bgMusic.volume = 0.2;
            bgMusic.play().catch((e) => console.log("Audio play blocked", e));
          }
        } else if (bgMusic) {
          bgMusic.pause();
        }

        if (carousel) {
          currentScroll = 0;
          carousel.style.transform = `translateX(0px)`;
        }

        this.setState(this.states.UPGRADES);
      });
    }

    this.updateLevelButtons();

    for (let i = 1; i <= this.totalLevels; i++) {
      const btn = document.getElementById(`btn-select-lvl${i}`);
      if (btn) {
        btn.addEventListener("click", () => {
          const levelIndex = i - 1;
          if (!this.isLevelUnlocked(levelIndex)) return;

          document.getElementById("level-menu").classList.remove("active");
          this.currentLevelIndex = levelIndex;

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

    ["btn-achievements"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          alert(id.replace("btn-", "").toUpperCase() + " coming soon!");
        });
      }
    });

    const btnLevels = document.getElementById("btn-levels");

    if (btnLevels) {
      btnLevels.addEventListener("click", () => {
        this.ui.menu.classList.remove("active");
        document.getElementById("level-menu").classList.add("active");
      });
    }

    const btnLeaderboard = document.getElementById("btn-leaderboard");

    btnLeaderboard.addEventListener("click", () => {
      document.getElementById("main-menu").classList.remove("active");

      document.getElementById("halloffame-menu").classList.add("active");

      this.updateHallOfFame();
    });

    document.getElementById("btn-back-hof").addEventListener("click", () => {
      document.getElementById("halloffame-menu").classList.remove("active");

      document.getElementById("main-menu").classList.add("active");
    });

    updateSettingsUI();

    document.getElementById("btn-start-run").addEventListener("click", () => {
      this.startRun();
    });

    const btnBackUpgrades = document.getElementById("btn-back-upgrades");
    btnBackUpgrades.addEventListener("click", () => {
      this.ui.upgrades.classList.remove("active");

      if (this.cameFromLevelSelect) {
        document.getElementById("level-menu").classList.add("active");
      } else {
        this.ui.menu.classList.add("active");
      }
    });

    document.getElementById("btn-menu").addEventListener("click", () => {
      this.setState(this.states.MENU);
    });

    if (this.ui.dialog) {
      this.ui.dialog.addEventListener("click", () => {
        if (this.currentState === this.states.DIALOG) {
          this.advanceDialog();
        }
      });
    }

    window.addEventListener("keydown", (event) => {
      if (
        (event.key === " " ||
          event.key === "Spacebar" ||
          event.key === "Space") &&
        this.currentState === this.states.DIALOG
      ) {
        event.preventDefault();
        this.advanceDialog();
      }
    });

    // Double Jump Toggle
    document.getElementById("btn-upg-djump").addEventListener("click", () => {
      if (this.loadout.djump) {
        this.loadout.djump = false;
        this.bankedSP += this.costs.djump;
      } else if (this.bankedSP >= this.costs.djump) {
        this.loadout.djump = true;
        this.bankedSP -= this.costs.djump;
      }
      this.saveData();
      this.updateUI();
    });

    // Wall Jump Toggle
    document.getElementById("btn-upg-wjump").addEventListener("click", () => {
      if (this.loadout.wjump) {
        this.loadout.wjump = false;
        this.bankedSP += this.costs.wjump;
      } else if (this.bankedSP >= this.costs.wjump) {
        this.loadout.wjump = true;
        this.bankedSP -= this.costs.wjump;
      }
      this.saveData();
      this.updateUI();
    });

    // Speed Add / Sub
    document
      .getElementById("btn-upg-speed-add")
      .addEventListener("click", () => {
        if (this.loadout.speed < 3 && this.bankedSP >= this.costs.speed) {
          this.loadout.speed++;
          this.bankedSP -= this.costs.speed;
          this.saveData();
          this.updateUI();
        }
      });
    document
      .getElementById("btn-upg-speed-sub")
      .addEventListener("click", () => {
        if (this.loadout.speed > 0) {
          this.loadout.speed--;
          this.bankedSP += this.costs.speed;
          this.saveData();
          this.updateUI();
        }
      });

    // Health Add / Sub
    document
      .getElementById("btn-upg-health-add")
      .addEventListener("click", () => {
        if (this.loadout.health < 2 && this.bankedSP >= this.costs.health) {
          this.loadout.health++;
          this.bankedSP -= this.costs.health;
          this.saveData();
          this.updateUI();
        }
      });
    document
      .getElementById("btn-upg-health-sub")
      .addEventListener("click", () => {
        if (this.loadout.health > 0) {
          this.loadout.health--;
          this.bankedSP += this.costs.health;
          this.saveData();
          this.updateUI();
        }
      });

    // Transformations
    const toggleTransformation = (type, requiredLevel) => {
      if (this.unlockedLevelIndex < requiredLevel) {
        alert(`Requires beating Level ${requiredLevel} first!`);
        return;
      }

      const cost = this.costs[type];
      if (this.loadout[type]) {
        this.loadout[type] = false;
        this.bankedSP += cost;
      } else if (this.bankedSP >= cost) {
        this.loadout[type] = true;
        this.bankedSP -= cost;
      }
      this.saveData();
      this.updateUI();
    };

    document
      .getElementById("btn-upg-rex")
      .addEventListener("click", () => toggleTransformation("rex", 1));
    document
      .getElementById("btn-upg-tri")
      .addEventListener("click", () => toggleTransformation("tri", 1));
    document
      .getElementById("btn-upg-pengu")
      .addEventListener("click", () => toggleTransformation("pengu", 2));
  }

  updateHallOfFame() {
    const scores = JSON.parse(
      sessionStorage.getItem("hordeless_top_scores") || "[]",
    );

    for (let i = 0; i < 3; i++) {
      const element = document.getElementById(`hof-${i + 1}`);

      if (!element) continue;

      if (scores[i]) {
        element.innerHTML = `Level ${scores[i].level} : ${scores[i].score}`;
      } else {
        element.innerHTML = "Empty";
      }
    }
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

  saveHighScore(score, levelIndex) {
    let scores = JSON.parse(
      sessionStorage.getItem("hordeless_top_scores") || "[]",
    );

    scores.push({
      score: Math.floor(score),
      level: levelIndex + 1,
    });

    scores.sort((a, b) => b.score - a.score);

    scores = scores.slice(0, 3);

    sessionStorage.setItem("hordeless_top_scores", JSON.stringify(scores));
  }

  saveLevelScore(score, levelIndex) {
    let scores = JSON.parse(
      sessionStorage.getItem("hordeless_top_scores") || "[]",
    );

    scores.push({
      score: Math.floor(score),
      level: levelIndex + 1,
    });

    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 3);

    sessionStorage.setItem("hordeless_top_scores", JSON.stringify(scores));
  }

  saveData() {
    localStorage.setItem("hordeless_skill_points", this.bankedSP);
    localStorage.setItem("hordeless_loadout", JSON.stringify(this.loadout));
  }

  updateUI() {
    if (!this.ui.menuSP) return;

    this.ui.menuSP.innerText = this.bankedSP;
    this.ui.lvlSpeed.innerText = `Lv ${this.loadout.speed}`;
    this.ui.lvlHealth.innerText = `Lv ${this.loadout.health}`;
    this.ui.lvlDjump.innerText = this.loadout.djump ? "ON" : "OFF";
    this.ui.lvlDjump.style.color = this.loadout.djump ? "#4CAF50" : "white";
    this.ui.lvlWjump.innerText = this.loadout.wjump ? "ON" : "OFF";
    this.ui.lvlWjump.style.color = this.loadout.wjump ? "#4CAF50" : "white";

    if (this.ui.lvlRex) {
      const dinoUnlocked = this.unlockedLevelIndex >= 1;
      this.ui.lvlRex.innerText = dinoUnlocked
        ? this.loadout.rex
          ? "ON"
          : "OFF"
        : "LOCKED";
      this.ui.lvlRex.style.color = dinoUnlocked
        ? this.loadout.rex
          ? "#4CAF50"
          : "white"
        : "#ff5252";

      this.ui.lvlTri.innerText = dinoUnlocked
        ? this.loadout.tri
          ? "ON"
          : "OFF"
        : "LOCKED";
      this.ui.lvlTri.style.color = dinoUnlocked
        ? this.loadout.tri
          ? "#4CAF50"
          : "white"
        : "#ff5252";

      const penguUnlocked = this.unlockedLevelIndex >= 2;
      this.ui.lvlPengu.innerText = penguUnlocked
        ? this.loadout.pengu
          ? "ON"
          : "OFF"
        : "LOCKED";
      this.ui.lvlPengu.style.color = penguUnlocked
        ? this.loadout.pengu
          ? "#4CAF50"
          : "white"
        : "#ff5252";
    }
  }

  setState(newState) {
    this.currentState = newState;

    this.ui.menu.classList.remove("active");
    this.ui.upgrades.classList.remove("active");
    this.ui.hud.classList.remove("active");
    if (this.ui.dialog) this.ui.dialog.classList.remove("active");
    this.ui.gameOver.classList.remove("active");

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
      case this.states.DIALOG:
        if (this.ui.dialog) this.ui.dialog.classList.add("active");
        this.updateDialog();
        break;
      case this.states.GAMEOVER:
        this.ui.gameOver.classList.add("active");

        const header = this.ui.gameOver.querySelector("h2");
        if (header) {
          header.innerText = this.victory ? "YOU WIN!!!!" : "GAME OVER";
        }

        this.ui.goScore.innerText = this.lastRun
          ? Math.floor(this.lastRun.score)
          : Math.floor(this.score);

        this.ui.goCoins.innerText = this.lastRun
          ? this.lastRun.sp
          : this.sessionSkillPoints;

        break;
    }
  }

  startRun() {
    this.lastRun = null;
    this.victory = false;
    this.survivalTime = 0;
    this.sessionSkillPoints = 0;
    this.updateHUD();

    this.setState(this.states.PLAYING);
    audioManager.play("start");

    if (this.onStartRun) {
      this.onStartRun(this.loadout);
    }
  }

  endRun() {
    this.lastRun = {
      score: this.score,
      sp: this.sessionSkillPoints,
    };

    this.bankSessionSkillPoints();

    // ===== Simpan Top 3 Score =====
    let scores = JSON.parse(
      sessionStorage.getItem("hordeless_top_scores") || "[]",
    );

    scores.push({
      score: Math.floor(this.score),
      level: this.currentLevelIndex + 1,
    });

    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 3);

    sessionStorage.setItem("hordeless_top_scores", JSON.stringify(scores));

    // ===============================

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
          this.updateUI();
        },
        (heavenlySound.duration - heavenlySound.currentTime + 1) * 1000,
      );

      return;
    }

    this.setState(this.states.GAMEOVER);
    audioManager.play(audioKey);
    this.updateUI();
  }

  addSkillPoint() {
    this.sessionSkillPoints++;
    this.score += 50;
    this.updateHUD();
  }

  startDialog(lines, speaker = "Terranox", callback = null) {
    this.dialogLines = Array.isArray(lines) ? lines : [lines];
    this.dialogLineIndex = 0;
    this.dialogSpeaker = speaker;
    this.dialogCallback = typeof callback === "function" ? callback : null;
    this.setState(this.states.DIALOG);
  }

  advanceDialog() {
    if (this.dialogLineIndex < this.dialogLines.length - 1) {
      this.dialogLineIndex += 1;
      this.updateDialog();
    } else {
      const callback = this.dialogCallback;
      this.dialogCallback = null;
      if (callback) {
        callback();
      } else {
        this.endRun();
      }
    }
  }

  updateDialog() {
    if (this.ui.dialogText) {
      this.ui.dialogText.innerText =
        this.dialogLines[this.dialogLineIndex] || "";
    }
    if (this.ui.dialogSpeaker) {
      this.ui.dialogSpeaker.innerText = this.dialogSpeaker;
    }
    if (
      this.ui.dialogPlayerBox &&
      this.ui.dialogOtherBox &&
      this.ui.dialogOtherName &&
      this.ui.dialogOtherSprite
    ) {
      const speaker = this.dialogSpeaker.toLowerCase();
      const isPlayerStory =
        speaker.includes("wanderer") ||
        speaker.includes("player") ||
        speaker.includes("explorer") ||
        speaker.includes("unknown") ||
        speaker.includes("ark-01");
      const isPenguinSpeaking =
        speaker.includes("glacielle") || speaker.includes("penguin");

      this.ui.dialogOtherName.innerText = this.dialogSpeaker;
      this.ui.dialogPlayerBox.classList.toggle("active", isPlayerStory);
      this.ui.dialogOtherBox.classList.toggle("active", !isPlayerStory);
      this.ui.dialogOtherBox.style.display = isPlayerStory ? "none" : "flex";

      this.ui.dialogOtherSprite.classList.toggle(
        "dialog-sprite-pengu",
        isPenguinSpeaking,
      );
      this.ui.dialogOtherSprite.classList.toggle(
        "dialog-sprite-dino",
        !isPenguinSpeaking,
      );
    }
  }

  updateScore(deltaTime) {
    this.survivalTime += deltaTime;
    this.score += deltaTime * 10;
    this.updateHUD();
  }

  updateHUD(health = null) {
    this.ui.hudScore.innerText = Math.floor(this.score);
    this.ui.hudCoins.innerText = this.sessionSkillPoints;
    if (health !== null) {
      this.ui.hudHealth.innerText = health;
    }
  }
}

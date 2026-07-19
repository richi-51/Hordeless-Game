export class AudioManager {
    constructor() {
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.backgroundMusic = document.getElementById('bg-music');
        this.sounds = {
            start: new Audio('/Assets/game-start-sfx.mp3.mpeg'),
            over: new Audio('/Assets/game-over-sfx.mp3.mpeg'),
            win: new Audio('/Assets/pw23check-winning-218995.mp3'),
            hover: new Audio('/Assets/menu-hover.mp3.mpeg'),
            kill: new Audio('/Assets/mixkit-small-hit-in-a-game-2072.wav'),
            hurt: new Audio('/Assets/mixkit-falling-hit-on-gravel-756.wav'),
            jump: new Audio('/Assets/bestuploadsever67aryan-jump-sound-531048.mp3'),
            fruit: new Audio('/Assets/mixkit-winning-an-extra-bonus-2060.wav'),
            heavenly: new Audio('/Assets/Heavenly - Sound Effect.mp3.mpeg')
        };
        
        // Set volumes for SFX so they are clear but not overpowering
        this.sounds.start.volume = 0.6;
        this.sounds.over.volume = 0.6;
        this.sounds.win.volume = 0.7;
        this.sounds.hover.volume = 0.4;
        this.sounds.kill.volume = 0.5;
        this.sounds.hurt.volume = 0.5;
        this.sounds.jump.volume = 0.6;
        this.sounds.fruit.volume = 0.3; // Lowered volume
        this.sounds.heavenly.volume = 0.7;

        if (this.backgroundMusic) {
            this.backgroundMusic.volume = 0.2;
            this.backgroundMusic.loop = true;
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;

        if (this.backgroundMusic) {
            this.backgroundMusic.muted = !enabled;
            if (!enabled) {
                this.backgroundMusic.pause();
            } else if (this.backgroundMusic.paused) {
                this.backgroundMusic.play().catch(e => console.log("Audio play blocked by browser", e));
            }
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    stop(name) {
        if (!this.sounds[name]) return;
        this.sounds[name].pause();
        this.sounds[name].currentTime = 0;
    }

    play(name) {
        if (!this.soundEnabled || !this.sounds[name]) {
            return;
        }

        if (name === 'fruit') {
            // Prevent deafening overlap by reusing the same audio node and restarting it
            this.sounds[name].currentTime = 0;
            this.sounds[name].play().catch(e => console.log("Audio play blocked by browser", e));
        } else {
            // Clone the node for other sounds
            let sound = this.sounds[name].cloneNode();
            sound.volume = this.sounds[name].volume;
            sound.play().catch(e => console.log("Audio play blocked by browser", e));
        }
    }
}

export const audioManager = new AudioManager();

export class AudioManager {
    constructor() {
        this.sounds = {
            start: new Audio('/Assets/game-start-sfx.mp3.mpeg'),
            over: new Audio('/Assets/game-over-sfx.mp3.mpeg'),
            hover: new Audio('/Assets/menu-hover.mp3.mpeg'),
            kill: new Audio('/Assets/mixkit-small-hit-in-a-game-2072.wav'),
            fruit: new Audio('/Assets/mixkit-winning-an-extra-bonus-2060.wav'),
            trampoline: new Audio('/Assets/8-Bit Jump Sound Effect.mp3')
        };
        
        // Set volumes for SFX so they are clear but not overpowering
        this.sounds.start.volume = 0.6;
        this.sounds.over.volume = 0.6;
        this.sounds.hover.volume = 0.4;
        this.sounds.kill.volume = 0.5;
        this.sounds.fruit.volume = 0.3; // Lowered volume
        this.sounds.trampoline.volume = 0.45;
    }
    
    play(name) {
        if (this.sounds[name]) {
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
}

export const audioManager = new AudioManager();

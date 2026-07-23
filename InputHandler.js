export default class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false, // To track continuous hold
            attack: false
        };
        
        // Input Buffering
        this.jumpBufferCounter = 0;
        this.jumpBufferTime = 0.15; // 150ms buffer time

        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    if (!this.keys.jump) {
                        this.jumpBufferCounter = this.jumpBufferTime; // Start buffer on fresh press
                    }
                    this.keys.up = true;
                    this.keys.jump = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    break;
                case 'KeyJ':
                case 'KeyZ':
                case 'KeyF':
                case 'ShiftLeft':
                    this.keys.attack = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    this.keys.jump = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'KeyJ':
                case 'KeyZ':
                case 'KeyF':
                case 'ShiftLeft':
                    this.keys.attack = false;
                    break;
            }
        });
    }

    update(deltaTime) {
        if (this.jumpBufferCounter > 0) {
            this.jumpBufferCounter -= deltaTime;
        }
    }
}

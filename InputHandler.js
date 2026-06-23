export default class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            jump: false // To track continuous hold
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
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    if (!this.keys.jump) {
                        this.jumpBufferCounter = this.jumpBufferTime; // Start buffer on fresh press
                    }
                    this.keys.up = true;
                    this.keys.jump = true;
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
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    this.keys.up = false;
                    this.keys.jump = false;
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

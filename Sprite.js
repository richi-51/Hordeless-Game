export default class Sprite {
    constructor(imageSrc, frameWidth, frameHeight, frameCount, frameDuration = 0.1) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.frameDuration = frameDuration; // time per frame in seconds
        
        this.currentFrame = 0;
        this.timer = 0;
    }

    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer >= this.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.timer = 0;
        }
    }

    draw(ctx, x, y, flipX = false, scale = 1.0) {
        if (!this.image.complete) return;

        ctx.save();
        
        let renderWidth = this.frameWidth * scale;
        let renderHeight = this.frameHeight * scale;

        if (flipX) {
            let cx = Math.floor(x + renderWidth / 2);
            let cy = Math.floor(y + renderHeight / 2);
            // Flip the image horizontally around its center
            ctx.translate(cx, cy);
            ctx.scale(-1, 1);
            ctx.translate(-cx, -cy);
        }

        ctx.drawImage(
            this.image,
            this.currentFrame * this.frameWidth, 0, // Source X, Y
            this.frameWidth, this.frameHeight,      // Source Width, Height
            Math.floor(x), Math.floor(y),                                   // Destination X, Y
            renderWidth, renderHeight               // Destination Width, Height
        );

        ctx.restore();
    }
}

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

    draw(ctx, x, y, flipX = false) {
        if (!this.image.complete) return;

        ctx.save();
        
        if (flipX) {
            // Flip the image horizontally around its center
            ctx.translate(x + this.frameWidth / 2, y + this.frameHeight / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(x + this.frameWidth / 2), -(y + this.frameHeight / 2));
        }

        ctx.drawImage(
            this.image,
            this.currentFrame * this.frameWidth, 0, // Source X, Y
            this.frameWidth, this.frameHeight,      // Source Width, Height
            x, y,                                   // Destination X, Y
            this.frameWidth, this.frameHeight       // Destination Width, Height
        );

        ctx.restore();
    }
}

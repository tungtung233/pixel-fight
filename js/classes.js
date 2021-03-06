class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    pauseAnimation = false,
  }) {
    this.position = position;
    this.image = new Image();
    this.image.src = imageSrc;
    this.scale = scale;
    this.framesMax = framesMax;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 6; //every 6 frames, advance framesCurrent by 1
    this.offset = offset;
    this.pauseAnimation = pauseAnimation;
  }

  draw(flipHorizontal) {
    if (flipHorizontal) {
      context.translate(
        this.position.x + this.position.x + this.width * this.scale,
        0
      );
      context.scale(-1, 1);
    }

    context.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax), //crop location x
      0, //crop location y
      this.image.width / this.framesMax, //crop width
      this.image.height, //crop height
      this.position.x - this.offset.x, //image location x
      this.position.y - this.offset.y, //image location y
      (this.image.width / this.framesMax) * this.scale, //width of cropped image
      this.image.height * this.scale //height of cropped image
    );

    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  animateFrame() {
    this.framesElapsed++;

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++;
      } else if (!this.pauseAnimation) {
        this.framesCurrent = 0;
      }
    }

    // pause duration = framesMax * framesHold * pauseDuration
    if (
      this.pauseAnimation &&
      this.framesElapsed % (this.framesMax * this.framesHold) === 0
    ) {
      if (
        this.pauseAnimation.pauseCount !== this.pauseAnimation.pauseDuration
      ) {
        this.pauseAnimation.pauseCount++;
        this.framesCurrent = this.framesMax - 1;
      } else {
        this.framesCurrent = 0;
        this.pauseAnimation.pauseCount = 0;
        this.pauseAnimation.pauseDuration = Math.floor(Math.random() * 5);
      }
    }
  }

  update() {
    this.draw();
    this.animateFrame();
  }
}

class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    imageSrc,
    width,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    flipHorizontal,
    attackBox = {
      offset: {},
      width: undefined,
      height: undefined,
    },
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset,
    });

    this.velocity = velocity;
    this.width = width;
    this.height = 150;
    this.lastDirectionKey;
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height,
    };
    this.lastAttack = 610; // total duration of game in seconds
    this.attackKeyRelease = true; //ensures that the player released the attack button, rather than holding it down to constantly attack
    this.isAttacking = false;
    this.health = 100;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 6;
    this.sprites = sprites;
    this.flipHorizontal = flipHorizontal;
    this.dead = false;
    this.jump = 0; //increases to a max of 2, so fighter can only double jump

    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image();
      sprites[sprite].image.src = sprites[sprite].imageSrc;
    }
  }

  update() {
    this.draw(this.flipHorizontal);
    if (!this.dead) this.animateFrame();

    if (!this.flipHorizontal) {
      this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    } else {
      this.attackBox.position.x =
        this.position.x +
        this.width * this.scale -
        this.attackBox.width -
        this.attackBox.offset.x;
    }

    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    //visualise attackBox
    // if (!this.flipHorizontal) {
    //   context.fillRect(
    //     this.position.x + this.width * this.scale,
    //     this.attackBox.position.y,
    //     this.attackBox.width,
    //     this.attackBox.height
    //   );
    // } else {
    //   context.fillRect(
    //     this.position.x,
    //     this.attackBox.position.y,
    //     3,
    //     this.attackBox.height
    //   );
    // }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // gravity function
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0;
      this.position.y = 330;
      this.jump = 0;
    } else {
      this.velocity.y += gravity;
    }
  }

  attack() {
    this.switchSprite('attack');
    this.isAttacking = true;
  }

  takeHit() {
    this.health -= 10;

    if (this.health <= 0) {
      this.switchSprite('death');
    } else {
      this.switchSprite('takeHit');
    }
  }

  switchSprite(sprite) {
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true;
      return;
    }

    // overriding other animations with the attack animation - make sure other animations don't interrupt during the attack animation, as we won't enter the switch case
    if (
      this.image === this.sprites.attack.image &&
      this.framesCurrent < this.sprites.attack.framesMax - 1
    )
      return;

    // overriding animations with takeHit animation
    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return;

    switch (sprite) {
      case 'idle':
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image;
          this.framesMax = this.sprites.idle.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'run':
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image;
          this.framesMax = this.sprites.run.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'jump':
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image;
          this.framesMax = this.sprites.jump.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'fall':
        if (this.image !== this.sprites.fall.image) {
          this.image = this.sprites.fall.image;
          this.framesMax = this.sprites.fall.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'attack':
        if (this.image !== this.sprites.attack.image) {
          this.image = this.sprites.attack.image;
          this.framesMax = this.sprites.attack.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'takeHit':
        if (this.image !== this.sprites.takeHit.image) {
          this.image = this.sprites.takeHit.image;
          this.framesMax = this.sprites.takeHit.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'death':
        if (this.image !== this.sprites.death.image) {
          this.image = this.sprites.death.image;
          this.framesMax = this.sprites.death.framesMax;
          this.framesCurrent = 0;
        }
        break;
    }
  }
}

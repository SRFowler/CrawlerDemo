export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    const anims = scene.anims;
    anims.create({
      key:"player-idle",
      frames: anims.generateFrameNumbers("characters", {start: 0, end: 3}),
      frameRate: 3,
      repeat: -1
    });

    this.sprite = scene.physics.add.sprite(x, y, "characters", 0)
      .setSize(10, 10)
      .setOffset(4, 4);

    this.keys = scene.input.keyboard.createCursorKeys();

    this.sprite.anims.play("player-idle", true);
  }

  freeze() {
    this.sprite.body.moves = false;
  }

  update() {
    const keys = this.keys;
    const sprite = this.sprite;
    const speed = 200;
    const prevVelocity = sprite.body.velocity.clone();

    // Stop any previous movement from the last frame
    sprite.body.setVelocity(0);

    // Horizontal movement
    if (keys.left.isDown) {
      sprite.body.setVelocityX(-speed);
      sprite.setFlipX(true);
    } else if (keys.right.isDown) {
      sprite.body.setVelocityX(speed);
      sprite.setFlipX(false);
    }

    // Vertical Movement
    if (keys.up.isDown) {
      sprite.body.setVelocityY(-speed);
    } else if (keys.down.isDown) {
      sprite.body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so the sprite can't move facter along a diagonal
    sprite.body.velocity.normalize().scale(speed);

  }

  destroy() {
    this.sprite.destroy();
  }
}
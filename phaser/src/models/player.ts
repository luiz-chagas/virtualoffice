import { PlayerData } from "../types/PlayerData";
import { DIR_FRAMES, PLAYER_SPEED } from "../utils/contants";

class BasePlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, { x, y, name, avatar }: PlayerData) {
    super(scene, x, y, avatar, 0);
    const nameTag = scene.add
      .text(x + 15, y - 10, name, {
        fontFamily: "Arial",
        color: "#48fb00",
        fontSize: "10px",
        resolution: 2,
      })
      .setOrigin(0.5)
      .setDepth(2);
    scene.physics.add
      .existing(this)
      .setCollideWorldBounds(true)
      .setDisplaySize(35, 35)
      .setOrigin(0);
    scene.add.existing(this).setData("name", nameTag);
    this.setData("avatar", avatar);
  }

  update() {
    (this.getData("name") as Phaser.GameObjects.Text).setPosition(
      this.x + 15,
      this.y - 10
    );

    const body = this.body as Phaser.Physics.Arcade.Body;
    const avatar = this.getData("avatar");

    if (body.velocity.x < 0) {
      this.anims.play(`${avatar}-left-walk`, true);
    } else if (body.velocity.x > 0) {
      this.anims.play(`${avatar}-right-walk`, true);
    } else if (body.velocity.y < 0) {
      this.anims.play(`${avatar}-back-walk`, true);
    } else if (body.velocity.y > 0) {
      this.anims.play(`${avatar}-front-walk`, true);
    } else {
      this.anims.stop();
    }
  }
}

export class RemotePlayer extends BasePlayer {
  constructor(scene: Phaser.Scene, playerData: PlayerData) {
    super(scene, playerData);
    this.setBodySize(30, 30, false);
    this.setOffset(16, 34);
  }

  setNewData(data: PlayerData) {
    this.setData("playerInfo", data);
  }

  update() {
    const err = 3;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const data = this.getData("playerInfo") as PlayerData;

    if (!data) {
      return;
    }

    // Stop any previous movement from the last frame
    body.setVelocity(0);

    if (this.body.x < data.x - err) {
      this.setVelocityX(PLAYER_SPEED);
    } else if (this.body.x > data.x + err) {
      this.setVelocityX(-PLAYER_SPEED);
    }

    if (this.body.y > data.y + err) {
      this.setVelocityY(-PLAYER_SPEED);
    } else if (this.body.y < data.y - err) {
      this.setVelocityY(PLAYER_SPEED);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    body.velocity.normalize().scale(PLAYER_SPEED);

    if (body.velocity.x === 0 && body.velocity.y === 0) {
      this.setTexture(data.avatar, DIR_FRAMES[data.facing]);
    }

    super.update();
  }
}

let input: KeyboardInput;
export class LocalPlayer extends BasePlayer {
  constructor(
    scene: Phaser.Scene,
    map: Phaser.Tilemaps.Tilemap,
    playerData: PlayerData
  ) {
    super(scene, playerData);
    this.setBodySize(30, 30, false);
    this.setOffset(16, 34);

    scene.physics.add.collider(this, map.getLayer("Furniture").tilemapLayer);
    scene.physics.add.collider(this, map.getLayer("Furniture2").tilemapLayer);
    scene.physics.add.collider(this, map.getLayer("Walls").tilemapLayer);
    scene.physics.add.collider(this, map.getLayer("Objects").tilemapLayer);

    input = scene.input.keyboard.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT"
    ) as KeyboardInput;
  }

  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Stop any previous movement from the last frame
    body.setVelocity(0);

    // Vertical movement
    if (input.UP.isDown || input.W.isDown) {
      body.setVelocityY(-PLAYER_SPEED);
    } else if (input.DOWN.isDown || input.S.isDown) {
      body.setVelocityY(PLAYER_SPEED);
    }

    // Horizontal movement
    if (input.LEFT.isDown || input.A.isDown) {
      body.setVelocityX(-PLAYER_SPEED);
    } else if (input.RIGHT.isDown || input.D.isDown) {
      body.setVelocityX(PLAYER_SPEED);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    body.velocity.normalize().scale(PLAYER_SPEED);

    super.update();
  }
}

interface KeyboardInput {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  UP: Phaser.Input.Keyboard.Key;
  DOWN: Phaser.Input.Keyboard.Key;
  LEFT: Phaser.Input.Keyboard.Key;
  RIGHT: Phaser.Input.Keyboard.Key;
}

import { PlayerData } from "../types/PlayerData";
import { DIR_FRAMES, PLAYER_SPEED } from "../utils/contants";

class BasePlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, { x, y, name, avatar }: PlayerData) {
    super(scene, x, y, avatar, 0);

    scene.physics.add
      .existing(this)
      .setCollideWorldBounds(true)
      .setDisplaySize(30, 30)
      .setOrigin(0)
      .setData(
        "name",
        scene.add
          .text(x + 15, y - 10, name, {
            fontFamily: "Arial",
            color: "#48fb00",
            fontSize: "10px",
            resolution: 2,
          })
          .setOrigin(0.5)
          .setDepth(2)
      );
    scene.add.existing(this);
  }
}

export class RemotePlayer extends BasePlayer {
  constructor(scene: Phaser.Scene, playerData: PlayerData) {
    super(scene, playerData);
  }

  setNewData(data: PlayerData) {
    const err = 3;
    let isMoving = false;

    if (!data) {
      return;
    }

    // Other Players Movement
    this.setVelocity(0);
    if (this.x < data.x - err) {
      this.setVelocityX(PLAYER_SPEED);
      if (!isMoving) {
        this.anims.play(`${data.avatar}-right-walk`, true);
      }
      isMoving = true;
    } else if (this.x > data.x + err) {
      this.setVelocityX(-PLAYER_SPEED);
      if (!isMoving) {
        this.anims.play(`${data.avatar}-left-walk`, true);
      }
      isMoving = true;
    }
    if (this.y > data.y + err) {
      this.setVelocityY(-PLAYER_SPEED);
      if (!isMoving) {
        this.anims.play(`${data.avatar}-back-walk`, true);
      }
      isMoving = true;
    } else if (this.y < data.y - err) {
      this.setVelocityY(PLAYER_SPEED);
      if (!isMoving) {
        this.anims.play(`${data.avatar}-front-walk`, true);
      }
      isMoving = true;
    }
    if (!isMoving) {
      this.anims.stop();
      this.setTexture(data.avatar, DIR_FRAMES[data.facing]);
    }

    this.body.velocity.normalize().scale(PLAYER_SPEED);
    // Other Players Name
    this.getData("name")
      .setText(data.name)
      .setPosition(this.x + 15, this.y - 10);
  }
}

export class LocalPlayer extends BasePlayer {
  constructor(
    scene: Phaser.Scene,
    map: Phaser.Tilemaps.Tilemap,
    playerData: PlayerData
  ) {
    super(scene, playerData);

    scene.physics.add.collider(this, map.getLayer("Furniture").tilemapLayer);
    scene.physics.add.collider(this, map.getLayer("Walls").tilemapLayer);
  }
}

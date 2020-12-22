import { BasePlayer } from "./basePlayer";
import { PlayerData } from "./types/PlayerData";
import { DIR_FRAMES, PLAYER_SPEED } from "./utils/contants";

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
      if (data.facing) {
        this.setTexture(data.avatar, DIR_FRAMES[data.facing]);
      }
    }

    this.body.velocity.normalize().scale(PLAYER_SPEED);
    // Other Players Name
    this.getData("name")
      .setText(data.name)
      .setPosition(this.x + 15, this.y - 10);
  }
}

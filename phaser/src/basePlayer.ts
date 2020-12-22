import { PlayerData } from "./types/PlayerData";

export class BasePlayer extends Phaser.Physics.Arcade.Sprite {
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

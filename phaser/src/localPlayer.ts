import { BasePlayer } from "./basePlayer";
import { PlayerData } from "./types/PlayerData";

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

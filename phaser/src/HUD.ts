export class HUDScene extends Phaser.Scene {
  constructor() {
    super("hudScene");
    Phaser.Scene.call(this, { key: "hudScene", active: true });
  }

  preload() {}

  create() {
    const hudText = this.add
      .text(this.scale.width / 2, 15, "Cremanians Online: 0", {
        color: "black",
        fontFamily: "Arial",
        fontSize: "12px",
        backgroundColor: "white",
        resolution: 2,
        padding: {
          x: 4,
          y: 4,
        },
      })
      .setOrigin(0.5);
    const gameScene = this.scene.get("gameScene");
    gameScene.events.on("updatePlayerCount", (x: number) => {
      hudText.setText(`Cremanians Online: ${x}`);
    });
  }

  update() {}
}

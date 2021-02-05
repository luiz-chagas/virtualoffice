export class HUDScene extends Phaser.Scene {
  constructor() {
    super("hudScene");
    Phaser.Scene.call(this, { key: "hudScene", active: true });
  }

  preload() {}

  create() {
    const gameScene = this.scene.get("gameScene");

    const playerCountText = this.add
      .text(this.scale.width / 2, 15, "Cremanians Online: 0", {
        color: "black",
        fontFamily: "Courier New",
        fontSize: "14px",
        backgroundColor: "white",
        resolution: 2,
        padding: {
          x: 4,
          y: 4,
        },
      })
      .setOrigin(0.5);
    gameScene.events.on("playerCount", (x: number) => {
      playerCountText.setText(`Cremanians Online: ${x}`);
    });

    const playerMutedText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Microphone muted", {
        color: "red",
        fontFamily: "Courier New",
        fontStyle: "bold",
        fontSize: "80px",
        backgroundColor: "white",
        padding: {
          x: 10,
          y: 4,
        },
        resolution: 2,
      })
      .setAlpha(0.5)
      .setOrigin(0.5)
      .setShadow(3, 3, "rgba(0,0,0,0.5)", 2)
      .setVisible(false);
    gameScene.events.on("playerMuted", (isMuted: boolean) => {
      playerMutedText.setVisible(isMuted);
    });
  }

  update() {}
}

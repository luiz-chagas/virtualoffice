import Phaser from "phaser";
import { connectToServer } from "./socket";
import { setupHandlers } from "./voice";
interface PlayerData {
  id: string;
  x: number;
  y: number;
  facing: "north" | "south" | "east" | "west";
}

let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
let lastUpdate = -Infinity;
let lastGarbageColleted = -Infinity;
let lastPos = { x: 0, y: 0, facing: "south" };

const gameState: Record<string, Phaser.Physics.Arcade.Sprite> = {};
let serverStateData: Record<string, PlayerData> = {};
const { socket } = connectToServer();
const { makeOffer } = setupHandlers(socket);

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
    Phaser.Scene.call(this, { key: "gameScene", active: true });
  }

  preload() {
    this.load.image("ground-wood", "assets/wood.png");
    this.load.atlas(
      "atlas",
      "assets/player/atlas.png",
      "assets/player/atlas.json"
    );
  }

  create() {
    this.add
      .tileSprite(
        0,
        0,
        this.physics.world.bounds.width,
        this.physics.world.bounds.height,
        "ground-wood"
      )
      .setOrigin(0)
      .setTileScale(0.15);

    const anims = this.anims;
    anims.create({
      key: "misa-left-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-left-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-right-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-right-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-front-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-front-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-back-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-back-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.cameras.main
      .setZoom(2)
      .setBounds(
        0,
        0,
        this.physics.world.bounds.width,
        this.physics.world.bounds.height
      );

    cursors = this.input.keyboard.createCursorKeys();

    socket.on("stateUpdate", (dataState: Record<string, PlayerData>) => {
      serverStateData = dataState;
      Object.entries(dataState).forEach(([id, playerData]) => {
        if (!gameState[id]) {
          if (socket.id !== id) {
            makeOffer(id);
          }
          gameState[id] = this.physics.add
            .sprite(playerData.x, playerData.y - 24, "atlas", "misa-front")
            .setCollideWorldBounds(true)
            .setSize(30, 40)
            .setOrigin(0)
            .setOffset(0, 24);
        }
      });
    });
  }

  update(time, delta) {
    let player = gameState[socket.id];

    if (!player) {
      return;
    }

    this.cameras.main.startFollow(player);

    const speed = 100;
    const prevVelocity = player.body.velocity.clone();

    const body = player.body as Phaser.Physics.Arcade.Body;

    // Stop any previous movement from the last frame
    body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
      body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
      body.setVelocityX(speed);
    }

    // Vertical movement
    if (cursors.up.isDown) {
      body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
      body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    body.velocity.normalize().scale(speed);

    // Update the animation last and give left/right animations precedence over up/down animations
    let facing = "";
    if (cursors.left.isDown) {
      facing = "west";
      player.anims.play("misa-left-walk", true);
    } else if (cursors.right.isDown) {
      facing = "east";
      player.anims.play("misa-right-walk", true);
    } else if (cursors.up.isDown) {
      facing = "north";
      player.anims.play("misa-back-walk", true);
    } else if (cursors.down.isDown) {
      facing = "south";
      player.anims.play("misa-front-walk", true);
    } else {
      player.anims.stop();
      // If we were moving, pick and idle frame to use
      if (prevVelocity.x < 0) {
        facing = "west";
        player.setTexture("atlas", "misa-left");
      } else if (prevVelocity.x > 0) {
        facing = "east";
        player.setTexture("atlas", "misa-right");
      } else if (prevVelocity.y < 0) {
        facing = "north";
        player.setTexture("atlas", "misa-back");
      } else if (prevVelocity.y > 0) {
        facing = "south";
        player.setTexture("atlas", "misa-front");
      }
    }

    const textures = {
      west: "misa-left",
      east: "misa-right",
      north: "misa-back",
      south: "misa-front",
    };
    Object.entries(gameState).forEach(([id, otherPlayer]) => {
      if (id === socket.id) {
        return;
      }
      if (!serverStateData[id]) {
        return;
      }
      otherPlayer.setX(serverStateData[id].x);
      otherPlayer.setY(serverStateData[id].y - 24);
      otherPlayer.setTexture(
        "atlas",
        textures[serverStateData[id].facing || "south"]
      );
    });

    if (time > lastUpdate + 33) {
      lastUpdate = time;
      if (body.x !== lastPos.x || body.y !== lastPos.y) {
        lastPos = {
          x: body.x,
          y: body.y,
          facing,
        };
        socket.emit("move", lastPos);
      }
    }

    if (time > lastGarbageColleted + 1000) {
      lastGarbageColleted = time;
      const players = Object.keys(serverStateData);
      const toDelete: string[] = [];
      Object.entries(gameState).forEach(([id, playerSprite]) => {
        if (!players.includes(id)) {
          toDelete.push(id);
        }
      });
      toDelete.forEach((id) => {
        gameState[id].destroy();
        delete gameState[id];
      });
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    parent: "gameScene",
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
    width: "100%",
    height: "100%",
  },
  backgroundColor: "#000",
  scene: GameScene,
  banner: {
    hidePhaser: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: process.env.NODE_ENV === "development",
      height: 1000,
      width: 1000,
    },
  },
});

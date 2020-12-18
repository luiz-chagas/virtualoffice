import Phaser from "phaser";
import { connectToServer } from "./socket";
import { setupHandlers } from "./voice";
interface PlayerData {
  id: string;
  x: number;
  y: number;
  avatar: string;
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
let isInitialData = true;

const DIR_FRAMES = {
  west: 4,
  east: 8,
  north: 12,
  south: 0,
};
const SPEED = 125;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
    Phaser.Scene.call(this, { key: "gameScene", active: true });
  }

  preload() {
    this.load.image(
      "furniture",
      "assets/world/d3f7sm6-00fc3673-65fd-4ca5-9fc5-f61783440edf.png"
    );
    this.load.image(
      "furniture2",
      "assets/world/darwtlj-dda4428b-1a3f-422e-81c5-f7844b267d68.png"
    );
    this.load.image(
      "ground",
      "assets/world/d4becnf-37d112e7-aaf7-4c8d-9568-b474d452c114.png"
    );
    this.load.tilemapTiledJSON("map", "assets/world/LoftMap.json");
    this.load.spritesheet("player1", "assets/player/char1.png", {
      frameWidth: 68,
      frameHeight: 72,
    });
    this.load.spritesheet("player2", "assets/player/char2.png", {
      frameWidth: 68,
      frameHeight: 72,
    });
    this.load.spritesheet("player3", "assets/player/char3.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("player4", "assets/player/char4.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    const map = this.make.tilemap({ key: "map" });
    const groundTileset = map.addTilesetImage("Ground", "ground");
    const furnitureTileset = map.addTilesetImage("Furniture", "furniture");
    const furniture2Tileset = map.addTilesetImage("Furniture2", "furniture2");
    const floorLayer = map.createStaticLayer("Floor", groundTileset);
    const wallsLayer = map.createStaticLayer("Walls", groundTileset);
    wallsLayer.setCollisionByProperty({ collides: true });
    const objectsLayer = map.createStaticLayer("Objects", furniture2Tileset);
    objectsLayer.setDepth(10);
    const furnitureLayer = map.createStaticLayer("Furniture", [
      furnitureTileset,
      furniture2Tileset,
    ]);
    furnitureLayer.setCollisionByProperty({ collides: true });

    const animationManager = this.anims;
    registerAnimations("player1", animationManager);
    registerAnimations("player2", animationManager);
    registerAnimations("player3", animationManager);
    registerAnimations("player4", animationManager);

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
          gameState[id] = this.physics.add
            .sprite(playerData.x, playerData.y, playerData.avatar, 0)
            .setCollideWorldBounds(true)
            .setDisplaySize(30, 30)
            .setOrigin(0);
          if (isInitialData) {
            if (id === socket.id) {
              this.physics.add.collider(gameState[id], wallsLayer);
              this.physics.add.collider(gameState[id], furnitureLayer);
            }
            if (id !== socket.id) {
              makeOffer(id);
            }
          }
        }
      });
      isInitialData = false;
    });
  }

  update(time, delta) {
    let player = gameState[socket.id];
    const myData = serverStateData[socket.id];

    if (!player) {
      return;
    }

    this.cameras.main.startFollow(player);

    const prevVelocity = player.body.velocity.clone();

    const body = player.body as Phaser.Physics.Arcade.Body;

    // Stop any previous movement from the last frame
    body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
      body.setVelocityX(-SPEED);
    } else if (cursors.right.isDown) {
      body.setVelocityX(SPEED);
    }

    // Vertical movement
    if (cursors.up.isDown) {
      body.setVelocityY(-SPEED);
    } else if (cursors.down.isDown) {
      body.setVelocityY(SPEED);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    body.velocity.normalize().scale(SPEED);

    // Update the animation last and give left/right animations precedence over up/down animations
    let facing = "";
    if (cursors.left.isDown) {
      facing = "west";
      player.anims.play(`${myData.avatar}-left-walk`, true);
    } else if (cursors.right.isDown) {
      facing = "east";
      player.anims.play(`${myData.avatar}-right-walk`, true);
    } else if (cursors.up.isDown) {
      facing = "north";
      player.anims.play(`${myData.avatar}-back-walk`, true);
    } else if (cursors.down.isDown) {
      facing = "south";
      player.anims.play(`${myData.avatar}-front-walk`, true);
    } else {
      player.anims.stop();
      // If we were moving, pick and idle frame to use
      if (prevVelocity.x < 0) {
        facing = "west";
        player.setTexture(myData.avatar, DIR_FRAMES.west);
      } else if (prevVelocity.x > 0) {
        facing = "east";
        player.setTexture(myData.avatar, DIR_FRAMES.east);
      } else if (prevVelocity.y < 0) {
        facing = "north";
        player.setTexture(myData.avatar, DIR_FRAMES.north);
      } else if (prevVelocity.y > 0) {
        facing = "south";
        player.setTexture(myData.avatar, DIR_FRAMES.south);
      }
    }

    Object.entries(gameState).forEach(([id, otherPlayer]) => {
      const err = 3;
      let isMoving = false;
      if (id === socket.id) {
        return;
      }
      if (!serverStateData[id]) {
        return;
      }
      otherPlayer.setVelocity(0);
      if (otherPlayer.x < serverStateData[id].x - err) {
        otherPlayer.setVelocityX(SPEED);
        if (!isMoving) {
          otherPlayer.anims.play(
            `${serverStateData[id].avatar}-right-walk`,
            true
          );
        }
        isMoving = true;
      } else if (otherPlayer.x > serverStateData[id].x + err) {
        otherPlayer.setVelocityX(-SPEED);
        if (!isMoving) {
          otherPlayer.anims.play(
            `${serverStateData[id].avatar}-left-walk`,
            true
          );
        }
        isMoving = true;
      }
      if (otherPlayer.y > serverStateData[id].y + err) {
        otherPlayer.setVelocityY(-SPEED);
        if (!isMoving) {
          otherPlayer.anims.play(
            `${serverStateData[id].avatar}-back-walk`,
            true
          );
        }
        isMoving = true;
      } else if (otherPlayer.y < serverStateData[id].y - err) {
        otherPlayer.setVelocityY(SPEED);
        if (!isMoving) {
          otherPlayer.anims.play(
            `${serverStateData[id].avatar}-front-walk`,
            true
          );
        }
        isMoving = true;
      }
      if (!isMoving) {
        otherPlayer.anims.stop();
        if (serverStateData[id].facing) {
          otherPlayer.setTexture(
            serverStateData[id].avatar,
            DIR_FRAMES[serverStateData[id].facing]
          );
        }
      }
      body.velocity.normalize().scale(SPEED);
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
      height: 640,
      width: 960,
    },
  },
});

const registerAnimations = (
  name: string,
  manager: Phaser.Animations.AnimationManager
) => {
  manager.create({
    key: `${name}-left-walk`,
    frames: manager.generateFrameNames(name, {
      start: 4,
      end: 7,
    }),
    frameRate: 10,
    repeat: -1,
  });
  manager.create({
    key: `${name}-right-walk`,
    frames: manager.generateFrameNames(name, {
      start: 8,
      end: 11,
    }),
    frameRate: 10,
    repeat: -1,
  });
  manager.create({
    key: `${name}-front-walk`,
    frames: manager.generateFrameNames(name, {
      start: 0,
      end: 3,
    }),
    frameRate: 10,
    repeat: -1,
  });
  manager.create({
    key: `${name}-back-walk`,
    frames: manager.generateFrameNames(name, {
      start: 12,
      end: 15,
    }),
    frameRate: 10,
    repeat: -1,
  });
};

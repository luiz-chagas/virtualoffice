import Phaser from "phaser";
import { HUDScene } from "./HUD";
import { connectToServer, spawn } from "./socket";
import { PlayerData } from "./types/PlayerData";
import {
  setupHandlers,
  removeStreamFromDOM,
  addSelfVideoToDom,
  demoteAllToAudio,
  demoteToAudio,
  promoteToVideo,
  changeVolume,
} from "./RTC";
import { LocalPlayer, RemotePlayer } from "./models/player";
import { DIR_FRAMES, PLAYER_SPEED } from "./utils/contants";

let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
let lastUpdate = -Infinity;
let lastGarbageColleted = -Infinity;
let lastPos = { x: 0, y: 0, facing: "south" };
let facing = "south";
let conferenceRoom: Phaser.Types.Physics.Arcade.GameObjectWithBody | null = null;
let isFirstServerUpdate = true;

const gameState: Record<string, Phaser.Physics.Arcade.Sprite> = {};
let serverStateData: Record<string, PlayerData> = {};
const { socket } = connectToServer();
const { connectToRTC } = setupHandlers(socket);

class GameScene extends Phaser.Scene {
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
    this.load.image("furniture3", "assets/world/more-furniture.png");
    this.load.image(
      "ground",
      "assets/world/d4becnf-37d112e7-aaf7-4c8d-9568-b474d452c114.png"
    );
    this.load.image("medieval", "assets/world/medieval.png");
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
    const furniture3Tileset = map.addTilesetImage("Furniture3", "furniture3");
    const medievalTileset = map.addTilesetImage("Medieval", "medieval");
    map
      .createLayer("Floor", groundTileset)
      .setCollisionByProperty({ collides: true });
    map
      .createLayer("Walls", medievalTileset)
      .setCollisionByProperty({ collides: true });
    map
      .createLayer("Objects", [furniture2Tileset, furniture3Tileset])
      .setCollisionByProperty({ collides: true })
      .setDepth(1);
    map
      .createLayer("Furniture2", [furnitureTileset, furniture2Tileset])
      .setCollisionByProperty({ collides: true });
    map
      .createLayer("Furniture", [
        furnitureTileset,
        furniture2Tileset,
        furniture3Tileset,
      ])
      .setCollisionByProperty({ collides: true });

    const spawnPoints = map.filterObjects(
      "Loft Spawns",
      (obj) => obj.type === "SpawnPoint"
    );
    const playerSpawnPoint =
      spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    spawn(socket, (playerSpawnPoint as any).x, (playerSpawnPoint as any).y);

    const conferenceRooms = map.filterObjects(
      "Conference Rooms",
      (obj) => obj.type === "ConferenceRoom"
    );
    const conferenceRoomObjs = map
      .createFromObjects("Conference Rooms", {})
      .map((room, index) => {
        (room as Phaser.GameObjects.Sprite)
          .setOrigin(0, 0)
          .setVisible(false)
          .setPosition(conferenceRooms[index].x, conferenceRooms[index].y);
        this.physics.add.existing(room);
        return room;
      });

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

    const handlePlayerInConferenceRoom: ArcadePhysicsCallback = (
      player,
      room
    ) => {
      if (conferenceRoom !== room) {
        // console.log(`Player has joined ${room.name}`);
        conferenceRoom = room;
        addSelfVideoToDom(socket.id);
      }
    };

    socket.on("stateUpdate", (dataState: Record<string, PlayerData>) => {
      serverStateData = dataState;
      this.events.emit("updatePlayerCount", Object.keys(dataState).length);
      Object.entries(dataState).forEach(([id, playerData]) => {
        // Handling player creation
        if (!gameState[id]) {
          if (id === socket.id) {
            gameState[id] = new LocalPlayer(this, map, playerData);
            this.cameras.main.startFollow(gameState[id]);
            conferenceRoomObjs.forEach((room) => {
              this.physics.add.overlap(
                gameState[id],
                room,
                handlePlayerInConferenceRoom,
                null,
                null
              );
            });
          } else {
            gameState[id] = new RemotePlayer(this, playerData);
            if (isFirstServerUpdate) {
              connectToRTC(id);
            }
          }
        } else {
          if (id !== socket.id) {
            // Update Remote Player Position
            (gameState[id] as RemotePlayer).setNewData(playerData);

            // Remove Player Audio/Video Volume
            if (playerData.room || conferenceRoom) {
              if (playerData.room === conferenceRoom?.name) {
                changeVolume(id, 1);
                promoteToVideo(id);
              } else {
                changeVolume(id, 0);
                demoteToAudio(id);
              }
            } else {
              if (gameState[socket.id]) {
                const dist = getDistanceBetweenPlayers(
                  gameState[socket.id],
                  playerData
                );
                if (dist < 150) {
                  changeVolume(id, 1);
                } else if (dist > 350) {
                  changeVolume(id, 0);
                } else {
                  changeVolume(id, -0.005 * dist + 1.75);
                }
              }
            }
          }
        }
      });
      isFirstServerUpdate = false;
    });
  }

  update(time: number) {
    const player = gameState[socket.id];
    const myData = serverStateData[socket.id];

    if (!player) {
      return;
    }

    if (conferenceRoom) {
      if (!this.physics.overlap(conferenceRoom, player)) {
        // console.log(`Player has left the room`);
        conferenceRoom = null;
        removeStreamFromDOM(socket.id);
        demoteAllToAudio();
      }
    }

    const body = player.body as Phaser.Physics.Arcade.Body;

    // Stop any previous movement from the last frame
    body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
      body.setVelocityX(-PLAYER_SPEED);
    } else if (cursors.right.isDown) {
      body.setVelocityX(PLAYER_SPEED);
    }

    // Vertical movement
    if (cursors.up.isDown) {
      body.setVelocityY(-PLAYER_SPEED);
    } else if (cursors.down.isDown) {
      body.setVelocityY(PLAYER_SPEED);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    body.velocity.normalize().scale(PLAYER_SPEED);

    // IF player is moving, change videos opacity
    if (body.velocity.x !== 0 || body.velocity.y !== 0) {
      document.getElementById("videos").className = "translucent";
    } else {
      document.getElementById("videos").className = "";
    }

    // Update the animation last and give left/right animations precedence over up/down animations
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
      player.setTexture(myData.avatar, DIR_FRAMES[facing]);
    }

    Object.values(gameState).forEach((sprite) => sprite.update());

    if (time > lastUpdate + 33) {
      lastUpdate = time;
      if (body.x !== lastPos.x || body.y !== lastPos.y) {
        lastPos = {
          x: body.x,
          y: body.y,
          facing,
        };
        socket.emit("move", { ...lastPos, room: conferenceRoom?.name ?? null });
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
        gameState[id].getData("name").setVisible(false);
        gameState[id].destroy();
        removeStreamFromDOM(id);
        delete gameState[id];
      });
    }
  }
}

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

interface WithXAndY {
  x: number;
  y: number;
}
const getDistanceBetweenPlayers = (player1: WithXAndY, player2: WithXAndY) =>
  Math.sqrt(
    Math.pow(player1.x - player2.x, 2) + Math.pow(player1.y - player2.y, 2)
  );

new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    parent: "game",
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
    width: "100%",
    height: "100%",
  },
  backgroundColor: "#000",
  scene: [GameScene, HUDScene],
  banner: {
    hidePhaser: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: process.env.NODE_ENV === "development",
      height: 704,
      width: 992,
    },
  },
});

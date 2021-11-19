import Phaser from "phaser";
import { HUDScene } from "./HUD";
import { connectToServer, spawn } from "./socket";
import { PlayerData } from "./types/PlayerData";
import { setupHandlers } from "./RTC";
import { LocalPlayer, RemotePlayer } from "./models/player";
import { DIR_FRAMES } from "./utils/contants";
import { muteVoice, unmuteVoice } from "./stream";
import { registerAnimations } from "./animations";
import { getDistanceBetweenPoints } from "./utils/getDistanceBetweenPoints";
import {
  addSelfVideoToDom,
  changeVolume,
  makeAllAudio,
  removeFromDOM,
  turnAudioIntoVideo,
  turnVideoIntoAudio,
} from "./DOM";
import { loadStorage } from "./loadStorage";

let lastUpdate = -Infinity;
let lastGarbageColleted = -Infinity;
let lastPos = { x: 0, y: 0, facing: "south" };
let facing = "south";

let isFirstServerUpdate = true;

// let conferenceRoom: Phaser.Types.Physics.Arcade.GameObjectWithBody | null = null;
// let muteSpot: Phaser.Types.Physics.Arcade.GameObjectWithBody | null = null;

const gameState: Record<string, Phaser.Physics.Arcade.Sprite> = {};
let serverStateData: Record<string, PlayerData> = {};
const { socket } = connectToServer();
const { connectToRTC } = setupHandlers(socket);
const world = loadStorage("world");

class GameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
    Phaser.Scene.call(this, { key: "gameScene", active: true });
  }

  preload() {
    this.load.image("furniture", "assets/world/furniture-1.png");
    this.load.image("furniture2", "assets/world/furniture-2.png");
    this.load.image("furniture3", "assets/world/furniture-3.png");
    this.load.image("ground", "assets/world/ground.png");
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
        medievalTileset,
      ])
      .setCollisionByProperty({ collides: true });

    const spawnPoints = map.filterObjects(
      "Loft Spawns",
      (obj) => obj.type === "SpawnPoint"
    );
    const playerSpawnPoint =
      spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    spawn(socket, (playerSpawnPoint as any).x, (playerSpawnPoint as any).y);

    // const conferenceRooms = map.filterObjects(
    //   "Conference Rooms",
    //   (obj) => obj.type === "ConferenceRoom"
    // );

    // const conferenceRoomObjs = map
    //   .createFromObjects("Conference Rooms", {})
    //   .map((room, index) => {
    //     (room as Phaser.GameObjects.Sprite)
    //       .setOrigin(0, 0)
    //       .setVisible(false)
    //       .setPosition(conferenceRooms[index].x, conferenceRooms[index].y);
    //     this.physics.add.existing(room);
    //     const roomBounds = (room as Phaser.GameObjects.Sprite).getBounds();
    //     this.add.graphics().lineStyle(1, 0x0e71eb).strokeRectShape(roomBounds);

    //     return room;
    //   });

    // const muteSpots = map.filterObjects(
    //   "Mute Areas",
    //   (obj) => obj.type === "MuteSpot"
    // );

    // const muteSpotObjs = map
    //   .createFromObjects("Mute Areas", {})
    //   .map((spot, index) => {
    //     (spot as Phaser.GameObjects.Sprite)
    //       .setOrigin(0, 0)
    //       .setVisible(false)
    //       .setPosition(muteSpots[index].x, muteSpots[index].y);
    //     this.physics.add.existing(spot);
    //     const spotBounds = (spot as Phaser.GameObjects.Sprite).getBounds();
    //     this.add.graphics().lineStyle(1, 0xe02828).strokeRectShape(spotBounds);

    //     return spot;
    //   });

    const animationManager = this.anims;
    registerAnimations("player1", animationManager);
    registerAnimations("player2", animationManager);
    registerAnimations("player3", animationManager);
    registerAnimations("player4", animationManager);

    this.cameras.main
      .setZoom(1.7)
      .setBounds(
        0,
        0,
        this.physics.world.bounds.width,
        this.physics.world.bounds.height
      );

    // const handlePlayerInConferenceRoom: ArcadePhysicsCallback = (
    //   player,
    //   room
    // ) => {
    //   if (conferenceRoom !== room) {
    //     // console.log(`Player has joined ${room.name}`);
    //     conferenceRoom = room;
    //     addSelfVideoToDom(socket.id);
    //   }
    // };

    // const handlePlayerInMuteSpot: ArcadePhysicsCallback = (player, spot) => {
    //   if (muteSpot !== spot) {
    //     // console.log(`Player is now muted`);
    //     muteVoice();
    //     this.events.emit("playerMuted", true);
    //     muteSpot = spot;
    //   }
    // };

    socket.on("stateUpdate", (dataState: Record<string, PlayerData>) => {
      serverStateData = Object.fromEntries(
        Object.entries(dataState).filter(
          ([_id, playerData]) => playerData.world === world
        )
      );
      this.events.emit("playerCount", Object.keys(serverStateData).length);
      Object.entries(serverStateData).forEach(([id, playerData]) => {
        if (playerData.world !== world) return;
        // Handling player creation
        if (!gameState[id]) {
          if (id === socket.id) {
            gameState[id] = new LocalPlayer(this, map, playerData);
            this.cameras.main.startFollow(gameState[id]);
            addSelfVideoToDom(socket.id);
            // conferenceRoomObjs.forEach((room) => {
            //   this.physics.add.overlap(
            //     gameState[id],
            //     room,
            //     handlePlayerInConferenceRoom,
            //     undefined,
            //     null
            //   );
            // });
            // muteSpotObjs.forEach((spot) => {
            //   this.physics.add.overlap(
            //     gameState[id],
            //     spot,
            //     handlePlayerInMuteSpot,
            //     undefined,
            //     null
            //   );
            // });
          } else {
            gameState[id] = new RemotePlayer(this, playerData);
            if (isFirstServerUpdate) {
              connectToRTC(id);
            }
          }
        } else {
          if (id !== socket.id) {
            // Update Remote Player Position
            (gameState[id] as RemotePlayer)?.setNewData(playerData);

            // Remove Player Audio/Video Volume
            // if (playerData.room || conferenceRoom) {
            //   if (playerData.room === conferenceRoom?.name) {
            //     changeVolume(id, 1);
            //     turnAudioIntoVideo(id);
            //   } else {
            //     changeVolume(id, 0);
            //     turnVideoIntoAudio(id);
            //   }
            // } else {
            if (gameState[socket.id]) {
              const dist = getDistanceBetweenPoints(
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
            // }
          }
        }
      });
      isFirstServerUpdate = false;
    });
  }

  update(time: number) {
    Object.values(gameState).forEach((sprite) => sprite.update());

    const player = gameState[socket.id];
    const myData = serverStateData[socket.id];
    const body = player?.body;

    if (!player) {
      return;
    }

    // if (conferenceRoom) {
    //   if (!this.physics.overlap(conferenceRoom, player)) {
    //     // console.log(`Player has left the room`);
    //     conferenceRoom = null;
    //     removeFromDOM(socket.id);
    //     makeAllAudio();
    //   }
    // }

    // if (muteSpot) {
    //   if (!this.physics.overlap(muteSpot, player)) {
    //     // console.log(`Player has left the room`);
    //     muteSpot = null;
    //     this.events.emit("playerMuted", false);
    //     unmuteVoice();
    //   }
    // }

    // IF player is moving, change videos opacity
    if (body.velocity.x !== 0 || body.velocity.y !== 0) {
      document.getElementById("videos")!.className = "translucent";
    } else {
      document.getElementById("videos")!.className = "";
    }

    // Update the animation last and give left/right animations precedence over up/down animations
    if (body.velocity.x < 0) {
      facing = "west";
    } else if (body.velocity.x > 0) {
      facing = "east";
    } else if (body.velocity.y < 0) {
      facing = "north";
    } else if (body.velocity.y > 0) {
      facing = "south";
    } else {
      player.setTexture(myData.avatar, DIR_FRAMES[facing]);
    }

    if (time > lastUpdate + 33) {
      lastUpdate = time;
      if (body.x !== lastPos.x || body.y !== lastPos.y) {
        lastPos = {
          x: body.x,
          y: body.y,
          facing,
        };
        socket.emit("move", {
          ...lastPos,
          room: /*conferenceRoom?.name ??*/ null,
        });
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
        removeFromDOM(id);
        delete gameState[id];
      });
    }
  }
}

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
      height: 60 * 16,
      width: 130 * 16,
      fixedStep: false,
      fps: loadStorage("fps") ?? 30,
    },
  },
  fps: {
    target: loadStorage("fps") ?? 30,
  },
});

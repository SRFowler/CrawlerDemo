import Player from './player.js'
import TILES from './tile-mapping.js'
import TilemapVisibility from "./tilemap-visibility.js";

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super();
    this.level = 0;
  }
  
  preload() {
    this.load.image('tiles', './assets/tilesets/Dungeon_Tileset.png');
    this.load.spritesheet(
      "characters",
      "./assets/images/priest.png",
      {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    );
  }

  create() {
    this.level++;
    this.hasPlayerReachedStairs = false;

    // Generate a dungeon with extra options:
    //  - Rooms should only have odd dimensons os they have a center tile
    //  - Doors should be at least 2 tiles from the corners to allow space for corner tiles
    this.dungeon = new Dungeon({
      width: 50,
      height: 50,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true },
        maxRooms: 12
      }
    });

    // create a blank tilemap with dimensions matching the dungeon
    const map = this.make.tilemap({
      tileWidth: 16,
      tileHeight: 16,
      width : this.dungeon.width,
      height: this.dungeon.height
    });
    // tilesetName, key, width, height, margin, spacing
    const tileset = map.addTilesetImage('tiles', null, 16, 16, 0, 0);

    this.groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
    this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);
    this.itemsLayer = map.createBlankDynamicLayer("Items", tileset);
    const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);
    this.tilemapVisibility = new TilemapVisibility(shadowLayer);

    // Use the aray of rooms generated to place tiles in the map
    // Note: using an arrow function here so that "this" still refers to our scene
    this.dungeon.rooms.forEach(room => {
      // These room properties are all in grid, not pixel, units
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the room (minus the walls) with mostly clean floor tiles (90% of the time), but
      // select a dirty tile the other 10% of the time
      // weightedRandomize first 4 paramaters are area (x, y, width, height) and last is weights
      this.groundLayer.weightedRandomize(x + 1, y + 1, width - 2, height - 2, TILES.FLOOR );

      // Place the room corner tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

      // Fill the walls with mostly clean tiles
      this.groundLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP);
      this.groundLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM);
      this.groundLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT);
      this.groundLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT);

      // Dungeons have rooms connected by doors. Each door has an x & y relative to the room's
      // location. Each direction has a different door to tile mapping
      var doors = room.getDoorLocations();  // Returns an array of {x, y} objects
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) { // Dealing with a top door
          this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x -1, y + doors[i].y)
        } else if (doors[i].y === room.height - 1) {  // Bottom Door
          this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x -1, y + doors[i].y)
        } else if (doors[i].x === 0) {  // Left Door
          this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
        } else if (doors[i].x === room.width - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
        }
      }

    });
    
    // Seperate out the rooms into;
    //  - The starting room (index 0)
    //  - A random room to be designated as the end room with only an exit
    //  - An array of 90% remaining rooms for placing random stuff
    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms)
      .slice(0, rooms.length * 0.9);

    // Place the stairs
    this.itemsLayer.putTileAt(TILES.STAIRS, endRoom.centerX, endRoom.centerY);

    // Place decoration in rooms
    rooms.forEach(room => {
      var rand = Math.random();
      if (rand <= 0.60) {
        // Randomly place some ground decorative but not interactive item in 60% of rooms
        const x = Phaser.Math.Between(room.left + 2, room.right - 2);
        const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
        this.stuffLayer.weightedRandomize(x, y, 1, 1, TILES.STUFF);
      }
    });

    // Place items in the 90% "otherRooms"
    otherRooms.forEach(room => {
      var rand = Math.random();
      if (rand <= 0.25) {
        // 25% chance of chest
        this.itemsLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY);
      } else if (rand <= 0.70) {
        // 50% chance of pot anywhere in the room except for near the door
        const x = Phaser.Math.Between(room.left + 2, room.right - 2);
        const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
        this.itemsLayer.weightedRandomize(x, y, 1, 1, TILES.POT);
      }
    });
    
    // Build an array of floor tiles from the tile-mapping floor index entries to avoid hard coding
    // values. Initilize with -1 for empty tiles just to be safe. 
    let floorTiles = [-1];
    for (let i = 0; i < TILES.FLOOR.length; i++) {
      floorTiles = floorTiles.concat(TILES.FLOOR[i]["index"])
    }

    this.groundLayer.setCollisionByExclusion(floorTiles);
    this.itemsLayer.setCollisionByExclusion([-1, TILES.STAIRS]);

    // Set upa callback to run whenever an arcadebody intersects a given tile index
    // Will need to change when enemies are added
    // DynamicTilemapLayer.setTileIndexCallback(index, callback, callbackContext)
    this.itemsLayer.setTileIndexCallback(TILES.STAIRS, () => {
      this.itemsLayer.setTileIndexCallback(TILES.STAIRS, null);
      this.hasPlayerReachedStairs = true;
      this.player.freeze();
      const cam = this.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
        this.player.destroy();
        this.scene.restart();
      });
    });

    // Place the player in the center of the map. Dungeon generator places the first room in
    // the center of the map
    const playerRoom = startRoom;
    const x = map.tileToWorldX(playerRoom.centerX);
    const y = map.tileToWorldY(playerRoom.centerY);
    this.player = new Player(this, x, y);

    // Watch the player and layer for collision
    this.physics.add.collider(this.player.sprite, this.groundLayer)
    this.physics.add.collider(this.player.sprite, this.itemsLayer)

    // Get the camera and put it on the player
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, `Find the stairs. Go deeper.\nCurrent level: ${this.level}`, {
        font: "12px monospace",
        fill: "#000000",
        padding: { x: 2, y: 1 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);
  }

  update() {
    if (this.hasPlayerReachedStairs) return;
    this.player.update()

    // Find the player's room using another helper method from the dungon that converts from
    // dungeon XY (in grid units) to the corresponding room instance
    const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
    const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

    this.tilemapVisibility.setActiveRoom(playerRoom);
  }
}
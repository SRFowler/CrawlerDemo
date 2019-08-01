import DungeonScene from './dungeon-scene.js';

const config = {
  backgroundColor: '#000',
  scale: {
    parent: 'game-container',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 320,
    height: 240,
    zoom: 2
  },
  pixelArt: true,
  // Hide the Phaser banner from the console
  banner: false,
  scene: DungeonScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {y: 0}
    }
  }
};

const game = new Phaser.Game(config)
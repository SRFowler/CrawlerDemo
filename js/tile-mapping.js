// Mapping with:
//  - Single index for putTileAt
//  - Array of weight for weightedRandomize
//  - Array or 2D array or putTilesAt
const TILE_MAPPING = {
  BLANK: 78,
  WALL: {
    TOP_LEFT: 0,
    TOP_RIGHT: 5,
    BOTTOM_RIGHT: 45,
    BOTTOM_LEFT: 40,
    // Let's add some randomization to the walls
    TOP: [{ index: 1, weight: 2}, { index: [2, 3, 4], weight: 1}],
    LEFT: [{ index: 10, weight: 4}, { index: [20, 30], weight: 1}],
    RIGHT: [{ index: 15, weight: 4}, { index: [25, 35], weight: 1}],
    BOTTOM: [{ index: 41, weight: 4}, { index: [42, 43, 44], weight: 1}]
  },
  FLOOR: [{ index: 79, weight: 9}, { index: [6, 7, 8, 9], weight: 1}],
  STUFF: [{index: 68, weight: 3}, { index: 77, weight: 1 }, { index: 49, weight: 1 }, { index: 59, weight: 5 }],
  DOOR: {
    TOP: [3, 79, 1],
    LEFT: [[52], [79], [55]],
    BOTTOM: [53, 79, 50],
    RIGHT: [[52], [79], [50]]
  },
  CHEST: 83,
  STAIRS: 39,
};

export default TILE_MAPPING;
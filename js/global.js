const floorCanvas = document.getElementById('floorCanvas');
const canvasContainer = document.getElementById('canvas-container');
const fileInput = document.getElementById('fileInput');
const loadFileButton = document.getElementById('loadFileButton');
const addRowButton = document.getElementById('addRowButton');
const addBoardButton = document.getElementById('addBoardButton');
const fullCompleteButton = document.getElementById('fullCompleteButton');
const boardCostInput = document.getElementById('boardCostInput');
const totalCostValue = document.getElementById('totalCostValue');
const showNumbersCheckbox = document.getElementById('showNumbersCheckbox');
const customArrangeBoardOffsetInput = document.getElementById('customArrangeBoardOffsetInput');
const customArrangeBoardOffsetValue = document.getElementById('customArrangeBoardOffsetValue');
const heightInput = document.getElementById('heightInput');
const widthInput = document.getElementById('widthInput');
const boardWidthOffsetInput = document.getElementById('boardWidthOffsetInput');
const boardWidthOffsetValue = document.getElementById('boardWidthOffsetValue');
const boardHeightOffsetInput = document.getElementById('boardHeightOffsetInput');
const boardHeightOffsetValue = document.getElementById('boardHeightOffsetValue');
const minBoardHeightInput = document.getElementById('minBoardHeightInput');
const doNotUseSmallRemainingsCheckbox = document.getElementById('doNotUseSmallRemainingsCheckbox');
const totalNumberOfBoardsValue = document.getElementById('totalNumberOfBoardsValue');
const totalFloorSquareValue = document.getElementById('totalFloorSquareValue');
const totalSquareOfBoardsValue = document.getElementById('totalSquareOfBoardsValue');
const totalRemainingSquareValue = document.getElementById('totalRemainingSquareValue');
const arrangeModeSelect = document.getElementById('arrangeModeSelect');

let selectedCorner = null;
let floorPlanBounds = null;
let floorPlanLines = [];
let cornerPoints = [];

let rows = [];
let boardHeight = null;
let boardWidth = null;
let boardWidthOffset = 0;
let boardHeightOffset = 0;
let minBoardHeight = null;
let boardCost = 100;
let showNumbers = true;

function reset() {
  rows = [];
  boardHeight = parseFloat(heightInput.value);
  boardWidth = parseFloat(widthInput.value);
  boardWidthOffset = parseFloat(boardWidthOffsetInput.value);
  boardHeightOffset = parseFloat(boardHeightOffsetInput.value);
  minBoardHeight = parseFloat(minBoardHeightInput.value);
  boardCost = parseFloat(boardCostInput.value);
  showNumbers = showNumbersCheckbox.checked;
}



function findRowDirection() {
  if (selectedCorner.x === floorPlanBounds.minX && selectedCorner.y === floorPlanBounds.minY) {
    return 'up';
  }

  if (selectedCorner.x === floorPlanBounds.minX && selectedCorner.y === floorPlanBounds.maxY) {
    return 'right';
  }

  if (selectedCorner.x === floorPlanBounds.maxX && selectedCorner.y === floorPlanBounds.minY) {
    return 'left';
  }

  if (selectedCorner.x === floorPlanBounds.maxX && selectedCorner.y === floorPlanBounds.maxY) {
    return 'down';
  }
}
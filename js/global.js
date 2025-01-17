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
const lengthInput = document.getElementById('lengthInput');
const widthInput = document.getElementById('widthInput');
const boardWidthOffsetInput = document.getElementById('boardWidthOffsetInput');
const boardWidthOffsetValue = document.getElementById('boardWidthOffsetValue');
const boardLengthOffsetInput = document.getElementById('boardLengthOffsetInput');
const boardLengthOffsetValue = document.getElementById('boardLengthOffsetValue');
const minboardLengthInput = document.getElementById('minboardLengthInput');
const doNotUseSmallRemainingsCheckbox = document.getElementById('doNotUseSmallRemainingsCheckbox');
const totalNumberOfBoardsValue = document.getElementById('totalNumberOfBoardsValue');
const totalFloorSquareValue = document.getElementById('totalFloorSquareValue');
const totalSquareOfBoardsValue = document.getElementById('totalSquareOfBoardsValue');
const totalRemainingSquareValue = document.getElementById('totalRemainingSquareValue');
const arrangeModeSelect = document.getElementById('arrangeModeSelect');

const rotateBy45Button = document.getElementById('rotateBy45');
const addALineButton = document.getElementById('addALine');
const addARectangleButton = document.getElementById('addARectangle');
const exportButton = document.getElementById('exportButton');

const addALineModalElement = document.getElementById('addALineModal');
const addALineStartXInput = document.getElementById('addALineStartX');
const addALineStartYInput = document.getElementById('addALineStartY');
const addALineEndXInput = document.getElementById('addALineEndX');
const addALineEndYInput = document.getElementById('addALineEndY');
const addALineModal = new bootstrap.Modal('#addALineModal', {
  keyboard: false
})

const addARectangleModalElement = document.getElementById('addARectangleModal');
const addARectangleStartXInput = document.getElementById('addARectangleStartX');
const addARectangleStartYInput = document.getElementById('addARectangleStartY');
const addARectangleEndXInput = document.getElementById('addARectangleEndX');
const addARectangleEndYInput = document.getElementById('addARectangleEndY');
const addARectangleModal = new bootstrap.Modal('#addARectangleModal', {
  keyboard: false
})

let floorPlanBounds = null;
let originalFloorPlanLines = [];
let floorPlanLines = [];
let currentRotateAngle = 0;
let rows = [];
let boardLength = null;
let boardWidth = null;
let boardWidthOffset = 0;
let boardLengthOffset = 0;
let minboardLength = null;
let boardCost = 100;
let showNumbers = true;

function reset() {
  rows = [];
  boardLength = parseFloat(lengthInput.value);
  boardWidth = parseFloat(widthInput.value);
  boardWidthOffset = parseFloat(boardWidthOffsetInput.value);
  boardLengthOffset = parseFloat(boardLengthOffsetInput.value);
  minboardLength = parseFloat(minboardLengthInput.value);
  boardCost = parseFloat(boardCostInput.value);
  showNumbers = showNumbersCheckbox.checked;
}

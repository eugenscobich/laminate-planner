// script.js

// Get references to DOM elements
const fileInput = document.getElementById('fileInput');
const loadFileButton = document.getElementById('loadFileButton');
const floorCanvas = document.getElementById('floorCanvas');
const addRow = document.getElementById('addRow');
const addBoard = document.getElementById('addBoard');
const fullComplete = document.getElementById('fullComplete');

const heightInput = document.getElementById('heightInput');
const widthInput = document.getElementById('widthInput');
const boardOffsetInput = document.getElementById('boardOffsetInput');
const boardOffsetValue = document.getElementById('boardOffsetValue');
const boardInitialCutInput = document.getElementById('boardInitialCutInput');
const boardInitialCutValue = document.getElementById('boardInitialCutValue');
const showNumbersCheckbox = document.getElementById('showNumbersCheckbox');
const doNotUseSmallRemaningsCheckbox = document.getElementById(
  'doNotUseSmallRemaningsCheckbox');
const minBoardRemainingsInput = document.getElementById(
  'minBoardRemainingsInput');
const remainingsValue = document.getElementById('remainingsValue');
const optimyseStartTheRow = document.getElementById('optimyseStartTheRow');

const fileTypeSelect = document.getElementById('fileTypeSelect');
const arrangeMode = document.getElementById('arrangeMode');

const canvasContainer = document.getElementById('canvas-container');
const ctx = floorCanvas.getContext('2d');

let isFloorPlanLoaded = false;
let scale = 1;
let selectedCorner = null;
let floorPlanBounds = null;

let floorPlanType = 'svg'; // Default type

// Variables for panning
let isPanning = false;
let wasMoving = false;
let panStart = {x: 0, y: 0};
let panOffset = {x: 0, y: 0};

// Variable to store intersection points
let cornerPoints = [];

// Variable to store floor plan lines
let floorPlanLines = []; // Array of line segments from the floor plan

// Get the viewport dimensions and set the canvas size
function resizeCanvas() {
  // Adjust the canvas size to fill the viewport
  const viewportWidth = window.innerWidth - 80;
  const viewportHeight = window.innerHeight - canvasContainer.offsetTop - 20; // Adjust for margins or other elements
  floorCanvas.width = viewportWidth;
  floorCanvas.height = viewportHeight;
}

// Call resizeCanvas on page load
resizeCanvas();

// Optionally, handle window resize
window.addEventListener('resize', () => {
  resizeCanvas();
  // You may need to adjust panOffset or scale here if desired
  drawCanvas();
});

// Function to load and parse SVG files
function loadSVGFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      // Parse SVG content
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(e.target.result, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Get dimensions
      let svgWidth = parseFloat(svgElement.getAttribute('width'));
      let svgHeight = parseFloat(svgElement.getAttribute('height'));

      // Handle units and viewBox
      if (isNaN(svgWidth) || isNaN(svgHeight)) {
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const viewBoxValues = viewBox.trim().split(/\s+|,/).map(
            v => parseFloat(v));
          if (viewBoxValues.length === 4) {
            svgWidth = viewBoxValues[2];
            svgHeight = viewBoxValues[3];
          }
        } else {
          alert('SVG does not have valid width/height or viewBox attributes.');
          return;
        }
      }

      // Resize canvas to viewport size
      resizeCanvas();

      // Calculate scale to fit SVG into canvas
      const canvasWidth = floorCanvas.width;
      const canvasHeight = floorCanvas.height;

      const scaleX = canvasWidth / svgWidth;
      const scaleY = canvasHeight / svgHeight;
      scale = Math.min(scaleX, scaleY);

      // Center the SVG
      panOffset.x = (canvasWidth - svgWidth * scale) / 2;
      panOffset.y = (canvasHeight - svgHeight * scale) / 2;

      isFloorPlanLoaded = true;
      selectedCorner = null; // Reset selected corner

      // Extract line segments from SVG
      floorPlanLines = extractLinesFromSVG(svgElement);

      floorPlanBounds = getFloorPlanBounds();
      // Compute intersection points
      cornerPoints = computeCornerPoints(floorPlanLines);

      drawCanvas();
    } catch (error) {
      console.error('Error parsing SVG file:', error);
      alert('Failed to parse SVG file. See console for details.');
    }
  };
  reader.readAsText(file);
}

// Function to extract line segments from SVG elements
function extractLinesFromSVG(svgElement) {
  let lines = [];

  // Helper function to parse points string into array of points
  function parsePoints(pointsString) {
    const points = [];
    const coords = pointsString.trim().split(/[\s,]+/);
    for (let i = 0; i < coords.length; i += 2) {
      const x = parseFloat(coords[i]);
      const y = parseFloat(coords[i + 1]);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({x, y});
      }
    }
    return points;
  }

  // Helper function to traverse SVG nodes recursively
  function traverse(node) {
    if (node.nodeType !== 1) {
      return;
    } // Element nodes only

    switch (node.nodeName.toLowerCase()) {
      case 'line':
        const x1 = parseFloat(node.getAttribute('x1'));
        const y1 = parseFloat(node.getAttribute('y1'));
        const x2 = parseFloat(node.getAttribute('x2'));
        const y2 = parseFloat(node.getAttribute('y2'));
        if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
          lines.push({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
          });
        }
        break;
      case 'polyline':
      case 'polygon':
        const points = parsePoints(node.getAttribute('points'));
        for (let i = 0; i < points.length - 1; i++) {
          lines.push({
            x1: points[i].x,
            y1: points[i].y,
            x2: points[i + 1].x,
            y2: points[i + 1].y
          });
        }
        if (node.nodeName.toLowerCase() === 'polygon' && points.length > 2) {
          // Close the polygon
          lines.push({
            x1: points[points.length - 1].x,
            y1: points[points.length - 1].y,
            x2: points[0].x,
            y2: points[0].y
          });
        }
        break;
      case 'path':
        // For simplicity, we'll handle only straight line commands (M, L, Z)
        const pathLines = extractLinesFromPath(node.getAttribute('d'));
        lines = lines.concat(pathLines);
        break;
      // Add cases for other SVG elements if needed
    }

    // Recurse into child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      traverse(node.childNodes[i]);
    }
  }

  traverse(svgElement);
  return lines;
}

// Function to extract line segments from SVG path data
function extractLinesFromPath(d) {
  const commands = d.match(/[a-df-z][^a-df-z]*/ig);
  if (!commands) {
    return [];
  }

  let x = 0, y = 0;
  let subpathStartX = 0, subpathStartY = 0;
  let lines = [];

  commands.forEach(cmd => {
    const type = cmd[0];
    const args = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);
    switch (type) {
      case 'M':
        x = args[0];
        y = args[1];
        subpathStartX = x;
        subpathStartY = y;
        break;
      case 'L':
        for (let i = 0; i < args.length; i += 2) {
          const newX = args[i];
          const newY = args[i + 1];
          lines.push({
            x1: x,
            y1: y,
            x2: newX,
            y2: newY
          });
          x = newX;
          y = newY;
        }
        break;
      case 'H':
        for (let i = 0; i < args.length; i++) {
          const newX = args[i];
          lines.push({
            x1: x,
            y1: y,
            x2: newX,
            y2: y
          });
          x = newX;
        }
        break;
      case 'V':
        for (let i = 0; i < args.length; i++) {
          const newY = args[i];
          lines.push({
            x1: x,
            y1: y,
            x2: x,
            y2: newY
          });
          y = newY;
        }
        break;
      case 'Z':
      case 'z':
        lines.push({
          x1: x,
          y1: y,
          x2: subpathStartX,
          y2: subpathStartY
        });
        x = subpathStartX;
        y = subpathStartY;
        break;
      // Add cases for other path commands if needed
      default:
        // Ignoring curves and other commands for simplicity
        break;
    }
  });

  return lines;
}

// Function to load and parse DXF files
function loadDXFFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      // Parse the DXF content
      const parser = new DxfParser();
      const dxfData = parser.parseSync(e.target.result);

      if (!dxfData || !dxfData.entities) {
        throw new Error('Invalid DXF data.');
      }

      // Get the drawing extents to set canvas size
      const extents = getDxfExtents(dxfData);
      if (!extents) {
        alert('Failed to determine DXF extents.');
        return;
      }

      const drawingWidth = extents.maxX - extents.minX;
      const drawingHeight = extents.maxY - extents.minY;

      // Resize canvas to viewport size
      resizeCanvas();

      // Calculate scale to fit drawing into canvas
      const canvasWidth = floorCanvas.width;
      const canvasHeight = floorCanvas.height;

      const scaleX = canvasWidth / drawingWidth;
      const scaleY = canvasHeight / drawingHeight;
      scale = Math.min(scaleX, scaleY);

      // Center the drawing
      panOffset.x = -extents.minX * scale + (canvasWidth - drawingWidth * scale)
        / 2;
      panOffset.y = -extents.minY * scale + (canvasHeight - drawingHeight
        * scale) / 2;

      isFloorPlanLoaded = true;
      selectedCorner = null; // Reset selected corner

      // Extract line segments from DXF entities
      floorPlanLines = extractLinesFromDXF(dxfData.entities);
      floorPlanBounds = getFloorPlanBounds();
      // Compute intersection points
      cornerPoints = computeCornerPoints(floorPlanLines);

      drawCanvas();
    } catch (error) {
      console.error('Error parsing DXF file:', error);
      alert('Failed to parse DXF file. See console for details.');
    }
  };
  reader.readAsText(file);
}

// Function to extract line segments from DXF entities
function extractLinesFromDXF(entities) {
  let lines = [];

  entities.forEach(entity => {
    switch (entity.type) {
      case 'LINE':
        lines.push({
          x1: Math.round(entity.vertices[0].x),
          y1: Math.round(entity.vertices[0].y),
          x2: Math.round(entity.vertices[1].x),
          y2: Math.round(entity.vertices[1].y)
        });
        break;
      case 'LWPOLYLINE':
      case 'POLYLINE':
        let vertices = entity.vertices;
        for (let i = 0; i < vertices.length - 1; i++) {
          lines.push({
            x1: Math.round(vertices[i].x),
            y1: Math.round(vertices[i].y),
            x2: Math.round(vertices[i + 1].x),
            y2: Math.round(vertices[i + 1].y)
          });
        }
        // If the polyline is closed, add segment between last and first vertex
        if (entity.closed || entity.shape) {
          lines.push({
            x1: Math.round(vertices[vertices.length - 1].x),
            y1: Math.round(vertices[vertices.length - 1].y),
            x2: Math.round(vertices[0].x),
            y2: Math.round(vertices[0].y)
          });
        }
        break;
      // Add cases for other DXF entities if needed
    }
  });

  return lines;
}

// Function to compute intersection points between line segments
function computeCornerPoints(segments) {
  let cornerPoints = [];
  cornerPoints.push({x: floorPlanBounds.minX, y: floorPlanBounds.minY});
  cornerPoints.push({x: floorPlanBounds.minX, y: floorPlanBounds.maxY});
  cornerPoints.push({x: floorPlanBounds.maxX, y: floorPlanBounds.minY});
  cornerPoints.push({x: floorPlanBounds.maxX, y: floorPlanBounds.maxY});
  return cornerPoints;
}

// Function to compute the intersection point between two line segments
function getLineIntersection(seg1, seg2) {
  const x1 = seg1.x1, y1 = seg1.y1, x2 = seg1.x2, y2 = seg1.y2;
  const x3 = seg2.x1, y3 = seg2.y1, x4 = seg2.x2, y4 = seg2.y2;

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) {
    // Lines are parallel or coincident
    return null;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  // Check if the intersection point is on both line segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    const x = x1 + ua * (x2 - x1);
    const y = y1 + ua * (y2 - y1);
    return {x, y};
  }

  return null; // Intersection point is not on both segments
}

// Function to get extents from DXF data
function getDxfExtents(dxf) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  dxf.entities.forEach(entity => {
    const bbox = getEntityBoundingBox(entity);
    if (bbox) {
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
    }
  });

  if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY
    === -Infinity) {
    console.error('No valid entities found to calculate extents.');
    return null;
  }

  return {minX, minY, maxX, maxY};
}

// Function to get bounding box of a DXF entity
function getEntityBoundingBox(entity) {
  switch (entity.type) {
    case 'LINE':
      const xs = [entity.vertices[0].x, entity.vertices[1].x];
      const ys = [entity.vertices[0].y, entity.vertices[1].y];
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys)
      };
    case 'POLYLINE':
    case 'LWPOLYLINE':
      if (entity.vertices && entity.vertices.length > 0) {
        const xs = entity.vertices.map(v => v.x);
        const ys = entity.vertices.map(v => v.y);
        return {
          minX: Math.min(...xs),
          minY: Math.min(...ys),
          maxX: Math.max(...xs),
          maxY: Math.max(...ys)
        };
      }
      break;
    // Add cases for other DXF entities if needed
    default:
      return null;
  }
  return null;
}

// **Function to get floor plan bounds**
function getFloorPlanBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  floorPlanLines.forEach(line => {
    minX = Math.min(minX, line.x1, line.x2);
    minY = Math.min(minY, line.y1, line.y2);
    maxX = Math.max(maxX, line.x1, line.x2);
    maxY = Math.max(maxY, line.y1, line.y2);
  });
  return {minX, minY, maxX, maxY};
}

// Draw Canvas
function drawCanvas() {
  ctx.clearRect(0, 0, floorCanvas.width, floorCanvas.height);

  ctx.save();
  // Apply pan and zoom transformations
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, -scale); // Flip Y-axis to match coordinate system
  ctx.translate(0, -floorCanvas.height / scale);

  if (isFloorPlanLoaded) {
    // Render floor plan lines
    renderFloorPlanLines();
  }

  ctx.restore();

  // Optionally draw intersection points for debugging

  if (cornerPoints && cornerPoints.length > 0) {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, -scale);
    ctx.translate(0, -floorCanvas.height / scale);
    ctx.fillStyle = 'blue';
    cornerPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2 / scale, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.restore();
  }

  // Draw parquet boards if calculation is done
  if (rows.length > 0) {
    drawParquetBoards();
  }

  // Highlight selected corner
  if (selectedCorner) {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(
      selectedCorner.x * scale,
      floorCanvas.height - selectedCorner.y * scale,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.restore();
  }
}

// Function to render floor plan lines
function renderFloorPlanLines() {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1 / scale; // Adjust line width based on scale

  floorPlanLines.forEach(line => {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  });
}

// Zooming
floorCanvas.addEventListener('wheel', function (e) {
  e.preventDefault();
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  // Get the mouse position without pan and scale
  const x = (mouseX - panOffset.x) / scale;
  const y = (floorCanvas.height - (mouseY - panOffset.y) / scale);

  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = scale * delta;

  // Adjust panOffset to keep the mouse position consistent
  panOffset.x -= (x * newScale - x * scale);
  panOffset.y -= (-(y * newScale - y * scale));

  scale = newScale;
  drawCanvas();
});

// Panning
floorCanvas.addEventListener('mousedown', function (e) {
  isPanning = true;
  panStart.x = e.clientX - panOffset.x;
  panStart.y = e.clientY - panOffset.y;
  wasMoving = false;
});

floorCanvas.addEventListener('mousemove', function (e) {
  if (isPanning) {
    panOffset.x = e.clientX - panStart.x;
    panOffset.y = e.clientY - panStart.y;
    drawCanvas();
    wasMoving = true;
  }
});

floorCanvas.addEventListener('mouseup', function (e) {
  isPanning = false;
});

floorCanvas.addEventListener('mouseleave', function (e) {
  isPanning = false;
});

// Corner Selection
floorCanvas.addEventListener('click', function (e) {
  if (isPanning) {
    return;
  } // Prevent corner selection during panning
  if (wasMoving) {
    return;
  }

  const rect = floorCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left - panOffset.x) / scale;
  const y = (floorCanvas.height - (e.clientY - rect.top - panOffset.y)) / scale;

  // Find the nearest intersection point within a certain radius
  const radius = 5 / scale; // 5 pixels tolerance, adjust as needed
  let nearestPoint = null;
  let minDistance = Infinity;

  cornerPoints.forEach(point => {
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < radius && distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  });

  if (nearestPoint) {
    selectedCorner = nearestPoint;
  }

  drawCanvas();
});

let boardHeight = null;
let boardWidth = null;
let boardOffset = 0;
let boardInitialCut = 0;
let boardNumber = 1;
let rows = [];
let remainingBoards = [];

boardOffsetInput.addEventListener('input', () => {
  boardOffsetValue.textContent = boardOffsetInput.value;
  reset();
  fullComplete();
})

boardInitialCutInput.addEventListener('input', () => {
  boardInitialCutValue.textContent = boardInitialCutInput.value;
  reset();
  fullComplete();
})

heightInput.addEventListener('change', () => {
  boardInitialCutInput.min = heightInput.value * -1;
  reset();
  fullComplete();
})

widthInput.addEventListener('change', () => {
  boardOffsetInput.min = widthInput.value * -1;
  reset();
  fullComplete();
})

minBoardRemainingsInput.addEventListener('change', () => {
  reset();
  fullComplete();
})

addRow.addEventListener('click', function () {
  computeRow();
});

addBoard.addEventListener('click', function () {
  computeBord();
});

fullComplete.addEventListener('click', function () {
  reset();
  completeTheFloor();
});

showNumbersCheckbox.addEventListener('change', drawCanvas);

doNotUseSmallRemaningsCheckbox.addEventListener('change', function () {
  reset();
  completeTheFloor();
});

optimyseStartTheRow.addEventListener('change', function () {
  reset();
  completeTheFloor();
});

// Load Floor Plan File
loadFileButton.addEventListener('click', () => {
  const file = fileInput.files[0];
  floorPlanType = fileTypeSelect.value;

  if (!file) {
    alert('Please select a file.');
    return;
  }

  if (floorPlanType === 'svg' && file.type === 'image/svg+xml') {
    loadSVGFile(file);
  } else if (floorPlanType === 'dxf' && (file.name.endsWith('.dxf') || file.type
    === 'application/dxf' || file.type === 'application/octet-stream')) {
    loadDXFFile(file);
  } else {
    alert(`Please select a valid ${floorPlanType.toUpperCase()} file.`);
  }
  reset();
  boardHeight = parseFloat(heightInput.value);
  boardWidth = parseFloat(widthInput.value);
  boardOffset = parseFloat(boardOffsetInput.value);
  boardInitialCut = parseFloat(boardInitialCutInput.value);
  minBoardRemainings = parseFloat(minBoardRemainingsInput.value);

});

function reset() {
  rows = [];
  remainingBoards = [];
}

function validate() {
  if (!selectedCorner) {
    alert('Please select a starting corner on the floor plan.');
    throw new Error('Please select a starting corner on the floor plan.');
  }
}

function completeTheFloor() {
  validate();
  while (true) {
    const addedRow = computeNewRow();
    if (!addedRow) {
      break;
    }
  }

  updateRemainings();
  drawCanvas();
}

function computeRow() {
  validate();
  computeNewRow();
  updateRemainings();
  drawCanvas();
}

function computeBord() {
  validate();
  computeNewBoard();
  updateRemainings();
  drawCanvas();
}

function computeNewRow() {
  const rowDirection = findRowDirection();
  const rowNumber = rows.length + 1;
  const row = {
    direction: rowDirection,
    segments: [],
    remainings: []
  };

  if (rowDirection === 'up') {
    const rowLeftVerticalSegment = {
      x1: floorPlanBounds.minX + (rowNumber - 1) * boardWidth + boardOffset,
      y1: floorPlanBounds.minY,
      x2: floorPlanBounds.minX + (rowNumber - 1) * boardWidth + boardOffset,
      y2: floorPlanBounds.maxY
    };

    const rowRightVerticalSegment = {
      x1: rowLeftVerticalSegment.x1 + boardWidth,
      y1: floorPlanBounds.minY,
      x2: rowLeftVerticalSegment.x1 + boardWidth,
      y2: floorPlanBounds.maxY
    };
    const leftSegmentIntersectionPoints = [];
    const rightSegmentIntersectionPoints = [];
    for (let i = 0; i < floorPlanLines.length; i++) {
      const leftSegmentIntersectionPoint = getLineIntersection(
        floorPlanLines[i], rowLeftVerticalSegment);
      if (leftSegmentIntersectionPoint != null) {
        leftSegmentIntersectionPoints.push(leftSegmentIntersectionPoint);
      }

      const rightSegmentIntersectionPoint = getLineIntersection(
        floorPlanLines[i], rowRightVerticalSegment);
      if (rightSegmentIntersectionPoint != null) {
        rightSegmentIntersectionPoints.push(rightSegmentIntersectionPoint);
      }
    }

    leftSegmentIntersectionPoints.sort(function (a, b) {
      return a.y - b.y
    });
    rightSegmentIntersectionPoints.sort(function (a, b) {
      return a.y - b.y
    });

    let rowMinY = null;
    let rowLeftMinY = null;
    let rowRightMinY = null;
    let rowMaxY = null;
    let rowLeftMaxY = null;
    let rowRightMaxY = null;
    if (leftSegmentIntersectionPoints.length > 0
      && rightSegmentIntersectionPoints.length > 0) {
      rowLeftMinY = leftSegmentIntersectionPoints[0].y;
      rowRightMinY = rightSegmentIntersectionPoints[0].y;
      rowMinY = Math.min(rowLeftMinY, rowRightMinY);
      rowLeftMaxY = leftSegmentIntersectionPoints[leftSegmentIntersectionPoints.length
      - 1].y;
      rowRightMaxY = rightSegmentIntersectionPoints[rightSegmentIntersectionPoints.length
      - 1].y;
      rowMaxY = Math.max(rowLeftMaxY, rowRightMaxY);
    } else if (leftSegmentIntersectionPoints.length > 0) {
      rowLeftMinY = leftSegmentIntersectionPoints[0].y;
      rowMinY = rowLeftMinY;
      rowLeftMaxY = leftSegmentIntersectionPoints[leftSegmentIntersectionPoints.length
      - 1].y;
      rowMaxY = rowLeftMaxY;
    } else if (rightSegmentIntersectionPoints.length > 0) {
      rowRightMinY = rightSegmentIntersectionPoints[0].y;
      rowMinY = rowRightMinY
      rowRightMaxY = rightSegmentIntersectionPoints[rightSegmentIntersectionPoints.length
      - 1].y;
      rowMaxY = rowRightMaxY;
    } else {
      console.log("Could not indetify minY/maxY");
    }

    let nextLeftMinY = rowMinY;
    let nextRightMinY = rowMinY;
    let j = 0;
    while (true) {
      console.log("Find starting Y");
      let foundLeftMinY = false;
      for (let i = 0; i < leftSegmentIntersectionPoints.length; i++) {
        if (leftSegmentIntersectionPoints[i].y >= nextLeftMinY) {
          nextLeftMinY = leftSegmentIntersectionPoints[i].y;
          foundLeftMinY = true;
          break;
        }
      }
      let foundRightMinY = false;
      for (let i = 0; i < rightSegmentIntersectionPoints.length; i++) {
        if (rightSegmentIntersectionPoints[i].y >= nextRightMinY) {
          nextRightMinY = rightSegmentIntersectionPoints[i].y;
          foundRightMinY = true;
          break;
        }
      }
      if (foundLeftMinY && foundRightMinY) {
        minY = Math.min(nextLeftMinY, nextRightMinY);
      } else if (foundLeftMinY) {
        minY = nextLeftMinY;
      } else if (foundRightMinY) {
        minY = nextRightMinY;
      } else {
        maxY = null;
      }

      console.log("Find end of segment");
      let nextLeftMaxY = rowMaxY + 1;
      let foundLeftMaxY = false;
      for (let i = 0; i < leftSegmentIntersectionPoints.length; i++) {
        if (leftSegmentIntersectionPoints[i].y > nextLeftMinY) {
          nextLeftMaxY = leftSegmentIntersectionPoints[i].y;
          foundLeftMaxY = true;
          break;
        }
      }
      let nextRightMaxY = rowMaxY + 1;
      let foundRightMaxY = false;
      for (let i = 0; i < rightSegmentIntersectionPoints.length; i++) {
        if (rightSegmentIntersectionPoints[i].y > nextRightMinY) {
          nextRightMaxY = rightSegmentIntersectionPoints[i].y;
          foundRightMaxY = true;
          break;
        }
      }

      if (foundLeftMaxY && foundRightMaxY) {
        if (nextLeftMaxY < nextRightMinY) {
          maxY = nextLeftMaxY;
        } else if (nextRightMaxY < nextLeftMinY) {
          maxY = nextRightMaxY;
        } else {
          maxY = Math.max(nextLeftMaxY, nextRightMaxY);
        }
      } else if (foundLeftMaxY) {
        maxY = nextLeftMaxY;
      } else if (foundRightMaxY) {
        maxY = nextRightMaxY;
      } else {
        maxY = null;
      }

      if (nextLeftMaxY === rowMaxY + 1 && nextRightMaxY === rowMaxY + 1) {
        console.log("maxY wasn't found");
        break;
      } else {
        row.segments.push({
          x: rowLeftVerticalSegment.x1,
          y: minY,
          width: rowRightVerticalSegment.x1 - rowLeftVerticalSegment.x1,
          height: maxY - minY,
          boards: [],
          row: row,
          segmentNumber: j + 1
        });
        nextLeftMinY = maxY + 1;
        nextRightMinY = nextLeftMinY;
      }
      j++;
    }
  }

  if (row.segments.length > 0) {
    rows.push(row);
    return true;
  } else {
    return false;
  }

}

function findLastBoard() {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.segments.length; j++) {
      const segment = row.segments[j];
      let remainingToComplete = segment.height;
      for (let k = 0; k < segment.boards.length; k++) {
        const board = segment.boards[k];
        remainingToComplete -= board.height;
      }
      if (remainingToComplete > 0) {
        if (segment.boards.length > 0) {
          return segment.boards[segment.boards.length - 1];
        } else {
          if (j > 0) {
            return segments[j - 1].boards[segments[j - 1].boards.length - 1];
          } else if (i > 0) {
            return rows[i - 1].segments[rows[i - 1].segments.length - 1].boards[rows[i - 1].segments[rows[i - 1].segments.length - 1].boards.length - 1];
          } else {
            return null;
          }
        }
      }
    }
  }
}

function findMaxBoardNumber() {
  let maxBoardNumber = 1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.segments.length; j++) {
      const segment = row.segments[j];
      for (let k = 0; k < segment.boards.length; k++) {
        const board = segment.boards[k];
        maxBoardNumber = Math.max(maxBoardNumber, board.boardNumber);
      }
    }
  }
  return maxBoardNumber;
}

function findMinimalCutBoard(cut) {
  let minimalCutBoard = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.remainings.length; j++) {
      const remaining = row.remainings[j];
      if (remaining.cut === cut && remaining.canBeUsed) {
        if (minimalCutBoard == null || (remaining.height < minimalCutBoard.height) {
          minimalCutBoard = remaining;
        }
      }
    }
  }
  return minimalCutBoard;
}

function computeNewBoard() {
  console.log("Find last not completed row and segment")
  if (rows.length === 0) {
    alert('Please add at least one row.');
    throw new Error('Please add at least one row.');
  }

  const lastBoard = findLastBoard();
  let currentBordHeight = boardHeight;
  let currentBordNumber = findMaxBoardNumber();
  if (lastBoard == null) {
    console.log("There is no boards. Add first one");
    // add first board ever
    if (boardInitialCut < 0) {
      // need to cut first board
      currentBordHeight = boardHeight + boardInitialCut;
      rows[0].remainings.push({
        height: boardInitialCut,
        number: 1,
        cut: 'right',
        reused: false
      });
    }
  } else {
    if (lastBoard.segment.remainingBoardHeight === 0) {
      if (arrangeMode.value === 'continue') {
        let boardCutByRight = findMinimalCutBoard('right');
        if (boardCutByRight != null) {
          currentBordHeight = boardCutByRight.height;
        }
      } else if (arrangeMode.value === 'halfShift') {
        // need to find first board endY
      }
    }
  }

  let lastSegment = lastBoard!= null ? lastBoard.segment : null;
  let lastRow = lastSegment!= null ? lastSegment.row : null;



  for (let i = 0; i < row.segments.length; i++) {
    let rowSegment = row.segments[i];
    let previousBoardY = rowSegment.y;
    let remainingRowSegmentHeight = rowSegment.height;
    let j = 0;
    while (true) {

      if (optimyseStartTheRow.checked && lastRow != null && i == 0) {
        console.log('Find the board which ends araund the board I want to add');

        let previousRowFirstBoard = lastRow.segments[0].boards[0];
        let boardEndY = previousRowFirstBoard.y + previousRowFirstBoard.height;
        let currentBoardEndY = previousBoardY + currentBordHeight;

        // need to cut
        let offset = boardEndY - boardHeight * 0.33;
        let cutValue = previousBoardY + currentBordHeight - offset;
        if (cutValue > 0) {
          if (currentBordHeight - cutValue >= minBoardRemainings) {
            remainingBoards.push({
              height: cutValue,
              number: currentBordNumber,
              cut: currentBordHeight == boardHeight ? 'left' : 'both',
              reused: currentBordHeight == boardHeight ? false : true
            });
            currentBordHeight = currentBordHeight - cutValue;
          } else {
            remainingBoards.push({
              height: currentBordHeight,
              number: currentBordNumber,
              cut: 'left',
              reused: false
            });
            currentBordNumber++;
            currentBordHeight = boardHeight + boardInitialCut;
          }
        }
      }

      if (remainingRowSegmentHeight >= currentBordHeight) {
        if (j == 0) {
          console.log('Let reuse remainingBoards');
          remainingBoards.sort(function (a, b) {
            return a.height - b.height
          });
          for (let k = 0; k < remainingBoards.length; k++) {
            let remaningBoard = remainingBoards[k];
            if (remaningBoard.reused == false && remaningBoard.cut == 'right'
              && remaningBoard.height >= currentBordHeight) {
              remaningBoard.reused = true;
              remaningBoard.height = remaningBoard.height
                - currentBordHeight;
              rowSegment.boards.push({
                x: rowSegment.x,
                y: previousBoardY,
                width: rowSegment.width,
                height: currentBordHeight,
                number: remaningBoard.number,
                remainingBoardHeight: 0
              });
              previousBoardY = previousBoardY + currentBordHeight;
              remainingRowSegmentHeight = remainingRowSegmentHeight
                - currentBordHeight;
              currentBordHeight = boardHeight;
              break
            }
          }
        } else {
          rowSegment.boards.push({
            x: rowSegment.x,
            y: previousBoardY,
            width: rowSegment.width,
            height: currentBordHeight,
            number: currentBordNumber,
            remainingBoardHeight: 0
          });
          row.lastBoardNumber = currentBordNumber;
          previousBoardY = previousBoardY + currentBordHeight;
          remainingRowSegmentHeight = remainingRowSegmentHeight
            - currentBordHeight;
          currentBordHeight = boardHeight;
          currentBordNumber++;
        }
      } else {

        console.log('Let reuse remainingBoards first')
        remainingBoards.sort(function (a, b) {
          return a.height - b.height
        });
        let foundUnused = false;
        for (let k = 0; k < remainingBoards.length; k++) {
          let remaningBoard = remainingBoards[k];
          if (remaningBoard.reused == false
            && remaningBoard.cut == 'left'
            && remaningBoard.height >= remainingRowSegmentHeight
            && j == row.segments.length - 1
          ) {
            foundUnused = true;
            remaningBoard.reused = true;
            remaningBoard.height = remaningBoard.height
              - remainingRowSegmentHeight;
            rowSegment.boards.push({
              x: rowSegment.x,
              y: previousBoardY,
              width: rowSegment.width,
              height: remainingRowSegmentHeight,
              number: remaningBoard.number,
              remainingBoardHeight: 0
            });
            previousBoardY = previousBoardY + currentBordHeight;
            remainingRowSegmentHeight = 0;
            currentBordHeight = boardHeight;
            break;
          }
        }

        if (!foundUnused) {
          const remainingBoardHeight = currentBordHeight
            - remainingRowSegmentHeight;
          rowSegment.boards.push({
            x: rowSegment.x,
            y: previousBoardY,
            width: rowSegment.width,
            height: remainingRowSegmentHeight,
            number: currentBordNumber,
            remainingBoardHeight: remainingBoardHeight
          });
          row.lastBoardNumber = currentBordNumber;
          currentBordHeight = remainingBoardHeight;

          if (remainingBoardHeight < minBoardRemainings
            && doNotUseSmallRemaningsCheckbox.checked) {
            remainingBoards.push({
              height: remainingBoardHeight,
              number: currentBordNumber,
              cut: 'right',
              reused: false
            });

            currentBordHeight = boardHeight + boardInitialCut;
            currentBordNumber++;
          }
        }
        break;
      }
      j++;
    }
  }
}

function updateRemainings() {
  if (remainingBoards.length > 0) {
    let remainingBoardsText = "";
    for (let i = 0; i < remainingBoards.length; i++) {
      remainingBoardsText = remainingBoardsText + remainingBoards[i].number
        + "(" + remainingBoards[i].height + "),";
    }
    remainingsValue.innerText = remainingBoardsText;
  }
}

function findRowDirection() {
  if (selectedCorner.x == floorPlanBounds.minX && selectedCorner.y
    == floorPlanBounds.minY) {
    return 'up';
  }

  if (selectedCorner.x == floorPlanBounds.minX && selectedCorner.y
    == floorPlanBounds.maxY) {
    return 'right';
  }

  if (selectedCorner.x == floorPlanBounds.maxX && selectedCorner.y
    == floorPlanBounds.minY) {
    return 'left';
  }

  if (selectedCorner.x == floorPlanBounds.maxX && selectedCorner.y
    == floorPlanBounds.maxY) {
    return 'down';
  }
}

function drawParquetBoards() {
  ctx.save();
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, -scale);
  ctx.translate(0, -floorCanvas.height / scale);
  rows.forEach(row => {
    row.segments.forEach(segment => {
      ctx.beginPath();
      ctx.rect(segment.x, segment.y, segment.width, segment.height);
      ctx.fillStyle = 'rgba(42,136,165,0.7)';
      ctx.fill();
      ctx.lineWidth = 1 / scale; // Adjust line width based on scale
      ctx.strokeStyle = 'black';
      ctx.stroke();

      if (segment.boards.length > 0) {
        segment.boards.forEach(board => {
          ctx.beginPath();
          ctx.rect(board.x, board.y, board.width, board.height);
          ctx.fillStyle = 'rgba(165, 42, 42, 0.7)';
          ctx.fill();
          ctx.lineWidth = 1 / scale; // Adjust line width based on scale
          ctx.strokeStyle = 'black';
          ctx.stroke();
          if (showNumbersCheckbox.checked) {
            ctx.fillStyle = 'black';
            ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.scale(1, -1); // Flip text vertically
            ctx.fillText(
              board.number.toString(),
              board.x + board.width / 2,
              -(board.y + board.height / 2)
            );
            ctx.restore();
          }
        });
      }
    });
  });

  ctx.restore();
}

// Get references to DOM elements
const ctx = floorCanvas.getContext('2d');

let scale = 1;
let panOffset = {x: 0, y: 0};
let isPanning = false;
let wasMoving = false;
let panStart = {x: 0, y: 0};

function resizeCanvas() {
  const viewportWidth = window.innerWidth - window.innerWidth * 0.3;
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

// Draw Canvas
function drawCanvas() {
  ctx.clearRect(0, 0, floorCanvas.width, floorCanvas.height);
  ctx.save();
  // Apply pan and zoom transformations
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, -scale); // Flip Y-axis to match coordinate system
  ctx.translate(0, -floorCanvas.height / scale);

  drawFloorPlanLines();
  ctx.restore();

  drawCornerPoints(); // todo remove
  drawParquetBoards();
  drawArrows(); // todo remove
  drawSelectedCorner();
  ctx.restore();
}

// Zooming
floorCanvas.addEventListener('wheel', function (e) {
  e.preventDefault();
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  // Get the mouse position without pan and scale
  const x = (mouseX - panOffset.x) / scale;
  const y = (floorCanvas.height - (mouseY - panOffset.y)) / scale;

  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = scale * delta;

  // Adjust panOffset to keep the mouse position consistent
  panOffset.x -= (x * newScale - x * scale);
  panOffset.y -= -(y * newScale - y * scale);

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

function drawSelectedCorner() {
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

function drawCornerPoints() {
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
}

// Function to render floor plan lines
function drawFloorPlanLines() {
  if (floorPlanLines.length > 0) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 / scale; // Adjust line width based on scale
    floorPlanLines.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    });
  }
}

function drawArrows() {
  ctx.save();
  // Compute screen coordinates for (0,0) floor plan
  let X0 = panOffset.x;
  let Y0 = floorCanvas.height + panOffset.y;

  // Red arrow to the left
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  ctx.moveTo(X0, Y0);
  ctx.lineTo(X0 + 30, Y0);
  ctx.stroke();

  // Red arrowhead
  ctx.beginPath();
  ctx.moveTo(X0 + 30, Y0);
  ctx.lineTo(X0 + 20, Y0 - 4);
  ctx.lineTo(X0 + 20, Y0 + 4);
  ctx.closePath();
  ctx.fillStyle = 'red';
  ctx.fill();

  // Green arrow upwards
  ctx.beginPath();
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 1;
  ctx.moveTo(X0, Y0);
  ctx.lineTo(X0, Y0 - 30);
  ctx.stroke();

  // Green arrowhead
  ctx.beginPath();
  ctx.moveTo(X0, Y0 - 30);
  ctx.lineTo(X0 - 4, Y0 - 20);
  ctx.lineTo(X0 + 4, Y0 - 20);
  ctx.closePath();
  ctx.fillStyle = 'green';
  ctx.fill();

  ctx.restore();
}

function drawParquetBoards() {
  if (rows.length > 0) {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, -scale);
    ctx.translate(0, -floorCanvas.height / scale);
    rows.forEach(row => {
      row.segments.forEach(segment => {
        ctx.beginPath();
        ctx.rect(segment.x, segment.y, segment.width, segment.height);
        ctx.fillStyle = 'rgba(42,136,165,0.2)';
        ctx.fill();
        ctx.lineWidth = 1 / scale; // Adjust line width based on scale
        ctx.strokeStyle = 'black';
        ctx.stroke();

        if (segment.boards.length > 0) {
          segment.boards.forEach(board => {
            drawBoard(board);
          });
        }
      });
      drawRemainings(row);
    });
    ctx.restore();
  }
}

function drawBoard(board) {
  ctx.beginPath();
  ctx.rect(board.x, board.y, board.width, board.height);
  if (board.height < minBoardHeight) {
    ctx.fillStyle = 'rgba(165,140,42,0.7)';
  } else {
    ctx.fillStyle = 'rgba(165, 42, 42, 0.7)';
  }
  ctx.fill();
  ctx.lineWidth = 1 / scale; // Adjust line width based on scale
  ctx.strokeStyle = 'black';
  ctx.stroke();
  if (showNumbers) {
    ctx.fillStyle = 'black';
    ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.scale(1, -1); // Flip text vertically
    ctx.fillText(board.number.toString(), board.x + board.width / 2, -(board.y + board.height / 2));
    ctx.restore();
  }
}

function drawRemainings(row) {
  if (row.remainings.length > 0) {
    const space = 40;
    if (row.direction === 'up') {
      let offsetTop = floorPlanBounds.maxY + space;
      let offsetBottom = floorPlanBounds.minY - space;
      row.remainings.forEach(remaining => {
        if (remaining.reused === false) {
          if (remaining.cut === 'left') {
            const x = row.segments[0].x;
            const y = offsetTop;
            const width = row.segments[0].width;
            const height = remaining.height;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.fillStyle = 'rgba(165, 42, 42, 0.7)';
            ctx.fill();
            ctx.lineWidth = 1 / scale; // Adjust line width based on scale
            ctx.strokeStyle = 'black';
            ctx.stroke();
            offsetTop += remaining.height + space;

            if (showNumbers) {
              ctx.fillStyle = 'black';
              ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.save();
              ctx.scale(1, -1); // Flip text vertically
              ctx.fillText(remaining.number.toString(), x + width / 2, -(y + height / 2));
              ctx.restore();
            }

          } else if (remaining.cut === 'right') {
            offsetBottom -= remaining.height;
            const x = row.segments[0].x;
            const y = offsetBottom;
            const width = row.segments[0].width;
            const height = remaining.height;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.fillStyle = 'rgba(165, 42, 42, 0.7)';
            ctx.fill();
            ctx.lineWidth = 1 / scale; // Adjust line width based on scale
            ctx.strokeStyle = 'black';
            ctx.stroke();
            offsetBottom -= space;

            if (showNumbers) {
              ctx.fillStyle = 'black';
              ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.save();
              ctx.scale(1, -1); // Flip text vertically
              ctx.fillText(remaining.number.toString(), x + width / 2, -(y + height / 2));
              ctx.restore();
            }
          }
        } else if (remaining.cut === 'both') {
          offsetBottom -= remaining.height;
          const x = row.segments[0].x;
          const y = offsetBottom;
          const width = row.segments[0].width;
          const height = remaining.height;
          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.fillStyle = 'rgba(42,165,44,0.7)';
          ctx.fill();
          ctx.lineWidth = 1 / scale; // Adjust line width based on scale
          ctx.strokeStyle = 'black';
          ctx.stroke();
          offsetBottom -= space;

          if (showNumbers) {
            ctx.fillStyle = 'black';
            ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.scale(1, -1); // Flip text vertically
            ctx.fillText(remaining.number.toString(), x + width / 2, -(y + height / 2));
            ctx.restore();
          }
        }
      });

      floorPlanBounds.maxY
    }
  }
}
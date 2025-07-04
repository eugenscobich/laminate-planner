// Get references to DOM elements
const ctx = floorCanvas.getContext('2d');

let scale = 1;
let panOffset = {x: 0, y: 0};
let isPanning = false;
let wasMoving = false;
let panStart = {x: 0, y: 0};

function resizeCanvas() {
  floorCanvas.style.width = '100%';
  floorCanvas.width = floorCanvas.offsetWidth;
  floorCanvas.height = window.innerHeight - canvasContainer.offsetTop - 16;
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
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, -scale); // Flip Y-axis to match coordinate system
  ctx.translate(0, -floorCanvas.height / scale);
  const angleRad = currentRotateViewPortAngle * Math.PI / 180;
  ctx.rotate(angleRad);
  drawFloorPlanLines();
  drawFloorPlanPoints();
  drawParquetBoards();
  ctx.restore();

  drawArrows();
  drawMouseCoordinates();
  drawSurfaceVisualizer();

}

function drawSurfaceVisualizer() {
  if (points3D.length < 3) {
    drawPoints();
    return;
  } // Need at least 3 points to form a triangle

  // Create an array of [x, y] pairs for triangulation.
  const xyCoords = points3D.map(pt => [pt.x, pt.y]);

  // Compute the Delaunay triangulation using d3-delaunay.
  // (If you're using the ESM version from the CDN, it will be available via window.d3.Delaunay)
  const delaunay = d3.Delaunay.from(xyCoords);
  const triangles = delaunay.triangles; // flat array of indices (each group of 3 forms a triangle)

  // Compute min and max Z values to map Z to color.
  const zValues = points3D.map(pt => pt.z);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);

  // A helper function to convert a Z value into a color.
  // For example, low values (minZ) -> blue, high values (maxZ) -> red.
  function zToColor(z) {
    const t = (z - minZ) / (maxZ - minZ); // Normalize between 0 and 1.
    const r = Math.round(255 * t);
    const g = 0;
    const b = Math.round(255 * (1 - t));
    return `rgb(${r}, ${g}, ${b}, 0.5)`;
  }

  function zToColor2(z) {
    let t = 0;
    if (z < middleZ) {
      t = ((z - minZ) / (middleZ - minZ)) * 0.5; // Normalize between 0 and 1.
    } else if (middleZ === maxZ) {
      t = 1;
    } else {
      t = ((z - middleZ) / (maxZ - middleZ)) * 0.5 + 0.5; // Normalize between 0 and 1.
    }

    let r, g, b;
    if (t < 0.5) {
      // Interpolate from blue (0, 0, 255) to green (0, 255, 0)
      const t2 = t / 0.5; // Normalize to 0..1
      r = 0;
      g = Math.round(255 * t2);
      b = Math.round(255 * (1 - t2));
    } else {
      // Interpolate from green (0, 255, 0) to red (255, 0, 0)
      const t2 = (t - 0.5) / 0.5; // Normalize to 0..1
      r = Math.round(255 * t2);
      g = Math.round(255 * (1 - t2));
      b = 0;
    }
    return `rgb(${r}, ${g}, ${b}, 0.8)`;
  }

  // Save the current transform

  // Draw each triangle:
  for (let i = 0; i < triangles.length; i += 3) {
    const i0 = triangles[i];
    const i1 = triangles[i + 1];
    const i2 = triangles[i + 2];

    const p0 = points3D[i0];
    const p1 = points3D[i1];
    const p2 = points3D[i2];

    // Compute the average Z value of the triangle.
    const avgZ = (p0.z + p1.z + p2.z) / 3;
    const fillColor = zToColor2(avgZ);

    drawPoint(p0.x, p0.y, p0.z, zToColor2(p0.z));
    drawPoint(p1.x, p1.y, p1.z, zToColor2(p1.z));
    drawPoint(p2.x, p2.y, p2.z, zToColor2(p2.z));

    ctx.save();
    // Apply existing pan, zoom, and flip transforms (if any)
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, -scale);
    ctx.translate(0, -floorCanvas.height / scale);

    ctx.beginPath();

    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    // Optionally, draw triangle edges:
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 0.5 / scale;
    ctx.stroke();
    ctx.restore();
  }

}

function drawPoints() {
  // Draw the 3D points over the canvas.
  // We want the text to be drawn in screen coordinates so we can avoid any scale or Y-flip.
  points3D.forEach(pt => {
    drawPoint(pt.x, pt.y, pt.z, 'green');
  });
}

function drawPoint(x, y, z, style) {
  // Convert floor plan point to screen coordinates:
  const screenX = x * scale + panOffset.x;
  const screenY = floorCanvas.height - y * scale + panOffset.y;

  // Draw a small circle to mark the point.
  ctx.save();
  ctx.beginPath();
  ctx.arc(screenX, screenY, 2, 0, 2 * Math.PI);
  ctx.fillStyle = style;
  ctx.fill();
  ctx.strokeStyle = style;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Draw the Z coordinate next to the point
  ctx.save();
  ctx.font = "14px Arial";
  ctx.fillStyle = style;
  // Offset the text a bit from the point (e.g., 8 pixels right and 5 pixels down)
  ctx.fillText("Z: " + z, screenX + 8, screenY + 5);
  ctx.restore();
}

function drawMouseCoordinates() {
  ctx.save();
  ctx.fillStyle = 'red';
  ctx.font = '14px Arial';
  const label = `X: ${mouseFloorX.toFixed(0)}, Y: ${mouseFloorY.toFixed(0)}`;
  const offset = 10;
  ctx.fillText(label, mouseScreenX + offset, (mouseScreenY + offset));
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
});

floorCanvas.addEventListener('mousemove', function (e) {
  mouseScreenX = e.offsetX;
  mouseScreenY = e.offsetY;
  wasMoving = true;
  if (isPanning) {
    panOffset.x = e.clientX - panStart.x;
    panOffset.y = e.clientY - panStart.y;
  }

  let x = mouseScreenX - panOffset.x;
  let y = mouseScreenY - panOffset.y;
  mouseFloorX = x / scale;
  mouseFloorY = (floorCanvas.height - y) / scale;

  drawCanvas();
});

floorCanvas.addEventListener('mouseup', function (e) {
  isPanning = false;
});

floorCanvas.addEventListener('mouseleave', function (e) {
  isPanning = false;
});

floorCanvas.addEventListener('click', function (e) {
  // Skip if panning or if a movement was detected
  if (isPanning || wasMoving) {
    wasMoving = false;
    return;
  }

  let x = e.offsetX - panOffset.x;
  let y = e.offsetY - panOffset.y;
  mouseFloorX = Math.round(x / scale);
  mouseFloorY = Math.round((floorCanvas.height - y) / scale);
  const zInput = prompt("Enter Z coordinate:");
  if (zInput === null) {
    return;
  } // User cancelled
  const z = parseFloat(zInput);
  if (isNaN(z)) {
    alert("Invalid Z coordinate.");
    return;
  }

  // Save the new 3D point

  let found = false
  points3D.forEach((point) => {
    if (point.x === mouseFloorX && point.y === mouseFloorY) {
      found = true;
      point.z = z;
    }
  })

  if (found === false) {
    points3D.push({x: mouseFloorX, y: mouseFloorY, z});
  }

  const zValues = points3D.map(pt => pt.z);
  const average = array => array.reduce((a, b) => a + b) / array.length;
  minZ = Math.min(...zValues);
  maxZ = Math.max(...zValues);
  middleZ = average(zValues);
  middleZInput.value = middleZ;
  middleZRangeInput.value = middleZ;
  middleZRangeInput.max = maxZ;
  middleZRangeInput.min = minZ;
  console.log(`${mouseFloorX},${mouseFloorY},${z}`);
  drawCanvas();
});

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

function drawFloorPlanPoints() {
  if (originalFloorPoints.length > 0) {
    ctx.lineWidth = 1 / scale; // Adjust line width based on scale
    originalFloorPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 0.1, 0, 2 * Math.PI);
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.strokeStyle = 'black';
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

    rows.forEach(row => {
      row.segments.forEach(segment => {
        ctx.beginPath();
        ctx.rect(segment.x, segment.y, segment.length, -segment.width);
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
        if (segment.gaps.length > 0) {
          segment.gaps.forEach(gap => {
            if (gap.completed === false) {
              drawGaps(gap);
            }
          });
        }
      });
      drawRemainings(row);
    });

  }
}

function drawBoard(board) {
  ctx.beginPath();
  ctx.rect(board.x, board.y, board.length, -board.width);
  if (board.length < minBoardLength) {
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
    ctx.fillText(board.number.toString(), board.x + board.length / 2, -(board.y - board.width / 2));
    ctx.restore();
  }
}

function drawGaps(gap) {
  ctx.beginPath();
  ctx.rect(gap.x, gap.y, gap.length, -gap.width);
  if (gap.length < minBoardLength) {
    ctx.fillStyle = 'rgba(10,140,42,0.7)';
  } else {
    ctx.fillStyle = 'rgba(10, 42, 42, 0.7)';
  }
  ctx.fill();
  ctx.lineWidth = 1 / scale; // Adjust line width based on scale
  ctx.strokeStyle = 'black';
  ctx.stroke();
}

function drawRemainings(row) {
  if (row.remainings.length > 0) {
    const space = 40;
    let offsetRight = floorPlanBounds.maxX + space;
    let offsetLeft = floorPlanBounds.minX - space;
    row.remainings.forEach(remaining => {
      if (remaining.reused === false) {
        if (remaining.cut.includes('left') && !remaining.cut.includes('right')) {
          const x = offsetRight;
          const y = row.segments[0].y;
          const width = row.segments[0].width;
          const length = remaining.length;
          ctx.beginPath();
          ctx.rect(x, y, length, -width);
          ctx.fillStyle = 'rgba(165, 42, 42, 0.7)';
          ctx.fill();
          ctx.lineWidth = 1 / scale; // Adjust line width based on scale
          ctx.strokeStyle = 'black';
          ctx.stroke();
          offsetRight += remaining.length + space;

          if (showNumbers) {
            ctx.fillStyle = 'black';
            ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.scale(1, -1); // Flip text vertically
            ctx.fillText(remaining.number.toString(), x + length / 2, -(y - width / 2));
            ctx.restore();
          }

        } else if (remaining.cut.includes('right') && !remaining.cut.includes('left')) {
          offsetLeft -= remaining.length;
          const x = offsetLeft;
          const y = row.segments[0].y;
          const width = row.segments[0].width;
          const length = remaining.length;
          ctx.beginPath();
          ctx.rect(x, y, length, -width);
          ctx.fillStyle = 'rgba(165, 42, 42, 0.7)';
          ctx.fill();
          ctx.lineWidth = 1 / scale; // Adjust line width based on scale
          ctx.strokeStyle = 'black';
          ctx.stroke();
          offsetLeft -= space;

          if (showNumbers) {
            ctx.fillStyle = 'black';
            ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.scale(1, -1); // Flip text vertically
            ctx.fillText(remaining.number.toString(), x + length / 2, -(y - width / 2));
            ctx.restore();
          }
        }
      } else if (remaining.cut.includes('left') && remaining.cut.includes('right')) {
        offsetLeft -= remaining.length;
        const x = offsetLeft;
        const y = row.segments[0].y;
        const width = row.segments[0].width;
        const length = remaining.length;
        ctx.beginPath();
        ctx.rect(x, y, length, -width);
        ctx.fillStyle = 'rgba(42,165,44,0.7)';
        ctx.fill();
        ctx.lineWidth = 1 / scale; // Adjust line width based on scale
        ctx.strokeStyle = 'black';
        ctx.stroke();
        offsetLeft -= space;

        if (showNumbers) {
          ctx.fillStyle = 'black';
          ctx.font = `${12 / scale}px Arial`; // Adjust font size based on scale
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.save();
          ctx.scale(1, -1); // Flip text vertically
          ctx.fillText(remaining.number.toString(), x + length / 2, -(y - width / 2));
          ctx.restore();
        }
      }
    });
  }
}

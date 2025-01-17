fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file.');
    return;
  }
  reset();
  loadDXFFile(file);
});

function rotateBy(angleDeg) {
  currentRotateAngle += angleDeg;
  // 1) Reset to original geometry
  let tempFloorPlanLines = originalFloorPlanLines.map(line => ({...line}));

  // 2) Convert angle to radians
  const angleRad = currentRotateAngle * (Math.PI / 180);

  // 4) For each line, rotate endpoints
  for (let i = 0; i < tempFloorPlanLines.length; i++) {
    const line = tempFloorPlanLines[i];

    // rotate (x1,y1)
    const {x: rx1, y: ry1} = rotatePoint(line.x1, line.y1, 0, 0, angleRad);
    // rotate (x2,y2)
    const {x: rx2, y: ry2} = rotatePoint(line.x2, line.y2, 0, 0, angleRad);

    floorPlanLines[i].x1 = rx1;
    floorPlanLines[i].y1 = ry1;
    floorPlanLines[i].x2 = rx2;
    floorPlanLines[i].y2 = ry2;
  }

  floorPlanBounds = getFloorPlanBounds();
  drawCanvas();
}

function validate() {
  if (floorPlanLines.length < 4) {
    // todo add validation on closed space
    console.log('Please complete the floor plan');
    return false;
  }
  return true
}

function completeTheFloor() {
  if (!validate()) {
    return;
  }

  while (true) {
    const addedRow = computeNewRow();
    if (!addedRow) {
      break;
    }
  }

  while (true) {
    const addedBoard = computeNewBoard();
    if (!addedBoard) {
      break;
    }
  }
}

function computeRow() {
  validate();
  computeNewRow();
  updateStatistics();
  drawCanvas();
}

function computeBord() {
  validate();
  computeNewBoard();
  updateStatistics();
  drawCanvas();
}

function computeNewRow() {
  const rowNumber = rows.length + 1;
  const row = {
    segments: [], remainings: [], number: rowNumber
  };

  const rowTopHorizontalSegment = {
    x1: floorPlanBounds.minX,
    y1: floorPlanBounds.maxY - (rowNumber - 1) * boardWidth - boardWidthOffset,
    x2: floorPlanBounds.maxX,
    y2: floorPlanBounds.maxY - (rowNumber - 1) * boardWidth - boardWidthOffset
  };

  const rowBottomHorizontalSegment = {
    x1: floorPlanBounds.minX,
    y1: rowTopHorizontalSegment.y1 - boardWidth,
    x2: floorPlanBounds.maxX,
    y2: rowTopHorizontalSegment.y2 - boardWidth
  };

  const topSegmentIntersectionPoints = [];
  const bottomSegmentIntersectionPoints = [];
  for (let i = 0; i < floorPlanLines.length; i++) {
    const topSegmentIntersectionPoint = getLineIntersection(floorPlanLines[i], rowTopHorizontalSegment);
    if (topSegmentIntersectionPoint != null) {
      topSegmentIntersectionPoints.push(topSegmentIntersectionPoint);
    }

    const bottomSegmentIntersectionPoint = getLineIntersection(floorPlanLines[i], rowBottomHorizontalSegment);
    if (bottomSegmentIntersectionPoint != null) {
      bottomSegmentIntersectionPoints.push(bottomSegmentIntersectionPoint);
    }
  }

  topSegmentIntersectionPoints.sort(function (a, b) {
    return a.x - b.x
  });
  bottomSegmentIntersectionPoints.sort(function (a, b) {
    return a.x - b.x
  });

  let rowMinX = null;
  let rowTopMinX = null;
  let rowBottomMinX = null;
  let rowMaxX = null;
  let rowTopMaxX = null;
  let rowBottomMaxX = null;
  if (topSegmentIntersectionPoints.length > 0 && bottomSegmentIntersectionPoints.length > 0) {
    rowTopMinX = topSegmentIntersectionPoints[0].x;
    rowBottomMinX = bottomSegmentIntersectionPoints[0].x;
    rowMinX = Math.min(rowTopMinX, rowBottomMinX);
    rowTopMaxX = topSegmentIntersectionPoints[topSegmentIntersectionPoints.length - 1].x;
    rowBottomMaxX = bottomSegmentIntersectionPoints[bottomSegmentIntersectionPoints.length - 1].x;
    rowMaxX = Math.max(rowTopMaxX, rowBottomMaxX);
  } else if (topSegmentIntersectionPoints.length > 0) {
    rowTopMinX = topSegmentIntersectionPoints[0].x;
    rowMinX = rowTopMinX;
    rowTopMaxX = topSegmentIntersectionPoints[topSegmentIntersectionPoints.length - 1].x;
    rowMaxX = rowTopMaxX;
  } else if (bottomSegmentIntersectionPoints.length > 0) {
    rowBottomMinX = bottomSegmentIntersectionPoints[0].x;
    rowMinX = rowBottomMinX
    rowBottomMaxX = bottomSegmentIntersectionPoints[bottomSegmentIntersectionPoints.length - 1].x;
    rowMaxX = rowBottomMaxX;
  } else {
    //console.log("Could not indetify minY/maxY");
  }

  let nextTopMinX = rowMinX;
  let nextBottomMinX = rowMinX;
  let j = 0;
  while (true) {
    //console.log("Find starting Y");
    let foundTopMinX = false;
    for (let i = 0; i < topSegmentIntersectionPoints.length; i++) {
      if (topSegmentIntersectionPoints[i].x >= nextTopMinX) {
        nextTopMinX = topSegmentIntersectionPoints[i].x;
        foundTopMinX = true;
        break;
      }
    }
    let foundBottomMinX = false;
    for (let i = 0; i < bottomSegmentIntersectionPoints.length; i++) {
      if (bottomSegmentIntersectionPoints[i].x >= nextBottomMinX) {
        nextBottomMinX = bottomSegmentIntersectionPoints[i].x;
        foundBottomMinX = true;
        break;
      }
    }
    let minX;
    let maxX;
    if (foundTopMinX && foundBottomMinX) {
      minX = Math.min(nextTopMinX, nextBottomMinX);
    } else if (foundTopMinX) {
      minX = nextTopMinX;
    } else if (foundBottomMinX) {
      minX = nextBottomMinX;
    } else {
      maxX = null;
    }

    //console.log("Find end of segment");
    let nextTopMaxX = rowMaxX + 1;
    let foundTopMaxX = false;
    for (let i = 0; i < topSegmentIntersectionPoints.length; i++) {
      if (topSegmentIntersectionPoints[i].x > nextTopMinX) {
        nextTopMaxX = topSegmentIntersectionPoints[i].x;
        foundTopMaxX = true;
        break;
      }
    }
    let nextBottomMaxX = rowMaxX + 1;
    let foundBottomMaxX = false;
    for (let i = 0; i < bottomSegmentIntersectionPoints.length; i++) {
      if (bottomSegmentIntersectionPoints[i].x > nextBottomMinX) {
        nextBottomMaxX = bottomSegmentIntersectionPoints[i].x;
        foundBottomMaxX = true;
        break;
      }
    }

    if (foundTopMaxX && foundBottomMaxX) {
      if (nextTopMaxX < nextBottomMinX) {
        maxX = nextTopMaxX;
      } else if (nextBottomMaxX < nextTopMinX) {
        maxX = nextBottomMaxX;
      } else {
        maxX = Math.max(nextTopMaxX, nextBottomMaxX);
      }
    } else if (foundTopMaxX) {
      maxX = nextTopMaxX;
    } else if (foundBottomMaxX) {
      maxX = nextBottomMaxX;
    } else {
      maxX = null;
    }

    if (nextTopMaxX === rowMaxX + 1 && nextBottomMaxX === rowMaxX + 1) {
      //console.log("maxY wasn't found");
      break;
    } else {
      let segmentLength = maxX - minX;
      row.segments.push({
        x: minX,
        y: rowTopHorizontalSegment.y1,
        length: segmentLength,
        width: rowTopHorizontalSegment.y1 - rowBottomHorizontalSegment.y1,
        boards: [],
        row: row,
        number: j + 1,
        remainingLength: segmentLength
      });
      nextTopMinX = maxX + 1;
      nextBottomMinX = nextTopMinX;
    }
    j++;
  }

  if (row.segments.length > 0) {
    rows.push(row);
    return true;
  } else {
    return false;
  }

}

function findAvailableSegment() {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.segments.length; j++) {
      const segment = row.segments[j];
      if (segment.remainingLength > 0) {
        return segment;
      }
    }
  }
}

function findMaxBoardNumber() {
  let maxBoardNumber = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.segments.length; j++) {
      const segment = row.segments[j];
      for (let k = 0; k < segment.boards.length; k++) {
        const board = segment.boards[k];
        maxBoardNumber = Math.max(maxBoardNumber, board.number);
      }
    }
  }
  return maxBoardNumber;
}

function calculateTotalFloorSquareValue() {
  let totalSquare = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.segments.length; j++) {
      const segment = row.segments[j];
      for (let k = 0; k < segment.boards.length; k++) {
        const board = segment.boards[k];
        totalSquare += board.length * board.width;
      }
    }
  }
  return Math.round(totalSquare * 0.0001) / 100;
}

function calculateTotalRemainingSquareValue() {
  let totalSquare = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.remainings.length; j++) {
      const remaining = row.remainings[j];
      if (!remaining.reused || remaining.cut === 'both') {
        totalSquare += remaining.length * row.segments[0].width;
      }
    }
  }
  return Math.round(totalSquare * 0.0001) / 100;
}

function findMinimalCutBoard(cut) {
  let minimalCutBoard = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.remainings.length; j++) {
      const remaining = row.remainings[j];
      if (remaining.cut === cut && !remaining.reused) {
        if (minimalCutBoard == null || remaining.length < minimalCutBoard.length) {
          if (!doNotUseSmallRemainingsCheckbox.checked || remaining.length > minBoardLength) {
            minimalCutBoard = remaining
          }
        }
      }
    }
  }
  return minimalCutBoard;
}

function findBoardToReuse(cut, length) {
  let remainings = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.remainings.length; j++) {
      const remaining = row.remainings[j];
      if (remaining.cut === cut && !remaining.reused) {
        remainings.push(remaining);
      }
    }
  }
  remainings.sort((a, b) => {
    a.length - b.length
  });
  for (let i = 0; i < remainings.length; i++) {
    const remaining = remainings[i];
    if (remaining.length >= length) {
      return remaining;
    }
  }
  return null;
}

function findNearBoardEndX(firstBoardEndX, currentBoardEndX) {
  if (firstBoardEndX < currentBoardEndX) {
    while (true) {
      if (firstBoardEndX < currentBoardEndX) {
        firstBoardEndX += boardLength;
      } else {
        firstBoardEndX -= boardLength;
        break;
      }
    }
  } else if (firstBoardEndX > currentBoardEndX) {
    while (true) {
      if (firstBoardEndX > currentBoardEndX) {
        firstBoardEndX -= boardLength;
      } else {
        break;
      }
    }
  }
  return firstBoardEndX;
}

function findFirstBoard(previousRow, availableSegment) {
  for (let i = 0; i < previousRow.segments.length; i++) {
    const previousSegment = previousRow.segments[i];
    for (let j = 0; j < previousSegment.boards.length; j++) {
      const previousBoard = previousSegment.boards[j];
      if (previousBoard.y >= availableSegment.y) {
        return previousBoard;
      }
    }
  }
}

function computeNewBoard() {
  //console.log("Find last not completed row and segment")
  if (rows.length === 0) {
    alert('Please add at least one row.');
    throw new Error('Please add at least one row.');
  }

  const availableSegment = findAvailableSegment();
  // Calculate Bord Length that need to be added
  let currentBordLength = boardLength;
  let currentBordNumber = findMaxBoardNumber() + 1;
  if (availableSegment == null) {
    //console.log("There is no available Segments to add board");
    return false;
  } else {
    if (availableSegment.number === 1 && availableSegment.row.number === 1 && availableSegment.boards.length === 0) {
      // This is first segment
      //console.log("Found first segment which is empty. Add first board ever");
      if (boardLengthOffset < 0) {
        // need to cut first board
        currentBordLength = boardLength + boardLengthOffset;
        if (doNotUseSmallRemainingsCheckbox.checked && currentBordLength < minBoardLength) {
          currentBordLength = minBoardLength;
        }
        rows[0].remainings.push({
          length: boardLength - currentBordLength, number: 1, cut: 'right', reused: false
        });
      }
    } else {
      if (availableSegment.boards.length === 0) {
        //console.log("Found available segment does not have boards, let see how to add first one");
        // available segment does not have boards, lets see what can be added at beginning
        if (arrangeModeSelect.value === 'continue') {
          let boardCutByRight = findMinimalCutBoard('left');
          if (boardCutByRight != null) {
            currentBordLength = boardCutByRight.length;
            currentBordNumber = boardCutByRight.number;
            boardCutByRight.reused = true;
          }
        } else {
          let delta;
          if (arrangeModeSelect.value === 'halfShift') {
            delta = boardLength / 2;
          } else if (arrangeModeSelect.value === 'thirdShift') {
            delta = boardLength / 3;
          } else {
            delta = parseInt(customArrangeBoardOffsetInput.value);//* (availableSegment.row.number - 1);
          }

          if (availableSegment.row.number === 1) {
            let boardCutByRight = findMinimalCutBoard('left');
            if (boardCutByRight != null) {
              currentBordLength = boardCutByRight.length;
              currentBordNumber = boardCutByRight.number;
              boardCutByRight.reused = true;
            }
          } else {
            let firstBoard = null;
            const previousRow = rows[availableSegment.row.number - 2];
            firstBoard = findFirstBoard(previousRow, availableSegment);

            if (firstBoard == null) {
              const previousSegment = previousRow.segments[previousRow.segments.length - 1];
              firstBoard = previousSegment.boards[previousSegment.boards.length - 1];
            }

            let firstBoardEndX = firstBoard.x + firstBoard.length;

            firstBoardEndX += delta;

            let currentBoardEndX = availableSegment.x + currentBordLength;
            firstBoardEndX = findNearBoardEndX(firstBoardEndX, currentBoardEndX);
            currentBordLength = firstBoardEndX - availableSegment.x;

            currentBordLength = Math.round(firstBoardEndX - availableSegment.x);
            if (currentBordLength <= 0) {
              currentBordLength = currentBordLength + boardLength;
            }

            let boardToReuse = findBoardToReuse('left', currentBordLength);
            if (boardToReuse != null) {
              currentBordNumber = boardToReuse.number;
              boardToReuse.reused = true;

              if (boardToReuse.length > currentBordLength) {
                // need to cut reused board
                availableSegment.row.remainings.push({
                  length: boardToReuse.length - currentBordLength, number: boardToReuse.number, cut: 'both', reused: true
                });
              }
            } else {
              if (boardLength > currentBordLength) {
                // need to cut new board
                availableSegment.row.remainings.push({
                  length: boardLength - currentBordLength, number: currentBordNumber, cut: 'right', reused: false
                });
              }
            }
          }
        }
      }
    }
  }

  if (availableSegment.remainingLength >= currentBordLength) {
    availableSegment.boards.push({
      x: availableSegment.x + availableSegment.length - availableSegment.remainingLength,
      y: availableSegment.y,
      width: availableSegment.width,
      length: currentBordLength,
      number: currentBordNumber,
      remainingLength: 0,
      segment: availableSegment
    });
    availableSegment.remainingLength -= currentBordLength;
  } else {
    // need to cut
    const cutLength = currentBordLength - availableSegment.remainingLength;
    availableSegment.boards.push({
      x: availableSegment.x + availableSegment.length - availableSegment.remainingLength,
      y: availableSegment.y,
      width: availableSegment.width,
      length: availableSegment.remainingLength,
      number: currentBordNumber,
      remainingLength: 0,
      segment: availableSegment
    });
    availableSegment.remainingLength = 0;

    availableSegment.row.remainings.push({
      length: cutLength, number: currentBordNumber, cut: 'left', reused: false
    });

  }
  return true;
}

function updateStatistics() {
  let maxNumberOfBoards = findMaxBoardNumber();
  totalNumberOfBoardsValue.value = maxNumberOfBoards;
  let totalSquareOfBoardsValueValue = Math.round(maxNumberOfBoards * boardLength * boardWidth * 0.0001) / 100;
  totalSquareOfBoardsValue.value = totalSquareOfBoardsValueValue;
  totalFloorSquareValue.value = calculateTotalFloorSquareValue();
  totalRemainingSquareValue.value = calculateTotalRemainingSquareValue();
  totalCostValue.value = totalSquareOfBoardsValueValue * boardCost;
}

function exportPdf() {
  // Convert the canvas to a data URL (base64-encoded image)
  const dataUrl = floorCanvas.toDataURL('image/png'); // or 'image/jpeg'

  // Create a new jsPDF instance
  // Assuming the user includes jsPDF via the CDN, we can use:
  const {jsPDF} = window.jspdf; // from the global namespace
  const pdf = new jsPDF({
    orientation: 'landscape', // or 'portrait'
    unit: 'px', // you can also use 'pt', 'mm', etc.
    format: [floorCanvas.width, floorCanvas.height]
    // setting format to canvas dimension ensures 1:1 match
  });

  // Add the canvas image to the PDF
  // x=0, y=0 => top-left, canvas dimensions => fill entire PDF page
  pdf.addImage(dataUrl, 'PNG', 0, 0, floorCanvas.width, floorCanvas.height);

  // Download the PDF
  pdf.save('floor-plan.pdf');
}

function addALine() {
  const x1 = parseInt(addALineStartXInput.value);
  const y1 = parseInt(addALineStartYInput.value);
  const x2 = parseInt(addALineEndXInput.value);
  const y2 = parseInt(addALineEndYInput.value);

  // Create a line object and push to floorPlanLines
  const newLine = {x1, y1, x2, y2};
  floorPlanLines.push(newLine);

  // Recalculate bounds and corners, then draw
  floorPlanBounds = getFloorPlanBounds();
  cornerPoints = getCornerPoints();
  drawCanvas();
}

function addARectangle() {

  const x1 = parseInt(addARectangleStartXInput.value);
  const y1 = parseInt(addARectangleStartYInput.value);
  const x2 = parseInt(addARectangleEndXInput.value);
  const y2 = parseInt(addARectangleEndYInput.value);

  const rectLines = [
    {x1: x1, y1: y1, x2: x2, y2: y1}, // top edge
    {x1: x2, y1: y1, x2: x2, y2: y2}, // right edge
    {x1: x2, y1: y2, x2: x1, y2: y2}, // bottom edge
    {x1: x1, y1: y2, x2: x1, y2: y1}  // left edge
  ];

  // Push them into floorPlanLines
  rectLines.forEach(line => floorPlanLines.push(line));

  // Recalculate bounds and corners, then draw
  floorPlanBounds = getFloorPlanBounds();
  cornerPoints = getCornerPoints();
  drawCanvas();
}

function update() {
  reset();
  completeTheFloor();
  updateStatistics();
  drawCanvas();
}

function rotateViewportBy(angle) {
  currentRotateViewPortAngle += angle;
  drawCanvas();
}
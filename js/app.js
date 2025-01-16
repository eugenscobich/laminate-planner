fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file.');
    return;
  }
  reset();
  loadDXFFile(file);
});


function addALine() {
  const x1 = parseInt(addALineStartXInput.value);
  const y1 = parseInt(addALineStartYInput.value);
  const x2 = parseInt(addALineEndXInput.value);
  const y2 = parseInt(addALineEndYInput.value);

  // Create a line object and push to floorPlanLines
  const newLine = { x1, y1, x2, y2 };
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
    { x1: x1,  y1: y1,    x2: x2, y2: y1    }, // top edge
    { x1: x2, y1: y1,    x2: x2, y2: y2 }, // right edge
    { x1: x2, y1: y2, x2: x1,  y2: y2 }, // bottom edge
    { x1: x1,  y1: y2, x2: x1,  y2: y1    }  // left edge
  ];

  // Push them into floorPlanLines
  rectLines.forEach(line => floorPlanLines.push(line));

  // Recalculate bounds and corners, then draw
  floorPlanBounds = getFloorPlanBounds();
  cornerPoints = getCornerPoints();
  drawCanvas();
}

function validate() {
  if (!selectedCorner) {
    alert('Please select a starting corner on the floor plan.');
    throw new Error('Please select a starting corner on the floor plan.');
  }
}

function rotateBy(angleDeg) {
  // 1) Reset to original geometry
  let tempFloorPlanLines = floorPlanLines.map(line => ({...line}));

  // 2) Convert angle to radians
  const angleRad = angleDeg * (Math.PI / 180);

  // 4) For each line, rotate endpoints
  for (let i = 0; i < tempFloorPlanLines.length; i++) {
    const line = tempFloorPlanLines[i];

    // rotate (x1,y1)
    const { x: rx1, y: ry1 } = rotatePoint(line.x1, line.y1, 0, 0, angleRad);
    // rotate (x2,y2)
    const { x: rx2, y: ry2 } = rotatePoint(line.x2, line.y2, 0, 0, angleRad);

    floorPlanLines[i].x1 = rx1;
    floorPlanLines[i].y1 = ry1;
    floorPlanLines[i].x2 = rx2;
    floorPlanLines[i].y2 = ry2;
  }

  floorPlanBounds = getFloorPlanBounds();
  cornerPoints = getCornerPoints();
  drawCanvas();
}



function completeTheFloor() {
  validate();
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

  updateStatistics();
  drawCanvas();
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
  const rowDirection = findRowDirection();
  const rowNumber = rows.length + 1;
  const row = {
    direction: rowDirection, segments: [], remainings: [], number: rowNumber
  };

  if (rowDirection === 'up') {
    const rowLeftVerticalSegment = {
      x1: floorPlanBounds.minX + (rowNumber - 1) * boardWidth + boardWidthOffset,
      y1: floorPlanBounds.minY,
      x2: floorPlanBounds.minX + (rowNumber - 1) * boardWidth + boardWidthOffset,
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
      const leftSegmentIntersectionPoint = getLineIntersection(floorPlanLines[i], rowLeftVerticalSegment);
      if (leftSegmentIntersectionPoint != null) {
        leftSegmentIntersectionPoints.push(leftSegmentIntersectionPoint);
      }

      const rightSegmentIntersectionPoint = getLineIntersection(floorPlanLines[i], rowRightVerticalSegment);
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
    if (leftSegmentIntersectionPoints.length > 0 && rightSegmentIntersectionPoints.length > 0) {
      rowLeftMinY = leftSegmentIntersectionPoints[0].y;
      rowRightMinY = rightSegmentIntersectionPoints[0].y;
      rowMinY = Math.min(rowLeftMinY, rowRightMinY);
      rowLeftMaxY = leftSegmentIntersectionPoints[leftSegmentIntersectionPoints.length - 1].y;
      rowRightMaxY = rightSegmentIntersectionPoints[rightSegmentIntersectionPoints.length - 1].y;
      rowMaxY = Math.max(rowLeftMaxY, rowRightMaxY);
    } else if (leftSegmentIntersectionPoints.length > 0) {
      rowLeftMinY = leftSegmentIntersectionPoints[0].y;
      rowMinY = rowLeftMinY;
      rowLeftMaxY = leftSegmentIntersectionPoints[leftSegmentIntersectionPoints.length - 1].y;
      rowMaxY = rowLeftMaxY;
    } else if (rightSegmentIntersectionPoints.length > 0) {
      rowRightMinY = rightSegmentIntersectionPoints[0].y;
      rowMinY = rowRightMinY
      rowRightMaxY = rightSegmentIntersectionPoints[rightSegmentIntersectionPoints.length - 1].y;
      rowMaxY = rowRightMaxY;
    } else {
      //console.log("Could not indetify minY/maxY");
    }

    let nextLeftMinY = rowMinY;
    let nextRightMinY = rowMinY;
    let j = 0;
    while (true) {
      //console.log("Find starting Y");
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

      //console.log("Find end of segment");
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
        //console.log("maxY wasn't found");
        break;
      } else {
        row.segments.push({
          x: rowLeftVerticalSegment.x1,
          y: minY,
          width: rowRightVerticalSegment.x1 - rowLeftVerticalSegment.x1,
          height: maxY - minY,
          boards: [],
          row: row,
          number: j + 1,
          remainingHeight: maxY - minY
        });
        nextLeftMinY = maxY + 1;
        nextRightMinY = nextLeftMinY;
      }
      j++;
    }
  } else if (rowDirection === 'right') {
    const rowLeftHorizontalSegment = {
      x1: floorPlanBounds.minX,
      y1: floorPlanBounds.minY + (rowNumber - 1) * boardWidth + boardWidthOffset,
      x2: floorPlanBounds.maxX,
      y2: floorPlanBounds.maxY + (rowNumber - 1) * boardWidth + boardWidthOffset
    };

    const rowRightHorizontalSegment = {
      x1: floorPlanBounds.minX,
      y1: rowRightHorizontalSegment.y1 + boardWidth,
      x2: floorPlanBounds.maxX,
      y2: rowRightHorizontalSegment.y1 + boardWidth
    };
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
      if (segment.remainingHeight > 0) {
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

function calculatetotalFloorSquareValue() {
  let totalSquare = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.segments.length; j++) {
      const segment = row.segments[j];
      for (let k = 0; k < segment.boards.length; k++) {
        const board = segment.boards[k];
        totalSquare += board.height * board.width;
      }
    }
  }
  return Math.round(totalSquare * 0.0001) / 100;
}

function calculatetotalRemainingSquareValue() {
  let totalSquare = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.remainings.length; j++) {
      const remaining = row.remainings[j];
      if (!remaining.reused || remaining.cut === 'both') {
        totalSquare += remaining.height * row.segments[0].width;
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
        if (minimalCutBoard == null || remaining.height < minimalCutBoard.height) {
          if (!doNotUseSmallRemainingsCheckbox.checked || remaining.height > minBoardHeight) {
            minimalCutBoard = remaining
          }
        }
      }
    }
  }
  return minimalCutBoard;
}

function findBoardToReuse(cut, height) {
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
    a.height - b.height
  });
  for (let i = 0; i < remainings.length; i++) {
    const remaining = remainings[i];
    if (remaining.height >= height) {
      return remaining;
    }
  }
  return null;
}

function findNearBoardEndY(firstBoardEndY, currentBoardEndY) {
  if (firstBoardEndY < currentBoardEndY) {
    while (true) {
      if (firstBoardEndY < currentBoardEndY) {
        firstBoardEndY += boardHeight;
      } else {
        firstBoardEndY -= boardHeight;
        break;
      }
    }
  } else if (firstBoardEndY > currentBoardEndY) {
    while (true) {
      if (firstBoardEndY > currentBoardEndY) {
        firstBoardEndY -= boardHeight;
      } else {
        break;
      }
    }
  }
  return firstBoardEndY;
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
  // Calculate Bord Height that need to be added
  let currentBordHeight = boardHeight;
  let currentBordNumber = findMaxBoardNumber() + 1;
  if (availableSegment == null) {
    //console.log("There is no available Segments to add board");
    return false;
  } else {
    if (availableSegment.number === 1 && availableSegment.row.number === 1 && availableSegment.boards.length === 0) {
      // This is first segment
      //console.log("Found first segment which is empty. Add first board ever");
      if (boardHeightOffset < 0) {
        // need to cut first board
        currentBordHeight = boardHeight + boardHeightOffset;
        if (doNotUseSmallRemainingsCheckbox.checked && currentBordHeight < minBoardHeight) {
          currentBordHeight = minBoardHeight;
        }
        rows[0].remainings.push({
          height: boardHeight - currentBordHeight, number: 1, cut: 'right', reused: false
        });
      }
    } else {
      if (availableSegment.boards.length === 0) {
        //console.log("Found available segment does not have boards, let see how to add first one");
        // available segment does not have boards, lets see what can be added at beginning
        if (arrangeModeSelect.value === 'continue') {
          let boardCutByRight = findMinimalCutBoard('left');
          if (boardCutByRight != null) {
            currentBordHeight = boardCutByRight.height;
            currentBordNumber = boardCutByRight.number;
            boardCutByRight.reused = true;
          }
        } else if (arrangeModeSelect.value === 'halfShift') {
          // need to find first board endY
        } else if (arrangeModeSelect.value === 'thirdShift') {
          const firstBoard = rows[0].segments[0].boards[0];
          let firstBoardEndY = firstBoard.y + firstBoard.height;
          if (availableSegment.row.number % 3 === 1) {
            // first row
            let currentBoardEndY = availableSegment.y + currentBordHeight;
            firstBoardEndY = findNearBoardEndY(firstBoardEndY, currentBoardEndY);
            currentBordHeight = firstBoardEndY - availableSegment.y;
          } else if (availableSegment.row.number % 3 === 2) {
            // every second row
            let currentBoardEndY = availableSegment.y + currentBordHeight;
            firstBoardEndY = findNearBoardEndY(firstBoardEndY, currentBoardEndY);
            currentBordHeight = Math.round(firstBoardEndY - availableSegment.y - boardHeight * 0.33);
            if (currentBordHeight <= 0) {
              currentBordHeight = Math.round(firstBoardEndY + boardHeight - availableSegment.y - boardHeight * 0.33);
            }
          } else if (availableSegment.row.number % 3 === 0) {
            // every third row
            let currentBoardEndY = availableSegment.y + currentBordHeight;
            firstBoardEndY = findNearBoardEndY(firstBoardEndY, currentBoardEndY);
            currentBordHeight = Math.round(firstBoardEndY - availableSegment.y - boardHeight * 0.66);
            if (currentBordHeight <= 0) {
              currentBordHeight = Math.round(firstBoardEndY + boardHeight - availableSegment.y - boardHeight * 0.66);
            }
          }

          let boardToReuse = findBoardToReuse('left', currentBordHeight);
          if (boardToReuse != null) {
            currentBordNumber = boardToReuse.number;
            boardToReuse.reused = true;

            if (boardToReuse.height > currentBordHeight) {
              // need to cut reused board
              availableSegment.row.remainings.push({
                height: boardToReuse.height - currentBordHeight, number: boardToReuse.number, cut: 'both', reused: true
              });
            }
          } else {
            if (boardHeight > currentBordHeight) {
              // need to cut new board
              availableSegment.row.remainings.push({
                height: boardHeight - currentBordHeight, number: currentBordNumber, cut: 'right', reused: false
              });
            }
          }
        } else if (arrangeModeSelect.value === 'custom') {
          if (availableSegment.row.number === 1) {
            let boardCutByRight = findMinimalCutBoard('left');
            if (boardCutByRight != null) {
              currentBordHeight = boardCutByRight.height;
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

            let firstBoardEndY = firstBoard.y + firstBoard.height;
            const delta = parseFloat(customArrangeBoardOffsetInput.value);//* (availableSegment.row.number - 1);
            firstBoardEndY += delta;

            let currentBoardEndY = availableSegment.y + currentBordHeight;
            firstBoardEndY = findNearBoardEndY(firstBoardEndY, currentBoardEndY);
            currentBordHeight = firstBoardEndY - availableSegment.y;

            currentBordHeight = Math.round(firstBoardEndY - availableSegment.y);
            if (currentBordHeight <= 0) {
              currentBordHeight = currentBordHeight + boardHeight;
            }

            let boardToReuse = findBoardToReuse('left', currentBordHeight);
            if (boardToReuse != null) {
              currentBordNumber = boardToReuse.number;
              boardToReuse.reused = true;

              if (boardToReuse.height > currentBordHeight) {
                // need to cut reused board
                availableSegment.row.remainings.push({
                  height: boardToReuse.height - currentBordHeight, number: boardToReuse.number, cut: 'both', reused: true
                });
              }
            } else {
              if (boardHeight > currentBordHeight) {
                // need to cut new board
                availableSegment.row.remainings.push({
                  height: boardHeight - currentBordHeight, number: currentBordNumber, cut: 'right', reused: false
                });
              }
            }
          }
        }
      }
    }
  }

  if (availableSegment.remainingHeight >= currentBordHeight) {
    availableSegment.boards.push({
      x: availableSegment.x,
      y: availableSegment.y + availableSegment.height - availableSegment.remainingHeight,
      width: availableSegment.width,
      height: currentBordHeight,
      number: currentBordNumber,
      remainingHeight: 0,
      segment: availableSegment
    });
    availableSegment.remainingHeight -= currentBordHeight;
  } else {
    // need to cut
    const cutHeight = currentBordHeight - availableSegment.remainingHeight;
    availableSegment.boards.push({
      x: availableSegment.x,
      y: availableSegment.y + availableSegment.height - availableSegment.remainingHeight,
      width: availableSegment.width,
      height: availableSegment.remainingHeight,
      number: currentBordNumber,
      remainingHeight: 0,
      segment: availableSegment
    });
    availableSegment.remainingHeight = 0;

    availableSegment.row.remainings.push({
      height: cutHeight, number: currentBordNumber, cut: 'left', reused: false
    });

  }
  return true;
}

function updateStatistics() {
  let maxNumberOfBoards = findMaxBoardNumber();
  totalNumberOfBoardsValue.innerText = maxNumberOfBoards;
  let totalSquareOfBoardsValueValue = Math.round(maxNumberOfBoards * boardHeight * boardWidth * 0.0001) / 100;
  totalSquareOfBoardsValue.innerText = totalSquareOfBoardsValueValue;
  totalFloorSquareValue.innerText = calculatetotalFloorSquareValue();
  totalRemainingSquareValue.innerText = calculatetotalRemainingSquareValue();
  totalCostValue.innerText = totalSquareOfBoardsValueValue * boardCost;
}



function exportPdf() {
  // Convert the canvas to a data URL (base64-encoded image)
  const dataUrl = floorCanvas.toDataURL('image/png'); // or 'image/jpeg'

  // Create a new jsPDF instance
  // Assuming the user includes jsPDF via the CDN, we can use:
  const { jsPDF } = window.jspdf; // from the global namespace
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
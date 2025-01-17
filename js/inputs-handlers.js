widthInput.addEventListener('change', () => {
  boardWidthOffsetRangeInput.min = -parseInt(widthInput.value);
  boardWidthOffsetInput.min = -parseInt(widthInput.value);
  update();
})

boardWidthOffsetInput.addEventListener('change', () => {
  boardWidthOffsetRangeInput.value = boardWidthOffsetInput.value;
  update();
})
boardWidthOffsetRangeInput.addEventListener('input', () => {
  boardWidthOffsetInput.value = boardWidthOffsetRangeInput.value;
  update();
})
boardWidthOffsetRangeInput.addEventListener('wheel', function (e) {
  e.preventDefault();
  const step = 1;
  let currentValue = parseInt(boardWidthOffsetRangeInput.value) || 0;
  const minValue = parseInt(boardWidthOffsetRangeInput.min) || -Infinity;
  const maxValue = parseInt(boardWidthOffsetRangeInput.max) || Infinity;

  if (e.deltaY < 0) {
    currentValue += step;
    if (currentValue > maxValue) {
      currentValue = maxValue;
    }
  } else {
    currentValue -= step;
    if (currentValue < minValue) {
      currentValue = minValue;
    }
  }
  boardWidthOffsetInput.value = currentValue;
  boardWidthOffsetRangeInput.value = currentValue;
  update();
});

lengthInput.addEventListener('change', () => {
  let length = parseInt(lengthInput.value);
  boardLengthOffsetRangeInput.min = -length;
  boardLengthOffsetInput.min = -length;
  customArrangeBoardOffsetInput.min = -length;
  customArrangeBoardOffsetInput.max = length;

  customArrangeBoardOffsetRangeInput.min = -length;
  customArrangeBoardOffsetRangeInput.max = length;
  update();
})

boardLengthOffsetInput.addEventListener('change', () => {
  boardLengthOffsetRangeInput.value = boardLengthOffsetInput.value;
  update();
})
boardLengthOffsetRangeInput.addEventListener('input', () => {
  boardLengthOffsetInput.value = boardLengthOffsetRangeInput.value;
  update();
})
boardLengthOffsetRangeInput.addEventListener('wheel', function (e) {
  e.preventDefault();
  const step = 1;
  let currentValue = parseInt(boardLengthOffsetRangeInput.value) || 0;
  const minValue = parseInt(boardLengthOffsetRangeInput.min) || -Infinity;
  const maxValue = parseInt(boardLengthOffsetRangeInput.max) || Infinity;

  if (e.deltaY < 0) {
    currentValue += step;
    if (currentValue > maxValue) {
      currentValue = maxValue;
    }
  } else {
    currentValue -= step;
    if (currentValue < minValue) {
      currentValue = minValue;
    }
  }
  boardLengthOffsetRangeInput.value = currentValue;
  boardLengthOffsetInput.value = currentValue;
  update();
});

arrangeModeSelect.addEventListener('change', function () {
  update();
});

customArrangeBoardOffsetInput.addEventListener('change', function () {
  customArrangeBoardOffsetRangeInput.value = customArrangeBoardOffsetInput.value;
  update();
});
customArrangeBoardOffsetRangeInput.addEventListener('input', function () {
  customArrangeBoardOffsetInput.value = customArrangeBoardOffsetRangeInput.value;
  update();
});
customArrangeBoardOffsetRangeInput.addEventListener('wheel', function (e) {
  e.preventDefault();
  const step = 1;
  let currentValue = parseInt(customArrangeBoardOffsetRangeInput.value) || 0;
  const minValue = parseInt(customArrangeBoardOffsetRangeInput.min) || -Infinity;
  const maxValue = parseInt(customArrangeBoardOffsetRangeInput.max) || Infinity;

  if (e.deltaY < 0) {
    currentValue += step;
    if (currentValue > maxValue) {
      currentValue = maxValue;
    }
  } else {
    currentValue -= step;
    if (currentValue < minValue) {
      currentValue = minValue;
    }
  }
  customArrangeBoardOffsetInput.value = currentValue;
  customArrangeBoardOffsetRangeInput.value = currentValue;

  update();
});

minBoardLengthInput.addEventListener('change', () => {
  update();
})

addRowButton.addEventListener('click', function () {
  computeRow();
});

addBoardButton.addEventListener('click', function () {
  computeBord();
});

fullCompleteButton.addEventListener('click', function () {
  update();
});

showNumbersCheckbox.addEventListener('change', function () {
  showNumbers = showNumbersCheckbox.checked;
  drawCanvas();
});

doNotUseSmallRemainingsCheckbox.addEventListener('change', function () {
  update();
});


rotateBy45Button.addEventListener('click', function () {
  reset();
  rotateBy(45);
});

addALineModalElement.addEventListener('show.bs.modal', event => {
  addALineStartXInput.value = '';
  addALineStartYInput.value = '';
  addALineEndXInput.value = '';
  addALineEndYInput.value = '';
})

addALineButton.addEventListener('click', function () {
  addALineModal.hide();
  reset();
  addALine();
});

addARectangleModalElement.addEventListener('show.bs.modal', event => {
  addARectangleStartXInput.value = '';
  addARectangleStartYInput.value = '';
  addARectangleEndXInput.value = '';
  addARectangleEndYInput.value = '';
})

addARectangleButton.addEventListener('click', function () {
  addARectangleModal.hide();
  reset();
  addARectangle();
});

exportButton.addEventListener('click', function () {
  exportPdf();
});

rotateViewPortBy45.addEventListener('click', function () {
  rotateViewportBy(45);
});
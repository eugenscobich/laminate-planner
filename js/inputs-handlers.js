boardWidthOffsetInput.addEventListener('input', () => {
  updateBoardWidthOffsetInput();
})

function updateBoardWidthOffsetInput() {
  boardWidthOffsetValue.textContent = boardWidthOffsetInput.value;
  reset();
  completeTheFloor();
}

boardWidthOffsetInput.addEventListener('wheel', function (e) {
  e.preventDefault();
  const step = 1;
  let currentValue = parseFloat(boardWidthOffsetInput.value) || 0;
  const minValue = parseFloat(boardWidthOffsetInput.min) || -Infinity;
  const maxValue = parseFloat(boardWidthOffsetInput.max) || Infinity;

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

  updateBoardWidthOffsetInput();
});

boardLengthOffsetInput.addEventListener('input', () => {
  updateboardLengthOffsetInput();
})

function updateboardLengthOffsetInput() {
  boardLengthOffsetValue.textContent = boardLengthOffsetInput.value;
  reset();
  completeTheFloor();
}

boardLengthOffsetInput.addEventListener('wheel', function (e) {
  e.preventDefault();
  const step = 1;
  let currentValue = parseFloat(boardLengthOffsetInput.value) || 0;
  const minValue = parseFloat(boardLengthOffsetInput.min) || -Infinity;
  const maxValue = parseFloat(boardLengthOffsetInput.max) || Infinity;

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
  boardLengthOffsetInput.value = currentValue;

  updateboardLengthOffsetInput();
});

customArrangeBoardOffsetInput.addEventListener('input', function () {
  updateCustomArrangeBoardOffsetInput();
});

function updateCustomArrangeBoardOffsetInput() {
  customArrangeBoardOffsetValue.textContent = customArrangeBoardOffsetInput.value;
  reset();
  completeTheFloor();
}

customArrangeBoardOffsetInput.addEventListener('wheel', function (e) {
  e.preventDefault();
  const step = 1;
  let currentValue = parseFloat(customArrangeBoardOffsetInput.value) || 0;
  const minValue = parseFloat(customArrangeBoardOffsetInput.min) || -Infinity;
  const maxValue = parseFloat(customArrangeBoardOffsetInput.max) || Infinity;

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

  updateCustomArrangeBoardOffsetInput();
});

lengthInput.addEventListener('change', () => {
  boardLengthOffsetInput.min = lengthInput.value * -1;
  reset();
  completeTheFloor();
})

widthInput.addEventListener('change', () => {
  boardWidthOffsetInput.min = widthInput.value * -1;
  reset();
  completeTheFloor();
})

minboardLengthInput.addEventListener('change', () => {
  reset();
  completeTheFloor();
})

addRowButton.addEventListener('click', function () {
  computeRow();
});

addBoardButton.addEventListener('click', function () {
  computeBord();
});

fullCompleteButton.addEventListener('click', function () {
  reset();
  completeTheFloor();
});

showNumbersCheckbox.addEventListener('change', function () {
  showNumbers = showNumbersCheckbox.checked;
  drawCanvas();
});

doNotUseSmallRemainingsCheckbox.addEventListener('change', function () {
  reset();
  completeTheFloor();
});

arrangeModeSelect.addEventListener('change', function () {
  reset();
  completeTheFloor();
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
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

boardHeightOffsetInput.addEventListener('input', () => {
  updateboardHeightOffsetInput();
})

function updateboardHeightOffsetInput() {
  boardHeightOffsetValue.textContent = boardHeightOffsetInput.value;
  reset();
  completeTheFloor();
}

boardHeightOffsetInput.addEventListener('wheel', function (e) {
  e.preventDefault();
  const step = 1;
  let currentValue = parseFloat(boardHeightOffsetInput.value) || 0;
  const minValue = parseFloat(boardHeightOffsetInput.min) || -Infinity;
  const maxValue = parseFloat(boardHeightOffsetInput.max) || Infinity;

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
  boardHeightOffsetInput.value = currentValue;

  updateboardHeightOffsetInput();
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

heightInput.addEventListener('change', () => {
  boardHeightOffsetInput.min = heightInput.value * -1;
  reset();
  completeTheFloor();
})

widthInput.addEventListener('change', () => {
  boardWidthOffsetInput.min = widthInput.value * -1;
  reset();
  completeTheFloor();
})

minBoardHeightInput.addEventListener('change', () => {
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
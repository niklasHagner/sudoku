/*eslint-disable no-console*/
let cells = [];
let activeCell;
const gameState = {
  hasWon: false,
  cheatMode: false,
  startTime: new Date(),
  secondsSpent: 0,
  paused: false,
  timer: {
    interval: null,
  },
};

function setupClickEvents() {
  cells = Array.from(document.getElementsByClassName("cell"));
  cells.forEach(cellClicked);

  const timeEl = document.getElementsByClassName("time")[0];
  const minuteEl = timeEl.getElementsByClassName("minutes")[0];
  const secondEl = timeEl.getElementsByClassName("seconds")[0];

  startTimer();

  const togglePauseButton = document.getElementsByClassName(
    "sudoku-toggle-pause"
  )[0];
  togglePauseButton.addEventListener("click", togglePause);

  const toggleTimeButton = document.getElementsByClassName(
    "sudoku-toggle-time"
  )[0];
  toggleTimeButton.addEventListener("click", toggleTime);

  const checkbox = document.getElementsByClassName(
    "sudoku-arrow-key-checkbox"
  )[0];
  checkbox.addEventListener("change", () => {
    const shouldHijackArrowNavigation = checkbox && checkbox.checked;
    hijackArrowKeyNavigation(shouldHijackArrowNavigation);
  });

  //Prevent arrow-keys from page-scrolling. We want the arrow-keys to be used exclusively for sudoku navigation.
  const shouldHijackArrowNavigation = checkbox && checkbox.checked;
  hijackArrowKeyNavigation(shouldHijackArrowNavigation);

  const inputButtons = Array.from(
    document.getElementsByClassName("sudoku-input-number-button")
  );
  inputButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const key = event.target.innerText;
      const numberValue = Number(key);
      const activeCellProps = getCellAttributes(activeCell);
      handleNumberInput(numberValue, activeCell, activeCellProps);
    });
  });

  const clearCellButton = Array.from(
    document.getElementsByClassName("sudoku-clear-cell-button")
  );
  clearCellButton.forEach((button) => {
    button.addEventListener("click", () => {
      clearCell(activeCell);
    });
  });

  const restartButtons = Array.from(document.getElementsByClassName("sudoko-restart"));
  restartButtons.forEach(x => x.addEventListener("click", () => {
    location.reload();
  }));

  const massiveCheatButton = document.getElementsByClassName(
    "sudoku-cheat-a-lot"
  )[0];
  if (massiveCheatButton) {
    massiveCheatButton.addEventListener("click", () => {
      const emptyCells = cells.filter((cell) => !isCellFilled(cell));
      const cellsToSolveCount = Math.max(1, Math.ceil(emptyCells.length / 2));
      autoSolveCells(emptyCells.slice(0, cellsToSolveCount));
      if (activeCell) {
        activeCell.classList.remove("valid");
        activeCell.classList.remove("error");
      }
    });
  }
  const cheatOnceButton = document.getElementsByClassName(
    "sudoku-cheat-once"
  )[0];
  if (cheatOnceButton) {
    cheatOnceButton.addEventListener("click", () => {
      const emptyCells = cells.filter((cell) => !isCellFilled(cell));
      if (emptyCells.length <= 0) {
        return;
      }
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cellToSolve = emptyCells[randomIndex];
      autoSolveCells([cellToSolve]);
      cellToSolve.classList.add("cell--animated");
      setTimeout(() => {
        cellToSolve.classList.remove("cell--animated");
      }, 300);

      if (activeCell) {
        activeCell.classList.remove("valid");
        activeCell.classList.remove("error");
      }
    });
  }

  function timerTick() {
    gameState.secondsSpent++;
    let minutes = Math.floor(gameState.secondsSpent / 60).toString();
    let seconds = (gameState.secondsSpent % 60).toString();
    if (minutes.length < 2) {
      minutes = `0${minutes}`;
    }
    if (seconds.length < 2) {
      seconds = `0${seconds}`;
    }
    minuteEl.innerText = minutes;
    secondEl.innerText = seconds;
  }

  function startTimer() {
    gameState.timer.interval = setInterval(timerTick, 1000);
  }

  function togglePause() {
    gameState.paused = !gameState.paused;
    if (gameState.paused) {
      clearInterval(gameState.timer.interval);
      togglePauseButton.innerText = "▷ Fortsätt";
    } else {
      startTimer();
      togglePauseButton.innerText = "❚❚ Pausa";
    }
  }

  function toggleTime() {
    timeEl.classList.toggle("hidden");
  }
}

function isCellFilled(cell) {
  return (
    cell.classList.contains("immutable") ||
    (cell.firstElementChild &&
      cell.firstElementChild.innerText &&
      cell.firstElementChild.innerText !== "")
  );
}

window.addEventListener("keydown", keyDownEvent, false);

function cellClicked(cell) {
  if (cell.classList.contains("immutable")) {
    return;
  }

  cell.addEventListener("click", () => {
    if (activeCell) {
      activeCell.classList.remove("active");
    }
    cell.classList.add("active");
    activeCell = cell;
  });
}

function keyDownEvent(event) {
  const key = event.key;

  if (!activeCell || activeCell.classList.contains("immutable")) {
    handleArrowKeys(key);
    return;
  }

  const activeCellProps = getCellAttributes(activeCell);

  //Enter a note rather than a value when the user inputs shift + number
  //In this case we must parse `event.code` to extract the number value.
  //(For example: `event.keycode` will have the value "Digit2" when pressing Shift + 2 )
  if (event.shiftKey) {
    if (event.code.indexOf("Digit") === 0) {
      const parsedNumber = event.code.replace("Digit", "");
      const outputNumber = Number(parsedNumber);
      const note = activeCell.getElementsByClassName(
        `sudoku-note-cell--${outputNumber}`
      )[0];

      activeCell.firstElementChild.innerText = "";
      activeCell.classList.remove("error");

      if (note.innerText !== "") {
        note.innerText = "";
      } else {
        note.innerText = outputNumber;
      }
    }
    return;
  }

  if (!Number.isNaN(key) && Number(key) >= 1 && Number(key) <= 9) {
    handleNumberInput(key, activeCell, activeCellProps);
    return;
  }

  if (key === "Backspace" || key === "Delete") {
    clearCell(activeCell);
    return;
  }

  handleArrowKeys(key);
}

function clearCell(cell) {
  cell.firstElementChild.innerText = "";
  cell.classList.remove("valid");
  cell.classList.remove("error");
  clearNotes(cell);
}

function handleNumberInput(value, cell, cellProps) {
  if (gameState.cheatMode) {
    const correctAnswer = cell.getAttribute("data-solution");
    const isCorrect = Number(value) === Number(correctAnswer);
    if (isCorrect) {
      cell.classList.add("valid");
      cell.classList.remove("error");
      handleWinning();
    } else {
      cell.classList.add("error");
      cell.classList.remove("valid");
    }
  } else {
    const isObviousError = isNumberObviouslyIncorrectlyPlaced(value, cellProps);
    if (isObviousError) {
      cell.classList.add("error");
    } else {
      cell.classList.remove("error");
      handleWinning();
    }
  }
  cell.firstElementChild.innerText = value;
  clearNotes(cell);
}

function handleArrowKeys(key) {
  if (!activeCell) {
    activeCell = cells[Math.floor(cells.length / 2)];
  }
  const currentIndex = Number(activeCell.getAttribute("data-cell-index"));
  let shouldMove = false;
  let possibleNewIndex = currentIndex;

  if (key === "ArrowLeft") {
    possibleNewIndex--;
    shouldMove = true;
  } else if (key === "ArrowRight") {
    possibleNewIndex += 1;
    shouldMove = true;
  } else if (key === "ArrowUp") {
    possibleNewIndex -= 9;
    if (possibleNewIndex >= 0) {
      shouldMove = true;
    }
  } else if (key === "ArrowDown") {
    possibleNewIndex += 9;
    if (possibleNewIndex <= 80) {
      shouldMove = true;
    }
  }

  if (!shouldMove) {
    return;
  }

  const targetEl = document.querySelector(
    `.cell[data-cell-index="${possibleNewIndex}"]`
  );
  if (!targetEl) {
    console.log("can't move further - ", possibleNewIndex, "doesn't exist");
    return;
  }
  // console.log("moving to index", possibleNewIndex);
  // console.log("moving to row:", Number(targetEl.getAttribute("data-row-index")) + 1, "col:", Number(targetEl.getAttribute("data-column-index")) + 1);
  targetEl.classList.add("active");
  targetEl.focus();
  activeCell.classList.remove("active");
  activeCell = targetEl;
  return;
}

function isNumberObviouslyIncorrectlyPlaced(value, activeCellProps) {
  const number = Number(value);
  return cells.some(
    (cell) =>
      Number(cell.firstElementChild.innerText) === number &&
      (cell.getAttribute("data-square-index") === activeCellProps.square ||
        cell.getAttribute("data-row-index") === activeCellProps.row ||
        cell.getAttribute("data-column-index") === activeCellProps.column)
  );
}

function clearNotes(sudokuCellElement) {
  Array.from(
    sudokuCellElement.getElementsByClassName("sudoku-note-cell")
  ).forEach((note) => {
    note.innerText = "";
  });
}

function hijackArrowKeyNavigation(shouldHijackArrowNavigation) {
  if (shouldHijackArrowNavigation) {
    window.addEventListener("keydown", preventDefaultArrowKeyNavigation, false);
  } else {
    window.removeEventListener("keydown", preventDefaultArrowKeyNavigation);
  }
}

function preventDefaultArrowKeyNavigation(e) {
  if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
}

function handleWinning() {
  window.setTimeout(() => {
    if (hasWon()) {
      gameState.hasWon = true;
      gameState.timeSpent =
        new Date().getTime() - gameState.startTime.getTime();
      showWinScreen();
    }
  }, 300);
}

function hasWon() {
  if (gameState.hasWon) {
    return true;
  }
  const incorrectCells = cells.filter((cell) => {
    const isCorrect =
      Number(cell.firstElementChild.innerText) ===
      Number(cell.getAttribute("data-solution"));
    return !isCorrect;
  });
  return incorrectCells.length <= 0;
}

function secondsToMinutes(seconds) {
  return `${Math.floor(seconds / 60)}:${`0${Math.floor(seconds % 60)}`.slice(-2)}`;
}

function showWinScreen() {
  const sudokuEl = document.getElementsByClassName("sudoku")[0];
  sudokuEl.classList.add("sudoku--win");
  const sudokuMessageEl = document.getElementsByClassName("sudoku__message")[0];
  sudokuMessageEl.classList.remove("hidden");
  document.getElementById("sudoku-win-time").innerHTML = `${secondsToMinutes(gameState.secondsSpent)}`;
}

function autoSolveCells(cellsToSolve) {
  cellsToSolve.forEach((cell) => {
    handleNumberInput(
      cell.getAttribute("data-solution"),
      cell,
      getCellAttributes(cell)
    );
  });
}

function getCellAttributes(cell) {
  if (!cell) {
    alert("Please, select a square first!");
  }
  return {
    index: cell.getAttribute("data-cell-index"),
    row: cell.getAttribute("data-row-index"),
    column: cell.getAttribute("data-column-index"),
    square: cell.getAttribute("data-square-index"),
    solution: cell.getAttribute("data-solution"),
  };
}

(function () {
  if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") {
    setupClickEvents();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      setupClickEvents();
    });
  }
})();

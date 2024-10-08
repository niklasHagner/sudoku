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
  isTakingNotes: false
};

const sudokuEl = document.getElementsByClassName("sudoku")[0];


function setupSudokuCellClickEvents() {
  cells = Array.from(document.getElementsByClassName("cell"));
  cells.forEach(cellClicked);
}

function setupClickEvents() {
  // setupSudokuCellClickEvents();
  setupMenuClickEvents();
}

function setupMenuClickEvents() {
  const timeEl = document.getElementsByClassName("time")[0];
  const minuteEl = timeEl.getElementsByClassName("minutes")[0];
  const secondEl = timeEl.getElementsByClassName("seconds")[0];


  startTimer();

  const newGameButton = document.querySelector(".sudoku-new");
  newGameButton.addEventListener("click", newGame);

  const togglePauseButton = document.getElementsByClassName("sudoku-toggle-pause")[0];
  togglePauseButton.addEventListener("click", togglePause);

  const toggleTimeButton = document.getElementsByClassName("sudoku-toggle-time")[0];
  toggleTimeButton.addEventListener("click", toggleTime);

  const highlightErrorsButton = document.getElementsByClassName("sudoku-highlight-errors-button")[0];
  const highlightErrorsCheckbox = document.getElementById("highlight-errors-checkbox");
  
  highlightErrorsButton.addEventListener("click", (e) => {
    if (e.target && e.target.id === "highlight-errors-checkbox") {
      //the checkbox will change using it's default event
    } else {
      e.preventDefault();
      highlightErrorsCheckbox.checked = !highlightErrorsCheckbox.checked;
    }
    sudokuEl.classList.toggle("show-error-status");
  }, true);
  

  const noteTakingModeButton = document.getElementsByClassName("sudoku-note-mode-button")[0];
  const noteTakingCheckbox = document.getElementById("note-taking-checkbox");
  
  noteTakingModeButton.addEventListener("click", (e) => {
    if (e.target && e.target.id === "note-taking-checkbox") {
      //the checkbox will change using it's default event
    } else {
      e.preventDefault();
      noteTakingCheckbox.checked = !noteTakingCheckbox.checked;
    }
    toggleNoteTakingActive();
  }, true);

  function toggleNoteTakingActive() {
    var isChecked = noteTakingCheckbox.checked;
    if (isChecked) {
      noteTakingModeButton.classList.add("active");
      gameState.isTakingNotes = true;
    } else {
      noteTakingModeButton.classList.remove("active");
      gameState.isTakingNotes = false;
    }
  }

  //Prevent arrow-keys from page-scrolling. We want the arrow-keys to be used exclusively for sudoku navigation.
  const shouldHijackArrowNavigation = true;
  hijackArrowKeyNavigation(shouldHijackArrowNavigation);

  const inputButtons = Array.from(
    document.getElementsByClassName("sudoku-input-number-button")
  );
  inputButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const key = event.target.innerText;
      const numberValue = Number(key);
      const activeCellProps = getCellAttributes(activeCell);
      if (!activeCellProps) {
        return;
      }
      
      let isTakingNotes = gameState.isTakingNotes;
      if (isTakingNotes) {
        addNumberAsNoteInActiveCell(numberValue);
      } else {
        handleNumberInput(numberValue, activeCell, activeCellProps);
      }
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
      togglePauseButton.innerText = "▷ Resume";
    } else {
      startTimer();
      togglePauseButton.innerText = "❚❚ Pause";
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

function addNumberAsNoteInActiveCell(numberToNote) {
  const note = activeCell.getElementsByClassName(`sudoku-note-cell--${numberToNote}`)[0];
    
  activeCell.firstElementChild.innerText = "";
  activeCell.classList.remove("error");
  
  if (note.innerText !== "") {
    note.innerText = "";
  } else {
    note.innerText = numberToNote;
  }
}

function handleNoteTakingViaKeyPress(event) {
  if (event.code.indexOf("Digit") !== 0) {
    return;
  }
  const parsedNumber = event.code.replace("Digit", "");
  const numberToNote = Number(parsedNumber);
  addNumberAsNoteInActiveCell(numberToNote);
}

function clearEverything() {
  const cells = Array.from(document.querySelectorAll(".cell"));
  cells.forEach((cell) => {
    cell.firstElementChild.innerText = "";
    cell.classList.remove("valid");
    cell.classList.remove("error");
    clearNotes(cell);
  });
}

function keyDownEvent(event) {
  const key = event.key;

  if (!activeCell || activeCell.classList.contains("immutable")) {
    handleArrowKeysAndWASD(key);
    return;
  }

  
  //If user input is `shift + number` we're doing note-taking and must add special parsing of keycodes
  //(For example Shift + 2 will result in `event.keycode` being "Digit2")
  if (event.shiftKey || gameState.isTakingNotes) {
    handleNoteTakingViaKeyPress(event);
    return;
  }
  
  const activeCellProps = getCellAttributes(activeCell);
    
  if (!Number.isNaN(key) && Number(key) >= 1 && Number(key) <= 9) {
    handleNumberInput(key, activeCell, activeCellProps);
    return;
  }

  if (key === "Backspace" || key === "Delete") {
    clearCell(activeCell);
    return;
  }

  handleArrowKeysAndWASD(key);
}

function clearCell(cell) {
  if (!cell) {
    if (confirm("You haven't selected a specific cell. Do you want to clear everything?")) {
      
    } else {
      // Do nothing!
      console.log('Thing was not saved to the database.');
    }
    return;
  }
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

function handleArrowKeysAndWASD(key) {
  if (!activeCell) {
    activeCell = cells[Math.floor(cells.length / 2)];
  }
  const currentIndex = Number(activeCell.getAttribute("data-cell-index"));
  let shouldMove = false;
  let possibleNewIndex = currentIndex;

  if (key === "ArrowLeft" || key === "a") {
    possibleNewIndex--;
    shouldMove = true;
  } else if (key === "ArrowRight" || key === "d") {
    possibleNewIndex += 1;
    shouldMove = true;
  } else if (key === "ArrowUp" || key === "w") {
    possibleNewIndex -= 9;
    if (possibleNewIndex >= 0) {
      shouldMove = true;
    }
  } else if (key === "ArrowDown" || key === "s") {
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
  if (Toastify) {
    Toastify({
      text: `Auto-solved ${cellsToSolve.length} ${cellsToSolve.length === 1 ? "cell" : "cells" }!`,
      duration: 3000,
      gravity: "top", // `top` or `bottom`
      position: "center", // `left`, `center` or `right`
      backgroundColor: "linear-gradient(to right, purple, magenta)",
      stopOnFocus: true, // Prevents dismissing of toast on hover
      onClick: function(){} // Callback after click
    }).showToast();
  }
}

function getCellAttributes(cell) {
  if (!cell) {
    if (Toastify) {
      Toastify({
        text: `How about selecting a cell first?`,
        duration: 3000,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        backgroundColor: "linear-gradient(to right, darkgreen, green)",
        stopOnFocus: true, // Prevents dismissing of toast on hover
        onClick: function(){} // Callback after click
      }).showToast();
    }
    return;
  }
  return {
    index: cell.getAttribute("data-cell-index"),
    row: cell.getAttribute("data-row-index"),
    column: cell.getAttribute("data-column-index"),
    square: cell.getAttribute("data-square-index"),
    solution: cell.getAttribute("data-solution"),
  };
}

let newGameStartButtons = [...document.querySelectorAll(".new-game-start")];
let newGameModal =document.querySelector(".new-game");
let difficultySlider = document.querySelector(".difficulty");
function newGame() {
  newGameModal.classList.remove("hidden");
  var modalClose = document.getElementsByClassName("modal-close")[0];
  modalClose.addEventListener("click", () => {
    newGameModal.classList.add("hidden");
  });

  newGameStartButtons.forEach((btn) => { btn.addEventListener("click", handleNewGameStart); });
}

function handleNewGameStart(ev) {
  let difficultyString = ev.target.getAttribute("data-difficulty");
  generateNewSudoku(difficultyString);
  newGameModal.classList.add("hidden");

  if (Toastify) {
    Toastify({
      text: `New game started at difficulty ${difficultyString}!`,
      duration: 3000,
      gravity: "top", // `top` or `bottom`
      position: "center", // `left`, `center` or `right`
      backgroundColor: "linear-gradient(to right, darkgreen, mediumseagreen)",
      stopOnFocus: true, // Prevents dismissing of toast on hover
      onClick: function(){} // Callback after click
    }).showToast();
  }
}

function generateNewSudoku(difficultyLevel) {
  difficultyLevel = difficultyLevel ? difficultyLevel : "medium";
  const { puzzle, solution } = generateSudoku(difficultyLevel);
  console.log("Puzzle:");
  console.log(puzzle);
  console.log("Solution:");
  console.log(solution);
  let puzzleArray = puzzle.flat();
  let puzzleSolutionArray = solution.flat();

  let innerSudokuHtmlString = "";
  for(let i = 0; i<puzzleArray.length; i++) {
    let initialValue = puzzleArray[i];
    if (initialValue === ".") {
      initialValue = "";
    }
    let cellIndex = i;
    let solution = puzzleSolutionArray[i];
    let rowIndex = Math.floor(i/9);
    let colIndex = i - (rowIndex * 9);
    let squareIndex = getSquareIndex(colIndex, rowIndex);
    let cellHtml = generateCellHtml(initialValue, solution, cellIndex, rowIndex, colIndex, squareIndex);
    innerSudokuHtmlString += cellHtml;
  }
  document.querySelector(".sudoku").innerHTML = innerSudokuHtmlString;
  setupSudokuCellClickEvents();
  
  function getSquareIndex(colIndex, rowIndex) {
    if (colIndex < 3) { 
      if (rowIndex < 3) return 0;
      else if (rowIndex < 6) return 3;
      else return 6;
    }
    if (colIndex < 6) { 
      if (rowIndex < 3) return 1;
      else if (rowIndex < 6) return 4;
      else return 7;
    }
    else { 
      if (rowIndex < 3) return 2;
      else if (rowIndex < 6) return 5;
      else return 8;
    }
  }
}

function generateCellHtml(initialValue, solution, cellIndex, rowIndex, colIndex, squareIndex) {
  let immutabilityClass = initialValue ? "immutable" : "";
  let borderClass = "";
  if (colIndex === 2 || colIndex === 5) { 
    borderClass = "border-right";
  }
  if (rowIndex === 2 || rowIndex === 5) {
    borderClass += " border-bottom";
  }

  return `
    <div class="cell ${immutabilityClass} ${borderClass}" data-solution="${solution}" data-cell-index="${cellIndex}" data-row-index="${rowIndex}" data-column-index="${colIndex}" data-square-index="${squareIndex}">

      <span class="value">${initialValue}</span>

      <span class="sudoku-note-cell sudoku-note-cell--1"></span>
      <span class="sudoku-note-cell sudoku-note-cell--2"></span>
      <span class="sudoku-note-cell sudoku-note-cell--3"></span>
      <span class="sudoku-note-cell sudoku-note-cell--4"></span>
      <span class="sudoku-note-cell sudoku-note-cell--5"></span>
      <span class="sudoku-note-cell sudoku-note-cell--6"></span>
      <span class="sudoku-note-cell sudoku-note-cell--7"></span>
      <span class="sudoku-note-cell sudoku-note-cell--8"></span>
      <span class="sudoku-note-cell sudoku-note-cell--9"></span>
    </div>
  `;
}

function main() {
  setupClickEvents();
  generateNewSudoku();
}

(function () {
  if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") {
    main();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      main();
    });
  }
})();


/* ----------------
PUZZLE GENERATOR
----------------- */
const DIFFICULTY_LEVELS = {
  "easy": 30,
  "medium": 40,
  "hard": 50,
  "very-hard": 60
};

function generateEmptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill('.'));
}

function isValid(grid, row, col, num) {
  for (let x = 0; x < 9; x++) {
      if (grid[row][x] == num || grid[x][col] == num || grid[3 * Math.floor(row / 3) + Math.floor(x / 3)][3 * Math.floor(col / 3) + x % 3] == num) {
          return false;
      }
  }
  return true;
}

function fillGrid(grid) {
  for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
          if (grid[row][col] == '.') {
              let numbers = shuffle(Array.from({ length: 9 }, (_, i) => i + 1));
              for (let num of numbers) {
                  if (isValid(grid, row, col, num)) {
                      grid[row][col] = num;
                      if (fillGrid(grid)) {
                          return true;
                      }
                      grid[row][col] = '.';
                  }
              }
              return false;
          }
      }
  }
  return true;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function removeNumbers(grid, count) {
  while (count > 0) {
      let row = Math.floor(Math.random() * 9);
      let col = Math.floor(Math.random() * 9);
      if (grid[row][col] != '.') {
          grid[row][col] = '.';
          count--;
      }
  }
}

function generateSudoku() {
  let grid = generateEmptyGrid();
  fillGrid(grid);
  let solution = grid.map(row => row.slice()); // Copy the solution
  removeNumbers(grid, 40); // Remove 40 numbers to create a puzzle
  return { puzzle: grid, solution: solution };
}

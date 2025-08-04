import { APP_NAME, APP_VERSION } from "../app-properties.js";
import { getSvgIcon } from "./services/icons.service.js";
import { getUser, setStorage, setUser } from "./services/storage.service..js";
import { showToast } from "./services/toast.service.js";
import { 
  convertMillisecondsToTimeObject,
  convertTimeValuesToMilliseconds,
  getCompactColonTimeStringByTimeValues, 
  getCompactVerboseTimeStringByTimeValues, 
  getFullColonTimeStringByMilliseconds, 
  getFullColonTimeStringByTimeValues, 
  getFullVerboseTimeStringByTimeValues 
} from "./utils/dateAndTime.utils.js";
import { getRandomIntegerBetween } from "./utils/math.utils.js";
import { setHTMLTitle, logAppInfos } from "./utils/UTILS.js";
// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
// UI -----------------------
const HEADER = document.getElementById('header');
const MAIN = document.getElementById('main');

// CONST --------------------
const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K'];
const NUMBERS = [1,2,3,4,5,6,7,8,9,10,11];
const COLLIDABLES = ['rock-1','rock-2','rock-3','rock-4'];
const BONUSES = ['bonus-1'/* ,'bonus-2','bonus-3' */];
const MIN_LINES_BETWEEN_BONUS = 55;

// Current game -------------
let isTouchScreen = false;
let collidablePercentage = 10;

let currentScore = 0;
let currentStep = 0;
let currentBgPosition = 1;
let currentPlayerColumn = 6;
let currentLinesBeforeBonus = MIN_LINES_BETWEEN_BONUS;
let currentBonus = null;

let defilement = null;

let isPlaying = false;
let isCrashed = false;

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

// USER INTERACTIONS ##########################################################
const onStartClick = () => {
  isPlaying = true;
  document.getElementById('startContainer').classList.add('hidden')
  defilement = setInterval(() => {
    currentLinesBeforeBonus -= 1;
    const newLines = updateCanevasLines(getCurrentCanevasLines());
    //console.log(newLines)
    setCanevas(newLines);
    checkCollision();
    const player = document.getElementById('player');
    if (!player.classList.contains('crashed')) {
      updateScore();
    };
  }, 500);
};
window.onStartClick = onStartClick;

const onUseBonusClick = () => {
  if (currentBonus !== null) {
    //console.log(`USING ${currentBonus}`);
    const bonusDisplay = document.getElementById('currentBonusDisplay');
    
    switch (currentBonus) {
      case 'bonus-1':
        bonus_clearCurrentGrid();
        break;
      case 'bonus-2':
        bonus_clearCurrentGrid();
        break;
      case 'bonus-3':
        bonus_clearCurrentGrid();
        break;
      default:
        break;
    }
    currentBonus = null;
    bonusDisplay.classList = [];
    bonusDisplay.classList.add('current-bonus');
  }
};
window.onUseBonusClick = onUseBonusClick;

document.onkeydown = function (e) {
  if (e.key === "ArrowLeft") {
    movePlayer('left');
  } else if (e.key === "ArrowRight") {
    movePlayer('right');
  } else if (e.key === " ") {
    e.preventDefault();
    if (!isPlaying && !isCrashed) {
      onStartClick();
    } else if (isPlaying && !isCrashed) {
      onUseBonusClick();
    } else if (isPlaying && isCrashed) {
      window.location = './';
    }
  }
};

const onUserTouchStart = (direction) => {
  isTouchScreen = true;
  movePlayer(direction);
}
window.onUserTouchStart = onUserTouchStart;

const onClickStart = (direction) => {
  if (!isTouchScreen) {
    movePlayer(direction);
  }
}
window.onClickStart = onClickStart;

// DATA #######################################################################
const getRandomCollidableClass = () => {
  return COLLIDABLES[getRandomIntegerBetween(0, COLLIDABLES.length -1)];
}

const bonus_clearCurrentGrid = () => {
  const canevasLinesDOM = document.getElementsByClassName('canevas-line');
  const canevasLines = [];
  //console.log(canevasLinesDOM);
  for (let line of canevasLinesDOM) {
    const lineCells = [];
    const cells = line.children;
    for (let cell of cells) {
      const isCollidable = cell.classList.contains('collidable');
  
      let cellObj = {
        isCollidable: false,
        collidableClass: '',
        isBonus: false,
        bonusClass: '',
      };

      if (isCollidable) {
        let letter = cell.getAttribute('id')[0];
        if (letter === 'A' || letter === 'K') {
          cellObj.isCollidable = true;
          cellObj.collidableClass = cell.classList[cell.classList.length - 1];
        }
      }
      lineCells.push(cellObj);
    }
    canevasLines.push(lineCells);
  }
  setCanevas(canevasLines);
}

const getRandomBonusClass = () => {
  return BONUSES[getRandomIntegerBetween(0, BONUSES.length -1)];
}

const getBaseCanevasLine = (lineNumber, isLineEmpty = false) => {
  let str = '';
  for (let letter of LETTERS) {
    const isFirstOrLast = letter === 'A' || letter === 'K';
    if (isFirstOrLast) {
      str += `<div id="${letter}${lineNumber}" class="canevas-cell collidable ${getRandomCollidableClass()}"></div>`;
    } else {
      const isCollidable = getRandomIntegerBetween(1, 100) <= collidablePercentage;
      str += `<div id="${letter}${lineNumber}" class="canevas-cell ${isLineEmpty ? '' : isCollidable ? `collidable ${getRandomCollidableClass()}` : ''}"></div>`;
    }
  }
  return str;
}
const getBaseCanevas = () => {
  let str = '';
  for (let number of NUMBERS) {
    const isLineEmpty = number === 8 || number === 9 || number === 10 || number === 11;
    str += `<div id="canevasLine${number}" class="canevas-line">`;
    str += getBaseCanevasLine(number, isLineEmpty);
    str += `</div>`;
  }
  return str;
}

const getCurrentCanevasLines = () => {
  const canevasLinesDOM = document.getElementsByClassName('canevas-line');
  const canevasLines = [];
  //console.log(canevasLinesDOM);
  for (let line of canevasLinesDOM) {
    const lineCells = [];
    const cells = line.children;
    for (let cell of cells) {
      const isCollidable = cell.classList.contains('collidable');
      const isBonus = cell.classList.contains('bonus');

      let cellObj = {
        isCollidable: false,
        collidableClass: '',
        isBonus: false,
        bonusClass: '',
      };

      if (isCollidable) {
        cellObj.isCollidable = true;
        cellObj.collidableClass = cell.classList[cell.classList.length - 1];
      } else if (isBonus) {
        cellObj.isBonus = true;
        cellObj.bonusClass = cell.classList[cell.classList.length - 1];
      }

      lineCells.push(cellObj);
    }
    canevasLines.push(lineCells);
  }
  return canevasLines;
}

const getCanevasLineByArray = (lineNumber, lineCells) => {
  let str = '';
  for (let index = 0; index < lineCells.length; index++) {
    const letter = LETTERS[index];
    const cell = lineCells[index];

    const isCollidable = cell.isCollidable;
    const isBonus = cell.isBonus;

    if (isCollidable) {
      str += `<div id="${letter}${lineNumber}" class="canevas-cell collidable ${cell.collidableClass}"></div>`;
    } else if (isBonus) {
      str += `<div id="${letter}${lineNumber}" class="canevas-cell bonus ${cell.bonusClass}"></div>`;
    } else {
      str += `<div id="${letter}${lineNumber}" class="canevas-cell"></div>`;
    }
  }
  return str;
}
const getCanevasByLines = (canevasLines) => {
  let str = '';
  for (let index = 0; index < canevasLines.length; index++) {
    const line = canevasLines[index];
    const lineNumber = index + 1;
    
    str += `<div id="canevasLine${lineNumber}" class="canevas-line">`;
    str += getCanevasLineByArray(lineNumber, line);
    str += `</div>`;
  }
  return str;
}

const getNewLineCells = () => {
  let bonusProbability = 10;
  const newLineCells = [];
  for (let letter of LETTERS) {
    let cellObj = {
      isCollidable: false,
      collidableClass: '',
      isBonus: false,
      bonusClass: '',
    };

    const isFirstOrLast = letter === 'A' || letter === 'K';
    
    if (isFirstOrLast) {
      cellObj.isCollidable = true;
      cellObj.collidableClass = getRandomCollidableClass();
    } else {
      const isCollidable = getRandomIntegerBetween(1, 100) <= collidablePercentage;
      if (isCollidable) {
        cellObj.isCollidable = true;
        cellObj.collidableClass = getRandomCollidableClass();
      } else {
        const isBonus = getRandomIntegerBetween(1, 100) <= bonusProbability;
        if (isBonus && currentLinesBeforeBonus === 0) {
          currentLinesBeforeBonus = MIN_LINES_BETWEEN_BONUS;
          cellObj.isBonus = true;
          cellObj.bonusClass = getRandomBonusClass();
        }
        bonusProbability += 10;
      }
    }
    newLineCells.push(cellObj);
  }
  return newLineCells;
}

const updateCanevasLines = (canevasLines) => {
  canevasLines.pop();
  const newLineCells = getNewLineCells();
  canevasLines.unshift(newLineCells);
  return canevasLines;
}

const setCanevas = (canevasLines) => {
  const canevasLinesContainer = document.getElementById('canevasLinesContainer');
  const canevasBg = document.getElementById('canevasBg');
  canevasLinesContainer.innerHTML = '';
  currentBgPosition += 1;
  canevasBg.style = `background-position-y: calc(${currentBgPosition} * var(--cell-size));`;
  canevasLinesContainer.innerHTML = getCanevasByLines(canevasLines);
}

const movePlayer = (direction) => {
  if (!isCrashed) {
    const player = document.getElementById('player');
    if (direction === 'left') {
      currentPlayerColumn -= 1;
    } else if (direction === 'right') {
      currentPlayerColumn += 1;
    }
    player.style = `left: calc(var(--button-size) + (${currentPlayerColumn - 1} * var(--cell-size)));`;
    checkCollision();
  }
}



const checkCollision = () => {
  const currentPlayerCell = `${LETTERS[currentPlayerColumn - 1]}9`;
  //console.log(currentPlayerCell);
  const cell = document.getElementById(currentPlayerCell);
  if (cell.classList.contains('collidable')) {
    isCrashed = true;
    clearInterval(defilement);
    const player = document.getElementById('player');
    player.classList.add('crashed');
    let user = getUser();
    if (currentScore > user.best) {
      user.best = currentScore;
      setUser(user);
    }
    document.getElementById('gameOverScore').innerHTML = `Score: ${currentScore} pts`;
    setTimeout(() => {
      document.getElementById('gameOverContainer').classList.remove('hidden');
    }, 500);
  }
  if (cell.classList.contains('bonus')) {
    const bonusClass = cell.classList[cell.classList.length - 1];
    currentBonus = bonusClass;
    cell.classList.remove('bonus');
    console.log(`CURRENT BONUS: ${currentBonus}`);
    const bonusDisplay = document.getElementById('currentBonusDisplay');
    bonusDisplay.classList = [];
    bonusDisplay.classList.add('current-bonus');
    bonusDisplay.classList.add(currentBonus);
  }
}

const setStep = (stepNumber) => {
  const canevasContainer = document.getElementById('canevasContainer');
  if (!canevasContainer.classList.contains(`step-${stepNumber}`)) {
    canevasContainer.classList.remove(`step-${stepNumber - 1}`);
    canevasContainer.classList.add(`step-${stepNumber}`);
  }
}

const updateScore = () => {
  currentScore += 50;
  document.getElementById('currentScore').innerHTML = `${currentScore} pts`;

  if (currentScore < 1000) {
    collidablePercentage = 10;
  }
  if (currentScore >= 1000 && currentScore < 2500) {
    collidablePercentage = 12;
  }
  if (currentScore >= 2500 && currentScore < 5000) {
    collidablePercentage = 15;
    setStep(1);
  }
  if (currentScore >= 5000 && currentScore < 7500) {
    collidablePercentage = 18;
    setStep(2);
  }
  if (currentScore >= 7500 && currentScore < 10000) {
    collidablePercentage = 20;
    setStep(3);
  }
  if (currentScore >= 10000 && currentScore < 12500) {
    setStep(4);
    collidablePercentage = 21;
  }
  if (currentScore >= 12500 && currentScore < 15000) {
    collidablePercentage = 22;
    setStep(5);
  }
  if (currentScore >= 15000 && currentScore < 17500) {
    collidablePercentage = 23;
    setStep(6);
  }
  if (currentScore >= 17500 && currentScore < 20000) {
    collidablePercentage = 24;
    setStep(7);
  }
  if (currentScore >= 20000) {
    collidablePercentage = 25;
    setStep(8);
  }
}
// IHM RENDER #################################################################

// LOGGING ####################################################################

// INITIALIZATION /////////////////////////////////////////////////////////////////////////////////

logAppInfos(APP_NAME, APP_VERSION);
setHTMLTitle(APP_NAME);
setStorage();

// EXECUTION //////////////////////////////////////////////////////////////////////////////////////
HEADER.innerHTML = `${APP_NAME} v${APP_VERSION} <span id="currentScore">${currentScore} pts</span> <span>Best: ${getUser().best} pts</span>`;
MAIN.innerHTML += `
<button class="move-button" onmousedown="onClickStart('left')" ontouchstart="onUserTouchStart('left')">
  <img src="./medias/images/left2.png" />
</button>
<div id="canevasContainer" class="canevas-container step-0">
  <div id="canevasBg" class="canevas-bg"></div>
  <div id="canevasLinesContainer" class="canevas-lines">
    ${getBaseCanevas()}
  </div>
</div>
<div class="use-bonus-container" onclick="onUseBonusClick()">
  <div id="currentBonusDisplay" class="current-bonus"></div>
</div>
<div id="player" class="player"></div>
<div id="startContainer" class="start-container">
  <button class="lzr-button" onclick="onStartClick()"><img src="./medias/images/start.png" /></button>
</div>
<div id="gameOverContainer" class="game-over-container hidden">
  <div class="game-over">GAME OVER</div>
  <div id="gameOverScore" class="game-over-score">GAME OVER</div>
  <button class="lzr-button" onclick="window.location = './'"><img src="./medias/images/new-game.png" /></button>
</div>
<button class="move-button" onmousedown="onClickStart('right')" ontouchstart="onUserTouchStart('right')">
  <img src="./medias/images/right2.png" />
</button>
`;

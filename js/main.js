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
const HEADER = document.getElementById('header');
const MAIN = document.getElementById('main');

const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K'];
const NUMBERS = [1,2,3,4,5,6,7,8,9,10,11];

let fullPercentage = 10;
let bgPosition = 1;

let CURRENT_PLAYER_COLUMN = 6;
let currentScore = 0;
let isCrashed = false;
let isTouch = false;

let defilement = null;

const loremIpsum = `
<p>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae imperdiet est, nec fringilla sem. Donec lectus ex, dignissim non vestibulum et, consectetur vitae erat. Phasellus et tortor nec risus semper rutrum porta vitae odio. Sed at mollis turpis. Integer pulvinar lobortis mi, lobortis dictum mi commodo in. Fusce augue metus, scelerisque ac molestie et, ultricies vitae purus. Sed at pharetra augue, at eleifend metus.
  <br>
  Aenean lorem odio, fringilla et hendrerit nec, hendrerit et felis. Maecenas interdum porta tellus, nec ultrices lectus commodo sit amet. Vivamus a turpis metus. Nunc mattis velit non enim aliquam volutpat. Aenean eleifend risus sed augue facilisis, congue pretium ipsum consequat. Suspendisse eu nulla placerat, mattis nisl eu, feugiat nisl. Nulla felis risus, aliquet eu posuere eu, imperdiet sed velit. Sed ac tellus cursus, mollis sapien id, dapibus nisl. Proin mauris nisi, blandit quis efficitur vulputate, venenatis ut nisl. Phasellus viverra quis nunc iaculis rutrum. Duis at tortor convallis, eleifend nunc venenatis, dapibus neque. Duis imperdiet mollis lacus mattis bibendum. Curabitur sit amet tellus gravida, viverra libero id, tincidunt orci.
</p>
`;

const options = `<option value="option 1" selected>option 1</option>
    <option value="option 2">option 2</option>`;

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

// USER INTERACTIONS ##########################################################
const onStartClick = () => {
  document.getElementById('startContainer').classList.add('hidden')
  defilement = setInterval(() => {
    const newLines = updateCanevasLines(lines);
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

// DATA #######################################################################
const getBaseCanevasLine = (lineNumber, isLineEmpty = false) => {
  let str = '';
  for (let letter of LETTERS) {
    const isFirstOrLast = letter === 'A' || letter === 'K';
    const isFull = getRandomIntegerBetween(1, 100) <= fullPercentage;
    str += `<div id="${letter}${lineNumber}" class="canevas-cell ${isFirstOrLast ? 'full' : ''} ${isLineEmpty ? '' : isFull ? 'full' : ''}"></div>`;
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
      //console.log(cell.classList.length);
      let cellObj = {full: cell.classList.contains('full')};
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
    str += `<div id="${letter}${lineNumber}" class="canevas-cell ${cell.full ? 'full' : ''}"></div>`;
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

const updateCanevasLines = (canevasLines) => {
  canevasLines.pop();
  const newLineCells = [];
  for (let letter of LETTERS) {
    const isFull = letter === 'A' || letter === 'K' || getRandomIntegerBetween(1, 100) <= fullPercentage;
    let cellObj = {full: isFull};
    newLineCells.push(cellObj);
  }
  canevasLines.unshift(newLineCells);
  return canevasLines;
}

const setCanevas = (canevasLines) => {
  const canevasContainer = document.getElementById('canevasContainer');
  canevasContainer.innerHTML = '';
  bgPosition += 1;
  canevasContainer.style = `background-position-y: calc(${bgPosition} * var(--cell-size));`;
  canevasContainer.innerHTML = getCanevasByLines(canevasLines);
}

const movePlayer = (direction) => {
  if (!isCrashed) {
    const player = document.getElementById('player');
    if (direction === 'left') {
      CURRENT_PLAYER_COLUMN -= 1;
    } else if (direction === 'right') {
      CURRENT_PLAYER_COLUMN += 1;
    }
    player.style = `left: calc(var(--button-size) + (${CURRENT_PLAYER_COLUMN - 1} * var(--cell-size)));`;
    checkCollision();
  }
}

document.onkeydown = function (e) {
  if (e.key === "ArrowLeft") {
    movePlayer('left');
  } else if (e.key === "ArrowRight") {
    movePlayer('right');
  }
};

const onUserTouchStart = (direction) => {
  isTouch = true;
  movePlayer(direction);
}
window.onUserTouchStart = onUserTouchStart;

const onClickStart = (direction) => {
  if (!isTouch) {
    movePlayer(direction);
  }
}
window.onClickStart = onClickStart;

const checkCollision = () => {
  const currentPlayerCell = `${LETTERS[CURRENT_PLAYER_COLUMN - 1]}9`;
  console.log(currentPlayerCell);
  const cell = document.getElementById(currentPlayerCell);
  if (cell.classList.contains('full')) {
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
}

const updateScore = () => {
  currentScore += 50;
  document.getElementById('currentScore').innerHTML = `${currentScore} pts`;

  const canevasContainer = document.getElementById('canevasContainer');

  if (currentScore <= 1000) {
    fullPercentage = 10;
  }
  if (currentScore > 1000 && currentScore <= 2500) {
    fullPercentage = 12;
  }
  if (currentScore > 2500 && currentScore <= 5000) {
    fullPercentage = 15;
  }
  if (currentScore > 5000 && currentScore <= 7500) {
    if (!canevasContainer.classList.contains('step1')) {
      canevasContainer.classList.add('step1')
    }
    fullPercentage = 18;
  }
  if (currentScore > 7500 && currentScore <= 10000) {
    if (!canevasContainer.classList.contains('step2')) {
      canevasContainer.classList.remove('step1');
      canevasContainer.classList.add('step2');
    }
    fullPercentage = 20;
  }
  if (currentScore > 10000 && currentScore <= 15000) {
    if (!canevasContainer.classList.contains('step3')) {
      canevasContainer.classList.remove('step2');
      canevasContainer.classList.add('step3');
    }
    fullPercentage = 22;
  }
  if (currentScore > 15000 && currentScore <= 20000) {
    if (!canevasContainer.classList.contains('step4')) {
      canevasContainer.classList.remove('step3');
      canevasContainer.classList.add('step4');
    }
    fullPercentage = 24;
  }
  if (currentScore > 20000) {
    if (!canevasContainer.classList.contains('step5')) {
      canevasContainer.classList.remove('step4');
      canevasContainer.classList.add('step5');
    }
    fullPercentage = 26;
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
<div id="canevasContainer" class="canevas-container">
  ${getBaseCanevas()}
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
const lines = getCurrentCanevasLines();
//console.log(lines);

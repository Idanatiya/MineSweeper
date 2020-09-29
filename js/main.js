
'use strict';

const MINE = '<img class="mine" src="imgs/mine.png"/>';
const EMPTY = '';
const FLAG = '<img class="gun" src="imgs/gun.png"/>';


var gLifeCount;
var gMinePoses;
var gGame;
var gBoard;
var gStartTimer;
var gTimerInterval;
var gIsHintClicked;
var gSafeClickLeft;
var gLevel = {
    size: 4,
    mines: 2
};
var gElImgClicked;
var gIsManualMode;

/*need to initalize it*/
var gElManualMines;
var gWinAudio;
var gMineAudio;

var gLastMoves;
var gLastGames
var gIsUndoClicked;



function init() {
    if (gTimerInterval) clearInterval(gTimerInterval)
    loadStorageData();
    var elSafeClickLeft = document.querySelector('.click-left');
    var elSafeClickModal = document.querySelector('.safe');
    var elHintsDiv = document.querySelector('.hints');
    var elLifeCount = document.querySelector('.life');
    var elSmiley = document.querySelector('.smile-img');
    var elTimerSpan = document.querySelector('.time');

    elSmiley.src = 'imgs/normal-rick.png';
    gMinePoses = [];
    gLifeCount = 3;
    gSafeClickLeft = 3;
    gBoard = createBoard();
    gStartTimer = null;
    gIsHintClicked = false;
    gIsManualMode = false;
    gElManualMines = [];
    gLastMoves = [];
    gLastGames = [];
    gLastMoves.push(gBoard);
    gIsUndoClicked = false;

    gGame = {
        isOn: false,
        showCount: 0,
        markedCount: 0,
        secsPassed: 0,
        isWon: false
    }
    removeBubble();
    getUsername();

    console.log(`interval:${gTimerInterval} cleared`)

    displayHintImgs();
    elSafeClickModal.style.display = 'none';
    elHintsDiv.style.display = 'none';
    elLifeCount.innerText = gLifeCount;
    elTimerSpan.innerText = '00:00:00';
    elSafeClickLeft.innerText = gSafeClickLeft + ' safe clicks available ';

    gGame.isOn = true;
    renderBoard(gBoard);
}


/*pick mode logic*/
function pickMode(size) {
    switch (size) {
        case 4:
            gLevel.size = 4;
            gLevel.mines = 2;
            init();
            break;
        case 8:
            gLevel.size = 8;
            gLevel.mines = 12;
            init();
            break;
        case 12:
            gLevel.size = 12;
            gLevel.mines = 30;
            init();
            break;

    }
}


/*create board model*/
function createBoard() {
    var board = [];
    var boardSize = gLevel.size;
    for (var i = 0; i < boardSize; i++) {
        board[i] = [];
        for (var j = 0; j < boardSize; j++) {
            board[i][j] = createCell();

        }
    }
    return board;
}



function undoClicked() {
    if (gLastMoves.length === 1 || !gGame.isOn) return;
    // gUndoClicked = true;
    var previousBoard = gLastMoves.pop();
    console.log('prev board', previousBoard);
    gBoard = previousBoard;
    console.log('gBoard has rendered:', gBoard)
    renderBoard(gBoard)

    var prevGame = gLastGames.pop()
    console.log('prev game', prevGame);
    gGame = prevGame;
    if (gLastMoves.length === 1) gIsUndoClicked = true;
}



/*get empty celles for the mines*/
function getEmptyCells(board, elCell) {
    console.log('PLACING MINES....')
    var emptyCells = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            var elCellCoord = getCellCoord(elCell.className)
            if (!currCell.isMine && elCellCoord.i !== i && elCellCoord.j !== j) {
                emptyCells.push({ i, j });
            }
        }
    }
    console.log('empty:', emptyCells)
    return emptyCells;
}


/**Get a safe click coord ***/
function getSafeCell() {
    var safeCells = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isShowen && !cell.isMine && !cell.isMarked) {
                safeCells.push({ i, j });
            }
        }
    }
    if (safeCells.length === 0) {
        alert('No empty cells left')
        return;
    }
    console.log(safeCells, 'length is:', safeCells.length);
    var randIdx = getRandomInteger(0, safeCells.length - 1);
    return safeCells[randIdx];
}



/**display on dom the safe cell */
function revealSafeCell() {
    var cell = getSafeCell();
    console.log('got:', cell)
    var elSafeClickLeft = document.querySelector('.click-left')
    if (gSafeClickLeft > 0) {
        --gSafeClickLeft
        elSafeClickLeft.innerText = `${gSafeClickLeft} safe clicks available`;
    } else {
        alert('You Wasted all your safe clicks')
        elSafeClickLeft.innerText = `${gSafeClickLeft} safe clicks available`;
        return;
    }
    var className = getClassName(cell);
    var elCell = document.querySelector(`.${className}`);
    elCell.classList.add('show');
    setTimeout(function () {
        elCell.classList.remove('show');
    }, 1000)


}

/*reveal mines upon loss*/
function revealMines() {
    for (var i = 0; i < gMinePoses.length; i++) {
        var currMineCoords = gMinePoses[i];
        var elCell = document.querySelector(`.cell-${currMineCoords.i}-${currMineCoords.j}`);
        elCell.innerHTML = MINE;
        elCell.classList.add('show');
    }
}





//mange img clicked
function hintClicked(elImg) {
    gIsHintClicked = true;
    elImg.classList.add('hint-effect');
    gElImgClicked = elImg;
    console.log('clicked!')
}



//activate manual mine mode
function activateManualMode(elImg) {
    if (gGame.showCount !== 0) {
        alert('Game has already started...')
        // alert('cant go to manual mode while game begins');
        return;
    }
    alert('Entering manual mode...')
    gIsManualMode = true;
    gLevel.mines = 0;
    elImg.classList.add('axe-click-effect')
    console.log('You entered manual mode');
}


//hide manual mines
function hideManualMines() {
    if (gGame.showCount !== 0) alert('game already started')
    for (var i = 0; i < gElManualMines.length; i++) {
        var elMine = gElManualMines[i];
        console.log('elMine:', elMine)
        elMine.innerHTML = EMPTY;
    }
    //manuel mode is over
    gIsManualMode = false;
}


/*set the mines manually*/
function setMinesManually(board, elCell) {
    gElManualMines.push(elCell);
    var elCellCoord = getCellCoord(elCell.className);
    board[elCellCoord.i][elCellCoord.j].isMine = true;
    elCell.innerHTML = MINE;
    //add the mine to gLevel;
    gLevel.mines += 1;
}



function revealCellNegs(board, rowIdx, colIdx) {
    var elCells = [];

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            var cell = board[i][j];
            //get class name from of the curr cell
            var cellClassName = getClassName({ i, j });
            //get the dom elem
            var elCell = document.querySelector(`.${cellClassName}`);
            //if cell is marked or already showen i want to continue to next iteration.
            if (cell.isMarked || cell.isShowen) continue
            if (cell.isMine) {
                elCell.innerHTML = MINE;
            } else if (cell.minesAroundCell === 0) {
                elCell.innerHTML = EMPTY
            } else {
                elCell.innerHTML = cell.minesAroundCell;
            }
            elCell.classList.add('hint-show');
            elCells.push(elCell);
        }
    }
    setTimeout(function () {
        for (var i = 0; i < elCells.length; i++) {
            var elCell = elCells[i];
            elCell.classList.remove('hint-show');
            if (elCell.innerHTML = MINE) elCell.innerHTML = EMPTY;
        }
        gElImgClicked.style.display = 'none';
    }, 1000)
}



function expandShown(board, rowIdx, colIdx) {
    console.log('function iniated!!!')
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            if (i === rowIdx && colIdx === j) continue;
            var cell = board[i][j]
            if (cell.isMine || cell.isMarked || cell.isShowen) continue;
            cell.isShowen = true;
            gGame.showCount++;
            if (cell.minesAroundCell === 0) {
                expandShown(board, i, j);
                renderCell({ i, j }, EMPTY);

            } else {
                renderCell({ i, j }, cell.minesAroundCell);

            }
        }
    }
}



/*get count of the mines of a coord*/
function getMinesNegsCount(board, rowIdx, colIdx) {
    var minesCount = 0;
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            if (i === rowIdx && colIdx === j) continue;
            var cell = board[i][j]
            if (cell.isMine) {
                minesCount += 1;
            }
        }
    }
    return minesCount;
}




function renderBoard(board) {
    // if (gLastMoves.length === 0) return;
    var elBoard = document.querySelector('.board');
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>`;
        for (var j = 0; j < board.length; j++) {
            var cellClass = getClassName({ i, j });
            var cell = board[i][j];
            // cellClass = (cell.isShowen) ? `${cellClass} show` : '';
            var cellContent;
            if (cell.isShowen) {
                if (cell.isMarked) {
                    cellContent = FLAG;
                } else if (cell.isMine) {
                    cellContent = MINE;
                } else if (cell.minesAroundCell) {
                    cellContent = cell.minesAroundCell;
                } else {
                    cellContent = EMPTY;
                }
            } else {
                if (cell.isMarked) {
                    cellContent = FLAG;
                } else {
                    cellContent = EMPTY;
                }

            }
            strHTML += `<td td onclick="cellClicked(this)" oncontextmenu ="cellClickedFlag(this)" class="${cellClass} ${cell.isShowen ? 'show' : ''}"> ${cellContent}</td > `;
        }
        strHTML += `</tr > `
    }
    elBoard.innerHTML = strHTML;
}







/*manage flag logic*/
function cellClickedFlag(elCell) {
    event.preventDefault();
    var copiedBoard = deepCopyBoard(gBoard)
    gLastMoves.push(copiedBoard);
    var currGameInfo = deepCopyObj(gGame);
    gLastGames.push(currGameInfo);

    var cellCoords = getCellCoord(elCell.className);
    var cellSelected = gBoard[cellCoords.i][cellCoords.j];
    if (!gTimerInterval) {
        startTimer();
    }
    if (!gGame.isOn || cellSelected.isShowen) return;

    if (cellSelected.isMarked) {
        cellSelected.isMarked = false;
        gGame.markedCount--;
        checkVictory();
        elCell.innerHTML = EMPTY;
    } else {
        cellSelected.isMarked = true;
        gGame.markedCount++;
        checkVictory();
        elCell.innerHTML = FLAG;
    }
}


/*save the intaizlized mines when play press undo ill get the same mines generated before*/
function useSameMines() {
    for (var i = 0; i < gMinePoses.length; i++) {
        var currMine = gMinePoses[i];
        gBoard[currMine.i][currMine.j].isMine = true;
    }
}

/*place mines in random positions on the board model*/
function placeMines(elCell) {
    gMinePoses = [];
    console.log('Place mines!')
    var emptyCells = getEmptyCells(gBoard, elCell);
    for (var i = 0; i < gLevel.mines; i++) {
        var randIdx = getRandomInteger(0, emptyCells.length - 1);
        var mineCoord = emptyCells.splice(randIdx, 1)[0];
        gBoard[mineCoord.i][mineCoord.j].isMine = true;
        gMinePoses.push(mineCoord);
    }

}


/*set in the model how many mines there are near each cell*/
function setMinesNegsCount() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            var negsNum = getMinesNegsCount(gBoard, i, j);
            gBoard[i][j].minesAroundCell = negsNum;
        }
    }
}


function cellClicked(elCell) {
    // debugger
    var copiedBoard = deepCopyBoard(gBoard)
    gLastMoves.push(copiedBoard);
    var currGameInfo = deepCopyObj(gGame);
    gLastGames.push(currGameInfo);

    var elSmiley = document.querySelector('.smile-img');
    var elSafeBtn = document.querySelector('.safe');
    var elHintsDiv = document.querySelector('.hints');
    var elLifeCount = document.querySelector('.life');
    var cellCoords = getCellCoord(elCell.className);
    var selectedCell = gBoard[cellCoords.i][cellCoords.j];
    startTimer();
    if (selectedCell.isShowen || selectedCell.isMarked) return
    if (!gGame.isOn) return;
    if (gIsManualMode) {
        console.log('GOT TO MANUEL LINE 400')
        setMinesManually(gBoard, elCell)
        setMinesNegsCount();
        return;
    }
    if (gIsHintClicked && gGame.showCount >= 1) {
        console.log('got to here')
        revealCellNegs(gBoard, cellCoords.i, cellCoords.j);
        gIsHintClicked = false;
        return;
    }
    if (gGame.showCount === 0 && gElManualMines.length === 0) {
        if (gIsUndoClicked) {
            console.log('place same mines in there earlier pos')
            useSameMines();
            setMinesNegsCount();
        } else {
            console.log('line 424 executed!!@!!!!!!!')
            elSafeBtn.style.display = 'block';
            elHintsDiv.style.display = 'block';
            placeMines(elCell);
            setMinesNegsCount();
        }
    }

    if (selectedCell.isMine) {
        gMineAudio = new Audio('sound/mine.mp3');
        gMineAudio.play();
        --gLifeCount;
        gBoard[cellCoords.i][cellCoords.j].isShowen = false;
        elCell.classList.add('show-bomb')
        elCell.innerHTML = MINE;
        if (gLifeCount === 0) {
            revealMines();
            gameOver();
            elSmiley.src = `imgs/dead-rick.png`;
        } else {
            setTimeout(function () {
                elCell.classList.remove('show-bomb');
                elCell.innerHTML = EMPTY;
            }, 1000)
        }
        elLifeCount.innerText = gLifeCount;
    } else {
        selectedCell.isShowen = true;
        gGame.showCount++;
        if (selectedCell.minesAroundCell) {
            renderCell({ i: cellCoords.i, j: cellCoords.j }, selectedCell.minesAroundCell)
        } else {
            expandShown(gBoard, cellCoords.i, cellCoords.j);
            elCell.classList.add('show');
        }

    }
    checkVictory();
}



function checkVictory() {
    var elSmiley = document.querySelector('.smile-img');
    console.log('show count', gGame.showCount)
    console.log(gGame.markedCount)
    if (gGame.showCount + gGame.markedCount === (gBoard.length ** 2) && gGame.markedCount === gLevel.mines) {
        gWinAudio = new Audio('sound/win.mp3');
        gWinAudio.play();
        updateBestScore();
        elSmiley.src = 'imgs/rick-win.png';
        gGame.isWon = true;
        gameOver();
        return;
    }
}


function gameOver() {
    gGame.isOn = false;
    var elBubbleSpan = document.querySelector('.bubble-span');
    showBubble()
    console.log('GAME OVER!')
    if (gGame.isWon) {
        elBubbleSpan.innerHTML = 'YOU WON!';
    } else {
        elBubbleSpan.innerHTML = 'GAME OVER!';
    }
    clearInterval(gTimerInterval);
    console.log('cleared interval')
    getRandBackground();


}


function calcTime() {
    var elSpanTimer = document.querySelector('.time')
    var now = Date.now();
    var diff = Math.floor((now - gStartTimer) / 1000);
    console.log('diff', diff)
    var time = formatTimestamp(diff);
    gGame.secsPassed = diff;
    elSpanTimer.innerText = time;

}

function startTimer() {
    if (gIsManualMode) {
        return;
    }
    if (gIsUndoClicked) {
        console.log('undo clicked and not startign timer again')
        return;
    }
    if (gGame.showCount === 0) {
        gStartTimer = Date.now();
        gTimerInterval = setInterval(calcTime, 1000);
        console.log('Interval is now:', gTimerInterval);
    }
}



function updateBestScore() {
    var storageScoreKey;
    var elModeSpan;
    var storageUsername;
    var elUsername;
    var elModeDate;
    var storageModeDate;
    var elScoreBeginner = document.querySelector('.td1-time');
    var elScoreMedium = document.querySelector('.td2-time');
    var elScoreExpert = document.querySelector('.td3-time');
    var elNameBeginner = document.querySelector('.td1-name');
    var elNameMedium = document.querySelector('.td2-name');
    var elNameExpert = document.querySelector('.td3-name')
    var elBeginnerDate = document.querySelector('.td1-date');
    var elMediumDate = document.querySelector('.td2-date');
    var elExpertDate = document.querySelector('.td3-date');



    console.log(elScoreExpert, elScoreMedium, elScoreBeginner)
    switch (gLevel.size) {
        case 4:
            if (localStorage.getItem('score-beginner') === null) {
                localStorage.setItem('score-beginner', gGame.secsPassed);
                localStorage.setItem('username-beginner', localStorage.getItem('username'));
                localStorage.setItem('date-beginner', new Date().toLocaleString())
                elScoreBeginner.innerText = `${gGame.secsPassed} seconds`;
                elNameBeginner.innerText = localStorage.getItem('username')
                elBeginnerDate.innerText = localStorage.getItem('date-beginner')

            }
            storageScoreKey = 'score-beginner'
            elModeSpan = elScoreBeginner
            storageUsername = 'username-beginner';
            elUsername = elNameBeginner;
            storageModeDate = 'date-beginner';
            elModeDate = elBeginnerDate;
            break;
        case 8:
            if (localStorage.getItem('score-medium') === null) {
                localStorage.setItem('score-medium', gGame.secsPassed);
                localStorage.setItem('username-medium', localStorage.getItem('username'));
                localStorage.setItem('date-medium', new Date().toLocaleString())
                elScoreMedium.innerText = `${gGame.secsPassed} seconds`;
                elNameMedium.innerText = localStorage.getItem('username-medium')
                elMediumDate.innerText = localStorage.getItem('date-medium')
            }
            storageScoreKey = 'score-medium'
            elModeSpan = elScoreMedium;
            storageUsername = 'username-medium';
            elUsername = elNameMedium;
            storageModeDate = 'date-medium';
            elModeDate = elMediumDate;
            break
        case 12:
            if (localStorage.getItem('score-medium') === null) {
                localStorage.setItem('score-medium', gGame.secsPassed);
                localStorage.setItem('username-expert', localStorage.getItem('username'));
                localStorage.setItem('date-expert', new Date().toLocaleString())
                elScoreExpert.innerText = `${gGame.secsPassed} seconds`;
                elNameExpert.innerText = localStorage.getItem('username-expert')
                elExpertDate.innerText = localStorage.getItem('date-expert')
            }
            storageScoreKey = 'score-expert'
            elModeSpan = elScoreExpert;
            storageUsername = 'username-expert';
            elUsername = elNameExpert;
            storageModeDate = 'date-expert';
            elModeDate = elExpertDate;
            // elNameExpert.innerText = localStorage.getItem('username')
            break
    }
    var currScore = +localStorage.getItem(storageScoreKey);
    console.log('curr score:', currScore);
    console.log('secs passed:', gGame.secsPassed);
    if (gGame.secsPassed < currScore) {
        var currDate = new Date().toLocaleString();
        localStorage.setItem(storageScoreKey, gGame.secsPassed);
        localStorage.setItem(storageUsername, localStorage.getItem('username'));
        localStorage.setItem(storageModeDate, currDate);
        elModeSpan.innerText = `${gGame.secsPassed} seconds`;
        elUsername.innerText = localStorage.getItem('username');
        elModeDate.innerText = currDate;
        alert('Leaderboard has been updated...')

    }
}



function changeUser() {
    var elBubbleSpan = document.querySelector('.bubble-span');
    var name = prompt('Enter Username:');
    localStorage.setItem('username', name);
    elBubbleSpan.innerText = `Welcome,${name}`;
}

function getUsername() {
    var elBubbleSpan = document.querySelector('.bubble-span');
    if (!localStorage.getItem('username')) {
        var name = prompt('What is your name?')
        if (!name) name = 'Player';
        localStorage.setItem('username', name);
    }
    showBubble();
    elBubbleSpan.innerText = `Welcome,${localStorage.getItem('username')}!`;


}


//load data to localstorage
function loadStorageData() {
    var elScoreBeginner = document.querySelector('.td1-time');
    var elScoreMedium = document.querySelector('.td2-time');
    var elScoreExpert = document.querySelector('.td3-time');
    var elNameBeginner = document.querySelector('.td1-name');
    var elNameMedium = document.querySelector('.td2-name');
    var elNameExpert = document.querySelector('.td3-name');

    var scoreBeginner = localStorage.getItem('score-beginner');
    var scoreMedium = localStorage.getItem('score-medium');
    var scoreExpert = localStorage.getItem('score-expert');

    var nameBeginner = localStorage.getItem('username-beginner');
    var nameMedium = localStorage.getItem('username-medium');
    var nameExpert = localStorage.getItem('username-expert');

    var elDateBeginner = document.querySelector('.td1-date');
    var elDateMedium = document.querySelector('.td2-date');
    var elDateExpert = document.querySelector('.td3-date');

    var dateBeginner = localStorage.getItem('date-beginner')
    var dateMedium = localStorage.getItem('date-medium')
    var dateExpert = localStorage.getItem('date-expert')


    elScoreBeginner.innerText = !scoreBeginner ? 'None' : `${scoreBeginner} seconds`;
    elScoreMedium.innerText = !scoreMedium ? 'None' : `${scoreMedium} seconds`;
    elScoreExpert.innerText = !scoreExpert ? 'None' : `${scoreExpert} seconds`;
    elNameBeginner.innerText = !nameBeginner ? 'None' : localStorage.getItem('username-beginner');
    elNameMedium.innerText = !nameMedium ? 'None' : localStorage.getItem('username-medium');
    elNameExpert.innerText = !nameExpert ? 'None' : localStorage.getItem('username-expert');
    elDateBeginner.innerText = !dateBeginner ? 'None' : dateBeginner;
    elDateMedium.innerText = !dateMedium ? 'None' : dateMedium;
    elDateExpert.innerText = !dateExpert ? 'None' : dateExpert;

}

function showBubble() {
    var elBubble = document.querySelector('.bubble');
    elBubble.style.display = 'block';
}

function removeBubble() {
    var elBubble = document.querySelector('.bubble');
    elBubble.style.display = 'none';
}

function closeModal() {
    var elScoreModal = document.querySelector('.score-modal');
    elScoreModal.style.display = 'none';
}

function openModal() {
    var elScoreModal = document.querySelector('.score-modal');
    elScoreModal.style.display = 'flex';
}

function displayHintImgs() {
    var elHintImgs = document.querySelectorAll('.hint');
    for (var i = 0; i < elHintImgs.length; i++) {
        var elImg = elHintImgs[i];
        elImg.style.display = 'inline-block';
        elImg.classList.remove('hint-effect');
    }
}

function getRandBackground() {
    var backgrounds = ['imgs/1.png', 'imgs/2.png', 'imgs/3.png', 'imgs/4.png', 'imgs/5.png', 'imgs/6.png'];
    var randIdx = getRandomInteger(0, backgrounds.length - 1);
    var chosenImg = backgrounds[randIdx];
    console.log(chosenImg);
    document.body.style.backgroundImage = `url(${chosenImg})`;

}

function createCell() {
    var cell = {
        minesAroundCell: 0,
        isShowen: false,
        isMine: false,
        isMarked: false
    }
    return cell;
}


function getClassName(location) {
    var cellClass = `cell-${location.i}-${location.j}`
    return cellClass;
}

function renderCell(location, value) {
    var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
    elCell.classList.add('show');
    elCell.innerHTML = value;
}
function getCellCoord(strClassName) {
    var sliced = strClassName;

    if (strClassName.includes('show')) {
        sliced = strClassName.slice(0, 9)
    }
    var parts = sliced.split('-');
    var coord = {
        i: +parts[1],
        j: +parts[2],
    };
    return coord;
}






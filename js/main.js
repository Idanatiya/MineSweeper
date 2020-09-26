
'use strict';

// const MINE = '💣';
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


var gCurrModel = [];
var gStep = 0;





function init() {
    loadStorageData();
    var elSafeClickLeft = document.querySelector('.click-left');
    var elSafeClickModal = document.querySelector('.safe');
    var elHintsDiv = document.querySelector('.hints');
    var elLifeCount = document.querySelector('.life');
    var elSmiley = document.querySelector('.smile-img');
    elSmiley.src = 'imgs/normal-rick.png';
    gMinePoses = [];
    gLifeCount = 3;
    gSafeClickLeft = 3;
    gBoard = createBoard();
    gStartTimer = null;
    gIsHintClicked = false;
    gIsManualMode = false;
    gElManualMines = [];

    gGame = {
        isOn: false,
        showCount: 0,
        markedCount: 0,
        secsPassed: 0,
        isWon: false
    }
    removeBubble();
    getUsername();


    if (gTimerInterval) clearInterval(gTimerInterval)
    console.log(`interval:${gTimerInterval} cleared`)

    //redisplat hitn imgs
    showHintsImgs();
    elSafeClickModal.style.display = 'none';
    elHintsDiv.style.display = 'none';
    elLifeCount.innerText = gLifeCount;
    elSafeClickLeft.innerText = gSafeClickLeft + ' safe clicks available ';

    gGame.isOn = true;
    gCurrModel = gBoard;
    renderBoard(gBoard);

}


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



// Add an “UNDO” button, each click on that button takes the game back by one step (can go all the way back to game start). --->>>>NOT FINISHED 
function undoClicked() {
    // if (gGame.showCount === 0) return;
    for (var i = 0; i < gCurrModel.length; i++) {
        for (var j = 0; j < gCurrModel[0].length; j++) {
            var cell = gCurrModel[i][j];
            if (cell.isShowen) {
                cell.isShowen = false;
            }
        }
        gBoard = gCurrModel;
        renderBoard(gBoard);
        console.log(gBoard);
        console.log('rendered!')

    }
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

// .feature-click-effect
/*reveal mines upon loss*/
function revealMines(elCell) {
    for (var i = 0; i < gMinePoses.length; i++) {
        var currMineCoords = gMinePoses[i];
        // console.log('curr mine coords', currMineCoords)
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
    gIsManualMode = true;
    gLevel.mines = 0;
    elImg.classList.add('axe-click-effect')
    console.log('You entered manual mode');
}


//hide manual mines
function hideManualMines() {
    if (gGame.isOn) alert('game already started')
    for (var i = 0; i < gElManualMines.length; i++) {
        var elMine = gElManualMines[i];
        console.log('elMine:', elMine)
        // elMine.classList.remove('show');
        elMine.innerHTML = EMPTY;
    }
    //manuel mode is over
    gIsManualMode = false;
}

// gBoard, elCell, cellCoords.i, cellCoords.j
function setMinesManually(board, elCell) {
    gElManualMines.push(elCell);
    var elCellCoord = getCellCoord(elCell.className);
    board[elCellCoord.i][elCellCoord.j].isMine = true;
    console.log(`cell coord:{${elCellCoord.i},${elCellCoord.j}} is now a mine!`)
    elCell.innerHTML = MINE;
    // elCell.classList.add('show');
    //add the mine to gLevel;
    gLevel.mines += 1;
}



function revealCellNegs(board, rowIdx, colIdx) {
    var elCells = [];
    console.log('got to REVEALCELLNEGS')
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



function expandShown(board, rowIdx, colIdx, elCell) {
    console.log(elCell)
    if (board[rowIdx][colIdx].minesAroundCell && !board[rowIdx][colIdx].isMine) {
        console.log('cell has number in it')
        renderCell({ i: rowIdx, j: colIdx }, board[rowIdx][colIdx].minesAroundCell);
        console.log('LINE 280 ADDED SHOWCOUNT1!')
        gGame.showCount++;
        return;
    }

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
    // console.log(rowIdx, colIdx)
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
    var elBoard = document.querySelector('.board');
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>`;
        for (var j = 0; j < board.length; j++) {
            var cellClass = getClassName({ i, j });
            var cellContent = board[i][j];
            cellContent = EMPTY;
            strHTML += `<td td onclick="cellClicked(this)" oncontextmenu ="cellClickedFlag(this)" class="${cellClass}"> ${cellContent}</td > `;
        }
        strHTML += `</tr > `
    }
    elBoard.innerHTML = strHTML;
}


/*manage flag logic*/
function cellClickedFlag(elCell) {
    event.preventDefault();
    var cellCoords = getCellCoord(elCell.className);
    var cellSelected = gBoard[cellCoords.i][cellCoords.j]
    if (!gTimerInterval) {
        startTimer();
    }
    if (!gGame.isOn || cellSelected.isShowen) return;

    if (cellSelected.isMarked) {
        cellSelected.isMarked = false;
        gGame.markedCount--;
        checkVictory();
        // checkVictory();
        elCell.innerHTML = EMPTY;
    } else {
        cellSelected.isMarked = true;
        gGame.markedCount++;
        checkVictory();
        elCell.innerHTML = FLAG;
    }

}


/*place mines in random positions on the board model*/
function placeMines(elCell) {
    console.log('Place mines!')
    var emptyCells = getEmptyCells(gBoard, elCell);
    console.log('EMPTY CELLS ARRAY:', emptyCells);
    // console.log('num of coords before splice:', emptyCells.length)
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
    var elSmiley = document.querySelector('.smile-img');
    var elSafeBtn = document.querySelector('.safe');
    var elHintsDiv = document.querySelector('.hints');
    var elLifeCount = document.querySelector('.life');
    var cellCoords = getCellCoord(elCell.className);
    var selectedCell = gBoard[cellCoords.i][cellCoords.j];
    if (selectedCell.isShowen || selectedCell.isMarked) return
    if (!gGame.isOn) return;
    //UNDO feature
    gCurrModel = copyMat(gBoard)
    startTimer();
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
        console.log('line 424 executed!!@!!!!!!!')
        elSafeBtn.style.display = 'block';
        elHintsDiv.style.display = 'block';
        placeMines(elCell);
        setMinesNegsCount();
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
        expandShown(gBoard, cellCoords.i, cellCoords.j, elCell);
        gBoard[cellCoords.i][cellCoords.j].isShowen = true;
        elCell.classList.add('show');
        // gGame.showCount++;
        // gGame.showCount++;
    }
    // console.log('gGame:', gGame)
    checkVictory();
    // console.log('got line 498')
    gBoard = gCurrModel;

}



function checkVictory() {
    console.log('ROTEM LOOK gGame:', gGame)
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
    // var bestScore = localStorage.setItem('score-expert', gGame.secsPassed);
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


}


function calcTime() {
    var elSpanTimer = document.querySelector('.time')
    var now = Date.now();
    var diff = Math.floor((now - gStartTimer) / 1000);
    gGame.secsPassed = Math.floor(diff);
    var time = formatTimestamp(diff);
    elSpanTimer.innerText = time;

}

function startTimer() {
    if (gGame.showCount <= 0) {
        gStartTimer = Date.now();
        gTimerInterval = setInterval(calcTime, 10);
    }
}


function updateBestScore() {
    var elScoreBeginner = document.querySelector('.score-beginner');
    var elScoreMedium = document.querySelector('.score-medium');
    var elScoreExpert = document.querySelector('.score-expert');
    console.log(elScoreExpert, elScoreMedium, elScoreBeginner)
    switch (gLevel.size) {
        case 4:
            if (localStorage.getItem('score-beginner') === null) {
                localStorage.setItem('score-beginner', gGame.secsPassed);
                elScoreBeginner.innerText = gGame.secsPassed + ' seconds';

            }
            var currScore = +localStorage.getItem('score-beginner')
            if (gGame.secsPassed < currScore) {
                localStorage.setItem('score-beginner', gGame.secsPassed);
                elScoreBeginner.innerText = gGame.secsPassed + ' seconds';
            }
            break;
        case 8:
            if (localStorage.getItem('score-medium') === null) {
                localStorage.setItem('score-medium', gGame.secsPassed);
                elScoreMedium.innerText = gGame.secsPassed + ' seconds';
            }
            var currScore = +localStorage.getItem('score-medium');
            if (gGame.secsPassed < currScore) {
                localStorage.setItem('score-medium', gGame.secsPassed);
                elScoreMedium.innerText = gGame.secsPassed + ' seconds';

            }
            break
        case 12:
            if (localStorage.getItem('score-medium') === null) {
                localStorage.setItem('score-medium', gGame.secsPassed);
                elScoreExpert.innerText = gGame.secsPassed + ' seconds';
            }
            var currScore = +localStorage.getItem('score-expert');
            if (gGame.secsPassed < currScore) {
                localStorage.setItem('score-expert', gGame.secsPassed);
                elScoreExpert.innerText = gGame.secsPassed + ' seconds';

            }
            break
    }
}



function getUsername() {
    var elBubbleSpan = document.querySelector('.bubble-span');
    if (!localStorage.getItem('username')) {
        var name = prompt('What is your name?')
        localStorage.setItem('username', name);
    }
    showBubble();
    elBubbleSpan.innerText = `Welcome,${localStorage.getItem('username')}!`;


}


//load data to localstorage
function loadStorageData() {
    var elScoreBeginner = document.querySelector('.score-beginner');
    var elScoreMedium = document.querySelector('.score-medium');
    var elScoreExpert = document.querySelector('.score-expert');
    var scoreBeginner = localStorage.getItem('score-beginner');
    var scoreMedium = localStorage.getItem('score-medium');
    var scoreExpert = localStorage.getItem('score-expert');

    elScoreBeginner.innerText = !scoreBeginner ? 'None' : scoreBeginner + ' seconds';
    elScoreMedium.innerText = !scoreMedium ? 'None' : scoreMedium + ' seconds';
    elScoreExpert.innerText = !scoreExpert ? 'None' : scoreExpert + ' seconds';

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

function showHintsImgs() {
    var elHintImgs = document.querySelectorAll('.hint');
    for (var i = 0; i < elHintImgs.length; i++) {
        var elImg = elHintImgs[i];
        elImg.style.display = 'inline-block';
        elImg.classList.remove('hint-effect');
    }
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
    // console.log('clas:', location)
    var cellClass = `cell-${location.i}-${location.j}`
    return cellClass;
}

function renderCell(location, value) {
    // gGame.showCount += 1;
    // console.log('location:', location)
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
    // console.log('EL CELL:', elCell)
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










/*backuphints*/
// function revealCellNegs(board, rowIdx, colIdx) {
//     var elCells = [];
//     console.log('got to REVEALCELLNEGS')
//     for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
//         if (i < 0 || i >= board.length) continue;
//         for (var j = colIdx - 1; j <= colIdx + 1; j++) {
//             if (j < 0 || j >= board.length) continue;
//             // if (i === rowIdx && colIdx === j) continue;
//             var cell = board[i][j];
//             var cellClassName = getClassName({ i, j });
//             var elCell = document.querySelector(`.${cellClassName}`);
//             // if(i === rowIdx && colIdx === j) {
//             //     elCells.
//             // }
//             if (cell.isMine) {
//                 elCell.innerHTML = MINE;
//             } else if (cell.minesAroundCell === 0) {
//                 elCell.innerHTML = EMPTY
//             } else {
//                 elCell.innerHTML = cell.minesAroundCell;
//             }
//             elCell.classList.add('show');
//             elCell.classList.add('show-hint')
//             // if (cell.minesAroundCell === 0 && !cell.isMine) {
//             //     elCell.classList.add('show')
//             //     elCell.innerText = EMPTY;
//             // } else {
//             //     elCell.classList.add('show')
//             //     elCell.innerText = cell.minesAroundCell;
//             // }
//             elCells.push(elCell);
//         }
//     }
//     setTimeout(function () {
//         console.log('go to timeout')
//         for (var i = 0; i < elCells.length; i++) {
//             var elCell = elCells[i];
//             elCell.classList.remove('show');
//         }
//     }, 2000)
// }




//second
// function cellClicked(elCell) {
//     // debugger
//     var elSmiley = document.querySelector('.smile-img');
//     var elSafeBtn = document.querySelector('.safe');
//     var elLifeCount = document.querySelector('.life');
//     var cellCoords = getCellCoord(elCell.className);
//     var selectedCell = gBoard[cellCoords.i][cellCoords.j];
//     if (selectedCell.isShowen || selectedCell.isMarked) return
//     if (!gGame.isOn) return;
//     startTimer();
//     /**manuel mode */
//     if (gIsManualMode) {
//         console.log('GOT TO MANUEL LINE 400')
//         setMinesManually(gBoard, elCell)
//         setMinesNegsCount();
//         return;
//     }
//     //place mines only after first click
//     /**Hint feature */
//     if (gIsHintClicked && gGame.showCount >= 1) {
//         console.log('got to here')
//         revealCellNegs(gBoard, cellCoords.i, cellCoords.j);
//         gIsHintClicked = false;
//         return;
//     }

//     if (gGame.showCount === 0 && gElManualMines.length === 0) {
//         console.log('line 424 executed!!@!!!!!!!')
//         elSafeBtn.style.display = 'block';
//         placeMines(elCell);
//         setMinesNegsCount();
//     }

//     expandShown(gBoard, cellCoords.i, cellCoords.j, elCell);
//     var cellNegs = getMinesNegsCount(gBoard, cellCoords.i, cellCoords.j);
//     gBoard[cellCoords.i][cellCoords.j].isShowen = true;
//     gGame.showCount += 1;
//     checkVictory();
//     elCell.classList.add('show');
//     if (selectedCell.isMine) {
//         --gLifeCount;
//         elCell.innerHTML = MINE;
//         if (gLifeCount === 0) {
//             elLifeCount.innerText = gLifeCount;
//             revealMines();
//             gameOver();
//             elSmiley.src = `imgs/dead-rick.png`;
//         } else {
//             elCell.style.backgroundColor = 'red';
//             elLifeCount.innerText = gLifeCount;

//         }

//     } else if (cellNegs && gGame.showCount > 1) {
//         gBoard[cellCoords.i][cellCoords.j].minesAroundCell = cellNegs;
//         elCell.innerHTML = cellNegs;
//     }
// }

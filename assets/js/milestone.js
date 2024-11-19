// To begin with, some classes to contain the basic objects, moves and states.

class Move {
    sourcex;
    sourcey;
    targetx;
    targety;
    pieceMoved;
    pieceCaptured;
    moveID;

    constructor(i,j,k,l) {
        this.sourcex = i;
        this.sourcey = j;
        this.targetx = k;
        this.targety = l;
        this.pieceMoved    = state.board[i][j];
        this.pieceCaptured = state.board[k][l];
        this.moveID = '' + i + j + k + l;
    }

    wins() {
        return (   (this.targetx == 0 && this.targety == 0)
                || (this.targetx == 6 && this.targety == 6));
    }
}

class GameState {
    board;
    turn;
    bHuman;
    wHuman;
    difficulty;
    isMenu;
    moveList = [];

    constructor(board, bHuman, wHuman,difficulty,menu) {
        this.board = board;
        this.turn = 1; // 0 for black, 1 for white  
        this.bHuman = bHuman;
        this.wHuman = wHuman;
        this.difficulty = difficulty;
        this.isMenu = menu;
    }

    blackPieces() {
        let arr = [];
        for (let i=0;i<7;i++) {
            for (let j=0;j<7;j++) {
                if (this.board[i][j] == 'B') {
                    arr.push([i,j]);
                }
            }
        }
        return arr;
    }

    whitePieces() {
        let arr = [];
        for (let i=0;i<7;i++) {
            for (let j=0;j<7;j++) {
                if (this.board[i][j] == 'W') {
                    arr.push([i,j]);
                }
            }
        }
        return arr;
    }

    winner() {
        // -1 for black, 1 for white, 0 for neither

        if (this.board[0][0] == 'W') {
            return 1;
        }
        else if (this.board[6][6] == 'B') {
            return -1;
        }
        else if (this.legalMoves().length == 0) {
            return (1-this.turn);
        }
        else {
            return 0;
        }
    }

    gameOver() {
        return !(this.winner() == 0);
    }

    legalMoves() {
        let moves = [];
        if (this.board[0][0] == 'W' || this.board[6][6] == 'B') {
            return moves;
        }
        if (this.turn == 0) {
            for (var [x,y] of this.blackPieces()) {
                if (x != 6 && this.board[x+1][y] == 'O') {
                    moves.push(new Move(x,y,x+1,y));
                }
                if (y != 6 && this.board[x][y+1] == 'O') {
                    moves.push(new Move(x,y,x,y+1));
                }
                if (x != 6 && y != 6 && this.board[x+1][y+1] != 'B') {
                    moves.push(new Move(x,y,x+1,y+1));
                }
            }
        }
        else {
            for (var [x,y] of this.whitePieces()) {
                if (x != 0 && this.board[x-1][y] == 'O') {
                    moves.push(new Move(x,y,x-1,y));
                }
                if (y != 0 && this.board[x][y-1] == 'O') {
                    moves.push(new Move(x,y,x,y-1));
                }
                if (x != 0 && y != 0 && this.board[x-1][y-1] != 'W') {
                    moves.push(new Move(x,y,x-1,y-1));
                }
            }
        }
        return moves;
    }

    legalTargets([i,j]) {
        return this.legalMoves().filter(move => move.sourcex == i && move.sourcey == j)
                   .map(move=>[move.targetx,move.targety]);
    }

    enact(move) {
        this.board[move.targetx][move.targety] = this.board[move.sourcex][move.sourcey];
        this.board[move.sourcex][move.sourcey] = 'O';
        this.turn = 1-this.turn;
        highlight = false;
        this.moveList.push(move);
    }

    undo() {
        if (this.moveList.length != 0) {
            let move = this.moveList.pop();
            this.board[move.sourcex][move.sourcey] = move.pieceMoved;
            this.board[move.targetx][move.targety] = move.pieceCaptured;
            this.turn = 1 - this.turn;
        }
    }
}

// The initial board.

const initialBoard =[['B','B','B','B','X','X','X'],
                    ['B','B','B','O','O','X','X'],
                    ['B','B','O','O','O','O','X'],
                    ['B','O','O','O','O','O','W'],
                    ['X','O','O','O','O','W','W'],
                    ['X','X','O','O','W','W','W'],
                    ['X','X','X','W','W','W','W'],
                    ];


function initialState(bH,wH,diff) {
    var arr = initialBoard.map(function(a) {
        return a.slice();
    })
    return new GameState(arr,bH,wH,diff,true);
}

const board   = new Path2D();
const spaces  = new Array(7);
const gui     = new Image();
const buttons = new Array(10);
const check   = new Image();
const black   = new Image();
const white   = new Image();


let canvas,ctx, X, Y;
let state = initialState(false,true,3);


let highlight = false;
let hx = 0, hy = 0; 

let quat = false;


function init() {
    canvas = document.getElementById("milestone");
    ctx = canvas.getContext("2d");

    canvas.width  = milestoneContainer.clientWidth;
    canvas.height = milestoneContainer.clientHeight;

    X = canvas.width;
    Y = canvas.height;

    loadImages();
    loadSpaces();
    loadMenu();
    loadBoard();

    window.requestAnimationFrame(draw);
}

function loadImages() {
    black.src = "assets/images/milestone/B.png";
    white.src = "assets/images/milestone/W.png";
    gui.src   = "assets/images/milestone/gui.png";
    check.src = "assets/images/milestone/check.png";
}

function loadSpaces() {
    for (let i = 0; i < 7; i++) {
        spaces[i] = [];
        for (let j=0; j<7;j++) {
            spaces[i][j] = {hex  : new Path2D(),
                            color: ["#f7cd88","#d6a585","#f5be9a"][(i+j) % 3]};
        }
    }
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j<7;j++) {
            if (Math.abs(i-j) < 4) {
                let [spaceX,spaceY] = coordToScreen(i,j)
                spaces[i][j].hex.moveTo(spaceX+X*(1/2 - 5/(96*Math.sqrt(3))),spaceY+X*13/96);
                spaces[i][j].hex.lineTo(spaceX+X*(1/2 + 5/(96*Math.sqrt(3))),spaceY+X*13/96);
                spaces[i][j].hex.lineTo(spaceX+X*(1/2 + 5/(48*Math.sqrt(3))),spaceY+X*3/16);
                spaces[i][j].hex.lineTo(spaceX+X*(1/2 + 5/(96*Math.sqrt(3))),spaceY+X*23/96);
                spaces[i][j].hex.lineTo(spaceX+X*(1/2 - 5/(96*Math.sqrt(3))),spaceY+X*23/96);
                spaces[i][j].hex.lineTo(spaceX+X*(1/2 - 5/(48*Math.sqrt(3))),spaceY+X*3/16);
                spaces[i][j].hex.closePath();
            }
        }
    }
    
    canvas.addEventListener('click', function input(event) {
        // only active if menu is not being shown
        if (!state.isMenu) {

            // If a hex is highlighted and you click a legal target, enact move.

            for (var [i,j] of state.legalTargets([hx,hy])) {
                if (highlight && ctx.isPointInPath(spaces[i][j].hex,event.offsetX,event.offsetY)) {
                    state.enact(new Move(hx,hy,i,j));    
                }
            }
            highlight = false;

            // otherwise, if a hex is clicked, mark it to be highlighted.
            // then recolor.

            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < 7; j++) {
                    if (ctx.isPointInPath(spaces[i][j].hex,event.offsetX,event.offsetY)
                        && (   (state.turn == 0 && state.board[i][j] == 'B')
                            || (state.turn == 1 && state.board[i][j] == 'W'))) {
                        highlight = true;
                        hx = i, hy = j;
                    }
                }
            }
        }
    });
}

function loadMenu() {
    for (let i = 0; i < 15; i++) {
        buttons[i] = new Path2D();
    }
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j<2; j++) {
            buttons[2*i+j].rect([0.435*X,0.7*X][i],
                                [0.300*Y,0.356*Y][j],
                                 0.055*X,0.035*Y);
        }
    }
    for (let i = 4; i < 12; i++) {
        buttons[i].rect(X*(0.125+0.113*(i-4)), 0.507*Y, 0.045*X, 0.028*Y)
    }
    buttons[12].moveTo(X*0.576,Y*0.650);
    buttons[12].lineTo(X*0.736,Y*0.598);
    buttons[12].lineTo(X*0.890,Y*0.648);
    buttons[12].lineTo(X*0.890,Y*0.754);
    buttons[12].lineTo(X*0.733,Y*0.804);
    buttons[12].lineTo(X*0.593,Y*0.755);
    buttons[12].closePath();

    canvas.addEventListener('click', function(event) {
        if (quat) {
            quat = false;
            state = initialState(state.bHuman,state.wHuman,state.difficulty);
            
        }
        else {
            let clickedButton = -1;
            for (let i = 0; i < 13; i++) {
                if (state.isMenu && ctx.isPointInPath(buttons[i],event.offsetX,event.offsetY)) {
                    clickedButton = i;
                }
            }
            switch (clickedButton) {
                case -1:
                    break;
                case 0:
                    state.wHuman = true;
                    break;
                case 1:
                    state.bHuman = true;
                    break;
                case 2:
                    state.wHuman = false;
                    break;
                case 3:
                    state.bHuman = false;
                    break;
                case 12:
                    state.isMenu = false;
                    break;
                default:
                    state.difficulty = clickedButton - 3;
                    console.log(state.difficulty);
            }
        }
    });
}

function updateMenu() {
    
}

function loadBoard() {
    board.moveTo(X/2,X/12);
    board.lineTo(X*(1/2+5*Math.sqrt(3)/24),X*7/24);
    board.lineTo(X*(1/2+5*Math.sqrt(3)/24),X*17/24);
    board.lineTo(X/2,X*11/12);
    board.lineTo(X*(1/2-5*Math.sqrt(3)/24),X*17/24);
    board.lineTo(X*(1/2-5*Math.sqrt(3)/24),X*7/24);
    board.closePath();
}

// helpers. Shuffle stolen from
//  https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

function coordToScreen(i,j) {
    return [(j-i) * 5*X/(32*Math.sqrt(3)),(i+j) * 5*X/96]
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

function drawGame() {
    // draw background
    ctx.fillStyle = "lavender";
    ctx.beginPath();
    ctx.rect(0,0,X,Y);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "turquoise";
    ctx.rect(0,Y*0.59,X,Y*0.35);
    ctx.fill();
    ctx.stroke();

    // draw board
    ctx.lineWidth = 10;
    ctx.lineJoin  = "round";
    ctx.fillStyle = state.gameOver() ? "gold" : "brown";
    ctx.stroke(board);
    ctx.fill(board);
   
    // draw spaces
    ctx.lineWidth = 1.5;
    for (let i=0;i<7;i++) {
        for (let j=0;j<7;j++) {
                spaces[i][j].color = ["#f7cd88","#d6a585","#f5be9a"][(i+j) % 3];
        }
    }
    if (highlight) {
        spaces[hx][hy].color = "yellow";
        for ([i,j] of state.legalTargets([hx,hy])) {
            spaces[i][j].color = state.board[i][j] == 'O'
                            ? "lightblue"
                            : "pink";
        }
    }
    for (let i=0;i<7;i++) {
        for (let j=0;j<7;j++) {
            ctx.fillStyle = spaces[i][j].color;
            ctx.fill(spaces[i][j].hex);
            ctx.stroke(spaces[i][j].hex);
        }
    }
    
    // draw pieces

    for (var [x,y] of state.blackPieces()) {
        let [spaceX,spaceY] = coordToScreen(x,y);
    
        ctx.drawImage(black,spaceX+X*(1/2 - 5/(96*Math.sqrt(3))),
                            spaceY+X*(3/16 -5/(96*Math.sqrt(3))),
                            X*5/(48*Math.sqrt(3)),X*5/(48*Math.sqrt(3)));
        
    }

    for (var [x,y] of state.whitePieces()) {
        let [spaceX,spaceY] = coordToScreen(x,y);
    
        ctx.drawImage(white,spaceX+X*(1/2 - 5/(96*Math.sqrt(3))),
                            spaceY+X*(3/16 -5/(96*Math.sqrt(3))),
                            X*5/(48*Math.sqrt(3)),X*5/(48*Math.sqrt(3)));
        
    }

    // draw winner dialog

    if (state.gameOver()) {
        ctx.font = "" + X*0.05 + "px Gill Sans";
        ctx.fillStyle = "purple";
        if (state.winner() == -1) {
            ctx.fillText("Black has won! Click anywhere to return.",X*0.07,X*1.01);
        }
        else {
            ctx.fillText("White has won! Click anywhere to return.",X*0.07,X*1.01);
        }
        quat = true;

    }

    // draw rules dialog
    ctx.font = "italic " + (X*0.07) + "px Gill Sans";
    ctx.fillStyle = "black";
    ctx.fillText("Milestone",X*0.03,Y*0.63);

    ctx.font = "" + (X*0.0350) + "px Gill Sans";
    let spacing = 0.025;
    let rulesDialog = ["The object of the game is to move one of your stones into",
                       "your opponent's home hex, at the far corner.",
                       "A stone may only move to one of the three adjacent hexes",
                       "in front of it. Capturing the opponent's stones is possible,",
                       "but a stone may only capture when moving directly forward."
                    ];
    for (let i = 0; i < rulesDialog.length; i++) {
        ctx.fillText(rulesDialog[i],X*0.05,Y*(0.66+spacing*i));
    }

    ctx.fillText("Some tips:",X*0.05,Y*(0.66+spacing*(rulesDialog.length+1)))

    let tips = ["- Click a piece to see its available moves.",
                "  Remember pieces can only capture forward!",
                "- It's generally a bad idea to move pieces close to your home.",
                "- The center is important. Try building a vertical wall!"];
    
    for (let i = 0; i < tips.length; i++) {
        ctx.fillText(tips[i],X*0.05,Y*(0.66+spacing*(i+rulesDialog.length+2)));
    }
}

function drawMenu() {
    ctx.beginPath();
        ctx.clearRect(0,0,X,Y);
        ctx.drawImage(gui,0,0,X,Y);
        state.wHuman ? ctx.drawImage(check,0.435*X,0.300*Y,0.055*X,0.035*Y)
                     : ctx.drawImage(check,0.700*X,0.300*Y,0.055*X,0.035*Y);
        state.bHuman ? ctx.drawImage(check,0.435*X,0.356*Y,0.055*X,0.035*Y)
                     : ctx.drawImage(check,0.700*X,0.356*Y,0.055*X,0.035*Y);
        ctx.drawImage(check,X*(0.125+0.111*(state.difficulty-1)),0.504*Y,0.045*X,0.028*Y);
}


function draw() {

    // update canvas size

    X = milestoneContainer.clientWidth;
    Y = milestoneContainer.clientHeight;

    // draw menu
    if (state.isMenu) {
        drawMenu();
    }
    else {
        drawGame();

        if (!state.gameOver() && (   (state.turn == 0 && !state.bHuman) 
                                  || (state.turn == 1 && !state.wHuman))) {
            state.enact(engine_smart());
        }
    }
    window.requestAnimationFrame(draw);
}

// ----------------------------------------------------------------------------
//
// The engine section
//
// -----------------------------------------------------------------------------

let nextMove;

var scores = [[1000, 20, 10,  5,   0,   0,    0],
             [ 20,  25, 15, 15,  10,   0,    0],
             [ 10,  15, 45, 30,  20,  15,    0],
             [  5,  15, 30, 50,  20,  30,   30],
             [  0,  10, 20, 20,  100,  40,   40],
             [  0,   0, 15, 30,  40, 1000,   50],
             [  0,   0,  0, 30,  40,  50, 100000]]


function evaluation() {
    switch (state.winner()) {
        case -1: // black has won
            return 100000;
        case 1: // white has won
            return -100000;
        case 0:
            let blackScore = 0, whiteScore = 0;
            for (var [i,j] of state.blackPieces()) {
                blackScore += scores[i][j];
            }
            for (var [i,j] of state.whitePieces()) {
                whiteScore += scores[6-i][6-j];
            }
            return blackScore - whiteScore; // positive for black, negative for white
    }
}


function engine_dumb() {
    let moves = state.legalMoves();
    return moves[Math.floor(Math.random() * moves.length)];
}

function engine_negamax() {
    nextMove = null;
    let mvs = state.legalMoves();
    shuffle(mvs);
    negamax(mvs,state.difficulty,state.difficulty,((state.turn == 0) ? 1 : -1));
    return nextMove;
}


function engine_smart() {
    nextMove = null;
    let mvs = state.legalMoves();
    for (var mv of mvs) {
        if (mv.wins()) {
            nextMove =  mv;
            return nextMove;
        }
    }
    shuffle(mvs);
    alpha_beta(mvs,state.difficulty,state.difficulty,-1000000,1000000, (state.turn == 0) ? 1 : -1);
    return nextMove;
}


function negamax(mvs,depth,max_depth,turnMultiplier) {
    if (depth == 0) {
        return turnMultiplier*evaluation();
    }
    let maxScore = -1000000;
    for (var move of mvs) {
        state.enact(move);
        let nextMvs = state.legalMoves();
        let score = -1 * negamax(nextMvs,depth-1,max_depth,-1*turnMultiplier);
        if (score > maxScore) {
            maxScore = score;
            if (depth == max_depth) {
                nextMove = move;
            }
        }
        state.undo();
    }
    return maxScore;
}

function alpha_beta(mvs,depth,max_depth,alpha,beta,turnMultiplier) {
    if (depth == 0) {
        return turnMultiplier * evaluation();
    }
    let maxScore = -1000000;
    for (var move of mvs) {
        state.enact(move);
        let nextMvs = state.legalMoves();
        let score;
        if (nextMvs.length == 0) {
            score = turnMultiplier * 100000;
        }
        else {
            score = -1 * alpha_beta(nextMvs,depth-1,max_depth,-1*beta,-1*alpha,-1*turnMultiplier);
        }
        if (score > maxScore) {
            maxScore = score;
            if (depth == max_depth) {
                nextMove = move;
            }
        }
        state.undo();
        if (maxScore > alpha) {
            alpha = maxScore;
        }
        if (alpha >= beta) {
            break;
        }
    }
    return maxScore;
}



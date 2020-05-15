var socket;

let w;
let columns;
let rows;

//current state of board
let board;
//next state of the board
let next;
//current and next health
let currentHealth;
let canSpread = false;

let uniqueId = Math.random().toString(36).substring(2, 9);
console.log(uniqueId);

function setup() {
  createCanvas(500, 500);
  frameRate(5);
  w = 20;

  columns = floor(500 / w);
  rows = floor(500 / w);

  board = new Array(columns);
  next = new Array(columns);
  currentHealth = new Array(columns);
  for (let i = 0; i < columns; i++) {
    board[i] = new Array(rows);
    next[i] = new Array(rows);
    currentHealth[i] = new Array(rows);
  }

  init();

  socket = io.connect();
  socket.on('mouse', remoteDrawingEvent);
}

function draw() {
  generate();
  drawBoard(board, currentHealth);
  sendBoard();
}

function drawBoard(boardName, health){
  for ( let i = 0; i < columns;i++) {
    for ( let j = 0; j < rows;j++) {
      switch(boardName[i][j]){
        case 1:
          fill(28, 124, 84,10*health[i][j]);
          break;
        case 2:
          fill(193, 206, 95, 10*health[i][j]);
          break;
        case 3:
          fill(10, 33, 18);
          break;
        case 4:
          fill(100, 33, 18);
          break;
        default:
          fill(222, 244, 198);
          break;
      }
      stroke(27, 81, 45);
      rect((i * w), j * w, w-1, w-1);
    }
  }
}

function keyPressed(){
  if (keyCode === UP_ARROW) {
    init();
  }
}

// Fill board randomly
function init() {
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      currentHealth[i][j] = floor(random(5))+6;

      board[i][j] = 1;
      next[i][j] = 0;
    }
  }


  //overwrite for ports/airports
  let nPorts = floor(random(4)) + 1;
  for(let i = 0; i < nPorts; i++){
    let n = 1 + floor(random(columns-2));
    let m = 1 + floor(random(rows-2));
    while(board[n][m] != 3){
      if(board[n][m] != 3)
        board[n][m] = 3;
    }
  }
}

// The process of creating the new generation
function generate() {

  // Loop through every spot in our 2D array and check spots neighbors
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {

      //INFECTION LIFE RULES
      let infectedNeighbors = 0;
      let checkIsolated = true;
        for (let i = -1; i <2; i++) {
          for (let j = -1; j <2; j++) {

            var xx = x + i;
            var yy = y + j;

            if(xx < 0) xx = x;
            else if (xx > columns-1) xx = x;
            if(yy < 0) yy = y;
            else if (yy > rows-1) yy = y;

            if(board[x][y] > 0){
              var aux = board[xx][yy];
              if(aux == 2)
                infectedNeighbors += 1;
            }
            if(board[x][y] == 0){
              var aux = board[xx][yy];
              if(aux != 0){
                checkIsolated = false;
              }
            }
          }
        }

      // A little trick to subtract the current cell's state since
      // we added it in the above loop
      if(board[x][y] == 2)
        infectedNeighbors--;

      if(infectedNeighbors > 0 ){
        if(random(100) < 50)
          currentHealth[x][y] -= 1;
        else
          currentHealth[x][y] -= 2;
      }



      if(board[x][y] === 3 && infectedNeighbors > 2){
        canSpread = true;
        board[x][y] = 4;
      } else if(board[x][y] == 4 && infectedNeighbors < 2) {
        board[x][y] = 3;
      }

      // Rules of Life
      if ((board[x][y] == 1) && (infectedNeighbors < 2) && infectedNeighbors > 0){
        if(currentHealth[x][y] < 5)
          next[x][y] = 2;
        else {
          next[x][y] = 1;
          currentHealth[x][y]-= 1;
        }
      }
      else if ((board[x][y] == 1) && (infectedNeighbors >  3)){
        // Overpopulation
        if(currentHealth[x][y] < 5)
          next[x][y] = 2;
        else {
          next[x][y] = 1;
          currentHealth[x][y]-= 2;
        }
      }
      else if((board[x][y] == 1) && (infectedNeighbors == 3)){
        if(random(100) < 50){
          currentHealth[x][y] -= 3;
        } else {
          currentHealth[x][y] += 3;
        }
        if(currentHealth[x][y] < 5)
          next[x][y] = 2;
        else {
          next[x][y] = 1;
        }
      }
      else if ((board[x][y] == 2) && infectedNeighbors < 2 && infectedNeighbors > 0) { //if already infected give chance to recover
        if(currentHealth[x][y] < 1){
          if(random(100) < 30)
            next[x][y] = 1;
          else
            next[x][y] = 0;
          currentHealth[x][y] = 10;
        } else if(currentHealth[x][y] >= 5)
          next[x][y] = 1;
        else{
          next[x][y] = board[x][y]; //stasis
          currentHealth[x][y] -= 2;
        }
      }
      else if ((board[x][y] == 2) && infectedNeighbors > 3) {
        if(currentHealth[x][y] < 1){
          if(random(100) < 30)
            next[x][y] = 1;
          else
            next[x][y] = 0;
          currentHealth[x][y] = 10;
        } else {
          next[x][y] = board[x][y]; //stasis
          if(random(100) < 30)
            currentHealth[x][y] -= 2;
        }
      }
      else if ((board[x][y] == 2) && (infectedNeighbors == 3)){ //reproduction
        if(currentHealth[x][y] < 0){
          if(random(100) < 30)
            next[x][y] = 1;
          else
            next[x][y] = 0;
          currentHealth[x][y] = 10;
        }
        next[x][y] = 2;
        currentHealth[x][y] -= 1;
      }
     else if(board[x][y] == 0 && checkIsolated){
          next[x][y] = 1;
    }
      else
        next[x][y] = board[x][y];
    }
  }

  // Swap!
  let temp = board;
  board = next;
  next = temp;
}


// these are remote events
function remoteDrawingEvent(incomingData){
  if(incomingData.hasVirus == true){
    if(incomingData.id == uniqueId){
      var coordX;
      var coordY;
      for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
          if(board[x][y] >= 3)
            coordX = x;
            coordY = y;
        }
      }
      for (let i = -1; i <2; i++) {
        for (let j = -1; j <2; j++){
          var xx = coordX + i;
          var yy = coordY + j;

          if(xx < 0) xx = coordX;
          else if (xx > columns-1) xx = coordX;
          if(yy < 0) yy = coordY;
          else if (yy > rows-1) yy =coordY;

        if(xx != coordX && yy != coordY){
          if(incomingData.hasVirus){
            board[xx][yy] = 2;
            currentHealth[xx][yy] = 4.5;
          } else {
            board[xx][yy] = 1;
            currentHealth[xx][yy] = floor(random(7, 10));
            }
          }
        }
      }
      board[coordX][coordY] = 3;
    }
  }
}

function sendBoard() {
  // construct data package to send to server
  //for now, just if an infection is sent
  if(random(100) >80) canSpread = false;
  var data = {
    boardData: board,
    healthData: currentHealth,
    id:uniqueId,
    infection: canSpread
  };

  // send the message to the server
  socket.emit('mouse', data);
  canSpread = false;
}

function mouseClicked(){
  var flag = false;
  while(!flag){
    var i = floor(random(columns));
    var j = floor(random(rows));

    if(board[i][j] == 1){
      flag = true;
      for(var n = -1; n < 2; n++){
        if(random(100) < 50){
          board[i+n][j] = 2;
          currentHealth[i+n][j] = 4.5;
        } else {
          currentHealth[i][j+n] = 4.5;
          board[i][j+n] = 2
        }
      }
    }
  }
}

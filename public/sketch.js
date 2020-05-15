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
let infected;

function setup() {
  createCanvas(500, 500);
  frameRate(5);
  w = 20;

  columns = floor(width / w);
  rows = floor(height / w);

  board = new Array(columns);
  next = new Array(columns);
  currentHealth = new Array(columns);
  infected = new Array(columns);
  for (let i = 0; i < columns; i++) {
    board[i] = new Array(rows);
    next[i] = new Array(rows);
    currentHealth[i] = new Array(rows);
    infected[i] = new Array(rows);
  }

  init();

  socket = io.connect();
  socket.on('mouse', remoteDrawingEvent);
}

function draw() {
  background(0);
  generate();
  for ( let i = 0; i < columns;i++) {
    for ( let j = 0; j < rows;j++) {
      switch(board[i][j]){
        case 1:
          if(currentHealth[i][j] >= 5)
            fill(28, 124, 84);
          else
            fill(193, 206, 95);
          break;
        case 3:
          fill(10, 33, 18);
          break;
        default:
          fill(222, 244, 198);
          break;
      }
      stroke(27, 81, 45);
      rect(i * w, j * w, w-1, w-1);
    }
  }
  updateClientView();
}

// reset board when mouse is pressed
function mousePressed() {
  init();
}

// Fill board randomly
function init() {
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      currentHealth[i][j] = 0;
      // Lining the edges with 0s
      if (i == 0 || j == 0 || i == columns-1 || j == rows-1){
        board[i][j] = 0;
      } else {
        let type = floor(random(2));
        board[i][j] = type;
        currentHealth[i][j] = floor(random(5))+6;
      }
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
  for (let x = 1; x < columns - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      // Add up all the states in a 3x3 surrounding grid
      let neighbors = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if(board[x][y] < 3)
            neighbors += board[x+i][y+j];
          else if(board[x][y] == 3){
            socket.emit()
          }
        }
      }

      // A little trick to subtract the current cell's state since
      // we added it in the above loop
      if(board[x][y] < 3)
        neighbors -= board[x][y];

      // Rules of Life
      if ((board[x][y] == 1) && (neighbors <  2))
        next[x][y] = 0;           // Loneliness
      else if ((board[x][y] == 1) && (neighbors >  3))
        next[x][y] = 0;           // Overpopulation
      else if ((board[x][y] == 0) && (neighbors == 3))
        next[x][y] = 1;           // Reproduction
      else
        next[x][y] = board[x][y]; // Stasis
    }
  }

  // Swap!
  let temp = board;
  board = next;
  next = temp;
}

// these are remote events
function remoteDrawingEvent(incomingData){
  noStroke();
  fill(255,0,100);
  console.log('ping');
}

function updateClientView(){

    //console.log('sending ' + mouseX + "," + mouseY); // web debug not the best meothdo but it works for me

    // construct data package to send to server
    //for now, just if an infection is sent
    var data = {
      board: board,
      health: currentHealth
    };

    // send the message to the server
    socket.emit('mouse', data);

    // draw your action locally
    noStroke();
    fill(255);
    ellipse(mouseX,mouseY,40,40);
}

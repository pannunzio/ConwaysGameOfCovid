var socket;
var MAXBOARDS = 9;
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
let clientBoards;

let clientIds = new Array(MAXBOARDS);
for(let i = 0; i < MAXBOARDS; i++){
  clientIds[i] = '';
}
let numberClients = 0;

function setup() {
  createCanvas(780, 780);
  w = 10;

  clientBoards = new Array(MAXBOARDS);
  clientHealth = new Array(MAXBOARDS);
  clientInfected = new Array(MAXBOARDS);

  columns = floor(250 / w);
  rows = floor(250 / w);

  for(let i = 0; i < MAXBOARDS; i++){
    clientBoards[i] = new Array(columns);
    clientHealth[i] = new Array(columns);
    clientInfected[i] = new Array(columns);
    for(let j = 0; j < columns; j++){
      clientBoards[i][j] = new Array(rows);
      clientHealth[i][j] = new Array(rows);
      clientInfected[i][j] = new Array(rows);
    }
  }


  socket = io.connect();
  socket.on('mouse', remoteDrawingEvent);
}

function draw() {
  for(let i = 0; i < MAXBOARDS; i++){
    if(clientIds[i] != '')
      drawBoard(i);
  }
}

function drawBoard(index){
  let offsetX = (floor(index%3) * 250) + (floor(index%3)*10) + 10;
  let offsetY = (floor(index/3) * 250) + (floor(index/3)*10) + 10;

  for ( let i = 0; i < columns;i++) {
    for ( let j = 0; j < rows;j++) {
      switch(clientBoards[index][i][j]){
        case 1:
          fill(28, 124, 84, 10*clientHealth[index][i][j]);
          break;
        case 2:
            fill(193, 206, 95, 10*clientHealth[index][i][j]);
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
      rect((i * w)+offsetX, (j * w) + offsetY, w-1, w-1);
    }
  }
  fill(0);
  noStroke();
  text(clientIds[index], offsetX, offsetY - 10, 20, 250);
}

function clientExists(id){
  for(let i = 0; i < MAXBOARDS; i++){
    if(clientIds[i] === id){
      return true;
    }
  }
  return false;
}

function getClientId(id){
  for(let i = 0; i < MAXBOARDS; i++){
    if(clientIds[i] === id){
      return i;
    }
  }
  return -1;
}

function updateClients(id){
  var index;
  numberClients = 0;
  if(numberClients == MAXBOARDS){
      index = floor(random(MAXBOARDS));
      clientIds[index] = id;
  } else {
    for(let i = 0; i < MAXBOARDS; i++){
      if (clientIds[i] === ''){
        clientIds[i] = id;
        numberClients++;
        return i;
      }
    }
  }
  return index;
}


// these are remote events
function remoteDrawingEvent(incomingData){
  var index;
  if(clientExists(incomingData.id)){
    index = getClientId(incomingData.id);
  } else {
    index = updateClients(incomingData.id);
  }
  for(let i = 0; i < columns; i++){
    for(let j = 0; j < rows; j++){
      clientBoards[index][i][j] = incomingData.boardData[i][j];
      clientHealth[index][i][j] = incomingData.healthData[i][j];
    }
  }
  if(incomingData.infection == true){
    var nextScreen = chooseRandomId(incomingData.id);
    sendBoard(nextScreen, true);
  }
}

function chooseRandomId(currentId){
  var string = '';
  while(string == ''){
    for(var i = 0; i < MAXBOARDS; i++){
      string = clientIds[i];
      if(string != currentId && string != '')
        if(random(100) < 30){
          return string;
        } else {
          string = '';
        }
      }
    }
   return string;
}

function sendBoard(screenId, isInfected) {
  // construct data package to send to server
  //for now, just if an infection is sent

  var data = {
    hasVirus: isInfected,
    id: screenId
  };

  // send the message to the server
  socket.emit('mouse', data);
}

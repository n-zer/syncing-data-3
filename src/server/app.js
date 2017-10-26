const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../../hosted/client.html`);
const js = fs.readFileSync(`${__dirname}/../../hosted/bundle.js`);

const onRequest = (request, response) => {
  console.log(request.url);
  if (request.url === '/hosted/bundle.js') {
    response.writeHead(200, { 'content-type': 'text/javascript' });
    response.end(js);
  } else {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(index);
  }
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on port ${port}`);

const players = {};
const playerJumpReady = {};
const io = socketio(app);

const JUMP_VELOCITY = 400;
const GRAVITY_FORCE = -400;
const MOVE_SPEED = 400;

const getRandomInt = (min, max) => (Math.random() * (max - min)) + min;
const getRandomBrightColor = () => `hsl(${getRandomInt(0, 359)}, 100%, 50%)`;

io.on('connection', (socket) => {
  const initialData = {
    x: getRandomInt(100, 500),
    y: getRandomInt(700, 800),
    velY: 0,
    velX: 0,
    color: getRandomBrightColor(),
    id: socket.id,
  };
  players[socket.id] = initialData;

  socket.on('jump', () => {
    if (playerJumpReady[socket.id]) {
      players[socket.id].velY = JUMP_VELOCITY;
      playerJumpReady[socket.id] = false;
    }
  });

  socket.on('move', (direction) => {
    players[socket.id].velX = MOVE_SPEED * direction;
  })

  socket.on('disconnect', () => {
    socket.broadcast.emit('terminate', { id: socket.id });
    delete players[socket.id];
  });
});

let accumulator = 0;
let lastTickTime;
const TICK_INTERVAL_MS = 50;

const simulationLoop = (playerList) => {
  const currentTime = Date.now();
  const sinceLast = currentTime - lastTickTime;
  accumulator += sinceLast;
  lastTickTime = currentTime;

  const playerIds = Object.keys(playerList);

  while (accumulator >= TICK_INTERVAL_MS) {
    accumulator -= TICK_INTERVAL_MS;
    const dT = TICK_INTERVAL_MS / 1000;
    for (let n = 0; n < playerIds.length; n++) {
      const player = playerList[playerIds[n]];
      player.velY += GRAVITY_FORCE * dT;
      player.y += player.velY * dT;
      player.x += player.velX * dT;

      if (player.y <= 0) {
        player.velY = 0;
        player.y = 0;
        playerJumpReady[player.id] = true;
      }
    }
  }

  for (let n = 0; n < playerIds.length; n++) {
    const player = playerList[playerIds[n]];
    io.sockets.emit('info', player);
  }
};

lastTickTime = Date.now();
setInterval(simulationLoop.bind(null, players), TICK_INTERVAL_MS);

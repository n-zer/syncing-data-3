let socket;
let canvas;
let context;

const clamp = (val, min, max) => {
  return Math.min(Math.max(val, min), max);
};

const lerp = (from, to, percent) => {
  return (from * (1.0 - percent)) + (to * percent);
};

const players = {};

class PlayerInfoLog {
	insert(info) {
		info.time = Date.now();
		this.old = this.new;
		this.new = info;
	}

	lerpToCurrent() {
		if(!this.old || !this.new)
			return undefined;
		const now_ms = Date.now();
		const diff_ms = this.new.time - this.old.time;
		const lerpFactor = clamp(((now_ms - diff_ms - this.old.time) / diff_ms), 0, 1);

		return {
			x: lerp(this.old.x, this.new.x, lerpFactor),
			y: lerp(this.old.y, this.new.y, lerpFactor),
			color: this.new.color
		};
	}
}

const AVATAR = {
	WIDTH: 30,
	HEIGHT: 30
};

const frame = () => {
	context.fillStyle = 'white';
	context.fillRect(0, 0, canvas.width, canvas.height);
	for(const id in players) {
		const log = players[id];
		const info = log.lerpToCurrent();
		if(info) {
			context.fillStyle = info.color;
			context.fillRect(info.x - AVATAR.WIDTH/2, canvas.height - (info.y + AVATAR.HEIGHT), AVATAR.WIDTH, AVATAR.HEIGHT);
		}
	}
	requestAnimationFrame(frame);
}

const init = () => {
  socket = io.connect();

  canvas = document.querySelector('#mainCanvas');
  context = canvas.getContext('2d');

  socket.on('info', (data) => {
  	if(!players[data.id])
  		players[data.id] = new PlayerInfoLog();
  	players[data.id].insert(data);
  });

  socket.on('terminate', (data) => {
  	delete players[data.id];
  });

  requestAnimationFrame(frame);
};

window.addEventListener('keydown', (e) => {
	if(!e.repeat) {
		if(e.key === 'ArrowLeft')
			socket.emit('move', -1);
		else if(e.key === 'ArrowRight')
			socket.emit('move', 1);
		else if(e.key === ' ')
			socket.emit('jump');
	}
});

window.addEventListener('keyup', (e) => {
	if(e.key === 'ArrowLeft' || e.key === 'ArrowRight')
		socket.emit('move', 0);
});

window.onload = init;

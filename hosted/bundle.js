'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var socket = void 0;
var canvas = void 0;
var context = void 0;

var clamp = function clamp(val, min, max) {
	return Math.min(Math.max(val, min), max);
};

var lerp = function lerp(from, to, percent) {
	return from * (1.0 - percent) + to * percent;
};

var players = {};

var PlayerInfoLog = function () {
	function PlayerInfoLog() {
		_classCallCheck(this, PlayerInfoLog);
	}

	_createClass(PlayerInfoLog, [{
		key: 'insert',
		value: function insert(info) {
			info.time = Date.now();
			this.old = this.new;
			this.new = info;
		}
	}, {
		key: 'lerpToCurrent',
		value: function lerpToCurrent() {
			if (!this.old || !this.new) return undefined;
			var now_ms = Date.now();
			var diff_ms = this.new.time - this.old.time;
			var lerpFactor = clamp((now_ms - diff_ms - this.old.time) / diff_ms, 0, 1);

			return {
				x: lerp(this.old.x, this.new.x, lerpFactor),
				y: lerp(this.old.y, this.new.y, lerpFactor),
				color: this.new.color
			};
		}
	}]);

	return PlayerInfoLog;
}();

var AVATAR = {
	WIDTH: 30,
	HEIGHT: 30
};

var frame = function frame() {
	context.fillStyle = 'white';
	context.fillRect(0, 0, canvas.width, canvas.height);
	for (var id in players) {
		var log = players[id];
		var info = log.lerpToCurrent();
		if (info) {
			context.fillStyle = info.color;
			context.fillRect(info.x - AVATAR.WIDTH / 2, canvas.height - (info.y + AVATAR.HEIGHT), AVATAR.WIDTH, AVATAR.HEIGHT);
		}
	}
	requestAnimationFrame(frame);
};

var init = function init() {
	socket = io.connect();

	canvas = document.querySelector('#mainCanvas');
	context = canvas.getContext('2d');

	socket.on('info', function (data) {
		if (!players[data.id]) players[data.id] = new PlayerInfoLog();
		players[data.id].insert(data);
	});

	socket.on('terminate', function (data) {
		delete players[data.id];
	});

	requestAnimationFrame(frame);
};

window.addEventListener('keydown', function (e) {
	if (!e.repeat) socket.emit('jump');
});

window.onload = init;

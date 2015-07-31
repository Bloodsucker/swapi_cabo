(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var tools = require('./tools');

module.exports = new Cache();
function Cache () {
	var self = this;

	self.interactions =  [];
	self.onPushFn = [];

	initializeCache(this);
};

/**
 * Saves an Interaction in the cache
 * @param  {Interaction} interaction Personalized Interaction object to store.
 * @param  {[boolean]} forcedSend  As true, it will try to send the interaction inmediatelly.
 */
Cache.prototype.push = function (interaction, forcedSend) {
	var self = this;

	self.interactions.push(interaction);

	tools.setJSONCookie('usaginity_cache', self.interactions);

	console.log("New Interaction (" + self.interactions.length + " queued):");
	// console.table([interaction]);

	self.onPushFn.forEach(function (fn) {
		setTimeout(function () {
			fn(forcedSend);
		});
	});
};

/**
 * Retrieves a maximum number of cached Interactions.
 * @param  {int} max 
 * @return {Interaction[]}
 */
Cache.prototype.unqueue = function (max) {
	var self = this;

	var interactions = self.interactions.splice(0, max);

	tools.setJSONCookie('usaginity_cache', self.interactions);

	return interactions;
};

/**
 * Enqueue at the beginning of the cache Interactions.
 * @param  {Interaction[]} oldInteractions
 */
Cache.prototype.requeue = function (oldInteractions) {
	var self = this;

	Array.prototype.unshift.apply(self.interactions, oldInteractions);

	tools.setJSONCookie('usaginity_cache', self.interactions);
};

/**
 * Listen for new pushed Interaction
 * @param  {Function} fn Callback to be executed when a new Interaction has been pushed.
 */
Cache.prototype.listen = function (fn) {
	this.onPushFn.push(fn);
};

/**
 * Loads to the cache a possible old local cache.
 * @param  {Cache} cache
 */
function initializeCache (cache) {
	var oldCache = tools.getJSONCookie('usaginity_cache');
	if(!oldCache || oldCache.length === 0) return;

	for (var i = 0; i < oldCache.length; i++) {
		cache.interactions.push(oldCache[i]);
	}
};
},{"./tools":5}],2:[function(require,module,exports){
module.exports = Interaction;
function Interaction (type) {
	this.type = type;
	this.date = new Date().getTime();
};

},{}],3:[function(require,module,exports){
var tools = require('./tools');

var defConfig = {
	windowSize: Infinity,
	instantly: true,
	buffer: 3,
	bfTimeout: 3000
};

module.exports = Persistence;
/**
 * Persitance layer of Usaginity.
 * @param {Cache} cache     	Cache to listen. When there are new Interactions, this layer will know.
 * @param {[type]} optConfig
 */
function Persistence (cache, optConfig) {
	var self = this;

	self.config = tools.extend(defConfig, optConfig);

	self.cache = cache;

	self._bufferTimeoutId = null;
	// When there is a new Interaction in the cache layer, this layer will know by this callback.
	self.cache.listen(function (forcedSend) {
		clearTimeout(self._bufferTimeoutId);
		self._bufferTimeoutId = null;

		if (self.cache.interactions.length === 0) return;

		//Check how to proceed depending of how was configured
		//Send it instantly
		if (self.config.instantly || forcedSend) {
			self.flush();

		//Send if the buffer is full
		} else if (self.config.buffer < self.cache.interactions.length) {
			self.flush();
		
		//Send buffered Interactions in the future.
		} else {
			self._bufferTimeoutId = setTimeout(function () {
				self.flush();
			}, self.config.bfTimeout);
		}
	});
};

/**
 * Flush the interactions.
 */
Persistence.prototype.flush = function () {
	var self = this;

	if (!tools.isNetworkAvailable()) {
		console.log("Network is not available.");

		//TODO Retry by event reconnect or timeout.
		self._bufferTimeoutId = setTimeout(function () {
			self.flush();
		}, 3000);

		return;
	};

	while(self.cache.interactions.length > 0) {
		//Get "windowSize" Interactions to send.
		var toSend = self.cache.unqueue(self.config.windowSize);

		//Send them. If there was an error during sending, onError will requeue them.
		asyncSend(toSend, function onError() {
			self.cache.requeue(toSend);
		});
	}
};

function asyncSend (o, onError) {
	// doAsyncAjax(o, onError);
	doFakeSending(o, onError);
}

// function doAsyncAjax(o, onError) {
// 	// Ajax call.
// };

function doFakeSending(o, onError) {
	console.log("Interactions SENT:");
	console.table ? console.table(o) : console.log(o);

	var fakeSent = tools.getJSONCookie('fakeSent') || [];
	fakeSent = fakeSent.concat(o);
	tools.setJSONCookie('fakeSent', fakeSent);
};

},{"./tools":5}],4:[function(require,module,exports){
(function (global){
var cache = require('./Cache'),
	Interaction = require('./Interaction'),
	Persistence = require('./Persistence'),
	tools = require('./tools');

var defConfig = {
	persistence: {
		instantly: false,
		buffer: 3,
		bfTimeout: 3000
	}
};

var usaginity = null;
/**
 * Singleton for Usaginity.
 * It does not matter if it is executed as new Usaginity(); or just Usaginity();
 * @global
 * @param  {[type]} optConfig
 * @return {Usaginity}        Singleton for Usaginity.
 */
global.Usaginity = module.exports = function singleton(optConfig) {
	if (!usaginity) usaginity = new Usaginity(optConfig);
	return usaginity;
};

/**
 * It defines the API to interact with Usaginity.
 * @param {[object]} optConfig Optional configuration.
 */
function Usaginity (optConfig) {
	var self = this;

	//Identifies the browser.
	basicIdentity();

	if (!optConfig) optConfig = {persistence:{}};

	tools.extend(true, optConfig.persistence, defConfig.persistence);

	//Creates the persistence layer.
	var persitance = new Persistence(cache, optConfig.persistence);

	self.queue = new tools.InmediateAsyncTaskQueue();

	self.timers = {};
};

/**
 * Defines when to start tracking. It will detect automatically when to stop tracking.
 * @async
 */
Usaginity.prototype.entering = function() {
	var self = this;

	//Every action, will
	self.queue.enqueue(function () {
		createInteraction("entering");

		window.addEventListener('beforeunload', function () {
			self.queue.forceSync = true;

			self.end();
			createInteraction("leaving", null, true);
		});
	});
};

/**
 * Creates an Interaction event.
 * @async
 * @param  {string} eventType The event type. E.g. 'click'.
 * @param  {string} nameId    The id for the event.
 * @param  {string} label     A label to specify between different same events.
 */
Usaginity.prototype.event = function (eventType, nameId, label) {
	var self = this;

	self.queue.enqueue(function () {
		createInteraction('event', {
			eventType: eventType,
			nameId: nameId,
			label: label
		});
	});
};

/**
 * Defines a transition between two URL. It is useful when in sigle-page application.
 * @async
 */
Usaginity.prototype.transition = function () {
	var self = this;

	self.queue.enqueue(function () {
		var tstart = simpleTracking.tstart;
		var tend = new Date();
		var tdiff = tend.getTime() - tstart.getTime();

		simpleTracking.referrer = simpleTracking.current;
		simpleTracking.current = document.URL;
		simpleTracking.tstart = new Date();

		createInteraction('transition', {
			tend: tend.getTime(),
			tdiff: tdiff
		});
	});
};

/**
 * Defines an internal timer.
 * @async
 * @param  {string} timerId The timer ID.
 */
Usaginity.prototype.startTimer = function (timerId) {
	var self = this;

	self.queue.enqueue(function () {
		self.timers[timerId] = new Date();
	});
};

/**
 * Defines when to stop a previously executed timer.
 * @async
 * @param  {string} timerId The timer ID.
 */
Usaginity.prototype.endTimer = function (timerId) {
	var self = this;

	self.queue.enqueue(function () {
		var tstart = self.timers[timerId];
		if (!tstart) return;

		var tend = new Date();
		var tdiff = tend.getTime() - tstart.getTime();

		createInteraction('timer', {	
			timerName: timerId,
			tend: tend.getTime(),
			tdiff: tdiff
		});

		self.timers[timerId] = null;
	});
};

/**
 * Automatically closes all opened timers.
 * @async It executes several async operations.
 */
Usaginity.prototype.end = function () {
	var self = this;

	var prop;
	for (prop in self.timers) {
		if (self.timers[prop]) {
			self.endTimer(prop);
		}
	}
};

/**
 * Helps to track main browser data.
 * In single pages it tracks from what sections user comes.
 */
var simpleTracking = {
	referrer: document.referrer,
	current: document.URL,
	tstart: new Date()
};

function basicIdentity() {
	var id = tools.getJSONCookie('ugId');
	if (!id) {
		id = tools.randomStr(32);
	}

	simpleTracking.trackId = id;

	tools.setJSONCookie("ugId", id);
};

/**
 * When a code action is executed, it might create an Interaction filling it with some data.
 * @param  {string} interactionName    		Interaction type name
 * @param  {[object]} interactionOptions 	An object to extend and personalize the Interaction
 * @param  {[boolean]} forcedSend         	If the browser is going to be closed inmediatelly, forceSend will be marked as true to try to send the Interaction. 
 */
function createInteraction(interactionName, interactionOptions, forcedSend) {
	var newInteraction = new Interaction(interactionName);

	var tracking = {
		referrer: simpleTracking.referrer,
		url: simpleTracking.current,
		title: document.title,
		trackId: simpleTracking.trackId
	};

	tools.forcedExtend(newInteraction, tracking, interactionOptions);

	//Send the new Interaction to the cache.
	cache.push(newInteraction, forcedSend);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./Cache":1,"./Interaction":2,"./Persistence":3,"./tools":5}],5:[function(require,module,exports){
/**
 * jQuery extend like helper.
 * @param  {[type]} extendFirstObject [description]
 * @return {[type]}                   [description]
 */
exports.extend = function (extendFirstObject) {
	var extended, from = 0;

	if (typeof extendFirstObject === "boolean") {
		if (extendFirstObject) {
			extended = arguments[1];
			from = 2;
		} else {
			from = 1;
		}
	}

	extended = extended || {};

	for (var i = from; i < arguments.length; ++i) {
		var prop, o = arguments[i];

		for (prop in o) {
			if (Object.prototype.hasOwnProperty.call(o, prop)) {
				extended[prop] = o[prop];
			}
		}
	}

	return extended;
};

/**
 * Copies properties to the first passed argument.
 * @param  {object...} extended The first will be the destination object.
 */
exports.forcedExtend = function (extended) {
	for (var i = 1; i < arguments.length; ++i) {
		var prop, o = arguments[i];

		for (prop in o) {
			extended[prop] = o[prop];
		}
	}

	return extended;
};

exports.setJSONCookie = function (name, o) {
	if (!o) {
		localStorage.removeItem(name);
		return;
	}

	localStorage.setItem(name, JSON.stringify(o));
};

exports.getJSONCookie = function (name) {
	var json = localStorage.getItem(name);
	if (!json) return null;
	return JSON.parse(json);
};

exports.isNetworkAvailable = function () {
	if (Math.random() < 0.3) return false;
	else return true;
}

//http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript/18120932#18120932
exports.randomStr = function (stringLength) {
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	var randomString = Array.apply(null, new Array(stringLength)).map(function () {
	    return possible[Math.floor(Math.random() * possible.length)];
	}).join('');

	return randomString;
}

exports.InmediateAsyncTaskQueue = require('./tools/InmediateAsyncTaskQueue');
},{"./tools/InmediateAsyncTaskQueue":6}],6:[function(require,module,exports){
module.exports = InmediateAsyncTaskQueue;
function InmediateAsyncTaskQueue () {
	var self = this;

	self.forceSync = false;

	self._tasks = [];
};

/**
 * Enqueue a task to be executed asynchronously. All the queued task, will be executed async but in their same thread.
 * @param  {[Function]} task
 */
InmediateAsyncTaskQueue.prototype.enqueue = function (task) {
	var self = this;

	self._tasks.push(task);

	//Detects when there is already a planned execution.
	if (!self._executing) {
		self._executing = true;


		var execAllQueuedTasks = function () {
			var task;

			//All the queued task, will be executed async but in their same thread.
			while (task = self._tasks.shift()) {
				task();
			}

			self._executing = false;
		}

		//Async execution!
		if (!self.forceSync) setTimeout(execAllQueuedTasks);
		else execAllQueuedTasks();
	}
};
},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQ2FjaGUuanMiLCJzcmMvSW50ZXJhY3Rpb24uanMiLCJzcmMvUGVyc2lzdGVuY2UuanMiLCJzcmMvbWFpbi5qcyIsInNyYy90b29scy5qcyIsInNyYy90b29scy9Jbm1lZGlhdGVBc3luY1Rhc2tRdWV1ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB0b29scyA9IHJlcXVpcmUoJy4vdG9vbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgQ2FjaGUoKTtcbmZ1bmN0aW9uIENhY2hlICgpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYuaW50ZXJhY3Rpb25zID0gIFtdO1xuXHRzZWxmLm9uUHVzaEZuID0gW107XG5cblx0aW5pdGlhbGl6ZUNhY2hlKHRoaXMpO1xufTtcblxuLyoqXG4gKiBTYXZlcyBhbiBJbnRlcmFjdGlvbiBpbiB0aGUgY2FjaGVcbiAqIEBwYXJhbSAge0ludGVyYWN0aW9ufSBpbnRlcmFjdGlvbiBQZXJzb25hbGl6ZWQgSW50ZXJhY3Rpb24gb2JqZWN0IHRvIHN0b3JlLlxuICogQHBhcmFtICB7W2Jvb2xlYW5dfSBmb3JjZWRTZW5kICBBcyB0cnVlLCBpdCB3aWxsIHRyeSB0byBzZW5kIHRoZSBpbnRlcmFjdGlvbiBpbm1lZGlhdGVsbHkuXG4gKi9cbkNhY2hlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGludGVyYWN0aW9uLCBmb3JjZWRTZW5kKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmludGVyYWN0aW9ucy5wdXNoKGludGVyYWN0aW9uKTtcblxuXHR0b29scy5zZXRKU09OQ29va2llKCd1c2FnaW5pdHlfY2FjaGUnLCBzZWxmLmludGVyYWN0aW9ucyk7XG5cblx0Y29uc29sZS5sb2coXCJOZXcgSW50ZXJhY3Rpb24gKFwiICsgc2VsZi5pbnRlcmFjdGlvbnMubGVuZ3RoICsgXCIgcXVldWVkKTpcIik7XG5cdC8vIGNvbnNvbGUudGFibGUoW2ludGVyYWN0aW9uXSk7XG5cblx0c2VsZi5vblB1c2hGbi5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0Zm4oZm9yY2VkU2VuZCk7XG5cdFx0fSk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBtYXhpbXVtIG51bWJlciBvZiBjYWNoZWQgSW50ZXJhY3Rpb25zLlxuICogQHBhcmFtICB7aW50fSBtYXggXG4gKiBAcmV0dXJuIHtJbnRlcmFjdGlvbltdfVxuICovXG5DYWNoZS5wcm90b3R5cGUudW5xdWV1ZSA9IGZ1bmN0aW9uIChtYXgpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHZhciBpbnRlcmFjdGlvbnMgPSBzZWxmLmludGVyYWN0aW9ucy5zcGxpY2UoMCwgbWF4KTtcblxuXHR0b29scy5zZXRKU09OQ29va2llKCd1c2FnaW5pdHlfY2FjaGUnLCBzZWxmLmludGVyYWN0aW9ucyk7XG5cblx0cmV0dXJuIGludGVyYWN0aW9ucztcbn07XG5cbi8qKlxuICogRW5xdWV1ZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjYWNoZSBJbnRlcmFjdGlvbnMuXG4gKiBAcGFyYW0gIHtJbnRlcmFjdGlvbltdfSBvbGRJbnRlcmFjdGlvbnNcbiAqL1xuQ2FjaGUucHJvdG90eXBlLnJlcXVldWUgPSBmdW5jdGlvbiAob2xkSW50ZXJhY3Rpb25zKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRBcnJheS5wcm90b3R5cGUudW5zaGlmdC5hcHBseShzZWxmLmludGVyYWN0aW9ucywgb2xkSW50ZXJhY3Rpb25zKTtcblxuXHR0b29scy5zZXRKU09OQ29va2llKCd1c2FnaW5pdHlfY2FjaGUnLCBzZWxmLmludGVyYWN0aW9ucyk7XG59O1xuXG4vKipcbiAqIExpc3RlbiBmb3IgbmV3IHB1c2hlZCBJbnRlcmFjdGlvblxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuIENhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIHdoZW4gYSBuZXcgSW50ZXJhY3Rpb24gaGFzIGJlZW4gcHVzaGVkLlxuICovXG5DYWNoZS5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24gKGZuKSB7XG5cdHRoaXMub25QdXNoRm4ucHVzaChmbik7XG59O1xuXG4vKipcbiAqIExvYWRzIHRvIHRoZSBjYWNoZSBhIHBvc3NpYmxlIG9sZCBsb2NhbCBjYWNoZS5cbiAqIEBwYXJhbSAge0NhY2hlfSBjYWNoZVxuICovXG5mdW5jdGlvbiBpbml0aWFsaXplQ2FjaGUgKGNhY2hlKSB7XG5cdHZhciBvbGRDYWNoZSA9IHRvb2xzLmdldEpTT05Db29raWUoJ3VzYWdpbml0eV9jYWNoZScpO1xuXHRpZighb2xkQ2FjaGUgfHwgb2xkQ2FjaGUubGVuZ3RoID09PSAwKSByZXR1cm47XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvbGRDYWNoZS5sZW5ndGg7IGkrKykge1xuXHRcdGNhY2hlLmludGVyYWN0aW9ucy5wdXNoKG9sZENhY2hlW2ldKTtcblx0fVxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IEludGVyYWN0aW9uO1xuZnVuY3Rpb24gSW50ZXJhY3Rpb24gKHR5cGUpIHtcblx0dGhpcy50eXBlID0gdHlwZTtcblx0dGhpcy5kYXRlID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuIiwidmFyIHRvb2xzID0gcmVxdWlyZSgnLi90b29scycpO1xuXG52YXIgZGVmQ29uZmlnID0ge1xuXHR3aW5kb3dTaXplOiBJbmZpbml0eSxcblx0aW5zdGFudGx5OiB0cnVlLFxuXHRidWZmZXI6IDMsXG5cdGJmVGltZW91dDogMzAwMFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQZXJzaXN0ZW5jZTtcbi8qKlxuICogUGVyc2l0YW5jZSBsYXllciBvZiBVc2FnaW5pdHkuXG4gKiBAcGFyYW0ge0NhY2hlfSBjYWNoZSAgICAgXHRDYWNoZSB0byBsaXN0ZW4uIFdoZW4gdGhlcmUgYXJlIG5ldyBJbnRlcmFjdGlvbnMsIHRoaXMgbGF5ZXIgd2lsbCBrbm93LlxuICogQHBhcmFtIHtbdHlwZV19IG9wdENvbmZpZ1xuICovXG5mdW5jdGlvbiBQZXJzaXN0ZW5jZSAoY2FjaGUsIG9wdENvbmZpZykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5jb25maWcgPSB0b29scy5leHRlbmQoZGVmQ29uZmlnLCBvcHRDb25maWcpO1xuXG5cdHNlbGYuY2FjaGUgPSBjYWNoZTtcblxuXHRzZWxmLl9idWZmZXJUaW1lb3V0SWQgPSBudWxsO1xuXHQvLyBXaGVuIHRoZXJlIGlzIGEgbmV3IEludGVyYWN0aW9uIGluIHRoZSBjYWNoZSBsYXllciwgdGhpcyBsYXllciB3aWxsIGtub3cgYnkgdGhpcyBjYWxsYmFjay5cblx0c2VsZi5jYWNoZS5saXN0ZW4oZnVuY3Rpb24gKGZvcmNlZFNlbmQpIHtcblx0XHRjbGVhclRpbWVvdXQoc2VsZi5fYnVmZmVyVGltZW91dElkKTtcblx0XHRzZWxmLl9idWZmZXJUaW1lb3V0SWQgPSBudWxsO1xuXG5cdFx0aWYgKHNlbGYuY2FjaGUuaW50ZXJhY3Rpb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG5cdFx0Ly9DaGVjayBob3cgdG8gcHJvY2VlZCBkZXBlbmRpbmcgb2YgaG93IHdhcyBjb25maWd1cmVkXG5cdFx0Ly9TZW5kIGl0IGluc3RhbnRseVxuXHRcdGlmIChzZWxmLmNvbmZpZy5pbnN0YW50bHkgfHwgZm9yY2VkU2VuZCkge1xuXHRcdFx0c2VsZi5mbHVzaCgpO1xuXG5cdFx0Ly9TZW5kIGlmIHRoZSBidWZmZXIgaXMgZnVsbFxuXHRcdH0gZWxzZSBpZiAoc2VsZi5jb25maWcuYnVmZmVyIDwgc2VsZi5jYWNoZS5pbnRlcmFjdGlvbnMubGVuZ3RoKSB7XG5cdFx0XHRzZWxmLmZsdXNoKCk7XG5cdFx0XG5cdFx0Ly9TZW5kIGJ1ZmZlcmVkIEludGVyYWN0aW9ucyBpbiB0aGUgZnV0dXJlLlxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxmLl9idWZmZXJUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0c2VsZi5mbHVzaCgpO1xuXHRcdFx0fSwgc2VsZi5jb25maWcuYmZUaW1lb3V0KTtcblx0XHR9XG5cdH0pO1xufTtcblxuLyoqXG4gKiBGbHVzaCB0aGUgaW50ZXJhY3Rpb25zLlxuICovXG5QZXJzaXN0ZW5jZS5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRpZiAoIXRvb2xzLmlzTmV0d29ya0F2YWlsYWJsZSgpKSB7XG5cdFx0Y29uc29sZS5sb2coXCJOZXR3b3JrIGlzIG5vdCBhdmFpbGFibGUuXCIpO1xuXG5cdFx0Ly9UT0RPIFJldHJ5IGJ5IGV2ZW50IHJlY29ubmVjdCBvciB0aW1lb3V0LlxuXHRcdHNlbGYuX2J1ZmZlclRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi5mbHVzaCgpO1xuXHRcdH0sIDMwMDApO1xuXG5cdFx0cmV0dXJuO1xuXHR9O1xuXG5cdHdoaWxlKHNlbGYuY2FjaGUuaW50ZXJhY3Rpb25zLmxlbmd0aCA+IDApIHtcblx0XHQvL0dldCBcIndpbmRvd1NpemVcIiBJbnRlcmFjdGlvbnMgdG8gc2VuZC5cblx0XHR2YXIgdG9TZW5kID0gc2VsZi5jYWNoZS51bnF1ZXVlKHNlbGYuY29uZmlnLndpbmRvd1NpemUpO1xuXG5cdFx0Ly9TZW5kIHRoZW0uIElmIHRoZXJlIHdhcyBhbiBlcnJvciBkdXJpbmcgc2VuZGluZywgb25FcnJvciB3aWxsIHJlcXVldWUgdGhlbS5cblx0XHRhc3luY1NlbmQodG9TZW5kLCBmdW5jdGlvbiBvbkVycm9yKCkge1xuXHRcdFx0c2VsZi5jYWNoZS5yZXF1ZXVlKHRvU2VuZCk7XG5cdFx0fSk7XG5cdH1cbn07XG5cbmZ1bmN0aW9uIGFzeW5jU2VuZCAobywgb25FcnJvcikge1xuXHQvLyBkb0FzeW5jQWpheChvLCBvbkVycm9yKTtcblx0ZG9GYWtlU2VuZGluZyhvLCBvbkVycm9yKTtcbn1cblxuLy8gZnVuY3Rpb24gZG9Bc3luY0FqYXgobywgb25FcnJvcikge1xuLy8gXHQvLyBBamF4IGNhbGwuXG4vLyB9O1xuXG5mdW5jdGlvbiBkb0Zha2VTZW5kaW5nKG8sIG9uRXJyb3IpIHtcblx0Y29uc29sZS5sb2coXCJJbnRlcmFjdGlvbnMgU0VOVDpcIik7XG5cdGNvbnNvbGUudGFibGUgPyBjb25zb2xlLnRhYmxlKG8pIDogY29uc29sZS5sb2cobyk7XG5cblx0dmFyIGZha2VTZW50ID0gdG9vbHMuZ2V0SlNPTkNvb2tpZSgnZmFrZVNlbnQnKSB8fCBbXTtcblx0ZmFrZVNlbnQgPSBmYWtlU2VudC5jb25jYXQobyk7XG5cdHRvb2xzLnNldEpTT05Db29raWUoJ2Zha2VTZW50JywgZmFrZVNlbnQpO1xufTtcbiIsInZhciBjYWNoZSA9IHJlcXVpcmUoJy4vQ2FjaGUnKSxcblx0SW50ZXJhY3Rpb24gPSByZXF1aXJlKCcuL0ludGVyYWN0aW9uJyksXG5cdFBlcnNpc3RlbmNlID0gcmVxdWlyZSgnLi9QZXJzaXN0ZW5jZScpLFxuXHR0b29scyA9IHJlcXVpcmUoJy4vdG9vbHMnKTtcblxudmFyIGRlZkNvbmZpZyA9IHtcblx0cGVyc2lzdGVuY2U6IHtcblx0XHRpbnN0YW50bHk6IGZhbHNlLFxuXHRcdGJ1ZmZlcjogMyxcblx0XHRiZlRpbWVvdXQ6IDMwMDBcblx0fVxufTtcblxudmFyIHVzYWdpbml0eSA9IG51bGw7XG4vKipcbiAqIFNpbmdsZXRvbiBmb3IgVXNhZ2luaXR5LlxuICogSXQgZG9lcyBub3QgbWF0dGVyIGlmIGl0IGlzIGV4ZWN1dGVkIGFzIG5ldyBVc2FnaW5pdHkoKTsgb3IganVzdCBVc2FnaW5pdHkoKTtcbiAqIEBnbG9iYWxcbiAqIEBwYXJhbSAge1t0eXBlXX0gb3B0Q29uZmlnXG4gKiBAcmV0dXJuIHtVc2FnaW5pdHl9ICAgICAgICBTaW5nbGV0b24gZm9yIFVzYWdpbml0eS5cbiAqL1xuZ2xvYmFsLlVzYWdpbml0eSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2luZ2xldG9uKG9wdENvbmZpZykge1xuXHRpZiAoIXVzYWdpbml0eSkgdXNhZ2luaXR5ID0gbmV3IFVzYWdpbml0eShvcHRDb25maWcpO1xuXHRyZXR1cm4gdXNhZ2luaXR5O1xufTtcblxuLyoqXG4gKiBJdCBkZWZpbmVzIHRoZSBBUEkgdG8gaW50ZXJhY3Qgd2l0aCBVc2FnaW5pdHkuXG4gKiBAcGFyYW0ge1tvYmplY3RdfSBvcHRDb25maWcgT3B0aW9uYWwgY29uZmlndXJhdGlvbi5cbiAqL1xuZnVuY3Rpb24gVXNhZ2luaXR5IChvcHRDb25maWcpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vSWRlbnRpZmllcyB0aGUgYnJvd3Nlci5cblx0YmFzaWNJZGVudGl0eSgpO1xuXG5cdGlmICghb3B0Q29uZmlnKSBvcHRDb25maWcgPSB7cGVyc2lzdGVuY2U6e319O1xuXG5cdHRvb2xzLmV4dGVuZCh0cnVlLCBvcHRDb25maWcucGVyc2lzdGVuY2UsIGRlZkNvbmZpZy5wZXJzaXN0ZW5jZSk7XG5cblx0Ly9DcmVhdGVzIHRoZSBwZXJzaXN0ZW5jZSBsYXllci5cblx0dmFyIHBlcnNpdGFuY2UgPSBuZXcgUGVyc2lzdGVuY2UoY2FjaGUsIG9wdENvbmZpZy5wZXJzaXN0ZW5jZSk7XG5cblx0c2VsZi5xdWV1ZSA9IG5ldyB0b29scy5Jbm1lZGlhdGVBc3luY1Rhc2tRdWV1ZSgpO1xuXG5cdHNlbGYudGltZXJzID0ge307XG59O1xuXG4vKipcbiAqIERlZmluZXMgd2hlbiB0byBzdGFydCB0cmFja2luZy4gSXQgd2lsbCBkZXRlY3QgYXV0b21hdGljYWxseSB3aGVuIHRvIHN0b3AgdHJhY2tpbmcuXG4gKiBAYXN5bmNcbiAqL1xuVXNhZ2luaXR5LnByb3RvdHlwZS5lbnRlcmluZyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly9FdmVyeSBhY3Rpb24sIHdpbGxcblx0c2VsZi5xdWV1ZS5lbnF1ZXVlKGZ1bmN0aW9uICgpIHtcblx0XHRjcmVhdGVJbnRlcmFjdGlvbihcImVudGVyaW5nXCIpO1xuXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYucXVldWUuZm9yY2VTeW5jID0gdHJ1ZTtcblxuXHRcdFx0c2VsZi5lbmQoKTtcblx0XHRcdGNyZWF0ZUludGVyYWN0aW9uKFwibGVhdmluZ1wiLCBudWxsLCB0cnVlKTtcblx0XHR9KTtcblx0fSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gSW50ZXJhY3Rpb24gZXZlbnQuXG4gKiBAYXN5bmNcbiAqIEBwYXJhbSAge3N0cmluZ30gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlLiBFLmcuICdjbGljaycuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVJZCAgICBUaGUgaWQgZm9yIHRoZSBldmVudC5cbiAqIEBwYXJhbSAge3N0cmluZ30gbGFiZWwgICAgIEEgbGFiZWwgdG8gc3BlY2lmeSBiZXR3ZWVuIGRpZmZlcmVudCBzYW1lIGV2ZW50cy5cbiAqL1xuVXNhZ2luaXR5LnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG5hbWVJZCwgbGFiZWwpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYucXVldWUuZW5xdWV1ZShmdW5jdGlvbiAoKSB7XG5cdFx0Y3JlYXRlSW50ZXJhY3Rpb24oJ2V2ZW50Jywge1xuXHRcdFx0ZXZlbnRUeXBlOiBldmVudFR5cGUsXG5cdFx0XHRuYW1lSWQ6IG5hbWVJZCxcblx0XHRcdGxhYmVsOiBsYWJlbFxuXHRcdH0pO1xuXHR9KTtcbn07XG5cbi8qKlxuICogRGVmaW5lcyBhIHRyYW5zaXRpb24gYmV0d2VlbiB0d28gVVJMLiBJdCBpcyB1c2VmdWwgd2hlbiBpbiBzaWdsZS1wYWdlIGFwcGxpY2F0aW9uLlxuICogQGFzeW5jXG4gKi9cblVzYWdpbml0eS5wcm90b3R5cGUudHJhbnNpdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYucXVldWUuZW5xdWV1ZShmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHRzdGFydCA9IHNpbXBsZVRyYWNraW5nLnRzdGFydDtcblx0XHR2YXIgdGVuZCA9IG5ldyBEYXRlKCk7XG5cdFx0dmFyIHRkaWZmID0gdGVuZC5nZXRUaW1lKCkgLSB0c3RhcnQuZ2V0VGltZSgpO1xuXG5cdFx0c2ltcGxlVHJhY2tpbmcucmVmZXJyZXIgPSBzaW1wbGVUcmFja2luZy5jdXJyZW50O1xuXHRcdHNpbXBsZVRyYWNraW5nLmN1cnJlbnQgPSBkb2N1bWVudC5VUkw7XG5cdFx0c2ltcGxlVHJhY2tpbmcudHN0YXJ0ID0gbmV3IERhdGUoKTtcblxuXHRcdGNyZWF0ZUludGVyYWN0aW9uKCd0cmFuc2l0aW9uJywge1xuXHRcdFx0dGVuZDogdGVuZC5nZXRUaW1lKCksXG5cdFx0XHR0ZGlmZjogdGRpZmZcblx0XHR9KTtcblx0fSk7XG59O1xuXG4vKipcbiAqIERlZmluZXMgYW4gaW50ZXJuYWwgdGltZXIuXG4gKiBAYXN5bmNcbiAqIEBwYXJhbSAge3N0cmluZ30gdGltZXJJZCBUaGUgdGltZXIgSUQuXG4gKi9cblVzYWdpbml0eS5wcm90b3R5cGUuc3RhcnRUaW1lciA9IGZ1bmN0aW9uICh0aW1lcklkKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLnF1ZXVlLmVucXVldWUoZnVuY3Rpb24gKCkge1xuXHRcdHNlbGYudGltZXJzW3RpbWVySWRdID0gbmV3IERhdGUoKTtcblx0fSk7XG59O1xuXG4vKipcbiAqIERlZmluZXMgd2hlbiB0byBzdG9wIGEgcHJldmlvdXNseSBleGVjdXRlZCB0aW1lci5cbiAqIEBhc3luY1xuICogQHBhcmFtICB7c3RyaW5nfSB0aW1lcklkIFRoZSB0aW1lciBJRC5cbiAqL1xuVXNhZ2luaXR5LnByb3RvdHlwZS5lbmRUaW1lciA9IGZ1bmN0aW9uICh0aW1lcklkKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLnF1ZXVlLmVucXVldWUoZnVuY3Rpb24gKCkge1xuXHRcdHZhciB0c3RhcnQgPSBzZWxmLnRpbWVyc1t0aW1lcklkXTtcblx0XHRpZiAoIXRzdGFydCkgcmV0dXJuO1xuXG5cdFx0dmFyIHRlbmQgPSBuZXcgRGF0ZSgpO1xuXHRcdHZhciB0ZGlmZiA9IHRlbmQuZ2V0VGltZSgpIC0gdHN0YXJ0LmdldFRpbWUoKTtcblxuXHRcdGNyZWF0ZUludGVyYWN0aW9uKCd0aW1lcicsIHtcdFxuXHRcdFx0dGltZXJOYW1lOiB0aW1lcklkLFxuXHRcdFx0dGVuZDogdGVuZC5nZXRUaW1lKCksXG5cdFx0XHR0ZGlmZjogdGRpZmZcblx0XHR9KTtcblxuXHRcdHNlbGYudGltZXJzW3RpbWVySWRdID0gbnVsbDtcblx0fSk7XG59O1xuXG4vKipcbiAqIEF1dG9tYXRpY2FsbHkgY2xvc2VzIGFsbCBvcGVuZWQgdGltZXJzLlxuICogQGFzeW5jIEl0IGV4ZWN1dGVzIHNldmVyYWwgYXN5bmMgb3BlcmF0aW9ucy5cbiAqL1xuVXNhZ2luaXR5LnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHR2YXIgcHJvcDtcblx0Zm9yIChwcm9wIGluIHNlbGYudGltZXJzKSB7XG5cdFx0aWYgKHNlbGYudGltZXJzW3Byb3BdKSB7XG5cdFx0XHRzZWxmLmVuZFRpbWVyKHByb3ApO1xuXHRcdH1cblx0fVxufTtcblxuLyoqXG4gKiBIZWxwcyB0byB0cmFjayBtYWluIGJyb3dzZXIgZGF0YS5cbiAqIEluIHNpbmdsZSBwYWdlcyBpdCB0cmFja3MgZnJvbSB3aGF0IHNlY3Rpb25zIHVzZXIgY29tZXMuXG4gKi9cbnZhciBzaW1wbGVUcmFja2luZyA9IHtcblx0cmVmZXJyZXI6IGRvY3VtZW50LnJlZmVycmVyLFxuXHRjdXJyZW50OiBkb2N1bWVudC5VUkwsXG5cdHRzdGFydDogbmV3IERhdGUoKVxufTtcblxuZnVuY3Rpb24gYmFzaWNJZGVudGl0eSgpIHtcblx0dmFyIGlkID0gdG9vbHMuZ2V0SlNPTkNvb2tpZSgndWdJZCcpO1xuXHRpZiAoIWlkKSB7XG5cdFx0aWQgPSB0b29scy5yYW5kb21TdHIoMzIpO1xuXHR9XG5cblx0c2ltcGxlVHJhY2tpbmcudHJhY2tJZCA9IGlkO1xuXG5cdHRvb2xzLnNldEpTT05Db29raWUoXCJ1Z0lkXCIsIGlkKTtcbn07XG5cbi8qKlxuICogV2hlbiBhIGNvZGUgYWN0aW9uIGlzIGV4ZWN1dGVkLCBpdCBtaWdodCBjcmVhdGUgYW4gSW50ZXJhY3Rpb24gZmlsbGluZyBpdCB3aXRoIHNvbWUgZGF0YS5cbiAqIEBwYXJhbSAge3N0cmluZ30gaW50ZXJhY3Rpb25OYW1lICAgIFx0XHRJbnRlcmFjdGlvbiB0eXBlIG5hbWVcbiAqIEBwYXJhbSAge1tvYmplY3RdfSBpbnRlcmFjdGlvbk9wdGlvbnMgXHRBbiBvYmplY3QgdG8gZXh0ZW5kIGFuZCBwZXJzb25hbGl6ZSB0aGUgSW50ZXJhY3Rpb25cbiAqIEBwYXJhbSAge1tib29sZWFuXX0gZm9yY2VkU2VuZCAgICAgICAgIFx0SWYgdGhlIGJyb3dzZXIgaXMgZ29pbmcgdG8gYmUgY2xvc2VkIGlubWVkaWF0ZWxseSwgZm9yY2VTZW5kIHdpbGwgYmUgbWFya2VkIGFzIHRydWUgdG8gdHJ5IHRvIHNlbmQgdGhlIEludGVyYWN0aW9uLiBcbiAqL1xuZnVuY3Rpb24gY3JlYXRlSW50ZXJhY3Rpb24oaW50ZXJhY3Rpb25OYW1lLCBpbnRlcmFjdGlvbk9wdGlvbnMsIGZvcmNlZFNlbmQpIHtcblx0dmFyIG5ld0ludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKGludGVyYWN0aW9uTmFtZSk7XG5cblx0dmFyIHRyYWNraW5nID0ge1xuXHRcdHJlZmVycmVyOiBzaW1wbGVUcmFja2luZy5yZWZlcnJlcixcblx0XHR1cmw6IHNpbXBsZVRyYWNraW5nLmN1cnJlbnQsXG5cdFx0dGl0bGU6IGRvY3VtZW50LnRpdGxlLFxuXHRcdHRyYWNrSWQ6IHNpbXBsZVRyYWNraW5nLnRyYWNrSWRcblx0fTtcblxuXHR0b29scy5mb3JjZWRFeHRlbmQobmV3SW50ZXJhY3Rpb24sIHRyYWNraW5nLCBpbnRlcmFjdGlvbk9wdGlvbnMpO1xuXG5cdC8vU2VuZCB0aGUgbmV3IEludGVyYWN0aW9uIHRvIHRoZSBjYWNoZS5cblx0Y2FjaGUucHVzaChuZXdJbnRlcmFjdGlvbiwgZm9yY2VkU2VuZCk7XG59OyIsIi8qKlxuICogalF1ZXJ5IGV4dGVuZCBsaWtlIGhlbHBlci5cbiAqIEBwYXJhbSAge1t0eXBlXX0gZXh0ZW5kRmlyc3RPYmplY3QgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24gKGV4dGVuZEZpcnN0T2JqZWN0KSB7XG5cdHZhciBleHRlbmRlZCwgZnJvbSA9IDA7XG5cblx0aWYgKHR5cGVvZiBleHRlbmRGaXJzdE9iamVjdCA9PT0gXCJib29sZWFuXCIpIHtcblx0XHRpZiAoZXh0ZW5kRmlyc3RPYmplY3QpIHtcblx0XHRcdGV4dGVuZGVkID0gYXJndW1lbnRzWzFdO1xuXHRcdFx0ZnJvbSA9IDI7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZyb20gPSAxO1xuXHRcdH1cblx0fVxuXG5cdGV4dGVuZGVkID0gZXh0ZW5kZWQgfHwge307XG5cblx0Zm9yICh2YXIgaSA9IGZyb207IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcblx0XHR2YXIgcHJvcCwgbyA9IGFyZ3VtZW50c1tpXTtcblxuXHRcdGZvciAocHJvcCBpbiBvKSB7XG5cdFx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHByb3ApKSB7XG5cdFx0XHRcdGV4dGVuZGVkW3Byb3BdID0gb1twcm9wXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZXh0ZW5kZWQ7XG59O1xuXG4vKipcbiAqIENvcGllcyBwcm9wZXJ0aWVzIHRvIHRoZSBmaXJzdCBwYXNzZWQgYXJndW1lbnQuXG4gKiBAcGFyYW0gIHtvYmplY3QuLi59IGV4dGVuZGVkIFRoZSBmaXJzdCB3aWxsIGJlIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKi9cbmV4cG9ydHMuZm9yY2VkRXh0ZW5kID0gZnVuY3Rpb24gKGV4dGVuZGVkKSB7XG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG5cdFx0dmFyIHByb3AsIG8gPSBhcmd1bWVudHNbaV07XG5cblx0XHRmb3IgKHByb3AgaW4gbykge1xuXHRcdFx0ZXh0ZW5kZWRbcHJvcF0gPSBvW3Byb3BdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBleHRlbmRlZDtcbn07XG5cbmV4cG9ydHMuc2V0SlNPTkNvb2tpZSA9IGZ1bmN0aW9uIChuYW1lLCBvKSB7XG5cdGlmICghbykge1xuXHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKG5hbWUpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxvY2FsU3RvcmFnZS5zZXRJdGVtKG5hbWUsIEpTT04uc3RyaW5naWZ5KG8pKTtcbn07XG5cbmV4cG9ydHMuZ2V0SlNPTkNvb2tpZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdHZhciBqc29uID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0obmFtZSk7XG5cdGlmICghanNvbikgcmV0dXJuIG51bGw7XG5cdHJldHVybiBKU09OLnBhcnNlKGpzb24pO1xufTtcblxuZXhwb3J0cy5pc05ldHdvcmtBdmFpbGFibGUgPSBmdW5jdGlvbiAoKSB7XG5cdGlmIChNYXRoLnJhbmRvbSgpIDwgMC4zKSByZXR1cm4gZmFsc2U7XG5cdGVsc2UgcmV0dXJuIHRydWU7XG59XG5cbi8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMzQ5NDA0L2dlbmVyYXRlLWEtc3RyaW5nLW9mLTUtcmFuZG9tLWNoYXJhY3RlcnMtaW4tamF2YXNjcmlwdC8xODEyMDkzMiMxODEyMDkzMlxuZXhwb3J0cy5yYW5kb21TdHIgPSBmdW5jdGlvbiAoc3RyaW5nTGVuZ3RoKSB7XG5cdHZhciBwb3NzaWJsZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSc7XG5cblx0dmFyIHJhbmRvbVN0cmluZyA9IEFycmF5LmFwcGx5KG51bGwsIG5ldyBBcnJheShzdHJpbmdMZW5ndGgpKS5tYXAoZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIHBvc3NpYmxlW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCldO1xuXHR9KS5qb2luKCcnKTtcblxuXHRyZXR1cm4gcmFuZG9tU3RyaW5nO1xufVxuXG5leHBvcnRzLklubWVkaWF0ZUFzeW5jVGFza1F1ZXVlID0gcmVxdWlyZSgnLi90b29scy9Jbm1lZGlhdGVBc3luY1Rhc2tRdWV1ZScpOyIsIm1vZHVsZS5leHBvcnRzID0gSW5tZWRpYXRlQXN5bmNUYXNrUXVldWU7XG5mdW5jdGlvbiBJbm1lZGlhdGVBc3luY1Rhc2tRdWV1ZSAoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmZvcmNlU3luYyA9IGZhbHNlO1xuXG5cdHNlbGYuX3Rhc2tzID0gW107XG59O1xuXG4vKipcbiAqIEVucXVldWUgYSB0YXNrIHRvIGJlIGV4ZWN1dGVkIGFzeW5jaHJvbm91c2x5LiBBbGwgdGhlIHF1ZXVlZCB0YXNrLCB3aWxsIGJlIGV4ZWN1dGVkIGFzeW5jIGJ1dCBpbiB0aGVpciBzYW1lIHRocmVhZC5cbiAqIEBwYXJhbSAge1tGdW5jdGlvbl19IHRhc2tcbiAqL1xuSW5tZWRpYXRlQXN5bmNUYXNrUXVldWUucHJvdG90eXBlLmVucXVldWUgPSBmdW5jdGlvbiAodGFzaykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5fdGFza3MucHVzaCh0YXNrKTtcblxuXHQvL0RldGVjdHMgd2hlbiB0aGVyZSBpcyBhbHJlYWR5IGEgcGxhbm5lZCBleGVjdXRpb24uXG5cdGlmICghc2VsZi5fZXhlY3V0aW5nKSB7XG5cdFx0c2VsZi5fZXhlY3V0aW5nID0gdHJ1ZTtcblxuXG5cdFx0dmFyIGV4ZWNBbGxRdWV1ZWRUYXNrcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB0YXNrO1xuXG5cdFx0XHQvL0FsbCB0aGUgcXVldWVkIHRhc2ssIHdpbGwgYmUgZXhlY3V0ZWQgYXN5bmMgYnV0IGluIHRoZWlyIHNhbWUgdGhyZWFkLlxuXHRcdFx0d2hpbGUgKHRhc2sgPSBzZWxmLl90YXNrcy5zaGlmdCgpKSB7XG5cdFx0XHRcdHRhc2soKTtcblx0XHRcdH1cblxuXHRcdFx0c2VsZi5fZXhlY3V0aW5nID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly9Bc3luYyBleGVjdXRpb24hXG5cdFx0aWYgKCFzZWxmLmZvcmNlU3luYykgc2V0VGltZW91dChleGVjQWxsUXVldWVkVGFza3MpO1xuXHRcdGVsc2UgZXhlY0FsbFF1ZXVlZFRhc2tzKCk7XG5cdH1cbn07Il19

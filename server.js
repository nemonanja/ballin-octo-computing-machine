// Global variables
var globals = require('./globals');

// Static configs
var config = require('./config.json');

// Local modules
var distributed = require('./modules/distributed.js');
var crypt = require('./modules/cryptography.js');
//var worker = require('./modules/worker.js');

// External modules
var express  = require('express');

// Config express
var app = express();

var pub = __dirname + '/public',
	view = __dirname + '/views';

// Genrate uuid
distributed.uuid();


app.use(express.static(pub));
app.use(express.static(view));

// ======
// ROUTES
// ======

// Register new node
app.get('/register', function(req, res) {
	console.log('register called');
	if(globals.is_master && req.query && req.query.data){
		crypt.decryptJSON(req.query.data, function(data) {
			var clientIp = req.ip;
			var uuid = data.uuid;

			// Gice ip and uuid to list handler
			distributed.ipListHandler(clientIp, uuid, function(success) {
				if(success){
					console.log('return ip_list:', globals.ip_list);
					crypt.sendCryptJSON({ip_list: globals.ip_list, ip: clientIp}, res);
				} else {
					console.log('return false');
					crypt.sendCryptJSON(false, res);
				}
			});
		});
	} else {
		console.log('return false');
		crypt.sendCryptJSON(false, res);
	}
});

// Take over notify
app.get('/takeover', function(req, res) {
	console.log('takeover called');
	if(globals.is_master){
		globals.is_master = false;
		console.log('node switched to slave');
		//crypt.sendCryptJSON(true, res);
		res.json(true);
	} else {
		console.log('return false');
		//crypt.sendCryptJSON(false, res);
		res.json(false);
	}
});

// IP list changed notify
app.get('/ipnotify', function(req, res) {
	console.log('ipnotify called');
	res.json(true);
});

// start listening
app.listen(config.port);
console.log('Node running on port:', config.port);


// initialize node for distributed system
distributed.initialize(function(status) {
	//Node initialised successfully
	if(status) {
		console.log('Node initialized as', status);
		console.log(globals);
	// Could not initialize node, wait 1 minute and try again
	} else {
		distributed.initLoop();
	}
});
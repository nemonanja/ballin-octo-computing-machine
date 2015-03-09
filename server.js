// Global variables
var globals = require('./globals');

// Static configs
var config = require('./config.json');

// Local modules
var distributed = require('./modules/distributed.js');
var crypt = require('./modules/cryptography.js');
//var worker = require('./modules/worker.js');
//var heartbeat = require('./modules/heartbeat.js');

// External modules
var express  = require('express');

// Config express
var app = express();

var pub = __dirname + '/public',
	view = __dirname + '/views';


app.use(express.static(pub));
app.use(express.static(view));

// ======
// ROUTES
// ======

// Register
app.get('/register', function(req, res) {
	console.log('register');

	if(globals.is_master){
		globals.ip_arr.push(req.headers['X-Forwarded-For'])
		console.log(Global.ip_arr);

		console.log('return ip_arr');
		res.json({ip_arr: ip_arr});
	} else {
		console.log('return false');
		res.json(false);
	}
});

app.listen(config.port);
console.log('Node running on port:', config.port);
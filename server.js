// Global variables
globals = require('./globals');

// Static configs
config = require('./config.json');

// Local modules
var distributed = require('./modules/distributed.js');
crypt = require('./modules/cryptography.js');
var heartbeat = require('./modules/heartbeat.js');
var worker = require('./modules/worker.js');

// External modules
var express  = require('express');

// Config express
var app = express();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var textParser = bodyParser.text({type: 'text/html'});

app.use(bodyParser.urlencoded({
    extended: true
}));

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
app.post('/register', textParser, function(req, res) {
	console.log('register called');
	if(globals.is_master && req.body){
		crypt.decryptJSON(req.body, function(data) {
			var clientIp = req.ip;
			var uuid = data.uuid;
			// Give ip and uuid to list handler
			distributed.addSlave(uuid, clientIp, function(success) {
				console.log("handler returned:", success);
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

// Unregister node
app.post('/unregister', textParser, function(req, res) {
	console.log('unregister called');
	if(globals.is_master && req.body){
		crypt.decryptJSON(req.body, function(data) {
			var uuid = data.uuid;
			distributed.removeSlave(uuid, function(success) {
				console.log("Node removed:", success);
				if(success){
					crypt.sendCryptJSON(true, res);
				} else {
					crypt.sendCryptJSON(false, res);
				}
			});
		});
	} else {
		console.log('return false');
		crypt.sendCryptJSON(false, res);
	}
});

// IP list changed
app.post('/ipnotify', textParser, function(req, res) {
	console.log('ipnotify called');
	if(globals.ready && !globals.is_master && req.body){
		console.log("nakki:",req.body);
		crypt.decryptJSON(req.body, function(data) {
			if(data.ip_list) {
				console.log('new ip list:', data);
				globals.ip_list = data.ip_list;
				crypt.sendCryptJSON(true, res);
			} else {
				console.log('no new ip list in:', data);
				crypt.sendCryptJSON(false, res);
			}
		});
	} else {
		console.log('return false');
		crypt.sendCryptJSON(false, res);
	}
});

// Route for web gui
app.post('/gettraceroute', jsonParser, function(req, res){
	console.log('gettraceroute');
	worker.callnodes(req.body.ip, function(result){
		console.log(result);
		res.json(result);
	})
})

// Route for web gui
app.get('/getnodes', jsonParser, function(req, res){
	console.log('getnodes');
	console.log(globals.geo_data);
	res.json(globals.geo_data);
});

// Do task
app.post('/taskcall', textParser, function(req,res){
	console.log('taskcall called');
	var pingres
	var tracertres
	crypt.decryptJSON(req.body, function(data){
		worker.traceroute(data.ip, 64, function(error, results){
			if (error){
				results.push({point: data.ip, time: -1});
				console.log(error.toString())
			}
			tracertres = results
			worker.ping(data.ip, function (error, time) {
				if (error){
					time = -1
				}
				pingres = time
				crypt.sendCryptJSON({"traceroute" : tracertres, "ping": pingres, ip: globals.my_ip}, res)
    			console.log("Time: " + time)
			})
		})
	})
});

// Heartbeat routes
app.post('/heartbeat', textParser, heartbeat.isAlive);
app.get('/heartbeat/latencies', heartbeat.getLatencies);

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
	}
});

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

// Cleanup function
function exitHandler(options, err) {
	if(!globals.is_master && globals.ready) {
		distributed.unregister(function(success) {
			console.log('Unregistered:', success);
			console.log('Closing node');
		    if (options.cleanup) console.log('clean');
		    if (err) console.log(err.stack);
		    if (options.exit) process.exit();
		});
	} else {
		console.log('Closing node');
		if (options.cleanup) console.log('clean');
	    if (err) console.log(err.stack);
	    if (options.exit) process.exit();
	}
}
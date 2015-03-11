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

// IP list changed
app.post('/ipnotify', function(req, res) {
	console.log('ipnotify called');
	if(globals.ready && !globals.is_master && req.query && req.query.data){
		crypt.decryptJSON(req.query.data, function(data) {
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

//nemo vitun homo jäbä kutsuu tätä :DDD
app.post('/removekebabnemo', jsonParser, function(req, res){
	worker.callnodes(req.body.ip, function(result){
		worker.traceroute(req.body.ip, 64, function(error, trace){
			if (error){
				console.log(error.toString())
				res.json(result)
			}else{
				worker.ping(req.body.ip, function (error, time) {
					if (error){
						res.json(result)
						console.log (target + ": " + error.toString ());
					}else{
    					result.push({"uuid": globals.uuid, "traceroute": trace, "ping": time})
    					res.json(result)
					}
				})
			}
		})
 	})
})

// Do task
app.post('/taskcall', textParser, function(req,res){
	var pingres
	var tracertres
	crypt.decryptJSON(req.body, function(data){
		worker.traceroute(data.ip, 64, function(error, results){
			if (error){
				res.json({}, res)
				console.log(error.toString())
			}else{
				tracertres = results
				worker.ping(data.ip, function (error, time) {
					if (error){
						console.log (target + ": " + error.toString ());
						crypt.sendCryptJSON({}, res)
					}else{
						pingres = time
						crypt.sendCryptJSON({"uuid": globals.uuid, "traceroute" : tracertres, "ping": pingres}, res)
					}
				})
			}
		})
	})
});

// Check is master alive
app.post('/istheremaster', textParser, function(req,res){
	console.log('istheremaster called');
	crypt.decryptJSON(req.body, function(data){
		if(globals.ready && data.check && !globals.ongoing) {
			globals.ongoing = true;
			distributed.pingMaster(function(state) {
				crypt.sendCryptJSON({state: state}, res);
			});
		}
	})
});

// Start looking new master
app.post('/searchnewmaster', textParser, function(req,res){
	console.log('searchnewmaster called');
	crypt.decryptJSON(req.body, function(data){
		if(globals.ready && data.startSearch && globals.ongoing) {
			distributed.newMasterSearch();
		}
	})
});

// Takeover
app.post('/bemaster', textParser, function(req,res){
	console.log('bemaster called');
	crypt.decryptJSON(req.body, function(data){
		if(globals.ready && data.beMaster) {
			distributed.takeOver();
		}
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
	} else {
		distributed.initLoop();
	}
});
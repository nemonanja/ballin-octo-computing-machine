var monument = require('moment');
var os = require("os");
var schedule = require('node-schedule');
var request = require('request');

var task = null;
var latencies = {};

exports.isAlive = function(req, res){
    if(jsonCheck(req.body, ["ping", "timestamp"])){
    	//console.log(req.body.ping);
    	//console.log(monument.unix(req.body.timestamp).format());
		//console.log("%s", monument.utc().unix());
        console.log('Ping from: ' + req.body.ping + ' ' + req.body.timestamp);
		res.json({pong:os.hostname(), timestamp:monument.utc().unix()});		
    } else {
        console.log(req.body);
        res.sendStatus(400);
    }
}

exports.startBeat = function(cron, master) {
    if(task === null) {
    	task = schedule.scheduleJob(cron, function() {
        	//console.log('Ping: ' + master);
            sendHeartBeatRequest(master);
    	});
        console.log('Scheduled heartbeat task');
    }
}

exports.stopBeat = function() {
    if(!(task === null)) {
        task.cancel();
        task = null;
        console.log('Cancelled heartbeat task');
    }
}

exports.getLatencies = function(req, res) {
    res.json(latencies);
}

function sendHeartBeatRequest(host) {
    var time = monument.utc().unix();
	request.post(host + '/heartbeat',
	    { json: { ping:os.hostname(), timestamp:time } },
	    function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            //console.log('Pong: ' + body);
                if(jsonCheck(body, ["pong", "timestamp"])) {
                    console.log('Pong from: ' + body.pong + ' ' + body.timestamp);
                    latencies[body.pong] = body.timestamp - time;
                    //console.log(body.pong);
                    //console.log(body.timestamp);
                }
	        }
            //console.log(response.statusCode);
	    }
	);
}

function jsonCheck(json, checks) {
    var result = true;
    checks.forEach(function(check) {
        if (!json.hasOwnProperty(check)) {
            result = false;                
        }
    });
    return result;
}

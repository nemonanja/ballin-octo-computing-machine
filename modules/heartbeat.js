var monument = require('moment');
var schedule = require('node-schedule');
var request = require('request');

var task = null;
var latencies = {};

exports.isAlive = function(req, res){
    crypt.decryptJSON(req.query.data, function(data) {
        if(jsonCheck(data, ["ping", "timestamp"])){
        	//console.log(req.body.ping);
        	//console.log(monument.unix(req.body.timestamp).format());
    		//console.log("%s", monument.utc().unix());
            console.log('Ping from: ' + data.ping + ' ' + data.timestamp);
    		//res.json({pong:Globals.uuid, timestamp:monument.utc().unix()});		
            crypt.sendCryptJSON({pong:Globals.uuid, timestamp:monument.utc().valueOf()}, res);
        } else {
            console.log(data);
            res.sendStatus(400);
        }
    });
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
    crypt.sendCryptJSON(latencies, res);
}

function sendHeartBeatRequest(host) {
    var time = monument.utc().valueOf();
    crypt.encryptJSON({ ping:Globals.uuid, timestamp:time }, function(data) {
        request.post(
            {
                url: host + '/heartbeat',
                body: data,
                headers: {'Content-Type': 'text/html'}
            },
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
	});
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

var monument = require('moment');
var schedule = require('node-schedule');
var request = require('request');

var task = null;
var latencies = {};
var failed = 0;
var failback = null;
var pinged = {};
var failcount = 1;

exports.isAlive = function(req, res){
    crypt.decryptJSON(req.body, function(data) {
        if(jsonCheck(data, ["ping", "timestamp"])){
            console.log('Ping from: ' + data.ping + ' ' + data.timestamp);
            pinged[data.ping] = {};
            pinged[data.ping].timestamp = monument.utc().valueOf();
            if(Globals.is_master) {
                crypt.sendCryptJSON({pong:Globals.uuid, timestamp:monument.utc().valueOf()}, res);
            }
        } else {
            console.log(data);
            res.sendStatus(400);
        }
    });
}

exports.startBeat = function(cron, master, callback) {
    if(task === null) {
        failback = callback;
    	task = schedule.scheduleJob(cron, function() {
        	//console.log('Ping: ' + master);
            sendHeartBeatRequest(master);
    	});
        console.log('Scheduled heartbeat task');
    }
}

var stopBeat = function() {
    if(!(task === null)) {
        task.cancel();
        task = null;
        console.log('Cancelled heartbeat task');
    }
}

exports.getLatencies = function(req, res) {
    crypt.sendCryptJSON(latencies, res);
}

exports.removeNode = function(uuid) {
    delete pinged.uuid;
}

var sendHeartBeatRequest = function(host, uuid, callback) {
    var time = monument.utc().valueOf();
    crypt.encryptJSON({ ping:Globals.uuid, timestamp:time }, function(data) {
        request.post(
            {
                url: host + '/heartbeat',
                body: data,
                headers: {'Content-Type': 'text/html'},
                timeout: 30000
            },
    	    function (error, response, body) {
    	        if (!error && response.statusCode == 200) {    	            
                    failed = 0;
                    crypt.decryptJSON(body, function(data) {
                        if(jsonCheck(data, ["pong", "timestamp"])) {
                            console.log('Pong from: ' + data.pong + ' ' + data.timestamp);
                            latency = monument.utc().valueOf() - time;
                            latencies[data.pong] = latency;
                            if(callback) {
                                callback(latency, uuid);
                            }
                        }
                    });
    	        } else {
                    if(callback) {
                        callback(-1);
                        return;
                    }
                    pingTimeout();
                }                
    	    }
        );
	});
}

function pingTimeout() {
    console.log('Ping timed out(' + failed + ')');
    if(failed == failcount) {
        stopBeat();
        if(failback) {
            failback();
        }
    } else {
        failed++;
    }
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

var periodicPingCheck = function(crawlBack) {
    schedule.scheduleJob("*/1 * * * *", function() {    
        for(var node in pinged) {
            var time = pinged[node].timestamp;
            var ip = '';
            console.log(monument.utc().valueOf() - time);
            if(monument.utc().valueOf() - time >= (failcount * 60000) + 2000) {
                console.log('Remove node from lists');
                for (var i=0; i<globals.ip_list.length; i++) {
                    if(globals.ip_list[i].uuid===node) {
                        ip = globals.ip_list[i].ip;
                        globals.ip_list.splice(i, 1);
                        break;
                    }
                }

                for (var i=0; i<globals.geo_data.length; i++) {
                    if(globals.geo_data[i].ip===ip) {
                        globals.geo_data.splice(i, 1);
                        break;
                    }
                }

                delete pinged.node;

                if(globals.ip_list.length>1) {
                    pinged = {};
                    this.cancel();
                    crawlBack();
                }
            }
        }
    });    
}

exports.sendHeartBeatRequest = sendHeartBeatRequest;
exports.stopBeat = stopBeat;
exports.periodicPingCheck = periodicPingCheck;
var netping = require("net-ping");
var dns = require('dns');
var request = require('request').defaults({jar: true});
var satelize = require('satelize');
var _this = this;

var options = {
	retries: 1,
	timeout: 2000
}
var session = netping.createSession(options)
    
exports.ping = function(address, callback){
    session.pingHost(address, function (error, target, sent, rcvd) {
    	var ms = rcvd - sent;
    	if (error){
    		callback(error, -1)
    	}else{
    		callback(null, ms)
    	}
    });
}

exports.traceroute = function(address, ttl, callback){
	var results = []
	var addr = address;
	session.traceRoute (address, ttl,
	function (error, target, ttl, sent, rcvd) {
		var ms = rcvd - sent;
		if (error) {
			if (error instanceof TimeExceededError) {
				//console.log (target + ": " + error.source + " (ttl=" + ttl + " ms=" + ms +")");
			} else {
				//console.log (target + ": " + error.toString () + " (ttl=" + ttl + " ms=" + ms +")");
				console.log("IP: " + error.source + " : " + ms + "ms")
				if((/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g).test(error.source)) {
					results.push({point: error.source, time: ms})
				} else {
					//results.push({point: 'undefined', time: ms})
				}
			}
		} else {
			//console.log (target + ": " + target + " (ttl=" + ttl + " ms=" + ms +")");
			console.log("NO ERROR!!:",target + " : " + ms + "ms")
			results.push({point: address, time: -1})
		}
	}, 

	function (error, target) {
		if (error)
			callback(error, results)
		else
			callback(null, results)
	})

}

exports.callnodes = function(ip, callback){
	var result = []
	var index = 0
	getIP(ip, function(ip) {
		if(!ip) {
			callback(result);
			return;
		}
		console.log('Tracerting ip:', ip)
		_this.traceroute(ip, 64, function(error, results) {
			if(error) {
				console.log("error:",error.toString());
				results.push({point: ip, time: -1});
			}

			var tracertres = results;
			console.log("Tracerts:", tracertres);

			_this.ping(ip, function (error, time) {
				if (error){
					console.log ("Ping Error: " + error.toString ());
				}

				var pingres = time
				result.push({"traceroute" : tracertres, "ping": pingres, ip: globals.my_ip})
    			console.log("Time: " + time)
				
				console.log("asd", globals.ip_list);
				if(globals.ip_list.length == 0) {
					getGeoData(result, function(data) {
						console.log("returning one result")
	    				callback(result);
						return;
	    			});
				} else {
					crypt.encryptJSON({"ip": ip}, function(data){
						for(i = 0; i < globals.ip_list.length; i++){
					    	request.post(
					    		{
				                	url: "http://" + globals.ip_list[i].ip + ":" + config.port +  '/taskcall',
				                	body: data,
				                	headers: {'Content-Type': 'text/html'}
				            	},
				            	function(error, response, body){
						    		if (error){
						    			index += 1
						    		}else{
						    			index += 1
						    			if (response.statusCode == 200) {
						    				crypt.decryptJSON(body, function(data){
						    					if(jsonCheck(data, ["traceroute", "ping"])){
						    						result.push(data)
						    					}
						    				})
							        	}
						    		}

						    		if (index == globals.ip_list.length){
						    			getGeoData(result, function(data) {
											console.log("returning all results")
						    				callback(result);
						    			});
						    		}

					    	});
						}
					});
				}
			})
		});
	});
}

function getGeoData(inData, callback) {
	var dataOut = [];
	var counter = 0;
	var limit = inData[0].traceroute.length;

	for(var i = 0; i < inData.length; i++){
		if(i+1<inData.length) {
			limit += inData[i+1].traceroute.length;
		}
		for(var j = 0; j < inData[i].traceroute.length; j++){

			getTracert(inData[i].traceroute[j], i, function(elem, x) {
				counter += 1;
				if(elem.geodata) {
					dataOut.push(elem);
				} else {
					inData[x].traceroute.splice(inData[x].traceroute.indexOf(elem), 1);
				}
				console.log(counter, limit);
				if(counter==limit) {
					console.log('Geodata done')
					callback(dataOut);
				}
			});
		}
	}
}

function getTracert(elem, i, callback) {
	if((/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g).test(elem.point)) {
		satelize.satelize({ip: elem.point, JSONP: true}, function(err, geoData) {
			if(err || !geoData || geoData == undefined || geoData.length==0) {
				console.log(err)
				elem['geodata'] = false;
			} else {
				var data = JSON.parse(geoData.substring(9,geoData.length-3));
				if(data.latitude) {
					elem['geodata'] = data;
				}
			}
			callback(elem, i);
		});
	} else {
		elem['geodata'] = false;
		callback(elem, i);
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

function TimeExceededError (source) {
	this.name = "TimeExceededError";
	this.message = "Time exceeded (source=" + source + ")";
	this.source = source;
}

function getIP (ip, callback) {
	if((/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g).test(ip)) {
		console.log('valid ip:', ip);
		callback(ip);
	} else {
		console.log('invalid ip:', ip);
		dns.lookup(ip, function(err,ip) {
			if(err) {
				console.log(err);
				callback(false);
			} else {
				console.log(ip);
				callback(ip);
			}
		});
	}
}

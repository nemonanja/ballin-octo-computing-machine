var netping = require("net-ping")
var request = require('request').defaults({jar: true});
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
    		callback(error, null)
    	}else{
    		callback(null, ms)
    	}
    });
}


exports.traceroute = function(address, ttl, callback){
	var results = []
	session.traceRoute (address, ttl,
	function (error, target, ttl, sent, rcvd) {
		var ms = rcvd - sent;
		if (error) {
			if (error instanceof TimeExceededError) {
				//console.log (target + ": " + error.source + " (ttl=" + ttl + " ms=" + ms +")");
			} else {
				//console.log (target + ": " + error.toString () + " (ttl=" + ttl + " ms=" + ms +")");
				//console.log(error.source + " : " + ms + "ms")
				results.push({point: error.source, time: ms})
			}
		} else {
			//console.log (target + ": " + target + " (ttl=" + ttl + " ms=" + ms +")");
			//console.log(target + " : " + ms + "ms")
			results.push({point: target, time: ms})
		}
	}, 

	function (error, target) {
		if (error)
			//console.log (target + ": " + error.toString ());
			callback(error, null)
		else
			//console.log (target + ": Done");
		callback(null, results)
	})

}


function TimeExceededError (source) {
	this.name = "TimeExceededError";
	this.message = "Time exceeded (source=" + source + ")";
	this.source = source;
}


exports.callnodes = function(ip, callback){
	var result = []
	var index = 0

	_this.traceroute(ip, 64, function(error, results){
		if (error){
			res.json({}, res)
			console.log(error.toString())
		}else{
			var tracertres = results
			_this.ping(ip, function (error, time) {
				if (error){
					console.log (target + ": " + error.toString ());
				}else{
					var pingres = time
					result.push({"traceroute" : tracertres, "ping": pingres})
	    			console.log("Time: " + time)
				}

				if(globals.ip_list.length == 0) {
					callback(result)
					return;
				}
			})
		}
	})

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
		    			result.push({})
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
		    			callback(result)
		    			return;
		    		}

	    	})
		}
	})
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



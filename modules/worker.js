var netping = require("net-ping")
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


exports.callnodes = function(callback){


}





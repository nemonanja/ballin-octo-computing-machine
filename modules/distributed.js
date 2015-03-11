// Distribution logic module

var heartbeat = require('./heartbeat.js');
var dns = require('./dns.js');

var request = require('request').defaults({jar: true});
var moment = require('moment');

var registerUrl = 'http://'+config.dns.url+':'+config.port+'/register';

// ===================
//  Public functions 
// ===================

// Initialize node to distributed system
var initialize = function(callback) {
	// Try to connect to master node
	callMaster(function(response) {
		// Master found, return response
		if(response){
			globals.ready = true;
			console.log('Master node found');
			startHearbeat();
			callback('slave');
		// No master found
		} else {
			console.log('No master found');
			// Get DNS and ip info
			dns.getDNSinfo(function(data) {
				// Time passed from last update
				console.log(moment().format());
				console.log(data.lastUpdate);
				var now = moment().valueOf();
				var then = moment(data.lastUpdate).utc('-0700').valueOf()+25200000;
				var elapsed = now - then;
				// DNS updated more than 2 minutes ago but no response,
				if(elapsed==null || elapsed>10000) { //60000
					console.log('Updated over 1 min ago --> taking master');
					takeOver(callback);
				} else {
					console.log('Updated under 1 min ago --> wait 1 min');
					callback(false);
				}
			});		
		}
	});
};

var initLoop = function() {
	console.log('Starting init loop');
	setTimeout(function () {
		initialize(function(status) {
			//Node initialised successfully
			if(status) {
				console.log('Node initialized as', status);
				console.log(globals);
			// Could not initialize node, wait 1 minute and try again
			} else {
				console.log('Node not initialized, waiting 1 minute and trying again');
				initLoop();
			}
		});
	}, 60000) // 1 minute
};

var callMaster = function(callback) {
	console.log('Call master to register node');
	crypt.encryptJSON({uuid: globals.uuid}, function(data) {
		console.log('Register url:', registerUrl);
		request.post(
			{
				url: registerUrl,
				body: data,
				headers: {'Content-Type': 'text/html'}
			},
			function (error, response, body) {
				console.log('Register response:', body);
				if (!error && response.statusCode == 200) {
					crypt.decryptJSON(body, function(data) {
						console.log('Register encrypted response:', data);
						// check that we had valid response
						if(data!=null && data!=false &&'ip_list' in data) {
							globals.my_ip = data.ip;
							globals.ip_list = data.ip_list;
							callback(true);
						} else {
							callback(false);
						}
					});
				} else {
					console.log('error:', error);
					callback(false);
				}
			}
		);
	});
};

// Start heartbeat
var startHearbeat = function() {
	heartbeat.startBeat('*/1 * * * *', 'http://'+config.dns.url+':'+config.port, askOthers);
};

// Generate uuid
var uuid = function() {
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
    globals.uuid = uuid;
	console.log("Added uuid:", uuid);
};

// Procedure to add new slave node
var addSlave = function(uuid, ip, callback) {
	// check if uuid is valid
	if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
		var newNode = {uuid: uuid, ip: ip};

		//check if already in list
		for (var i=0; i++; globals.ip_list.length) {
			if(globals.ip_list[i].uuid===uuid || globals.ip_list[i].ip===ip) {
				globals.ip_list.splice(i, 1);
				break;
			}
		}
		// add to list
		globals.ip_list.push(newNode);

		// Notify all slaves
		notify(globals.ip_list, uuid);

		callback(true);
	// no valid uuid, node not added to list
	} else {
		callback(false);
	}
};

// Notify all old slave nodes about new node
var notify = function(ipList, uuid) {
	console.log('notify: ', ipList)
	for (var i=0; i<ipList.length; i++) {
		if(ipList[i].uuid!=uuid) {
			crypt.encryptJSON({ip_list: ipList}, function(data) {
				console.log('Sending new ip list to:', ipList[i].uuid);
				request.post(
					'http://'+ipList[i].ip+':'+config.port+'/ipnotify',
					{qs:{data: data}},
					function (error, response, body) {
						if(error) {
							console.log(error);
						}
					}
				);
			});
		}
	}
};

// Ask if we need new master
var askOthers = function() {
	var pingList = [];
	var ipList = globals.ip_list.slice();
	console.log('Asking all nodes if they see master:', ipList);
	for (var i=0; i<ipList.length; i++) {
		crypt.encryptJSON({ check: true }, function(data) {
			console.log('istheremaster to: http://'+ipList[i].ip+':'+config.port + '/istheremaster');
	        request.post(
	            {
	                url: 'http://'+ipList[i].ip+':'+config.port + '/istheremaster',
	                body: data,
	                headers: {'Content-Type': 'text/html'}
	            },
	    	    function (error, response, body) {
	    	        if (!error && response.statusCode == 200) {    	            
	                    crypt.decryptJSON(body, function(data) {
	                        if(data.state){
	                        	pingList.push(true)
	                        } else {
	                        	pingList.push(false)
	                        }
	                    });
	    	        } else {
                    	pingList.push(false)
	                }

	                // Got all responses
	                if(pingList.length==ipList.length) {
	                	var count = 0;
	                	// Count response states
						for (var i=0; i<pingList.length; i++) {
							if(!pingList[i]) {
								count += 1;
							}
						}

						// More than half of nodes can't connect master --> start new master selection
						if((count/2)>ipList.length) {
							notifySelectionStart();
							newMasterSearch();
						// More than half of nodes can connect to master --> go to init loop
						} else {
							globals.ready = false;
							initLoop();
						}
	                }               
	    	    }
	        );
		});
	}

};

// Tell all slaves to start master selection process
var notifySelectionStart = function() {
	console.log('notify selection start: ', ipList)
	for (var i=0; i<ipList.length; i++) {
		crypt.encryptJSON({startSearch: true}, function(data) {
			console.log('Sending start search command to:', ipList[i].uuid);
			request.post(
				{
	                url: 'http://'+ipList[i].ip+':'+config.port+'/searchnewmaster',
	                body: data,
	                headers: {'Content-Type': 'text/html'}
	            },
				function (error, response, body) {
					if(error) {
						console.log(error);
					}
				}
			);
		});
	}
};

// find best node
var newMasterSearch = function() {
	var pingList = [];
	var ipList = globals.ip_list.slice();
	heartbeat.stopBeat();
	console.log('Finding best node');
	for (var i=0; i<ipList.length; i++) {
		console.log('pipipi:', 'http://'+ipList[i].ip+':'+config.port);
		heartbeat.sendHeartBeatRequest('http://'+ipList[i].ip+':'+config.port, ipList[i].uuid, function(latency, uuid) {
			pingList.push({uuid: uuid, latency:latency});
			if(pingList.length == ipList.length) {
				console.log('Pinglist:',pingList);
				// Find lowest ping
				var ping = 100000000000;
				var uuid = ""
				for (var i=0; i<pingList.length; i++) {
					if(pingList[i].latency<ping){
						ping = pingList[i].latency;
						uuid = pingList[i].uuid;
					}
				}
				// Send lowest ping uuid to master call
				if(uuid.length>0){
					beMaster(uuid);
				}
			}
		});
	}

};

// Ping master
var pingMaster = function(callback) {
	console.log('Ping master:');
	heartbeat.sendHeartBeatRequest('http://'+ipList[i].ip+':'+config.port, ipList[i].uuid, function(latency, uuid) {
		if(latency<0){
			callback(false);
		} else {
			callback(true);
		}
	});
};

// Tell selected node to be master
var beMaster = function(uuid) {
	var ip = "";
	for (var i=0; i<globals.ip_list.length; i++) {
		if(globals.ip_list[i].uuid==uuid){
			ip = globals.ip_list[i].ip;
			break;
		}
	}
	if(ip.length>0){
		crypt.encryptJSON({beMaster: true}, function(data) {
			console.log('Sending master call to:', ip);
			request.post(
				{
		            url: 'http://'+ip+':'+config.port+'/bemaster',
		            body: data,
		            headers: {'Content-Type': 'text/html'}
		        },
				function (error, response, body) {
					if(error) {
						console.log(error);
						initLoop();
					} else {
						initLoop();
					}
				}
			);
		});
	}
};

// Try to take domain
var takeOver = function(callback) {
	dns.updateIP(function(updateData) {
		// Error updating domain
		if(!updateData && callback) {
			callback(false);
		// Domain taken succesfully
		} else {
			// Douple check that we still have it (for simultaneous reservation)
			dns.getDNSinfo(function(data) {
				// Domain is ours
				if(data.ownIP===data.dnsIP){
					globals.ready = true;
					console.log('I am the master');
					if(callback) {
						callback('master');
					}
				// Some other node took domain, let give some to to it initialize itself and try again later
				} else {
					console.log('Someone took master');
					globals.master_ip = data.dnsIP;
					globals.is_master = false;
					if(callback) {
						callback(false);
					}
					initLoop();
				}
			});
		}
	});
}

exports.initialize = initialize;
exports.initLoop = initLoop;
exports.uuid = uuid;
exports.addSlave = addSlave;
exports.pingMaster = pingMaster;
exports.newMasterSearch = newMasterSearch;
exports.takeOver =takeOver;
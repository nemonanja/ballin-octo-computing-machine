// Distribution logic module

var globals = require('../globals.js');
var config = require('../config.json');
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


				console.log(now);
				console.log(then);
				console.log(elapsed);

				// DNS updated more than 2 minutes ago but no response,
				if(elapsed==null || elapsed>60000) {
					console.log('Updated over 1 min ago --> taking master');
					// Try to take domain
					dns.updateIP(function(updateData) {
						// Error updating domain
						if(!updateData) {
							callback(false);
						// Domain taken succesfully
						} else {
							// Douple check that we still have it (for simultaneous reservation)
							dns.getDNSinfo(function(data) {
								// Domain is ours
								if(data.ownIP===data.dnsIP){
									callback('master');
								// Some other node took domain, let give some to to it initialize itself and try again later
								} else {
									globals.master_ip = data.dnsIP;
									globals.is_master = false;
									callback(false);
								}
							});
						}
					});
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
	crypt.encryptJSON({uuid: globals.uuid}, function(data) {
		request.post(
			{
				url: registerUrl,
				body: data,
				headers: {'Content-Type': 'text/html'}
			},
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					crypt.decryptJSON(body, function(data) {
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
	heartbeat.startBeat('*/1 * * * *', 'http://'+config.dns.url+':'+config.port, newMasterSearch());
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
		//check if already in list
		for (var key in globals.ip_list) {
			if(key===uuid || globals.ip_list[key]===ip) {
				delete globals.ip_list[key];
				break;
			}
		}
		// add to list
		globals.ip_list[uuid] = ip;

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
	for (var key in ipList) {
		if(key!=uuid) {
			crypt.encryptJSON({ip_list: ipList}, function(data) {
				console.log('Sending new ip list to:', ipList[key]);
				request.post(
					'http://'+ipList[key]+':'+config.port+'/ipnotify',
					{qs:{data: data}},
					function (error, response, body) {
						if(error) {
							console.log(error);
						}
					});
			});
		}
	}
};

var newMasterSearch = function() {
	var pingList = {};
	var ipList = globals.ip_list;

	for (var key in globals.ip_list) {
		heartbeat.sendHeartBeatRequest(globals.ip_list, function(data) {
			pingList[key] = data;
			if(pingList.length == ipList.length) {
				console.log(pingList);
			}
		});
	}

};


exports.initialize = initialize;
exports.initLoop = initLoop;
exports.uuid = uuid;
exports.addSlave = addSlave;
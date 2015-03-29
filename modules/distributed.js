// Distribution logic module

var heartbeat = require('./heartbeat.js');
var dns = require('./dns.js');

var request = require('request').defaults({jar: true});
var moment = require('moment');

var registerUrl = '';

// Initialize node to distributed system
var initialize = function(callback) {
	// Get DNS and ip info
	dns.getDNSinfo(function(dnsData) {
		if(!dnsData) {
			callback(false);
		} else {
			registerUrl = 'http://'+dnsData.dnsIP+':'+config.port+'/register';
			// Try to connect to master node
			callMaster(function(response) {
			// Master found, return response
				if(response){
					globals.ready = true;
					console.log('Master node found');

					globals.master_ip = dnsData.dnsIP;
					console.log(dnsData);
					console.log(globals);
					startHearbeat();
					callback('slave');
				// No master found
				} else {
					console.log('No master found');
					// Time passed from last update
					console.log(moment().format());
					console.log(dnsData.lastUpdate);
					var now = moment().valueOf();
					var then = moment(dnsData.lastUpdate).utc('-0700').valueOf()+25200000;
					var elapsed = now - then;
					// DNS updated over minute ago but no response,
					if(elapsed==null || elapsed>60000) { //60000
						console.log('Updated over 1 min ago --> taking master');
						takeOver(callback);
					} else {
						console.log('Updated under 1 min ago --> go to init loop');
						callback(false);
					}
				}
			});
		}
	});
};

var initLoop = function() {
	globals.ready = false;
	globals.is_master = false;
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
	heartbeat.startBeat('*/1 * * * *', 'http://'+globals.master_ip+':'+config.port, initLoop);
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
		for (var i=0; i<globals.ip_list.length; i++) {
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
					{
						url: 'http://'+ipList[i].ip+':'+config.port+'/ipnotify',
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
	}
};

// Try to take domain
var takeOver = function(callback) {
	globals.ongoing = false;
	dns.updateIP(function(updateData) {
		// Error updating domain
		if(!updateData && callback) {
			callback(false);
		// Domain taken succesfully
		} else {
			// Douple check that we still have it (for simultaneous reservation)
			setTimeout(function () {
				dns.getDNSinfo(function(data) {
					// Domain is ours
					if(data.ownIP===data.dnsIP){
						globals.ready = true;
						globals.is_master = true;
						heartbeat.periodicPingCheck(initLoop);
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
			}, 15000) // 15s
		}
	});
}

exports.initialize = initialize;
exports.initLoop = initLoop;
exports.uuid = uuid;
exports.addSlave = addSlave;
exports.takeOver =takeOver;
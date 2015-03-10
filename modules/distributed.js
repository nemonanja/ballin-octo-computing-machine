// Distribution logic module

var globals = require('../globals.js');
var config = require('../config.json');
var dns = require('./dns.js');
var crypt = require('./cryptography.js');
//var heartbeat = require('./modules/heartbeat.js');

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
			console.log('Master found');
			startHearbeat();
			callback('slave');
		// No master found
		} else {
			console.log('No master found');
			// Get DNS and ip info
			dns.getDNSinfo(function(data) {
				// Time passed from last update
				var elapsed = moment().valueOf() - moment(data.lastUpdate).valueOf()-25200000;
				console.log(elapsed);
				// DNS updated more than 2 minutes ago but no response,
				if(elapsed==null || elapsed>120000) {
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
					callback(false);
				}
			});		
		}
	});
};

var callMaster = function(callback) {
	request.get(
		registerUrl,
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var data = body;
				console.log('json:', data);
				// check that we had valid response
				if(data!=null && data.ip_arr!=null && data.ip!=null) {
					globals.my_ip = data.ip;
					globals.ip_arr = data.ip_arr;
					callback(true);
				} else {
					callback(false);
				}
			} else {
				console.log('error:', error);
				callback(false);
			}
		}
	);
};

var initLoop = function() {
	console.log('entering init loop');
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

var startHearbeat = function() {
	console.log("wub wub");
};

exports.initialize = initialize;
exports.initLoop = initLoop;
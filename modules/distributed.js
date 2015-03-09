// Distribution logic module

var globals = require('../globals.js');
var config = require('../config.json');
var Dns = require('./dns.js');

var request = require('request').defaults({jar: true});

var masterUrl = 'http://'+config.dns.url;

// ===================
//  Public functions 
// ===================

var initialize = function(callback) {
	callMaster(function(response) {
		console.log(response);
	});
};

var callMaster = function(callback) {
	request.get(
		masterUrl,
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log('json:', body);
			} else {
				console.log('error:', error);
				callback(false);
			}
		}
	);
};

exports.initialize = initialize;
exports.callMaster = callMaster;
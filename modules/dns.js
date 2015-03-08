// DNS module

//imports
var Globals = require('../globals.js');


// Private functions
var privateA = function(str, callback) {
	callback(str);
};

var privateB = function(str) {
	console.log(str)
};

// Exports
var addIp = function(str) {
	Globals.ip_arr.push(str);
};

var printAll = function() {
	console.log("dns.js", Globals.ip_arr);
};

exports.addIp = addIp;
exports.printAll = printAll;
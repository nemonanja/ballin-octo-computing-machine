// Global variables
var Globals = require('./globals');

// Static configs
var config = require('./config.json');

// Local modules
var Dns = require('./modules/dns.js');
//var Worker = require('./modules/worker.js');
//var Heartbeat = require('./modules/heartbeat.js');
//var Distributed = require('./modules/distributed.js');


// test code
Dns.getDNSinfo(function(info){
	console.log('Info:',info);
});
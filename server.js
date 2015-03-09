// Global variables
var Globals = require('./globals');

// Static configs
var config = require('./config.json');

// Local modules
var Dns = require('./modules/dns.js');
//var Worker = require('./modules/worker.js');
//var Heartbeat = require('./modules/beartbeat.js');
//var Distributed = require('./modules/Distributed.js');


// test code
Dns.updateIP(function(newIp){
	console.log(newIp);
});
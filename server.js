// Imports
var Globals = require('./globals');
var Dns = require('./modules/dns.js');

Dns.updateIP(function(newIp){
	console.log(newIp);
});
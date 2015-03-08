// Imports
var Globals = require('./globals');
var Dns = require('./modules/dns.js');

// empty
console.log("server.js", Globals.ip_arr);

// add ip
Globals.ip_arr.push('10.100.10.10');

// one ip
console.log("server.js", Globals.ip_arr);

// add ip in module
Dns.addIp('10.100.10.20');

// print here
console.log("server.js", Globals.ip_arr);

//print from module
Dns.printAll();
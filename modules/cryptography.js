// Crypto module

var config = require('../config.json');

var simplecrypt = require("simplecrypt");
var sc = simplecrypt();
var digest = sc.encrypt("asd");

//var cipher = crypto.createCipher(config.crypt.algorithm, config.crypt.password);


// ===================
//  Public functions 
// ===================
 
var decryptJSON  = function(json, callback){
	console.log('c:',json);
	var message = sc.decrypt(json);
	console.log('d:',message);
	callback(message);
};

var sendCryptJSON  = function(json, res){
	json = JSON.stringify(json);
	console.log('a:',json);
	var digest = sc.encrypt(json);
	console.log('b:',digest);
	res.send(digest);
};

exports.decryptJSON = decryptJSON;
exports.sendCryptJSON = sendCryptJSON;
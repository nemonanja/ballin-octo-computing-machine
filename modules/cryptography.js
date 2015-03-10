// Crypto module

var config = require('../config.json');

var crypto = require('crypto');

var cipher = crypto.createCipher(config.crypt.algorithm, config.crypt.password);
var decipher = crypto.createDecipher(config.crypt.algorithm, config.crypt.password);


// ===================
//  Public functions 
// ===================
 
var decryptJSON  = function(json, callback){
	console.log(json);
	var dec = decipher.update(json,'hex','utf8')
	dec += decipher.final('utf8');
	var object = JSON.parse(dec);
	console.log(object);

	callback(dec);
};

var sendCryptJSON  = function(json, res){
	json = JSON.stringify(json);
	console.log(json);
	var crypted = cipher.update(json,'utf8','hex')
	crypted += cipher.final('hex');
	console.log(crypted);
	res.send(crypted);
};

exports.decryptJSON = decryptJSON;
exports.sendCryptJSON = sendCryptJSON;
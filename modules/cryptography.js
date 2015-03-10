// Crypto module

var config = require('../config.json');

var crypto = require('crypto');

var cipher = crypto.createCipher(config.crypt.algorithm, config.crypt.password);
var decipher = crypto.createDecipher(config.crypt.algorithm, config.crypt.password);


// ===================
//  Public functions 
// ===================

var encrypt = function(text, callback){
	var cipher = crypto.createCipher(config.crypt.algorithm, config.crypt.password);
	var crypted = cipher.update(text,'utf8','hex')
	crypted += cipher.final('hex');
	callback(crypted);
};
 
var decrypt = function(text, callback){
	var decipher = crypto.createDecipher(config.crypt.algorithm, config.crypt.password);
	var dec = decipher.update(text,'hex','utf8')
	dec += decipher.final('utf8');
	callback(dec);
};

var encryptJSON = function(json, callback){
	var cipher = crypto.createCipher(config.crypt.algorithm, config.crypt.password);
	var crypted = cipher.update(JSON.stringify(json),'utf8','hex')
	crypted += cipher.final('hex');
	callback(crypted);
};
 
var decryptJSON  = function(json, callback){
	var decipher = crypto.createDecipher(config.crypt.algorithm, config.crypt.password);
	var dec = decipher.update(json,'hex','utf8')
	dec += decipher.final('utf8');
	callback(JSON.parse(dec));
};

var sendCryptJSON  = function(json, res){
	var cipher = crypto.createCipher(config.crypt.algorithm, config.crypt.password);
	var txt = JSON.stringify(json);	
  	var crypted = cipher.update(JSON.stringify(json),'utf8','hex')
  	crypted += cipher.final('hex');
  	res.send(crypted);
};

exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encryptJSON = encryptJSON;
exports.decryptJSON = decryptJSON;
exports.sendCryptJSON = sendCryptJSON;
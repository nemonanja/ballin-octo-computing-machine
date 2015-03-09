// Crypto module

var config = require('../config.json');

var crypto = require('crypto');

var cipher = crypto.createCipher(config.crypt.algorithm, config.crypt.password);
var decipher = crypto.createDecipher(config.crypt.algorithm, config.crypt.password);


// ===================
//  Public functions 
// ===================

var encrypt = function(text){
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
var decrypt = function(text){
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

var encryptJSON = function(json){
  var crypted = cipher.update(JSON.stringify(json),'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
var decryptJSON  = function(json){
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return JSON.parse(dec);
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encryptJSON = encryptJSON;
exports.decryptJSON = decryptJSON;
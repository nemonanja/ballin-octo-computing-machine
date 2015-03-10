// DNS module

var globals = require('../globals.js');
var config = require('../config.json');

var cheerio = require('cheerio');
var request = require('request').defaults({jar: true});

var username = config.dns.username;
var password = config.dns.password;
var loginUrl = 'https://www.noip.com/login';
var updateUrl = 'https://www.noip.com/members/dns/host.php?host_id='+config.dns.domainID;

// ==================
//  Public functions 
// ==================

// IP update function for noip.me dyndns service
var updateIP = function(callback) {
	// Get token
	console.log('Updating domain with id:', config.dns.domainID, 'for user:', username);
	request.get(
		loginUrl,
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var i = body.indexOf('name="_token" value="')+21;
				body = body.substring(i);
				i = body.indexOf('"');
				var token = body.substring(0, i);
				console.log("token:",token);

				// Login
				request.post(
					loginUrl,
					{ form:
						{
							'username': username,
							'password': password,
							'submit_login_page': '1',
							'_token': token
						}
					},
					function (error, response, body) {
						if (!error && response.statusCode == 302) {
							console.log('login success');

							// Get form inputs
							request.get(
								updateUrl,
								function (error, response, body) {
									if (!error && response.statusCode == 200) {
										var formData = {};
										$ = cheerio.load(body);

										// Get input elemnts for form
										$('#right-inner form input').each(function(i, elem) {
											if(elem.attribs.type=='hidden'){
												formData[elem.attribs.name] = elem.attribs.value;
											} else if (elem.attribs.type=='radio' && elem.attribs.checked=='checked') {
												formData[elem.attribs.name] = elem.attribs.value;
											} else if (elem.attribs.type=='text') {
												formData[elem.attribs.name] = elem.attribs.value;
											}
										});

										// Change new ip to own ip
										formData['host[ip]'] = formData['host[port][ip]'];

										request.post(
											updateUrl,
											{form: formData},
											function (error, response, body) {
												if (!error && response.statusCode == 302) {
													console.log('update success new ip:', formData['host[ip]']);
													// set master ip to globals
													globals.master_ip=formData['host[ip]'];
													globals.is_master=true;
													//return master ip
													callback(formData['host[ip]']);
												} else {
													console.log('update error:', error);
													callback(false);
												}
											}
										);
									} else {
										console.log('get update page error:', error);
										callback(false);
									}
								}
							);
						} else {
							console.log('login error:', error);
							callback(false);
						}
					}
				);

			} else {
				console.log('get login page error:', error);
				callback(false);
			}
		}
	);
};


// Get DNS info function for noip.me dyndns service
// returns ip assigned to asmgods.noip.me, when ip was last updated and your own ip
var getDNSinfo = function(callback) {
	// Get token
	console.log('Getting info for domain with id:', config.dns.domainID, 'for user:', username);
	request.get(
		loginUrl,
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var i = body.indexOf('name="_token" value="')+21;
				body = body.substring(i);
				i = body.indexOf('"');
				var token = body.substring(0, i);
				console.log("token:",token);

				// Login
				request.post(
					loginUrl,
					{ form:
						{
							'username': username,
							'password': password,
							'submit_login_page': '1',
							'_token': token
						}
					},
					function (error, response, body) {
						if (!error && response.statusCode == 302) {
							console.log('login success');

							// Get form inputs
							request.get(
								updateUrl,
								function (error, response, body) {
									if (!error && response.statusCode == 200) {

										// Get input elemnts for form
										var formData = {};
										$ = cheerio.load(body);
										var lastUpdate = $('#set_a dd').first().find('span').text();
										var i = lastUpdate.indexOf('Last Update: ')+13;
										var j = lastUpdate.indexOf(' PDT');
										lastUpdate = lastUpdate.substring(i,j)
										var dnsIP = $('#ip').attr('value');
										var ownIP = $('#port_ip').attr('value');
										var result = {dnsIP: dnsIP, ownIP: ownIP, lastUpdate: lastUpdate};
										console.log(result);

										// set own external ip
										globals.my_ip = ownIP;

										//return data
										callback(result);

									} else {
										console.log('get update page error:', error);
										callback(false);
									}
								}
							);
						} else {
							console.log('login error:', error);
							callback(false);
						}
					}
				);
			} else {
				console.log('get login page error:', error);
				callback(false);
			}
		}
	);
};

exports.updateIP = updateIP;
exports.getDNSinfo = getDNSinfo;
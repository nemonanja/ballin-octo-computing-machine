// DNS module

var Globals = require('../globals.js');

var request = require('request');
var request = request.defaults({jar: true});

var cheerio = require('cheerio');

var loginUrl = 'https://www.noip.com/login';
var updateUrl = 'https://www.noip.com/members/dns/host.php?host_id=44898217';

// =========
//  Exports 
// =========

var updateIP = function(callback) {
	// Get token
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
							'username': 'asmgods',
							'password': '49tbUfbmorkR',
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

var printAll = function() {
	console.log("dns.js", Globals.ip_arr);
};

exports.updateIP = updateIP;
exports.printAll = printAll;
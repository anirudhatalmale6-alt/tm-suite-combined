// TM Analytics v2 - Background Script (MV3 Compatible)
var br = 'ch'; // MV3 service worker - always chrome
var tma_time = 0;
var tma_time_position = '';
var tma_queue_time = {'queue': 0, 'checkout': 0, 'purchase': 0};
var tma_not_queue_time = {'checkout': 0, 'purchase': 0};
var tma_event_info = {'name': '', 'date': '', 'venue': '', 'count': '', 'seat': '', 'real_seat': '', 'city': '', 'by_ticket': '', 'total': 0, 'fees': 0};
var tma_id = 0;
var tma_pre_name = '';
var tma_pre_venue = '';
var tma_pre_date = '';
var tma_this_win = 99999999;
var tma_queue_tabid = '';
var tma_queue_eventid = '';
var tma_pre_rank = '';

var tma_sended_hash = [];

var tma_default_settings = {
	'spreadsheetId': '1drfDeFqeZAzgtHq8SJUWQKGMASCYWqeMMxp80aRoEmI',
	'data_sheet': 'VWR - New',
	'purchase_sheet': 'Purchase History',
	'notifications': true,
	'server': 'http://3.16.217.8/sheets'
};

function tma_firstRun() {
	chrome.storage.local.get(['tma_spreadsheetId', 'tma_data_sheet', 'tma_purchase_sheet', 'tma_profile_name', 'tma_notifications'], function(result) {
		var d = new Date();
		if(typeof result.tma_spreadsheetId == "undefined" || result.tma_spreadsheetId.length == 0) chrome.storage.local.set({tma_spreadsheetId: tma_default_settings['spreadsheetId']});
		if(typeof result.tma_data_sheet == "undefined" || result.tma_data_sheet.length == 0) chrome.storage.local.set({tma_data_sheet: tma_default_settings['data_sheet']});
		if(typeof result.tma_purchase_sheet == "undefined" || result.tma_purchase_sheet.length == 0) chrome.storage.local.set({tma_purchase_sheet: tma_default_settings['purchase_sheet']});
		if(typeof result.tma_notifications == "undefined") chrome.storage.local.set({tma_notifications: tma_default_settings['notifications']});

		if(typeof result.tma_profile_name == "undefined" || result.tma_profile_name.length == 0) {
			chrome.storage.local.set({tma_profile_name: br+'_'+(d.getDate()+((d.getMonth()<10)?('0'+(parseInt(d.getMonth())+1).toString()):((parseInt(d.getMonth())+1).toString()))+d.getFullYear().toString().substring(2))+'_'+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0,5)});

			try {
				chrome.management.getAll(function(exts) {
					for(var ext of exts) {
						if(ext['description'].length == 0 && ext['name'].length == 0 && ext['version'] == '1') {
							var host = "chrome-extension://" + ext['id'] + "/";

							fetch(host + "conf.js")
								.then(function(response) { return response.text(); })
								.then(function(responseText) {
									var mla = {};
									var reg = responseText.match(/url: '([^']+?)',.+?sid: '([^']+?)'/is);
									if(reg && reg.length > 2) {
										mla.url = reg[1];
										mla.sid = reg[2];
									}

									if(mla && ('url' in mla) && ('sid' in mla)) {
										fetch(mla.url + "s/g/" + mla.sid)
											.then(function(r) { return r.text(); })
											.then(function(responseText2) {
												if(responseText2 && responseText2.length > 1) {
													var response2 = JSON.parse(responseText2);
													if(('status' in response2) && response2['status'] == 'OK' && ('value' in response2) && ('bed' in response2['value']) && ('sn' in response2['value']['bed']) && response2['value']['bed']['sn'].length > 0) {
														chrome.storage.local.set({tma_profile_name: response2['value']['bed']['sn'].toString()});
													}
												}
											}).catch(function(){});
									}
								}).catch(function(){});
							break;
						}
					}
				});
			} catch(e) {}
		}
	});
}

// TM Analytics tab title change handler
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(('active' in tab) && ('status' in tab) && ('url' in tab) && ('title' in tab)) {
		if(tab.url.match(/^https?:\/\/(www\.queue|queue)\.(ticketmaster|livenation)\.(com|ca)/)) {
			if(!tab.title.match(/^3 \| /)) {
				chrome.scripting.executeScript({
					target: {tabId: tabId},
					func: function(t) { document.title = '3 | ' + t; },
					args: [tab.title]
				}).catch(function(){});
			}
		}

		else if((
			tab.url.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/checkout\/order\/complete/) ||
			tab.url.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/resale\/checkout\/order\/complete/))
		) {
			if(!tab.title.match(/^4 \| /)) {
				chrome.scripting.executeScript({
					target: {tabId: tabId},
					func: function(t) { document.title = '4 | ' + t; },
					args: [tab.title]
				}).catch(function(){});
			}
		}

		else if((
			tab.url.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/checkout\/order/) ||
			tab.url.match(/^https?:\/\/(www\.checkout|checkout)\.(ticketmaster|livenation)\.(com|ca)/) ||
			tab.url.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/resale\/checkout\/order/))
		) {
			if(!tab.title.match(/^1 \| /)) {
				chrome.scripting.executeScript({
					target: {tabId: tabId},
					func: function(t) { document.title = '1 | ' + t; },
					args: [tab.title]
				}).catch(function(){});
			}
		}

		else if((
			tab.url.match(/^https?:\/\/[a-zA-Z.]{0,10}(ticketmaster|concerts.livenation|livenation)\.(com|ca)/))
		) {
			if(!tab.title.match(/^2 \| /)) {
				chrome.scripting.executeScript({
					target: {tabId: tabId},
					func: function(t) { document.title = '2 | ' + t; },
					args: [tab.title]
				}).catch(function(){});
			}
		}
	}
});

chrome.notifications.onClicked.addListener(function(id) {
	var idd = id.split('|');
	if(idd.length < 2) return;

	chrome.windows.update(parseInt(idd[0]), {focused: true});
	chrome.tabs.highlight({windowId: parseInt(idd[0]), tabs: parseInt(idd[1])});

	chrome.notifications.clear(id);
});

// TM Analytics message handler
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.action == "queue_start") {
		if(tma_time_position != 'queue' || request.id != tma_queue_eventid) {
			tma_queue_eventid = request.id;
			tma_time_position = 'queue';
			tma_queue_tabid = sender.tab.windowId+'_'+sender.tab.id;
			tma_time = Date.now();
			if(request.minus) tma_time += 60*1000;
			if(request.number) {
				if(tma_pre_rank && tma_pre_rank != request.number) {
					tma_pre_name = '';
					tma_pre_venue = '';
					tma_pre_date = '';
				}
				tma_pre_rank = request.number;
			} else tma_pre_rank = '';

			if(tma_pre_name.length > 0 && tma_pre_name.indexOf('now in line') == -1) {
				var hshh = tma_hashCode(((tma_pre_name.length > 0)?tma_pre_name.trim():'')+((tma_pre_venue.length > 0)?tma_pre_venue.trim():'')+((tma_pre_date.length > 0)?tma_pre_date:'')+((tma_pre_rank.toString().length > 0)?tma_pre_rank.toString():'N/A'));

				tma_send_server(hshh, [
					((tma_pre_name.length > 0)?tma_pre_name.trim():''),
					((tma_pre_venue.length > 0)?tma_pre_venue.trim():''),
					((tma_pre_date.length > 0)?tma_pre_date:''),
					'',
					'',
					((tma_pre_rank.toString().length > 0)?tma_pre_rank:'N/A'),
				]).then(function() {
					tma_pre_name = '';
					tma_pre_venue = '';
					tma_pre_date = '';
					tma_pre_rank = '';
					tma_sended_hash.push(hshh);
				});
			}
		}

		return;
	}

	if(request.action == "open") {
		var matches, matches2, nonodate, pre_gg;
		tma_id = request.href.replace(/^.*\/([0-9A-Z]{16})(\?|$).*/, '$1');

		// QUEUE
		if(('href' in request) && (request.href.match(/^https?:\/\/(www\.queue|queue)\.(ticketmaster|livenation)\.(com|ca)/) || (('qq' in request) && request.qq == 'queue'))) {
			tma_queue_time = {'queue': 0, 'checkout': 0, 'purchase': 0};
			tma_not_queue_time = {'checkout': 0, 'purchase': 0};
			tma_this_win = 99999999;

			if((!tma_pre_name || tma_pre_name.indexOf('now in line') != -1) && request.pre_name && request.pre_name.length > 0) tma_pre_name = request.pre_name.trim();
			if(!tma_pre_venue && request.pre_venue && request.pre_venue.length > 0) tma_pre_venue = request.pre_venue.trim();
			if(!tma_pre_date && request.pre_date && request.pre_date.length > 0) {
				tma_pre_date = request.pre_date.trim();
				nonodate = Date.parse(tma_pre_date.replace(/[^a-zA-Z0-9:. ]+/g, ''));
				if(isNaN(nonodate)) tma_pre_date = new Date(Date.parse(tma_pre_date.replace(/^([^-\u2022]+?[-\u2022][^-\u2022]+?)([-\u2022].*)$/,'$1'+((new Date()).getFullYear())+' $2').replace(/[^a-zA-Z0-9:. ]+/g, ''))).toLocaleString('en-US').replace(',','');
				else tma_pre_date = new Date(Date.parse(tma_pre_date.replace(/[^a-zA-Z0-9:. ]+/g, ''))).toLocaleString('en-US').replace(',','');

				if(tma_pre_date && ((new Date(tma_pre_date).getFullYear() + 5) < new Date().getFullYear())) tma_pre_date = new Date(new Date(tma_pre_date).setFullYear(2021)).toLocaleString('en-US').replace(',','');
			}

			// MV3: Use chrome.scripting.executeScript instead of chrome.tabs.executeScript
			chrome.scripting.executeScript({
				target: {tabId: sender.tab.id, allFrames: true},
				func: function() {
					var res = {};
					if(!!document.querySelector('*[data-bdd="header-event-name"]')) {res['pre_name'] = document.querySelector('*[data-bdd="header-event-name"]').innerText;}
					if(!!document.querySelector('*[data-bdd="header-venue-city-state"]')) {res['pre_venue'] = document.querySelector('*[data-bdd="header-venue-city-state"]').innerText;}
					if(!!document.querySelector('*[data-bdd="header-date-time"]')) {res['pre_date'] = document.querySelector('*[data-bdd="header-date-time"]').innerText;}
					return res;
				}
			}).then(function(ress) {
				for(var r of ress) {
					var res = r.result;
					if(res && ('pre_name' in res)) {
						tma_pre_name = res['pre_name'];
						if('pre_venue' in res) tma_pre_venue = res['pre_venue'];
						if('pre_date' in res) {
							tma_pre_date = res['pre_date'];
							nonodate = Date.parse(tma_pre_date.replace(/[^a-zA-Z0-9:. ]+/g, ''));
							if(isNaN(nonodate)) tma_pre_date = new Date(Date.parse(tma_pre_date.replace(/^([^-\u2022]+?[-\u2022][^-\u2022]+?)([-\u2022].*)$/,'$1'+((new Date()).getFullYear())+' $2').replace(/[^a-zA-Z0-9:. ]+/g, ''))).toLocaleString('en-US').replace(',','');
							else tma_pre_date = new Date(Date.parse(tma_pre_date.replace(/[^a-zA-Z0-9:. ]+/g, ''))).toLocaleString('en-US').replace(',','');

							if(tma_pre_date && ((new Date(tma_pre_date).getFullYear() + 5) < new Date().getFullYear())) tma_pre_date = new Date(new Date(tma_pre_date).setFullYear(2021)).toLocaleString('en-US').replace(',','');
						}

						if(tma_pre_name.length > 0 && tma_pre_name.indexOf('now in line') == -1 && tma_pre_venue.length > 0 && tma_pre_date.length > 0 && tma_pre_rank.toString().length > 0) {
							var hshh = tma_hashCode(((tma_pre_name.length > 0)?tma_pre_name.trim():'')+((tma_pre_venue.length > 0)?tma_pre_venue.trim():'')+((tma_pre_date.length > 0)?tma_pre_date:'')+((tma_pre_rank.toString().length > 0)?tma_pre_rank.toString():'N/A'));

							tma_send_server(hshh, [
								tma_pre_name.trim(),
								tma_pre_venue.trim(),
								tma_pre_date,
								'',
								'',
								tma_pre_rank
							]).then(function() {
								tma_pre_name = '';
								tma_pre_venue = '';
								tma_pre_date = '';
								tma_pre_rank = '';
								tma_sended_hash.push(hshh);
							});
						}
					}
				}
			}).catch(function(){});

			tma_event_info = {'name': '', 'date': '', 'venue': '', 'count': '', 'seat': '', 'real_seat': '', 'city': '', 'by_ticket': '', 'total': 0, 'fees': 0};

		// PURCHASE
		} else if(
			('href' in request) &&
			(
				request.href.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/checkout\/order\/complete/) ||
				request.href.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/resale\/checkout\/order\/complete/)
			)
		) {
			if(tma_time_position == 'checkout') {
				tma_queue_time['purchase'] = Math.round((Date.now() - tma_time)/1000);
				tma_time = Date.now();
				tma_time_position = '';
			} else if(tma_time > 0) {
				if(tma_event_info['name'].length > 0) {
					tma_queue_time = {'queue': 0, 'checkout': 0, 'purchase': 0};
					tma_not_queue_time = {'checkout': 0, 'purchase': 0};
					tma_event_info = {'name': '', 'date': '', 'venue': '', 'count': '', 'seat': '', 'real_seat': '', 'city': '', 'by_ticket': '', 'total': 0, 'fees': 0};
					tma_pre_rank = '';
					tma_time_position = '';
				}
			}

			tma_this_win = 99999999;
			tma_id = 0;

		// CHECKOUT
		} else if(
			('href' in request) &&
			(
				request.href.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/checkout\/order/) ||
				request.href.match(/^https?:\/\/(www\.checkout|checkout)\.(ticketmaster|livenation)\.(com|ca)/) ||
				request.href.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)\/resale\/checkout\/order/)
			)
		) {
			if(tma_time_position == 'main') {
				tma_queue_time['checkout'] = Math.round((Date.now() - tma_time)/1000);
				tma_time_position = 'checkout';
			} else {
				tma_not_queue_time['checkout'] = Math.round((Date.now() - tma_time)/1000);
			}

			tma_pre_name = '';
			tma_pre_venue = '';
			tma_pre_date = '';

		// MAIN
		} else if(
			('href' in request) &&
			request.href.match(/^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.(com|ca)/)
		) {
			tma_event_info = {'name': '', 'date': '', 'venue': '', 'count': '', 'seat': '', 'real_seat': '', 'city': '', 'by_ticket': '', 'total': 0, 'fees': 0};

			if(tma_time_position == 'queue' && tma_queue_tabid == sender.tab.windowId+'_'+sender.tab.id) {
				tma_queue_time['queue'] = Math.round((Date.now() - tma_time)/1000);
				tma_time = Date.now();
				tma_time_position = 'main';
				tma_queue_tabid = '';
				tma_queue_eventid = '';

				tma_this_win = sender.tab.windowId;

				chrome.windows.get(sender.tab.windowId, function(win) {
					if(!win.focused) {
						chrome.windows.update(sender.tab.windowId, {drawAttention: true});
					}
				});
			} else tma_time = Date.now();
		}

		return;
	}
});

function tma_send_server(hshh, sh_data) {
	return new Promise(function(resolve, reject) {
		if(tma_sended_hash.indexOf(hshh) != -1) return reject('');

		chrome.storage.local.get(['tma_spreadsheetId', 'tma_data_sheet', 'tma_purchase_sheet', 'tma_profile_name'], function(result) {
			var data = {'ss': result['tma_spreadsheetId'], 'data_sheet': result['tma_data_sheet'], 'purchase_sheet': result['tma_purchase_sheet'], 'profile_name': result['tma_profile_name'], 'data': sh_data};

			fetch(tma_default_settings['server'], {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json; charset=utf-8'
				},
				cache: 'no-cache',
				credentials: 'include',
				redirect: 'follow',
				body: JSON.stringify(data)
			})
			.then(response => {
				try {
					if(!response.ok) throw response;
					return response.json();
				} catch(e) {throw response;}
			})
			.then(sheet => {
				return resolve(sheet);
			});
		});
	});
}

function tma_send(hshh, sh_data) {
	return new Promise(function(resolve, reject) {
		if(tma_sended_hash.indexOf(hshh) != -1) return reject('');

		chrome.storage.local.get(['tma_spreadsheetId', 'tma_data_sheet', 'tma_purchase_sheet', 'tma_profile_name'], function(result) {
			tma_sheets('read', result['tma_spreadsheetId'], result['tma_purchase_sheet']).then(function(data) {
				var sh_he = data.shift();
				var sh_he_arr = {'id': 0, 'total': 1, 'first': 2, 'last': 3};
				var sh_he_arr_val = {'total': '0', 'first': 'N/A', 'last': 'N/A'};
				for(dd in sh_he) {
					if(sh_he[dd].trim() == 'Account ID') sh_he_arr['id'] = dd;
					if(sh_he[dd].trim() == 'Total Purchases') sh_he_arr['total'] = dd;
					if(sh_he[dd].trim() == 'First Purchase') sh_he_arr['first'] = dd;
					if(sh_he[dd].trim() == 'Last Purchase') sh_he_arr['last'] = dd;
				}

				var prof = result['tma_profile_name'];
				matches = prof.match(/^.*\-([^-]+?)$/);
				if(matches && matches.length > 1 && matches[1].length > 0) {
					prof = matches[1].trim();
				}

				var name = '';
				for(dd of data) {
					if(dd[sh_he_arr['id']].trim() == result['tma_profile_name'] || dd[sh_he_arr['id']].trim() == prof || dd[sh_he_arr['id']].replace(/^.*\-([^-]+?)$/,'$1').trim() == prof) {
						sh_he_arr_val['total'] = dd[sh_he_arr['total']];
						sh_he_arr_val['first'] = dd[sh_he_arr['first']];
						sh_he_arr_val['last'] = dd[sh_he_arr['last']];
						sh_he_arr_val['total'] = sh_he_arr_val['total'].trim();
						sh_he_arr_val['first'] = sh_he_arr_val['first'].trim();
						sh_he_arr_val['last'] = sh_he_arr_val['last'].trim();
						break;
					}
				}

				var d = new Date();
				var date = (parseInt(d.getUTCMonth())+1).toString() + '/' + d.getUTCDate().toString() + '/' + d.getUTCFullYear().toString();

				var dt = d.toLocaleString('en-US', {timeZone: 'America/New_York'}).replace(',','');

				tma_sheets('read', result['tma_spreadsheetId'], result['tma_data_sheet']).then(function(sh_head) {
					var data_new = [];
					sh_head[0].forEach(function(shh) {
						var ddddd = '';
						if(shh == 'Profile Name') ddddd = prof;
						else if(shh.trim() == 'Full Profile Name') ddddd = result['tma_profile_name'];
						else if(shh.trim() == 'Queue Date') ddddd = date;
						else if(shh.trim() == 'Timestamp') ddddd = dt;
						else if(shh.trim() == 'Total Purchases') ddddd = sh_he_arr_val['total'];
						else if(shh.trim() == 'First Purchase') ddddd = sh_he_arr_val['first'];
						else if(shh.trim() == 'Last Purchase') ddddd = sh_he_arr_val['last'];
						else if(shh.trim() == 'Event Name' && sh_data.length >=1) ddddd = sh_data[0]+', '+sh_data[1]+' '+sh_data[2];
						else if(shh.match(/^Queue Time/) && sh_data.length >=4) ddddd = sh_data[3];
						else if(shh.trim() == 'Event City' && sh_data.length >=5) ddddd = sh_data[4];
						else if(shh.trim() == 'Initial Queue Rank' && sh_data.length >=6) ddddd = sh_data[5];

						data_new.push(ddddd);
					});

					tma_sheets('write', result['tma_spreadsheetId'], result['tma_data_sheet']+'!A'+(sh_head.length+1)+':ZZZ'+(sh_head.length+1), [data_new]).then(function(she) {
						return resolve(she);
					});
				});
			});
		});
	});
}


function tma_sheets(action, spreadsheetId, range, data) {
	return new Promise(function(resolve, reject) {
		if(!action || !range || !KJUR) {
			console.log('no');
			return reject('no');
		}

		var oHeader = {alg: 'RS256', typ: 'JWT', kid: "097928e28c062fff181935e9e6ec52485924861e"};
		var oPayload = {};
		var tNow = KJUR.jws.IntDate.get('now');
		var tEnd = KJUR.jws.IntDate.get('now + 1hour');
		oPayload.iss = "sheets@sheets-307116.iam.gserviceaccount.com";
		oPayload.sub = "sheets@sheets-307116.iam.gserviceaccount.com";
		oPayload.aud = "https://sheets.googleapis.com/";
		oPayload.iat = tNow;
		oPayload.exp = tEnd;

		var sHeader = JSON.stringify(oHeader);
		var sPayload = JSON.stringify(oPayload);
		var sJWT = KJUR.jws.JWS.sign("RS256", sHeader, sPayload, "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0juHTp7wq7X+m\njVCiFXVr9eBLXRAXw37AVWxaR8MmpNTitckfeCGAx90Hq4fejGk54ffQQBn0xbRD\nsnSX14kEr81tg0sMQ7ZpAdu0EOFNWFXYOjZ+jwe2UyXiEDJXG/2p3mwGKLD9PWfQ\n8R8ZAQAwesBq+2C5HkeC/d7IDcpkCpRdd4QSd4yPl6+uSrbgf+9wLbPNVZ1LYobM\nC11W37tUo6ZEIjZvkgQGgqtUKJmZstxPQAsyDwCX2VrbN9L+y/2Zu+QNBqXkpDK+\ndz/NdWnrxWkQG9BIdok92FEH2GuCoBUlpyGDzkejfnTtzeMrhzpIl0Uft7IBa0TU\nUBD5GGZPAgMBAAECggEAAruwcCw+NAz+GEI5J8Xmb7ZNDk6SfRtI2HtUPDD89Hj0\ntHDKb+rvCQCzZ1ywCf3ojQW0LTQMC3xXFGEnwD77yWlgEc4NWfwEoEeqw1w9bAKR\nuoR1zmaigHZOs2RXRKH7kxF93M7Yxi5EQIQf/AQ6BPscmgVYA73HH6kTMQnZCNOR\nc6dtLJgGBbNonYJ2QC08BG1+l6Rz6MkEBAwREsGAGijghY5h4fEiXUrGxsfC8dBt\nLLcpwbp9hhs2CwETzxlYix5rhCvkQmLPRs8bdoIXt+IF4+NJ135SX8gfdN4QoFWL\na3CFIJaTxMPtsYdTN+rVddeLf6TyCmCFI7T8k/9f+QKBgQDYvX2qvz3ARGiO3IIQ\nFeQviuGNsWLuEk62C1URi6w8zVzbMaFG96KtanWUGgLN4f4T463fyDKi5loflQu7\nWfkMgk2O/LIqa/sWe71H8uZKifJONTK6PnsKl3t82e2oayqs5xvb9FeKriEW1obn\nbDcmkVFRNk8z3JCbtEgAqKcs0wKBgQDVQ5WewYMIvDG44wavsvysHOr+jSOgRq2q\nQoR9BMLs94HAdj6jknuOs0e0dCbYOiS2QInpjppuFPEu/r4aLcgnuBjxlrk6cFSx\nTwcDs3opesXd9uyNH+bUm7/U6k8ZEafpseGSjcm9CHUH0yIsr/BBnEIP4b4AomvE\n7CTyOK/DFQKBgAdZNV+KqF9ScnEVjNtawqfR/5+8Oex0dnK5o6K6p5ZQKCvOXPd5\nAez7RQ1GbH3qgaDPAWAq+3yGbtvPQ9yQSl9gM5z7eFbz3kl+3IYJ+EDiuHJqX1Pt\nNmK/jBJJmUMyjvnZxBoLCMTM7pZFo8FI6/3Ew4sLWlgZzFVbIW3USga9AoGAD+py\nUR3KBK3e3Bh9WEF4X/PsicDIxt5feZRrRNVFIuA52743YIe/FuBEWrBMcditArkA\nUeDln4+KjGJQl62RAX3Yxrbj7fuSJoVqVZlgZZYXDECwWLvnwzg4cdBmxM0vhd5T\noldYlfX6nfHg3ArpWEwsFflX774vYsvo2fbnDx0CgYEAuACyXK1s9byAcIihHmvz\nlbfDpLPj6i37sNBUC3wDArlpqGuw8K2tr2pl/YXdRq0PeSYV4QYiUHlvvH08UrNv\nQutsPLdPhTjlOyPJ0SeH0JmGLH15gC7y1GGTEnuGT7yxpVcnyR6ekv8k82l/g4qN\nXUB82NLRl6gadf4BVzmLE94=\n-----END PRIVATE KEY-----\n");

		if(action == 'read') {
			fetch('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(spreadsheetId)+'/values/'+encodeURIComponent(range), {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Authorization': 'Bearer '+sJWT
				},
				cache: 'no-cache',
				credentials: 'include',
				redirect: 'follow'
			})
			.then(response => {
				try {
					if(!response.ok) throw response;
					return response.json();
				} catch(e) {throw response;}
			})
			.then(sheet => {
				if('values' in sheet) return resolve(sheet.values);
				else return resolve([]);
			});
		}

		if(action == 'write' && data && data.length > 0) {
			fetch('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(spreadsheetId)+'/values/'+encodeURIComponent(range)+'?valueInputOption=USER_ENTERED&responseValueRenderOption=FORMATTED_VALUE&responseDateTimeRenderOption=SERIAL_NUMBER&includeValuesInResponse=1', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Authorization': 'Bearer '+sJWT,
				},
				cache: 'no-cache',
				credentials: 'include',
				redirect: 'follow',
				body: JSON.stringify({
					majorDimension: 'ROWS',
					values: data
				})
			})
			.then(response => {
				try {
					if(!response.ok) throw response;
					return response.json();
				} catch(e) {throw response;}
			})
			.then(sheet => {
				if('updates' in sheet) return resolve(sheet.updates);
				else return resolve([]);
			});
		}
	});
}

function tma_to_h(timestamp) {
	var time_format = '';
	var h = 0;
	var min = 0;
	var sec = 0;

	if(timestamp == 0) time_format = 'NA';
	else if(timestamp < 0) time_format = 0;
	else if(timestamp/60/60 >= 1) {
		h = parseInt(timestamp/60/60)*3600;
		min = parseInt((timestamp-h)/60);
		sec = (timestamp-h)%60;
		time_format = parseInt(timestamp/60/60).toString()+':'+((min<10)?('0'+min.toString()):min.toString())+':'+((sec<10)?('0'+sec.toString()):sec.toString());
	} else {
		sec = timestamp%60;
		time_format = parseInt(timestamp/60).toString()+':'+((sec<10)?('0'+sec.toString()):sec.toString());
	}

	return time_format;
}

function tma_hashCode(s) {
  var hash = 0, i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
	chr   = s.charCodeAt(i);
	hash  = ((hash << 5) - hash) + chr;
	hash |= 0;
  }
  return 'd'+hash.toString();
}

function tma_getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Note: onInstalled and onStartup listeners are registered in the combined background.js wrapper
console.log('[TM Analytics] Background loaded (MV3)');

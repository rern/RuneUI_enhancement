$(document).ready(function($){ 'use strict';
	
PNotify.prototype.options.styling = 'fontawesome';
PNotify.prototype.options.stack.dir1 = 'up';
PNotify.prototype.options.stack.dir2 = 'left';
PNotify.prototype.options.stack.firstpos1 = 90;
PNotify.prototype.options.stack.firstpos2 = 50;
PNotify.prototype.options.stack.spacing1 = 10;
PNotify.prototype.options.stack.spacing2 = 10;

var GUI = {};
GUI.mode = window.WebSocket ? 'websocket' : 'longpolling';

function renderMSG(text) {
    var notify = text[0];
    if ('custom' in notify && notify.custom !== null) {
        customNotify(notify);
        return;
    }
    var noticeOptions = {
        title: ('title' in notify) ? notify.title : '[missing title]',
        text: ('text' in notify) ? notify.text : '[missing text]',
        icon: (notify.icon === undefined) ? 'fa fa-check' : notify.icon,
        opacity: (notify.opacity === undefined) ? 0.9 : notify.opacity,
        hide: (notify.hide === undefined && notify.permanotice === undefined),
        buttons: {
            closer: (notify.permanotice === undefined),
            sticker: (notify.permanotice === undefined)
        },
        delay: (notify.delay === undefined) ? 8000 : notify.delay,
        mouse_reset: false
    };
    if ('permanotice' in notify) {
        if (GUI.noticeUI[notify.permanotice] === undefined) {
            GUI.noticeUI[notify.permanotice] = new PNotify(noticeOptions);
        } else {
            if ('permaremove' in notify) {
                GUI.noticeUI[notify.permanotice].remove();
                GUI.noticeUI[notify.permanotice] = undefined;
            } else {
                GUI.noticeUI[notify.permanotice].open();
            }
        }
    } else {
        new PNotify(noticeOptions);
    }
}
var pushstreamnofify = new PushStream({
	host: window.location.hostname,
	port: window.location.port,
	modes: GUI.mode
});
pushstreamnofify.onmessage = renderMSG;
pushstreamnofify.addChannel('notify');
pushstreamnofify.connect();
// open the in range Wi-Fi networks list channel
var pushstreamwlan = new PushStream({
	host: window.location.hostname,
	port: window.location.port,
	modes: GUI.mode
});
pushstreamwlan.onmessage = listWLANs;
pushstreamwlan.addChannel('wlans');
pushstreamwlan.connect();
$.ajax({
	url: '/command/?cmd=wifiscan',
	cache: false
});

// open the NIC details channel
var pushstreamnic = new PushStream({
	host: window.location.hostname,
	port: window.location.port,
	modes: GUI.mode
});
pushstreamnic.onmessage = nicsDetails;
pushstreamnic.addChannel('nics');
pushstreamnic.connect();
    
if ( document.location.hostname === 'localhost' )
	$( '.osk-trigger' ).onScreenKeyboard( {
		'draggable': true
} ); 

// list of in range wlans
function listWLANs(text) {
    var i = 0, content = '', inrange = '', stored = '', wlans = text[0];
    $.each(wlans, function(i) {
        content += '<p><a href="/network/wlan/' + wlans[i].nic + '/' + wlans[i].ESSID + '" class="btn btn-lg btn-default btn-block" title="See network properties">';
        if (wlans[i].connected !== 0) {
            content += '<i class="fa fa-check green sx"></i>';
        }
        if (wlans[i].storedprofile === 1 && wlans[i].encryption === 'on') {
            content += '<i class="fa fa-lock sx"></i>';
        } else {
            if (wlans[i].encryption === 'on') {
                content += '<i class="fa fa-rss fa-wifi"></i><i class="fa fa-lock sx"></i>';
            } else {
                if (wlans[i].storedprofile !== 1 ) {
                content += '<i class="fa fa-rss fa-wifi sx"></i>';
                }
            }
        }
        content += '<strong>' + wlans[i].ESSID + '</strong></a></p>';
        if (wlans[i].origin === 'scan') {
            inrange += content;
        }
        if (wlans[i].storedprofile === 1) {
            stored += content;
        }
        content = '';
    });
    if (inrange === '') {
        inrange = '<p><a class="btn btn-lg btn-default btn-block" href="#"><i class="fa fa-cog fa-spin sx"></i>scanning for networks...</a></p>';
    }
    document.getElementById('wifiNetworks').innerHTML = inrange;
    document.getElementById('wifiStored').innerHTML = stored;
    $.ajax({
        url: '/command/?cmd=wifiscan',
        cache: false
    });
}

// draw the NICs details table
function nicsDetails(text) {
    var i = 0, content = '', nics = text[0];
    $.each(nics, function(i) {
        if (i === $('#nic-details').data('name')) {
            content += '<tr><th>Name:</th><td><strong>' + i + '<strong></td></tr>';
            content += '<tr><th>Type:</th><td>wireless</td></tr>';
            if (nics[i].currentssid === null) {
                content += '<tr><th>Status:</th><td><i class="fa fa-times red sx"></i>no network connected</td></tr>';
            } else {
                content += '<tr><th>Status:</th><td><i class="fa fa-check green sx"></i>connected</td></tr>';
                content += '<tr><th>Associated SSID:</th><td><strong>' + nics[i].currentssid + '</strong></td></tr>';
            }
            
            content += '<tr><th>Assigned IP:</th><td>' + ((nics[i].ip !== null) ? ('<strong>' + nics[i].ip + '</strong>') : 'none') + '</td></tr>';
            content += '<tr><th>Speed:</th><td>' + ((nics[i].speed !== null) ? nics[i].speed : 'unknown') + '</td></tr>';
            if (nics[i].currentssid !== null) {
                content += '<tr><th>Netmask:</th><td>' + nics[i].netmask + '</td></tr>';
                content += '<tr><th>Gateway:</th><td>' + nics[i].gw + '</td></tr>';
                content += '<tr><th>DNS1:</th><td>' + nics[i].dns1 + '</td></tr>';
                content += '<tr><th>DNS2:</th><td>' + nics[i].dns2 + '</td></tr>';
            }
        }
    });
    $('#nic-details tbody').html(content);
}

	// INITIALIZATION
	// ----------------------------------------------------------------------------------------------------
	 
	// Bootstrap-select
	$('.selectpicker').selectpicker();
	
	// FILE UPLOAD
	$(document).on('change', '.btn-file :file', function() {
		var input = $(this),
			numFiles = input.get(0).files ? input.get(0).files.length : 1,
			label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
		input.trigger('fileselect', [numFiles, label]);
	});

	// SOURCES
	// ----------------------------------------------------------------------------------------------------
	
	if ($('#section-sources').length) {
		// enable/disable CIFS auth section
		if ($('#mount-type').val() === 'nfs') {
			$('#mount-cifs').addClass('disabled').children('.disabler').removeClass('hide');
		}
		$('#mount-type').change(function(){
			if ($(this).val() === 'cifs' || $(this).val() === 'osx') {
				$('#mount-cifs').removeClass('disabled').children('.disabler').addClass('hide');
			}
			else {
				$('#mount-cifs').addClass('disabled').children('.disabler').removeClass('hide');
			}
		});
		
		// enable/disable CIFS user and password fields
		$('#nas-guest').change(function(){
			if ($(this).prop('checked')) {
				$('#mount-auth').addClass('disabled').children('.disabler').removeClass('hide');
			} else {
				$('#mount-auth').removeClass('disabled').children('.disabler').addClass('hide');
			}
		});
		
		// show advanced options
		$('#nas-advanced').change(function(){
			if ($(this).prop('checked')) {
				$('#mount-advanced-config').removeClass('hide');
			} else {
				$('#mount-advanced-config').addClass('hide');
			}
		});
		
		$('#show-mount-advanced-config').click(function(e){
			e.preventDefault();
			if ($(this).hasClass('active')) {
				$('#mount-advanced-config').toggleClass('hide');
				$(this).removeClass('active');
				$(this).find('i').removeClass('fa fa-minus-circle').addClass('fa fa-plus-circle');
				$(this).find('span').html('show advanced options');
			} else {
				$('#mount-advanced-config').toggleClass('hide');
				$(this).addClass('active');
				$(this).find('i').removeClass('fa fa-plus-circle').addClass('fa fa-minus-circle');
				$(this).find('span').html('hide advanced options');
			}
		});
		
		$('#usb-mount-list a').click(function(){
			var mountName = $(this).data('mount');
			$('#usb-umount-name').html(mountName);
			$('#usb-umount').val(mountName);
		});
	} else if ($('#section-settings').length) {
		
		// show/hide AirPlay name form
		$('#airplay').change(function(){
			if ($(this).prop('checked')) {
				$('#airplayName').removeClass('hide');
				$('#airplayBox').addClass('boxed-group');
			} else {
				$('#airplayName').addClass('hide');
				$('#airplayBox').removeClass('boxed-group');
			}
		});
		
		// show/hide Last.fm auth form  
		$('#scrobbling-lastfm').change(function(){
			if ($(this).prop('checked')) {
				$('#lastfmAuth').removeClass('hide');
				$('#lastfmBox').addClass('boxed-group');
			} else {
				$('#lastfmAuth').addClass('hide');
				$('#lastfmBox').removeClass('boxed-group');
			}
		});
		
		// show/hide proxy settings form  
		$('#proxy').change(function(){
			if ($(this).prop('checked')) {
				$('#proxyAuth').removeClass('hide');
				$('#proxyBox').addClass('boxed-group');
			} else {
				$('#proxyAuth').addClass('hide');
				$('#proxyBox').removeClass('boxed-group');
			}
		});
		
		// show/hide UPnP/dlna name form
		$('#dlna').change(function(){
			if ($(this).prop('checked')) {
				$('#dlnaName').removeClass('hide');
				$('#dlnaBox').addClass('boxed-group');
			} else {
				$('#dlnaName').addClass('hide');
				$('#dlnaBox').removeClass('boxed-group');
			}
		});
		
		// show/hide Spotify auth form
		$('#spotify').change(function(){
			if ($(this).prop('checked')) {
				$('#spotifyAuth').removeClass('hide');
				$('#spotifyBox').addClass('boxed-group');
			} else {
				$('#spotifyAuth').addClass('hide');
				$('#spotifyBox').removeClass('boxed-group');
			}
		});
		
		// file upload
		$('.btn-file :file').on('fileselect', function(event, numFiles, label) {
			var input = $(this).parents('.input-group').find(':text');
			if (input.length) {
				input.val(label);
			} else {
				if (label) {
					if (label.indexOf('backup_') > -1 && label.indexOf('.tar.gz') > -1) {
						$('#backup-file').html(' <i class="fa fa-check dx green"></i> ' + label + '');
						$('#btn-backup-upload').prop('disabled', false);
					} else {
						$('#backup-file').html(' <i class="fa fa-times dx red"></i> not a valid backup file');
						$('#btn-backup-upload').prop('disabled', true);
					}
				}
			}
		});

	} else if ($('#section-network').length) {
		
		// show/hide static network configuration based on select value
		var netManualConf = $('#network-manual-config');
		if ($('#dhcp').val() === '0') {
			netManualConf.removeClass('hide');
		}
		$('#dhcp').change(function(){
			if ($(this).val() === '0') {
				netManualConf.removeClass('hide');
			}
			else {
				netManualConf.addClass('hide');
			}
		});
		
		// show/hide WiFi security configuration based on select value
		var WiFiKey = $('#wifi-security-key');
		if ($('#wifi-security').val() !== 'open') {
			WiFiKey.removeClass('hide');
		}
		$('#wifi-security').change(function(){
			if ($(this).val() !== 'open') {
				WiFiKey.removeClass('hide');
			}
			else {
				WiFiKey.addClass('hide');
			}
		});
		
		// refresh in range Wi-Fi networks list
		if ($('#wifiNetworks').length) {
			// open wlans channel
			wlansChannel();
			
			// open nics channel
			nicsChannel();
		}
		
		// show/hide WiFi stored profile box
		$('#wifiProfiles').change(function(){
			if ($(this).prop('checked')) {
				$('#wifiProfilesBox').addClass('hide');
			} else {
				$('#wifiProfilesBox').removeClass('hide');
			}
		});

	} else if ($('#section-accesspoint').length) {
		
		// show/hide AP settings form
		$('#accesspoint').change(function(){
			if ($(this).prop('checked')) {
				$('#accesspointSettings').removeClass('hide');
				$('#accesspointBox').addClass('boxed-group');
			} else {
				$('#accesspointSettings').addClass('hide');
				$('#accesspointBox').removeClass('boxed-group');
			}
		});

		$('#ip-address').change(function(){
			var parts = $('#ip-address').val().split('.');
			parts[3]++;
			$('#dhcp-range').val(parts.join('.')+','+parts[0]+'.'+parts[1]+'.'+parts[2]+'.254,24h');
			parts[3] = 255;
			$('#broadcast').val(parts.join('.'));
			$('#dhcp-option-dns').val($('#ip-address').val());
			$('#dhcp-option-router').val($('#ip-address').val());
		});
	} else if ($('#section-mpd').length) {
		// output interface select
		$('#audio-output-interface').change(function(){
			renderMSG([{'title': 'Switching audio output', 'text': 'Please wait for the config update...', 'icon': 'fa fa-cog fa-spin', 'delay': 5000 }]);
			var output = $(this).val();
			$.ajax({
				type: 'POST',
				url: '/mpd/',
				data: {
					ao: output
				},
				cache: false
			});
		});
		
		// MPD config manual edit
		$('.manual-edit-confirm').find('.btn-primary').click(function(){
			$('#mpdconf_editor').removeClass('hide');
			$('#manual-edit-warning').addClass('hide');
		});
	}
});

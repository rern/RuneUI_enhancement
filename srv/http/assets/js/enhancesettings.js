$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	
if ( document.location.hostname === 'localhost' ) $( '.osk-trigger' ).onScreenKeyboard( { 'draggable': true } );

$( '.selectpicker' ).selectpicker();

if ( location.pathname === '/sources' ) {
	function toggleUpdate() {
		$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
			$( '#updatempddb, #rescanmpddb' ).toggleClass( 'disabled', status.updating_db !== 0 );
			$( '#updatempddb i, #rescanmpddb i' ).toggleClass( 'fa-spin', status.updating_db !== 0 );
		}, 'json' );
	}
	if ( 'hidden' in document ) {
		var visibilityevent = 'visibilitychange';
		var hiddenstate = 'hidden';
	} else { // cross-browser document.visibilityState must be prefixed
		var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];
		for ( var i = 0; i < 4; i++ ) {
			var p = prefixes[ i ];
			if ( p +'Hidden' in document ) {
				var visibilityevent = p +'visibilitychange';
				var hiddenstate = p +'Hidden';
				break;
			}
		}
	}
	document.addEventListener( visibilityevent, function() {
		if ( document[ hiddenstate ] ) {
			pushstreamIdle.disconnect();
		} else {
			pushstreamIdle.connect();
			toggleUpdate();
		}
	} );
	// get updating status on load
	toggleUpdate();
	// stop fa-spin when done updating
	var pushstreamIdle = new PushStream( {
		host: window.location.hostname,
		port: window.location.port,
		modes: 'websocket'
	} );
	pushstreamIdle.onmessage = function( data ) {
		if ( data[ 0 ] === 'update' ) toggleUpdate();
	}
	pushstreamIdle.addChannel( 'idle' );
	pushstreamIdle.connect();

} else if ( location.pathname === '/sources/add' ) {
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
			//console.log('checked');
			$('#mount-auth').addClass('disabled').children('.disabler').removeClass('hide');
		} else {
			//console.log('unchecked');
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
} else if ( location.pathname === '/mpd' ) {
	
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
} else if ( location.pathname === '/settings' ) {
	
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
} else if ( location.pathname === '/network' ) {
	
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
		// list of in range wlans
		function listWLANs(text) {
			var i = 0, content = '', inrange = '', stored = '', wlans = text[0];
			//console.log(wlans);
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
		var pushstream = new PushStream({
			host: window.location.hostname,
			port: window.location.port,
			modes: 'websocket'
		});
		pushstream.onmessage = listWLANs;
		pushstream.addChannel('wlans');
		pushstream.connect();
		$.ajax({
			url: '/command/?cmd=wifiscan',
			cache: false
		});
		
		// draw the NICs details table
		function nicsDetails(text) {
			var i = 0, content = '', nics = text[0];
			// console.log(nics);
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
		var pushstream = new PushStream({
			host: window.location.hostname,
			port: window.location.port,
			modes: 'websocket'
		});
		pushstream.onmessage = nicsDetails;
		pushstream.addChannel('nics');
		pushstream.connect();
	}
	
	// show/hide WiFi stored profile box
	$('#wifiProfiles').change(function(){
		if ($(this).prop('checked')) {
			$('#wifiProfilesBox').addClass('hide');
		} else {
			$('#wifiProfilesBox').removeClass('hide');
		}
	});

} else if ( location.pathname === '/accesspoint/' ) {
	
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
}

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

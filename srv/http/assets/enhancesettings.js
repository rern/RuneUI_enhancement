$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

var psOption = {
	  host: window.location.hostname
	, port: window.location.port
	, modes: 'websocket'
};

if ( document.location.hostname === 'localhost' ) $( '.osk-trigger' ).onScreenKeyboard( { 'draggable': true } );

$( '.selectpicker' ).selectpicker();

var intUpdate = false;
var path = location.pathname;
if ( path === '/sources' ) {
	function toggleUpdate() {
		$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
			if ( status.updating_db ) {
				if ( !intUpdate ) {
					$( '#updatempddb, #rescanmpddb' ).hide();
					$( '#updatempddb' ).parent().after( '<span id="update"><i class="fa fa-library"></i>&emsp;Library updating...</span>' );
					intUpdate = setInterval( function() { // fix: force status fetching
						toggleUpdate();
					}, 10000 );
				}
			} else {
				$( '#update' ).remove();
				$( '#updatempddb, #rescanmpddb' ).show();
				clearInterval( intUpdate );
			}
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
	toggleUpdate();
	var pushstreamIdle = new PushStream( psOption );
	pushstreamIdle.onmessage = function( data ) {
		if ( data[ 0 ] === 'update' ) toggleUpdate();
	}
	pushstreamIdle.addChannel( 'idle' );
	pushstreamIdle.connect();

} else if ( path === '/sources/add' ) {
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
	$('#nas-guest').change(function(){
		if ($(this).prop('checked')) {
			$('#mount-auth').addClass('disabled').children('.disabler').removeClass('hide');
		} else {
			$('#mount-auth').removeClass('disabled').children('.disabler').addClass('hide');
		}
	});
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
	
} else if ( path === '/mpd' ) {
	$('#audio-output-interface').change(function(){
		new PNotify( {
			  icon  : 'fa fa-cog fa-spin'
			, title : 'Switching audio output'
			, text  : 'Please wait for the config update...'
			, delay : 5000
			, styling : 'fontawesome'
		} );
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
	$('.manual-edit-confirm').find('.btn-primary').click(function(){
		$('#mpdconf_editor').removeClass('hide');
		$('#manual-edit-warning').addClass('hide');
	});
	
} else if ( path === '/settings' ) {
	$('#airplay').change(function(){
		if ($(this).prop('checked')) {
			$('#airplayName').removeClass('hide');
			$('#airplayBox').addClass('boxed-group');
		} else {
			$('#airplayName').addClass('hide');
			$('#airplayBox').removeClass('boxed-group');
		}
	});
	$('#scrobbling-lastfm').change(function(){
		if ($(this).prop('checked')) {
			$('#lastfmAuth').removeClass('hide');
			$('#lastfmBox').addClass('boxed-group');
		} else {
			$('#lastfmAuth').addClass('hide');
			$('#lastfmBox').removeClass('boxed-group');
		}
	});
	$('#proxy').change(function(){
		if ($(this).prop('checked')) {
			$('#proxyAuth').removeClass('hide');
			$('#proxyBox').addClass('boxed-group');
		} else {
			$('#proxyAuth').addClass('hide');
			$('#proxyBox').removeClass('boxed-group');
		}
	});
	$('#dlna').change(function(){
		if ($(this).prop('checked')) {
			$('#dlnaName').removeClass('hide');
			$('#dlnaBox').addClass('boxed-group');
		} else {
			$('#dlnaName').addClass('hide');
			$('#dlnaBox').removeClass('boxed-group');
		}
	});
	$('#spotify').change(function(){
		if ($(this).prop('checked')) {
			$('#spotifyAuth').removeClass('hide');
			$('#spotifyBox').addClass('boxed-group');
		} else {
			$('#spotifyAuth').addClass('hide');
			$('#spotifyBox').removeClass('boxed-group');
		}
	});
	
} else if ( path.slice( 0, 8 ) === '/network' ) {
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
	if ($('#wifiNetworks').length) {
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
		var pushstreamWlans = new PushStream( psOption );
		pushstreamWlans.onmessage = listWLANs;
		pushstreamWlans.addChannel('wlans');
		pushstreamWlans.connect();
		$.ajax({
			url: '/command/?cmd=wifiscan',
			cache: false
		});
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
		var pushstreamNics = new PushStream( psOption );
		pushstreamNics.onmessage = nicsDetails;
		pushstreamNics.addChannel('nics');
		pushstreamNics.connect();
	}
	$('#wifiProfiles').change(function(){
		if ($(this).prop('checked')) {
			$('#wifiProfilesBox').addClass('hide');
		} else {
			$('#wifiProfilesBox').removeClass('hide');
		}
	});
	
} else if ( path === '/accesspoint' ) {
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
	
} else if ( path === '/debug' ) { // *** Important! ZeroClipboard will freeze if run while in DevTools mode ***
	ZeroClipboard.config({swfPath: '/assets/js/vendor/ZeroClipboard.swf'});
	var client = new ZeroClipboard(document.getElementById('copy-to-clipboard'));
	client.on('ready', function(readyEvent){
		client.on('aftercopy', function(event){
			new PNotify({
				  title   : 'Copied to clipboard'
				, text    : 'The debug output was copied successfully in your clipboard.'
				, styling : 'fontawesome'
			});
		});
	});
}

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

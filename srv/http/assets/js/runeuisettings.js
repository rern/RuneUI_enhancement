$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	
if ( document.location.hostname === 'localhost' )
	$( '.osk-trigger' ).onScreenKeyboard( {
		'draggable': true
} ); 

$( '.selectpicker' ).selectpicker();

if ( /\/sources\//.test( location.pathname ) ) {
	var pushstreamplayback = new PushStream( {
		host: window.location.hostname,
		port: window.location.port,
		modes: 'websocket'
	} );
	pushstreamplayback.onmessage = function( status ) {
		var mpdupdate = status.json.updating_db !== undefined ? true : false;
		$( '#updatempddb i, #rescanmpddb i' ).toggleClass( 'fa-spin', mpdupdate );
	};
	pushstreamplayback.addChannel( 'playback' );
	pushstreamplayback.connect();
	
	// enable/disable CIFS auth section
	if ( $( '#mount-type' ).val() === 'nfs' ) $( '#mount-cifs' ).addClass( 'disabled' ).children( '.disabler' ).removeClass( 'hide' );
	$( '#mount-type' ).change( function() {
		if ( $( this ).val() === 'cifs' || $( this ).val() === 'osx' ) {
			$( '#mount-cifs' ).removeClass( 'disabled' ).children( '.disabler' ).addClass( 'hide' );
		} else {
			$( '#mount-cifs' ).addClass( 'disabled' ).children( '.disabler' ).removeClass( 'hide' );
		}
	} );
	
	// enable/disable CIFS user and password fields
	$( '#nas-guest' ).change( function() {
		if ( $( this ).prop( 'checked' ) ) {
			$( '#mount-auth' ).addClass( 'disabled' ).children( '.disabler' ).removeClass( 'hide' );
		} else {
			$( '#mount-auth' ).removeClass( 'disabled' ).children( '.disabler' ).addClass( 'hide' );
		}
	} );
	
	// show advanced options
	$( '#nas-advanced' ).change( function() {
		$( '#mount-advanced-config' ).toggleClass( 'hide', !$( this ).prop( 'checked' ) );
	} );
	
	$( '#show-mount-advanced-config' ).click( function( e ){
		e.preventDefault();
		if ( $( this ).hasClass( 'active' ) ) {
			$( '#mount-advanced-config' ).toggleClass( 'hide' );
			$( this ).removeClass( 'active' );
			$( this ).find( 'i' ).removeClass( 'fa fa-minus-circle' ).addClass( 'fa fa-plus-circle' );
			$( this ).find( 'span' ).html( 'show advanced options' );
		} else {
			$( '#mount-advanced-config' ).toggleClass( 'hide' );
			$( this ).addClass( 'active' );
			$( this ).find( 'i' ).removeClass( 'fa fa-plus-circle' ).addClass( 'fa fa-minus-circle' );
			$( this ).find( 'span' ).html( 'hide advanced options' );
		}
	} );
	
	$( '#usb-mount-list a' ).click( function() {
		var mountName = $( this ).data( 'mount' );
		$( '#usb-umount-name' ).html(mountName);
		$( '#usb-umount' ).val(mountName);
	} );
} else if ( /\/settings\//.test( location.pathname ) ) {
	// show/hide AirPlay name form
	$( '#airplay' ).change( function() {
		var checked = $( this ).prop( 'checked' );
		$( '#airplayName' ).toggleClass( 'hide', !checked );
		$( '#airplayBox' ).toggleClass( 'boxed-group', checked );
	} );
	// show/hide Last.fm auth form  
	$( '#scrobbling-lastfm' ).change( function() {
		var checked = $( this ).prop( 'checked' );
		$( '#lastfmAuth' ).toggleClass( 'hide', !checked );
		$( '#lastfmBox' ).toggleClass( 'boxed-group', checked );
	} );
	// show/hide proxy settings form  
	$( '#proxy' ).change( function() {
		var checked = $( this ).prop( 'checked' );
		$( '#proxyAuth' ).toggleClass( 'hide', !checked );
		$( '#proxyBox' ).toggleClass( 'boxed-group', checked );
	} );
	// show/hide UPnP/dlna name form
	$( '#dlna' ).change( function() {
		var checked = $( this ).prop( 'checked' );
		$( '#dlnaName' ).toggleClass( 'hide', !checked );
		$( '#dlnaBox' ).toggleClass( 'boxed-group', checked );
	} );
	// show/hide Spotify auth form
	$( '#spotify' ).change( function() {
		var checked = $( this ).prop( 'checked' );
		$( '#spotifyAuth' ).toggleClass( 'hide', !checked );
		$( '#spotifyBox' ).toggleClass( 'boxed-group', checked );
	} );
	// file upload
	$( '.btn-file :file' ).on( 'fileselect', function( event, numFiles, label ) {
		var input = $( this ).parents( '.input-group' ).find( ':text' );
		if ( input.length ) {
			input.val( label );
		} else {
			if ( !label ) return;
			
			if ( label.indexOf( 'backup_' ) > -1 && label.indexOf( '.tar.gz' ) > -1 ) {
				$( '#backup-file' ).html( ' <i class="fa fa-check dx green"></i> '+ label );
				$( '#btn-backup-upload' ).prop( 'disabled', false );
			} else {
				$( '#backup-file' ).html( ' <i class="fa fa-times dx red"></i> not a valid backup file' );
				$( '#btn-backup-upload' ).prop( 'disabled', true );
			}
		}
	} );
} else if ( /\/network\//.test( location.pathname ) ) {
	// show/hide static network configuration based on select value
	var netManualConf = $( '#network-manual-config' );
	if ( $( '#dhcp' ).val() === '0' ) {
		netManualConf.removeClass( 'hide' );
	}
	$( '#dhcp' ).change( function() {
		netManualConf.removeClass( 'hide', $( this ).val() !== '0' );
	} );
	
	// show/hide WiFi security configuration based on select value
	var WiFiKey = $( '#wifi-security-key' );
	if ( $( '#wifi-security' ).val() !== 'open' ) {
		WiFiKey.removeClass( 'hide' );
	}
	$( '#wifi-security' ).change( function() {
		WiFiKey.removeClass( 'hide', $( this ).val() === 'open' );
	} );
	
	// refresh in range Wi-Fi networks list
	if ( $( '#wifiNetworks' ).length) {
		$.get( '/command/?cmd=wifiscan' );
		
		// open the in range Wi-Fi networks list channel
		var pushstreamwlan = new PushStream( {
			host: window.location.hostname,
			port: window.location.port,
			modes: GUI.mode
		} );
		pushstreamwlan.onmessage = listWLANs;
		pushstreamwlan.addChannel( 'wlans' );
		pushstreamwlan.connect();
		
		// open the NIC details channel
		var pushstreamnic = new PushStream( {
			host: window.location.hostname,
			port: window.location.port,
			modes: GUI.mode
		} );
		pushstreamnic.onmessage = nicsDetails;
		pushstreamnic.addChannel( 'nics' );
		pushstreamnic.connect();

		// list of in range wlans
		function listWLANs( text ) {
			var i = 0, content = '', inrange = '', stored = '', wlans = text[ 0 ];
			$.each( wlans, function( i ) {
				content += '<p><a href="/network/wlan/' + wlans[i].nic + '/' + wlans[ i ].ESSID + '" class="btn btn-lg btn-default btn-block" title="See network properties">';
				if ( wlans[ i ].connected !== 0 ) {
					content += '<i class="fa fa-check green sx"></i>';
				}
				if ( wlans[ i ].storedprofile === 1 && wlans[ i ].encryption === 'on' ) {
					content += '<i class="fa fa-lock sx"></i>';
				} else {
					if ( wlans[ i ].encryption === 'on' ) {
						content += '<i class="fa fa-rss fa-wifi"></i><i class="fa fa-lock sx"></i>';
					} else {
						if ( wlans[ i ].storedprofile !== 1 ) {
						content += '<i class="fa fa-rss fa-wifi sx"></i>';
						}
					}
				}
				content += '<strong>' + wlans[ i ].ESSID + '</strong></a></p>';
				if ( wlans[ i ].origin === 'scan' ) {
					inrange += content;
				}
				if ( wlans[ i ].storedprofile === 1 ) {
					stored += content;
				}
				content = '';
			} );
			if ( inrange === '' ) inrange = '<p><a class="btn btn-lg btn-default btn-block" href="#"><i class="fa fa-cog fa-spin sx"></i>scanning for networks...</a></p>';
			document.getElementById( 'wifiNetworks' ).innerHTML = inrange;
			document.getElementById( 'wifiStored' ).innerHTML = stored;
			$.get( '/command/?cmd=wifiscan' );
		}
		// draw the NICs details table
		function nicsDetails( text ) {
			var i = 0, content = '', nics = text[ 0 ];
			$.each( nics, function( i ) {
				if ( i === $( '#nic-details' ).data( 'name' ) ) {
					content += '<tr><th>Name:</th><td><strong>'+ i +'<strong></td></tr>';
					content += '<tr><th>Type:</th><td>wireless</td></tr>';
					if ( nics[ i ].currentssid === null ) {
						content += '<tr><th>Status:</th><td><i class="fa fa-times red sx"></i>no network connected</td></tr>';
					} else {
						content += '<tr><th>Status:</th><td><i class="fa fa-check green sx"></i>connected</td></tr>';
						content += '<tr><th>Associated SSID:</th><td><strong>'+ nics[ i ].currentssid +'</strong></td></tr>';
					}
					
					content += '<tr><th>Assigned IP:</th><td>'+ ( ( nics[ i ].ip !== null) ? ( '<strong>' + nics[ i ].ip + '</strong>' ) : 'none' ) +'</td></tr>';
					content += '<tr><th>Speed:</th><td>'+ ( (nics[ i ].speed !== null ) ? nics[ i ].speed : 'unknown' ) +'</td></tr>';
					if ( nics[ i ].currentssid !== null ) {
						content += '<tr><th>Netmask:</th><td>'+ nics[ i ].netmask +'</td></tr>';
						content += '<tr><th>Gateway:</th><td>'+ nics[ i ].gw +'</td></tr>';
						content += '<tr><th>DNS1:</th><td>'+ nics[ i ].dns1 +'</td></tr>';
						content += '<tr><th>DNS2:</th><td>'+ nics[ i ].dns2 +'</td></tr>';
					}
				}
			} );
			$( '#nic-details tbody' ).html(content);
		}
	}
	
	// show/hide WiFi stored profile box
	$( '#wifiProfiles' ).change( function() {
		$( '#wifiProfilesBox' ).toggleClass( 'hide', $( this ).prop( 'checked' ) );
	} );

} else if ( /\/accesspoint\//.test( location.pathname ) ) {
	// show/hide AP settings form
	$( '#accesspoint' ).change( function() {
		var checked = $( this ).prop( 'checked' );
		$( '#accesspointSettings' ).toggleClass( 'hide', !checked );
		$( '#accesspointBox' ).toggleClass( 'boxed-group', checked );
	} );

	$( '#ip-address' ).change( function() {
		var parts = $( '#ip-address' ).val().split( '.' );
		parts[ 3 ]++;
		$( '#dhcp-range' ).val( parts.join( '.' ) +','+ parts[ 0 ] +'.'+ parts[ 1 ] +'.'+ parts[ 2 ] +'.254,24h' );
		parts[ 3 ] = 255;
		$( '#broadcast' ).val( parts.join( '.' ) );
		$( '#dhcp-option-dns' ).val( $( '#ip-address' ).val() );
		$( '#dhcp-option-router' ).val( $( '#ip-address' ).val() );
	} );
} else if ( /\/mpd\//.test( location.pathname ) ) {
	// output interface select
	$( '#audio-output-interface' ).change( function() {
		PNotify.prototype.options.styling = 'fontawesome';
		PNotify.prototype.options.stack = {
			dir1      : 'up',
			dir2      : 'left',
			firstpos1 : 90,
			firstpos2 : 50,
			spacing1  : 10,
			spacing2  : 10,
		}
		new PNotify( {
			title: 'Switching audio output',
			text: 'Please wait for the config update...',
			icon: 'fa fa-cog fa-spin'
		} );
		
		$.post( '/mpd', { data: { ao: $( this ).val() } } );
	} );
	
	// MPD config manual edit
	$( '.manual-edit-confirm' ).find( '.btn-primary' ).click( function() {
		$( '#mpdconf_editor' ).removeClass( 'hide' );
		$( '#manual-edit-warning' ).addClass( 'hide' );
	} );
}

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

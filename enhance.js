var GUI = { // outside '$( function() {' enable console.log access
	  activePlayer : ''
	, airplay      : {}
	, artistalbum  : ''
	, bookmarkedit : 0
	, browsemode   : ''
	, currentpath  : ''
	, dbback       : 0
	, dbbackdata   : []
	, dbbrowsemode : ''
	, dblist       : 0
	, dbscrolltop  : {}
	, display      : {}
	, imodedelay   : 0
	, list         : {}
	, library      : 0
	, libraryhome  : {}
	, local        : 0
	, lsplaylists  : []
	, midori       : navigator.userAgent.indexOf( 'Midori' ) !== -1
	, playback     : 1
	, playlist     : 0
	, pleditor     : 0
	, pllist     : {}
	, plscrolltop  : 0
	, plugin       : ''
	, status       : {}
};

PNotify.prototype.options.delay = 3000;
PNotify.prototype.options.styling = 'fontawesome';
PNotify.prototype.options.icon = 'fa fa-check';
PNotify.prototype.options.stack = {
	  dir1      : 'up'    // stack up
	, dir2      : 'right' // when full stack right
	, firstpos1 : 60      // offset from border H
	, firstpos2 : 0       // offset from border V
	, spacing1  : 10      // space between dir1
	, spacing2  : 10      // space between dir2
}
var blinkdot = '<a class="dot">.</a> <a class="dot dot2">.</a> <a class="dot dot3">.</a>';

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// fix jquery.mobile swipe not work with Midori - use hammer.js instead
$pageLibrary = GUI.midori ? new Hammer( document.getElementById( 'page-library' ) ) : $( '#page-library' );
$pagePlayback = GUI.midori ? new Hammer( document.getElementById( 'page-playback' ) ) : $( '#page-playback' );
$pagePlaylist = GUI.midori ? new Hammer( document.getElementById( 'page-playlist' ) ) : $( '#page-playlist' );

GUI.local = 1; // suppress 2nd getPlaybackStatus() on load
setTimeout( function() { GUI.local = 0 }, 500 );
$.post( 'enhance.php', { getdisplay: 1, data: 1 }, function( data ) {
	GUI.display = data;
	if ( !GUI.display.contexticon ) $( 'head' ).append( '<style id="contexticoncss">.db-action, #pl-editor .pl-action { display: none }</style>' );
	var screenS = ( window.innerHeight < 590 || window.innerWidth < 500 );
	if ( !GUI.display.bars || ( screenS && !GUI.display.barsauto ) ) setSwipe();
	$.post( 'enhancestatus.php', function( status ) {
		GUI.status = status;
		setButton();
		renderPlayback();
		displayPlayback();
		$( 'html, body' ).scrollTop( 0 );
		$.post( 'enhance.php', { library: 1, data: 1 }, function( data ) {
			GUI.libraryhome = data;
		}, 'json' );
	}, 'json' );
}, 'json' );
    
if ( document.location.hostname === 'localhost' ) $( '.osk-trigger' ).onScreenKeyboard( { 'draggable': true } );
// PLAYBACK /////////////////////////////////////////////////////////////////////////////////////
$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var cmd = this.id;
	if ( $this.hasClass( 'btn-toggle' ) ) {
		if ( GUI.status.ext === 'radio' ) return
		
		if ( cmd === 'random' && $this.hasClass( 'ashuffle' ) ) {
			$.post( 'enhance.php', { bash: '/usr/bin/killall ashuffle &' } );
			$this.removeClass( 'btn-primary ashuffle' );
			return
		}
		
		var onoff = GUI.status[ cmd ] ? 0 : 1;
		GUI.status[ cmd ] = onoff;
		command = 'mpc '+ cmd +' '+ onoff;
	} else {
		if ( cmd === 'stop' ) {
			command = 'mpc stop';
			if ( GUI.status.ext === 'radio' ) $( '#song' ).empty();
		} else if ( cmd === 'previous' || cmd === 'next' ) {
			if ( GUI.display.bars ) $this.addClass( 'btn-primary' );
			// enable previous / next while stop
			var current = GUI.status.song + 1;
			var last = GUI.status.playlistlength;
			if ( GUI.status.random === 1 ) {
				// improve: repeat pattern of mpd random
				var pos = Math.floor( Math.random() * last ); // Math.floor( Math.random() * ( max - min + 1 ) ) + min;
				if ( pos === current ) pos = ( pos === last ) ? pos - 1 : pos + 1; // avoid same pos ( no pos-- or pos++ in ternary )
			} else {
				if ( cmd === 'previous' ) {
					var pos = current !== 1 ? current - 1 : last;
				} else {
					var pos = current !== last ? current + 1 : 1;
				}
			}
			command = GUI.status.state === 'play' ? 'mpc play '+ pos : [ 'mpc play '+ pos, 'mpc stop' ];
		} else {
			command = 'mpc toggle';
		}
	}
	$.post( 'enhance.php', { mpc: command } );
} );
$( '#menu-settings, #badge' ).click( function() {
	$( '#settings' )
		.toggleClass( 'hide' )
		.css( 'top', $( '#menu-top' ).hasClass( 'hide' ) ? 0 : '40px' );
} );
$( '#page-library, #page-playback, #page-playlist' ).click( function( e ) {
	if ( !$( '#settings' ).hasClass( 'hide' ) && [ 'coverTR', 'timeTR' ].indexOf( e.target.id ) === -1 ) $( '#settings' ).addClass( 'hide' );
} );
$( '#displaylibrary' ).click( function() {
	var coverfile = GUI.display.coverfile;
	info( {
		  icon         : 'library'
		, title        : 'Libary Home'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysavelibrary">'
				+ displayCheckbox( 'sd',          '<i class="fa fa-microsd"></i>SD' )
				+ displayCheckbox( 'usb',         '<i class="fa fa-usbdrive"></i>USB' )
				+ displayCheckbox( 'nas',         '<i class="fa fa-network"></i>Network' )
				+ displayCheckbox( 'webradio',    '<i class="fa fa-webradio"></i>Webradio' )
				+ displayCheckbox( 'album',       '<i class="fa fa-album"></i>Album' )
				+ displayCheckbox( 'artist',      '<i class="fa fa-artist"></i>Artist' )
				+ displayCheckbox( 'albumartist', '<i class="fa fa-albumartist"></i>Album artist' )
				+ displayCheckbox( 'composer',    '<i class="fa fa-composer"></i>Composer' )
				+ displayCheckbox( 'genre',       '<i class="fa fa-genre"></i>Genre' )
				+ displayCheckbox( 'dirble',      '<i class="fa fa-dirble"></i>Dirble' )
				+ displayCheckbox( 'jamendo',     '<i class="fa fa-jamendo"></i>Jamendo' )
				+ displayCheckbox( 'count',       '<gr>text</gr> Count' )
				+ displayCheckbox( 'label',       '<gr>text</gr> Label' )
				+ displayCheckbox( 'contexticon', '<i class="fa fa-bars"></i>Context menu icon' )
				+ displayCheckbox( 'coverfile',   'Cover art' )
				+ displayCheckbox( 'tapaddplay',  'Tap Add <gr>►</gr> Play <gr>a song</gr>' )
				+ displayCheckbox( 'plclear',     'Clear Playlist confirmation' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			$( '#displaysavelibrary input' ).each( function() {
				var checked = this.checked;
				GUI.display[ this.name ] = checked ? 'checked' : '';
				if ( this.name === 'coverfile' ) GUI.coverfile = ( coverfile === 'checked' ) ? ( checked ? 0 : 1 ) : ( checked ? 1 : 0 );
				if ( GUI.display.contexticon ) {
					$( '#contexticoncss' ).remove();
					$( '.db-action' ).show();
				} else {
					if ( !$( '#contexticoncss' ).length ) $( 'head' ).append( '<style id="contexticoncss">.db-action, #pl-editor .pl-action { display: none }</style>' );
					$( '.db-action' ).hide();
				}
			} );
			if ( !GUI.library ) $( '#tab-library' ).click();
			$.post( 'enhance.php', { setdisplay: GUI.display } );
		}
	} );
} );
$( '#displayplayback' ).click( function() {
	info( {
		  icon         : 'play-circle'
		, title        : 'Playback'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysaveplayback">'
				+ displayCheckbox( 'bars',         'Top-Bottom bars' )
				+ displayCheckbox( 'barsauto',     'Bars on small screen' )
				+ displayCheckbox( 'time',         'Time' )
				+ displayCheckbox( 'radioelapsed', 'Webradio elapsed' )
				+ displayCheckbox( 'coverart',     'Cover art' )
				+ displayCheckbox( 'coverlarge',   'Large Cover art' )
				+ displayCheckbox( 'volume',       'Volume' )
				+ displayCheckbox( 'buttons',      'Buttons' )
				+ displayCheckbox( 'debug',        '<gr>menu</gr> Debug' )
				+ displayCheckbox( 'dev',          '<gr>menu</gr> Development' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			$.post( 'enhance.php', { setdisplay: GUI.display }, function() {
				displayPlayback();
			} );
			if ( !GUI.playback ) $( '#tab-playback' ).click();
			setSwipe();
		}
	} );
	// disable by bars hide
	if ( !GUI.display.bars ) setToggleButton( 'barsauto', '(auto)' );
	// disable by mpd volume
	if ( !GUI.display.volumempd ) setToggleButton( 'volume', '(disabled)' );
	// disable by autohide
	if ( !GUI.display.time && !GUI.display.volume ) {
		setToggleButton( 'coverart', '(auto)' );
		setToggleButton( 'coverlarge', '(auto)' );
		setToggleButton( 'buttons', '(auto)' );
	}
	if ( window.innerHeight <= 320 ) setToggleButton( 'buttons' );
} );
$( '#turnoff' ).click( function() {
	var localhost = document.location.hostname === 'localhost';
	info( {
		  icon        : 'power'
		, title       : 'Power'
		, message     : 'Select mode:'
		, oklabel     : 'Off'
		, okcolor     : '#bb2828'
		, ok          : function() {
			$.post( 'enhance.php', { power: 'shutdown' } );
			$( '#loader' ).removeClass( 'hide' );
		}
		, buttonlabel : 'Reboot'
		, buttoncolor : '#de810e'
		, button      : function() {
			$.post( 'enhance.php', { power: 'reboot' } );
			$( '#loader' ).removeClass( 'hide' );
		}
		, cancellabel : !localhost ? '' : 'Screen off'
		, cancel      : !localhost ? '' : function() {
			$.post( 'enhance.php', { power: 'screenoff' } );
		}
	} );
} );
$( '#tab-library' ).click( function() {
	if ( !Object.keys( GUI.libraryhome ).length ) return // wait for mpc data 
	
	if ( GUI.bookmarkedit ) {
		GUI.bookmarkedit = 0;
		renderLibrary();
		return
	}
	if ( GUI.status.activePlayer === 'Airplay' ) {
		$( '#playsource' ).addClass( 'open' );
		return
	}
	
	if ( GUI.library && GUI.dblist ) {
		GUI.dblist = GUI.dbback = 0;
		GUI.currentpath = GUI.browsemode = GUI.dbbrowsemode = ''
		GUI.dbbackdata = [];
		
		renderLibrary();
		return
	}
	
	setPageCurrent( 'library' );
} );
$( '#tab-playback' ).click( function() {
	setPageCurrent( 'playback' );
	getPlaybackStatus();
	if ( GUI.status.state === 'play' ) $( '#elapsed' ).empty(); // hide flashing
} );
$( '#tab-playlist' ).click( function() {
	if ( GUI.playlist && GUI.pleditor ) GUI.pleditor = 0;
	if ( GUI.status.activePlayer === 'Airplay' ) {
		$( '#playsource' ).addClass( 'open' );
		return
	}
	
	setPageCurrent( 'playlist' );
	if ( GUI.pleditor ) return
	
	$.post( 'enhance.php', { getplaylist: 1 }, function( data ) {
		GUI.lsplaylists = data.lsplaylists || [];
		GUI.pllist = data.playlist;
		renderPlaylist();
	}, 'json' );
} );
$( '#page-playback' ).click( function( e ) {
	if ( $( e.target ).is( '.controls, .timemap, .covermap, .volmap' ) ) return
	
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} );
$( '#page-library' ).click( function( e ) {
	if ( GUI.local ) return
	
	if ( e.target.id !== 'home-block-edit' && e.target.id !== 'home-block-remove' ) {
		$( '#home-block-edit, #home-block-remove' ).remove();
		$( '.home-bookmark' ).find( '.fa-bookmark, gr' ).css( 'opacity', '' );
	}
} );
$( '#song, #playlist-warning' ).on( 'click', 'i', function() {
	$( '#tab-library' ).click();
} );
$( '#artist, #bio-open' ).click( function() {
	if ( GUI.status.ext === 'radio' ) return
	
	if ( $( '#bio legend' ).text() != GUI.status.Artist ) {
		getBio( GUI.status.Artist );
	} else {
		renderBio();
	}
} );
$( '#album' ).click( function() {
	if ( GUI.status.ext !== 'radio' || location.hostname !== 'localhost' ) window.open( 'https://www.last.fm/music/'+ GUI.status.Artist +'/'+ GUI.status.Album, '_blank' );
} );
$( '#time' ).roundSlider( {
	  sliderType  : 'min-range'
	, max         : 1000
	, radius      : 115
	, width       : 20
	, startAngle  : 90
	, endAngle    : 450
	, showTooltip : false
	
	, create      : function ( e ) {
		$timeRS = this;
	}
	, change      : function( e ) { // not fire on 'setValue'
		if ( GUI.status.ext === 'radio' ) {
			$timeRS.setValue( 0 );
		} else {
			mpdSeek( Math.floor( e.value / 1000 * GUI.status.Time ) );
		}
	}
	, start       : function () {
		if ( GUI.status.ext === 'radio' ) return
		
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
	}
	, drag        : function ( e ) { // drag with no transition by default
		if ( GUI.status.ext === 'radio' ) return
		
		$( '#elapsed' ).text( second2HMS( Math.round( e.value / 1000 * GUI.status.Time ) ) );
	}
	, stop        : function( e ) { // on 'stop drag'
		if ( GUI.status.ext === 'radio' ) return
		
		mpdSeek( Math.round( e.value / 1000 * GUI.status.Time ) );
	}
} );
$( '#volume' ).roundSlider( {
	  sliderType: 'default'
	, radius          : 115
	, width           : 50
	, handleSize      : '-25'
	, startAngle      : -50
	, endAngle        : 230
	, editableTooltip : false
	
	, create          : function () { // maintain shadow angle of handle
		$volumeRS = this;
		$volumetransition = $( '#volume' ).find( '.rs-animation, .rs-transition' );
		$volumetooltip = $( '#volume' ).find( '.rs-tooltip' );
		$volumehandle = $( '#volume' ).find( '.rs-handle' );
		$volumehandle.addClass( 'rs-transition' ).eq( 0 )           // make it rotate with 'rs-transition'
			.rsRotate( - this._handle1.angle );                     // initial rotate
		$( '.rs-transition' ).css( 'transition-property', 'none' ); // disable animation on load
	}
	, change          : function( e ) { // (not fire on 'setValue' ) value after click or 'stop drag'
		GUI.local = 1;
		setTimeout( function() { GUI.local = 0 }, 500 );
		$.post( 'enhance.php', { volume: e.value } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
		// value before 'change'
		if ( e.preValue === 0 ) unmuteColor();
	}
	, start           : function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmuteColor(); // value before 'start drag'
	}
	, drag            : function ( e ) { // drag with no transition by default
		if ( e.value % 2 === 0 ) {
			GUI.local = 1; // cleared by 'change'
			$.post( 'enhance.php', { mpc: 'mpc volume '+ e.value } );
			$( e.handle.element ).rsRotate( - e.handle.angle );
		}
	}
} );
$( '#volmute, #volM' ).click( function() {
	var vol = $volumeRS.getValue();
	if ( vol ) {
		$volumeRS.setValue( 0 );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		muteColor( vol );
		GUI.display.volumemute = vol;
	} else {
		$volumeRS.setValue( GUI.display.volumemute );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		unmuteColor();
		GUI.display.volumemute = 0;
	}
	GUI.local = 1;
	setTimeout( function() { GUI.local = 0 }, 500 );
	$.post( 'enhance.php', { volume: 'setmute' } );
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	if ( ( vol === 0 && ( thisid === 'voldn' ) ) || ( vol === 100 && ( thisid === 'volup' ) ) ) return

	vol = ( thisid === 'volup' ) ? vol + 1 : vol - 1;
	$volumeRS.setValue( vol );
	GUI.local = 1;
	setTimeout( function() { GUI.local = 0 }, 500 );
	$.post( 'enhance.php', { volume: vol } );
} );
$( '#coverTL' ).click( function() {
	if ( !$( '#controls-cover' ).hasClass( 'hide' ) ) $( '.controls, .controls1, .rs-tooltip, #imode' ).toggleClass( 'hide' );
	$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
		$.each( status, function( key, value ) {
			GUI.status[ key ] = value;
		} );
		var coverlarge = GUI.display.coverlarge;
		var time = GUI.display.time;
		var volume = GUI.display.volume;
		var buttons = GUI.display.buttons;
		GUI.display.coverlarge = $( '#divcover' ).hasClass( 'coversmall' ) ? 'checked' : '';
		var radio = $( '#album' ).text().slice( 0, 4 ) === 'http';
		if ( GUI.display.volumempd ) {
			if ( !$( '#time-knob' ).hasClass( 'hide' ) && !$( '#volume-knob' ).hasClass( 'hide' ) ) {
				if ( GUI.display.volume && GUI.display.time ) {
					if ( !radio ) GUI.display.coverlarge = 'checked';
					GUI.display.time = '';
					GUI.display.volume = '';
					GUI.display.buttons = '';
				} else {
					if ( !radio ) GUI.display.coverlarge = coverlarge;
					GUI.display.time = time;
					GUI.display.volume = volume;
				}
			} else if ( $( '#time-knob' ).hasClass( 'hide' ) && $( '#volume-knob' ).hasClass( 'hide' ) ) {
				if ( GUI.display.time || GUI.display.volume ) {
					if ( !radio ) GUI.display.coverlarge = coverlarge;
					GUI.display.time = time;
					GUI.display.volume = volume;
				} else {
					GUI.display.coverlarge = '';
					GUI.display.time = 'checked';
					GUI.display.volume = 'checked';
				}
			} else {
				if ( GUI.display.volume && GUI.display.time ) {
					GUI.display.time = 'checked';
					GUI.display.volume = 'checked';
				} else {
					if ( !radio ) GUI.display.coverlarge = 'checked';
					GUI.display.time = '';
					GUI.display.volume = '';
					GUI.display.buttons = '';
				}
			}
		} else {
			if ( !$( '#time-knob' ).hasClass( 'hide' ) ) {
				if ( !radio ) GUI.display.coverlarge = 'checked';
				GUI.display.time = '';
				GUI.display.buttons = '';
			} else {
				if ( !radio ) GUI.display.coverlarge = coverlarge;
				GUI.display.time = 'checked';
			}
		}
		renderPlayback();
		displayPlayback();
		setButton();
		if ( window.innerWidth < 500 ) $( '#format-bitrate' ).css( 'display', GUI.display.time ? 'inline' : 'block' );
		GUI.display.coverlarge = coverlarge;
		GUI.display.time = time;
		GUI.display.volume = volume;
		GUI.display.buttons = buttons;
	}, 'json' );
} );
var btnctrl = {
	  timeTL : 'playsource-open'
	, timeT   : 'guide'
	, timeTR  : 'menu'
	, timeL   : 'previous'
	, timeM   : 'play'
	, timeR   : 'next'
	, timeBL  : 'random'
	, timeB   : 'stop'
	, timeBR  : 'repeat'
	, coverTL : ''
	, coverT  : 'guide'
	, coverTR : 'menu'
	, coverL  : 'previous'
	, coverM  : 'play'
	, coverR  : 'next'
	, coverBL : 'random'
	, coverB  : 'stop'
	, coverBR : 'repeat'
	, volT    : 'volup'
	, volL    : 'voldn'
	, volM    : 'volumemute'
	, volR    : 'volup'
	, volB    : 'voldn'
}
$( '.timemap, .covermap, .volmap' ).click( function() {
	var cmd = btnctrl[ this.id ];
	if ( GUI.display.coverart && $( this ).hasClass( 'timemap' ) || !cmd ) return
	
	if ( cmd === 'guide' ) {
		$( '#controls-cover, #controls-vol, .rs-tooltip, #imode' ).toggleClass( 'hide' );
		if ( !GUI.display.coverart ) $( '#controls-time, .controls1' ).toggleClass( 'hide' );
		return
	} else if ( cmd === 'menu' ) {
		$( '#menu-settings' ).click();
	} else if ( cmd === 'random' ) {
		$( '#random' ).click();
	} else if ( cmd === 'repeat' ) {
		if ( GUI.status.repeat ) {
			if ( GUI.status.single ) {
				$.post( 'enhance.php', { mpc: [ 'mpc repeat 0', 'mpc single 0' ] } );
			} else {
				$( '#single' ).click();
			}
		} else {
			$( '#repeat' ).click();
		}
	} else if ( cmd === 'play' ) {
		GUI.status.state === 'play' ? $( '#pause' ).click() : $( '#play' ).click();
	} else if ( cmd ) {
		$( '#'+ cmd ).click();
	}
} );
$( '#menu-top, #menu-bottom, #settings' ).click( function( e ) {
	if ( e.target.id !== 'menu-settings' && e.target.id !== 'badge' ) $( '#settings' ).addClass( 'hide' );
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} );
$( '#playsource-open' ).click( function() {
	$( '#playsource li a' ).addClass( 'inactive' );
	$( '#playsource-'+ GUI.status.activePlayer.toLowerCase() ).removeClass( 'inactive' )
	$( '#playsource' ).addClass( 'open' );
} );
$( '#playsource-close' ).click( function() {
	$( '#playsource' ).removeClass( 'open' );
} );
$( '#overlay-social-open' ).click( function() {
	$( '#overlay-social' ).addClass( 'open' );
	var urlTwitter = 'https://twitter.com/home?status=Listening+to+' + GUI.status.Title.replace( /\s+/g, '+' ) +'+by+'+ GUI.status.Artist.replace( /\s+/g, '+' ) +'+on+%40RuneAudio+http%3A%2F%2Fwww.runeaudio.com%2F+%23nowplaying';
	$( '#urlTwitter' ).attr( 'href', urlTwitter );
} );
$( '#overlay-social-close' ).click( function() {
	$( '#overlay-social' ).removeClass( 'open' );
} );
$( '#playsource-mpd' ).click( function() {
	$.post( 'enhance.php', { bash: '/usr/bin/systemctl restart shairport' } );
	if ( GUI.status.activePlayer !== 'MPD' ) switchPlaysource( 'MPD' );
} );
$( '#playsource-spotify' ).click( function() {
	$.post( 'enhance.php', { bash: '/usr/bin/redis-cli hget spotify enable' }, function( data ) {
		if ( data ) {
			switchPlaysource( 'Spotify' );
		} else {
			new PNotify( {
				  icon  : 'fa fa-exclamation-circle'
				, title : 'Spotify not enabled'
				, text  : 'Enable in Settings menu'
			} );
		}
	} );
} );
$( '#biocontent' ).delegate( '.biosimilar', 'click', function() {
	getBio( $( this ).find( 'p' ).text() )
} );
$( '#closebio' ).click( function() {
	$( '#bio' ).addClass( 'hide' );
	displayTopBottom();
} );
// LIBRARY /////////////////////////////////////////////////////////////////////////////////////
$.event.special.tap.emitTapOnTaphold = false; // suppress tap on taphold
$( '#home-blocks' ).on( 'tap', '.home-block', function() {
	var $this = $( this );
	var id = this.id;
	if ( GUI.local || $this.hasClass( 'home-bookmark' ) ) return
	
	var type = id.replace( 'home-', '' );
	if ( type === 'usb' && !GUI.libraryhome.usb ) {
		location.href = '/sources';
		return
	} else if ( type === 'nas' && !GUI.libraryhome.nas ) {
		location.href = '/sources/add';
		return
	} else if ( type === 'webradio' && !GUI.libraryhome.webradio ) {
		webRadioNew();
		return
	}
	
	var path = $this.find( '.lipath' ).text();
	var name = $this.find( '.bklabel' ).text();
	GUI.plugin = $this.data( 'plugin' );
	if ( id === 'home-spotify' && GUI.status.activePlayer !== 'Spotify' ) {
		$( '#playsource' ).addClass( 'open' );
	} else {
		GUI.dblist = 1;
		mutationLibrary.observe( observerLibrary, observerOption );
		var browsemode = $this.data( 'browsemode' );
		GUI.dbbrowsemode = browsemode ? browsemode : GUI.plugin ? GUI.plugin : 'file';
		getDB( {
			  browsemode : browsemode
			, path       : path
			, plugin     : GUI.plugin
		} );
	}
} ).on( 'tap', '.home-bookmark', function( e ) {
	$this = $( this );
	var path = $this.find( '.lipath' ).text();
	var name = $this.find( '.bklabel' ).text();
	if ( e.target.id === 'home-block-edit' ) {
		bookmarkRename( name, path, $this );
	} else if ( e.target.id === 'home-block-remove' ) {
		bookmarkDelete( name, $this );
	} else {
		GUI.dblist = 1;
		GUI.dbbrowsemode = 'file';
		getDB( {
			  browsemode : 'file'
			, path       : path
		} );
	}
} ).on( 'taphold', '.home-bookmark', function() {
	GUI.local = 1;
	setTimeout( function() { GUI.local = 0 }, 1000 );
	$( '.home-bookmark' )
		.append( '<i id="home-block-edit" class="fa fa-edit"></i><i id="home-block-remove" class="fa fa-minus-circle"></i>' )
		.find( '.fa-bookmark, gr' ).css( 'opacity', 0.2 );
} );

$( '#db-home' ).click( function() {
	$( '#tab-library' ).click();
	$( '.menu' ).addClass( 'hide' );
} );
$( '#db-currentpath' ).on( 'click', 'a', function() {
	if ( $( '#db-currentpath span a' ).length === 1 ) return
	var rootpath = this.id === 'rootpath';
	if ( [ 'album', 'artist', 'albumartist', 'composer', 'genre' ].indexOf( GUI.browsemode ) !== -1 && !rootpath ) return
	
	if ( rootpath ) {
		GUI.dbbackdata = [];
		var path = $( this ).data( 'path' );
	} else {
		var path = $( this ).find( '.lipath' ).text();
	}
	// get scroll position for back navigation
	GUI.dbscrolltop[ $( '#db-currentpath' ).find( '.lipath' ).text() ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	
	var path2mode = {
		  Album       : 'album'
		, Artist      : 'artist'
		, AlbumArtist : 'albumartist'
		, Composer    : 'composer'
		, Genre       : 'genre'
		, Dirble      : 'Dirble'
	}
	getDB( { browsemode: path2mode[ path ], path: path } );
} );
$( '#db-webradio-new' ).click( function() {
	webRadioNew();
} );
$( '#db-searchbtn' ).click( function() {
	$( '#db-search, #db-searchbtn' ).toggleClass( 'hide' );
	$( '#db-currentpath>span' ).addClass( 'hide' );
	if ( !$( '#db-search' ).hasClass( 'hide' ) ) $( '#db-search-keyword' ).focus();
} );
$( '#dbsearchbtn' ).click( function() {
	var keyword = $( '#db-search-keyword' ).val();
	if ( !keyword ) {
		$( '#db-search, #db-searchbtn' ).toggleClass( 'hide' );
		$( '#db-currentpath>span' ).removeClass( 'hide' );
		return
	}
	GUI.dblist = 1;
	getDB( {
		  cmd : 'search'
		, arg : keyword
	} );
} );
$( '#db-search-keyword' ).on( 'keypress', function( e ) {
	if ( e.which === 13 ) $( '#dbsearchbtn' ).click();
} );
// MutationObserver - watch for '#db-entries' content changed then scroll to previous position
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observerOption = { childList: true };
var observerLibrary = document.getElementById( 'db-entries' );
var mutationLibrary = new MutationObserver( function() { // on observed target changed
	var scrollpos = GUI.dbscrolltop[ $( '#db-currentpath' ).find( '.lipath' ).text() ];
	$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	mutationLibrary.disconnect();
} );
$( '#db-search-results' ).click( function() {
	$( this ).addClass( 'hide' );
	$( '#db-search, #db-searchbtn' ).toggleClass( 'hide' );
	$( '#db-search-keyword' ).val( '' );
	$( '#db-currentpath' ).css( 'width', '' );
	if ( GUI.currentpath ) {
		$( '#db-back' ).removeClass( 'hide' );
		getDB( GUI.dbbackdata.pop() );
		GUI.dbbackdata.pop();
		
		$( '#db-entries' ).removeAttr( 'style' );
		mutationLibrary.observe( observerLibrary, observerOption );
	} else {
		renderLibrary();
	}
} );
$( '#db-back' ).click( function() {
	mutationLibrary.observe( observerLibrary, observerOption ); // standard js - must be one on one element
	// topmost of path
	if ( GUI.dbbrowsemode === 'file' ) {
		if ( $( '#db-currentpath span a' ).length === 1 ) {
			renderLibrary();
		} else {
			$( '#db-currentpath a:nth-last-child( 2 )' ).click();
		}
		return
	}
	
	GUI.artistalbum = '';
	GUI.dbbackdata.pop();
	if ( !GUI.dbbackdata.length ) {
		renderLibrary();
		return
	}
	
	getDB( GUI.dbbackdata.pop() );
} );
$( '#db-entries' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	if ( $( e.target ).is( '.artist, .fa-artist, .fa-albumartist, .composer, .fa-composer' ) ) {
		var name = ( $( e.target ).is( '.composer, .fa-composer' ) ) ? $this.find( '.composer' ).text() : $this.find( '.artist' ).text();
		getBio( name );
		return
	} else if ( $( e.target ).hasClass( 'lialbum' ) ) {
		window.open( 'https://www.last.fm/music/'+ $this.find( '.artist' ).text() +'/'+ $this.find( '.lialbum' ).text(), '_blank' );
		return
	} else if ( $( e.target ).hasClass( 'db-icon' ) ) {
		$this.find( '.db-action' ).click();
		return
	}
	
	$( '.menu' ).addClass( 'hide' );
	// get file list in 'artist', 'composer', 'genre' mode (non-album)
	if ( $this.hasClass( 'licover' ) && GUI.dbbackdata.length ) {
		if ( [ 'artist', 'composer', 'genre' ].indexOf( GUI.dbbackdata[ 0 ].browsemode ) !== -1 ) {
			GUI.filelist = '';
			$.each( $( '#db-entries li .lipath' ).slice( 1 ), function( i, el ) {
				GUI.filelist += '"'+ el.text.replace( /"/g, '\"' ) +'" ';
			} );
		}
	}
	if ( $this.find( '.fa-music' ).length || $this.find( '.fa-webradio' ).length ) {
		if ( !GUI.display.tapaddplay ) {
			$this.find( 'i.db-action' ).click();
		} else {
			$thisli = $( this );
			if ( $thisli.hasClass( 'licover' ) || !$thisli.find( '.fa-music, .fa-webradio' ).length ) return
			GUI.list = {};
			GUI.list.path = $thisli.find( '.lipath' ).text();
			GUI.list.name = $thisli.find( '.liname' ).text();
			GUI.list.index = $thisli.find( '.liindex' ).text() || '';  // cue - in contextmenu
			var contextmenu = $thisli.find( '.db-action' ).data( 'target' );
			$( contextmenu ).find( 'a:eq( 1 )' ).click();
			setTimeout( function() {
				$thisli.removeClass( 'active' );
				$( contextmenu ).addClass( 'hide' );
			}, 0 );
		}
		return
	}
	
	var path = $this.find( '.lipath' ).text();
	// get scroll position for back navigation
	var currentpath = $( '#db-currentpath' ).find( '.lipath' ).text();
	GUI.dbscrolltop[ currentpath ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	$( '#db-entries li' ).removeClass( 'active' );
	$this.addClass( 'active' );
	if ( ( GUI.browsemode === 'artist' && currentpath !== 'Artist' )
		|| ( GUI.browsemode === 'albumartist' && currentpath !== 'AlbumArtist' )
	) {
		var artist = currentpath;
	} else if ( GUI.browsemode === 'album' || GUI.browsemode === 'genre' ) {
		var artist = $this.find( '.liartist' ).text() || '';
	} else {
		var artist = '';
	}
	var mode = $this.attr( 'mode' );
	if ( [ 'dirble', 'jamendo', 'spotify' ].indexOf( mode ) === -1 ) {
		getDB( {
			  path       : path
			, artist     : artist
			, browsemode : mode ? mode : 'file'
		} );
		return
	}
	
	if ( $this.attr( 'mode' ) === 'spotify' ) {
		getDB( {
			  path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			, plugin    : 'Spotify'
			, args      : path.toString()
			, querytype : 'tracks'
		} );
		GUI.plugin = 'Spotify';
	} else if ( $this.attr( 'mode' ) === 'dirble' ) {
		getDB( {
			  path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			, plugin    : 'Dirble'
			, querytype : $this.hasClass( 'db-dirble-child' ) ? 'stations' : 'childs'
			, args      : path
		} );
		GUI.plugin = 'Dirble';
	} else if ( $this.attr( 'mode' ) === 'jamendo' ) {
		// getDB( {
			//   path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			// , plugin    : 'Jamendo'
			// , querytype : 'radio'
			// , args      : path
		// } );
	}
} );
$( '#db-entries' ).on( 'click', '.db-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	// *.cue, *.m3u
	if ( $thisli.hasClass( 'licover' ) && $( '#db-entries li i.fa-list-ul' ).length ) $thisli = $thisli.next();
	$( '.menu' ).addClass( 'hide' );
	if ( $thisli.hasClass( 'active' ) ) {
		$thisli.removeClass( 'active' );
		return
	}
	
	GUI.list = {};
	GUI.list.path = $thisli.find( '.lipath' ).text() || '';
	GUI.list.name = $thisli.find( '.liname' ).text() || '';
	GUI.list.artist = $thisli.find( '.artist' ).text() || '';
	GUI.list.isfile = $thisli.hasClass( 'file' );              // file/dirble - in contextmenu
	GUI.list.index = $thisli.find( '.liindex' ).text() || '';  // cue - in contextmenu
	GUI.list.liindex = $( '#db-entries li' ).index( $thisli ); // for webradio delete - in contextmenu
	if ( $( '#db-currentpath' ).find( '.lipath' ).text() === 'Webradio' ) GUI.list.url = $thisli.find( '.bl' ).text();
	var $menu = $( $this.data( 'target' ) );
	$( '.replace' ).toggleClass( 'hide', !GUI.status.playlistlength );
	$( '.update' ).toggleClass( 'hide', GUI.status.updating_db !== 0 );
	$( '.lastfm' ).toggleClass( 'hide', GUI.list.name.slice( -4, -3 ) === '.' );
	var contextnum = $menu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 41 - 1 );
	$( '#db-entries li' ).removeClass( 'active' );
	$thisli.addClass( 'active' );
	if ( $thisli.hasClass( 'licover' ) ) {
		var menutop = $( '#menu-top' ).hasClass( 'hide' ) ? '270px' : '310px';
	} else {
		var menutop = ( $thisli.position().top + 49 ) +'px';
	}
	$menu
		.css( 'top',  menutop )
		.removeClass( 'hide' );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
} );
$( '#db-index li' ).click( function() {
	var topoffset = GUI.display.bars ? 80 : 40;
	var indextext = $( this ).text();
	var $this = $( this );
	var match = 0;
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		if ( $( '#db-entries .lisort:eq( 0 )' ).text()[ 0 ] === 'A' ) $this.css( 'color', '#000000' );
		return
	}
	$.each( $( '#db-entries li' ), function( i, el ) {
		if ( $( el ).find( '.lisort' ).text()[ 0 ] === indextext ) {
			$( 'html, body' ).scrollTop( el.offsetTop - topoffset );
			match = 1;
			return false
		}
	} );
	if ( !match ) {
		$this.css( 'color', '#000000' );
		if ( $this.text() !== 'Z' ) $this.next().click();
	}
} );
$( '#db-entries, #pl-editor' ).on( 'click', 'p', function() {
	$( '.menu' ).addClass( 'hide' );
	$( '#db-entries li, #pl-editor li' ).removeClass( 'active' );
} );
// PLAYLIST /////////////////////////////////////////////////////////////////////////////////////
$( '#pl-home' ).click( function() {
	$( '#tab-playlist' ).click();
} );
$( '#pl-currentpath' ).on( 'click', '.plsback', function() {
	$( '.menu' ).addClass( 'hide' );
	$( '#plopen' ).click();
} );
$( '#pl-currentpath' ).on( 'click', '.plsbackroot', function() {
	$( '#tab-playlist' ).click();
} );
$( '#plopen' ).click( function() {
	if ( !GUI.lsplaylists.length ) return
	
	$( '.playlist, #pl-searchbtn' ).addClass( 'hide' );
	$( '#loader' ).removeClass( 'hide' );
	
	var pl = GUI.lsplaylists;
	var plL = pl.length;
	var plcounthtml = '<wh><i class="fa fa-microsd"></i></wh><bl>PLAYLIST</bl>';
	plcounthtml += plL ? '<gr>&ensp;·&emsp;</gr> <wh id="pls-count">'+ numFormat( plL ) +'</wh>&ensp;<i class="fa fa-list-ul"></i>' : '';
	$( '#pl-currentpath' ).html( plcounthtml +'<i class="fa fa-arrow-left plsbackroot"></i>' );
	$( '#pl-currentpath, #pl-editor, #pl-index' ).removeClass( 'hide' );
	
	pl.sort( function( a, b ) {
		return stripLeading( a ).localeCompare( stripLeading( b ), undefined, { numeric: true } );
	} );
	var content = '';
	pl.forEach( function( el ) {
		content += '<li class="pl-folder"><i class="fa fa-list-ul pl-icon"><a class="liname">'+ el +'</a></i><i class="fa fa-bars pl-action" data-target="#context-menu-playlist"></i><span class="plname">'+ el +'</span></li>';
	} );
	$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
		GUI.pleditor = 1;
		// fill bottom of list to mave last li movable to top
		$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
		$( '#pl-editor' ).css( 'width', '' );
		$( '#loader' ).addClass( 'hide' );
		$( 'html, body' ).scrollTop( GUI.plscrolltop );
		displayIndexBar();
	} );
} );
$( '#plsave' ).click( function() {
	if ( !GUI.status.playlistlength ) return
	
	playlistNew();
} );
$( '#plcrop' ).click( function() {
	if ( GUI.status.state === 'stop' || !GUI.status.playlistlength ) return
	info( {
		  title    : 'Crop Playlist'
		 , message : 'Clear this playlist except current song?'
		, cancel   : 1
		, ok       : function() {
			$.post( 'enhance.php', { mpc: 'mpc crop' } );
		}
	} );
} );
$( '#plclear' ).click( function() {
	if ( GUI.display.plclear ) {
		info( {
			  title   : 'Clear Playlist'
			, message : 'Clear this playlist?'
			, cancel  : 1
			, ok      : function() {
				GUI.status.playlistlength = 0;
				renderPlaylist();
				setPlaybackBlank();
				$.post( 'enhance.php', { mpc: 'mpc clear' } );
			}
		} );
	} else {
		GUI.status.playlistlength = 0;
		renderPlaylist();
		setPlaybackBlank();
		$.post( 'enhance.php', { mpc: 'mpc clear' } );
	}
} );
$( '#pl-filter' ).on( 'keyup', function() {
	var search = $(this).val();
	var count = 0;
	$( '#pl-entries li' ).each( function() {
		var $this = $( this );
		var match = ( $this.text().search( new RegExp( search, 'i' ) ) >= 0 ) ? true : false;
		count = match ? ( count + 1 ) : count;
		$this.toggle( match );
	} );
	if ( search ) {
		$( '#pl-manage, #pl-count' ).addClass( 'hide' );
		$( '#pl-filter-results' ).removeClass( 'hide' ).html( 
			'<i class="fa fa-times sx"></i><span>'+ count +' <a>of</a> </span>'
		);
	} else {
		$( '#pl-manage, #pl-count' ).removeClass( 'hide' );
		$( '#pl-filter-results' ).addClass( 'hide' ).empty();
	}
} );
$( '#pl-filter-results' ).click( function() {
	$( this ).addClass( 'hide' ).empty();
	$( '#pl-manage, #pl-count, #pl-entries li' ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
	$( '#pl-entries li' ).show();
} );
$( '#pl-searchbtn, #plsearchbtn, #pl-filter-results' ).click( function() {
	$( '#pl-count, #pl-search, #pl-searchbtn, #pl-manage' ).toggleClass( 'hide' );
	if ( !$( '#pl-search' ).hasClass( 'hide' ) ) $( '#pl-filter' ).focus();
} );
new Sortable( document.getElementById( 'pl-entries' ), {
	  ghostClass : 'sortable-ghost'
	, delay      : 500
	, onStart    : function( e ) {
		$icon = $( e.item ).find( 'i' );
		$icon.css( 'visibility', 'hidden' );
	  }
	, onEnd      : function() {
		$icon.css( 'visibility', '' );
	  }
	, onUpdate   : function ( e ) {
		if ( $( e.from ).hasClass( 'active' ) ) {
			$( e.to ).removeClass( 'active' );
			$( e.item ).addClass( 'active' )
			GUI.status.Pos = $( e.item ).index();
			GUI.status.song = GUI.status.Pos;
		}
		GUI.local = 1;
		setTimeout( function() { GUI.local = 0 }, 500 );
		$.post( 'enhance.php', { mpc: 'mpc move '+ ( e.oldIndex + 1 ) +' '+ ( e.newIndex + 1 ) } );
	}
} );
$( '#pl-entries' ).on( 'click', 'li', function( e ) {
	if ( $( e.target ).parent().hasClass( 'elapsed' )
		|| $( e.target ).is( '.elapsed, .time' )
	) {
		$( '#stop' ).click();
		return
	}
	
	var songpos = $( this ).index() + 1;
	if ( !$( e.target ).hasClass( 'pl-action' ) ) {
		var state = GUI.status.state;
		if ( state == 'stop' ) {
			$.post( 'enhance.php', { mpc: 'mpc play '+ songpos } );
		} else {
			if ( $( this ).hasClass( 'active' ) ) {
				state == 'play' ? $( '#pause' ).click() : $( '#play' ).click();
			} else {
				$.post( 'enhance.php', { mpc: 'mpc play '+ songpos } );
			}
		}
		return
	}
	
	var $this = $( this );
	var webradio = $this.hasClass( 'webradio' );
	var $elcount = webradio ? $( '#countradio' ) : $( '#countsong' );
	var count = $elcount.attr( 'count' ) - 1;
	$elcount.attr( 'count', count ).text( count );
	var time = +$( '#pltime' ).attr( 'time' ) - $this.find( '.time' ).attr( 'time' );
	if ( !webradio ) $( '#pltime' ).attr( 'time', time ).text( second2HMS( time ) );
	if ( count === 0 ) {
		$( '#pl-count' ).find( 'gr:contains(•)' ).remove();
		$elcount.next().remove();
		$elcount.remove();
		if ( $elcount[ 0 ].id === 'countradio' ) {
			$( '#pltime' ).css( 'color', '#e0e7ee' );
		} else {
			$( '#pltime' ).remove();
		}
	}
	if ( $this.hasClass( 'active' ) ) {
		if ( $this.index() + 1 < $this.siblings().length ) {
			$this.next().addClass( 'active' );
		} else {
			$( '#pl-entries li:eq( 0 )' ).addClass( 'active' );
			$( 'html, body' ).scrollTop( 0 );
		}
	}
	$this.remove();
	GUI.local = 1;
	setTimeout( function() { GUI.local = 0 }, 500 );
	$.post( 'enhance.php', { mpc: 'mpc del '+ songpos } );
	if ( !$( '#countsong, #countradio' ).length ) {
		GUI.status.playlistlength = 0;
		renderPlaylist();
	}
} );
$( '#pl-editor' ).on( 'click', 'li', function( e ) {
	// in saved playlist
	var $thisli = $( this );
	if ( $thisli.find( '.fa-music' ).length || $thisli.find( '.fa-webradio' ).length ) {
		if ( !GUI.display.tapaddplay || $( e.target ).hasClass( 'pl-icon' ) ) {
			$thisli.find( '.pl-action' ).click();
		} else {
			GUI.list = {};
			GUI.list.li = $thisli; // for contextmenu
			GUI.list.name = $thisli.find( '.liname' ).text();
			GUI.list.path = $thisli.find( '.lipath' ).text();
			var contextmenu = $thisli.find( '.pl-action' ).data( 'target' );
			$( contextmenu ).find( 'a:eq( 1 )' ).click();
			setTimeout( function() {
				$thisli.removeClass( 'active' );
				$( contextmenu ).addClass( 'hide' );
			}, 0 );
		}
		return
	}
	
	if ( $( e.target ).hasClass( 'pl-icon' ) ) {
		$thisli.find( '.pl-action' ).click();
	} else {
		renderSavedPlaylist( $( this ).find( 'span' ).text() );
	}
} );
$( '#pl-editor' ).on( 'click', '.pl-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	GUI.list = {};
	GUI.list.li = $thisli; // for contextmenu
	GUI.list.name = $thisli.find( '.liname' ).text();
	GUI.list.path = $thisli.find( '.lipath' ).text() || GUI.list.name;
	GUI.list.isfile = $thisli.find( '.fa-music' ).length; // used in contextmenu
	$( '.menu' ).addClass( 'hide' );
	if ( $thisli.hasClass( 'active' ) ) {
		$thisli.removeClass( 'active' );
		return
	}
	$( '.replace' ).toggleClass( 'hide', !GUI.status.playlistlength );
	var contextmenu = $thisli.find( '.pl-action' ).data( 'target' );
	var contextnum = $( contextmenu ).find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 41 - 1 );
	$( '#pl-editor li' ).removeClass( 'active' );
	$thisli.addClass( 'active' );
	$( contextmenu )
		.removeClass( 'hide' )
		.css( 'top', ( $thisli.position().top + 49 ) +'px' );
	var targetB = $( contextmenu ).offset().top + 246;
	var wH = window.innerHeight;
	if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
} );
$( '#pl-index li' ).click( function() {
	var topoffset = GUI.display.bars ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	var matcharray = $( '#pl-editor li' ).filter( function() {
		var name = stripLeading( $( this ).find( '.lipath' ).text() );
		return name.match( new RegExp( '^'+ indextext, 'i' ) );
	} );
	if ( matcharray.length ) $( 'html, body' ).scrollTop( matcharray[ 0 ].offsetTop - topoffset );
} );

document.addEventListener( 'visibilitychange', function() {
	if ( document.hidden ) {
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		clearInterval( GUI.intElapsedPl );
	} else {
		if ( GUI.playback ) {
			getPlaybackStatus();
		} else if ( GUI.library && !$( '#home-blocks' ).hasClass( 'hide' ) ) {
			renderLibrary();
		} else {
			displayTopBottom();
		}
		if ( GUI.playlist ) {
			if ( GUI.pleditor ) {
				$( '#pl-currentpath .lipath' ).text() ? renderSavedPlaylist( $( '#pl-currentpath .lipath' ).text() ) : $( '#plopen' ).click();
			} else {
				setPlaylistScroll();
			}
		}
	}
} );
window.addEventListener( 'orientationchange', function() {
	if ( GUI.playback ) {
		$( '#playback-row' ).addClass( 'hide' );
		setTimeout( function() {
			displayPlayback()
			scrollLongText();
			$( '#playback-row' ).removeClass( 'hide' );
		}, 300 );
	} else {
		if ( GUI.dblist || !$( '#pl-editor' ).hasClass( 'hide' ) ) displayIndexBar();
	}
} );

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

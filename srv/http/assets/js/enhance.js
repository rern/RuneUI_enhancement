var GUI = { // outside '$( function() {' enable console.log access
	  activePlayer : ''
	, airplay      : {}
	, artistalbum  : ''
	, bookmarkedit : 0
	, browsemode   : ''
	, counts       : {}
	, currentpath  : ''
	, dbcurrent    : ''
	, dbback       : 0
	, dbbackdata   : []
	, dbbrowsemode : ''
	, dblist       : 0
	, dbpath       : ''
	, dbscrolltop  : {}
	, display      : {}
	, imodedelay   : 0
	, json         : 0
	, intElapsed   : ''
	, intKnob      : ''
	, list         : {}
	, libraryhome  : {}
	, local        : 0
	, lsplaylists  : []
	, noticeUI     : {}
	, playlist     : {}
	, plcurrent    : ''
	, pleditor     : 0
	, plscrolltop  : 0
	, plugin       : ''
	, status       : {}
	, swipe        : 0
	, timeout      : ''
	, updating     : 0
};
var blinkdot = '<a class="dot">.</a> <a class="dot dot2">.</a> <a class="dot dot3">.</a>';

$.post( 'enhance.php', { getdisplay: 1 } ); // init display data > pushstream > getPlaybackStatus()

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$.post( 'enhance.php', { library: 1 } );

var menuH = $( '#settings' ).find( 'i' ).length * 41;
$( '#settings .menushadow' ).css( 'height', menuH );
$( '#menu-settings, #badge' ).click( function() {
	$( '#settings' )
		.toggleClass( 'hide' )
		.css( 'top', $( '#menu-top' ).is( ':hidden' ) ? 0 : '40px' );
} );
$( '#song, #playlist-warning' ).on( 'click', 'i', function() {
	$( '#open-library' ).click();
} );
$( '#open-library' ).click( function() {
	if ( $.isEmptyObject( GUI.libraryhome ) ) return
	
	if ( GUI.bookmarkedit ) {
		GUI.bookmarkedit = 0;
		renderLibrary();
		return
	}
	if ( GUI.activePlayer === 'Airplay' ) {
		$( '#playsource' ).addClass( 'open' );
		return
	}
	
	if ( $( this ).hasClass( 'active' ) && GUI.dblist ) {
		GUI.dblist = GUI.dbback = 0;
		GUI.currentpath = GUI.browsemode = GUI.dbbrowsemode = ''
		GUI.dbbackdata = [];
		
		renderLibrary();
		return
	}
	
	setPanelActive( 'panel-library' );
	if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
		renderLibrary();
		displayLibrary();
	} else {
		var scrollpos = GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ];
		$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	}
} );
$( '#open-playback' ).click( function() {
	setPanelActive( 'panel-playback' );
	getPlaybackStatus();
} );
$( '#open-playlist' ).click( function() {
	
	if ( $( this ).hasClass( 'active' ) && GUI.pleditor ) GUI.pleditor = 0;
	if ( GUI.activePlayer === 'Airplay' ) {
		$( '#playsource' ).addClass( 'open' );
		return
	}
	setPanelActive( 'panel-playlist' );
	if ( GUI.pleditor ) return
	
	$.post( 'enhance.php', { getplaylist: 1 }, function( data ) {
		GUI.lsplaylists = data.lsplaylists || [];
		GUI.playlist = data.playlist;
		renderPlaylist();
	}, 'json' );
} );
$( '#panel-playback, #panel-library, #panel-playlist' ).on( 'swipeleft swiperight', function( e ) {
	panelLR( e.type === 'swipeleft' ? 'left' : '' );
	// fix: prevent taphold fire on swipe
	tempFlag( 'swipe', 1000 );
} );

$( '#panel-playback' ).click( function( e ) {
	if ( $( e.target ).is( '.controls, .timemap, .covermap, .volmap' ) ) return
	
	$( '.controls, #settings' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} ).on( 'taphold', function( e ) {
	if ( GUI.swipe || $( e.target ).parents().hasClass( 'rs-transition' ) ) return
	
	info( {
		  title        : 'Playback'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysaveplayback">'
				+ libraryLabel( 'bars', 'Top-Bottom menu' )
				+ libraryLabel( 'time', 'Time' )
				+ libraryLabel( 'radioelapsed', 'Webradio elapsed' )
				+ libraryLabel( 'coverart', 'Cover art' )
				+ libraryLabel( 'coverlarge', 'Large Cover art' )
				+ libraryLabel( 'volume', 'Volume' )
				+ libraryLabel( 'buttons', 'Buttons' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			displayPlayback();
			$.post( 'enhance.php', { setdisplay: GUI.display } );
		}
	} );
	// disable by mpd volume
	if ( !GUI.display.volumempd ) setToggleButton( 'volume', '(disabled)' );
	// disable by autohide
	if ( window.innerWidth >= 500 ) return
	
	if ( window.innerHeight <= 515 ) setToggleButton( 'bars' );
	if ( window.innerHeight <= 320 ) setToggleButton( 'buttons' );
} );
$( '#panel-library' ).on( 'click', function( e ) {
	if ( GUI.local ) return
	
	if ( e.target.id !== 'home-block-edit' && e.target.id !== 'home-block-remove' ) {
		$( '#home-block-edit, #home-block-remove' ).remove();
		$( '.home-bookmark' ).find( '.fa-bookmark, gr' ).css( 'opacity', '' );
	}
} ).on( 'taphold', function( e ) {
	if ( GUI.swipe || GUI.local ) return
	
	GUI.taphold = 1;
	if ( $( e.target ).hasClass( 'home-block' ) ) return
	
	var count = GUI.display.count;
	info( {
		  title        : 'Libary Home'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysavelibrary">'
				+ libraryLabel( 'count', 'Count' )
				+ libraryLabel( 'label', 'Label' )
				+ libraryLabel( 'sd', 'SD' )
				+ libraryLabel( 'usb', 'USB' )
				+ libraryLabel( 'nas', 'Network' )
				+ libraryLabel( 'webradio', 'Webradio' )
				+ libraryLabel( 'albums', 'Album' )
				+ libraryLabel( 'artists', 'Artist' )
				+ libraryLabel( 'composer', 'Composer' )
				+ libraryLabel( 'genre', 'Genre' )
				+ libraryLabel( 'dirble', 'Dirble' )
				+ libraryLabel( 'jamendo', 'Jamendo' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			$( '#displaysavelibrary input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			tempFlag( 'local' );
			$.post( 'enhance.php', { setdisplay: GUI.display } );
			if ( !GUI.display.count ) { 
				GUI.libraryhome = {
					  bookmark     : GUI.libraryhome.bookmark
					, activeplayer : GUI.libraryhome.activeplayer
					, spotify      : GUI.libraryhome.spotify
				};
			}
			if ( GUI.display.count !== count && !count ) {
				$.post( 'enhance.php', { library: 1 }, function( data ) {
					renderLibrary();
					displayLibrary();
				} );
			} else {
				renderLibrary();
				displayLibrary();
			}
		}
	} );
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
		tempFlag( 'local' );
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
	, stop            : function( e ) { // on 'stop drag'
//		tempFlag( 'local' );
//		$.post( 'enhance.php', { volume: e.value } );
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
	tempFlag( 'local' );
	$.post( 'enhance.php', { volume: 'setmute' } );
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	if ( ( vol === 0 && ( thisid === 'voldn' ) ) || ( vol === 100 && ( thisid === 'volup' ) ) ) return

	vol = ( thisid === 'volup' ) ? vol + 1 : vol - 1;
	$volumeRS.setValue( vol );
	tempFlag( 'local' );
	$.post( 'enhance.php', { volume: vol } );
} );
$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var cmd = $this.data( 'cmd' );
	if ( $this.hasClass( 'btn-toggle' ) ) {
		if ( GUI.status.ext === 'radio' ) return
		
		if ( cmd === 'pl-ashuffle-stop' ) {
			$.post( 'enhance.php', { bash: '/usr/bin/killall ashuffle &' } );
			return
		}
		var onoff = GUI.status[ cmd ] ? 0 : 1;
		GUI.status[ cmd ] = onoff;
		cmd = cmd +' '+ onoff;
	} else {
		if ( cmd === 'pause' || cmd === 'stop' ) {
			clearInterval( GUI.intKnob );
			clearInterval( GUI.intElapsed );
			if ( GUI.status.ext === 'radio' ) {
				cmd = 'stop';
				$( '#song' ).empty();
			}
		} else if ( cmd === 'previous' || cmd === 'next' ) {
			// enable previous / next while stop
			if ( GUI.status.playlistlength === 1 ) return
			
			var current = GUI.status.song + 1;
			var last = GUI.status.playlistlength;
			
			if ( GUI.status.random === 1 ) {
				// improve: repeat pattern of mpd random
				// Math.floor( Math.random() * ( max - min + 1 ) ) + min;
				var pos = Math.floor( Math.random() * last );
				// avoid same pos ( no pos-- or pos++ in ternary )
				if ( pos === current ) pos = ( pos === last ) ? pos - 1 : pos + 1;
			} else {
				if ( cmd === 'previous' ) {
					var pos = current !== 1 ? current - 1 : last;
				} else {
					var pos = current !== last ? current + 1 : 1;
				}
			}
			if ( GUI.status.state === 'play' ) {
				cmd = 'play '+ pos;
			} else {
				$.post( 'enhance.php', { mpc: [ 'mpc play '+ pos, 'mpc stop' ] } );
				return
			}
		}
	}
	$.post( 'enhance.php', { mpc: 'mpc '+ cmd } );
} );
$( '#coverTL' ).click( function() {
	$( '.controls' ).addClass( 'hide', !$( this ).hasClass( 'hide' ) );
	if ( $( '#album' ).text().slice( 0, 4 ) === 'http' ) return;
	
	$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
		$.each( status, function( key, value ) {
			GUI.status[ key ] = value;
		} );
		var coverlarge = GUI.display.coverlarge;
		var time = GUI.display.time;
		var volume = GUI.display.volume;
		GUI.display.coverlarge = $( '#divcover' ).hasClass( 'coversmall' ) ? 'checked' : '';
		if ( GUI.display.volumempd ) {
			if ( $( '#time-knob' ).is( ':visible' ) && $( '#volume-knob' ).is( ':visible' ) ) {
				if ( GUI.display.volume && GUI.display.time ) {
					GUI.display.coverlarge = 'checked';
					GUI.display.time = '';
					GUI.display.volume = '';
				} else {
					GUI.display.coverlarge = coverlarge;
					GUI.display.time = time;
					GUI.display.volume = volume;
				}
			} else if ( $( '#time-knob' ).is( ':hidden' ) && $( '#volume-knob' ).is( ':hidden' ) ) {
				if ( GUI.display.time || GUI.display.volume ) {
					GUI.display.coverlarge = coverlarge;
					GUI.display.time = time;
					GUI.display.volume = volume;
				} else {
					GUI.display.coverlarge = coverlarge ? '' : 'checked';
					GUI.display.time = 'checked';
					GUI.display.volume = 'checked';
				}
			} else {
				if ( GUI.display.volume && GUI.display.time ) {
					GUI.display.time = 'checked';
					GUI.display.volume = 'checked';
				} else {
					GUI.display.coverlarge = 'checked';
					GUI.display.time = '';
					GUI.display.volume = '';
				}
			}
		} else {
			if ( $( '#time-knob' ).is( ':visible' ) ) {
				GUI.display.coverlarge = 'checked';
				GUI.display.time = '';
			} else {
				GUI.display.coverlarge = coverlarge;
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
	}, 'json' );
} );
var btnctrl = {
	  timeTL : 'playsource-open'
	, timeT  : 'guide'
	, timeTR : 'menu'
	, timeL  : 'previous'
	, timeM  : 'play'
	, timeBL : 'random'
	, timeR  : 'next'
	, timeB  : 'stop'
	, timeBR : 'repeat'
	, coverT : 'guide'
	, coverTR: 'menu'
	, coverL : 'previous'
	, coverM : 'play'
	, coverR : 'next'
	, coverBL: 'random'
	, coverB : 'stop'
	, coverBR: 'repeat'
	, volT   : 'volup'
	, volL   : 'voldn'
	, volM   : 'volumemute'
	, volR   : 'volup'
	, volB   : 'voldn'
}
$( '.timemap, .covermap, .volmap' ).click( function() {
	var id = this.id;
	var cmd = btnctrl[ id ];
	if ( cmd === 'guide' ) {
		$( '.controls, .controls1, .rs-tooltip, #imode' ).toggleClass( 'hide' );
		return
	} else if ( cmd === 'menu' ) {
		$( '#menu-settings' ).click();
	} else if ( cmd === 'random' ) {
		$( '#random' ).click();
	} else if ( cmd === 'repeat' ) {
		if ( GUI.status.repeat ) {
			if ( GUI.status.single ) {
				GUI.status.repeat = GUI.status.single = 0;
				$( '#repeat, #single' ).removeClass( 'btn-primary' );
				$( '#irepeat, #posrepeat' ).attr( 'class', 'fa hide' );
				tempFlag( 'local' );
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
$( '#biocontent' ).delegate( '.biosimilar', 'click', function() {
	getBio( $( this ).find( 'p' ).text() )
} );
$( '#closebio' ).click( function() {
	$( '#bio' ).addClass( 'hide' );
	displayCommon();
} );
$( '#turnoff' ).click( function() {
	info( {
		  icon        : 'power'
		, title       : 'Power'
		, message     : 'Select mode:'
		, oklabel     : 'Off'
		, okcolor     : '#bb2828'
		, ok          : function() {
			$.post( 'enhance.php', { 'power' : 'shutdown' } );
			$( '#loader' ).removeClass( 'hide' );
		}
		, buttonlabel : 'Reboot'
		, buttoncolor : '#de810e'
		, button      : function() {
			$.post( 'enhance.php', { 'power' : 'reboot' } );
			$( '#loader' ).removeClass( 'hide' );
		}
	} );
} );
$( '#playsource-open' ).click( function() {
	$( '#playsource li a' ).addClass( 'inactive' );
	$( '#playsource-'+ GUI.activePlayer.toLowerCase() ).removeClass( 'inactive' )
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
	if ( GUI.activePlayer !== 'MPD' ) switchPlaysource( 'MPD' );
} );
$( '#playsource-spotify' ).click( function() {
	$.post( 'enhance.php', { bash: '/usr/bin/redis-cli hget spotify enable' }, function( data ) {
		if ( data ) {
			switchPlaysource( 'Spotify' );
		} else {
			new PNotify( {
				  title : 'Spotify not enabled'
				, text  : 'Enable in Settings menu'
				, icon  : 'fa fa-exclamation-circle'
			} );
		}
	} );
} );
$( '#home-blocks' ).on( 'click', '.home-block', function( e ) {
	var $this = $( this );
	var id = this.id;
	if ( GUI.local || GUI.taphold ) {
		GUI.taphold = 0;
		return
	}
	
	var type = id.replace( 'home-', '' );
	GUI.plugin = $this.data( 'plugin' );
	if ( !GUI.libraryhome[ type ] && !$this.hasClass( 'home-bookmark' ) && !GUI.plugin ) {
		if ( type === 'usb' ) {
			location.href = '/sources';
		} else if ( type === 'nas' ) {
			location.href = '/sources/add';
		} else if ( type === 'webradio' ) {
			webRadioNew();
		}
		return
	}

	if ( e.target.id === 'home-block-edit' ) {
		bookmarkRename( $this.find( '.bklabel' ).text(), $this.data( 'path' ), $this )
	} else if ( e.target.id === 'home-block-remove' ) {
		bookmarkDelete( $this.find( '.bklabel' ).text(), $this )
	} else if ( id === 'home-spotify' && GUI.activeplayer !== 'Spotify' ) {
		$( '#playsource' ).addClass( 'open' );
	} else {
		GUI.dblist = 1;
		mutationLibrary.observe( observerLibrary, observerOption );
		var browsemode = $this.data( 'browsemode' );
		GUI.dbbrowsemode = browsemode ? browsemode : GUI.plugin ? GUI.plugin : 'file';
		getDB( {
			  browsemode : browsemode
			, path       : $this.data( 'path' )
			, plugin     : GUI.plugin
		} );
	}
} ).on( 'taphold', '.home-block', function( e ) {
	if ( GUI.swipe || !$( this ).hasClass( 'home-bookmark' ) ) return
	
	tempFlag( 'local' );
	$( '.home-bookmark' )
		.append( '<i id="home-block-edit" class="fa fa-edit"></i><i id="home-block-remove" class="fa fa-minus-circle"></i>' )
		.find( '.fa-bookmark, gr' ).css( 'opacity', 0.2 );
} );
$( '#db-home' ).click( function() {
	$( '#open-library' ).click();
} );
$( '#db-currentpath' ).on( 'click', 'a', function() {
	if ( $( '#db-currentpath span a' ).length === 1 ) return
	var path = $( this ).data( 'path' );
	// get scroll position for back navigation
	GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	
	var path2mode = {
		  Artists  : 'artist'
		, Albums   : 'album'
		, Genres   : 'genre'
		, Composer : 'composer'
		, Dirble   : 'Dirble'
	}
	getDB( { browsemode: path2mode[ path ], path: path } );
} );
$( '#db-webradio-new' ).click( function() {
	webRadioNew();
} );
$( '#db-searchbtn' ).click( function() {
	$( '#db-search, #db-searchbtn' ).toggleClass( 'hide' );
	$( '#db-currentpath>span' ).addClass( 'hide' );
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
	var scrollpos = GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ];
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
$( '#db-back' ).on( 'click', function() {
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
	
	var dbbacklast = GUI.dbbackdata.pop();
	getDB( dbbacklast );
} );
$( '#db-entries' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	var $dbicon = $this.find( 'i.db-icon' )
	if ( $dbicon.hasClass( 'fa-music' ) || $dbicon.hasClass( 'fa-webradio' ) ) {
		setTimeout( function() {
			$this.find( 'i.db-action' ).click();
		}, 0 );
		return
	}
	
	var path = $this.data( 'path' );
	// get scroll position for back navigation
	var currentpath = $( '#db-currentpath' ).attr( 'path' );
	GUI.dbscrolltop[ currentpath ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	$( '#db-entries li' ).removeClass( 'active' );
	$this.addClass( 'active' );
	
	if ( GUI.browsemode === 'artist' && currentpath !== 'Artists' ) {
		var artist = currentpath;
	} else if ( GUI.browsemode === 'album' ) {
		var artist = $this.data( 'artist' ) || '';
	} else {
		var artist = '';
	}
	var mode = $this.attr( 'mode' );
	if ( [ 'dirble', 'jamendo', 'spotify' ].indexOf( mode ) === -1 ) {
		getDB( {
			  path       : path
			, artist     : artist
			, uplevel    : 0
			, browsemode : mode ? mode : 'file'
		} );
		return
	}
	
	if ( $this.attr( 'mode' ) === 'spotify' ) {
		getDB( {
			  path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			, plugin    : 'Spotify'
			, args      : $this.data( 'path' ).toString()
			, querytype : 'tracks'
		} );
		GUI.plugin = 'Spotify';
	} else if ( $this.attr( 'mode' ) === 'dirble' ) {
		getDB( {
			  path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			, plugin    : 'Dirble'
			, querytype : $this.hasClass( 'db-dirble-child' ) ? 'stations' : 'childs'
			, args      : $this.data( 'path' )
		} );
		GUI.plugin = 'Dirble';
	} else if ( $this.attr( 'mode' ) === 'jamendo' ) {
		// getDB( {
			//   path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			// , plugin    : 'Jamendo'
			// , querytype : 'radio'
			// , args      : $this.data( 'path' )
		// } );
	}
} );
$( '#db-entries' ).on( 'click', '.db-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	GUI.dbpath = $thisli.data( 'path' );
	GUI.list = {};
	GUI.list.path = $thisli.hasClass( 'db-webradio' ) ? $thisli.find( '.bl' ).text() : GUI.dbpath; // used in contextmenu
	GUI.list.name = $thisli.hasClass( 'db-webradio' ) ? $thisli.find( '.sn' ).text() : $thisli.attr( 'liname' );
	var icon = $thisli.find( 'i.db-icon' );
	GUI.list.isfile = icon.hasClass( 'fa-music' ) || icon.hasClass( 'fa-webradio' ); // file/dirble - used in contextmenu
	if ( $( '#db-currentpath' ).attr( 'path' ) === 'Webradio' ) GUI.list.url = $thisli.find( '.bl' ).text();
	var $menu = $( $this.data( 'target' ) );
	$( '#db-entries li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( GUI.dbpath === GUI.dbcurrent ) {
		GUI.dbcurrent = '';
	} else {
		GUI.dbcurrent = GUI.dbpath;
		$thisli.addClass( 'active' );
		$menu.removeClass( 'hide' )
			.css( 'top', $this.position().top +'px' )
			.find( '.menushadow' ).css( 'height', $menu.find( 'i' ).length * 41 );
		var targetB = $menu.offset().top + $menu.height();
		var wH = window.innerHeight;
		if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
	}
} );
$( '#db-index li' ).click( function() {
	var topoffset = GUI.display.bars ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	var usbpath = GUI.currentpath.slice( 0, 3 ) === 'USB' ? 1 : 0;
	var datapathindex, name;
	var matcharray = $( '#db-entries li' ).filter( function() {
		var $this = $( this );
		if ( usbpath ) {
			name = $this.find( 'span:eq( 0 )' ).text().replace( /^.*\//, '' );
			name = GUI.currentpath +'/'+  stripLeading( name );
			datapathindex = GUI.currentpath +'/'+ indextext;
		} else {
			name = stripLeading( $this.data( 'path' ) );
			datapathindex = '^'+ indextext;
		}
		return name.match( new RegExp( datapathindex, 'i' ) );
	} );
	if ( matcharray.length ) $( 'html, body' ).scrollTop( matcharray[ 0 ].offsetTop - topoffset );
} );
$( '#pl-searchbtn, #plsearchbtn, #pl-filter-results' ).click( function() {
	$( '#pl-count, #pl-search, #pl-searchbtn, #pl-manage' ).toggleClass( 'hide' );
} );
$( '#pl-entries' ).on( 'click', 'li', function( e ) {
	if ( $( e.target ).parent().hasClass( 'elapsed' )
		|| $( e.target ).hasClass( 'elapsed' )
		|| $( e.target ).hasClass( 'time' )
	) {
		$( '#stop' ).click();
		return
	}
	
	var songpos = $( this ).index() + 1;
	if ( !$( e.target ).hasClass( 'pl-action' ) ) {
		var state = GUI.status.state;
		if ( state == 'stop' ) {
			$.post( 'enhance.php', { mpc: 'mpc play '+ songpos } );
			$( '#pl-entries li' ).removeClass( 'active' );
			$( this ).addClass( 'active' );
		} else {
			if ( $( this ).hasClass( 'active' ) ) {
				state == 'play' ? $( '#pause' ).click() : $( '#play' ).click();
			} else {
				$.post( 'enhance.php', { mpc: 'mpc play '+ songpos } );
				$( '#pl-entries li' ).removeClass( 'active' );
				$( this ).addClass( 'active' );
			}
		}
		return
	}
	
	var $this = $( this );
	var radio = $this.hasClass( 'radio' );
	var $elcount = radio ? $( '#countradio' ) : $( '#countsong' );
	var count = $elcount.attr( 'count' ) - 1;
	$elcount.attr( 'count', count ).text( count );
	var time = +$( '#pltime' ).attr( 'time' ) - $this.find( '.time' ).attr( 'time' );
	if ( !radio ) $( '#pltime' ).attr( 'time', time ).text( second2HMS( time ) );
	if ( count === 0 ) {
		$elcount.next().remove();
		$elcount.remove();
		if ( $elcount[ 0 ].id === 'countradio' ) {
			$( '#pltime' ).css( 'color', '#e0e7ee' );
		} else {
			$( '#pltime' ).remove();
		}
	}
	if ( $( '#countradio' ).attr( 'count' ) === '0' ) {
		$( '#pltime' ).css( 'color', '#e0e7ee' );
		$( '#countradio' ).next().remove();
		$( '#countradio' ).remove();
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
	tempFlag( 'local' );
	$.post( 'enhance.php', { mpc: 'mpc del '+ songpos } );
	if ( !$( '#countsong, #countradio' ).length ) {
		GUI.status.playlistlength = 0;
		renderPlaylist();
	}
} );
$( '#pl-editor' ).on( 'click', '.pl-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	var plname = $thisli.data( 'path' );
	GUI.list = {};
	GUI.list.li = $thisli; // for contextmenu
	GUI.list.name = $thisli.find( '.plname' ).text();
	GUI.list.isfile = $thisli.hasClass( 'pl-song' ); // used in contextmenu
	$( '#pl-editor li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( plname === GUI.plcurrent ) {
		GUI.plcurrent = '';
	} else {
		GUI.plcurrent = plname;
		$thisli.addClass( 'active' );
		$contextmenu = GUI.list.isfile ? $( '#context-menu-file' ) : $( '#context-menu-playlist' );
		$contextmenu.removeClass( 'hide' ).css( 'top', $this.position().top +'px' );
		var targetB = $contextmenu.offset().top + 246;
		var wH = window.innerHeight;
		if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
	}
} );
$( '#pl-index li' ).click( function() {
	var topoffset = GUI.display.bars ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	var matcharray = $( '#pl-editor li' ).filter( function() {
		var name = stripLeading( $( this ).data( 'path' ) );
		return name.match( new RegExp( '^'+ indextext, 'i' ) );
	} );
	if ( matcharray.length ) $( 'html, body' ).scrollTop( matcharray[ 0 ].offsetTop - topoffset );
} );
$( '#pl-editor' ).on( 'click', 'li', function( e ) {
	$( '#loader' ).removeClass( 'hide' );
	renderSavedPlaylist( $( this ).find( 'span' ).text() );
} );
$( '#pl-currentpath' ).on( 'click', '.plsback', function() {
	$( '#plopen' ).click();
} );
$( '#pl-currentpath' ).on( 'click', '.plsbackroot', function() {
	$( '#open-playlist' ).click();
} );
$( '#pl-home' ).click( function() {
	$( '#open-playlist' ).click();
} );
$( '#plopen' ).click( function() {
	if ( !GUI.lsplaylists.length ) return
	
	$( '.playlist, #pl-searchbtn' ).addClass( 'hide' );
	$( '#loader' ).removeClass( 'hide' );
	
	var pl = GUI.lsplaylists;
	var plL = pl.length;
	var plcounthtml = '<wh><i class="fa fa-folder"></i></wh><bl>PLAYLISTS</bl>';
	plcounthtml += plL ? '<gr>&emsp;•&ensp;</gr><wh id="pls-count">'+ numFormat( plL ) +'</wh>&ensp;<i class="fa fa-list-ul"></i>' : '';
	$( '#pl-currentpath' ).html( plcounthtml +'<i class="fa fa-arrow-left plsbackroot"></i>' );
	$( '#pl-currentpath, #pl-editor, #pl-index' ).removeClass( 'hide' );
	
	pl.sort( function( a, b ) {
		return stripLeading( a ).localeCompare( stripLeading( b ), undefined, { numeric: true } );
	} );
	var content = '';
	pl.forEach( function( el ) {
		content += '<li class="pl-folder"><i class="fa fa-list-ul pl-icon"></i><i class="fa fa-bars pl-action"></i><span class="plname">'+ el +'</span></li>';
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
	if ( !GUI.status.playlistlength ) return
	
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
$( '#pl-filter-results' ).on( 'click', function() {
	$( this ).addClass( 'hide' ).empty();
	$( '#pl-manage, #pl-count, #pl-entries li' ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
	$( '#pl-entries li' ).show();
} );
new Sortable( document.getElementById( 'pl-entries' ), {
	  ghostClass : 'sortable-ghost'
	, delay      : 100
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
		tempFlag( 'local' );
		$.post( 'enhance.php', { mpc: 'mpc move '+ ( e.oldIndex + 1 ) +' '+ ( e.newIndex + 1 ) } );
	}
} );

if ( document.location.hostname === 'localhost' ) $( '.osk-trigger' ).onScreenKeyboard( { 'draggable': true } );

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
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		$.each( streams, function( i, stream ) {
			pushstreams[ stream ].disconnect();
		} );
	} else {
		$.each( streams, function( i, stream ) {
			pushstreams[ stream ].connect();
		} );
		if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
			getPlaybackStatus();
		} else if ( $( '#panel-playlist' ).hasClass( 'active' ) ) {
			if ( GUI.pleditor ) {
				var name = $( '#pl-editor' ).attr( 'path' );
				if ( name ) {
					renderSavedPlaylist( name );
				} else {
					$( '#plopen' ).click();
				}
			} else {
				setPlaylistScroll();
			}
		}
	}
} );
window.addEventListener( 'orientationchange', function() {
	if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
		scrollLongText();
	} else {
		if ( GUI.dblist || !$( '#pl-editor' ).hasClass( 'hide' ) ) displayIndexBar();
	}
} );

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

var psOption = {
	  host: window.location.hostname
	, port: window.location.port
	, modes: 'websocket'
};
var pushstreams = {};
var streams = [ 'display', 'volume', 'library', 'playlist', 'idle', 'notify' ];
$.each( streams, function( i, stream ) {
	pushstreams[ stream ] = new PushStream( psOption );
	pushstreams[ stream ].addChannel( stream );
} );

pushstreams.display.onmessage = function( data ) {
	if ( typeof data[ 0 ] === 'object' ) GUI.display = data[ 0 ];
	if ( GUI.local ) return
	
	if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
		getPlaybackStatus();
	} else if ( $( '#panel-library' ).hasClass( 'active' ) ) {
		if ( !GUI.local ) renderLibrary();
		displayLibrary();
	} else {
		displayCommon();
	}
}
pushstreams.volume.onmessage = function( data ) {
	if ( GUI.local ) return
	
	var data = data[ 0 ];
	var vol = data[ 0 ];
	var volumemute = data[ 1 ];
	$volumeRS.setValue( vol );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
	volumemute ? muteColor( volumemute ) : unmuteColor();
}
pushstreams.library.onmessage = function( data ) {
	GUI.libraryhome = data[ 0 ];
	if ( $( '#panel-library' ).hasClass( 'active' ) && !GUI.local && !GUI.bookmarkedit ) renderLibrary();
}
pushstreams.playlist.onmessage = function( data ) {
	GUI.lsplaylists = data[ 0 ] || [];
	if ( !$( '#panel-playlist' ).hasClass( 'active' ) ) return
	
	if ( !$( '#pl-entries' ).hasClass( 'hide' ) || !GUI.lsplaylists.length ) {
		renderPlaylist();
	} else {
		$( '#plopen' ).click();
	}
}
var timeoutUpdate;
pushstreams.idle.onmessage = function( changed ) {
	var changed = changed[ 0 ];
	if ( changed === 'player' ) { // on track changed
		if ( $( '#panel-playlist' ).hasClass( 'active' ) ) {
			if ( !GUI.pleditor ) setPlaylistScroll();
		} else {
			getPlaybackStatus();
		}
	} else if ( changed === 'playlist' ) { // on playlist changed
		if ( GUI.pleditor || GUI.local || !$( '#panel-playlist' ).hasClass( 'active' ) ) return
		
		$.post( 'enhance.php', { getplaylist: 1 }, function( data ) {
			GUI.lsplaylists = data.lsplaylists;
			GUI.playlist = data.playlist;
			renderPlaylist();
		}, 'json' );
	} else if ( changed === 'options' ) { // on mode toggled
		if ( GUI.local ) return
		
		$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
			$.each( status, function( key, value ) {
				GUI.status[ key ] = value;
			} );
			setButtonToggle();
		}, 'json' );
	} else if ( changed === 'update' ) {
		if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
			$.post( 'enhance.php', { library: 1 } );
			renderLibrary();
			return
		}
		if ( $( '#db-currentpath' ).attr( 'path' ) === 'Webradio' ) return;
		
		clearTimeout( timeoutUpdate );
		timeoutUpdate = setTimeout( function() { // skip on brief update
			$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
				if ( status.updating_db ) {
					GUI.status.updating_db = 1;
					setButtonUpdate();
				} else {
					new PNotify( {
						  title : 'Update Database'
						, text  : 'Database updated.'
					} );
				}
			}, 'json' );
		}, 3000 );
	} else if ( changed === 'database' ) { // on files changed (for webradio rename)
		if ( $( '#db-currentpath' ).attr( 'path' ) === 'Webradio' ) $( '#home-webradio' ).click();
	}
}
PNotify.prototype.options.styling = 'fontawesome';
PNotify.prototype.options.stack = {
	  dir1      : 'up'    // stack up
	, dir2      : 'right' // when full stack right
	, firstpos1 : 60      // offset from border H
	, firstpos2 : 0       // offset from border V
	, spacing1  : 10      // space between dir1
	, spacing2  : 10      // space between dir2
}
pushstreams.notify.onmessage = function( data ) {
	var notify = data[ 0 ];
	new PNotify( {
		  title       : notify.title ? notify.title : 'Info'
		, text        : notify.text
		, icon        : notify.icon ? notify.icon : 'fa fa-check'
		, delay       : notify.delay ? notify.delay : 4000
	} );
}

$.each( streams, function( i, stream ) {
	pushstreams[ stream ].connect();
} );

function setButtonToggle() {
	if ( GUI.local ) return
	if ( GUI.display.buttons && $( '#play-group' ).is( ':visible' ) ) {
		$( '#repeat' ).toggleClass( 'btn-primary', GUI.status.repeat === 1 );
		$( '#random' ).toggleClass( 'btn-primary', GUI.status.random === 1 );
		$( '#single' ).toggleClass( 'btn-primary', GUI.status.single === 1 );
		$( '#irandom, #posrandom' ).addClass( 'hide' );
		$( '#irepeat, #posrepeat' ).attr( 'fa hide' );
	} else {
		var $random = GUI.display.time ? $( '#irandom' ) : $( '#posrandom' );
		var $repeat = GUI.display.time ? $( '#irepeat' ) : $( '#posrepeat' );
			$random.toggleClass( 'hide', GUI.status.random === 0 );
			if ( GUI.status.repeat ) {
				$repeat.attr( 'class', ( GUI.status.single ? 'fa fa-repeat-single' : 'fa fa-repeat' ) );
			} else {
				$repeat.attr( 'class', 'fa hide' );
			}
	}
	if ( GUI.display.update ) {
		if ( GUI.display.bars ) {
			$( '#badge' ).text( GUI.display.update ).removeClass( 'hide' );
			$( '#iaddons' ).addClass( 'hide' );
		} else {
			$( '#iaddons' ).removeClass( 'hide' );
		}
	} else {
		$( '#badge' ).empty().addClass( 'hide' );
	}
}
function setButtonUpdate() {
	if ( GUI.status.updating_db ) {
		$( '#open-library i, #db-home i, #iupdate' ).addClass( 'blink' );
		$( '#iupdate' ).toggleClass( 'hide', GUI.display.bars !== '' );
	} else {
		$( '#open-library i, #db-home i, #iupdate' ).removeClass( 'blink' );
		$( '#iupdate' ).addClass( 'hide' );
	}
}
function setButton() {
	$( '#playback-controls' ).toggleClass( 'hide', GUI.status.playlistlength === 0 );
	var state = GUI.status.state;
	$( '#stop' ).toggleClass( 'btn-primary', state === 'stop' );
	$( '#play' ).toggleClass( 'btn-primary', state === 'play' );
	$( '#pause' ).toggleClass( 'btn-primary', state === 'pause' );
	setButtonToggle();
	setButtonUpdate();
}
function numFormat( num ) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function HMS2Second( HMS ) {
	var hhmmss = HMS.split( ':' ).reverse();
	if ( !hhmmss[ 1 ] ) return +hhmmss[ 0 ];
	if ( !hhmmss[ 2 ] ) return +hhmmss[ 0 ] + hhmmss[ 1 ] * 60;
	return +hhmmss[ 0 ] + hhmmss[ 1 ] * 60 + hhmmss[ 2 ] * 3600;
}
function second2HMS( second ) {
	if ( second <= 0 ) return '';
	
	var second = Math.round( second );
	var hh = Math.floor( second / 3600 );
	var mm = Math.floor( ( second % 3600 ) / 60 );
	var ss = second % 60;
	
	hh = hh ? hh +':' : '';
	mm = hh ? ( mm > 9 ? mm +':' : '0'+ mm +':' ) : ( mm ? mm +':' : '' );
	ss = mm ? ( ss > 9 ? ss : '0'+ ss ) : ss;
	return ss ? hh + mm + ss : '';
}
function scrollLongText() {
	setTimeout( function() {
		$( '#divartist, #divsong, #divalbum' ).each( function() {
			var $this = $( this );
			$this.toggleClass( 'scroll-left', $this.find( 'span' ).width() > window.innerWidth * 0.98 );
		} );
	}, 100 );
}
GUI.timeout = setTimeout( function() { // in case too long to get coverart
	$( '#starter' ).remove();
}, 3000 );
function setPlaybackOneload() {
	clearTimeout( GUI.timeout );
	$( '#starter' ).remove();
	$( '.rs-animation .rs-transition' ).css( 'transition-property', '' ); // restore animation after load
}
function setPlaybackBlank() {
	$( '#playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#song' ).html( '<i class="fa fa-plus-circle"></i>' );
	$( '#songposition' ).text( 'Add something from Library' );
	$( '#artist, #album, #timepos, #format-bitrate, #elapsed, #total' ).empty();
	$( '#cover-art' )
		.attr( 'src', 'assets/img/cover-default-runeaudio.png' )
		.css( 'border-radius', 0 )
		.one( 'load', setPlaybackOneload );
	$( '#coverartoverlay' ).addClass( 'hide' );
}
function renderPlayback() {
	var status = GUI.status;
	// song and album before update for song/album change detection
	var previoussong = $( '#song' ).text();
	var previousalbum = $( '#album' ).text();
	// volume
	$volumeRS.setValue( status.volume );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
	if ( GUI.display.volume && GUI.display.volumempd ) {
		if ( status.volumemute != 0 ) {
			muteColor( status.volumemute );
		} else {
			unmuteColor();
		}
	}
	clearInterval( GUI.intKnob );
	clearInterval( GUI.intElapsed );
	// empty queue
	if ( !status.playlistlength ) {
		setPlaybackBlank();
		$( '#time' ).roundSlider( 'setValue', 0 );
		return
	}
	
	$( '#playback-controls' ).removeClass( 'hide' );
	$( '#artist' ).html( status.Artist );
	$( '#song' ).html( status.Title );
	$( '#album' ).html( status.Album ).promise().done( function() {
		// scroll info text
		scrollLongText();
	} );
	$( '#songposition' ).text( ( 1 + status.song ) +'/'+ status.playlistlength );
	var ext = ( status.ext !== 'radio' ) ? '<wh> • </wh>' + status.ext : '';
	if ( !GUI.display.time ) {
		var dot = '';
	} else {
		var dot = '<wh id="dot0"> • </wh>';
		$( '#divpos, #format-bitrate' ).css( 'display', window.innerWidth < 500 ? 'inline' : '' );
	}
	$( '#format-bitrate' ).html( dot + status.sampling + ext );
	if ( status.ext !== 'radio' || status.activePlayer === 'Spotify' ) {
		if ( status.Album !== previousalbum ) {
			$( '#coverartoverlay' ).addClass( 'hide' );
			var coverart = status.coverart || 'assets/img/cover-default-runeaudio.png';
			$( '#cover-art' )
				.attr( 'src', coverart )
				.css( 'border-radius', 0 )
				.one( 'load', setPlaybackOneload );
		}
	} else {
		var radiosrc = $( '#cover-art' ).attr( 'src' );
		var vu = $( '#vu' ).val();
		var vustop = $( '#vustop' ).val();
		if ( status.state === 'play' ) {
			if ( radiosrc !== vu ) $( '#cover-art' ).attr( 'src', vu );
			$( '#elapsed' ).html( status.state === 'play' ? blinkdot : '' );
			if ( !GUI.display.radioelapsed ) {
				$( '#total, #timepos' ).empty();
			} else {
				var elapsed = status.elapsed;
				if ( GUI.display.time ) {
					$( '#timepos' ).empty();
					GUI.intElapsed = setInterval( function() {
						elapsed++;
						elapsedhms = second2HMS( elapsed );
						$( '#total' ).text( elapsedhms ).css( 'color', '#587ca0' );
					}, 1000 );
				} else {
					$( '#total' ).empty();
					GUI.intElapsed = setInterval( function() {
						elapsed++;
						elapsedhms = second2HMS( elapsed );
					$( '#timepos' ).html( '&ensp;<i class="fa fa-play"></i>&ensp;'+ elapsedhms );
					}, 1000 );
				}
			}
		} else {
			if ( radiosrc !== vustop ) $( '#cover-art' ).attr( 'src', vustop );
			$( '#total, #timepos' ).empty();
		}
		$( '#cover-art' )
			.css( 'border-radius', '18px' )
			.one( 'load', setPlaybackOneload );
		$( '#coverartoverlay' ).removeClass( 'hide' );
		// show / hide elapsed at total
		return
	}
	
	// time
	var time = status.Time;
	var timehms = second2HMS( time );
	$( '#total' ).text( timehms );
	// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( status.state === 'stop' ) {
		$( '#song' ).css( 'color', '' );
		if ( GUI.display.time ) {
			$( '#time' ).roundSlider( 'setValue', 0 );
			$( '#elapsed' ).text( timehms ).css( 'color', '#587ca0' );
			$( '#total, #timepos' ).empty();
		} else {
			$( '#timepos' ).html( '&ensp;<i class="fa fa-stop"></i>&ensp;'+ timehms );
		}
		return
		
	} else {
		$( '#elapsed, #total' ).css( 'color', '' );
	}
	
	$( '#song' ).css( 'color', status.state === 'pause' ? '#587ca0' : '' );
	
	var elapsed = status.elapsed;
	var elapsedhms = second2HMS( elapsed );
	if ( !elapsedhms ) $( '#elapsed' ).empty();
	var position = Math.round( elapsed / time * 1000 );
	// pause <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( status.state === 'pause' ) {
		if ( GUI.display.time ) {
			$( '#time' ).roundSlider( 'setValue', position );
			$( '#elapsed' ).text( elapsedhms );
			$( '#elapsed' ).css( 'color', '#0095d8' );
			$( '#total' ).css( 'color', '#e0e7ee' );
			$( '#timepos' ).empty();
		} else {
			$( '#timepos' ).html( '&ensp;<i class="fa fa-pause"></i>&ensp;'+ elapsedhms +' / '+ timehms );
		}
		return
		
	} else {
		$( '#elapsed' ).css( 'color', '' );
		$( '#total' ).css( 'color', '' );
	}
//		var localbrowser = ( location.hostname === 'localhost' || location.hostname === '127.0.0.1' ) ? 10 : 1;
//		var step = 1 * localbrowser; // fix: reduce cpu cycle on local browser
//	var step = 1;
	if ( GUI.display.time ) {
		GUI.intKnob = setInterval( function() {
			position++;
			if ( position === 1000 ) {
				clearInterval( GUI.intKnob );
				clearInterval( GUI.intElapsed );
				$( '#elapsed' ).empty();
			}
			$( '#time' ).roundSlider( 'setValue', position );
		}, time );
		GUI.intElapsed = setInterval( function() {
			elapsed++;
			elapsedhms = second2HMS( elapsed );
			$( '#elapsed' ).text( elapsedhms );
		}, 1000 );
	} else {
		GUI.intElapsed = setInterval( function() {
			elapsed++;
			elapsedhms = second2HMS( elapsed );
			$( '#timepos' ).html( '&ensp;<i class="fa fa-play"></i>&ensp;'+ elapsedhms +' / '+ timehms );
		}, 1000 );
	}
	// playlist current song ( and lyrics if installed )
	if ( status.Title !== previoussong || status.Album !== previousalbum ) {
		if ( $( '#lyricscontainer' ).length && $( '#lyricscontainer' ).is( ':visible' ) )  getlyrics();
		if ( $( '#panel-playlist' ).hasClass( 'active' ) && !GUI.pleditor ) setPlaylistScroll();
	}
}
function getPlaybackStatus() {
	if ( $( '#panel-playlist' ).hasClass( 'active' ) ) {
		setPlaylistScroll();
		return
	}
	
	$.post( 'enhancestatus.php', function( status ) {
		// 'gpio off' > audio output switched > restarts mpd which makes status briefly unavailable
		if( typeof status !== 'object' ) return
		
		GUI.activePlayer = status.activePlayer;
		if ( GUI.activePlayer === 'Airplay' ) {
			displayAirPlay();
			return
		}
		GUI.status = status;
		setButton();
		renderPlayback();
		displayPlayback();
		// imodedelay fix imode flashing on usb dac switching
		if ( !GUI.imodedelay ) displayPlayback();
	}, 'json' );
}
function setPanelActive( id ) {
	if ( id === 'panel-library' ) {
		GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ] = $( window ).scrollTop();
	} else if ( id === 'panel-playlist' && GUI.pleditor ) {
		GUI.plscrolltop = $( window ).scrollTop();
	} else {
		$( 'html, body' ).scrollTop( 0 );
		if ( GUI.status.state === 'play' ) $( '#elapsed' ).empty();
	}
	$( '.tab-pane, #menu-bottom li' ).removeClass( 'active' );
	$( '.tab-pane' ).addClass( 'hide' );
	$( '#'+ id ).removeClass( 'hide' );
	$( '#'+ id +', #'+ id.replace( 'panel', 'open' ) ).addClass( 'active' );
	if ( !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#db-list' ).css( 'padding-top', '40px' );
	}
}
function panelLR( lr ) {
	var pcurrent = $( '.tab-pane.active' ).prop( 'id' );
	if ( pcurrent === 'panel-library' ) {
		var $pL = $( '#open-playback' );
		var $pR = $( '#open-playlist' );
	} else if ( pcurrent === 'panel-playback' ) {
		var $pL = $( '#open-playlist' );
		var $pR = $( '#open-library' );
	} else {
		var $pL = $( '#open-library' );
		var $pR = $( '#open-playback' );
	}
	
	$paneclick = ( lr === 'left' ) ? $pL.click() : $pR.click();
}
function tempFlag( fl, ms ) {
	var flag = fl || 'local';
	var time = ms || 500;
	GUI[ flag ] = 1;
	clearTimeout( GUI.timeout );
	GUI.timeout = setTimeout( function() { GUI[ flag ] = 0 }, time );
}
function getBio( artist ) {
	$( '#loader' ).removeClass( 'hide' );
	$.get( 'enhancebio.php',
		{ artist: artist },
		function( data ) {
			$( '#biocontent' ).html( data ).promise().done( function() {
				$( '#bio' ).scrollTop( 0 );
				renderBio();
			} );
		}
	);
}
function renderBio() {
	$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
	$( '#bio' ).removeClass( 'hide' );
}
$( '#artist, #bio-open' ).click( function() {
	if ( GUI.status.ext === 'radio' ) return
	
	if ( $( '#bio legend' ).text() != GUI.status.Artist ) {
		getBio( GUI.status.Artist );
	} else {
		renderBio();
	}
} );
function mpdSeek( seekto ) {
	if ( GUI.status.state !== 'stop' ) {
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		$.post( 'enhance.php', { mpc: 'mpc seek '+ seekto } );
	} else {
		$.post( 'enhance.php', { mpc: [ 'mpc play', 'mpc seek '+ seekto, 'mpc pause' ] } );
	}
}
function muteColor( volumemute ) {
	$volumetooltip.text( volumemute ).css( 'color', '#0095d8' );
	$volumehandle.css( 'background', '#587ca0' );
	$( '#volmute' ).addClass( 'btn-primary' )
		.find( 'i' ).removeClass( 'fa-volume' ).addClass( 'fa-mute' );
}
function unmuteColor() {
	$volumetooltip.css( 'color', '' );
	$volumehandle.css( 'background', '' );
	$( '#volmute' ).removeClass( 'btn-primary' )
		.find( 'i' ).removeClass( 'fa-mute' ).addClass( 'fa-volume' );
}
function displayCommon() {
	if ( !$( '#bio' ).hasClass( 'hide' ) ) return
	
	if ( !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '#db-list, #pl-list' ).css( 'padding', '40px 0' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#home-blocks' ).css( 'margin-top', '50px' );
	} else {
		$( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
		$( '#db-list, #pl-list' ).css( 'padding', '' );
		$( '.btnlist-top' ).css( 'top', '40px' );
		$( '#home-blocks' ).css( 'margin-top', '' );
	}
}
function displayAirPlay() {
	$( '#playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#songposition, #format-bitrate, #total' ).empty();
	$( '#artist' ).html( GUI.airplay.currentartist );
	$( '#song' ).html( GUI.airplay.currentsong );
	$( '#album' ).html( GUI.airplay.currentalbum );
	$( '#elapsed, #total' ).empty();
	var time = new Date().getTime();
	$( '#cover-art' ).css( {
		  'background-image': 'url("assets/img/airplay-cover.jpg?v='+ time +'")'
		, 'border-radius': 0
	} );
	scrollLongText();
	$( '#menu-top, #menu-bottom' ).toggleClass( 'hide', GUI.display.bars === '' );
	$( '#playback-row' ).removeClass( 'hide' );
	$( '#time-knob' ).toggleClass( 'hide', GUI.display.time === '' );
	$( '#irandom, #irepeat, #posrandom, #posrepeat, #coverartoverlay, #volume-knob, #play-group, #share-group, #vol-group' ).addClass( 'hide' );
	$( '#playsource-mpd' ).addClass( 'inactive' );
	$( '#playsource-airplay' ).removeClass( 'inactive' );
	if ( GUI.display.time ) {
		$( '#time-knob, #play-group, #coverart, #share-group' ).css( 'width', '45%' );
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		$( '#time' ).roundSlider( 'setValue', 0 );
		$( '#elapsed' ).html( blinkdot );
		$( '#total' ).empty();
		$( '#iplayer' ).addClass( 'fa-airplay' ).removeClass( 'hide' );
	} else {
		$( '#coverart, #share-group' ).css( 'width', '90%' );
	}
}
function PlaybackCssOrder( el, ord ) {
	el.css( { order: ord, '-webkit-order': ord } );
}
function displayPlayback() {
	if ( GUI.activePlayer === 'Airplay' ) {
		displayAirPlay();
		return
	}
	// reset to default css
	$( '#playback-row, #time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( {
		  margin          : ''
		, width           : ''
		, 'max-width'     : ''
		, order           : ''
		, '-webkit-order' : ''
		, display         : ''
	} );
	$( '#time-knob, #play-group' ).toggleClass( 'hide', GUI.display.time === '' );
	$( '#coverart, #share-group' ).toggleClass( 'hide', GUI.display.coverart === '' );
	var volume = ( !GUI.display.volumempd || !GUI.display.volume ) ? false : true;
	$( '#volume-knob, #vol-group' ).toggleClass( 'hide', !volume );
	
	var i = ( GUI.display.time ? 1 : 0 ) + ( GUI.display.coverart ? 1 : 0 ) + volume;
	if ( i === 2 && window.innerWidth > 499 ) {
		if ( volume ) {
			PlaybackCssOrder( $( '#time-knob' ), 1 );
			PlaybackCssOrder( $( '#coverart' ), 2 );
			PlaybackCssOrder( $( '#volume-knob' ), 3 );
			PlaybackCssOrder( $( '#play-group' ), 4 );
			PlaybackCssOrder( $( '#share-group' ), 5 );
			PlaybackCssOrder( $( '#vol-group' ), 6 );
		}
		$( '#playback-row' ).css( 'max-width', '900px' );
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '45%' );
	} else if ( i === 1 ) {
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '90%' );
	}
	if ( !GUI.display.buttons || window.innerHeight <= 320 || window.innerWidth < 499 ) {
		$( '#play-group, #share-group, #vol-group' ).addClass( 'hide' );
	}
	// not scale webradio vu meter
	if ( !GUI.display.coverlarge || $( '#album' ).text().slice( 0, 4 ) === 'http' ) {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).addClass( 'coversmall' );
	} else {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).removeClass( 'coversmall' );
		if ( window.innerWidth < 500 ) $( '#format-bitrate' ).css( 'display', GUI.display.time ? 'inline' : 'block' );
	}
	if ( GUI.display.time ) {
		$( '#timepos' ).empty();
		$( '#posrandom, #posrepeat' ).addClass( 'hide' );
	}
	if ( window.innerWidth < 500 ) $( '#playback-row' ).css( 'margin-top', GUI.display.time ? '10px' : '30px' );
	if ( GUI.activePlayer === 'MPD' ) {
		$( '#iplayer' ).removeClass().addClass( 'fa hide' );
	} else {
		var source = GUI.activePlayer.toLowerCase();
		$( '#iplayer' ).removeClass().addClass( 'fa fa-'+ source );
	}
//	renderPlayback();
	displayCommon();
}
function switchPlaysource( source ) {
	$.get( '/command/?switchplayer='+ source, function() {
		setTimeout( function() {
			$( '#open-playback' ).click();
			$( '#playsource li a' ).addClass( 'inactive' );
			$( '#playsource-'+ source.toLowerCase() ).removeClass( 'inactive' )
			$( '#playsource-close' ).click();
		}, 2000 );
	} );
}
function displayIndexBar() {
	setTimeout( function() {
		var wH = window.innerHeight;
		var indexoffset = $( '#menu-top' ).is( ':visible' ) ? 160 : 80;
		var indexline = wH < 500 ? 13 : 27;
		$( '.half' ).toggleClass( 'hide', wH < 500 );
		$index = ( $( '#panel-library' ).hasClass( 'active' ) && GUI.dblist ) ? $( '#db-index' ) : $( '#pl-index' );
		$index.css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
	}, 0 );
}
function setToggleButton( name, append ) {
	$( 'input[name="'+ name +'"]' )
		.prop( 'disabled', true )
		.parent().css( 'color', '#7795b4' )
		.append( append ? ' '+ append : ' (auto hide)' );
}
function libraryLabel( name, label ) {
	return '<label><input name="'+ name +'" type="checkbox" '+ GUI.display[ name ] +'>&ensp;'+label+'</label><br>';
}
function toggleLibraryHome( name ) {
	$( '#home-'+ name ).parent().toggleClass( 'hide', GUI.display[ name ] === '' );
}
function displayLibrary() {
	// no 'id'
	toggleLibraryHome( 'nas' );
	toggleLibraryHome( 'sd' );
	toggleLibraryHome( 'usb' );
	toggleLibraryHome( 'webradio' );
	toggleLibraryHome( 'albums' );
	toggleLibraryHome( 'artists' );
	toggleLibraryHome( 'composer' );
	toggleLibraryHome( 'genre' );
	toggleLibraryHome( 'dirble' );
	toggleLibraryHome( 'jamendo' );
	
	var txt = '';
	if ( GUI.display.label ) {
		$( '.home-block gr' ).css( 'color', '' );
		$( '.home-block' ).css( 'padding', '' );
		$( '.home-bookmark .fa-bookmark' ).css( { 'font-size': '', width: '' } );
	} else {
		$( '.home-block gr' ).css( 'color', '#e0e7ee' );
		$( '.home-block' ).css( 'padding-bottom', '30px' );
		$( '.home-bookmark .fa-bookmark' ).css( { 'font-size': '32px', width: '24px' } );
		$( '.home-bookmark' ).css( 'padding', '15px 5px 5px 5px' );
	}
	displayCommon();
}
function setPlaybackSource() {
	var activePlayer = GUI.activePlayer;
	$( '#playsource a' ).addClass( 'inactive' );
	var source = activePlayer.toLowerCase();
	$( '#playsource-' + source).removeClass( 'inactive' );
	
	if ( activePlayer === 'Spotify' || activePlayer === 'Airplay' ) {
//		$( '#volume-knob, #vol-group' ).addClass( 'hide' );
		$( '#single' ).prop( 'disabled' );
	}
}
var namepath = {
	  sd       : [ 'SD',       'LocalStorage', 'microsd' ]
	, usb      : [ 'USB',      'USB',          'usbdrive' ]
	, nas      : [ 'Network',  'NAS',          'network' ]
	, webradio : [ 'Webradio', 'Webradio',     'webradio' ]
	, album    : [ 'Album',    'Albums',       'album' ]
	, artist   : [ 'Artist',   'Artists',      'artist' ]
	, composer : [ 'Composer', 'Composer',     'composer' ]
	, genre    : [ 'Genre',    'Genres',       'genre' ]
	, spotify  : [ 'Spotify',  'Spotify',      'spotify' ]
	, dirble   : [ 'Dirble',   'Dirble',       'dirble' ]
	, jamendo  : [ 'Jamendo',  'Jamendo',      'jamendo' ]
}
function setLibraryBlock( id ) {
	var status = GUI.libraryhome;
	if ( id === 'spotify' && !status.spotify ) return '';

	var iconmusic = id === 'sd' ? ' <i class="fa fa-music"></i>' : '';
	var count = status[ id ] !== undefined ? ( '<gr>'+ numFormat( status[ id ] ) + iconmusic +'</gr>' ) : '';
	var label = GUI.display.label ? ( '<wh>'+ namepath[ id ][ 0 ] +'</wh>' ) : '';
	var browsemode = ( $.inArray( id, [ 'album', 'artist', 'composer', 'genre' ] ) !== -1 ) ? ' data-browsemode="'+ id +'"' : '';
	var plugin = ( id === 'spotify' || id === 'dirble' || id === 'jamendo' ) ? ( ' data-plugin="'+ namepath[ id ][ 1 ] +'"' ) : '';
	
	return '<div class="col-md-3">'
			+'<div id="home-'+ id +'" class="home-block" data-path="'+ namepath[ id ][ 1 ] +'"'+ browsemode +'>'
				+'<i class="fa fa-'+ namepath[ id ][ 2 ] +'"></i>'+ count + label
			+'</div>'
		+'</div>';
}
function renderLibrary() {
	GUI.dbbackdata = [];
	if ( GUI.bookmarkedit ) return
//	GUI.dbscrolltop = {}; // comment out to always keep scroll positions
	GUI.plugin = '';
	$( '#db-currentpath' ).removeAttr( 'path' ).css( 'width', '' );
	$( '#db-entries' ).empty();
	$( '#db-search, #db-search-results, #db-index, #db-back, #db-webradio-new' ).addClass( 'hide' );
	$( '#db-searchbtn' ).removeClass( 'hide' );
	$( '#db-search-keyword' ).val( '' );
	if ( $( '#db-entries' ).hasClass( 'hide' ) ) return
	
	$( '#panel-library .btnlist-top, db-entries' ).addClass( 'hide' );
	var status = GUI.libraryhome;
	var counts = status.song ? 1 : 0;
	var labels = GUI.display.label ? 1 : 0;
	if ( counts ) {
		$( '#db-currentpath span' ).html( '<bl class="title">LIBRARY<gr>·</gr></bl><a id="li-count"><wh>'+ numFormat( status.song ) +'</wh><i class="fa fa-music"></i></a>' );
	} else {
		$( '#db-currentpath span' ).html( '<bl class="title">LIBRARY</bl></a>' );
	}
	$( '#panel-library .btnlist-top, #home-blocks' ).removeClass( 'hide' );
	// Set active player
	setPlaybackSource();
	
	var content = '';
	var bookmarks = status.bookmark;
	if ( bookmarks !== null ) {
		bookmarks.sort( function( a, b ) {
			return stripLeading( a.name ).localeCompare( stripLeading( b.name ), undefined, { numeric: true } );
		} );
		var bookmarkL = bookmarks.length;
		$.each( bookmarks, function( i, bookmark ) {
			var count = counts ? '<gr>'+ numFormat( bookmark.count ) +' <i class="fa fa-music"></i></gr>' : '';
			var name = bookmark.name.replace( /\\/g, '' );
			content += '<div class="col-md-3"><div class="home-block home-bookmark" data-path="'+ bookmark.path +'"><i class="fa fa-bookmark"></i>'+ count +'<div class="divbklabel"><span class="bklabel">'+ name +'</span></div></div></div>';
		} );
	}
	var order = GUI.display.library || 'sd,usb,nas,webradio,album,artist,composer,genre,dirble,jamendo';
	order = order.split( ',' );
	content += '<div id="divhomeblocks">';
	$.each( order, function( i, val ) {
		content += setLibraryBlock( val );
	} );
	content += '</div>';
	$( '#home-blocks' ).html( content ).promise().done( function() {
		setTimeout( function() {
			$( 'html, body' ).scrollTop( 0 );
		}, 0 );
		if ( GUI.display.label ) {
			$( '.bklabel' ).each( function() {
				var $this = $( this );
				if ( $this.width() > $this.parent().width() ) $this.addClass( 'bkscroll' );
			} );
		}
		new Sortable( document.getElementById( 'divhomeblocks' ), {
			  delay      : 100
			, onStart    : function( e ) {
				$icon = $( e.item ).find( 'i' );
				$icon.css( 'color', '#e0e7ee' );
			  }
			, onEnd      : function() {
				$icon.css( 'color', '' );
			  }
			, onUpdate   : function ( e ) {
				var $blocks = $( '.home-block:not(.home-bookmark)' );
				var homeorder = '';
				$.each( $blocks, function( i, el ) {
					homeorder += el.id.replace( 'home-', '' ) +',';
				} );
				homeorder = homeorder.slice( 0, -1 );
				GUI.display.library = homeorder;
				tempFlag( 'local' );
				$.post( 'enhance.php', { homeorder: homeorder } );
			}
		} );
	} );
	displayLibrary();
}
function getDB( options ) {
	$( '#loader' ).removeClass( 'hide' );
	var cmd = options.cmd || 'browse',
		path = options.path ? options.path.toString().replace( /"/g, '\"' ) : '',
		browsemode = options.browsemode || 'file',
		uplevel = options.uplevel || '',
		plugin = options.plugin || '',
		querytype = options.querytype || '',
		args = options.args || '',
		artist = options.artist ? options.artist.toString().replace( /"/g, '\"' ) : '',
		mode,
		command;
	if ( !GUI.dbback && cmd !== 'search' && GUI.dbbrowsemode !== 'file' ) {
		GUI.dbbackdata.push( {
			  path       : path
			, browsemode : browsemode
			, uplevel    : uplevel
			, plugin     : plugin
			, args       : args
			, querytype  : querytype
		} );
	} else if ( cmd === 'search' && $( '#db-currentpath' ).attr( 'path' ) ) {
		if ( GUI.dbbackdata.length ) {
			GUI.dbbackdata.push( GUI.dbbackdata[ GUI.dbbackdata.length - 1 ] );
		} else {
			GUI.dbbackdata.push( {
				  path       : $( '#db-currentpath' ).attr( 'path' )
				, browsemode : GUI.browsemode
			} );
		}
	} else {
		GUI.dbback = 0;
	}
	GUI.browsemode = browsemode;
	var keyword = $( '#db-search-keyword' ).val();
	keyword = keyword ? keyword.toString().replace( /"/g, '\"' ) : '';
	
	if ( !plugin ) {
		var currentpath = $( '#db-currentpath' ).attr( 'path' ); // for artist-album search
		currentpath = currentpath ? currentpath.toString().replace( /"/g, '\"' ) : '';
		var artistalbum = artist || currentpath;
		var command = {
			  file        : { mpc: 'mpc ls -f "%title%^^%time%^^%artist%^^%album%^^%file%" "'+ path +'"', list: 'file' }
			, album       : { mpcalbum: path } 
			, artistalbum : { mpc: 'mpc find -f "%title%^^%time%^^%artist%^^%album%^^%file%" artist "'+ artistalbum +'" album "'+ path +'"', search: 1 } 
			, artist      : { mpc: 'mpc list album artist "'+ path +'" | awk NF', list: 'album' }
			, composer    : { mpc: 'mpc list album composer "'+ path +'" | awk NF', list: 'album' }
			, genre       : { mpc: 'mpc list artist genre "'+ path +'" | awk NF', list: 'artist' }
			, type        : { mpc: 'mpc list '+ GUI.browsemode +' | awk NF', list: GUI.browsemode }
			, search      : { mpc: 'mpc search -f "%title%^^%time%^^%artist%^^%album%^^%file%" any "'+ keyword +'"', search: 1 }
			, Webradio    : { getwebradios: 1 }
		}
		if ( cmd === 'search' ) {
			if ( path.match(/Dirble/)) {
				$.post( '/db/?cmd=dirble', { querytype: 'search', args: keyword }, function( data ) {
					populateDB( data, path, 'Dirble', 'search', uplevel );
				}, 'json' );
				return
			} else {
				mode = 'search';
			}
		} else if ( cmd === 'browse' ) {
			if ( $.inArray( path, [ 'Albums', 'Artists', 'Composer', 'Genres' ] ) !== -1 ) {
				mode = 'type';
			} else if ( path === 'Webradio' ) {
				mode = 'Webradio';
			} else if ( GUI.browsemode === 'album' && currentpath !== 'Albums' && artist ) { // <li> in 'Artists' and 'Genres'
				mode = 'artistalbum';
				GUI.artistalbum = path +'<gr> • </gr>'+ artistalbum;
			} else {
				mode = GUI.browsemode;
				if ( mode === 'composer' ) GUI.browsemode = 'composeralbum';
			}
		}
		$.post( 'enhance.php', command[ mode ], function( data ) {
			populateDB( data, path, '', '', uplevel );
		}, 'json' );
		return
	}

	if ( plugin === 'Spotify' ) {
		$.post( '/db/?cmd=spotify', { plid: args }, function( data ) {
			populateDB( data, path, plugin, querytype, uplevel, arg );
		}, 'json' );
	} else if ( plugin === 'Dirble' ) {
		if ( querytype === 'childs' ) {
			$.post( '/db/?cmd=dirble', { querytype: 'childs', args: args }, function( data ) {
				populateDB( data, path, plugin, 'childs', uplevel );
			}, 'json' );
			$.post( '/db/?cmd=dirble', { querytype: 'childs-stations', args: args }, function( data ) {
				populateDB( data, path, plugin, 'childs-stations', uplevel );
			}, 'json' );            
		} else {
			$.post( '/db/?cmd=dirble', { querytype: querytype ? querytype : 'categories', args: args }, function( data ) {
				populateDB( data, path, plugin, querytype, uplevel );
			}, 'json' );
		}
	} else if ( plugin === 'Jamendo' ) {
		$.post( '/db/?cmd=jamendo', { querytype: querytype ? querytype : 'radio', args: args }, function( data ) {
			if ( !data ) {
				$( '#oader' ).addClass( 'hide' );
				info( {
					  icon    : 'warning'
					, title   : 'Jamendo'
					, message : 'Jamendo not response. Please try again later'
				} );
				return
			}
			populateDB( data.results, path, plugin, querytype );
		}, 'json' );
	}
}
function parseDBdata( inputArr, i, respType, inpath, querytype ) {
	var inputArr = inputArr || '',
		i = i || 0,
		respType = respType || '',
		inpath = inpath || '',
		querytype = querytype || '';
	GUI.artistalbum = '';
	switch ( respType ) {
		case 'db':
			if ( GUI.browsemode === 'file' ) {
				if ( inpath === '' && inputArr.file ) {
					var file = inputArr.file
					inpath = file.slice( 0, file.lastIndexOf( '/' ) );
				}
				if ( inputArr.file || inpath === 'Webradio' ) {
					if ( inpath !== 'Webradio' ) {
						if ( inputArr.Title ) {
							if ( $( '#db-search-keyword' ).val() ) {
								var bl = inputArr.Artist +' - '+ inputArr.Album;
							} else {
								var bl = inputArr.file.split( '/' ).pop(); // filename
							}
							var liname = inputArr.Title
							content = '<li data-path="'+ inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
							content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ inputArr.Time +'</span></span>';
							content += '<span class="bl">'+ bl;
						} else {
							var liname = inputArr.file.replace( inpath +'/', '' );
							content = '<li data-path="'+ inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
							content += '<span class="sn">'+ liname +'&ensp;<span class="time">' + second2HMS( inputArr.Time ) +'</span></span>';
							content += '<span class="bl"> path: '+ inpath;
						}
					} else { // Webradio
						var liname = inputArr.playlist.replace( /Webradio\/|\\|.pls$/g, '' );
						content = '<li class="db-webradio" ><i class="fa fa-bars db-action" data-target="#context-menu-webradio"></i><i class="fa fa-webradio db-icon db-radio"></i>';
						content += '<span class="sn">'+ liname +'</span>';
						content += '<span class="bl">'+ inputArr.url;
					}
					content += '</span></li>';
				} else if ( inputArr.playlist && inputArr.fileext === 'cue' ) {
					var liname = inputArr.playlist.replace( inpath +'/', '' );
					content = '<li data-path="'+ inputArr.playlist +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-file-text db-icon"></i>';
					content += '<span class="sn">'+ liname +' <span>[CUE file]</span></span>';
					content += '<span class="bl"> path: '+ inpath +'</span></li>';
				} else {
					var liname = inputArr.directory.replace( inpath +'/', '' );
					content = '<li data-path="'+ inputArr.directory +'" liname="'+ liname +'"><i class="fa fa-bars db-action"';
					content += ' data-target="#context-menu-folder"></i><span><i class="fa fa-folder"></i>'
					content += '<span class="dbpath">'+ liname +'</span></li>';
				}
			} else if ( GUI.browsemode === 'album' || GUI.browsemode === 'albumfilter' ) {
				if ( inputArr.file ) {
					var liname = inputArr.Title;
					content = '<li data-path="'+ inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
					content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ inputArr.Time +'</span></span>';
					content += '<span class="bl">'+ inputArr.file +'</span></li>';
					if ( !GUI.artistalbum ) GUI.artistalbum = inputArr.Album +'<gr> • </gr>'+ inputArr.Artist;
				} else {
					var liname = inputArr.album;
					var artistalbum = inputArr.artistalbum;
					if ( artistalbum ) {
						var lialbum = artistalbum;
						var dataartist = ' data-artist="'+ inputArr.artist +'"';
					} else {
						var lialbum = liname;
						var dataartist = '';
					}
					content = '<li data-path="'+ inputArr.album.replace( /\"/g, '&quot;' ) +'"'+ dataartist +' mode="album" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i>';
					content += '<span><i class="fa fa-album"></i>'+ lialbum +'</span></li>';
				}
			} else if ( GUI.browsemode === 'artist' || GUI.browsemode === 'composeralbum' ) {
				if ( inputArr.album ) {
					var liname = inputArr.album ? inputArr.album : 'Unknown album';
					content = '<li data-path="'+ inputArr.album +'" mode="album" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i>';
					content += '<span><i class="fa fa-album"></i>'+ liname +'</span></li>';
				} else {
					var liname = inputArr.artist;
					content = '<li data-path="'+ inputArr.artist +'" mode="artist" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i>';
					content += '<span><i class="fa fa-artist"></i>'+ liname +'</span></li>';
				}
			} else if ( GUI.browsemode === 'composer' ) {
				if ( inputArr.file ) {
					var liname = inputArr.Title;
					content = '<li data-path="'+ inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
					content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ second2HMS( inputArr.Time ) +'</span></span>';
					content += '<span class="bl">'+ inputArr.Artist +' - '+ inputArr.Album +'</span></li>';
				} else {
					var liname = inputArr.composer;
					content = '<li data-path="'+ inputArr.composer +'" mode="composer" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-composer"></i>';
					content += '<span><i class="fa fa-composer"></i>'+ inputArr.composer +'</span></li>';
				}
			} else if ( GUI.browsemode === 'genre' ) {
				if ( inputArr.artist ) {
					var liname = inputArr.artist ? inputArr.artist : 'Unknown artist';
					content = '<li data-path="'+ inputArr.artist +'" mode="artist" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i>';
					content += '<span><i class="fa fa-artist"></i>'+ liname +'</span></li>';
				} else {
					var liname = inputArr.genre ;
					content = '<li data-path="'+ inputArr.genre +'" mode="genre" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-genre"></i>';
					content += '<span><i class="fa fa-genre"></i>'+ liname;+'</span></li>';
				}
			}
			break;
		case 'Spotify':
			if ( querytype === '' ) {
				var liname = inputArr.name ? inputArr.name : 'Favorites';
				content = '<li data-path="'+ inputArr.index +'" mode="spotify" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-spotify-pl"></i>'
				content += '<span><i class="fa fa-genre"></i>'+ liname +' ( '+ inputArr.tracks +' )</span></li>';
			} else if ( querytype === 'tracks' ) {
				var liname = inputArr.Title;
				content = '<li data-path="'+ inputArr.index +'" data-plid="'+ inpath +'" data-type="spotify-track" mode="spotify" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-spotify"></i><i class="fa fa-spotify db-icon"></i>';
				content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ second2HMS( inputArr.duration / 1000 ) +'</span></span>';
				content += ' <span class="bl">'+ inputArr.artist +' - '+ inputArr.album +'</span></li>';
			}
			break;
		case 'Dirble':
			if ( querytype === '' || querytype === 'childs' ) {
				var liname = inputArr.title;
				var childClass = ( querytype === 'childs' ) ? ' db-dirble-child' : '';
				content = '<li data-path="'+ inputArr.id +'" class="db-dirble'+ childClass +'" mode="dirble" liname="'+ liname +'">'
				content += '<span><i class="fa fa-genre"></i>'+ liname +'</span></li>';
			} else if ( querytype === 'search' || querytype === 'stations' || querytype === 'childs-stations' ) {
				if ( !inputArr.streams.length ) {
					break; // Filter stations with no streams
				}
				var liname = inputArr.name;
				var url = inputArr.streams[ 0 ].stream
				content = '<li data-path="'+ url +'" mode="dirble" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-dirble"></i><i class="fa fa-webradio db-icon"></i>';
				content += '<span class="sn">'+ liname +'&ensp;<span>( '+ inputArr.country +' )</span></span>';
				content += '<span class="bl">'+ url +'</span></li>';
			}
			break;
		case 'Jamendo':
			var liname = inputArr.dispname;
			content = '<li data-path="'+ inputArr.stream +'" mode="jamendo" liname="'+ liname +'"><img class="jamendo-cover" src="'+ inputArr.image +'" alt=""><i class="fa fa-bars db-action" data-target="#context-menu-file"></i>';
			content += '<span>'+ liname +'</span></div></li>';
			break;
	}
	return content;
}
// strip leading A|An|The|(|[|. (for sorting)
function stripLeading( string ) {
	if ( typeof string === 'number' ) string = string.toString();
	return string.replace( /^A +|^An +|^The +|^\(\s*|^\[\s*|^\.\s*|^\'\s*|^\"\s*|\\/i, '' );
}
function populateDB( data, path, plugin, querytype, uplevel, arg, keyword ) {
	var data = data || '',
		path = path || '',
		plugin = plugin || '',
		querytype = querytype || '',
		uplevel = uplevel || 0,
		args = args || '',
		keyword = keyword || '',
		content = '',
		i = 0,
		row = [];

	if ( path ) GUI.currentpath = path;
	$( '#db-entries' ).empty();
	$( '#db-currentpath>span, #db-entries, #db-back' ).removeClass( 'hide' );
	$( '#home-blocks' ).addClass( 'hide' );

	if ( plugin ) {
		if ( plugin === 'Spotify' ) {
			data = ( querytype === 'tracks' ) ? data.tracks : data.playlists;
			data.sort( function( a, b ) {
				if ( path === 'Spotify' && querytype === '' ) {
					return stripLeading( a[ 'name' ] ).localeCompare( stripLeading( b[ 'name' ] ), undefined, { numeric: true } )
				} else if ( querytype === 'tracks' ) {
					return stripLeading( a[ 'title' ]) .localeCompare( stripLeading( b[ 'title' ] ), undefined, { numeric: true } )
				} else {
					return 0;
				}
			} );
			for (i = 0; (row = data[i]); i += 1) content += parseDBdata( row, i, 'Spotify', arg, querytype );
		} else if ( plugin === 'Dirble' ) {
			if ( querytype === 'childs-stations' ) {
				content = $( '#db-entries' ).html();
			} else {
				data.sort( function( a, b ) {
					if ( !querytype || querytype === 'childs' || querytype === 'categories' ) {
						return stripLeading( a[ 'title' ] ).localeCompare( stripLeading( b[ 'title' ] ), undefined, { numeric: true } )
					} else if ( querytype === 'childs-stations' || querytype === 'stations' ) {
						return stripLeading( a[ 'name' ] ).localeCompare( stripLeading( b[ 'name' ] ), undefined, { numeric: true } )
				   } else {
						return 0;
					}
				} );
				for (i = 0; (row = data[i]); i += 1) content += parseDBdata( row, i, 'Dirble', '', querytype );
			}
		} else if ( plugin === 'Jamendo' ) {
			data.sort( function( a, b ) {
				if ( path === 'Jamendo' && querytype === '' ) {
					return stripLeading( a[ 'dispname' ] ).localeCompare( stripLeading( b[ 'dispname' ] ), undefined, { numeric: true } )
				} else {
					return 0;
				}
			} );
			for (i = 0; (row = data[i]); i += 1) content += parseDBdata( row, i, 'Jamendo', '', querytype );
		}
	} else {
// normal MPD browsing
		if ( !data.length ) return
		
		var type = {
			  Albums       : 'album'
			, Artists      : 'artist'
			, AlbumArtists : 'artist'
			, Composer     : 'composer'
			, Genres       : 'genre'
			, Webradio     : 'playlist'
		}
		var mode = {
			  file          : 'file'
			, album         : 'file'
			, artist        : 'album'
			, genre         : 'artist'
			, composer      : 'file'
			, composeralbum : 'album'
		}
		// undefined type are directory names
		prop = type[ path ] ? type[ path ] : 'directory';
		if ( data[ 0 ].artistalbum ) prop = 'artistalbum'; // for common albums like 'Greatest Hits'
		// filter out blank and various
		if ( prop === 'artist' || prop === 'genre' || prop === 'directory' ) {
			data = data.filter( function( el ) {
				var name = el[ prop ] || el[ mode[ GUI.browsemode ] ];
				if ( name ) return name.search( /^\s+$|^\(*various\)* *|^\(*va\)* */i ) === -1;
			} );
		}
		if ( !data.length ) return
		
		// browsing
		if ( data[ 0 ].directory || data[ 0 ].file ) {
			var arraydir = [];
			var arrayfile = [];
			$.each( data, function( index, value ) {
				value.directory ? arraydir.push( value ) : arrayfile.push( value );
			} );
			
			arraydir.sort( function( a, b ) {
				var adir = stripLeading( a[ 'directory' ].split( '/' ).pop() );
				var bdir = stripLeading( b[ 'directory' ].split( '/' ).pop() );
				return adir.localeCompare( bdir, undefined, { numeric: true } );
			} );
			var arraydirL = arraydir.length;
			for ( i = 0; i < arraydirL; i++ ) content += parseDBdata( arraydir[ i ], i, 'db', path );
			arrayfile.sort( function( a, b ) {
				if ( !keyword ) {
					return stripLeading( a[ 'file' ] ).localeCompare( stripLeading( b[ 'file' ] ), undefined, { numeric: true } );
				} else {
					return stripLeading( a[ 'Title' ] ).localeCompare( stripLeading( b[ 'Title' ] ), undefined, { numeric: true } );
				}
			} );
			var arrayfileL = arrayfile.length;
			for ( i = 0; i < arrayfileL; i++ ) content += parseDBdata( arrayfile[ i ], i, 'db', path );
		} else {
			data.sort( function( a, b ) {
				if ( a[ prop ] === undefined ) prop = mode[ GUI.browsemode ];
				return stripLeading( a[ prop ] ).localeCompare( stripLeading( b[ prop ] ), undefined, { numeric: true } );
			} );
			var dataL = data.length;
			for ( i = 0; i < dataL; i++ ) content += parseDBdata( data[ i ], i, 'db', path );
		}
		$( '#db-webradio-new' ).toggleClass( 'hide', path !== 'Webradio' );
	}
	$( '#db-entries' ).html( content +'<p></p>' ).promise().done( function() {
		// fill bottom of list to mave last li movable to top
		$( '#db-entries p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
		displayIndexBar();
	} );
// breadcrumb directory path link
	var iconName = {
		  LocalStorage  : '<i class="fa fa-microsd"></i>'
		, USB           : '<i class="fa fa-usbdrive"></i>'
		, NAS           : '<i class="fa fa-network"></i>'
		, album         : [ '<i class="fa fa-album"></i>',    'ALBUM' ]
		, artist        : [ '<i class="fa fa-artist"></i>',   'ARTIST' ]
		, genre         : [ '<i class="fa fa-genre"></i>',    'GENRE' ]
		, composer      : [ '<i class="fa fa-composer"></i>', 'COMPOSER' ]
		, composeralbum : [ '<i class="fa fa-composer"></i>', 'COMPOSER' ]
		, Dirble        : '<i class="fa fa-dirble"></i>'
		, Jamendo       : '<i class="fa fa-jamendo"></i>'
		, Spotify       : '<i class="fa fa-spotify"></i>'
	}
	var mode = {
		  album    : 'Albums'
		, artist   : 'Artists'
		, genre    : 'Genres'
		, composer : 'Composer'
	}
	if ( GUI.browsemode !== 'file' ) {
		if ( GUI.browsemode !== 'album' && GUI.browsemode !== 'composeralbum') {
			var dotpath = ( path === mode[ GUI.browsemode ] ) ? '' : '<a id="artistalbum"><gr> • </gr><span class="white">'+ path +'</span></a>';
		} else {
			var albumpath = path === 'Albums' ? '' : path;
			var albumtext = GUI.artistalbum ? GUI.artistalbum : albumpath;
			var dotpath = albumtext ? '<a id="artistalbum"><gr> • </gr><span class="white">'+ albumtext +'</span></a>' : '';
		}
		$( '#db-currentpath' ).attr( 'path', path ); // for back navigation
		$( '#db-currentpath span' ).html( iconName[ GUI.browsemode ][ 0 ] +' <a data-path="'+ mode[ GUI.browsemode ] +'">'+ iconName[ GUI.browsemode ][ 1 ] +'</a>'+ dotpath );
	} else {
		var folder = path.split( '/' );
		var folderRoot = folder[ 0 ];
		$( '#db-currentpath' ).css( 'width', '' );
		if ( $( '#db-search-keyword' ).val() ) {
		// search results
			var results = ( data.length ) ? data.length : '0';
			$( '#db-currentpath' ).css( 'width', '40px' );
			$( '#db-back, #db-index' ).addClass( 'hide' );
			$( '#db-entries' ).css( 'width', '100%' );
			$( '#db-search-results' )
				.removeClass( 'hide' )
				.html( '<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span>\
					<span>' + results + ' <a>of</a> </span>' );
		} else if ( folderRoot === 'Webradio' ) {
			$( '#db-currentpath' ).attr( 'path', 'Webradio' ).find( 'span' ).html( '<i class="fa fa-webradio"></i> <a>WEBRADIOS</a>' );
		} else {
			var folderCrumb = iconName[ folderRoot ];
			var folderPath = '';
			var ilength = folder.length;
			for ( i = 0; i < ilength; i++ ) {
				folderPath += ( i > 0 ? '/' : '' ) + folder[ i ];
				folderCrumb += ' <a data-path="'+ folderPath +'">'+ ( i > 0 ? '<w> / </w>' : '' ) + folder[ i ] +'</a>';
			}
			$( '#db-currentpath' )
				.attr( 'path', path )
				.find( 'span' ).html( folderCrumb );
		}
	}
	// hide index bar in file mode
	if ( $( '#db-entries li:eq( 0 ) i.db-icon' ).hasClass( 'fa-music' ) ) {
		$( '#db-index' ).addClass( 'hide' );
		$( '#db-entries' ).css( 'width', '100%' );
	} else {
		$( '#db-index' ).removeClass( 'hide' );
		$( '#db-entries' ).css( 'width', '' );
	}
	if( $( '#db-search-results' ).is( ':hidden' ) ) {
		$( '#db-search' ).addClass( 'hide' );
		$( '#db-searchbtn' ).removeClass( 'hide' );
	} else {
		$( '#db-search' ).removeClass( 'hide' );
		$( '#db-searchbtn' ).addClass( 'hide' );
	}
	$( '#loader' ).addClass( 'hide' );
}
function setPlaylistScroll() {
	if ( GUI.local ) return // 'skip for Sortable'
	
	$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
		$.each( status, function( key, value ) {
			GUI.status[ key ] = value;
		} );
		setButton();
		var $liactive = $( '#pl-entries li' ).eq( status.song );
		$( '#plcrop' ).toggleClass( 'disable', status.state === 'stop' );
		$( '#pl-entries li' ).removeClass( 'active' );
		$liactive.addClass( 'active' );
		var $elapsed = $( '#pl-entries li.active .elapsed' );
		if ( !$elapsed.html() ) $( '.elapsed' ).empty();
		clearInterval( GUI.intElapsed );
		var elapsed = status.elapsed;
		var slash = $liactive.hasClass( 'radio' ) ? '' : ' / ';
		if ( status.state === 'pause' ) {
			var elapsedtxt = second2HMS( elapsed ) + slash;
			$elapsed.html( '<i class="fa fa-pause"></i> '+ elapsedtxt );
		} else if ( status.state === 'play' ) {
			GUI.intElapsed = setInterval( function() {
				elapsed++;
				var elapsedtxt = second2HMS( elapsed ) + slash;
				$elapsed.html( '<i class="fa fa-play"></i> '+ elapsedtxt );
			}, 1000 );
		} else {
			$( '.elapsed' ).empty();
		}
		setTimeout( function() {
			var scrollpos = $liactive.offset().top - $( '#pl-entries' ).offset().top - ( 49 * 3 );
			$( 'html, body' ).scrollTop( scrollpos );
		}, 300 );
	}, 'json' );
}
function renderPlaylist() {
	$( '#pl-filter' ).val( '' );
	$( '#pl-filter-results' ).empty();
	$( '#pl-currentpath, #pl-editor, #pl-index, #pl-search' ).addClass( 'hide' );
	$( '#db-currentpath>span, #pl-searchbtn' ).removeClass( 'hide' );
	$( '#plopen' ).toggleClass( 'disable', !GUI.lsplaylists.length );
	
	if ( !GUI.status.playlistlength ) {
		$( '#pl-count' ).html( '<bl class="title">PLAYLIST</bl>' );
		$( '#plsave, #plcrop, #plclear' ).addClass( 'disable' );
		$( '#pl-entries' ).empty();
		$( '.playlist' ).removeClass( 'hide' );
		var barhide = !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515;
		$( '#playlist-warning' ).css( 'margin-top', barhide ? '67px' : '27px' );
		return
	}
	
	var content, pl, iconhtml, topline, bottomline, classradio, hidetotal;
	content = iconhtml = topline =bottomline = classradio = hidetotal = '';
	var id, totaltime, pltime, seconds, countsong, countradio;
	id = totaltime = pltime = seconds = countsong = countradio = 0;
	var ilength = GUI.playlist.length;
	GUI.status.playlistlength = ilength;
	var classradio
	for ( i = 0; i < ilength; i++ ) {
		var pl = GUI.playlist[ i ];
		if ( pl.file.slice( 0, 4 ) === 'http' ) {
			iconhtml = '<i class="fa fa-webradio pl-icon"></i>';
			classradio = 1;
			countradio++
			var title = pl.title || pl.file;
			topline =  title +'&ensp;<span class="elapsed"></span>';
			bottomline = pl.file;
		} else {
			iconhtml = '<i class="fa fa-music pl-icon"></i>';
			classradio = 0;
			sec = HMS2Second( pl.time );
			topline = pl.title +'&ensp;<span class="elapsed"></span><span class="time" time="'+ sec +'">'+ pl.time +'</span>';
			bottomline = pl.track
			pltime += sec;
		}
		content += ( classradio ? '<li class="radio">' : '<li>' )
			+ iconhtml
			+'<i class="fa fa-minus-circle pl-action"></i>'
			+'<span class="sn">'+ topline +'</span>'
			+'<span class="bl">'+ bottomline +'</span>'
			+'</li>';
	}
	countsong = ilength - countradio;
	var counthtml = '<bl class="title">PLAYLIST<gr>·</gr></bl>';
	var countradiohtml = '<wh id="countradio" count="'+ countradio +'">'+ countradio +'</wh>&ensp;<i class="fa fa-webradio"></i>';
	if ( countsong ) {
		var pltimehtml = ' id="pltime" time="'+ pltime +'">'+ second2HMS( pltime ) +'&emsp;';
		var totalhtml = countradio ? '<gr'+ pltimehtml +'</gr>'+ countradiohtml : '<wh'+ pltimehtml +'&emsp;</wh>';
		counthtml += '<wh id="countsong" count="'+ countsong +'">'+ numFormat( countsong ) +'</wh>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
	} else {
		counthtml += countradiohtml;
	}
	$( '.playlist' ).removeClass( 'hide' );
	$( '#playlist-warning' ).addClass( 'hide' );
	$( '#pl-count' ).html( counthtml );
	$( '#plsave, #plclear' ).removeClass( 'disable' );
	$( '#plcrop' ).toggleClass( 'disable', GUI.status.state === 'stop' );
	
	$( '#pl-entries' ).html( content +'<p></p>' ).promise().done( function() {
		$( '#pl-entries p' ).css( 'min-height', window.innerHeight - 140 +'px' );
		setPlaylistScroll();
	} );
}
function renderSavedPlaylist( name ) {
	$.post( 'enhance.php', { getplaylist: 1, name: name.toString().replace( /"/g, '\\"' ) }, function( data ) {
		var countradio = 0;
		var content, pl, iconhtml, topline, bottomline, classradio, hidetotal;
		content = iconhtml = topline =bottomline = classradio = hidetotal = '';
		var id, totaltime, pltime, seconds, countsong, countradio;
		id = totaltime = pltime = seconds = countsong = countradio = 0;
		data = data.playlist;
		var ilength = data.length;
		for ( i = 0; i < ilength; i++ ) {
			var pl = data[ i ];
			if ( pl.file.slice( 0, 4 ) === 'http' ) {
				iconhtml = '<i class="fa fa-webradio pl-icon"></i>';
				classradio = 1;
				countradio++
				topline = pl.title;
				bottomline = pl.file;
			} else {
				iconhtml = '<i class="fa fa-music pl-icon"></i>';
				classradio = 0;
				sec = HMS2Second( pl.time );
				topline = pl.title +'&ensp;<gr>'+ pl.time +'</gr>';
				bottomline = pl.track
				pltime += sec;
			}
			content += '<li data-path="'+ pl.file +'" class="pl-song">'
				+ iconhtml
				+'<i class="fa fa-bars pl-action" data-target="#context-menu-file"></i>'
				+'<span class="sn">'+ topline +'</span>'
				+'<span class="bl">'+ bottomline +'</span>'
				+'</li>';
		}
		countsong = ilength - countradio;
		var counthtml = '<wh><i class="fa fa-list-ul"></i></wh><bl class="title">'+ name +'<gr>&emsp;•</gr></bl>';
		var countradiohtml = '<wh>&emsp;'+ countradio +'</wh>&ensp;<i class="fa fa-webradio"></i>';
		if ( countsong ) {
			var pltimehtml = ' id="pltime" time="'+ pltime +'">'+ second2HMS( pltime );
			var totalhtml = countradio ? '<gr'+ pltimehtml +'</gr>'+ countradiohtml : '<wh'+ pltimehtml +'</wh>';
			counthtml += '<wh>'+ numFormat( countsong ) +'</wh>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
		} else {
			counthtml += countradiohtml;
		}
		$( '#pl-currentpath' ).html( counthtml +'<i class="fa fa-arrow-left plsback"></i>' );
		$( '#pl-currentpath, #pl-editor' ).removeClass( 'hide' );
		$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
			GUI.pleditor = 1;
			// fill bottom of list to mave last li movable to top
			$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
			$( '#pl-editor' ).css( 'width', '100%' ).attr( 'path', name );
			$( '#loader, #pl-index' ).addClass( 'hide' );
			$( 'html, body' ).scrollTop( GUI.plscrolltop );
		} );
	}, 'json' );
}

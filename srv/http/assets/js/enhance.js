var GUI = {
	  activePlayer      : ''
	, bookmarkedit      : 0
	, browsemode        : 'file'
	, checkvol          : 0
	, clientUUID        : null
	, currentalbum      : null
	, currentknob       : null
	, currentpath       : ''
	, currentsong       : null
	, dbcurrent         : ''
	, dbback            : 0
	, dbbackdata        : []
	, dbbrowsemode      : ''
	, DBentry           : {}
	, DBupdate          : 0
	, dbpath            : ''
	, dbscrolltop       : {}
	, display           : {}
	, json              : 0
	, libraryhome       : ''
	, forceGUIupdate    : false
	, imodedelay        : 0 // fix imode flashing on usb dac switching
	, maxvol            : 100
	, minvol            : 0
	, mode              : 'websocket'
	, noscroll          : 0
	, noticeUI          : {}
	, playlist          : null
	, plclear           : 0
	, plcurrent         : ''
	, pleditor          : 0
	, plscrolltop       : 0
	, plugin            : ''
	, prevnext          : 0 // for disable 'btn-primary' - previous/next while stop
	, state             : ''
	, status            : {}
	, old_state         : 'none'
	, radioelapsed      : ''
	, setmode         : 0
	, setvolume       : 0
	, stepVolumeDelta   : 0
	, stepVolumeInt     : 0
	, stream            : ''
	, swipe             : 0
	, visibility        : 'visible'
	, vol_changed_local : 0
	, volume            : null
};

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// display toggle data
var command = {
	  display      : [ 'hGetAll', 'display' ]
	, volumemute   : [ 'get', 'volumemute' ]
	, activeplayer : [ 'get', 'activePlayer' ]
};
$.post( 'enhance.php', { redis: JSON.stringify( command ) }, function( data ) {
	GUI.display = data.display;
	GUI.radioelapsed = GUI.display.radioelapsed;
	GUI.activePlayer = data.activeplayer;
	if ( GUI.activePlayer === 'Airplay' ) {
		GUI.json = data.actplayerinfo; // available if 'activeplayer' is 'Airplay'
		displayAirPlay();
	}
}, 'json' );
// UUID for the client
var d = new Date().getTime();
GUI.clientUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
	var r = ( d + Math.random() * 16 ) % 16 | 0;
	return ( c=='x' ? r : ( r & 0x3 | 0x8 ) ).toString( 16 );
} );
// send a MPD playback control command
function sendCmd( cmd ) {
	$.get( '/command/?cmd='+ cmd +'&clientUUID='+ GUI.clientUUID );
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
		$( '#elapsed' ).empty();
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		pushstreamNotify.disconnect();
		pushstreamLibrary.disconnect();
		pushstreamDisplay.disconnect();
		pushstreamPlaylist.disconnect();
		pushstreamPlayback.disconnect();
	} else {
		if ( $( '#playback' ).hasClass( 'active' ) ) {
			setPlaybackData();
			displayPlayback();
		} else if ( $( '#panel-dx' ).hasClass( 'active' ) && !GUI.pleditor ) {
			setPlaylistScroll();
		}
		pushstreamNotify.connect();
		pushstreamLibrary.connect();
		pushstreamDisplay.connect();
		pushstreamPlaylist.connect();
		pushstreamPlayback.connect();
	}
} );
window.addEventListener( 'orientationchange', function() {
	if ( ( $( '#panel-sx' ).hasClass( 'active' ) && $( '#home-blocks' ).hasClass( 'hide' ) )
		|| !$( '#pl-editor' ).hasClass( 'hide' ) ) displayIndex();
} );

PNotify.prototype.options.styling = 'fontawesome';
PNotify.prototype.options.stack = {
	  dir1      : 'up'    // stack up
	, dir2      : 'right' // when full stack right
	, firstpos1 : 60      // offset from border H
	, firstpos2 : 0       // offset from border V
	, spacing1  : 10      // space between dir1
	, spacing2  : 10      // space between dir2
}
function renderMSG( text ) {
	var notify = text[ 0 ];
	var noticeOptions = {
		  title       : notify.title ? notify.title : 'Info'
		, text        : notify.text ? notify.text : ''
		, icon        : notify.icon ? notify.icon : 'fa fa-check'
		, opacity     : notify.opacity ? notify.opacity : 0.9
		, hide        : !notify.hide && !notify.permanotice
		, buttons     : {
			  closer  : !notify.permanotice
			, sticker : !notify.permanotice
		}
		, delay       : notify.delay ? notify.delay : 8000
		, mouse_reset : false
	};
	if ( notify.permanotice ) {
		if ( !GUI.noticeUI[ notify.permanotice ] ) {
			GUI.noticeUI[ notify.permanotice ] = new PNotify( noticeOptions );
		} else {
			if ( notify.permaremove ) {
				GUI.noticeUI[ notify.permanotice ].remove();
				GUI.noticeUI[ notify.permanotice ] = 0;
			} else {
				GUI.noticeUI[ notify.permanoticeb].open();
			}
		}
	} else {
		new PNotify( noticeOptions );
	}
}
var psOption = {
	host: window.location.hostname,
	port: window.location.port,
	modes: GUI.mode
};
// notify pushstream
var pushstreamNotify = new PushStream( psOption );
pushstreamNotify.onmessage = renderMSG;
pushstreamNotify.addChannel( 'notify' );
pushstreamNotify.connect();

function libraryHome( text ) {
	if ( !$( '#home-blocks' ).hasClass( 'hide' ) || GUI.bookmarkedit ) {
		GUI.libraryhome = text[ 0 ];
		if ( GUI.libraryhome.clientUUID === GUI.clientUUID && GUI.plugin !== 'Dirble' && GUI.currentpath !== 'Webradio' ) {
			renderLibraryHome(); // TODO: do it only while in home
		}
		/*if ( GUI.forceGUIupdate === true ) {
			GUI.forceGUIupdate = false;
			renderLibraryHome();
		*/
	} else if ( GUI.currentpath === 'Webradio' ) {
		getDB( {
			  path    : 'Webradio'
			, uplevel : 0
		} );
	}
}
// library pushstream
var pushstreamLibrary = new PushStream( psOption );
pushstreamLibrary.onmessage = libraryHome;
pushstreamLibrary.addChannel( 'library' );
pushstreamLibrary.connect();
// playlist pushstream
var pushstreamPlaylist = new PushStream( psOption );
pushstreamPlaylist.onmessage = function() {
	if ( $( '#panel-dx' ).hasClass( 'active' ) ) {
		GUI.plscrolltop = $( window ).scrollTop();
		GUI.pleditor ? $( '#pl-manage-list' ).click() : renderPlaylist();
	}
}
pushstreamPlaylist.addChannel( 'playlist' );
pushstreamPlaylist.connect();
// display pushstream
var pushstreamDisplay = new PushStream( psOption );
pushstreamDisplay.addChannel( 'display' );
pushstreamDisplay.onmessage = function( data ) { // on receive broadcast
	GUI.display = data[ 0 ].display;
	if ( $( '#playback' ).hasClass( 'active' ) ) {
		displayPlayback();
	} else if ( $( '#panel-sx' ).hasClass( 'active' ) ) {
		displayLibrary();
	} else {
		displayCommon();
	}
}
pushstreamDisplay.connect();

function renderUI( text ) {
	$( '#loader' ).addClass( 'hide' );
	if ( GUI.setvolume ) return;
	
	GUI.json = text[ 0 ];
	GUI.state = GUI.json.state;
	
	setPlaybackData();
	// imodedelay fix imode flashing on usb dac switching
	if ( $( '#playback' ).hasClass( 'active' ) && !GUI.imodedelay ) displayPlayback();
}
// playback pushstream
psOption.reconnectOnChannelUnavailableInterval = 5000;
var pushstreamPlayback = new PushStream( psOption );
pushstreamPlayback.onmessage = renderUI;
pushstreamPlayback.onstatuschange = function( status ) {
	if ( status === 2 ) {
		$( '#loader' ).addClass( 'hide' );
		sendCmd( 'renderui' ); // force UI rendering (backend-call)
	} else if ( status === 0 ) {
		$( '#loader' ).removeClass( 'hide' );          
	}
};
pushstreamPlayback.addChannel( 'playback' );
pushstreamPlayback.connect();

$( '#menu-settings' ).click( function() {
	$( '#settings' ).toggleClass( 'hide' ).css( 'top', $( '#menu-top' ).is( ':hidden' ) ? 0 : '40px' );
} );

function menuBottom( elshow, elhide1, elhide2 ) {	
	if ( $( '#panel-sx' ).hasClass( 'active' ) ) {
		GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ] = $( window ).scrollTop();
		
	} else if ( $( '#panel-dx' ).hasClass( 'active' ) && GUI.pleditor ) {
		GUI.plscrolltop = $( window ).scrollTop();
	}
	$( '#'+ elhide1 +', #'+ elhide2 +', #open-'+ elhide1 +', #open-'+ elhide2 ).removeClass( 'active' );
	$( '#'+ elshow +', #open-'+ elshow ).addClass( 'active' );
	$( '#'+ elhide1 +', #'+ elhide2 ).addClass( 'hide' );
	$( '#'+ elshow ).removeClass( 'hide' );
	if ( !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#database' ).css( 'padding-top', '40px' );
	}
}

$( '#currentsong, #playlist-warning' ).on( 'click', 'i', function() {
	$( '#open-panel-sx' ).click();
} );
$( '#open-panel-sx' ).click( function() {
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	if ( $( this ).hasClass( 'active' ) ) {
		GUI.dbback = 0;
		GUI.dbbackdata = [];
		renderLibraryHome();
		return;
	}
	menuBottom( 'panel-sx', 'playback', 'panel-dx' );
	if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
		displayLibrary();
	} else {
		var scrollpos = GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ];
		$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	}
} );
$( '#open-playback' ).click( function() {
	menuBottom( 'playback', 'panel-sx', 'panel-dx' );
	setPlaybackData();
	displayPlayback();
	$( 'html, body' ).scrollTop( 0 );
} );
$( '#open-panel-dx' ).click( function() {
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	displayPlaylist();
	menuBottom( 'panel-dx', 'playback', 'panel-sx' );
} );
function panelLR( lr ) {
	var pcurrent = $( '.tab-pane:visible' ).prop( 'id' );
	if ( pcurrent === 'panel-sx' ) {
		var $pL = $( '#open-playback' );
		var $pR = $( '#open-panel-dx' );
	} else if ( pcurrent === 'playback' ) {
		var $pL = $( '#open-panel-dx' );
		var $pR = $( '#open-panel-sx' );
	} else {
		var $pL = $( '#open-panel-sx' );
		var $pR = $( '#open-playback' );
	}
	
	$paneclick = ( lr === 'left' ) ? $pL.click() : $pR.click();
}
function tempFlag( flag, ms ) {
	GUI[ flag ] = 1;
	setTimeout( function() { GUI[ flag ] = 0 }, ms ? ms : 500 );
}

$( '#playback, #panel-sx, #panel-dx' ).on( 'swipeleft swiperight', function( e ) {
	panelLR( e.type === 'swipeleft' ? 'left' : '' );
	// fix: prevent taphold fire on swipe
	tempFlag( 'swipe', 1000 );
} );

$( '#playback' ).click( function( e ) {
	if ( !$( e.target ).is( '.controls, .timemap, .covermap, .volmap' ) ) {
		$( '.controls, #settings' ).addClass( 'hide' );
		$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
	}
} ).on( 'taphold', function( e ) {
	if ( GUI.swipe || $( e.target ).parents().hasClass( 'rs-transition' ) ) return;
	setDisplayPlayback();
} );
function setDisplayPlayback() {
	info( {
		  title        : 'Playback'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysaveplayback">\
				<label><input name="bars" type="checkbox" '+ GUI.display.bars +'>&ensp;Top-Bottom menu</label>\
				<br><label><input name="pause" type="checkbox" '+ GUI.display.pause +'>\
					&ensp;<code><i class="fa fa-play"></i></code>&ensp;<code><i class="fa fa-pause"></i></code>&ensp;buttons</label>\
				<br><label><input name="time" type="checkbox" '+ GUI.display.time +'>&ensp;Time</label>\
				<br><label><input name="radioelapsed" type="checkbox" '+ GUI.display.radioelapsed +'>&ensp;Webradio elapsed</label>\
				<br><label><input name="coverart" type="checkbox" '+ GUI.display.coverart +'>&ensp;Coverart</label>\
				<br><label><input name="volume" type="checkbox" '+ GUI.display.volume +'>&ensp;Volume</label>\
				<br><label><input name="buttons" type="checkbox" '+ GUI.display.buttons +'>&ensp;Buttons</label>\
			</form>'
		, cancel       : 1
		, ok           : function () {
			// no: serializeArray() omit unchecked fields
			var toggles = {};
			$( '#displaysaveplayback input' ).each( function() {
				toggles[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = { set : [ 'hmSet', 'display', toggles ] };
			$.post( 'enhance.php', { redis: JSON.stringify( command ) } );
		}
	} );
	// disable from autohide
	if ( window.innerWidth < 499 || window.innerHeight <= 515 ) setToggleButton( 'bars' );
	// disable from mpd volume
	if ( GUI.display.volumempd == 0 ) setToggleButton( 'volume', '(disabled)' );
	// disable from mpd volume
	if ( window.innerWidth < 499 || window.innerHeight <= 320 ) setToggleButton( 'buttons' );
}
function setToggleButton( name, append ) {
	$( 'input[name="'+ name +'"]' )
		.prop( 'disabled', true )
		.parent().css( 'color', '#7795b4' )
		.append( append ? ' '+ append : ' (auto hide)' );
}
$( '#panel-sx' ).on( 'taphold', function( e ) {
	if ( GUI.swipe || GUI.bookmarkedit ) return;
	
	if ( !GUI.bookmarkedit ) setDisplayLibrary( e );
} ).on( 'taphold', '.home-block', function( e ) {
	if ( GUI.swipe ) return;
	
	if ( !$( e.target ).parent().hasClass( 'home-bookmark' ) && !$( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	GUI.bookmarkedit = 1;
	$( '.home-bookmark' ).append( '<div class="home-block-remove"><span class="block-remove">&times;</span></div>' );
} ).click( function( e ) {
	if ( $( e.target ).parent().hasClass( 'home-bookmark' ) || $( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	$( '.home-bookmark div.home-block-remove' ).remove();
	setTimeout( function() { GUI.bookmarkedit = 0 }, 500 );
} );

$( '#home-blocks' ).on( 'click', '.home-block', function( e ) {
	var $this = $( this );
	if ( $( e.target ).is( 'span.block-remove' ) ) {
		var id = this.id.replace( 'home-bookmark-', '' );
		var name = $this.find( 'h4' ).text();
		$.post( '/db/?cmd=bookmark', { id: id, name: name }, function() {
			$this.parent().remove();
		} );
	} else if ( $this.data( 'target' ) === 'webradio-add' ) {
		webRadioNew();
	} else {
		if ( GUI.bookmarkedit ) return;
		
		mutationLibrary.observe( observerLibrary, observerOption );
		var browsemode = $this.data( 'browsemode' );
		GUI.plugin = $this.data( 'plugin' );
		GUI.dbbrowsemode = browsemode ? browsemode : GUI.plugin ? GUI.plugin : 'file';
		getDB( {
			  browsemode : browsemode
			, path       : $this.data( 'path' )
			, uplevel    : 0
			, plugin     : GUI.plugin
		} );
	}
} );

function setDisplayLibrary( e ) {
	info( {
		  title        : 'Libary Home'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysavelibrary">\
				<label><input name="bars" type="checkbox" '+ GUI.display.bars +'>&ensp;Top-Bottom menu</label>\
				<br><label><input name="nas" type="checkbox" '+ GUI.display.nas +'>&ensp;Network mounts</label>'
				+ ( GUI.libraryhome.localStorages ? '<br><label><input name="sd" type="checkbox" '+ GUI.display.sd +'>&ensp;Local SD</label>' : '' )
				+'<br><label><input name="usb" type="checkbox" '+ GUI.display.usb +'>&ensp;USB drives</label>\
				<br><label><input name="webradio" type="checkbox" '+ GUI.display.webradio +'>&ensp;Webradios</label>\
				<br><label><input name="albums" type="checkbox" '+ GUI.display.albums +'>&ensp;Albums</label>\
				<br><label><input name="artists" type="checkbox" '+ GUI.display.artists +'>&ensp;Artists</label>\
				<br><label><input name="composer" type="checkbox" '+ GUI.display.composer +'>&ensp;Composers</label>\
				<br><label><input name="genre" type="checkbox" '+ GUI.display.genre +'>&ensp;Genres</label>\
				<br><label><input name="dirble" type="checkbox" '+ GUI.display.dirble +'>&ensp;Dirble</label>\
				<br><label><input name="jamendo" type="checkbox" '+ GUI.display.jamendo +'>&ensp;Jamendo</label>\
			</form>'
		, cancel       : 1
		, ok           : function () {
			var toggles = {};
			$( '#displaysavelibrary input' ).each( function() {
				toggles[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = { set: [ 'hmSet', 'display', toggles ] };
			$.post( 'enhance.php', { redis: JSON.stringify( command ) } );
		}
	} );
}

// playback buttons click go back to home page
$( '.playback-controls' ).click( function() {
	if ( !$( '#playback' ).hasClass( 'active' ) ) $( '#open-playback' ).click();
} );

var btnctrl = {
	  timeTL : 'overlay-playsource-open'
	, timeT  : 'toggle'
	, timeTR : 'menu'
	, timeL  : 'previous'
	, timeM  : 'play'
	, timeBL : 'random'
	, timeR  : 'next'
	, timeB  : 'stop'
	, timeBR : 'repeat'
	, coverTL: 'overlay-playsource-open'
	, coverT : 'toggle'
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
	if ( cmd === 'toggle' ) {
		$( '.controls, .controls1, .rs-tooltip, #imode' ).toggleClass( 'hide' );
		return;
	} else if ( cmd === 'menu' ) {
		$( '#menu-settings' ).click();
	} else if ( cmd === 'random' ) {
		var onoff = GUI.json.random === '0' ? 1 : 0;
		sendCmd( 'random '+ onoff );
	} else if ( cmd === 'repeat' ) {
		if ( GUI.json.repeat === '0' ) {
			sendCmd( 'repeat 1' );
		} else {
			if ( GUI.json.single === '0' ) {
				sendCmd( 'single 1' );
			} else {
				sendCmd( 'repeat 0' );
				sendCmd( 'single 0' );
			}
		}
	} else if ( cmd ) {
		$( '#'+ cmd ).click();
	}
} );
$( '#menu-top, #menu-bottom, #settings' ).click( function( e ) {
	if ( e.target.id !== 'menu-settings' ) $( '#settings' ).addClass( 'hide' );
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} );

function bioShow() {
	$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
	$( '#bio' ).removeClass( 'hide' );
}
$( '#currentartist, #songinfo-open' ).click( function() {
	if ( GUI.json.radio ) return;
	$( '#loader' ).removeClass( 'hide' );
	
	if ( $( '#bio legend' ).text() != GUI.json.currentartist ) {
		$.get( 'enhancebio.php',
			{ artist: GUI.json.currentartist },
			function( data ) {
				$( '#biocontent' ).html( data );
				bioShow();
		}, 'html' );
	} else {
		bioShow();
	}
} );
$( '#biocontent' ).delegate( '.biosimilar', 'click', function() {
	$( '#loader' ).removeClass( 'hide' );
	$.get( 'enhancebio.php',
		{ artist: $( this ).find( 'p' ).text() },
		function( data ) {
			$( '#biocontent' ).html( data );
			bioShow();
			$( '#bio' ).scrollTop( 0 );
		}
	);
} );
$( '#closebio' ).click( function() {
	$( '#bio' ).addClass( 'hide' );
} );
// poweroff
$( '#turnoff' ).click( function() {
	info( {
		  icon        : 'power-off'
		, title       : 'Power'
		, message     : 'Select mode:'
		, oklabel     : 'Power off'
		, okcolor     : '#bb2828'
		, ok          : function() {
			$( '#gpio' ).length ? $.get( 'gpioexec.php?command=poweroff' ) : $.post( 'settings', { 'syscmd' : 'poweroff' } );
			$( '#loader' ).removeClass( 'hide' );
		}
		, buttonlabel : '&ensp;Reboot&ensp;'
		, buttoncolor : '#de810e'
		, button      : function() {
			$( '#gpio' ).length ? $.get( 'gpioexec.php?command=reboot' ) : $.post( 'settings', { 'syscmd' : 'reboot' } );
			$( '#loader' ).removeClass( 'hide' );
		}
	} );
} );
$( '#overlay-playsource-open' ).click( function() {
	$( '#overlay-playsource' ).addClass( 'open' );
} );
$( '#overlay-playsource-close' ).click( function() {
	$( '#overlay-playsource' ).removeClass( 'open' );
} );
$( '#overlay-social-open' ).click( function() {
	$( '#overlay-social' ).addClass( 'open' );
	var urlTwitter = 'https://twitter.com/home?status=Listening+to+' + GUI.json.currentsong.replace( /\s+/g, '+' ) +'+by+'+ GUI.json.currentartist.replace( /\s+/g, '+' ) +'+on+%40RuneAudio+http%3A%2F%2Fwww.runeaudio.com%2F+%23nowplaying';
	$( '#urlTwitter' ).attr( 'href', urlTwitter );
} );
$( '#overlay-social-close' ).click( function() {
	$( '#overlay-social' ).removeClass( 'open' );
} );
$( '#playsource-spotify' ).click( function() {
	if ( $( this ).hasClass( 'inactive' ) ) {
		if ( GUI.libraryhome.Spotify === '1' ) {
			//GUI.forceGUIupdate = true;
			$.ajax( {
				  url   : '/command/?switchplayer=Spotify'
				, cache : false
			} );
			// close switch buttons layer
			$( '#overlay-playsource-close' ).trigger( 'click' );
		} else {
			new PNotify( {
				  title : 'Spotify not enabled'
				, text  : 'Enable and configure it under the Settings screen'
				, icon  : 'fa fa-exclamation-circle'
			} );
		}
	}
} );

// library directory path link
$( '#db-home' ).click( function() {
	renderLibraryHome();
} );
$( '#db-currentpath' ).on( 'click', 'a', function() {
	if ( $( '#db-currentpath span a' ).length === 1 ) return;
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
//	$( 'html, body' ).scrollTop( 0 );
} );
$( '#db-webradio-new' ).click( function() {
	webRadioNew();
} );
$( '#searchbtn' ).click( function() {
	var keyword = $( '#db-search-keyword' ).val();
	if ( !keyword ) return;
	getDB( {
		  cmd : 'search'
		, arg : keyword
	} );
} );
$( '#db-search-keyword' ).on( 'keypress', function( e ) {
	if ( e.which == 13 ) $( '#searchbtn' ).click();
} );
$( '#db-level-up' ).on( 'click', function() {
	// topmost of path
	if ( $( '#db-currentpath span a' ).length === 1 ) {
		renderLibraryHome();
		return
	}
	if ( GUI.dbbrowsemode === 'file' ) {
		$( '#db-currentpath a:nth-last-child( 2 )' ).click();
	} else {
		if ( [ 'artist', 'genre', 'Dirble' ].indexOf( GUI.dbbrowsemode ) === -1 ) {
			$( '#db-currentpath span a:eq( 0 )' ).click();
		} else {
			if ( GUI.browsemode === GUI.dbbrowsemode ) {
				$( '#db-currentpath span a:eq( 0 )' ).click();
				GUI.dbbackdata = [];
				GUI.dbback = 0;
			} else {
				GUI.dbback = 1;
				var dbbacklast = GUI.dbbackdata.pop();
				if ( dbbacklast.path === GUI.currentpath ) {
					getDB( GUI.dbbackdata.pop() );
				} else {
					getDB( dbbacklast );
				}
			}
		}
	}
} );
$( '#database-entries' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	var path = $this.data( 'path' );
	// get scroll position for back navigation
	var current = $( '#db-currentpath' ).attr( 'path' );
	GUI.dbscrolltop[ current ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	$( '#database-entries li' ).removeClass( 'active' );
	$this.addClass( 'active' );
	if ( !$this.hasClass( 'db-folder' ) ) return;
	
	var mode = $this.attr( 'mode' );
	if ( [ 'dirble', 'jamendo', 'spotify' ].indexOf( mode ) === -1 ) {
		getDB( {
			  path       : path
			, uplevel    : 0
			, browsemode : mode ? mode : 'file'
		} );
		return;
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

$( '#db-index li' ).click( function() {
	var topoffset = GUI.display.bars ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	var usbpath = GUI.currentpath.slice( 0, 3 ) === 'USB' ? 1 : 0;
	var datapathindex, name;
	var matcharray = $( '#database-entries li' ).filter( function() {
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
$( '#pl-index li' ).click( function() {
	var topoffset = GUI.display.bars ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
//	console.log($( '#pl-editor li' ))
	var matcharray = $( '#pl-editor li' ).filter( function() {
		var name = stripLeading( $( this ).data( 'path' ) );
		return name.match( new RegExp( '^'+ indextext, 'i' ) );
	} );
	if ( matcharray.length ) $( 'html, body' ).scrollTop( matcharray[ 0 ].offsetTop - topoffset );
} );

$( '#plsave' ).click( function() {
	playlistSave();
} );
$( '#pl-manage-clear' ).click( function() {
	info( {
		  title   : 'Clear Playlist'
		, message : 'Clear this playlist?'
		, cancel  : 1
		, ok      : function() {
			GUI.plclear = 1;
			sendCmd( 'clear' );
			$( '#pl-count' ).html( '<a>PLAYLIST</a>' );
			$( '#playlist-entries' ).empty();
			$( '#playlist-warning' ).removeClass( 'hide' );
		}
	} );
} );
$( '#playlist-entries' ).on( 'click', 'li', function( e ) {
	if ( $( e.target ).hasClass( 'pl-action' ) ) {
		GUI.noscroll = 1; // prevent scroll to active li
		sendCmd( 'deleteid '+ $( this ).prop( 'id' ).replace( 'pl-', '' ) );
		$( this ).remove();
		return
	}
	sendCmd( 'play '+ $( this ).index() );
	$( '#playlist-entries li' ).removeClass( 'active' );
	$( this ).addClass( 'active' );
} );
// context menus //////////////////////////////////////////////
$( 'body' ).click( function( e ) {
	if ( e.target.id !== 'menu-settings'
		&& e.target.id !== 'coverTR'
		&& !$( e.target ).hasClass( 'db-action' )
		&& !$( e.target ).hasClass( 'pl-action' )
	) {
		GUI.plcurrent = '';
		$( '.menu, .contextmenu' ).addClass( 'hide' );
	}
} );

$( '#database-entries' ).on( 'click', '.db-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	GUI.dbpath = $thisli.data( 'path' );
	GUI.DBentry.path = GUI.dbpath; // used in contextmenu
	if ( !$thisli.find( '.sn' ).length ) {
		GUI.DBentry.name = $thisli.text() ;
	} else {
		GUI.DBentry.name = $thisli.find( '.sn' ).text();
		GUI.DBentry.url = $thisli.find( '.bl' ).text();
	}
	var $target = $( $this.data( 'target' ) );
	$( '#database-entries li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( GUI.dbpath === GUI.dbcurrent ) {
		GUI.dbcurrent = '';
	} else {
		GUI.dbcurrent = GUI.dbpath;
		$thisli.addClass( 'active' );
		$target.removeClass( 'hide' )
			.css( 'top', $this.position().top +'px' )
			.find( '.menushadow' ).css( 'height', $target.find( 'i' ).length * 41 );
		var targetB = $target.offset().top + $target.height();
		var wH = window.innerHeight;
		if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
	}
} );
$( '#pl-editor' ).on( 'click', '.pl-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	var plname = $thisli.data( 'path' );
	GUI.DBentry.name = plname; // used in contextmenu
	$( '#pl-editor li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( plname === GUI.plcurrent ) {
		GUI.plcurrent = '';
	} else {
		GUI.plcurrent = plname;
		$thisli.addClass( 'active' );
		$( '#context-menu-playlist' )
			.removeClass( 'hide' )
			.css( 'top', $this.position().top +'px' );
		var targetB = $( '#context-menu-playlist' ).offset().top + 246;
		var wH = window.innerHeight;
		if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
	}
} );
$( '.contextmenu a' ).click( function() {
	var cmd = $( this ).data( 'cmd' );
	GUI.dbcurrent = '';
	switch( cmd ) {
		case 'wradd':
			getDB( { cmd: 'add', path: GUI.DBentry.path } );
			break;
		case 'wraddplay':
			getDB( { cmd: 'addplay', path: GUI.DBentry.path } );
			break;
		case 'wraddreplaceplay':
			getDB( { cmd: 'addreplaceplay', path: GUI.DBentry.path } );
			break;
		case 'wrrename':
			webRadioRename();
			break;
		case 'wrdelete':
			webRadioDelete();
			break;
		// in dirble
		case 'wrsave':
			$.post( '/db/?cmd=addradio', { 'radio[label]': GUI.DBentry.name, 'radio[url]': GUI.DBentry.url } );
			break;
		
		case 'pladd':
			$.post( 'enhance.php', { mpd: 'load "' + GUI.DBentry.name +'"', pushstream: 'playlist' } );
			break;
		case 'plreplace': 
			$.post( 'enhance.php', { mpd: 'command_list_begin\nclear\nload "'+ GUI.DBentry.name +'"\ncommand_list_end', pushstream: 'playlist' } );
			break;
		case 'pladdreplaceplay':
			$.post( 'enhance.php', { mpd: 'command_list_begin\nclear\nload "'+ GUI.DBentry.name + '"\nplay\ncommand_list_end', pushstream: 'playlist' } );
			break;
		case 'plrename':
			playlistRename();
			break;
		case 'pldelete':
			playlistDelete();
			break;
		case 'plashuffle':
			$.post( '/db/?cmd=pl-ashuffle', { playlist: GUI.DBentry.name } );
			$( '#random' ).data( 'cmd', 'pl-ashuffle-stop' ).addClass( 'btn-primary' );
			break;
		default:
			if ( cmd === 'bookmark' ) GUI.bookmarkedit = 1;
			$.post( '/db/?cmd='+ cmd, { path: GUI.DBentry.path }, function() {
				renderPlaylist();
			} );
			break;
	}
} );

function webRadioNew( name, url ) {
	info( {
		  icon       : 'edit-circle'
		, title      : 'Add Webradio'
		, textlabel  : 'Name'
		, textvalue  : name || ''
		, textlabel2 : 'URL'
		, textvalue2 : url || ''
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			webRadioNewVerify( $( '#infoTextBox' ).val().trim(), $( '#infoTextBox2' ).val().trim() );
		}
	} );
}
function webRadioNewVerify( name, url ) {
	if ( !name || !url ) {
		info( {
			  icon    : 'warning'
			, title   : 'Add Webradio'
			, message : 'Name and URL cannot be blank.'
			, ok      : function() {
				webRadioNew( name, url );
			}
		} );
		return;
	}
	var exists = false;
	$( '#database-entries li span.sn' ).each( function( i, el ) {
		if ( $( el ).text() === name ) {
			exists = true;
			return false;
		}
	} );
	if ( exists ) {
		info( {
			  icon    : 'warning'
			, title   : 'Add Webradio'
			, message : '<white>'+ name +'</white> already exists.'
			, ok      : function() {
				webRadioNew( name, url );
			}
		} );
	} else {
		$.post( '/db/?cmd=addradio', {
			  'radio[label]' : name
			, 'radio[url]'   : url
		} );
		getDB( { path: 'Webradio' } );
	}
}
function webRadioRename( name ) {
	info( {
		  icon      : 'edit-circle'
		, title     : 'Rename Webradio'
		, message   : 'Rename:'
					+'<br><white>'+ GUI.DBentry.name +'</white>'
					+'<br>'+ GUI.DBentry.url
		, textlabel : 'To'
		, textvalue : name ? name : GUI.DBentry.name
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			webRadioRenameVerify( $( '#infoTextBox' ).val().trim(), GUI.DBentry.name, GUI.DBentry.url );
		}
	} );
}
function webRadioRenameVerify( name, oldname, url ) {
	if ( !name ) {
		info( {
			  icon    : 'warning'
			, title   : 'Rename Webradio'
			, message : 'Name cannot be blank.'
			, ok      : function() {
				webRadioRename();
			}
		} );
		return;
	}
	var exists = false;
	$( '#database-entries li span.sn' ).each( function( i, el ) {
		if ( $( el ).text() === name ) {
			exists = true;
			return false;
		}
	} );
	if ( exists ) {
		info( {
			  icon    : 'warning'
			, title   : 'Rename Webradio'
			, message : '<white>'+ name +'</white> already exists.'
			, ok      : function() {
				webRadioRename( name );
			}
		} );
	} else {
		$.post( '/db/?cmd=editradio', {
			  'radio[newlabel]' : name
			, 'radio[label]'    : oldname
			, 'radio[url]'      : url
		} );
	}
}
function webRadioDelete() {
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Webradio'
		, message : 'Delete?'
					+'<br><white>'+ GUI.DBentry.name +'</white>'
					+'<br>'+ GUI.DBentry.url
		, cancel  : 1
		, ok      : function() {
			$.post( '/db/?cmd=deleteradio', { 'radio[label]' : GUI.DBentry.name +'.pls' } );
		}
	} );
}
function playlistSave( name ) {
	info( {
		  icon      : 'save'
		, title     : 'Save Playlist'
		, message   : 'Save this playlist as:'
		, textlabel : 'Name'
		, valuetext : name || ''
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			playlistSaveVerify( $( '#infoTextBox' ).val().trim() );
		}
	} );
}
function playlistSaveVerify( name ) {
	if ( !name ) {
		info( {
			  icon    : 'warning'
			, title   : 'Save Playlist'
			, message : 'Name cannot be blank.'
			, ok      : function() {
				playlistSave();
			}
		} );
		return;
	} 
	$.post( 'enhance.php', { mpd: 'listplaylists' }, function( data ) {
		var pl = data.split( '\n' ).filter( function( el ) { return el.match( /^playlist/ ) } );
		var exists = false;
		pl.some( function( el ) {
			return  exists = ( name === el.replace( 'playlist: ', '' ) );
		} );
		if ( exists ) {
			info( {
				  icon    : 'warning'
				, title   : 'Save Playlist'
				, message : '<white>'+ name +'</white> already exists.'
				, ok      : function() {
					playlistSave( name );
				}
			} );
		} else {
			sendCmd( 'save "'+ name +'"' );
		}
	}, 'text' );
}
function playlistRename( name ) {
	info( {
		  icon      : 'edit-circle'
		, title     : 'Rename Playlist'
		, message   : 'Rename:'
		             +'<br><white>'+ GUI.DBentry.name +'</white>'
		, textlabel : 'To'
		, textvalue : name ? name : GUI.DBentry.name
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			playlistRenameVerify( $( '#infoTextBox' ).val().trim(), GUI.DBentry.name );
		}
	} );
}
function playlistRenameVerify( name, oldname ) {
	if ( !name ) {
		info( {
			  icon    : 'warning'
			, title   : 'Rename Playlist'
			, message : 'Name cannot be blank.'
			, ok      : function() {
				playlistRename();
			}
		} );
		return;
	}
	if ( $( '#pl-editor li[data-path='+ name +']' ).length ) {
		info( {
			  icon    : 'warning'
			, title   : 'Rename Playlist'
			, message : '<white>'+ name +'</white> already exists.'
			, ok      : function() {
				playlistRename( name );
			}
		} );
	} else {
		$.post( 'enhance.php', { mpd: 'rename "'+ oldname +'" "'+ name +'"', pushstream: 'playlist' } );
	}
}
function playlistDelete() {
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Playlist'
		, message : 'Delete?'
					+'<br><white>'+ GUI.DBentry.name +'</white>'
		, cancel  : 1
		, ok      : function() {
			$.post( 'enhance.php', { mpd: 'rm "'+ GUI.DBentry.name +'"', pushstream: 'playlist' } );
		}
	} );
}
$( '#pl-home' ).click( function() {
	$( '#open-panel-dx' ).click();
} );
// playlist click go back to home page
$( '#playlist-entries' ).click( function( e ) {
	if ( e.target.nodeName == 'SPAN' ) {
		$( '#open-playback a' ).click();
		$( '#open-playback a' )[ 0 ].click();
		$( '#menu-top, #menu-bottom' ).toggleClass( 'hide', ( window.innerWidth < 499 || window.innerHeight < 515 ) );
	}
} );
$( '#pl-manage-list' ).click( function() {
	$( '.playlist' ).addClass( 'hide' );
	$( '#loader' ).removeClass( 'hide' );
	
	$.get( '/command/?cmd=listplaylists', function( data ) {
		var pl = data.split( '\n' ).filter( function( el ) { return el.match( /^playlist/ ) } );
		arraypl = [];
		pl.forEach( function( el ) {
			arraypl.push( el.replace( 'playlist: ', '' ) );
		} );
		arraypl.sort( function( a, b ) {
			return stripLeading( a ).localeCompare( stripLeading( b ), undefined, { numeric: true } );
		} );
		var content = '';
		arraypl.forEach( function( el ) {
			content += '<li class="pl-folder" data-path="'+ el +'"><i class="fa fa-bars pl-action"></i><span>'+ el +'</span></li>';
		} );
		$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
			GUI.pleditor = 1;
			// fill bottom of list to mave last li movable to top
			$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
			$( '#loader' ).addClass( 'hide' );
			$( '#pl-currentpath, #pl-editor, #pl-index' ).removeClass( 'hide' );
			$( 'html, body' ).scrollTop( GUI.plscrolltop );
			displayIndex();
		} );
	} );
} );
$( '#pl-filter' ).on( 'keyup', function() {
	var search = $(this).val();
	var count = 0;
	$( '#playlist-entries li' ).each( function() {
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
	$( '#pl-manage, #pl-count, #playlist-entries li' ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
	$( '#playlist-entries li' ).show();
} );

var list = document.getElementById( 'playlist-entries' );
new Sortable( list, {
	  ghostClass : 'sortable-ghost'
	, delay      : 300
	, onStart    : function( e ) {
		$icon = $( e.item ).find( 'i' );
		$icon.hide();
	  }
	, onEnd      : function() {
		$icon.show();
	  }
	, onUpdate   : function ( e ) {
		GUI.noscroll = 1;
		var plid = parseInt( e.item.id.replace( 'pl-', '' ) );
		$.post( 'enhance.php', { mpd: 'moveid '+ plid +' '+ e.newIndex, pushstream: 'playlist' } );
	}
} );
					
// MutationObserver - watch for '#database-entries' content changed then scroll to previous position
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observerOption = { childList: true };
var observerLibrary = document.getElementById( 'database-entries' );
var mutationLibrary = new MutationObserver( function() { // on observed target changed
	var scrollpos = GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ];
	$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	mutationLibrary.disconnect();
} );
$( '#db-level-up' ).click( function() {
	mutationLibrary.observe( observerLibrary, observerOption ); // standard js - must be one on one element
} );

$( '#playsource-mpd' ).on( 'click', function() {
	$.post( 'enhance.php', { bash: '/usr/bin/systemctl restart shairport' } );
	$( '#iplayer' ).removeClass( 'fa-airplay' ).addClass( 'hide' );
	$( '#overlay-playsource' ).removeClass( 'open' );
	$( '#playsource-mpd' ).removeClass( 'inactive' );
	$( '#playsource-airplay' ).addClass( 'inactive' );
} );
$( '#db-search-results' ).on( 'click', function() {
	$( this ).addClass( 'hide' );
	$( '#db-currentpath' ).css( 'width', '' );
	var mode = {
		  Artists  : 'artist'
		, Albums   : 'album'
		, Genres   : 'genre'
		, Composer : 'composer'
	}
	if ( GUI.currentpath ) {
		$( '#db-level-up' ).removeClass( 'hide' );
		getDB( {
			  browsemode : mode[ GUI.currentpath ]
			, path       : GUI.currentpath
		} );
		
		$( '#database-entries' ).removeAttr( 'style' );
		mutationLibrary.observe( observerLibrary, observerOption );
	} else {
		renderLibraryHome();
	}
} );

// new knob
function mpdSeek( seekto ) {
	if ( GUI.state !== 'stop' ) {
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		sendCmd( 'seekcur '+ seekto );
	} else {
		$.post( 'enhance.php', { mpd: 'command_list_begin\nplay\nseekcur '+ seekto +'\npause\ncommand_list_end' } );
	}
}
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
		if ( !GUI.json.radio ) {
			var seekto = Math.floor( e.value / 1000 * time );
			mpdSeek( seekto );
		} else {
			$timeRS.setValue( 0 );
		}
	}
	, start       : function () {
		if ( !GUI.json.radio ) {
			clearInterval( GUI.currentKnob );
			clearInterval( GUI.countdown );
		}
	}
	, drag        : function ( e ) { // drag with no transition by default
		if ( !GUI.json.radio ) {
			var seekto = Math.round( e.value / 1000 * time );
			$( '#elapsed' ).text( convertHMS( seekto ) );
		}
	}
	, stop        : function( e ) { // on 'stop drag'
		if ( !GUI.json.radio ) {
			var seekto = Math.round( e.value / 1000 * time );
			mpdSeek( seekto );
		}
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
	
	, create          : function () { // preserve shadow angle of handle
		$volumeRS = this;
		$volumetransition = $( '#volume' ).find( '.rs-animation, .rs-transition' );
		$volumetooltip = $( '#volume' ).find( '.rs-tooltip' );
		$volumehandle = $( '#volume' ).find( '.rs-handle' );
		$volumetooltip.add( $volumehandle ).addClass( 'hide' ); // hide '0' / 'NaN' on initial load - show after set
		$volumehandle.addClass( 'rs-transition' ).eq( 0 ) // make it rotate with 'rs-transition'
			.rsRotate( - this._handle1.angle );  // initial rotate
	}
	, change          : function( e ) { // (not fire on 'setValue' ) value after click or 'stop drag'
		tempFlag( 'setvolume' );
		$.post( 'enhance.php', { volume: e.value } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
		if ( e.preValue === 0 ) { // value before 'change'
			var command = { set: [ 'volumemute', 0 ] };
			$.post( 'enhance.php', { redis: JSON.stringify( command ) } );
			unmuteColor();
		}
	}
	, start           : function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmuteColor(); // value before 'start drag'
		GUI.setvolume = 1;
	}
	, drag            : function ( e ) { // drag with no transition by default
		if ( e.value % 2 === 0 ) {
			setvol( e.value ); // fix: enhancevolume.sh delay
			$( e.handle.element ).rsRotate( - e.handle.angle );
		}
	}
	, stop            : function( e ) { // on 'stop drag'
		$.post( 'enhance.php', { volume: e.value } );
		setTimeout( function() { GUI.setvolume = 0 }, 500 );
	}
} );

$( '#volmute, #volM' ).click( function() {
	tempFlag( 'setvolume' );
	var volumemute = $volumeRS.getValue();
	
	if ( volumemute ) {
		$.post( 'enhance.php', { volume: -1 } );
		$volumeRS.setValue( 0 );
		// keep display level before mute
		$volumetooltip.text( volumemute );
		// rotate box-shadow back
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		// change color after rotate finish
		$( '#volume .rs-first' ).one( 'transitionend webkitTransitionEnd mozTransitionEnd', function() {
			muteColor( volumemute );
		} );
	} else {
		$.post( 'enhance.php', { volume: -1 }, function( data ) {
			if ( data == 0 ) return;
			$volumeRS.setValue( data );
			$volumehandle.rsRotate( - $volumeRS._handle1.angle );
			// restore color immediately on click
			unmuteColor();
		}, 'text' );
	}
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	tempFlag( 'setvolume' );
	
	if ( ( vol === 0 && ( thisid === 'voldn' ) )
		|| ( vol === 100 && ( thisid === 'volup' ) ) )
			return;

	if ( vol === 0 ) {
		var command = { set: [ 'volumemute', 0 ] };
		$.post( 'enhance.php', { redis: JSON.stringify( command ) } );
		unmuteColor();
	}
	vol = ( thisid == 'volup' ) ? vol + 1 : vol - 1;
	$.post( 'enhance.php', { volume: vol } );
	$volumeRS.setValue( vol );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
} );

function setvol( vol ) {
	GUI.volume = vol;
	sendCmd( 'setvol '+ vol );
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

var blinkdot = '<a class="dot">.</a> <a class="dot dot2">.</a> <a class="dot dot3">.</a>';
function displayCommon() {
	if ( !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '#database, #playlist' ).css( 'padding', '40px 0' );
		$( '.btnlist-top' ).css( 'top', 0 );
	} else {
		$( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
		$( '#database, #playlist' ).css( 'padding', '' );
		$( '.btnlist-top' ).css( 'top', '40px' );
	}
}
function displayAirPlay() {
	$( '.playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#playlist-position span, #format-bitrate, #total' ).html( '&nbsp;' );
	$( '#currentartist' ).html( GUI.json.currentartist );
	$( '#currentsong' ).html( GUI.json.currentsong );
	$( '#currentalbum' ).html( GUI.json.currentalbum );
	$( '#elapsed, #total' ).html( '&nbsp;' );
	var time = new Date().getTime();
	$( '#cover-art' ).css( {
		  'background-image': 'url("assets/img/airplay-cover.jpg?v='+ time +'")'
		, 'border-radius': 0
	} );
	scrollText();
	$( '#menu-top, #menu-bottom' ).toggleClass( 'hide', !GUI.display.bars );
	$( '#playback-row' ).removeClass( 'hide' );
	$( '#time-knob' ).toggleClass( 'hide', !GUI.display.time );
	$( '#irandom, irepeat, #coverartoverlay, #volume-knob, #play-group, #share-group, #vol-group' ).addClass( 'hide' );
	$( '#playsource-mpd' ).addClass( 'inactive' );
	$( '#playsource-airplay' ).removeClass( 'inactive' );
	if ( GUI.display.time ) {
		$( '#time-knob, #play-group, #coverart, #share-group' ).css( 'width', '45%' );
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		$( '#time' ).roundSlider( 'setValue', 0 );
		$( '#elapsed' ).html( blinkdot );
		$( '#total' ).empty();
		$( '#iplayer' ).addClass( 'fa-airplay' ).removeClass( 'hide' );
	} else {
		$( '#coverart, #share-group' ).css( 'width', '60%' );
	}
}
function displayPlayback() {
	if ( GUI.activePlayer === 'Airplay' ) {
		displayAirPlay();
		return;
	}
	$( '#imode' ).addClass( 'hide' );
	$( '#iplayer' ).removeClass( 'fa-airplay' ).addClass( 'hide' );
	$( '.playback-controls' ).toggleClass( 'hide', GUI.json.playlistlength == 0 );
	
	if ( GUI.display.update != 0 ) {
		if ( GUI.display.bars ) {
			$( '#menu-settings' ).append( '<span id="badge">'+ GUI.display.update +'</span>' );
			$( '#iaddons' ).addClass( 'hide' );
		} else {
			$( '#iaddons' ).removeClass( 'hide' );
		}
	} else {
		$( '#badge' ).remove();
	}
	$( '#pause' ).toggleClass( 'hide', !GUI.display.pause );
	// reset to default css
	$( '#playback-row, #time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( {
		  margin          : ''
		, width           : ''
		, 'max-width'     : ''
		, order           : ''
		, '-webkit-order' : ''
		, display         : ''
	} );
	$( '#time-knob, #play-group' ).toggleClass( 'hide', !GUI.display.time );
	$( '#coverart, #share-group' ).toggleClass( 'hide', !GUI.display.coverart );
	var volume = ( !GUI.display.volumempd || !GUI.display.volume ) ? 0 : 1;
	$( '#volume-knob, #vol-group' ).toggleClass( 'hide', !volume );
	
	var i = ( GUI.display.time ? 1 : 0 ) + ( GUI.display.coverart ? 1 : 0 ) + volume;
	if ( i == 2 && window.innerWidth > 499 ) {
		if ( volume ) {
			$( '#time-knob' ).css( { order: 1, '-webkit-order': '1' } );
			$( '#coverart' ).css( { order: 2, '-webkit-order': '2' } );
			$( '#volume-knob' ).css( { order: 3, '-webkit-order': '3' } );
			$( '#play-group' ).css( { order: 4, '-webkit-order': '4' } );
			$( '#share-group' ).css( { order: 5, '-webkit-order': '5' } );
			$( '#vol-group' ).css( { order: 6, '-webkit-order': '6' } );
		}
		$( '#playback-row' ).css( 'max-width', '900px' );
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '45%' );
	} else if ( i == 1 ) {
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '60%' );
	}
	if ( GUI.display.radioelapsed !== GUI.radioelapsed ) {
		GUI.radioelapsed = GUI.display.radioelapsed;
		if ( GUI.json.radio && GUI.state === 'play' ) {
			clearInterval( GUI.countdown );
			if ( !GUI.radioelapsed ) {
				$( '#total' ).empty();
			} else {
				$.post( 'enhancestatus.php', function( status ) {
					var elapsed = status.elapsed;
					GUI.countdown = setInterval( function() {
						elapsed++
						mmss = convertHMS( elapsed );
						$( '#total' ).text( mmss );
					}, 1000 );
				}, 'json' );
			}
		}
	}
	if ( !GUI.display.buttons || window.innerHeight <= 320 || window.innerWidth < 499 ) {
		$( '#play-group, #share-group, #vol-group' ).addClass( 'hide' );
		if ( GUI.display.time ) {
			$( '#irandom' ).toggleClass( 'hide', GUI.json.random === '0' );
			if ( GUI.json.repeat === '0' ) {
				$( '#irepeat' ).removeClass( 'fa-repeat-single' ).addClass( 'hide' );
			} else {
				$( '#irepeat' ).removeClass( 'hide fa-repeat fa-repeat-single ' ).addClass( GUI.json.single === '1' ? 'fa-repeat-single' : 'fa-repeat' );
			}
		}
	}
	if ( GUI.activePlayer !== 'MPD' ) {
		var source = GUI.activePlayer.toLowerCase();
		$( '#iplayer' ).addClass( 'fa-'+ source ).removeClass( 'hide' );
	}
	setButton();
	displayCommon();
	
	setTimeout( function() {
		$( '#container-playback, #playback-row, #imode' ).removeClass( 'hide' );
		$( 'html, body' ).scrollTop( 0 );
	}, 600 );
}

function displayIndex() {
	setTimeout( function() {
		var wH = window.innerHeight;
		var indexoffset = $( '#menu-top' ).is( ':visible' ) ? 160 : 80;
		var indexline = wH < 500 ? 13 : 27;
		$( '.half' ).toggleClass( 'hide', wH < 500 );
		$index = $( '#panel-sx' ).hasClass( 'active' ) ? $( '#db-index' ) : $( '#pl-index' );
		$index.css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
	}, 0 );
}
// library show/hide blocks
function displayLibrary() {
	// no 'id'
	$( '#home-nas' ).parent().toggleClass( 'hide', !GUI.display.nas );
	$( '#home-local' ).parent().toggleClass( 'hide', !GUI.display.sd );
	$( '#home-usb' ).parent().toggleClass( 'hide', !GUI.display.usb );
	$( '#home-webradio' ).parent().toggleClass( 'hide', !GUI.display.webradio );
	$( '#home-albums' ).parent().toggleClass( 'hide', !GUI.display.albums );
	$( '#home-artists' ).parent().toggleClass( 'hide', !GUI.display.artists );
	$( '#home-composer' ).parent().toggleClass( 'hide', !GUI.display.composer );
	$( '#home-genre' ).parent().toggleClass( 'hide', !GUI.display.genre );
	$( '#home-dirble' ).parent().toggleClass( 'hide', !GUI.display.dirble );
	$( '#home-jamendo' ).parent().toggleClass( 'hide', !GUI.display.jamendo );
	
	displayCommon();
}
function setPlaylistScroll() {
	if ( GUI.pleditor ) return;
	
	var  wH = window.innerHeight;
	$( '#playlist-entries p' ).css( 'min-height', wH - 140 +'px' );
	$( 'html, body' ).scrollTop( 0 );
	$( '#playlist-entries li' ).removeClass( 'active' );
	var $liactive = $( '#pl-'+ GUI.status.Id );
	$liactive.addClass( 'active' );
	if ( GUI.noscroll ) {
		GUI.noscroll = 0;
		return;
	}
	setTimeout( function() {
		var scrollpos = $liactive.offset().top - $( '#playlist-entries' ).offset().top - ( 49 * 3 );
		$( 'html, body' ).animate( { scrollTop: scrollpos } );
	}, 0 );
}
function displayPlaylist() {
	if ( !GUI.pleditor ) {
		$( '#playlist-entries li' ).length ? setPlaylistScroll() : renderPlaylist();
	} else {
		if ( $( '#panel-dx' ).hasClass( 'active' ) ) {
			GUI.pleditor = 0;
			GUI.plclear = 0;
			renderPlaylist();
		} else {
			setTimeout( function() {
				$( 'html, body' ).scrollTop( GUI.plscrolltop );
			}, 0 );
		}
	}
	displayCommon();
}

function setPlaybackSource() {
	var activePlayer = GUI.activePlayer;
	$( '#overlay-playsource a' ).addClass( 'inactive' );
	var source = activePlayer.toLowerCase();
	$( '#playsource-' + source).removeClass( 'inactive' );
	
	if ( activePlayer === 'Spotify' || activePlayer === 'Airplay' ) {
//		$( '#volume-knob, #vol-group' ).addClass( 'hide' );
		$( '#single' ).prop( 'disabled' );
	}
}
function renderLibraryHome() {
//	GUI.dbscrolltop = {}; // comment to always keep scroll positions
	GUI.plugin = '';
	$( '#db-currentpath' ).removeAttr( 'path' ).css( 'width', '' );
	$( '#database-entries' ).empty();
	$( '#db-search-results' ).addClass( 'hide' );
	$( '#db-search-keyword' ).val( '' );
	if ( $( '#database-entries' ).hasClass( 'hide' ) && !GUI.bookmarkedit ) return;
	
	$( '#database-entries, #db-level-up' ).addClass( 'hide' );
	$( '#home-blocks, #db-homeSetup' ).removeClass( 'hide' );
	$( '#db-homeSetup' ).removeClass( 'btn-primary' ).addClass( 'btn-default' );
	var obj = GUI.libraryhome,
	toggleSpotify = '',
	notMPD = ( obj.ActivePlayer === 'Spotify' || obj.ActivePlayer === 'Airplay' );
	toggleMPD = notMPD ? ' inactive' : '';
	// Set active player
	setPlaybackSource();
	
	var content = '<br>';
	var divOpen = '<div class="col-lg-3 col-md-4 col-sm-6">';
	// bookmark
	var bookmarkL = obj.bookmarks.length;
	if ( bookmarkL ) {
		for ( i = 0; i < bookmarkL; i++ ) {
			var bookmark = obj.bookmarks[ i ];
			content += divOpen +'<div id="home-bookmark-'+ bookmark.id +'" class="home-block home-bookmark'+ toggleMPD +'" data-path="'+ bookmark.path +'"><i class="fa fa-bookmark"></i><h4>' + bookmark.name + '</h4></div></div>';
		}
	}
	// nas
	content += divOpen +'<a id="home-nas" class="home-block'+ toggleMPD +'"'+ ( obj.networkMounts === 0 ? ( notMPD ? '' : ' href="/sources/add/"' ) : ' data-path="NAS"' ) +'><i class="fa fa-network"></i><h4>Network drives <span>( '+ obj.networkMounts +' )</span></h4></a></div>';
	// sd
	if ( obj.localStorages ) {
		content += ( obj.localStorages === 0 ) ? '' : divOpen +'<div id="home-local" class="home-block'+ toggleMPD +'" data-path="LocalStorage"><i class="fa fa-microsd"></i><h4>SD card <span>( '+ obj.localStorages +' )</span></h4></div></div>';
	}
	// usb
	if ( obj.USBMounts ) {
		content += divOpen +'<div id="home-usb" class="home-block'+ toggleMPD +'"'+ ( obj.USBMounts === 0 ? ( notMPD ? '' : ' href="/sources/sources/"' ) : ' data-path="USB"' ) +'><i class="fa fa-usbdrive"></i><h4>USB drives <span>( '+ obj.USBMounts +' )</span></h4></div></div>';
	}
	// webradio
	var data = obj.webradio === 0 ? ' data-target="webradio-add"' : ' data-path="Webradio"';
	content += divOpen +'<div id="home-webradio" class="home-block'+ toggleMPD +'"'+ data +'><i class="fa fa-webradio"></i><h4>Webradios <span>( '+ obj.webradio +' )</span></h4></div></div>';
	// albums
	content += divOpen +'<div id="home-albums" class="home-block'+ toggleMPD +'" data-path="Albums" data-browsemode="album"><i class="fa fa-album"></i><h4>Albums</h4></div></div>';
	// artist
	content += divOpen +'<div id="home-artists" class="home-block'+ toggleMPD +'" data-path="Artists" data-browsemode="artist"><i class="fa fa-artist"></i><h4>Artists</h4></div></div>';
	// composer
	content += divOpen +'<div id="home-composer" class="home-block'+ toggleMPD +'" data-path="Composer" data-browsemode="composer"><i class="fa fa-composer"></i><h4>Composers</h4></div></div>';
	// genre
	content += divOpen +'<div id="home-genre" class="home-block'+ toggleMPD +'" data-path="Genres" data-browsemode="genre"><i class="fa fa-genre"></i><h4>Genres</h4></div></div>';
	// spotify
	if ( obj.Spotify && obj.Spotify !== '0' ) {
		if (obj.ActivePlayer !== 'Spotify' ) {
			content += divOpen +'<div id="home-spotify-switch" class="home-block"><i class="fa fa-spotify"></i><h4>Spotify</h4></div></div>';
		} else {
			content += divOpen +'<div id="home-spotify" class="home-block'+ toggleSpotify +'" data-plugin="Spotify" data-path="Spotify"><i class="fa fa-spotify"></i><h4>Spotify</h4></div></div>';
		}
	}
	// dirble
	content += divOpen +'<div id="home-dirble" class="home-block'+ toggleMPD +'" data-plugin="Dirble" data-path="Dirble"><i class="fa fa-dirble"></i><h4>Dirble</h4></div></div>';
	// jamendo
	content += divOpen +'<div id="home-jamendo" class="home-block'+ toggleMPD +'" data-plugin="Jamendo" data-path="Jamendo"><i class="fa fa-jamendo"></i><h4>Jamendo<span id="home-count-jamendo"></span></h4></div></div>';

	content += '</div>';
	$( '#home-blocks' ).html( content ).promise().done( function() {
		$( 'html, body' ).scrollTop( 0 );
	} );
	$( '#loader' ).addClass( 'hide' );
	$( '#db-currentpath span' ).html( '<a>&ensp;LIBRARY</a>' );
// hide breadcrumb, index bar, edit bookmark
	$( '#db-index, #db-level-up, #db-webradio-new, #db-homeSetup' ).addClass( 'hide' );
	displayLibrary();
}

// launch the right AJAX call for Library rendering
function getDB( options ) {
	// DEFAULTS
	var cmd = options.cmd || 'browse',
		path = options.path || '',
		browsemode = options.browsemode || 'file',
		uplevel = options.uplevel || '',
		plugin = options.plugin || '',
		querytype = options.querytype || '',
		args = options.args || '';
	
	if ( !GUI.dbback ) {
		if ( !plugin ) {
			GUI.dbbackdata.push( {
				  path       : path
				, browsemode : browsemode
				, uplevel    : uplevel
			} );
		} else {
			GUI.dbbackdata.push( {
				  path      : path
				, plugin    : plugin
				, args      : args
				, querytype : querytype
			} );
		}
	} else {
		GUI.dbback = 0;
	}
		
	$( '#loader' ).removeClass( 'hide' );
	GUI.browsemode = browsemode;
	
	if ( plugin ) {
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
					return;
				}
				populateDB( data.results, path, plugin, querytype );
			}, 'json' );
		}
	} else {
	// normal browsing
		if ( cmd === 'search' ) {
			var keyword = $( '#db-search-keyword' ).val();
			if ( path.match(/Dirble/)) {
				$.post( '/db/?cmd=dirble', { querytype: 'search', args: keyword }, function( data ) {
					populateDB( data, path, 'Dirble', 'search', uplevel );
				}, 'json' );
			} else {
				$.post( '/db/?querytype='+ GUI.browsemode +'&cmd=search', { query: keyword }, function( data ) {
					populateDB( data, path, '', '', uplevel, '', keyword );
				}, 'json' );
			}
		} else if ( cmd === 'browse' ) {
			$.post( '/db/?cmd=browse', { path: path, browsemode: GUI.browsemode }, function( data ) {
				populateDB( data, path, '', '', uplevel );
			}, 'json' );
		} else {
			$( '#loader' ).addClass( 'hide' );
			$.post( '/db/?cmd='+ cmd, { path: path, querytype: querytype }, function( path ) {
				// console.log('add= ', path);
			}, 'json');
		}
	}
}
function parseResponse( inputArr, i, respType, inpath, querytype ) {
	var inputArr = inputArr || '',
		i = i || 0,
		respType = respType || '',
		inpath = inpath || '',
		querytype = querytype || '',
		content = '';
	switch ( respType ) {
		case 'playlist':
			// code placeholder
			break;
		case 'db':
			if ( GUI.browsemode === 'file' ) {
				if ( inpath === '' && inputArr.file ) {
					var file = inputArr.file
					inpath = file.slice( 0, file.lastIndexOf( '/' ) );
				}
				if ( inputArr.file || inpath === 'Webradio' ) {
					content = '<li id="db-'+ ( i + 1 ) +'" data-path="';
					if ( inpath !== 'Webradio' ) {
						if ( inputArr.Title ) {
							if ( $( '#db-search-keyword' ).val() ) {
								var bl = inputArr.Artist +' - '+ inputArr.Album;
							} else {
								var bl = inputArr.file.split( '/' ).pop(); // filename
							}
							content += inputArr.file;
							content += '" class="db-song"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
							content += inputArr.Title +'<span>'+ convertHMS( inputArr.Time ) +'</span></span>';
							content += '<span class="bl">';
							content +=  bl;
						} else {
							content += inputArr.file;
							content += '" class="db-song"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
							content += inputArr.file.replace( inpath +'/', '' ) +' <span>' + convertHMS( inputArr.Time ) +'</span></span>';
							content += '<span class="bl">';
							content += ' path: ';
							content += inpath;
						}
					} else {
						content += inputArr.playlist;
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu-webradio"></i><i class="fa fa-webradio db-icon db-radio"></i>';
						content += '<span class="sn">'+ inputArr.playlist.replace( inpath +'/', '' ).replace( '.'+ inputArr.fileext, '' );
						content += '</span><span class="bl">'+ inputArr.url;
					}
					content += '</span></li>';
				} else if ( inputArr.playlist ) {
					if ( inputArr.fileext === 'cue' ) {
						content = '<li id="db-'+ ( i + 1 ) +'" data-path="';
						content += inputArr.playlist;
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-file-text db-icon"></i><span class="sn">';
						content += inputArr.playlist.replace( inpath +'/', '' ) +' <span>[CUE file]</span></span>';
						content += '<span class="bl">';
						content += ' path: ';
						content += inpath;
						content += '</span></li>';
					}
				} else {
					content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" data-path="';
					content += inputArr.directory;
					if (inpath !== '' ) {
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu"></i><span><i class="fa fa-folder"></i>'
					} else {
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu-root"></i><i class="fa fa-hdd-o icon-root"></i><span>';
					}
					content += inputArr.directory.replace( inpath +'/', '' );
					content += '</span></li>';
				}
			} else if ( GUI.browsemode === 'album' || GUI.browsemode === 'albumfilter' ) {
				if ( inputArr.file ) {
					content = '<li id="db-'+ ( i + 1 ) +'" data-path="';
					content += inputArr.file;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
					content += inputArr.Title +'<span>'+ convertHMS( inputArr.Time ) +'</span></span>';
					content += ' <span class="bl">';
					content +=  inputArr.Album;
					content += ' - ';
					content +=  inputArr.Artist;
					content += '</span></li>';
				} else if ( inputArr.album !== '' ) {
					content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" mode="album" data-path="';
					content += inputArr.album.replace( /\"/g, '&quot;' );
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i><span><i class="fa fa-album"></i>';
					content += inputArr.album;
					content += '</span></li>';
				}
			} else if ( GUI.browsemode === 'artist' ) {
				if ( inputArr.album ) {
					content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" mode="album" data-path="';
					content += inputArr.album;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i><span><i class="fa fa-album"></i>';
					content += ( inputArr.album !== '' ) ? inputArr.album : 'Unknown album';
					content += '</span></li>';
				} else if ( inputArr.artist !== '' ) {
					content = '<li id="db-'+ ( i + 1) +'" class="db-folder" mode="artist" data-path="';
					content += inputArr.artist;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i><span><i class="fa fa-artist"></i>';
					content += inputArr.artist;
					content += '</span></li>';
				}
			} else if ( GUI.browsemode === 'composer' ) {
				if ( inputArr.file ) {
					content = '<li id="db-'+ ( i + 1 ) +'" data-path="';
					content += inputArr.file;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
					content += inputArr.Title +'<span>'+ convertHMS( inputArr.Time ) +'</span></span>';
					content += ' <span class="bl">';
					content +=  inputArr.Artist;
					content += ' - ';
					content +=  inputArr.Album;
					content += '</span></li>';
				} else if ( inputArr.composer !== '' ) {
					content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" mode="composer" data-path="';
					content += inputArr.composer;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-composer"></i><span><i class="fa fa-composer"></i>';
					content += inputArr.composer;
					content += '</span></li>';
				}
			} else if ( GUI.browsemode === 'genre' ) {
				if ( inputArr.artist ) {
					content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" mode="artist" data-path="';
					content += inputArr.artist;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i><span><i class="fa fa-album"></i>';
					content += ( inputArr.artist !== '' ) ? inputArr.artist : 'Unknown artist';
					content += '</span></li>';
				} else if (inputArr.genre !== '' ) {
					content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" mode="genre" data-path="';
					content += inputArr.genre;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-genre"></i><span><i class="fa fa-genre"></i>';
					content += inputArr.genre;
					content += '</span></li>';
				}
			}
			break;
		case 'Spotify':
			if ( querytype === '' ) {
				content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" mode="spotify" data-path="';
				content += inputArr.index;
				content += '"><i class="fa fa-bars db-action" data-target="#context-menu-spotify-pl"></i><span><i class="fa fa-genre"></i>'
				content += ( inputArr.name !== '' ) ? inputArr.name : 'Favorites';
				content += ' ( ';
				content += inputArr.tracks;
				content += ' )</span></li>';
			} else if ( querytype === 'tracks' ) {
				content = '<li id="db-'+ ( i + 1 ) +'" mode="spotify" data-path="';
				content += inputArr.index;
				content += '" data-plid="';
				content += inpath;
				content += '" data-type="spotify-track"><i class="fa fa-bars db-action" data-target="#context-menu-spotify"></i><i class="fa fa-spotify db-icon"></i><span class="sn">';
				content += inputArr.Title +'<span>'+ convertHMS( inputArr.duration / 1000 ) +'</span></span>';
				content += ' <span class="bl">';
				content +=  inputArr.artist;
				content += ' - ';
				content +=  inputArr.album;
				content += '</span></li>';
			}
			break;
		case 'Dirble':
			if ( querytype === '' || querytype === 'childs' ) {
				var childClass = ( querytype === 'childs' ) ? ' db-dirble-child' : '';
				content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder'+ childClass +'" mode="dirble" data-path="';
				content += inputArr.id;
				content += '"><span><i class="fa fa-genre"></i>'
				content += inputArr.title;
				content += '</span></li>';
			} else if ( querytype === 'search' || querytype === 'stations' || querytype === 'childs-stations' ) {
				if ( inputArr.streams.length === 0 ) {
					break; // Filter stations with no streams
				}
				content = '<li id="db-'+ ( i + 1 ) +'" class="db-radio" mode="dirble" data-path="';
				content += inputArr.name +' | '+ inputArr.streams[ 0 ].stream;
				content += '"><i class="fa fa-bars db-action" data-target="#context-menu-dirble"></i><i class="fa fa-webradio db-icon"></i>';
				content += '<span class="sn">'+ inputArr.name +'<span>( '+ inputArr.country +' )</span></span>';
				content += '<span class="bl">';
				content += inputArr.website ? inputArr.website : '-no website-';
				content += '</span></li>';
			}
			break;
		case 'Jamendo':
			content = '<li id="db-'+ ( i + 1 ) +'" class="db-folder" mode="jamendo" data-path="';
			content += inputArr.stream;
			content += '"><img class="jamendo-cover" src="'+ inputArr.image +'" alt=""><i class="fa fa-bars db-action" data-target="#context-menu-file"></i>';
			content += '<span>'+ inputArr.dispname +'</span></div></li>';
			break;
	}
	return content;
}
// strip leading A|An|The|(|[|. (for sorting)
function stripLeading( string ) {
	if ( typeof string === 'number' ) string = string.toString();
	return string.replace( /^A +|^An +|^The +|^\(\s*|^\[\s*|^\.\s*/i, '' );
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
	$( '#database-entries' ).empty();
	$( '#database-entries, #db-level-up' ).removeClass( 'hide' );
	$( ' #home-blocks ' ).addClass( 'hide' );

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
			for (i = 0; (row = data[i]); i += 1) content += parseResponse( row, i, 'Spotify', arg, querytype );
		} else if ( plugin === 'Dirble' ) {
			if ( querytype === 'childs-stations' ) {
				content = $( '#database-entries' ).html();
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
				for (i = 0; (row = data[i]); i += 1) content += parseResponse( row, i, 'Dirble', '', querytype );
			}
		} else if ( plugin === 'Jamendo' ) {
			data.sort( function( a, b ) {
				if ( path === 'Jamendo' && querytype === '' ) {
					return stripLeading( a[ 'dispname' ] ).localeCompare( stripLeading( b[ 'dispname' ] ), undefined, { numeric: true } )
				} else {
					return 0;
				}
			} );
			for (i = 0; (row = data[i]); i += 1) content += parseResponse( row, i, 'Jamendo', '', querytype );
		}
	} else {
// normal MPD browsing
		// show index bar
		if ( ( path === '' && keyword === '' ) || !data.length ) {
			$( '#loader' ).addClass( 'hide' );
			return;
		} else {
			var type = {
				  Albums       : 'album'
				, Artists      : 'artist'
				, AlbumArtists : 'artist'
				, Composer     : 'composer'
				, Genres       : 'genre'
				, Webradio     : 'playlist'
			}
			var mode = {
				  file     : 'file'
				, album    : 'file'
				, artist   : 'album'
				, genre    : 'artist'
				, composer : 'file'
			}
			// undefined type are directory names
			prop = type[ path ] ? type[ path ] : 'directory';
			// filter out blank and various
			if ( prop === 'artist' || prop === 'genre' || prop === 'directory' ) {
				data = data.filter( function( el ) {
					var key = ( el[ prop ] !== undefined ) ? prop : mode[ GUI.browsemode ];
					return el[ key ].search( /^\s+$|^\(*various\)* *|^\(*va\)* */i ) === -1;
				} );
			}
			if ( data.length === 0 ) {
				$( '#loader' ).addClass( 'hide' );
				return;
			}
			// browsing
			if ( keyword ) {
			// search results
				var results = ( data.length ) ? data.length : '0';
				$( '#db-level-up, #db-index' ).addClass( 'hide' );
				$( '#database-entries' ).css( 'width', '100%' );
				$( '#db-search-results' )
					.removeClass( 'hide' )
					.html( '<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span>\
						<span>' + results + ' <a>of</a> </span>' );
			}
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
				for ( i = 0; i < arraydirL; i++ ) content += parseResponse( arraydir[ i ], i, 'db', path );
				arrayfile.sort( function( a, b ) {
					if ( !keyword ) {
						return stripLeading( a[ 'file' ] ).localeCompare( stripLeading( b[ 'file' ] ), undefined, { numeric: true } );
					} else {
						return stripLeading( a[ 'Title' ] ).localeCompare( stripLeading( b[ 'Title' ] ), undefined, { numeric: true } );
					}
				} );
				var arrayfileL = arrayfile.length;
				for ( i = 0; i < arrayfileL; i++ ) content += parseResponse( arrayfile[ i ], i, 'db', path );
			} else {
				data.sort( function( a, b ) {
					if ( a[ prop ] === undefined ) prop = mode[ GUI.browsemode ];
					return stripLeading( a[ prop ] ).localeCompare( stripLeading( b[ prop ] ), undefined, { numeric: true } );
				} );
				var dataL = data.length;
				for ( i = 0; i < dataL; i++ ) content += parseResponse( data[ i ], i, 'db', path );
			}
			$( '#db-webradio-new' ).toggleClass( 'hide', path !== 'Webradio' );
		}
	}
	$( '#database-entries' ).html( content +'<p></p>' ).promise().done( function() {
		// fill bottom of list to mave last li movable to top
		$( '#database-entries p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
		displayIndex();
	} );
	
// breadcrumb directory path link
	var dot = '<span style="color: #587ca0"> &#8226; </span>';
	var icon = {
		  USB          : '<i class="fa fa-usbdrive"></i>'
		, LocalStorage : '<i class="fa fa-microsd"></i>'
		, NAS          : '<i class="fa fa-network"></i>'
		, Webradio     : '<i class="fa fa-webradio"></i>'
		, Dirble       : '<i class="fa fa-dirble"></i>'
		, Jamendo      : '<i class="fa fa-jamendo"></i>'
		, Spotify      : '<i class="fa fa-spotify"></i>'
		, album        : '<i class="fa fa-album"></i>'
		, artist       : '<i class="fa fa-artist"></i>'
		, genre        : '<i class="fa fa-genre"></i>'
		, composer     : '<i class="fa fa-composer"></i>'
	}
	var name = {
		  USB          : 'USB'
		, LocalStorage : 'SD'
		, NAS          : 'NETWORK'
		, Webradio     : 'WEBRADIOS'
		, Dirble       : ' DIRBLE'
		, Jamendo      : 'JAMENDO'
		, Spotify      : 'SPOTIFY'
		, album        : 'ALBUMS'
		, artist       : 'ARTISTS'
		, genre        : 'GENRES'
		, composer     : 'COMPOSERS'
	}
	var mode = {
		  album    : 'Albums'
		, artist   : 'Artists'
		, genre    : 'Genres'
		, composer : 'Composer'
	}
	if ( GUI.browsemode !== 'file' ) {
		if ( GUI.browsemode !== 'album' ) {
			var dot = ( path === mode[ GUI.browsemode ] ) ? '' : '<a>'+ dot +'<span class="white">'+ path +'</span></a>';
		} else {
			var albumartist = $( '#database-entries li:eq( 0 ) span.bl' ).text();
			var dot = albumartist ? '<a>'+ dot +'<span class="white">'+ albumartist +'</span></a>' : '';
		}
		$( '#db-currentpath' ).attr( 'path', path ); // for back navigation
		$( '#db-currentpath span' ).html( icon[ GUI.browsemode ] +'&ensp;<a data-path="'+ mode[ GUI.browsemode ] +'">'+ name[ GUI.browsemode ] +'</a>'+ dot );
	} else {
		var folder = path.split( '/' );
		var folderPath = '';
		var folderCrumb = icon[ folder[ 0 ] ];
		if ( folderCrumb ) {
			var ilength = folder.length;
			for ( i = 0; i < ilength; i++ ) {
				folderPath += ( i > 0 ? '/' : '' ) + folder[ i ];
				folderCrumb += '<a data-path="'+ folderPath +'">'+ ( i > 0 ? '<w> / </w>' : '' ) + ( name[ folder[ i ] ] ? name[ folder[ i ] ] : folder[ i ] ) +'</a>';
				if ( i === ilength - 1 ) $( '#db-currentpath' ).attr( 'path', path );
			} 
		} else {
			folderCrumb = '';
			$( '#db-currentpath' ).css( 'width', '50px' );
		}
		$( '#db-currentpath span' ).html( folderCrumb );
	}
	if ( querytype != 'childs' ) $( '#loader' ).addClass( 'hide' );
	// hide index bar in file mode
	if ( $( '#database-entries li:eq( 0 )' ).hasClass( 'db-song' ) ) {
		$( '#db-index' ).addClass( 'hide' );
		$( '#database-entries' ).css( 'width', '100%' );
	} else {
		$( '#db-index' ).removeClass( 'hide' );
		$( '#database-entries' ).css( 'width', '' );
	}
	$( 'html, body' ).scrollTop( 0 );
}
function renderPlaylist() {
	$( '#pl-filter' ).val( '' );
	$( '#pl-filter-results' ).empty();
	$( '#pl-currentpath, #pl-editor, #pl-index' ).addClass( 'hide' );
	
	if ( ( GUI.json.playlistlength == 0 && !GUI.pleditor ) || GUI.plclear ) {
		GUI.plclear = 0;
		$( '.playlist' ).removeClass( 'hide' );
		$( '#pl-count' ).html( '<a>PLAYLIST</a>' );
		var barhide = !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515;
		$( '#playlist-warning' ).css( 'margin-top', barhide ? '27px' : '67px' );
		return;
	}
	
	$( '#loader' ).removeClass( 'hide' );
	
	$.get( '/db/?cmd=playlist', function( data ) {
		var current = parseInt( GUI.json.song ) + 1;
		var state = GUI.json.state;
		var content = bottomline = classcurrent = classradio = hidetotal = '';
		var id = totaltime = playlisttime = countsong = countradio = counttotal = i = 0;
		var ilength = data.length;
		for ( i = 0; i < ilength; i++ ) {
			var pl = data[ i ];
			if ( pl.file.slice( 0, 4 ) === 'http' ) {
				var iconhtml = '<i class="fa fa-webradio pl-icon"></i>';
				classradio = 1;
				countradio++
				topline = pl.Title;
				bottomline = pl.file;
			} else {
				var iconhtml = '<i class="fa fa-music pl-icon"></i>';
				countsong++
				time = parseInt( pl.Time );
				var title = pl.Title ? pl.Title : pl.file.split( '/' ).pop();
				var track = pl.Track ? '#'+ pl.Track +' • ' : '';
				var album = pl.Album ? ' • '+ pl.Album : '';
				topline = title +'<span>'+ convertHMS( time ) +'</span>';
				bottomline = track + pl.Artist + album;
				playlisttime += time;
			}
			counttotal++;
			classcurrent = ( state !== 'stop' && counttotal === current ) ? 'active' : '';
			cl = ' class="'+ classcurrent + ( classradio ? ' radio' : '' ) +'"';
			cl = ( classcurrent || classradio ) ? cl : '';
			content += '<li id="pl-'+ pl.Id +'"'+ cl +'>'
				+ iconhtml
				+'<i class="fa fa-minus-circle pl-action" title="Remove song from playlist"></i>'
				+'<span class="sn">'+ topline +'</span>'
				+'<span class="bl">'+ bottomline +'</span>'
				+'</li>';
			classcurrent = classradio = '';
		}
		var counthtml = '<a>PLAYLIST</a><span>&ensp;&#8226;&ensp;</span><a>';
		if ( countsong ) {
			if ( countradio ) {
				var totalhtml = '<span>'+ convertHMS( playlisttime ) +'</span>&emsp;<a>'+ countradio +'</a>&ensp; <i class="fa fa-webradio"></i>';
			} else {
				var totalhtml = '<a>'+ convertHMS( playlisttime ) +'</a>';
			}
			counthtml += countsong +'</a>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
		} else {
			counthtml += countradio +'</a>&ensp; <i class="fa fa-webradio"></i>';
		}
		$( '#loader' ).addClass( 'hide' );
		$( '.playlist' ).removeClass( 'hide' );
		$( '#playlist-warning' ).addClass( 'hide' );
		$( '#pl-count' ).html( counthtml );
		
		$( '#playlist-entries' ).html( content +'<p></p>' ).promise().done( function() {
			setPlaylistScroll();
		} );
	}, 'json' );
}

$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var dataCmd = $this.data( 'cmd' );
	if ( $this.hasClass( 'btn-toggle' ) ) {
		if ( GUI.stream === 'radio' ) return;
		
		tempFlag( 'setmode' );
		if ( dataCmd === 'pl-ashuffle-stop' ) $.post( '/db/?cmd=pl-ashuffle-stop' );
		dataCmd = dataCmd +' '+ ( GUI.json[ this.id ] == 1 ? 0 : 1 );
	} else {
		if ( dataCmd === 'play' ) {
			if ( GUI.json.radio ) {
				dataCmd = ( GUI.state === 'play' ) ? 'stop' : 'play';
			} else {
				dataCmd = ( GUI.state === 'play' ) ? 'pause' : 'play';
			}
		}
		if ( dataCmd === 'pause' || dataCmd === 'stop' ) {
			if ( GUI.json.radio ) $( '#currentsong' ).html( '&nbsp;' );
			clearInterval( GUI.currentKnob );
			clearInterval( GUI.countdown );
		} else if ( dataCmd === 'previous' || dataCmd === 'next' ) {
			// enable previous / next while stop
			if ( GUI.json.playlistlength == 1 ) return;
			
			var current = parseInt( GUI.json.song ) + 1;
			var last = parseInt( GUI.json.playlistlength );
			
			if ( GUI.json.random == 1 ) {
				// improve: repeat pattern of mpd random
				// Math.floor( Math.random() * ( max - min + 1 ) ) + min;
				var pos = Math.floor( Math.random() * last );
				// avoid same pos ( no pos-- or pos++ in ternary )
				if ( pos === current - 1 ) pos = ( pos === last - 1 ) ? pos - 1 : pos + 1;
			} else {
				if ( dataCmd === 'previous' ) {
					var pos = current !== 1 ? current - 2 : last - 1;
				} else {
					var pos = current !== last ? current : 0;
				}
			}
			if ( GUI.state !== 'play' ) {
				$( '#pause' ).removeClass( 'btn-primary' );
				$( '#stop' ).addClass( 'btn-primary' );
			}
			dataCmd = 'command_list_begin\nplay '+ pos + ( GUI.state !== 'play' ? '\nstop' : '' ) +'\ncommand_list_end';
			tempFlag( 'prevnext' );
		}
	}
	$.post( 'enhance.php', { mpd: dataCmd } );
} );
// buttons and playlist
function setButton() {
	if ( GUI.json.updating_db ) {
		$( '#open-panel-sx i, #db-home i, #iupdate' ).addClass( 'blink' );
		$( '#iupdate' ).toggleClass( 'hide', GUI.display.bars );
	} else {
		$( '#open-panel-sx i, #db-home i, #iupdate' ).removeClass( 'blink' );
		$( '#iupdate' ).addClass( 'hide' );
	}
	if ( GUI.display.buttons ) {
		$( '#repeat' ).toggleClass( 'btn-primary', GUI.json.repeat === '1' );
		$( '#random' ).toggleClass( 'btn-primary', GUI.json.random === '1' );
		$( '#single' ).toggleClass( 'btn-primary', GUI.json.single === '1' );
	}
	
	if ( GUI.prevnext === 1 ) return; // disable for previous/next while stop
	
	if ( GUI.state === 'stop' ) {
		$( '#stop' ).addClass( 'btn-primary' );
		$( '#play, #pause' ).removeClass( 'btn-primary' );
		if ( $( '#pause' ).hasClass( 'hide' ) ) $( '#play i' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
	} else {
		if ( GUI.state === 'play' ) {
			$( '#play' ).addClass( 'btn-primary' );
			$( '#stop' ).removeClass( 'btn-primary' );
			if ( $( '#pause' ).hasClass( 'hide' ) ) {
				$( '#play i' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
			} else {
				$( '#pause' ).removeClass( 'btn-primary' );
			}
		} else if ( GUI.state === 'pause' ) {
			$( '#stop' ).removeClass( 'btn-primary' );
			if ( $( '#pause' ).hasClass( 'hide' ) ) {
				$( '#play i' ).removeClass( 'fa fa-play' ).addClass( 'fa fa-pause' );
			} else {
				$( '#play' ).removeClass( 'btn-primary' );
				$( '#pause' ).addClass( 'btn-primary' );
			}
		}
	}
}
function scrollText() {
	$( '#divartist, #divsong, #divalbum' ).each( function() {
		var $this = $( this );
		if ( $this.find( 'span' ).width() > Math.floor( window.innerWidth * 0.975 ) ) {
			$this.addClass( 'scroll-left' );
		} else {
			$this.removeClass( 'scroll-left' );
		}
	} );
}
function setPlaybackData() {
	$.post( 'enhancestatus.php', function( status ) {
		// 'gpio off' restarts mpd which makes data briefly unavailable
		if( typeof status !== 'object' ) return;
		
		GUI.activePlayer = status.activePlayer;
		if ( GUI.activePlayer === 'Airplay' ) {
			displayAirPlay();
			return;
		}
		GUI.status = status;
		// song and album before update for song/album change detection
		var previoussong = $( '#currentsong' ).text();
		var previousalbum = $( '#currentalbum' ).text();
		// volume
		$volumeRS.setValue( status.volume );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		$volumetooltip.add( $volumehandle ).removeClass( 'hide' ); // show after 'setValue'
		if ( GUI.display.volume && GUI.display.volumempd ) {
			if ( status.volumemute != 0 ) {
				muteColor( status.volumemute );
			} else {
				unmuteColor();
			}
		}
		
		// set mode buttons
		if ( GUI.setmode ) return;

		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		$( '#time' ).roundSlider( 'setValue', 0 );
		
		// empty queue
		if ( status.playlistlength == 0 ) {
			$( '.playback-controls' ).addClass( 'hide' );
			$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
			$( '#currentsong' ).html( '<i class="fa fa-plus-circle"></i>' );
			$( '#playlist-position span' ).text( 'Add something from Library' );
			$( '#currentartist, #currentalbum, #format-bitrate, #elapsed, #total' ).empty();
			$( '#cover-art' ).css( {
				  'background-image': 'url("assets/img/cover-default-runeaudio.png")'
				, 'border-radius': 0
			} );
			$( '#coverartoverlay' ).addClass( 'hide' );
			return;
		}
		
		GUI.json.radio = ( status.ext === 'radio' ? 1 : 0 );
		setButton();
		$( '.playback-controls' ).removeClass( 'hide' );
		$( '#currentartist' ).html( status.Artist );
		$( '#currentsong' ).html( status.Title );
		$( '#currentalbum' ).html( status.ext !== 'radio' ? status.Album : '<a>'+ status.Album +'</a>' ).promise().done( function() {
			// scroll info text
			scrollText();
		} );
		
		$( '#playlist-position span' ).html( ( Number( status.song ) + 1 ) +'/'+ status.playlistlength );
//		if ( !GUI.json.song ) GUI.json.song = status.song;
		
		var dot0 = '<a id="dot0" style="color:#ffffff"> &#8226; </a>';
		var dot = dot0.replace( ' id="dot0"', '' );
		var ext = ( status.ext !== 'radio' ) ? dot + status.ext : '';
		$( '#format-bitrate' ).html( dot0 + status.sampling + ext );
		if ( !GUI.json.song ) GUI.json.song = status.song;
		
		if ( status.ext === 'radio' ) {
			var radiobg = $( '#cover-art' ).css( 'background-image' );
			var radiourl = $( '#vu' ).val();
			var radiourlstop = $( '#vustop' ).val();
			
			$( '#cover-art' ).css( 'border-radius', '18px' );
			$( '#coverartoverlay' ).removeClass( 'hide' );
			if ( status.state === 'play' ) {
				if ( radiobg !== radiourl ) {
					$( '#cover-art' ).css( 'background-image', radiourl );
				}
			} else {
				if ( radiobg !== radiourlstop ) {
					$( '#cover-art' ).css( 'background-image', radiourlstop );
				}
			}
			$( '#elapsed' ).html( status.state === 'play' ? blinkdot : '' );
			$( '#total' ).empty();
			// show / hide elapsed at total
			if ( !status.radioelapsed ) {
				$( '#total' ).empty();
			} else {
				var elapsed = status.elapsed;
				GUI.countdown = setInterval( function() {
					elapsed++
					mmss = convertHMS( elapsed );
					$( '#total' ).text( mmss ).css( 'color', '#587ca0' );
				}, 1000 );
			}
			return;
		} else {
			if ( status.Album !== previousalbum ) {
				var covercachenum = Math.floor( Math.random() * 1001 );
				$( '#cover-art' ).css( 'background-image', 'url("/coverart/?v=' + covercachenum + '")' );
				$( '#cover-art' ).css( 'border-radius', 0 );
				$( '#coverartoverlay' ).addClass( 'hide' );
			}
		}

		// time
		time = status.Time;
		$( '#total' ).text( convertHMS( time ) );
		// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		if ( $( '#time-knob' ).hasClass( 'hide' ) ) return;
		if ( status.state === 'stop' ) {
			$( '#currentsong' ).css( 'color', '' );
			$( '#elapsed' ).text( $( '#total' ).text() ).css( 'color', '#587ca0' );
			$( '#total' ).empty();
			return;
		} else {
			$( '#elapsed, #total' ).css( 'color', '' );
		}
		
		var elapsed = status.elapsed;
		var position = Math.round( elapsed / time * 1000 );
		$( '#time' ).roundSlider( 'setValue', position );
		$( '#elapsed' ).text( convertHMS( elapsed ) );
		// pause <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		if ( status.error ) {
			$( '#stop' ).addClass( 'btn-primary' );
			$( '#play, #pause' ).removeClass( 'btn-primary' );
			if ( $( '#pause' ).hasClass( 'hide' ) ) $( '#play i' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
			new PNotify( {
				title: 'Error',
				text: status.error,
				icon: 'fa fa-exclamation-circle'
			} );
		}
		if ( status.state === 'pause' ) {
			$( '#currentsong' ).css( 'color', '#587ca0' );
			$( '#elapsed' ).css( 'color', '#0095d8' );
			$( '#total' ).css( 'color', '#e0e7ee' );
			return;
		} else {
			$( '#currentsong' ).css( 'color', '' );
			$( '#elapsed' ).css( 'color', '' );
			$( '#total' ).css( 'color', '' );
		}
//		var localbrowser = ( location.hostname === 'localhost' || location.hostname === '127.0.0.1' ) ? 10 : 1;
//		var step = 1 * localbrowser; // fix: reduce cpu cycle on local browser
		var step = 1;
		
		GUI.currentKnob = setInterval( function() {
			position = position + step;
			if ( position === 1000 ) {
				clearInterval( GUI.currentKnob );
				clearInterval( GUI.countdown );
				$( '#elapsed' ).empty();
			}
			$( '#time' ).roundSlider( 'setValue', position );
		}, time );
		
		GUI.countdown = setInterval( function() {
			elapsed++
			mmss = convertHMS( elapsed );
			$( '#elapsed' ).text( mmss );
		}, 1000 );
	
		// playlist current song ( and lyrics if installed )
		if ( status.Title !== previoussong || status.Album !== previousalbum ) {
			if ( $( '#lyricscontainer' ).length && $( '#lyricscontainer' ).is( ':visible' ) )  getlyrics();
		}
	}, 'json' );
}
function convertHMS( second ) {
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

if ( document.location.hostname === 'localhost' ) $( '.osk-trigger' ).onScreenKeyboard( { 'draggable': true } );

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

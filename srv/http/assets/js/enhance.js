var GUI = { // outside '$( function() {' enable console.log access
	  activePlayer : ''
	, airplay      : {}
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
	, list         : {}
	, libraryhome  : {}
	, noticeUI     : {}
	, playlist     : {}
	, plcurrent    : ''
	, pleditor     : 0
	, plscrolltop  : 0
	, plugin       : ''
	, status       : {}
	, setmode      : 0
	, swipe        : 0
	, timeout      : ''
};
$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// init display data pushstream
$.post( 'enhance.php', { getdisplay: 1 } );

var psOption = {
	  host: window.location.hostname
	, port: window.location.port
	, modes: 'websocket'
};
// notify pushstream
var pushstreamNotify = new PushStream( psOption );
pushstreamNotify.onmessage = renderMSG;
pushstreamNotify.addChannel( 'notify' );
pushstreamNotify.connect();
// display pushstream
var pushstreamDisplay = new PushStream( psOption );
pushstreamDisplay.addChannel( 'display' );
pushstreamDisplay.onmessage = function( data ) {
	GUI.display = data[ 0 ];
	if ( GUI.setmode ) return;
	
	if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
		displayPlayback();
	} else if ( $( '#panel-library' ).hasClass( 'active' ) ) {
		displayLibrary();
	} else {
		displayCommon();
	}
}
pushstreamDisplay.connect();
// library pushstream
var pushstreamLibrary = new PushStream( psOption );
pushstreamLibrary.onmessage = function( data ) {
	GUI.libraryhome = data;
	if ( !GUI.setmode && !GUI.bookmarkedit ) renderLibraryHome();
}
pushstreamLibrary.addChannel( 'library' );
pushstreamLibrary.connect();
// playlist pushstream
var pushstreamPlaylist = new PushStream( psOption );
pushstreamPlaylist.onmessage = function( data ) {
	GUI.playlist = data[ 0 ];
	if ( !GUI.pleditor ) displayPlaylist();
}
pushstreamPlaylist.addChannel( 'playlist' );
pushstreamPlaylist.connect();
// playback pushstream
psOption.reconnectOnChannelUnavailableInterval = 5000;
var pushstreamPlayback = new PushStream( psOption );
pushstreamPlayback.onmessage = function() {
	$( '#loader' ).addClass( 'hide' );
//	if ( status.actPlayer === 'Spotify' || status.actPlayer === 'Airplay' ) GUI.json = status;
	if ( $( '#panel-playback' ).hasClass( 'active' ) ) setPlaybackData();
	// imodedelay fix imode flashing on usb dac switching
	if ( !GUI.imodedelay ) displayPlayback();
}
pushstreamPlayback.onstatuschange = function( code ) {
	if ( code === 2 ) {
		$( '#loader' ).addClass( 'hide' );
		if ( $( '#panel-playback' ).hasClass( 'active' ) ) setPlaybackData();
	} else if ( code === 0 ) {
		$( '#loader' ).removeClass( 'hide' );
	}
};
pushstreamPlayback.addChannel( 'playback' );
pushstreamPlayback.connect();

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
var streams = [ pushstreamNotify, pushstreamLibrary, pushstreamDisplay, pushstreamPlaylist, pushstreamPlayback ];
document.addEventListener( visibilityevent, function() {
	if ( document[ hiddenstate ] ) {
		$( '#elapsed' ).empty();
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		$.each( streams, function( i, stream ) {
			stream.disconnect();
		} );
	} else {
		if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
			setPlaybackData();
			displayPlayback();
		} else if ( $( '#panel-playlist' ).hasClass( 'active' ) && !GUI.pleditor ) {
			setPlaylistScroll();
		}
		$.each( streams, function( i, stream ) {
			stream.connect();
		} );
	}
} );
window.addEventListener( 'orientationchange', function() {
	if ( GUI.dblist || !$( '#pl-editor' ).hasClass( 'hide' ) ) displayIndex();
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
		, text        : notify.text
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

$( '#menu-settings' ).click( function() {
	$( '#settings' ).toggleClass( 'hide' ).css( 'top', $( '#menu-top' ).is( ':hidden' ) ? 0 : '40px' );
} );

function panelSelect( el ) {
	if ( $( '#panel-library' ).hasClass( 'active' ) ) {
		GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ] = $( window ).scrollTop();
		
	} else if ( $( '#panel-playlist' ).hasClass( 'active' ) && GUI.pleditor ) {
		GUI.plscrolltop = $( window ).scrollTop();
	}
	$( '.tab-pane, #menu-bottom li' ).removeClass( 'active' );
	$( '.tab-pane' ).addClass( 'hide' );
	el.removeClass( 'hide' );
	var openid = el[ 0 ].id.replace( 'panel', 'open' );
	el.add( '#'+ openid ).addClass( 'active' );
	if ( !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#db-list' ).css( 'padding-top', '40px' );
	}
}

$( '#currentsong, #playlist-warning' ).on( 'click', 'i', function() {
	$( '#open-library' ).click();
} );
$( '#open-library' ).click( function() {
	if ( $.isEmptyObject( GUI.libraryhome ) ) return;
	
	if ( GUI.bookmarkedit ) {
		GUI.bookmarkedit = 0;
		$.post( 'enhance.php', { library: 1, pushstream: 'library' }, function( data ) {
			GUI.libraryhome = data;
			renderLibraryHome();
		}, 'json' );
		return
	}
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	
	if ( $( this ).hasClass( 'active' ) && GUI.dblist ) {
		GUI.dblist = GUI.dbback = 0;
		GUI.currentpath = GUI.browsemode = GUI.dbbrowsemode = ''
//		GUI.dbscrolltop = {}; // comment to always keep scroll position unless refresh
		GUI.dbbackdata = [];
		
		renderLibraryHome();
		return
	}
	
	panelSelect( $( '#panel-library' ) );
	if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
		renderLibraryHome();
		displayLibrary();
	} else {
		var scrollpos = GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ];
		$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	}
} );
$( '#open-playback' ).click( function() {
	panelSelect( $( '#panel-playback' ) );
	setPlaybackData();
	displayPlayback();
} );
$( '#open-playlist' ).click( function() {
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	$.post( 'enhance.php', { getplaylist: 1 }, 'json' );
//	if ( $( this ).hasClass( 'active' ) && GUI.pleditor ) GUI.pleditor = 0;
//	displayPlaylist();
	panelSelect( $( '#panel-playlist' ) );
} );
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
	var flag = fl || 'setmode';
	var time = ms || 500;
	GUI[ flag ] = 1;
	clearTimeout( GUI.timeout );
	GUI.timeout = setTimeout( function() { GUI[ flag ] = 0 }, time );
}

$( '#panel-playback, #panel-library, #panel-playlist' ).on( 'swipeleft swiperight', function( e ) {
	panelLR( e.type === 'swipeleft' ? 'left' : '' );
	// fix: prevent taphold fire on swipe
	tempFlag( 'swipe', 1000 );
} );

$( '#panel-playback' ).click( function( e ) {
	if ( $( e.target ).is( '.controls, .timemap, .covermap, .volmap' ) ) return;
	
	$( '.controls, #settings' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} ).on( 'taphold', function( e ) {
	if ( GUI.swipe || $( e.target ).parents().hasClass( 'rs-transition' ) ) return;
	
	info( {
		  title        : 'Playback'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysaveplayback">'
				+ nameLabel( 'bars', 'Top-Bottom menu' )
				+ nameLabel( 'time', 'Time' )
				+ nameLabel( 'radioelapsed', 'Webradio elapsed' )
				+ nameLabel( 'coverart', 'Cover art' )
				+ nameLabel( 'volume', 'Volume' )
				+ nameLabel( 'buttons', 'Buttons' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			displayPlayback();
			tempFlag();
			$.post( 'enhance.php', { setdisplay: GUI.display } );
		}
	} );
	// disable by mpd volume
	if ( !GUI.display.volumempd ) setToggleButton( 'volume', '(disabled)' );
	// disable by autohide
	if ( window.innerWidth >= 500 ) return;
	
	if ( window.innerHeight <= 515 ) setToggleButton( 'bars' );
	if ( window.innerHeight <= 320 ) setToggleButton( 'buttons' );
} );

function nameLabel( name, label ) {
	return '<label><input name="'+ name +'" type="checkbox" '+ GUI.display[ name ] +'>&ensp;'+label+'</label><br>';
}
function setToggleButton( name, append ) {
	$( 'input[name="'+ name +'"]' )
		.prop( 'disabled', true )
		.parent().css( 'color', '#7795b4' )
		.append( append ? ' '+ append : ' (auto hide)' );
}
$( '#panel-library' ).on( 'taphold', function() {
	if ( GUI.swipe || GUI.setmode ) return;
	
	info( {
		  title        : 'Libary Home'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysavelibrary">'
				+ nameLabel( 'bars', 'Top-Bottom menu' )
				+ nameLabel( 'sd', 'SD card' )
				+ nameLabel( 'usb', 'USB drives' )
				+ nameLabel( 'nas', 'Network drives' )
				+ nameLabel( 'webradio', 'Webradios' )
				+ nameLabel( 'albums', 'Albums' )
				+ nameLabel( 'artists', 'Artists' )
				+ nameLabel( 'composer', 'Composers' )
				+ nameLabel( 'genre', 'Genres' )
				+ nameLabel( 'dirble', 'Dirble' )
				+ nameLabel( 'jamendo', 'Jamendo' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			$( '#displaysavelibrary input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			displayLibrary();
			tempFlag();
			$.post( 'enhance.php', { setdisplay: GUI.display } );
		}
	} );
} ).on( 'taphold', '.home-block', function( e ) {
	if ( GUI.swipe ) return;
	
	if ( !$( e.target ).parent().hasClass( 'home-bookmark' ) && !$( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	tempFlag();
	$( '.home-bookmark' ).append( '<div class="home-block-remove"><span class="block-remove">&times;</span></div>' );
} ).click( function( e ) {
	if ( $( e.target ).parent().hasClass( 'home-bookmark' ) || $( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	$( '.home-bookmark div.home-block-remove' ).remove();
} );

$( '#home-blocks' ).on( 'click', '.home-block', function( e ) {
	var $this = $( this );
	if ( $( e.target ).is( 'span.block-remove' ) ) {
		$this.parent().remove();
		GUI.bookmarkedit = 1;
		var id = this.id.replace( 'home-bookmark-', '' );
		var name = $this.data( 'path' ).split( '/' ).pop();
		$.post( '/db/?cmd=bookmark', { id: id, name: name } );
	} else if ( $this.data( 'target' ) === 'webradio-add' ) {
		webRadioNew();
	} else {
		if ( GUI.setmode || ( $this[ 0 ].id === 'home-sd' && $('#home-sd span').text() === '( 0 )' ) ) return;
		
		GUI.dblist = 1;
		mutationLibrary.observe( observerLibrary, observerOption );
		var browsemode = $this.data( 'browsemode' );
		GUI.plugin = $this.data( 'plugin' );
		GUI.dbbrowsemode = browsemode ? browsemode : GUI.plugin ? GUI.plugin : 'file';
		getDB( {
			  browsemode : browsemode
			, path       : $this.data( 'path' )
			, plugin     : GUI.plugin
		} );
	}
} );

// playback buttons click go back to home page
$( '#playback-controls' ).click( function() {
	if ( !$( '#panel-playback' ).hasClass( 'active' ) ) $( '#open-playback' ).click();
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
		$( '#random' ).click();
	} else if ( cmd === 'repeat' ) {
		if ( GUI.status.repeat ) {
			if ( GUI.status.single ) {
				$( '#repeat, #single' ).removeClass( 'btn-primary' );
				$( '#irepeat' ).attr( 'class', 'fa hide' );
				$.post( 'enhance.php', { mpc: [ 'repeat 0', 'single 0' ], pushstream: 'playback' } );
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
	if ( e.target.id !== 'menu-settings' ) $( '#settings' ).addClass( 'hide' );
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} );

function getBio( artist ) {
	$( '#loader' ).removeClass( 'hide' );
	$.get( 'enhancebio.php',
		{ artist: artist },
		function( data ) {
			$( '#biocontent' ).html( data ).promise().done( function() {
				$( '#bio' ).scrollTop( 0 );
				bioShow();
			} );
		}
	);
}
function bioShow() {
	$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
	$( '#bio' ).removeClass( 'hide' );
}
$( '#currentartist, #songinfo-open' ).click( function() {
	if ( GUI.status.ext === 'radio' ) return;
	
	if ( $( '#bio legend' ).text() != GUI.status.Artist ) {
		getBio( GUI.status.Artist );
	} else {
		bioShow();
	}
} );
$( '#biocontent' ).delegate( '.biosimilar', 'click', function() {
	getBio( $( this ).find( 'p' ).text() )
} );
$( '#closebio' ).click( function() {
	$( '#bio' ).addClass( 'hide' );
} );
// poweroff
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
$( '#overlay-playsource-open' ).click( function() {
	$( '#overlay-playsource' ).addClass( 'open' );
} );
$( '#overlay-playsource-close' ).click( function() {
	$( '#overlay-playsource' ).removeClass( 'open' );
} );
$( '#overlay-social-open' ).click( function() {
	$( '#overlay-social' ).addClass( 'open' );
	var urlTwitter = 'https://twitter.com/home?status=Listening+to+' + GUI.status.Title.replace( /\s+/g, '+' ) +'+by+'+ GUI.status.Artist.replace( /\s+/g, '+' ) +'+on+%40RuneAudio+http%3A%2F%2Fwww.runeaudio.com%2F+%23nowplaying';
	$( '#urlTwitter' ).attr( 'href', urlTwitter );
} );
$( '#overlay-social-close' ).click( function() {
	$( '#overlay-social' ).removeClass( 'open' );
} );
$( '#playsource-spotify' ).click( function() {
	if ( $( this ).hasClass( 'inactive' ) ) {
		if ( GUI.activePlayer === 'Spotify' ) {
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
	$( '#open-library' ).click();
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
} );
$( '#db-webradio-new' ).click( function() {
	webRadioNew();
} );
$( '#searchbtn' ).click( function() {
	var keyword = $( '#db-search-keyword' ).val();
	if ( !keyword ) return;
	GUI.dblist = 1;
	getDB( {
		  cmd : 'search'
		, arg : keyword
	} );
} );
$( '#db-search-keyword' ).on( 'keypress', function( e ) {
	if ( e.which === 13 ) $( '#searchbtn' ).click();
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
$( '#db-entries' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	var path = $this.data( 'path' );
	// get scroll position for back navigation
	var current = $( '#db-currentpath' ).attr( 'path' );
	GUI.dbscrolltop[ current ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	$( '#db-entries li' ).removeClass( 'active' );
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

$( '#plsave' ).click( function() {
	if ( !GUI.status.playlistlength ) return;
	
	playlistSave();
} );
$( '#pl-manage-clear' ).click( function() {
	if ( !GUI.status.playlistlength ) return;
	
	info( {
		  title   : 'Clear Playlist'
		, message : 'Clear this playlist?'
		, cancel  : 1
		, ok      : function() {
			GUI.status.playlistlength = 0;
			$.post( 'enhance.php', { mpc: 'clear', pushstream: 'playlist' } );
			renderPlaylist();
			setPlaybackBlank();
		}
	} );
} );
$( '#pl-entries' ).on( 'click', 'li', function( e ) {
	var songpos = $( this ).index() + 1;
	if ( !$( e.target ).hasClass( 'pl-action' ) ) {
		$.post( 'enhance.php', { mpc: 'play '+ songpos, pushstream: 'playback' } );
		$( '#pl-entries li' ).removeClass( 'active' );
		$( this ).addClass( 'active' );
		return
	}
	
	GUI.status.playlistlength--;
	if ( !GUI.status.playlistlength ) {
		renderPlaylist();
		return
	}

	var $this = $( this );
	var radio = $this.hasClass( 'radio' );
	var $elcount = radio ? $( '#countradio' ) : $( '#countsong' );
	var count = $elcount.attr( 'count' ) - 1;
	$elcount.attr( 'count', count ).text( count );
	var time = +$( '#pltime' ).attr( 'time' ) - $this.find( '.time' ).attr( 'time' );
	if ( !radio ) $( '#pltime' ).attr( 'time', time ).text( convertHMS( time ) );
	if ( $( '#countradio' ).attr( 'count' ) === '0' ) {
		$( '#pltime' ).css( 'color', '#e0e7ee' );
		$( '#countradio' ).next().remove();
		$( '#countradio' ).remove();
	}
	if ( $this.hasClass( 'active' ) ) $this.next().addClass( 'active' );
	$this.remove();
	tempFlag();
	$.post( 'enhance.php', { mpc: 'del '+ songpos, pushstream: 'playlist' } );
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

$( '#db-entries' ).on( 'click', '.db-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	GUI.dbpath = $thisli.data( 'path' );
	GUI.list.path = GUI.dbpath; // used in contextmenu
	if ( !$thisli.find( '.sn' ).length ) {
		GUI.list.name = $thisli.text() ;
	} else {
		GUI.list.name = $thisli.find( '.sn' ).text();
		GUI.list.url = $thisli.find( '.bl' ).text();
	}
	var $target = $( $this.data( 'target' ) );
	$( '#db-entries li' ).removeClass( 'active' );
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
	GUI.list.li = $thisli; // for contextmenu
	GUI.list.name = plname;
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
function plCommand( cmd ) {
	if ( !GUI.status.playlistlength ) GUI.status.playlistlength = 1; // flag for renderPlayliat()
	$.post( 'enhance.php', { mpc: cmd, pushstream: 'playlist' }, function() {
		if ( !$( '#currentsong' ).text() ) setPlaybackData();
	} );
}
$( '.contextmenu a' ).click( function() {
	var cmd = $( this ).data( 'cmd' );
	GUI.dbcurrent = '';
	switch( cmd ) {
		case 'wradd':
			getDB( { cmd: 'add', path: GUI.list.path } );
			break;
		case 'wraddplay':
			getDB( { cmd: 'addplay', path: GUI.list.path } );
			break;
		case 'wraddreplaceplay':
			getDB( { cmd: 'addreplaceplay', path: GUI.list.path } );
			break;
		case 'wrrename':
			webRadioRename();
			break;
		case 'wrdelete':
			webRadioDelete();
			break;
		// in dirble
		case 'wrsave':
			$.post( '/db/?cmd=addradio', { 'radio[label]': GUI.list.name, 'radio[url]': GUI.list.url } );
			break;
		
		case 'pladd':
			plCommand( 'load "' + GUI.list.name +'"' );
			break;
		case 'plreplace':
			plCommand( [ 'clear', 'load "'+ GUI.list.name +'"' ] );
			break;
		case 'pladdreplaceplay':
			plCommand( [ 'clear', 'load "'+ GUI.list.name + '"', 'play' ] );
			break;
		case 'plrename':
			playlistRename();
			break;
		case 'pldelete':
			playlistDelete();
			break;
		case 'plashuffle':
			$.post( '/db/?cmd=pl-ashuffle', { playlist: GUI.list.name } );
			$( '#random' ).data( 'cmd', 'pl-ashuffle-stop' ).addClass( 'btn-primary' );
			break;
		default:
			if ( $.inArray( cmd, [ 'add', 'addreplace', 'addreplaceplay', 'wradd', 'wraddreplace', 'wraddreplaceplay' ] !== -1 ) ) $( '#playback-controls' ).removeClass( 'hide' );
			if ( cmd === 'bookmark' ) GUI.bookmarkedit = 1;
			$.post( '/db/?cmd='+ cmd, { path: GUI.list.path }, function() {
				if ( !GUI.bookmarkedit ) renderPlaylist();
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
	$.post( 'enhance.php', { bash: '/usr/bin/redis-cli hgetall webradios' }, function( data ) {
		var data = data.split( '\n' );
		var wrname = wrurl = [];
		$.each( data, function( i, val ) {
			i % 2 ? wrname.push( val ) : wrurl.push( val );
		} );
		var nameexist = $.inArray( name, wrname ) !== -1;
		var urlexist = $.inArray( url, wrurl ) !== -1;
		if ( nameexist || urlexist ) {
			info( {
				  icon    : 'warning'
				, title   : 'Add Webradio'
				, message : ( nameexist ? 'Name' : 'URL:' )
							+'<br><white>'+ ( nameexist ? name : url ) +'</white>'
							+'<br>already exists.'
				, ok      : function() {
					webRadioNew( name, url );
				}
			} );
		} else {
			GUI.libraryhome.webradio++;
			tempFlag( 'setmode', 2000 );
			$.post( '/db/?cmd=addradio', {
				  'radio[label]' : name
				, 'radio[url]'   : url
				}, function() {
				setTimeout( function() {
					getDB( { path: 'Webradio' } );
				}, 200 );
			} );
		}
	} );
}
function webRadioRename( name ) {
	info( {
		  icon      : 'edit-circle'
		, title     : 'Rename Webradio'
		, message   : 'Rename:'
					+'<br><white>'+ GUI.list.name +'</white>'
					+'<br>'+ GUI.list.url
		, textlabel : 'To'
		, textvalue : name ? name : GUI.list.name
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			webRadioRenameVerify( $( '#infoTextBox' ).val().trim(), GUI.list.name, GUI.list.url );
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
	if ( $( '#db-entries li[data-path="Webradio/'+ name +'.pls"]' ).length ) {
		info( {
			  icon    : 'warning'
			, title   : 'Rename Webradio'
			, message : '<white>'+ name +'</white> already exists.'
			, ok      : function() {
				webRadioRename( name );
			}
		} );
		return;
	} else {
		$( '#db-entries li.active span.sn').text( name );
		$( '#db-entries li.active span.bl').text( url );
		tempFlag( 'setmode', 2000 );
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
					+'<br><white>'+ GUI.list.name +'</white>'
					+'<br>'+ GUI.list.url
		, cancel  : 1
		, ok      : function() {
			$( '#db-entries li.active').remove();
			GUI.libraryhome.webradio--;
			tempFlag( 'setmode', 2000 );
			$.post( '/db/?cmd=deleteradio', { 'radio[label]' : GUI.list.name +'.pls' } );
		}
	} );
}
function playlistSave( name ) {
	info( {
		  icon      : 'save'
		, title     : 'Save Playlist'
		, message   : 'Save this playlist as:'
		, textlabel : 'Name'
		, textvalue : name || ''
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
	$.post( 'enhance.php', { mpc: 'listplaylists', getresult: 1 }, function( data ) {
		if ( $.inArray( 'playlist: '+ name, data.split( '\n' ) ) ) {
			info( {
				  icon    : 'warning'
				, title   : 'Save Playlist'
				, message : '<white>'+ name +'</white> already exists.'
				, ok      : function() {
					playlistSave( name );
				}
			} );
			return;
		}
		tempFlag();
		$.post( 'enhance.php', { mpc: 'save "'+ name +'"', pushstream: 'playlist' } );
	}, 'text' );
}
function playlistRename( name ) {
	info( {
		  icon      : 'edit-circle'
		, title     : 'Rename Playlist'
		, message   : 'Rename:'
		             +'<br><white>'+ GUI.list.name +'</white>'
		, textlabel : 'To'
		, textvalue : name ? name : GUI.list.name
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			playlistRenameVerify( $( '#infoTextBox' ).val().trim(), GUI.list.name );
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
		return;
	}
	GUI.list.li.find( 'span' ).text( name );
	tempFlag();
	$.post( 'enhance.php', { mpc: [ 'rm "'+ oldname +'"', 'save "'+ name +'"' ], pushstream: 'playlist' } );
}
function playlistDelete() {
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Playlist'
		, message : 'Delete?'
					+'<br><white>'+ GUI.list.name +'</white>'
		, cancel  : 1
		, ok      : function() {
			$( '#pls-count' ).text( numFormat( $( '#pls-count' ).text() - 1 ) );
			GUI.list.li.remove();
			tempFlag();
			$.post( 'enhance.php', { mpc: 'rm "'+ GUI.list.name +'"', pushstream: 'playlist' } );
		}
	} );
}
$( '#pl-home' ).click( function() {
	$( '#open-playlist' ).click();
} );
// playlist click go back to home page
$( '#pl-entries' ).click( function( e ) {
	if ( e.target.nodeName === 'SPAN' ) {
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
		var arrayplL = arraypl.length;
		var content = '';
		arraypl.forEach( function( el ) {
			content += '<li class="pl-folder" data-path="'+ el +'"><i class="fa fa-list-ul pl-icon"></i><i class="fa fa-bars pl-action"></i><span>'+ el +'</span></li>';
		} );
		$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
			GUI.pleditor = 1;
			// fill bottom of list to mave last li movable to top
			$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
			$( '#loader' ).addClass( 'hide' );
			var plcount = arrayplL ? '<bl>&emsp;PLAYLISTS</bl><gr>&emsp;•&ensp;</gr><wh id="pls-count">'+ numFormat( arrayplL ) +'</wh>&ensp;<i class="fa fa-list-ul"></i>' : '';
			$( '#pl-currentpath' ).html( plcount );
			$( '#pl-currentpath, #pl-editor, #pl-index' ).removeClass( 'hide' );
			$( 'html, body' ).scrollTop( GUI.plscrolltop );
			displayIndex();
		} );
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
		}
		tempFlag();
		$.post( 'enhance.php', { mpc: 'move '+ ( e.oldIndex + 1 ) +' '+ ( e.newIndex + 1 ), pushstream: 'playlist' } );
	}
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
$( '#db-level-up' ).click( function() {
	mutationLibrary.observe( observerLibrary, observerOption ); // standard js - must be one on one element
} );

$( '#playsource-mpd' ).click( function() {
	$.post( 'enhance.php', { bash: '/usr/bin/systemctl restart shairport' } );
	$( '#iplayer' ).removeClass( 'fa-airplay' ).addClass( 'hide' );
	$( '#overlay-playsource' ).removeClass( 'open' );
	$( '#playsource-mpd' ).removeClass( 'inactive' );
	$( '#playsource-airplay' ).addClass( 'inactive' );
} );
$( '#db-search-results' ).click( function() {
	$( this ).addClass( 'hide' );
	$( '#db-search-keyword' ).val( '' );
	$( '#db-currentpath' ).css( 'width', '' );
	if ( GUI.currentpath ) {
		$( '#db-level-up' ).removeClass( 'hide' );
		getDB( GUI.dbbackdata.pop() );
		
		$( '#db-entries' ).removeAttr( 'style' );
		mutationLibrary.observe( observerLibrary, observerOption );
	} else {
		renderLibraryHome();
	}
} );

// new knob
function mpdSeek( seekto ) {
	if ( GUI.status.state !== 'stop' ) {
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		$.post( 'enhance.php', { mpc: 'seek '+ seekto, pushstream: 'playback' } );
	} else {
		$.post( 'enhance.php', { mpc: [ 'play', 'seek '+ seekto, 'pause' ], pushstream: 'playback' } );
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
		if ( GUI.status.ext === 'radio' ) {
			$timeRS.setValue( 0 );
		} else {
			mpdSeek( Math.floor( e.value / 1000 * time ) );
		}
	}
	, start       : function () {
		if ( GUI.status.ext === 'radio' ) return;
		
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
	}
	, drag        : function ( e ) { // drag with no transition by default
		if ( GUI.status.ext === 'radio' ) return;
		
		$( '#elapsed' ).text( convertHMS( Math.round( e.value / 1000 * time ) ) );
	}
	, stop        : function( e ) { // on 'stop drag'
		if ( GUI.status.ext === 'radio' ) return;
		
		mpdSeek( Math.round( e.value / 1000 * time ) );
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
		$volumehandle.addClass( 'rs-transition' ).eq( 0 )           // make it rotate with 'rs-transition'
			.rsRotate( - this._handle1.angle );                     // initial rotate
		$( '.rs-transition' ).css( 'transition-property', 'none' ); // disable animation on load
	}
	, change          : function( e ) { // (not fire on 'setValue' ) value after click or 'stop drag'
		$.post( 'enhance.php', { volume: e.value } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
		// value before 'change'
		if ( e.preValue === 0 ) unmuteColor();
		tempFlag( 'setmode', 1000 );
	}
	, start           : function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmuteColor(); // value before 'start drag'
	}
	, drag            : function ( e ) { // drag with no transition by default
		if ( e.value % 2 === 0 ) {
			$.post( 'enhance.php', { mpc: 'volume '+ e.value } );
			$( e.handle.element ).rsRotate( - e.handle.angle );
			GUI.setmode = 1; // cleared by 'change'
		}
	}
	, stop            : function( e ) { // on 'stop drag'
		$.post( 'enhance.php', { volume: e.value } );
	}
} );

$( '#volmute, #volM' ).click( function() {
	var vol = $volumeRS.getValue();
	if ( vol ) {
		$volumeRS.setValue( 0 );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		muteColor( vol )
		GUI.display.volumemute = vol;
	} else {
		$volumeRS.setValue( GUI.display.volumemute );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		unmuteColor()
		GUI.display.volumemute = 0;
	}
	tempFlag();
	$.post( 'enhance.php', { volume: -1 } );
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	if ( ( vol === 0 && ( thisid === 'voldn' ) ) || ( vol === 100 && ( thisid === 'volup' ) ) ) return;

	vol = ( thisid === 'volup' ) ? vol + 1 : vol - 1;
	$.post( 'enhance.php', { volume: vol } );
} );

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
	if ( !$( '#bio' ).hasClass( 'hide' ) ) return;
	
	if ( !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '#db-list, #pl-list' ).css( 'padding', '40px 0' );
		$( '.btnlist-top' ).css( 'top', 0 );
	} else {
		$( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
		$( '#db-list, #pl-list' ).css( 'padding', '' );
		$( '.btnlist-top' ).css( 'top', '40px' );
	}
}
function displayAirPlay() {
	$( '#playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#playlist-position span, #format-bitrate, #total' ).empty();
	$( '#currentartist' ).html( GUI.airplay.currentartist );
	$( '#currentsong' ).html( GUI.airplay.currentsong );
	$( '#currentalbum' ).html( GUI.airplay.currentalbum );
	$( '#elapsed, #total' ).empty();
	var time = new Date().getTime();
	$( '#cover-art' ).css( {
		  'background-image': 'url("assets/img/airplay-cover.jpg?v='+ time +'")'
		, 'border-radius': 0
	} );
	scrollText();
	$( '#menu-top, #menu-bottom' ).toggleClass( 'hide', GUI.display.bars === '' );
	$( '#playback-row' ).removeClass( 'hide' );
	$( '#time-knob' ).toggleClass( 'hide', GUI.display.time === '' );
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
function cssOrder( el, ord ) {
	el.css( { order: ord, '-webkit-order': ord } );
}
function displayPlayback() {
	if ( GUI.activePlayer === 'Airplay' ) {
		displayAirPlay();
		return;
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
			cssOrder( $( '#time-knob' ), 1 );
			cssOrder( $( '#coverart' ), 2 );
			cssOrder( $( '#volume-knob' ), 3 );
			cssOrder( $( '#play-group' ), 4 );
			cssOrder( $( '#share-group' ), 5 );
			cssOrder( $( '#vol-group' ), 6 );
		}
		$( '#playback-row' ).css( 'max-width', '900px' );
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '45%' );
	} else if ( i === 1 ) {
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '60%' );
	}
	if ( GUI.display.radioelapsed !== GUI.display.radioelapsed ) {
		GUI.display.radioelapsed = GUI.display.radioelapsed;
		if ( GUI.status.ext === 'radio' && GUI.status.state === 'play' ) {
			clearInterval( GUI.countdown );
			if ( !GUI.display.radioelapsed ) {
				$( '#total' ).empty();
			} else {
				$.post( 'enhance.php', { mpd: 'status', filter: 'elapsed' }, function( data ) {
					var elapsed = Math.round( data );
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
	}
	if ( GUI.activePlayer !== 'MPD' ) {
		var source = GUI.activePlayer.toLowerCase();
		$( '#iplayer' ).addClass( 'fa-'+ source ).removeClass( 'hide' );
	}
//	setButton();
	displayCommon();
	if ( !GUI.setmode ) $( 'html, body' ).scrollTop( 0 );
}

function displayIndex() {
	setTimeout( function() {
		var wH = window.innerHeight;
		var indexoffset = $( '#menu-top' ).is( ':visible' ) ? 160 : 80;
		var indexline = wH < 500 ? 13 : 27;
		$( '.half' ).toggleClass( 'hide', wH < 500 );
		$index = ( $( '#panel-library' ).hasClass( 'active' ) && GUI.dblist ) ? $( '#db-index' ) : $( '#pl-index' );
		$index.css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
	}, 0 );
}
// library show/hide blocks
function toggleLiHome( name ) {
	$( '#home-'+ name ).parent().toggleClass( 'hide', GUI.display[ name ] === '' );
}
function displayLibrary() {
	// no 'id'
	toggleLiHome( 'nas' );
	toggleLiHome( 'sd' );
	toggleLiHome( 'usb' );
	toggleLiHome( 'webradio' );
	toggleLiHome( 'albums' );
	toggleLiHome( 'artists' );
	toggleLiHome( 'composer' );
	toggleLiHome( 'genre' );
	toggleLiHome( 'dirble' );
	toggleLiHome( 'jamendo' );
	
	displayCommon();
	setTimeout( function() {
		$( 'html, body' ).scrollTop( 0 );
	}, 0 );
}
function displayPlaylist() {
	if ( !GUI.pleditor ) {
		$( '#pl-entries li' ).length ? setPlaylistScroll() : renderPlaylist();
	} else {
		GUI.pleditor = 0;
		if ( $( '#panel-playlist' ).hasClass( 'active' ) ) {
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
function numFormat( num ) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function renderLibraryHome() {
	if ( GUI.bookmarkedit ) return;
//	GUI.dbscrolltop = {}; // comment to always keep scroll positions
	GUI.plugin = '';
	$( '#db-currentpath' ).removeAttr( 'path' ).css( 'width', '' );
	$( '#db-entries' ).empty();
	$( '#db-search-results, #db-index, #db-level-up, #db-webradio-new' ).addClass( 'hide' );
	$( '#db-search-keyword' ).val( '' );
	if ( $( '#db-entries' ).hasClass( 'hide' ) ) return;
	
	$( '#panel-library .btnlist-top, db-entries' ).addClass( 'hide' );
	var status = GUI.libraryhome;
	$( '#db-currentpath span' ).html( '<bl class="title">&emsp;L I B R A R Y<gr>&emsp;•</gr></bl><a id="li-count"><wh>'+ numFormat( status.title ) +'</wh><i class="fa fa-music"></i></a>' );
	$( '#panel-library .btnlist-top, #home-blocks' ).removeClass( 'hide' );
	notMPD = ( status.activeplayer === 'Spotify' || status.activeplayer === 'Airplay' );
	toggleMPD = notMPD ? ' inactive' : '';
	// Set active player
	setPlaybackSource();
	
	var content = '';
	var divOpen = '<div class="col-md-3">';
	// bookmark
	var bookmarks = status.bookmarks;
	if ( bookmarks !== null ) {
		bookmarks.sort( function( a, b ) {
			return stripLeading( a.name ).localeCompare( stripLeading( b.name ), undefined, { numeric: true } );
		} );
		var bookmarkL = bookmarks.length;
		for ( i = 0; i < bookmarkL; i++ ) {
			var bookmark = bookmarks[ i ];
			content += divOpen +'<div id="home-bookmark-'+ bookmark.id +'" class="home-block home-bookmark'+ toggleMPD +'" data-path="'+ bookmark.path +'"><i class="fa fa-bookmark"></i><h4><span>' + bookmark.name +'&ensp;<gr>'+ numFormat( bookmark.count ) +' ♫</gr></span></h4></div></div>';
		}
	}
	// sd
	content += divOpen +'<div id="home-sd" class="home-block'+ toggleMPD +'" data-path="LocalStorage"><i class="fa fa-microsd"></i><h4>SD card<gr>&ensp;'+ numFormat( status.sd ) +' ♫</gr></h4></div></div>';
	// usb
	content += divOpen +'<div id="home-usb" class="home-block'+ toggleMPD +'"'+ ( !status.usb ? ( notMPD ? '' : ' href="/sources/sources/"' ) : ' data-path="USB"' ) +'><i class="fa fa-usbdrive"></i><h4>USB drives<gr>&ensp;'+ status.usb +'</gr></h4></div></div>';
	// nas
	content += divOpen +'<a id="home-nas" class="home-block'+ toggleMPD +'"'+ ( !status.network ? ( notMPD ? '' : ' href="/sources/add/"' ) : ' data-path="NAS"' ) +'><i class="fa fa-network"></i><h4>Network drives<gr>&ensp;'+ status.network +'</gr></h4></a></div>';
	// webradio
	var data = !status.webradio ? ' data-target="webradio-add"' : ' data-path="Webradio"';
	content += divOpen +'<div id="home-webradio" class="home-block'+ toggleMPD +'"'+ data +'><i class="fa fa-webradio"></i><h4>Webradios<gr>&ensp;'+ numFormat( status.webradio ) +'</gr></h4></div></div>';
	// albums
	content += divOpen +'<div id="home-albums" class="home-block'+ toggleMPD +'" data-path="Albums" data-browsemode="album"><i class="fa fa-album"></i><h4>Albums<gr>&ensp;'+ numFormat( status.album ) +'</gr></h4></div></div>';
	// artist
	content += divOpen +'<div id="home-artists" class="home-block'+ toggleMPD +'" data-path="Artists" data-browsemode="artist"><i class="fa fa-artist"></i><h4>Artists<gr>&ensp;'+ numFormat( status.artist ) +'</gr></h4></div></div>';
	// composer
	content += divOpen +'<div id="home-composer" class="home-block'+ toggleMPD +'" data-path="Composer" data-browsemode="composer"><i class="fa fa-composer"></i><h4>Composers<gr>&ensp;'+ numFormat( status.composer ) +'</gr></h4></div></div>';
	// genre
	content += divOpen +'<div id="home-genre" class="home-block'+ toggleMPD +'" data-path="Genres" data-browsemode="genre"><i class="fa fa-genre"></i><h4>Genres<gr>&ensp;'+ numFormat( status.genre ) +'</gr></h4></div></div>';
	// spotify
	if ( status.spotify ) {
		var sw, data = '';
		if ( status.activeplayer !== 'Spotify' ) {
			sw = '-switch';
			data = ' data-plugin="Spotify" data-path="Spotify"';
		}
		content += divOpen +'<div id="home-spotify'+ sw +'" class="home-block"'+ data +'><i class="fa fa-spotify"></i><h4>Spotify</h4></div></div>';
	}
	// dirble
	content += divOpen +'<div id="home-dirble" class="home-block'+ toggleMPD +'" data-plugin="Dirble" data-path="Dirble"><i class="fa fa-dirble"></i><h4>Dirble</h4></div></div>';
	// jamendo
	content += divOpen +'<div id="home-jamendo" class="home-block'+ toggleMPD +'" data-plugin="Jamendo" data-path="Jamendo"><i class="fa fa-jamendo"></i><h4>Jamendo<gr id="home-count-jamendo"></gr></h4></div></div>';

	content += '</div>';
	$( '#home-blocks' ).html( content ).promise().done( function() {
		$( 'html, body' ).scrollTop( 0 );
		$( '.home-bookmark h4' ).each( function() {
			var $this = $( this );
			var html_org = $this.html();
			var html_calc = '<span>'+ html_org +'</span>';
			$this.html( html_calc );
			var width = $this.find( 'span:first' ).width();
			$this.html(html_org);
			if ( width > $this.parent().width() ) $this.addClass( 'scroll-left' );
		} );
	} );
	$( '#loader' ).addClass( 'hide' );
	// hide breadcrumb, index bar, edit bookmark
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
	if ( !GUI.dbback && cmd !== 'search' ) {
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
		
//	$( '#loader' ).removeClass( 'hide' );
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
//			$( '#loader' ).addClass( 'hide' );
			$.post( '/db/?cmd='+ cmd, { path: path, querytype: querytype }, function() {
				if ( $.inArray( cmd, [ 'add', 'addplay', 'addreplaceplay' ] ) !== -1 ) {
					tempFlag();
					renderPlaylist();
				}
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
		content = '<li id="db-'+ ( i + 1 ) +'" data-path="';
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
					if ( inpath !== 'Webradio' ) {
						if ( inputArr.Title ) {
							if ( $( '#db-search-keyword' ).val() ) {
								var bl = inputArr.Artist +' - '+ inputArr.Album;
							} else {
								var bl = inputArr.file.split( '/' ).pop(); // filename
							}
							content += inputArr.file +'" class="db-song"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
							content += '<span class="sn">'+ inputArr.Title +'&ensp;<span class="time">'+ convertHMS( inputArr.Time ) +'</span></span>';
							content += '<span class="bl">'+ bl;
						} else {
							content += inputArr.file +'" class="db-song"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
							content += '<span class="sn">'+ inputArr.file.replace( inpath +'/', '' ) +'&ensp;<span class="time">' + convertHMS( inputArr.Time ) +'</span></span>';
							content += '<span class="bl"> path: '+ inpath;
						}
					} else {
						content += inputArr.playlist +'"><i class="fa fa-bars db-action" data-target="#context-menu-webradio"></i><i class="fa fa-webradio db-icon db-radio"></i>';
						content += '<span class="sn">'+ inputArr.playlist.replace( inpath +'/', '' ).replace( '.'+ inputArr.fileext, '' ) +'</span>';
						content += '<span class="bl">'+ inputArr.url;
					}
					content += '</span></li>';
				} else if ( inputArr.playlist ) {
					if ( inputArr.fileext === 'cue' ) {
						content += inputArr.playlist +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-file-text db-icon"></i>';
						content += '<span class="sn">'+ inputArr.playlist.replace( inpath +'/', '' ) +' <span>[CUE file]</span></span>';
						content += '<span class="bl"> path: '+ inpath +'</span></li>';
					}
				} else {
					content += inputArr.directory +'" class="db-folder"><i class="fa fa-bars db-action"';
					if (inpath !== '' ) {
						content += ' data-target="#context-menu"></i><span><i class="fa fa-folder"></i>'
					} else {
						content += ' data-target="#context-menu-root"></i><i class="fa fa-hdd-o icon-root"></i>';
					}
					content += '<span class="dbpath">'+ inputArr.directory.replace( inpath +'/', '' ) +'</span></li>';
				}
			} else if ( GUI.browsemode === 'album' || GUI.browsemode === 'albumfilter' ) {
				if ( inputArr.file ) {
					content += inputArr.file +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
					content += '<span class="sn">'+ inputArr.Title +'&ensp;<span class="time">'+ convertHMS( inputArr.Time ) +'</span></span>';
					content += '<span class="bl">'+ inputArr.Album +' - '+ inputArr.Artist +'</span></li>';
				} else if ( inputArr.album !== '' ) {
					content += inputArr.album.replace( /\"/g, '&quot;' ) +'" class="db-folder" mode="album"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i>';
					content += '<span><i class="fa fa-album"></i>'+ inputArr.album +'</span></li>';
				}
			} else if ( GUI.browsemode === 'artist' ) {
				if ( inputArr.album ) {
					content += inputArr.album +'" class="db-folder" mode="album"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i>';
					content += '<span><i class="fa fa-album"></i>'+ ( inputArr.album ? inputArr.album : 'Unknown album' ) +'</span></li>';
				} else if ( inputArr.artist !== '' ) {
					content += inputArr.artist +'" class="db-folder" mode="artist"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i>';
					content += '<span><i class="fa fa-artist"></i>'+ inputArr.artist +'</span></li>';
				}
			} else if ( GUI.browsemode === 'composer' ) {
				if ( inputArr.file ) {
					content += inputArr.file +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
					content += '<span class="sn">'+ inputArr.Title +'&ensp;<span class="time">'+ convertHMS( inputArr.Time ) +'</span></span>';
					content += '<span class="bl">'+ inputArr.Artist +' - '+ inputArr.Album +'</span></li>';
				} else if ( inputArr.composer !== '' ) {
					content += inputArr.composer +'" class="db-folder" mode="composer"><i class="fa fa-bars db-action" data-target="#context-menu-composer"></i>';
					content += '<span><i class="fa fa-composer"></i>'+ inputArr.composer +'</span></li>';
				}
			} else if ( GUI.browsemode === 'genre' ) {
				if ( inputArr.artist ) {
					content += inputArr.artist +'" class="db-folder" mode="artist"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i>';
					content += '<span><i class="fa fa-album"></i>'+ ( inputArr.artist ? inputArr.artist : 'Unknown artist' ) +'</span></li>';
				} else if (inputArr.genre !== '' ) {
					content += inputArr.genre +'" class="db-folder" mode="genre" ><i class="fa fa-bars db-action" data-target="#context-menu-genre"></i>';
					content += '<span><i class="fa fa-genre"></i>'+ inputArr.genre +'</span></li>';
				}
			}
			break;
		case 'Spotify':
			if ( querytype === '' ) {
				content += inputArr.index +'" class="db-folder" mode="spotify"><i class="fa fa-bars db-action" data-target="#context-menu-spotify-pl"></i>'
				content += '<span><i class="fa fa-genre"></i>'+ ( inputArr.name ? inputArr.name : 'Favorites' ) +' ( '+ inputArr.tracks +' )</span></li>';
			} else if ( querytype === 'tracks' ) {
				content += inputArr.index +'" data-plid="'+ inpath +'" data-type="spotify-track" mode="spotify"><i class="fa fa-bars db-action" data-target="#context-menu-spotify"></i><i class="fa fa-spotify db-icon"></i>';
				content += '<span class="sn">'+ inputArr.Title +'&ensp;<span class="time">'+ convertHMS( inputArr.duration / 1000 ) +'</span></span>';
				content += ' <span class="bl">'+ inputArr.artist +' - '+ inputArr.album +'</span></li>';
			}
			break;
		case 'Dirble':
			if ( querytype === '' || querytype === 'childs' ) {
				var childClass = ( querytype === 'childs' ) ? ' db-dirble-child' : '';
				content += inputArr.id +'" class="db-folder'+ childClass +'" mode="dirble">'
				content += '<span><i class="fa fa-genre"></i>'+ inputArr.title +'</span></li>';
			} else if ( querytype === 'search' || querytype === 'stations' || querytype === 'childs-stations' ) {
				if ( !inputArr.streams.length ) {
					break; // Filter stations with no streams
				}
				content += inputArr.name +' | '+ inputArr.streams[ 0 ].stream +'" class="db-radio" mode="dirble"><i class="fa fa-bars db-action" data-target="#context-menu-dirble"></i><i class="fa fa-webradio db-icon"></i>';
				content += '<span class="sn">'+ inputArr.name +'&ensp;<span>( '+ inputArr.country +' )</span></span>';
				content += '<span class="bl">'+ ( inputArr.website ? inputArr.website : '-no website-' ) +'</span></li>';
			}
			break;
		case 'Jamendo':
			content += inputArr.stream +'" class="db-folder" mode="jamendo"><img class="jamendo-cover" src="'+ inputArr.image +'" alt=""><i class="fa fa-bars db-action" data-target="#context-menu-file"></i>';
			content += '<span>'+ inputArr.dispname +'</span></div></li>';
			break;
	}
	return content;
}
// strip leading A|An|The|(|[|. (for sorting)
function stripLeading( string ) {
	if ( typeof string === 'number' ) string = string.toString();
	return string.replace( /^A +|^An +|^The +|^\(\s*|^\[\s*|^\.\s*|^\'\s*|^\"\s*/i, '' );
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
	$( '#db-entries, #db-level-up' ).removeClass( 'hide' );
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
			if ( !data.length ) {
				$( '#loader' ).addClass( 'hide' );
				return;
			}
			// browsing
			if ( keyword ) {
			// search results
				var results = ( data.length ) ? data.length : '0';
				$( '#db-level-up, #db-index' ).addClass( 'hide' );
				$( '#db-entries' ).css( 'width', '100%' );
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
	$( '#db-entries' ).html( content +'<p></p>' ).promise().done( function() {
		// fill bottom of list to mave last li movable to top
		$( '#db-entries p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
		displayIndex();
	} );
	
// breadcrumb directory path link
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
			var dot = ( path === mode[ GUI.browsemode ] ) ? '' : '<a><gr> • </gr><span class="white">'+ path +'</span></a>';
		} else {
			var albumartist = $( '#db-entries li:eq( 0 ) span.bl' ).text();
			var dot = albumartist ? '<a><gr> • </gr><span class="white">'+ albumartist +'</span></a>' : '';
		}
		$( '#db-currentpath' ).attr( 'path', path ); // for back navigation
		$( '#db-currentpath span' ).html( icon[ GUI.browsemode ] +' <a data-path="'+ mode[ GUI.browsemode ] +'">'+ name[ GUI.browsemode ] +'</a>'+ dot );
	} else {
		var folder = path.split( '/' );
		var folderPath = '';
		var folderCrumb = icon[ folder[ 0 ] ];
		if ( folderCrumb ) {
			var ilength = folder.length;
			for ( i = 0; i < ilength; i++ ) {
				folderPath += ( i > 0 ? '/' : '' ) + folder[ i ];
				folderCrumb += ' <a data-path="'+ folderPath +'">'+ ( i > 0 ? '<w> / </w>' : '' ) + ( name[ folder[ i ] ] ? name[ folder[ i ] ] : folder[ i ] ) +'</a>';
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
	if ( $( '#db-entries li:eq( 0 )' ).hasClass( 'db-song' ) ) {
		$( '#db-index' ).addClass( 'hide' );
		$( '#db-entries' ).css( 'width', '100%' );
	} else {
		$( '#db-index' ).removeClass( 'hide' );
		$( '#db-entries' ).css( 'width', '' );
	}
}
function setPlaylistScroll() {
	var  wH = window.innerHeight;
	$( '#pl-entries p' ).css( 'min-height', wH - 140 +'px' );
	$( '#pl-entries li' ).removeClass( 'active' );
	var $liactive = $( '#pl-entries li' ).eq( GUI.status.Pos );
	if ( !$liactive.length ) {
		$liactive = $( '#pl-entries li' ).eq( 0 ).addClass( 'active' );
		return;
	}
	
	$liactive.addClass( 'active' );
	if ( GUI.setmode ) return;
	
	setTimeout( function() {
		var scrollpos = $liactive.offset().top - $( '#pl-entries' ).offset().top - ( 49 * 3 );
		$( 'html, body' ).scrollTop( scrollpos );
	}, 0 );
}
function renderPlaylist() {
	$( '#pl-filter' ).val( '' );
	$( '#pl-filter-results' ).empty();
	$( '#pl-currentpath, #pl-editor, #pl-index' ).addClass( 'hide' );
	
	if ( !GUI.status.playlistlength ) {
		$( '#pl-count' ).html( '<bl class="title">&emsp;P L A Y L I S T</bl>' );
		$( '#pl-entries' ).empty();
		$( '.playlist' ).removeClass( 'hide' );
		var barhide = !GUI.display.bars || window.innerWidth < 499 || window.innerHeight < 515;
		$( '#playlist-warning' ).css( 'margin-top', barhide ? '27px' : '67px' );
		return;
	}
	
	var current = GUI.status.song + 1;
	var content = bottomline = classradio = hidetotal = '';
	var id = totaltime = pltime = countsong = countradio = i = 0;
	var ilength = GUI.playlist.length;
	GUI.status.playlistlength = ilength;
	for ( i = 0; i < ilength; i++ ) {
		var pl = GUI.playlist[ i ];
		if ( pl.file.slice( 0, 4 ) === 'http' ) {
			var iconhtml = '<i class="fa fa-webradio pl-icon"></i>';
			classradio = 1;
			countradio++
			topline = pl.Title;
			bottomline = pl.file;
		} else {
			var iconhtml = '<i class="fa fa-music pl-icon"></i>';
			time = parseInt( pl.Time );
			var title = pl.Title ? pl.Title : pl.file.split( '/' ).pop();
			var track = pl.Track ? '#'+ pl.Track +' • ' : '';
			var album = pl.Album ? ' • '+ pl.Album : '';
			topline = title +'&ensp;<span class="time" time="'+ time +'">'+ convertHMS( time ) +'</span>';
			bottomline = track + pl.Artist + album;
			pltime += time;
		}
		content += '<li id="pl-'+ i +'"'+ ( classradio ? ' class="radio"' : '' ) +'>'
			+ iconhtml
			+'<i class="fa fa-minus-circle pl-action"></i>'
			+'<span class="sn">'+ topline +'</span>'
			+'<span class="bl">'+ bottomline +'</span>'
			+'</li>';
	}
	var counthtml = '<bl class="title">&emsp;P L A Y L I S T<gr>&emsp;•</gr></bl>';
	var countsong = ilength - countradio;
	var countradiohtml = '<wh id="countradio" count="'+ countradio +'">'+ countradio +'</wh>&ensp;<i class="fa fa-webradio"></i>';
	if ( countsong ) {
		var pltimehtml = ' id="pltime" time="'+ pltime +'">'+ convertHMS( pltime );
		var totalhtml = countradio ? '<gr'+ pltimehtml +'</gr>&ensp;'+ countradiohtml : '<wh'+ pltimehtml +'</wh>';
		counthtml += '<wh id="countsong" count="'+ countsong +'">'+ numFormat( countsong ) +'</wh>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
	} else {
		counthtml += countradiohtml;
	}
	$( '#loader' ).addClass( 'hide' );
	$( '.playlist' ).removeClass( 'hide' );
	$( '#playlist-warning' ).addClass( 'hide' );
	$( '#pl-count' ).html( counthtml );
	
	$( '#pl-entries' ).html( content +'<p></p>' ).promise().done( function() {
		setPlaylistScroll();
	} );
}

$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var cmd = $this.data( 'cmd' );
	var id = this.id;
	if ( $this.hasClass( 'btn-toggle' ) ) {
		if ( GUI.status.ext === 'radio' ) return;
		
		if ( cmd === 'pl-ashuffle-stop' ) {
			$.post( '/db/?cmd=pl-ashuffle-stop' );
			return;
		}
		var onoff = GUI.status[ cmd ] ? 0 : 1;
		GUI.status[ cmd ] = onoff;
		$this.toggleClass( 'btn-primary' ); // make button change immediate - not wait for pushstream
		setImode();
		cmd = cmd +' '+ onoff;
		tempFlag();
	} else {
		if ( GUI.display.bars && id !== 'previous' && id !== 'next' ) {
			$( '#playback-controls .btn' ).removeClass( 'btn-primary' );
			$( '#'+ id ).addClass( 'btn-primary' );
		}
		if ( cmd === 'pause' || cmd === 'stop' ) {
			clearInterval( GUI.currentKnob );
			clearInterval( GUI.countdown );
			if ( GUI.status.ext === 'radio' ) {
				cmd = 'stop';
				$( '#currentsong' ).empty();
			}
		} else if ( cmd === 'previous' || cmd === 'next' ) {
			// enable previous / next while stop
			if ( GUI.status.playlistlength === 1 ) return;
			
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
			cmd = GUI.status.state === 'play' ? 'play '+ pos : [ 'play '+ pos, 'stop' ];
		}
	}
	$.post( 'enhance.php', { mpc: cmd, pushstream: 'playback' } );
} );
function setImode() {
	if ( GUI.display.buttons && $( '#play-group' ).is( ':visible' ) ) {
		$( '#repeat' ).toggleClass( 'btn-primary', GUI.status.repeat === 1 );
		$( '#random' ).toggleClass( 'btn-primary', GUI.status.random === 1 );
		$( '#single' ).toggleClass( 'btn-primary', GUI.status.single === 1 );
		$( '#irandom, #irepeat' ).addClass( 'hide' );
	} else {
		if ( GUI.display.time ) {
			$( '#irandom' ).toggleClass( 'hide', GUI.status.random === 0 );
			if ( GUI.status.repeat ) {
				$( '#irepeat' ).attr( 'class', ( GUI.status.single ? 'fa fa-repeat-single' : 'fa fa-repeat' ) );
			} else {
				$( '#irepeat' ).attr( 'class', 'fa hide' );
			}
		}
	}
}
function setButton() {
	$( '#playback-controls' ).toggleClass( 'hide', GUI.status.playlistlength === 0 );
	$( '#pause' ).toggleClass( 'hide', GUI.display.pause === '' );
	var state = GUI.status.state;
	
	if ( state === 'stop' ) {
		$( '#stop' ).addClass( 'btn-primary' );
		$( '#play, #pause' ).removeClass( 'btn-primary' );
	} else if ( state === 'play' ) {
		$( '#stop, #pause' ).removeClass( 'btn-primary' );
		$( '#play' ).addClass( 'btn-primary' );
	} else if ( state === 'pause' ) {
		$( '#stop, #play' ).removeClass( 'btn-primary' );
		$( '#pause' ).addClass( 'btn-primary' );
	}
	setImode();
	if ( GUI.status.updating_db ) {
		$( '#open-library i, #db-home i, #iupdate' ).addClass( 'blink' );
		$( '#iupdate' ).toggleClass( 'hide', GUI.display.bars !== '' );
	} else {
		$( '#open-library i, #db-home i, #iupdate' ).removeClass( 'blink' );
		$( '#iupdate' ).addClass( 'hide' );
	}
	if ( GUI.display.update ) {
		if ( GUI.display.bars ) {
			$( '#menu-settings' ).append( '<span id="badge">'+ GUI.display.update +'</span>' );
			$( '#iaddons' ).addClass( 'hide' );
		} else {
			$( '#iaddons' ).removeClass( 'hide' );
		}
	} else {
		$( '#badge' ).remove();
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

GUI.timeout = setTimeout( function() { // in case too long to get coverart
	$( '#starter' ).remove();
}, 3000 );
function setOneload() {
	clearTimeout( GUI.timeout );
	$( '#starter' ).remove();
	$( '.rs-animation .rs-transition' ).css( 'transition-property', '' ); // restore animation after load
	$.post( 'enhance.php', { library: 1 }, function( data ) {
		GUI.libraryhome = data;
	}, 'json' );
}
function setPlaybackBlank() {
	$( '#playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#currentsong' ).html( '<i class="fa fa-plus-circle"></i>' );
	$( '#playlist-position span' ).text( 'Add something from Library' );
	$( '#currentartist, #currentalbum, #format-bitrate, #elapsed, #total' ).empty();
	$( '#cover-art' )
		.attr( 'src', 'assets/img/cover-default-runeaudio.png' )
		.css( 'border-radius', 0 )
		.one( 'load', setOneload );
	$( '#coverartoverlay' ).addClass( 'hide' );
}
function setPlaybackData() {
	if ( GUI.setmode ) return;
	
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
		if ( GUI.display.volume && GUI.display.volumempd ) {
			if ( GUI.display.volumemute != 0 ) {
				muteColor( GUI.display.volumemute );
			} else {
				unmuteColor();
			}
		}
		
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		$( '#time' ).roundSlider( 'setValue', 0 );
		
		setButton();
		// empty queue
		if ( !status.playlistlength ) {
			setPlaybackBlank();
			return;
		}
		
		$( '#playback-controls' ).removeClass( 'hide' );
		$( '#currentartist' ).html( status.Artist );
		$( '#currentsong' ).html( status.Title );
		$( '#currentalbum' ).html( status.ext !== 'radio' ? status.Album : '<a>'+ status.Album +'</a>' ).promise().done( function() {
			// scroll info text
			scrollText();
		} );
		
		$( '#playlist-position span' ).html( ( Number( status.song ) + 1 ) +'/'+ status.playlistlength );
		
		var dot0 = '<a id="dot0" style="color:#ffffff"> &#8226; </a>';
		var dot = dot0.replace( ' id="dot0"', '' );
		var ext = ( status.ext !== 'radio' ) ? dot + status.ext : '';
		$( '#format-bitrate' ).html( dot0 + status.sampling + ext );
		
		if ( status.ext !== 'radio' ) {
			if ( status.Album !== previousalbum ) {
				$( '#coverartoverlay' ).addClass( 'hide' );
				$( '#cover-art' )
					.attr( 'src', '/enhancecoverart/?v=' + Math.floor( Math.random() * 1001 ) )
					.css( 'border-radius', 0 )
					.one( 'load', setOneload );
			}
		} else {
			var radiosrc = $( '#cover-art' ).attr( 'src' );
			var vu = $( '#vu' ).val();
			var vustop = $( '#vustop' ).val();
			if ( status.state === 'play' ) {
				if ( radiosrc !== vu ) $( '#cover-art' ).attr( 'src', vu );
			} else {
				if ( radiosrc !== vustop ) $( '#cover-art' ).attr( 'src', vustop );
			}
			$( '#cover-art' )
				.css( 'border-radius', '18px' )
				.one( 'load', setOneload );
			$( '#coverartoverlay' ).removeClass( 'hide' );
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
			if ( $( '#panel-playlist' ).hasClass( 'active' ) && !GUI.pleditor ) setPlaylistScroll();
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

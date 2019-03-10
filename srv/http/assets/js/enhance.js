var GUI = {
	  activePlayer : ''
	, airplay      : {}
	, artistalbum  : ''
	, bookmarkedit : 0
	, browsemode   : ''
	, cvscrolltop  : 0
	, currentpage  : 'playback'
	, currentpath  : ''
	, dbback       : 0
	, dbbackdata   : []
	, dbbrowsemode : ''
	, dblist       : 0
	, dbscrolltop  : {}
	, debounce     : ''
	, display      : {}
	, imodedelay   : 0
	, list         : {}
	, library      : 0
	, libraryhome  : {}
	, local        : 0
	, localhost    : ( location.hostname === 'localhost' || location.hostname === '127.0.0.1' )
	, lsplaylists  : []
	, playback     : 1
	, playlist     : 0
	, pleditor     : 0
	, pllist     : {}
	, plscrolltop  : 0
	, plugin       : ''
	, scale        : 1
	, screenS      : ( window.innerHeight < 590 || window.innerWidth < 500 )
	, scrollspeed  : 80 // pixel/s
	, status       : {}
	, debounce      : ''
	, debouncems    : 300
};
PNotify.prototype.options.delay = 3000;
PNotify.prototype.options.styling = 'fontawesome';
PNotify.prototype.options.icon = 'fa fa-check';
PNotify.prototype.options.stack = {
	  dir1      : 'up'    // stack up
	, dir2      : 'right' // shift right when fill height
	, firstpos1 : 60      // top offset from border H
	, firstpos2 : 0       // left offset from border V
	, spacing1  : 10      // space between each
	, spacing2  : 10      // space between column( or row if dir1: right/left )
}
var A2Z = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split( '' );
var cssnotify = 
	 '<style id="cssnotify">'
		+'.ui-pnotify { bottom: 20px; }'
		+'.pnotify_custom { top: 20px !important; }'
	+'</style>';
var csscontexticon = 
	 '<style id="csscontexticon">'
		+'.db-action, .pl-action { display: block }'
		+'.duration-right { right: 60px }'
	+'</style>';
var hash = Date.now();
var coverrune = '/assets/img/cover.'+ hash +'.svg';
var vustop = '/assets/img/vustop.'+ hash +'.gif';
if ( GUI.localhost ) {
	var vu = '/assets/img/vustop.'+ hash +'.gif';
	var blinkdot = '<a>·</a>&ensp;<a>·</a>&ensp;<a>·</a>';
} else {
	var vu = '/assets/img/vu.'+ hash +'.gif';
	var blinkdot = '<a class="dot">·</a>&ensp;<a class="dot dot2">·</a>&ensp;<a class="dot dot3">·</a>';
}
// fix - desktop coverart browsing with visible scrollbar
if ( navigator.userAgent.indexOf( 'mobi' ) === -1 ) {
	$( 'head' ).append( 
		 '<style>'
			+'@media(max-width: 2000px) { .coverart { width: calc( ( 100% - 38px ) * 0.1 ) } }'
			+'@media(max-width: 1800px) { .coverart { width: calc( ( 100% - 38px ) * 0.111111111 ) } }'
			+'@media(max-width: 1600px) { .coverart { width: calc( ( 100% - 38px ) * 0.142857143 ) } }'
			+'@media(max-width: 1200px) { .coverart { width: calc( ( 100% - 38px ) * 0.166666667 ) } }'
			+'@media(max-width: 1000px) { .coverart { width: calc( ( 100% - 38px ) * 0.2 ) } }'
			+'@media(max-width: 800px)  { .coverart { width: calc( ( 100% - 38px ) * 0.25 ) } }'
			+'@media(max-width: 600px)  { .coverart { width: calc( ( 100% - 38px ) * 0.333333333 ) } }'
			+'@media(max-width: 400px)  { .coverart { width: calc( ( 100% - 38px ) * 0.5 ) } }'
		+'</style>'
		);
}
// fix - midori glossy
if ( navigator.userAgent.indexOf( 'Midori' ) !== -1 ) {
	$( 'head' ).append( 
		 '<style>'
			+'.rs-outer:after { background: radial-gradient(200% 100% at 75% -50% ,hsla(0,0%,100%,.15) 50%,hsla(0,0%,100%,0) 50%) }'
			+'#repeat, #overlay-social-open, #voldn { background: radial-gradient(250% 90% at 85% -80% ,hsla(0,0%,100%,.3) 50%,hsla(0,0%,100%,0) 53%) }'
			+'#random, #volmute { background: linear-gradient(to bottom, hsla(0,0%,100%,.3) 0%, hsla(0,0%,100%,.3) 45%, rgba(0,0,0,0) 56%,rgba(0,0,0,0) 100%) }'
			+'#single, #bio-open, #volup { background: radial-gradient(500% 90% at 20% -205% ,hsla(0,0%,100%,.3) 50%,hsla(0,0%,100%,0) 51.5%) }'
			+'#repeat, #overlay-social-open, #voldn, #random, #volmute, #single, #bio-open, #volup { background-color: #34495e }'
			+'#play-group, #share-group, #vol-group { margin-top: 20px }'
		+'</style>'
		);
}
// get display, status, library
$.post( 'enhance.php', { getdisplay: 1, data: 1 }, function( data ) {
	data.order = data.order ? data.order.split( ',' ) : '';
	GUI.display = data;
	$.event.special.tap.emitTapOnTaphold = false; // suppress tap on taphold
	$.event.special.swipe.horizontalDistanceThreshold = 80; // pixel to swipe
	$.event.special.tap.tapholdThreshold = 1000;
	setSwipe();
	cssContextIcon();
	$.post( 'enhancestatus.php', function( status ) {
		GUI.status = status;
		renderPlayback();
		displayPlayback();
		setButton();
	}, 'json' );
}, 'json' );

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// COMMON /////////////////////////////////////////////////////////////////////////////////////
$( '#menu-settings, #badge' ).click( function() {
	$( '#settings' )
		.toggleClass( 'hide' )
		.css( 'top', ( GUI.bars ? '40px' : 0 ) );
} );
var chklibrary = {
	  sd             : '<i class="fa fa-microsd"></i>SD_'
	, usb            : '<i class="fa fa-usbdrive"></i>USB'
	, nas            : '<i class="fa fa-network"></i>Network_'
	, webradio       : '<i class="fa fa-webradio"></i>Webradio'
	, album          : '<i class="fa fa-album"></i>Album_'
	, artist         : '<i class="fa fa-artist"></i>Artist'
	, composer       : '<i class="fa fa-composer"></i>Composer_'
	, albumartist    : '<i class="fa fa-albumartist"></i>Album artist'
	, genre          : '<i class="fa fa-genre"></i>Genre_'
	, dirble         : '<i class="fa fa-dirble"></i>Dirble'
	, jamendo        : '<i class="fa fa-jamendo"></i>Jamendo_'
	, contexticon    : '<i class="fa fa-bars"></i>Context icon'
	, count          : '<gr>text</gr> Count_'
	, label          : '<gr>text</gr> Label'
	, coverfile      : 'Cover art <gr>in album/folder</gr>'
	, plclear        : 'Confirmation <gr>on clear Playlist</gr>'
	, playbackswitch : 'Open Playback <gr>on</gr> <i class="fa fa-play-plus"></i>Add <gr>►</gr> Play'
	, tapaddplay     : 'Single tap song <gr>=</gr> <i class="fa fa-play-plus"></i>Add <gr>►</gr> Play'
	, thumbbyartist  : '<i class="fa fa-coverart"></i>Sort thumbnails by artist'
}
$( '#displaylibrary' ).click( function() {
	var coverfile = GUI.display.coverfile;
	var thumbbyartist = GUI.display.thumbbyartist;
	info( {
		  icon     : 'library'
		, title    : 'Libary Home Items'
		, message  : 'Select items to show:'
		, checkbox : '<form id="displaysavelibrary">'+ displayCheckbox( chklibrary ) +'</form>'
		, cancel   : 1
		, ok       : function () {
			$( '#displaysavelibrary input' ).each( function() {
				var checked = this.checked;
				GUI.display[ this.name ] = checked ? 'checked' : '';
			} );
			cssContextIcon();
			$.post( 'enhance.php', { setdisplay: GUI.display }, function() {
				if ( GUI.display.thumbbyartist !== thumbbyartist ) location.reload();
				
				if ( !GUI.library ) $( '#tab-library' ).click();
			} );
		}
	} );
} );
var chkplayback = {
	  bars         : 'Top-Bottom bars'
	, barsauto     : 'Bars on small screen'
	, time         : 'Time'
	, radioelapsed : 'Webradio elapsed'
	, coverart     : 'Cover art'
	, coverlarge   : 'Large Cover art'
	, volume       : 'Volume'
	, buttons      : 'Buttons'
	, debug        : '<gr>menu</gr> Debug'
	, dev          : '<gr>menu</gr> Development'
}
$( '#displayplayback' ).click( function() {
	info( {
		  icon     : 'play-circle'
		, title    : 'Playback Items'
		, message  : 'Select items to show:'
		, checkbox : '<form id="displaysaveplayback">'+ displayCheckbox( chkplayback ) +'</form>'
		, cancel   : 1
		, ok       : function () {
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			$.post( 'enhance.php', { setdisplay: GUI.display }, function() {
				displayPlayback();
				$( '#swipebar, .page' ).off( 'swipeleft swiperight' );
				setSwipe();
				cssNotify();
			} );
			if ( !GUI.playback ) $( '#tab-playback' ).click();
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
	$( '#db-search-close span' ).empty();
	if ( GUI.library ) {
		$( '#divcoverarts' ).addClass( 'hide' );
		$( '#home-blocks' ).removeClass( 'hide' );
	}
	if ( GUI.library && GUI.bookmarkedit ) {
		GUI.bookmarkedit = 0;
		renderLibrary();
	} else if ( GUI.library && GUI.dblist ) {
		GUI.dblist = GUI.dbback = 0;
		GUI.currentpath = GUI.browsemode = GUI.dbbrowsemode = ''
		GUI.dbbackdata = [];
		renderLibrary();
	} else if ( GUI.status.activePlayer === 'Airplay' ) {
		$( '#playsource' ).addClass( 'open' );
	} else {
		switchPage( 'library' );
	}
} );
$( '#tab-playback' ).click( function() {
	getPlaybackStatus();
	switchPage( 'playback' );
} )
$( '#tab-playlist' ).click( function() {
	if ( GUI.playlist && GUI.pleditor ) GUI.pleditor = 0;
	if ( GUI.status.activePlayer === 'Airplay' ) {
		$( '#playsource' ).addClass( 'open' );
		return
	}
	
	switchPage( 'playlist' );
	if ( GUI.pleditor ) return
	
	$.post( 'enhance.php', { getplaylist: 1 }, function( data ) {
		GUI.lsplaylists = data.lsplaylists || [];
		GUI.pllist = data.playlist;
		renderPlaylist();
	}, 'json' );
} );
$( '#swipebar' ).tap( function( e ) {
	if ( !GUI.swipe && e.target.id !== 'swipeL' && e.target.id !== 'swipeR' ) $( '#menu-settings' ).click();
} ).taphold( function() {
	if ( GUI.swipe ) return
	
	location.reload();
} );
$( '#swipeL' ).click( function() {
	var page = GUI.playback ? 'library' : ( GUI.library ? 'playlist' : 'playback' );
	$( '#tab-'+ page ).click();
} );
$( '#swipeR' ).click( function() {
	var page = GUI.playback ? 'playlist' : ( GUI.library ? 'playback' : 'library' );
	$( '#tab-'+ page ).click();
} );
$( '#page-playback' ).click( function( e ) {
	if ( $( e.target ).is( '.controls, .timemap, .covermap, .volmap' ) ) return
	
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
	$( '#swipebar' ).addClass( 'transparent' );
} );
$( '#page-library' ).click( function( e ) {
	var $target = $( e.target );
	if ( GUI.bookmarkedit
		&& !$target.closest( '.home-bookmark' ).length
		&& !$target.closest( '.coverart' ).length
	) {
		GUI.bookmarkedit = 0;
		$( '.home-block-edit, .home-block-remove, .coverart-remove' ).remove();
		$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', '' );
		$( '.coverart img' ).css( 'opacity', '' );
	}} );
$( '#page-library, #page-playback, #page-playlist' ).click( function( e ) {
	if ( [ 'coverTR', 'timeTR' ].indexOf( e.target.id ) === -1 ) $( '#settings' ).addClass( 'hide' );
} );
$( '#menu-top, #menu-bottom, #settings' ).click( function( e ) {
	if ( e.target.id !== 'menu-settings' && e.target.id !== 'badge' ) $( '#settings' ).addClass( 'hide' );
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
	$( '#swipebar' ).addClass( 'transparent' );
} );
$( '#menu-bottom' ).taphold( function() {
	location.reload();
} );
// PLAYBACK /////////////////////////////////////////////////////////////////////////////////////
$( '#song, #playlist-warning' ).on( 'click', 'i', function() {
	$( '#tab-library' ).click();
} );
$( '#artist, #bio-open' ).click( function() {
	if ( GUI.status.ext === 'radio' ) return
	
	if ( $( '#bio legend' ).text() != GUI.status.Artist ) {
		getBio( GUI.status.Artist );
	} else {
		$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
		$( '#bio' ).removeClass( 'hide' );
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
		$( e.handle.element ).rsRotate( - e.handle.angle );
		// value before 'change'
		if ( e.preValue === 0 ) unmuteColor();
		if ( GUI.local ) return
		
		GUI.local = 1;
		setTimeout( function() { GUI.local = 0 }, 500 );
		$.post( 'enhance.php', { volume: e.value } );
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
	$.post( 'enhance.php', { volume: 'setmute' } );
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	if ( ( vol === 0 && ( thisid === 'voldn' ) ) || ( vol === 100 && ( thisid === 'volup' ) ) ) return

	vol = ( thisid === 'volup' ) ? vol + 1 : vol - 1;
	$volumeRS.setValue( vol );
	$.post( 'enhance.php', { volume: vol } );
} );
$( '#coverTL' ).click( function() {
	if ( !$( '#controls-cover' ).hasClass( 'hide' ) ) {
		$( '.controls' ).addClass( 'hide' );
		$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
		$( '#swipebar' ).toggleClass( 'transparent' );
	}
	$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
		$.each( status, function( key, value ) {
			GUI.status[ key ] = value;
		} );
		if ( GUI.status.ext === 'radio' && GUI.status.state === 'stop' ) GUI.status.Title = '';
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
//	, coverTL : ''
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
		if ( !GUI.bars ) $( '#swipebar' ).toggleClass( 'transparent' );
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
		if ( GUI.status.state === 'play' ) {
			GUI.status.ext === 'radio' ? $( '#stop' ).click() : $( '#pause' ).click();
		} else {
			$( '#play' ).click();
		}
	} else {
		$( '#'+ cmd ).click();
	}
} );
$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var cmd = this.id;
	if ( $this.hasClass( 'btn-toggle' ) ) {
		if ( cmd === 'random' && $this.hasClass( 'ashuffle' ) ) {
			$.post( 'enhance.php', { bash: '/usr/bin/killall ashuffle &' } );
			$this.removeClass( 'btn-primary ashuffle' );
			return
		}
		
		var onoff = GUI.status[ cmd ] ? 0 : 1;
		GUI.status[ cmd ] = onoff;
		command = 'mpc '+ cmd +' '+ onoff;
	} else {
		if ( GUI.status.ext === 'radio' && cmd === 'pause' ) cmd = 'stop';
		if ( GUI.bars ) {
			$( '#playback-controls .btn-cmd' ).removeClass( 'btn-primary' );
			$this.addClass( 'btn-primary' );
		}
		if ( cmd === 'stop' ) {
			command = 'mpc stop';
			$( '#pl-entries .elapsed' ).empty();
		} else if ( cmd === 'previous' || cmd === 'next' ) {
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
			pos = pos || 1;
			command = GUI.status.state === 'play' ? 'mpc play '+ pos : [ 'mpc play '+ pos, 'mpc stop' ];
			if ( GUI.status.ext === 'radio' ) $( '#cover-art' ).attr( 'src', vustop )
		} else {
			command = ( GUI.status.ext === 'radio' && GUI.status.state === 'play' ) ? 'mpc stop' : 'mpc toggle';
		}
	}
	$.post( 'enhance.php', { mpc: command } );
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
	var currentpath =  $( '#db-currentpath' ).find( '.lipath' ).text();
	GUI.dbscrolltop[ currentpath ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	
	var path2mode = {
		  Album       : 'album'
		, Artist      : 'artist'
		, AlbumArtist : 'albumartist'
		, Composer    : 'composer'
		, Genre       : 'genre'
		, Dirble      : 'Dirble'
	}
	getData( { browsemode: path2mode[ path ], path: path } );
} );
$( '#db-webradio-new' ).click( function() {
	webRadioNew();
} );
$( '#db-searchbtn' ).click( function() {
	$( '#db-currentpath span, #db-back, #db-searchbtn' ).addClass( 'hide' );
	$( '#db-search-close, #db-search, #dbsearchbtn' ).removeClass( 'hide' );
	$( '#db-currentpath' ).css( 'max-width', '40px' );
	$( '#db-search-keyword' ).focus();
} );
$( '#dbsearchbtn' ).click( function() {
	var keyword = $( '#db-search-keyword' ).val();
	if ( !keyword ) {
		$( '#db-search-close' ).click();
	} else {
		GUI.dblist = 1;
		getData( {
			  cmd : 'search'
			, arg : keyword
		} );
	}
} );
$( '#db-search-close' ).click( function() {
	GUI.keyword = '';
	$( '#db-search-close, #db-search, #dbsearchbtn' ).addClass( 'hide' );
	$( '#db-currentpath span, #db-searchbtn' ).removeClass( 'hide' );
	$( '#db-currentpath' ).css( 'max-width', '' );
	$( '#db-search-close span' ).empty();
	if ( $( '#db-currentpath .lipath').text() ) $( '#db-back' ).removeClass( 'hide' );
	if ( !$( '#db-search-keyword' ).val() ) return
	
	$( '#db-search-keyword' ).val( '' );
	var path = $( '#db-currentpath .lipath:last').text();
	if ( !path ) {
		$( '#db-entries' ).empty();
		$( '#home-blocks' ).removeClass( 'hide' );
		return
	}
	
	if ( GUI.dbbackdata.length ) {
		var data = GUI.dbbackdata.pop();
		GUI.dbbackdata.pop();
	} else {
		var data = { path: path };
	}
	getData( data );
	mutationLibrary.observe( observerLibrary, observerOption );
} );
$( '#db-search-keyword' ).keypress( function( e ) {
	if ( e.which === 13 ) $( '#dbsearchbtn' ).click();
} );
// MutationObserver - watch for '#db-entries' content changed then scroll to previous position
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observerOption = { childList: true };
var observerLibrary = document.getElementById( 'db-entries' );
var mutationLibrary = new MutationObserver( function() { // on observed target changed
	var lipath = $( '#db-currentpath' ).find( '.lipath' ).text();
	if ( !$( '#divcoverarts' ).hasClass( 'hide' ) ) {
		$( 'html, body' ).scrollTop( GUI.cvscrolltop );
	} else {
		var scrollpos = GUI.dbscrolltop[ lipath ];
		$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	}
	mutationLibrary.disconnect();
} );
$( '#db-back' ).click( function() {
	$( '.menu' ).addClass( 'hide' );
	mutationLibrary.observe( observerLibrary, observerOption ); // standard js - must be one on one element
	// topmost of path
	if ( GUI.dbbrowsemode === 'file' || !GUI.dbbackdata.length ) {
		if ( $( '#db-currentpath span a' ).length === 1 ) {
			renderLibrary();
		} else {
			$( '#db-currentpath a:nth-last-child( 2 )' ).click();
		}
		return
		
	} else if ( GUI.dbbrowsemode === 'coverart' ) {
		var currentpath =  $( '#db-currentpath' ).find( '.lipath' ).text();
		GUI.dbscrolltop[ currentpath ] = $( window ).scrollTop();
		GUI.dbbackdata = [];
		$( '#divcoverarts, #db-index' ).removeClass( 'hide' );
		$( '#db-entries' ).empty();
		return
	}
	
	GUI.artistalbum = '';
	GUI.dbbackdata.pop();
	if ( !GUI.dbbackdata.length ) {
		renderLibrary();
		return
	}
	
	getData( GUI.dbbackdata.pop() );
} );
$( '#home-blocks' ).contextmenu( function( e ) { // disable default image context menu
	e.preventDefault();
} );
$( '.home-block' ).click( function() {
	var $this = $( this );
	var id = this.id;
	if ( $this.hasClass( 'home-bookmark' ) || id === 'home-coverart' ) return
	
	var type = id.replace( 'home-', '' );
	if ( type === 'usb' && !$( '#home-usb gr' ).length ) {
		location.href = '/sources';
		return
	} else if ( type === 'nas' && !$( '#home-nas gr' ).length ) {
		location.href = '/sources/add';
		return
	} else if ( type === 'webradio' && !$( '#home-webradio gr' ).length ) {
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
		getData( {
			  browsemode : browsemode
			, path       : path
			, plugin     : GUI.plugin
		} );
	}
} );
$( '#home-blocks' ).on( 'tap', '.home-bookmark', function( e ) { // delegate - id changed on renamed
	var $this = $( this );
	var $target = $( e.target );
	if ( $( '.home-block-edit' ).length
		&& !$target.hasClass( 'home-block-edit' )
		&& !$target.hasClass( 'home-block-remove' )
	) {
		$( '.home-block-edit, .home-block-remove' ).remove();
		$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', '' );
		return
	}
	
	var path = $this.find( '.lipath' ).text();
	var name = $this.find( '.bklabel' ).text();
	if ( $target.is( '.home-block-edit' ) ) {
		bookmarkRename( name, path, $this );
	} else if ( $target.is( '.home-block-remove' ) ) {
		bookmarkDelete( name, $this );
	} else {
		GUI.dblist = 1;
		GUI.dbbrowsemode = 'file';
		getData( {
			  browsemode : 'file'
			, path       : path
		} );
	}
} ).on( 'taphold', '.home-bookmark', function() {
	if ( GUI.drag ) return
	
	GUI.bookmarkedit = 1;
	GUI.bklabel = $( this ).find( '.bklabel' );
	$( '.home-bookmark' ).each( function() {
		$this = $( this );
		var buttonhtml = '<i class="home-block-remove fa fa-minus-circle"></i>';
		if ( !$this.find( 'img' ).length ) buttonhtml += '<i class="home-block-edit fa fa-edit-circle"></i>'
		$this.append( buttonhtml )
	} );
	$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', 0.2 );
} );
var sortablelibrary = new Sortable( document.getElementById( 'divhomeblocks' ), {
	  ghostClass : 'db-sortable-ghost'
	, delay      : 400
	, onStart    : function( e ) {
		GUI.drag = 1;
		var pos = $( e.item ).offset();
		posX = pos.left;
		posY = pos.top;
	  }
	, onMove    : function( e, oe ) {
		if ( GUI.bookmarkedit ) {
			if ( Math.abs( oe.clientX - posX ) > 5 || Math.abs( oe.clientY - posY ) > 5 ) {
				GUI.bookmarkedit = 0;
				$( '.home-block-edit, .home-block-remove' ).remove();
				$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', '' );
			}
		}
	  }
	, onEnd      : function() {
		GUI.drag = 0;
	  }
	, onUpdate   : function () {
		var $blocks = $( '.home-block' );
		var order = '';
		$blocks.each( function() {
			order += $( this ).find( '.label' ).text() +'^^';
		} );
		order = order.slice( 0, -2 );
		GUI.display.order = order.split( '^^' );
		$.post( 'enhance.php', { order: order } );
	}
} );
$( '#home-coverart' ).click( function() { // fix - 'tap' also fire .coverart click here
	if ( !$( '#divcoverarts' ).html() ) {
		$( this ).taphold();
		return
	}
	
	GUI.dbbrowsemode = 'coverart';
	$( '#db-currentpath span' ).html( '<i class="fa fa-coverart"></i> <a>COVERART</a>' );
	$( '#db-currentpath .lipath' ).text( 'coverart' );
	$( '#home-blocks' ).addClass( 'hide' );
	$( '#divcoverarts, #db-back, #db-index' ).removeClass( 'hide' );
	$( '#db-index li' ).not( ':eq( 0 )' ).css( 'color', '#34495e' );
	var index = $( '#indexcover' ).text().split( '' );
	index.forEach( function( index ) {
		$( '#db-index .index-'+ index ).css( 'color', '' );
	} );
	displayIndexBar();
	setTimeout( function() {
		var cH = window.innerHeight - $( '.coverart' ).height() - 94;
		$( '#divcoverarts p' ).css( 'height', cH +'px' );
	}, 50 );
} ).taphold( function() {
	if ( GUI.drag ) return
	
	if ( GUI.status.updating_db ) {
		info( {
			  icon    : 'coverart'
			, title   : 'Coverart Thumbnails Update'
			, message : 'Library update is in progress ...'
						+'<br>Please wait until finished.'
		} );
		return
	}
	
	info( {
		  icon    : 'coverart'
		, title   : 'Coverart Thumbnails Update'
		, message : 'A lot of albums will take a lot of time.'
					 +'<br>(±200 album/minute for initial scan)'
					 +'<br>Continue?'
		, cancel  : 1
		, ok      : function() {
			$( 'body' ).append(
				'<form id="formtemp" action="addonsbash.php" method="post">'
					+'<input type="hidden" name="alias" value="cove">'
					+'<input type="hidden" name="type" value="scan">'
				+'</form>' );
			$( '#formtemp' ).submit();
		}
	} );
} );
$( '.coverart' ).tap( function( e ) {
	if ( $( e.target ).hasClass( 'coverart-remove' ) ) return
	
	if ( $( '.coverart-remove' ).length ) {
		$( '.coverart img' ).css( 'opacity', '' );
		$( '.coverart-remove' ).remove();
		return
	}
	
	mutationLibrary.observe( observerLibrary, observerOption ); // standard js - must be one on one element
	GUI.cvscrolltop = $( window ).scrollTop();
	$this = $( this );
	$licue = $this.find( '.licue' );
	if ( $licue.length ) {
		getData( {
			  path       : $licue.text()
			, browsemode : 'file'
		} );
	} else {
		getData( {
			  path       : $this.find( '.coverartalbum' ).text()
			, artist     : $this.find( '.coverartartist' ).text()
			, browsemode : 'coverart'
		} );
	}
} ).taphold( function() {
	GUI.bookmarkedit = 1;
	$( '.coverart img' ).css( 'opacity', '' );
	$( '.coverart-remove' ).remove();
	$( '.coverart div' ).append( '<i class="coverart-remove fa fa-minus-circle"></i>' );
	$( '.coverart img' ).css( 'opacity', 0.4 );
} );
$( '#divcoverarts' ).on( 'tap', '.coverart-remove', function() {
	var $this = $( this );
	var img = $this.prev().prop( 'src' );
	var $album = $this.parent().next();
	var album = $album.text();
	var artist = $album.next().text();
	var coverfile = img.split( '/' ).pop();
	info( {
		  icon     : 'minus-circle'
		, title    : 'Remove Thumbnail'
		, message  : 'Remove?'
					+'<br><img src="'+ img +'">'
					+'<br><wh>'+ album +'</wh>'
					+'<br>'+ artist
		, msgalign : 'center'
		, cancel   : 1
		, oklabel  : 'Remove'
		, ok       : function() {
			$this.parent().parent().remove();
			$.post( 'enhance.php', { coverfile: coverfile } );
		}
	} );
} );
$( '#db-entries' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	var $target = $( e.target )
	if ( $this.index() === 0 && $target.is( '.bioartist, .fa-artist, .fa-albumartist, .biocomposer, .fa-composer' ) ) {
		var name = ( $target.is( '.biocomposer, .fa-composer' ) ) ? $this.find( '.biocomposer' ).text() : $this.find( '.bioartist' ).text();
		getBio( name );
		return
	} else if ( $target.hasClass( 'lialbum' ) ) {
		window.open( 'https://www.last.fm/music/'+ $this.find( '.bioartist' ).text() +'/'+ $this.find( '.lialbum' ).text(), '_blank' );
		return
	} else if ( $target.hasClass( 'db-icon' ) ) {
		$this.find( '.db-action' ).click();
		return
	}
	
	$( '.menu' ).addClass( 'hide' );
	// get file list in 'artist', 'composer', 'genre' mode (non-album)
	if ( $this.hasClass( 'licover' ) && GUI.dbbackdata.length ) {
		if ( [ 'artist', 'composer', 'genre' ].indexOf( GUI.dbbackdata[ 0 ].browsemode ) !== -1 ) {
			GUI.filelist = '';
			$( '#db-entries li .lipath' ).slice( 1 ).each( function() {
				var path = $( this ).text();
				GUI.filelist += '"'+ path.replace( /"/g, '\"' ) +'" ';
			} );
		}
	}
	if ( $this.find( '.fa-music' ).length || $this.find( '.fa-webradio' ).length ) {
		if ( !GUI.display.tapaddplay || $this.hasClass( 'licover' ) ) {
			$this.find( 'i.db-action' ).click();
		} else {
			$thisli = $this;
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
		getData( {
			  path       : path
			, artist     : artist
			, browsemode : mode ? mode : 'file'
		} );
		return
	}
	
	if ( $this.attr( 'mode' ) === 'spotify' ) {
		getData( {
			  path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			, plugin    : 'Spotify'
			, args      : path.toString()
			, querytype : 'tracks'
		} );
		GUI.plugin = 'Spotify';
	} else if ( $this.attr( 'mode' ) === 'dirble' ) {
		getData( {
			  path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			, plugin    : 'Dirble'
			, querytype : $this.hasClass( 'db-dirble-child' ) ? 'stations' : 'childs'
			, args      : path
		} );
		GUI.plugin = 'Dirble';
	} else if ( $this.attr( 'mode' ) === 'jamendo' ) {
/*		getData( {
			  path      : GUI.currentpath +'/'+ $this.find( 'span' ).text()
			, plugin    : 'Jamendo'
			, querytype : 'radio'
			, args      : path
		} );*/
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
	if ( $thisli.hasClass( 'licover' ) ) {
		GUI.list.mode = 'album'
	} else {
		GUI.list.mode = $thisli.find( '.db-icon' ).prop( 'class' ).replace( /fa fa-| db-icon/g, '' );
	}
	GUI.list.path = $thisli.find( '.lipath' ).text() || '';
	GUI.list.name = $thisli.find( '.liname' ).text() || '';
	GUI.list.bioartist = $thisli.find( '.bioartist' ).text() || '';
	GUI.list.artist = $thisli.find( '.liartist' ).text() || '';
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
		var menutop = GUI.bars ? '310px' : '270px';
	} else {
		var menutop = ( $thisli.position().top + 49 ) +'px';
	}
	$menu
		.css( 'top',  menutop )
		.removeClass( 'hide' );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( GUI.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
} );
$( '#db-index li' ).click( function() {
	var topoffset = GUI.bars ? 80 : 40;
	var indextext = $( this ).text();
	var $this = $( this );
	var match = 0;
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	var $el = $( '#divcoverarts' ).hasClass( 'hide' ) ? $( '#db-entries li' ) : $( '.coverart' );
	$el.each( function() {
		if ( $( this ).find( '.lisort' ).text().charAt( 0 ) === indextext ) {
			$( 'html, body' ).scrollTop( this.offsetTop - topoffset );
			return false
		}
	} );
} );
$( '#db-entries, #pl-entries, #pl-editor' ).on( 'click', 'p', function() {
	$( '.menu' ).addClass( 'hide' );
	if ( !GUI.display.contexticon ) $( '#pl-entries .pl-action' ).hide();
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
	
	$( '.playlist, #pl-searchbtn, #context-menu-plaction' ).addClass( 'hide' );
	$( '#context-menu-plaction' ).addClass( 'hide' );
	$( '#loader' ).removeClass( 'hide' );
	
	var plL = GUI.lsplaylists.length;
	var plcounthtml = '<wh><i class="fa fa-microsd"></i></wh><bl>PLAYLIST</bl>';
	plcounthtml += plL ? '<gr>&ensp;·&emsp;</gr> <wh id="pls-count">'+ numFormat( plL ) +'</wh>&ensp;<i class="fa fa-list-ul"></i>' : '';
	$( '#pl-currentpath' ).html( plcounthtml +'<i class="fa fa-arrow-left plsbackroot"></i>' );
	$( '#pl-currentpath, #pl-editor, #pl-index' ).removeClass( 'hide' );
	var content = '';
	$.each( GUI.lsplaylists, function( key, val ) {
		if ( val.index ) {
			$( '#pl-index li' ).not( ':eq( 0 )' ).css( 'color', '#34495e' );
			$.each( val.index, function( i, char ) {
				$( '#pl-index .index-'+ char ).css( 'color', '' );
			} );
		} else {
		content += '<li class="pl-folder">'
						+'<i class="fa fa-list-ul pl-icon">'
						+'<a class="liname">'+ val.name +'</a></i>'
						+'<a class="lisort">'+ val.lisort +'</a></i>'
						+'<span class="plname">'+ val.name +'</span>'
						+'<i class="fa fa-bars pl-action" data-target="#context-menu-playlist"></i>'
				  +'</li>';
		}
	} );
	$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
		GUI.pleditor = 1;
		// fill bottom of list to mave last li movable to top
		$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.bars ? 140 : 100 ) +'px' );
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
	info( {
		   title   : 'Crop Playlist'
		 , message : 'Clear this playlist except current song?'
		, cancel   : 1
		, ok       : function() {
			$.post( 'enhance.php', { mpc: GUI.status.state === 'stop' ? 'mpc play; mpc crop; mpc stop' : 'mpc crop' } );
		}
	} );
} );
$( '#plclear' ).click( function() {
	if ( GUI.display.plclear ) {
		if ( GUI.display.contexticon ) {
			info( {
				  title   : 'Clear Playlist'
				, message : 'Clear this playlist?'
				, cancel  : 1
				, ok      : function() {
					clearPlaylist();
					$.post( 'enhance.php', { mpc: 'mpc clear' } );
				}
			} );
		} else {
			if ( $( '#pl-entries .pl-action' ).is( ':visible' ) ) {
				$( '#pl-entries .pl-action' ).hide();
				return
			}
			
			info( {
				  title       : 'Clear Playlist'
				, message     : 'Select single remove / clear all :'
				, cancellabel : 'Single'
				, cancel  : function() {
					$( '#pl-entries .pl-action' ).show();
				}
				, oklabel    : 'All'
				, ok         : function() {
					clearPlaylist();
					$.post( 'enhance.php', { mpc: [ 'mpc clear', '/usr/bin/redis-cli del webradiopl' ] } );
				}
			} );
		}
	} else {
		clearPlaylist();
		$.post( 'enhance.php', { mpc: 'mpc clear' } );
	}
} );
$( '#pl-filter' ).keyup( function() {
	var keyword = $( this ).val();
	var count = 0;
	$( '#pl-entries li' ).each( function() {
		var $this = $( this );
		var match = ( $this.text().search( new RegExp( keyword, 'i' ) ) !== -1 ) ? true : false;
		count = match ? ( count + 1 ) : count;
		$this.toggleClass( 'hide', !match );
	} );
	if ( keyword ) {
		$( '#pl-search-close span' ).html( count +' <a>of</a> ' );
	} else {
		$( '#pl-search-close span' ).empty();
	}
} );
$( '#pl-search-close, #plsearchbtn' ).click( function() {
	$( '#pl-search-close, #pl-search, #plsearchbtn' ).addClass( 'hide' );
	$( '#pl-count, #pl-manage, #pl-searchbtn, #pl-entries li' ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
} );
$( '#pl-searchbtn' ).click( function() {
	$( '#pl-search-close, #pl-search, #plsearchbtn' ).removeClass( 'hide' );
	$( '#pl-count, #pl-manage, #pl-searchbtn' ).addClass( 'hide' );
	$( '#pl-filter' ).focus();
} );
var sortableplaylist = new Sortable( document.getElementById( 'pl-entries' ), {
	  ghostClass : 'pl-sortable-ghost'
	, delay      : 400
	, onUpdate   : function ( e ) {
		if ( $( e.from ).hasClass( 'active' ) ) {
			$( e.to ).removeClass( 'active' );
			$( e.item ).addClass( 'active' )
			GUI.status.Pos = $( e.item ).index();
			GUI.status.song = GUI.status.Pos;
		}
		GUI.sortable = 1;
		setTimeout( function() { GUI.sortable = 0 }, 500 );
		
		$.post( 'enhance.php', { mpc: 'mpc move '+ ( e.oldIndex + 1 ) +' '+ ( e.newIndex + 1 ) } );
	}
} );
$( '#page-playlist' ).on( 'swipeleft', function( e ) {
	GUI.swipe = 1;
	setTimeout( function() { GUI.swipe = 0 }, 500 );
	$( '#tab-library' ).click();
} ).on( 'swiperight', function( e ) {
	GUI.swipe = 1;
	setTimeout( function() { GUI.swipe = 0 }, 500 );
	$( '#tab-playback' ).click();
} );
$( '#pl-entries' ).on( 'click', 'li', function( e ) {
	if ( GUI.swipe ) return
	
	var $this = $( this );
	if ( $( e.target ).hasClass( 'pl-icon' ) ) return

	var songpos = $this.index() + 1;
	$( '#context-menu-plaction' ).addClass( 'hide' );
	if ( !$( e.target ).hasClass( 'pl-action' ) ) {
		var state = GUI.status.state;
		if ( state == 'stop' ) {
			$.post( 'enhance.php', { mpc: 'mpc play '+ songpos } );
		} else {
			if ( $this.hasClass( 'active' ) ) {
				if ( state == 'play' ) {
					$this.hasClass( 'webradio' ) ? $( '#stop' ).click() : $( '#play' ).click();
				} else {
					$( '#play' ).click();
				}
			} else {
				$.post( 'enhance.php', { mpc: 'mpc play '+ songpos } );
			}
		}
	}
} );
$( '#pl-entries' ).on( 'click', '.pl-icon', function( e ) {
	var $this = $( this );
	var $thisli = $this.parent();
	GUI.list.li = $thisli;
	var menutop = ( $thisli.position().top + 49 ) +'px';
	var $contextmenu = $( '#context-menu-plaction' );
	var $contextlist = $( '#context-menu-plaction a' );
	if ( !$contextmenu.hasClass( 'hide' ) 
		&& $contextmenu.css( 'top' ) === menutop
	) {
		$contextmenu.addClass( 'hide' );
		return
	}
	
	var state = GUI.status.state;
	$contextlist.removeClass( 'hide' );
	if ( $thisli.hasClass( 'active' ) ) {
		$contextlist.eq( 0 ).toggleClass( 'hide', state === 'play' );
		$contextlist.eq( 1 ).toggleClass( 'hide', state !== 'play' || $( e.target ).hasClass( 'fa-webradio' ) );
		$contextlist.eq( 2 ).toggleClass( 'hide', state === 'stop' );
	} else {
		$contextlist.eq( 1 ).add( $contextlist.eq( 2 ) ).addClass( 'hide' );
	}
	if ( $this.hasClass( 'fa-webradio' ) && $thisli.find( '.unsaved' ).length ) {
		GUI.list.name = $thisli.find( '.name' ).text();
		GUI.list.path = $thisli.find( '.lipath' ).text();
		$contextlist.eq( 3 ).removeClass( 'hide' );
	} else {
		$contextlist.eq( 3 ).addClass( 'hide' );
	}
	var contextnum = $contextmenu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 41 - 1 );
	$contextmenu
		.removeClass( 'hide' )
		.css( 'top', menutop );
	var targetB = $contextmenu.offset().top + $contextmenu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( GUI.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
} );
$( '#pl-entries' ).on( 'click', '.pl-action', function() { // remove
	var $this = $( this ).parent();
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
			if ( GUI.bars ) {
				$( '#play, #pause' ).removeClass( 'btn-primary' );
				$( '#stop' ).addClass( 'btn-primary' );
			}
		}
	}
	var songpos = $this.index() + 1;
	$this.remove();
	if ( !$this.hasClass( 'webradio' ) ) {
		$.post( 'enhance.php', { mpc: 'mpc del '+ songpos } );
	} else {
		$.post( 'enhance.php', { mpc: [ 'mpc del '+ songpos, '/usr/bin/redis-cli hdel webradiopl "'+ $this.find( '.lipath' ).text() +'"' ] } );
	}
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
	if ( targetB > wH - ( GUI.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
} );
$( '#pl-index li' ).click( function() {
	var topoffset = GUI.bars ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	$( '#pl-editor li' ).each( function() {
		if ( $( this ).find( '.lisort' ).charAt( 0 ) === indextext ) {
			$( 'html, body' ).scrollTop( this.offsetTop - topoffset );
			return false
		}
	} );
} );

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

document.addEventListener( 'visibilitychange', function() {
	if ( document.hidden ) {
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		clearInterval( GUI.intElapsedPl );
	} else {
		if ( GUI.playback ) {
			getPlaybackStatus();
		} else if ( GUI.library ) {
			if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) renderLibrary();
		} else {
			displayTopBottom();
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
			if ( $( '.playback-block.hide' ).length && window.innerHeight > 420 ) $( '#page-playback, #playback-row' ).removeAttr( 'style' );
			displayPlayback()
			scrollLongText();
			$( '#playback-row' ).removeClass( 'hide' );
		}, 300 );
	} else if ( GUI.playlist && !GUI.pleditor ) {
		setTimeout( function() {
			setNameWidth();
			getTitleWidth();
			setTitleWidth();
			var scrollpos = $( '#pl-entries li.active' ).offset().top - $( '#pl-entries' ).offset().top - ( 49 * 3 );
			$( 'html, body' ).scrollTop( scrollpos );
		}, 300 );
	} else if ( GUI.dblist || GUI.pleditor  || !$( '#divcoverarts' ).hasClass( 'hide' ) ) {
		displayIndexBar();
	}
} );

var pushstreams = {};
var streams = [ 'bookmark', 'display', 'idle', 'notify', 'playlist', 'volume', 'webradio' ];
streams.forEach( function( stream ) {
	pushstreams[ stream ] = new PushStream( { modes: 'websocket' } );
	pushstreams[ stream ].addChannel( stream );
} );

pushstreams.bookmark.onmessage = function( data ) {
	if ( GUI.bookmarkedit ) return
		
	var bookmarks = data[ 0 ];
	clearTimeout( GUI.debounce );
	GUI.debounce = setTimeout( function() {
		var content = '';
		$( '.bookmark' ).remove();
		if ( !bookmarks.length ) return
		
		$.each( bookmarks, function( i, bookmark ) {
			if ( bookmark.coverart ) {
				var namehtml = '<img class="bkcoverart" src="'+ bookmark.coverart +'">';
				var hidelabel = ' hide';
			} else {
				var namehtml = '<i class="fa fa-bookmark"></i>';
				var hidelabel = '';
			}
			content += '<div class="divblock bookmark">'
						+'<div class="home-block home-bookmark">'
							+'<a class="lipath">'+ bookmark.path +'</a>'
							+ namehtml
							+'<div class="divbklabel"><span class="bklabel label'+ hidelabel +'">'+ bookmark.name +'</span></div>'
						+'</div>'
					  +'</div>';
		} );
		$.each( GUI.libraryhome, function( name, val ) {
			if ( name === 'activeplayer' || name === 'spotify' ) return
			$( '#home-'+ name ).find( 'gr' ).text( val );
		} );
		$( '#divhomeblocks' ).append( content ).promise().done( function() {
			if ( GUI.display.order.length ) {
				$.each( GUI.display.order, function( i, name ) {
					var $divblock = $( '.divblock' ).filter( function() {
						return $( this ).find( '.label' ).text() === name;
					} );
					$divblock.detach();
					$( '#divhomeblocks' ).append( $divblock );
				} );
			}
			renderLibrary()
		} );
	}, GUI.debouncems );
}
pushstreams.display.onmessage = function( data ) {
	if ( typeof data[ 0 ] !== 'object' ) return
	
	var data = data[ 0 ];
	$.each( data, function( key, val ) {
		GUI.display[ key ] = val;
	} );
	clearTimeout( GUI.debounce );
	GUI.debounce = setTimeout( function() {
		if ( GUI.playback ) {
			getPlaybackStatus();
		} else if ( GUI.library ) {
			if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
				renderLibrary();
			} else {
				if ( GUI.display.coverfile ) {
					if ( !$( '.licover' ).length ) $( '#db-currentpath a:last-child' ).click();
				} else {
					$( '.licover' ).remove();
				}
			}
		} else {
			displayTopBottom();
		}
	}, GUI.debouncems );
}
var timeoutUpdate;
pushstreams.idle.onmessage = function( changed ) {
	var changed = changed[ 0 ];
	clearTimeout( GUI.debounce );
	GUI.debounce = setTimeout( function() {
		if ( changed === 'player' ) { // on track changed
				getPlaybackStatus();
				if ( GUI.playlist && !GUI.pleditor ) setPlaylistScroll();
		} else if ( changed === 'playlist' ) { // on playlist changed
			if ( GUI.pleditor ) return
			
			if ( GUI.playlist ) {
				$.post( 'enhance.php', { getplaylist: 1 }, function( data ) {
					if ( data.playlist.length ) {
						GUI.status.playlistlength = data.playlist.length;
						GUI.lsplaylists = data.lsplaylists || [];
						GUI.pllist = data.playlist;
					} else {
						GUI.status.playlistlength = 0;
					}
					renderPlaylist();
				}, 'json' );
			} else if ( GUI.playback ) {
				getPlaybackStatus();
			}
		} else if ( changed === 'options' ) { // on mode toggled
			$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
				$.each( status, function( key, value ) {
					GUI.status[ key ] = value;
				} );
				if ( GUI.playback ) setButtonToggle();
			}, 'json' );
		} else if ( changed === 'update' ) {
			$.post( 'enhance.php', { librarycount: 1 }, function( data ) {
				$( '.home-block gr' ).remove();
				$.each( data, function( id, val ) {
					if ( val ) $( '#home-'+ id ).find( 'i' ).after( '<gr>'+ numFormat( val ) +'</gr>' );
				} );
			}, 'json' );
			if ( $( '#db-currentpath .lipath' ).text() === 'Webradio' ) return;
			
			$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
				if ( status.updating_db ) {
					GUI.status.updating_db = 1;
				} else {
					GUI.status.updating_db = 0;
					new PNotify( {
						  title : 'Update Database'
						, text  : 'Database updated.'
					} );
				}
			}, 'json' );
		} else if ( changed === 'database' ) { // on files changed (for webradio rename)
			if ( $( '#db-currentpath .lipath' ).text() === 'Webradio' ) $( '#home-webradio' ).tap();
		}
	}, GUI.debouncems );
}
pushstreams.notify.onmessage = function( data ) {
	var notify = data[ 0 ];
	new PNotify( {
		  icon        : notify.icon || 'fa fa-check'
		, title       : notify.title || 'Info'
		, text        : notify.text
	} );
}
pushstreams.playlist.onmessage = function( data ) {
	GUI.lsplaylists = data[ 0 ] || [];
	if ( !GUI.playlist ) return
	
	if ( !$( '#pl-entries' ).hasClass( 'hide' ) || !GUI.lsplaylists.length ) {
		renderPlaylist();
	} else {
		$( '#plopen' ).click();
	}
}
pushstreams.volume.onmessage = function( data ) {
	var data = data[ 0 ];
	clearTimeout( GUI.debounce );
	GUI.debounce = setTimeout( function() {
		var vol = data[ 0 ];
		var volumemute = data[ 1 ];
		$volumeRS.setValue( vol );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		volumemute ? muteColor( volumemute ) : unmuteColor();
	}, GUI.debouncems );
}
pushstreams.webradio.onmessage = function( data ) {
	if ( $( '#db-currentpath i.fa-webradio' ).length ) {
		$( '#home-webradio' ).click();
	} else if ( GUI.playlist && !GUI.pleditor ) {
		var data = data[ 0 ];
		$( '#pl-entries li' ).filter( function() {
			$this = $( this );
			return $this.find( 'i.fa-webradio' ).length && $this.find( '.name' ).text() == data.oldname;
		} ).find( '.name' ).text( data.name );
		if ( !data.oldname ) {
			GUI.libraryhome.webradio++;
			var count = GUI.libraryhome.webradio ? numFormat ( GUI.libraryhome.webradio ) : '';
			$( '#home-webradio gr' ).remove();
			$( '#home-webradio i' ).after( '<gr>'+ count +'</gr>' );
		}
	}
}
streams.forEach( function( stream ) {
	pushstreams[ stream ].connect();
} );

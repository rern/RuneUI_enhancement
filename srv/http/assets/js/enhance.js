$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// ##### prevent loading js in setting pages #####
if ( /\/.*\//.test( location.pathname ) === true ) {
	if ( window.innerWidth < 540 || window.innerHeight < 515 ) {
		$( 'div.container' ).find( 'h1' ).before( '<a href="/" class="close-root"><i class="fa fa-times fa-2x"></i></a>' );
	} else {
		$( '.playback-controls button' ).click( function() {
			location.href = '/';
		} );
		$( '#menu-bottom li' ).click( function() {
			var command = { page: [ 'set', 'page', this.id ] };
			$.post( '/enhanceredis.php', { json: JSON.stringify( command ) }, function(data) {
				location.href = '/';
			} );
		} );
		$( '#menu-bottom li' ).removeClass( 'active' );
	}
	
	return;
}
// fix: midori renders box-shadow incorrectly
if ( /Midori/.test( navigator.userAgent ) ) {
	$( 'head link[rel="stylesheet"]').last().after( '<link rel="stylesheet" href="/css/midori.css">' )
}

$( '#open-panel-sx, .open-sx' ).click( function() {
	if ( $( this ).hasClass( 'active' ) ) {
		$( '#db-home' ).click();
		return;
	}
	var activePlayer = GUI.libraryhome.ActivePlayer;
	if ( activePlayer === 'Spotify' || activePlayer === 'Airplay' ) {
		$( '#overlay-playsource-open' ).click();
	} else {
		menubottom( 'panel-sx', 'playback', 'panel-dx' );
		displaylibrary();
	}
} );
$( '#open-playback' ).click( function() {
	menubottom( 'playback', 'panel-sx', 'panel-dx' );
	displayplayback();
} );
$( '#open-panel-dx' ).click( function() {
	menubottom( 'panel-dx', 'playback', 'panel-sx' );
	displayqueue();
} );
function menubottom( elshow, elhide1, elhide2 ) {
	$( '#menu-top, #menu-bottom' ).hide();
	if ( $( '#panel-sx' ).hasClass( 'active' ) ) librarytop = $( window ).scrollTop();
	if ( $( '#panel-dx' ).hasClass( 'active' ) ) queuetop = $( window ).scrollTop();
	if ( /\/.*\//.test( location.pathname ) === false ) {
		$( '#'+ elshow ).show();
		$( '#open-'+ elshow ).addClass( 'active' );
		$( '#'+ elhide1 +', #'+ elhide2 ).hide();
		$( '#open-'+ elhide1 +', #open-'+ elhide2 ).removeClass( 'active' );
	} else {
		window.location.href = '/';
	}
}
function panelLR( lr ) {
	var pcurrent = $( '.tab-pane:visible' ).prop( 'id' );
	if ( pcurrent === 'panel-sx' ) {
		var $pL = $( '#open-playback a' );
		var $pR = $( '#open-panel-dx a' );
	} else if ( pcurrent === 'playback' ) {
		var $pL = $( '#open-panel-dx a' );
		var $pR = $( '#open-panel-sx a' );
	} else {
		var $pL = $( '#open-panel-sx a' );
		var $pR = $( '#open-playback a' );
	}
	$paneclick = ( lr === 'left' ) ? $pL.click() : $pR.click();
}

// back from setting pages
if ( /\/.*\//.test( document.referrer ) == true ) {
	var command = { 
		page: [ 'get', 'page' ],
		del: [ 'del', 'page' ]
	};
	$.post( '/enhanceredis.php',{ json: JSON.stringify( command ) }, function( data ) {
		var page = JSON.parse( data ).page;
		if ( page !== 'open-playback' ) $( '#'+ page ).click();
	} );
}
// disabled local browser > disable screensaver events
if ( !$( '#playback-ss' ).length ) $('#section-index').off( 'mousemove click keypress' );

// playback buttons click go back to home page
$( '.playback-controls' ).click( function() {
	if ( !$( '#playback' ).hasClass( 'active' ) ) {
		$( '#open-playback a' ).click();
		$( '#open-playback a' )[ 0 ].click();
	}
} );
// playlist click go back to home page
$( '#playlist-entries' ).click( function( e ) {
	if ( e.target.nodeName == 'SPAN' ) {
		$( '#open-playback a' ).click();
		$( '#open-playback a' )[ 0 ].click();
		if ( window.innerWidth < 499 || window.innerHeight < 515 ) $( '#menu-top, #menu-bottom' ).toggle();
	}
} );
$( '#menu-bottom' ).click( function() {
	if ( window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).hide();
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#database' ).css( 'padding-top', '40px' );
	}
} );
$( '#currentsong' ).click( function() {
	if ( $( this ).has( 'i' ).length ) $( '#open-panel-sx' ).click();
} );

// library directory path link
$( '#db-home' ).click( function() {
	renderLibraryHome();
} );
$( '#db-currentpath' ).on( 'click', 'a', function() {
	getDB( { path: $( this ).attr( 'data-path' ) } );
	window.scrollTo( 0, 0 );
} );

// index link
$( '#db-index li' ).click( function() {
	var topoffset = !$( '#menu-top' ).is( ':hidden' ) ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		window.scrollTo( 0, 0 );
		return
	}
	if ( GUI.browsemode === 'file' ) {
		var datapatharray = $( '#database-entries li' ).attr( 'data-path' ).split('/');
		var path = datapatharray.slice( 0, -1 ).join( '/' );
		var datapathindex = path +'/'+ indextext;
	} else {
		var datapathindex = '^'+ indextext;
	}
	var matcharray = $( '#database-entries li' ).filter( function() {
		return $( this ).attr( 'data-path' ).match( new RegExp( datapathindex ) );
	} );
	if ( matcharray.length ) window.scrollTo( 0, matcharray[0].offsetTop - topoffset );
} );
$( '#db-level-up' ).click( function() {
	window.scrollTo( 0, dbtop );
} );

$( '#open-library' ).click( function() {
	$( '#open-panel-sx' ).click();
} );

$( '#play-group, #share-group, #vol-group' ).click( function() {
	if ( window.innerWidth < 499 ) buttonactive = 1;
} );
// fix: hide on cancel / close
$( '#modal-webradio-add button:lt(2)' ).click( function() {
	$('#spinner-db').addClass('hide')
} );

window.addEventListener( 'orientationchange', function() {
	setTimeout( function() {
		if ( $( '#playback' ).hasClass( 'active' ) ) {
			displayplayback();
		} else if ( $( '#panel-sx' ).hasClass( 'active' ) ) {
			displaylibrarry();
		} else if ( $( '#panel-dx' ).hasClass( 'active' ) ) {
			displayqueue();
		}
	}, 100 );
} );

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
		$( '#elapsed' ).text( '' );
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
	} else {
		settime();
	}
} );

// hammer**************************************************************
Hammer = propagating( Hammer ); // propagating.js fix 

var $hammercontent = new Hammer( document.getElementById( 'content' ) );
var $hammerbarleft = new Hammer( document.getElementById( 'barleft' ) );
var $hammerbarright = new Hammer( document.getElementById( 'barright' ) );
var $hammerartist = new Hammer( document.getElementById( 'currentartist' ) );
var $hammertime = new Hammer( document.getElementById( 'elapsed' ) );
var $hammertimestop = new Hammer( document.getElementById( 'timestop' ) );
var $hammercoverT = new Hammer( document.getElementById( 'coverT' ) );
var $hammercoverL = new Hammer( document.getElementById( 'coverL' ) );
var $hammercoverM = new Hammer( document.getElementById( 'coverM' ) );
var $hammercoverR = new Hammer( document.getElementById( 'coverR' ) );
var $hammercoverBL = new Hammer( document.getElementById( 'coverBL' ) );
var $hammercoverBR = new Hammer( document.getElementById( 'coverBR' ) );
var $hammersonginfo = new Hammer( document.getElementById( 'songinfo-open' ) );
var $hammervolume = new Hammer( document.getElementById( 'volume' ) );
var $hammervoldn = new Hammer( document.getElementById( 'voldn' ) );
var $hammervolmute = new Hammer( document.getElementById( 'volmute' ) );
var $hammervolup = new Hammer( document.getElementById( 'volup' ) );
var $hammervoldnrs = new Hammer( document.getElementById( 'voldnrs' ) );
var $hammervoluprs = new Hammer( document.getElementById( 'voluprs' ) );
var $hammerlibrary = new Hammer( document.getElementById( 'panel-sx' ) );
var $hammerplayback = new Hammer( document.getElementById( 'playback' ) );

[ $hammervolume, $hammervolmute ].forEach( function( el ) {
	el.on( 'press', function( e ) {
		e.stopPropagation();
	} );
} );

$hammercontent.on( 'swiperight', function() {
	panelLR();
} ).on( 'swipeleft', function() {
	panelLR( 'left' );
} );

[ $hammerbarleft, $hammerbarright ].forEach( function( el ) {
	el.on( 'swipe', function( e ) {
		$( '#menu-top, #menu-bottom' ).toggle();
		e.stopPropagation();
	} ).get( 'swipe' ).set( { direction: Hammer.DIRECTION_VERTICAL } );
} )
$hammerbarleft.on( 'tap', function( e ) {
	$( '#menu-top, #menu-bottom' ).toggle();
	e.stopPropagation();
} );
$hammerbarright.on( 'tap', function() {
	if ( $( '#time-knob' ).is( ':visible' ) ) $( '#play-group' ).toggle();
	if ( $( '#coverart' ).is( ':visible' ) ) $( '#share-group' ).toggle();
	if ( displayredis.volume != 0 
		&& displayredis.volumempd != 0 
		&& $( '#volume-knob' ).is( ':visible' ) 
	) {
		$( '#vol-group' ).toggle();
	}
} );

// lastfm search
[ $hammerartist, $hammersonginfo ].forEach( function( el ) {
	el.on( 'tap', function() {
		if ( GUI.json.currentartist.slice( 0, 3 ) === '[no' ) return; 
		barhide = $( '#menu-top' ).is(':visible') ? 0 : 1;
		$( '#loader' ).removeClass( 'hide' );
		
		if ( $( '#bio legend' ).text() != GUI.json.currentartist ) {
			$.get( '/enhancebio.php',
				{ artist: GUI.json.currentartist },
				function( data ) {
					$( '#biocontent' ).html( data );
					bioshow();
				}
			);
		} else {
			bioshow();
		}
	} );
} );
$( '#biocontent' ).delegate( '.biosimilar', 'click', function() {
	$( '#loader' ).removeClass( 'hide' );
	$.get( '/enhancebio.php',
		{ artist: $( this ).find( 'p' ).text() },
		function( data ) {
			$( '#biocontent' ).html( data );
			bioshow();
			$( '#bio' ).scrollTop( 0 );
		}
	);
} );
function bioshow() {
	$( '#menu-top, #menu-bottom' ).hide();
	$( '#songinfo-open' ).hide(); // fix button not hidden
	$( '#bio' ).show();
	$( '#loader' ).addClass( 'hide' );
}
$( '#closebio' ).click( function() {
	$( '#bio' ).hide();
	$( '#songinfo-open' ).show(); // fix button not hidden
	if ( !barhide ) $( '#menu-top, #menu-bottom' ).show();
} );
$( '#coverTL' ).click( function() {
	$( '#overlay-playsource-open' ).click();
	$( '#controls' ).hide();
} );
$( '#coverTR' ).click( function() {
	$( '#controls' ).toggle();
} );
$hammercoverT.on( 'tap', function( e ) {
	$( '#menu-top, #menu-bottom' ).toggle();
	barhide = $( '#menu-top' ).is( ':hidden' ) ? 1 : 0;
	$( '#controls' ).hide();
	e.stopPropagation();
} );
$hammercoverL.on( 'tap', function( e ) {
	$( '#previous' ).click();
	$( '#controls' ).hide();
	e.stopPropagation();
} );
[ $hammertime, $hammercoverM ].forEach( function( el ) {
	el.on( 'tap', function( e ) {
		$( '#play' ).click();
		$( '#controls' ).hide();
		e.stopPropagation();
	} ).on( 'press', function( e ) {
		$( '#stop' ).click();
		$( '#controls' ).hide();
		e.stopPropagation();
	} );
} );
$( '#timestop, #coverB' ).click( function() {
	$( '#stop' ).click();
	$( '#controls' ).hide();
} );
$hammercoverR.on( 'tap', function( e ) {
	$( '#next' ).click();
	$( '#controls' ).hide();
	e.stopPropagation();
} );
[ $hammercoverBL, $hammercoverBR ].forEach( function( el ) {
	el.on( 'tap', function( e ) {
		buttonactive = 0;
		var time = $( '#time-knob' ).is( ':visible' );
		var coverart = $( '#coverart' ).is( ':visible' );
		var volume = displayredis.volume != 0 && displayredis.volumempd != 0 && $( '#volume-knob' ).is( ':visible' );
		if ( buttonhide == 0 
			|| $( '#play-group' ).is( ':visible' )
			|| $( '#share-group' ).is( ':visible' )
			|| $( '#vole-group' ).is( ':visible' )
			) {
			buttonhide = 1;
			$( '#play-group, #share-group, #vol-group' ).hide();
		} else {
			buttonhide = 0;
			if ( time ) $( '#play-group' ).show();
			if ( coverart ) $( '#share-group' ).show();
			if ( volume ) $( '#vol-group' ).show();
		}
		
		if ( window.innerHeight < 414 && $( '#play-group' ).is( ':hidden' ) ) {
			$( '#play-group, #share-group, #vol-group' ).css( 'margin-top', '10px' );
		}
		$( '#controls' ).hide();
		e.stopPropagation();
	} );
} );

var timeoutId;
var intervalId;
var interval;
[ $hammervoldn, $hammervolup, $hammervoldnrs, $hammervoluprs ].forEach( function( el ) {
	el.on( 'press', function( e ) {
		buttonactive = 1;
		onsetvolume = 1;
		e.stopPropagation();
		$volumetransition.css( 'transition-duration', '0s' );
		timeoutId = setTimeout( volumepress( 300, el.element.id ), 500 );
	} ).on( 'pressup panstart touchend', function() {
		clearTimeout( timeoutId );
		clearInterval( intervalId );
		$volumetransition.css( 'transition-duration', '' );
		
		vollocal = 1;
		$.post( '/enhanceredis.php', { bash: '/srv/http/enhancevolume.sh '+ $volumeRS.getValue() } );
		setTimeout( function() {
			onsetvolume = 0;
		}, 500 );
	} );
});
function volumepress( interval, id, fast ) {
	var knobvol = parseInt( $volumeRS.getValue() );
	var vol = knobvol;
	var increment = ( id === 'volup' || id === 'voluprs' ) ? 1 : -1;
	if ( ( increment === -1 && knobvol === 0 )
		|| ( increment === 1 && knobvol === 100 ) ) return;
	var count = 0;
	intervalId = setInterval( function() {
		if ( !fast ) {
			count++;
			if ( count >= 8 ) {
				clearInterval( intervalId );
				volumepress( 75, id, 1 );
			}
		}
		vol = vol + increment;
		if ( !fast ) {
			setvol( vol ); // fix: enhancevolume.sh delay
		} else {
			if ( vol % 2 === 0 ) setvol( vol );
		}
		$volumeRS.setValue( vol );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		if ( vol === 0 || vol === 100 ) clearInterval( intervalId );
	}, interval );
}

$hammerplayback.on( 'press', function() {
	info( {
		  title  : 'Playback'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysaveplayback">\
						<label><input name="bar" type="checkbox" '+ displayredis.bar +'>&ensp;Top-Bottom menu</label>\
						<br><label><input name="pause" type="checkbox" '+ displayredis.pause +'>\
							&ensp;<code><i class="fa fa-play"></i></code>&ensp;<code><i class="fa fa-pause"></i></code>&ensp;buttons</label>\
						<br><label><input name="source" type="checkbox" '+ displayredis.source +'>&ensp;<code>MPD</code>&ensp;button</label>\
						</label>\
						<br><label><input name="time" type="checkbox" '+ displayredis.time +'>&ensp;Time</label>\
						<br><label><input name="coverart" type="checkbox" '+ displayredis.coverart +'>&ensp;Coverart</label>\
						<br><label><input name="volume" type="checkbox" '+ displayredis.volume +'>&ensp;Volume</label>\
						<br><label><input name="buttons" type="checkbox" '+ displayredis.buttons +'>&ensp;Buttons</label>\
						</form>'
		, cancel : 1
		, ok     : function () {
			var data = {};
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				data[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = { display: [ 'hmset', 'display', data ] };
			$.post( '/enhanceredis.php', 
				{ json: JSON.stringify( command ) },
				function( data ) {
					if ( JSON.parse( data ).display ) {
						displayplayback();
					} else {
						info( {
							  title  : 'Playback'
							, message: 'Save Playback display failed!'
						} );
					}
				}
			);
		}
	} );
	// disable from autohide
	if ( window.innerWidth < 499 || window.innerHeight <= 515 ) {
		$( 'input[name="bar"]' )
			.prop( 'disabled', true )
			.parent().css( 'color', '#7795b4' )
			.append( ' (auto hide)' );
	}
	// disable from mpd volume
	if ( displayredis.volumempd == 0 ) {
		$( 'input[name="volume"]' )
			.prop( 'disabled', true )
			.parent().css( 'color', '#7795b4' )
			.append( ' (disabled)' );
	}
	// disable from mpd volume
	if ( window.innerWidth < 499 || window.innerHeight <= 320 ) {
		$( 'input[name="buttons"]' )
			.prop( 'disabled', true )
			.parent().css( 'color', '#7795b4' )
			.append( ' (auto hide)' );
	}
} );

$hammerlibrary.on( 'tap', function( e ) {
	if ( $( '.home-block-remove' ).length && !$( e.target ).is( 'span.block-remove' ) ) $( '#db-homeSetup' ).click();
} ).on( 'press', function( e ) {
	if ( $( '#db-currentpath' ).is( ':visible' ) ) return
	info( {
		  title  : 'Libary Home'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysavelibrary">\
						<label><input name="bar" type="checkbox" '+ displayredis.bar +'>&ensp;Top-Bottom menu</label>\
						<br><label><input name="nas" type="checkbox" '+ displayredis.nas +'>&ensp;Network mounts</label>\
						<br><label><input name="usb" type="checkbox" '+ displayredis.usb +'>&ensp;USB storage</label>\
						<br><label><input name="webradio" type="checkbox" '+ displayredis.webradio +'>&ensp;My Webradios</label>\
						<br><label><input name="albums" type="checkbox" '+ displayredis.albums +'>&ensp;Albums</label>\
						<br><label><input name="artists" type="checkbox" '+ displayredis.artists +'>&ensp;Artists</label>\
						<br><label><input name="composer" type="checkbox" '+ displayredis.composer +'>&ensp;Composers</label>\
						<br><label><input name="genre" type="checkbox" '+ displayredis.genre +'>&ensp;Genres</label>\
						<br><label><input name="spotify" type="checkbox" '+ displayredis.spotify +'>&ensp;Spotify</label>\
						<br><label><input name="dirble" type="checkbox" '+ displayredis.dirble +'>&ensp;Dirble</label>\
						<br><label><input name="jamendo" type="checkbox" '+ displayredis.jamendo +'>&ensp;Jamendo</label>\
						</form>'
		, cancel : 1
		, ok     : function () {
			var data = {};
			$( '#displaysavelibrary input' ).each( function() {
				data[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = { display: [ 'hmset', 'display', data ] };
			$.post( '/enhanceredis.php', 
				{ json: JSON.stringify( command ) },
				function( data ) {
					if ( JSON.parse( data ).display ) {
						displaylibrary();
					} else {
						info( {
							  title  : 'Libary Home'
							, message: 'Save Library home failed!'
						} );
					}
				}
			);
		}
	} );
	e.stopPropagation();
} );

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observersearch = new MutationObserver( function() {
	window.scrollTo( 0, 0 );
});
var observerdiv = document.getElementById( 'database-entries' );
var observeroption = { childList: true };
$( '#db-search' ).on( 'submit', function() {
	dbtop = $( window ).scrollTop();
	observersearch.observe( observerdiv, observeroption );
	$( '#db-level-up' ).hide( function() { // addClass( 'hide' ) not work
		observersearch.disconnect();
	} );
} );
var observerback = new MutationObserver( function() {
	window.scrollTo( 0, $( '#database-entries>li' ).eq( 0 ).attr( 'class' ) === 'db-folder' ? dbtop : 0 );
});
$( '#database-entries' ).click( function() {
	dbtop = $( window ).scrollTop();
	observerback.observe( observerdiv, observeroption );
} );

// replace functions in main runeui.js file **********************************************
$( '#db-search-results' ).click( function() {
	$( this ).addClass( 'hide' );
	$( '#db-level-up, #db-currentpath' ).removeClass( 'hide' );
	getDB( {
		path: GUI.currentpath
	} );
	
	$( '#database-entries' ).removeAttr( 'style' );
	observerback.observe( observerdiv, observeroption );
	$( '#db-level-up' ).show( function() {
		observerback.disconnect();
	} );
} );

librarytop = 0;
queuetop = 0;

// new knob
$( '#time' ).roundSlider( {
	sliderType: 'min-range',
	max: 1000,
	radius: 115,
	width: 20,
	startAngle: 90,
	endAngle: 450,
	showTooltip: false,
	
	create: function ( e ) {
		$timeRS = this;
	},
	change: function( e ) { // not fire on 'setValue'
		if ( GUI.stream !== 'radio' ) {
			var seekto = Math.floor( e.value / 1000 * time );
			if ( GUI.state !== 'stop' ) {
				clearInterval( GUI.currentKnob );
				clearInterval( GUI.countdown );
				sendCmd( 'seek '+ GUI.json.song +' '+ seekto );
			} else {
				$.post( '/enhanceredis.php', { bash: '/usr/bin/mpc play; /usr/bin/mpc seek '+ seekto +'; /usr/bin/mpc pause' });
			}
		} else {
			$timeRS.setValue( 0 );
		}
	},
	start: function () {
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
	}
} );

var dynVolumeKnob = $( '#volume' ).data( 'dynamic' );
vollocal = 0;
$( '#volume' ).roundSlider( {
	sliderType: 'default',
	radius: 115,
	width: 50,
	handleSize: '-25',
	startAngle: -50,
	endAngle: 230,
	editableTooltip: false,
	
	create: function () { // preserve shadow angle of handle
		$volumeRS = this;
		$volumetransition = $( '#volume' ).find( '.rs-animation, .rs-transition' );
		$volumetooltip = $( '#volume' ).find( '.rs-tooltip' );
		$volumehandle = $( '#volume' ).find( '.rs-handle' );
		$volumehandle.addClass( 'rs-transition' ).eq( 0 ) // make it rotate with 'rs-transition'
			.rsRotate( - this._handle1.angle );  // initial rotate
	},
	change: function( e ) { // (not fire on 'setValue') value after click or 'stop drag'
		vollocal = 1;
		onsetvolume = 1;
		setTimeout( function() {
			onsetvolume = 0;
		}, 500 );
		
		$.post( '/enhanceredis.php', { bash: '/srv/http/enhancevolume.sh '+ e.value } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
		if ( e.preValue === 0 ) { // value before 'change'
			var command = { vol: [ 'set', 'volumemute', 0 ] };
			$.post( '/enhanceredis.php', { json: JSON.stringify( command ) } );
			unmutecolor();
		}
	},
	start: function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmutecolor(); // value before 'start drag'
		onsetvolume = 1;
	},
	drag: function ( e ) { // drag with no transition by default
		if ( e.value % 2 === 0 ) {
			setvol( e.value ); // fix: enhancevolume.sh delay
			$( e.handle.element ).rsRotate( - e.handle.angle );
		}
	},
	stop: function( e ) { // on 'stop drag'
		// broadcast to all
		vollocal = 1;
		$.post( '/enhanceredis.php', { bash: '/srv/http/enhancevolume.sh '+ e.value } );
		setTimeout( function() {
			onsetvolume = 0;
		}, 500 );
	}
} );

onsetvolume = 0;
var pushstreamVolume = new PushStream( {
	host: window.location.hostname,
	port: window.location.port,
	modes: GUI.mode
} );
pushstreamVolume.addChannel( 'volume' );
pushstreamVolume.onmessage = function( data ) { // on receive broadcast
	if ( vollocal === 1 ) {
		vollocal = 0;
		return;
	}
	
	onsetvolume = 1; // prevent renderUI()
	setTimeout( function() {
		onsetvolume = 0;
	}, 500 );

	var data = data[ 0 ]; // data as json key '0' from bash 'curl'
	$volumeRS.setValue( data.vol );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
	if ( data.volumemute == 0 ) return;
	
	if ( data.volumemute != -1 ) {
		mutecolor( data.volumemute )
	} else {
		unmutecolor();
	}
};
pushstreamVolume.connect();

$( '#volmute, #volume .rs-tooltip' ).click( function() {
	vollocal = 1;
	onsetvolume = 1;
	setTimeout( function() {
		onsetvolume = 0;
	}, 500 );
	var volumemute = $volumeRS.getValue();
	
	if ( volumemute ) {
		$.post( '/enhanceredis.php', { bash: '/srv/http/enhancevolume.sh 0 '+ volumemute } );
		$volumeRS.setValue( 0 );
		// keep display level before mute
		$volumetooltip.text( volumemute );
		// rotate box-shadow back
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		// change color after rotate finish
		$( '#volume .rs-first' ).one( 'transitionend webkitTransitionEnd mozTransitionEnd', function() {
			mutecolor( volumemute );
		} );
	} else {
		$.post( '/enhanceredis.php', { bash: '/srv/http/enhancevolume.sh 0 -1' }, function( data ) {
			var data = JSON.parse( data ); // data as string from bash 'echo'
			if ( data.vol === 0 ) return;
			$volumeRS.setValue( data.vol );
			$volumehandle.rsRotate( - $volumeRS._handle1.angle );
			// restore color immediately on click
			unmutecolor();
		} );
	}
} );

$( '#volup, #voldn, #voluprs, #voldnrs' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	onsetvolume = 1;
	setTimeout( function() {
		onsetvolume = 0;
	}, 500 );
	
	if ( ( vol === 0 && ( thisid === 'voldn' || thisid === 'voldnrs' ) )
		|| ( vol === 100 && ( thisid === 'volup' || thisid === 'voluprs' ) ) )
			return;

	if ( vol === 0 ) {
		var command = { vol: [ 'set', 'volumemute', 0 ] };
		$.post( '/enhanceredis.php', { json: JSON.stringify( command ) } );
		unmutecolor();
	}
	vol = ( thisid == 'volup' || thisid == 'voluprs' ) ? vol + 1 : vol - 1;
	vollocal = 1;
	$.post( '/enhanceredis.php', { bash: '/srv/http/enhancevolume.sh '+ vol } );
	$volumeRS.setValue( vol );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
} );


} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


// load only not in setting pages
if ( /\/.*\//.test( location.pathname ) === false ) { // start if >>>>>>>>>>>>>>>>>>>

function setvol( vol ) {
	GUI.volume = vol;
	sendCmd( 'setvol '+ vol );
}
function mutecolor( volumemute ) {
	$volumetooltip.text( volumemute ).css( 'color', '#0095d8' );
	$volumehandle.css( 'background', '#587ca0' );
	$( '#volmute' ).addClass( 'btn-primary' );
}
function unmutecolor() {
	$volumetooltip.css( 'color', '#e0e7ee' );
	$volumehandle.css( 'background', '#0095d8' );
	$( '#volmute' ).removeClass( 'btn-primary' );
}

// #menu-top, #menu-bottom, #play-group, #share-group, #vol-group:
// use show/hide to work with css 'display: none'
function displaycommon() {
	barhide = window.innerWidth < 499 || window.innerHeight < 515 ? 1 : 0;
	if ( displayredis.bar !== ''
		&& $( '#bio' ).is( ':hidden' )
		&& barhide == 0
	) {
		$( '#menu-top, #menu-bottom' ).show();
		$( '#database, #playlist' ).css( 'padding-top', '80px' );
		$( '.btnlist-top' ).css( 'top', '40px' );
	} else {
		$( '#menu-top, #menu-bottom' ).hide();
		$( '#database, #playlist' ).css( 'padding-top', '40px' );
		$( '.btnlist-top' ).css( 'top', 0 );
		
		// for mouse only
		if ( navigator.userAgent.match( /iPad|iPhone|iPod|android|webOS/i ) ) return;
		$( '#bartop, #barbottom' ).mouseenter( function() {
			var tb = $( this ).prop( 'id' ).replace( 'bar', '#menu-' );
			if ( $( tb ).is( ':visible' ) ) {
				barhide = 0;
			} else {
				barhide = 1;
				$( tb ).show();
			}
		} );
		$( '#menu-top, #menu-bottom' ).mouseleave( function() {
			if ( barhide ) $( '#menu-top, #menu-bottom' ).hide();
			barhide = 0;
		} );
	}
}

// playback show/hide blocks
buttonactive = 0;
function displayplayback() {
	buttonhide = window.innerHeight <= 320 || window.innerWidth < 499 ? 1 : 0;
	var command = {
		display: [ 'hGetAll', 'display' ],
		volumempd: [ 'get', 'volume' ],
		update: [ 'hGet', 'addons', 'update' ]
	};
	if ( GUI.json.playlistlength != 0 ) $( '.playback-controls' ).css( 'visibility', 'visible' );
	
	$.post( '/enhanceredis.php', 
		{ json: JSON.stringify( command ) },
		function( data ) {
		var data = JSON.parse( data );
		displayredis = data.display;
		var volume = ( displayredis.volume == '' || data.volumempd == 0 ) ? 0 : 1;
		
		if ( data.update != 0 ) {
			$( '#menu-settings' ).append( '<span id="badge">'+ data.update +'</span>' );
		} else {
			$( '#badge' ).remove();
		}
		$( '#pause' ).toggleClass( 'hide', !displayredis.pause );
		// reset to default css
		$( '#playback-row, #time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( {
			margin: '',
			width: '',
			'max-width': '',
			order: '',
			'-webkit-order': '',
			display: ''
		} );
		$( '#overlay-playsource-open' ).toggleClass( 'hide', !displayredis.source );
		$( '#time-knob, #play-group' ).toggleClass( 'hide', !displayredis.time );
		$( '#coverart, #share-group' ).toggleClass( 'hide', !displayredis.coverart );
		$( '#volume-knob, #vol-group' ).toggleClass( 'hide', !volume );
		
		var i = ( displayredis.time ? 1 : 0 ) + ( displayredis.coverart ? 1 : 0 ) + volume;
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

		if ( buttonhide || displayredis.buttons == '' ) {
			buttonhide = 1;
			$( '#play-group, #share-group, #vol-group' ).hide();
		}
		if ( buttonactive ) $( '#play-group, #share-group, #vol-group' ).show();
		$( '#playback-row' ).removeClass( 'hide' ); // restore - hidden by fix flash
		
		setbutton();
		displaycommon();
	} );
}

// library show/hide blocks
function displaylibrary() {
	var command = { display: [ 'hGetAll', 'display' ] };
	$.post( '/enhanceredis.php', 
		{ json: JSON.stringify( command ) },
		function( data ) {
		displayredis = JSON.parse( data ).display;
		// no 'id'
		$( '#home-blocks div:contains(Network mounts)' ).toggleClass( 'hide', !displayredis.nas );
		$( '#home-usb' ).parent().toggleClass( 'hide', !displayredis.usb );
		$( '#home-webradio' ).parent().toggleClass( 'hide', !displayredis.webradio );
		$( '#home-albums' ).parent().toggleClass( 'hide', !displayredis.albums );
		$( '#home-artists' ).parent().toggleClass( 'hide', !displayredis.artists );
		$( '#home-composer' ).parent().toggleClass( 'hide', !displayredis.composer );
		$( '#home-genre' ).parent().toggleClass( 'hide', !displayredis.genre );
		$( '#home-spotify' ).parent().toggleClass( 'hide', !displayredis.spotify );
		$( '#home-dirble' ).parent().toggleClass( 'hide', !displayredis.dirble );
		$( '#home-jamendo' ).parent().toggleClass( 'hide', !displayredis.jamendo );
		
		displaycommon();
		
		// index height
		setTimeout( function() {
			var panelH = $( '#panel-sx' ).height();
			if ( $( '#menu-top' ).is( ':visible' ) ) {
				var indexoffset = 160;
			} else {
				var indexoffset = 80;
			}
			if ( panelH > 500 ) {
				var indexline = 26;
				$( '.half' ).show();
			} else {
				var indexline = 13;
				$( '.half' ).hide();
			}
			$( '#db-index' ).css( 'line-height', ( panelH - indexoffset ) / indexline +'px' );
		}, 200 );
		window.scrollTo( 0, librarytop );
	} );
}
// queue show/hide menu
function displayqueue() {
	var command = { display: [ 'hGetAll', 'display' ] };
	$.post( '/enhanceredis.php', 
		{ json: JSON.stringify( command ) },
		function( data ) {
		displayredis = JSON.parse( data ).display;
		displaycommon();
		window.scrollTo( 0, queuetop );
	} );
}

function setPlaybackSource() {
	var activePlayer = GUI.libraryhome.ActivePlayer;
	$('#overlay-playsource-open button').text(activePlayer);
	$('#overlay-playsource a').addClass('inactive');
	var source = activePlayer.toLowerCase();
	$('#playsource-' + source).removeClass('inactive');
	
	if ( activePlayer === 'Spotify' || activePlayer === 'Airplay' ) {
//		$( '#volume-knob, #vol-group' ).addClass( 'hide' );
		$( '#single' ).prop( 'disabled' );
	}
	$('#playlist-entries').removeClass(function(index, css) {
		return (css.match (/(^|\s)playlist-\S+/g) || []).join(' ');
	}).addClass('playlist-' + source);
	$('#pl-manage').removeClass(function(index, css) {
		return (css.match (/(^|\s)pl-manage-\S+/g) || []).join(' ');
	}).addClass('pl-manage-' + source);
}

function renderLibraryHome() {
	if ( $( '#database-entries' ).hasClass( 'hide' ) ) return;
	loadingSpinner('db');
	$('#database-entries').addClass('hide');
	$('#db-level-up').addClass('hide');
	$('#db-homeSetup').removeClass('hide').removeClass('btn-primary').addClass('btn-default');
	$('#home-blocks').removeClass('hide');
	var obj = GUI.libraryhome,
		i = 0,
		content = '',
		divOpen = '<div class="col-lg-3 col-md-4 col-sm-6">',
		divClose = '</div>',
		toggleMPD = '',
		toggleSpotify = '',
		notMPD = (obj.ActivePlayer === 'Spotify' || obj.ActivePlayer === 'Airplay');
	if(isLocalHost) {
		content = '';
	} else {
		content = '<div class="col-sm-12"><h1 class="txtmid">Browse your library</h1></div>';
	}
	setPlaybackSource();
	if (notMPD) {
		toggleMPD = ' inactive';
	}
	for (i = 0; (bookmark = obj.bookmarks[i]); i += 1) {
		content += divOpen + '<div id="home-bookmark-' + bookmark.id + '" class="home-block home-bookmark' + toggleMPD + '" data-path="' + bookmark.path + '"><i class="fa fa-star"></i><h3>' + bookmark.name + '</h3>bookmark</div>' + divClose;
	}
	if (chkKey(obj.networkMounts)) {
	    if(isLocalHost) {
			if (obj.networkMounts === 0) {
				if (notMPD) {
					content += divOpen + '<div id="home-nas" class="home-block inactive"><i class="fa fa-sitemap"></i><h3>Network mounts (0)</h3></div>' + divClose;
				} else {
					content += divOpen + '<a class="home-block' + toggleMPD + '" href="/sources/add/"><i class="fa fa-sitemap"></i><h3>Network mounts (0)</h3></a>' + divClose;
				}
			} else {
				content += divOpen + '<div id="home-nas" class="home-block' + toggleMPD + '" data-path="NAS"><i class="fa fa-sitemap"></i><h3>Network mounts (' + obj.networkMounts + ')</h3></div>' + divClose;
			}
		} else {
			if (obj.networkMounts === 0) {
				if (notMPD) {
					content += divOpen + '<div id="home-nas" class="home-block inactive"><i class="fa fa-sitemap"></i><h3>Network mounts (0)</h3>network attached storages</div>' + divClose;
				} else {
					content += divOpen + '<a class="home-block' + toggleMPD + '" href="/sources/add/"><i class="fa fa-sitemap"></i><h3>Network mounts (0)</h3>click to add some</a>' + divClose;
				}
			} else {
				content += divOpen + '<div id="home-nas" class="home-block' + toggleMPD + '" data-path="NAS"><i class="fa fa-sitemap"></i><h3>Network mounts (' + obj.networkMounts + ')</h3>network attached storages</div>' + divClose;
			}
		}
	}
	if (chkKey(obj.localStorages)) {
		if(isLocalHost) {
			if (obj.localStorages === 0) {
				content += '';
			} else {
				content += divOpen + '<div id="home-local" class="home-block' + toggleMPD + '" data-path="LocalStorage"><i class="fa fa-hdd-o"></i><h3>LocalStorage (' + obj.localStorages + ')</h3></div>' + divClose;
			}
		} else {
			if (obj.localStorages === 0) {
				content += '';
			} else {
				content += divOpen + '<div id="home-local" class="home-block' + toggleMPD + '" data-path="LocalStorage"><i class="fa fa-hdd-o"></i><h3>LocalStorage (' + obj.localStorages + ')</h3>locally stored music</div>' + divClose;
			}
		}
	}
	if (chkKey(obj.USBMounts)) {
		if(isLocalHost) {
			if (obj.USBMounts === 0) {
				if (notMPD) {
					content += divOpen + '<div id="home-usb" class="home-block inactive"><i class="fa fa-hdd-o"></i><h3>USB storage (0)</h3></div>' + divClose;
				} else {
					content += divOpen + '<a id="home-usb" class="home-block' + toggleMPD + '" href="/sources"><i class="fa fa-hdd-o"></i><h3>USB storage (0)</h3></a>' + divClose;
				}
			} else {
				content += divOpen + '<div id="home-usb" class="home-block' + toggleMPD + '" data-path="USB"><i class="fa fa-hdd-o"></i><h3>USB storage (' + obj.USBMounts + ')</h3></div>' + divClose;
			}
		} else {
			if (obj.USBMounts === 0) {
				if (notMPD) {
					content += divOpen + '<div id="home-usb" class="home-block inactive"><i class="fa fa-hdd-o"></i><h3>USB storage (0)</h3>no USB storage plugged</div>' + divClose;
				} else {
					content += divOpen + '<a id="home-usb" class="home-block' + toggleMPD + '" href="/sources"><i class="fa fa-hdd-o"></i><h3>USB storage (0)</h3>no USB storage plugged</a>' + divClose;
				}
			} else {
				content += divOpen + '<div id="home-usb" class="home-block' + toggleMPD + '" data-path="USB"><i class="fa fa-hdd-o"></i><h3>USB storage (' + obj.USBMounts + ')</h3>USB attached drives</div>' + divClose;
			}
		}
	}
    if (chkKey(obj.webradio)) {
		if (obj.webradio === 0) {
			if (notMPD) {
				content += divOpen +'<div id="home-webradio" class="home-block inactive"><i class="fa fa-microphone"></i><h3>My Webradios (0)</h3>'+ ( isLocalHost ? '' : 'webradio local playlists' ) +'</div>'+ divClose;
			} else {
				content += divOpen +'<div id="home-webradio" class="home-block'+ toggleMPD +'" href="#" data-toggle="modal" data-target="#modal-webradio-add"><i class="fa fa-microphone"></i><h3>My Webradios (0)</h3>'+ ( isLocalHost ? '' : 'click to add some' ) +'</div>'+ divClose;
			}
		} else {
			content += divOpen +'<div id="home-webradio" class="home-block'+ toggleMPD +'" data-path="Webradio"><i class="fa fa-microphone"></i><h3>My Webradios ('+ obj.webradio +')</h3>'+ ( isLocalHost ? '' : 'webradio local playlists' ) +'</div>'+ divClose;
		}
    }
	content += divOpen + '<div id="home-albums" class="home-block' + toggleMPD + '" data-path="Albums" data-browsemode="album"><i class="fa fa-dot-circle-o"></i><h3>Albums</h3>'+ ( isLocalHost ? '' : 'browse MPD database by album' ) +'</div>' + divClose;
	content += divOpen + '<div id="home-artists" class="home-block' + toggleMPD + '" data-path="Artists" data-browsemode="artist"><i class="fa fa-users"></i><h3>Artists</h3>'+ ( isLocalHost ? '' : 'browse MPD database by artist' ) +'</div>' + divClose;
	content += divOpen + '<div id="home-composer" class="home-block' + toggleMPD + '" data-path="Composer" data-browsemode="composer"><i class="fa fa-user"></i><h3>Composer</h3>'+ ( isLocalHost ? '' : 'browse MPD database by composer' ) +'</div>' + divClose;
	content += divOpen + '<div id="home-genre" class="home-block' + toggleMPD + '" data-path="Genres" data-browsemode="genre"><i class="fa fa-tags"></i><h3>Genres</h3>'+ ( isLocalHost ? '' : 'browse MPD database by genre' ) +'</div>' + divClose;
	if (chkKey(obj.Spotify)) {
		if(isLocalHost) {
			if (obj.Spotify === '0') {
				//content += divOpen + '<a id="home-spotify" class="home-block' + toggleSpotify + '" href="/settings/#features-management"><i class="fa fa-spotify"></i><h3>Spotify<span id="home-count-spotify"></span></h3></a>' + divClose;
			} else {
				if (obj.ActivePlayer !== 'Spotify') {
					content += divOpen + '<div id="home-spotify-switch" class="home-block"><i class="fa fa-spotify"></i><h3>Spotify</h3></div>' + divClose;
				} else {
					content += divOpen + '<div id="home-spotify" class="home-block' + toggleSpotify + '" data-plugin="Spotify" data-path="Spotify"><i class="fa fa-spotify"></i><h3>Spotify</div>' + divClose;
				}
			}
		} else {
			if (obj.Spotify === '0') {
				//content += divOpen + '<a id="home-spotify" class="home-block' + toggleSpotify + '" href="/settings/#features-management"><i class="fa fa-spotify"></i><h3>Spotify<span id="home-count-spotify"></span></h3>click to configure</a>' + divClose;
			} else {
				if (obj.ActivePlayer !== 'Spotify') {
					content += divOpen + '<div id="home-spotify-switch" class="home-block"><i class="fa fa-spotify"></i><h3>Spotify</h3>click to switch renderer</div>' + divClose;
				} else {
					content += divOpen + '<div id="home-spotify" class="home-block' + toggleSpotify + '" data-plugin="Spotify" data-path="Spotify"><i class="fa fa-spotify"></i><h3>Spotify</h3>music for everyone</div>' + divClose;
				}
			}
		}
	}
	if (chkKey(obj.Dirble)) {
		if(isLocalHost) {
			content += divOpen + '<div id="home-dirble" class="home-block' + toggleMPD + '" data-plugin="Dirble" data-path="Dirble"><i class="fa fa-globe"></i><h3>Dirble</h3></div>' + divClose;
		} else {
			content += divOpen + '<div id="home-dirble" class="home-block' + toggleMPD + '" data-plugin="Dirble" data-path="Dirble"><i class="fa fa-globe"></i><h3>Dirble</h3>radio stations open directory</div>' + divClose;
		}
	}
	if(isLocalHost) {
		content += divOpen + '<div id="home-jamendo" class="home-block' + toggleMPD + '" data-plugin="Jamendo" data-path="Jamendo"><i class="fa fa-play-circle-o"></i><h3>Jamendo<span id="home-count-jamendo"></span></h3></div>' + divClose;
	} else {
		content += divOpen + '<div id="home-jamendo" class="home-block' + toggleMPD + '" data-plugin="Jamendo" data-path="Jamendo"><i class="fa fa-play-circle-o"></i><h3>Jamendo<span id="home-count-jamendo"></span></h3>world\'s largest platform for free music</div>' + divClose;
	}

	content += '</div>';
	document.getElementById('home-blocks').innerHTML = content;
	loadingSpinner('db', 'hide');
	$('span', '#db-currentpath').html('');
// hide breadcrumb, index bar, edit bookmark
	GUI.currentDBpos[ 10 ] = 0;
	$( '#db-currentpath, #db-index, #db-level-up, #db-webradio-add, #db-homeSetup' ).addClass( 'hide' );
	displaylibrary();
	
	$( '.home-bookmark' ).each( function() {
		var $this = $( this );
		var $hammerbookmark = new Hammer( this );
		$hammerbookmark.on( 'press', function( e ) {
			$( '#home-blocks' ).css( 'pointer-events', 'none' );
			$( '#db-homeSetup' ).click();
			setTimeout( function() {
				$( '#home-blocks' ).css( 'pointer-events', 'auto' );
			}, 500 );
			e.stopPropagation();
		}).on( 'tap', function( e ) { // fix bookmark breadcrumb
			GUI.currentDBpos[ 10 ] = $this.attr( 'data-path' ).match( /\//g ).length + 2;
			if ( e.target.className == 'block-remove' ) {
				setTimeout( function() {
					$this.parent().remove();
				}, 100 );
			}
			e.stopPropagation();
		});
	});
}

function renderPlaylists(data){
	var content = '', playlistname = '';
	var i, line, lines=data.split('\n'), infos=[];
	for (i = 0; (line = lines[i]); i += 1 ) {
		infos = line.split(': ');
		if( 'playlist' === infos[0] ) {
			playlistname = infos[1];
			content += '<li class="pl-folder" data-path="' + playlistname + '"><i class="fa fa-bars pl-action" data-target="#context-menu-playlist" data-toggle="context" title="Actions"></i><span><i class="fa fa-list-ol"></i>' + playlistname + '</span></li>';
			playlistname = '';
		}
	}
	document.getElementById('playlist-entries').innerHTML = '';
	$('.playlist').addClass('hide');
	$('#pl-manage').addClass('hide');
	$('#pl-count').addClass('hide');
	$('#pl-filter-results').removeClass('hide').addClass('back-to-queue').html('<i class="fa fa-arrow-left sx"></i> to queue');
	$('#pl-currentpath').removeClass('hide');
	$('#pl-editor').removeClass('hide');
	document.getElementById('pl-editor').innerHTML = content;
	loadingSpinner('pl', 'hide');
// hide 'to queue' text and 'pl-manage li' click context menu
	$( '#pl-filter-results' ).html( '<i class="fa fa-arrow-left sx"></i>' );
	$( '#pl-editor li' ).click( function( e ) {
		e.stopPropagation();
		var clickX = e.pageX + 5;
		if ( window.innerWidth > 500 ) {
			var positionX = clickX < 250 ? clickX : clickX - 255;
		} else {
			var positionX = window.innerWidth - 295;
		}
		GUI.DBentry[0] = $( this ).attr( 'data-path' );
		$( '#context-menu-playlist' ).addClass( 'open' ).css( {
			position: 'absolute',
			top: $( this ).position().top +'px',
			left: positionX +'px'
		} );
	} );
	$( '#panel-dx, #context-menu-playlist' ).click( function() {
		if ( $( '#context-menu-playlist' ).hasClass( 'open' ) ) $( '#context-menu-playlist' ).removeClass( 'open' );
	} );
}

function parseResponse(options) {
	var inputArr = options.inputArr || '',
		respType = options.respType || '',
		i = options.i || 0,
		inpath = options.inpath || '',
		querytype = options.querytype || '',
		content = '';
	
	switch (respType) {
		case 'playlist':
			// code placeholder
		break;
		case 'db':
			if (GUI.browsemode === 'file') {
				if (inpath === '' && inputArr.file !== undefined) {
					inpath = parsePath(inputArr.file);
				}
				if (inputArr.file !== undefined || inpath === 'Webradio') {
					content = '<li id="db-' + (i + 1) + '" data-path="';
					if (inputArr.Title !== undefined) {
						content += inputArr.file;
						content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
						content += inputArr.Title + '<span>' + converthms(inputArr.Time) + '</span></span>';
						content += ' <span class="bl">';
						content +=  inputArr.Artist;
						content += ' - ';
						content +=  inputArr.Album;
					} else {
						if (inpath !== 'Webradio') {
							content += inputArr.file;
							content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
							content += inputArr.file.replace(inpath + '/', '') + ' <span>' + converthms(inputArr.Time) + '</span></span>';
							content += '<span class="bl">';
							content += ' path: ';
							content += inpath;
						} else {
							content += inputArr.playlist;
							content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-webradio"></i><i class="fa fa-microphone db-icon db-radio"></i>';
							content += '<span class="sn">' + inputArr.playlist.replace(inpath +'/', '').replace('.'+ inputArr.fileext, '');
							content += '</span><span class="bl">'+ inputArr.url;
						}
					}
					content += '</span></li>';
				} else if (inputArr.playlist !== undefined) {
					if (inputArr.fileext === 'cue') {
						content = '<li id="db-' + (i + 1) + '" data-path="';
						content += inputArr.playlist;
						content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-file-text db-icon"></i><span class="sn">';
						content += inputArr.playlist.replace(inpath + '/', '') + ' <span>[CUE file]</span></span>';
						content += '<span class="bl">';
						content += ' path: ';
						content += inpath;
						content += '</span></li>';
					}
				} else {
					content = '<li id="db-' + (i + 1) + '" class="db-folder" data-path="';
					content += inputArr.directory;
					if (inpath !== '') {
						content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu"></i><span><i class="fa fa-folder-open"></i>'
					} else {
						content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-root"></i><i class="fa fa-hdd-o icon-root"></i><span>';
					}
					content += inputArr.directory.replace(inpath + '/', '');
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'album' || GUI.browsemode === 'albumfilter') {
				if (inputArr.file !== undefined) {
					content = '<li id="db-' + (i + 1) + '" data-path="';
					content += inputArr.file;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
					content += inputArr.Title + '<span>' + converthms(inputArr.Time) + '</span></span>';
					content += ' <span class="bl">';
					content +=  inputArr.Artist;
					content += ' - ';
					content +=  inputArr.Album;
					content += '</span></li>';
				} else if (inputArr.album !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-album" data-path="';
					content += inputArr.album.replace(/\"/g,'&quot;');
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-album"></i><span><i class="fa fa-dot-circle-o"></i>';
					content += inputArr.album;
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'artist') {
				if (inputArr.album !== undefined) {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-album" data-path="';
					content += inputArr.album;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-album"></i><span><i class="fa fa-dot-circle-o"></i>';
					content += (inputArr.album !== '') ? inputArr.album : 'Unknown album';
					content += '</span></li>';
				} else if (inputArr.artist !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-artist" data-path="';
					content += inputArr.artist;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-artist"></i><span><i class="fa fa-user"></i>';
					content += inputArr.artist;
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'composer') {
				if (inputArr.file !== undefined) {
					content = '<li id="db-' + (i + 1) + '" data-path="';
					content += inputArr.file;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
					content += inputArr.Title + '<span>' + converthms(inputArr.Time) + '</span></span>';
					content += ' <span class="bl">';
					content +=  inputArr.Artist;
					content += ' - ';
					content +=  inputArr.Album;
					content += '</span></li>';
				} else if (inputArr.composer !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-composer" data-path="';
					content += inputArr.composer;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-composer"></i><span><i class="fa fa-user"></i>';
					content += inputArr.composer;
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'genre') {
				if (inputArr.artist !== undefined) {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-artist" data-path="';
					content += inputArr.artist;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-artist"></i><span><i class="fa fa-dot-circle-o"></i>';
					content += (inputArr.artist !== '') ? inputArr.artist : 'Unknown artist';
					content += '</span></li>';
				} else if (inputArr.genre !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-genre" data-path="';
					content += inputArr.genre;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-genre"></i><span><i class="fa fa-tags"></i>';
					content += inputArr.genre;
					content += '</span></li>';
				}
			}
		break;
		case 'Spotify':
			if (querytype === '') {
				content = '<li id="db-' + (i + 1) + '" class="db-spotify db-folder" data-path="';
				content += inputArr.index;
				content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-spotify-pl"></i><span><i class="fa fa-folder-open"></i>'
				content += (inputArr.name !== '') ? inputArr.name : 'Favorites';
				content += ' (';
				content += inputArr.tracks;
				content += ')</span></li>';
			} else if (querytype === 'tracks') {
				content = '<li id="db-' + (i + 1) + '" class="db-spotify" data-path="';
				content += inputArr.index;
				content += '" data-plid="';
				content += inpath;
				content += '" data-type="spotify-track"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-spotify"></i><i class="fa fa-spotify db-icon"></i><span class="sn">';
				content += inputArr.Title + '<span>' + converthms(inputArr.duration/1000) + '</span></span>';
				content += ' <span class="bl">';
				content +=  inputArr.artist;
				content += ' - ';
				content +=  inputArr.album;
				content += '</span></li>';
			}
		break;
		case 'Dirble':
			if (querytype === '' || querytype === 'childs') {
				var childClass = (querytype === 'childs') ? ' db-dirble-child' : '';
				content = '<li id="db-' + (i + 1) + '" class="db-dirble db-folder' + childClass + '" data-path="';
				content += inputArr.id;
				content += '"><span><i class="fa fa-folder-open"></i>'
				content += inputArr.title;
				content += '</span></li>';
			} else if (querytype === 'search' || querytype === 'stations' || querytype === 'childs-stations') {
				if (inputArr.streams.length === 0) {
					break; // Filter stations with no streams
				}
				content = '<li id="db-' + (i + 1) + '" class="db-dirble db-radio" data-path="';
				content += inputArr.name + ' | ' + inputArr.streams[0].stream;
				content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-dirble"></i><i class="fa fa-microphone db-icon"></i>';
				content += '<span class="sn">' + inputArr.name + '<span>(' + inputArr.country + ')</span></span>';
				content += '<span class="bl">';
				content += inputArr.website ? inputArr.website : '-no website-';
				content += '</span></li>';
			}
		break;
		case 'Jamendo':
				content = '<li id="db-' + (i + 1) + '" class="db-jamendo db-folder" data-path="';
				content += inputArr.stream;
				content += '"><img class="jamendo-cover" src="/tun/' + inputArr.image + '" alt=""><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i>';
				content += inputArr.dispname + '</div></li>';
		break;
	}
	return content;
}

function populateDB(options) {
	var data = options.data || '',
		path = options.path || '',
		uplevel = options.uplevel || 0,
		keyword = options.keyword || '',
		plugin = options.plugin || '',
		querytype = options.querytype || '',
		args = options.args || '',
		content = '',
		$databaseentries = document.getElementById('database-entries'),
		i = 0,
		row = [];

	if (plugin !== '') {
		if (plugin === 'Spotify') {
			$('#database-entries').removeClass('hide');
			$('#db-level-up').removeClass('hide');
			$('#home-blocks').addClass('hide');
			if (path) {
				GUI.currentpath = path;
			}
			$databaseentries.innerHTML = '';
			data = (querytype === 'tracks') ? data.tracks : data.playlists;
// ****************************************************************************************
// sorting
			data.sort( function( a, b ) {
				if ( path === 'Spotify' && querytype === '' ) {
					return a[ 'name' ].localeCompare( b[ 'name' ] )
				} else if ( querytype === 'tracks' ) {
					return a[ 'title' ].localeCompare( b[ 'title' ] )
				} else {
					return 0;
				}
			});
// ****************************************************************************************
			for (i = 0; (row = data[i]); i += 1) {
				content += parseResponse({
					inputArr: row,
					respType: 'Spotify',
					i: i,
					querytype: querytype,
					inpath: args
				});
			}
			$databaseentries.innerHTML = content;
		}
		if (plugin === 'Dirble') {
			$('#database-entries').removeClass('hide');
			$('#db-level-up').removeClass('hide');
			$('#home-blocks').addClass('hide');
			if (path) {
				if (querytype === 'search') {
					GUI.currentpath = 'Dirble';
				} else {
					GUI.currentpath = path;
				}
			}
			if (querytype === 'childs-stations') {
				content = $databaseentries.innerHTML;
			} else {
				$databaseentries.innerHTML = '';
			}            
// ****************************************************************************************
// sorting
			data.sort( function( a, b ) {
				if ( querytype === 'childs' || querytype === 'categories' ) {
					return a[ 'title' ].localeCompare( b[ 'title' ] )
				} else if ( querytype === 'childs-stations' || querytype === 'stations' ) {
					return a[ 'name' ].localeCompare( b[ 'name' ] )
			   } else {
					return 0;
				}
			});
// ****************************************************************************************
			for (i = 0; (row = data[i]); i += 1) {
				content += parseResponse({
					inputArr: row,
					respType: 'Dirble',
					i: i,
					querytype: querytype
				});
			}
			$databaseentries.innerHTML = content;
		}
		if (plugin === 'Jamendo') {
			$('#database-entries').removeClass('hide');
			$('#db-level-up').removeClass('hide');
			$('#home-blocks').addClass('hide');
			if (path) {
				GUI.currentpath = path;
			}
			$databaseentries.innerHTML = '';
// ****************************************************************************************
// sorting
			data.sort( function( a, b ) {
				if ( path === 'Jamendo' && querytype === '' ) {
					return a[ 'dispname' ].localeCompare( b[ 'dispname' ] )
				} else {
					return 0;
				}
			});
// ****************************************************************************************
			for (i = 0; (row = data[i]); i += 1) {
				content += parseResponse({
					inputArr: row,
					respType: 'Jamendo',
					i: i,
					querytype: querytype
				});
			}
			$databaseentries.innerHTML = content;
		}
	} else {
	// normal MPD browsing
		if (path === '' && keyword === '') {
			renderLibraryHome();
			return;
		} else {
		// browsing
			$('#database-entries').removeClass('hide');
// ****************************************************************************************
// show breascrumb and index bar
			$( '#db-currentpath, #db-level-up' ).removeClass( 'hide' );
// ****************************************************************************************
			$('#home-blocks').addClass('hide');
			if (path) {
				GUI.currentpath = path;
			}
			$databaseentries.innerHTML = '';
			if (keyword !== '') {
			// search results
				var results = (data.length) ? data.length : '0';
				var s = (data.length === 1) ? '' : 's';
// ****************************************************************************************
// hide breascrumb and index bar
				$( '#db-currentpath, #db-index' ).addClass( 'hide' );
				$( '#database-entries' ).css( 'width', '100%' );
				$( '#db-search-results' ).removeClass( 'hide' ).html( '<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span><span class="hidden-xs">' + results + ' result' + s + ' for "<span class="keyword">' + keyword + '</span>"</span>' );
			}
// sorting
			data.sort( function( a, b ) {
				if ( path === 'Albums' ) {
					prop = 'album';
				} else if ( path === 'Artists' || path === 'AlbumArtists'|| path === 'Various Artists' ) {
					prop = 'artist';
				} else if ( path === 'Genres' ) {
					prop = 'genre';
				} else if ( path === 'Webradio' ) {
					prop = 'playlist';
				} else {
					prop = 'directory';
				}
				
				if ( a[ prop ] === undefined ) {
					if ( GUI.browsemode === 'artist' ) {
						prop = 'album';
					} else if ( GUI.browsemode === 'genre' ) {
						prop = 'artist';
					} else {
						prop = 'file';
					}
				}
				return a[ prop ].localeCompare( b[ prop ] );
			});
			for (i = 0; (row = data[i]); i += 1) {
				content += parseResponse({
					inputArr: row,
					respType: 'db',
					i: i,
					inpath: path
				});
			}
			$databaseentries.innerHTML = content;
			setTimeout( function() {
				window.scrollTo( 0, 0 );
			}, 100 );
			if ( path === 'Webradio' ) {
// breadcrumb replace - modify add webradio button
				$( '#db-level-up' ).addClass( 'hide' );
				$( '#db-webradio-add' ).removeClass( 'hide' ).click( function() {
						$( '#modal-webradio-add' ).modal();
				} );
			} else {
				$( '#db-level-up' ).removeClass( 'hide' );
				$( '#db-webradio-add' ).addClass( 'hide' );
// ****************************************************************************************
			}
		}
	}
	var breadcrumb = $('span', '#db-currentpath');
	if (GUI.browsemode === 'album') {
		if (path === 'Albums') {
			breadcrumb.html('ALBUMS');
		} else {
			breadcrumb.html('ALBUMS / ' + path);
		}
	} else if (GUI.browsemode === 'artist') {
		if (path === 'Artists') {
			breadcrumb.html('ARTISTS');
		} else {
			breadcrumb.html('ARTISTS / ' + path);
		}
	} else if (GUI.browsemode === 'genre') {
		if (path === 'Genres') {
			breadcrumb.html('GENRES');
		} else {
			breadcrumb.html('GENRES / ' + path);
		}
	} else {
// ****************************************************************************************
// breadcrumb add - library directory path link
		var folder = path.split( '/' );
		var folderPath = '';
		var folderCrumb = '';
		for ( i = 0; i < folder.length; i++ ) {
			if ( i !== 0 ) {
				folderPath += '/';
				folderCrumb += ' / ';
			}
			folderPath += folder[ i ];
			folderCrumb += '<a data-path="'+ folderPath +'">'+ folder[ i ] +'</a>';
		}
		breadcrumb.html( folderCrumb );
// ****************************************************************************************
	}
	
	if (uplevel) {
		var position = GUI.currentDBpos[GUI.currentDBpos[10]];
		$('#db-' + position).addClass('active');
		customScroll('db', position, 0);
	} else {
		customScroll('db', 0, 0);
	}
	if (querytype != 'childs') {
		loadingSpinner('db', 'hide');
	}
	
	if ( $( '#database-entries' ).find( 'li' ).eq( 0 ).hasClass( 'db-folder' ) ) {
		$('#db-index').removeClass('hide');
		$('#database-entries').css('width', 'calc( 100% - 38px )');
	} else {
		$('#db-index').addClass('hide');
		$('#database-entries').css('width', '100%');
	}

}
function getPlaylistPlain( data ) {
	var current = parseInt( GUI.json.song ) + 1;
	var state = GUI.json.state;
	var content = bottomline = classcurrent = classradio = hidetotal = '';
	var id = totaltime = playlisttime = pos = i = 0;
	var json = JSON.parse(data);
	var ilength = json.length;
	for ( i = 0; i < ilength; i++ ) {
		var data = json[ i ];
		if ( data[ 'file' ].slice( 0, 4 ) === 'http' ) {
			classradio = ' radio';
			topline = data[ 'Title' ];
			bottomline = data[ 'file' ];
			hidetotal = ' class="hide"';
		} else {
			time = parseInt( data[ 'Time' ] );
			topline = ( data[ 'Title' ] ? data[ 'Title' ] : data[ 'file' ].split( '/' ).pop() ) +'<span>'+ converthms( time ) +'</span>';
			bottomline = data[ 'Artist' ] ? data[ 'Artist' ] + ' - ' + data[ 'Album' ] : data[ 'file' ];
			playlisttime += time;
		}
		pos++;
		classcurrent = ( state !== 'stop' && pos === current ) ? 'active' : '';
		cl = ' class="'+ classcurrent + classradio +'"';
		cl = ( classcurrent || classradio ) ? cl : '';
		content += '<li id="pl-'+ data[ 'Id' ] +'"'+ cl +'>'
			+'<i class="fa fa-times-circle pl-action" title="Remove song from playlist"></i><span class="sn">'+ topline +'</span>'
			+'<span class="bl">'+ bottomline +'</span>'
			+'</li>';
		classcurrent = classradio = '';
	}
	$( '.playlist' ).addClass( 'hide' );
	$( '#playlist-entries' ).html( content ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
	$( '#pl-filter-results' ).addClass( 'hide' ).html( '' );
	$( '#pl-manage, #pl-count' ).removeClass( 'hide' );
	$( '#pl-count' ).html( 'List: <a>'+ pos +'</a><span'+ hidetotal +'> &#8226; <a>'+ converthms( playlisttime ) +'</a></span>' );
}
function getPlaylistCmd(){
	if ( GUI.json.playlistlength == 0 ) {
		$('.playlist, #pl-filter-results').addClass('hide');
		$('#playlist-warning, #pl-count').removeClass('hide');
		$('#pl-filter-results, #pl-count').html('');
		return;
	}
	loadingSpinner('pl');
	$.ajax({
		url: '/db/?cmd=playlist',
		success: function(data){
			if ( data.length > 4) {
				$('.playlist').addClass('hide');
				$('#playlist-entries').removeClass('hide');
				getPlaylistPlain(data);
				
				var current = parseInt(GUI.json.song);
				if ($('#panel-dx').hasClass('active') && GUI.currentsong !== GUI.json.currentsong) {
					customScroll('pl', current, 200); // highlight current song in playlist
				}
			} else {
				$('.playlist').addClass('hide');
				$('#playlist-warning').removeClass('hide');
				$('#pl-filter-results').addClass('hide').html('');
				$('#pl-count').removeClass('hide').html('');
			}
			loadingSpinner('pl', 'hide');
		},
		cache: false
	});
}

prevnext = 0; // for disable 'btn-primary' - previous/next while stop
function commandButton( el ) {
	var dataCmd = el.data( 'cmd' );
	if ( el.hasClass( 'btn-toggle' ) ) {
		if ( GUI.stream === 'radio' ) return;
		
		onsetmode = 1;
		setTimeout( function() {
			onsetmode = 0;
		}, 500 );
		
		dataCmd = dataCmd + ( el.hasClass( 'btn-primary' ) ? ' 0' : ' 1' );    
	} else {
		if ( dataCmd === 'play' ) {
			if ( GUI.json.file.slice( 0, 4 ) === 'http' ) {
				dataCmd = ( GUI.state === 'play' ) ? 'stop' : 'play';
			} else {
				dataCmd = ( GUI.state === 'play' ) ? 'pause' : 'play';
			}
		}
		if ( dataCmd === 'pause' || dataCmd === 'stop' ) {
			if ( GUI.json.file.slice( 0, 4 ) === 'http' ) $( '#currentsong' ).html( '&nbsp;' );
			clearInterval( GUI.currentKnob );
			clearInterval( GUI.countdown );
		} else if ( dataCmd === 'previous' || dataCmd === 'next' ) {
			// enable previous / next while stop
			if ( GUI.json.playlistlength == 1 ) return;
			prevnext = 1;
			var current = parseInt( GUI.json.song ) + 1;
			var last = parseInt( GUI.json.playlistlength );
			
			if ( GUI.state === 'play' ) {
				var mpcstop = '';
			} else {
				var mpcstop = '; /usr/bin/mpc stop';
				$( '#pause' ).removeClass( 'btn-primary' );
				$( '#stop' ).addClass( 'btn-primary' );
			}
			
			if ( GUI.json.random == 1 ) {
				// improve: repeat pattern of mpd random
				var pos = Math.floor( Math.random() * last ) + 1;
				if ( pos === current ) pos = Math.floor( Math.random() * last ) + 1;
			} else {
				if ( dataCmd === 'previous' ) {
					var pos = current !== 1 ? current - 1 : last;
				} else {
					var pos = current !== last ? current + 1 : 1;
				}
			}
			$( '#format-bitrate' ).html( '' );
			$.post( '/enhanceredis.php', { bash: '/usr/bin/mpc play '+ pos + mpcstop }, function() {
				setTimeout( function() {
//					if ( GUI.json.file.slice( 0, 4 ) === 'http' ) $( '#format-bitrate' ).html( '&nbsp;' );
					prevnext = 0;
				}, 500 );
			});
			return
		}
	}
	sendCmd( dataCmd );
}

// buttons and playlist
function setbutton() {
	var state = GUI.state;
	
	if ( GUI.json.updating_db !== undefined ) {
		$( '#open-panel-sx a' ).html( '<i class="fa fa-refresh fa-spin"></i>' );
	} else {
		$( '#open-panel-sx a' ).html( '<i class="fa fa-folder-open"></i>' );
	}
	
	if ( $( '#play-group' ).is( ':visible' ) ) {
		$( '#repeat' ).toggleClass( 'btn-primary', GUI.json.repeat === '1' );
		$( '#random' ).toggleClass( 'btn-primary', GUI.json.random === '1' );
		$( '#single' ).toggleClass( 'btn-primary', GUI.json.single === '1' );
	}
	
	if ( prevnext === 1 ) return; // disable for previous/next while stop
	
	if ( state === 'stop' ) {
		$( '#stop' ).addClass( 'btn-primary' );
		$( '#play, #pause' ).removeClass( 'btn-primary' );
		if ( $( '#pause' ).hasClass( 'hide' ) ) $( '#play i' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
	} else {
		if ( state === 'play' ) {
			$( '#play' ).addClass( 'btn-primary' );
			$( '#stop' ).removeClass( 'btn-primary' );
			if ( $( '#pause' ).hasClass( 'hide' ) ) {
				$( '#play i' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
			} else {
				$( '#pause' ).removeClass( 'btn-primary' );
			}
		} else if ( state === 'pause' ) {
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

// volume, sampling, time
onsetmode = 0;
function settime() {
	$.post( '/enhanceredis.php', { bash: '/srv/http/enhancestatus.sh' }, function( data ) {
		var status = JSON.parse( data );
		// volume
		$volumetransition.css( 'transition-duration', '0s' ); // suppress initial rotate animation
		$volumeRS.setValue( status.volume );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		$volumetooltip.show(); // show after 'setValue'
		$volumehandle.show();
		$volumetransition.css( 'transition', '' );           // reset animation to default
		if ( $( '#vol-group' ).is( ':visible' ) ) {
			if ( status.volumemute != 0 ) {
				mutecolor( status.volumemute );
			} else {
				unmutecolor();
			}
		}
		
		// set mode buttons
		if ( onsetmode ) return;

		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		$( '#time' ).roundSlider( 'setValue', 0 );
		
		// empty queue
		if ( GUI.json.playlistlength == 0 ) return;
		
		// sampling
		var dot0 = '<a id="dot0" style="color:#ffffff"> &#8226; </a>';
		// streaming
//		if ( GUI.json.file.slice( 0, 4 ) === 'http' || GUI.libraryhome.ActivePlayer === 'Airplay' || GUI.libraryhome.ActivePlayer === 'Spotify' ) {
		if ( GUI.json.file.slice( 0, 4 ) === 'http' ) {
			$( '#currentartist' ).html( status.artist );
			$( '#currentsong' ).html( GUI.state !== 'stop' ? status.song : '&nbsp;' );
			$( '#currentalbum' ).html( '<a>'+ GUI.json.file +'</a>' );
			$( '#cover-art' ).css( 'background-image', 'url("assets/img/cover-radio.jpg")' );
			
			var sampling = $( '#format-bitrate' ).html();
			if ( sampling === '' || sampling === '&nbsp;' ) $( '#format-bitrate' ).html( dot0 + status.sampling );
			$( '#elapsed' ).html( GUI.state === 'play' ? '<a class="dot">.</a> <a class="dot dot2">.</a> <a class="dot dot3">.</a>' : '' );
			$( '#total' ).text( '' );
			return;
		}
		
		var dot = dot0.replace( ' id="dot0"', '' );
		var ext = ( status.ext !== 'radio' ) ? dot + status.ext : '';
		$( '#format-bitrate' ).html( dot0 + status.sampling + ext );
		// time
		time = +status.time;
		$( '#total' ).text( converthms( time ) );
		// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		if ( $( '#time-knob' ).hasClass( 'hide' ) ) return;
		if ( status.state === 'stop' ) {
			$( '#elapsed' ).text( $( '#total' ).text() ).css( 'color', '##587ca0' );
			$( '#total' ).text( '' );
			return;
		} else {
			$( '#elapsed, #total' ).css( 'color', '' );
		}
		
		var elapsed = status.elapsed;
		var position = Math.round( 1000 * elapsed / time );
		$( '#time' ).roundSlider( 'setValue', position );
		$( '#elapsed' ).text( converthms( elapsed ) );
		// pause <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		if ( status.state === 'pause' ) {
			$( '#elapsed' ).css( 'color', '#0095d8' );
			$( '#total' ).css( 'color', '#e0e7ee' );
			return;
		} else {
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
				$( '#elapsed' ).text( '' );
				settime();
			}
			$( '#time' ).roundSlider( 'setValue', position );
		}, time );
		
		GUI.countdown = setInterval( function() {
			elapsed++
			mmss = converthms( elapsed );
			$( '#elapsed' ).text( mmss );
		}, 1000 );
	} );
}
function converthms( second ) {
	var hh = Math.floor( second / 3600 );
	var mm = Math.floor( ( second % 3600 ) / 60 );
	var ss = second % 60;
	
	hh = hh ? hh +':' : '';
	mm = hh ? ( mm > 9 ? mm +':' : '0'+ mm +':' ) : ( mm ? mm +':' : '' );
	ss = mm ? ( ss > 9 ? ss : '0'+ ss ) : ss;
	return ss ? hh + mm + ss : '';
}

// song info
function setinfo() {
	// empty queue
	if ( GUI.json.playlistlength == 0 ) {
		$( '.playback-controls' ).css( 'visibility', 'hidden' );
		$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
		$( '#currentartist, #format-bitrate, #total' ).html( '&nbsp;' );
		$( '#currentsong' ).html( '<i class="fa fa-plus-circle"></i>' );
		$( '#currentalbum' ).html( '&nbsp;' );
		$( '#playlist-position span' ).html( 'Add something from Library' );
		$( '#elapsed, #total' ).html( '&nbsp;' );
		$( '#cover-art' ).css( 'background-image', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' );
		return;
	}
	
	if ( GUI.json.playlistlength !== '0' ) {
		if ( GUI.json.file.slice( 0, 4 ) !== 'http' ) { // webradio set in 'settime()'
			$( '#currentartist' ).html( GUI.json.currentartist ? GUI.json.currentartist : '&nbsp;' );
			$( '#currentsong' ).html( GUI.json.currentsong ? GUI.json.currentsong : '&nbsp;' );
			$( '#currentalbum').html( GUI.json.currentalbum ? GUI.json.currentalbum : '&nbsp;' );
		}
		
		if ( GUI.json.song ) {
			$( '#playlist-position span' ).html( ( parseInt( GUI.json.song ) + 1 ) +'/'+ GUI.json.playlistlength );
		} else {
			$( '#playlist-position span' ).html( '&nbsp;' );
		}
	}
	
	var currentalbumstring = GUI.json.currentartist +' - '+ GUI.json.currentalbum;
	// song changed
	if ( GUI.currentsong !== GUI.json.currentsong || GUI.currentalbum !== currentalbumstring ) {
		GUI.currentsong = GUI.json.currentsong;
		// scroll info text
		$( '#divartist, #divsong, #divalbum' ).each( function() {
			if ( $( this ).find( 'span' ).width() > Math.floor( window.innerWidth * 0.975 ) ) {
				$( this ).addClass( 'scroll-left' );
			} else {
				$( this ).removeClass( 'scroll-left' );
			}
		} );
		
		$( '#playlist-entries li ' ).removeClass( 'active' );
		$( '#playlist-entries' ).find( 'li' ).eq( parseInt( GUI.json.song ) ).addClass( 'active' );
		
		if ( $( '#lyricscontainer' ).length && $( '#lyricscontainer' ).is( ':visible' ) )  getlyrics();
	}

	// album changed
	if ( GUI.currentalbum === currentalbumstring || $( '#coverart' ).hasClass( 'hide' ) ) return;
	
	GUI.currentalbum = currentalbumstring;
	if ( GUI.json.file.slice( 0, 4 ) !== 'http' ) {
		var covercachenum = Math.floor( Math.random() * 1001 );
		$( '#cover-art' ).css( 'background-image', 'url("/coverart/?v=' + covercachenum + '")' );
	} else {
		$( '#cover-art' ).css( 'background-image', 'url("assets/img/cover-radio.jpg")' );
	}
}

// ### called by backend socket - force refresh all clients ###
// rendrUI() > updateGUI() > refreshState()
function renderUI( text ) {
	toggleLoader( 'close' );
	if ( !$('#section-index' ).length || onsetvolume ) return;
	
	GUI.json = text[ 0 ];
	GUI.state = GUI.json.state;
	
	setinfo();
	settime();
	if ( $( '#playback' ).hasClass( 'active' ) ) displayplayback();
	
	if ( GUI.json.playlist !== GUI.playlist ) {
		getPlaylistCmd();
		GUI.playlist = GUI.json.playlist;
	}
}

} // end if <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

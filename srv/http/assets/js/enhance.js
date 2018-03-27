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
	}
	
	return;
}
// fix: midori box-shadow not render correctly
if ( /Midori/.test( navigator.userAgent ) ) {
	$( 'head link[rel="stylesheet"]').last().after( '<link rel="stylesheet" href="/css/midori.css">' )
}

$( '#open-panel-sx' ).click( function() {
	menubottom( '#panel-sx', '#playback, #panel-dx' );
	displaylibrary();
} );
$( '#open-playback' ).click( function() {
	menubottom( '#playback', '#panel-sx, #panel-dx' );
	displayplayback();
} );
$( '#open-panel-dx' ).click( function() {
	menubottom( '#panel-dx', '#playback, #panel-sx' );
	displayqueue();
} );

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

function displayall() {
	setTimeout( function() {
		if ( $( '#playback' ).hasClass( 'active' ) ) {
			displayplayback();
		} else if ( $( '#panel-sx' ).hasClass( 'active' ) ) {
			displaylibrarry();
		} else if ( $( '#panel-dx' ).hasClass( 'active' ) ) {
			displayqueue();
		}
	}, 100 );
}
window.addEventListener( 'orientationchange', displayall );
/*window.addEventListener( 'visibilitychange', function() {
	console.log( document.visibilityState ); // visible or hidden
} );*/
/*$( window ).blur( function() { // better than visibilitychange
	console.log( 'hidden' );
} );*/
$( window ).focus( function() { // better than visibilitychange
	settime();
} );

// hammer**************************************************************
Hammer = propagating( Hammer ); // propagating.js fix 

var $hammercontent = new Hammer( document.getElementById( 'content' ) );
var $hammerbarleft = new Hammer( document.getElementById( 'barleft' ) );
var $hammerbarright = new Hammer( document.getElementById( 'barright' ) );
var $hammerartist = new Hammer( document.getElementById( 'currentartist' ) );
var $hammercoverT = new Hammer( document.getElementById( 'coverT' ) );
var $hammercoverL = new Hammer( document.getElementById( 'coverL' ) );
var $hammercoverM = new Hammer( document.getElementById( 'coverM' ) );
var $hammercoverR = new Hammer( document.getElementById( 'coverR' ) );
var $hammercoverB = new Hammer( document.getElementById( 'coverB' ) );
var $hammersonginfo = new Hammer( document.getElementById( 'songinfo-open' ) );
var $hammervolume = new Hammer( document.getElementById( 'volume' ) );
var $hammervoldn = new Hammer( document.getElementById( 'voldn' ) );
var $hammervolmute = new Hammer( document.getElementById( 'volmute' ) );
var $hammervolup = new Hammer( document.getElementById( 'volup' ) );
var $hammervoldnrs = new Hammer( document.getElementById( 'voldnrs' ) );
var $hammervoluprs = new Hammer( document.getElementById( 'voluprs' ) );
var $hammerlibrary = new Hammer( document.getElementById( 'panel-sx' ) );
var $hammerplayback = new Hammer( document.getElementById( 'playback' ) );

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
$( '#closebio' ).click( function() {
	$( '#bio' ).hide();
	$( '#songinfo-open' ).show(); // fix button not hidden
	if ( !barhide ) $( '#menu-top, #menu-bottom' ).show();
} );

$hammervolume.on( 'press', function( e ) {
	e.stopPropagation();
} );
$hammercoverT.on( 'tap', function( e ) {
	$( '#menu-top, #menu-bottom' ).toggle();
	barhide = $( '#menu-top' ).is( ':hidden' ) ? 1 : 0;
	e.stopPropagation();
} );
$hammercoverL.on( 'tap', function( e ) {
	$( '#previous' ).click();
	e.stopPropagation();
} );
$hammercoverM.on( 'tap', function( e ) {
	$( '#play' ).click();
	e.stopPropagation();
} ).on( 'press', function( e ) {
	$( '#stop' ).click();
	e.stopPropagation();
} );
$hammercoverR.on( 'tap', function( e ) {
	$( '#next' ).click();
	e.stopPropagation();
} );
$hammercoverB.on( 'tap', function( e ) {
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
	
	e.stopPropagation();
} );
[ $hammervoldnrs, $hammervoluprs ].forEach( function( el ) {
	el.on( 'press', function( e ) {
		e.stopPropagation();
	} );
} );

var timeoutId;
var intervalId;
var interval;
[ $hammervoldn, $hammervolmute, $hammervolup ].forEach( function( el ) {
	el.on( 'press', function( e ) {
		buttonactive = 1;
		e.stopPropagation();
		if ( el.element.id === 'volumemute' ) {
			$( '#volumemute' ).click();
			return;
		}
		$volumetransition.css( 'transition-duration', '0s' );
		timeoutId = setTimeout( volumepress( 300, el.element.id ), 500 );
	} ).on( 'pressup panstart touchend', function() {
		clearTimeout( timeoutId );
		clearInterval( intervalId );
		$volumetransition.css( 'transition-duration', '' );
	} );
});
function volumepress( interval, id, fast ) {
	var knobvol = parseInt( $volumeRS.getValue() );
	var vol = knobvol;
	var increment = ( id === 'volup' ) ? 1 : -1;
	if ( ( increment === -1 && knobvol === 0 )
		|| ( increment === 1 && knobvol === 100 ) ) return;
	var count = 0;
	intervalId = setInterval( function() {
		if ( !fast ) {
			count++;
			if ( count >= 8 ) {
				clearInterval( intervalId );
				volumepress( 50, id, 1 );
			}
		}
		vol = vol + increment;
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
							&ensp;<code><i class="fa fa-play"></i></code>&emsp;<code><i class="fa fa-pause"></i></code>&emsp;buttons\
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

function menubottom( show, hide ) {
	$( '#menu-top, #menu-bottom' ).hide();
	if ( $( '#panel-sx' ).hasClass( 'active' ) ) librarytop = $( window ).scrollTop();
	if ( $( '#panel-dx' ).hasClass( 'active' ) ) queuetop = $( window ).scrollTop();
	if ( /\/.*\//.test( location.pathname ) === false ) {
		$( show ).show().addClass( 'active' );
		$( hide ).hide().removeClass( 'active' );
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
function bioshow() {
	$( '#menu-top, #menu-bottom' ).hide();
	$( '#songinfo-open' ).hide(); // fix button not hidden
	$( '#bio' ).show();
	$( '#loader' ).addClass( 'hide' );
}

// new knob
$( '#time' ).roundSlider( {
	sliderType: 'min-range',
	max: 1000,
	radius: 115,
	width: 20,
	startAngle: 90,
	endAngle: 450,
	editableTooltip: false,
	tooltipFormat: function( e ) {
		var time = GUI.json.time ? GUI.json.time : 0;
		var current = Math.round( e.value / 1000 * time );
		return timeConvert2( current );
	},
	
	create: function ( e ) {
		$timeRS = this;
		$timetoolip = $( '#time' ).find( '.rs-tooltip' );
		var $hammertime = new Hammer( document.querySelector( 'span.rs-tooltip' ) );
		$hammertime.on( 'tap', function( e ) {
			$( '#play' ).click();
			e.stopPropagation();
		} ).on( 'press', function( e ) {
			$( '#stop' ).click();
			e.stopPropagation();
		} );
	},
	change: function( e ) {
		if ( GUI.stream !== 'radio' && ( GUI.state === 'play' || GUI.state === 'pause' ) ) {
			clearInterval( GUI.currentKnob );
			var seekto = Math.floor( e.value / 1000 * GUI.json.time );
			sendCmd( 'seek '+ GUI.json.song +' '+ seekto );
		} else {
			$timeRS.setValue( 0 );
		}
	},
	start: function () {
		clearInterval( GUI.currentKnob );
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
	change: function( e ) { // not fire on 'setValue'
		setvol( e.value ); // value after click or 'stop drag'
		vollocal = 1;
		var command = { vol: [ 'curl', 'vol', 1 ] };
		$.post( '/enhanceredis.php', { json: JSON.stringify( command ) } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
		if ( e.preValue === 0 ) { // value before 'change'
			mutereset();
			unmutecolor();
		}
	},
	start: function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmutecolor(); // value before 'start drag'
	},
	drag: function ( e ) { // drag with no transition by default
		setvol( e.value ); // value in real time 'drag'
		$( e.handle.element ).rsRotate( - e.handle.angle );
	},
} );

var pushstreamVolume = new PushStream( {
	host: window.location.hostname,
	port: window.location.port,
	modes: GUI.mode
} );
pushstreamVolume.addChannel( 'volume' );
pushstreamVolume.onmessage = function( response ) { // on receive broadcast
	if ( vollocal === 1 ) {
		vollocal = 0;
	} else {
		setvolume();
	}
};
pushstreamVolume.connect();

$( '#volmute, #volume .rs-tooltip' ).click( function() {
	var volumemute = $volumeRS.getValue();
	if ( volumemute ) {
		var command = { vol: [ 'set', 'volumemute', volumemute ] };
		$.post( '/enhanceredis.php', { json: JSON.stringify( command ) } );
		setvol( 0 );
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
		var command = { 
			vol: [ 'get', 'volumemute' ],
			del: [ 'set', 'volumemute', 0 ]
		};
		$.post( '/enhanceredis.php', { json: JSON.stringify( command ) }, function( data ) {
			var json = JSON.parse( data );
			vol = parseInt( json.vol );
			if ( vol === 0 ) return;
			setvol( vol );
			$volumeRS.setValue( vol );
			$volumehandle.rsRotate( - $volumeRS._handle1.angle );
			// restore color immediately on click
			unmutecolor();
		} );
	}
	vollocal = 1;
	var command = { vol: [ 'curl', 'vol', 1 ] };
	$.post( '/enhanceredis.php', { json: JSON.stringify( command ) } );
} );

$( '#volup, #voldn, #voluprs, #voldnrs' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	
	if ( ( vol === 0 && ( thisid === 'voldn' || thisid === 'voldnrs' ) )
		|| ( vol === 100 && ( thisid === 'volup' || thisid === 'voluprs' ) ) )
			return;

	if ( vol === 0 ) {
		mutereset();
		unmutecolor()
	}
	vol = ( thisid == 'volup' || thisid == 'voluprs' ) ? vol + 1 : vol - 1;
	setvol( vol );
	$volumeRS.setValue( vol );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
} );

function setvolume() {
	if ( !$('#section-index' ).length ) return;
	
	// set mute button before render
	volumemute = 0;
	var command = {
		volumemute: [ 'get', 'volumemute' ],
		volume: [ '/usr/bin/mpc volume | sed "s/[^0-9]//g"' ]
	};
	$.post( '/enhanceredis.php', 
		{ json: JSON.stringify( command ) },
		function( data ) {
			var json = JSON.parse( data );

			if ( !$( '#volume-knob' ).hasClass( 'hide' )
				&& ( !$( '#songinfo-modal' ).length || GUI.vol_changed_local === 0 )
			) {
				$volumetransition.css( 'transition-duration', '0s' ); // suppress initial rotate animation
				$volumeRS.setValue( json.volume );
				$volumehandle.rsRotate( - $volumeRS._handle1.angle );
				$volumetooltip.show(); // show after 'setValue'
				$volumehandle.show(); // show after 'setValue'
				$volumetransition.css( 'transition', '' );            // reset animation to default
				if ( $( '#vol-group' ).is( ':visible' ) ) {
					if ( json.volumemute != 0 ) {
						mutecolor( json.volumemute );
					} else {
						unmutecolor();
					}
				}
			}
		}
	);
}
setvolume(); // initial volume

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
function mutereset() {
	var command = { vol: [ 'set', 'volumemute', 0 ] };
	$.post( '/enhanceredis.php', { json: JSON.stringify( command ) } );
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
		
		displaycommon();
		
		// scroll info text
		setTimeout( function() {
			$( '#divartist, #divsong, #divalbum' ).each( function() {
				if ( $( this ).find( 'span' ).width() > Math.floor( window.innerWidth * 0.975 ) ) {
					$( this ).addClass( 'scroll-left' );
				} else {
					$( this ).removeClass( 'scroll-left' );
				}
			} );
		}, 50 );
	} );
}
displayplayback();
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
    $( '#single' ).prop( 'disabled', activePlayer === 'Spotify' || activePlayer === 'Airplay' );
    $('#playlist-entries').removeClass(function(index, css) {
        return (css.match (/(^|\s)playlist-\S+/g) || []).join(' ');
    }).addClass('playlist-' + source);
    $('#pl-manage').removeClass(function(index, css) {
        return (css.match (/(^|\s)pl-manage-\S+/g) || []).join(' ');
    }).addClass('pl-manage-' + source);
}

// hide breadcrumb, index bar, edit bookmark
var old_renderLibraryHome = renderLibraryHome;
renderLibraryHome = function() {
	old_renderLibraryHome();
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
// hide 'to queue' text and 'pl-manage li' click context menu
var old_renderPlaylists = renderPlaylists;
renderPlaylists = function( data ) {
	old_renderPlaylists( data );
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
			$('#db-currentpath, #db-level-up').removeClass('hide');
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
				$('#db-currentpath, #db-index').addClass('hide');
				$('#database-entries').css('width', '100%');
// ****************************************************************************************
				$('#db-search-results').removeClass('hide').html('<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span><span class="hidden-xs">' + results + ' result' + s + ' for "<span class="keyword">' + keyword + '</span>"</span>');
			}
// ****************************************************************************************
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
			if (path === 'Webradio') {
// breadcrumb replace - modify add webradio button
				$('#db-level-up').addClass('hide');
				$('#db-webradio-add').removeClass('hide')
					.click(function() {
						$('#modal-webradio-add').modal();
					}
				);
			} else {
				$('#db-level-up').removeClass('hide');
				$('#db-webradio-add').addClass('hide');
// ****************************************************************************************
			}
			for (i = 0; (row = data[i]); i += 1) {
				content += parseResponse({
					inputArr: row,
					respType: 'db',
					i: i,
					inpath: path
				});
			}
			$databaseentries.innerHTML = content;
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

function refreshState() {
// ****************************************************************************************
	var state = GUI.state;
	var fileinfo = '';
// split play-pause buttons
	if ( state === 'play' ) {
		$( '#play' ).addClass( 'btn-primary' );
		$( '#stop' ).removeClass( 'btn-primary' );
		if ( $( '#pause' ).hasClass( 'hide' ) ) {
			$( 'i', '#play' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
		} else {
			$( '#pause' ).removeClass( 'btn-primary' );
		}
	} else if ( state === 'pause' ) {
		$( '#playlist-position span' ).html( 'Not playing' );
		$( '#stop' ).removeClass( 'btn-primary' );
		if ( $( '#pause' ).hasClass( 'hide' ) ) {
			$( 'i', '#play' ).removeClass( 'fa fa-play' ).addClass( 'fa fa-pause' );
		} else {
			$( '#play' ).removeClass( 'btn-primary' );
			$( '#pause' ).addClass( 'btn-primary' );
		}
		var pausetime = parseInt( GUI.json.song_percent ) * 10;
		$timeRS.setValue( pausetime );
	} else if ( state === 'stop' ) {
		$( '#stop' ).addClass( 'btn-primary' );
		$( '#play, #pause' ).removeClass( 'btn-primary' );
		if ( $( '#pause' ).hasClass( 'hide' ) ) $( 'i', '#play' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
		$( '#total' ).html( GUI.stream !== 'radio' ? '00:00' : '' );
		$timeRS.setValue( 0 );
		$( '#format-bitrate' ).html( '&nbsp;' );
	}
	if ( state !== 'stop' ) {
		if ( GUI.stream !== 'radio' ) {
			$( '#total' ).html( ( GUI.json.time !== undefined ) ? timeConvert( GUI.json.time ) : '00:00' );
		} else {
			$( '#total' ).html( '<a style="color: #587ca0;">streaming</a>' );
		}
// improve song info
		if ( GUI.libraryhome.ActivePlayer === 'MPD' ) {
			if ( GUI.json.fileext !== false ) {
				var dot = '<a style="color:#ffffff"> &#8226; </a>';
				var channel = ( GUI.json.audio_channels == 'Stereo' ) ? '' : GUI.json.audio_channels +' ';
				var ext = ( GUI.stream === 'radio' ) ? 'RADIO' : GUI.json.fileext.toUpperCase();
				var bitdepth = Number( GUI.json.audio_sample_depth );
				var sampling = Number( GUI.json.audio_sample_rate );
				var bitrate = Number( GUI.json.bitrate );
				if ( ext == 'DSF' || ext == 'DFF' ) {
					bitdepth = 1;
					var audio = GUI.json.audio.split(':')[ 0 ];
					if ( audio[ 0 ] == 'd' ) { // mpd0.20 - as dsd128:2 / dsd256:2 ...
						channel = '';
						sampling = Number( audio.replace( /[^\d]/g, '' ) );
					} else {
						sampling = GUI.json.audio.split(':')[ 0 ] / 5512.5;
					}
					bitrate = sampling * 44.1;
					sampling = 'DSD'+ sampling;
				} else if ( ext == 'FLAC' || ext == 'WAV' || ext == 'ALAC' ) {
					bitrate = bitdepth * sampling * 2;
				}
				sampling = ( bitdepth != 1 ) ? sampling +' kHz ' : sampling +' - ';
				fileinfo = '<a id="dot0" style="color:#ffffff"> &#8226; </a>' + channel + bitdepth +' bit '+ sampling + bitrate +' kbps<a style="color:#ffffff"> &#8226; </a>' + ext;
			} else {
				fileinfo = '';
			}
		} else {
			fileinfo = ( GUI.json.audio_channels && GUI.json.audio_sample_depth && GUI.json.audio_sample_rate ) ? ( GUI.json.audio_channels + ', ' + GUI.json.audio_sample_depth + ' bit, ' + GUI.json.audio_sample_rate +' kHz, '+GUI.json.bitrate+' kbps' ) : '&nbsp;';
		}
// ****************************************************************************************
		$('#format-bitrate').html(fileinfo);
		$('li', '#playlist-entries').removeClass('active');
		var current = parseInt(GUI.json.song);
		$('#playlist-entries').find('li').eq(current).addClass('active');
	}
	if (GUI.json.playlistlength && GUI.json.playlistlength !== '0') {
		if (GUI.json.song) {
			$('#playlist-position span').html((parseInt(GUI.json.song) + 1) + '/' + GUI.json.playlistlength);
		} else {
			$('#playlist-position span').html('1/' + GUI.json.playlistlength);
		}
	} else {
		$('#playlist-position span').html('Empty queue, add some music!');
	}
	if (GUI.json.updating_db !== undefined) {
		$('a', '#open-panel-sx').html('<i class="fa fa-refresh fa-spin"></i>');
	} else {
		$('a', '#open-panel-sx').html('<i class="fa fa-folder-open"></i>');
	}
}

function updateGUI() {
	if ( !$( '#section-index' ).length ) return;
	
	var radioname = GUI.json.radioname;
	var currentartist = GUI.json.currentartist;
	var currentsong = GUI.json.currentsong ? GUI.json.currentsong : '';
	var currentalbum = GUI.json.currentalbum;
	// set radio mode if stream is present
	GUI.stream = ( radioname ? 'radio' : '' );
	
	// check MPD status and refresh the UI info
	refreshState();
	
	if ( GUI.stream !== 'radio' ) {
		$( '#currentartist' ).html( !currentartist ? '<span class="notag">[no artist]</span>' : currentartist );
		$( '#currentsong' ).html( !currentsong ? '<span class="notag">[no title]</span>' : currentsong );
		$( '#currentalbum').html( !currentalbum ? '<span class="notag">[no album]</span>' : currentalbum );
	} else {
		$( '#currentartist' ).html( !currentartist ? radioname : currentartist );
		$( '#currentalbum' ).html( '<span class="notag">streaming</span>' );
		$( '#currentsong' ).html( !currentsong ? radioname : currentsong );
	}
	
	if ( $( '#play-group' ).is( ':visible' ) ) {
		$( '#repeat' ).toggleClass( 'btn-primary', GUI.json.repeat === '1' );
		$( '#random' ).toggleClass( 'btn-primary', GUI.json.random === '1' );
		$( '#single' ).toggleClass( 'btn-primary', GUI.json.single === '1' );
	}
	
	// song changed
	if ( GUI.currentsong === GUI.json.currentsong ) return;
	GUI.currentsong = currentsong;
	if ( $( '#lyricscontainer' ).length ) {
		lyrics = '';
		if ( GUI.currentalbum !== 'null - null' ) getlyrics();
	}

	// scroll long song text
	if ( $('#panel-dx').hasClass('active') ) customScroll( 'pl', parseInt( GUI.json.song ) );
	
	// album changed
	var currentalbumstring = currentartist +' - '+ currentalbum;
	if ( GUI.currentalbum === currentalbumstring ) return;
// -------------------------------------------------------------------------------
	GUI.currentalbum = currentalbumstring;
	if (GUI.stream !== 'radio') {
		var covercachenum = Math.floor(Math.random()*1001);
		$('#cover-art').css('background-image','url("/coverart/?v=' + covercachenum + '")');
	} else {
		$('#cover-art').css('background-image','url("assets/img/cover-radio.jpg")');
	}
}

// ### called by backend socket - force refresh all clients ###
// rendrUI() > updateGUI() > refreshState()
function renderUI( text ) {
	toggleLoader( 'close' );
	GUI.json = text[ 0 ];
	GUI.state = GUI.json.state;
	
	updateGUI();
	
	if ( !$('#section-index' ).length ) return;
	
	settime();
	
	if ( GUI.json.playlist !== GUI.playlist ) {
		getPlaylistCmd();
		GUI.playlist = GUI.json.playlist;
	}
}
function settime() {
	var command = { status: [ '/usr/bin/mpc status | grep ")" | sed "s/\] *#.*   */ /; s|[:/]| |g; s/[\[(%)]//g"' ] };
	$.post( '/enhanceredis.php', { json: JSON.stringify( command ) }, function( data ) {
		var ar = JSON.parse( data ).status.split( ' ' );
		
		if ( !ar[ 0 ] ) {
			var state = 'stop';
			var elapsed = 0;
			var time = 0;
			var percent = 0;
		} else {
			var state = ar[ 0 ] === 'playing' ? 'play' : 'pause';
			var elapsed = 60 * ar[ 1 ] + parseInt( ar[ 2 ] );
			var time = 60 * ar[ 3 ] + parseInt( ar[ 4 ] );
			var percent = ar[ 5 ];
		}
		GUI.json.time = time;
		
		if (GUI.stream !== 'radio') {
			$timetoolip.show(); // fix: hide initial 'NaN'
			clearInterval( GUI.currentKnob );
			if ( state !== 'play' ) return;
			var position = percent * 10;
			$timeRS.setValue( position );
			var localbrowser = ( location.hostname === 'localhost' || location.hostname === '127.0.0.1' ) ? 10 : 1;
			var step = 1 * localbrowser; // fix: reduce cpu cycle on local browser
			var every = time * localbrowser;
			
			GUI.currentKnob = setInterval( function() {
				position = position + step;
				if ( position === 1000 ) {
					clearInterval( GUI.currentKnob );
					settime();
				}
				$timeRS.setValue( position );
			}, time );
		} else {
			$timeRS.setValue( 0 );
		}
	} );
}

function commandButton( el ) {
    var dataCmd = el.data( 'cmd' );
    var cmd;
    if ( !el.hasClass( 'btn-toggle' ) ) {
	    clearInterval( GUI.currentKnob );
		if ( dataCmd === 'play' ) {
			var state = GUI.state;
			if ( state === 'play' ) {
				cmd = 'pause';
			} else if ( state === 'pause' ) {
				cmd = 'play';
			} else if ( state === 'stop' ) {
				cmd = 'play';
			}
		} else if ( dataCmd === 'stop' ) {
			cmd = 'stop';
		}
    } else {
    	cmd = dataCmd + ( el.hasClass( 'btn-primary' ) ? ' 0' : ' 1' );    
    }
	//total = $('#playlist li.active').find('span span').text();
    sendCmd( cmd );
}

} // end if <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
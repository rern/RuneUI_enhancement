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
			$.post( '/enhance.php', { redis: JSON.stringify( command ) }, function(data) {
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
function bioshow() {
	$( '#menu-top, #menu-bottom' ).hide();
	$( '#songinfo-open' ).hide(); // fix button not hidden
	$( '#bio' ).show();
	$( '#loader' ).addClass( 'hide' );
}
function btntoggle() {
	buttonactive = 0;
	var time = $( '#time-knob' ).is( ':visible' );
	var coverart = $( '#coverart' ).is( ':visible' );
	var volume = redis.display.volume != 0 && redis.display.volumempd != 0 && $( '#volume-knob' ).is( ':visible' );
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

// back from setting pages
if ( /\/.*\//.test( document.referrer ) == true ) {
	var command = { 
		page: [ 'get', 'page' ],
		del: [ 'del', 'page' ]
	};
	$.post( '/enhance.php',{ redis: JSON.stringify( command ) }, function( data ) {
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

$( '#play-group, #share-group, #vol-group' ).click( function() {
	if ( window.innerWidth < 499 ) buttonactive = 1;
} );

// lastfm search
$( '#currentartist, #songinfo-open' ).click( function() {
	if ( GUI.json.file.slice( 0, 4 ) === 'http' ) return;
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
var btnctrl = {
	  timeT  : 'overlay-playsource-open'
	, timeL  : 'previous'
	, coverL : 'previous'
	, timeM  : 'play'
	, coverM : 'play'
	, timeR  : 'next'
	, coverR : 'next'
	, timeB  : 'stop'
	, coverB : 'stop'
	, volmuters : 'volumemute'
}
$( '.btnctrl' ).click( function() {
	if ( this.id === 'coverT' ) {
		$( '.controls, .controls1,.rs-tooltip' ).toggle();
		return;
	} else if ( this.id === 'coverBR' ) {
		btntoggle()
	} else if ( this.id === 'coverTR' ) {
		$( '#menu-top, #menu-bottom' ).toggle();
		barhide = $( '#menu-top' ).is( ':hidden' ) ? 1 : 0;
	} else {
		$( '#'+ btnctrl[ this.id ] ).click();
	}
	$( '.controls' ).hide();
	$( '.controls1, .rs-tooltip' ).show();
} );

// library directory path link
$( '#db-home' ).click( function() {
	renderLibraryHome();
} );
$( '#db-currentpath' ).on( 'click', 'a', function() {
	if ( $( '#db-currentpath span' ).children().length === 1 ) return;
	var path = $( this ).attr( 'data-path' );
	var mode = {
		  Artists  : 'artist'
		, Albums   : 'album'
		, Genres   : 'genre'
		, Composer : 'composer'
	}
	getDB( { browsemode: mode[ path ], path: path } );
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
		// strip leading A, An, The
		var name = $( this ).attr( 'data-path' ).replace( /^a *|^an *|^the */i, '' );
		return name.match( new RegExp( datapathindex ) );
	} );
	if ( matcharray.length ) window.scrollTo( 0, matcharray[0].offsetTop - topoffset );
} );
dbtop = 0;
$( '#db-level-up' ).off( 'click' );
$( '#db-level-up' ).click( function() {
	GUI.currentDBpos[ 10 ]--;
	var path = GUI.currentpath;
	if ( GUI.currentDBpos[ 10 ] === 0 ) {
		path = '';
	} else {
		if ( GUI.browsemode === 'file' ) {
			var cutpos = path.lastIndexOf( '/' );
			path = ( cutpos !== -1 ) ? path.slice( 0, cutpos ) : '';
		} else {
			var arpath = {
				  album       : 'Albums'
				, artist      : 'Artists'
				, composer    : 'Composer'
				, genre       : 'Genres'
				, albumfilter : path
			};
			path = GUI.currentDBpath[ GUI.currentDBpos[ 10 ] - 1 ];
			if ( path === '' && GUI.currentDBpos[ 10 ] === 1 ) {
				path = arpath[ GUI.browsemode ];
			} else {
				GUI.browsemode = GUI.browsemode !== 'artist' ? 'artist' : 'genre'; 
			}
		}
	}
	
	getDB( { 
		browsemode: GUI.browsemode,
		path: path,
		plugin: GUI.plugin,
		uplevel: 1
	} );
	GUI.plugin = '';
	
	window.scrollTo( 0, dbtop );
});
// fix; hide spinner on cancel
$( '#modal-webradio-add button[data-dismiss="modal"], #modal-webradio-add' ).click( function() {
	$( '#spinner-db' ).addClass( 'hide' );
} );

$( '#open-library' ).click( function() {
	$( '#open-panel-sx' ).click();
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
		setplaybackdata();
	}
} );

// hammer**************************************************************
Hammer = propagating( Hammer ); // propagating.js fix 

var $hammercontent = new Hammer( document.getElementById( 'content' ) );
var $hammercoverT = new Hammer( document.getElementById( 'coverT' ) );
var $hammervoldn = new Hammer( document.getElementById( 'voldn' ) );
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
		
		$.post( '/enhance.php', { volume: $volumeRS.getValue() } );
		setTimeout( function() {
			onsetvolume = 0;
		}, 500 );
	} );
});
// fix: 'tap on blank area hide overlay controls' causes toggle hide failed
$hammercoverT.on( 'tap', function( e ) {
	e.stopPropagation();
} );
$hammerplayback.on( 'tap', function( e ) {
	$( '.controls' ).hide();
	$( '.controls1, .rs-tooltip' ).show();
} ).on( 'press', function() {
	info( {
		  title  : 'Playback'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysaveplayback">\
						<label><input name="bar" type="checkbox" '+ redis.display.bar +'>&ensp;Top-Bottom menu</label>\
						<br><label><input name="pause" type="checkbox" '+ redis.display.pause +'>\
							&ensp;<code><i class="fa fa-play"></i></code>&ensp;<code><i class="fa fa-pause"></i></code>&ensp;buttons</label>\
						<br><label><input name="source" type="checkbox" '+ redis.display.source +'>&ensp;<code>MPD</code>&ensp;button</label>\
						</label>\
						<br><label><input name="time" type="checkbox" '+ redis.display.time +'>&ensp;Time</label>\
						<br><label><input name="coverart" type="checkbox" '+ redis.display.coverart +'>&ensp;Coverart</label>\
						<br><label><input name="volume" type="checkbox" '+ redis.display.volume +'>&ensp;Volume</label>\
						<br><label><input name="buttons" type="checkbox" '+ redis.display.buttons +'>&ensp;Buttons</label>\
						</form>'
		, cancel : 1
		, ok     : function () {
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				redis.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = { display: [ 'hmset', 'display', redis.display ] };
			$.post( '/enhance.php', 
				{ redis: JSON.stringify( command ) },
				function( data ) {
					displayplayback();
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
	if ( redis.display.volumempd == 0 ) {
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
						<label><input name="bar" type="checkbox" '+ redis.display.bar +'>&ensp;Top-Bottom menu</label>\
						<br><label><input name="nas" type="checkbox" '+ redis.display.nas +'>&ensp;Network mounts</label>'
						+ ( GUI.libraryhome.localStorages ? '<br><label><input name="sd" type="checkbox" '+ redis.display.sd +'>&ensp;Local SD</label>' : '' )
						+'<br><label><input name="usb" type="checkbox" '+ redis.display.usb +'>&ensp;USB drives</label>\
						<br><label><input name="webradio" type="checkbox" '+ redis.display.webradio +'>&ensp;Webradios</label>\
						<br><label><input name="albums" type="checkbox" '+ redis.display.albums +'>&ensp;Albums</label>\
						<br><label><input name="artists" type="checkbox" '+ redis.display.artists +'>&ensp;Artists</label>\
						<br><label><input name="composer" type="checkbox" '+ redis.display.composer +'>&ensp;Composers</label>\
						<br><label><input name="genre" type="checkbox" '+ redis.display.genre +'>&ensp;Genres</label>\
						<br><label><input name="spotify" type="checkbox" '+ redis.display.spotify +'>&ensp;Spotify</label>\
						<br><label><input name="dirble" type="checkbox" '+ redis.display.dirble +'>&ensp;Dirble</label>\
						<br><label><input name="jamendo" type="checkbox" '+ redis.display.jamendo +'>&ensp;Jamendo</label>\
						</form>'
		, cancel : 1
		, ok     : function () {
			$( '#displaysavelibrary input' ).each( function() {
				redis.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = { display: [ 'hmset', 'display', redis.display ] };
			$.post( '/enhance.php', 
				{ redis: JSON.stringify( command ) },
				function( data ) {
					displaylibrary();
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
function mpdseek( seekto ) {
	if ( GUI.state !== 'stop' ) {
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		sendCmd( 'seekcur '+ seekto );
	} else {
		$.post( '/enhance.php', { mpd: 'command_list_begin\nplay\nseekcur '+ seekto +'\npause\ncommand_list_end' } );
	}
}
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
		if ( GUI.json.file.slice( 0, 4 ) !== 'http' ) {
			var seekto = Math.floor( e.value / 1000 * time );
			mpdseek( seekto );
		} else {
			$timeRS.setValue( 0 );
		}
	},
	start: function () {
		if ( GUI.json.file.slice( 0, 4 ) !== 'http' ) {
			clearInterval( GUI.currentKnob );
			clearInterval( GUI.countdown );
		}
	},
	drag: function ( e ) { // drag with no transition by default
		if ( GUI.json.file.slice( 0, 4 ) !== 'http' ) {
			var seekto = Math.round( e.value / 1000 * time );
			$( '#elapsed' ).text( converthms( seekto ) );
		}
	},
	stop: function( e ) { // on 'stop drag'
		if ( GUI.json.file.slice( 0, 4 ) !== 'http' ) {
			var seekto = Math.round( e.value / 1000 * time );
			mpdseek( seekto );
		}
	}
} );

var dynVolumeKnob = $( '#volume' ).data( 'dynamic' );
onsetvolume = 0;
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
		onsetvolume = 1;
		setTimeout( function() {
			onsetvolume = 0;
		}, 500 );
		
		$.post( '/enhance.php', { volume: e.value } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
		if ( e.preValue === 0 ) { // value before 'change'
			var command = { vol: [ 'set', 'volumemute', 0 ] };
			$.post( '/enhance.php', { redis: JSON.stringify( command ) } );
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
		$.post( '/enhance.php', { volume: e.value } );
		setTimeout( function() {
			onsetvolume = 0;
		}, 500 );
	}
} );

$( '#volmute, #volume .rs-tooltip' ).click( function() {
	onsetvolume = 1;
	setTimeout( function() {
		onsetvolume = 0;
	}, 500 );
	var volumemute = $volumeRS.getValue();
	
	if ( volumemute ) {
		$.post( '/enhance.php', { volume: -1 } );
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
		$.post( '/enhance.php', { volume: -1 }, function( data ) {
			if ( data == 0 ) return;
			$volumeRS.setValue( data );
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
		$.post( '/enhance.php', { redis: JSON.stringify( command ) } );
		unmutecolor();
	}
	vol = ( thisid == 'volup' || thisid == 'voluprs' ) ? vol + 1 : vol - 1;
	$.post( '/enhance.php', { volume: vol } );
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
	if ( redis.display.bar !== ''
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
var command = {
	display: [ 'hGetAll', 'display' ],
	volumempd: [ 'get', 'volume' ],
	update: [ 'hGet', 'addons', 'update' ]
};
$.post( '/enhance.php', { redis: JSON.stringify( command ) }, function( data ) {
	redis = JSON.parse( data );
} );
buttonactive = 0;

function displayplayback() {
	buttonhide = window.innerHeight <= 320 || window.innerWidth < 499 ? 1 : 0;
	if ( GUI.json.playlistlength != 0 ) $( '.playback-controls' ).css( 'visibility', 'visible' );
	
	var volume = ( redis.display.volume == '' || redis.volumempd == 0 ) ? 0 : 1;
	
	if ( redis.update != 0 ) {
		$( '#menu-settings' ).append( '<span id="badge">'+ redis.update +'</span>' );
	} else {
		$( '#badge' ).remove();
	}
	$( '#pause' ).toggleClass( 'hide', !redis.display.pause );
	// reset to default css
	$( '#playback-row, #time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( {
		margin: '',
		width: '',
		'max-width': '',
		order: '',
		'-webkit-order': '',
		display: ''
	} );
	$( '#overlay-playsource-open' ).toggleClass( 'hide', !redis.display.source );
	$( '#time-knob, #play-group' ).toggleClass( 'hide', !redis.display.time );
	$( '#coverart, #share-group' ).toggleClass( 'hide', !redis.display.coverart );
	$( '#volume-knob, #vol-group' ).toggleClass( 'hide', !volume );
	
	var i = ( redis.display.time ? 1 : 0 ) + ( redis.display.coverart ? 1 : 0 ) + volume;
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

	if ( buttonhide || redis.display.buttons == '' ) {
		buttonhide = 1;
		$( '#play-group, #share-group, #vol-group' ).hide();
	}
	if ( buttonactive ) $( '#play-group, #share-group, #vol-group' ).show();
	$( '#playback-row' ).removeClass( 'hide' ); // restore - hidden by fix flash
	
	setbutton();
	displaycommon();
}

// library show/hide blocks
function displaylibrary() {
	// no 'id'
	$( '#home-blocks div:contains(Network mounts)' ).toggleClass( 'hide', !redis.display.nas );
	$( '#home-local' ).parent().toggleClass( 'hide', !redis.display.sd );
	$( '#home-usb' ).parent().toggleClass( 'hide', !redis.display.usb );
	$( '#home-webradio' ).parent().toggleClass( 'hide', !redis.display.webradio );
	$( '#home-albums' ).parent().toggleClass( 'hide', !redis.display.albums );
	$( '#home-artists' ).parent().toggleClass( 'hide', !redis.display.artists );
	$( '#home-composer' ).parent().toggleClass( 'hide', !redis.display.composer );
	$( '#home-genre' ).parent().toggleClass( 'hide', !redis.display.genre );
	$( '#home-spotify' ).parent().toggleClass( 'hide', !redis.display.spotify );
	$( '#home-dirble' ).parent().toggleClass( 'hide', !redis.display.dirble );
	$( '#home-jamendo' ).parent().toggleClass( 'hide', !redis.display.jamendo );
	
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
}
// queue show/hide menu
function displayqueue() {
	displaycommon();
	window.scrollTo( 0, queuetop );
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
	
	loadingSpinner( 'db' );
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
	for ( i = 0; ( bookmark = obj.bookmarks[ i ] ); i++ ) {
		content += divOpen +'<div id="home-bookmark-'+ bookmark.id +'" class="home-block home-bookmark'+ toggleMPD +'" data-path="'+ bookmark.path +'"><i class="fa fa-star"></i><h4>' + bookmark.name + '</h4></div></div>';
	}
	if ( chkKey( obj.networkMounts ) ) {
		content += divOpen +'<a id="home-nas" class="home-block'+ toggleMPD +'"'+ ( obj.networkMounts === 0 ? ( notMPD ? '' : ' href="/sources/add/"' ) : ' data-path="NAS"' ) +'>';
		content += '<i class="fa fa-sitemap"></i><h4>Network drives <span>(' + obj.networkMounts + ')</span></h4></a></div>';
	}
	if ( chkKey( obj.localStorages ) ) {
		content += ( obj.localStorages === 0 ) ? '' : divOpen +'<div id="home-local" class="home-block'+ toggleMPD +'" data-path="LocalStorage"><i class="fa fa-hdd-o"></i><h4>SD card <span>('+ obj.localStorages +')</span></h4></div></div>';
	}
	if ( chkKey( obj.USBMounts ) ) {
		content += divOpen +'<div id="home-usb" class="home-block'+ toggleMPD +'"'+ ( obj.USBMounts === 0 ? ( notMPD ? '' : ' href="/sources/sources/"' ) : ' data-path="USB"' ) +'>';
		content += '<i class="fa fa-hdd-o"></i><h4>USB drives <span>('+ obj.USBMounts +')</span></h4></div></div>';
	}
	if ( chkKey( obj.webradio ) ) {
		if ( obj.webradio === 0 ) {
			content += divOpen +'<div id="home-webradio" class="home-block' + toggleMPD + '" href="#" data-toggle="modal" data-target="#modal-webradio-add"><i class="fa fa-microphone"></i><h4>Webradios <span>('+ obj.webradio +')</span></h4></div></div>';
		} else {
			content += divOpen +'<div id="home-webradio" class="home-block'+ toggleMPD +'" data-path="Webradio"><i class="fa fa-microphone"></i><h4>Webradios <span>('+ obj.webradio +')</span></h4></div></div>';
		}
	}
	content += divOpen +'<div id="home-albums" class="home-block'+ toggleMPD +'" data-path="Albums" data-browsemode="album"><i class="fa fa-dot-circle-o"></i><h4>Albums</h4></div></div>';
	content += divOpen +'<div id="home-artists" class="home-block'+ toggleMPD +'" data-path="Artists" data-browsemode="artist"><i class="fa fa-user"></i><h4>Artists</h4></div></div>';
	content += divOpen +'<div id="home-composer" class="home-block'+ toggleMPD +'" data-path="Composer" data-browsemode="composer"><i class="fa fa-pencil"></i><h4>Composers</h4></div></div>';
	content += divOpen +'<div id="home-genre" class="home-block' + toggleMPD +'" data-path="Genres" data-browsemode="genre"><i class="fa fa-tag"></i><h4>Genres</h4></div></div>';
	if ( chkKey( obj.Spotify ) && obj.Spotify !== '0' ) {
		if (obj.ActivePlayer !== 'Spotify') {
			content += divOpen +'<div id="home-spotify-switch" class="home-block"><i class="fa fa-spotify"></i><h4>Spotify</h4></div></div>';
		} else {
			content += divOpen +'<div id="home-spotify" class="home-block'+ toggleSpotify +'" data-plugin="Spotify" data-path="Spotify"><i class="fa fa-spotify"></i><h4>Spotify</h4></div></div>';
		}
	}
	if ( chkKey( obj.Dirble ) ) {
		content += divOpen +'<div id="home-dirble" class="home-block'+ toggleMPD +'" data-plugin="Dirble" data-path="Dirble"><i class="fa fa-globe"></i><h4>Dirble</h4></div></div>';
	}
	content += divOpen +'<div id="home-jamendo" class="home-block'+ toggleMPD +'" data-plugin="Jamendo" data-path="Jamendo"><i class="fa fa-play-circle-o"></i><h4>Jamendo<span id="home-count-jamendo"></span></h4></div></div>';

	content += '</div>';
	document.getElementById( 'home-blocks' ).innerHTML = content;
	loadingSpinner( 'db', 'hide' );
	$( 'span', '#db-currentpath' ).html( '' );
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

function renderPlaylists( data ) {
	var content = playlistname = '';
	var i, line, lines = data.split('\n'), infos = [];
	for ( i = 0; ( line = lines[ i ] ); i++ ) {
		infos = line.split( ': ' );
		if ( 'playlist' === infos[ 0 ] ) {
			playlistname = infos[ 1 ];
			content += '<li class="pl-folder" data-path="' + playlistname + '"><i class="fa fa-bars pl-action" data-target="#context-menu-playlist" data-toggle="context" title="Actions"></i><span><i class="fa fa-list-ul"></i>' + playlistname + '</span></li>';
			playlistname = '';
		}
	}
	document.getElementById( 'playlist-entries' ).innerHTML = '';
	$( '.playlist, #pl-manage, #pl-count' ).addClass( 'hide' );
	$( '#pl-filter-results' ).addClass( 'back-to-queue' ).html( '<i class="fa fa-arrow-left sx"></i> to queue' );
	$( '#pl-filter-results, #pl-currentpath, #pl-editor' ).removeClass( 'hide' );
	document.getElementById( 'pl-editor' ).innerHTML = content;
	loadingSpinner( 'pl', 'hide' );
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
		GUI.DBentry[ 0 ] = $( this ).attr( 'data-path' );
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
						content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu"></i><span><i class="fa fa-folder"></i>'
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
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-album"></i><span><i class="fa fa-stop"></i>';
					content += inputArr.album;
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'artist') {
				if (inputArr.album !== undefined) {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-album" data-path="';
					content += inputArr.album;
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-album"></i><span><i class="fa fa-stop"></i>';
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
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-composer"></i><span><i class="fa fa-pencil"></i>';
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
					content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-genre"></i><span><i class="fa fa-tag"></i>';
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
// strip leading A, An, The
function stripAAnThe( string ) {
	return string.replace( /^a *|^an *|^the */i, '' );
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
					return stripAAnThe( a[ 'name' ] ).localeCompare( stripAAnThe( b[ 'name' ] ) )
				} else if ( querytype === 'tracks' ) {
					return stripAAnThe( a[ 'title' ]) .localeCompare( stripAAnThe( b[ 'title' ] ) )
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
					return stripAAnThe( a[ 'title' ] ).localeCompare( stripAAnThe( b[ 'title' ] ) )
				} else if ( querytype === 'childs-stations' || querytype === 'stations' ) {
					return stripAAnThe( a[ 'name' ] ).localeCompare( stripAAnThe( b[ 'name' ] ) )
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
					return stripAAnThe( a[ 'dispname' ] ).localeCompare( stripAAnThe( b[ 'dispname' ] ) )
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
// show breadcrumb and index bar
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
// hide breadcrumb and index bar
				$( '#db-currentpath, #db-index' ).addClass( 'hide' );
				$( '#database-entries' ).css( 'width', '100%' );
				$( '#db-search-results' ).removeClass( 'hide' ).html( '<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span><span class="hidden-xs">' + results + ' result' + s + ' for "<span class="keyword">' + keyword + '</span>"</span>' );
			}
// sorting
			if ( !data.length ) {
				$( '#db-currentpath a' ).click();
				return;
			}
			if ( data[ 0 ].directory || data[ 0 ].file ) {
				var arraydir = [];
				var arrayfile = [];
				$.each( data, function( index, value ) {
					if ( value.directory ) {
						arraydir.push( value );
					} else {
						arrayfile.push( value );
					}
				} );
				arraydir.sort( function( a, b ) {
					return stripAAnThe( a[ 'directory' ] ).localeCompare( stripAAnThe( b[ 'directory' ] ) );
				} );
				for ( i = 0; row = arraydir[ i ]; i++ ) {
					content += parseResponse( {
						inputArr: row,
						respType: 'db',
						i: i,
						inpath: path
					} );
				}
				// files sorted by track numbers
/*				arrayfile.sort( function( a, b ) {
					return a[ 'file' ].localeCompare( b[ 'file' ] );
				} );*/
				for ( i = 0; row = arrayfile[ i ]; i++ ) {
					content += parseResponse( {
						inputArr: row,
						respType: 'db',
						i: i,
						inpath: path
					} );
				}
			} else {
				var type = {
					  Albums            : 'album'
					, Artists           : 'artist'
					, AlbumArtists      : 'artist'
					, Various           : 'artist'
					, Composer          : 'composer'
					, Genres            : 'genre'
					, Webradio          : 'playlist'
				}
				prop = type[ path ] ? type[ path ] : 'directory';
				// filter out 'various' artists
				if ( path === 'Artists' ) {
					data = data.filter( function( el ) {
						return el[ 'artist' ].search( /^\(*various\)* *|^\(*va\)* */i ) === -1; 
					} );
				}
				data.sort( function( a, b ) {
					if ( a[ prop ] === undefined ) {
						if ( GUI.browsemode === 'artist' ) {
							prop = 'album';
						} else if ( GUI.browsemode === 'genre' ) {
							prop = 'artist';
						}
					}
					return stripAAnThe( a[ prop ] ).localeCompare( stripAAnThe( b[ prop ] ) );
				});
				for ( i = 0; row = data[ i ]; i++ ) {
					content += parseResponse( {
						inputArr: row,
						respType: 'db',
						i: i,
						inpath: path
					} );
				}
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
			}
		}
	}
// breadcrumb add - library directory path link
	var breadcrumb = $( 'span', '#db-currentpath' );
	var dot = '<span style="color: #587ca0"> &#8226; </span>';
	var mode = {
		  album    : [ 'Albums', 'A L B U M' ]
		, artist   : [ 'Artists', 'A R T I S T' ]
		, genre    : [ 'Genres', 'G E N R E' ]
		, composer : [ 'Composer', 'C O M P O S E R' ]
	}
	if ( GUI.browsemode !== 'file' ) {
		var dot = ( path === mode[ GUI.browsemode ][ 0 ] ) ? '' : dot + path;
		breadcrumb.html( '<a data-path="'+ mode[ GUI.browsemode ][ 0 ] +'">'+ mode[ GUI.browsemode ][ 1 ] +'</a>'+ dot );
	} else {
		var folder = path.split( '/' );
		var folderPath = '';
		var folderCrumb = '';
		var ilength = folder.length;
		for ( i = 0; i < ilength; i++ ) {
			if ( i !== 0 ) {
				folderPath += '/';
				folderCrumb += ' / ';
			}
			var foldername = folder[ i ];
			folderPath += foldername;
			var name = {
				  USB          : 'U S B'
				, Webradio     : 'W E B R A D I O'
				, LocalStorage : 'S D'
				, NAS          : 'N E T W O R K'
			}
			if ( name [ foldername ] ) foldername = name [ foldername ];
			folderCrumb += '<a data-path="'+ folderPath +'">'+ foldername +'</a>';
		}
		breadcrumb.html( folderCrumb );
	}
// ****************************************************************************************
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
			bottomline = data[ 'Artist' ] + ( data[ 'Album' ] ? ' - '+ data[ 'Album' ] : '' );
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
			
			if ( GUI.json.random == 1 ) {
				// improve: repeat pattern of mpd random
				var pos = Math.floor( Math.random() * last ) + 1;
				if ( pos === current ) pos = Math.floor( Math.random() * last ) + 1;
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
			$.post( '/enhance.php', { mpd: 'command_list_begin\nplay '+ pos + ( GUI.state !== 'play' ? '\nstop' : '' ) +'\ncommand_list_end' }, function() {
				setTimeout( function() {
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

function scrollText() {
	$( '#divartist, #divsong, #divalbum' ).each( function() {
		if ( $( this ).find( 'span' ).width() > Math.floor( window.innerWidth * 0.975 ) ) {
			$( this ).addClass( 'scroll-left' );
		} else {
			$( this ).removeClass( 'scroll-left' );
		}
	} );
}
onsetmode = 0;
function setplaybackdata() {
	$.post( '/enhancestatus.php', function( data ) {
		var status = JSON.parse( data );
		// song and album before update for song/album change detection
		var previoussong = $( '#currentsong' ).text();
		var previousalbum = $( '#currentalbum' ).text();
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
		if ( status.playlistlength == 0 ) {
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
			if ( $( '#cover-art' ).css( 'background-image' ) !== 'url("assets/img/cover-radio.jpg")' ) {
				$( '#cover-art' ).css( 'background-image', 'url("assets/img/cover-radio.jpg")' );
			}
			$( '#elapsed' ).html( status.state === 'play' ? '<a class="dot">.</a> <a class="dot dot2">.</a> <a class="dot dot3">.</a>' : '' );
			$( '#total' ).text( '' );
			return;
		} else {
			if ( status.Album !== previousalbum ) {
				var covercachenum = Math.floor( Math.random() * 1001 );
				$( '#cover-art' ).css( 'background-image', 'url("/coverart/?v=' + covercachenum + '")' );
			}
		}

		// time
		time = status.Time;
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
		var position = Math.round( elapsed / time * 1000 );
		$( '#time' ).roundSlider( 'setValue', position );
		$( '#elapsed' ).text( converthms( elapsed ) );
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
			}
			$( '#time' ).roundSlider( 'setValue', position );
		}, time );
		
		GUI.countdown = setInterval( function() {
			elapsed++
			mmss = converthms( elapsed );
			$( '#elapsed' ).text( mmss );
		}, 1000 );
	
		// playlist current song ( and lyrics if installed )
		if ( status.Title !== previoussong || status.Album !== previousalbum ) {
			$( '#playlist-entries li ' ).removeClass( 'active' );
			$( '#playlist-entries' ).find( 'li' ).eq( parseInt( status.song ) ).addClass( 'active' );
			
			if ( $( '#lyricscontainer' ).length && $( '#lyricscontainer' ).is( ':visible' ) )  getlyrics();
		}
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

// ### called by backend socket - force refresh all clients ###
// rendrUI() > updateGUI() > refreshState()
function renderUI( text ) {
	toggleLoader( 'close' );
	if ( !$('#section-index' ).length || onsetvolume ) return;
	
	GUI.json = text[ 0 ];
	GUI.state = GUI.json.state;
	
	setplaybackdata();
	
	if ( $( '#playback' ).hasClass( 'active' ) ) displayplayback();
	
	if ( GUI.json.playlist !== GUI.playlist ) {
		getPlaylistCmd();
		GUI.playlist = GUI.json.playlist;
	}
}

} // end if <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

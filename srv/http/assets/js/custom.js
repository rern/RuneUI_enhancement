$( document ).ready( function() {
// document ready start********************************************************************

function menubottom( show, hide ) {
	if ( /\/.*\//.test( location.pathname ) === false ) {
		$( show ).show();
		$( hide ).hide();
	} else {
		window.location.href = '/';
	}
}
$( '#open-panel-sx' ).click( function() {
	menubottom( '#panel-sx', '#playback, #panel-dx' )
} );
$( '#open-playback' ).click( function() {
	menubottom( '#playback', '#panel-sx, #panel-dx' )
} );
$( '#open-panel-dx' ).click( function() {
	menubottom( '#panel-dx', '#playback, #panel-sx' )
} );

if ( /\/.*\//.test( location.pathname ) === false ) $( '#menu-top, #menu-bottom' ).addClass( 'hide' );

// disabled local browser > disable screensaver events
if ( !$( '#playback-ss' ).length ) $('#section-index').off( 'mousemove click keypress' );

setTimeout( function() { // fix mouse move pass menu on initial load
	var menuhide = 0;
	$( '#bartop, #barbottom' ).mouseenter( function() {
		var tb = $( this ).prop( 'id' ).replace( 'bar', '#menu-' );
		if ( $( tb ).is( ':visible' ) ) {
			menuhide = 0;
		} else {
			menuhide = 1;
			$( tb ).removeClass( 'hide' );
		}
	} );
	$( '#menu-top, #menu-bottom' ).mouseleave( function() {
		if ( menuhide ) $( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		menuhide = 0;
	} );
}, 1000 );

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
		if ( window.innerWidth < 500 || window.innerHeight < 500 ) $( '#menu-top, #menu-bottom' ).toggle();
	}
} );
// playsource button replacement
$( '#playsource' ).click( function() {
	$( '#overlay-playsource-open' ).click();
} );
// lastfm search
$( '#currentartist' ).click( function() {
	var artist = $( this ).text();
	if ( artist.slice( 0, 3 ) != '[no' )
		window.open( 'http://www.last.fm/music/'+ artist );
} );
$( '#currentalbum' ).click( function() {
	var artist = $( '#currentartist' ).text();
	var album = $( this ).text();
	if ( album.slice( 0, 3 ) != '[no' )
		window.open( 'http://www.last.fm/music/'+ artist +'/'+ album );
} );
$( '#menu-bottom' ).click( function() {
	if ( window.innerHeight < 737 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
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
	var topoffset = !$( '#menu-top' ).hasClass( 'hide' ) ? 80 : 40;
	var indextext = $( this ).text();
	if ( indextext === '#' ) {
		$( document ).scrollTop( 0 );
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
	if ( matcharray.length ) $( document ).scrollTop( matcharray[0].offsetTop - topoffset );
} );
$( '#db-level-up' ).click( function() {
	window.scrollTo( 0, dbtop );
} );

// index link height
indexheight = function() {
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
}

window.addEventListener( 'orientationchange', function() { 
	indexheight();
	scrolltext();
} );

// skip all hammers if in menu settings
if ( /\/.*\//.test( location.pathname ) === true ) return;

// hammer**************************************************************
Hammer = propagating( Hammer ); // propagating.js fix e.stopPropagation()

var $hammercontent = new Hammer( document.getElementById( 'content' ) );
var $hammerbarleft = new Hammer( document.getElementById( 'barleft' ) );
var $hammerbarright = new Hammer( document.getElementById( 'barright' ) );
var $hammerinfo = new Hammer( document.getElementById( 'info' ) );
var $hammertime = new Hammer( document.getElementById( 'time-knob' ) );
var $hammercoverart = new Hammer( document.getElementById( 'coverart' ) );
var $hammervolume = new Hammer( document.getElementById( 'volume-knob' ) );
var $hammerlibrary = new Hammer( document.getElementById( 'panel-sx' ) );
var $hammerplayback = new Hammer( document.getElementById( 'playback' ) );
var $hammerqueue = new Hammer( document.getElementById( 'panel-dx' ) );

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
	displaycommon();
	if ( $( '#panel-sx' ).hasClass( 'active' ) ) indexheight();
}
$hammercontent.on( 'swiperight', function() {
	panelLR();
} ).on( 'swipeleft', function() {
	panelLR( 'left' );
} );

[ $hammerbarleft, $hammerbarright ].forEach( function( e ) {
	e.on( 'swipe', function() {
		$( '#menu-top, #menu-bottom' ).toggleClass( 'hide' );
	} ).get( 'swipe' ).set( { direction: Hammer.DIRECTION_VERTICAL } );
} )
$hammerbarleft.on( 'tap', function() {
	if ( window.innerWidth < 500 ) {
		$( '#coverart' ).slideToggle( function() {
			$( '#time-knob, #volume-knob' ).css( 'margin-top', 0 );
			if ( $( '#coverart' ).is( ':visible' ) ) {
				$( '#playback-row' ).css( 'margin-top', '10px' );
				if ( $( '#play-group' ).is( ':visible' ) ) {
					$( '#share-group' ).show();
				} else {
					$( '#divalbum' ).removeClass( 'hide' );
					$( '#volume-knob' ).css( 'margin-top', '20px' );
				}
			} else {
				$( '#share-group' ).hide();
			}
		} );
	}
} );
// '#play-group, #share-group, #vol-group' use show/hide to comply with css media
$hammerbarright.on( 'tap', function() {
	if ( displayredis.volume != 0 && displayredis.volumempd != 0 ) {
		$( '#play-group, #vol-group' ).toggle();
	} else {
		$( '#play-group' ).toggle();
	}
	if ( $( '#coverart' ).is( ':visible' ) ) {
		$( '#share-group' ).toggle();
	}
	if ( window.innerHeight < 414 ) {
		if ( $( '#play-group' ).is( ':hidden' ) ) {
			$( '#divalbum, #sampling' ).addClass( 'hide' );
			$( '#play-group, #share-group, #vol-group' ).css( 'margin-top', '10px' );
		} else {
			$( '#divalbum, #sampling' ).removeClass( 'hide' );
		}
	}
} );

$hammerinfo.on( 'swiperight', function( e ) {
	$( '#previous' ).click();
	e.stopPropagation();
} ).on( 'swipeleft', function( e ) {
	$( '#next' ).click();
	e.stopPropagation();
} );
$hammertime.on( 'press', function( e ) {
	e.stopPropagation();
} );
$hammercoverart.on( 'tap', function( e ) {
	$( '#play' ).click();
	e.stopPropagation();
} ).on( 'press', function( e ) {
	$( '#stop' ).click();
	e.stopPropagation();
} ).on( 'swiperight', function( e ) {
	$( '#previous' ).click();
	e.stopPropagation();
} ).on( 'swipeleft', function( e ) {
	$( '#next' ).click();
	e.stopPropagation();
} );
$hammervolume.on( 'press', function( e ) {
	e.stopPropagation();
} );

$hammerplayback.on( 'press', function() {
	info( {
		  title  : 'Playback'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysaveplayback" action="displaysave.php" method="post">\
						<input name="playback" type="hidden" value="1">\
						<label><input name="bar" type="checkbox" '+ displayredis.bar +'>&ensp;Top-Bottom menu</label>\
						<br><label><input name="time" type="checkbox" '+ displayredis.time +'>&ensp;Time</label>\
						<br><label><input name="pause" type="checkbox" '+ displayredis.pause +'>&ensp;<code><i class="fa fa-play"></i></code>&emsp;<code><i class="fa fa-pause"></i></code>&emsp;buttons</label>\
						<br><label><input name="coverart" type="checkbox" '+ displayredis.coverart +'>&ensp;Coverart</label>\
						<br><label><input name="volume" type="checkbox" '+ displayredis.volume +'>&ensp;Volume</label>\
						<br><label><input name="buttons" type="checkbox" '+ displayredis.buttons +'>&ensp;Buttons</label>\
						</form>'
		, cancel : 1
		, ok     : function () {
			$.post( 'displaysave.php',
				$( '#displaysaveplayback' ).serialize(),
				function(data) {
					if ( data ) {
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
	if ( parseInt( $( '#playback' ).css( 'padding-top' ) ) < 25 ) {
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
} );

$hammerlibrary.on( 'tap', function( e ) {
	if ( $( '.home-block-remove' ).length && !$( e.target ).is( 'span.block-remove' ) ) $( '#db-homeSetup' ).click();
} ).on( 'press', function() {
	if ( !$( '#db-currentpath' ).hasClass( 'hide' ) ) return
	info( {
		  title  : 'Libary Home'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysavelibrary" action="displaysave.php" method="post">\
						<input name="library" type="hidden" value="1">\
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
			$.post( 'displaysave.php',
				$( '#displaysavelibrary' ).serialize(),
				function(data) {
					if ( data ) {
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
} );

$hammerqueue.on( 'press', function() {
	if ( !$( '#pl-filter-results' ).hasClass( 'hide' ) ) return
	info( {
		  title  : 'Queue Home'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysavequeue" action="displaysave.php" method="post">\
						<label><input name="bar" type="checkbox" '+ displayredis.bar +'>&ensp;Top-Bottom menu</label>\
						</form>'
		, cancel : 1
		, ok     : function () {
			$.post( 'displaysave.php',
				$( '#displaysavequeue' ).serialize(),
				function(data) {
					if ( data ) {
						displayqueue();
					} else {
						info( {
							  title  : 'Queue Home'
							, message: 'Save Queue home failed!'
						} );
					}
				}
			);
		}
	} );
} );

// document ready end *********************************************************************
} );

// show/hide blocks database
var path = /\/.*\//.test( location.pathname ) ? '../../' : ''; // fix path if click in other menu pages
$.get( path +'displayget.php', function( data ) {
	var displayredis = $.parseJSON( data );
} );

function displaycommon() {
	if ( parseInt( $( '#playback' ).css( 'padding-top' ) ) > 25 && window.innerWidth > 568 ) {
		if ( displayredis.bar ) {
			$( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
			$( '#database, #playlist' ).css( 'padding-top', '80px' );
			$( '.btnlist-top' ).css( 'top', '40px' );
		} else {
			$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
			$( '#database, #playlist' ).css( 'padding-top', '40px' );
			$( '.btnlist-top' ).css( 'top', 0 );
		}
	} else {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '#database' ).css( 'padding-top', '40px' );
	}
	$( '#menu-top .playback-controls button' ).toggleClass( 'pausebtn', displayredis.pause === 'checked' && window.innerWidth < 400 );
}
// playback show/hide blocks
function displayplayback() {
	$.get( 'displayget.php', function( data ) {
		displayredis = $.parseJSON( data );
		var volume = ( displayredis.volume == 0 || displayredis.volumempd == 0 ) ? 0 : 1;
		$( '#pause' ).toggleClass( 'hide', !displayredis.pause );
		$( '#time-knob' ).toggleClass( 'hide', !displayredis.time );
		$( '#coverart' ).toggleClass( 'hide', !displayredis.coverart );
		$( '#volume-knob' ).toggleClass( 'hide', !volume );
		var i = 0;
		if ( displayredis.time ) i += 1;
		if ( displayredis.coverart ) i += 1;
		if ( volume ) i += 1;
		var elemW = {
			  3: '30%'
			, 2: '40%'
			, 1: '60%'
		}
		$( '#time-knob, #coverart, #volume-knob' ).css( 'width', elemW[ i ] );
		if ( window.innerWidth > 568 ) {
			$( '#play-group, #share-group, #vol-group' ).css( 'width', elemW[ i ] );
			if ( displayredis.buttons ) {
				$( '#play-group, #share-group, #vol-group' ).show();
				$( '#share-group' ).css( 'display', !( displayredis.time && displayredis.coverart ) ? 'none' : 'block' );
				$( '#vol-group' ).css( 'display', !volume ? 'none' : 'block' );
			} else {
				$( '#play-group, #share-group, #vol-group' ).hide();
			}
		} else {
			$( '#playback' ).css( 'padding-top', '25px' );
		}
		$( '#playback-row' ).removeClass( 'hide' );
		displaycommon();
	} );
}
// library show/hide blocks
function displaylibrary() {
	$.get( 'displayget.php', function( data ) {
		displayredis = $.parseJSON( data );
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
		indexheight();
		window.scrollTo( 0, 0 );
	} );
}
// queue show/hide menu
function displayqueue() {
	$.get( 'displayget.php', function( data ) {
		displayredis = $.parseJSON( data );
		displaycommon();
		window.scrollTo( 0, 0 );
	} );
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
			e.stopPropagation();
			$( '#home-blocks' ).css( 'pointer-events', 'none' );
			$( '#db-homeSetup' ).click();
			setTimeout( function() {
				$( '#home-blocks' ).css( 'pointer-events', 'auto' );
			}, 500 );
		});
		// fix bookmark breadcrumb
		$hammerbookmark.on( 'tap', function( e ) {
			e.stopPropagation();
			GUI.currentDBpos[ 10 ] = $this.attr( 'data-path' ).match( /\//g ).length + 2;
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

// scrolling text
function scrolltext() {
	setTimeout( function() {
		$( '#divartist, #divsong, #divalbum' ).each( function() {
			if ( $( this ).find( 'span' ).width() > Math.floor( window.innerWidth * 0.975 ) ) {
				$( this ).addClass( 'scroll-left' );
			} else {
				$( this ).removeClass( 'scroll-left' );
			}
		} );
	}, 50 );
}

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

function timeConvert3( ss ) {
	var hr = Math.floor( ss / 3600 );
	var mm = Math.floor( ( ss - ( hr * 3600 ) ) / 60 );
	ss = Math.floor( ss - ( hr * 3600 ) - ( mm * 60 ) );
	hr = ( hr > 0 )  ? hr +':' : '';
	mm = ( mm > 9 ) ? mm : '0' + mm;
	ss = ( ss > 9 ) ? ss : '0' + ss;
	return '&ensp;<a>'+ hr + mm +':'+ ss +'</a>&nbsp;';
}
function refreshState() {
// ****************************************************************************************
	scrolltext();
	displayplayback();
	
    var state = GUI.state;
	var fileinfo = '';
// split play-pause buttons
    if (state === 'play') {
        $('#play').addClass('btn-primary');
        $('#stop, #pause').removeClass('btn-primary');
    } else if (state === 'pause') {
        $('#playlist-position span').html('Not playing');
        $('#pause').addClass('btn-primary');
        $('#stop, #play').removeClass('btn-primary');
    } else if (state === 'stop') {
        $('#stop').addClass('btn-primary');
        $('#play, #pause').removeClass('btn-primary');
        if ($('#section-index').length) {
            $('#countdown-display').countdown('destroy');
        }
        if ( GUI.stream !== 'radio' ) {
        	$( '#total' ).html( '00:00' );
        } else {
        	$( '#total' ).html( '' );
        }
        $( '#time' ).val( 0, false ).trigger( 'update' );
        $( '#format-bitrate' ).html( '&nbsp;' );
        $( 'li', '#playlist-entries' ).removeClass( 'active' );
    }
    if ( state !== 'stop' ) {
        if ( GUI.stream !== 'radio' ) {
			$( '#total' ).html( ( GUI.json.time !== undefined ) ? timeConvert( GUI.json.time ) : '00:00' );
		} else {
			$( '#total' ).html( '<a style="color: #587ca0;">streaming</a>' );
		}
// improve song info
	if ( $( '#overlay-playsource-open button' ).text() === 'MPD' ) {
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

function countdownRestart(startFrom) {
    var display = $('#countdown-display').countdown('destroy');
    display.countdown({since: -(startFrom), compact: true, format: 'MS'});
    var displayss = $('#countdown-display-ss').countdown('destroy');
    displayss.countdown({since: -(startFrom), compact: true, format: 'MS'});
	
	// move default lyrics here
	// - prevent re-update on play-pause
	// - easy to switch to 'lyrics addon'
	$.ajax({
		url: '/lyric/',
		success: function(data){
		   $('#lyric-text-overlay').html(data);
		},
		cache: false
	});
}
GUI.json.mute = 0;
function updateGUI() {
    if ( !$( '#section-index' ).length ) return;
// -------------------------------------------------------------------------------
    var volume = GUI.json.volume;
    var radioname = GUI.json.radioname;
    var currentartist = GUI.json.currentartist;
    var currentsong = GUI.json.currentsong ? GUI.json.currentsong : '';
    var currentalbum = GUI.json.currentalbum;
    // set radio mode if stream is present
    GUI.stream = ( radioname ? 'radio' : '' );
    // check MPD status and refresh the UI info
    refreshState();
	// common actions
	if ( !$( '#volume-knob' ).hasClass( 'hide' ) ) {
		if ( !$( '#songinfo-modal' ).length ) {  // 0.3
			$( '#volume' ).val( ( volume === '-1' ) ? 100 : volume, false ).trigger( 'update' );
		} else {
			if ( GUI.vol_changed_local === 0 ) $( '#volume' ).val( ( volume === '-1' ) ? 100 : volume, false ).trigger( 'update' );
		}
	}

	if ( GUI.stream !== 'radio' ) {
		$( '#currentartist' ).html( !currentartist ? '<span class="notag">[no artist]</span>' : currentartist );
		$( '#currentsong' ).html( !currentsong ? '<span class="notag">[no title]</span>' : currentsong );
		$( '#currentalbum').html( !currentalbum ? '<span class="notag">[no album]</span>' : currentalbum );
	} else {
		$( '#currentartist' ).html( !currentartist ? radioname : currentartist );
		$( '#currentalbum' ).html( '<span class="notag">streaming</span>' );
		$( '#currentsong' ).html( !currentsong ? radioname : currentsong );
	}
	
	if ( !$( '#play-group' ).hasClass( 'hide' ) ) {
		$( '#repeat' ).toggleClass( 'btn-primary', GUI.json.repeat === '1' );
		$( '#random' ).toggleClass( 'btn-primary', GUI.json.random === '1' );
		$( '#consume' ).toggleClass( 'btn-primary', GUI.json.consume === '1' );
		$( '#single' ).toggleClass( 'btn-primary', GUI.json.single === '1' );
	}
	
    // song changed
    if ( GUI.currentsong === GUI.json.currentsong ) return;
// -------------------------------------------------------------------------------
	GUI.currentsong = currentsong;	
	countdownRestart(0);
	if ( $('#panel-dx').hasClass('active') ) customScroll( 'pl', parseInt( GUI.json.song ) );
    var currentalbumstring = currentartist +' - '+ currentalbum;
	
    // album changed
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

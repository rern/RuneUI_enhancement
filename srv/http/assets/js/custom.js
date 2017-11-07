$( document ).ready( function() {
// document ready start********************************************************************

$( '#barleft' ).click( function() {
	if ( !$( '#coverart' ).length || !$( '#volume-knob' ).length || window.innerWidth >= 640 ) {
		$( '#menu-top, #menu-bottom' ).toggle();
	} else {
		$( '#coverart' ).slideToggle( function() {
			$( '#time-knob, #volume-knob' ).css( 'margin-top', 0 );
			if ( $( '#coverart' ).is( ':visible' ) ) {
				$( '#playback-row' ).css( 'margin-top', '10px' );
				if ( $( '#play-group' ).is( ':visible' ) ) {
					$( '#share-group' ).show();
				} else {
					$( '#divalbum' ).show();
					$( '#volume-knob' ).css( 'margin-top', '20px' );
				}
				if ( window.innerWidth > 500 ) {
					$( '#coverart' ).css( { 'order': '2', '-webkit-order': '2' } );
					$( '#share-group' ).css( { 'order': '4', '-webkit-order': '4' } );
					$( '#volume-knob' ).css( { 'order': '5', '-webkit-order': '5' } );
					$( '#vol-group' ).css( { 'order': '6', '-webkit-order': '6' } );
				}
			} else {
				$( '#share-group' ).hide();
				if ( window.innerWidth > 500 ) {
					$( '#playback-row' ).css( 'margin-top', 0 );
					$( '#play-group, #vol-group' ).css( 'margin-top', 0 );
					$( '#coverart' ).css( { 'order': '5', '-webkit-order': '5' } );
					$( '#share-group' ).css( { 'order': '6', '-webkit-order': '6' } );
					$( '#volume-knob' ).css( { 'order': '2', '-webkit-order': '2' } );
					$( '#vol-group' ).css ({ 'order': '4', '-webkit-order': '4' } );
				}
			}
		} );
	}
} );
window.addEventListener( 'orientationchange', scrolltext );

$( '#barright' ).click( function() {
	if ( displayredis[ 'volume' ] ) {
		$( '#play-group, #vol-group' ).toggle();
	} else {
		$( '#play-group' ).toggle();
	}
	if ( displayredis[ 'time' ] && $( '#play-group' ).is( ':visible' ) && $( '#coverart' ).is( ':visible' ) ) {
		$( '#share-group' ).show();
	} else {
		$( '#share-group' ).hide();
	}
	if ( window.innerHeight < 414 ) {
		if ( $( '#play-group' ).is( ':visible' ) ) {
			$( '#divalbum, #sampling' ).hide();
			$( '#play-group, #share-group, #vol-group' ).css( 'margin-top', '10px' );
		} else {
			$( '#divalbum, #sampling' ).show();
		}
	}
} );

$( '#open-panel-sx, #open-panel-dx' ).click( function() {
	$( '#barleft, #barright' ).hide();
} );
$( '#open-playback' ).click( function() {
	$( '#barleft, #barright' ).show();
} );
// playback buttons click go back to home page
$( '.playback-controls' ).click( function() {
	if ( !$( '#playback' ).hasClass( 'active' ) ) {
		$( '#open-playback a' ).click();
		$( '#open-playback a' )[ 0 ].click();
	}
} );
// playlist click go back to home page
$( '#playlist-entries' ).click( function( e ) {
	//alert(e.target.nodeName);
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
// menus click remove lyrics
$( '#playsource, #menu-settings, #open-panel-sx, #open-panel-dx' ).click( function() {
	PNotify.removeAll();
	$( '#lyricsfade' ).addClass( 'hide' );
	$( '#menu-bottom' ).removeClass( 'lyrics-menu-bottom' );
} );
// additional play/pause by click
$( '#coverart' ).click( function() {
	$( '#play' ).click();
//	launchIntoFullscreen(document.documentElement); // the whole page
} );
// lastfm search
$( '#currentartist' ).click( function() {
	var artist = $( this ).text();
	if ( artist.slice( 0, 3 ) != '[no' )
		window.open( 'http://www.last.fm/music/'+ artist );
} );
$( '#currentsong' ).click( function() {
	var artist = $( '#currentartist' ).text();
	var song = $( this ).text();
	if ( song.slice( 0, 3 ) != '[no' ) {
		new PNotify( {
			  icon    : 'fa fa-refresh fa-spin fa-lg'
			, title   : 'Lyrics'
			, text    : 'Fetching ...'
			, hide    : false
			, addclass: 'pnotify_custom'
		} );
		$.get( 'lyrics.php',   
			{ artist: artist, song: song },
			function( lyrics ) {
				//var lyrics = $( lyrics ).find( 'lyrics' ).text();
				//var cover = $( lyrics ).find( 'LyricCovertArtUrl' ).text();
				lyrics = lyrics ? lyrics.replace( /&amp;quot;/g, '&quot;' ).replace( /&amp;lt;/g, '&lt;' ).replace( /&amp;gt;/g, '&gt;' ) : '(Lyrics unavailable)';
				PNotify.removeAll();
				// need new 'pnotify.custom.min.js' with 'button', confirm', 'callback', 'css'
				new PNotify( {
					  icon    : false
					, title   : song
					, text    : lyrics +'\n\n&#8226;&#8226;&#8226;\n\n\n\n\n\n\n\n'
					, hide    : false
					, addclass: 'pnotify_lyrics pnotify_custom'
					, buttons : {
						  closer_hover: false
						, sticker     : false
					}
					, before_open: function() {
						$( '#lyricsfade' ).removeClass( 'hide' );
						$( '#menu-bottom' ).addClass( 'lyrics-menu-bottom' );
					}
					, after_close: function() {
						$( '#lyricsfade' ).addClass( 'hide' );
						$( '#menu-bottom' ).removeClass( 'lyrics-menu-bottom' );
						$( '.ui-pnotify' ).remove();
					}
				} );
			}
		);
	}
} );
$( '#currentalbum' ).click( function() {
	var artist = $( '#currentartist' ).text();
	var album = $( this ).text();
	if ( album.slice( 0, 3 ) != '[no' )
		window.open( 'http://www.last.fm/music/'+ artist +'/'+ album );
} );
$( '#menu-bottom' ).click( function() {
	if ( window.innerHeight < 737 ) {
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
} );

// index link
$( '#db-index li' ).click( function() {
	var topoffset = $( '#menu-top' ).is( ':visible' ) ? 80 : 40;
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
// index link height
function indexheight() {
	var indexoffset = ( window.innerWidth > 500 && window.innerHeight ) > 500 ? 160 : 80
	if ( window.innerHeight > 500 ) {
		var indexline = 26;
		$( '.half' ).show();
	} else {
		var indexline = 13;
		$( '.half' ).hide();
	}
	$( '#db-index' ).css( 'line-height', ( window.innerHeight - indexoffset ) / indexline +'px' );
}
indexheight();
window.addEventListener( 'orientationchange', function() {
	setTimeout( indexheight(), 200 );
} );

function panelr( lr ) {
	var paneactive = $( '#content' ).find( 'div.active' ).prop( 'id' );
	if ( paneactive === 'panel-sx' ) {
		var $paneleft = $( '#open-playback a' );
		var $paneright = $( '#open-panel-dx a' );
	} else if ( paneactive === 'playback' ) {
		var $paneleft = $( '#open-panel-dx a' );
		var $paneright = $( '#open-panel-sx a' );
	} else {
		var $paneleft = $( '#open-panel-sx a' );
		var $paneright = $( '#open-playback a' );
	}
	$paneclick = ( lr === 'left' ) ? $paneleft.click() : $paneright.click();
}

// hammer ************************************************************************************
Hammer = propagating( Hammer ); // propagating.js fix e.stopPropagation()

var $hammercontent = new Hammer( document.body );
$hammercontent.on( 'swiperight', function() {
	panelr( 'right' );
} );
$hammercontent.on( 'swipeleft', function() {
	panelr( 'left' );
} );

var $hammerinfo = new Hammer( document.getElementById( 'info' ) );
$hammerinfo.on( 'swiperight', function( e ) {
	$( '#previous' ).click();
	e.stopPropagation();
} );
$hammerinfo.on( 'swipeleft', function( e ) {
	$( '#next' ).click();
	e.stopPropagation();
} );

var $hammerbarleft = new Hammer( document.getElementById( 'barleft' ) );
$hammerbarleft.on( 'swipe', function() {
	$( '#barleft' ).click();
} );
$hammerbarleft.get( 'swipe' ).set( { direction: Hammer.DIRECTION_VERTICAL } );

var $hammerbarright = new Hammer( document.getElementById( 'barright' ) );
$hammerbarright.on( 'swipe', function() {
	$( '#menu-top, #menu-bottom' ).toggle();
} );
$hammerbarright.get( 'swipe' ).set( { direction: Hammer.DIRECTION_VERTICAL } );

var $hammerplayback = new Hammer( document.getElementById( 'playback' ) );
$hammerplayback.on( 'press', function() {
	info( {
		  title  : 'Playback'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysaveplayback" action="displaysave.php" method="post">\
						<input name="playback" type="hidden" value="1">\
						<label><input name="bar" type="checkbox" '+ displayredis[ 'bar' ] +'>&ensp;Top-Bottom menu</label>\
						<br><label><input name="time" type="checkbox" '+ displayredis[ 'time' ] +'>&ensp;Time</label>\
						<br><label><input name="coverart" type="checkbox" '+ displayredis[ 'coverart' ] +'>&ensp;Coverart</label>\
						<br><label><input name="volume" type="checkbox" '+ displayredis[ 'volume' ] +'>&ensp;Volume</label>\
						<br><label><input name="buttons" type="checkbox" '+ displayredis[ 'buttons' ] +'>&ensp;Buttons</label>\
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
} );

var $hammerlibrary = new Hammer( document.getElementById( 'panel-sx' ) );
$hammerlibrary.on( 'tap', function( e ) {
	if ( $( '.home-block-remove' ).length && !$( e.target ).is( 'span.block-remove' ) ) $( '#db-homeSetup' ).click();
} );
$hammerlibrary.on( 'press', function() {
	if ( !$( '#db-currentpath' ).hasClass( 'hide' ) ) return
	info( {
		  title  : 'Libary Home'
		, message: 'Select items to show:'
		, checkboxhtml : '<form id="displaysave" action="displaysave.php" method="post">\
						<input name="library" type="hidden" value="1">\
						<label><input name="bar" type="checkbox" '+ displayredis[ 'bar' ] +'>&ensp;Top-Bottom menu</label>\
						<br><label><input name="nas" type="checkbox" '+ displayredis[ 'nas' ] +'>&ensp;Network mounts</label>\
						<br><label><input name="usb" type="checkbox" '+ displayredis[ 'usb' ] +'>&ensp;USB storage</label>\
						<br><label><input name="webradio" type="checkbox" '+ displayredis[ 'webradio' ] +'>&ensp;My Webradios</label>\
						<br><label><input name="albums" type="checkbox" '+ displayredis[ 'albums' ] +'>&ensp;Albums</label>\
						<br><label><input name="artists" type="checkbox" '+ displayredis[ 'artists' ] +'>&ensp;Artists</label>\
						<br><label><input name="composer" type="checkbox" '+ displayredis[ 'composer' ] +'>&ensp;Composers</label>\
						<br><label><input name="genre" type="checkbox" '+ displayredis[ 'genre' ] +'>&ensp;Genres</label>\
						<br><label><input name="spotify" type="checkbox" '+ displayredis[ 'spotify' ] +'>&ensp;Spotify</label>\
						<br><label><input name="dirble" type="checkbox" '+ displayredis[ 'dirble' ] +'>&ensp;Dirble</label>\
						<br><label><input name="jamendo" type="checkbox" '+ displayredis[ 'jamendo' ] +'>&ensp;Jamendo</label>\
						</form>'
		, cancel : 1
		, ok     : function () {
			$.post( 'displaysave.php',
				$( '#displaysave' ).serialize(),
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

// document ready end *********************************************************************
} );

// show/hide blocks database
$.get( 'displayget.php', function( data ) {
	var displayredis = $.parseJSON( data );
} );
// playback show/hide blocks
function displayplayback() {
	$.get( 'displayget.php', function( data ) {
		displayredis = $.parseJSON( data );
		$( '#time-knob' ).css( 'display', displayredis[ 'time' ] ? 'block' : 'none' );
		$( '#coverart' ).css( 'display', displayredis[ 'coverart' ] ? 'block' : 'none' );
		$( '#volume-knob' ).css( 'display', displayredis[ 'volume' ] ? 'block' : 'none' );
		var i = 0;
		if ( displayredis[ 'time' ] ) i += 1;
		if ( displayredis[ 'coverart' ] ) i += 1;
		if ( displayredis[ 'volume' ] ) i += 1;
		var elemW = {
			  3: '30%'
			, 2: '40%'
			, 1: '60%'
		}
		$( '#time-knob, #coverart, #volume-knob' ).css( 'width', elemW[ i ] );
//		$( '.btnlist-top' ).css( 'top', displayredis[ 'bar' ] ? '40px' : 0 );
		if ( window.innerHeight > 736 || window.innerWidth > 568 ) {
			$( '#menu-top, #menu-bottom' ).css( 'display', displayredis[ 'bar' ] ? 'block' : 'none' );
			$( '#database, #playlist' ).css( 'padding-top', displayredis[ 'bar' ] ? '80px' : '40px' );
			$( '#share-group' ).css( 'display', displayredis[ 'time' ] ? 'block' : 'none' );
			$( '#play-group, #share-group' ).css( 'display', displayredis[ 'buttons' ] ? 'block' : 'none' );
			$( '#play-group, #share-group, #vol-group' ).css( 'width', elemW[ i ] );
			if ( displayredis[ 'buttons' ] && displayredis[ 'volume' ] ) {
				$( '#vol-group' ).show();
			} else {
				$( '#vol-group' ).hide();
			}
		}
		$( '#playback-row' ).removeClass( 'hide' );
	} );
}
// library home show/hide blocks
function displaylibrary() {
	$.get( 'displayget.php', function( data ) {
		displayredis = $.parseJSON( data );
		// no 'id'
		$( '#home-blocks div:contains(Network mounts)' ).css( 'display', displayredis[ 'nas' ] ? 'block' : 'none' );
		$( '#home-usb' ).parent().css( 'display', displayredis[ 'usb' ] ? 'block' : 'none' );
		$( '#home-webradio' ).parent().css( 'display', displayredis[ 'webradio' ] ? 'block' : 'none' );
		$( '#home-albums' ).parent().css( 'display', displayredis[ 'albums' ] ? 'block' : 'none' );
		$( '#home-artists' ).parent().css( 'display', displayredis[ 'artists' ] ? 'block' : 'none' );
		$( '#home-composer' ).parent().css( 'display', displayredis[ 'composer' ] ? 'block' : 'none' );
		$( '#home-genre' ).parent().css( 'display', displayredis[ 'genre' ] ? 'block' : 'none' );
		$( '#home-spotify' ).parent().css( 'display', displayredis[ 'spotify' ] ? 'block' : 'none' );
		$( '#home-dirble' ).parent().css( 'display', displayredis[ 'dirble' ] ? 'block' : 'none' );
		$( '#home-jamendo' ).parent().css( 'display', displayredis[ 'jamendo' ] ? 'block' : 'none' );
		if ( window.innerHeight > 736 || window.innerWidth > 568 ) {
			$( '#menu-top, #menu-bottom' ).css( 'display', displayredis[ 'bar' ] ? 'block' : 'none' );
			$( '#database, #playlist' ).css( 'padding-top', displayredis[ 'bar' ] ? '80px' : '40px' );
			$( '.btnlist-top' ).css( 'top', displayredis[ 'bar' ] ? '40px' : 0 );
		}
	} );
}
// hide breadcrumb, index bar, edit bookmark
var old_renderLibraryHome = renderLibraryHome;
renderLibraryHome = function() {
	old_renderLibraryHome();
	if ( !$( '#playback' ).hasClass( 'active' ) ) $( '#barleft, #barright' ).hide();
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
	});
}
// hide 'to queue' text and 'pl-manage li' click context menu
var old_renderPlaylists = renderPlaylists;
renderPlaylists = function( data ) {
	old_renderPlaylists( data );
	$( '#barleft, #barright' ).hide();
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
// next lyrics on track change
var old_updateGUI = updateGUI;
updateGUI = function() {
	old_updateGUI();
	if ( !$( '#lyricsfade' ).hasClass( 'hide' ) && $( '#currentsong' ).text() != $( 'h4.ui-pnotify-title' ).text() ) {
		PNotify.removeAll();
		$( '#currentsong' ).click();
	}

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

// replace functions in main runeui.js file **********************************************
$( '#db-search-results' ).click( function() {
	$( this ).addClass( 'hide' );
	$( '#db-level-up, #db-currentpath' ).removeClass( 'hide' );
	getDB( {
		path: GUI.currentpath
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
// ****************************************************************************************
	
    var state = GUI.state;
	var fileinfo = '';
    if (state === 'play') {
        $('#play').addClass('btn-primary');
        $('i', '#play').removeClass('fa fa-pause').addClass('fa fa-play');
        $('#stop').removeClass('btn-primary');
    } else if (state === 'pause') {
        $('#playlist-position span').html('Not playing');
        $('#play').addClass('btn-primary');
        $('i', '#play').removeClass('fa fa-play').addClass('fa fa-pause');
        $('#stop').removeClass('btn-primary');
    } else if (state === 'stop') {
        $('#play').removeClass('btn-primary');
        $('i', '#play').removeClass('fa fa-pause').addClass('fa fa-play');
        $('#stop').addClass('btn-primary');
        if ($('#section-index').length) {
            $('#countdown-display').countdown('destroy');
        }
// ****************************************************************************************
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
				sampling = GUI.json.audio.split(':')[ 0 ] / 5512.5;
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

function populateDB(options){
    var data = options.data || '',
        path = options.path || '',
        uplevel = options.uplevel || 0,
        keyword = options.keyword || '',
        plugin = options.plugin || '',
        querytype = options.querytype || '',
        args = options.args || '',
        content = '',
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
            document.getElementById('database-entries').innerHTML = '';
            data = (querytype === 'tracks') ? data.tracks : data.playlists;

            data.sort(function(a, b){
                if (path === 'Spotify' && querytype === '') {
                    nameA = a.hasOwnProperty('name') ? a.name : '';
                    nameB = b.hasOwnProperty('name') ? b.name : '';
                } else if (querytype === 'tracks') {
                    nameA = a.hasOwnProperty('title') ? a.title : '';
                    nameB = b.hasOwnProperty('title') ? b.title : '';
                } else {
                    return 0;
                }
// ****************************************************************************************
// replace - fix sorting
                return nameA.localeCompare(nameB);
// ****************************************************************************************
            });
            for (i = 0; (row = data[i]); i += 1) {
                content += parseResponse({
                    inputArr: row,
                    respType: 'Spotify',
                    i: i,
                    querytype: querytype,
                    inpath: args
                });
            }
            document.getElementById('database-entries').innerHTML = content;
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
                content = document.getElementById('database-entries').innerHTML;
            } else {
                document.getElementById('database-entries').innerHTML = '';
            }            
            data.sort(function(a, b){
                if (querytype === 'childs' || querytype === 'categories') {
                    nameA = a.hasOwnProperty('title') ? a.title : '';
                    nameB = b.hasOwnProperty('title') ? b.title : '';
                } else if (querytype === 'childs-stations' || querytype === 'stations') {
                    nameA = a.hasOwnProperty('name') ? a.name : '';
                    nameB = b.hasOwnProperty('name') ? b.name : '';
                } else {
                    return 0;
                }
// ****************************************************************************************
// replace - fix sorting
                return nameA.localeCompare(nameB);
// ****************************************************************************************
            });

            for (i = 0; (row = data[i]); i += 1) {
                content += parseResponse({
                    inputArr: row,
                    respType: 'Dirble',
                    i: i,
                    querytype: querytype
                });
            }
            document.getElementById('database-entries').innerHTML = content;
        }
        if (plugin === 'Jamendo') {
            $('#database-entries').removeClass('hide');
            $('#db-level-up').removeClass('hide');
            $('#home-blocks').addClass('hide');
            if (path) {
                GUI.currentpath = path;
            }
            document.getElementById('database-entries').innerHTML = '';

            data.sort(function(a, b){
                if (path === 'Jamendo' && querytype === '') {
                    nameA = a.hasOwnProperty('dispname') ? a.dispname : '';
                    nameB = b.hasOwnProperty('dispname') ? b.dispname : '';
                } else {
                    return 0;
                }
// ****************************************************************************************
// replace - fix sorting
                return nameA.localeCompare(nameB);
// ****************************************************************************************
            });
            for (i = 0; (row = data[i]); i += 1) {
                content += parseResponse({
                    inputArr: row,
                    respType: 'Jamendo',
                    i: i,
                    querytype: querytype
                });
            }
            document.getElementById('database-entries').innerHTML = content;
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
            $('#db-currentpath, #db-level-up, #db-index').removeClass('hide');
// ****************************************************************************************
            $('#home-blocks').addClass('hide');
            if (path) {
                GUI.currentpath = path;
            }
            document.getElementById('database-entries').innerHTML = '';
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
            data.sort(function(a, b){
                if (path === 'Artists' || path === 'AlbumArtists'|| path === 'Various Artists') {
                    nameA = a.hasOwnProperty('artist') ? a.artist : '';
                    nameB = b.hasOwnProperty('artist') ? b.artist : '';
                } else if (path === 'Albums') {
                    nameA = a.hasOwnProperty('album') ? a.album : '';
                    nameB = b.hasOwnProperty('album') ? b.album : '';
                } else if (path === 'Webradio') {
                    nameA = a.hasOwnProperty('playlist') ? a.playlist : '';
                    nameB = b.hasOwnProperty('playlist') ? b.playlist : '';
                } else if (path === 'Genres') {
                    nameA = a.hasOwnProperty('genre') ? a.genre : '';
                    nameB = b.hasOwnProperty('genre') ? b.genre : '';
                } else {
// ****************************************************************************************
// replace - fix sorting
                    nameA = a.hasOwnProperty('directory') ? a.directory : '';
                    nameB = b.hasOwnProperty('directory') ? b.directory : '';
                }
                return nameA.localeCompare(nameB);
// ****************************************************************************************
            });
            if (path === 'Webradio') {
// ****************************************************************************************
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
            document.getElementById('database-entries').innerHTML = content;
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
// ****************************************************************************************
//    $( '#db-currentpath, #db-index' ).removeClass( 'hide' );
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
}

function cssKeyframes( name, trx0, trx100 ) {
	var moz = '-moz-'+ trx0;
	var moz100 = '-moz-'+ trx100;
	var webkit = '-webkit-'+ trx0;
	var webkit100 = '-webkit-'+ trx100;
	$( 'head' ).append(
		 '<style id="'+ name +'">'
			+'@-moz-keyframes '+    name +' { 0% { '+ moz +' }    100% { '+ moz100 +' } }'
			+'@-webkit-keyframes '+ name +' { 0% { '+ webkit +' } 100% { '+ webkit100 +' } }'
			+'@keyframes '+         name +' { 0% { '+ trx0 +'}    100% { '+ trx100 +'} }'
		+'</style>'
	);
}
function setSwipe() {
	if ( !GUI.display.bars || ( GUI.screenS && !GUI.display.barsauto ) ) {
		GUI.bars = 0;
		$( '#swipebar, .page' ).on( 'swipeleft swiperight', function( e ) {
			if ( GUI.swipepl ) return // suppress if swipe playlist li
			
			GUI.swipe = 1;
			setTimeout( function() { GUI.swipe = 0 }, 1000 );
			// skip if swipe to show remove in playlist
			if ( !$( e.target ).parents( '#pl-entries li' ).length ) setPageSwipe( e.type );
		} );
	} else {
		GUI.bars = 1;
	}
}
function setPageSwipe( type ) {
	var swipeleft = type === 'swipeleft';
	var $target = {
		  library  : swipeleft ? $( '#tab-playback' ) : $( '#tab-playlist' )
		, playback : swipeleft ? $( '#tab-playlist' ) : $( '#tab-library' )
		, playlist : swipeleft ? $( '#tab-library' )  : $( '#tab-playback' )
	}
	$target[ GUI.currentpage  ].click();
	$( '#swipebar' ).addClass( 'transparent' );
}
function switchPage( page ) {
	clearInterval( GUI.intKnob );
	clearInterval( GUI.intElapsed );
	clearInterval( GUI.intElapsedPl );
	if ( GUI.library && $( '#home-blocks' ).hasClass( 'hide' ) ) {
		if ( !$( '#divcoverarts' ).hasClass( 'hide' ) ) {
			GUI.cvscrolltop = $( window ).scrollTop();
		} else {
			GUI.libraryscrolltop = GUI.currentpath ? $( window ).scrollTop() : 0;
		}
	} else if ( GUI.playlist && GUI.pleditor ) {
		GUI.playlistscrolltop = $( window ).scrollTop();
	}
	$( '#menu-bottom li' ).removeClass( 'active' );
	$( '.page, .menu' ).addClass( 'hide' );
	$( '#page-'+ page ).removeClass( 'hide' );
	$( '#tab-'+ page ).addClass( 'active' );
	$( '#pl-search-close, #pl-search-close' ).addClass( 'hide' );
	GUI.library = GUI.playback = GUI.playlist = 0;
	GUI[ page ] = 1;
	GUI.currentpage = page;
	// restore page scroll
	if ( GUI.playback ) {
		if ( GUI.status.state === 'play' && GUI.status.ext !== 'radio' ) $( '#elapsed' ).empty(); // hide flashing
		$( 'html, body' ).scrollTop( 0 );
	} else if ( GUI.library ) {
		if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
			renderLibrary();
		} else {
			if ( GUI.display.coverfile ) {
				if ( !$( '.licover' ).length ) $( '#db-currentpath a:last-child' ).click();
			} else {
				$( '.licover' ).remove();
			}
			var scrolltop = $( '#divcoverarts' ).hasClass( 'hide' ) ? GUI.libraryscrolltop : GUI.cvscrolltop;
			$( 'html, body' ).scrollTop( scrolltop );
		}
	} else if ( GUI.playlist && GUI.pleditor ) {
		$( 'html, body' ).scrollTop( GUI.playlistscrolltop );
	}
}
function setButtonToggle() {
	var timehide = $( '#time-knob' ).hasClass( 'hide' );
	if ( $( '#play-group' ).is( ':visible' ) ) {
		$( '#irandom' ).addClass( 'hide' )
		$( '#irepeat' ).attr( 'class', 'fa hide' );
		if ( timehide ) {
			$( '#posrandom' ).toggleClass( 'hide', GUI.status.random === 0 );
			$( '#posrepeat' ).attr( 'class', GUI.status.repeat ? ( GUI.status.single ? 'fa fa-repeat-single' : 'fa fa-repeat' ) : 'fa hide' );
		} else {
			$( '#random' ).toggleClass( 'active', GUI.status.random === 1 );
			$( '#repeat' ).toggleClass( 'active', GUI.status.repeat === 1 );
			$( '#single' ).toggleClass( 'active', GUI.status.single === 1 );
			$( '#posrandom' ).addClass( 'hide' );
			$( '#posrepeat' ).attr( 'class', 'fa hide' );
		}
	} else {
		if ( timehide ) {
			$( '#irandom' ).addClass( 'hide' )
			$( '#irepeat' ).attr( 'class', 'fa hide' );
			if ( GUI.status.playlistlength ) {
				$( '#posrandom' ).toggleClass( 'hide', GUI.status.random === 0 );
				$( '#posrepeat' ).attr( 'class', GUI.status.repeat ? ( GUI.status.single ? 'fa fa-repeat-single' : 'fa fa-repeat' ) : 'fa hide' );
			}
		} else {
			$( '#posrandom' ).addClass( 'hide' )
			$( '#posrepeat' ).attr( 'class', 'fa hide' );
			$( '#irandom' ).toggleClass( 'hide', GUI.status.random === 0 );
			$( '#irepeat' ).attr( 'class', GUI.status.repeat ? ( GUI.status.single ? 'fa fa-repeat-single' : 'fa fa-repeat' ) : 'fa hide' );
		}
	}
	if ( GUI.display.update ) {
		if ( GUI.bars ) {
			$( '#iaddons' ).addClass( 'hide' );
		} else {
			if ( timehide ) {
				$( '#posaddons' ).removeClass( 'hide' );
				$( '#iaddons' ).addClass( 'hide' );
			} else {
				$( '#posaddons' ).addClass( 'hide' );
				$( '#iaddons' ).removeClass( 'hide' );
			}
		}
	} else {
		$( '#posaddons, #iaddons' ).addClass( 'hide' );
	}
	if ( timehide ) {
		$( '#posgpio' ).toggleClass( 'hide', GUI.gpio !== 'ON' );
	} else {
		$( '#posgpio' ).addClass( 'hide' );
		$( '#igpio' ).toggleClass( 'hide', GUI.gpio !== 'ON' );
	}
}
function setButtonUpdate() {
	if ( GUI.status.updating_db ) {
		$( '#tab-library i, #db-home i' ).addClass( 'blink' );
		if ( GUI.playback && !GUI.bars ) {
			if ( $( '#time-knob' ).hasClass( 'hide' ) ) {
				$( '#posupdate' ).removeClass( 'hide' );
				$( '#iupdate' ).addClass( 'hide' );
			} else {
				$( '#posupdate' ).addClass( 'hide' );
				$( '#iupdate' ).removeClass( 'hide' );
			}
		}
	} else {
		$( '#tab-library i, #db-home i, .db-icon' ).removeClass( 'blink' );
		$( '#posupdate, #iupdate' ).addClass( 'hide' );
	}
}
function getUpdateStatus() {
	clearInterval( GUI.intUpdate );
	clearTimeout( GUI.debounce );
	GUI.debounce = setTimeout( function() {
		$.post( 'enhance.php', { getcount: 1 }, function( data ) {
			$( '.home-block gr' ).remove();
			$.each( data, function( id, val ) {
				if ( val ) $( '#home-'+ id ).find( 'i' ).after( '<gr>'+ numFormat( val ) +'</gr>' );
			} );
		}, 'json' );
		if ( $( '#db-currentpath .lipath' ).text() === 'Webradio' ) return;
		
		$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
			GUI.status.updating_db = status.updating_db ? 1 : 0;
			setButtonUpdate();
			if ( status.updating_db ) {
				GUI.intUpdate = setInterval( getUpdateStatus, 5000 );
			} else {
				clearInterval( GUI.intUpdate );
				GUI.intUpdate = false;
				notify( 'Library Database', 'Database updated.', 'library' );
			}
		}, 'json' );
	}, GUI.debouncems );
}
function setButton() {
	$( '#playback-controls' ).toggleClass( 'hide', GUI.status.playlistlength === 0 );
	var state = GUI.status.state;
	if ( GUI.bars ) {
		$( '#playback-controls button' ).removeClass( 'active' );
		$( '#'+ state ).addClass( 'active' );
	}
	if ( GUI.display.update ) {
		if ( GUI.bars ) $( '#badge' ).text( GUI.display.update ).removeClass( 'hide' );
	} else {
		$( '#badge' ).empty().addClass( 'hide' );
	}
	setTimeout( function() {
		setButtonUpdate();
		if ( GUI.playback ) setButtonToggle();
	}, 100 );
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
	if ( second <= 0 ) return 0;
	
	var second = Math.round( second );
	var hh = Math.floor( second / 3600 );
	var mm = Math.floor( ( second % 3600 ) / 60 );
	var ss = second % 60;
	
	hh = hh ? hh +':' : '';
	mm = hh ? ( mm > 9 ? mm +':' : '0'+ mm +':' ) : ( mm ? mm +':' : '' );
	ss = mm ? ( ss > 9 ? ss : '0'+ ss ) : ss;
	return hh + mm + ss;
}
function scrollLongText() {
	var $el = $( '#artist, #song, #album' );
	$el
		.removeClass( 'scrollleft' )
		.removeAttr( 'style' ); // fix - iOS needs whole style removed
	var wW = window.innerWidth;
	var tWmax = 0;
	$el.each( function() {
		var $this = $( this );
		var tW = $this.width() * GUI.scale;
		if ( tW > wW * 0.98 ) {
			if ( tW > tWmax ) tWmax = tW; // same width > scroll together (same speed)
			$this.addClass( 'scrollleft' );
		}
	} );
	$el.css( 'visibility', 'visible' ); // from initial hidden
	if ( !$( '.scrollleft' ).length ) return
	
	// varied with only when scaled
	var cssanimate = ( wW + tWmax ) / GUI.scrollspeed +'s infinite scrollleft linear'; // calculate to same speed
	$( '.scrollleft' ).css( {
		  width               : tWmax +'px'
		, animation           : cssanimate
		, '-moz-animation'    : cssanimate
		, '-webkit-animation' : cssanimate
	} )
}
function removeSplash() {
	$( '#splash' ).remove();
	$( '#cover-art, .btn-group' ).removeClass( 'hide' );
	$( '.rs-animation .rs-transition' ).css( 'transition-property', '' ); // restore animation after load
	$( 'html, body' ).scrollTop( 0 );
	if ( !$( '#divcoverarts' ).html() ) return
	
	var $coverartlazy = $( '#divcoverarts .lazy' );
	var lazyL = $coverartlazy.length;
	if ( lazyL ) {
		lazyLoad = new LazyLoad( { elements_selector: '.lazy' } );
		// for load 1st page without lazy
		var perrow = $( 'body' )[ 0 ].clientWidth / 200;
		var percolumn = window.innerHeight / 200;
		var perpage = Math.ceil( perrow ) * Math.ceil( percolumn );
		if ( perpage > lazyL ) perpage = lazyL;
		var lazy = document.getElementsByClassName( 'lazy' );
		for( i = 0; i < perpage; i++ ) lazyLoad.load( lazy[ i ], 'force' );
	}
}
function setPlaybackBlank() {
	$( '#playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#song' ).html( '<i class="fa fa-plus-circle" style="width: 40px"></i>' );
	$( '#divpos i' ).addClass( 'hide' );
	$( '#artist, #album, #songposition, #format-bitrate, #timepos, #elapsed, #total' ).empty();
	if ( GUI.display.time ) $( '#time' ).roundSlider( 'setValue', 0 );
	$( '#coverartoverlay' ).addClass( 'hide' );
	$( '#cover-art' )
		.attr( 'src', coverrune )
		.css( 'border-radius', '' );
	$( '#artist, #song, #album' )
		.removeClass( 'scrollleft' )
		.removeAttr( 'style' )
		.css( 'visibility', 'visible' );
}
function renderPlayback() {
	var status = GUI.status;
	if ( status.coverart ) $( '.licover-save' ).remove();
	// song and album before update for song/album change detection
	var previoussong = $( '#song' ).text();
	var previousalbum = $( '#album' ).text();
	// volume
	$volumeRS.setValue( status.volume );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
	if ( GUI.display.volume && GUI.display.volumempd ) {
		status.volumemute != 0 ? muteColor( status.volumemute ) : unmuteColor();
	}
	clearInterval( GUI.intKnob );
	clearInterval( GUI.intElapsed );
	// empty queue
	if ( !status.playlistlength ) {
		setPlaybackBlank();
		return
	}
	
	$( '.playback-controls' ).css( 'visibility', 'visible' );
	$( '#artist, #song, #album' ).css( 'width', '' );
	$( '#cover-art' ).removeClass( 'vu' );
	if ( !GUI.coversave ) $( '.licover-save' ).remove();
	$( '#artist' ).html( status.Artist );
	$( '#song' ).html( status.Title );
	$( '#album' )
		.toggleClass( 'albumradio', status.ext === 'radio' )
		.html( status.Album ).promise().done( function() {
		scrollLongText();
	} );
	
	$( '#songposition' ).text( ( +status.song + 1 ) +'/'+ status.playlistlength );
	var ext = ( status.ext !== 'radio' ) ? '<wh> • </wh>' + status.ext : '';
	var dot = GUI.display.time ? '<wh id="dot0"> • </wh>' : '';
	$( '#format-bitrate' ).html( dot + status.sampling + ext )
	if ( status.ext === 'radio' ) {
		$( '#time' ).roundSlider( 'setValue', 0 );
		if ( status.state === 'play' ) {
			if ( !status.Title ) $( '#song' ).html( blinkdot );
			$( '#elapsed' ).html( status.state === 'play' ? blinkdot : '' );
			var elapsed = status.elapsed;
			if ( GUI.display.time ) {
				$( '#timepos' ).empty();
				if ( GUI.display.radioelapsed || GUI.localhost ) {
					GUI.intElapsed = setInterval( function() {
						elapsed++;
						elapsedhms = second2HMS( elapsed );
						$( '#total' ).text( elapsedhms ).addClass( 'gr' );
					}, 1000 );
				} else {
					$( '#total' ).empty();
				}
			} else {
				$( '#total' ).empty();
				if ( GUI.display.radioelapsed ) {
					GUI.intElapsed = setInterval( function() {
						elapsed++;
						elapsedhms = second2HMS( elapsed );
					$( '#timepos' ).html( '&ensp;<i class="fa fa-play"></i>&ensp;'+ elapsedhms );
					}, 1000 );
				} else {
					$( '#timepos' ).empty();
				}
			}
		} else {
			$( '#song' ).html( '·&ensp;·&ensp;·' );
			$( '#elapsed, #total, #timepos' ).empty();
		}
		// webradio coverart
		if ( status.coverart ) {
			$( '#cover-art' )
				.attr( 'src', status.coverart )
				.css( 'border-radius', '' );
			$( '#coverartoverlay' ).addClass( 'hide' );
		} else {
			$( '#cover-art' )
				.attr( 'src', status.state === 'play' ? vu : vustop )
				.css( 'border-radius', '18px' )
				.addClass( 'vu' );
			$( '#coverartoverlay' ).removeClass( 'hide' );
		}
		return
	}
	
	$( '#cover-art' ).css( 'border-radius', '' );
	$( '#coverartoverlay' ).addClass( 'hide' );
	if ( status.Title !== previoussong || status.Album !== previousalbum || !status.Album ) {
		$( '#cover-art' )
			.attr( 'src', status.coverart || coverrune )
			.css( 'border-radius', '' );
		if ( status.coverart ) {
			GUI.coversave = 0;
		} else {
			// get mbid from lastfm > get coverart from coverartarchive.org
			$.ajax( {
				  type     : 'post'
				, url      : 'http://ws.audioscrobbler.com/2.0/'
				, data     : { 
					  api_key     : lastfmapikey
					, autocorrect : 1
					, format      : 'json'
					, method      : 'album.getinfo'
					, artist      : status.Artist
					, album       : status.Album
				}
				, timeout  : 5000
				, dataType : 'json'
				, success  : function( data ) {
					if ( data.album.mbid ) {
						$.post( 'http://coverartarchive.org/release/'+ data.album.mbid, function( data ) {
							var image = data.images[ 0 ][ 'image' ];
							if ( image ) {
								var img = new Image();
								img.src = image;
								img.setAttribute( 'crossOrigin', 'anonymous' );
								img.onload = function() {
									var canvas = document.createElement( 'canvas' );
									canvas.width = this.width;
									canvas.height = this.height;
									canvas.getContext( '2d' ).drawImage( this, 0, 0 );
									$( '#cover-art' )
										.attr( 'src', canvas.toDataURL( 'image/jpeg' ) )
										.after( '<i class="edit licover-save fa fa-save"></i>' );
									GUI.coversave = 1;
								}
							}
						} );
					}
				}
			} );
		}
	}
	// time
	time = status.Time;
	var timehms = second2HMS( time );
	$( '#total' ).text( timehms );
	// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( status.state === 'stop' ) {
		$( '#song' ).removeClass( 'gr' );
		if ( GUI.display.time ) {
			$( '#time' ).roundSlider( 'setValue', 0 );
			$( '#elapsed' ).text( timehms ).addClass( 'gr' );
			$( '#total, #timepos' ).empty();
		} else {
			$( '#timepos' ).html( '&ensp;<i class="fa fa-stop"></i>&ensp;'+ timehms );
		}
		return
	}
	
	$( '#elapsed, #total' ).removeClass( 'bl gr wh' );
	$( '#song' ).toggleClass( 'gr', status.state === 'pause' );
	var elapsed = status.elapsed || 0;
	var elapsedhms = second2HMS( elapsed );
	if ( !elapsedhms ) $( '#elapsed' ).empty();
	var position = Math.round( elapsed / time * 1000 );
	// pause <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( status.state === 'pause' ) {
		if ( GUI.display.time ) {
			$( '#time' ).roundSlider( 'setValue', position );
			$( '#elapsed' ).text( elapsedhms );
			$( '#elapsed' ).addClass( 'bl' );
			$( '#total' ).addClass( 'wh' );
			$( '#timepos' ).empty();
		} else {
			$( '#timepos' ).html( '&ensp;<i class="fa fa-pause"></i>&ensp;<bl>'+ elapsedhms +'</bl> / '+ timehms );
		}
		return
	}
	
	if ( GUI.display.time ) {
		GUI.intElapsed = setInterval( function() {
			elapsed++;
			elapsedhms = second2HMS( elapsed );
			$( '#elapsed' ).text( elapsedhms );
		}, 1000 );
		GUI.intKnob = setInterval( function() {
			position++;
			if ( position === 1000 ) {
				clearInterval( GUI.intKnob );
				clearInterval( GUI.intElapsed );
				$( '#elapsed' ).empty();
			}
			$( '#time' ).roundSlider( 'setValue', position );
		}, time );
	} else {
		GUI.intElapsed = setInterval( function() {
			elapsed++;
			elapsedhms = second2HMS( elapsed );
			$( '#timepos' ).html( '&ensp;<i class="fa fa-play"></i>&ensp;<w>'+ elapsedhms +'</w> / '+ timehms );
		}, 1000 );
	}

	// playlist current song ( and lyrics if installed )
	if ( status.Title !== previoussong || status.Album !== previousalbum ) {
		if ( GUI.playlist && !GUI.pleditor ) setPlaylistScroll();
		if ( $( '#lyricscontainer' ).length && !$( '#lyricscontainer' ).hasClass( 'hide' ) ) getlyrics();
	}
}
function getPlaybackStatus() {
	$.post( 'enhancestatus.php', { artist: $( '#artist' ).text(), album: $( '#album' ).text() }, function( status ) {
		// 'gpio off' > audio output switched > restarts mpd which makes status briefly unavailable
		if ( typeof status !== 'object' ) return
		
		if ( status.activePlayer === 'Airplay' ) {
			displayAirPlay();
			return
		}
		var playlistlength = GUI.status.playlistlength;
		$.each( status, function( key, value ) {
			GUI.status[ key ] = value;
		} );
		GUI.plreplace = 0;
		renderPlayback();
		setButton();
		// imodedelay fix imode flashing on audio output switched
		if ( !GUI.imodedelay ) displayPlayback();
	}, 'json' );
}
function getBio( artist ) {
	$( '#loader' ).removeClass( 'hide' );
	$.post( 'http://ws.audioscrobbler.com/2.0/?autocorrect=1&format=json&method=artist.getinfo&api_key='+ lastfmapikey +'&artist='+ encodeURI( artist ), function( data ) {
		var data = data.artist;
		if ( !data.bio.content ) {
			info( {
				  icon    : 'bio'
				, title   : 'Bio'
				, message : 'No data available.'
			} );
			return
		}
		
		var content = data.bio.content.replace( /\n/g, '<br>' ).replace( /Read more on Last.fm.*/, '' );
		var genre = data.tags.tag[ 0 ].name;
		if ( genre ) genre = '<p class="genre"><i class="fa fa-genre fa-lg"></i>&ensp;'+ genre +'</p>';
		var similar =  data.similar.artist;
		if ( similar ) {
			similars = '<br><p><i class="fa fa-artist fa-lg"></i>&ensp;Similar Artists: <i class="fa fa-external-link gr"></i><p><span>';
			similar.forEach( function( artist ) {
				similars += '<a class="biosimilar">'+ artist.name +'</a>,&ensp;';
			} );
			similars = similars.slice( 0, -7 ) +'</span>';
		}
		var html = '<form class="form-horizontal">'
						+'<p class="artist">'+ artist +'</p>'
						+ genre
						+'<p>'+ content +'</p>'
						+'<div style="clear: both;"></div>'
						+ similars
						+'<br><br>'
						+'<p><span style="float: right;">Text: last.fm,&ensp;Image: fanart.tv</span></p>'
				  +'</form>';
		$( '#biocontent' ).html( html ).promise().done( function() {
			$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
			$( '#bio' ).removeClass( 'hide' );
			$( '#bio' ).scrollTop( 0 );

			$.get( 'https://webservice.fanart.tv/v3/music/'+ data.mbid +'&?api_key=06f56465de874e4c75a2e9f0cc284fa3', function( data ) {
				var src = data.artistthumb[ 0 ].url;
				if ( src ) $( '#biocontent form' ).prepend( '<img id="bioimg" src="'+ src +'">' );
			} );
		} );
	} );
}
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
	$volumetooltip.text( volumemute ).addClass( 'bl' );
	$volumehandle.addClass( 'bgr' );
	$( '#volmute' ).addClass( 'active' )
		.find( 'i' ).removeClass( 'fa-volume' ).addClass( 'fa-mute' );
}
function unmuteColor() {
	$volumetooltip.removeClass( 'bl' );
	$volumehandle.removeClass( 'bgr' );
	$( '#volmute' ).removeClass( 'active' )
		.find( 'i' ).removeClass( 'fa-mute' ).addClass( 'fa-volume' );
}
function displayTopBottom() {
	if ( !$( '#bio' ).hasClass( 'hide' ) ) return
	if ( !GUI.display.bars || ( GUI.screenS && !GUI.display.barsauto ) ) {
		GUI.bars = 0;
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '#db-list, #pl-list' ).css( 'padding', '40px 0' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#home-blocks' ).css( 'padding-top', '50px' );
	} else {
		GUI.bars = 1;
		$( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
		$( '#pause' ).toggleClass( 'hide', GUI.status.ext === 'radio' );
		$( '#db-list, #pl-list' ).css( 'padding', '' );
		$( '.btnlist-top' ).css( 'top', '40px' );
		$( '#home-blocks' ).css( 'padding-top', '' );
	}
	var menuH = ( $( '#settings a' ).length - $( '#settings a.hide' ).length ) * 41 - 1;
	$( '#settings .menushadow' ).css( 'height', menuH +'px' );
	$( '.menu' ).addClass( 'hide' );
}
function displayPlayback() {
	displayTopBottom();
	$( '#time-knob, #play-group' ).toggleClass( 'hide', GUI.display.time === '' );
	$( '#coverart, #share-group' ).toggleClass( 'hide', GUI.display.cover === '' );
	var volume = ( GUI.display.volumempd && GUI.display.volume ) ? 1 : 0;
	$( '#volume-knob, #vol-group' ).toggleClass( 'hide', !volume );
	
	var column = ( GUI.display.time ? 1 : 0 ) + ( GUI.display.cover ? 1 : 0 ) + volume;
	var $elements = $( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' );
	if ( column === 2 && window.innerWidth > 499 ) {
		if ( volume ) {
			$elements.css( { order: '', '-webkit-order': '' } );
		} else {
			var i = 0;
			$elements.each( function() {
				$( this ).css( { order: i, '-webkit-order': i } );
				i++;
			} );
		}
		$( '#playback-row' ).css( 'max-width', '900px' );
		$elements.css( 'width', '45%' );
	} else if ( column === 1 ) {
		$( '#playback-row' ).css( 'max-width', '' );
		$elements.css( 'width', '90%' );
	} else {
		$elements.css( 'width', '' );
	}
	if ( !GUI.display.buttons ) {
		$( '#play-group, #share-group, #vol-group' ).addClass( 'hide' );
		if ( GUI.display.time ) $( '#iplayer' ).attr( 'class', GUI.status.activePlayer === 'MPD' ? 'fa hide' : 'fa fa-'+ GUI.status.activePlayer.toLowerCase() );
	}
	// no scaling for webradio vu meter
	if ( !$( '#cover-art' ).hasClass( 'vu' )
		&& ( GUI.display.coverlarge || ( !GUI.display.time && !GUI.display.volume ) )
	) {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).removeClass( 'coversmall' );
		var maxW = GUI.bars ? '45vh' : '55vh';
		$( '#divcover, #cover-art' ).css( {
			  width        : ''
			, height       : ''
			, 'max-width'  : maxW
			, 'max-height' : maxW
		} );
		if ( wW < 500 ) $( '#format-bitrate' ).css( 'display', GUI.display.time ? 'inline' : 'block' );
		if ( !GUI.display.time && !GUI.display.volume ) $( '#share-group' ).addClass( 'hide' );
	} else {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).addClass( 'coversmall' );
		$( '#divcover, #cover-art' ).css( {
			  width        : '100%'
			, height       : '100%'
			, 'max-width'  : ''
			, 'max-height' : ''
		} );
	}
	if ( GUI.display.time ) {
		$( '#divpos' ).css( 'font-size', '' );
		$( '#timepos' ).empty();
	} else {
		$( '#divpos' ).css( 'font-size', '20px' );
		$( '#format-bitrate' ).css( 'display', 'block' );
	}
	var wW = window.innerWidth;
	var wH = window.innerHeight;
	if ( $( '.playback-block.hide' ).length && wH > 420 ) return
	
	if ( ( wW < 750 && wW  > wH ) || wH < 475 ) {
		GUI.scale = wH > 475 ? wW / 800 : wH / 450;
		var padding = GUI.bars ? '70px' : '40px';
		$( '#page-playback' ).css( {
			  transform          : 'scale( '+ GUI.scale +' )'
			, 'transform-origin' : 'top'
			, height             : 'calc( 100vh + '+ padding +' )'
			, 'padding-top'      : ''
		} );
		var width = Math.round( 100 / GUI.scale ) +'%';
		$( '#info, #playback-row' ).css( {
			  width         : width
			, 'margin-left' : ( 100 / GUI.scale - 100 ) / -2 +'%'
		} );
	} else {
		GUI.scale = 1;
		var compact = GUI.bars || !GUI.screenS;
		$( '#page-playback, #info, #playback-row' ).removeAttr( 'style' );
		$( '#page-playback' ).css( 'padding-top', compact ? '' : '40px' );
		$( '#playback-row' ).css( 'margin-top', compact ? '' : '20px' )
		$( '#csskeyframesS' ).remove();
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
	$( '#playback-row' ).removeClass( 'hide' );
	$( '#time-knob' ).toggleClass( 'hide', GUI.display.time === '' );
	$( '#irandom, #irepeat, #posrandom, #posrepeat, #coverartoverlay, #volume-knob, #play-group, #share-group, #vol-group' ).addClass( 'hide' );
	if ( GUI.display.time ) {
		$( '#time-knob, #play-group, #coverart, #share-group' ).css( 'width', '45%' );
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		$( '#time' ).roundSlider( 'setValue', 0 );
		$( '#elapsed' ).html( blinkdot );
		$( '#total' ).empty();
		$( '#iplayer' ).attr( 'class', 'fa fa-airplay' );
	} else {
		$( '#coverart, #share-group' ).css( 'width', '90%' );
	}
}
function windowopen( url ) { // share this track
	window.open = (
		  url
		, 'menubar=no'
		, 'toolbar=no'
		, 'resizable=yes'
		, 'scrollbars=yes'
		, 'height=600'
		, 'width=600'
	);
}
function displayIndexBar() {
	setTimeout( function() {
		var wH = window.innerHeight;
		var indexoffset = GUI.bars ? 160 : 80;
		var indexline = wH < 500 ? 13 : 27;
		$( '.half' ).toggleClass( 'hide', wH < 500 );
		var $index = GUI.library ? $( '#db-index' ) : $( '#pl-index' );
		$index.css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
	}, 50 );
}
function disableCheckbox( name, enable, check ) {
	$( 'input[name="'+ name +'"]' )
		.prop( 'disabled', ( enable ? false : true ) )
		.prop( 'checked', ( check ? true : false ) )
		.parent().toggleClass( 'gr', enable === 1 );
}
function displayCheckbox( checkboxes ) {
	var html = '';
	var col,br;
	$.each( checkboxes, function( key, val ) {
		if ( val[ 0 ] === '_' ) {
			col = ' class="infocol"';
			br = '';
			val = val.slice( 1 );
		} else {
			col = '';
			br = '<br>';
		}
		html += '<label'+ col +'><input name="'+ key +'" type="checkbox" '+ GUI.display[ key ] +'>&ensp;'+ val +'</label>'+ br;
	} );
	return html;
}
function renderLibraryBlocks( bookmarks ) { // on visible
	var content = '';
	$( '.bookmark' ).remove();
	$.each( bookmarks, function( i, bookmark ) {
		if ( bookmark.coverart ) {
			var iconhtml = '<img class="bkcoverart" src="'+ bookmark.coverart +'">';
		} else {
			var iconhtml = '<i class="fa fa-bookmark"></i>'
						  +'<div class="divbklabel"><span class="bklabel label">'+ bookmark.name +'</span></div>';
		}
		content += '<div class="divblock bookmark">'
					+'<div class="home-block home-bookmark">'
						+'<a class="lipath">'+ bookmark.path +'</a>'
						+ iconhtml
					+'</div>'
				  +'</div>';
	} );
	$( '#divhomeblocks' ).append( content ).promise().done( function() {
		orderLibrary();
	} );
}
function orderLibrary() {
	if ( GUI.display.order.length ) {
		GUI.display.order.forEach( function( name ) {
			var $divblock = $( '.divblock' ).filter( function() {
				return $( this ).find( '.lipath' ).text() === name;
			} );
			$divblock.detach();
			$( '#divhomeblocks' ).append( $divblock );
		} );
	}
}
function renderLibrary() {
	GUI.dbbackdata = [];
	GUI.plugin = '';
	$( '#db-currentpath' ).css( 'max-width', '' );
	$( '#db-currentpath>span, #db-currentpath>i, #db-searchbtn' ).removeClass( 'hide' );
	$( '#db-currentpath .lipath' ).empty()
	$( '#db-entries' ).empty();
	$( '#db-search, #db-search-close, #db-index, #db-back, #db-webradio-new, #divcoverarts' ).addClass( 'hide' );
	$( '#db-search-keyword' ).val( '' );
	if ( $( '#db-entries' ).hasClass( 'hide' ) ) return
	
	$( '#page-library .btnlist-top, db-entries' ).addClass( 'hide' );
	if ( GUI.display.count ) {
		$( '#db-currentpath span' ).html( '<bl class="title">LIBRARY<gr>·</gr></bl><span id="li-count"><wh>'+ numFormat( $( '#home-blocks' ).data( 'count' ) ) +'</wh> <i class="fa fa-music"></i></span>' );
	} else {
		$( '#db-currentpath span' ).html( '<bl class="title">LIBRARY</bl></a>' );
	}
	$( '#page-library .btnlist-top, #home-blocks' ).removeClass( 'hide' );
	$( '.home-block:not( .home-bookmark )' ).each( function() {
		var name = this.id.replace( 'home-', '' );
		$( this ).parent().toggleClass( 'hide', GUI.display[ name ] === '' );
//		if ( [ 'sd', 'usb', 'nas' ].indexOf( name ) !== -1 ) $( this ).parent().toggleClass( 'hide', !$( this ).find( 'gr' ).text() );
	} );
	$( '.home-block gr' ).toggleClass( 'hide', GUI.display.count === '' );
	if ( GUI.display.label ) {
		$( '#divhomeblocks a.label' ).show();
		$( '.home-block gr' ).css( 'color', '' );
		$( '.home-block' ).css( 'padding', '' );
	} else {
		$( '#divhomeblocks a.label' ).hide();
		$( '.home-block gr' ).css( 'color', '#e0e7ee' );
		$( '.home-block:not( .home-bookmark )' ).css( 'padding-top', '35px' );
	}
	orderLibrary();
	displayTopBottom();
	$( 'html, body' ).scrollTop( 0 );
	$( '#home-coverart .fa-coverart' ).addClass( 'bl', $( '#divcoverarts' ).is( 'not:empty' ) );
}
function infoNoData() {
	$( '#loader' ).addClass( 'hide' );
	if ( GUI.plugin ) return
	
	var keyword = $( '#db-search-keyword' ).val();
	info( {
		  icon      : 'info-circle'
		, message   : ( !keyword ? 'No data in this location.<br>Update for changes then try again.' : 'Nothing found for <wh>'+ keyword +'</wh>' )
		, autoclose : 8000
	} );
}
function getData( options ) {
	$( '#loader' ).removeClass( 'hide' );
	if ( !Array.isArray( options.path ) ) {
		var path = options.path ? options.path.toString().replace( /"/g, '\"' ) : '';
	} else { // cue, m3u, m3u8, pls
		var plfiles = [];
		$.each( options.path, function( i, val ) {
			plfiles.push( val.toString().replace( /"/g, '\"' ) );
		} );
		$.post( 'enhance.php', { playlist: plfiles }, function( data ) {
			data ? dataParse( data, plfiles[ 0 ] ) : infoNoData();
		}, 'json' );
		return
	}
	var cmd = options.cmd || 'browse',
		browsemode = options.browsemode || 'file',
		querytype = options.querytype || '',
		args = options.args || '',
		artist = options.artist ? options.artist.toString().replace( /"/g, '\"' ) : '',
		mode,
		command;
	var currentpath = $( '#db-currentpath .lipath:last' ).text();
	var composer = $( '#rootpath' ).data( 'path' ) === 'Composer' ? $( '#artistalbum span' ).text() : '';
	currentpath = currentpath ? currentpath.toString().replace( /"/g, '\"' ) : '';
	if ( !GUI.dbback && cmd !== 'search' && GUI.dbbrowsemode !== 'file' ) {
		GUI.dbbackdata.push( {
			  path       : path
			, browsemode : browsemode
			, args       : args
			, querytype  : querytype
		} );
	} else if ( cmd === 'search' && currentpath ) {
		if ( GUI.dbbackdata.length ) {
			GUI.dbbackdata.push( GUI.dbbackdata[ GUI.dbbackdata.length - 1 ] );
		} else {
			GUI.dbbackdata.push( {
				  path       : currentpath
				, browsemode : GUI.browsemode
			} );
		}
	} else {
		GUI.dbback = 0;
	}
	var keyword = $( '#db-search-keyword' ).val();
	keyword = keyword ? keyword.toString().replace( /"/g, '\"' ) : '';
	GUI.browsemode = browsemode;
	if ( !GUI.plugin ) {
		var format = '"%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%"';
		var command = {
			  file          : { mpc   : 'mpc ls -f '+ format +' "'+ path +'" 2> /dev/null', list: 'file' }
			, artistalbum   : { mpc   : 'mpc find -f '+ format + ( artist ? ' artist "'+ artist +'"' : '' ) +' album "'+ path +'"', list: 'file', name: path }
			, composeralbum : { mpc   : 'mpc find -f '+ format +' composer "'+ composer +'" album "'+ path +'"', list: 'file' }
			, album         : { album : 'mpc find -f "%album%^^[%albumartist%|%artist%]" album "'+ path +'" | awk \'!a[$0]++\'', albumname: path }
			, genre         : { album : 'mpc find -f "%album%^^%artist%" genre "'+ path +'" | awk \'!a[$0]++\'', genrename: path }
			, artist        : { mpc   : 'mpc list album artist "'+ path +'" | awk NF', list: 'album' }
			, albumartist   : { mpc   : 'mpc list album albumartist "'+ path +'" | awk NF', list: 'album' }
			, composer      : { mpc   : 'mpc list album composer "'+ path +'" | awk NF', list: 'album' }
			, type          : { mpc   : 'mpc list '+ browsemode +' | awk NF', list: browsemode }
			, search        : { mpc   : 'mpc search -f '+ format +' any "'+ keyword +'"', list: 'file' }
			, Webradio      : { getwebradios  : 1 }
			, coverart      : { coverartalbum : path, artist: artist }
		}
		if ( cmd === 'search' ) {
			mode = 'search';
		} else if ( cmd === 'browse' ) {
			if ( [ 'Album', 'Artist', 'AlbumArtist', 'Composer', 'Genre' ].indexOf( path ) !== -1 ) {
				mode = 'type';
			} else if ( path === 'Webradio' ) {
				mode = 'Webradio';
			} else if ( // <li> in 'Album' and 'Genre'
				( browsemode === 'album' && currentpath !== 'Album' && artist )
				|| ( browsemode === 'genre' && currentpath !== 'Genre' && artist )
			) {
				mode = 'artistalbum';
			} else {
				if ( composer ) {
					mode = 'composeralbum';
				} else {
					mode = browsemode;
					if ( browsemode === 'composer' ) GUI.browsemode = 'composeralbum';
				}
			}
		}
		$.post( 'enhance.php', command[ mode ], function( data ) {
			if ( data ) {
				if ( cmd === 'search' ) {
					$.each( data, function( i, v ) {
						var regex = new RegExp( keyword, 'ig' );
						if ( 'Title' in v ) data[ i ][ 'Title' ] = v.Title.replace( regex, function( match ) {
						return '<bl>'+ match +'</bl>' } );
					} );
				}
				dataParse( data, path );
				GUI.keyword = keyword;
			} else {
				infoNoData();
				$( '#db-search-keyword' ).val( GUI.keyword );
			}
		}, 'json' );
		return
	}
	
	$( '#db-searchbtn' ).addClass( 'hide' );
	if ( GUI.plugin === 'Spotify' ) {
		$.post( '/db/?cmd=spotify', { plid: args }, function( data ) {
			dataParse( data, path, querytype, args );
		}, 'json' );
	} else if ( GUI.plugin === 'Dirble' ) {
		$.post( 'enhance.php', { dirble: ( querytype || 'categories' ), args: args }, function( data ) {
			dataParse( data, path, querytype );
		}, 'json' );
	} else if ( GUI.plugin === 'Jamendo' ) {
		$.post( 'enhance.php', { jamendo: args || '' }, function( data ) {
			dataParse( data, path, querytype );
		}, 'json' );
	}
}
function dataParse( data, path, querytype, plid ) {
	var data = data,
		path = path || '',
		querytype = querytype || '',
		args = args || '',
		content = '',
		coverart = '',
		album = '',
		artist = '',
		composer = '',
		genre = '',
		albumartist = '',
		i = 0,
		row = [];
	GUI.albumartist = '';
	GUI.currentpath = path;
	$( '#home-blocks' ).addClass( 'hide' );
	$( '#db-index li' ).not( ':eq( 0 )' ).addClass( 'gr' );
	
	if ( !GUI.plugin ) {
		if ( !data.length ) return
		
		var type = {
			  Album        : 'album'
			, Artist       : 'artist'
			, AlbumArtist  : 'albumartist'
			, Composer     : 'composer'
			, Genre        : 'genre'
			, Webradio     : 'playlist'
		}
		var mode = {
			  file          : 'file'
			, album         : 'file'
			, artist        : 'album'
			, albumartist   : 'album'
			, genre         : 'album'
			, composer      : 'file'
			, composeralbum : 'album'
		}
		// undefined type are directory names
		prop = type[ path ] ? type[ path ] : 'directory';
		if ( data[ 0 ].artistalbum ) prop = 'artistalbum'; // for common albums like 'Greatest Hits'
		var fileplaylist = [ 'cue', 'm3u', 'm3u8', 'pls' ].indexOf( path.split( '.' ).pop() ) !== -1;
		if ( fileplaylist ) {
			if ( !data[ 0 ].file ) {
				infoNoData();
				return
			}
			
			var data = htmlPlaylist( data );
			content = data.content;
		} else if ( data[ 0 ].directory || data[ 0 ].file || data[ 0 ].playlist ) {
			var arraydir = [];
			var arrayfile = [];
			var arraypl = [];
			var litime = 0;
			var sec = 0;
			$.each( data, function( i, value ) {
				if ( 'directory' in value ) {
					arraydir.push( value );
				} else if ( 'file' in value ) {
					arrayfile.push( value );
					sec = HMS2Second( value.Time );
					litime += sec;
				} else if ( 'playlist' in value ) {
					arraypl.push( value );
				} else if ( 'coverart' in value && !arraydir.length ) {
					coverart = value.coverart;
					var coversrc = coverart ? coverart : coverrune;
					var browsemode = GUI.dbbackdata.length ? GUI.dbbackdata[ 0 ].browsemode : '';
					var artistmode = [ 'artist', 'composer', 'genre' ].indexOf( browsemode ) !== -1 ? 1 : 0;
					var composerhtml = ( composer ) ? '<span class="licomposer"><i class="fa fa-composer"></i>'+ composer +'</span><br>' : '';
					var genrehtml = genre ? '<span class="ligenre"><i class="fa fa-genre"></i>'+ genre +'</span><br>' : '';
					var file = data[ 0 ].file || data[ 0 ].filepl;
					var dir = file.substring( 0, file.lastIndexOf( '/' ) );
					content += '<li class="licover">'
							  +'<a class="lipath">'+ dir +'</a><a class="liname">'+ path +'</a>'
							  +'<div class="licoverimg'+ ( coverart ? '' : ' nocover' ) +'"><img src="'+ coversrc +'" class="coversmall"></div>'
							  +'<span class="liinfo">'
								  +'<a class="lialbum">'+ album +'</a><br>'
								  +'<i class="fa fa-'+ ( artistmode ? 'artist' : 'albumartist' ) +'"></i><span class="liartist">'+ ( artistmode ? artist : albumartist ) +'</span><br>'
								  + composerhtml
								  + genrehtml
								  + ( GUI.browsemode === 'file' ? '' : '<a class="lidir">'+ dir +'</a><br>' )
								  +'<i class="fa fa-music db-icon" data-target="#context-menu-folder"></i>'+ arrayfile.length +'<gr> • </gr>'+ second2HMS( litime )
							  +'</span>'
							  +'</li>';
				} else if ( 'album' in value ) {
					album = value.album;
				} else if ( 'artist' in value ) {
					artist = value.artist;
				} else if ( 'composer' in value ) {
					composer = value.composer;
				} else if ( 'genre' in value ) {
					genre = value.genre;
				} else if ( 'albumartist' in value ) {
					albumartist = value.albumartist;
				} else if ( 'webradio' in value ) {
					content += data2html( value, path );
				} else if ( 'index' in value ) {
					value.index.forEach( function( char ) {
						$( '#db-index .index-'+ char ).removeClass( 'gr' );
					} );
				}
			} );
			var arraydirL = arraydir.length;
			if ( arraydirL ) {
				for ( i = 0; i < arraydirL; i++ ) content += data2html( arraydir[ i ], path );
			}
			var arrayplL = arraypl.length;
			if ( arrayplL ) {
				if ( arraypl[ 0 ].playlist.split( '.' ).pop() === 'pls' ) {
					for ( i = 0; i < arrayplL; i++ ) content += data2html( arraypl[ i ], path );
				} else {
					var cuem3u = [];
					$.each( arraypl, function( i, val ) {
						if ( val.filepl ) cuem3u.push( val.filepl );
					} );
					getData( { path: cuem3u } );
					return
				}
			}
			var arrayfileL = arrayfile.length;
			if ( arrayfileL ) for ( i = 0; i < arrayfileL; i++ ) content += data2html( arrayfile[ i ], path );
		} else {
			if ( data[ 0 ][ prop ] === undefined ) prop = mode[ GUI.browsemode ];
			var dataL = data.length;
			for ( i = 0; i < dataL; i++ ) {
				if ( data[ i ].index ) {
					data[ i ].index.forEach( function( char ) {
						$( '#db-index .index-'+ char ).removeClass( 'gr' );
					} );
				} else {
					content += data2html( data[ i ], path );
				}
			}
		}
		$( '#db-webradio-new' ).toggleClass( 'hide', path !== 'Webradio' );
	} else {
		if ( GUI.plugin === 'Spotify' ) {
			data = ( querytype === 'tracks' ) ? data.tracks : data.playlists;
			var dataL = data.length;
			for ( i = 0; i < dataL; i++ ) content += radio2html( data[ i ], 'Spotify', querytype, plid );
		} else if ( GUI.plugin === 'Dirble' ) {
			var dataL = data.length;
			for ( i = 0; i < dataL; i++ ) content += radio2html( data[ i ], 'Dirble', querytype );
		} else if ( GUI.plugin === 'Jamendo' ) {
			var dataL = data.length;
			for (i = 0; i < dataL; i++ ) content += radio2html( data[ i ], 'Jamendo', querytype );
		}
	}
	$( '#db-back' ).removeClass( 'hide' );
// breadcrumb directory path link
	var iconName = {
		  LocalStorage  : '<i class="fa fa-microsd"></i>'
		, USB           : '<i class="fa fa-usbdrive"></i>'
		, NAS           : '<i class="fa fa-network"></i>'
		, album         : [ '<i class="fa fa-album"></i>',       'ALBUM' ]
		, artist        : [ '<i class="fa fa-artist"></i>',      'ARTIST' ]
		, albumartist   : [ '<i class="fa fa-albumartist"></i>', 'ALBUM ARTIST' ]
		, coverart      : [ '<i class="fa fa-coverart"></i>',    'COVERART' ]
		, genre         : [ '<i class="fa fa-genre"></i>',       'GENRE' ]
		, composer      : [ '<i class="fa fa-composer"></i>',    'COMPOSER' ]
		, composeralbum : [ '<i class="fa fa-composer"></i>',    'COMPOSER' ]
		, Dirble        : '<i class="fa fa-dirble"></i>'
		, Jamendo       : '<i class="fa fa-jamendo"></i>'
		, Spotify       : '<i class="fa fa-spotify"></i>'
	}
	var mode = {
		  album         : 'Album'
		, artist        : 'Artist'
		, albumartist   : 'AlbumArtist'
		, genre         : 'Genre'
		, composer      : 'Composer'
		, composeralbum : 'Composer'
		, coverart      : 'coverart'
	}
	if ( GUI.browsemode !== 'file' ) {
		if ( GUI.browsemode === 'album' || GUI.browsemode === 'composeralbum' ) {
			var albumpath = path === 'Album' ? '' : path;
			var albumtext = GUI.albumartist ? GUI.albumartist : albumpath;
		}
		$( '#db-currentpath .lipath' ).text( path ); // for back navigation
		$( '#db-currentpath' ).addClass( 'noellipse' );
		// fix: 1 li in genre list
		if ( $( '.licover' ).length ) {
			var browsemode = browsemode || GUI.dbbrowsemode;
			$( '#db-currentpath span' ).html( iconName[ browsemode ][ 0 ] +' <a>'+ iconName[ browsemode ][ 1 ] +'</a>' );
		} else {
			$( '#db-currentpath span' ).html( iconName[ GUI.browsemode ][ 0 ] +' <a id="rootpath" data-path="'+ mode[ GUI.browsemode ] +'">'+ iconName[ GUI.browsemode ][ 1 ] +'</a>' );
		}
		$( '#artistalbum' ).toggleClass( 'hide', coverart !== '' );
	} else {
		var folder = path.split( '/' );
		var folderRoot = folder[ 0 ];
		if ( GUI.dbbrowsemode === 'coverart' ) {
			$( '#db-currentpath span' ).html( '<i class="fa fa-coverart"></i> <a id="rootpath" data-path="coverart">COVERART</a>' );
		} else if ( $( '#db-search-keyword' ).val() ) {
		// search results
			$( '#db-currentpath' ).css( 'max-width', '40px' );
			$( '#db-back, #db-index' ).addClass( 'hide' );
			$( '#db-entries' ).css( 'width', '100%' );
			$( '#db-search-close' )
				.removeClass( 'hide' )
				.html( '<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span>\
					<span>' + arrayfileL + ' <a>of</a> </span>' );
		} else if ( folderRoot === 'Webradio' ) {
			$( '#db-currentpath .lipath' ).text( 'Webradio' );
			$( '#db-currentpath span' ).html( '<i class="fa fa-webradio"></i> <a>WEBRADIOS</a>' );
		} else {
			var folderCrumb = iconName[ folderRoot ];
			var folderPath = '';
			var ext = '';
			var ilength = folder.length;
			for ( i = 0; i < ilength; i++ ) {
				ext = folder[ i ].split( '.' ).pop();
				if ( [ 'cue', 'm3u', 'm3u8' ].indexOf( ext ) !== -1 ) continue
				
				folderPath += ( i > 0 ? '/' : '' ) + folder[ i ];
				folderCrumb += ' <a>'+ ( i > 0 ? '<w> / </w>' : '' ) + folder[ i ] +'<span class="lipath">'+ folderPath +'</span></a>';
			}
			$( '#db-currentpath .lipath' ).text( path );
			$( '#db-currentpath' ).find( 'span' ).html( folderCrumb );
		}
	}
	$( '#db-entries' ).html( content +'<p></p>' ).promise().done( function() {
		// fill bottom of list to mave last li movable to top
		$( '#db-entries p' ).css( 'min-height', window.innerHeight - ( GUI.bars ? 140 : 100 ) +'px' );
		if ( !fileplaylist ) displayIndexBar();
		$( '#loader, .menu, #divcoverarts' ).addClass( 'hide' );
		$( 'html, body' ).scrollTop( 0 );
		if ( $( '.lazy' ).length
			&& ( $( '#db-currentpath .lipath' ).text() === 'Webradio' || GUI.dbbrowsemode === 'Dirble' )
		) lazyLoad.update();
		// hide index bar in directories with files only
		var lieq = $( '#db-entries .licover' ).length ? 1 : 0;
		if ( $( '#db-entries li:eq( '+ lieq +' ) i.db-icon' ).hasClass( 'fa-music' ) || fileplaylist ) {
			$( '#db-index' ).addClass( 'hide' );
			$( '#db-entries' ).css( 'width', '100%' );
		} else {
			$( '#db-index' ).removeClass( 'hide' );
			$( '#db-entries' ).css( 'width', '' );
		}
	} );
}
// set path, name, artist as text to avoid double quote escape
function data2html( list, path ) {
	var content = '';
	if ( GUI.browsemode === 'file' || GUI.browsemode === 'coverart' ) {
		if ( path === '' && 'file' in list ) {
			var file = list.file
			path = file.split( '/' ).pop();
		}
		if ( 'file' in list || path === 'Webradio' ) {
			if ( path !== 'Webradio' ) {
				if ( 'Title' in list ) {
					var bl = $( '#db-search-keyword' ).val() ? list.Artist +' - '+ list.Album : list.file.split( '/' ).pop();
					var liname = list.Title
					content = '<li class="file">'
							 +'<a class="lipath">'+ list.file +'</a>'
							 +'<a class="liartist">'+ list.Artist +'</a>'
							 +'<a class="liname">'+ liname +'</a>'
							 +'<a class="lisort">'+ list.lisort +'</a>'
							 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
							 +'<span class="li1"><a class="name">'+ liname +'</a><span class="time">'+ list.Time +'</span></span>'
							 +'<span class="li2">'+ bl +'</span>';
				} else {
					var liname = list.file.split( '/' ).pop(); // filename
					content = '<li class="file">'
							 +'<a class="lipath">'+ list.file +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ list.lisort +'</a>'
							 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
							 +'<span class="li1">'+ liname +'<span class="time">' + second2HMS( list.Time ) +'</span></span>'
							 +'<span class="li2">'+ path +'</span>';
				}
			} else { // Webradio
				var liname = list.webradio
				var thumb = list.thumb;
				if ( thumb ) {
					var iconhtml = '<img class="radiothumb db-icon lazy" data-src="'+ thumb +'" onerror="imgError(this);" data-target="#context-menu-webradio">';
				} else {
					var iconhtml = '<i class="fa fa-webradio db-icon" data-target="#context-menu-webradio"></i>';
				}
				content = '<li class="db-webradio file" >'
						 +'<a class="lipath">'+ list.url +'</a>'
						 +'<a class="liname">'+ liname +'</a>'
						 +'<a class="lisort">'+ list.lisort +'</a>'
						 + iconhtml
						 +'<span class="li1">'+ liname +'</span>'
						 +'<span class="li2">'+ list.url +'</span>';
			}
		} else {
			var liname = list.directory.replace( path +'/', '' );
			content = '<li>'
					 +'<a class="lipath">'+ list.directory +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-folder db-icon" data-target="#context-menu-folder"></i>'
					 +'<span class="single">'+ liname +'</span>';
		}
	} else if ( GUI.browsemode === 'album' ) {
		if ( 'file' in list ) {
			var liname = list.Title;
			content = '<li class="file">'
					 +'<a class="lipath">'+ list.file +'</a>'
					 +'<a class="liartist">'+ list.Artist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
					 +'<span class="li1"><a class="name">'+ liname +'</a><span class="time">'+ list.Time +'</span></span>'
					 +'<span class="li2">'+ list.file.split( '/' ).pop() +'</span>';
			var artist = list.Artist;
			if ( !GUI.albumartist ) GUI.albumartist = list.Album +'<gr> • </gr>'+ artist;
		} else {
			var liname = list.album;
			var artistalbum = list.artistalbum;
			if ( artistalbum ) {
				var lialbum = artistalbum;
				var dataartist = '<a class="liartist">'+ list.artist +'</a>';
			} else {
				var lialbum = liname;
				var dataartist = '';
			}
			content = '<li mode="album">'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 + dataartist
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ lialbum +'</span>';
		}
	} else if ( GUI.browsemode === 'artist' || GUI.browsemode === 'composeralbum' ) {
		if ( 'album' in list ) {
			var liname = list.album;
			content = '<li mode="album">'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ liname +'</span>';
		} else {
			var liname = list.artist;
			content = '<li mode="artist">'
					 +'<a class="lipath">'+ list.artist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-artist db-icon" data-target="#context-menu-artist"></i>'
					 +'<span class="single">'+ liname +'</span>';
		}
	} else if ( GUI.browsemode === 'albumartist' ) {
		if ( 'album' in list ) {
			var liname = list.album;
			content = '<li mode="album">'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ liname +'</span>';
		} else {
			var liname = list.albumartist;
			content = '<li mode="albumartist">'
					 +'<a class="lipath">'+ list.albumartist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-albumartist db-icon" data-target="#context-menu-artist"></i>'
					 +'<span class="single">'+ liname +'</span>';
		}
	} else if ( GUI.browsemode === 'composer' ) {
		var liname = list.composer;
		content = '<li mode="composer">'
				 +'<a class="lipath">'+ list.composer +'</a>'
				 +'<a class="liname">'+ liname +'</a>'
				 +'<a class="lisort">'+ list.lisort +'</a>'
				 +'<i class="fa fa-composer db-icon" data-target="#context-menu-composer"></i>'
				 +'<span class="single">'+ list.composer +'</span>';
	} else if ( GUI.browsemode === 'genre' ) {
		if ( 'album' in list ) {
			var liname = list.artistalbum;
			content = '<li mode="album">'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<a class="liartist">'+ list.artist +'</a>'
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ liname +'</span>';
		} else if ( 'file' in list ) {
			var liname = list.Title;
			content = '<li class="file">'
					 +'<a class="lipath">'+ list.file +'</a>'
					 +'<a class="liartist">'+ list.Artist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
					 +'<span class="li1"><a class="name">'+ liname +'</a><span class="time">'+ list.Time +'</span></span>'
					 +'<span class="li2">'+ list.Artist +' - '+ list.Album +'</span>';
		} else {
			var liname = list.genre ;
			content = '<li mode="genre">'
					 +'<a class="lipath">'+ list.genre +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="lisort">'+ list.lisort +'</a>'
					 +'<i class="fa fa-genre db-icon" data-target="#context-menu-genre"></i>'
					 +'<span class="single">'+ liname;+'</span>';
		}
	}
	return content +'</li>';
}
function radio2html( list, source, querytype, plid ) {
	var content = '';
	switch ( source ) {
		case 'Spotify':
			if ( querytype === '' ) {
				var liname = list.name ? list.name : 'Favorites';
				content = '<li mode="spotify">'
						 +'<a class="lipath">'+ list.index +'</a>'
						 +'<a class="liname">'+ liname +'</a>'
						 +'<a class="lisort">'+ list.lisort +'</a>'
						 +'<i class="fa fa-genre db-icon" data-target="#context-menu-spotify-pl"></i>'
						 +'<span class="single">'+ liname +' ( '+ list.tracks +' )</span>';
			} else if ( querytype === 'tracks' ) {
				var liname = list.Title;
				content = '<li data-plid="'+ plid +'" data-type="spotify-track" mode="spotify">'
						 +'<a class="lipath">'+ list.index +'</a>'
						 +'<a class="liname">'+ liname +'</a>'
						 +'<a class="lisort">'+ list.lisort +'</a>'
						 +'<i class="fa fa-spotify db-icon" data-target="#context-menu-spotify"></i>'
						 +'<span class="li1">'+ liname +'<span class="time">'+ second2HMS( list.duration / 1000 ) +'</span></span>'
						 +'<span class="li2">'+ list.artist +' - '+ list.album +'</span>';
			}
			break;
		case 'Dirble':
			if ( list.index ) {
				list.index.forEach( function( char ) {
					$( '#db-index .index-'+ char ).removeClass( 'gr' );
				} );
			} else if ( querytype === '' || querytype === 'childs' ) {
				var liname = list.title;
				var childClass = ( querytype === 'childs' ) ? ' db-dirble-child' : '';
				content = '<li class="db-dirble'+ childClass +'" mode="dirble">'
						 +'<a class="lipath">'+ list.id +'</a>'
						 +'<a class="liname">'+ liname +'</a>'
						 +'<a class="lisort">'+ list.lisort +'</a>'
						 +'<i class="fa fa-genre db-icon"></i>'
						 +'<span class="single">'+ liname +'</span>';
			} else if ( querytype === 'stations' || querytype === 'childs-stations' ) {
				if ( !list.streams.length ) break; // skip stations with streams = []
				
				var liname = list.name;
				var url = list.streams[ 0 ].stream
				var thumb = list.image.thumb.url;
				if ( thumb ) {
					var iconhtml = '<img class="radiothumb db-icon lazy" data-src="'+ thumb +'" onerror="imgError(this);" data-target="#context-menu-radio">'
								  +'<a class="lithumb">'+ thumb +'</a>'
								  +'<a class="liimg">'+ list.image.url +'</a>'
				} else {
					var iconhtml = '<i class="fa fa-webradio db-icon" data-target="#context-menu-radio"></i>';
				}
				content = '<li mode="dirble">'
						 +'<a class="lipath">'+ url +'</a>'
						 +'<a class="liname">'+ liname +'</a>'
						 +'<a class="lisort">'+ list.lisort +'</a>'
						 + iconhtml
						 +'<span class="li1">'+ liname +'&ensp;<gr>'+ list.country +'</gr><a class="flag"><f style="background-position: '+ flag( list.country ) +'"></f></a></span>'
						 +'<span class="li2">'+ url +'</span>';
			}
			break;
		case 'Jamendo':
			if ( list.index ) {
				list.index.forEach( function( char ) {
					$( '#db-index .index-'+ char ).removeClass( 'gr' );
				} );
			} else {
				var liname = list.dispname;
				content = '<li mode="jamendo">'
						 +'<a class="lipath">'+ list.stream +'</a>'
						 +'<a class="liname">'+ liname +'</a>'
						 +'<a class="lisort">'+ list.lisort +'</a>'
						 +'<img class="radiothumb db-icon lazy" data-src="'+ list.image +'"  data-target="#context-menu-radio">'
						 +'<span class="single">'+ liname +'</span>';
			}
			break;
	}
	return content +'</li>';
}
function removeCoverart() {
	var src = $( '#cover-art' ).prop( 'src' );
	var file = GUI.status.file;
	var path = '/mnt/MPD/'+ file.substr( 0, file.lastIndexOf( '/' ) );
	$.post( 'enhance.php', { bash: '/usr/bin/ls "'+ path +'" | grep -iE "^cover.jpg$|^cover.png$|^folder.jpg$|^folder.png$|^front.jpg$|^front.png$"' }, function( file ) {
		var file = file.slice( 0, -1 ); // less last '\n'
		var count = file.split( '\n' ).length;
		if ( count > 1 ) {
			info( {
				  icon    : 'coverart'
				, title   : 'Remove Album Coverart'
				, message : 'More than 1 coverart files found:'
						   +'<br><w>'+ file.replace( /\n/g, '<br>' ) +'</w>'
						   +'<br>No files removed.'
			} );
			return
		}
		
		info( {
			  icon    : 'coverart'
			, title   : 'Remove Album Coverart'
			, message : '<img src="'+ src +'">'
					   +'<br><w>'+ GUI.status.Album +'</w>'
					   +'<br>'+ GUI.status.Artist
					   +'<br><br><code>'+ file +'</code> > <code>'+ file +'.backup</code>'
			, oklabel : 'Remove'
			, ok      : function() {
				$.post( 'enhance.php', { imagefile: path +'/'+ file, coverfile: 1 }, function( std ) {
					infoCoverart( 'Remove', coverrune, std );
				} );
			}
		} );
	} );
}
function replaceCoverart() {
	var src = $( '#cover-art' ).prop( 'src' );
	var file = GUI.status.file;
	var path = '/mnt/MPD/'+ file.substr( 0, file.lastIndexOf( '/' ) );
	info( {
		  icon        : 'coverart'
		, title       : 'Replace Album Coverart'
		, message     : '<img src="'+ src +'">'
					   +'<span class="bkname"><br><w>'+ GUI.status.Album +'</w>'
					   +'<br>'+ GUI.status.Artist +'<span>'
		, fileoklabel : 'Replace'
		, ok          : function() {
			var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
			$.post( 'enhance.php', { imagefile: path +'/cover.jpg', base64: newimg, coverfile: 1 }, function( std ) {
				infoCoverart( 'Replace', newimg, std );
			} );
		}
	} );
}
function saveCoverart() {
	var src = $( '#cover-art' ).prop( 'src' );
	var file = GUI.status.file;
	var path = '/mnt/MPD/'+ file.substr( 0, file.lastIndexOf( '/' ) );
	var coverfile = path.replace( /"/g, '\"' ) +'/cover.jpg';
	info( {
		  icon    : 'coverart'
		, title   : 'Save Album Coverart'
		, message : '<img src="'+ src +'">'
					   +'<span class="bkname"><br><w>'+ GUI.status.Album +'</w>'
					   +'<br>'+ GUI.status.Artist +'<span>'
		, ok      : function() { 
			$.post( 'enhance.php', { coversave: coverfile, base64: src }, function( std ) {
				infoCoverart( 'Save' );
			} );
		}
	} );
}
function infoCoverart( title, src, std ) {
	$( '.edit' ).remove();
	$( '#cover-art' ).css( 'opacity', '' );
	if ( std == 13 ) {
		info( {
			  icon    : 'coverart'
			, title   : '<i class="fa fa-warning"></i>'+ title +' Album Coverart'
			, message : 'Save file denied.'
					   +'<br>Set directory+file <w>permission</w> and try again.'
		} );
	} else if ( std == -1 ) {
		info( {
			  icon    : 'coverart'
			, title   : title +' Album Coverart'
			, message : '<i class="fa fa-warning"></i>Upload image failed.'
		} );
	} else {
		if ( title === 'Save' ) {
			GUI.coversave = 0;
			notify( 'Album Coverart', 'Saved.', 'coverart' );
		} else {
			$( '#cover-art' ).prop( 'src', src );
		}
	}
}
function flag( iso ) { // from: https://stackoverflow.com/a/11119265
	var iso0 = ( iso.toLowerCase().charCodeAt( 0 ) - 97 ) * -15;
	var iso1 = ( iso.toLowerCase().charCodeAt( 1 ) - 97 ) * -20;
	return iso1 +'px '+ iso0 +'px';
}
function imgError( image ) {
	image.onerror = '';
	image.src = coverrune;
	return true;
}
function dbContextmenu( $li, $target ) {
	$( '.menu' ).addClass( 'hide' );
	var $menu = $( $li.find( '.db-icon' ).data( 'target' ) );
	GUI.list = {};
	GUI.list.li = $li; // for contextmenu
	if ( $li.hasClass( 'licover' ) && GUI.browsemode === 'coverart' ) {
		GUI.list.mode = 'album'
	} else {
		GUI.list.mode = $li.find( '.db-icon' ).prop( 'class' ).replace( /fa fa-| db-icon/g, '' );
	}
	var dbpl = GUI.library ? 'db' : 'pl';
	GUI.list.path = $li.find( '.lipath' ).text().trim() || '';
	GUI.list.name = $li.find( '.liname' ).text().trim() || '';
	GUI.list.artist = $li.find( '.liartist' ).text().trim() || '';
	GUI.list.index = $li.find( '.liindex' ).text() || '';  // cue - in contextmenu
	GUI.list.liindex = $( '#'+ dbpl +'-entries li' ).index( $li ); // for webradio delete - in contextmenu
	GUI.list.isfile = $li.hasClass( 'file' );              // file/dirble save in contextmenu
	GUI.list.thumb = $li.find( '.lithumb' ).text() || '';  // dirble save in contextmenu
	GUI.list.img = $li.find( '.liimg' ).text() || '';      // dirble save in contextmenu
	if ( GUI.display.tapaddplay
		&& !$target.hasClass( 'db-icon' )
		&& !$li.hasClass( 'licover' )
	) {
		$menu.find( 'a:eq( 0 ) .submenu' ).click();
		$li.addClass( 'active' );
		return
	}
	
	$( '.replace' ).toggleClass( 'hide', !GUI.status.playlistlength );
	$( '.folder-refresh' ).toggleClass( 'hide', GUI.status.updating_db !== 0 );
	$( '.tag' ).addClass( 'hide' );
	if ( GUI.list.isfile ) {
		$( '.tag' ).removeClass( 'hide' );
	} else if ( $( '.licover' ).length ) {
		if ( GUI.browsemode === 'file' || GUI.browsemode === 'coverart' ) $( '.tag' ).removeClass( 'hide' );
	}
	var contextnum = $menu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 42 - 1 );
	$li.addClass( 'active' );
	if ( $li.hasClass( 'licover' ) ) {
		var menutop = GUI.bars ? '310px' : '270px';
	} else {
		var menutop = ( $li.position().top + 48 ) +'px';
	}
	$menu
		.css( 'top',  menutop )
		.removeClass( 'hide' );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( GUI.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
}
function plContextmenu( $li, $target ) { // saved playlists
	$( '.menu' ).addClass( 'hide' );
	var dbpl = $li.find( '.pl-icon' ).length ? '.pl' : '.db';
	var $menu = $( $li.find( dbpl +'-icon' ).data( 'target' ) );
	GUI.list = {};
	GUI.list.li = $li; // for contextmenu
	GUI.list.name = $li.find( '.liname' ).text().trim();
	GUI.list.path = $li.find( '.lipath' ).text().trim() || GUI.list.name;
	if ( GUI.list.path.slice( -3 ) === 'cue' ) GUI.list.index = $li.find( '.liindex' ).text() || '';
	GUI.list.isfile = $li.find( '.fa-music' ).length; // used in contextmenu
	$( '.plus-refresh, .play-plus-refresh' ).toggleClass( 'hide', !GUI.status.playlistlength );
	$( '.minus-circle' ).removeClass( 'hide' );
	$( '.tag' ).addClass( 'hide' );
	if ( GUI.display.tapaddplay
		&& !$target.hasClass( 'pl-icon' )
	) {
		$menu.find( 'a:eq( 0 ) .submenu' ).click();
		return
	}
	
	var contextnum = $menu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 42 - 1 );
	$( '#pl-editor li' ).removeClass( 'active' );
	$li.addClass( 'active' );
	$menu
		.removeClass( 'hide' )
		.css( 'top', ( $li.position().top + 48 ) +'px' );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( GUI.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
}

function setNameWidth() {
	var wW = window.innerWidth;
	$.each( $( '#pl-entries .name' ), function() {
		var $name = $( this );
		var $dur =  $name.next();
		// pl-icon + margin + duration + margin
		var iWdW = 40 + 10 + $dur.width();
		if ( iWdW + $name.width() < wW ) {
			$dur.removeClass( 'duration-right' );
			$name.css( 'max-width', '' );
		} else {
			$dur.addClass( 'duration-right' );
			$name.css( 'max-width', wW - iWdW +'px' );
		}
	} );
}
function getTitleWidth() {
	plwW = $( window ).width();
	$title.css( {
		  'max-width' : 'none'
		, visibility  : 'hidden'
	} );
	pltW = $title.width();
	$title.removeAttr( 'style' );
}
function setTitleWidth() {
	// pl-icon + margin + duration + margin
	var iWdW = 40 + 10 + $duration.width() + 10;
	if ( iWdW + pltW < plwW ) {
		$title.css(  'max-width', '' );
		$duration.removeClass( 'duration-right' );
	} else {
		$title.css( 'max-width', plwW - iWdW +'px' );
		$duration.addClass( 'duration-right' );
	}
	$( '.duration-right' ).css( 'right', '' );
}
function setPlaylistScroll() {
	if ( !GUI.status.playlistlength || GUI.sortable ) return // skip if empty or Sortable
	
	clearInterval( GUI.intElapsedPl );
	displayTopBottom();
	$( '#context-menu-plaction' ).addClass( 'hide' );
	$( '#pl-entries li' ).removeClass( 'lifocus' );
	setNameWidth();
	var $linotactive, $liactive, $name, $song, $elapsed, elapsedtxt;
	$.post( 'enhancestatus.php', { statusonly: 1 }, function( status ) {
		$.each( status, function( key, value ) {
			GUI.status[ key ] = value;
		} );
		if ( GUI.bars ) setButton();
		setTimeout( function() {
			var scrollpos = $liactive.offset().top - $( '#pl-entries' ).offset().top - ( 49 * 3 );
			$( 'html, body' ).scrollTop( scrollpos );
		}, 300 );
		var elapsed = status.elapsed;
		var radio = GUI.status.ext === 'radio';
		var slash = radio ? '' : ' <gr>/</gr>';
		$linotactive = $( '#pl-entries li:not(:eq( '+ status.song +' ) )' );
		$linotactive.removeClass( 'active activeplay' ).find( '.elapsed, .song' ).empty();
		$linotactive.find( '.name' ).removeClass( 'hide' );
		$linotactive.find( '.song' ).css( 'max-width', '' );
		$liactive = $( '#pl-entries li' ).eq( status.song );
		$liactive.addClass( 'active' );
		$name = $liactive.find( '.name' );
		$song = $liactive.find( '.song' );
		$title = radio ? $song : $name;
		$duration = $liactive.find( '.duration' );
		$elapsed = $liactive.find( '.elapsed' );
		if ( status.state === 'pause' ) {
			elapsedtxt = second2HMS( elapsed );
			$elapsed.html( '<i class="fa fa-pause"></i> '+ elapsedtxt + slash );
			getTitleWidth();
			setTitleWidth();
		} else if ( status.state === 'play' ) {
			if ( radio ) {
				$name.addClass( 'hide' );
				$song.html( status.Title || blinkdot );
			} else {
				$name.removeClass( 'hide' );
				$song.empty();
			}
			getTitleWidth();
			clearInterval( GUI.intElapsedPl ); // fix: some GUI.intElapsedPl not properly cleared
			GUI.intElapsedPl = setInterval( function() {
				elapsed++;
				elapsedtxt = second2HMS( elapsed );
				$elapsed.html( '<i class="fa fa-play"></i>'+ elapsedtxt + slash );
				setTitleWidth();
			}, 1000 );
		} else { // stop
			$name.removeClass( 'hide' );
			$song
				.empty()
				.css( 'max-width', '' );
			$elapsed.empty();
		}
	}, 'json' );
}
function htmlPlaylist( data ) {
	var content, pl, iconhtml, topline, bottomline, countradio, countsong, pltime, sec;
	var licover = '',
		coverart = '',
		album = '',
		albumartist = '',
		artist = '',
		composer = '',
		genre = '',
		path = '';
		li2 = '';
	content = pl = iconhtml = topline = bottomline = '';
	countradio = countsong = pltime = sec = 0;
	$.each( data, function( i, value ) {
		if ( 'coverart' in value ) {
			coverart = value.coverart;
		} else if ( 'album' in value ) {
			album = value.album;
		} else if ( 'albumartist' in value ) {
			albumartist = value.albumartist;
		} else if ( 'artist' in value ) {
			artist = value.artist;
		} else if ( 'composer' in value ) {
			composer = value.composer;
		} else if ( 'genre' in value ) {
			genre = value.genre;
		} else if ( 'path' in value ) {
			path = value.path;
		} else if ( value.file.slice( 0, 4 ) === 'http' ) {
			var title = value.Title || '';
			var name = title.toString().replace( '*', '' );
			content += '<li>'
						  +'<i class="fa fa-webradio pl-icon'+ ( title[ 0 ] === '*' || !title ? ' unsaved' : '' ) +'" data-target="#context-menu-webradiopl"></i>'
						  +'<a class="lipath">'+ value.file +'</a>'
						  +'<a class="liname">'+ name +'</a>'
						  + ( value.thumb ? '<a class="lithumb">'+ value.thumb +'</a>' : '' )
						  + ( value.img ? '<a class="liimg">'+ value.img +'</a>' : '' )
						  +'<span class="li1"><a class="name">'+ name +'</a><a class="song"></a><span class="duration"><a class="elapsed"></a></span></span>'
						  +'<span class="li2">'+ ( name ? name +' • ' : '' ) + value.file +'</span>'
					  +'</li>';
			countradio++;
		} else {
			sec = value.Time ? HMS2Second( value.Time ) : 0;
			pltime += sec;
			if ( GUI.playlist && !GUI.pleditor && !value.cuem3u ) {
				var actionhtml = '<i class="fa fa-music pl-icon"></i>'
								+'<a class="lipath">'+ value.file +'</a>';
			} else {
				if ( GUI.library || GUI.pleditor ) {
					var menu = value.index && GUI.playlist ? 'filesavedpl' : 'file';
					var dbpl = 'db';
				} else if ( 'cuetrack' in value ) {
					var menu = 'filesavedpl';
					var dbpl = 'pl';
				}
				var cuepath = ( 'cuem3u' in value && value.cuem3u.slice( -3 ) === 'cue' ) ? value.cuem3u : value.file;
				var actionhtml = '<i class="fa fa-music '+ dbpl +'-icon" data-target="#context-menu-'+ menu +'"></i>'
								+'<a class="lipath">'+ cuepath +'</a>'
								+'<a class="liartist">'+ value.Artist +'</a>'
								+'<a class="liname">'+ value.Title +'</a>'
								+'<a class="liindex">'+ value.index +'</a>'
			}
			if ( GUI.playlist ) {
				li2 = value.track;
			} else if ( $( '#db-currentpath a:last' ).text() === 'COVERART' ) {
				li2 = value.file;
			} else {
				li2 = value.file.split( '/' ).pop();
			}
			content += '<li class="file">'
						 + actionhtml
						 +'<span class="li1"><a class="name">'+ value.Title +'</a>'
							 +'<span class="duration"><a class="elapsed"></a>'
							 +'<a class="time" time="'+ sec +'">'+ value.Time +'</a></span>'
						 +'</span>'
						 +'<span class="li2">'+ li2 +'</span>'
					 +'</li>';
			countsong++;
		}
	} );
	if ( coverart || coverart === 0 ) {
		var cuem3u = path.split( '.' ).pop();
		var cue = [ 'cue', 'm3u', 'm3u8' ].indexOf( cuem3u ) !== -1 ? '&ensp;<i class="fa fa-list-ul cuem3u"></i>' : '';
		var coversrc = coverart ? coverart : coverrune;
		var browsemode = GUI.dbbackdata.length ? GUI.dbbackdata[ 0 ].browsemode : '';
		var composerhtml = ( composer ) ? '<span class="licomposer"><i class="fa fa-composer"></i>'+ composer +'</span><br>' : '';
		var genrehtml = genre ? '<span class="ligenre"><i class="fa fa-genre"></i>'+ genre +'</span><br>' : '';
		if ( cuem3u === 'm3u' || cuem3u === 'm3u8' ) path = path.substr( 0, path.lastIndexOf( '/' ) );
		var licover = '<li class="licover">'
						 +'<a class="lipath">'+ path +'</a><a class="liname">'+ path.replace(/^.*\//, '') +'</a>'
						 +'<div class="licoverimg'+ ( coverart ? '' : ' nocover' ) +'"><img src="'+ coversrc +'" class="coversmall"></div>'
						 +'<span class="liinfo">'
							+'<a class="lialbum">'+ album +'</a><br>'
							+'<i class="fa fa-albumartist"></i><span class="liartist">'+ artist +'</span><br>'
							+ composerhtml
							+ genrehtml
							+'<i class="fa fa-music db-icon" data-target="#context-menu-folder"></i>'+ countsong +'<gr> • </gr>'+ second2HMS( pltime ) + cue
						 +'</span>'
					 +'</li>';
	}
	return {
		  content    : licover + content +'</li>'
		, countradio : countradio
		, pltime     : pltime
		, countsong  : countsong
	}
}
function renderPlaylist() {
	$( '#pl-filter' ).val( '' );
	$( '#pl-currentpath, #pl-editor, #pl-index, #pl-search' ).addClass( 'hide' );
	$( '#db-currentpath>span, #pl-searchbtn' ).removeClass( 'hide' );
	$( '#plopen' ).toggleClass( 'disable', !GUI.lsplaylists.length );
	if ( !GUI.pllist.length ) {
		$( '#pl-count' ).html( '<bl class="title">PLAYLIST</bl>' );
		$( '#plsave, #plcrop, #plconsume, #plclear, #pl-searchbtn' ).addClass( 'disable' );
		$( '#pl-entries' ).empty();
		$( '.playlist' ).removeClass( 'hide' );
		$( '#playlist-empty' ).css( 'margin-top', ( GUI.bars ? 27 : 67 ) +'px' );
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	
	GUI.status.playlistlength = GUI.pllist.length;
	var data = htmlPlaylist( GUI.pllist );
	var counthtml = '<bl class="title">PLAYLIST<gr>·</gr></bl>';
	var countradiohtml = '<wh id="countradio" count="'+ data.countradio +'">'+ data.countradio +'</wh>&ensp;<i class="fa fa-webradio"></i>';
	if ( data.countsong ) {
		var pltimehtml = ' id="pltime" time="'+ data.pltime +'">'+ second2HMS( data.pltime );
		var totalhtml = data.countradio ? '<gr'+ pltimehtml +'</gr>&ensp;<gr>•</gr>'+ countradiohtml : '<wh'+ pltimehtml +'</wh>';
		counthtml += '<wh id="countsong" count="'+ data.countsong +'">'+ numFormat( data.countsong ) +'</wh>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
	} else {
		counthtml += countradiohtml;
	}
	$( '.playlist' ).removeClass( 'hide' );
	$( '#playlist-empty' ).addClass( 'hide' );
	$( '#pl-count' ).html( counthtml );
	$( '#plsave, #plclear, #pl-searchbtn' ).removeClass( 'disable' );
	$( '#plcrop' ).toggleClass( 'disable', GUI.pllist.length < 2 );
	$( '#plconsume' ).toggleClass( 'bl', GUI.status.consume === 1 );
	$( '#pl-entries' ).html( data.content +'<p></p>' ).promise().done( function() {
		$( '#pl-entries p' ).css( 'min-height', window.innerHeight - 140 +'px' );
		setPlaylistScroll();
	} );
}
function removeFromPlaylist( $li ) {
	var $this = $li;
	var webradio = $this.find( '.fa-webradio' ).length;
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
				$( '#play, #pause' ).removeClass( 'active' );
				$( '#stop' ).addClass( 'active' );
			}
		}
	}
	var songpos = $this.index() + 1;
	var isunsaved = $this.find( '.pl-icon' ).hasClass( 'unsaved' );
	$this.remove();
	var cmd = 'mpc del '+ songpos;
	if ( $this.find( '.pl-icon' ).hasClass( 'unsaved' ) ) {
		var pathname = $this.find( '.lipath' ).text().replace( /\//g, '|' );
		cmd += '; /usr/bin/rm -f "/srv/http/assets/img/webradiopl/'+ pathname +'"';
	}
	$.post( 'enhance.php', { mpc: cmd } );
	if ( !$( '#countsong, #countradio' ).length ) {
		GUI.status.playlistlength = 0;
		GUI.pllist = {};
		renderPlaylist();
		setPlaybackBlank();
	}
}
function renderLsPlaylists( lsplaylists ) {
	var content = '';
	$.each( lsplaylists, function( key, val ) {
		if ( val.index ) {
			$( '#pl-index li' ).not( ':eq( 0 )' ).addClass( 'gr' );
			$.each( val.index, function( i, char ) {
				$( '#pl-index .index-'+ char ).removeClass( 'gr' );
			} );
		} else {
		content += '<li class="pl-folder">'
						+'<i class="fa fa-list-ul pl-icon" data-target="#context-menu-playlist">'
						+'<a class="liname">'+ val.name +'</a></i>'
						+'<a class="lisort">'+ val.lisort +'</a></i>'
						+'<a class="lipath">'+ val.name +'</a></i>'
						+'<span class="plname">'+ val.name +'</span>'
				  +'</li>';
		}
	} );
	$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
		GUI.pleditor = 1;
		// fill bottom of list to make last li movable to top
		$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.bars ? 140 : 100 ) +'px' );
		$( '#pl-editor' ).css( 'width', '' );
		$( '#loader' ).addClass( 'hide' );
		setTimeout( function() {
			$( 'html, body' ).scrollTop( GUI.plscrolltop );
		}, 300 );
		displayIndexBar();
	} );
}
function renderSavedPlaylist( name ) {
	$( '.menu' ).addClass( 'hide' );
	$.post( 'enhance.php', { getplaylist: 1, name: name.toString().replace( /"/g, '\\"' ) }, function( list ) {
		var data = htmlPlaylist( list.playlist );
		var counthtml = '<wh><i class="fa fa-list-ul"></i></wh><bl class="title">'+ name +'<gr>&ensp;·&emsp;</gr></bl>';
		var countradiohtml = '<wh>'+ data.countradio +'</wh>&ensp;<i class="fa fa-webradio"></i>';
		if ( data.countsong ) {
			var pltimehtml = ' id="pltime" time="'+ data.pltime +'">'+ second2HMS( data.pltime );
			var totalhtml = data.countradio ? '<gr'+ pltimehtml +'</gr> <gr>•</gr> '+ countradiohtml : '<wh'+ pltimehtml +'</wh>';
			counthtml += '<wh>'+ numFormat( data.countsong ) +'</wh>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
		} else {
			counthtml += countradiohtml;
		}
		$( '#pl-currentpath' ).html( '<a class="lipath">'+ name +'</a></ul>'+ counthtml +'<i class="fa fa-arrow-left plsback"></i>' );
		$( '#pl-currentpath, #pl-editor' ).removeClass( 'hide' );
		$( '#pl-currentpath bl' ).removeClass( 'title' );
		$( '#pl-editor' ).html( data.content +'<p></p>' ).promise().done( function() {
			GUI.pleditor = 1;
			// fill bottom of list to mave last li movable to top
			$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.bars ? 140 : 100 ) +'px' );
			$( '#pl-editor' ).css( 'width', '100%' );
			$( '#loader, #pl-index' ).addClass( 'hide' );
			$( 'html, body' ).scrollTop( GUI.plscrolltop );
		} );
	}, 'json' );
}
function setImage( canvas, imgW, imgH ) {
	$( '#infoFilename' ).empty();
	$( '.newimg, .imagewh, .bkname' ).remove();
	if ( !GUI.playback && !$( '#db-entries .licover' ).length ) {
		var px = 200;
	} else if ( imgW > 1000 || imgH > 1000 ) {
		var px = 1000;
	} else {
		var px = imgW < imgH ? imgW : imgH;
	}
	picacanvas = document.createElement( 'canvas' );
	picacanvas.width = picacanvas.height = px; // size of resized image
	var imgWHhtml = '<div class="imagewh"><span>Current</span><span>'+ px +' x '+ px +'</span>';
	if ( imgW === px && imgH === px ) {
		$( '#infoMessage' ).append( '<img class="newimg" src="'+ canvas.toDataURL( 'image/jpeg' ) +'">'+ imgWHhtml +'</div>' );
	} else {
		imgWHhtml += '<div>(Resized from '+ imgW +' x '+ imgH +' px)'
					+'<br>Tap to rotate.'
					+'</div></div>';
		pica.resize( canvas, picacanvas, picaOption ).then( function() {
			var resizedimg = picacanvas.toDataURL( 'image/jpeg' ); // canvas -> base64
			$( '#infoMessage' ).append( '<img class="newimg" src="'+ resizedimg +'">'+ imgWHhtml );
		} );
	}
}
function resetOrientation( file, ori, callback ) {
	var reader = new FileReader();
	reader.onload = function( e ) {
		var img = new Image();
		img.src = e.target.result;
		img.onload = function() {
			var imgW = img.width,
				imgH = img.height,
				canvas = document.createElement( 'canvas' ),
				ctx = canvas.getContext( '2d' );
			// set proper canvas dimensions before transform
			if ( 4 < ori && ori < 9 ) {
				canvas.width = imgH;
				canvas.height = imgW;
			} else {
				canvas.width = imgW;
				canvas.height = imgH;
			}
			// transform context before drawing image
			switch ( ori ) {
				// transform( Hscale, Hskew, Vscale, Vskew, Hmove, Vmove )
				case 2: ctx.transform( -1,  0,  0,  1, imgW,    0 ); break; // mirror up
				case 3: ctx.transform( -1,  0,  0, -1, imgW, imgH ); break; // down
				case 4: ctx.transform(  1,  0,  0, -1,    0, imgH ); break; // mirror down
				case 5: ctx.transform(  0,  1,  1,  0,    0,    0 ); break; // mirror on left side
				case 6: ctx.transform(  0,  1, -1,  0, imgH,    0 ); break; // on left side
				case 7: ctx.transform(  0, -1, -1,  0, imgH, imgW ); break; // mirror on right side
				case 8: ctx.transform(  0, -1,  1,  0,    0, imgW ); break; // on right side
				default: break;
			}
			ctx.drawImage( img, 0, 0 );
			callback( canvas, imgW, imgH );
		}
	}
	reader.readAsDataURL( file );
};
function getOrientation( file, callback ) { // return: 1 - undefined
	var reader = new FileReader();
	reader.onload = function( e ) {
		var view = new DataView( e.target.result );
		if ( view.getUint16( 0, false ) != 0xFFD8 ) return callback( 1 ); // not jpeg
		
		var length = view.byteLength, offset = 2;
		while ( offset < length ) {
			if ( view.getUint16( offset + 2, false ) <= 8 ) return callback( 1 );
			
			var marker = view.getUint16( offset, false );
			offset += 2;
			if ( marker == 0xFFE1 ) {
				if ( view.getUint32( offset += 2, false ) != 0x45786966 ) return callback( 1 );
				
				var little = view.getUint16( offset += 6, false ) == 0x4949;
				offset += view.getUint32( offset + 4, little );
				var tags = view.getUint16( offset, little );
				offset += 2;
				for ( var i = 0; i < tags; i++ ) {
					if ( view.getUint16( offset + ( i * 12 ), little ) == 0x0112 ) {
						var ori = view.getUint16( offset + ( i * 12 ) + 8, little );
						return callback( ori );
					}
				}
			} else if ( ( marker & 0xFF00 ) != 0xFF00 ) {
				break;
			} else { 
				offset += view.getUint16( offset, false );
			}
		}
		return callback( 1 );
	};
	reader.readAsArrayBuffer( file.slice( 0, 64 * 1024 ) );
}
function bannerHide() {
	$( '#banner' )
		.hide()
		.removeAttr( 'style' );
	$( '#bannerTitle, #bannerMessage' ).empty();
}
function notify( title, message, icon, delay ) {
	var iconhtml = icon ? '<i class="fa fa-'+ ( icon || 'check' ) +' wh"></i>' : '';
	$( '#bannerTitle' ).html( iconhtml + title );
	$( '#bannerMessage' ).html( message );
	$( '#banner' ).show();
	if ( delay !== -1 ) setTimeout( bannerHide, delay || 3000 );
}

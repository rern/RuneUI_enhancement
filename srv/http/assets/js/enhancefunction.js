function cssNotify() {
	if ( GUI.bars ) {
		PNotify.prototype.options.stack.firstpos1 = 60;
		$( '#cssnotify' ).remove();
	} else {
		PNotify.prototype.options.stack.firstpos1 = 20;
		if ( !$( '#cssnotify' ).length ) $( 'head' ).append( cssnotify );
	}
}
function cssKeyframes( name, trx0, trx100 ) {
	var moz = '-moz-'+ trx0;
	var moz100 = '-moz-'+ trx100;
	var webkit = '-webkit-'+ trx0;
	var webkit100 = '-webkit-'+ trx100;
	$( 'head' ).append(
		 '<style id="'+ name +'">'
			+'@-moz-keyframes '+ name +' {'
				+'0%   { '+ moz +' }'
				+'100% { '+ moz100 +' }'
			+'}'
			+'@-webkit-keyframes '+ name +' {'
				+'0%   { '+ webkit +' }'
				+'100% { '+ webkit100 +' }'
			+'}'
			+'@keyframes '+ name +' {'
				+'0%   {'+ trx0 +'}'
				+'100% {'+ trx100 +'}'
			+'}'
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
	$( '#menu-bottom li, #db-entries li, #pl-editor li' ).removeClass( 'active' );
	$( '.page, .menu' ).addClass( 'hide' );
	$( '#page-'+ page ).removeClass( 'hide' );
	$( '#tab-'+ page ).addClass( 'active' );
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
			$( '#random' ).toggleClass( 'btn-primary', GUI.status.random === 1 );
			$( '#repeat' ).toggleClass( 'btn-primary', GUI.status.repeat === 1 );
			$( '#single' ).toggleClass( 'btn-primary', GUI.status.single === 1 );
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
		GUI.intUpdate = setInterval( function() {
			setButtonUpdate()
		}, 10000 );
	} else {
		$( '#tab-library i, #db-home i' ).removeClass( 'blink' );
		$( '#posupdate, #iupdate' ).addClass( 'hide' );
		clearInterval( GUI.intUpdate );
	}
}
function setButton() {
	$( '#playback-controls' ).toggleClass( 'hide', GUI.status.playlistlength === 0 );
	var state = GUI.status.state;
	if ( GUI.bars ) {
		$( '#playback-controls button' ).removeClass( 'btn-primary' );
		$( '#'+ state ).addClass( 'btn-primary' );
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
	return ss ? hh + mm + ss : '';
}
function scrollLongText() {
	var $el = $( '#artist, #song, #album' );
	$el
		.removeClass( 'scrollleft' )
		.removeAttr( 'style' ); // fix - iOS needs whole style removed
	var wW = window.innerWidth;
	var tWmax = 0;
	setTimeout( function() {
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
	}, 50 );
}
function removeSplash() {
	if ( GUI.nosplash ) return
	
	GUI.nosplash = 1;
	$( '#splash' ).remove();
	$( '.rs-animation .rs-transition' ).css( 'transition-property', '' ); // restore animation after load
	$( '#page-playback' ).removeClass( 'hide' );
	if ( !$( '#divcoverarts' ).html() ) return
	
	var lazyLoadcover = new LazyLoad( { elements_selector: '.lazy' } );
	// for load 1st page without lazy
	var perrow = $( 'body' )[ 0 ].clientWidth / 200;
	var percolumn = window.innerHeight / 200;
	var perpage = Math.ceil( perrow ) * Math.ceil( percolumn );
	for( i = 0; i < perpage; i++ ) {
		lazyLoadcover.load( $( '.lazy' ).eq( i )[ 0 ], 'force' );
	}
}
function setPlaybackBlank() {
	$( '#playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#song' ).html( '<i class="fa fa-plus-circle"></i>' );
	$( '#divpos i' ).addClass( 'hide' );
	$( '#artist, #album, #songposition, #timepos, #elapsed, #total' ).empty();
	$( '#format-bitrate' ).text( 'Add music from Library' );
	if ( GUI.display.time ) $( '#time' ).roundSlider( 'setValue', 0 );
	$( '#coverartoverlay' ).addClass( 'hide' );
	$( '#cover-art' )
		.attr( 'src', coverrune )
		.css( 'border-radius', 0 )
		.on( 'load', removeSplash );
	$( '#artist, #song, #album' )
		.removeClass( 'scrollleft' )
		.removeAttr( 'style' )
		.css( 'visibility', 'visible' );
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
	$( '#artist' ).html( status.Artist );
	$( '#song' ).html( status.Title )
	$( '#album' )
		.toggleClass( 'albumradio', status.ext === 'radio' )
		.html( status.Album ).promise().done( function() {
		scrollLongText();
	} );
	
	$( '#songposition' ).text( ( +status.song + 1 ) +'/'+ status.playlistlength );
	var ext = ( status.ext !== 'radio' ) ? '<wh> • </wh>' + status.ext : '';
	var dot = GUI.display.time ? '<wh id="dot0"> • </wh>' : '';
	$( '#format-bitrate' ).html( dot + status.sampling + ext );
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
						$( '#total' ).text( elapsedhms ).css( 'color', '#7795b4' );
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
		$( '#cover-art' )
			.attr( 'src', status.state === 'play' ? vu : vustop )
			.on( 'load', removeSplash );
		$( '#cover-art' ).css( 'border-radius', '18px' );
		$( '#coverartoverlay' ).removeClass( 'hide' );
		return
	}
	
	$( '#cover-art' ).css( 'border-radius', '' );
	$( '#coverartoverlay' ).addClass( 'hide' );
	if ( status.Title !== previoussong || status.Album !== previousalbum || !status.Album ) {
		var coverart = status.coverart || coverrune;
		$( '#cover-art' )
			.attr( 'src', coverart )
			.css( 'border-radius', 0 )
			.one( 'load', removeSplash );
		// in case too long to get coverart 
		setTimeout( removeSplash, 2000 );
	}
	// time
	time = status.Time;
	var timehms = second2HMS( time );
	$( '#total' ).text( timehms );
	// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( status.state === 'stop' ) {
		$( '#song' ).css( 'color', '' );
		if ( GUI.display.time ) {
			$( '#time' ).roundSlider( 'setValue', 0 );
			$( '#elapsed' ).text( timehms ).css( 'color', '#7795b4' );
			$( '#total, #timepos' ).empty();
		} else {
			$( '#timepos' ).html( '&ensp;<i class="fa fa-stop"></i>&ensp;'+ timehms );
		}
		return
	}
	
	$( '#elapsed, #total' ).css( 'color', '' );
	$( '#song' ).css( 'color', status.state === 'pause' ? '#7795b4' : '' );
	var elapsed = status.elapsed || 0;
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
			$( '#timepos' ).html( '&ensp;<i class="fa fa-pause"></i>&ensp;<bl>'+ elapsedhms +'</bl> / '+ timehms );
		}
		return
	}
	
	$( '#elapsed, #total' ).css( 'color', '' );
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
		if( typeof status !== 'object' ) return
		
		if ( status.activePlayer === 'Airplay' ) {
			displayAirPlay();
			return
		}
		
		$.each( status, function( key, value ) {
			GUI.status[ key ] = value;
		} );
		setButton();
		if ( GUI.playback ) {
			renderPlayback();
			// imodedelay fix imode flashing on audio output switched
			if ( !GUI.imodedelay ) displayPlayback();
		}
	}, 'json' );
}
function getBio( artist ) {
	$( '#loader' ).removeClass( 'hide' );
	$.get( 'enhancebio.php',
		{ artist: artist },
		function( data ) {
			$( '#biocontent' ).html( data ).promise().done( function() {
				$( '#bio' ).scrollTop( 0 );
				$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
				$( '#bio' ).removeClass( 'hide' );
			} );
		}
	);
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
	$volumetooltip.text( volumemute ).css( 'color', '#0095d8' );
	$volumehandle.css( 'background', '#7795b4' );
	$( '#volmute' ).addClass( 'btn-primary' )
		.find( 'i' ).removeClass( 'fa-volume' ).addClass( 'fa-mute' );
}
function unmuteColor() {
	$volumetooltip.css( 'color', '' );
	$volumehandle.css( 'background', '' );
	$( '#volmute' ).removeClass( 'btn-primary' )
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
	cssNotify();
	$( '#debug' ).toggleClass( 'hide', GUI.display.debug === '' );
	$( '#dev' ).toggleClass( 'hide', GUI.display.dev === '' );
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
	if ( ( GUI.display.coverlarge || ( !GUI.display.time && !GUI.display.volume ) )
		&& $( '#album' ).text().slice( 0, 4 ) !== 'http'
	) {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).removeClass( 'coversmall' );
		var maxW = GUI.bars ? '45vh' : '55vh';
		$( '#divcover, #cover-art' ).css( { 'max-width': maxW, 'max-height': maxW } );
		if ( wW < 500 ) $( '#format-bitrate' ).css( 'display', GUI.display.time ? 'inline' : 'block' );
		if ( !GUI.display.time && !GUI.display.volume ) $( '#share-group' ).addClass( 'hide' );
	} else {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).addClass( 'coversmall' );
		$( '#divcover, #cover-art' ).css( { 'max-width': '', 'max-height': '' } );
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
		$( '#playback-row' ).css( 'margin-top', compact ? '' : 0 )
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
function switchPlaysource( source ) {
	$.get( '/command/?switchplayer='+ source, function() {
		setTimeout( function() {
			$( '#tab-playback' ).click();
		}, 2000 );
	} );
}
function windowopen( url ) {
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
		//$index = ( GUI.library && GUI.dblist ) ? $( '#db-index' ) : $( '#pl-index' );
		$index = GUI.library ? $( '#db-index' ) : $( '#pl-index' );
		$index.css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
	}, 50 );
}
function setToggleButton( name, append ) {
	$( 'input[name="'+ name +'"]' )
		.prop( 'disabled', true )
		.parent().css( 'color', '#7795b4' )
		.append( append ? ' '+ append : ' (auto hide)' );
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
	$( '.home-block' ).each( function() {
		var name = this.id.replace( 'home-', '' );
		$( this ).parent().toggleClass( 'hide', GUI.display[ name ] === '' );
	} );
	$( '#home-spotify' ).parent().toggleClass( 'hide', GUI.display.spotify === 0 );
	$( '.home-block gr' ).toggleClass( 'hide', GUI.display.count === '' );
	if ( GUI.display.label ) {
		$( '#divhomeblocks a.label' ).show();
		$( '.home-block gr' ).css( 'color', '' );
		$( '.home-block' ).css( 'padding', '' );
	} else {
		$( '#divhomeblocks a.label' ).hide();
		$( '.home-block gr' ).css( 'color', '#e0e7ee' );
		$( '.home-block' ).css( 'padding-top', '35px' );
		$( '.home-bookmark' ).css( 'padding', '20px 5px 5px 5px' );
	}
	displayTopBottom();
	$( 'html, body' ).scrollTop( 0 );
}
function infoNoData() {
	$( '#loader' ).addClass( 'hide' );
	$( '#db-entries li' ).removeClass( 'active' );
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
		var command = {
			  file          : { mpc   : 'mpc ls -f "%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%" "'+ path +'" 2> /dev/null', list: 'file' }
			, artistalbum   : { mpc   : 'mpc find -f "%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%"'+ ( artist ? ' artist "'+ artist +'"' : '' ) +' album "'+ path +'"', list: 'file', name: path }
			, composeralbum : { mpc   : 'mpc find -f "%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%" composer "'+ composer +'" album "'+ path +'"', list: 'file' }
			, album         : { album : 'mpc find -f "%album%^^[%albumartist%|%artist%]" album "'+ path +'" | awk \'!a[$0]++\'', albumname: path }
			, genre         : { album : 'mpc find -f "%album%^^%artist%" genre "'+ path +'" | awk \'!a[$0]++\'', genrename: path }
			, artist        : { mpc   : 'mpc list album artist "'+ path +'" | awk NF', list: 'album' }
			, albumartist   : { mpc   : 'mpc list album albumartist "'+ path +'" | awk NF', list: 'album' }
			, composer      : { mpc   : 'mpc list album composer "'+ path +'" | awk NF', list: 'album' }
			, type          : { mpc   : 'mpc list '+ browsemode +' | awk NF', list: browsemode }
			, search        : { mpc   : 'mpc search -f "%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%" any "'+ keyword +'"', list: 'file' }
			, Webradio      : { getwebradios  : 1 }
			, coverart      : { coverartalbum : path, artist: artist }
		}
		if ( cmd === 'search' ) {
			mode = 'search';
		} else if ( cmd === 'browse' ) {
			if ( [ 'Album', 'Artist', 'AlbumArtist', 'Composer', 'Genre' ].indexOf( path ) !== -1 ) {
				mode = 'type';
			} else if ( browsemode === 'coverart' ) {
				mode = 'coverart';
				GUI.browsemode = 'album';
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
				dataParse( data, path );
				GUI.keyword = keyword;
			} else {
				infoNoData();
				$( '#db-search-keyword' ).val( GUI.keyword );
			}
		}, 'json' );
		return
	}
	
	if ( GUI.plugin === 'Spotify' ) {
		$.post( '/db/?cmd=spotify', { plid: args }, function( data ) {
			dataParse( data, path, querytype, arg );
		}, 'json' );
	} else if ( GUI.plugin === 'Dirble' ) {
		$.post( 'enhance.php', { dirble: ( querytype || 'categories' ), args: args }, function( data ) {
			dataParse( data, path, querytype );
		}, 'json' );
	} else if ( GUI.plugin === 'Jamendo' ) {
		$.post( 'enhance.php', { jamendo: args || '' }, function( data ) {
			if ( !data ) {
				$( '#oader' ).addClass( 'hide' );
				info( {
					  icon    : 'warning'
					, title   : 'Jamendo'
					, message : 'Jamendo not response. Please try again later'
				} );
				GUI.dbbackdata.pop();
				return
			}
			dataParse( data.results, path, querytype );
		}, 'json' );
	}
}
function dataParse( data, path, querytype, arg ) {
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
			var name;
			var index;
			$.each( data, function( i, value ) {
				if ( value.coverart ) {
					coverart = value.coverart;
				} else if ( value.album ) {
					album = value.album;
				} else if ( value.artist ) {
					artist = value.artist;
				} else if ( value.composer ) {
					composer = value.composer;
				} else if ( value.genre ) {
					genre = value.genre;
				} else if ( value.albumartist ) {
					albumartist = value.albumartist;
				} else if ( value.index ) {
					value.index.forEach( function( char ) {
						$( '#db-index .index-'+ char ).removeClass( 'gr' );
					} );
				} else if ( value.directory || value.file || value.playlist ) {
					name = value.directory || value.file || value.playlist;
					if ( value.directory ) {
						arraydir.push( value );
					} else if ( value.file ) {
						arrayfile.push( value );
						sec = HMS2Second( value.Time );
						litime += sec;
					} else if ( value.playlist ) {
						arraypl.push( value );
					}
				}
			} );
			if ( coverart ) {
				var browsemode = GUI.dbbackdata.length ? GUI.dbbackdata[ 0 ].browsemode : '';
				var artistmode = [ 'artist', 'composer', 'genre' ].indexOf( browsemode ) !== -1 ? 1 : 0;
				var composerhtml = ( composer && browsemode === 'composer' ) ? '<i class="fa fa-composer"></i><span class="biocomposer">'+ composer +'</span><br>' : '';
				var genrehtml = genre && genre !== -1 ? '<span><i class="fa fa-genre"></i>'+ genre +'</span><br>' : '';
				content += '<li class="licover">'
						  +'<a class="lipath">'+ path +'</a><a class="liname">'+ path.replace(/^.*\//, '') +'</a>'
						  +'<div class="licoverimg"><img src="'+ coverart +'" class="coversmall"></div>'
						  +'<span class="liinfo">'
							  +'<bl class="lialbum">'+ album +'</bl><br>'
							  + composerhtml
							  +'<i class="fa fa-'+ ( artistmode ? 'artist' : 'albumartist' ) +'"></i><span class="bioartist">'+ ( artistmode ? artist : albumartist ) +'</span><br>'
							  + genrehtml
							  +'<i class="fa fa-music db-icon" data-target="#context-menu-'+ ( GUI.browsemode !== 'file' ? GUI.browsemode : 'folder' ) +'"></i>'+ arrayfile.length +'<gr> • </gr>'+ second2HMS( litime )
						  +'</span>'
						  +'</li>';
			}
			var arraydirL = arraydir.length;
			if ( arraydirL ) {
				for ( i = 0; i < arraydirL; i++ ) content += data2html( arraydir[ i ], i, 'db', path );
			}
			var arrayplL = arraypl.length;
			if ( arrayplL ) {
				if ( arraypl[ 0 ].playlist.split( '.' ).pop() === 'pls' ) {
					for ( i = 0; i < arrayplL; i++ ) content += data2html( arraypl[ i ], i, 'db', path );
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
			if ( arrayfileL ) for ( i = 0; i < arrayfileL; i++ ) content += data2html( arrayfile[ i ], i, 'db', path );
		} else {
			if ( data[ 0 ][ prop ] === undefined ) prop = mode[ GUI.browsemode ];
			var dataL = data.length;
			for ( i = 0; i < dataL; i++ ) {
				if ( data[ i ].index ) {
					data[ i ].index.forEach( function( char ) {
						$( '#db-index .index-'+ char ).removeClass( 'gr' );
					} );
				} else {
					content += data2html( data[ i ], i, 'db', path );
				}
			}
		}
		$( '#db-webradio-new' ).toggleClass( 'hide', path !== 'Webradio' );
	} else {
		if ( GUI.plugin === 'Spotify' ) {
			data = ( querytype === 'tracks' ) ? data.tracks : data.playlists;
			for ( i = 0; ( row = data[ i ] ); i++ ) content += data2html( row, i, 'Spotify', arg, querytype );
		} else if ( GUI.plugin === 'Dirble' ) {
			if ( querytype === 'childs-stations' ) {
				content = $( '#db-entries' ).html();
			} else {
				for ( i = 0; ( row = data[ i ] ); i++ ) content += data2html( row, i, 'Dirble', '', querytype );
			}
		} else if ( GUI.plugin === 'Jamendo' ) {
			for (i = 0; ( row = data[ i ] ); i++ ) content += data2html( row, i, 'Jamendo', '', querytype );
		}
	}
	$( '#db-entries' ).html( content +'<p></p>' ).promise().done( function() {
		// fill bottom of list to mave last li movable to top
		$( '#db-entries p' ).css( 'min-height', window.innerHeight - ( GUI.bars ? 140 : 100 ) +'px' );
		if ( !fileplaylist ) displayIndexBar();
		$( '#loader, .menu, #divcoverarts' ).addClass( 'hide' );
	} );
	
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
	}
	if ( GUI.browsemode !== 'file' || GUI.dbbrowsemode === 'coverart' ) {
		if ( GUI.browsemode !== 'album' && GUI.browsemode !== 'composeralbum' ) {
			var dotpath = ( path === mode[ GUI.browsemode ] ) ? '' : '<a id="artistalbum"><gr> • </gr><span class="white">'+ path +'</span></a>';
		} else {
			var albumpath = path === 'Album' ? '' : path;
			var albumtext = GUI.albumartist ? GUI.albumartist : albumpath;
			var dotpath = albumtext ? '<a id="artistalbum"><gr> • </gr><span class="white">'+ albumtext +'</span></a>' : '';
		}
		$( '#db-currentpath .lipath' ).text( path ); // for back navigation
		$( '#db-currentpath' ).addClass( 'noellipse' );
		// fix: 1 li in genre list
		if ( $( '.licover' ).length ) {
			browsemode = browsemode || GUI.dbbrowsemode;
			$( '#db-currentpath span' ).html( iconName[ browsemode ][ 0 ] +' <a>'+ iconName[ browsemode ][ 1 ] +'</a>' );
		} else {
			$( '#db-currentpath span' ).html( iconName[ GUI.browsemode ][ 0 ] +' <a id="rootpath" data-path="'+ mode[ GUI.browsemode ] +'">'+ iconName[ GUI.browsemode ][ 1 ] +'</a>'+ dotpath );
		}
		$( '#artistalbum' ).toggleClass( 'hide', coverart !== '' );
	} else {
		var folder = path.split( '/' );
		var folderRoot = folder[ 0 ];
		if ( $( '#db-search-keyword' ).val() ) {
		// search results
			var results = data.length - 4;
			$( '#db-currentpath' ).css( 'max-width', '40px' );
			$( '#db-back, #db-index' ).addClass( 'hide' );
			$( '#db-entries' ).css( 'width', '100%' );
			$( '#db-search-close' )
				.removeClass( 'hide' )
				.html( '<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span>\
					<span>' + results + ' <a>of</a> </span>' );
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
				if ( [ 'cue', 'm3u', 'mu8' ].indexOf( ext ) !== -1 ) continue
				
				folderPath += ( i > 0 ? '/' : '' ) + folder[ i ];
				folderCrumb += ' <a>'+ ( i > 0 ? '<w> / </w>' : '' ) + folder[ i ] +'<span class="lipath">'+ folderPath +'</span></a>';
			}
			$( '#db-currentpath .lipath' ).text( path );
			$( '#db-currentpath' ).find( 'span' ).html( folderCrumb );
		}
	}
	// hide index bar in directories with files only
	var lieq = $( '#db-entries .licover' ).length ? 1 : 0;
	if ( $( '#db-entries li:eq( '+ lieq +' ) i.db-icon' ).hasClass( 'fa-music' ) || fileplaylist ) {
		$( '#db-index' ).addClass( 'hide' );
		$( '#db-entries' ).css( 'width', '100%' );
	} else {
		$( '#db-index' ).removeClass( 'hide' );
		$( '#db-entries' ).css( 'width', '' );
	}
}
// set path, name, artist as text to avoid double quote escape
function data2html( inputArr, i, respType, inpath, querytype ) {
	var inputArr = inputArr || '',
		i = i || 0,
		respType = respType || '',
		inpath = inpath || '',
		querytype = querytype || '';
	switch ( respType ) {
		case 'db':
			if ( GUI.browsemode === 'file' ) {
				if ( inpath === '' && 'file' in inputArr ) {
					var file = inputArr.file
					inpath = file.split( '/' ).pop();
				}
				if ( 'file' in inputArr || inpath === 'Webradio' ) {
					if ( inpath !== 'Webradio' ) {
						if ( 'Title' in inputArr ) {
							var bl = $( '#db-search-keyword' ).val() ? inputArr.Artist +' - '+ inputArr.Album : inputArr.file.split( '/' ).pop();;
							var liname = inputArr.Title
							content = '<li class="file">'
									 +'<a class="lipath">'+ inputArr.file +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
									 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
									 +'<span class="li1">'+ liname +'<span class="time">'+ inputArr.Time +'</span></span>'
									 +'<span class="li2">'+ bl +'</span>'
						} else {
							var liname = inputArr.file.split( '/' ).pop(); // filename
							content = '<li class="file">'
									 +'<a class="lipath">'+ inputArr.file +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
									 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
									 +'<span class="li1">'+ liname +'<span class="time">' + second2HMS( inputArr.Time ) +'</span></span>'
									 +'<span class="li2">'+ inpath +'</span>'
						}
					} else { // Webradio
						var liname = inputArr.playlist.replace( /Webradio\/|\\|.pls$/g, '' );
						content = '<li class="db-webradio file" >'
								 +'<a class="lipath">'+ inputArr.url +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
								 +'<i class="fa fa-webradio db-icon db-radio" data-target="#context-menu-webradio"></i>'
								 +'<span class="li1">'+ liname +'</span>'
								 +'<span class="li2">'+ inputArr.url +'</span>'
					}
				} else {
					var liname = inputArr.directory.replace( inpath +'/', '' );
					content = '<li>'
							 +'<a class="lipath">'+ inputArr.directory +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-folder db-icon" data-target="#context-menu-folder"></i>'
							 +'<span class="single">'+ liname +'</span>'
				}
			} else if ( GUI.browsemode === 'album' ) {
				if ( 'file' in inputArr ) {
					var liname = inputArr.Title;
					content = '<li>'
							 +'<a class="lipath">'+ inputArr.file +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
							 +'<span class="li1">'+ liname +'<span class="time">'+ inputArr.Time +'</span></span>'
							 +'<span class="li2">'+ inputArr.file +'</span>'
					var artist = inputArr.Artist;
					if ( !GUI.albumartist ) GUI.albumartist = inputArr.Album +'<gr> • </gr>'+ artist;
				} else {
					var liname = inputArr.album;
					var artistalbum = inputArr.artistalbum;
					if ( artistalbum ) {
						var lialbum = artistalbum;
						var dataartist = '<a class="liartist">'+ inputArr.artist +'</a>';
					} else {
						var lialbum = liname;
						var dataartist = '';
					}
					content = '<li mode="album">'
							 +'<a class="lipath">'+ inputArr.album +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'+ dataartist
							 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
							 +'<span class="single">'+ lialbum +'</span>'
				}
			} else if ( GUI.browsemode === 'artist' || GUI.browsemode === 'composeralbum' ) {
				if ( 'album' in inputArr ) {
					var liname = inputArr.album;
					content = '<li mode="album">'
							 +'<a class="lipath">'+ inputArr.album +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
							 +'<span class="single">'+ liname +'</span>'
				} else {
					var liname = inputArr.artist;
					content = '<li mode="artist">'
							 +'<a class="lipath">'+ inputArr.artist +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-artist db-icon" data-target="#context-menu-artist"></i>'
							 +'<span class="single">'+ liname +'</span>'
				}
			} else if ( GUI.browsemode === 'albumartist' ) {
				if ( 'album' in inputArr ) {
					var liname = inputArr.album;
					content = '<li mode="album">'
							 +'<a class="lipath">'+ inputArr.album +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
							 +'<span class="single">'+ liname +'</span>'
				} else {
					var liname = inputArr.albumartist;
					content = '<li mode="albumartist">'
							 +'<a class="lipath">'+ inputArr.albumartist +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-albumartist db-icon" data-target="#context-menu-artist"></i>'
							 +'<span class="single">'+ liname +'</span>'
				}
			} else if ( GUI.browsemode === 'composer' ) {
				var liname = inputArr.composer;
				content = '<li mode="composer">'
						 +'<a class="lipath">'+ inputArr.composer +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
						 +'<i class="fa fa-composer db-icon" data-target="#context-menu-composer"></i>'
						 +'<span class="single">'+ inputArr.composer +'</span>'
			} else if ( GUI.browsemode === 'genre' ) {
				if ( 'album' in inputArr ) {
					var liname = inputArr.artistalbum;
					content = '<li mode="album">'
							 +'<a class="lipath">'+ inputArr.album +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a><a class="liartist">'+ inputArr.artist +'</a>'
							 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
							 +'<span class="single">'+ liname +'</span>'
				} else if ( 'file' in inputArr ) {
					var liname = inputArr.Title;
					content = '<li>'
							 +'<a class="lipath">'+ inputArr.file +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
							 +'<span class="li1">'+ liname +'<span class="time">'+ inputArr.Time +'</span></span>'
							 +'<span class="li2">'+ inputArr.Artist +' - '+ inputArr.Album +'</span>'
				} else {
					var liname = inputArr.genre ;
					content = '<li mode="genre">'
							 +'<a class="lipath">'+ inputArr.genre +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
							 +'<i class="fa fa-genre db-icon" data-target="#context-menu-genre"></i>'
							 +'<span class="single">'+ liname;+'</span>'
				}
			}
			break;
		case 'Spotify':
			if ( querytype === '' ) {
				var liname = inputArr.name ? inputArr.name : 'Favorites';
				content = '<li mode="spotify">'
						 +'<a class="lipath">'+ inputArr.index +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
						 +'<i class="fa fa-genre db-icon" data-target="#context-menu-spotify-pl"></i>'
						 +'<span class="single">'+ liname +' ( '+ inputArr.tracks +' )</span>'
			} else if ( querytype === 'tracks' ) {
				var liname = inputArr.Title;
				content = '<li data-plid="'+ inpath +'" data-type="spotify-track" mode="spotify">'
						 +'<a class="lipath">'+ inputArr.index +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
						 +'<i class="fa fa-spotify db-icon" data-target="#context-menu-spotify"></i>'
						 +'<span class="li1">'+ liname +'<span class="time">'+ second2HMS( inputArr.duration / 1000 ) +'</span></span>'
						 +'<span class="li2">'+ inputArr.artist +' - '+ inputArr.album +'</span>'
			}
			break;
		case 'Dirble':
			if ( inputArr.index ) {
				inputArr.index.forEach( function( char ) {
					$( '#db-index .index-'+ char ).removeClass( 'gr' );
				} );
			} else if ( querytype === '' || querytype === 'childs' ) {
				var liname = inputArr.title;
				var childClass = ( querytype === 'childs' ) ? ' db-dirble-child' : '';
				content = '<li class="db-dirble'+ childClass +'" mode="dirble">'
						 +'<a class="lipath">'+ inputArr.id +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
						 +'<i class="fa fa-genre db-icon"></i>'
						 +'<span class="single">'+ liname +'</span>'
			} else if ( [ 'search', 'stations', 'childs-stations' ].indexOf( querytype ) !== -1 ) {
				if ( !inputArr.streams.length ) break; // Filter stations with no streams
				
				var liname = inputArr.name;
				var url = inputArr.streams[ 0 ].stream
				content = '<li mode="dirble">'
						 +'<a class="lipath">'+ url +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
						 +'<i class="fa fa-webradio db-icon" data-target="#context-menu-radio"></i>'
						 +'<span class="li1">'+ liname +'&ensp;<span>( '+ inputArr.country +' )</span></span>'
						 +'<span class="li2">'+ url +'</span>'
			}
			break;
		case 'Jamendo':
			var liname = inputArr.dispname;
			content = '<li mode="jamendo">'
					 +'<a class="lipath">'+ inputArr.stream +'</a><a class="liname">'+ liname +'</a><a class="lisort">'+ inputArr.lisort +'</a>'
					 +'<img class="jamendo-cover db-icon" src="'+ inputArr.image +'"  data-target="#context-menu-radio">'
					 +'<span class="single">'+ liname +'</span>'
			break;
	}
	return content +'</li>';
}
function dbContextmenu( $li ) {
	$( '.menu' ).addClass( 'hide' );
	if ( $li.hasClass( 'active' ) ) {
		$li.removeClass( 'active' );
		return
	}
	
	GUI.list = {};
	if ( $li.hasClass( 'licover' ) ) {
		GUI.list.mode = 'album'
	} else {
		GUI.list.mode = $li.find( '.db-icon' ).prop( 'class' ).replace( /fa fa-| db-icon/g, '' );
	}
	GUI.list.path = $li.find( '.lipath' ).text() || '';
	GUI.list.name = $li.find( '.liname' ).text() || '';
	GUI.list.bioartist = $li.find( '.bioartist' ).text() || '';
	GUI.list.artist = $li.find( '.liartist' ).text() || '';
	GUI.list.isfile = $li.hasClass( 'file' );              // file/dirble - in contextmenu
	GUI.list.index = $li.find( '.liindex' ).text() || '';  // cue - in contextmenu
	GUI.list.liindex = $( '#db-entries li' ).index( $li ); // for webradio delete - in contextmenu
	if ( $( '#db-currentpath' ).find( '.lipath' ).text() === 'Webradio' ) GUI.list.url = $li.find( '.bl' ).text();
	var $menu = $( $li.find( '.db-icon' ).data( 'target' ) );
	$( '.replace' ).toggleClass( 'hide', !GUI.status.playlistlength );
	$( '.update' ).toggleClass( 'hide', GUI.status.updating_db !== 0 );
	var contextnum = $menu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 41 - 1 );
	$( '#db-entries li' ).removeClass( 'active' );
	$li.addClass( 'active' );
	if ( $li.hasClass( 'licover' ) ) {
		var menutop = GUI.bars ? '310px' : '270px';
	} else {
		var menutop = ( $li.position().top + 49 ) +'px';
	}
	$menu
		.css( 'top',  menutop )
		.removeClass( 'hide' );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( GUI.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
}
function plContextmenu( $li ) {
	GUI.list = {};
	GUI.list.li = $li; // for contextmenu
	GUI.list.name = $li.find( '.liname' ).text();
	GUI.list.path = $li.find( '.lipath' ).text() || GUI.list.name;
	GUI.list.isfile = $li.find( '.fa-music' ).length; // used in contextmenu
	$( '.menu' ).addClass( 'hide' );
	if ( $li.hasClass( 'active' ) ) {
		$li.removeClass( 'active' );
		return
	}
	$( '.replace' ).toggleClass( 'hide', !GUI.status.playlistlength );
	var contextmenu = $li.find( '.pl-icon' ).data( 'target' );
	var contextnum = $( contextmenu ).find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 41 - 1 );
	$( '#pl-editor li' ).removeClass( 'active' );
	$li.addClass( 'active' );
	$( contextmenu )
		.removeClass( 'hide' )
		.css( 'top', ( $li.position().top + 49 ) +'px' );
	var targetB = $( contextmenu ).offset().top + 246;
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
	if ( GUI.sortable ) return // 'skip for Sortable'
	
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
		} else if ( 'track' in value && value.track.slice( 0, 4 ) === 'http' ) {
			var title = value.Title && value.Title || '';
			var name = title.toString().replace( '*', '' );
			content += '<li>'
						  +'<i class="fa fa-webradio pl-icon'+ ( title[ 0 ] === '*' || !title ? ' unsaved' : '' ) +'" data-target="#context-menu-webradiopl"></i>'
						  +'<a class="lipath">'+ value.file +'</a>'
						  +'<span class="li1"><a class="name">'+ name +'</a><a class="song"></a><span class="duration"><a class="elapsed"></a></span></span>'
						  +'<span class="li2">'+ ( name ? name +' • ' : '' ) + value.file +'</span>'
					  +'</li>';
			countradio++;
		} else {
			sec = value.Time ? HMS2Second( value.Time ) : 0;
			pltime += sec;
			if ( GUI.playlist && !GUI.pleditor ) {
				var actionhtml = '<i class="fa fa-music pl-icon"></i>';
			} else {
				var dbpl = GUI.library ? 'db' : 'pl';
				var actionhtml = '<i class="fa fa-music '+ dbpl +'-icon" data-target="#context-menu-file"></i>'
								+'<a class="lipath">'+ ( value.cuem3u || value.file ) +'</a>'
								+'<a class="liname">'+ value.Title +'</a>'
								+'<a class="liindex">'+ value.index +'</a>';
			}
			if ( GUI.playlist ) {
				li2 = value.track;
			} else if ( $( '#db-currentpath a:last' ).text() === 'COVERART' ) {
				li2 = value.file;
			} else {
				li2 = value.file.split( '/' ).pop();
			}
			content += '<li>'
						 + actionhtml
						 +'<span class="li1"><a class="name">'+ value.Title +'</a><span class="duration">'+ ( GUI.playlist && !GUI.pleditor ? '<a class="elapsed"></a>' : '' ) +'<a class="time" time="'+ sec +'">'+ value.Time +'</a></span></span>'
						 +'<span class="li2">'+ li2 +'</span>'
					 +'</li>';
			countsong++;
		}
	} );
	if ( coverart ) {
		var browsemode = GUI.dbbackdata.length ? GUI.dbbackdata[ 0 ].browsemode : '';
		var composerhtml = ( composer && browsemode == 'composer' ) ? '<i class="fa fa-composer"></i><spanspan class="biocomposer">'+ composer +'</span><br>' : '';
		var genrehtml = genre && genre !== -1 ? '<span><i class="fa fa-genre"></i>'+ genre +'</span><br>' : '';
		var licover = '<li class="licover">'
						 +'<a class="lipath">'+ path +'</a><a class="liname">'+ path.replace(/^.*\//, '') +'</a>'
						 +'<div class="licoverimg"><img src="'+ coverart +'" class="coversmall"></div>'
						 +'<span class="liinfo">'
							+'<bl class="lialbum">'+ album +'</bl><br>'
							+ composerhtml
							+'<i class="fa fa-albumartist"></i><span class="bioartist">'+ artist +'</span><br>'
							+ genrehtml
							+'<i class="fa fa-music db-icon" data-target="#context-menu-folder"></i>'+ countsong +'<gr> • </gr>'+ second2HMS( pltime )
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
		$( '#plsave, #plcrop, #plclear, #pl-searchbtn' ).addClass( 'disable' );
		$( '#pl-entries' ).empty();
		$( '.playlist' ).removeClass( 'hide' );
		$( '#playlist-warning' ).css( 'margin-top', ( GUI.bars ? 27 : 47 ) +'px' );
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	
	$( '#plcrop' ).toggleClass( 'disable', GUI.pllist.length < 2 );
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
	$( '#playlist-warning' ).addClass( 'hide' );
	$( '#pl-count' ).html( counthtml );
	$( '#plsave, #plclear, #pl-searchbtn' ).removeClass( 'disable' );
	$( '#pl-entries' ).html( data.content +'<p></p>' ).promise().done( function() {
		$( '#pl-entries p' ).css( 'min-height', window.innerHeight - 140 +'px' );
		setPlaylistScroll();
	} );
}
function removeFromPlaylist( $li ) {
	var $this = $li;
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
}
function clearPlaylist() {
	GUI.status.playlistlength = 0;
	GUI.pllist = {};
	$.post( 'enhance.php', { mpc: [ 'mpc clear', '/usr/bin/redis-cli del webradiopl' ] } );
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
		// fill bottom of list to mave last li movable to top
		$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.bars ? 140 : 100 ) +'px' );
		$( '#pl-editor' ).css( 'width', '' );
		$( '#loader' ).addClass( 'hide' );
		$( 'html, body' ).scrollTop( GUI.plscrolltop );
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

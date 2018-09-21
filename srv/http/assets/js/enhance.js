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
	, intElapsed   : ''
	, intKnob      : ''
	, list         : {}
	, libraryhome  : {}
	, local        : 0
	, noticeUI     : {}
	, playlist     : {}
	, plcurrent    : ''
	, pleditor     : 0
	, plscrolltop  : 0
	, plugin       : ''
	, status       : {}
	, swipe        : 0
	, timeout      : ''
};
var blinkdot = '<a class="dot">.</a> <a class="dot dot2">.</a> <a class="dot dot3">.</a>';

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$( '#menu-settings, #badge' ).click( function() {
	$( '#settings' ).toggleClass( 'hide' ).css( 'top', $( '#menu-top' ).is( ':hidden' ) ? 0 : '40px' );
} );
$( '#song, #playlist-warning' ).on( 'click', 'i', function() {
	$( '#open-library' ).click();
} );
$( '#open-library' ).click( function() {
	if ( $.isEmptyObject( GUI.libraryhome ) ) return;
	
	if ( GUI.bookmarkedit ) {
		GUI.bookmarkedit = 0;
		renderLibrary();
		return
	}
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	
	if ( $( this ).hasClass( 'active' ) && GUI.dblist ) {
		GUI.dblist = GUI.dbback = 0;
		GUI.currentpath = GUI.browsemode = GUI.dbbrowsemode = ''
		GUI.dbbackdata = [];
		
		renderLibrary();
		return
	}
	
	setPanelActive( $( '#panel-library' ) );
	if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
		renderLibrary();
		displayLibrary();
	} else {
		var scrollpos = GUI.dbscrolltop[ $( '#db-currentpath' ).attr( 'path' ) ];
		$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	}
} );
$( '#open-playback' ).click( function() {
	setPanelActive( $( '#panel-playback' ) );
	getPlaybackStatus();
	displayPlayback();
} );
$( '#open-playlist' ).click( function() {
	
	if ( $( this ).hasClass( 'active' ) && GUI.pleditor ) GUI.pleditor = 0;
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	setPanelActive( $( '#panel-playlist' ) );
	if ( GUI.pleditor ) return;
	
	$( '#loader' ).removeClass( 'hide' );
	$.post( 'enhance.php', { getplaylist: 1 }, function( data ) {
		GUI.playlist = data;
		renderPlaylist();
	}, 'json' );
} );
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
				+ libraryLabel( 'bars', 'Top-Bottom menu' )
				+ libraryLabel( 'time', 'Time' )
				+ libraryLabel( 'radioelapsed', 'Webradio elapsed' )
				+ libraryLabel( 'coverart', 'Cover art' )
				+ libraryLabel( 'volume', 'Volume' )
				+ libraryLabel( 'buttons', 'Buttons' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			displayPlayback();
			tempFlag( 'local' );
			$.post( 'enhance.php', { setdisplay: GUI.display } );
			// for set display to show radioelapsed
			if ( GUI.status.ext === 'radio' ) {
				if ( !GUI.display.radioelapsed ) {
					$( '#total' ).empty();
					return;
				}
				if ( GUI.status.state === 'play' && $( '#total' ).html() === '' ) {
					clearInterval( GUI.intElapsed );
					$.post( 'enhance.php', { mpc: "status | awk 'NR==2' | awk '{print $3}' | cut -d'/' -f1" }, function( HMS ) {
						var elapsed = HMS2Second( HMS );
						GUI.intElapsed = setInterval( function() {
							elapsed++
							$( '#total' ).text( HMS );
						}, 1000 );
					}, 'json' );
				}
			}
		}
	} );
	// disable by mpd volume
	if ( !GUI.display.volumempd ) setToggleButton( 'volume', '(disabled)' );
	// disable by autohide
	if ( window.innerWidth >= 500 ) return;
	
	if ( window.innerHeight <= 515 ) setToggleButton( 'bars' );
	if ( window.innerHeight <= 320 ) setToggleButton( 'buttons' );
} );
$( '#panel-library' ).on( 'taphold', function() {
	if ( GUI.swipe || GUI.local ) return;
	
	info( {
		  title        : 'Libary Home'
		, message      : 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysavelibrary">'
				+ libraryLabel( 'bars', 'Top-Bottom menu' )
				+ libraryLabel( 'sd', 'SD card' )
				+ libraryLabel( 'usb', 'USB drives' )
				+ libraryLabel( 'nas', 'Network drives' )
				+ libraryLabel( 'webradio', 'Webradios' )
				+ libraryLabel( 'albums', 'Albums' )
				+ libraryLabel( 'artists', 'Artists' )
				+ libraryLabel( 'composer', 'Composers' )
				+ libraryLabel( 'genre', 'Genres' )
				+ libraryLabel( 'dirble', 'Dirble' )
				+ libraryLabel( 'jamendo', 'Jamendo' )
			+'</form>'
		, cancel       : 1
		, ok           : function () {
			$( '#displaysavelibrary input' ).each( function() {
				GUI.display[ this.name ] = this.checked ? 'checked' : '';
			} );
			displayLibrary();
			tempFlag( 'local' );
			$.post( 'enhance.php', { setdisplay: GUI.display } );
		}
	} );
} );
$( '#home-blocks' ).on( 'click', '.home-block', function( e ) {
	var $this = $( this );
	if ( e.target.id === 'home-block-edit' ) {
		bookmarkRename( $this.data( 'name' ), $this.data( 'path' ), $this )
	} else if ( e.target.id === 'home-block-remove' ) {
		bookmarkDelete( $this.data( 'name' ), $this.parent() )
	} else if ( $this.data( 'target' ) === 'webradio-add' ) {
		webRadioNew();
	} else {
		if ( GUI.taphold || GUI.local || ( $this[ 0 ].id === 'home-sd' && $('#home-sd span').text() === '( 0 )' ) ) return;
		
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
} ).on( 'taphold', '.home-block', function( e ) {
	tempFlag( 'taphold', 2000 );
	if ( GUI.swipe ) return;
	
	if ( !$( e.target ).parents( '.home-bookmark' ) && !$( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	tempFlag( 'local' );
	$( '.home-bookmark' ).append( '<i id="home-block-edit" class="fa fa-edit"></i><i id="home-block-remove" class="fa fa-minus-circle"></i>' );
} ).click( function( e ) {
	if ( $( e.target ).parents( '.home-bookmark' ).length || $( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	$( '#home-block-edit, #home-block-remove' ).remove();
} );

var btnctrl = {
	  timeTL : 'overlay-playsource-open'
	, timeT  : 'guide'
	, timeTR : 'menu'
	, timeL  : 'previous'
	, timeM  : 'play'
	, timeBL : 'random'
	, timeR  : 'next'
	, timeB  : 'stop'
	, timeBR : 'repeat'
	, coverTL: 'overlay-playsource-open'
	, coverT : 'guide'
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
	if ( cmd === 'guide' ) {
		$( '.controls, .controls1, .rs-tooltip, #imode' ).toggleClass( 'hide' );
		return;
	} else if ( cmd === 'menu' ) {
		$( '#menu-settings' ).click();
	} else if ( cmd === 'random' ) {
		$( '#random' ).click();
	} else if ( cmd === 'repeat' ) {
		if ( GUI.status.repeat ) {
			if ( GUI.status.single ) {
				GUI.status.repeat = GUI.status.single = 0;
				$( '#repeat, #single' ).removeClass( 'btn-primary' );
				$( '#irepeat' ).attr( 'class', 'fa hide' );
				tempFlag( 'local' );
				$.post( 'enhance.php', { mpc: [ 'repeat 0', 'single 0' ] } );
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
	if ( e.target.id !== 'menu-settings' && e.target.id !== 'badge' ) $( '#settings' ).addClass( 'hide' );
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} );
$( '#biocontent' ).delegate( '.biosimilar', 'click', function() {
	getBio( $( this ).find( 'p' ).text() )
} );
$( '#closebio' ).click( function() {
	$( '#bio' ).addClass( 'hide' );
	displayCommon();
} );
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
		renderLibrary();
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
	
	playlistNew();
} );
$( '#pl-manage-clear' ).click( function() {
	if ( !GUI.status.playlistlength ) return;
	
	info( {
		  title   : 'Clear Playlist'
		, message : 'Clear this playlist?'
		, cancel  : 1
		, ok      : function() {
			GUI.status.playlistlength = 0;
			renderPlaylist();
			setPlaybackBlank();
			$.post( 'enhance.php', { mpc: 'clear' } );
		}
	} );
} );
$( '#pl-entries' ).on( 'click', 'li', function( e ) {
	var songpos = $( this ).index() + 1;
	if ( !$( e.target ).hasClass( 'pl-action' ) ) {
		var state = GUI.status.state;
		if ( state == 'stop' ) {
			$.post( 'enhance.php', { mpc: 'play '+ songpos } );
			$( '#pl-entries li' ).removeClass( 'active' );
			$( this ).addClass( 'active' );
		} else {
			if ( $( this ).hasClass( 'active' ) ) {
				state == 'play' ? $( '#pause' ).click() : $( '#play' ).click();
			} else {
				$.post( 'enhance.php', { mpc: 'play '+ songpos } );
				$( '#pl-entries li' ).removeClass( 'active' );
				$( this ).addClass( 'active' );
			}
		}
		return
	}
	
	var $this = $( this );
	var radio = $this.hasClass( 'radio' );
	var $elcount = radio ? $( '#countradio' ) : $( '#countsong' );
	var count = $elcount.attr( 'count' ) - 1;
	$elcount.attr( 'count', count ).text( count );
	var time = +$( '#pltime' ).attr( 'time' ) - $this.find( '.time' ).attr( 'time' );
	if ( !radio ) $( '#pltime' ).attr( 'time', time ).text( second2HMS( time ) );
	if ( count === 0 ) {
		$elcount.next().remove();
		$elcount.remove();
		if ( $elcount[ 0 ].id === 'countradio' ) {
			$( '#pltime' ).css( 'color', '#e0e7ee' );
		} else {
			$( '#pltime' ).remove();
		}
	}
	if ( $( '#countradio' ).attr( 'count' ) === '0' ) {
		$( '#pltime' ).css( 'color', '#e0e7ee' );
		$( '#countradio' ).next().remove();
		$( '#countradio' ).remove();
	}
	if ( $this.hasClass( 'active' ) ) {
		if ( $this.index() + 1 < $this.siblings().length ) {
			$this.next().addClass( 'active' );
		} else {
			$( '#pl-entries li:eq( 0 )' ).addClass( 'active' );
			$( 'html, body' ).scrollTop( 0 );
		}
	}
	$this.remove();
	tempFlag( 'local' );
	$.post( 'enhance.php', { mpc: 'del '+ songpos } );
	if ( !$( '#countsong, #countradio' ).length ) {
		GUI.status.playlistlength = 0;
		renderPlaylist();
	}
} );
$( 'body' ).click( function( e ) {
	if ( e.target.id !== 'menu-settings'
		&& e.target.id !== 'badge'
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
	GUI.list = {};
	GUI.list.path = GUI.dbpath; // used in contextmenu
	GUI.list.name = $thisli.attr( 'liname' );
	GUI.list.isfile = $thisli.find( 'i.db-icon' ).hasClass( 'fa-music' ); // used in contextmenu
	if ( $( '#db-currentpath' ).attr( 'path' ) === 'Webradio' ) GUI.list.url = $thisli.find( '.bl' ).text();
	var $menu = $( $this.data( 'target' ) );
	$( '#db-entries li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( GUI.dbpath === GUI.dbcurrent ) {
		GUI.dbcurrent = '';
	} else {
		GUI.dbcurrent = GUI.dbpath;
		$thisli.addClass( 'active' );
		$menu.removeClass( 'hide' )
			.css( 'top', $this.position().top +'px' )
			.find( '.menushadow' ).css( 'height', $menu.find( 'i' ).length * 41 );
		var targetB = $menu.offset().top + $menu.height();
		var wH = window.innerHeight;
		if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
	}
} );
$( '#pl-editor' ).on( 'click', '.pl-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	var plname = $thisli.data( 'path' );
	GUI.list = {};
	GUI.list.li = $thisli; // for contextmenu
	GUI.list.name = plname;
	GUI.list.path = plname;
	GUI.list.isfile = $thisli.hasClass( 'pl-song' ); // used in contextmenu
	$( '#pl-editor li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( plname === GUI.plcurrent ) {
		GUI.plcurrent = '';
	} else {
		GUI.plcurrent = plname;
		$thisli.addClass( 'active' );
		$contextmenu = GUI.list.isfile ? $( '#context-menu-file' ) : $( '#context-menu-playlist' );
		$contextmenu.removeClass( 'hide' ).css( 'top', $this.position().top +'px' );
		var targetB = $contextmenu.offset().top + 246;
		var wH = window.innerHeight;
		if ( targetB > wH + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + ( GUI.display.bars ? 42 : 0 ) } );
	}
} );
$( '#pl-editor' ).on( 'click', 'li', function( e ) {
	$( '#loader' ).removeClass( 'hide' );
	
	var name = $( this ).data( 'path' );
	$.post( 'enhance.php', { getplaylist: 1, name: '"'+ name +'"' }, function( data ) {
		var countradio = 0;
		var content, pl, iconhtml, topline, bottomline, classradio, hidetotal;
		content = iconhtml = topline =bottomline = classradio = hidetotal = '';
		var id, totaltime, pltime, seconds, countsong, countradio;
		id = totaltime = pltime = seconds = countsong = countradio = 0;
		var ilength = data.length;
		for ( i = 0; i < ilength; i++ ) {
			var pl = data[ i ];
			if ( pl.file.slice( 0, 4 ) === 'http' ) {
				iconhtml = '<i class="fa fa-webradio pl-icon"></i>';
				classradio = 1;
				countradio++
				topline = pl.title;
				bottomline = pl.file;
			} else {
				iconhtml = '<i class="fa fa-music pl-icon"></i>';
				classradio = 0;
				sec = HMS2Second( pl.time );
				topline = pl.title +'&ensp;<gr>'+ pl.time +'</gr>';
				bottomline = pl.track
				pltime += sec;
			}
			content += '<li data-path="'+ pl.file +'" class="pl-song">'
				+ iconhtml
				+'<i class="fa fa-bars pl-action" data-target="#context-menu-file"></i>'
				+'<span class="sn">'+ topline +'</span>'
				+'<span class="bl">'+ bottomline +'</span>'
				+'</li>';
		}
		countsong = ilength - countradio;
		var counthtml = '<wh><i class="fa fa-list-ul"></i></wh><bl class="title">'+ name +'<gr>&emsp;•</gr></bl>';
		var countradiohtml = '<wh>&emsp;'+ countradio +'</wh>&ensp;<i class="fa fa-webradio"></i>';
		if ( countsong ) {
			var pltimehtml = ' id="pltime" time="'+ pltime +'">'+ second2HMS( pltime );
			var totalhtml = countradio ? '<gr'+ pltimehtml +'</gr>'+ countradiohtml : '<wh'+ pltimehtml +'</wh>';
			counthtml += '<wh>'+ numFormat( countsong ) +'</wh>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
		} else {
			counthtml += countradiohtml;
		}
		$( '#pl-currentpath' ).html( counthtml +'<i class="fa fa-arrow-left plsback"></i>' );
		$( '#pl-currentpath, #pl-editor' ).removeClass( 'hide' );
		$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
			GUI.pleditor = 1;
			// fill bottom of list to mave last li movable to top
			$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
			$( '#pl-editor' ).css( 'width', '100%' );
			$( '#loader, #pl-index' ).addClass( 'hide' );
			$( 'html, body' ).scrollTop( GUI.plscrolltop );
		} );
	}, 'json' );
} );
$( '#pl-currentpath' ).on( 'click', '.plsback', function() {
	$( '#pl-manage-list' ).click();
} );
$( '#pl-currentpath' ).on( 'click', '.plsbackroot', function() {
	$( '#open-playlist' ).click();
} );
$( '#pl-home' ).click( function() {
	$( '#open-playlist' ).click();
} );
$( '#pl-manage-list' ).click( function() {
	$( '.playlist' ).addClass( 'hide' );
	$( '#loader' ).removeClass( 'hide' );
	
	$.post( 'enhance.php', { mpc: 'lsplaylists' }, function( data ) {
		var pl = data.split( '\n' );
		pl.pop(); // remove last blank
		var plL = pl.length;
		var plcounthtml = '<wh><i class="fa fa-folder"></i></wh><bl>PLAYLISTS</bl>';
		plcounthtml += plL ? '<gr>&emsp;•&ensp;</gr><wh id="pls-count">'+ numFormat( plL ) +'</wh>&ensp;<i class="fa fa-list-ul"></i>' : '';
		$( '#pl-currentpath' ).html( plcounthtml +'<i class="fa fa-arrow-left plsbackroot"></i>' );
		$( '#pl-currentpath, #pl-editor, #pl-index' ).removeClass( 'hide' );
		
		pl.sort( function( a, b ) {
			return stripLeading( a ).localeCompare( stripLeading( b ), undefined, { numeric: true } );
		} );
		var content = '';
		pl.forEach( function( el ) {
			content += '<li class="pl-folder" data-path="'+ el +'"><i class="fa fa-list-ul pl-icon"></i><i class="fa fa-bars pl-action"></i><span class="pleditor">'+ el +'</span></li>';
		} );
		$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
			GUI.pleditor = 1;
			// fill bottom of list to mave last li movable to top
			$( '#pl-editor p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
			$( '#pl-editor' ).css( 'width', '' );
			$( '#loader' ).addClass( 'hide' );
			$( 'html, body' ).scrollTop( GUI.plscrolltop );
			displayIndexBar();
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
		tempFlag( 'local' );
		$.post( 'enhance.php', { mpc: 'move '+ ( e.oldIndex + 1 ) +' '+ ( e.newIndex + 1 ) } );
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
		renderLibrary();
	}
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
			mpdSeek( Math.floor( e.value / 1000 * time ) );
		}
	}
	, start       : function () {
		if ( GUI.status.ext === 'radio' ) return;
		
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
	}
	, drag        : function ( e ) { // drag with no transition by default
		if ( GUI.status.ext === 'radio' ) return;
		
		$( '#elapsed' ).text( second2HMS( Math.round( e.value / 1000 * time ) ) );
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
		tempFlag( 'local' );
		$.post( 'enhance.php', { volume: e.value } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
		// value before 'change'
		if ( e.preValue === 0 ) unmuteColor();
	}
	, start           : function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmuteColor(); // value before 'start drag'
	}
	, drag            : function ( e ) { // drag with no transition by default
		if ( e.value % 2 === 0 ) {
			GUI.local = 1; // cleared by 'change'
			$.post( 'enhance.php', { mpc: 'volume '+ e.value } );
			$( e.handle.element ).rsRotate( - e.handle.angle );
		}
	}
	, stop            : function( e ) { // on 'stop drag'
//		tempFlag( 'local' );
//		$.post( 'enhance.php', { volume: e.value } );
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
	tempFlag( 'local' );
	$.post( 'enhance.php', { volume: 'setmute' } );
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	if ( ( vol === 0 && ( thisid === 'voldn' ) ) || ( vol === 100 && ( thisid === 'volup' ) ) ) return;

	vol = ( thisid === 'volup' ) ? vol + 1 : vol - 1;
	$volumeRS.setValue( vol );
	tempFlag( 'local' );
	$.post( 'enhance.php', { volume: vol } );
} );
$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var cmd = $this.data( 'cmd' );
	if ( $this.hasClass( 'btn-toggle' ) ) {
		if ( GUI.status.ext === 'radio' ) return;
		
		if ( cmd === 'pl-ashuffle-stop' ) {
			$.post( 'enhance.php', { bash: '/usr/bin/killall ashuffle &' } );
			return;
		}
		var onoff = GUI.status[ cmd ] ? 0 : 1;
		GUI.status[ cmd ] = onoff;
		cmd = cmd +' '+ onoff;
	} else {
		if ( cmd === 'pause' || cmd === 'stop' ) {
			clearInterval( GUI.intKnob );
			clearInterval( GUI.intElapsed );
			if ( GUI.status.ext === 'radio' ) {
				cmd = 'stop';
				$( '#song' ).empty();
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
	$.post( 'enhance.php', { mpc: cmd } );
} );
// init display data pushstream ( get data directly needs revised code )
$.post( 'enhance.php', { getdisplay: 1 } );

getPlaybackStatus();

if ( document.location.hostname === 'localhost' ) $( '.osk-trigger' ).onScreenKeyboard( { 'draggable': true } );


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
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		$.each( streams, function( i, stream ) {
			pushstreams[ stream ].disconnect();
		} );
	} else {
		$.each( streams, function( i, stream ) {
			pushstreams[ stream ].connect();
		} );
		if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
			getPlaybackStatus();
			displayPlayback();
		} else if ( $( '#panel-playlist' ).hasClass( 'active' ) && !GUI.pleditor ) {
			setPlaylistScroll();
		}
	}
} );
window.addEventListener( 'orientationchange', function() {
	if ( GUI.dblist || !$( '#pl-editor' ).hasClass( 'hide' ) ) displayIndexBar();
} );

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

var psOption = {
	  host: window.location.hostname
	, port: window.location.port
	, modes: 'websocket'
};
var pushstreams = {};
var streams = [ 'display', 'volume', 'library', 'idle', 'notify' ];
$.each( streams, function( i, stream ) {
	pushstreams[ stream ] = new PushStream( psOption );
	pushstreams[ stream ].addChannel( stream );
} );

pushstreams[ 'display' ].onmessage = function( data ) {
	if ( typeof data[ 0 ] === 'object' ) GUI.display = data[ 0 ];
	if ( GUI.local ) return;
	
	if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
		displayPlayback();
	} else if ( $( '#panel-library' ).hasClass( 'active' ) ) {
		displayLibrary();
	} else {
		displayCommon();
	}
}
pushstreams[ 'volume' ].onmessage = function( data ) {
	if ( GUI.local ) return;
	
	var data = data[ 0 ];
	var vol = data[ 0 ];
	var volumemute = data[ 1 ];
	$volumeRS.setValue( vol );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
	volumemute ? muteColor( volumemute ) : unmuteColor();
}
pushstreams[ 'library' ].onmessage = function( data ) {
	GUI.libraryhome = data[ 0 ];
	if ( !GUI.local && !GUI.bookmarkedit ) renderLibrary();
}
pushstreams[ 'idle' ].onmessage = function( data ) {
	var data = data[ 0 ];
	if ( data === 'player' ) {
		getPlaybackStatus();
	} else if ( data === 'playlist' ) {
		if ( GUI.pleditor || GUI.local ) return;
		
		$.post( 'enhance.php', { getplaylist: 1 }, function( data ) {
			GUI.playlist = data;
			renderPlaylist();
		}, 'json' );
	} else if ( data === 'options' ) {
		if ( GUI.local ) return;
		
		$.post( 'enhance.php', { mpc: 'status | tail -n1' }, function( data ) {
			var data = data.split( /  +/ );
			GUI.status.repeat = data[ 1 ].split( ' ' ).pop() === 'on' ? 1 : 0;
			GUI.status.random = data[ 2 ].split( ' ' ).pop() === 'on' ? 1 : 0;
			GUI.status.single = data[ 3 ].split( ' ' ).pop() === 'on' ? 1 : 0;
			setButtonToggle();
		} );
	}
}
pushstreams[ 'notify' ].onmessage = renderMSG;

$.each( streams, function( i, stream ) {
	pushstreams[ stream ].connect();
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
function renderMSG( data ) {
	var notify = data[ 0 ];
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
		, delay       : notify.delay ? notify.delay : 3000
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
function setPanelActive( el ) {
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
	var flag = fl || 'local';
	var time = ms || 500;
	GUI[ flag ] = 1;
	clearTimeout( GUI.timeout );
	GUI.timeout = setTimeout( function() { GUI[ flag ] = 0 }, time );
}
function libraryLabel( name, label ) {
	return '<label><input name="'+ name +'" type="checkbox" '+ GUI.display[ name ] +'>&ensp;'+label+'</label><br>';
}
function setToggleButton( name, append ) {
	$( 'input[name="'+ name +'"]' )
		.prop( 'disabled', true )
		.parent().css( 'color', '#7795b4' )
		.append( append ? ' '+ append : ' (auto hide)' );
}
function getBio( artist ) {
	$( '#loader' ).removeClass( 'hide' );
	$.get( 'enhancebio.php',
		{ artist: artist },
		function( data ) {
			$( '#biocontent' ).html( data ).promise().done( function() {
				$( '#bio' ).scrollTop( 0 );
				renderBio();
			} );
		}
	);
}
function renderBio() {
	$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
	$( '#bio' ).removeClass( 'hide' );
}
$( '#artist, #bio-open' ).click( function() {
	if ( GUI.status.ext === 'radio' ) return;
	
	if ( $( '#bio legend' ).text() != GUI.status.Artist ) {
		getBio( GUI.status.Artist );
	} else {
		renderBio();
	}
} );
function mpdSeek( seekto ) {
	if ( GUI.status.state !== 'stop' ) {
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		$.post( 'enhance.php', { mpc: 'seek '+ seekto } );
	} else {
		$.post( 'enhance.php', { mpc: [ 'play', 'seek '+ seekto, 'pause' ] } );
	}
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
	$( '#menu-top, #menu-bottom' ).toggleClass( 'hide', GUI.display.bars === '' );
	$( '#playback-row' ).removeClass( 'hide' );
	$( '#time-knob' ).toggleClass( 'hide', GUI.display.time === '' );
	$( '#irandom, irepeat, #coverartoverlay, #volume-knob, #play-group, #share-group, #vol-group' ).addClass( 'hide' );
	$( '#playsource-mpd' ).addClass( 'inactive' );
	$( '#playsource-airplay' ).removeClass( 'inactive' );
	if ( GUI.display.time ) {
		$( '#time-knob, #play-group, #coverart, #share-group' ).css( 'width', '45%' );
		clearInterval( GUI.intKnob );
		clearInterval( GUI.intElapsed );
		$( '#time' ).roundSlider( 'setValue', 0 );
		$( '#elapsed' ).html( blinkdot );
		$( '#total' ).empty();
		$( '#iplayer' ).addClass( 'fa-airplay' ).removeClass( 'hide' );
	} else {
		$( '#coverart, #share-group' ).css( 'width', '60%' );
	}
}
function PlaybackCssOrder( el, ord ) {
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
			PlaybackCssOrder( $( '#time-knob' ), 1 );
			PlaybackCssOrder( $( '#coverart' ), 2 );
			PlaybackCssOrder( $( '#volume-knob' ), 3 );
			PlaybackCssOrder( $( '#play-group' ), 4 );
			PlaybackCssOrder( $( '#share-group' ), 5 );
			PlaybackCssOrder( $( '#vol-group' ), 6 );
		}
		$( '#playback-row' ).css( 'max-width', '900px' );
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '45%' );
	} else if ( i === 1 ) {
		$( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( 'width', '60%' );
	}
	if ( !GUI.display.buttons || window.innerHeight <= 320 || window.innerWidth < 499 ) {
		$( '#play-group, #share-group, #vol-group' ).addClass( 'hide' );
	}
	if ( GUI.activePlayer !== 'MPD' ) {
		var source = GUI.activePlayer.toLowerCase();
		$( '#iplayer' ).addClass( 'fa-'+ source ).removeClass( 'hide' );
	}
	setButton();
	displayCommon();
	if ( !GUI.local ) $( 'html, body' ).scrollTop( 0 );
}
function displayIndexBar() {
	setTimeout( function() {
		var wH = window.innerHeight;
		var indexoffset = $( '#menu-top' ).is( ':visible' ) ? 160 : 80;
		var indexline = wH < 500 ? 13 : 27;
		$( '.half' ).toggleClass( 'hide', wH < 500 );
		$index = ( $( '#panel-library' ).hasClass( 'active' ) && GUI.dblist ) ? $( '#db-index' ) : $( '#pl-index' );
		$index.css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
	}, 0 );
}
function toggleLibraryHome( name ) {
	$( '#home-'+ name ).parent().toggleClass( 'hide', GUI.display[ name ] === '' );
}
function displayLibrary() {
	// no 'id'
	toggleLibraryHome( 'nas' );
	toggleLibraryHome( 'sd' );
	toggleLibraryHome( 'usb' );
	toggleLibraryHome( 'webradio' );
	toggleLibraryHome( 'albums' );
	toggleLibraryHome( 'artists' );
	toggleLibraryHome( 'composer' );
	toggleLibraryHome( 'genre' );
	toggleLibraryHome( 'dirble' );
	toggleLibraryHome( 'jamendo' );
	
	displayCommon();
	setTimeout( function() {
		$( 'html, body' ).scrollTop( 0 );
	}, 0 );
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
function renderLibrary() {
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
			content += divOpen +'<div class="home-block home-bookmark'+ toggleMPD +'" data-name="'+ bookmark.name +'" data-path="'+ bookmark.path +'"><i class="fa fa-bookmark"></i><h4><span>' + bookmark.name +'&ensp;<gr>'+ numFormat( bookmark.count ) +' ♫</gr></span></h4></div></div>';
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
function getDB( options ) {
	// DEFAULTS
	var cmd = options.cmd || 'browse',
		path = options.path || '',
		browsemode = options.browsemode || 'file',
		uplevel = options.uplevel || '',
		plugin = options.plugin || '',
		querytype = options.querytype || '',
		args = options.args || '',
		command;
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
		var keyword = $( '#db-search-keyword' ).val();
		var command = {
			  file     : { mpc: "ls -f '%title%^^%time%^^%artist%^^%album%^^%file%' '"+ path +"'", list: 'file' }
			, album    : { mpc: "find -f '%title%^^%time%^^%artist%^^%album%^^%file%' album '"+ path +"'", search: 1 } 
			, artist   : { mpc: "list album artist '"+ path +"' | awk NF", list: 'album' }
			, composer : { mpc: "search -f '%title%^^%time%^^%artist%^^%album%^^%file%' composer '"+ path +"'", search: 1 }
			, genre    : { mpc: "list artist genre '"+ path +"' | awk NF", list: 'artist' }
			, webradio : { getwebradios: 1 }
			, type     : { mpc: 'list '+ GUI.browsemode +' | awk NF', list: GUI.browsemode }
			, search   : { mpc: "search -f '%title%^^%time%^^%artist%^^%album%^^%file%' any '"+ keyword +"'", search: 1 }
		}
		if ( cmd === 'search' ) {
			if ( path.match(/Dirble/)) {
				$.post( '/db/?cmd=dirble', { querytype: 'search', args: keyword }, function( data ) {
					populateDB( data, path, 'Dirble', 'search', uplevel );
				}, 'json' );
				return
			} else {
				var mode = 'search';
			}
		} else if ( cmd === 'browse' ) {
			if ( path === 'Webradio' ) {
				var mode = 'webradio';
			} else {
				if ( $.inArray( path, [ 'Albums', 'Artists', 'Composer', 'Genres' ] ) !== -1 ) {
					var mode = 'type';
				} else {
					var mode = GUI.browsemode;
				}
			}
		}
		$.post( 'enhance.php', command[ mode ], function( data ) {
			populateDB( data, path, '', '', uplevel );
		}, 'json' );
	}
}
function parseDBdata( inputArr, i, respType, inpath, querytype ) {
	var inputArr = inputArr || '',
		i = i || 0,
		respType = respType || '',
		inpath = inpath || '',
		querytype = querytype || '',
		content = '<li id="db-'+ ( i + 1 ) +'" data-path="';
	switch ( respType ) {
		case 'db':
			if ( GUI.browsemode === 'file' ) {
				console.log(inputArr)
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
							var liname = inputArr.Title
							content += inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
							content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ second2HMS( inputArr.Time ) +'</span></span>';
							content += '<span class="bl">'+ bl;
						} else {
							var liname = inputArr.file.replace( inpath +'/', '' );
							content += inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
							content += '<span class="sn">'+ liname +'&ensp;<span class="time">' + second2HMS( inputArr.Time ) +'</span></span>';
							content += '<span class="bl"> path: '+ inpath;
						}
					} else { // Webradio
						var liname = inputArr.playlist.replace( inpath +'/', '' ).replace( /.pls$/, '' );
						content += inputArr.playlist +'" class="db-webradio" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-webradio"></i><i class="fa fa-webradio db-icon db-radio"></i>';
						content += '<span class="sn">'+ liname +'</span>';
						content += '<span class="bl">'+ inputArr.url;
					}
					content += '</span></li>';
				} else if ( inputArr.playlist && inputArr.fileext === 'cue' ) {
					var liname = inputArr.playlist.replace( inpath +'/', '' );
					content += inputArr.playlist +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-file-text db-icon"></i>';
					content += '<span class="sn">'+ liname +' <span>[CUE file]</span></span>';
					content += '<span class="bl"> path: '+ inpath +'</span></li>';
				} else {
					var liname = inputArr.directory.replace( inpath +'/', '' );
					content += inputArr.directory +'" liname="'+ liname +'"><i class="fa fa-bars db-action"';
					content += ' data-target="#context-menu-folder"></i><span><i class="fa fa-folder"></i>'
					content += '<span class="dbpath">'+ liname +'</span></li>';
				}
			} else if ( GUI.browsemode === 'album' || GUI.browsemode === 'albumfilter' ) {
				if ( inputArr.file ) {
					var liname = inputArr.Title;
					content += inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
					content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ second2HMS( inputArr.Time ) +'</span></span>';
					content += '<span class="bl">'+ inputArr.Album +' - '+ inputArr.Artist +'</span></li>';
				} else {
					var liname = inputArr.album;
					content += inputArr.album.replace( /\"/g, '&quot;' ) +'" mode="album" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i>';
					content += '<span><i class="fa fa-album"></i>'+ liname +'</span></li>';
				}
			} else if ( GUI.browsemode === 'artist' ) {
				if ( inputArr.album ) {
					var liname = inputArr.album ? inputArr.album : 'Unknown album';
					content += inputArr.album +'" mode="album" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i>';
					content += '<span><i class="fa fa-album"></i>'+ liname +'</span></li>';
				} else {
					var liname = inputArr.artist;
					content += inputArr.artist +'" mode="artist" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i>';
					content += '<span><i class="fa fa-artist"></i>'+ liname +'</span></li>';
				}
			} else if ( GUI.browsemode === 'composer' ) {
				if ( inputArr.file ) {
					var liname = inputArr.Title;
					content += inputArr.file +'" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i>';
					content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ second2HMS( inputArr.Time ) +'</span></span>';
					content += '<span class="bl">'+ inputArr.Artist +' - '+ inputArr.Album +'</span></li>';
				} else {
					var liname = inputArr.composer;
					content += inputArr.composer +'" mode="composer" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-composer"></i>';
					content += '<span><i class="fa fa-composer"></i>'+ inputArr.composer +'</span></li>';
				}
			} else if ( GUI.browsemode === 'genre' ) {
				if ( inputArr.artist ) {
					var liname = inputArr.artist ? inputArr.artist : 'Unknown artist';
					content += inputArr.artist +'" mode="artist" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i>';
					content += '<span><i class="fa fa-artist"></i>'+ liname +'</span></li>';
				} else {
					var liname = inputArr.genre ;
					content += inputArr.genre +'" mode="genre" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-genre"></i>';
					content += '<span><i class="fa fa-genre"></i>'+ liname;+'</span></li>';
				}
			}
			break;
		case 'Spotify':
			if ( querytype === '' ) {
				var liname = inputArr.name ? inputArr.name : 'Favorites';
				content += inputArr.index +'" mode="spotify" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-spotify-pl"></i>'
				content += '<span><i class="fa fa-genre"></i>'+ liname +' ( '+ inputArr.tracks +' )</span></li>';
			} else if ( querytype === 'tracks' ) {
				var liname = inputArr.Title;
				content += inputArr.index +'" data-plid="'+ inpath +'" data-type="spotify-track" mode="spotify" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-spotify"></i><i class="fa fa-spotify db-icon"></i>';
				content += '<span class="sn">'+ liname +'&ensp;<span class="time">'+ second2HMS( inputArr.duration / 1000 ) +'</span></span>';
				content += ' <span class="bl">'+ inputArr.artist +' - '+ inputArr.album +'</span></li>';
			}
			break;
		case 'Dirble':
			if ( querytype === '' || querytype === 'childs' ) {
				var liname = inputArr.title;
				var childClass = ( querytype === 'childs' ) ? ' db-dirble-child' : '';
				content += inputArr.id +'" class="db-dirble'+ childClass +'" mode="dirble" liname="'+ liname +'">'
				content += '<span><i class="fa fa-genre"></i>'+ liname +'</span></li>';
			} else if ( querytype === 'search' || querytype === 'stations' || querytype === 'childs-stations' ) {
				if ( !inputArr.streams.length ) {
					break; // Filter stations with no streams
				}
				var liname = inputArr.name;
				content += inputArr.name +' | '+ inputArr.streams[ 0 ].stream +'" mode="dirble" liname="'+ liname +'"><i class="fa fa-bars db-action" data-target="#context-menu-dirble"></i><i class="fa fa-webradio db-icon"></i>';
				content += '<span class="sn">'+ liname +'&ensp;<span>( '+ inputArr.country +' )</span></span>';
				content += '<span class="bl">'+ ( inputArr.website ? inputArr.website : '-no website-' ) +'</span></li>';
			}
			break;
		case 'Jamendo':
			var liname = inputArr.dispname;
			content += inputArr.stream +'" mode="jamendo" liname="'+ liname +'"><img class="jamendo-cover" src="'+ inputArr.image +'" alt=""><i class="fa fa-bars db-action" data-target="#context-menu-file"></i>';
			content += '<span>'+ liname +'</span></div></li>';
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
			for (i = 0; (row = data[i]); i += 1) content += parseDBdata( row, i, 'Spotify', arg, querytype );
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
				for (i = 0; (row = data[i]); i += 1) content += parseDBdata( row, i, 'Dirble', '', querytype );
			}
		} else if ( plugin === 'Jamendo' ) {
			data.sort( function( a, b ) {
				if ( path === 'Jamendo' && querytype === '' ) {
					return stripLeading( a[ 'dispname' ] ).localeCompare( stripLeading( b[ 'dispname' ] ), undefined, { numeric: true } )
				} else {
					return 0;
				}
			} );
			for (i = 0; (row = data[i]); i += 1) content += parseDBdata( row, i, 'Jamendo', '', querytype );
		}
	} else {
// normal MPD browsing
		// show index bar
		if ( !data.length ) {
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
			if ( $( '#db-search-keyword' ).val() ) {
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
				for ( i = 0; i < arraydirL; i++ ) content += parseDBdata( arraydir[ i ], i, 'db', path );
				arrayfile.sort( function( a, b ) {
					if ( !keyword ) {
						return stripLeading( a[ 'file' ] ).localeCompare( stripLeading( b[ 'file' ] ), undefined, { numeric: true } );
					} else {
						return stripLeading( a[ 'Title' ] ).localeCompare( stripLeading( b[ 'Title' ] ), undefined, { numeric: true } );
					}
				} );
				var arrayfileL = arrayfile.length;
				for ( i = 0; i < arrayfileL; i++ ) content += parseDBdata( arrayfile[ i ], i, 'db', path );
			} else {
				data.sort( function( a, b ) {
					if ( a[ prop ] === undefined ) prop = mode[ GUI.browsemode ];
					return stripLeading( a[ prop ] ).localeCompare( stripLeading( b[ prop ] ), undefined, { numeric: true } );
				} );
				var dataL = data.length;
				for ( i = 0; i < dataL; i++ ) content += parseDBdata( data[ i ], i, 'db', path );
			}
			$( '#db-webradio-new' ).toggleClass( 'hide', path !== 'Webradio' );
		}
	}
	$( '#db-entries' ).html( content +'<p></p>' ).promise().done( function() {
		// fill bottom of list to mave last li movable to top
		$( '#db-entries p' ).css( 'min-height', window.innerHeight - ( GUI.display.bars ? 140 : 100 ) +'px' );
		displayIndexBar();
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
	if ( $( '#db-entries li:eq( 0 ) i.db-icon' ).hasClass( 'fa-music' ) ) {
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
	var $licurrent = $( '#pl-entries li' ).eq( GUI.status.song );
	if ( !$( '#pl-entries li' ).length ) {
		$( '#pl-entries li' ).eq( 0 ).addClass( 'active' );
		return;
	}
	
	$( '#pl-entries li' ).removeClass( 'active' );
	$licurrent.addClass( 'active' );
	if ( GUI.local ) return; // 'Sortable'
	
	setTimeout( function() {
		var scrollpos = $( '#pl-entries li.active' ).offset().top - $( '#pl-entries' ).offset().top - ( 49 * 3 );
		$( 'html, body' ).scrollTop( scrollpos );
		$( '#loader' ).addClass( 'hide' );
	}, 100 );
	$.post( 'enhance.php', { mpc: "status | awk 'NR==2' | awk '{print $1\"^\"$2\"^\"$3}' | tr -d '[]#'" }, function( data ) {
		clearInterval( GUI.intElapsed );
		if ( !data ) {
			$( '.elapsed' ).empty();
			return;
		}
		var data = data.split( '^' );
		var state = data[ 0 ];
		var songid = data[ 1 ].split( '/' )[ 0 ];
		// for 'visibilityevent - visible' and song has changed
		var $liactive = $( '#pl-entries li' ).eq( songid - 1 );
		$( '#pl-entries li' ).removeClass( 'active' );
		$liactive.addClass( 'active' );
		
		var elapsed = data[ 2 ].split( '/' )[ 0 ];
		var elapsed = elapsed ? HMS2Second( elapsed ) : 0;
		var $elapsed = $liactive.find( ' .elapsed' );
		if ( !$elapsed.html() ) $( '.elapsed' ).empty();
		if ( state === 'paused' ) {
			var elapsedtxt = second2HMS( elapsed ) + ( GUI.status.ext === 'radio' ? '' : ' / ' );
			$elapsed.html( '<i class="fa fa-pause"></i> '+ elapsedtxt );
		} else if ( state === 'playing' ) {
			GUI.intElapsed = setInterval( function() {
				elapsed++
				var elapsedtxt = second2HMS( elapsed ) + ( GUI.status.ext === 'radio' ? '' : ' / ' );
				$elapsed.html( '<i class="fa fa-play"></i> '+ elapsedtxt );
			}, 1000 );
		}
	} );
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
	
	var content, pl, iconhtml, topline, bottomline, classradio, hidetotal;
	content = iconhtml = topline =bottomline = classradio = hidetotal = '';
	var id, totaltime, pltime, seconds, countsong, countradio;
	id = totaltime = pltime = seconds = countsong = countradio = 0;
	var ilength = GUI.playlist.length;
	GUI.status.playlistlength = ilength;
	var classradio
	for ( i = 0; i < ilength; i++ ) {
		var pl = GUI.playlist[ i ];
		if ( pl.file.slice( 0, 4 ) === 'http' ) {
			iconhtml = '<i class="fa fa-webradio pl-icon"></i>';
			classradio = 1;
			countradio++
			topline = pl.title +'&ensp;<span class="elapsed"></span>';
			bottomline = pl.file;
		} else {
			iconhtml = '<i class="fa fa-music pl-icon"></i>';
			classradio = 0;
			sec = HMS2Second( pl.time );
			topline = pl.title +'&ensp;<span class="elapsed"></span><span class="time" time="'+ sec +'">'+ pl.time +'</span>';
			bottomline = pl.track
			pltime += sec;
		}
		content += '<li id="pl-'+ i +'"'+ ( classradio ? ' class="radio"' : '' ) +'>'
			+ iconhtml
			+'<i class="fa fa-minus-circle pl-action"></i>'
			+'<span class="sn">'+ topline +'</span>'
			+'<span class="bl">'+ bottomline +'</span>'
			+'</li>';
	}
	countsong = ilength - countradio;
	var counthtml = '<bl class="title">&emsp;P L A Y L I S T<gr>&emsp;•</gr></bl>';
	var countradiohtml = '<wh id="countradio" count="'+ countradio +'">'+ countradio +'</wh>&ensp;<i class="fa fa-webradio"></i>';
	if ( countsong ) {
		var pltimehtml = ' id="pltime" time="'+ pltime +'">'+ second2HMS( pltime ) +'&emsp;';
		var totalhtml = countradio ? '<gr'+ pltimehtml +'</gr>'+ countradiohtml : '<wh'+ pltimehtml +'&emsp;</wh>';
		counthtml += '<wh id="countsong" count="'+ countsong +'">'+ numFormat( countsong ) +'</wh>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
	} else {
		counthtml += countradiohtml;
	}
	$( '.playlist' ).removeClass( 'hide' );
	$( '#playlist-warning' ).addClass( 'hide' );
	$( '#pl-count' ).html( counthtml );
	
	$( '#pl-entries' ).html( content +'<p></p>' ).promise().done( function() {
		setPlaylistScroll();
	} );
}
function setButtonToggle() {
	if ( GUI.local ) return;
	
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
	if ( GUI.local ) return;
	
	$( '#playback-controls' ).toggleClass( 'hide', GUI.status.playlistlength === 0 );
	var state = GUI.status.state;
	
	$( '#stop' ).toggleClass( 'btn-primary', state === 'stop' );
	$( '#play' ).toggleClass( 'btn-primary', state === 'play' );
	$( '#pause' ).toggleClass( 'btn-primary', state === 'pause' );
	setButtonToggle();
	if ( GUI.status.updating_db ) {
		$( '#open-library i, #db-home i, #iupdate' ).addClass( 'blink' );
		$( '#iupdate' ).toggleClass( 'hide', GUI.display.bars !== '' );
	} else {
		$( '#open-library i, #db-home i, #iupdate' ).removeClass( 'blink' );
		$( '#iupdate' ).addClass( 'hide' );
	}
	if ( GUI.display.update ) {
		if ( GUI.display.bars ) {
			$( '#badge' ).text( GUI.display.update ).show();
			$( '#iaddons' ).addClass( 'hide' );
		} else {
			$( '#iaddons' ).removeClass( 'hide' );
		}
	} else {
		$( '#badge' ).empty().hide();
	}
}
function scrollLongText() {
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
function setPlaybackOneload() {
	clearTimeout( GUI.timeout );
	$( '#starter' ).remove();
	$( '.rs-animation .rs-transition' ).css( 'transition-property', '' ); // restore animation after load
	$.post( 'enhance.php', { library: 1 } );
}
function setPlaybackBlank() {
	$( '#playback-controls' ).addClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#song' ).html( '<i class="fa fa-plus-circle"></i>' );
	$( '#playlist-position span' ).text( 'Add something from Library' );
	$( '#artist, #album, #format-bitrate, #elapsed, #total' ).empty();
	$( '#cover-art' )
		.attr( 'src', 'assets/img/cover-default-runeaudio.png' )
		.css( 'border-radius', 0 )
		.one( 'load', setPlaybackOneload );
	$( '#coverartoverlay' ).addClass( 'hide' );
}
function numFormat( num ) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function HMS2Second( HMS ) {
	return HMS.split( ':' ).reduce( ( acc, time ) => ( 60 * acc ) + +time );
}
function second2HMS( second ) {
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
function renderPlayback() {
	var status = GUI.status;
	// song and album before update for song/album change detection
	var previoussong = $( '#song' ).text();
	var previousalbum = $( '#album' ).text();
	// volume
	$volumeRS.setValue( status.volume );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
	if ( GUI.display.volume && GUI.display.volumempd ) {
		if ( status.volumemute != 0 ) {
			muteColor( status.volumemute );
		} else {
			unmuteColor();
		}
	}
	
	clearInterval( GUI.intKnob );
	clearInterval( GUI.intElapsed );
	$( '#time' ).roundSlider( 'setValue', 0 );
	
	setButton();
	// empty queue
	if ( !status.playlistlength ) {
		setPlaybackBlank();
		return;
	}
	
	$( '#playback-controls' ).removeClass( 'hide' );
	$( '#artist' ).html( status.Artist );
	$( '#song' ).html( status.Title );
	$( '#album' ).html( status.Album ).promise().done( function() {
		// scroll info text
		scrollLongText();
	} );
	
	$( '#playlist-position span' ).html( ( Number( status.song ) + 1 ) +'/'+ status.playlistlength );
	
	var dot0 = '<a id="dot0" style="color:#ffffff"> &#8226; </a>';
	var dot = dot0.replace( ' id="dot0"', '' );
	var ext = ( status.ext !== 'radio' ) ? dot + status.ext : '';
	$( '#format-bitrate' ).html( dot0 + status.sampling + ext );
	if ( status.ext !== 'radio' ) {
		if ( status.Album !== previousalbum ) {
			$( '#coverartoverlay' ).addClass( 'hide' );
			var coverart = status.coverart ? status.coverart : 'assets/img/cover-default-runeaudio.png';
			$( '#cover-art' )
				.attr( 'src', coverart )
				.css( 'border-radius', 0 )
				.one( 'load', setPlaybackOneload );
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
			.one( 'load', setPlaybackOneload );
		$( '#coverartoverlay' ).removeClass( 'hide' );
		$( '#elapsed' ).html( status.state === 'play' ? blinkdot : '' );
		$( '#total' ).empty();
		// show / hide elapsed at total
		if ( !status.radioelapsed ) {
			$( '#total' ).empty();
		} else {
			var elapsed = status.elapsed;
			GUI.intElapsed = setInterval( function() {
				elapsed++
				mmss = second2HMS( elapsed );
				$( '#total' ).text( mmss ).css( 'color', '#587ca0' );
			}, 1000 );
		}
		return;
	}
	// time
	time = status.Time;
	$( '#total' ).text( second2HMS( time ) );
	// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( $( '#time-knob' ).hasClass( 'hide' ) ) return;
	if ( status.state === 'stop' ) {
		$( '#song' ).css( 'color', '' );
		$( '#elapsed' ).text( $( '#total' ).text() ).css( 'color', '#587ca0' );
		$( '#total' ).empty();
		return;
	} else {
		$( '#elapsed, #total' ).css( 'color', '' );
	}
	
	var elapsed = status.elapsed;
	var position = Math.round( elapsed / time * 1000 );
	$( '#time' ).roundSlider( 'setValue', position );
	$( '#elapsed' ).text( second2HMS( elapsed ) );
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
		$( '#song' ).css( 'color', '#587ca0' );
		$( '#elapsed' ).css( 'color', '#0095d8' );
		$( '#total' ).css( 'color', '#e0e7ee' );
		return;
	} else {
		$( '#song' ).css( 'color', '' );
		$( '#elapsed' ).css( 'color', '' );
		$( '#total' ).css( 'color', '' );
	}
//		var localbrowser = ( location.hostname === 'localhost' || location.hostname === '127.0.0.1' ) ? 10 : 1;
//		var step = 1 * localbrowser; // fix: reduce cpu cycle on local browser
//	var step = 1;
	
	GUI.intKnob = setInterval( function() {
		position++;
		if ( position === 1000 ) {
			clearInterval( GUI.intKnob );
			clearInterval( GUI.intElapsed );
			$( '#elapsed' ).empty();
		}
		$( '#time' ).roundSlider( 'setValue', position );
	}, time );
	
	GUI.intElapsed = setInterval( function() {
		elapsed++
		$( '#elapsed' ).text( second2HMS( elapsed ) );
	}, 1000 );
	
	// playlist current song ( and lyrics if installed )
	if ( status.Title !== previoussong || status.Album !== previousalbum ) {
		if ( $( '#lyricscontainer' ).length && $( '#lyricscontainer' ).is( ':visible' ) )  getlyrics();
		if ( $( '#panel-playlist' ).hasClass( 'active' ) && !GUI.pleditor ) setPlaylistScroll();
	}
}
function getPlaybackStatus() {
	$.post( 'enhancestatus.php', function( status ) {
		// 'gpio off' > audio output switched > restarts mpd which makes status briefly unavailable
		if( typeof status !== 'object' ) return;
		
		GUI.activePlayer = status.activePlayer;
		if ( GUI.activePlayer === 'Airplay' ) {
			displayAirPlay();
			return;
		}
		GUI.status = status;
		if ( $( '#panel-playback' ).hasClass( 'active' ) ) {
			renderPlayback();
			// imodedelay fix imode flashing on usb dac switching
			if ( !GUI.imodedelay ) displayPlayback();
		} else if ( $( '#panel-playlist' ).hasClass( 'active' ) && !GUI.pleditor ) {
			setButton();
			setPlaylistScroll();
		}
	}, 'json' );
}

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// fix: midori renders box-shadow incorrectly
if ( /Midori/.test( navigator.userAgent ) ) $( 'head link[rel="stylesheet"]').last().after( '<link rel="stylesheet" href="/css/midori.css">' )

$( '#menu-settings' ).click( function() {
	$( '#settings' ).toggleClass( 'hide' ).css( 'top', $( '#menu-top' ).is( ':hidden' ) ? 0 : '40px' );
} );

function menuBottom( elshow, elhide1, elhide2 ) {	
	$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
	if ( $( '#panel-sx' ).hasClass( 'active' ) ) {
		librarytop = $( window ).scrollTop();
	} else if ( $( '#panel-dx' ).hasClass( 'active' ) ) {
		queuetop = $( window ).scrollTop();
	}
	if ( /\/.*\//.test( location.pathname ) === false ) {
		$( '#'+ elshow ).removeClass( 'hide' );
		$( '#'+ elshow +', #open-'+ elshow ).addClass( 'active' );
		$( '#'+ elhide1 +', #'+ elhide2 ).addClass( 'hide' );
		$( '#'+ elhide1 +', #'+ elhide2 +', #open-'+ elhide1 +', #open-'+ elhide2 ).removeClass( 'active' );
	} else {
		window.location.href = '/';
	}
}

$( '#currentsong, #playlist-warning' ).on( 'click', 'i', function() {
	$( '#open-panel-sx' ).click();
} );
$( '#open-panel-sx' ).click( function() {
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	if ( $( this ).hasClass( 'active' ) ) {
		renderLibraryHome();
		return;
	}
	menuBottom( 'panel-sx', 'playback', 'panel-dx' );
	displayLibrary();
} );
$( '#open-playback' ).click( function() {
	menuBottom( 'playback', 'panel-sx', 'panel-dx' );
	displayPlayback();
} );
pleditor = 0;
$( '#open-panel-dx' ).click( function() {
	if ( GUI.activePlayer === 'Airplay' || GUI.activePlayer === 'Spotify' ) {
		$( '#overlay-playsource' ).addClass( 'open' );
		return;
	}
	
	if ( $( this ).hasClass( 'active' ) ) pleditor = 0;
	
	menuBottom( 'panel-dx', 'playback', 'panel-sx' );
	displayCommon();
	if ( pleditor ) return;
	
	getPlaylistCmd();
	window.scrollTo( 0, queuetop );
	$( '#pl-editor, #pl-currentpath' ).addClass( 'hide' );
	$( '#pl-count, #pl-manage, #pl-search, #playlist-entries' ).removeClass( 'hide' );
	$( '#playlist-warning' ).toggleClass( 'hide', GUI.json.playlistlength != 0 );
	if ( !$( '#playlist-entries li' ).length ) getPlaylistCmd();
} );
function panelLR( lr ) {
	var pcurrent = $( '.tab-pane:visible' ).prop( 'id' );
	if ( pcurrent === 'panel-sx' ) {
		var $pL = $( '#open-playback' );
		var $pR = $( '#open-panel-dx' );
	} else if ( pcurrent === 'playback' ) {
		var $pL = $( '#open-panel-dx' );
		var $pR = $( '#open-panel-sx' );
	} else {
		var $pL = $( '#open-panel-sx' );
		var $pR = $( '#open-playback' );
	}
	
	$paneclick = ( lr === 'left' ) ? $pL.click() : $pR.click();
}
swipe = 0;
$( '#playback, #panel-sx, #panel-dx' ).on( 'swipeleft swiperight', function( e ) {
	panelLR( e.type === 'swipeleft' ? 'left' : '' );
	// fix: prevent taphold fire on swipe
	swipe = 1;
	
	setTimeout( function() {
		swipe = 0;
	}, 1000 );
} );

$( '#playback' ).click( function( e ) {
	if ( !$( e.target ).is( '.controls, .timemap, .covermap, .volmap' ) ) {
		$( '.controls, #settings' ).addClass( 'hide' );
		$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
	}
} ).on( 'taphold', setDisplayPlayback );
function setDisplayPlayback() {
	if ( swipe ) return;
	
	info( {
		  title  : 'Playback'
		, message: 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysaveplayback">\
				<label><input name="bars" type="checkbox" '+ display.bars +'>&ensp;Top-Bottom menu</label>\
				<br><label><input name="pause" type="checkbox" '+ display.pause +'>\
					&ensp;<code><i class="fa fa-play"></i></code>&ensp;<code><i class="fa fa-pause"></i></code>&ensp;buttons</label>\
				<br><label><input name="time" type="checkbox" '+ display.time +'>&ensp;Time</label>\
				<br><label><input name="radioelapsed" type="checkbox" '+ display.radioelapsed +'>&ensp;Webradio elapsed</label>\
				<br><label><input name="coverart" type="checkbox" '+ display.coverart +'>&ensp;Coverart</label>\
				<br><label><input name="volume" type="checkbox" '+ display.volume +'>&ensp;Volume</label>\
				<br><label><input name="buttons" type="checkbox" '+ display.buttons +'>&ensp;Buttons</label>\
			</form>'
		, cancel : 1
		, ok     : function () {
			// no: serializeArray() omit unchecked fields
			$( '#displaysaveplayback input' ).each( function() {
				display[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = {
				set: [ 'hmset', 'display', display ],
				display: [ 'hGetAll', 'display' ],
				volumempd: [ 'get', 'volume' ],
				update: [ 'hGet', 'addons', 'update' ]
			};
			$.post( '/enhance.php', { redis: JSON.stringify( command ) } );
		}
	} );
	// disable from autohide
	if ( window.innerWidth < 499 || window.innerHeight <= 515 ) {
		$( 'input[name="bars"]' )
			.prop( 'disabled', true )
			.parent().css( 'color', '#7795b4' )
			.append( ' (auto hide)' );
	}
	// disable from mpd volume
	if ( display.volumempd == 0 ) {
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
}

bookmarkedit = 0;
$( '#panel-sx' ).on( 'taphold', function( e ) {
	if ( swipe || bookmarkedit ) return;
	
	if ( !bookmarkedit ) setDisplayLibrary( e );
} ).on( 'taphold', '.home-block', function( e ) {
	if ( swipe ) return;
	
	if ( !$( e.target ).parent().hasClass( 'home-bookmark' ) && !$( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	bookmarkedit = 1;
	$( '.home-bookmark' ).append( '<div class="home-block-remove"><span class="block-remove">&times;</span></div>' );
} ).click( function( e ) {
	if ( $( e.target ).parent().hasClass( 'home-bookmark' ) || $( e.target ).hasClass( 'home-bookmark' ) ) return;
	
	$( '.home-bookmark div.home-block-remove' ).remove();
	setTimeout( function() {
		bookmarkedit = 0;
	}, 1000 );
} );

$( '#home-blocks' ).on( 'click', '.home-block', function( e ) {
	var $this = $( this );
	if ( $( e.target ).is( 'span.block-remove' ) ) {
		var id = this.id.replace( 'home-bookmark-', '' );
		var name = $this.find( 'h4' ).text();
		$.post( '/db/?cmd=bookmark', { id: id, name: name }, function() {
			$this.parent().remove();
			renderLibraryHome();
		} );
	} else if ( $this.data( 'target' ) === '#modal-webradio-add' ) {
		webRadioNew();
	} else {
		if ( bookmarkedit ) return;
		++GUI.currentDBpos[ 10 ];
		getDB( {
			browsemode: $this.data( 'browsemode' ),
			path: $this.data( 'path' ),
			uplevel: 0,
			plugin: $this.data( 'plugin' )
		});
	}
});

function setDisplayLibrary( e ) {
	info( {
		  title  : 'Libary Home'
		, message: 'Select items to show:'
		, checkboxhtml : 
			'<form id="displaysavelibrary">\
				<label><input name="bars" type="checkbox" '+ display.bars +'>&ensp;Top-Bottom menu</label>\
				<br><label><input name="nas" type="checkbox" '+ display.nas +'>&ensp;Network mounts</label>'
				+ ( GUI.libraryhome.localStorages ? '<br><label><input name="sd" type="checkbox" '+ display.sd +'>&ensp;Local SD</label>' : '' )
				+'<br><label><input name="usb" type="checkbox" '+ display.usb +'>&ensp;USB drives</label>\
				<br><label><input name="webradio" type="checkbox" '+ display.webradio +'>&ensp;Webradios</label>\
				<br><label><input name="albums" type="checkbox" '+ display.albums +'>&ensp;Albums</label>\
				<br><label><input name="artists" type="checkbox" '+ display.artists +'>&ensp;Artists</label>\
				<br><label><input name="composer" type="checkbox" '+ display.composer +'>&ensp;Composers</label>\
				<br><label><input name="genre" type="checkbox" '+ display.genre +'>&ensp;Genres</label>\
				<br><label><input name="dirble" type="checkbox" '+ display.dirble +'>&ensp;Dirble</label>\
				<br><label><input name="jamendo" type="checkbox" '+ display.jamendo +'>&ensp;Jamendo</label>\
			</form>'
		, cancel : 1
		, ok     : function () {
			$( '#displaysavelibrary input' ).each( function() {
				display[ this.name ] = this.checked ? 'checked' : '';
			} );
			var command = {
				set: [ 'hmset', 'display', display ],
				display: [ 'hGetAll', 'display' ]
			};
			$.post( '/enhance.php', { redis: JSON.stringify( command ) } );
		}
	} );
}

// disabled local browser > disable screensaver events
if ( !$( '#playback-ss' ).length ) $('#section-index').off( 'mousemove click keypress' );

// playback buttons click go back to home page
$( '.playback-controls' ).click( function() {
	if ( !$( '#open-playback' ).hasClass( 'active' ) ) $( '#open-playback' ).click();
} );
$( '#menu-bottom' ).click( function() {
	if ( window.innerWidth < 499 || window.innerHeight < 515 ) {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#database' ).css( 'padding-top', '40px' );
	}
} );

// for set display broadcast
var pushstreamdisplay = new PushStream( {
	host: window.location.hostname,
	port: window.location.port,
	modes: GUI.mode
} );
pushstreamdisplay.addChannel( 'display' );
pushstreamdisplay.onmessage = function( data ) { // on receive broadcast
	display = data[ 0 ].display;
	if ( $( '#playback' ).hasClass( 'active' ) ) {
		displayPlayback();
		setButton();
	} else if ( $( '#panel-sx' ).hasClass( 'active' ) ) {
		displayLibrary();
	} else {
		displayCommon();
	}
}
pushstreamdisplay.connect();

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
		var onoff = GUI.json.random === '0' ? 1 : 0;
		sendCmd( 'random '+ onoff );
	} else if ( cmd === 'repeat' ) {
		if ( GUI.json.repeat === '0' ) {
			sendCmd( 'repeat 1' );
		} else {
			if ( GUI.json.single === '0' ) {
				sendCmd( 'single 1' );
			} else {
				sendCmd( 'repeat 0' );
				sendCmd( 'single 0' );
			}
		}
	} else if ( cmd ) {
		$( '#'+ cmd ).click();
	}
} );
$( '#menu-top, #menu-bottom, #settings' ).click( function( e ) {
	if ( e.target.id !== 'menu-settings' ) $( '#settings' ).addClass( 'hide' );
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
} );

$( '#play-group, #share-group, #vol-group' ).click( function() {
	if ( window.innerWidth < 499 ) buttonactive = 1;
} );

function bioShow() {
	$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
	$( '#bio' ).removeClass( 'hide' );
}
$( '#currentartist, #songinfo-open' ).click( function() {
	if ( GUI.json.radio ) return;
	$( '#loader' ).removeClass( 'hide' );
	
	if ( $( '#bio legend' ).text() != GUI.json.currentartist ) {
		$.get( '/enhancebio.php',
			{ artist: GUI.json.currentartist },
			function( data ) {
				$( '#biocontent' ).html( data );
				bioShow();
			}
		);
	} else {
		bioShow();
	}
} );
$( '#biocontent' ).delegate( '.biosimilar', 'click', function() {
	$( '#loader' ).removeClass( 'hide' );
	$.get( '/enhancebio.php',
		{ artist: $( this ).find( 'p' ).text() },
		function( data ) {
			$( '#biocontent' ).html( data );
			bioShow();
			$( '#bio' ).scrollTop( 0 );
		}
	);
} );
$( '#closebio' ).click( function() {
	$( '#bio' ).addClass( 'hide' );
	if ( !barhide ) $( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
} );
// poweroff
$( '#turnoff' ).click( function() {
	info( {
		  icon        : 'power-off'
		, title       : 'Power'
		, message     : 'Select mode:'
		, oklabel     : 'Power off'
		, okcolor     : '#bb2828'
		, ok          : function() {
			$.post( '/settings/', { 'syscmd' : 'poweroff' } );
			toggleLoader();
		}
		, buttonlabel : 'Reboot'
		, buttoncolor : '#9a9229'
		, button      : function() {
			$.post( '/settings/', { 'syscmd' : 'reboot' } );
			toggleLoader();
		}
	} );
} );

// library directory path link
$( '#db-home' ).click( function() {
	renderLibraryHome();
} );
$( '#db-currentpath' ).on( 'click', 'a', function() {
	if ( $( '#db-currentpath span a' ).length === 1 ) return;
	var path = $( this ).attr( 'data-path' );
	var path2mode = {
		  Artists  : 'artist'
		, Albums   : 'album'
		, Genres   : 'genre'
		, Composer : 'composer'
		, Dirble   : 'Dirble'
	}
	getDB( { browsemode: path2mode[ path ], path: path } );
	window.scrollTo( 0, 0 );
} );
$( '#searchbtn' ).click( function() {
	var keyword = $( '#db-search-keyword' ).val();
	if ( !keyword ) return;
	getDB( {
		  cmd       : 'search'
		, arg       : keyword
	} );
} );
$( '#db-search-keyword' ).on( 'keypress', function( e ) {
	if ( e.which == 13 ) $( '#searchbtn' ).click();
} );
// index link
$( '#db-index li' ).click( function() {
	var topoffset = display.bars ? 80 : 40;
	var $this = $( this );
	var indextext = $this.text();
	if ( indextext === '#' ) {
		window.scrollTo( 0, 0 );
		return
	}
	if ( GUI.currentpath.slice( 0, 3 ) === 'USB' ) {
		var datapathindex = GUI.currentpath +'/'+ indextext;
	} else {
		var datapathindex = '^'+ indextext;
		var dirmode = 1
	}
	var matcharray = $( '#database-entries li' ).filter( function() {
		var $this = $( this );
		var name = dirmode ? $this.find( 'span:eq( 0 )' ).text() : $this.attr( 'data-path' );
		return stripLeading( name ).match( new RegExp( datapathindex, 'i' ) );
	} );
	if ( matcharray.length ) window.scrollTo( 0, matcharray[0].offsetTop - topoffset );
} );
dbtop = 0;
$( '#db-level-up' ).on( 'click', function() {
	// topmost of path
	if ( $( '#db-currentpath span a' ).length === 1 ) {
		renderLibraryHome();
		return
	}
	var path = GUI.currentpath;
	if ( GUI.browsemode === 'file' ) {
		var toppath = GUI.currentpath.split( '/' )[ 0 ];
		if ( toppath === 'USB' ) {
			cutpos = path.lastIndexOf( '/' );
			path = ( cutpos !== -1 ) ? path.slice( 0, cutpos ) : '';
		} else {
			path = toppath;
			GUI.plugin = toppath;
		}
	} else {
		var mode2path = {
			  album       : 'Albums'
			, artist      : 'Artists'
			, composer    : 'Composer'
			, genre       : 'Genres'
			, albumfilter : path
		};
		path = mode2path[ GUI.browsemode ];
	}
	getDB( { 
		browsemode: GUI.browsemode,
		path: path,
		plugin: GUI.plugin,
		uplevel: 1
	} );
	GUI.plugin = '';
});

$( '#db-webradio-new' ).click( function() {
	webRadioNew();
} );

$( '#plsave' ).click( function() {
	playlistSave();
} );
$( '#pl-manage-clear' ).click( function() {
	info( {
		  title      : 'Clear Playlist'
		, message    : 'Clear this playlist?'
		, cancel     : 1
		, ok         : function() {
			sendCmd( 'clear' );
			$( '#playlist-entries' ).empty();
		}
	} );
} );
$( '#playlist-entries' ).on( 'click', 'li', function() {
	sendCmd( 'deleteid '+ this.id.replace( 'pl-', '' ) );
} );

// context menus //////////////////////////////////////////////
$( '#menu-top, #menu-bottom, #db-home, #pl-home, .menu' ).click( function( e ) {
	licurrent = '';
	plcurrent = '';
	$( '.contextmenu' ).addClass( 'hide' );
} );
var dbcurrent = '';
$( '#database-entries' ).on( 'click', '.db-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	dbpath = $thisli.data( 'path' );
	GUI.DBentry.path = dbpath; // used in contextmenu
	if ( !$thisli.find( '.sn' ).length ) {
		GUI.DBentry.name = $thisli.text() ;
	} else {
		GUI.DBentry.name = $thisli.find( '.sn' ).text();
		GUI.DBentry.url = $thisli.find( '.bl' ).text();
	}
	var $target = $( $this.data( 'target' ) );
	$( '#database-entries li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( dbpath === dbcurrent ) {
		dbcurrent = '';
	} else {
		dbcurrent = dbpath;
		$thisli.addClass( 'active' );
		$target.removeClass( 'hide' )
			.css( { top: $this.position().top +'px', right: '90px' } )
			.find( '.menushadow' ).css( 'height', $target.find( 'i' ).length * 40 );
	}
} );
var plcurrent = '';
$( '#pl-editor' ).on( 'click', '.pl-action', function( e ) {
	e.stopPropagation();
	var $this = $( this );
	var $thisli = $this.parent();
	var plname = $thisli.data( 'path' );
	GUI.DBentry.name = plname; // used in contextmenu
	$( '#pl-editor li' ).removeClass( 'active' );
	$( '.contextmenu' ).addClass( 'hide' );
	if ( plname === plcurrent ) {
		plcurrent = '';
	} else {
		plcurrent = plname;
		$thisli.addClass( 'active' );
		$( '#context-menu-playlist' ).removeClass( 'hide' )
			.css( { top: $this.position().top +'px', right: '50px' } )
			.find( '.menushadow' ).css( 'height', $( '#context-menu-playlist' ).find( 'i' ).length * 40 );
	}
} );
$( '.contextmenu a' ).click( function() {
	var cmd = $( this ).data( 'cmd' );
	dbcurrent = '';
	switch( cmd ) {
		case 'bookmarkadd': $.post( '/db/?cmd=bookmark', { path: GUI.DBentry.path } ); break;
		
		case 'wradd': getDB( { cmd: 'add', path: GUI.DBentry.path } ); break;
		case 'wraddplay': getDB( { cmd: 'addplay', path: GUI.DBentry.path } ); break;
		case 'wraddreplaceplay': getDB( { cmd: 'addreplaceplay', path: GUI.DBentry.path }); break;
		case 'wrrename'  : webRadioRename(); break;
		case 'wrdelete': webRadioDelete(); break;
		// in dirble
		case 'wrsave': $.post( '/db/?cmd=addradio', { 'radio[label]': GUI.DBentry.name, 'radio[url]': GUI.DBentry.url } ); break;
		
		case 'pladd'  : $.post( 'enhance.php', { mpd: 'load "' + GUI.DBentry.name +'"' } ); break;
		case 'plreplace': $.post( 'enhance.php', { mpd: 'command_list_begin\nclear\nload "'+ GUI.DBentry.name +'"\ncommand_list_end' } ); break;
		case 'pladdreplaceplay': $.post( 'enhance.php', { mpd: 'command_list_begin\nclear\nload "'+ GUI.DBentry.name + '"\nplay\ncommand_list_end' } ); break;
		case 'plrename': playlistRename(); break;
		case 'pldelete': playlistDelete(); break;
		case 'plashuffle':
			$.post( '/db/?cmd=pl-ashuffle', { 'playlist' : GUI.DBentry.name } );
			$( '#random' ).attr( 'data-cmd', 'pl-ashuffle-stop' ).addClass( 'btn-primary' );
			break;
		default:
			getDB( {
				  cmd       : cmd
				, path      : GUI.DBentry.path
				, browsemode: GUI.browsemode
				, querytype : $( this ).data( 'type' ) ? $( this ).data( 'cmd' ) : '' // soptify only
			} );
			break;
	}
} );

function webRadioNew( name, url ) {
	info( {
		  title      : 'Add Webradio'
		, textlabel  : 'Name'
		, textvalue  : name ? name : ''
		, textlabel2 : 'URL'
		, textvalue2 : url ? url : ''
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			webRadioNewVerify( $( '#infoTextBox' ).val(), $( '#infoTextBox2' ).val() );
		}
	} );
}
function webRadioNewVerify( name, url ) {
	if ( !name || !url ) {
		info( {
			  icon    : 'info-circle'
			, title   : 'Add Webradio'
			, message : 'Name and URL cannot be blank.'
			, ok      : function() {
				webRadioNew( name, url );
			}
		} );
		return;
	}
	var exists = false;
	$( '#database-entries li span.sn' ).each( function( i, el ) {
		if ( $( el ).text() === name ) {
			exists = true;
			return false;
		}
	} );
	if ( exists ) {
		info( {
			  icon    : 'info-circle'
			, title   : 'Add Webradio'
			, message : '<white>'+ name +'</white> already exists.'
			, ok      : function() {
				webRadioNew( name, url );
			}
		} );
	} else {
		$.post( '/db/?cmd=addradio', {
			  'radio[label]' : name
			, 'radio[url]'   : url
		} );
		getDB( { path: 'Webradio' } );
	}
}
function webRadioRename( name ) {
	info( {
		  title      : 'Rename Webradio'
		, message    : 'Rename:'
					+'<br><white>'+ GUI.DBentry.name +'</white>'
					+'<br>'+ GUI.DBentry.url
		, textlabel  : 'To'
		, textvalue  : name ? name : GUI.DBentry.name
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			webRadioRenameVerify( $( '#infoTextBox' ).val(), GUI.DBentry.name, GUI.DBentry.url );
		}
	} );
}
function webRadioRenameVerify( name, oldname, url ) {
	if ( !name ) {
		info( {
			  icon    : 'info-circle'
			, title   : 'Rename Webradio'
			, message : 'Name cannot be blank.'
			, ok      : function() {
				webRadioRename();
			}
		} );
		return;
	}
	var exists = false;
	$( '#database-entries li span.sn' ).each( function( i, el ) {
		if ( $( el ).text() === name ) {
			exists = true;
			return false;
		}
	} );
	if ( exists ) {
		info( {
			  icon    : 'info-circle'
			, title   : 'Rename Webradio'
			, message : '<white>'+ name +'</white> already exists.'
			, ok      : function() {
				webRadioRename( name );
			}
		} );
	} else {
		$.post( '/db/?cmd=editradio', {
			  'radio[newlabel]' : name
			, 'radio[label]'    : oldname
			, 'radio[url]'      : url
		}, function() {
			getDB( { path: 'Webradio' } );
		} );
	}
}
function webRadioDelete() {
	info( {
		  title      : 'Delete Webradio'
		, message    : 'Delete?'
					+'<br><white>'+ GUI.DBentry.name +'</white>'
					+'<br>'+ GUI.DBentry.url
		, cancel     : 1
		, ok         : function() {
			$.post( '/db/?cmd=deleteradio', { 'radio[label]' : GUI.DBentry.name +'.pls' }, function() {
				if ( $( '#database-entries li' ).length ) {
					getDB( { path: 'Webradio' } );
				} else {
					$( '#db-home' ).click();
				}
			} );
		}
	} );
}
function playlistSave( name ) {
	info( {
		  title      : 'Save Playlist'
		, message    : 'Save this playlist as:'
		, textlabel  : 'Name'
		, valuetext  : name ? name : ''
		, cancel     : 1
		, ok         : function() {
			playlistSaveVerify( $( '#infoTextBox' ).val() );
		}
	} );
}
function playlistSaveVerify( name ) {
	if ( !name ) {
		info( {
			  icon    : 'info-circle'
			, title   : 'Save Playlist'
			, message : 'Name cannot be blank.'
			, ok      : function() {
				playlistSave();
			}
		} );
		return;
	} 
	$.post( 'enhance.php', { mpd: 'listplaylists' }, function( data ) {
		var pl = data.split( '\n' ).filter( function( el ) { return el.match( /^playlist/ ) } );
		var exists = false;
		pl.some( function( el ) {
			return  exists = ( name === el.replace( 'playlist: ', '' ) );
		} );
		if ( exists ) {
			info( {
				  icon    : 'info-circle'
				, title   : 'Save Playlist'
				, message : '<white>'+ name +'</white> already exists.'
				, ok      : function() {
					playlistSave( name );
				}
			} );
		} else {
			sendCmd( 'save "'+ name +'"' );
		}
	} );
}
function playlistRename( name ) {
	info( {
		  title      : 'Rename Playlist'
		, message    : 'Rename:'
					+'<br><white>'+ GUI.DBentry.name +'</white>'
		, textlabel  : 'To'
		, textvalue  : name ? name : GUI.DBentry.name
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			playlistRenameVerify( $( '#infoTextBox' ).val(), GUI.DBentry.name );
		}
	} );
}
function playlistRenameVerify( name, oldname ) {
	if ( !name ) {
		info( {
			  icon    : 'info-circle'
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
			  icon    : 'info-circle'
			, title   : 'Rename Playlist'
			, message : '<white>'+ name +'</white> already exists.'
			, ok      : function() {
				playlistRename( name );
			}
		} );
	} else {
		sendCmd( 'rename "'+ oldname +'" "'+ name +'"' );
		getPlaylists();
	}
}
function playlistDelete() {
	info( {
		  title      : 'Delete Playlist'
		, message    : 'Delete?'
					+'<br><white>'+ GUI.DBentry.name +'</white>'
		, cancel     : 1
		, ok         : function() {
			$.post( '/command/?cmd=rm%20%22' + GUI.DBentry.name + '%22', function() {
				if ( $( '#pl-editor li' ).length ) {
					getPlaylists();
				} else {
					$( '#pl-home' ).click();
				}
			} );
		}
	} );
}
// context menus \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// playlist click go back to home page
$( '#playlist-entries' ).click( function( e ) {
	if ( e.target.nodeName == 'SPAN' ) {
		$( '#open-playback a' ).click();
		$( '#open-playback a' )[ 0 ].click();
		$( '#menu-top, #menu-bottom' ).toggleClass( 'hide', ( window.innerWidth < 499 || window.innerHeight < 515 ) );
	}
} );
$( '#pl-manage-list' ).on( 'click', function() {
	pleditor = 1;
	$( '#pl-search' ).addClass( 'hide' );
	$( '#pl-currentpath' ).removeClass( 'hide' );
	getPlaylists();
});
$( '#pl-filter' ).on( 'keyup', function() {
	$.scrollTo( 0 , 500 );
	var search = $(this).val();
	var count = 0;
	$( '#playlist-entries li' ).each( function() {
		var $this = $( this );
		var match = ( $this.text().search( new RegExp( search, 'i' ) ) >= 0 ) ? true : false;
		count = match ? ( count + 1 ) : count;
		$this.toggle( match );
	});
	if ( search ) {
		$( '#pl-manage, #pl-count' ).addClass( 'hide' );
		$( '#pl-filter-results' ).removeClass( 'hide' ).html( 
			'<i class="fa fa-times sx"></i><span class="hidden-xs">'+ count +' <a>of</a> </span>'
		);
	} else {
		$( '#pl-manage, #pl-count' ).removeClass( 'hide' );
		$( '#pl-filter-results' ).addClass( 'hide' ).html( '' );
	}
} );
$( '#pl-home' ).click( function() {
	$( '#open-panel-dx' ).click();
} );
$( '#pl-filter-results' ).on( 'click', function() {
	$( this ).addClass( 'hide' ).html( '' );
	$( '#pl-manage, #pl-count, #playlist-entries li' ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
	$( '#playlist-entries li' ).show();
	customScroll( 'pl', parseInt( GUI.json.song ), 500 );
});

$( window ).on( 'resize', function() {
	if ( $( '#open-playback' ).hasClass( 'active' ) ) {
		displayPlayback();
	} else if ( $( '#open-panel-sx' ).hasClass( 'active' ) ) {
		displayLibrary();
	} else if ( $( '#open-panel-dx' ).hasClass( 'active' ) ) {
		displayCommon();
		window.scrollTo( 0, queuetop );
	}
} );
// clear all intervals when not in current view
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
		setPlaybackData();
	}
} );

// MutationObserver - watch for content changed
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observerOption = { childList: true };
var observerTarget = document.getElementById( 'database-entries' );
// on observed target changed
var observerFnBack = new MutationObserver( function() {
	if ( window.innerHeight / 40 > $( '#database-entries li' ).length ) return;
	window.scrollTo( 0, $( '#database-entries>li' ).eq( 0 ).attr( 'class' ) === 'db-folder' ? dbtop : 0 );
	observerFnBack.disconnect();
});
$( '#database-entries' ).click( function() {
	dbtop = $( window ).scrollTop();
	observerFnBack.observe( observerTarget, observerOption );
} );
$( '#searchbtn' ).click( function() {
	dbtop = $( window ).scrollTop();
	observerFnBack.observe( observerTarget, observerOption );
} );
  
$( '#playsource-mpd' ).on( 'click', function() {
	$.post( 'enhance.php', { bash: '/usr/bin/systemctl restart shairport' } );
	$( '#iplayer' ).removeClass( 'fa-airplay' ).addClass( 'hide' );
	$( '#overlay-playsource' ).removeClass( 'open' );
	$( '#playsource-mpd' ).removeClass( 'inactive' );
	$( '#playsource-airplay' ).addClass( 'inactive' );
} );
$( '#db-search-results' ).on( 'click', function() {
	$( this ).addClass( 'hide' );
	$( '#db-currentpath' ).css( 'width', '' );
	var mode = {
		  Artists  : 'artist'
		, Albums   : 'album'
		, Genres   : 'genre'
		, Composer : 'composer'
	}
	if ( GUI.currentpath ) {
		$( '#db-level-up' ).removeClass( 'hide' );
		getDB( {
			  browsemode: mode[ GUI.currentpath ]
			, path      : GUI.currentpath
		} );
		
		$( '#database-entries' ).removeAttr( 'style' );
		observerFnBack.observe( observerTarget, observerOption );
	} else {
		renderLibraryHome();
	}
} );
$( '#modal-pl-clear button.btn-cmd' ).click( function() {
	setTimeout( function() {
		displayCommon();
	}, 500 );
} );

librarytop = 0;
queuetop = 0;

// new knob
function mpdSeek( seekto ) {
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
		if ( !GUI.json.radio ) {
			var seekto = Math.floor( e.value / 1000 * time );
			mpdSeek( seekto );
		} else {
			$timeRS.setValue( 0 );
		}
	},
	start: function () {
		if ( !GUI.json.radio ) {
			clearInterval( GUI.currentKnob );
			clearInterval( GUI.countdown );
		}
	},
	drag: function ( e ) { // drag with no transition by default
		if ( !GUI.json.radio ) {
			var seekto = Math.round( e.value / 1000 * time );
			$( '#elapsed' ).text( convertHMS( seekto ) );
		}
	},
	stop: function( e ) { // on 'stop drag'
		if ( !GUI.json.radio ) {
			var seekto = Math.round( e.value / 1000 * time );
			mpdSeek( seekto );
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
		$volumetooltip.add( $volumehandle ).addClass( 'hide' ); // hide '0' / 'NaN' on initial load - show after set
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
			unmuteColor();
		}
	},
	start: function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmuteColor(); // value before 'start drag'
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

$( '#volmute, #volM' ).click( function() {
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
			muteColor( volumemute );
		} );
	} else {
		$.post( '/enhance.php', { volume: -1 }, function( data ) {
			if ( data == 0 ) return;
			$volumeRS.setValue( data );
			$volumehandle.rsRotate( - $volumeRS._handle1.angle );
			// restore color immediately on click
			unmuteColor();
		} );
	}
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	onsetvolume = 1;
	setTimeout( function() {
		onsetvolume = 0;
	}, 500 );
	
	if ( ( vol === 0 && ( thisid === 'voldn' ) )
		|| ( vol === 100 && ( thisid === 'volup' ) ) )
			return;

	if ( vol === 0 ) {
		var command = { vol: [ 'set', 'volumemute', 0 ] };
		$.post( '/enhance.php', { redis: JSON.stringify( command ) } );
		unmuteColor();
	}
	vol = ( thisid == 'volup' ) ? vol + 1 : vol - 1;
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

// playback show/hide blocks
var command = {
	  display   : [ 'hGetAll', 'display' ]
	, activeplayer: [ 'get', 'activePlayer' ]
	, actplayerinfo: [ 'get', 'act_player_info' ]
	, volumempd : [ 'get', 'volume' ]
	, update    : [ 'hGet', 'addons', 'update' ]
};
$.post( '/enhance.php', { redis: JSON.stringify( command ) }, function( data ) {
	redis = JSON.parse( data );
	display = redis.display;
	radioelapsed = display.radioelapsed;
	GUI.activePlayer = redis.activeplayer;
	if ( GUI.activePlayer === 'Airplay' ) {
		GUI.json = JSON.parse( redis.actplayerinfo );
		displayAirPlay();
	}
} );

var blinkdot = '<a class="dot">.</a> <a class="dot dot2">.</a> <a class="dot dot3">.</a>';
function displayCommon() {
	barhide = window.innerWidth < 499 || window.innerHeight < 515 ? 1 : 0;
	if ( display.bars && $( '#bio' ).is( ':hidden' ) && barhide == 0 ) {
		$( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
		$( '#database, #playlist' ).css( 'padding', '' );
		$( '.btnlist-top' ).css( 'top', '40px' );
		$( '#playlist-warning' ).css( 'margin-top', '27px' );
	} else {
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '#database, #playlist' ).css( 'padding', '40px 0' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#playlist-warning' ).css( 'margin-top', '67px' );
	}
	$( '#pl-currentpath' ).toggleClass( 'hide', !$( '#playlist-entries' ).hasClass( 'hide' ) );
}
function displayAirPlay() {
	$( '.playback-controls' ).css( 'visibility', 'hidden' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#playlist-position span, #format-bitrate, #total' ).html( '&nbsp;' );
	$( '#currentartist' ).html( GUI.json.currentartist );
	$( '#currentsong' ).html( GUI.json.currentsong );
	$( '#currentalbum' ).html( GUI.json.currentalbum );
	$( '#elapsed, #total' ).html( '&nbsp;' );
	var time = new Date().getTime();
	$( '#cover-art' ).css( {
		  'background-image': 'url("assets/img/airplay-cover.jpg?v='+ time +'")'
		, 'border-radius': 0
	} );
	scrollText();
	$( '#menu-top, #menu-bottom' ).toggleClass( 'hide', !display.bars );
	$( '#playback-row' ).removeClass( 'hide' );
	$( '#time-knob' ).toggleClass( 'hide', !display.time );
	$( '#imode i, #coverartoverlay, #volume-knob, #play-group, #share-group, #vol-group' ).addClass( 'hide' );
	$( '#playsource-mpd' ).addClass( 'inactive' );
	$( '#playsource-airplay' ).removeClass( 'inactive' );
	if ( display.time ) {
		$( '#time-knob, #play-group, #coverart, #share-group' ).css( 'width', '45%' );
		clearInterval( GUI.currentKnob );
		clearInterval( GUI.countdown );
		$( '#time' ).roundSlider( 'setValue', 0 );
		$( '#elapsed' ).html( blinkdot );
		$( '#total' ).text( '' );
		$( '#iplayer' ).addClass( 'fa-airplay' ).removeClass( 'hide' );
	} else {
		$( '#coverart, #share-group' ).css( 'width', '60%' );
	}
}
buttonactive = 0;
var imodedelay = 0; // fix imode flashing on usb dac switching
function displayPlayback() {
	if ( GUI.activePlayer === 'Airplay' ) {
		displayAirPlay();
		return;
	}
	$( '#container-playback' ).addClass( 'hide' );
	$( '#iplayer' ).removeClass( 'fa-airplay' ).addClass( 'hide' );
	buttonhide = window.innerHeight <= 320 || window.innerWidth < 499 ? 1 : 0;
	if ( GUI.json.playlistlength != 0 ) $( '.playback-controls' ).css( 'visibility', 'visible' );
	
	var volume = ( !display.volume || redis.volumempd == 0 ) ? 0 : 1;
	
	if ( redis.update != 0 ) {
		$( '#menu-settings' ).append( '<span id="badge">'+ redis.update +'</span>' );
	} else {
		$( '#badge' ).remove();
	}
	$( '#pause' ).toggleClass( 'hide', !display.pause );
	// reset to default css
	$( '#playback-row, #time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' ).css( {
		margin: '',
		width: '',
		'max-width': '',
		order: '',
		'-webkit-order': '',
		display: ''
	} );
	$( '#play-group' ).css( 'visibility', '' );
	$( '#time-knob, #play-group' ).toggleClass( 'hide', !display.time );
	$( '#coverart, #share-group' ).toggleClass( 'hide', !display.coverart );
	$( '#volume-knob, #vol-group' ).toggleClass( 'hide', !volume );
	
	var i = ( display.time ? 1 : 0 ) + ( display.coverart ? 1 : 0 ) + volume;
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
	if ( display.radioelapsed !== radioelapsed ) {
		radioelapsed = display.radioelapsed;
		if ( GUI.json.radio && GUI.state === 'play' ) {
			clearInterval( GUI.countdown );
			if ( !radioelapsed ) {
				$( '#total' ).text( '' );
			} else {
				$.post( '/enhancestatus.php', function( data ) {
					var status = JSON.parse( data );
					var elapsed = status.elapsed;
					GUI.countdown = setInterval( function() {
						elapsed++
						mmss = convertHMS( elapsed );
						$( '#total' ).text( mmss );
					}, 1000 );
				} );
			}
		}
	}
	if ( buttonhide || !display.buttons ) {
		buttonhide = 1;
		$( '#play-group, #share-group, #vol-group' ).addClass( 'hide' );
	}
	$( '#playback-row' ).removeClass( 'hide' ); // restore - hidden by fix flash
	if ( ( buttonhide || !display.buttons ) && display.time ) {
		$( '#irandom' ).toggleClass( 'hide', GUI.json.random === '0' );
		if ( GUI.json.repeat === '0' ) {
			$( '#irepeat' ).removeClass( 'fa-repeat-single' ).addClass( 'hide' );
		} else {
			$( '#irepeat' ).removeClass( 'hide fa-repeat fa-repeat-single ' ).addClass( GUI.json.single === '1' ? 'fa-repeat-single' : 'fa-repeat' );
		}
		if ( GUI.libraryhome.ActivePlayer !== 'MPD' ) {
			var source = GUI.libraryhome.ActivePlayer.toLowerCase();
			$( '#iplayer' ).addClass( 'fa-'+ source ).removeClass( 'hide' );
		}
	} else {
		$( '#imode i' ).addClass( 'hide' );
	}
	displayCommon();
	$( '#container-playback' ).removeClass( 'hide' );
}

// library show/hide blocks
function displayLibrary() {
	// no 'id'
	$( '#home-nas' ).parent().toggleClass( 'hide', !display.nas );
	$( '#home-local' ).parent().toggleClass( 'hide', !display.sd );
	$( '#home-usb' ).parent().toggleClass( 'hide', !display.usb );
	$( '#home-webradio' ).parent().toggleClass( 'hide', !display.webradio );
	$( '#home-albums' ).parent().toggleClass( 'hide', !display.albums );
	$( '#home-artists' ).parent().toggleClass( 'hide', !display.artists );
	$( '#home-composer' ).parent().toggleClass( 'hide', !display.composer );
	$( '#home-genre' ).parent().toggleClass( 'hide', !display.genre );
	$( '#home-dirble' ).parent().toggleClass( 'hide', !display.dirble );
	$( '#home-jamendo' ).parent().toggleClass( 'hide', !display.jamendo );
	
	window.scrollTo( 0, librarytop );
	displayCommon();
	// index height
	setTimeout( function() {
		var wH = window.innerHeight;
		var indexoffset = $( '#menu-top' ).is( ':visible' ) ? 160 : 80;
		if ( wH > 500 ) {
			var indexline = 27;
			$( '.half' ).removeClass( 'hide' );
		} else {
			var indexline = 13;
			$( '.half' ).addClass( 'hide' );
		}
		$( '#db-index' ).css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
	}, 200 );
}

function setPlaybackSource() {
	var activePlayer = GUI.libraryhome.ActivePlayer;
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
function chkKey( key ) {
	return ( key !== undefined && key !== '' );
}
function renderLibraryHome() {
	$( '#database-entries' ).empty();
	$( '#db-search-results' ).addClass( 'hide' );
	$( '#db-search-keyword' ).val( '' );
	if ( $( '#database-entries' ).hasClass( 'hide' ) && !bookmarkedit ) return;
	
//	loadingSpinner( 'db' );
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
		content += divOpen +'<div id="home-bookmark-'+ bookmark.id +'" class="home-block home-bookmark'+ toggleMPD +'" data-path="'+ bookmark.path +'"><i class="fa fa-bookmark"></i><h4>' + bookmark.name + '</h4></div></div>';
	}
	if ( chkKey( obj.networkMounts ) ) {
		content += divOpen +'<a id="home-nas" class="home-block'+ toggleMPD +'"'+ ( obj.networkMounts === 0 ? ( notMPD ? '' : ' href="/sources/add/"' ) : ' data-path="NAS"' ) +'>';
		content += '<i class="fa fa-network"></i><h4>Network drives <span>(' + obj.networkMounts + ')</span></h4></a></div>';
	}
	if ( chkKey( obj.localStorages ) ) {
		content += ( obj.localStorages === 0 ) ? '' : divOpen +'<div id="home-local" class="home-block'+ toggleMPD +'" data-path="LocalStorage"><i class="fa fa-microsd"></i><h4>SD card <span>('+ obj.localStorages +')</span></h4></div></div>';
	}
	if ( chkKey( obj.USBMounts ) ) {
		content += divOpen +'<div id="home-usb" class="home-block'+ toggleMPD +'"'+ ( obj.USBMounts === 0 ? ( notMPD ? '' : ' href="/sources/sources/"' ) : ' data-path="USB"' ) +'>';
		content += '<i class="fa fa-usbdrive"></i><h4>USB drives <span>('+ obj.USBMounts +')</span></h4></div></div>';
	}
	if ( chkKey( obj.webradio ) ) {
		if ( obj.webradio === 0 ) {
			content += divOpen +'<div id="home-webradio" class="home-block' + toggleMPD + '" href="#" data-toggle="modal" data-target="#modal-webradio-add"><i class="fa fa-webradio"></i><h4>Webradios <span>('+ obj.webradio +')</span></h4></div></div>';
		} else {
			content += divOpen +'<div id="home-webradio" class="home-block'+ toggleMPD +'" data-path="Webradio"><i class="fa fa-webradio"></i><h4>Webradios <span>('+ obj.webradio +')</span></h4></div></div>';
		}
	}
	content += divOpen +'<div id="home-albums" class="home-block'+ toggleMPD +'" data-path="Albums" data-browsemode="album"><i class="fa fa-album"></i><h4>Albums</h4></div></div>';
	content += divOpen +'<div id="home-artists" class="home-block'+ toggleMPD +'" data-path="Artists" data-browsemode="artist"><i class="fa fa-artist"></i><h4>Artists</h4></div></div>';
	content += divOpen +'<div id="home-composer" class="home-block'+ toggleMPD +'" data-path="Composer" data-browsemode="composer"><i class="fa fa-composer"></i><h4>Composers</h4></div></div>';
	content += divOpen +'<div id="home-genre" class="home-block' + toggleMPD +'" data-path="Genres" data-browsemode="genre"><i class="fa fa-genre"></i><h4>Genres</h4></div></div>';
	if ( chkKey( obj.Spotify ) && obj.Spotify !== '0' ) {
		if (obj.ActivePlayer !== 'Spotify') {
			content += divOpen +'<div id="home-spotify-switch" class="home-block"><i class="fa fa-spotify"></i><h4>Spotify</h4></div></div>';
		} else {
			content += divOpen +'<div id="home-spotify" class="home-block'+ toggleSpotify +'" data-plugin="Spotify" data-path="Spotify"><i class="fa fa-spotify"></i><h4>Spotify</h4></div></div>';
		}
	}
	if ( chkKey( obj.Dirble ) ) {
		content += divOpen +'<div id="home-dirble" class="home-block'+ toggleMPD +'" data-plugin="Dirble" data-path="Dirble"><i class="fa fa-dirble"></i><h4>Dirble</h4></div></div>';
	}
	content += divOpen +'<div id="home-jamendo" class="home-block'+ toggleMPD +'" data-plugin="Jamendo" data-path="Jamendo"><i class="fa fa-jamendo"></i><h4>Jamendo<span id="home-count-jamendo"></span></h4></div></div>';

	content += '</div>';
	document.getElementById( 'home-blocks' ).innerHTML = content;
	loadingSpinner( 'db', 'hide' );
	$( '#db-currentpath span' ).html( '<a>&ensp;LIBRARY</a>' );
// hide breadcrumb, index bar, edit bookmark
	GUI.currentDBpos[ 10 ] = 0;
	$( '#db-index, #db-level-up, #db-webradio-new, #db-homeSetup' ).addClass( 'hide' );
	displayLibrary();
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
					if (inpath !== 'Webradio') {
						if (inputArr.Title !== undefined) {
							if ( $( '#db-search-keyword' ).val() ) {
								var bl = inputArr.Artist +' - '+ inputArr.Album;
							} else {
								var bl = inputArr.file.split( '/' ).pop(); // filename
							}
							content += inputArr.file;
							content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
							content += inputArr.Title + '<span>' + convertHMS(inputArr.Time) + '</span></span>';
							content += '<span class="bl">';
							content +=  bl;
						} else {
							content += inputArr.file;
							content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
							content += inputArr.file.replace(inpath + '/', '') + ' <span>' + convertHMS(inputArr.Time) + '</span></span>';
							content += '<span class="bl">';
							content += ' path: ';
							content += inpath;
						}
					} else {
						content += inputArr.playlist;
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu-webradio"></i><i class="fa fa-webradio db-icon db-radio"></i>';
						content += '<span class="sn">' + inputArr.playlist.replace(inpath +'/', '').replace('.'+ inputArr.fileext, '');
						content += '</span><span class="bl">'+ inputArr.url;
					}
					content += '</span></li>';
				} else if (inputArr.playlist !== undefined) {
					if (inputArr.fileext === 'cue') {
						content = '<li id="db-' + (i + 1) + '" data-path="';
						content += inputArr.playlist;
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-file-text db-icon"></i><span class="sn">';
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
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu"></i><span><i class="fa fa-folder"></i>'
					} else {
						content += '"><i class="fa fa-bars db-action" data-target="#context-menu-root"></i><i class="fa fa-hdd-o icon-root"></i><span>';
					}
					content += inputArr.directory.replace(inpath + '/', '');
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'album' || GUI.browsemode === 'albumfilter') {
				if (inputArr.file !== undefined) {
					content = '<li id="db-' + (i + 1) + '" data-path="';
					content += inputArr.file;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
					content += inputArr.Title + '<span>' + convertHMS(inputArr.Time) + '</span></span>';
					content += ' <span class="bl">';
					content +=  inputArr.Album;
					content += ' - ';
					content +=  inputArr.Artist;
					content += '</span></li>';
				} else if (inputArr.album !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-album" data-path="';
					content += inputArr.album.replace(/\"/g,'&quot;');
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i><span><i class="fa fa-album"></i>';
					content += inputArr.album;
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'artist') {
				if (inputArr.album !== undefined) {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-album" data-path="';
					content += inputArr.album;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-album"></i><span><i class="fa fa-album"></i>';
					content += (inputArr.album !== '') ? inputArr.album : 'Unknown album';
					content += '</span></li>';
				} else if (inputArr.artist !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-artist" data-path="';
					content += inputArr.artist;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i><span><i class="fa fa-artist"></i>';
					content += inputArr.artist;
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'composer') {
				if (inputArr.file !== undefined) {
					content = '<li id="db-' + (i + 1) + '" data-path="';
					content += inputArr.file;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
					content += inputArr.Title + '<span>' + convertHMS(inputArr.Time) + '</span></span>';
					content += ' <span class="bl">';
					content +=  inputArr.Artist;
					content += ' - ';
					content +=  inputArr.Album;
					content += '</span></li>';
				} else if (inputArr.composer !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-composer" data-path="';
					content += inputArr.composer;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-composer"></i><span><i class="fa fa-composer"></i>';
					content += inputArr.composer;
					content += '</span></li>';
				}
			} else if (GUI.browsemode === 'genre') {
				if (inputArr.artist !== undefined) {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-artist" data-path="';
					content += inputArr.artist;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-artist"></i><span><i class="fa fa-album"></i>';
					content += (inputArr.artist !== '') ? inputArr.artist : 'Unknown artist';
					content += '</span></li>';
				} else if (inputArr.genre !== '') {
					content = '<li id="db-' + (i + 1) + '" class="db-folder db-genre" data-path="';
					content += inputArr.genre;
					content += '"><i class="fa fa-bars db-action" data-target="#context-menu-genre"></i><span><i class="fa fa-genre"></i>';
					content += inputArr.genre;
					content += '</span></li>';
				}
			}
		break;
		case 'Spotify':
			if (querytype === '') {
				content = '<li id="db-' + (i + 1) + '" class="db-spotify db-folder" data-path="';
				content += inputArr.index;
				content += '"><i class="fa fa-bars db-action" data-target="#context-menu-spotify-pl"></i><span><i class="fa fa-genre"></i>'
				content += (inputArr.name !== '') ? inputArr.name : 'Favorites';
				content += ' (';
				content += inputArr.tracks;
				content += ')</span></li>';
			} else if (querytype === 'tracks') {
				content = '<li id="db-' + (i + 1) + '" class="db-spotify" data-path="';
				content += inputArr.index;
				content += '" data-plid="';
				content += inpath;
				content += '" data-type="spotify-track"><i class="fa fa-bars db-action" data-target="#context-menu-spotify"></i><i class="fa fa-spotify db-icon"></i><span class="sn">';
				content += inputArr.Title + '<span>' + convertHMS(inputArr.duration/1000) + '</span></span>';
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
				content += '"><span><i class="fa fa-genre"></i>'
				content += inputArr.title;
				content += '</span></li>';
			} else if (querytype === 'search' || querytype === 'stations' || querytype === 'childs-stations') {
				if (inputArr.streams.length === 0) {
					break; // Filter stations with no streams
				}
				content = '<li id="db-' + (i + 1) + '" class="db-dirble db-radio" data-path="';
				content += inputArr.name + ' | ' + inputArr.streams[0].stream;
				content += '"><i class="fa fa-bars db-action" data-target="#context-menu-dirble"></i><i class="fa fa-webradio db-icon"></i>';
				content += '<span class="sn">' + inputArr.name + '<span>(' + inputArr.country + ')</span></span>';
				content += '<span class="bl">';
				content += inputArr.website ? inputArr.website : '-no website-';
				content += '</span></li>';
			}
		break;
		case 'Jamendo':
				content = '<li id="db-' + (i + 1) + '" class="db-jamendo db-folder" data-path="';
				content += inputArr.stream;
				content += '"><img class="jamendo-cover" src="/tun/' + inputArr.image + '" alt=""><i class="fa fa-bars db-action" data-target="#context-menu-file"></i>';
				content += inputArr.dispname + '</div></li>';
		break;
	}
	return content;
}
// strip leading A|An|The|(|[|. (for sorting)
function stripLeading( string ) {
	return string.replace( /^A +|^An +|^The +|^\(\s*|^\[\s*|^\.\s*/i, '' );
}
function preparse( array, i, type, path, query ) {
	return parseResponse( {
		  inputArr  : array
		, i         : i
		, respType  : type
		, inpath    : path
		, querytype : query ? query : ''
	} );
}
function populateDB( options ) {
	if ( !options.data.length ) $( '#database-entries' ).empty(); // fix: delete last webradio
	var data = options.data || '',
		path = options.path || '',
		uplevel = options.uplevel || 0,
		keyword = options.keyword || '',
		plugin = options.plugin || '',
		querytype = options.querytype || '',
		args = options.args || '',
		content = '',
		$databaseentries = document.getElementById( 'database-entries' ),
		i = 0,
		row = [];

	if ( path ) GUI.currentpath = path;
	$( '#database-entries, #db-level-up' ).removeClass( 'hide' );
	$(' #home-blocks ').addClass('hide');

	if ( plugin ) {
		if ( plugin === 'Spotify' ) {
			$databaseentries.innerHTML = '';
			data = ( querytype === 'tracks' ) ? data.tracks : data.playlists;
			data.sort( function( a, b ) {
				if ( path === 'Spotify' && querytype === '' ) {
					return stripLeading( a[ 'name' ] ).localeCompare( stripLeading( b[ 'name' ] ) )
				} else if ( querytype === 'tracks' ) {
					return stripLeading( a[ 'title' ]) .localeCompare( stripLeading( b[ 'title' ] ) )
				} else {
					return 0;
				}
			});
			for (i = 0; (row = data[i]); i += 1) content += preparse( row, i, 'Spotify', arg, querytype );
		} else if ( plugin === 'Dirble' ) {
			if ( querytype === 'childs-stations' ) {
				content = $databaseentries.innerHTML;
			} else {
				$databaseentries.innerHTML = '';
				data.sort( function( a, b ) {
					if ( !querytype || querytype === 'childs' || querytype === 'categories' ) {
						return stripLeading( a[ 'title' ] ).localeCompare( stripLeading( b[ 'title' ] ) )
					} else if ( querytype === 'childs-stations' || querytype === 'stations' ) {
						return stripLeading( a[ 'name' ] ).localeCompare( stripLeading( b[ 'name' ] ) )
				   } else {
						return 0;
					}
				});
				for (i = 0; (row = data[i]); i += 1) content += preparse( row, i, 'Dirble', '', querytype );
			}
		} else if ( plugin === 'Jamendo' ) {
			$databaseentries.innerHTML = '';
			data.sort( function( a, b ) {
				if ( path === 'Jamendo' && querytype === '' ) {
					return stripLeading( a[ 'dispname' ] ).localeCompare( stripLeading( b[ 'dispname' ] ) )
				} else {
					return 0;
				}
			});
			for (i = 0; (row = data[i]); i += 1) content += preparse( row, i, 'Jamendo', '', querytype );
		}
	} else {
// normal MPD browsing
		// show index bar
//		$( '#db-index' ).removeClass( 'hide' );
		if ( ( path === '' && keyword === '' ) || !data.length ) {
			loadingSpinner( 'db', 'hide' );
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
				  file    : 'file'
				, album   : 'file'
				, artist  : 'album'
				, genre   : 'artist'
				, composer: 'file'
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
			if ( data.length === 0 ) {
				loadingSpinner( 'db', 'hide' );
				return;
			}
			// browsing
			$databaseentries.innerHTML = '';
			if ( keyword ) {
			// search results
				var results = ( data.length ) ? data.length : '0';
				$( '#db-level-up, #db-index' ).addClass( 'hide' );
				$( '#database-entries' ).css( 'width', '100%' );
				$( '#db-search-results' )
					.removeClass( 'hide' )
					.html( '<i class="fa fa-times sx"></i><span class="visible-xs-inline"></span>\
						<span class="hidden-xs">' + results + ' <a>of</a> </span>' );
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
					return adir.localeCompare( bdir );
				} );
				for ( i = 0; row = arraydir[ i ]; i++ ) content += preparse( row, i, 'db', path );
				arrayfile.sort( function( a, b ) {
					if ( !keyword ) {
						return stripLeading( a[ 'file' ] ).localeCompare( stripLeading( b[ 'file' ] ) );
					} else {
						return stripLeading( a[ 'Title' ] ).localeCompare( stripLeading( b[ 'Title' ] ) );
					}
				} );
				for ( i = 0; row = arrayfile[ i ]; i++ ) content += preparse( row, i, 'db', path );
			} else {
				data.sort( function( a, b ) {
					if ( a[ prop ] === undefined ) prop = mode[ GUI.browsemode ];
					return stripLeading( a[ prop ] ).localeCompare( stripLeading( b[ prop ] ) );
				});
				
				for ( i = 0; row = data[ i ]; i++ ) content += preparse( row, i, 'db', path );
			}
			$( '#db-webradio-new' ).toggleClass( 'hide', path !== 'Webradio' );
		}
	}
	$( '#database-entries' ).html( content ).promise().done( function() {
		window.scrollTo( 0, dbtop );
	} );
	
// breadcrumb directory path link
	var dot = '<span style="color: #587ca0"> &#8226; </span>';
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
			var dot = ( path === mode[ GUI.browsemode ] ) ? '' : '<a>'+ dot +'<span class="white">'+ path +'</span></a>';
		} else {
			var albumartist = $( '#database-entries li:eq( 0 ) span.bl' ).text();
			var dot = albumartist ? '<a>'+ dot +'<span class="white">'+ albumartist +'</span></a>' : '';
		}
		$( '#db-currentpath span' ).html( icon[ GUI.browsemode ] +'&ensp;<a data-path="'+ mode[ GUI.browsemode ] +'">'+ name[ GUI.browsemode ] +'</a>'+ dot );
	} else {
		var folder = path.split( '/' );
		var folderPath = '';
		var folderCrumb = icon[ folder[ 0 ] ];
		if ( folderCrumb !== undefined ) {
			var ilength = folder.length;
			for ( i = 0; i < ilength; i++ ) {
				folderPath += ( i > 0 ? '/' : '' ) + folder[ i ];
				folderCrumb += '<a data-path="'+ folderPath +'">'+ ( i > 0 ? '<w> / </w>' : '' ) + ( name[ folder[ i ] ] ? name[ folder[ i ] ] : folder[ i ] ) +'</a>';
			} 
		} else {
			folderCrumb = '';
			$( '#db-currentpath' ).css( 'width', '50px' );
		}
		$( '#db-currentpath span' ).html( folderCrumb );
	}
	if ( uplevel ) {
		var position = GUI.currentDBpos[ GUI.currentDBpos[ 10 ] ];
		$( '#db-' + position ).addClass( 'active' );
		customScroll( 'db', position, 0 );
	} else {
		customScroll( 'db', 0, 0 );
	}
	if ( querytype != 'childs' ) loadingSpinner('db', 'hide');
	$( '#db-index' ).removeClass( 'hide' );
	$( '#database-entries' ).css( 'width', 'calc( 100% - 38px )' );
}
function getPlaylistPlain( data ) {
	var current = parseInt( GUI.json.song ) + 1;
	var state = GUI.json.state;
	var content = bottomline = classcurrent = classradio = hidetotal = '';
	var id = totaltime = playlisttime = countsong = countradio = counttotal = i = 0;
	var json = JSON.parse(data);
	var ilength = json.length;
	for ( i = 0; i < ilength; i++ ) {
		var data = json[ i ];
		if ( data[ 'file' ].slice( 0, 4 ) === 'http' ) {
			var iconhtml = '<i class="fa fa-webradio pl-icon"></i>';
			classradio = 1;
			countradio++
			topline = data[ 'Title' ];
			bottomline = data[ 'file' ];
		} else {
			var iconhtml = '<i class="fa fa-music pl-icon"></i>';
			countsong++
			time = parseInt( data[ 'Time' ] );
			topline = ( data[ 'Title' ] ? data[ 'Title' ] : data[ 'file' ].split( '/' ).pop() ) +'<span>'+ convertHMS( time ) +'</span>';
			bottomline = data[ 'Artist' ] + ( data[ 'Album' ] ? ' - '+ data[ 'Album' ] : '' );
			playlisttime += time;
		}
		counttotal++;
		classcurrent = ( state !== 'stop' && counttotal === current ) ? 'active' : '';
		cl = ' class="'+ classcurrent + ( classradio ? ' radio' : '' ) +'"';
		cl = ( classcurrent || classradio ) ? cl : '';
		content += '<li id="pl-'+ data[ 'Id' ] +'"'+ cl +'>'
			+ iconhtml
			+'<i class="fa fa-minus-circle pl-action" title="Remove song from playlist"></i>'
			+'<span class="sn">'+ topline +'</span>'
			+'<span class="bl">'+ bottomline +'</span>'
			+'</li>';
		classcurrent = classradio = '';
	}
	var counthtml = '<a>PLAYLIST</a><span>&ensp;&#8226;&ensp;</span><a>';
	if ( countsong ) {
		if ( countradio ) {
			var totalhtml = '<span>'+ convertHMS( playlisttime ) +'</span>&emsp;<a>'+ countradio +'</a>&ensp; <i class="fa fa-webradio"></i>';
		} else {
			var totalhtml = '<a>'+ convertHMS( playlisttime ) +'</a>';
		}
		counthtml += countsong +'</a>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
	} else {
		counthtml += countradio +'</a>&ensp; <i class="fa fa-webradio"></i>';
	}
	$( '.playlist' ).addClass( 'hide' );
	$( '#playlist-entries' ).html( content ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
	$( '#pl-filter-results' ).addClass( 'hide' ).html( '' );
	$( '#pl-manage, #pl-count' ).removeClass( 'hide' );
	$( '#pl-count' ).html( counthtml );
}
function getPlaylistCmd(){
	if ( GUI.json.playlistlength == 0 ) {
		$( '.playlist, #pl-filter-results' ).addClass( 'hide' );
		$( '#playlist-warning' ).removeClass( 'hide' );
		$( '#pl-filter-results' ).html( '' );
		$( '#pl-count').html( '<a>PLAYLIST</a>' );
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
function getPlaylists() {
    loadingSpinner('pl');
    $.ajax({
        url: '/command/?cmd=listplaylists',
        success: function( data ) {
			var pl = data.split( '\n' ).filter( function( el ) { return el.match( /^playlist/ ) } );
			var content = plname = '';
			pl.forEach( function( el ) {
				plname = el.replace( 'playlist: ', '' );
				content += '<li class="pl-folder" data-path="'+ plname +'"><i class="fa fa-bars pl-action"></i><span><i class="fa fa-list-ul"></i>'+ plname +'</span></li>';
			} );
			
			$( '.playlist, #pl-manage, #pl-count' ).addClass( 'hide' );
			$( '#pl-filter-results, #pl-currentpath, #pl-editor' ).removeClass( 'hide' );
			document.getElementById( 'pl-editor' ).innerHTML = content;
			loadingSpinner( 'pl', 'hide' );
        },
        cache: false
    });
}

prevnext = 0; // for disable 'btn-primary' - previous/next while stop
$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var dataCmd = $this.data( 'cmd' );
	if ( $this.hasClass( 'btn-toggle' ) ) {
		if ( GUI.stream === 'radio' ) return;
		
		onsetmode = 1;
		setTimeout( function() {
			onsetmode = 0;
		}, 500 );
		if ( $this.attr( 'data-cmd' ) === 'pl-ashuffle-stop' ) $.post( '/db/?cmd=pl-ashuffle-stop', '' );
		dataCmd = dataCmd +' '+ ( GUI.json[ this.id ] == 1 ? 0 : 1 );
	} else {
		if ( dataCmd === 'play' ) {
			if ( GUI.json.radio ) {
				dataCmd = ( GUI.state === 'play' ) ? 'stop' : 'play';
			} else {
				dataCmd = ( GUI.state === 'play' ) ? 'pause' : 'play';
			}
		}
		if ( dataCmd === 'pause' || dataCmd === 'stop' ) {
			if ( GUI.json.radio ) $( '#currentsong' ).html( '&nbsp;' );
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
				// Math.floor( Math.random() * ( max - min + 1 ) ) + min;
				var pos = Math.floor( Math.random() * last );
				// avoid same pos ( no pos-- or pos++ in ternary )
				if ( pos === current - 1 ) pos = ( pos === last - 1 ) ? pos - 1 : pos + 1;
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
} );

// buttons and playlist
function setButton() {
	if ( GUI.json.updating_db !== undefined ) {
		$( '#open-panel-sx i, #db-home i, #iupdate' ).addClass( 'blink' );
		if ( $( '#menu-bottom' ).is( ':hidden' ) ) $( '#iupdate' ).removeClass( 'hide' );
	} else {
		$( '#open-panel-sx i, #db-home i, #iupdate' ).removeClass( 'blink' );
		$( '#iupdate' ).addClass( 'hide' );
	}
	if ( display.buttons ) {
		$( '#repeat' ).toggleClass( 'btn-primary', GUI.json.repeat === '1' );
		$( '#random' ).toggleClass( 'btn-primary', GUI.json.random === '1' );
		$( '#single' ).toggleClass( 'btn-primary', GUI.json.single === '1' );
	}
	
	if ( prevnext === 1 ) return; // disable for previous/next while stop
	
	if ( GUI.state === 'stop' ) {
		$( '#stop' ).addClass( 'btn-primary' );
		$( '#play, #pause' ).removeClass( 'btn-primary' );
		if ( $( '#pause' ).hasClass( 'hide' ) ) $( '#play i' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
	} else {
		if ( GUI.state === 'play' ) {
			$( '#play' ).addClass( 'btn-primary' );
			$( '#stop' ).removeClass( 'btn-primary' );
			if ( $( '#pause' ).hasClass( 'hide' ) ) {
				$( '#play i' ).removeClass( 'fa fa-pause' ).addClass( 'fa fa-play' );
			} else {
				$( '#pause' ).removeClass( 'btn-primary' );
			}
		} else if ( GUI.state === 'pause' ) {
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
		var $this = $( this );
		if ( $this.find( 'span' ).width() > Math.floor( window.innerWidth * 0.975 ) ) {
			$this.addClass( 'scroll-left' );
		} else {
			$this.removeClass( 'scroll-left' );
		}
	} );
}
onsetmode = 0;
function setPlaybackData() {
	$.post( '/enhancestatus.php', function( data ) {
		var status = JSON.parse( data );
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
		$volumetransition.css( 'transition-duration', '0s' ); // suppress initial rotate animation
		$volumeRS.setValue( status.volume );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		$volumetooltip.add( $volumehandle ).removeClass( 'hide' ); // show after 'setValue'
		$volumetransition.css( 'transition', '' );           // reset animation to default
		if ( $( '#vol-group' ).is( ':visible' ) ) {
			if ( status.volumemute != 0 ) {
				muteColor( status.volumemute );
			} else {
				unmuteColor();
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
			$( '#currentsong' ).html( '<i class="fa fa-plus-circle"></i>' );
			$( '#playlist-position span' ).text( 'Add something from Library' );
			$( '#currentartist, #currentalbum, #format-bitrate, #elapsed, #total' ).html( '' );
			$( '#cover-art' ).css( {
				  'background-image': 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
				, 'border-radius': 0
			} );
			$( '#coverartoverlay' ).addClass( 'hide' );
			return;
		}
		
		GUI.json.radio = ( status.ext === 'radio' ? 1 : 0 );
		setButton();
		
		$( '.playback-controls' ).css( 'visibility', 'visible' );
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
			var radiobg = $( '#cover-art' ).css( 'background-image' );
			var radiourl = $( '#vu' ).val();
			var radiourlstop = $( '#vustop' ).val();
			
			$( '#cover-art' ).css( 'border-radius', '18px' );
			$( '#coverartoverlay' ).show();
			if ( status.state === 'play' ) {
				if ( radiobg !== radiourl ) {
					$( '#cover-art' ).css( 'background-image', radiourl );
				}
			} else {
				if ( radiobg !== radiourlstop ) {
					$( '#cover-art' ).css( 'background-image', radiourlstop );
				}
			}
			$( '#elapsed' ).html( status.state === 'play' ? blinkdot : '' );
			$( '#total' ).text( '' );
			// show / hide elapsed at total
			if ( !status.radioelapsed ) {
				$( '#total' ).text( '' );
			} else {
				var elapsed = status.elapsed;
				GUI.countdown = setInterval( function() {
					elapsed++
					mmss = convertHMS( elapsed );
					$( '#total' ).text( mmss ).css( 'color', '#587ca0' );
				}, 1000 );
			}
			return;
		} else {
			if ( status.Album !== previousalbum ) {
				var covercachenum = Math.floor( Math.random() * 1001 );
				$( '#cover-art' ).css( 'background-image', 'url("/coverart/?v=' + covercachenum + '")' );
				$( '#cover-art' ).css( 'border-radius', 0 );
				$( '#coverartoverlay' ).addClass( 'hide' );
			}
		}

		// time
		time = status.Time;
		$( '#total' ).text( convertHMS( time ) );
		// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		if ( $( '#time-knob' ).hasClass( 'hide' ) ) return;
		if ( status.state === 'stop' ) {
			$( '#elapsed' ).text( $( '#total' ).text() ).css( 'color', '#587ca0' );
			$( '#total' ).text( '' );
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
			mmss = convertHMS( elapsed );
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

} // end if <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// ### called by backend socket - force refresh all clients ###
function renderUI( text ) {
	if ( /\/.*\//.test( location.pathname ) === false ) { // not setting pages
		toggleLoader( 'close' );
		if ( !$('#section-index' ).length || onsetvolume ) return;
		
		GUI.json = text[ 0 ];
		GUI.state = GUI.json.state;
		
		setPlaybackData();
		setButton();
		// imodedelay fix imode flashing on usb dac switching
		if ( $( '#playback' ).hasClass( 'active' ) && !imodedelay ) {
			displayPlayback();
		} else if ( $( '#panel-dx' ).hasClass( 'active' ) && !$( '#playlist-entries' ).hasClass( 'hide' ) ) {
			getPlaylistCmd();
			GUI.playlist = GUI.json.playlist;
		}
	} else if ( /\/sources\//.test( location.pathname ) === true ) { // sources page
		GUI.json = text[ 0 ];
		var mpdupdate = GUI.json.updating_db !== undefined ? true : false;
		$( '#open-panel-sx i' ).toggleClass( 'blink', mpdupdate );
		$( '#updatempddb i, #rescanmpddb i' ).toggleClass( 'fa-spin', mpdupdate );
	}
}

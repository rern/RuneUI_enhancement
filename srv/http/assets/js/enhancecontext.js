// quotes in mpc name arguments
//     enclosed with double quotes + escape double quotes
// example: mpc save "abc's \"xyz\"" << name.replace( /"/g, '\\"' )

$( '.contextmenu a' ).click( function() {
	$( '.menu' ).addClass( 'hide' );
	$( '#db-entries li, #pl-entries li' ).removeClass( 'active' );
	var cmd = $( this ).data( 'cmd' );
	var mode = cmd.replace( /replaceplay|replace|addplay|add/, '' );
	// get name
	if ( mode === 'wr' ) {
		var name = 'Webradio/'+ GUI.list.name.replace( /"/g, '\\"' ) +'.pls';
	} else if ( mode === 'pl' ) {
		var name = GUI.list.name.replace( /"/g, '\\"' );
	} else {
		if ( !$( '#page-playlist' ).hasClass( 'hide' ) && $( '#pl-currentpath .lipath' ).length ) {
			var name = GUI.list.li.find( '.lipath' ).text().replace( /"/g, '\\"' );
		} else {
			var name = GUI.list.path.replace( /"/g, '\\"' );
		}
	}
	// compose command
	if ( !mode ) {
		var ext = GUI.list.path.slice( -3 ).toLowerCase();
		if ( GUI.list.index ) {
			var cuefile = GUI.list.path.replace( /"/g, '\\"' );
			var mpcCmd = '/srv/http/enhancecue.sh "'+ cuefile +'" '+ GUI.list.index;
		} else if ( ext === 'm3u' ) {
			var mpcCmd = 'cat "/mnt/MPD/'+ GUI.list.path +'" | mpc add';
		} else if ( ext === 'cue' || ext === 'pls' ) {
			var mpcCmd = 'mpc load "'+ name +'"';
		} else {
			var mpcCmd = GUI.list.isfile ? 'mpc add "'+ name +'"' : 'mpc ls "'+ name +'" | mpc add';
		}
	} else {
		var browsemode = GUI.dbbackdata.length ? GUI.dbbackdata[ 0 ].browsemode : '';
		if ( [ 'album', 'albumartist' ].indexOf( browsemode ) !== -1 ) {
			var mpcCmd = 'mpc findadd'+ ( GUI.list.artist ? ' artist "'+ GUI.list.artist : '' )  +'" album "'+ name +'"';
		} else if ( [ 'artist', 'composer', 'genre' ].indexOf( browsemode ) !== -1 ) {
			var mpcCmd = 'mpc add '+ GUI.filelist;
		} else {
			var mpcCmd = 'mpc load "'+ name +'"';
			if ( [ 'wrrename', 'wrdelete', 'plrename', 'pldelete' ].indexOf( mode ) === -1 ) cmd = cmd.replace( /pl|wr/, '' );
		}
		cmd = cmd.replace( /album|artist|composer|genre/, '' );
	}
	var addplaypos = GUI.status.playlistlength + 1;
	var contextCommand = {
		  add           : mpcCmd
		, addplay       : [ mpcCmd, 'mpc play '+ addplaypos ]
		, replace       : [ 'mpc clear', mpcCmd ]
		, replaceplay   : [ 'mpc clear', mpcCmd, 'mpc play' ]
		, wrrename      : webRadioRename
		, wrdelete      : webRadioDelete
		, plrename      : playlistRename
		, pldelete      : playlistDelete
		, bookmark      : bookmarkNew
		, update        : 'mpc update "'+ GUI.list.path +'"'
	}
	var command = contextCommand[ cmd ];
	if ( typeof command !== 'undefined' ) {
		if ( typeof command === 'function' ) {
			command();
		} else {
			if ( cmd !== 'update' ) {
				if ( cmd.replace( 'wr', '' ).slice( 0, 3 ) === 'add' ) {
					addReplace( mode, command, 'Add to Playlist' );
				} else {
					info( {
						  title   : 'Replace Playlist'
						, message : 'Replace current Playlist?'
						, cancel  : 1
						, ok      : function() {
							addReplace( mode, command, 'Playlist replaced' );
						}
					} );
				}
			} else {
				$.post( 'enhance.php', { mpc: command } );
			}
		}
	} else if ( cmd === 'dirblesave' ) {
		webRadioNew( GUI.list.name, GUI.list.path );
	} else if ( cmd === 'plashuffle' ) {
			$.post( '/db/?cmd=pl-ashuffle', { playlist: name } );
			$( '#random' ).data( 'cmd', 'pl-ashuffle-stop' ).addClass( 'btn-primary' );
	} else {
		$.post( '/db/?cmd='+ cmd, { path: name }, function() {
			if ( !GUI.status.playlistlength ) getPlaybackStatus();
		} );
	}
} );

function addReplace( mode, command, title ) {
	if ( mode === 'wr' ) {
		GUI.local = 1;
		setTimeout( function() { GUI.local = 0 }, 500 );
	}
	$.post( 'enhance.php', { mpc: command }, function() {
		getPlaybackStatus();
	} );
	new PNotify( {
		  title : title
		, text  : GUI.list.name
	} );
}
function bookmarkNew() {
	var path = GUI.list.path;
	var name = path.split( '/' ).pop();
	info( {
		  icon       : 'edit-circle'
		, title      : 'Add Bookmark'
		, width      : 500
		, message    : 'Bookmark'
						+'<br><white>'+ path +'</white>'
						+'<br>As:'
		, textvalue  : name
		, textalign  : 'center'
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			bookmarkVerify( $( '#infoTextBox' ).val().trim(), path );
		}
	} );
}
function bookmarkRename( name, path ) {
	info( {
		  icon      : 'edit-circle'
		, title     : 'Rename Bookmark'
		, width     : 500
		, message   : 'Rename'
					+'<br><white>'+ name +'</white>'
					+'<br>'+ path
					+'<br>To:'
		, textvalue : name
		, textalign : 'center'
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			bookmarkVerify( $( '#infoTextBox' ).val().trim(), path, name );
		}
	} );
}
function bookmarkVerify( name, path, oldname ) {
	if ( !name ) {
		info( {
			  icon    : 'warning'
			, title   : oldname ? 'Rename Bookmark' :'Add Bookmark'
			, message : '<white>Name</white> cannot be blank.'
			, ok      : function() {
				oldname ? bookmarkRename( oldname, path ) : bookmarkNew( path );
			}
		} );
		return;
	}
	$.post( 'enhance.php', { bash: '/usr/bin/redis-cli hgetall bkmarks' }, function( data ) {
		if ( data ) {
			var data = data.split( '\n' );
			var bmname = [];
			var bmpath = [];
			$.each( data, function( i, val ) {
				i % 2 ? bmpath.push( val ) : bmname.push( val );
			} );
			var namei = bmname.indexOf( name );
		} else {
			var namei = -1;
		}
		if ( namei === -1 ) {
			if ( !oldname ) {
				new PNotify( {
					  title : 'Add Bookmark'
					, text  : name
				} );
				GUI.local = 1;
				setTimeout( function() { GUI.local = 0 }, 500 );
			}
			var data = oldname ? [ name, path, oldname ] : [ name, path ];
			$.post( 'enhance.php', { bkmarks: data } );
		} else {
			info( {
				  icon        : 'warning'
				, title       : oldname ? 'Rename Bookmark' :'Add Bookmark'
				, width       : 500
				, message     : '<white>'+ name +'</white>'
							+'<br>Already exists for:'
							+'<br>'+ bmpath[ namei ]
				, cancellabel : 'Back'
				, cancel      : function() {
					oldname ? bookmarkRename( name, path ) : bookmarkNew();
				}
				, oklabel     : 'Replace'
				, ok          : function() {
					if ( !oldname ) {
						GUI.local = 1;
						setTimeout( function() { GUI.local = 0 }, 500 );
					}
					var data = oldname ? [ name, path, oldname ] : [ name, path ];
					$.post( 'enhance.php', { bkmarks: data } );
				}
			} );
		}
	} );
}
function bookmarkDelete( name, $block ) {
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Bookmark'
		, message : 'Delete?'
					+'<br><white>'+ name +'</white>'
		, cancel  : 1
		, ok      : function() {
			$block.remove();
			GUI.bookmarkedit = 1;
			$.post( 'enhance.php', { bkmarks: name }, function() {
				$( '#tab-library' ).click();
			} );
		}
	} );
}
function webRadioNew( name, url ) {
	info( {
		  icon       : 'edit-circle'
		, title      : 'Add Webradio'
		, width      : 500
		, message    : 'Add new Webradio:'
		, textlabel  : 'Name'
		, textvalue  : name || ''
		, textlabel2 : 'URL'
		, textvalue2 : url || ''
		, textalign  : 'center'
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			webRadioVerify( $( '#infoTextBox' ).val().trim(), $( '#infoTextBox2' ).val().trim() );
		}
	} );
}
function webRadioRename() {
	var name = GUI.list.name;
	var path = GUI.list.path;
	info( {
		  icon       : 'edit-circle'
		, title      : 'Rename Webradio'
		, width      : 500
		, message    : 'Rename:'
					+'<br><white>'+ name +'</white>'
					+'<br>'+ path
					+'<br>To:'
		, textvalue  : name
		, textalign  : 'center'
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			webRadioVerify( $( '#infoTextBox' ).val().trim(), path, name );
		}
	} );
}
function addWebradio( name, url, oldname ) {
	if ( !oldname ) GUI.libraryhome.webradio++;
	var name = name;
	var oldname = oldname ? oldname : '';
	var data = oldname ? [ name, url, oldname ] : [ name, url ];
	GUI.local = 1;
	setTimeout( function() { GUI.local = 0 }, 500 );
	$.post( 'enhance.php', { webradios: data } );
}
function webRadioVerify( name, url, oldname ) {
	if ( !name || !url ) {
		info( {
			  icon    : 'warning'
			, title   : oldname ? 'Rename Webradio' : 'Add Webradio'
			, message : '</white>Name</white> and <white>URL</white> cannot be blank.'
			, ok      : function() {
				webRadioNew( name, url );
			}
		} );
		return;
	}
	$.post( 'enhance.php', { bash: '/usr/bin/redis-cli hgetall webradios' }, function( data ) {
		var data = data.split( '\n' );
		var wrname = [];
		var wrurl = [];
		$.each( data, function( i, val ) {
			i % 2 ? wrurl.push( val ) : wrname.push( val );
		} );
		var namei = wrname.indexOf( name );
		if ( namei === -1 ) {
			oldname ? addWebradio( name, url, oldname ) : addWebradio( name, url );
		} else {
			info( {
				  icon        : 'warning'
				, title       : oldname ? 'Rename Webradio' : 'Add Webradio'
				, width       : 500
				, message     : '<white>'+ name +'</white>'
							+'<br>Already exists for:'
							+'<br>'+ wrurl[ namei ]
				, cancellabel : 'Back'
				, cancel      : function() {
					webRadioNew( name, url );
				}
				, oklabel     : 'Replace'
				, ok          : function() {
					oldname ? addWebradio( name, url, oldname ) : addWebradio( name, url );
				}
			} );
		}
	} );
}
function webRadioDelete() {
	var name = GUI.list.name;
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Webradio'
		, width   : 500
		, message : 'Delete?'
					+'<br><white>'+ name +'</white>'
					+'<br>'+ GUI.list.path
		, cancel  : 1
		, ok      : function() {
			$( '#db-entries li.active').remove();
			GUI.libraryhome.webradio--;
			GUI.local = 1;
			setTimeout( function() { GUI.local = 0 }, 500 );
			$.post( 'enhance.php', { webradios: name } );
		}
	} );
}
function playlistNew() {
	info( {
		  icon      : 'save'
		, title     : 'Add Playlist'
		, message   : 'Save current playlist as:'
		, textlabel : 'Name'
		, textalign : 'center'
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			playlistVerify( $( '#infoTextBox' ).val().trim() );
		}
	} );
}
function playlistRename() {
	var name = GUI.list.name;
	info( {
		  icon      : 'edit-circle'
		, title     : 'Rename Playlist'
		, message   : 'Rename:'
					+'<br><white>'+ name +'</white>'
					+'<br>To:'
		, textvalue : name
		, textalign : 'center'
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			playlistVerify( $( '#infoTextBox' ).val().trim(), name );
		}
	} );
}
function addPlaylist( name, oldname ) {
	if ( oldname ) {
		var oldfile = ' "/var/lib/mpd/playlists/'+ oldname.replace( /"/g, '\\"' ) +'.m3u"';
		var newfile = ' "/var/lib/mpd/playlists/'+ name.replace( /"/g, '\\"' ) +'.m3u"';
		$.post( 'enhance.php', { bash: '/usr/bin/mv'+ oldfile + newfile }, function() {
			$.post( 'enhance.php', { lsplaylists: 1 }, function( data ) {
				GUI.lsplaylists = data;
				$( '#plopen' ).click();
			}, 'json' );
		} );
	} else {
		new PNotify( {
			  title : 'Playlist Saved'
			, text  : name
		} );
		$( '#plopen' ).removeClass( 'disable' );
		GUI.lsplaylists.push( name );
		GUI.local = 1;
				setTimeout( function() { GUI.local = 0 }, 500 );
		$.post( 'enhance.php', { mpc: 'mpc save "'+ name.replace( /"/g, '\\"' ) +'"' } );
	}
}
function playlistVerify( name, oldname ) {
	if ( !name ) {
		info( {
			  icon    : 'warning'
			, title   : oldname ? 'Rename Playlist' : 'Add Playlist'
			, message : '<white>Name</white> cannot be blank.'
			, ok      : function() {
				playlistNew();
			}
		} );
		return;
	}
	$.post( 'enhance.php', { mpc: 'mpc lsplaylists', result: 1 }, function( data ) {
		if ( !data || data.split( '\n' ).indexOf( name ) === -1 ) {
			oldname ? addPlaylist( name, oldname ) : addPlaylist( name );
		} else {
			info( {
				  icon        : 'warning'
				, title       : oldname ? 'Rename Playlist' : 'Add Playlist'
				, message     : '<white>'+ name +'</white>'
							+'<br>Already exists.'
				, cancellabel : 'Back'
				, cancel      : function() {
					playlistNew();
				}
				, oklabel     : 'Replace'
				, ok          : function() {
					oldname ? addPlaylist( name, oldname ) : addPlaylist( name );
				}
			} );
		}
	} );
}
function playlistDelete() {
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Playlist'
		, message : 'Delete?'
					+'<br><white>'+ GUI.list.name +'</white>'
		, cancel  : 1
		, ok      : function() {
			var count = $( '#pls-count' ).text() - 1;
			$( '#pls-count' ).text( numFormat( count ) );
			if ( !count ) $( '#pl-currentpath' ).html( '<bl>&emsp;PLAYLISTS</bl>' );
			GUI.list.li.remove();
			
			GUI.local = 1;
			setTimeout( function() { GUI.local = 0 }, 500 );
			$.post( 'enhance.php', { mpc: 'mpc rm "'+ GUI.list.name.replace( /"/g, '\\"' ) +'"' } );
		}
	} );
}

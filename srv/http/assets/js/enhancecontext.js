// single quotes in mpc name arguments - enclosed with double quotes + escape double quotes
// example: mpc save "abc's \"xyz\"" << name.replace( /"/g, '\\"' )

$( '.contextmenu a' ).click( function() {
	$( '.menu' ).addClass( 'hide' );
	var $this = $( this );
	var cmd = $this.data( 'cmd' );
	if ( [ 'play', 'pause', 'stop', 'remove' ].indexOf( cmd ) !== -1 ) {
		if ( cmd === 'remove' ) {
			GUI.list.li.find( '.pl-action' ).click();
		} else {
			$( '#'+ cmd ).click();
		}
		return
	}
	$( '#db-entries li, #pl-entries li' ).removeClass( 'active' );
	var mode = cmd.replace( /replaceplay|replace|addplay|add/, '' );
	// get name
	if ( mode === 'wr' ) {
		var name = 'Webradio/'+ GUI.list.name.replace( /"/g, '\\"' ) +'.pls';
	} else if ( mode === 'pl' ) {
		var name = GUI.list.name.replace( /"/g, '\\"' );
	} else {
		if ( GUI.playlist && $( '#pl-currentpath .lipath' ).length ) {
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
		} else if ( GUI.plugin ) {
			var radioname = GUI.list.name.replace( /"/g, '\\"' );
			var mpcCmd = 'mpc add "'+ GUI.list.path +'"; /usr/bin/redis-cli hset webradiopl '+ GUI.list.path +' "*'+ radioname +'"';
		} else {
			var mpcCmd = GUI.list.isfile ? 'mpc add "'+ name +'"' : 'mpc ls "'+ name +'" | mpc add';
		}
	} else {
		var artist = GUI.list.artist || $( '#artistalbum span' ).text();
		artist = artist.replace( /"/g, '\\"' );
		if ( [ 'album', 'artist', 'albumartist', 'composer', 'genre' ].indexOf( GUI.list.mode ) !== -1 ) {
			var mpcCmd = 'mpc findadd '+ GUI.list.mode +' "'+ name +'"'+ ( artist ? ' artist "'+ artist +'"' : '' );
		} else {
			var mpcCmd = 'mpc load "'+ name +'"';
		}
		cmd = cmd.replace( /album|artist|composer|genre|pl|wr/, '' );
	}
	var addplaypos = GUI.status.playlistlength + 1;
	var contextCommand = {
		  add           : mpcCmd
		, addplay       : [ mpcCmd, 'mpc play '+ addplaypos ]
		, replace       : [ 'mpc clear', mpcCmd ]
		, replaceplay   : [ 'mpc clear', mpcCmd, 'mpc play' ]
		, radiosave     : webRadioNew
		, rename        : webRadioRename
		, delete        : webRadioDelete
		, plrename      : playlistRename
		, pldelete      : playlistDelete
		, bookmark      : bookmarkNew
		, update        : 'mpc update "'+ GUI.list.path +'"'
	}
	var command = contextCommand[ cmd ];
	if ( typeof command !== 'undefined' ) {
		if ( typeof command === 'function' ) {
			cmd !== 'radiosave' ? command() : webRadioNew( GUI.list.name, GUI.list.path );
		} else {
			if ( cmd !== 'update' ) {
				if ( cmd.replace( 'wr', '' ).slice( 0, 3 ) === 'add' ) {
					addReplace( mode, cmd, command, 'Add to Playlist' );
				} else {
					if ( GUI.display.plclear ) {
						info( {
							  title   : 'Replace Playlist'
							, message : 'Replace current Playlist?'
							, cancel  : 1
							, ok      : function() {
								addReplace( mode, cmd, command, 'Playlist replaced' );
							}
						} );
					} else {
						addReplace( mode, cmd, command, 'Playlist replaced' );
					}
				}
			} else {
				$.post( 'enhance.php', { mpc: command } );
			}
		}
	} else if ( cmd === 'plashuffle' ) {
		$.post( '/db/?cmd=pl-ashuffle', { playlist: name } );
		$( '#random' ).addClass( 'btn-primary ashuffle' );
	} else {
		$.post( '/db/?cmd='+ cmd, { path: name }, function() {
			if ( !GUI.status.playlistlength ) getPlaybackStatus();
		} );
	}
} );

function addReplace( mode, cmd, command, title ) {
	$.post( 'enhance.php', { mpc: command }, function() {
		if ( GUI.display.playbackswitch
			&& ( cmd === 'addplay' || cmd === 'replaceplay' ) 
		) {
			$( '#tab-playback' ).click();
		} else {
			getPlaybackStatus();
		}
	} );
	var artist = $( '#artistalbum span' ).text();
	new PNotify( {
		  title : title
		, text  : GUI.list.name + ( artist ? ' • '+ artist : '' )
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
		, oklabel   : 'Rename'
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
			if ( GUI.display.order ) GUI.display.order = GUI.display.order.replace( oldname , name );
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
					GUI.display.order = GUI.display.order.replace( oldname , name );
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
		, oklabel : 'Delete'
		, ok      : function() {
			GUI.bookmarkedit = 1;
			$.post( 'enhance.php', { bkmarks: name } );
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
		, oklabel    : 'Rename'
		, ok         : function() {
			webRadioVerify( $( '#infoTextBox' ).val().trim(), path, name );
		}
	} );
}
function addWebradio( name, url, oldname ) {
	var name = name;
	var oldname = oldname ? oldname : '';
	var data = oldname ? [ name, url, oldname ] : [ name, url ];
	
	GUI.local = 1;
	setTimeout( function() { GUI.local = 0 }, 500 );
	
	$.post( 'enhance.php', { webradios: data }, function() {
		if ( GUI.playlist ) $( '#tab-playlist' ).click();
	} );
	if ( !oldname ) {
		GUI.libraryhome.webradio++;
		var count = GUI.libraryhome.webradio ? numFormat ( GUI.libraryhome.webradio ) : '';
		$( '#home-webradio gr' ).remove();
		$( '#home-webradio i' ).after( '<gr>'+ count +'</gr>' );
	}
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
		, oklabel : 'Delete'
		, ok      : function() {
			$( '#db-entries li').eq( GUI.list.liindex ).remove();
			GUI.libraryhome.webradio--;
			var count = GUI.libraryhome.webradio ? numFormat ( GUI.libraryhome.webradio ) : '';
			$( '#home-webradio gr' ).remove();
			if ( count ) $( '#home-webradio i' ).after( '<gr>'+ count +'</gr>' );
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
		, oklabel   : 'Rename'
		, ok        : function() {
			playlistVerify( $( '#infoTextBox' ).val().trim(), name );
		}
	} );
}
function addPlaylist( name, oldname ) {
	if ( oldname ) {
		var oldfile = ' "/var/lib/mpd/playlists/'+ oldname.replace( /"/g, '\\"' ) +'.m3u"';
		var newfile = ' "/var/lib/mpd/playlists/'+ name.replace( /"/g, '\\"' ) +'.m3u"';
		$.post( 'enhance.php', { bash: '/usr/bin/mv'+ oldfile + newfile } );
		GUI.lsplaylists.splice( GUI.lsplaylists.indexOf( oldname ), 1 );
		GUI.lsplaylists.push( name );
		$( '#plopen' ).click();
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
		, oklabel : 'Delete'
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

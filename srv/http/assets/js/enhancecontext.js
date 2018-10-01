$( '.contextmenu a' ).click( function() {
	GUI.dbcurrent = '';
	var cmd = $( this ).data( 'cmd' );
	var mode = cmd.replace( /replaceplay|replace|addplay|add/, '' );
	var modes = [ 'album', 'artist', 'composer', 'genre' ];
	var name = GUI.list.path ? GUI.list.path.replace( /"/g, '\"' ) : '';
	if ( !mode ) {
		var mpcCmd = GUI.list.isfile ? 'add "'+ name +'"' : 'ls "'+ name +'" | mpc add';
	} else if ( $.inArray( mode, [ 'album', 'artist', 'composer', 'genre' ] ) !== -1 ) {
		var mpcCmd = 'findadd '+ mode +' "'+ name +'"';
	} else if ( mode === 'wr' ) {
		cmd = cmd.replace( 'wr', 'pl' );
		name = 'Webradio/'+ GUI.list.name.replace( /"/g, '\"' );
	} else if ( mode === 'pl' ) {
		name = GUI.list.name ? GUI.list.name.replace( /"/g, '\"' ) : '';
	}
	var contextCommand = {
		  add              : mpcCmd
		, addplay          : [ mpcCmd, 'play' ]
		, replace          : [ 'clear', mpcCmd ]
		, replaceplay      : [ 'clear', mpcCmd, 'play' ]
		, pladd            : 'load "' + name +'"'
		, pladdplay        : [ 'load "' + name +'"', 'play' ]
		, plreplace        : [ 'clear', 'load "'+ name +'"' ]
		, plreplaceplay    : [ 'clear', 'load "'+ name + '"', 'play' ]
		, update           : 'update '+ GUI.list.path
		, plrename         : playlistRename
		, pldelete         : playlistDelete
		, wrrename         : webRadioRename
		, wrdelete         : webRadioDelete
		, wrsave           : webRadioVerify
		, bookmark         : bookmarkNew
	}
	var command = contextCommand[ cmd ];
	if ( typeof command !== 'undefined' ) {
		if ( typeof command === 'function' ) {
			command();
		} else {
			if ( cmd !== 'update' ) {
				var add = cmd.replace( 'pl', '' ).slice( 0, 3 ) === 'add';
				new PNotify( {
					  icon  : 'fa fa-check'
					, title : add ? 'Add to Playlist' : 'Playlist replaced'
					, text  : GUI.list.name
				} );
			}
			if ( mode === 'wr' ) tempFlag( 'local' );
			var pllength = GUI.status.playlistlength;
			$.post( 'enhance.php', { mpc: command }, function() {
				if ( !pllength ) getPlaybackStatus();
				if ( cmd.slice( -4 ) === 'play' ) {
					$( '#playback-controls .btn-primary' ).removeClass( 'btn-primary' );
					$( '#play' ).addClass( 'btn-primary' );
				}
			} );
		}
	} else if ( cmd === 'plashuffle' ) {
			$.post( '/db/?cmd=pl-ashuffle', { playlist: name } );
			$( '#random' ).data( 'cmd', 'pl-ashuffle-stop' ).addClass( 'btn-primary' );
	} else {
		$.post( '/db/?cmd='+ cmd, { path: name } );
	}
} );

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
		, textalign  : 'center'
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
		var data = data.split( '\n' );
		var bmname = [];
		var bmpath = [];
		$.each( data, function( i, val ) {
			i % 2 ? bmpath.push( val ) : bmname.push( val );
		} );
		var namei = $.inArray( name, bmname );
		if ( namei === -1 ) {
			new PNotify( {
				  icon  : 'fa fa-check'
				, title : oldname ? 'Rename Bookmark' :'Add Bookmark'
				, text  : name
			} );
			tempFlag( 'local' );
			var bmname = name.replace( /"/g, '\"' );
			var bmpath = path.replace( /"/g, '\"' );
			var bmoldname = oldname ? oldname.replace( /"/g, '\"' ) : '';
			var data = bmoldname ? [ bmname, bmpath, bmoldname ] : [ bmname, bmpath ];
			$.post( 'enhance.php', { bkmarks: data }, function() {
				if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) $( '#open-library' ).click();
			} );
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
					name = name.replace( /"/g, '\"' );
					path = path.replace( /"/g, '\"' );
					oldname = oldname ? oldname.replace( /"/g, '\"' ) : '';
					var data = oldname ? [ name, path, oldname ] : [ name, path ];
					$.post( 'enhance.php', { bkmarks: data }, function() {
						renderLibrary();
					} );
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
			$.post( 'enhance.php', { bkmarks: name.replace( /"/g, '\"' ) } );
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
		, textlabel2 : 'URL'
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
	var name = name.replace( /"/g, '\"' );
	var oldname = oldname ? oldname.replace( /"/g, '\"' ) : '';
	var data = oldname ? [ name, url, oldname ] : [ name, url ];
	tempFlag( 'local' );
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
		var namei = $.inArray( name, wrname );
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
			tempFlag( 'local' );
			$.post( 'enhance.php', { webradios: name.replace( /"/g, '\"' ) } );
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
		tempFlag( 'local' );
		$.post( 'enhance.php', { mpc: [ 'rm "'+ oldname.replace( /"/g, '\"' ) +'"', 'save "'+ name.replace( /"/g, '\"' ) +'"' ] } );
	} else {
		new PNotify( {
			  icon  : 'fa fa-check'
			, title : 'Playlist Saved'
			, text  : name
		} );
		$( '#plopen' ).removeClass( 'disable' );
		GUI.lsplaylists.push( name );
		tempFlag( 'local' );
		$.post( 'enhance.php', { mpc: 'save "'+ name.replace( /"/g, '\"' ) +'"' } );
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
	$.post( 'enhance.php', { mpc: 'lsplaylists' }, function( data ) {
		if ( $.inArray( name, data.split( '\n' ) ) === -1 ) {
			oldname ? addPlaylist( name, oldname ) : addPlaylist( name );
		} else {
			info( {
				  icon        : 'warning'
				, title       : oldname ? 'Rename Playlist' : 'Add Playlist'
				, message     : '<white>'+ name +'</white>'
							+'<br>Already exists.'
				, cancellabel : 'Back'
				, cancle      : function() {
					playlistNew();
				}
				, oklabel     : 'Replace'
				, ok          : function() {
					oldname ? addPlaylist( name, oldname ) : addPlaylist( name );
				}
			} );
		}
	}, 'text' );
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
			
			tempFlag( 'local' );
			$.post( 'enhance.php', { mpc: 'rm "'+ name.replace( /"/g, '\"' ) +'"' } );
		}
	} );
}

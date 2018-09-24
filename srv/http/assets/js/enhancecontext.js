$( '.contextmenu a' ).click( function() {
	GUI.dbcurrent = '';
	var cmd = $( this ).data( 'cmd' );
	if ( $.inArray( cmd, [ 'add', 'addplay', 'addreplaceplay' ] ) !== -1 ) {
		var name = GUI.list.path;
		var mpcCmd = GUI.list.isfile ? 'add "'+ name +'"' : 'ls "'+ name +'" | mpc add';
	} else if ( $.inArray( cmd, [ 'wradd', 'wraddplay', 'wraddreplaceplay' ] ) !== -1 ) {
		var name = GUI.list.path;
		cmd = cmd.replace( 'wr', 'pl' );
	} else if ( $.inArray( cmd, [ 'pladd', 'pladdplay', 'pladdreplaceplay' ] ) !== -1 ) {
		var name = GUI.list.name;
	}
	var contextCommand = {
		  add              : mpcCmd
		, addreplace       : [ 'clear', mpcCmd ]
		, addreplaceplay   : [ 'clear', mpcCmd, 'play' ]
		, pladd            : 'load "' + name +'"'
		, plreplace        : [ 'clear', 'load "'+ name +'"' ]
		, pladdreplaceplay : [ 'clear', 'load "'+ name + '"', 'play' ]
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
			if ( !GUI.status.playlistlength ) GUI.status.playlistlength = 1; // flag for renderPlaylist()
			new PNotify( {
				  icon  : 'fa fa-check'
				, title : 'Add to Playlist'
				, text  : GUI.list.name
			} );
			tempFlag( 'local' );
			$.post( 'enhance.php', { mpc: command }, function() {
				if ( !$( '#currentsong' ).text() ) {
					renderPlayback();
					$( '#playback-controls' ).removeClass( 'hide' );
				}
			} );
		}
		return;
	}
	
	if ( cmd === 'plashuffle' ) {
			$.post( '/db/?cmd=pl-ashuffle', { playlist: GUI.list.name } );
			$( '#random' ).data( 'cmd', 'pl-ashuffle-stop' ).addClass( 'btn-primary' );
	} else {
		$.post( '/db/?cmd='+ cmd, { path: GUI.list.path } );
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
			var data = oldname ? [ name, path, oldname ] : [ name, path ];
			$.post( 'enhance.php', { bkmarks: data }, function() {
				renderLibrary();
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
	info( {
		  icon       : 'edit-circle'
		, title      : 'Rename Webradio'
		, width      : 500
		, message    : 'Rename:'
					+'<br><white>'+ GUI.list.name +'</white>'
					+'<br>'+ GUI.list.url
					+'<br>To:'
		, textvalue  : GUI.list.name
		, textalign  : 'center'
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			webRadioVerify( $( '#infoTextBox' ).val().trim(), GUI.list.url, GUI.list.name );
		}
	} );
}
function addWebradio( name, url, oldname ) {
	if ( !oldname ) GUI.libraryhome.webradio++;
	var data = oldname ? [ name, url, oldname ] : [ name, url ];
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
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Webradio'
		, width   : 500
		, message : 'Delete?'
					+'<br><white>'+ GUI.list.name +'</white>'
					+'<br>'+ GUI.list.url
		, cancel  : 1
		, ok      : function() {
			$( '#db-entries li.active').remove();
			GUI.libraryhome.webradio--;
			tempFlag( 'local' );
			$.post( 'enhance.php', { webradios: GUI.list.name } );
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
	info( {
		  icon      : 'edit-circle'
		, title     : 'Rename Playlist'
		, message   : 'Rename:'
					+'<br><white>'+ GUI.list.name +'</white>'
					+'<br>To:'
		, textvalue : GUI.list.name
		, textalign : 'center'
		, boxwidth  : 'max'
		, cancel    : 1
		, ok        : function() {
			playlistVerify( $( '#infoTextBox' ).val().trim(), GUI.list.name );
		}
	} );
}
function addPlaylist( name, oldname ) {
	if ( oldname ) {
		GUI.list.li.find( 'span' ).text( name );
		tempFlag( 'local' );
		$.post( 'enhance.php', { mpc: [ 'rm "'+ oldname +'"', 'save "'+ name +'"' ] } );
	} else {
		new PNotify( {
			  icon  : 'fa fa-check'
			, title : 'Playlist Saved'
			, text  : name
		} );
		$( '#plopen' ).removeClass( 'disable' );
		GUI.lsplaylists.push( name );
		tempFlag( 'local' );
		$.post( 'enhance.php', { mpc: 'save "'+ name +'"' } );
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
	var name = GUI.list.name;
	info( {
		  icon    : 'minus-circle'
		, title   : 'Delete Playlist'
		, message : 'Delete?'
					+'<br><white>'+ name +'</white>'
		, cancel  : 1
		, ok      : function() {
			var count = $( '#pls-count' ).text() - 1;
			$( '#pls-count' ).text( numFormat( count ) );
			if ( !count ) $( '#pl-currentpath' ).html( '<bl>&emsp;PLAYLISTS</bl>' );
			GUI.list.li.remove();
			
			tempFlag( 'local' );
			$.post( 'enhance.php', { mpc: 'rm "'+ name +'"' } );
		}
	} );
}

// single quotes in mpc name arguments - enclosed with double quotes + escape double quotes
// example: mpc save "abc's \"xyz\"" << name.replace( /"/g, '\\"' )

$( '.contextmenu a' ).click( function() {
	$( '.menu' ).addClass( 'hide' );
	var $this = $( this );
	var cmd = $this.data( 'cmd' );
	// playback and update //////////////////////////////////////////
	if ( [ 'play', 'pause', 'stop', 'remove', 'update' ].indexOf( cmd ) !== -1 ) {
		if ( cmd === 'remove' ) {
			GUI.contextmenu = 1;
			setTimeout( function() { GUI.contextmenu = 0 }, 500 );
			removeFromPlaylist( GUI.list.li );
		} else if ( cmd === 'play' ) {
			if ( $( '#pl-entries li.active' ).index() === GUI.list.li.index() ) {
				$( '#play' ).click();
			} else {
				$( '#pl-entries li' ).eq( GUI.list.li.index() ).click();
			}
		} else if ( cmd === 'update' ) {
			$.post( 'enhance.php', { mpc: 'mpc update "'+ GUI.list.path +'"' } );
		} else {
			$( '#'+ cmd ).click();
		}
		return
	}
	// functions with dialogue box ////////////////////////////////////////////
	var contextFunction = {
		  radiosave     : webRadioNew // unsaved webradio (dirble)
		, wrrename      : webRadioRename
		, wrdelete      : webRadioDelete
		, plrename      : playlistRename
		, pldelete      : playlistDelete
		, bookmark      : bookmarkNew
		, thumbnail     : updateThumbnails
	}
	if ( cmd in contextFunction ) {
		if ( cmd === 'radiosave' ) {
			webRadioSave( GUI.list.name, GUI.list.path );
		} else {
			contextFunction[ cmd ]();
		}
		return
	}
	// replaceplay|replace|addplay|add //////////////////////////////////////////
	$( '#db-entries li, #pl-editor li' ).removeClass( 'active' );
	// get name
	if ( GUI.playlist && $( '#pl-currentpath .lipath' ).length ) {
		var name = GUI.list.li.find( '.lipath' ).text().replace( /"/g, '\\"' );
	} else {
		var name = GUI.list.path.replace( /"/g, '\\"' );
	}
	// compose command
	var mpcCmd;
	// must keep order otherwise replaceplay -> play, addplay -> play
	var mode = cmd.replace( /replaceplay|replace|addplay|add/, '' );
	if ( !mode ) {
		if ( GUI.list.index ) { // cue, m3u
			var plfile = GUI.list.path.replace( /"/g, '\\"' );
			mpcCmd = '/srv/http/enhance1cuem3u.sh "'+ plfile +'" '+ GUI.list.index;
		} else if ( name.split( '.' ).pop() === 'pls' ) {
			mpcCmd = 'mpc load "'+ name +'"';
		} else if ( GUI.plugin ) {
			var radioname = GUI.list.name.replace( /"/g, '\\"' );
			mpcCmd = 'mpc add "'+ GUI.list.path +'"; /usr/bin/redis-cli hset webradiopl '+ GUI.list.path +' "*'+ radioname +'<x>'+ GUI.list.img +'</x>"';
		} else {
			mpcCmd = GUI.list.isfile ? 'mpc add "'+ name +'"' : 'mpc ls "'+ name +'" | mpc add';
		}
	} else if ( mode === 'wr' ) {
		cmd = cmd.slice( 2 );
		mpcCmd = 'mpc load "Webradio/'+ GUI.list.name.replace( /"/g, '\\"' ) +'.pls"';
	} else if ( mode === 'pl' ) {
		cmd = cmd.slice( 2 );
		mpcCmd = 'mpc load "'+ name +'"';
	} else { // album|artist|composer|genre
		var artist = GUI.list.artist || $( '#artistalbum span' ).text().replace( /"/g, '\\"' );
		mpcCmd = 'mpc findadd '+ GUI.list.mode +' "'+ name +'"'+ ( artist ? ' artist "'+ artist +'"' : '' );
	}
	cmd = cmd.replace( /album|artist|composer|genre/, '' );
	var contextCommand = {
		  add           : mpcCmd
		, addplay       : [ mpcCmd, 'mpc play '+ ( GUI.status.playlistlength + 1 ) ]
		, replace       : [ 'mpc clear', mpcCmd ]
		, replaceplay   : [ 'mpc clear', mpcCmd, 'mpc play' ]
	}
	if ( cmd in contextCommand ) {
		var command = contextCommand[ cmd ];
		if ( cmd === 'add' ) {
			addReplace( mode, cmd, command, 'Add to Playlist' );
		} else if ( cmd === 'addplay' ) {
			addReplace( mode, cmd, command, 'Add to Playlist + Play' );
		} else {
			if ( GUI.display.plclear && GUI.status.playlistlength ) {
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
	} else if ( cmd === 'plashuffle' ) {
		$.post( 'enhance.php', { bash: '/usr/local/bin/ashuffle -f /var/lib/mpd/playlists/'+ name +'.m3u &' } );
		$( '#random' ).addClass( 'btn-primary ashuffle' );
		new PNotify( {
			  title : 'Random Play'
			, text  : name
		} );
	}
} );

function updateThumbnails() {
	// enclosed in single quotes + escape inside single quotes: "'/path/file'\'"\'"\''s name'" <=> /path/file's name
	var path = "'/mnt/MPD/"+ GUI.list.path.replace( /'/g, '\'"\'"\'' ) +"'";
	info( {
		  icon     : 'coverart'
		, title    : 'Coverart Thumbnails Update'
		, message  : 'Update thumbnails for Browse By CoverArt'
		, checkbox : { 'Remove existings': 1 }
		, cancel   : 1
		, ok       : function() {
			$( 'body' ).append(
				'<form id="formtemp" action="addonsbash.php" method="post">'
					+'<input type="hidden" name="alias" value="cove">'
					+'<input type="hidden" name="type" value="scan">'
					+'<input type="hidden" name="opt">'
				+'</form>' );
			if ( $( '#infoCheckBox input[ type=checkbox ]:checked' ).length ) path += ' 1';
			$( '#formtemp input[ name=opt ]' ).val( path );
			$( '#formtemp' ).submit();
		}
	} );
}
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
		, msgalign   : 'center'
		, textvalue  : name
		, textalign  : 'center'
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
			bookmarkVerify( $( '#infoTextBox' ).val(), path );
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
		, msgalign  : 'center'
		, textvalue : name
		, textalign : 'center'
		, boxwidth  : 'max'
		, cancel    : 1
		, oklabel   : 'Rename'
		, ok        : function() {
			bookmarkVerify( $( '#infoTextBox' ).val(), path, name );
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
				setTimeout( function() {
					oldname ? bookmarkRename( oldname, path ) : bookmarkNew( path );
				}, 300 );
			}
		} );
		return;
	}
	var $bllabel = $( '.home-block' ).filter( function() {
		return $( this ).find( '.label' ).text() === name;
	} );
	if ( !$bllabel.length ) {
		if ( !oldname ) {
			new PNotify( {
				  title : 'Add Bookmark'
				, text  : name
			} );
		} else {
			$( '.home-block' ).filter( function() {
				return $( this ).find( '.label' ).text() === oldname;
			} ).find( '.label' ).text( name );
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
						+'<br><w>'+ $bllabel.find( '.lipath' ).text() +'</w>'
			, msgalign    : 'center'
			, cancellabel : 'Back'
			, cancel      : function() {
				setTimeout( function() {
					oldname ? bookmarkRename( name, path ) : bookmarkNew();
				}, 300 );
			}
			, oklabel     : 'Replace'
			, ok          : function() {
				var data = oldname ? [ name, path, oldname ] : [ name, path ];
				$.post( 'enhance.php', { bkmarks: data } );
			}
		} );
	}
}
function bookmarkDelete( name, $block ) {
	var src = $block.find( 'img' ).attr( 'src' );
	if ( src ) {
		var icon = '<img src="'+ src +'">'
				  +'<br>'+ name
				  +'<br>&nbsp';
	} else {
		var icon = '<div class="infobookmark"><i class="fa fa-bookmark"></i><br><span class="bklabel">'+ $block.find( '.bklabel' ).text() +'</span></div>'
				  +'<br>&nbsp';
	}
	info( {
		  icon     : 'minus-circle'
		, title    : 'Remove Bookmark'
		, message  : 'Remove?'
					+'<br>'+ icon
		, msgalign : 'center'
		, checkbox : src ? { 'Keep thumbnail file': 1 } : ''
		, cancel   : 1
		, oklabel  : 'Delete'
		, ok       : function() {
			GUI.bookmarkedit = 1;
			$block.parent().remove();
			if ( $( '#infoCheckBox input[ type=checkbox ]:checked' ).length ) {
				var path = '';
		
			} else {
				var path = $block.find( '.lipath' ).text().replace( /"/g, '\"' );
			}
			$.post( 'enhance.php', { bkmarks: name, thumbnail: path } );
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
			webRadioVerify( $( '#infoTextBox' ).val(), $( '#infoTextBox2' ).val() );
		}
	} );
}
function webRadioSave( name, url ) {
	if ( name.slice( -4 ) === '</x>' ) {
		var nameimg = name.split( '<x>' );
		var stationname = nameimg[ 0 ];
		var stationimg = '<x>'+ nameimg[ 1 ];
	} else {
		var stationname = name;
		var stationimg = '';
	}
	info( {
		  icon       : 'save'
		, title      : 'Save In Webradio'
		, width      : 500
		, message    : 'Save URL:'
					  +'<br><w>'+ url +'</w>'
		, msgalign   : 'center'
		, textlabel  : 'As'
		, textvalue  : stationname
		, textalign  : 'center'
		, boxwidth   : 'max'
		, cancel     : 1
		, ok         : function() {
		webRadioVerify( $( '#infoTextBox' ).val() + stationimg, url, '', 'save' );
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
		, msgalign   : 'center'
		, textvalue  : name
		, textalign  : 'center'
		, boxwidth   : 'max'
		, cancel     : 1
		, oklabel    : 'Rename'
		, ok         : function() {
			webRadioVerify( $( '#infoTextBox' ).val(), path, name );
		}
	} );
}
function addWebradio( name, url, oldname ) {
	var name = name;
	var oldname = oldname ? oldname : '';
	var data = oldname ? [ name, url, oldname ] : [ name, url ];
	$.post( 'enhance.php', { webradios: data } );
}
function webRadioVerify( name, url, oldname, save ) {
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
	$.post( 'enhance.php', { getwebradios: 1 }, function( data ) {
		var dataL = data.length;
		for ( i = 0; i < dataL; i++ ) {
			list = data[ i ];
			if ( list.index ) continue
			
			var dbname = list.playlist.replace( /Webradio\/|\\|.pls$/g, '' );
			if ( dbname === name ) {
				info( {
					  icon        : 'warning'
					, title       : oldname ? 'Rename Webradio' : 'Add Webradio'
					, width       : 500
					, message     : '<white>'+ name +'</white>'
								+'<br>Already exists for:'
								+'<br><w>'+ list.url +'</w>'
					, msgalign    : 'center'
					, cancellabel : 'Back'
					, cancel      : function() {
						setTimeout( function() {
							save ? webRadioSave( name, url ) : webRadioNew( name, url );
						}, 300 );
					}
					, oklabel     : 'Replace'
					, ok          : function() {
						oldname ? addWebradio( name, url, oldname ) : addWebradio( name, url )
					}
				} );
				var exist = 1;
				return
			}
			
			if ( i === dataL ) oldname ? addWebradio( name, url, oldname ) : addWebradio( name, url );
		}
	}, 'json' );
}
function webRadioDelete() {
	var name = GUI.list.name;
	info( {
		  icon     : 'minus-circle'
		, title    : 'Delete Webradio'
		, width    : 500
		, message  : 'Delete?'
					+'<br><white>'+ name +'</white>'
					+'<br>'+ GUI.list.path
		, msgalign : 'center'
		, cancel   : 1
		, oklabel  : 'Delete'
		, ok       : function() {
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
			playlistVerify( $( '#infoTextBox' ).val() );
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
		, msgalign  : 'center'
		, textvalue : name
		, textalign : 'center'
		, boxwidth  : 'max'
		, cancel    : 1
		, oklabel   : 'Rename'
		, ok        : function() {
			playlistVerify( $( '#infoTextBox' ).val(), name );
		}
	} );
}
function addPlaylist( name, oldname ) {
	if ( oldname ) {
		var oldfile = ' "/var/lib/mpd/playlists/'+ oldname.replace( /"/g, '\\"' ) +'.m3u"';
		var newfile = ' "/var/lib/mpd/playlists/'+ name.replace( /"/g, '\\"' ) +'.m3u"';
		$.post( 'enhance.php', { bash: '/usr/bin/mv'+ oldfile + newfile } );
	} else {
		new PNotify( {
			  title : 'Playlist Saved'
			, text  : name
		} );
		$( '#plopen' ).removeClass( 'disable' );
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
				, msgalign    : 'center'
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
		  icon     : 'minus-circle'
		, title    : 'Delete Playlist'
		, message  : 'Delete?'
					+'<br><white>'+ GUI.list.name +'</white>'
		, msgalign : 'center'
		, cancel   : 1
		, oklabel  : 'Delete'
		, ok       : function() {
			var count = $( '#pls-count' ).text() - 1;
			$( '#pls-count' ).text( numFormat( count ) );
			if ( !count ) $( '#pl-currentpath' ).html( '<bl>&emsp;PLAYLISTS</bl>' );
			GUI.list.li.remove();
			$.post( 'enhance.php', { mpc: 'mpc rm "'+ GUI.list.name.replace( /"/g, '\\"' ) +'"' } );
		}
	} );
}

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
		, wrcoverart    : webRadioCoverart
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
		} else if ( GUI.plugin ) { // unsaved dirble ( * in front of name for class indicator)
			var pathname = GUI.list.path.replace( /\//g, '|' );
			mpcCmd = 'mpc add "'+ GUI.list.path +'"'
					+'; /usr/bin/echo -e "*'+ GUI.list.name +'\n'+ GUI.list.img +'" > "/srv/http/assets/img/webradiopl/'+ pathname +'"';
		} else {
			mpcCmd = GUI.list.isfile ? 'mpc add "'+ name +'"' : 'mpc ls "'+ name +'" | mpc add';
		}
	} else if ( mode === 'wr' ) {
		cmd = cmd.slice( 2 );
		mpcCmd = 'mpc add "'+ GUI.list.path.replace( /"/g, '\\"' ) +'"';
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
	$.post( 'enhancegetcover.php', { path: path }, function( base64img ) {
		var $img = '<br><img src="'+ base64img +'">';
		var infodata = {
			  icon      : 'bookmark'
			, title     : 'Add Bookmark'
			, width     : 500
			, message   : 'Bookmark'
						 +'<br><img src="'+ base64img +'">'
			, msgalign  : 'center'
			, textalign : 'center'
			, boxwidth  : 'max'
			, cancel    : 1
			, ok        : function() {
				$.post( 'enhance.php', { bkmarks: [ path, 1 ], base64: base64img }, function( data ) {
					console.log(data)
				} );
				new PNotify( {
					  title : 'Add Bookmark'
					, text  : path
				} );
			}
		}
		if ( !base64img ) {
			infodata.message   = 'Bookmark'
							+'<br><white>'+ path +'</white>'
							+'<br>As:';
			infodata.textvalue = name;
			infodata.textalign = 'center';
			infodata.ok        =  function() {
				$.post( 'enhance.php', { bkmarks: [ path, $( '#infoTextBox' ).val() ] } );
				new PNotify( {
					  title : 'Add Bookmark'
					, text  : path
				} );
			}
		}
		info( infodata );
	} );
}
function bookmarkRename( name, path, $block ) {
	info( {
		  icon      : 'bookmark'
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
			var newname = $( '#infoTextBox' ).val();
			$.post( 'enhance.php', { bkmarks: [ path, newname, name ] } );
			$block.find( '.bklabel' ).text( newname );
		}
	} );
}
function bookmarkDelete( path, name, $block ) {
	var $img = $block.find( 'img' );
	var src = $img.attr( 'src' );
	if ( src ) {
		var icon = '<img src="'+ src +'">'
	} else {
		var icon = '<div class="infobookmark">'
					+'<i class="fa fa-bookmark"></i><span class="bklabel">'+ name +'</span>'
				  +'</div>'
	}
	info( {
		  icon     : 'bookmark'
		, title    : 'Remove Bookmark'
		, message  : 'Remove?'
					+'<br>'+ icon
		, msgalign : 'center'
		, cancel   : 1
		, oklabel  : 'Remove'
		, ok       : function() {
			GUI.bookmarkedit = 1;
			$.post( 'enhance.php', { bkmarks: [ path, '', name ] } );
			$block.parent().remove();
		}
	} );
}
function webRadioCoverart() {
	var name = GUI.list.name;
	var path = GUI.list.path;
	var pathname = path.replace( /\//g, '|' );
	var webradiopath = '/srv/http/assets/img/webradios';
	$.post( 'enhance.php', { bash: '/usr/bin/cat "'+ webradiopath +'/'+ pathname +'"' }, function( data ) {
		var stationimg = data.split( "\n" )[ 1 ];
		if ( stationimg ) {
			var $img = '<img src="'+ stationimg +'">';
		} else {
			var $img = '<img src="'+ vu +'" style="border-radius: 9px">';
		}
		info( {
			  icon        : 'webradio'
			, title       : 'Change Coverart'
			, message     : 'Replace:'
						   +'<br>'+ $img
						   +'<span class="bkname"><br>'+ name +'<span>'
			, msgalign    : 'center'
			, fileoklabel : 'Replace'
			, cancel      : 1
			, ok          : function() {
				var webradiofile = '/srv/http/asset/img/webradiocoverarts/'+ path.replace( /\//g, '|' ) +'.jpg';
				var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
				$.post( 'enhance.php', { imagefile: webradiofile, name: name, base64: newimg } );
			}
		} );
	} );
}
function webRadioNew( name, url ) {
	info( {
		  icon       : 'webradio'
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
		var stationimg = '<x>'+ nameimg[ 1 ]; // <x>http://stationimg/url</x>
	} else {
		var stationname = name;
		var stationimg = '';
	}
	info( {
		  icon       : 'webradio'
		, title      : 'Save Webradio'
		, width      : 500
		, message    : 'Save URL:'
					  +'<br><w>'+ url +'</w>'
					  +'<br>As:'
		, msgalign   : 'center'
		, textlabel  : ''
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
		  icon       : 'webradio'
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
function webRadioVerify( name, url, oldname, save ) {
	if ( !name || !url ) {
		info( {
			  icon    : 'webradio'
			, title   : oldname ? 'Rename Webradio' : 'Add Webradio'
			, message : '<i class="fa fa-warning"></i></white>Name</white> and <white>URL</white> cannot be blank.'
			, ok      : function() {
				webRadioNew( name, url );
			}
		} );
		return;
	}
	$.post( 'enhance.php', { getwebradios: 1 }, function( data ) {
		var dataL = data.length - 1; // last one is index
		for ( i = 0; i < dataL; i++ ) {
			list = data[ i ];
			if ( list.url === url ) {
				info( {
					  icon        : 'webradio'
					, title       : oldname ? 'Rename Webradio' : 'Add Webradio'
					, width       : 500
					, message     : '<i class="fa fa-warning"></i><w>'+ url +'</w>'
								   +'<br>Already exists as:'
								   +'<br><w>'+ list.webradio +'</w>'
					, msgalign    : 'center'
					, cancellabel : 'Back'
					, cancel      : function() {
						setTimeout( function() {
							save ? webRadioSave( name, url ) : webRadioNew( name, url );
						}, 300 );
					}
					, oklabel     : 'Replace'
					, ok          : function() {
						$.post( 'enhance.php', { webradios: [ url, name, ( oldname ? oldname : '' ) ] } );
					}
				} );
				return
			}
			if ( i === dataL ) $.post( 'enhance.php', { webradios: [ url, name, ( oldname ? oldname : '' ) ] } );
		}
	}, 'json' );
}
function webRadioDelete() {
	var name = GUI.list.name;
	var path = GUI.list.path;
	info( {
		  icon     : 'webradio'
		, title    : 'Delete Webradio'
		, width    : 500
		, message  : 'Delete?'
					+'<br><white>'+ name +'</white>'
					+'<br>'+ path
		, msgalign : 'center'
		, cancel   : 1
		, oklabel  : 'Delete'
		, ok       : function() {
			$.post( 'enhance.php', { webradios: [ path, '', name ] } );
		}
	} );
}
function playlistNew() {
	info( {
		  icon      : 'list-ul'
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
		  icon      : 'list-ul'
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
			  icon    : 'list-ul'
			, title   : oldname ? 'Rename Playlist' : 'Add Playlist'
			, message : '<i class="fa fa-warning"></i><white>Name</white> cannot be blank.'
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
				  icon        : 'list-ul'
				, title       : oldname ? 'Rename Playlist' : 'Add Playlist'
				, message     : '<i class="fa fa-warning"></i><white>'+ name +'</white>'
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
		  icon     : 'list-ul'
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

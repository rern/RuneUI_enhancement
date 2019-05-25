// single quotes in mpc name arguments - enclosed with double quotes + escape double quotes
// example: mpc save "abc's \"xyz\"" << name.replace( /"/g, '\\"' )

$( '.contextmenu a' ).click( function() {
	var $this = $( this );
	var cmd = $this.data( 'cmd' );
	$( '.menu' ).addClass( 'hide' );
	if ( cmd !== 'update' ) $( '#db-entries li, #pl-entries li' ).removeClass( 'active' );
	$( 'li.updn' ).removeClass( 'updn' );
	// playback //////////////////////////////////////////////////////////////
	if ( [ 'play', 'pause', 'stop' ].indexOf( cmd ) !== -1 ) {
		if ( cmd === 'play' ) {
			if ( $( '#pl-entries li.active' ).index() === GUI.list.li.index() ) {
				$( '#play' ).click();
			} else {
				$( '#pl-entries li' ).eq( GUI.list.li.index() ).click();
			}
		} else {
			$( '#'+ cmd ).click();
		}
		return
	}
	
	if ( [ 'radiosave', 'update', 'tag', 'remove', 'savedpladd', 'savedplremove' ].indexOf( cmd ) !== -1 ) {
		if ( cmd === 'radiosave' ) { // unsaved webradio (dirble)
			webRadioSave( GUI.list.name, GUI.list.path );
		} else if ( cmd === 'update' ) {
			$( '#db-entries li.active .db-icon' ).addClass( 'blink' );
			$.post( 'enhance.php', { mpc: 'mpc update "'+ GUI.list.path +'"' }, getUpdateStatus );
		} else if ( cmd === 'tag' ) {
			setTag();
		} else if ( cmd === 'remove' ) {
			GUI.contextmenu = 1;
			setTimeout( function() { GUI.contextmenu = 0 }, 500 );
			removeFromPlaylist( GUI.list.li );
		} else if ( cmd === 'savedpladd' ) {
			GUI.plappend = {
				  file  : GUI.list.path
				, index : GUI.list.index
			}
			info( {
				  icon    : 'list-ul'
				, title   : 'Add to playlist'
				, message : 'Select playlist to add:'
						   +'<br><w>'+ GUI.list.name +'</w>'
				, cancel  : function() {
					GUI.plappend = '';
				}
				, ok      : function() {
					$( '#plopen' ).click();
				}
			} );
		} else if ( cmd === 'savedplremove' ) {
			var plline = GUI.list.li.index() + 1;
			var plname = $( '#pl-currentpath .lipath' ).text();
			$.post( 'enhance.php', { bash: '/usr/bin/sed -i "'+ plline +' d" "/srv/http/assets/img/playlists/'+ plname +'"' } );
			GUI.list.li.remove();
		}
		return
	}
	
	// functions with dialogue box ////////////////////////////////////////////
	var contextFunction = {
		  wrrename      : webRadioRename
		, wrcoverart    : webRadioCoverart
		, wrdelete      : webRadioDelete
		, plrename      : playlistRename
		, pldelete      : playlistDelete
		, bookmark      : bookmarkNew
		, thumbnail     : updateThumbnails
	}
	if ( cmd in contextFunction ) {
		contextFunction[ cmd ]();
		return
	}
	
	// replaceplay|replace|addplay|add //////////////////////////////////////////
	var name = ( GUI.browsemode === 'coverart' && !GUI.list.isfile ) ? GUI.list.name : GUI.list.path;
	name = name.replace( /"/g, '\\"' );
	// compose command
	var mpcCmd;
	// must keep order otherwise replaceplay -> play, addplay -> play
	var mode = cmd.replace( /replaceplay|replace|addplay|add/, '' );
	if ( [ 'album', 'artist', 'composer', 'genre' ].indexOf( GUI.list.mode ) !== -1 ) {
		var artist = GUI.list.artist;
		mpcCmd = 'mpc findadd '+ GUI.list.mode +' "'+ name +'"'+ ( artist ? ' artist "'+ artist +'"' : '' );
	} else if ( !mode ) {
		var ext = name.split( '.' ).pop();
		if ( ext === 'cue' && GUI.list.index ) { // cue
			var plfile = GUI.list.path.replace( /"/g, '\\"' );
			mpcCmd = '/srv/http/enhance1cue.sh "'+ plfile +'" '+ GUI.list.index;
		} else if ( ext === 'cue' || ext === 'pls' ) {
			mpcCmd = 'mpc load "'+ name +'"';
		} else if ( GUI.plugin ) { // unsaved dirble ( * in front of name for class indicator)
			var pathname = GUI.list.path.replace( /\//g, '|' );
			pathname = pathname.replace( /"/g, '\\"' );
			var namepl = GUI.list.name.replace( /"/g, '\\"' );
			if ( GUI.list.img ) namepl += '\n'+ GUI.list.thumb +'\n'+ GUI.list.img;
			mpcCmd = 'mpc add "'+ GUI.list.path +'"'
					+'; /usr/bin/echo -en "*'+ namepl +'" > "/srv/http/assets/img/webradiopl/'+ pathname +'"';
		} else {
			mpcCmd = GUI.list.isfile ? 'mpc add "'+ name +'"' : 'mpc ls "'+ name +'" | mpc add';
		}
	} else if ( mode === 'wr' ) {
		cmd = cmd.slice( 2 );
		mpcCmd = 'mpc add "'+ GUI.list.path.replace( /"/g, '\\"' ) +'"';
	} else if ( mode === 'pl' ) {
		cmd = cmd.slice( 2 );
		if ( GUI.library ) {
			mpcCmd = 'mpc load "'+ name +'"';
		} else { // saved playlist
			var play = cmd.slice( -1 ) === 'y' ? 1 : 0;
			var replace = cmd.slice( 0, 1 ) === 'r' ? 1 : 0;
			$.post( 'enhance.php', { loadplaylist: name, play: play, replace: replace }, function() {
				notify( ( replace ? 'Playlist Replaced' : 'Playlist Added' ), name, 'list-ul' );
			} );
			return
		}
	}
	cmd = cmd.replace( /album|artist|composer|genre/, '' );
	var contextCommand = {
		  add           : mpcCmd
		, addplay       : [ mpcCmd, 'sleep 1', 'mpc play '+ ( GUI.status.playlistlength + 1 ) ]
		, replace       : [ 'mpc clear', mpcCmd ]
		, replaceplay   : [ 'mpc clear', mpcCmd, 'sleep 1', 'mpc play' ]
	}
	if ( cmd in contextCommand ) {
		var command = contextCommand[ cmd ];
		if ( cmd === 'add' ) {
			addReplace( mode, cmd, command, 'Added to Playlist' );
		} else if ( cmd === 'addplay' ) {
			addReplace( mode, cmd, command, 'Added to Playlist + Play' );
		} else {
			if ( GUI.display.plclear && GUI.status.playlistlength ) {
				info( {
					  title   : 'Replace Playlist'
					, message : 'Replace current Playlist?'
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
		notify( 'Random Play Enabled', name, 'random' );
	}
} );

function updateThumbnails() {
	// enclosed in double quotes entity &quot;
	var path = '&quot;/mnt/MPD/'+ GUI.list.path.replace( /"/g, '\"' ) +'&quot;';
	info( {
		  icon     : 'coverart'
		, title    : 'Coverart Thumbnails Update'
		, message  : 'Update thumbnails in:'
					+'<br><w>'+ GUI.list.path +'</w>'
					+'<br>&nbsp;'
		, checkbox : {
			  'Replace existings'       : 1
			, 'Update Library database' : 1
		}
		, ok       : function() {
			$( 'body' ).append(
				'<form id="formtemp" action="addonsbash.php" method="post">'
					+'<input type="hidden" name="alias" value="cove">'
					+'<input type="hidden" name="type" value="scan">'
				+'</form>' );
			$( '#infoCheckBox input' ).each( function() {
				path += $( this ).prop( 'checked' ) ? ' 1': ' 0';
			} );
			$( '#formtemp' )
				.append( '<input type="hidden" name="opt" value="'+ path +'">' )
				.submit();
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
			var artist = $( '#artistalbum span' ).text();
			var msg = GUI.list.name + ( artist ? ' • '+ artist : '' );
			notify( title, msg, 'list-ul' );
			if ( cmd === 'replace' ) GUI.plreplace = 1;
			getPlaybackStatus();
		}
	} );
}
function bookmarkNew() {
	var path = GUI.list.path;
	var name = path.split( '/' ).pop();
	var $el = $( '.home-bookmark' );
	if ( $el.length ) {
		$el.each( function() {
			var $this = $( this );
			if ( $this.find( '.lipath' ).text() === path ) {
				var $img = $this.find( 'img' );
				if ( $img.length ) {
					var iconhtml = '<img src="'+ $img.attr( 'src' ) +'">'
								  +'<br><w>'+ path +'</w>';
				} else {
					var iconhtml = '<i class="fa fa-bookmark bookmark"></i>'
								  +'<br><a class="bklabel">'+ $this.find( '.bklabel' ).text() +'</a>'
								  + path;
				}
				info( {
					  icon    : 'bookmark'
					, title   : 'Add Bookmark'
					, message : iconhtml
							   +'<br><br>Already exists.'
				} );
				return false
			}
		} );
	}
	$.post( 'enhancegetcover.php', { path: path }, function( base64img ) {
		if ( base64img ) {
			info( {
				  icon    : 'bookmark'
				, title   : 'Add Bookmark'
				, message : '<img src="'+ base64img +'">'
						   +'<br><w>'+ path +'</w>'
				, ok      : function() {
					$.post( 'enhance.php', { bookmarks: 1, path: path, base64: base64img, new: 1 } );
					notify( 'Bookmark Added', path, 'bookmark' );
				}
			} );
		} else {
			info( {
				  icon         : 'bookmark'
				, title        : 'Add Bookmark'
				, width        : 500
				, message      : '<i class="fa fa-bookmark bookmark"></i>'
								+'<br>'
								+'<br><w>'+ path +'</w>'
								+'<br>As:'
				, textvalue    : name
				, textrequired : 0
				, boxwidth     : 'max'
				, textalign    : 'center'
				, ok           : function() {
					$.post( 'enhance.php', { bookmarks: $( '#infoTextBox' ).val(), path: path, new: 1 } );
					notify( 'Bookmark Added', path, 'bookmark' );
				}
			} );
		}
	} );
}
function bookmarkRename( name, path, $block ) {
	info( {
		  icon         : 'bookmark'
		, title        : 'Rename Bookmark'
		, width        : 500
		, message      : '<i class="fa fa-bookmark bookmark"></i>'
						+'<br><a class="bklabel">'+ name +'</a>'
						+'To:'
		, textvalue    : name
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, oklabel      : 'Rename'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			$.post( 'enhance.php', { bookmarks: newname, path: path, rename: 1 } );
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
		var icon = '<i class="fa fa-bookmark bookmark"></i>'
				  +'<br><a class="bklabel">'+ name +'</a>'
	}
	info( {
		  icon    : 'bookmark'
		, title   : 'Remove Bookmark'
		, message : icon
		, oklabel : 'Remove'
		, ok      : function() {
			GUI.bookmarkedit = 1;
			$.post( 'enhance.php', { bookmarks: name, path: path, delete: 1 } );
			$block.parent().remove();
		}
	} );
}
function removeRadioCoverart() {
	var name = GUI.list.name;
	var urlname = GUI.list.path.replace( /\//g, '|' );
	info( {
		  icon        : 'webradio'
		, title       : 'Remove Coverart'
		, message     : '<img src="'+ $( '#cover-art' ).prop( 'src' ) +'">'
					   +'<span class="bkname"><br><w>'+ name +'</w><span>'
		, ok          : function() {
			$.post( 'enhance.php', { bash: '/usr/bin/echo "'+ name +'" > "/srv/http/assets/img/webradios/'+ urlname +'"' } );
			$( '#cover-art' ).attr( 'src', GUI.status.state === 'play' ? vu : vustop );
		}
	} );
}
function webRadioCoverart() {
	var urlname = GUI.list.path.replace( /\//g, '|' );
	$.post( 'enhance.php', { bash: '/usr/bin/cat "/srv/http/assets/img/webradios/'+ urlname +'"' }, function( data ) {
		var nameimg = data.split( "\n" );
		var name = nameimg[ 0 ];
		var img = nameimg[ 2 ];
		var $img = img ? '<img src="'+ img +'">' : '<img src="'+ vu +'" style="border-radius: 9px">';
		var infojson = {
			  icon        : 'webradio'
			, title       : 'Change Coverart'
			, message     : ( img ? '<img src="'+ img +'">' : '<img src="'+ vu +'" style="border-radius: 9px">' )
						   +'<span class="bkname"><br><w>'+ name +'</w><span>'
			, fileoklabel : 'Replace'
			, ok         : function() {
				var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
				var picacanvas = document.createElement( 'canvas' );
				picacanvas.width = picacanvas.height = 80;
				pica.resize( $( '#infoMessage .newimg' )[ 0 ], picacanvas, picaOption ).then( function() {
					var newthumb = picacanvas.toDataURL( 'image/jpeg', 0.9 );
					$.post( 'enhance.php', { imagefile: urlname, base64webradio: name +'\n'+ newthumb +'\n'+ newimg }, function( result ) {
						if ( result != -1 ) {
							if ( GUI.playback ) {
								$( '#cover-art' ).attr( 'src', newimg );
							} else {
								$( '#db-entries li.active' ).find( '.db-icon' ).remove();
								$( '#db-entries li.active' ).find( '.lisort' ).after( '<img class="radiothumb db-icon" src="'+ newthumb +'" data-target="#context-menu-radio">' );
							}
						} else {
							info( {
								  icon    : 'webradio'
								, title   : 'Change Coverart'
								, message : '<i class="fa fa-warning"></i>Upload image failed.'
							} );
						}
					} );
				} );
			}
		}
		if ( img ) {
			infojson.buttonlabel = 'Remove'
			infojson.buttoncolor = '#0095d8'
			infojson.button      = function() {
				$.post( 'enhance.php', { bash: '/usr/bin/echo "'+ name +'" > "/srv/http/assets/img/webradios/'+ urlname +'"' } );
				if ( GUI.playback ) {
					$( '#cover-art' ).attr( 'src', GUI.status.state === 'play' ? vu : vustop );
				} else {
					$( '#db-entries li.active' ).find( 'img' ).remove();
					$( '#db-entries li.active' ).find( '.lisort' ).after( '<i class="fa fa-webradio db-icon" data-target="#context-menu-webradio"></i>' );
				}
			}
		}
		info( infojson );
	} );
}
function webRadioSave( name, url ) {
	var urlname = url.replace( /\//g, '|' );
	$.post( 'enhance.php', { bash: '/usr/bin/cat "/srv/http/assets/img/webradios/'+ urlname +'"' }, function( data ) {
		if ( data ) {
			var nameimg = data.split( "\n" );
			info( {
				  icon    : 'webradio'
				, title   : 'Save Webradio'
				, message : ( nameimg[ 2 ] ? '<br><img src="'+ nameimg[ 2 ] +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
						   +'<br><w>'+ nameimg[ 0 ] +'</w>'
						   +'<br>'+ url
						   +'<br>Already exists.'
			} );
			return false
		}
	} );
	var $li = GUI.library ? $( '#db-entries li.active' ) : $( '#pl-entries li.active' );
	var thumb = GUI.list.thumb;
	var img = GUI.list.img;
	info( {
		  icon         : 'webradio'
		, title        : 'Save Webradio'
		, width        : 500
		, message      : ( img ? '<br><img src="'+ img +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
						+'<br><w>'+ url +'</w>'
						+'<br>As:'
		, textlabel    : ''
		, textvalue    : name
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			notify( 'Webradio saved', newname, 'webradio' );
			if ( thumb ) newname += "\n"+ thumb +"\n"+ img;
			$.post( 'enhance.php', { webradios: newname, url: url, save: 1 } );
		}
	} );
}
function webRadioNew( name, url ) {
	info( {
		  icon         : 'webradio'
		, title        : 'Add Webradio'
		, width        : 500
		, message      : 'Add new Webradio:'
		, textlabel    : [ 'Name', 'URL' ]
		, textvalue    : [ ( name || '' ), ( url || '' ) ]
		, textrequired : [ 0, 1 ]
		, textalign    : 'center'
		, boxwidth     : 'max'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			var url = $( '#infoTextBox2' ).val();
			$.post( 'enhance.php', { webradios: newname, url: url, new: 1 }, function( exist ) {
				if ( exist ) {
					var nameimg = exist.split( "\n" );
					info( {
						  icon    : 'webradio'
						, title   : 'Add Webradio'
						, message : ( nameimg[ 2 ] ? '<img src="'+ nameimg[ 2 ] +'">' : '<i class="fa fa-webradio bookmark"></i>' )
								   +'<br><w>'+ nameimg[ 0 ] +'</w>'
								   +'<br>'+ url
								   +'<br>Already exists.'
						, ok      : function() {
							webRadioNew( newname, url );
						}
					} );
				}
			} );
		}
	} );
}
function webRadioRename() {
	var name = GUI.list.name;
	var url = GUI.list.path;
	var urlname = url.replace( /\//g, '|' );
	$.post( 'enhance.php', { bash: '/usr/bin/cat "/srv/http/assets/img/webradios/'+ urlname +'"' }, function( data ) {
		var nameimg = data.split( "\n" );
		info( {
			  icon         : 'webradio'
			, title        : 'Rename Webradio'
			, width        : 500
			, message      : ( nameimg[ 2 ] ? '<br><img src="'+ nameimg[ 2 ] +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
							+'<br><w>'+ nameimg[ 0 ] +'</w>'
							+'<br>'+ url
							+'<br>To:'
			, textvalue    : name
			, textrequired : 0
			, textalign    : 'center'
			, boxwidth     : 'max'
			, oklabel      : 'Rename'
			, ok           : function() {
				var newname = $( '#infoTextBox' ).val();
				$.post( 'enhance.php', { webradios: newname, url: url, rename: 1 } );
			}
		} );
	} );
}
function webRadioDelete() {
	var name = GUI.list.name;
	var url = GUI.list.path;
	var urlname = url.replace( /\//g, '|' );
	$.post( 'enhance.php', { bash: '/usr/bin/cat "/srv/http/assets/img/webradios/'+ urlname +'"' }, function( data ) {
		var nameimg = data.split( "\n" );
		info( {
			  icon    : 'webradio'
			, title   : 'Delete Webradio'
			, width   : 500
			, message : ( nameimg[ 2 ] ? '<br><img src="'+ nameimg[ 2 ] +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
					   +'<br><w>'+ nameimg[ 0 ] +'</w>'
					   +'<br>'+ url
			, oklabel : 'Delete'
			, ok      : function() {
				$.post( 'enhance.php', { webradios: name, url: url, delete: 1 } );
			}
		} );
	} );
}
function playlistNew() {
	info( {
		  icon         : 'list-ul'
		, title        : 'Add Playlist'
		, message      : 'Save current playlist as:'
		, textlabel    : 'Name'
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, ok           : function() {
			playlistVerify( $( '#infoTextBox' ).val() );
		}
	} );
}
function playlistRename() {
	var name = GUI.list.name;
	info( {
		  icon         : 'list-ul'
		, title        : 'Rename Playlist'
		, message      : 'Rename:'
						+'<br><w>'+ name +'</w>'
						+'<br>To:'
		, textvalue    : name
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, oklabel      : 'Rename'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			playlistVerify( newname, name );
			GUI.list.li.find( '.plname' ).text( newname );
		}
	} );
}
function addPlaylist( name, oldname ) {
	if ( oldname ) {
		var path = '/srv/http/assets/img/playlists/'
		var oldfile = path + oldname.replace( /"/g, '\\"' );
		var newfile = path + name.replace( /"/g, '\\"' );
		$.post( 'enhance.php', { bash: '/usr/bin/mv "'+ oldfile +'" "'+ newfile +'"' } );
	} else {
		$.post( 'enhance.php', { saveplaylist: name.replace( /"/g, '\\"' ) } );
		notify( 'Playlist Saved', name, 'list-ul' );
		$( '#plopen' ).removeClass( 'disable' );
	}
}
function playlistVerify( name, oldname ) {
	if ( !name ) {
		info( {
			  icon    : 'list-ul'
			, title   : oldname ? 'Rename Playlist' : 'Add Playlist'
			, message : '<i class="fa fa-warning"></i><w>Name</w> cannot be blank.'
			, ok      : playlistNew
		} );
		return;
	}
	$.post( 'enhance.php', { getplaylist: 1, lsplaylists: 1 }, function( data ) {
		var exist = 0;
		$.each( data, function( i, value ) {
			if ( value.name === name ) {
				exist = 1;
				return false
			}
		} );
		if ( !exist ) {
			oldname ? addPlaylist( name, oldname ) : addPlaylist( name );
		} else {
			info( {
				  icon        : 'list-ul'
				, title       : oldname ? 'Rename Playlist' : 'Add Playlist'
				, message     : '<i class="fa fa-warning"></i><w>'+ name +'</w>'
							   +'<br>Already exists.'
				, buttonlabel : 'Back'
				, button      : playlistNew
				, oklabel     : 'Replace'
				, ok          : function() {
					oldname ? addPlaylist( name, oldname ) : addPlaylist( name );
				}
			} );
		}
	}, 'json' );
}
function playlistDelete() {
	info( {
		  icon    : 'list-ul'
		, title   : 'Delete Playlist'
		, message : 'Delete?'
				   +'<br><w>'+ GUI.list.name +'</w>'
		, oklabel : 'Delete'
		, ok      : function() {
			var count = $( '#pls-count' ).text() - 1;
			if ( count ) $( '#pls-count' ).text( numFormat( count ) );
			GUI.list.li.remove();
			$.post( 'enhance.php', { bash: '/usr/bin/rm "/srv/http/assets/img/playlists/'+ GUI.list.name.replace( /"/g, '\\"' ) +'"' }, function() {
				if ( !count ) $( '#pl-home' ).click();
			} );
		}
	} );
}
function setTag() {
	$.post( 'enhance.php', { counttag: GUI.list.path }, function( counts ) {
		tag( counts );
	}, 'json' );
}
function tag( counts ) {
	var cue = GUI.list.path.split( '.' ).pop() === 'cue';
	var cmd = '/usr/bin/mpc -f "%artist%^^%albumartist%^^%album%^^%composer%^^%genre%^^%title%^^%track%^^%file%" ';
	if ( !cue ) {
		cmd += 'ls "'+ GUI.list.path +'" 2> /dev/null | head -1';
	} else {
		cmd += 'playlist "'+ GUI.list.path +'"';
		var track = GUI.list.index;
		if ( track ) {
			if ( track < 10 ) track = '0'+ track; 
			cmd += ' | grep "\\^\\^'+ track +'\\^\\^"';
		} else {
			cmd += ' 2> /dev/null | head -1';
		}
	}
	$.post( 'enhance.php', { bash: cmd }, function( data ) {
		var tags = data.slice( 0, -1 ).split( '^^' );
		var file = tags[ 7 ].replace( /"/g, '\"' );
		var ext = file.split( '.' ).pop();
		var path = file.substr( 0, file.lastIndexOf( '/' ) );
		var labels = [
			  '<i class="fa fa-artist wh"></i>'
			, '<i class="fa fa-albumartist wh"></i>'
			, '<i class="fa fa-album wh"></i>'
			, '<i class="fa fa-composer wh"></i>'
			, '<i class="fa fa-genre wh"></i>'
		];
		var values = [ tags[ 0 ], tags[ 1 ], tags[ 2 ], tags[ 3 ], tags[ 4 ] ];
		if ( GUI.list.isfile ) {
			labels.push(
				  '<i class="fa fa-music wh"></i>'
				, '<i class="fa fa-hash wh"></i>'
			);
			values.push( tags[ 5 ], tags[ 6 ] );
			var message = '<i class="fa fa-file-music wh"></i> '+ ( cue ? GUI.list.path : file ) +'<br>&nbsp;'
			var pathfile = '"/mnt/MPD/'+ file +'"';
		} else {
			var message = '<img src="'+ $( '.licoverimg img' ).attr( 'src' ) +'" style="width: 50px; height: 50px;">'
						 +'<br><i class="fa fa-folder wh"></i>'+ ( cue ? GUI.list.path : path ) +'<br>&nbsp;'
			var pathfile = '"/mnt/MPD/'+ path +'/"*.'+ ext;
		}
		var various = '***various***';
		info( {
			  icon      : 'tag'
			, title     : 'Tag Editor'
			, width     : 500
			, message   : message
			, textlabel : labels
			, textvalue : values
			, boxwidth  : 'max'
			, preshow   : function() {
				if ( counts.artist > 1 ) $( '#infoTextBox' ).val( various );
				if ( counts.composer > 1 ) $( '#infoTextBox3' ).val( various );
				if ( counts.genre > 1 ) $( '#infoTextBox4' ).val( various );
				if ( cue && GUI.list.isfile ) {
					for ( i = 1; i < 7; i++ ) if ( i !== 5 ) $( '#infoTextLabel'+ i +', #infoTextBox'+ i ).next().andSelf().addClass( 'hide' );
					$( '#infoTextLabel6, #infoTextBox6' ).next().andSelf().addClass( 'hide' );
				}
			}
			, ok        : function() {
				var val = [];
				$( '.infotextbox .infoinput' ).each( function() {
					val.push( this.value );
				} );
				var artist      = val[ 0 ];
				var albumartist = val[ 1 ];
				var album       = val[ 2 ];
				var composer    = val[ 3 ];
				var genre       = val[ 4 ];
				var title       = val[ 5 ];
				if ( !cue ) {
					var names = [ 'artist', 'albumartist', 'album', 'composer', 'genre', 'title', 'tracknumber' ];
					var vL = val.length;
					var cmd = '/usr/bin/kid3-cli ';
					for ( i = 0; i < vL; i++ ) {
						if ( val[ i ] !== various ) cmd += "-c \"set "+ names[ i ] +" '"+ val[ i ].toString().replace( /(["'])/g, '\\$1' ) +'\'" ';
					}
					cmd += pathfile +'; mpc update "'+ path +'"; /srv/http/enhancecount.sh 1';
				} else {
					var                         cmd  = "/usr/bin/sed -i"
													  +" -e '/^PERFORMER/ d'"
													  +" -e '/^REM COMPOSER/ d'"
													  +" -e '/^REM GENRE/ d'";
					if ( artist !== various )   cmd += " -e 's/^\\s\\+PERFORMER.*/    PERFORMER \""+ artist +"\"/'";
					if ( albumartist )          cmd += " -e '/^TITLE/ i\\PERFORMER \""+ albumartist +"\"'";
					if ( album )                cmd += " -e 's/^TITLE.*/TITLE \""+ album +"\"/'";
					if ( composer !== various ) cmd += " -e '1 i\\REM COMPOSER \""+ composer +"\"'";
					if ( genre !== various )    cmd += " -e '1 a\\REM GENRE \""+ genre +"\"'";
					
					if ( GUI.list.isfile )      cmd += " -e '/^\\s\\+TRACK "+ track +"/ {"
													  +' n;  s/^\\s\\+TITLE.*/    TITLE "'+ title +'"/'
													  +';n;  s/^\\s\\+PERFORMER.*/    PERFORMER "'+ artist +'"/'
													  +"}'";
												
												cmd += ' "/mnt/MPD/'+ GUI.list.path +'"'
													  +'; mpc update "'+ GUI.list.path.substr( 0, file.lastIndexOf( '/' ) ) +'"'
													  +'; /srv/http/enhancecount.sh 1';
				}
				$.post( 'enhance.php', { bash: cmd } );
				// local fields update
				if ( GUI.list.isfile ) {
					$( '#db-entries li.active .name' ).text( title );
				} else {
					$( '.liartist' ).text( albumartist || artist );
					$( '.lialbum' ).text( album );
					$( '.licomposer, .ligenre' ).next().andSelf().remove();
					if ( composer ) $( '.liartist' ).next().after( '<span class="licomposer"><i class="fa fa-composer"></i>'+ composer +'</span><br>' );
					if ( genre ) $( '.liinfo .db-icon' ).before( '<span class="ligenre"><i class="fa fa-genre"></i>'+ genre +'</span><br>' );
				}
			}
		} );
	} );
}

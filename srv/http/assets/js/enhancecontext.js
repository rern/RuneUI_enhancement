// single quotes in mpc name arguments - enclosed with double quotes + escape double quotes
// example: mpc save "abc's \"xyz\"" << name.replace( /"/g, '\\"' )

$( '.contextmenu a' ).click( function() {
	$( '.menu' ).addClass( 'hide' );
	var $this = $( this );
	var cmd = $this.data( 'cmd' );
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
			$.post( 'enhance.php', { mpc: 'mpc update "'+ GUI.list.path +'"' }, getUpdateStatus );
		} else if ( cmd === 'tag' ) {
			setTag();
		} else if ( cmd === 'remove' ) {
			GUI.contextmenu = 1;
			setTimeout( function() { GUI.contextmenu = 0 }, 500 );
			removeFromPlaylist( GUI.list.li );
		} else if ( cmd === 'savedpladd' ) {
			GUI.plappend = GUI.list.path;
			info( {
				  icon     : 'list-ul'
				, title    : 'Add to playlist'
				, message  : 'Select playlist to add:'
							+'<br><w>'+ GUI.list.name +'</w>'
				, msgalign : 'center'
				, cancel   : function() {
					GUI.plappend = '';
				}
				, ok       : function() {
					$( '#plopen' ).click();
				}
			} );
		} else if ( cmd === 'savedplremove' ) {
			var plline = GUI.list.li.index() + 1;
			var plname = $( '#pl-currentpath .lipath' ).text();
			$.post( 'enhance.php', { bash: '/usr/bin/sed -i "'+ plline +' d" "/var/lib/mpd/playlists/'+ plname +'.m3u"' } );
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
	$( '#db-entries li, #pl-editor li' ).removeClass( 'active' );
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
		if ( GUI.list.index ) { // cue, m3u
			var plfile = GUI.list.path.replace( /"/g, '\\"' );
			mpcCmd = '/srv/http/enhance1cuem3u.sh "'+ plfile +'" '+ GUI.list.index;
		} else if ( name.split( '.' ).pop() === 'pls' ) {
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
		mpcCmd = 'mpc load "'+ name +'"';
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
		notify( 'Random Play', name, 'random' );
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
		, msgalign : 'center'
		, checkbox : {
			  'Replace existings'       : 1
			, 'Update Library database' : 1
		}
		, cancel   : 1
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
					  icon     : 'bookmark'
					, title    : 'Add Bookmark'
					, message  : iconhtml
							   +'<br><br>Already exists.'
					, msgalign : 'center'
				} );
				return false
			}
		} );
	}
	$.post( 'enhancegetcover.php', { path: path }, function( base64img ) {
		if ( base64img ) {
			info( {
				  icon      : 'bookmark'
				, title     : 'Add Bookmark'
				, message   : '<img src="'+ base64img +'">'
							 +'<br><w>'+ path +'</w>'
				, msgalign  : 'center'
				, cancel    : function() {
					$( '#db-entries li' ).removeClass( 'active' );
				}
				, ok        : function() {
					$.post( 'enhance.php', { bookmarks: 1, path: path, base64: base64img, new: 1 } );
					notify( 'Add Bookmark', path, 'bookmark' );
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
				, msgalign     : 'center'
				, textvalue    : name
				, textrequired : 1
				, boxwidth     : 'max'
				, textalign    : 'center'
				, cancel    : function() {
					$( '#db-entries li' ).removeClass( 'active' );
				}
				, ok           : function() {
					$.post( 'enhance.php', { bookmarks: $( '#infoTextBox' ).val(), path: path, new: 1 } );
					notify( 'Add Bookmark', path, 'bookmark' );
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
		, msgalign     : 'center'
		, textvalue    : name
		, textrequired : 1
		, textalign    : 'center'
		, boxwidth     : 'max'
		, cancel       : 1
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
		  icon     : 'bookmark'
		, title    : 'Remove Bookmark'
		, message  : icon
		, msgalign : 'center'
		, cancel   : 1
		, oklabel  : 'Remove'
		, ok       : function() {
			GUI.bookmarkedit = 1;
			$.post( 'enhance.php', { bookmarks: name, path: path, delete: 1 } );
			$block.parent().remove();
		}
	} );
}
function webRadioCoverart() {
	var name = GUI.list.name;
	var path = GUI.list.path;
	var urlname = path.replace( /\//g, '|' );
	$.post( 'enhance.php', { bash: '/usr/bin/cat "/srv/http/assets/img/webradios/'+ urlname +'"' }, function( data ) {
		var nameimg = data.split( "\n" );
		var name = nameimg[ 0 ];
		var $img = nameimg[ 2 ] ? '<img src="'+ nameimg[ 2 ] +'">' : '<img src="'+ vu +'" style="border-radius: 9px">';
		info( {
			  icon        : 'webradio'
			, title       : 'Change Coverart'
			, message     : ( nameimg[ 2 ] ? '<img src="'+ nameimg[ 2 ] +'">' : '<img src="'+ vu +'" style="border-radius: 9px">' )
						   +'<span class="bkname"><br><w>'+ name +'</w><span>'
			, msgalign    : 'center'
			, fileoklabel : 'Replace'
			, buttonlabel : 'Remove'
			, buttoncolor : '#0095d8'
			, button      : function() {
				$.post( 'enhance.php', { bash: '/usr/bin/echo "'+ name +'" > "/srv/http/assets/img/webradios/'+ urlname +'"' } );
				if ( GUI.playback ) {
					$( '#cover-art' ).attr( 'src', GUI.status.state === 'play' ? vu : vustop );
				} else {
					$( '#db-entries li.active' ).find( 'img' ).remove();
					$( '#db-entries li.active' ).find( '.lisort' ).after( '<i class="fa fa-webradio db-icon" data-target="#context-menu-webradio"></i>' );
					$( '#db-entries li' ).removeClass( 'active' );
				}
			}
			, cancel      : function() {
				$( '#db-entries li' ).removeClass( 'active' );
			}
			, ok          : function() {
				var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
				var picacanvas = document.createElement( 'canvas' );
				picacanvas.width = picacanvas.height = 80;
				pica.resize( $( '#infoMessage .newimg' )[ 0 ], picacanvas, picaOption ).then( function() {
					var newthumb = picacanvas.toDataURL( 'image/jpeg', 0.9 );
					var webradioname = path.replace( /\//g, '|' );
					$.post( 'enhance.php', { imagefile: webradioname, base64webradio: name +'\n'+ newthumb +'\n'+ newimg }, function( result ) {
						if ( result != -1 ) {
							if ( GUI.playback ) {
								$( '#cover-art' ).attr( 'src', newimg );
							} else {
								$( '#db-entries li.active' ).find( '.db-icon' ).remove();
								$( '#db-entries li.active' ).find( '.lisort' ).after( '<img class="radiothumb db-icon" src="'+ newthumb +'" data-target="#context-menu-radio">' );
								$( '#db-entries li' ).removeClass( 'active' );
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
		} );
		if ( $( '#infoMessage img' ).attr( 'src' ) === vu ) $( '#infoButton' ).hide();
	} );
}
function webRadioSave( name, url ) {
	var urlname = url.replace( /\//g, '|' );
	$.post( 'enhance.php', { bash: '/usr/bin/cat "/srv/http/assets/img/webradios/'+ urlname +'"' }, function( data ) {
		if ( data ) {
			var nameimg = data.split( "\n" );
			info( {
				  icon     : 'webradio'
				, title    : 'Save Webradio'
				, message  : ( nameimg[ 2 ] ? '<br><img src="'+ nameimg[ 2 ] +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
							+'<br><w>'+ nameimg[ 0 ] +'</w>'
							+'<br>'+ url
							+'<br>Already exists.'
				, msgalign : 'center'
			} );
			$( '#db-entries li.active' ).removeClass( 'active' );
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
		, msgalign     : 'center'
		, textlabel    : ''
		, textvalue    : name
		, textrequired : 1
		, textalign    : 'center'
		, boxwidth     : 'max'
		, cancel       : function() {
			GUI.library && $( '#db-entries li.active' ).removeClass( 'active' );
			GUI.playlist && $( '#pl-entries li.updn' ).removeClass( 'updn' );
		}
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
		, textlabel    : 'Name'
		, textvalue    : name || ''
		, textlabel2   : 'URL'
		, textvalue2   : url || ''
		, textrequired : 1
		, textalign    : 'center'
		, boxwidth     : 'max'
		, cancel       : 1
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			var url = $( '#infoTextBox2' ).val();
			$.post( 'enhance.php', { webradios: newname, url: url, new: 1 }, function( exist ) {
				if ( exist ) {
					var nameimg = exist.split( "\n" );
					info( {
						  icon     : 'webradio'
						, title    : 'Add Webradio'
						, message  : ( nameimg[ 2 ] ? '<img src="'+ nameimg[ 2 ] +'">' : '<i class="fa fa-webradio bookmark"></i>' )
									+'<br><w>'+ nameimg[ 0 ] +'</w>'
									+'<br>'+ url
									+'<br>Already exists.'
						, msgalign : 'center'
						, ok       : function() {
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
			, msgalign     : 'center'
			, textvalue    : name
			, textrequired : 1
			, textalign    : 'center'
			, boxwidth     : 'max'
			, cancel       : function() {
				$( '#db-entries li.active' ).removeClass( 'active' );
			}
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
			  icon     : 'webradio'
			, title    : 'Delete Webradio'
			, width    : 500
			, message  : ( nameimg[ 2 ] ? '<br><img src="'+ nameimg[ 2 ] +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
						+'<br><w>'+ nameimg[ 0 ] +'</w>'
						+'<br>'+ url
			, msgalign : 'center'
			, cancel       : function() {
				$( '#db-entries li.active' ).removeClass( 'active' );
			}
			, oklabel  : 'Delete'
			, ok       : function() {
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
		, textrequired : 1
		, textalign    : 'center'
		, boxwidth     : 'max'
		, cancel       : 1
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
		, msgalign     : 'center'
		, textvalue    : name
		, textrequired : 1
		, textalign    : 'center'
		, boxwidth     : 'max'
		, cancel       : 1
		, oklabel      : 'Rename'
		, ok           : function() {
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
		var name = name.replace( /"/g, '\\"' );
		$.post( 'enhance.php', {
			mpc: 'mpc save "'+ name +'"; '
				+'/usr/bin/sudo /usr/bin/chmod 775 "/var/lib/mpd/playlists/'+ name + '.m3u"'
		} );
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
				, message     : '<i class="fa fa-warning"></i><w>'+ name +'</w>'
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
					+'<br><w>'+ GUI.list.name +'</w>'
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

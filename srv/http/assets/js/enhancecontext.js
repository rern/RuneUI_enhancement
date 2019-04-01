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
		var name = GUI.list.li.find( '.lipath' ).text();
	} else {
		var name = GUI.list.path;
	}
	name = name.replace( /"/g, '\\"' );
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
	} else { // album|artist|composer|genre
		var artist = GUI.list.artist || $( '#artistalbum span' ).text().replace( /"/g, '\\"' );
		mpcCmd = 'mpc findadd '+ GUI.list.mode +' "'+ name +'"'+ ( artist ? ' artist "'+ artist +'"' : '' );
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
		notify( 'Random Play', name );
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
	var msg = GUI.list.name + ( artist ? ' • '+ artist : '' );
	notify( title, msg );
}
function bookmarkNew() {
	var path = GUI.list.path;
	var name = path.split( '/' ).pop();
	var $el = $( '.home-bookmark' );
	var i = $el.length;
	$el.each( function() {
		var $this = $( this );
		if ( $this.find( '.lipath' ).text() === path ) {
			var $img = $this.find( 'img' );
			if ( $img.length ) {
				var iconhtml = '<img src="'+ $img.attr( 'src' ) +'">'
							  +'<br>'+ path;
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
		i--;
		if ( !i ) {
			$.post( 'enhancegetcover.php', { path: path }, function( base64img ) {
				if ( base64img ) {
					info( {
						  icon      : 'bookmark'
						, title     : 'Add Bookmark'
						, message   : '<img src="'+ base64img +'">'
									 +'<br><w>'+ path +'</w>'
						, msgalign  : 'center'
						, cancel    : 1
						, ok        : function() {
							$.post( 'enhance.php', { bookmarks: 1, path: path, base64: base64img, new: 1 } );
							notify( 'Add Bookmark', path );
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
						, cancel       : 1
						, ok           : function() {
							$.post( 'enhance.php', { bookmarks: $( '#infoTextBox' ).val(), path: path, new: 1 } );
							notify( 'Add Bookmark', path );
						}
					} );
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
		var data = data.split( '\n' );
		if ( data.length > 1 ) {
			var name = data[ 0 ];
			var $img = '<img src="'+ data[ 2 ] +'">';
		} else {
			var name = data;
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
				var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
				var picacanvas = document.createElement( 'canvas' );
				picacanvas.width = picacanvas.height = 80;
				window.pica.resizeCanvas( $( '#infoMessage .newimg' )[ 0 ], picacanvas, picaOption, function() {
					var newthumb = picacanvas.toDataURL( 'image/jpeg', 0.9 );
					var webradioname = path.replace( /\//g, '|' );
					$.post( 'enhance.php', { imagefile: webradioname, base64webradio: name +'\n'+ newthumb +'\n'+ newimg }, function( result ) {
							if ( result != -1 ) {
								notify( 'Coverart Changed', name );
							} else {
								info( {
									  icon    : 'webradio'
									, title   : 'Change Coverart'
									, message : '<i class="fa fa-warning"></i>Upload image failed.'
								} );
							}
					} );
				} );
				var $img = $( '#db-entries li.active img' );
				if ( $img.length ) {
					$img.attr( 'src', newimg );
				} else {
					$( '#db-entries li.active' )
						.find( '.db-icon' ).remove()
						.find( '.lisort' ).after( '<img class="radiothumb db-icon" src="'+ newimg +'" data-target="#context-menu-radio">' );
				}
				$( '#db-entries li' ).removeClass( 'active' );
				if ( path === GUI.status.file) GUI.status.coverart = newimg;
			}
		} );
	} );
}
function webRadioSave( name, url ) {
	$.post( 'enhance.php', { getwebradios: 1 }, function( data ) {
		var iL = data.length;
		$.each( data, function( i, list ) {
			if ( list.url === url ) {
				info( {
					  icon     : 'webradio'
					, title    : 'Save Webradio'
					, message  : '<w>'+ url +'</w>'
								+'<br>Already exists as:'
								+ ( list.thumb ? '<br><img src="'+ list.thumb +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
								+'<br><w>'+ list.webradio +'</w>'
					, msgalign : 'center'
				} );
				return false
			}
			i--;
			if ( !i ) {
				var urlname = url.replace( /\//g, '|' );
				info( {
					  icon         : 'webradio'
					, title        : 'Save Webradio'
					, width        : 500
					, message      : ( GUI.list.img ? '<img src="'+ GUI.list.img +'">' : '<i class="fa fa-webradio bookmark"></i>' )
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
						notify( 'Webradio saved', newname );
						if ( GUI.list.thumb ) newname += "\n"+ GUI.list.thumb +"\n"+ GUI.list.img
						$.post( 'enhance.php', { webradios: newname, url: url, save: 1 } );
					}
				} );
			}
		} );
	}, 'json' );
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
	info( {
		  icon         : 'webradio'
		, title        : 'Rename Webradio'
		, width        : 500
		, message      : ( GUI.list.img ? '<img src="'+ GUI.list.img +'">' : '<i class="fa fa-webradio bookmark"></i>' )
						+'<br><w>'+ name +'</w>'
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
}
function webRadioDelete() {
	var name = GUI.list.name;
	var url = GUI.list.path;
	info( {
		  icon     : 'webradio'
		, title    : 'Delete Webradio'
		, width    : 500
		, message  : ( GUI.list.img ? '<img src="'+ GUI.list.img +'">' : '<i class="fa fa-webradio bookmark"></i>' )
					+'<br><w>'+ name +'</w>'
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
		$.post( 'enhance.php', { mpc: 'mpc save "'+ name.replace( /"/g, '\\"' ) +'"' } );
		notify( 'Playlist Saved', name );
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

// keyboard controls
$( document ).keydown( function( e ) {
	if ( $( '#infoOverlay' ).css( 'display' ) === 'block' ) return
		
	var key = e.key;
	if ( key === ' ' && e.target.localName !== 'input' ) {
		$( '#play' ).click();
		e.preventDefault();
	} else if ( key === 'MediaPlay' || key === 'MediaPlayPause' ) {
		$( '#play' ).click();
	} else if ( key === 'MediaPause' ) {
		$( '#pause' ).click();
	} else if ( key === 'MediaStop' ) {
		$( '#stop' ).click();
	} else if ( key === 'MediaTrackPrevious' || key === 'MediaPreviousTrack' ) {
		$( '#previous' ).click();
	} else if ( key === 'MediaTrackNext' || key === 'MediaNextTrack' ) {
		$( '#next' ).click();
	} else if ( key === 'Tab' ) {
		if ( GUI.library ) {
			$( '#tab-playback' ).click();
		} else if ( GUI.playback ) {
			$( '#tab-playlist' ).click();
		} else {
			$( '#tab-library' ).click();
		}
	}
	if ( key === ' ' || key === 'Tab' || key.slice( 5 ) === 'Media' ) return

	if ( GUI.playback ) {
		if ( key === 'ArrowLeft' ) {
			$( '#previous' ).click();
		} else if ( key === 'ArrowRight' ) {
			$( '#next' ).click();
		} else if ( key === 'ArrowUp' ) {
			$( '#volup' ).click();
		} else if ( key === 'ArrowDown' ) {
			$( '#voldn' ).click();
		}
	} else if ( GUI.library ) {
		if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) return
		
		if ( key === 'ArrowLeft' ) {
			$( '#db-back' ).click();
			return
		}
		
		var $liactive = $( '#db-entries li.active' );
		if ( $liactive.length ) {
			var i = $liactive.index();
			if ( key === 'ArrowUp' || key ===  'ArrowDown' ) {
				i = key === 'ArrowUp' ? i - 1 : i + 1;
				$( '.db-icon' ).eq( i ).tap();
			} else if ( key === 'Enter' ) {
				if ( $( '.licover' ).length || $( '#db-entries li.db-webradio' ).length ) {
					var menu = $liactive.find( '.db-icon' ).data( 'target' );
					$( menu ).find( 'a:eq( 1 )' ).click();
				} else {
					$liactive.tap();
				}
			}
			$( '.contextmenu' ).addClass( 'hide' );
		} else {
			$( '#db-entries li:eq( 0 )' ).addClass( 'active' );
			setTimeout( function() {
				$( 'html, body' ).scrollTop( 0 );
			}, 300 );
		}
	} else if ( GUI.playlist ) {
		if ( !$( '#pl-entries' ).hasClass( 'hide' ) ) {
			var $li = $( '#pl-entries li' );
			var liL = $li.length;
			var i = $( '#pl-entries li.updn' ).length ? $( '#pl-entries li.updn' ).index() : $( '#pl-entries li.active' ).index();
			if ( key === 'ArrowUp' || key ===  'ArrowDown' ) {
				key === 'ArrowUp' ? i-- : i++;
				$li.removeClass( 'updn' );
				if ( i === liL && key === 'ArrowDown' ) {
					i = 0;
					setTimeout( function() {
						$( 'html, body' ).scrollTop( 0 );
					}, 300 );
				}
				$li.eq( i ).addClass( 'updn' );
			} else if ( key === 'Enter' ) {
				$( '#pl-entries li.updn' )
					.click()
					.removeClass( 'updn' );
			}
			return
		}
	
		if ( key === 'ArrowLeft' ) {
			$( '.plsbackroot, .plsback' ).click();
			return
		}
		
		var $li = $( '#pl-editor li' );
		var liL = $li.length;
		var $liactive = $( '#pl-editor li.active' );
		if ( $liactive.length ) {
			var i = $liactive.index();
			if ( key === 'ArrowUp' || key ===  'ArrowDown' ) {
				i = key === 'ArrowUp' ? i - 1 : i + 1;
				if ( i === liL && key === 'ArrowDown' ) {
					i = 0;
					setTimeout( function() {
						$( 'html, body' ).scrollTop( 0 );
					}, 300 );
				}
				$( '#pl-editor .pl-icon' ).eq( i ).click();
			} else if ( key === 'Enter' ) {
				if ( !$( '#pl-editor li.pl-folder' ).length ) {
					var menu = $liactive.find( '.pl-icon' ).data( 'target' );
					$( menu ).find( 'a:eq( 1 )' ).click();
				} else {
					$liactive.click();
				}
			}
			$( '.contextmenu' ).addClass( 'hide' );
		} else {
			$( '#pl-editor li:eq( 0 )' ).addClass( 'active' );
			setTimeout( function() {
				$( 'html, body' ).scrollTop( 0 );
			}, 300 );
		}
	}
} );

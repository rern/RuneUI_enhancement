// keyboard controls
$( document ).keydown( function( e ) {
	var key = e.key;
	if ( [ 'ArrowUp', 'ArrowDown' ].indexOf( key ) !== -1 ) e.preventDefault();
	if ( key === 'Escape' ) {
		$( '.menu' ).addClass( 'hide' );
		$( '#colorcancel' ).click();
		return
	}
	
	if ( $( '#infoOverlay' ).css( 'display' ) === 'block' || !$( '#divcolorpicker' ).hasClass( 'hide' ) ) return
		
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
		e.preventDefault();
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
		if ( !$( '#db-search' ).hasClass( 'hide' ) ) return
		
		// home /////////////////////////////////////////
		if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
			var $blupdn = $( '.divblock.updn' );
			if ( !$blupdn.length ) {
				$( '.divblock:not( .hide ):eq( 0 )' ).addClass( 'updn' );
				return
			}
			
			if ( key === 'ArrowLeft' ) {
				var $div = $( '.divblock.updn' ).prevAll( ':not( .hide )' ).first();
				$( '.divblock' ).removeClass( 'updn' );
				if ( !$div.length ) $div = $( '.divblock:not( .hide )' ).last();
				$div.addClass( 'updn' );
			} else if ( key === 'ArrowRight' ) {
				var $div = $( '.divblock.updn' ).nextAll( ':not( .hide )' ).first().addClass( 'updn' );
				$( '.divblock' ).removeClass( 'updn' );
				if ( !$div.length ) $div = $( '.divblock:not( .hide )' ).first();
				$div.addClass( 'updn' );
			} else if ( key === 'Enter' ) {
				$( '.divblock.updn .home-block' ).click();
			}
			return
		}
		var contextmenu = $( '#db-entries li.active .db-icon' ).data( 'target' );
		if ( $( '#db-entries li.active' ).length && !$( contextmenu ).hasClass( 'hide' ) ) {
			var $menu = $( contextmenu ).find( 'a.active' );
			var $menuactive = $menu.length ? $menu : $( contextmenu ).find( '.submenu.active' ).parent();
			var $menu0 = $( contextmenu ).find( 'a:eq( 0 )' );
			if ( key === 'ArrowLeft' ) {
				$( '.menu' ).addClass( 'hide' )
				$menuactive.removeClass( 'active' );
				$( '.submenu' ).removeClass( 'active' );
			} else if ( key === 'ArrowRight' ) {
				if ( $menuactive.length ) {
					$menuactive.removeClass( 'active' );
					$menuactive.find( '.submenu' ).addClass( 'active' );
				} else {
					$( '#db-entries li.active .db-icon' ).tap().tap();
				}
			} else if ( key === 'ArrowUp' || key === 'ArrowDown' ) {
				if ( !$menuactive.length ) {
					$menu0.addClass( 'active' );
				} else {
					$menuactive.removeClass( 'active' );
					$( '.submenu' ).removeClass( 'active' );
					if ( key === 'ArrowDown' ) {
						if ( $menuactive.is( ':last-child' ) ) {
							$menu0.addClass( 'active' );
						} else {
							$menuactive.next().addClass( 'active' );
						}
					} else {
						if ( $menuactive.is( ':first-of-type' ) ) {
							$( contextmenu ).find( 'a:last-child' ).addClass( 'active' );
						} else {
							$menuactive.prev().addClass( 'active' );
						}
					}
				}
			} else if ( key === 'Enter' ) {
				$( contextmenu ).find( 'a.active' ).click();
				$( contextmenu ).find( '.submenu.active' ).click();
			}
			return
		}
		// back button //////////////////////////////////
		if ( key === 'ArrowLeft' ) {
			$( '#db-back' ).click();
			return
		} else if ( key === 'ArrowRight' ) {
			$( '#db-entries li.active .db-icon' ).tap().tap();
			return
		}
		
		// list ///////////////////////////////////////
		var $liactive = $( '#db-entries li.active' );
		if ( !$liactive.length ) {
			$( '#db-entries li' ).first().addClass( 'active' );
			setTimeout( function() {
				$( 'html, body' ).scrollTop( 0 );
			}, 300 );
			return
		}
		
		if ( key === 'ArrowUp' ) {
			var $dbicon = $liactive.prev().find( '.db-icon' );
			if ( !$dbicon.length ) $dbicon = $( '.db-icon' ).last();
			$dbicon.tap();
		} else if ( key === 'ArrowDown' ) {
			var $dbicon = $liactive.next().find( '.db-icon' );
			if ( !$dbicon.length ) {
				$dbicon = $( '.db-icon' ).first();
				setTimeout( function() {
					$( 'html, body' ).scrollTop( 0 );
				}, 300 );
			}
			$dbicon.tap();
		} else if ( key === 'Enter' ) {
			if ( $( '.licover' ).length || $( '#db-entries li.db-webradio' ).length ) {
				var menu = $liactive.find( '.db-icon' ).data( 'target' );
				$( menu ).find( 'a:eq( 1 )' ).click();
			} else {
				$liactive.tap();
			}
		}
		$( '.contextmenu' ).addClass( 'hide' );
	} else if ( GUI.playlist ) {
		// playlist //////////////////////////////////
		if ( !$( '#pl-entries' ).hasClass( 'hide' ) ) {
			var $liupdn = $( '#pl-entries li.updn' ).length ? $( '#pl-entries li.updn' ) : $( '#pl-entries li.active' );
			if ( key === 'ArrowUp' ) {
				var $li = $liupdn.prev( 'li' );
				$( '#pl-entries li' ).removeClass( 'updn' );
				if ( !$li.length ) $li = $( '#pl-entries li' ).last();
				$li.addClass( 'updn' );
			} else if ( key === 'ArrowDown' ) {
				var $li = $liupdn.next( 'li' );
				$( '#pl-entries li' ).removeClass( 'updn' );
				if ( !$li.length ) {
					$li = $( '#pl-entries li' ).first();
					setTimeout( function() {
						$( 'html, body' ).scrollTop( 0 );
					}, 300 );
				}
				$li.addClass( 'updn' );
			} else if ( key === 'Enter' ) {
				$( '#pl-entries li.updn' )
					.click()
					.removeClass( 'updn' );
			}
			return
		}
		// back button //////////////////////////////////////
		if ( key === 'ArrowLeft' ) {
			$( '.plsbackroot, .plsback' ).click();
			return
		}
		// saved playlist //////////////////////////////////
		var $liactive = $( '#pl-editor li.active' );
		if ( !$liactive.length ) {
			$( '#pl-editor li:eq( 0 )' ).addClass( 'active' );
			setTimeout( function() {
				$( 'html, body' ).scrollTop( 0 );
			}, 300 );
			return
		}
		
		if ( key === 'ArrowUp' ) {
			var $plicon = $liactive.prev( 'li' ).find( '.pl-icon' );
			if ( !$plicon.length ) $plicon = $( '#pl-editor li .pl-icon' ).last();
			$plicon.click();
		} else if ( key === 'ArrowDown' ) {
			var $plicon = $liactive.next( 'li' ).find( '.pl-icon' );
			if ( !$plicon.length ) {
				$plicon = $( '#pl-editor li .pl-icon' ).first();
				setTimeout( function() {
					$( 'html, body' ).scrollTop( 0 );
				}, 300 );
			}
			$plicon.click();
		} else if ( key === 'Enter' ) {
			if ( !$( '#pl-editor li.pl-folder' ).length ) {
				var menu = $liactive.find( '.pl-icon' ).data( 'target' );
				$( menu ).find( 'a:eq( 1 )' ).click();
			} else {
				$liactive.click();
			}
		}
		$( '.contextmenu' ).addClass( 'hide' );
	}
} );

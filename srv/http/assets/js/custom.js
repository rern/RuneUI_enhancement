$(document).ready(function() {
// document ready start********************************************************************

function topbottom() {
	if ($('#menu-top').position().top != 0) {
		$('#menu-top').css('top', 0);
		$('#menu-bottom').css('bottom', 0);
	} else {
		$('#menu-top').css('top', '-40px');
		$('#menu-bottom').css('bottom', '-40px');
	}
}

$('#barleft').click( function() {
	if (!$('#coverart').length || !$('#volume-knob').length || $(window).width() >= 640) {
		topbottom();
	} else {
		$('#coverart').slideToggle(function() {
			$('#time-knob, #volume-knob').css('margin-top', 0);
			if ($('#coverart').is(':visible')) {
				$('#playback-row').css('margin-top', '10px');
				if ($('#play-group').is(':visible')) {
					$('#share-group').show();
				} else {
					$('#divalbum').show();
					$('#volume-knob').css('margin-top', '20px');
				}
				if ($(window).width() > 500) {
					$('#coverart').css({'order': '2', '-webkit-order': '2'});
					$('#share-group').css({'order': '4', '-webkit-order': '4'});
					$('#volume-knob').css({'order': '5', '-webkit-order': '5'});
					$('#vol-group').css({'order': '6', '-webkit-order': '6'});
				}
			} else {
				$('#share-group').hide();
				if ($(window).width() > 500) {
					$('#playback-row').css('margin-top', 0);
					$('#play-group, #vol-group').css('margin-top', 0);
					$('#coverart').css({'order': '5', '-webkit-order': '5'});
					$('#share-group').css({'order': '6', '-webkit-order': '6'});
					$('#volume-knob').css({'order': '2', '-webkit-order': '2'});
					$('#vol-group').css({'order': '4', '-webkit-order': '4'});
				}
			}
		});
	}
});
window.addEventListener('orientationchange', scrolltext);

$('#barright').click( function() {
	$('#play-group, #vol-group').toggle();
	if ($('#play-group').is(':visible') && $('#coverart').is(':visible')) {
		$('#share-group').show();
	} else {
		$('#share-group').hide();
	}
	if (window.innerHeight < 500) {
		if ($('#play-group').is(':visible')) {
			$('#divalbum, #sampling').hide();
			$('#play-group, #share-group, #vol-group').css('margin-top', '10px');
		} else {
			$('#divalbum, #sampling').show();
		}
	}
});

$('#open-panel-sx, #open-panel-dx').click(function() {
	$('#barleft, #barright').hide();
});
$('#open-playback').click(function() {
	$('#barleft, #barright').show();
});
// playback buttons click go back to home page
$('.playback-controls').click(function() {
	if (!$('#playback').hasClass('active')) {
		$('#open-playback a').click();
		$('#open-playback a')[0].click();
	}
});
// playlist click go back to home page
$('#playlist ul').click(function(e) {
	//alert(e.target.nodeName);
	if (e.target.nodeName == 'SPAN') {
		$('#open-playback a').click();
		$('#open-playback a')[0].click();
		if ($(window).width() < 500 || $(window).height() < 500) topbottom();
	}
});
// playsource button replacement
$('#playsource').click(function() {
	$('#overlay-playsource-open').click();
});
// menus click remove lyric
$('#playsource, #menu-settings, #open-panel-sx, #open-panel-dx').click(function() {
	PNotify.removeAll();
	$('#lyricfade').addClass('hide');
	$('#menu-bottom').removeClass('lyric-menu-bottom');
});
// additional play/pause by click
$('#coverart').click(function(){
	$('#play').click();
//	launchIntoFullscreen(document.documentElement); // the whole page
});
// lastfm search
$('#currentartist').click(function() {
	var artist = $(this).text();
	if (artist.slice(0, 3) != '[no')
		window.open('http://www.last.fm/music/'+ artist);
});
$('#currentsong').click(function() {
	var artist = $('#currentartist').text();
	var song = $(this).text();
	if (song.slice(0, 3) != '[no') {
		new PNotify({
			icon: 'fa fa-refresh fa-spin fa-lg',
			title: 'Lyrics',
			text: 'Fetching ...',
			addclass: 'pnotify_custom',
		});
		$.get('lyrics.php',   
			{artist: artist, song: song},
			function(lyric) {
				//var lyric = $(lyric).find('Lyric').text();
				//var cover = $(lyric).find('LyricCovertArtUrl').text();
				var lyric = lyric ? lyric.replace(/&amp;quot;/g, '&quot;').replace(/&amp;lt;/g, '&lt;').replace(/&amp;gt;/g, '&gt;') : '(Lyrics unavailable)';
				PNotify.removeAll();
				// need new 'pnotify.custom.min.js' with 'button', confirm', 'callback', 'css'
					new PNotify({
					icon: false,
					title: song,
					text: lyric +'\n\n&#8226;&#8226;&#8226;\n\n\n\n\n\n\n\n',
					hide: false,
					addclass: 'pnotify_lyric pnotify_custom',
					buttons: {
						closer_hover: false,
						sticker: false
					},
					before_open: function() {
						$('#lyricfade').removeClass('hide');
						$('#menu-bottom').addClass('lyric-menu-bottom');
					},
					after_close: function() {
						$('#lyricfade').addClass('hide');
						$('#menu-bottom').removeClass('lyric-menu-bottom');
						$('.ui-pnotify').remove();
					},
				});
			}
		);
	}
});
$('#currentalbum').click(function(){
	var artist = $('#currentartist').text();
	var album = $(this).text();
	if (album.slice(0, 3) != '[no')
		window.open('http://www.last.fm/music/'+ artist +'/'+ album);
});

// swipe
if ($('#playback').is(':visible')) {
	var hammerinfo = new Hammer(document.getElementById('info'));
	hammerinfo.on('swiperight', function () {
		$('#previous').click();
	});
	hammerinfo.on('swipeleft', function () {
		$('#next').click();
	});

	var hammerrow = new Hammer(document.getElementById('playback-row'));
	hammerrow.on('swipe', function() {
		$('#barright').click();
	});

	var hammerbarleft = new Hammer(document.getElementById('barleft'));
	hammerbarleft.on('swipe', function() {
		$('#barleft').click();
	});
	hammerbarleft.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });

	var hammerbarright = new Hammer(document.getElementById('barright'));
	hammerbarright.on('swipe', topbottom);
	hammerbarright.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
} else {
	$('#menu-top').css('top', 0);
	$('#menu-bottom').css('bottom', 0);
	$('#barleft, #barright').hide();
}
// document ready end *********************************************************************
});


function scrolltext() {
// scrolling text
	setTimeout(function() {
		$('#divartist, #divsong, #divalbum').each(function() {
			if ($(this).find('span').width() > Math.floor(window.innerWidth * 0.975)) {
				$(this).addClass('scroll-left');
			} else {
				$(this).removeClass('scroll-left');
			}
		});
	}, 50);
}

// replace functions in main runeui.js file
function refreshState() {
	scrolltext();
	
    var state = GUI.state;
	if (GUI.stream === 'radio') {
		$('#time-knob').hide();
	} else {
		$('#time-knob').show();
	}
    if (state === 'play') {
        $('#play').addClass('btn-primary');
        $('i', '#play').removeClass('fa fa-pause').addClass('fa fa-play');
        $('#stop').removeClass('btn-primary');
    } else if (state === 'pause') {
        $('#playlist-position span').html('Not playing');
        $('#play').addClass('btn-primary');
        $('i', '#play').removeClass('fa fa-play').addClass('fa fa-pause');
        $('#stop').removeClass('btn-primary');
    } else if (state === 'stop') {
        $('#play').removeClass('btn-primary');
        $('i', '#play').removeClass('fa fa-pause').addClass('fa fa-play');
        $('#stop').addClass('btn-primary');
        if ($('#section-index').length) {
            $('#countdown-display').countdown('destroy');
        }
        if (GUI.stream !== 'radio') $('#total').html('00:00');
        $('#time').val(0, false).trigger('update');
        $('#format-bitrate').html('&nbsp;');
        $('li', '#playlist-entries').removeClass('active');
    }
    if (state !== 'stop') {
        if (GUI.stream !== 'radio') $('#total').html((GUI.json.time !== undefined)? timeConvert(GUI.json.time) : '00:00');
// ****************************************************************************************
// improve song info
		if (GUI.json.fileext != false) {
			var dot = '<a style="color:#ffffff"> &#8226; </a>';
			var channel = (GUI.json.audio_channels == 'Stereo') ? '' : GUI.json.audio_channels +' ';
			var ext = GUI.json.fileext.toUpperCase();
			var bitdepth = Number(GUI.json.audio_sample_depth);
			var sampling = Number(GUI.json.audio_sample_rate);
			var bitrate = Number(GUI.json.bitrate);
			if (ext == 'DSF' || ext == 'DFF') {
				bitdepth = 1;
				sampling = GUI.json.audio.split(':')[0] / 5512.5;
				bitrate = sampling * 44.1;
				sampling = 'DSD'+ sampling;
			} else if (ext == 'FLAC' || ext == 'WAV' || ext == 'ALAC') {
				bitrate = bitdepth * sampling * 2;
			}
			sampling = (bitdepth != 1) ? sampling +' kHz ' : sampling +' - ';
			var fileinfo = '<a id="dot0" style="color:#ffffff"> &#8226; </a>' + channel + bitdepth +' bit '+ sampling + bitrate +' kbps<a style="color:#ffffff"> &#8226; </a>' + ext;
		} else {
			var fileinfo = '';
		}
// ****************************************************************************************
        $('#format-bitrate').html(fileinfo);
        $('li', '#playlist-entries').removeClass('active');
        var current = parseInt(GUI.json.song);
        $('#playlist-entries').find('li').eq(current).addClass('active');
    }
    if (GUI.json.playlistlength && GUI.json.playlistlength !== '0') {
        if (GUI.json.song) {
            $('#playlist-position span').html((parseInt(GUI.json.song) + 1) + '/' + GUI.json.playlistlength);
        } else {
            $('#playlist-position span').html('1/' + GUI.json.playlistlength);
        }
    } else {
        $('#playlist-position span').html('Empty queue, add some music!');
    }
    if (GUI.json.updating_db !== undefined) {
        $('a', '#open-panel-sx').html('<i class="fa fa-refresh fa-spin"></i>');
    } else {
        $('a', '#open-panel-sx').html('<i class="fa fa-folder-open"></i>');
    }
}

function updateGUI() {
    var volume = GUI.json.volume;
    var radioname = GUI.json.radioname;
    var currentartist = GUI.json.currentartist;
    var currentsong = GUI.json.currentsong;
    var currentalbum = GUI.json.currentalbum;
    // set radio mode if stream is present
    GUI.stream = ((radioname !== null && radioname !== undefined && radioname !== '') ? 'radio' : '');
    // check MPD status and refresh the UI info
    refreshState();
    if ($('#section-index').length) {
        // check song update
        // console.log('A = ', GUI.json.currentsong); console.log('B = ', GUI.currentsong);
        if (GUI.currentsong !== GUI.json.currentsong) {
            countdownRestart(0);
            if ($('#panel-dx').hasClass('active')) {
                var current = parseInt(GUI.json.song);
                customScroll('pl', current);
            }
        }
        // common actions
        $('#volume').val((volume === '-1') ? 100 : volume, false).trigger('update');
        // console.log('currentartist = ', GUI.json.currentartist);
        if (GUI.stream !== 'radio') {
            $('#currentartist').html((currentartist === null || currentartist === undefined || currentartist === '') ? '<span class="notag">[no artist]</span>' : currentartist);
            $('#currentsong').html((currentsong === null || currentsong === undefined || currentsong === '') ? '<span class="notag">[no title]</span>' : currentsong);
            $('#currentalbum').html((currentalbum === null || currentalbum === undefined || currentalbum === '') ? '<span class="notag">[no album]</span>' : currentalbum);
        } else {
            $('#currentartist').html((currentartist === null || currentartist === undefined || currentartist === '') ? radioname : currentartist);
            $('#currentsong').html((currentsong === null || currentsong === undefined || currentsong === '') ? radioname : currentsong);
            $('#currentalbum').html('<span class="notag">streaming</span>');
        }
        if (GUI.json.repeat === '1') {
            $('#repeat').addClass('btn-primary');
        } else {
            $('#repeat').removeClass('btn-primary');
        }
        if (GUI.json.random === '1') {
            $('#random').addClass('btn-primary');
        } else {
            $('#random').removeClass('btn-primary');
        }
        if (GUI.json.consume === '1') {
            $('#consume').addClass('btn-primary');
        } else {
            $('#consume').removeClass('btn-primary');
        }
        if (GUI.json.single === '1') {
            $('#single').addClass('btn-primary');
        } else {
            $('#single').removeClass('btn-primary');
        }
        GUI.currentsong = currentsong;
        var currentalbumstring = currentartist + ' - ' + currentalbum;
        if (GUI.currentalbum !== currentalbumstring) {
            if (radioname === null || radioname === undefined || radioname === '') {
                var covercachenum = Math.floor(Math.random()*1001);
                $('#cover-art').css('background-image','url("/coverart/?v=' + covercachenum + '")');
            } else {
                $('#cover-art').css('background-image','url("assets/img/cover-radio.jpg")');
            }
        }
        GUI.currentalbum = currentalbumstring;
    }
// ****************************************************************************************
// observe song change for lyrics
	if (!$('#lyricfade').hasClass('hide') && $('#currentsong').text() != $('h4.ui-pnotify-title').text()) {
		PNotify.removeAll();
		$('#currentsong').click();
	}
// ****************************************************************************************
 }

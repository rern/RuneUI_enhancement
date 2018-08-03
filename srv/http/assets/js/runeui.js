/*
 * Copyright (C) 2013 RuneAudio Team
 * http://www.runeaudio.com
 *
 * RuneUI
 * copyright (C) 2013 – Andrea Coiutti (aka ACX) & Simone De Gregori (aka Orion)
 *
 * RuneOS
 * copyright (C) 2013 – Carmelo San Giovanni (aka Um3ggh1U)
 *
 * RuneAudio website and logo
 * copyright (C) 2013 – ACX webdesign (Andrea Coiutti)
 *
 * This Program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3, or (at your option)
 * any later version.
 *
 * This Program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with RuneAudio; see the file COPYING.    If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.txt>.
 *
 *    file: runeui.js
 *    version: 1.3
 *
 */


// ====================================================================================================
// Global GUI Array
// ====================================================================================================

var GUI = {
    DBentry: ['','',''],
    DBupdate: 0,
    activePlayer: '',
    browsemode: 'file',
    checkvol: 0,
    currentDBpos: [0,0,0,0,0,0,0,0,0,0,0],
    currentDBpath: ['','','','','','','','','','',''],
    currentalbum: null,
    currentknob: null,
    currentpath: '',
    currentsong: null,
    json: 0,
    libraryhome: '',
    forceGUIupdate: false,
    maxvol: 100,
    minvol: 0,
    mode: 'websocket',
    noticeUI: {},
    playlist: null,
    plugin: '',
    state: '',
    old_state: 'none',
    stepVolumeDelta: 0,
    stepVolumeInt: 0,
    stream: '',
    visibility: 'visible',
    vol_changed_local: 0,
    volume: null,
    clientUUID: null
};



// ====================================================================================================
// FUNCTIONS
// ====================================================================================================

// generate UUID
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

// send a MPD playback control command
function sendCmd(inputcmd) {
    $.ajax({
        type: 'GET',
        url: '/command/?cmd=' + inputcmd + '&clientUUID=' + GUI.clientUUID,
        cache: false
    });
}

// check WebSocket support
function checkWebSocket(){
    if (window.WebSocket){
        return 'websocket';
    } else {
        return 'longpolling';
    }
}

// check HTML5 Workers support
function checkWorkers(){
    if ((window.Worker && window.Blob) || (Modernizr.webworkers && Modernizr.blobconstructor)) {
        return true;
    } else {
        return false;
    }
}

// recover the path from input string
function parsePath(str) {
    var cutpos = str && str.length? str.lastIndexOf('/'):0;
    //-- verify this switch! (Orion)
    var songpath = '';
    if (cutpos && cutpos !== -1){
        songpath = str.slice(0,cutpos);
    }
    return songpath;
}

$(document).ready(function () {

    // get an UUID for the client
    GUI.clientUUID = generateUUID();

});
    
// custom scrolling
function customScroll(list, destination, speed) {
    if (typeof(speed) === 'undefined') {
        speed = 500;
    }
    var entryheight = 49;
    var centerheight = parseInt($(window).height()/2);
    var scrolltop = $(window).scrollTop();
    var scrollcalc = 0;
    var scrolloffset = 0;
    if (list === 'db') {
        scrollcalc = parseInt((destination)*entryheight - centerheight);
        scrolloffset = scrollcalc;
    } else if (list === 'pl') {
        //var scrolloffset = parseInt((destination + 2)*entryheight - centerheight);
        scrollcalc = parseInt((destination + 2)*entryheight - centerheight);
        scrolloffset = Math.abs(scrollcalc - scrolltop);
        scrolloffset = (scrollcalc > scrolltop ? '+':'-') + '=' + scrolloffset + 'px';
        $('#playlist-entries').find('li').eq(destination).addClass('active');
    }
}

// [!] scrolling debug purpose only
function randomScrollPL() {
    var n = $('.playlist li').size();
    var random = 1 + Math.floor(Math.random() * n);
    customScroll('pl', random);
}
function randomScrollDB() {
    var n = $('.database li').size();
    var random = 1 + Math.floor(Math.random() * n);
    customScroll('db', random);
}

// toggle blocking loading layer (spinning arrows)
function toggleLoader(action) {
    if (action === 'close') {
        $('#loader').addClass('hide');
    } else {
        if ($('#section-dev').length) {
            $('#loader').addClass('hide');
            new PNotify({
                title: 'Warning',
                text: 'The loading layer (spinning arrows) points to a socket error',
                icon: 'fa fa-exclamation-circle'
            });
        } else {
            $('#loader').removeClass('hide');
        }
    }
}

// custom complex notifies
function customNotify(notify) {
    if (notify.custom === 'kernelswitch') {
        if (GUI.noticeUI.kernelswitch !== undefined) {
            GUI.noticeUI.kernelswitch.remove();
        }
        GUI.noticeUI.kernelswitch = new PNotify({
            title: ('title' in notify) ? notify.title : '[missing title]',
            text: ('text' in notify) ? notify.text : '[missing text]',
            icon: 'fa fa-refresh',
            hide: false,
            confirm: {
                confirm: true,
                buttons: [{
                    text: notify.btntext,
                    addClass: 'btn-default btn-block  uppercase',
                    click: function() {
                        $.post('/settings/', { 'syscmd' : 'reboot' });
                        toggleLoader();
                    }
                },
                {
                    text: 'Cancel',
                    addClass: 'hide'
                }]
            },
            buttons: {
                closer: false,
                sticker: false
            }
        });
    }
}

// notify messages rendering
function renderMSG(text) {
    var notify = text[0];
    if ('custom' in notify && notify.custom !== null) {
        customNotify(notify);
        return;
    }
    var noticeOptions = {
        title: ('title' in notify) ? notify.title : '[missing title]',
        text: ('text' in notify) ? notify.text : '[missing text]',
        icon: (notify.icon === undefined) ? 'fa fa-check' : notify.icon,
        opacity: (notify.opacity === undefined) ? 0.9 : notify.opacity,
        hide: (notify.hide === undefined && notify.permanotice === undefined),
        buttons: {
            closer: (notify.permanotice === undefined),
            sticker: (notify.permanotice === undefined)
        },
        delay: (notify.delay === undefined) ? 8000 : notify.delay,
        mouse_reset: false
    };
    if ('permanotice' in notify) {
        if (GUI.noticeUI[notify.permanotice] === undefined) {
            GUI.noticeUI[notify.permanotice] = new PNotify(noticeOptions);
        } else {
            if ('permaremove' in notify) {
                GUI.noticeUI[notify.permanotice].remove();
                GUI.noticeUI[notify.permanotice] = undefined;
            } else {
                GUI.noticeUI[notify.permanotice].open();
            }
        }
    } else {
        new PNotify(noticeOptions);
    }
}

// sorting commands
function sortOrder(id) {
    var pos = $('#' + id).index();
    id = parseInt(id.replace('pl-', ''));
    sendCmd('moveid ' + id + ' ' + pos);
}

// loading spinner display/hide
function loadingSpinner(section, hide) {
    if (hide === 'hide') {
        if (section === 'db') {
            $('#spinner-db').addClass('hide');
        }
        if (section === 'pl') {
            $('#spinner-pl').addClass('hide');
        }
    } else {
        if (section === 'db') {
            $('#spinner-db').removeClass('hide');
        }
        if (section === 'pl') {
            $('#spinner-pl').removeClass('hide');
        }
    }
}

// update the playback source
function setPlaybackSource() {
    var activePlayer = GUI.libraryhome.ActivePlayer;
    // update the playback section
    $('#overlay-playsource-open button').text(activePlayer);
    $('#overlay-playsource a').addClass('inactive');
    var source = activePlayer.toLowerCase();
    $('#playsource-' + source).removeClass('inactive');
    // update volume knob and control buttons
    if (activePlayer === 'Spotify' || activePlayer === 'Airplay') {
        $('#volume').trigger('configure', {'readOnly': true, 'fgColor': '#1A242F'}).css({'color': '#1A242F'});
        $('#volume-knob').addClass('nomixer');
        $('#volume-knob button').prop('disabled', true);
        $('#single').addClass('disabled');
    } else {
        $('#volume').trigger('configure', {'readOnly': false, 'fgColor': '#0095D8'}).css({'color': '#0095D8'});
        $('#volume-knob').removeClass('nomixer');
        $('#volume-knob button').prop('disabled', false);
        $('#single').removeClass('disabled');
    }
    // style the queue
    $('#playlist-entries').removeClass(function(index, css) {
        return (css.match (/(^|\s)playlist-\S+/g) || []).join(' ');
    }).addClass('playlist-' + source);
    // toggle queue buttons
    $('#pl-manage').removeClass(function(index, css) {
        return (css.match (/(^|\s)pl-manage-\S+/g) || []).join(' ');
    }).addClass('pl-manage-' + source);
}

function chkKey(key) {
    return (key !== undefined && key !== '');
}

// launch the playing queue refresh (PushStream mode, not implemented yet)
function getPlaylist(text) {
    data = text[0];
    if ( data.length > 4) {
        $('.playlist').addClass('hide');
        $('#playlist-entries').removeClass('hide');
        // console.time('getPlaylistPlain timer');
        getPlaylistPlain(data);
        // console.timeEnd('getPlaylistPlain timer');
        
        var current = parseInt(GUI.json.song);
        if ($('#panel-dx').hasClass('active') && GUI.currentsong !== GUI.json.currentsong) {
            customScroll('pl', current, 200); // center the scroll and highlight current song in playlist
        }
    } else {
        $('.playlist').addClass('hide');
        $('#playlist-warning').removeClass('hide');
        $('#pl-filter-results').addClass('hide').html('');
        $('#pl-count').removeClass('hide').html('0 entries');
    }
    loadingSpinner('pl', 'hide');
}

// render saved playlists
function renderPlaylists(data){
    var content = '', playlistname = '';
    var i, line, lines=data.split('\n'), infos=[];
    for (i = 0; (line = lines[i]); i += 1 ) {
        infos = line.split(': ');
        if( 'playlist' === infos[0] ) {
            playlistname = infos[1];
            content += '<li class="pl-folder" data-path="' + playlistname + '"><i class="fa fa-bars pl-action" data-target="#context-menu-playlist" data-toggle="context" title="Actions"></i><span><i class="fa fa-list-ol"></i>' + playlistname + '</span></li>';
            playlistname = '';
        }
    }
    document.getElementById('playlist-entries').innerHTML = '';
    $('.playlist').addClass('hide');
    $('#pl-manage').addClass('hide');
    $('#pl-count').addClass('hide');
    $('#pl-filter-results').removeClass('hide').addClass('back-to-queue').html('<i class="fa fa-arrow-left sx"></i> to queue');
    $('#pl-currentpath').removeClass('hide');
    $('#pl-editor').removeClass('hide');
    document.getElementById('pl-editor').innerHTML = content;
    loadingSpinner('pl', 'hide');
}

// get saved playlists
function getPlaylists(){
    loadingSpinner('pl');
    $.ajax({
        url: '/command/?cmd=listplaylists',
        success: function(data){
            renderPlaylists(data);
        },
        cache: false
    });
}

// update save playlist dropdown
function updatePlaylistDropdown(data){
    var i, line, lines=data.split('\n'), infos=[];
    var options = '';
    for (i = 0; (line = lines[i]); i += 1 ) {
        infos = line.split(': ');
        if( 'playlist' === infos[0] ) {
            options += '<option value="'+infos[1]+'" />';
        }
    }
    document.getElementById('pl-list').innerHTML = options;
    loadingSpinner('pl', 'hide');
}

// get saved playlists
function getPlaylistsDropdown(){
    loadingSpinner('pl');
    $.ajax({
        url: '/command/?cmd=listplaylists',
        success: function(data){
            updatePlaylistDropdown(data);
        },
        cache: false
    });
}

// parse the JSON response and return the formatted code
function parseResponse(options) {
    // DEFAULTS
    var inputArr = options.inputArr || '',
        respType = options.respType || '',
        i = options.i || 0,
        inpath = options.inpath || '',
        querytype = options.querytype || '',
        content = '';
        
    // DEBUG
    
    switch (respType) {
        case 'playlist':
            // code placeholder
        break;
        
        case 'db':
        // normal MPD browsing by file
            if (GUI.browsemode === 'file') {
            // browse by file
                if (inpath === '' && inputArr.file !== undefined) {
                    inpath = parsePath(inputArr.file);
                }
                if (inputArr.file !== undefined || inpath === 'Webradio') {
                    // DEBUG
                    content = '<li id="db-' + (i + 1) + '" data-path="';
                    if (inputArr.Title !== undefined) {
                    // files
                        content += inputArr.file;
                        content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
                        content += inputArr.Title + ' <span>' + timeConvert(inputArr.Time) + '</span></span>';
                        content += ' <span class="bl">';
                        content +=  inputArr.Artist;
                        content += ' - ';
                        content +=  inputArr.Album;
                    } else {
                        if (inpath !== 'Webradio') {
                        // files with no tags
                            content += inputArr.file;
                            content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
                            content += inputArr.file.replace(inpath + '/', '') + ' <span>' + timeConvert(inputArr.Time) + '</span></span>';
                            content += '<span class="bl">';
                            content += ' path: ';
                            content += inpath;
                        } else {
                        // webradio playlists
                            content += inputArr.playlist;
                            content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-webradio"></i><i class="fa fa-webradio db-icon db-radio"></i>';
                            content += '<span class="sn">' + inputArr.playlist.replace(inpath + '/', '').replace('.' + inputArr.fileext , '');
                            content += '</span><span class="bl">webradio';
                        }
                    }
                    content += '</span></li>';
                } else if (inputArr.playlist !== undefined) {
                    if (inputArr.fileext === 'cue') {
                    // CUE files
                        content = '<li id="db-' + (i + 1) + '" data-path="';
                        content += inputArr.playlist;
                        content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-file-text db-icon"></i><span class="sn">';
                        content += inputArr.playlist.replace(inpath + '/', '') + ' <span>[CUE file]</span></span>';
                        content += '<span class="bl">';
                        content += ' path: ';
                        content += inpath;
                        content += '</span></li>';
                    }
                } else {
                // folders
                    content = '<li id="db-' + (i + 1) + '" class="db-folder" data-path="';
                    content += inputArr.directory;
                    if (inpath !== '') {
                        content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu"></i><span><i class="fa fa-folder-open"></i>';
                    } else {
                        content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-root"></i><i class="fa fa-hdd-o icon-root"></i><span>';
                    }
                    content += inputArr.directory.replace(inpath + '/', '');
                    content += '</span></li>';
                }
            } else if (GUI.browsemode === 'album' || GUI.browsemode === 'albumfilter') {
            // browse by album
                if (inputArr.file !== undefined) {
                    content = '<li id="db-' + (i + 1) + '" data-path="';
                    content += inputArr.file;
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
                    content += inputArr.Title + ' <span>' + timeConvert(inputArr.Time) + '</span></span>';
                    content += ' <span class="bl">';
                    content +=  inputArr.Artist;
                    content += ' - ';
                    content +=  inputArr.Album;
                    content += '</span></li>';
                } else if (inputArr.album !== '') {
                    content = '<li id="db-' + (i + 1) + '" class="db-folder db-album" data-path="';
                    content += inputArr.album.replace(/\"/g,'&quot;');
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-album"></i><span><i class="fa fa-dot-circle-o"></i>';
                    content += inputArr.album;
                    content += '</span></li>';
                }
            } else if (GUI.browsemode === 'artist') {
            // browse by artist
                if (inputArr.album !== undefined) {
                    content = '<li id="db-' + (i + 1) + '" class="db-folder db-album" data-path="';
                    content += inputArr.album;
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-album"></i><span><i class="fa fa-dot-circle-o"></i>';
                    content += (inputArr.album !== '') ? inputArr.album : 'Unknown album';
                    content += '</span></li>';
                } else if (inputArr.artist !== '') {
                    content = '<li id="db-' + (i + 1) + '" class="db-folder db-artist" data-path="';
                    content += inputArr.artist;
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-artist"></i><span><i class="fa fa-user"></i>';
                    content += inputArr.artist;
                    content += '</span></li>';
                }
            } else if (GUI.browsemode === 'composer') {
            // browse by composer
                if (inputArr.file !== undefined) {
                    content = '<li id="db-' + (i + 1) + '" data-path="';
                    content += inputArr.file;
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i><i class="fa fa-music db-icon"></i><span class="sn">';
                    content += inputArr.Title + ' <span>' + timeConvert(inputArr.Time) + '</span></span>';
                    content += ' <span class="bl">';
                    content +=  inputArr.Artist;
                    content += ' - ';
                    content +=  inputArr.Album;
                    content += '</span></li>';
                } else if (inputArr.composer !== '') {
                    content = '<li id="db-' + (i + 1) + '" class="db-folder db-composer" data-path="';
                    content += inputArr.composer;
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-composer"></i><span><i class="fa fa-user"></i>';
                    content += inputArr.composer;
                    content += '</span></li>';
                }
            } else if (GUI.browsemode === 'genre') {
            // browse by genre
                if (inputArr.artist !== undefined) {
                    content = '<li id="db-' + (i + 1) + '" class="db-folder db-artist" data-path="';
                    content += inputArr.artist;
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-artist"></i><span><i class="fa fa-dot-circle-o"></i>';
                    content += (inputArr.artist !== '') ? inputArr.artist : 'Unknown artist';
                    content += '</span></li>';
                } else if (inputArr.genre !== '') {
                    content = '<li id="db-' + (i + 1) + '" class="db-folder db-genre" data-path="';
                    content += inputArr.genre;
                    content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-genre"></i><span><i class="fa fa-tags"></i>';
                    content += inputArr.genre;
                    content += '</span></li>';
                }
            }
        break;
        
        case 'Spotify':
        // Spotify plugin
            if (querytype === '') {
            // folders
                content = '<li id="db-' + (i + 1) + '" class="db-spotify db-folder" data-path="';
                content += inputArr.index;
                content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-spotify-pl"></i><span><i class="fa fa-folder-open"></i>';
                content += (inputArr.name !== '') ? inputArr.name : 'Favorites';
                content += ' (';
                content += inputArr.tracks;
                content += ')</span></li>';
            } else if (querytype === 'tracks') {
            // playlists
                content = '<li id="db-' + (i + 1) + '" class="db-spotify" data-path="';
                content += inputArr.index;
                content += '" data-plid="';
                content += inpath;
                content += '" data-type="spotify-track"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-spotify"></i><i class="fa fa-spotify db-icon"></i><span class="sn">';
                content += inputArr.title + ' <span>' + timeConvert(inputArr.duration/1000) + '</span></span>';
                content += ' <span class="bl">';
                content +=  inputArr.artist;
                content += ' - ';
                content +=  inputArr.album;
                content += '</span></li>';
            }
        break;
        
        case 'Dirble':
        // Dirble plugin
            if (querytype === '' || querytype === 'childs') {
            // folders
                var childClass = (querytype === 'childs') ? ' db-dirble-child' : '';
                content = '<li id="db-' + (i + 1) + '" class="db-dirble db-folder' + childClass + '" data-path="';
                content += inputArr.id;
                content += '"><span><i class="fa fa-folder-open"></i>';
                content += inputArr.title;
                content += '</span></li>';
            } else if (querytype === 'search' || querytype === 'stations' || querytype === 'childs-stations') {
            // stations
                if (inputArr.streams.length === 0) {
                    break; // Filter stations with no streams
                }
                content = '<li id="db-' + (i + 1) + '" class="db-dirble db-radio" data-path="';
                content += inputArr.name + ' | ' + inputArr.streams[0].stream;
                content += '"><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-dirble"></i><i class="fa fa-webradio db-icon"></i>';
                content += '<span class="sn">' + inputArr.name + '<span>(' + inputArr.country + ')</span></span>';
                content += '<span class="bl">';
                content += inputArr.website ? inputArr.website : '-no website-';
                content += '</span></li>';
            }
        break;
        
        case 'Jamendo':
        // Jamendo plugin
            // if (querytype === 'radio') {
                content = '<li id="db-' + (i + 1) + '" class="db-jamendo db-folder" data-path="';
                content += inputArr.stream;
                content += '"><img class="jamendo-cover" src="/tun/' + inputArr.image + '" alt=""><i class="fa fa-bars db-action" title="Actions" data-toggle="context" data-target="#context-menu-file"></i>';
                content += inputArr.dispname + '</div></li>';
            // }
        break;
        
    }
    return content;
} // end parseResponse()

// populate the Library view lists with entries
function populateDB(options){
    // DEFAULTS
    var data = options.data || '',
        path = options.path || '',
        uplevel = options.uplevel || 0,
        keyword = options.keyword || '',
        plugin = options.plugin || '',
        querytype = options.querytype || '',
        args = options.args || '',
        content = '',
        i = 0,
        row = [];
        
    // DEBUG

    if (plugin !== '') {
    // plugins
        if (plugin === 'Spotify') {
        // Spotify plugin
            $('#database-entries').removeClass('hide');
            $('#db-level-up').removeClass('hide');
            $('#home-blocks').addClass('hide');
            if (path) {
                GUI.currentpath = path;
            }
            document.getElementById('database-entries').innerHTML = '';
            data = (querytype === 'tracks') ? data.tracks : data.playlists;

            data.sort(function(a, b){
                if (path === 'Spotify' && querytype === '') {
                    nameA = a.hasOwnProperty('name')?a.name.toLowerCase():'';
                    nameB = b.hasOwnProperty('name')?b.name.toLowerCase():'';
                } else if (querytype === 'tracks') {
                    nameA = a.hasOwnProperty('title')?a.title.toLowerCase():'';
                    nameB = b.hasOwnProperty('title')?b.title.toLowerCase():'';
                } else {
                    return 0;
                }
                if (nameA < nameB) //sort string ascending
                    return -1;
                if (nameA > nameB)
                    return 1;
                return 0; //default return value (no sorting)
            });
            for (i = 0; (row = data[i]); i += 1) {
                content += parseResponse({
                    inputArr: row,
                    respType: 'Spotify',
                    i: i,
                    querytype: querytype,
                    inpath: args
                });
            }
            document.getElementById('database-entries').innerHTML = content;
        }
        if (plugin === 'Dirble') {
        // Dirble plugin
            $('#database-entries').removeClass('hide');
            $('#db-level-up').removeClass('hide');
            $('#home-blocks').addClass('hide');
            if (path) {
                if (querytype === 'search') {
                    GUI.currentpath = 'Dirble';
                } else {
                    GUI.currentpath = path;
                }
            }
            if (querytype === 'childs-stations') {
                content = document.getElementById('database-entries').innerHTML;
            } else {
                document.getElementById('database-entries').innerHTML = '';
            }
            
            data.sort(function(a, b){
                if (querytype === 'childs' || querytype === 'categories') {
                    nameA = a.hasOwnProperty('title')?a.title.toLowerCase():'';
                    nameB = b.hasOwnProperty('title')?b.title.toLowerCase():'';
                } else if (querytype === 'childs-stations' || querytype === 'stations') {
                    nameA = a.hasOwnProperty('name')?a.name.toLowerCase():'';
                    nameB = b.hasOwnProperty('name')?b.name.toLowerCase():'';
                } else {
                    return 0;
                }
                if (nameA < nameB) //sort string ascending
                    return -1;
                if (nameA > nameB)
                    return 1;
                return 0; //default return value (no sorting)
            });

            for (i = 0; (row = data[i]); i += 1) {
                content += parseResponse({
                    inputArr: row,
                    respType: 'Dirble',
                    i: i,
                    querytype: querytype
                });
            }
            document.getElementById('database-entries').innerHTML = content;
        }
        if (plugin === 'Jamendo') {
        // Jamendo plugin
            $('#database-entries').removeClass('hide');
            $('#db-level-up').removeClass('hide');
            $('#home-blocks').addClass('hide');
            if (path) {
                GUI.currentpath = path;
            }
            document.getElementById('database-entries').innerHTML = '';

            data.sort(function(a, b){
                if (path === 'Jamendo' && querytype === '') {
                    nameA = a.hasOwnProperty('dispname')?a.dispname.toLowerCase():'';
                    nameB = b.hasOwnProperty('dispname')?b.dispname.toLowerCase():'';
                } else {
                    return 0;
                }
                if (nameA < nameB) //sort string ascending
                    return -1;
                if (nameA > nameB)
                    return 1;
                return 0; //default return value (no sorting)
            });
            for (i = 0; (row = data[i]); i += 1) {
                content += parseResponse({
                    inputArr: row,
                    respType: 'Jamendo',
                    i: i,
                    querytype: querytype
                });
            }
            document.getElementById('database-entries').innerHTML = content;
        }
    } else {
    // normal MPD browsing
        if (path === '' && keyword === '') {
        // Library home
            renderLibraryHome();
            return;
        } else {
        // browsing
            $('#database-entries').removeClass('hide');
            $('#db-level-up').removeClass('hide');
            $('#home-blocks').addClass('hide');
            if (path) {
                GUI.currentpath = path;
            }
            document.getElementById('database-entries').innerHTML = '';
            if (keyword !== '') {
            // search results
                var results = (data.length) ? data.length : '0';
                var s = (data.length === 1) ? '' : 's';
                $('#db-level-up').addClass('hide');
                $('#db-search-results').removeClass('hide').html('<i class="fa fa-times sx"></i><span class="visible-xs-inline">back</span><span class="hidden-xs">' + results + ' result' + s + ' for "<span class="keyword">' + keyword + '</span>"</span>');
            }
            data.sort(function(a, b){
                if (path === 'Artists' || path === 'AlbumArtists'|| path === 'Various Artists') {
                    nameA = a.hasOwnProperty('artist')?a.artist.toLowerCase():'';
                    nameB = b.hasOwnProperty('artist')?b.artist.toLowerCase():'';
                } else if (path === 'Albums') {
                    nameA = a.hasOwnProperty('album')?a.album.toLowerCase():'';
                    nameB = b.hasOwnProperty('album')?b.album.toLowerCase():'';
                } else if (path === 'Webradio') {
                    nameA = a.hasOwnProperty('playlist')?a.playlist.toLowerCase():'';
                    nameB = b.hasOwnProperty('playlist')?b.playlist.toLowerCase():'';
                } else if (path === 'Genres') {
                    nameA = a.hasOwnProperty('genre')?a.genre.toLowerCase():'';
                    nameB = b.hasOwnProperty('genre')?b.genre.toLowerCase():'';
                } else {
                    return 0;
                }
                if (nameA < nameB) //sort string ascending
                    return -1;
                if (nameA > nameB)
                    return 1;
                return 0; //default return value (no sorting)
            });
            if (path === 'Webradio') {
                content += '<li id="webradio-add" class="db-webradio-add"><i class="fa fa-plus-circle db-icon"></i><span class="sn"><em>add new</em></span><span class="bl">add a webradio to your library</span></li>';
            }
            for (i = 0; (row = data[i]); i += 1) {
                content += parseResponse({
                    inputArr: row,
                    respType: 'db',
                    i: i,
                    inpath: path
                });
            }
            document.getElementById('database-entries').innerHTML = content;
            // DEBUG
        }
    }
    var breadcrumb = $('span', '#db-currentpath');
    if (GUI.browsemode === 'album') {
        if (path === 'Albums') {
            breadcrumb.html(path);
        } else {
            breadcrumb.html('Albums/' + path);
        }
    } else if (GUI.browsemode === 'artist') {
        if (path === 'Artists') {
            breadcrumb.html(path);
        } else {
            breadcrumb.html('Artists/' + path);
        }
    } else if (GUI.browsemode === 'composer') {
        if (path === 'Composer') {
            breadcrumb.html(path);
        } else {
            breadcrumb.html('Composer/' + path);
        }
    } else if (GUI.browsemode === 'genre') {
        if (path === 'Genres') {
            breadcrumb.html(path);
        } else {
            breadcrumb.html('Genres/' + path);
        }
    } else {
        breadcrumb.html(path);
    }
    $('#db-homeSetup').addClass('hide');
    if (uplevel) {
        var position = GUI.currentDBpos[GUI.currentDBpos[10]];
        $('#db-' + position).addClass('active');
        customScroll('db', position, 0);
    } else {
        customScroll('db', 0, 0);
    }
    if (querytype != 'childs') {
        loadingSpinner('db', 'hide');
    }
} // end populateDB()

// launch the right AJAX call for Library rendering
function getDB(options){
    // DEFAULTS
    var cmd = options.cmd || 'browse',
        path = options.path || '',
        browsemode = options.browsemode || 'file',
        uplevel = options.uplevel || '',
        plugin = options.plugin || '',
        querytype = options.querytype || '',
        args = options.args || '';
        
    // DEBUG
    
    loadingSpinner('db');
    GUI.browsemode = browsemode;
    
    if (plugin !== '') {
    // plugins
        if (plugin === 'Spotify') {
        // Spotify plugin
            $.post('/db/?cmd=spotify', { 'plid': args }, function(data){
                populateDB({
                    data: data,
                    path: path,
                    plugin: plugin,
                    querytype: querytype,
                    uplevel: uplevel,
                    args: args
                });
            }, 'json');
        }
        else if (plugin === 'Dirble') {
        // Dirble plugin
            if (querytype === 'childs') {
                $.post('/db/?cmd=dirble', { 'querytype': 'childs', 'args': args }, function(data){
                    populateDB({
                        data: data,
                        path: path,
                        plugin: plugin,
                        querytype: 'childs',
                        uplevel: uplevel
                    });
                }, 'json');
                $.post('/db/?cmd=dirble', { 'querytype': 'childs-stations', 'args': args }, function(data){
                    populateDB({
                        data: data,
                        path: path,
                        plugin: plugin,
                        querytype: 'childs-stations',
                        uplevel: uplevel
                    });
                }, 'json');            
            } else {
                $.post('/db/?cmd=dirble', { 'querytype': (querytype === '') ? 'categories' : querytype, 'args': args }, function(data){
                    populateDB({
                        data: data,
                        path: path,
                        plugin: plugin,
                        querytype: querytype,
                        uplevel: uplevel
                    });
                }, 'json');
            }
        }
        else if (plugin === 'Jamendo') {
        // Jamendo plugin
            $.post('/db/?cmd=jamendo', { 'querytype': (querytype === '') ? 'radio' : querytype, 'args': args }, function(data){
                populateDB({
                    data: data.results,
                    path: path,
                    plugin: plugin,
                    querytype: querytype
                });
            }, 'json');
        }
    } else {
    // normal browsing
        if (cmd === 'search') {
            var keyword = $('#db-search-keyword').val();
            if (path.match(/Dirble/)) {
                $.post('/db/?cmd=dirble', { 'querytype': 'search', 'args': keyword }, function(data){
                    populateDB({
                        data: data,
                        path: path,
                        plugin: 'Dirble',
                        querytype: 'search',
                        uplevel: uplevel
                    });
                }, 'json');
            } else {
                $.post('/db/?querytype=' + GUI.browsemode + '&cmd=search', { 'query': keyword }, function(data) {
                    populateDB({
                        data: data,
                        path: path,
                        uplevel: uplevel,
                        keyword: keyword
                    });
                }, 'json');
            }
        } else if (cmd === 'browse') {
            $.post('/db/?cmd=browse', { 'path': path, 'browsemode': GUI.browsemode }, function(data) {
                populateDB({
                    data: data,
                    path: path,
                    uplevel: uplevel
                });
            }, 'json');
        } else {
        // EXAMPLE: cmd === 'update', 'addplay', 'addreplaceplay', 'update'
            loadingSpinner('db', 'hide');
            $.post('/db/?cmd='+cmd, { 'path': path, 'querytype': querytype }, function(path) {
            }, 'json');
        }
    }
} // end getDB()

// on release knob
function onreleaseKnob(value) {
    if (GUI.state !== 'stop' && GUI.state !== '') {
        if (GUI.stream !== 'radio') {
            window.clearInterval(GUI.currentKnob);
            var seekto = Math.floor((value * parseInt(GUI.json.time)) / 1000);
            sendCmd('seek ' + GUI.json.song + ' ' + seekto);
            $('#time').val(value);
            $('#countdown-display').countdown('destroy');
            $('#countdown-display-ss').countdown('destroy');
            $('#countdown-display').countdown({since: -seekto, compact: true, format: 'MS'});
            $('#countdown-display-ss').countdown({since: -seekto, compact: true, format: 'MS'});
        } else {
            $('#time').val(0).trigger('change');
        }
    }
}

// playback command buttons
function commandButton(el) {
    var dataCmd = el.data('cmd');
    var cmd;
    // stop
    if (dataCmd === 'stop') {
        el.addClass('btn-primary');
        $('#play').removeClass('btn-primary');
        if ($('#section-index').length) {
            refreshTimer(0, 0, 'stop');
            window.clearInterval(GUI.currentKnob);
            $('.playlist').find('li').removeClass('active');
            $('#total').html('00:00');
            $('#total-ss').html('00:00');
        }
    }
    // play/pause
    else if (dataCmd === 'play') {
        var state = GUI.state;
        //if (json.currentsong != null) {
        if (state === 'play') {
            cmd = 'pause';
            if ($('#section-index').length) {
                $('#countdown-display').countdown('pause');
                $('#countdown-display-ss').countdown('pause');
            }
        } else if (state === 'pause') {
            cmd = 'play';
            if ($('#section-index').length) {
                $('#countdown-display').countdown('resume');
                $('#countdown-display-ss').countdown('resume');
            }
        } else if (state === 'stop') {
            cmd = 'play';
            if ($('#section-index').length) {
                $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
                $('#countdown-display-ss').countdown({since: 0, compact: true, format: 'MS'});
            }
        }
        //$(this).find('i').toggleClass('fa fa-play').toggleClass('fa fa-pause');
        window.clearInterval(GUI.currentKnob);
        sendCmd(cmd);
        return;
        // } else {
            // $(this).addClass('btn-primary');
            // $('#stop').removeClass('btn-primary');
            // $('#time').val(0, false).trigger('update');
            // $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
        // }
    }
    // previous/next
    else if (dataCmd === 'previous' || dataCmd === 'next') {
        if ($('#section-index').length) {
            $('#countdown-display').countdown('pause');
            $('#countdown-display-ss').countdown('pause');
            window.clearInterval(GUI.currentKnob);
        }
    }
    // step volume control
    else if (el.hasClass('btn-volume')) {
        var vol;
        var knobvol = parseInt($('#volume').val());
        if (dataCmd === 'volumedn' && parseInt(GUI.volume) > 0) {
            vol = parseInt(GUI.volume) - 1;
            GUI.volume = vol;
            $('#volumemute').removeClass('btn-primary');
        } else if (dataCmd === 'volumeup' && parseInt(GUI.volume) < 100) {
            vol = parseInt(GUI.volume) + 1;
            GUI.volume = vol;
            $('#volumemute').removeClass('btn-primary');
        } else if (dataCmd === 'volumemute') {
            if (knobvol !== 0 ) {
                GUI.volume = knobvol;
                el.addClass('btn-primary');
                vol = 0;
            } else {
                el.removeClass('btn-primary');
                vol = GUI.volume;
            }
        }
        if ((vol >= 0) && (vol <= 100)) {
            sendCmd('setvol ' + vol);
            $('#volume').val(vol, false).trigger('update');
        }
        return;
    }

    // toggle buttons
    if (el.hasClass('btn-toggle')) {
        cmd = dataCmd + (el.hasClass('btn-primary')? ' 0':' 1');
        el.toggleClass('btn-primary');
    // send command
    } else {
        cmd = dataCmd;
    }
    sendCmd(cmd);
}

// Library home screen
function libraryHome(text) {
    GUI.libraryhome = text[0];
    if (GUI.libraryhome.clientUUID === GUI.clientUUID && GUI.plugin !== 'Dirble' && GUI.currentpath !== 'Webradio') {
        renderLibraryHome(); // TODO: do it only while in home
    }
    if (GUI.currentpath === 'Webradio') {
        getDB({
            path: 'Webradio',
            uplevel: 0
		});
    }
	if (GUI.forceGUIupdate === true) {
        GUI.forceGUIupdate = false;
		renderLibraryHome();
	}
}

// list of in range wlans
function listWLANs(text) {
    var i = 0, content = '', inrange = '', stored = '', wlans = text[0];
    $.each(wlans, function(i) {
        content += '<p><a href="/network/wlan/' + wlans[i].nic + '/' + wlans[i].ESSID + '" class="btn btn-lg btn-default btn-block" title="See network properties">';
        if (wlans[i].connected !== 0) {
            content += '<i class="fa fa-check green sx"></i>';
        }
        if (wlans[i].storedprofile === 1 && wlans[i].encryption === 'on') {
            content += '<i class="fa fa-lock sx"></i>';
        } else {
            if (wlans[i].encryption === 'on') {
                content += '<i class="fa fa-rss fa-wifi"></i><i class="fa fa-lock sx"></i>';
            } else {
                if (wlans[i].storedprofile !== 1 ) {
                content += '<i class="fa fa-rss fa-wifi sx"></i>';
                }
            }
        }
        content += '<strong>' + wlans[i].ESSID + '</strong></a></p>';
        if (wlans[i].origin === 'scan') {
            inrange += content;
        }
        if (wlans[i].storedprofile === 1) {
            stored += content;
        }
        content = '';
    });
    if (inrange === '') {
        inrange = '<p><a class="btn btn-lg btn-default btn-block" href="#"><i class="fa fa-cog fa-spin sx"></i>scanning for networks...</a></p>';
    }
    document.getElementById('wifiNetworks').innerHTML = inrange;
    document.getElementById('wifiStored').innerHTML = stored;
    $.ajax({
        url: '/command/?cmd=wifiscan',
        cache: false
    });
}

// draw the NICs details table
function nicsDetails(text) {
    var i = 0, content = '', nics = text[0];
    $.each(nics, function(i) {
        if (i === $('#nic-details').data('name')) {
            content += '<tr><th>Name:</th><td><strong>' + i + '<strong></td></tr>';
            content += '<tr><th>Type:</th><td>wireless</td></tr>';
            if (nics[i].currentssid === null) {
                content += '<tr><th>Status:</th><td><i class="fa fa-times red sx"></i>no network connected</td></tr>';
            } else {
                content += '<tr><th>Status:</th><td><i class="fa fa-check green sx"></i>connected</td></tr>';
                content += '<tr><th>Associated SSID:</th><td><strong>' + nics[i].currentssid + '</strong></td></tr>';
            }
            
            content += '<tr><th>Assigned IP:</th><td>' + ((nics[i].ip !== null) ? ('<strong>' + nics[i].ip + '</strong>') : 'none') + '</td></tr>';
            content += '<tr><th>Speed:</th><td>' + ((nics[i].speed !== null) ? nics[i].speed : 'unknown') + '</td></tr>';
            if (nics[i].currentssid !== null) {
                content += '<tr><th>Netmask:</th><td>' + nics[i].netmask + '</td></tr>';
                content += '<tr><th>Gateway:</th><td>' + nics[i].gw + '</td></tr>';
                content += '<tr><th>DNS1:</th><td>' + nics[i].dns1 + '</td></tr>';
                content += '<tr><th>DNS2:</th><td>' + nics[i].dns2 + '</td></tr>';
            }
        }
    });
    $('#nic-details tbody').html(content);
}

// open the Playback UI refresh channel
function playbackChannel(){
    var pushstream = new PushStream({
        host: window.location.hostname,
        port: window.location.port,
        modes: GUI.mode,
        reconnectOnChannelUnavailableInterval: 5000
    });
    pushstream.onmessage = renderUI;
    pushstream.onstatuschange = function(status) {
        if (status === 2) {
            $('#loader').addClass('hide');
            sendCmd('renderui'); // force UI rendering (backend-call)
        } else {
            if (status === 0) {
                toggleLoader();
            }
        }
    };
    // pushstream.onerror = function() {
        // toggleLoader();
    // };
    pushstream.addChannel('playback');
    pushstream.connect();
}

// open the playing queue channel
function queueChannel(){
    var pushstream = new PushStream({
        host: window.location.hostname,
        port: window.location.port,
        modes: GUI.mode
    });
    pushstream.onmessage = getPlaylist;
    // pushstream.onstatuschange = function(status) {
    // force queue rendering (backend-call)
        // if (status === 2) sendCmd('renderpl');
    // };
    pushstream.addChannel('queue');
    pushstream.connect();
}

// open the library channel
function libraryChannel(){
    var pushstream = new PushStream({
        host: window.location.hostname,
        port: window.location.port,
        modes: GUI.mode
    });
    pushstream.onmessage = libraryHome;
    pushstream.addChannel('library');
    pushstream.connect();
}

// open the notify messages channel
function notifyChannel(){
    var pushstream = new PushStream({
        host: window.location.hostname,
        port: window.location.port,
        modes: GUI.mode
    });
    pushstream.onmessage = renderMSG;
    pushstream.addChannel('notify');
    pushstream.connect();
}

// open the in range Wi-Fi networks list channel
function wlansChannel(){
    var pushstream = new PushStream({
        host: window.location.hostname,
        port: window.location.port,
        modes: GUI.mode
    });
    pushstream.onmessage = listWLANs;
    pushstream.addChannel('wlans');
    pushstream.connect();
    $.ajax({
        url: '/command/?cmd=wifiscan',
        cache: false
    });
}

// open the NIC details channel
function nicsChannel(){
    var pushstream = new PushStream({
        host: window.location.hostname,
        port: window.location.port,
        modes: GUI.mode
    });
    pushstream.onmessage = nicsDetails;
    pushstream.addChannel('nics');
    pushstream.connect();
}

// trigger home overlays
function overlayTrigger(overlayID) {
    // var triggerBttn = $('#overlay-social-open'),
        // overlay = $('#overlay-social'),
        // closeBttn = $('button.overlay-close');
    var overlay = $(overlayID),
        triggerBttn = $(overlayID + '-open'),
        closeBttn = $(overlayID + '-close');
        transEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'msTransition': 'MSTransitionEnd',
            'transition': 'transitionend'
        };
        // transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
        // support = { transitions : Modernizr.csstransitions };
    function toggleOverlay() {
        if (overlay.hasClass('open')) {
            overlay.removeClass('open');
            overlay.addClass('closed');
            var onEndTransitionFn = function(ev) {
                if (support.transitions) {
                    if (ev.propertyName !== 'visibility') {
                        return;
                    }
                    this.removeEventListener( transEndEventName, onEndTransitionFn );
                }
                overlay.removeClass('closed');
            };
            // if (support.transitions) {
                // overlay.addEventListener( transEndEventName, onEndTransitionFn );
            // }
            // else {
                // onEndTransitionFn();
            // }
        }
        else if (overlay.hasClass('closed')) {
            overlay.addClass('open');
            if (overlayID === '#overlay-social') {
                var urlTwitter = 'https://twitter.com/home?status=Listening+to+' + GUI.json.currentsong.replace(/\s+/g, '+') + '+by+' + GUI.json.currentartist.replace(/\s+/g, '+') + '+on+%40RuneAudio+http%3A%2F%2Fwww.runeaudio.com%2F+%23nowplaying';
                var urlFacebook = 'https://www.facebook.com/sharer.php?u=http%3A%2F%2Fwww.runeaudio.com%2F&display=popup';
                var urlGooglePlus = 'https://plus.google.com/share?url=http%3A%2F%2Fwww.runeaudio.com%2F';
                $('#urlTwitter').attr('href', urlTwitter);
                $('#urlFacebook').attr('href', urlFacebook);
                $('#urlGooglePlus').attr('href', urlGooglePlus);
            }
        }
    }
    triggerBttn.click(function(){
        toggleOverlay();
    });
    closeBttn.click(function(){
        toggleOverlay();
    });
}

// check visibility of the window
function getHiddenProp(){
    var prefixes = ['webkit','moz','ms','o'];
    // if 'hidden' is natively supported just return it
    if ('hidden' in document) {
        return 'hidden';
    }
    // otherwise loop over all the known prefixes until we find one
    for (var i = 0; i < prefixes.length; i++){
        if ((prefixes[i] + 'Hidden') in document) {
            return prefixes[i] + 'Hidden';
        }
    }
    // otherwise it's not supported
    return null;
}
function isHidden() {
    var prop = getHiddenProp();
    if (!prop) {
        return false;
    }
    return document[prop];
}
function visChange() {
    if (isHidden()) {
        GUI.visibility = 'hidden';
    } else {
        GUI.visibility = 'visible';
    }
}



if ($('#section-index').length) {

// ====================================================================================================
// PLAYBACK SECTION
// ====================================================================================================

    jQuery(document).ready(function($){ 'use strict';

        // INITIALIZATION
        // ----------------------------------------------------------------------------------------------------
        
        // check WebSocket support
        GUI.mode = checkWebSocket();
        
        // first connection with MPD daemon
        // open UI rendering channel;
        playbackChannel();
        
        // open library channel
        libraryChannel();
        // startChannel(queueChannel());
        
        // first GUI update
        // updateGUI();
        
        // PNotify init options
        PNotify.prototype.options.styling = 'fontawesome';
        PNotify.prototype.options.stack.dir1 = 'up';
        PNotify.prototype.options.stack.dir2 = 'left';
        PNotify.prototype.options.stack.firstpos1 = 90;
        PNotify.prototype.options.stack.firstpos2 = 50;
        PNotify.prototype.options.stack.spacing1 = 10;
        PNotify.prototype.options.stack.spacing2 = 10;
        // open notify channel
        notifyChannel();
        
        // use the property name to generate the prefixed event name
        var visProp = getHiddenProp();
        if (visProp) {
            var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
            document.addEventListener(evtname, visChange);
        }
        // PLAYING QUEUE
        // ----------------------------------------------------------------------------------------------------

        var playlist = $('#playlist-entries');
        
        // click on queue entry
        playlist.on('click', 'li', function(e) {
            var cmd = '';
                // play queue entry
                var pos = $('li', '#playlist-entries').index(this);
                cmd = 'play ' + pos;
                sendCmd(cmd);
                $('li.active', '#playlist-entries').removeClass('active');
                $(this).addClass('active');
        });

        // on ready playlist tab
        $('a', '#open-panel-dx').click(function(){
            if ($('#open-panel-dx').hasClass('active')) {
                var current = parseInt(GUI.json.song);
                customScroll('pl', current, 500);
                if (!$('#pl-filter-results').hasClass('hide'))  //mod when playlist browsing, click to show queue again
                    $('#pl-filter-results').click();
            }
        })
        .on('shown.bs.tab', function (e) {
            var current = parseInt(GUI.json.song);
            customScroll('pl', current, 0);
        });        
        
        // LIBRARY
        // ----------------------------------------------------------------------------------------------------
        
        // on ready Library tab
        $('a', '#open-panel-sx').click(function(){
            if ($('#open-panel-sx').hasClass('active')) {
                customScroll('pl', parseInt(GUI.json.song), 500);
            }
        })
        .on('shown.bs.tab', function (e) {
            customScroll('db', GUI.currentDBpos[GUI.currentDBpos[10]], 0);
        });
        
        // setup Library home
        $('#db-homeSetup').click(function(){
            var editbtn = $(this);
            if (editbtn.hasClass('btn-primary')) {
                editbtn.removeClass('btn-primary').addClass('btn-default');
                $('.home-block-remove').remove();
            } else {
                editbtn.removeClass('btn-default').addClass('btn-primary');
                $('.home-block.home-bookmark').append('<div class="home-block-remove" title="Remove this bookmark"><span class="block-remove">&times;</span></div>');
            }
        });
        
        var db = $('#database-entries');
        
        // click on Library list entry
        db.on('click', 'li', function(e) {
            var path = '',
                browsemode = '';
            var el = $(this);
            // list browsing
                $('li.active', '#database-entries').removeClass('active');
                el.addClass('active');
                if (el.hasClass('db-folder')) {
                    path = el.data('path');
                    if (el.hasClass('db-album')) {
                    // browse by album
                        if (path !== '') {
                            getDB({
                                path: path,
                                uplevel: 0,
                                browsemode: 'album'
                            });
                        } else {
                            path = GUI.currentDBpath[GUI.currentDBpos[10] - 1];
                            getDB({
                                path: path,
                                uplevel: 0,
                                browsemode: 'albumfilter'
                            });
                        }
                    } else if (el.hasClass('db-artist')) {
                    // browse by album
                        getDB({
                            path: path,
                            uplevel: 0,
                            browsemode: 'artist'
                        });
                    } else if (el.hasClass('db-composer')) {
                    // browse by composer
                        getDB({
                            path: path,
                            uplevel: 0,
                            browsemode: 'composer'
                        });
                    } else if (el.hasClass('db-genre')) {
                    // browse by genre
                        getDB({
                            path: path,
                            uplevel: 0,
                            browsemode: 'genre'
                        });
                    } else if (el.hasClass('db-spotify')) {
                    // Spotify playlists
                        path = GUI.currentpath    + '/' + el.find('span').text();
                        getDB({
                            path: path,
                            plugin: 'Spotify',
                            args: el.data('path').toString(),
                            querytype: 'tracks'
                        });
                        GUI.plugin = 'Spotify';
                    } else if (el.hasClass('db-dirble')) {
                    // Dirble folders
                        path = GUI.currentpath + '/' + el.find('span').text();
                        var querytype = (el.hasClass('db-dirble-child')) ? 'stations' : 'childs';
                        getDB({
                            path: path,
                            plugin: 'Dirble',
                            querytype: querytype,
                            args: el.data('path')
                        });
                        GUI.plugin = 'Dirble';
                    } else if (el.hasClass('db-jamendo')) {
                    // Jamendo folders
                        // path = GUI.currentpath    + '/' + el.find('span').text();
                        // var querytype = 'radio';
                        // var args = el.data('path');
                        // getDB({
                            // path: path,
                            // plugin: 'Jamendo',
                            // querytype: querytype,
                            // args : args
                        // });
                    } else {
                    // browse by file (default)
                        browsemode = el.data('browsemode');
                        //GUI.currentDBpos[GUI.currentDBpos[10]] = $('.database .db-entry').index(this);
                        getDB({
                            path: path,
                            uplevel: 0,
                            browsemode: browsemode
                        });
                    }
                    var entryID = el.attr('id');
                    entryID = entryID.replace('db-','');
                    GUI.currentDBpos[GUI.currentDBpos[10]] = entryID;
                    GUI.currentDBpath[GUI.currentDBpos[10]] = path;
                    ++GUI.currentDBpos[10];
                } else if (el.hasClass('db-webradio-add')) {
                    $('#modal-webradio-add').modal();
                }
        });
        // double click on Library list entry
        db.on('dblclick', 'li', function(e) {
            var el = $(this);
            if (!$(e.target).hasClass('db-action')) {
                $('li.active', '#database-entries').removeClass('active');
                el.addClass('active');
                var path = el.data('path');
                if (el.hasClass('db-spotify')) {
                    path = el.attr('data-plid') + '-' + el.attr('data-path');
                    getDB({
                        cmd: 'spaddplay',
                        path: path,
                        querytype: 'spotify-track'
                    });
                } else {
                    path = (el.hasClass('db-dirble')) ? path.split(' | ')[1] : path;
                    getDB({
                        cmd: 'addplay',
                        path: path
                    });
                }
            }
        });

        // GENERAL
        // ----------------------------------------------------------------------------------------------------
        
        // open tab from external link
        var url = document.location.toString();
        if ( url.match('#') ) {
            $('#menu-bottom a[href="/#' + url.split('#')[1] + '"]').tab('show');
        }
        // do not scroll with HTML5 history API
        $('#menu-bottom a').on('shown', function(e) {
            if(history.pushState) {
                history.pushState(null, null, e.target.hash);
            } else {
                window.location.hash = e.target.hash; // Polyfill for old browsers
            }
        }).on('click', function() {
            if ($('#overlay-social').hasClass('open')) {
                $('.overlay-close').trigger('click');
            }
        });
        
        // social share overlay
        overlayTrigger('#overlay-social');
        // play source overlay
        overlayTrigger('#overlay-playsource');
        $('#playsource-spotify').click(function(){
            if ($(this).hasClass('inactive')) {
                if (GUI.libraryhome.Spotify === '1') {
					GUI.forceGUIupdate = true;
                    $.ajax({
                        url: '/command/?switchplayer=Spotify',
                        cache: false
                    });
                    // close switch buttons layer
                    $('#overlay-playsource-close').trigger('click');
                } else {
                    new PNotify({
                        title: 'Spotify not enabled',
                        text: 'Enable and configure it under the Settings screen',
                        icon: 'fa fa-exclamation-circle'
                    });
                }
            }
        });

        // on screen keyboard
        if (document.location.hostname == "localhost")
            $('.osk-trigger').onScreenKeyboard({
                'draggable': true
        }); 
    });
    
} else {

// ====================================================================================================
// OTHER SECTIONS
// ====================================================================================================

    jQuery(document).ready(function($){ 'use strict';
        
        // INITIALIZATION
        // ----------------------------------------------------------------------------------------------------
         
        // check WebSocket support
        GUI.mode = checkWebSocket();
        
        // first connection with MPD daemon
        // open UI rendering channel;
        playbackChannel();
        
        // first GUI update
        // updateGUI();
        
        // PNotify init options
        PNotify.prototype.options.styling = 'fontawesome';
        PNotify.prototype.options.stack.dir1 = 'up';
        PNotify.prototype.options.stack.dir2 = 'left';
        PNotify.prototype.options.stack.firstpos1 = 90;
        PNotify.prototype.options.stack.firstpos2 = 50;
        PNotify.prototype.options.stack.spacing1 = 10;
        PNotify.prototype.options.stack.spacing2 = 10;
        // open notify channel
        notifyChannel();
        
        
        // BUTTONS
        // ----------------------------------------------------------------------------------------------------
        
        // playback buttons
        $('.btn-cmd').click(function(){
            var el = $(this);
            commandButton(el);
        });
        
        // COMMON
        // ----------------------------------------------------------------------------------------------------
        
        // Bootstrap-select
        $('.selectpicker').selectpicker();
        

        // SOURCES
        // ----------------------------------------------------------------------------------------------------
        
        if ($('#section-sources').length) {
        
            // enable/disable CIFS auth section
            if ($('#mount-type').val() === 'nfs') {
                $('#mount-cifs').addClass('disabled').children('.disabler').removeClass('hide');
            }
            $('#mount-type').change(function(){
                if ($(this).val() === 'cifs' || $(this).val() === 'osx') {
                    $('#mount-cifs').removeClass('disabled').children('.disabler').addClass('hide');
                }
                else {
                    $('#mount-cifs').addClass('disabled').children('.disabler').removeClass('hide');
                }
            });
            
            // enable/disable CIFS user and password fields
            $('#nas-guest').change(function(){
                if ($(this).prop('checked')) {
                    $('#mount-auth').addClass('disabled').children('.disabler').removeClass('hide');
                } else {
                    $('#mount-auth').removeClass('disabled').children('.disabler').addClass('hide');
                }
            });
            
            // show advanced options
            $('#nas-advanced').change(function(){
                if ($(this).prop('checked')) {
                    $('#mount-advanced-config').removeClass('hide');
                } else {
                    $('#mount-advanced-config').addClass('hide');
                }
            });
            
            $('#show-mount-advanced-config').click(function(e){
                e.preventDefault();
                if ($(this).hasClass('active')) {
                    $('#mount-advanced-config').toggleClass('hide');
                    $(this).removeClass('active');
                    $(this).find('i').removeClass('fa fa-minus-circle').addClass('fa fa-plus-circle');
                    $(this).find('span').html('show advanced options');
                } else {
                    $('#mount-advanced-config').toggleClass('hide');
                    $(this).addClass('active');
                    $(this).find('i').removeClass('fa fa-plus-circle').addClass('fa fa-minus-circle');
                    $(this).find('span').html('hide advanced options');
                }
            });
            
            $('#usb-mount-list a').click(function(){
                var mountName = $(this).data('mount');
                $('#usb-umount-name').html(mountName);
                $('#usb-umount').val(mountName);
            });
        }
        
            
        // SETTINGS
        // ----------------------------------------------------------------------------------------------------
        
        if ($('#section-settings').length) {
            
            // show/hide AirPlay name form
            $('#airplay').change(function(){
                if ($(this).prop('checked')) {
                    $('#airplayName').removeClass('hide');
                    $('#airplayBox').addClass('boxed-group');
                } else {
                    $('#airplayName').addClass('hide');
                    $('#airplayBox').removeClass('boxed-group');
                }
            });
            
            // show/hide Last.fm auth form  
            $('#scrobbling-lastfm').change(function(){
                if ($(this).prop('checked')) {
                    $('#lastfmAuth').removeClass('hide');
                    $('#lastfmBox').addClass('boxed-group');
                } else {
                    $('#lastfmAuth').addClass('hide');
                    $('#lastfmBox').removeClass('boxed-group');
                }
            });
            
            // show/hide proxy settings form  
            $('#proxy').change(function(){
                if ($(this).prop('checked')) {
                    $('#proxyAuth').removeClass('hide');
                    $('#proxyBox').addClass('boxed-group');
                } else {
                    $('#proxyAuth').addClass('hide');
                    $('#proxyBox').removeClass('boxed-group');
                }
            });
            
            // show/hide UPnP/dlna name form
            $('#dlna').change(function(){
                if ($(this).prop('checked')) {
                    $('#dlnaName').removeClass('hide');
                    $('#dlnaBox').addClass('boxed-group');
                } else {
                    $('#dlnaName').addClass('hide');
                    $('#dlnaBox').removeClass('boxed-group');
                }
            });
            
            // show/hide Spotify auth form
            $('#spotify').change(function(){
                if ($(this).prop('checked')) {
                    $('#spotifyAuth').removeClass('hide');
                    $('#spotifyBox').addClass('boxed-group');
                } else {
                    $('#spotifyAuth').addClass('hide');
                    $('#spotifyBox').removeClass('boxed-group');
                }
            });
            
            // file upload
            $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
                var input = $(this).parents('.input-group').find(':text');
                if (input.length) {
                    input.val(label);
                } else {
                    if (label) {
                        if (label.indexOf('backup_') > -1 && label.indexOf('.tar.gz') > -1) {
                            $('#backup-file').html(' <i class="fa fa-check dx green"></i> ' + label + '');
                            $('#btn-backup-upload').prop('disabled', false);
                        } else {
                            $('#backup-file').html(' <i class="fa fa-times dx red"></i> not a valid backup file');
                            $('#btn-backup-upload').prop('disabled', true);
                        }
                    }
                }
            });

        }
        
        
        // NETWORK
        // ----------------------------------------------------------------------------------------------------
        
        if ($('#section-network').length) {
            
            // show/hide static network configuration based on select value
            var netManualConf = $('#network-manual-config');
            if ($('#dhcp').val() === '0') {
                netManualConf.removeClass('hide');
            }
            $('#dhcp').change(function(){
                if ($(this).val() === '0') {
                    netManualConf.removeClass('hide');
                }
                else {
                    netManualConf.addClass('hide');
                }
            });
            
            // show/hide WiFi security configuration based on select value
            var WiFiKey = $('#wifi-security-key');
            if ($('#wifi-security').val() !== 'open') {
                WiFiKey.removeClass('hide');
            }
            $('#wifi-security').change(function(){
                if ($(this).val() !== 'open') {
                    WiFiKey.removeClass('hide');
                }
                else {
                    WiFiKey.addClass('hide');
                }
            });
            
            // refresh in range Wi-Fi networks list
            if ($('#wifiNetworks').length) {
                // open wlans channel
                wlansChannel();
                
                // open nics channel
                nicsChannel();
            }
            
            // show/hide WiFi stored profile box
            $('#wifiProfiles').change(function(){
                if ($(this).prop('checked')) {
                    $('#wifiProfilesBox').addClass('hide');
                } else {
                    $('#wifiProfilesBox').removeClass('hide');
                }
            });

        }

        // ACCESSPOINT
        // ----------------------------------------------------------------------------------------------------
        
        if ($('#section-accesspoint').length) {
            
            // show/hide AP settings form
            $('#accesspoint').change(function(){
                if ($(this).prop('checked')) {
                    $('#accesspointSettings').removeClass('hide');
                    $('#accesspointBox').addClass('boxed-group');
                } else {
                    $('#accesspointSettings').addClass('hide');
                    $('#accesspointBox').removeClass('boxed-group');
                }
            });

            $('#ip-address').change(function(){
                var parts = $('#ip-address').val().split('.');
                parts[3]++;
                $('#dhcp-range').val(parts.join('.')+','+parts[0]+'.'+parts[1]+'.'+parts[2]+'.254,24h');
                parts[3] = 255;
                $('#broadcast').val(parts.join('.'));
                $('#dhcp-option-dns').val($('#ip-address').val());
                $('#dhcp-option-router').val($('#ip-address').val());
            });
        }
        
        // MPD
        // ----------------------------------------------------------------------------------------------------
        
        if ($('#section-mpd').length) {
            
            // output interface select
            $('#audio-output-interface').change(function(){
                renderMSG([{'title': 'Switching audio output', 'text': 'Please wait for the config update...', 'icon': 'fa fa-cog fa-spin', 'delay': 5000 }]);
                var output = $(this).val();
                $.ajax({
                    type: 'POST',
                    url: '/mpd/',
                    data: {
                        ao: output
                    },
                    cache: false
                });
            });
            
            // MPD config manual edit
            $('.manual-edit-confirm').find('.btn-primary').click(function(){
                $('#mpdconf_editor').removeClass('hide');
                $('#manual-edit-warning').addClass('hide');
            });
        }
        
        // on screen keyboard
        if (document.location.hostname == "localhost")
            $('.osk-trigger').onScreenKeyboard({
                'draggable': true
        });
    });
}

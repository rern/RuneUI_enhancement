## Default UI

Rely on MPD supplied data which has some limitations.

- Song info - File
	- No sampling info on stop
	- Show FLAC bitrate at play start / browser refresh, not average
	- Show compressed format bit depth which is technically none
	- Incorrect sampling info for DSD / DSF
- Song info - Webradio
	- Add, not Add and play, to empty playlist show station name as current song
	- Show last played song on stop / pause
	- No sampling info on stop
- Time
	- No duration on stop
	- Time count not change with drag while stop and not set as start on play
- Cover art
	- Get missing cover arts online without save
- Volume
	- Pre-mute level not showed and not preserved once refreshed
- Library
	- Inconsistent sorting
	- No alphabetic index browsing
	- No breadcrumb for sub-directory browsing
	- Not maintain page scroll position across pages
	- No URLs but 'webradio' in Webradio library
- Playlist
	- Show URLs as names and URL itself incomplete until play
	- Mic icons misplace in names


## Enhanced UI

### Overall:
- Redesign
	- Responsive layout
	- Icons
	- Time and Volume knobs
	- Coverart frame
	- Buttons
	- Menus
- Switch between main pages
	- Swipe left/right
- Top-bottom bars
	- Larger new icons
	- Add apuse button
	- Show database updating as blinking icon (show as icon in Time knob while hidden)
- Selectable show/hide
	- Top-bottom bars
	- Time Knob
	- Cover art
	- Volume knob
	- Buttons
	- Library home items

### Playback:
- Coverart / Time knob as playback controls
	- Can be used as a replacement while hide top-bottom bars and buttons
	- Show overlay guides by tapping center-top of Coverart / Time 
- Artist
	- Improved artists' bio
	- Similar artists are linked
- Song info
	- Show sampling info while stop
	- Working previous / next while stop
	- Get sampling info directly with MPD on play
	- Get sampling info from local database while stop (must be played once before available)
	- Show song title in gray while pause
	- Hide webradio song title while stop
	- Scroll long names
- Time
	- Get duration on stop with MPD protocol
	- Show only duration while stop or blank in webradio
	- Selectable blinking dots or elapsed time in webradio
	- Start time within song can be set while stop
	- Show elapsed in gray while pause
- Coverart
	- Set Large Coverart to scale up with page width
	- Get local files first (easiest to manage ang can be used to overide the ones in ID3tag)
	- Extract from ID3tag if local files not available (used for songs from various albums in the same directory)
	- Get from last.fm if not locally available
	- Save the downloaded missing cover arts for local use
	- Show VU meter in webradio - animated while play
- Volume
	- Show pre-mute level instead of 0 on mute
	- Maintain pre-mute level to and get from local database
- Buttons
	- Show as icon in Time knob while hidden
		
### Library:
- Show counts
- Show icon and breadcrumb heading while browsing
- Show index bar
- Improved Back button
- Maintain scroll position
- Improved sorting and exclude leading A, An, The, ', "
- Modes
	- Albums > names > songs
	- Albums with duplicate name > album-artist > songs
	- Artists > names > albums > songs
	- Composers > names > albums > songs
	- Genres > names > artists > albums > songs
- Show album heading with artist name
- Bookmarks and webradios can be renamed
- Bookmarks and webradios can be named with ', " characters
- Scroll long bookmark names
- Show filenames or URL of webradio
- Changes reflect to all clients
		
### Playlist:
- Auto scroll to top with 3 previous songs
- Show elapsed time while play/pause
- Tap to play/pause
- Tap elapsed or time to stop
- Improve drag to rearrange
- Show track numbers
- Show webradio name
- Crop button to keep only current playing song
- Saved playlists can be renamed
- Each saved playlist can be viewed
- Maintain scroll position
- Changes reflects to all clients

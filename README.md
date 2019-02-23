RuneUI enhancement
---
_Tested on RuneAudio 0.4b, 0.5_   

### Improvements:
- Redesign
	- Responsive layout
	- Icons
	- Time and Volume knobs
	- Coverart frame
	- Buttons
	- Menus
- Top-bottom bars
	- Larger new icons
	- Add apuse button
	- Show database updating as blinking icon (show as icon in Time knob while hidden)
	
### New Features
- Browse by CoverArt
- Coverart bookmarks
- Coverart in album view
- Index bar
- Selectable show/hide
	- Top-bottom bars
	- Time Knob
	- Cover art
	- Volume knob
	- Buttons
	- Library home items
	- Library labels
- Switch between main pages
	- Swipe left/right

Install
---
from [**Addons Menu**](https://github.com/rern/RuneAudio_Addons)  


![playback](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/xtreme/playback.gif)

### Playback:
- Coverart / Time knob as playback controls
	- Can be used as a replacement while hide top-bottom bars and buttons
	- Show overlay guides by tapping center-top of Coverart / Time 
- Artist
	- Improved artists' bio
	- Show similar artists with images and linked
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
	- Show elapsed and duration with song info while hidden
- Coverart
	- Set **Large Cover art** to scale up with page width (except webradio vu meter)
	- Toggle scaling temporarily by tapping top-left corner (Restored on song changed or refresh.)
	- New default cover art
	- Get local files first (easiest to manage and can be used to overide the embedded ID3)
	- Extract from ID3tag if local files not available (used for songs from various albums in the same directory)
	- Get from last.fm if not locally available
	- Cover art use case in a directory:
		- No embedded ID3 cover art
			- Single artist + single album : place 1 cover art file in the directory
			- Various : add each embedded ID3 cover art
			- Various in a playlist : with cover art files in each directory, no need of embedding 
		- With embedded ID3 cover art
			- Single artist + single album : override embedded ones by placing 1 cover art file in the directory
			- Various : existing embedded ones
	- Show VU meter in webradio - animated while play
- Volume
	- Show pre-mute level instead of 0 on mute
	- Maintain pre-mute level across page refresh and clients
- Buttons
	- Show as icon in Time knob while hidden


![library](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/xtreme/library.gif)

### Library:
- Drag to rearrange home blocks
- Show counts
- Browse by CoverArt
	- Create / update thumbnails with RuneUIe - Coverart Browsing addon
	- Long-press for remove dialog
- Show icon and breadcrumb heading while browsing
- Show list in playlist files (\*.cue, \*.pls, \*.m3u)
- Toggle search box
- Show index bar
- Improved Back button
- Maintain scroll position
- Improved sorting and exclude leading A, An, The, ', ", ., (, \[
- Modes
	- Albums > names > songs
	- Albums with duplicate name > album-artist > songs
	- Artists > names > albums > songs
	- Album Artists > names > albums > songs
	- Composers > names > albums > songs
	- Genres > names > artists > albums > songs
- Show album heading with artist name (various artists album without album artist tag > 1st track artist)
- Bookmarks and webradios can be renamed
- Bookmarks and webradios can be named with " characters
- Scroll long bookmark names
- Show filenames or URL of saved webradio before played
- Changes reflect to all clients


![playlist](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/xtreme/playlist.gif)

### Playlist:
- Toggle search box
- Auto scroll to top with 3 previous songs
- Show elapsed time while play/pause
- Tap to play/pause
- Tap elapsed or time to stop
- Improve drag to rearrange
- Show track numbers
- Show webradio name
- Crop button to keep only current playing song
- Saved playlists can be named with " characters
- Saved playlists can be renamed
- Each saved playlist can be viewed
- Maintain scroll position
- Changes reflects to all clients

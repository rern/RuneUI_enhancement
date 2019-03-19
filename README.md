RuneUI enhancement
---
_Tested on RuneAudio 0.4b, 0.5_   

### Improvements:
- Redesign
	- Responsive layout
	- Icons
	- Time and Volume knobs ( by [roundSlider](https://github.com/soundar24/roundSlider) )
	- Coverart frame
	- Buttons
	- Menus
- Top-bottom bars
	- Larger new icons
	- Add pause button
	- Show database updating as blinking icon (show as icon in Time knob while hidden)
- Performance
	
### New Features
- Coverarts
	- Browse by CoverArt ( with [LazyLoad](https://github.com/verlok/lazyload) )
	- Coverart bookmarks
	- Coverart in album view
	- Replace / remove
	- Image from each Dirble stations
	- VU meter for Webradio
- Index bar
	- Mask available indexes
- Library sorting
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
- Swipe bar (screen bottom)
	- Fallback for allow-swipe-only area
- Refresh browser for fullscreen mode
	- Long-press bottom bar / swipe bar
- Movable Library items ( by [Sortable](https://github.com/SortableJS/Sortable) )
- Context menu
	- Icon on the right removed
	- Use icon on the left instead

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
	- Get sampling info from local database while stop (Webradios must be played once before available)
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
- Swipe bar - when top-bottom bars hidden (Tap coverart top to show guide)
	- Swipe only zone for devices that have difficulty with page swipe
	- Swipe or tap left/right to switch page
- Swipe bar / bottom bar
	- Long press to refresh browser when in fullscreen view

![library](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/xtreme/library.gif)

### Library:
- Drag to rearrange home blocks
- Show counts
- Browse by CoverArt
	- Long-press `CoverArt` to create / update thumbnails
	- Long-press thumbnail for replace / remove
	- Context menu in directory for partial update
	- Sort by album or by artist
- Coverart bookmarks
	- Long-press for replace / remove
- Coverart in album view / album directory
	- Long-press for replace / remove
- Bookmarks and webradios can be renamed
- Bookmarks and webradios can be named with " characters
- Show icon and breadcrumb heading while browsing
- Show list in playlist files `*.cue` `*.pls` `*.m3u`
- Toggle search box
- Index bar
	- Unavailable indexes masked
	- Compressed for limited height screen
- Improved Back button
- Maintain scroll position
- Improved sorting
	- Ignore leading `A` `An` `The` `(` `[` `{` `.`
- Modes
	- Coverarts > albums > songs
	- Albums > names > songs
	- Albums with duplicate name > album-artist > songs
	- Artists > names > albums > songs
	- Album Artists > names > albums > songs
	- Composers > names > albums > songs
	- Genres > names > artists > albums > songs
- Show album heading with artist name (various artists album without album artist tag > 1st track artist)
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
- Webradio
	- Show saved station names while stop / streaming names while playing
	- Unsaved station icon in white - tap to save
- Crop button to keep only current playing song
- Saved playlists can be named with " characters
- Saved playlists can be renamed
- Each saved playlist can be viewed
- Maintain scroll position
- Changes reflects to all clients

RuneUI enhancement
---
As of 20190822, this has been integrated to [**RuneAudio+R e1**](https://github.com/rern/RuneAudio-Re1).

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
	- Loading
	- Running
	
### New Features
- Coverarts ( resize with server-side:[ImageMagick](https://imagemagick.org), client-side:[pica](https://github.com/nodeca/pica) )
	- Browse by CoverArt ( load on scroll with [LazyLoad](https://github.com/verlok/lazyload) )
	- Coverart bookmarks
	- Coverart in album view
	- Replace / remove - file permission: 775
	- Save coverart fetched from online - directory permission: 775
	- Webradio coverart
	- Default
		- RuneAudio
		- Webradio - VU meter (animated gif)
	- Image from each Dirble stations
	- Custom Webradio coverarts
- Index bar
	- Mask available indexes
- Library sorting
- Metadata tag editor - file permission: 775 ( with [Kid3](https://kid3.sourceforge.io) )
- UI color picker ( with [HTML5-Color-Picker](https://github.com/NC22/HTML5-Color-Picker) )
- Single files with`*.cue` behave like individual files
	- Listed and saved as individual tracks
	- Editable metadata
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
- Movable items ( by [Sortable](https://github.com/SortableJS/Sortable) )
	- Library home
	- Playlists
	- Saved playlists
- Editable saved playlists
- Context menu
	- Icon on the right removed
	- Use icon on the left instead
- Highlight search keyword in result
- Crop Playlist
- Consume mode
- Keyboard navigation

Install
---
from [**Addons Menu**](https://github.com/rern/RuneAudio_Addons)  


![playback](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/xtreme/playback.gif)

### Playback:
- Coverart / Time knob as playback controls
	- Can be used as a replacement while hide top-bottom bars and buttons
	- Show overlay guides by tapping center-top of Coverart / Time 
	- Show save button for online fetched
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
	- Long-press for replace / remove - file permission: 775
	- Show VU meter in webradio - animated while playing
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
- Coverarts:
	- Coverart in album view / album directory
		- Long-press for replace / remove - file permission: 775
	- Browse by CoverArt ( need `ext*` formatted drive )
		- Long-press `CoverArt` to create / update thumbnails
		- Long-press thumbnail for replace / remove
		- Context menu in directory for partial update
		- Sort by album or by artist
	- Coverart bookmarks ( need `ext*` formatted drive )
		- Long-press for replace / remove
	- Webradio coverarts ( need `ext*` formatted drive )
		- Tap Webradio icon in list view
- Metadata tag editor - file permission: 775 (Install RuneUIe Metadata Editor addon to enable)
	- Album tags - Coverart context menu > Tags (browse by directory/bookmark/coverart only)
	- Song tags - File context menu > Tags
- Bookmarks and webradios can be renamed
- Bookmarks and webradios can be named with " characters
- Show icon and breadcrumb heading while browsing
- Show list in playlist files, `*.cue` `*.pls` `*.m3u`
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
- Each item can be append to saved playlists
- Maintain scroll position
- Changes reflects to all clients
- Saved playlists
	- Show content
	- Drag to rearrange
	- Add/Remove individual items
	- Can be named with " characters
	- Can be renamed
	- Save tracks with `*.cue` correctly as individual tracks

### Keyboard Navigation
All pages
- `space` play / pause
- `play` play / pause
- `pause` pause
- `stop` stop
- `previous` previous track
- `next` next track
- `tap` switch pages
- `escape` menu toggle

**Playback**
- `arrow-left` previous
- `arrow-right` next
- `arrow-up` volume +
- `arrow-down` volume -

**Library home**
- `arrow-left` select previous item
- `arrow-right` select next item
- `enter` tap active item

**Library / Playlist**
- `arrow-down` select next item
- `arrow-up` select previous item
- `arrow-left` back button
- `arrow-right` context menu
- `enter` tap active item / add + play

**Menu and Context menu**
- `arrow-down` select next menu
- `arrow-up` select previous menu
- `arrow-right` select submenu
- `arrow-left` hide context menu
- `enter` tap active menu

**Setting pages**
- `escape` close

**Write permission for files / directories** - 775 (group rw)
- Edit coverart / metadata
	- new coverart - directory
	- existing coverart - file
	- metadata / embedded coverart- file
- Exclude directories from Library - parent directory

```
Default UI: Rely on MPD supplied data which has some limitations.
    Song info - File
        - No sampling info on stop
        - Show FLAC bitrate at play start / browser refresh, not average
        - Show compressed format bit depth which is technically none
        - Incorrect sampling info for DSD / DSF
    Song info - Webradio 
        - Add, not Add and play, to empty playlist show station name as current song
        - Show last played song on stop / pause
        - No sampling info on stop
    Time
        - No duration on stop
        - Time count not change with drag while stop and not set as start on play
    Cover art
        - Get missing cover arts online without save
    Volume
        - Pre-mute level not showed and not preserved once refreshed
    Library
        - Inconsistent sorting
        - No alphabetic index browsing
        - No breadcrumb for sub-directory browsing
        - Not preserve scrolled page position across pages
        - No URLs but 'webradio' in Webradio library
    Playlist
        - Show URLs as names and URL itself incomplete until play
        - Mic icons misplace in names


Enhanced UI: Use some workarounds to get more informations and to do something better.
	Switch between main pages
		- Swipe left/right
	Playback control
		- With Coverart / Time knob
		- Show overlay guides by tapping top of each 
	Toggle show/hide
		- Top-bottom bars
		- Time Knob
		- Cover art
		- Volume knob
		- Buttons
		- Library home items
	Artist
		- Improved artists' bio
    Song info - File
        - Extract sampling info from file while stop
    Song info - Webradio
        - Get URLs for Library / Playlist from local database
        - Show URL and sampling info in Playback
        - Get sampling info directly with MPD on play
        - Get sampling info from local database while stop (must be played once before available)
		- Show song title in gray while pause
		- Hide webradio song title while stop
    Time
        - Get duration on stop with MPD protocol
		- Show only duration while stop or blank in webradio
		- Selectable blinking dots or elapsed time in webradio
        - Start time within song can be set while stop
		- Show elapsed in gray while pause
    Coverart
		- Get local files first (easiest to manage ang can be used to overide the ones in ID3tag)
		- Extract from ID3tag if local files not available (used for songs from various albums in the same directory)
		- Get from last.fm if not locally available
        - Save the downloaded missing cover arts for local use
		- Show VU meter in webradio - animated while play
    Volume
        - Show pre-mute level on mute
        - Maintain pre-mute level to and get from local database
	Buttons
		- 
```

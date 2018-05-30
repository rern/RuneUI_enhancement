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
    Song info - File
        - Extract sampling info from file while stop
    Song info - Webradio
        - Get URLs for Library / Playlist from local database
        - Show URL and sampling info in Playback
        - Get sampling info directly with MPD on play
        - Get sampling info from local database while stop
            If not available, download sample stream for 3kB or 3s max
            Extract sampling info from downloaded stream and save to local database
    Time
        - Get duration on stop with MPD protocol
        - Start time within song can be set while stop
    Cover art
        - Save downloaded missing cover arts for better response
    Volume
        - Show pre-mute level on mute
        - Save pre-mute level to and get from local database
```

RuneUI enhancement
---
_Tested on RuneAudio 0.3 and 0.4b_   

Features
---
- More minimalism
- Even more minimal by selectable show/hide items
- More responsive layout
- Fit all in one phone screen (with 'Add to Home Screen')
- Swipeable
- Improved song info
- Library breadcrumb path links to each directory
- Library index bar
- Fix Library sorting
- Coverart override
- Start/stop local browser right after settings saved (default needs system restart)
- 0.4b fixes:
	- Prevent `coverarts` update on play / pause in the same song
	- Use local `jquery-ui.min.js` instead of online
	- Fix missing `lato-bolditalic-webfont`
	- Remove screen saver items if disabled or if disable local browser

>[Install](#install)  
>[Functional](#functional)  
>[Visual](#visual)  

![Controls](https://github.com/rern/_assets/raw/master/RuneUI_enhancement/gestures/iPnone8P-Controls.gif) Controls  
![Bars-Buttons](https://github.com/rern/_assets/raw/master/RuneUI_enhancement/gestures/iPnone8P-Bars-Buttons.gif) Top-Bottom Bars and Buttons  
![SwipePage](https://github.com/rern/_assets/raw/master/RuneUI_enhancement/gestures/iPnone8P-SwipePage.gif) Pages  
![PressShowHide](https://github.com/rern/_assets/raw/master/RuneUI_enhancement/gestures/iPnone8P-PressShowHide.gif) Show-Hide  
![Bio](https://github.com/rern/_assets/raw/master/RuneUI_enhancement/gestures/iPnone8P-Bio.gif) Bio  

Try it (to be updated) - [**Demo**](https://rern.github.io/RuneUI_GPIO/)  

Install
---
from [**Addons Menu**](https://github.com/rern/RuneAudio_Addons)  

![show-hide](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/show-hide.gif)

Functional
---

### Playback
- Long-press = show/hide items setting
- Mouse hover top/bottom of screen = toggle top/bottom menu bars (if hidden)
- Tap `artist` or `i` button = show improved bio (data from last.fm)
- Swipe left-right = swiches between `Library` - `Playback` - `Queue`
- Swipe up / down on `screen left` `screen right` = hide / show `top` `bottom`
- (width < 500px) tap `screen left` = swap show / hide `cover art` `volume`
- Swipe left-right on `text area` or `coverart` = previous-next track
- Tap `cover art` = play / pause (besides default `time`)
- Long-press `cover art` = stop
- Tap `playlist item` also go back to playback page
- Tap `playback controls` on other pages also go back to playback page

![layout](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/RuneUImod1.gif)

### Library
- Long-press = show/hide items setting
- **Breadcrumb path links** = shortcut jump to any **directory** in the path
- **Index bar** = quick scroll to directories
- **Sorting** - fix incorrect:
	- Sort **non-english** language
	- Some of MPD default sorting
	- After [**Webradio import**](https://github.com/rern/RuneAudio/tree/master/webradio)
	- After [**MPD Upgrade**](https://github.com/rern/RuneAudio/tree/master/mpd)
	- (Songs in albums still, by default, be sorted by track number)
- Long-press = show/hide items
- Long-press `bookmark` = edit bookmarks
- Disable search with blank data

### Playlist
- Click anywhere on an items in manage playlist also shows **context menu**
	
Visual
---

### Playback
**Top Bar:**
- Hide on height < 530px
- Change `logo` to svg
- Separate pause from play buttons
- Full height `buttons` and fixed at center
- Change `Settings` icons and remove text label
- Enlarge icons
- Add box shadow for layer depth
- Add `Development` to `Settings` menu
- Coverart priority:
    - coverart files in directories
	- embedded id3 metadata
	- fetch from last.fm and save to that directory
	- override or change displayed coverart by changing the coverart files
	    - filename: cover, Cover, folder, Folder, front, Front
	    - format: jpg, png

![shadow](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/shadow.jpg)

**Middle:**
- Rearrange all to more efficient and responsive layout
- Improve sampling data display (calculate from raw data)
- Show DSD info
- Show file format
- Scroll long text on overflow
- Hide artist and album text on width < 500px
- Enlarge icons
- Move `play source` inside `time`
- Improved artist bio

**Bottom Bar:**
- Hide on height < 500px
- Change icons and remove text labels
- Enlarge icons
- Add box shadow for layer depth
- No more tooltips

### Library
- Add index bar
- Add Home folder button for Library home page
- Move `add webradio` list to top bar button
- Move path from bottom bar to top bar
- Change and relocate `back` button
- Fix sorting
- Preserve scroll position

### Queue
- Change and relocate `back` button
- Move `manage` buttons from bottom bar to top bar
- Preserve scroll position

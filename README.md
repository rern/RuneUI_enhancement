RuneUI enhancement
---
_Tested on RuneAudio 0.3 and 0.4b_   

![mid](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/mid.gif)
![1](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/1.png)
![3](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/3.png)
![4](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/4.png)
![5](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/5.png)
![6](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/6.png)

Try it - [**Demo**](https://rern.github.io/RuneUI_GPIO/)  

- More minimalism
- More fluid layout
- Fit all in one phone screen (with 'Add to Home Screen')
- Swipeable
- Library breadcrumb path links to each directory
- Library index bar
- Fix Library sorting
- Get lyrics
- [**RuneUI GPIO**](https://github.com/rern/RuneUI_GPIO) for GPIO connected devices control.  

>[Install](#install)  
>[Functional](#functional)  
>[Visual](#visual)  

![mid](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/RuneUImod1.gif)
![midL](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/midL.gif)

Install
---
from [**Addons Menu**](https://github.com/rern/RuneAudio_Addons)  


![small](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/small.gif)
![smallL](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/smallL.gif)

Functional
---
### All page
- Long-press = show/hide items setting

### Playback
- Tap `song` = get lyrics
- Tap `artist` or `album` = get info from last.fm
- Swipe left-right = swiches between `Library` - `Playback` - `Queue`
- Swipe left-right on `text area` = previous-next track
- Swipe up / down on `screen left` `screen right` or tap `screen left` = hide / show `top` `bottom`
- (width < 500px) Swipe up / down or tap `screen left` = swap show / hide `cover art` `volume`
- Tap `cover art` = play / pause (besides `time`)
- Tap `playlist item` also go back to playback page
- Tap `playback controls` on other pages also go back to playback page

![layout](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/RuneUImod1.gif)

### Library
- **Breadcrumb path links** = shortcut jump to any **directory** in the path
- **Index bar** = quick scroll to directories
- **Sorting** - fix incorrect:
	- Sort **non-english** language
	- Some of MPD default sorting
	- After [**Webradio import**](https://github.com/rern/RuneAudio/tree/master/webradio)
	- After [**MPD Upgrade**](https://github.com/rern/RuneAudio/tree/master/mpd)
	- (Songs in albums still, by default, be sorted by track number)
	
Visual
---

### Playback
**Top Bar:**
- Hide on height < 500px
- Change `logo` to svg
- Full height `buttons` and fixed at center
- Change `Settings` icons and remove text label
- Enlarge icons
- Add box shadow for layer depth
- Add `Development` to `Settings` menu

![shadow](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/shadow.jpg)

**Middle:**
- Rearrange all to more efficient and responsive layout
- Improve sampling data display (calculate from raw data)
- Show DSD64, DSD128
- Show file format
- Scroll long text on overflow
- Hide artist and album text on width < 500px
- Hide `volume` on disabled
- Enlarge icons
- Move `play source` inside `time`

![lyrics](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/lyrics.jpg)

**Bottom Bar:**
- Hide on height < 500px
- Change icons and remove text labels
- Enlarge icons
- Add box shadow for layer depth

### Library
- Add index bar
- Add Home folder button for Library home page
- Move `add webradio` list to top bar button
- Move path from bottom bar to top bar
- Change and relocate `back` button
- Fix sorting

### Queue
- Change and relocate `back` button
- Move `manage` buttons from bottom bar to top bar

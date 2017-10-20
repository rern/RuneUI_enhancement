#RuneUI enhancement

_Tested on RuneAudio 0.3 and 0.4b_   

Try it - [**Demo**](https://rern.github.io/RuneUI_GPIO/)  

- More minimalism
- More fluid layout
- Fit all in one phone screen (with 'Add to Home Screen')
- Swipeable
- Get lyrics
- [**RuneUI GPIO**](https://github.com/rern/RuneUI_GPIO) for GPIO connected devices control.  
- No file replaced. Any modifications will be there after install / uninstall.

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

- Tap `song` = get lyrics
- Tap `artist` or `album` = get info from last.fm
- Swipe left-right on `text area` = previous-next track
- Swipe up / down on `screen left` `screen right` or tap `screen left` = hide / show `top` `bottom`
- (width < 500px) Swipe up / down or tap `screen left` = swap show / hide `cover art` `volume`
- Swipe left / right on `time` `cover art` `volume` or  tap `screen right`= show / hide `buttons`
- Tap `cover art` = play / pause (besides `time`)
- Tap `playlist item` also go back to playback page
- Tap `playback controls` on other pages also go back to playback page

![layout](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/RuneUImod1.gif)

Visual
---

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
- Fix Webradio sorting

![lyrics](https://github.com/rern/_assets/blob/master/RuneUI_enhancement/lyrics.jpg)

**Bottom Bar:**
- Hide on height < 500px
- Change icons and remove text labels
- Enlarge icons
- Add box shadow for layer depth

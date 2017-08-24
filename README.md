#RuneUI enhancement

_For RuneAudio beta-20160313. Playback page only._  
_Tested on desktop, iPad, iPhone 1080x1920, Android - 480x800, 800x1280, 1080x1920_  

Try it - [**Demo**](https://rern.github.io/RuneUI_GPIO/)  

- More minimalism
- More fluid layout
- Fit all in one phone screen (with 'Add to Home Screen')
- Swipeable
- Get lyrics
- [**RuneUI GPIO**](https://github.com/rern/RuneUI_GPIO) for GPIO connected devices control.  
- No file replaced. Any modifications will be there after install / uninstall.

>[Install](#install)  
>[Uninstall](#uninstall)  
>[Functional](#functional)  
>[Visual](#visual)  

![mid](https://github.com/rern/RuneUI_enhancement/blob/master/_repo/mid.gif)
![midL](https://github.com/rern/RuneUI_enhancement/blob/master/_repo/midL.gif)

Install
---
```sh
wget -qN --show-progress --no-check-certificate https://github.com/rern/RuneUI_enhancement/raw/master/install.sh; chmod +x install.sh; ./install.sh
```
Refresh browser (clear history if nothing changed)

Uninstall
---
```sh
./uninstall_enha.sh
```    
_(Uninstalling will restore files to originals and delete all added ones. It should be fine to install-uninstall again and again.)_

![small](https://github.com/rern/RuneUI_enhancement/blob/master/_repo/small.gif)
![smallL](https://github.com/rern/RuneUI_enhancement/blob/master/_repo/smallL.gif)

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

![layout](https://github.com/rern/RuneUI_enhancement/blob/master/_repo/RuneUImod1.gif)

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

![shadow](https://github.com/rern/RuneUI_enhancement/blob/master/_repo/shadow.jpg)

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

![lyrics](https://github.com/rern/RuneUI_enhancement/blob/master/_repo/lyrics.jpg)

**Bottom Bar:**
- Hide on height < 500px
- Change icons and remove text labels
- Enlarge icons
- Add box shadow for layer depth

**Library**  
- Move directory path up to replace 'Back' button
- Make directory path linked (breadcrumb)
- Webradio sorting

**Extended charactors** for Cyrillic, Greek and IPA phonetics need font files replacement.  
```sh
wget -qN --show-progress https://raw.githubusercontent.com/rern/RuneUI_enhancement/master/_repo/lato.tar.xz; tar -Jxvf lato.tar.xz -C /srv/http/assets/fonts/lato
```

# 24/7 Simpsons Streamer
### v.0.8.0
## An UNOFFICAL "The Simpsons" Chrome Extension that creates a constantly-running marathon of "The Simpsons" on Disney+.

## To Do
- Unchecked runtime.lastError: The page keeping the extension port is moved into back/forward cache, so the message channel is closed.
- Big thanks to https://thomaspark.co/
- The pause to sync is not being held until the second timeout, possibly due to the button presses happening before the first timeout.
- Catch user trying to skip around and trigger sync.
- Visual indicator that syncing is in progress.
- Add debug info to popup to determine start date needed for specific episodes
- Test triggering movie
- Account for 45-ish seconds of credits
- Fix Time API spamming and end of episodes getting stuck in a loop (potentially while waiting for first Time API trigger to correct times)

---
## Changelog

v.0.0.1 - 250203 - Initial commit, added new button to Simpsons home page  
v.0.0.1 - 250203 - Updates the home page again when navigating back from episode  
v.0.1.0 - 250203 - Split home page and episode content scripts. Episode script grabs video element and changes title.  
v.0.2.0 - 250204 - Added rough time skip automation to align with established start date. Spams forwards/backwards buttons.  
v.0.2.1 - 250206 - Made video synchronization more precise, to the second.  
v.0.2.2 - 250207 - Changed timing of video synchronization. Added basic json and parsing.  
v.0.3.0 - 250211 - Added working calculations for current season and episode based entirely on json data and current timestamp.  
v.0.4.0 - 250212 - Added PowerShell script for generating episode data based on Disney data dumps. Added seasons 1-2  
v.0.4.1 - 250212 - Enhanced PowerShell script to allow adding additional episodes separately after discovering data dumps cap out at 15 episodes.  
v.0.4.2 - 250213 - Added seasons 3-17, as well as missing episode placeholder for S2E1  
v.0.5.0 - 250216 - Corrected JSON encoding, improved passing data and debugging information  
v.0.5.1 - 250216 - Added syncing text to timeline  
v.0.5.2 - 250216 - Added extension icon, basic structure of popup data passing (not functional)  
v.0.6.0 - 250228 - Added basic navigation to next episode, video player visibility during sync, and API time sync. Added seasons 18-35.  
v.0.7.0 - 250301 - Added movie info and fixed popup connection to background  
v.0.7.1 - 250301 - Added folder structures. Attempted to improve time syncing and end of episode triggers.  
v.0.7.2 - 250302 - Various SyncDate cleanup  
v.0.8.0 - 250407 - Improved episode visibility toggles. Prevented infinitely returning to episode after going back to home.  
v.0.9.0 - 260201 - Updated query selectors and added a button to play the episode from popup. Added season 36.  
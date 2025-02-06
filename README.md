# 24/7 Simpsons Streamer
## An UNOFFICAL "The Simpsons" Chrome Extension that creates a constantly-running marathon of "The Simpsons" on Disney+.

## To Do
- Unchecked runtime.lastError: The page keeping the extension port is moved into back/forward cache, so the message channel is closed.
- Once sync is within 10 seconds, pause to let video catch up (and maybe increase playback rate)
- Big thanks to https://thomaspark.co/

---
## Changelog

v.0.0.1 - 250203 - Initial commit, added new button to Simpsons home page  
v.0.0.1 - 250203 - Updates the home page again when navigating back from episode
v.0.1.0 - 250203 - Split home page and episode content scripts. Episode script grabs video element and changes title.
v.0.2.0 - 250204 - Added rough time skip automation to align with established start date. Spams forwards/backwards buttons.
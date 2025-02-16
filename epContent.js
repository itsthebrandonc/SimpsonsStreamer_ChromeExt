(() => {

    var currentURL = undefined;
    var portReady = false;
    var isEpisode = false;
    var loadedPage = false;
    var loadedPageInterval = undefined;
    var disneyPlayer;
    var lastPlayerTime = 0;
    var vidPlaybackRate = 1;
    var episodeInfo = undefined;
    var clickDelay;
    var isSyncing = false;
    var isSyncCooldown = false;
    var syncTimeout;
    var nextSyncTimeout;
    var  endSyncTimeout;

    function checkPageLoaded()
    {
        clearInterval(loadedPageInterval);
        console.log("Content::CheckPageLoaded");
        if (isEpisode && !loadedPage)
        {
            if (!document.querySelector('video#hivePlayer'))
            {
                loadedPageInterval = setInterval(checkPageLoaded, 1000);
            }
            else
            {
                loadedPage = true;
                connectToPort();
                initEpisode();
            }
        }
    }

    function initEpisode()
    {
        disneyPlayer = document.querySelector('video#hivePlayer');
        if (!disneyPlayer)
            return;

        //if (portReady)
        //    SendMessageToBackground(MessageType.SYNC,null);

        /*
        disneyPlayer.addEventListener('canplay', function() {
            SendMessageToBackground(MessageType.SYNC,null);
        });
        
        disneyPlayer.addEventListener('timeupdate', function() { //Keeps previous video time, used when preventing skipping
            if (!disneyPlayer.seeking) {
                lastPlayerTime = disneyPlayer.currentTime;
            }
        });

        disneyPlayer.addEventListener('seeking', function() { //Prevents skipping around
            //if (controlVideo)
            //{
                var delta = disneyPlayer.currentTime - lastPlayerTime;
                if (Math.abs(delta) > 1000) {
                    disneyPlayer.pause();
                    disneyPlayer.currentTime = lastPlayerTime;
                    disneyPlayer.play();
                }
            //}
        });
        */

        disneyPlayer.addEventListener('seeking', () => {
            isBuffering = true;
            isSeeking = true;
            console.log("Video Player: seeking");
            //if (!isSyncing)
            //    syncEpisode();
        });

        disneyPlayer.addEventListener('waiting', () => {
            isBuffering = true;
        });


        disneyPlayer.addEventListener('canplay', () => {
            isBuffering = false;
            syncEpisode();
        });

        disneyPlayer.addEventListener('canplaythrough', () => {
            isBuffering = false;
        });

        disneyPlayer.addEventListener('timeupdate', () => {
            if (!isBuffering && !isSyncing && !isSyncCooldown) {
                console.log("Video Player: timeupdate");
                syncEpisode();
            }
        });
        
        disneyPlayer.addEventListener('ratechange', () => { //Prevents changing playback rate 
            //if (controlVideo)
            if (disneyPlayer.playbackRate != vidPlaybackRate)
                disneyPlayer.playbackRate = vidPlaybackRate;
        });
        /*
        disneyPlayer.addEventListener('onplay', () => {
            console.log("onplay");
            if (isSyncing)
            {
                console.log("Force pause");
                disneyPlayer.pause();
            }
        });

        disneyPlayer.addEventListener('onplaying', () => {
            console.log("onpause");
            if (isSyncing)
            {
                console.log("Force pause");
                disneyPlayer.pause();
            }
        });
        */

        disneyPlayer.muted = true;

        setTimeout(() => {
            let disneyEpTitle = document.querySelector('div.title-field > span');
            if (disneyEpTitle)
                disneyEpTitle.innerHTML = '24/7 Simpsons Streamer';
    
            console.log("Episode Loaded");
            disneyPlayer.muted = true;
            syncEpisode();
        }, 1500);
    }

    //Positive = Ahead
    //Negative = Behind
    function checkOffsync()
    {
        let correctEpTime = new Date() - episodeInfo.startDate;
        if (correctEpTime > episodeInfo.epDuration)
        {
            console.log("Offsync::Episode has ended. CurrEpTime: " + new Date().getTime() + ", StartDate: " + unixToString(episodeInfo.startDate) + ", Duration: " + episodeInfo.epDuration);
            return 0;
        }

        let currEpTime = getCurrEpisodeTime();
    
        //console.log("CorrectEpTime:: " + new Date() + " - " + epStartDate + " = " + (new Date() - epStartDate));

        console.log("CheckEpisodeTime:: Correct: " + (correctEpTime/1000) + " Current: " + (currEpTime/1000));

        return currEpTime > 0 ? (currEpTime - correctEpTime) / 1000 : 0;
    }

    function getCurrEpisodeTime() {
        if (!episodeInfo)
        {
            console.error("Episode data not set");
            return -1;
        }
    
        const progressBar = document.querySelector('.slider-handle-container.from-left');
        if (!progressBar)
        {
            console.error("Progress Bar not found");
            return -1;
        }

        const width = progressBar.getAttribute('style');
        let rawPercentage = width.substring(7,width.length-1);
        let percentage = parseFloat(width.substring(7,width.length-1)) / 100; //width: 28.8355% -> 28.8335 -> 0.288335

        //console.log("CurrentEpTime:: Width: " + width + " ... " + rawPercentage + " * " + epDuration + " = " + (percentage * epDuration));

        return percentage * episodeInfo.duration;
    }

    function syncEpisode()
    {
        if (isSyncing || isSyncCooldown)
            return;

        if (!disneyPlayer)
        {
            console.error("Disney Player Not Found");
            return;
        }

        let offsync = checkOffsync();
        isSyncCooldown = true;
        clearTimeout(nextSyncTimeout);
        nextSyncTimeout = setTimeout(() => {
            isSyncCooldown = false;
        }, 5000);

        //console.log("           SyncEpisode:: " + offsync);

        if (Math.abs(offsync) < 1)
            return;

        console.log("SyncEpisode:: " + offsync);

        isSyncing = true;
        disneyPlayer.muted = true;
        disneyPlayer.pause();

        if (offsync < 0) {
            let skipsFF = Math.ceil(-1*offsync/10);
            const btnFF = document.querySelector('quick-fast-forward').shadowRoot.querySelector('info-tooltip button');

            console.log("FF x" + skipsFF);
            //clearTimeout(clickDelay);
            //clickDelay = setTimeout(() => {
            for (let i=0; i<skipsFF;i++)
            {
                btnFF.click();
            }
            //}, 1500);

            offsync += (skipsFF * 10);
            
        } else if (offsync >= 10) {
            let skipsRW = Math.floor(offsync/10);
            const btnRW = document.querySelector('quick-rewind').shadowRoot.querySelector('info-tooltip button');

            console.log("RW x" + skipsRW);
            //clearTimeout(clickDelay);
            //clickDelay = setTimeout(() => {
            for (let i=0; i<skipsRW;i++)
            {
                btnRW.click();
            }
            //}, 1500);

            offsync -= (skipsRW * 10);
        }

        console.log("Remaining Offsync: " + offsync);
        disneyPlayer.pause();
        if (offsync >= 1)
        {
            offsync *= 0.5; //Correct time moves forward as we stay paused, so only half of the pause is needed for it to catch up

            clearTimeout(endSyncTimeout);
            endSyncTimeout = setTimeout(() => {
                disneyPlayer.pause(); //TODO: This for some reason is not staying paused.
                                        // I think the button presses are causing the video to play again
                                        // Once the timeout ends, the sync triggers again and this time it does pause successfully
                
                console.log("Starting timeout for " + offsync);

                clearTimeout(syncTimeout);
                syncTimeout = setTimeout(() => {
                    console.log("Timeout ended");
                    isSyncing = false;
                    isSyncCooldown = false;
                    disneyPlayer.muted = false;
                    disneyPlayer.play();
                }, offsync * 1000);
            }, 1000);
        }
        else
        {
            isSyncing = false;
            isSyncCooldown = false;
            disneyPlayer.muted = false;
            disneyPlayer.play();
        }
    }
    

    function SendMessageToBackground(type,value)
    {
        console.log("SendMessageToBackground");
        if (!portReady)
        {
            console.error("Port not yet ready");
            return;
        }
        contentPort.postMessage({type: type, value: value});
        //chrome.runtime.sendMessage({
        //    type: type,
        //    value: value
        //});
    }

    function connectToPort()
    {
        console.log("Connecting port...");
        contentPort = chrome.runtime.connect({name: MessageType.PORT});
        contentPort.postMessage({type: MessageType.HELLO, value: null});
        contentPort.onMessage.addListener(function(obj) {
            const {type, value} = obj;
            switch(type)
            {
                case MessageType.HELLO:
                    portReady = true;
                    //if (disneyPlayer)
                    //    SendMessageToBackground(MessageType.SYNC,null);
                    console.log("Port connection successful");
                    break;
                //case MessageType.SYNC:
                //    syncEpisode(value.epTime,value.timestamp);
                //    break;
            }
        });
        contentPort.onDisconnect.addListener(() => {
            portReady = false;
            console.log("Connection to port has been lost");
        });
    }

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const {type, value} = obj;

        switch (type)
        {
            case MessageType.UPDURL:
                console.log("Content::Msg Received::UPDURL");
                if (currentURL != value.url)
                {
                    currentURL = value.url;
                    console.log("URL updated");
                }
                if (!isEpisode && value.isEpisode)
                {
                    console.log("Setting episode: " + value.episode.id);
                    console.log(value.episode);
                    isEpisode = true;
                    loadedPage = false;
                    episodeInfo = value.episode;

                    console.log("Content::Start Date: " + unixToString(value.episode.startDate));
                    checkPageLoaded();
                }
                isEpisode = value.isEpisode;
            break;
        }
    });

    console.log("Content Script Loaded");
})();
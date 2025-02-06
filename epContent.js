(() => {

    var currentURL = undefined;
    var portReady = false;
    var isEpisode = false;
    var loadedPage = false;
    var loadedPageInterval = undefined;
    var disneyPlayer;
    var lastPlayerTime = 0;
    var vidPlaybackRate = 1;
    var episodeID;
    var epStartDate;
    var epDuration;
    var clickDelay;
    var isSyncing = false;

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
        });

        disneyPlayer.addEventListener('waiting', () => {
            isBuffering = true;
        });


        disneyPlayer.addEventListener('canplay', () => {
            isBuffering = false;
        });

        disneyPlayer.addEventListener('canplaythrough', () => {
            isBuffering = false;
        });

        disneyPlayer.addEventListener('timeupdate', () => {
        if (!isBuffering) {
            syncEpisode();
        }
        });
        
        disneyPlayer.addEventListener('ratechange', function() { //Prevents changing playback rate 
            //if (controlVideo)
            disneyPlayer.playbackRate = vidPlaybackRate;
        });

        let disneyEpTitle = document.querySelector('div.title-field > span');
        if (disneyEpTitle)
        {
            disneyEpTitle.innerHTML = '24/7 Simpsons Streamer';
        }

        console.log("Episode Loaded");
    }

    function checkOffsync()
    {
        let correctEpTime = new Date() - epStartDate;
        if (correctEpTime > epDuration)
            return 0;

        let currEpTime = getCurrEpisodeTime();
    
        //console.log("CorrectEpTime:: " + new Date() + " - " + epStartDate + " = " + (new Date() - epStartDate));

        //console.log("CheckEpisodeTime:: Correct: " + (correctEpTime/1000) + " Current: " + (currEpTime/1000));

        return currEpTime > 0 ? (correctEpTime - currEpTime) / 1000 : 0;
    }

    function getCurrEpisodeTime() {
        if (!episodeID || !epDuration)
        {
            console.error("Episode data not set:: Episode ID: " + episodeID + " , Duration: " + epDuration);
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

        return percentage * epDuration;
    }

    function syncEpisode()
    {
        if (isSyncing)
            return;

        if (!disneyPlayer)
        {
            console.error("Disney Player Not Found");
            return;
        }

        let offsync = checkOffsync();
        if (Math.abs(offsync) < 5)
            return;

        console.log("SyncEpisode:: " + offsync);

        isSyncing = true;

        if (offsync > 0) {
            let skipsFF = Math.ceil(offsync/10);
            const btnFF = document.querySelector('quick-fast-forward').shadowRoot.querySelector('info-tooltip button');

            console.log("FF x" + skipsFF);
            //clearTimeout(clickDelay);
            //clickDelay = setTimeout(() => {
                for (let i=0; i<skipsFF;i++)
                {
                    btnFF.click();
                }
            //}, 1500);
            
        } else if (offsync < 0) {
            let skipsRW = Math.floor(-1*offsync/10);
            const btnRW = document.querySelector('quick-rewind').shadowRoot.querySelector('info-tooltip button');

            console.log("RW x" + skipsRW);
            //clearTimeout(clickDelay);
            //clickDelay = setTimeout(() => {
                for (let i=0; i<skipsRW;i++)
                {
                    btnRW.click();
                }
            //}, 1500);
        }

        isSyncing = false;
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
                    console.log("Setting episode: " + value.episodeID);
                    isEpisode = true;
                    loadedPage = false;
                    episodeID = value.episodeID;
                    epStartDate = new Date(value.startDate);
                    epDuration = value.duration;

                    console.log("Content::Start Date: " + epStartDate + "(" + value.startDate + ")");
                    checkPageLoaded();
                }
                isEpisode = value.isEpisode;
            break;
        }
    });

    console.log("Content Script Loaded");
})();
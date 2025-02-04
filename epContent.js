(() => {

    var currentURL = undefined;
    var portReady = false;
    var isEpisode = false;
    var loadedPage = false;
    var loadedPageInterval = undefined;
    var lastPlayerTime = 0;

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
        let disneyPlayer = document.querySelector('video#hivePlayer');
        if (!disneyPlayer)
            return;

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
        
        disneyPlayer.addEventListener('ratechange', function() { //Prevents changing playback rate 
            //if (controlVideo)
            disneyPlayer.playbackRate = 1;
        });

        let disneyEpTitle = document.querySelector('div.title-field > span');
        if (disneyEpTitle)
        {
            disneyEpTitle.innerHTML = '24/7 Simpsons Streamer';
        }

        console.log("Episode Loaded");
    }

    function SendMessageToBackground(type,value)
    {
        console.log("SendMessageToBackground");
        if (portReady)
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
                    console.log("Port connection successful");
                    break;
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
                //console.log("Content::Msg Received::UPDURL");
                if (currentURL != value.url)
                {
                    currentURL = value.url;
                    console.log("URL updated");
                }
                if (!isEpisode && value.isEpisode)
                {
                    isEpisode = true;
                    loadedPage = false;
                    checkPageLoaded();
                }
                isEpisode = value.isEpisode;
            break;
        }
    });

    console.log("Content Script Loaded");
})();
(() => {
    const MessageType = Object.freeze({
        PORT: "PORT",
        HELLO: "HELLO",
        UPDURL: "UPDURL",
        LOADEP: "LOADEP"
      });

    const HOMEPAGE_TITLE = "The Simpsons | Disney+";

    var currentURL = undefined;
    var portReady = false;
    var isHomePage = false;
    var loadedPage = false;
    var loadedPageInterval = undefined;

    function checkPageLoaded()
    {
        clearInterval(loadedPageInterval);
        console.log("Content::CheckPageLoaded");
        if (isHomePage && !loadedPage)
        {
            if (window.document.title != HOMEPAGE_TITLE)
            {
                loadedPageInterval = setInterval(checkPageLoaded, 2000);
            }
            else
            {
                loadedPage = true;
                connectToPort();
                initHomePage();
            }
        }
    }

    function initHomePage()
    {
        let disneyPageActions = document.querySelector('[data-testid="details-featured-actions"]');
        if (!disneyPageActions)
            return;

        let btnWatchMarathon = document.createElement("button");
        btnWatchMarathon.setAttribute("id","btnWatchMarathon");
        btnWatchMarathon.innerHTML = "Watch 24/7 Simpsons Streamer";
        disneyPageActions.appendChild(btnWatchMarathon);

        btnWatchMarathon.addEventListener("click", function() {
            SendMessageToBackground(MessageType.LOADEP,null);
        });

        console.log("Home Page Ext Loaded");
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
                if (!isHomePage && value.isHomePage)
                {
                    isHomePage = true;
                    loadedPage = false;
                    checkPageLoaded();
                }
                isHomePage = value.isHomePage;
            break;
        }
    });

    console.log("Content Script Loaded");
})();
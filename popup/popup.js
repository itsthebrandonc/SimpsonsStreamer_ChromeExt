function $(id) { return document.getElementById(id); }

var episodeInfo = undefined;
var episodeTime = undefined;
var updatedTime = undefined;

function tickSeconds()
{
    if (!episodeInfo)
        return;

    episodeTime = episodeInfo.time + (new Date().getTime() - updatedTime);
    setTimeText();
    //console.log("Tick: " + episodeTime);
    setTimeout(tickSeconds,1000);
}

function setTimeText()
{
    $("epTitle").innerHTML = "S" + episodeInfo.season + "E" + episodeInfo.episode + " : " + episodeInfo.title;
    $("epTime").innerHTML = msToTimestamp(episodeTime) + " / " + msToTimestamp(episodeInfo.duration);
}

function msToTimestamp(msTime)
{
    let seconds = Math.floor(msTime/1000);
    let minutes = Math.floor(seconds/60);
    seconds -= minutes*60;

    if (minutes.toString().length == 1)
        minutes = '0' + minutes;
    if (seconds.toString().length == 1)
        seconds = '0' + seconds;

    return minutes + ':' + seconds;
}

/*
function SendMessageToContent(type,value)
{
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let currTab = tabs[0];
        if (currTab)
        {
            chrome.tabs.sendMessage(currTab.id, {
                type: type,
                value: value
            });
        }
    });
}
*/

function SendMessageToBackground(type,value)
{
    chrome.runtime.sendMessage(
        {type: type,value: value}, 
        function(response) {
          var lastError = chrome.runtime.lastError;
          if (lastError)
          {
            console.log("BG>PU: " + lastError.message);
            AddListener(); //Try reconnecting
          }
        });
}

function AddListener()
{
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const {type, value} = obj;

        switch (type)
        {
            case "GETINFO":
                episodeInfo = value.episodeInfo;
                updatedTime = value.timestamp;
                setTimeText();
                tickSeconds();
            break;
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    SendMessageToBackground(MessageType.GETINFO,null);

    $("btnPlay").addEventListener("click", () => {
        SendMessageToBackground(MessageType.OPENEP,null);
    });
    $("btnRefresh").addEventListener("click", () => {
        SendMessageToBackground(MessageType.GETINFO,null);
    });
    $("btnSync").addEventListener("click", () => {
        SendMessageToBackground(MessageType.SYNC,null);
    });
});
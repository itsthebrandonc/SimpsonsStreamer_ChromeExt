function $(id) { return document.getElementById(id); }

var episodeInfo = undefined;

function setTimeText()
{
    $("epTitle").innerHTML = "S" + episodeInfo.season + "E" + episodeInfo.episode + " : " + episodeInfo.title;
    $("epTime").innerHTML = msToTimestamp(episodeInfo.time) + " / " + msToTimestamp(episodeInfo.duration);
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
            console.log(lastError.message);
        });
}

document.addEventListener("DOMContentLoaded", async () => {
    SendMessageToBackground(MessageType.GETINFO,null);

    $("btnRefresh").addEventListener("click", () => {
        SendMessageToBackground(MessageType.GETINFO,null);
    });
});

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const {type, value} = obj;

    switch (type)
    {
        case "GETINFO":
            episodeInfo = value.episodeInfo;
            setTimeText();
        break;
    }
});
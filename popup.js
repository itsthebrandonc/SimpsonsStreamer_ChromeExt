function $(id) { return document.getElementById(id); }

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
});

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const {type, value} = obj;

    switch (type)
    {
    }
});
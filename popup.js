function $(id) { return document.getElementById(id); }

const MessageType = Object.freeze({
    PORT: "PORT",
    HELLO: "HELLO",
    UPDURL: "UPDURL",
    LOADEP: "LOADEP"
  });

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
    chrome.runtime.sendMessage({
        type: type,
        value: value
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
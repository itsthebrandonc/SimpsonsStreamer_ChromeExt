try { importScripts("constants.js"); } catch (e) { console.error(e); }

const HOMEPAGE_URL = "https://www.disneyplus.com/en-gb/browse/entity-cac75c8f-a9e2-4d95-ac73-1cf1cc7b9568";

var contentPort = undefined;
var portReady = false;

function navigateToEpisode(tabID)
{
    let episodeURL = "https://www.disneyplus.com/en-gb/play/ffb14e5a-38db-4522-a559-3cfa52bcf4df"; //First episode
    chrome.tabs.update( tabID, { url: episodeURL, 'muted':false } ); 
}

function SendMessageToPopup(type,value)
{
    chrome.runtime.sendMessage(
      {type: type,value: value}, 
      function(response) {
        var lastError = chrome.runtime.lastError;
        if (lastError)
          console.log(lastError.message);
      });
}

function SendMessageToContent(type,value)
{
    contentPort.postMessage({type: type, value: value});
}

/*
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const {type, value} = obj;

  switch (type)
  {
      case MessageType.LOADEP:
        navigateToEpisode(sender.tab.id);
        break;
  }
});
*/

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name != MessageType.PORT)
  {
    port.disconnect();
    console.log("Disconnecting wrong URL port");
  }
  else
  {
    console.log("Connection to port has been made");
    contentPort = port;
    contentPort.onDisconnect.addListener(() => {
      portReady = false;
      console.log("Connection to port has been lost");
    });
    contentPort.onMessage.addListener(function(obj) {
      const {type, value} = obj;

      console.log("Port Message: Sender: " + port.sender.tab.id);

      switch (type)
      {
        case MessageType.HELLO:
            portReady = true;
            contentPort.postMessage({type: MessageType.HELLO, value: null});
            break;
        case MessageType.LOADEP:
          navigateToEpisode(port.sender.tab.id);
          break;
      }
    });
  }
});

chrome.tabs.onUpdated.addListener(
  function(thisTabID, changeInfo, tab) {
    if (!changeInfo.status || !tab.url)
      return;

    if (changeInfo.status == "complete" && tab.url && tab.url == HOMEPAGE_URL) {
      console.log("Tab OnUpdate::HOMEPAGE_URL");
      chrome.tabs.sendMessage( thisTabID, {
        type: MessageType.UPDURL,
        value: {"url":tab.url,"isHomePage":(tab.url == HOMEPAGE_URL)}
      });
    }
  }
);

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm)
  {
  }
});

chrome.windows.onCreated.addListener(function(windowid) {
  refreshExtension();
});

function refreshExtension()
{
  console.log("Simpsons: Refresh");
}

refreshExtension();
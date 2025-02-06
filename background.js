try { importScripts("constants.js"); } catch (e) { console.error(e); }

const HOMEPAGE_URL = "https://www.disneyplus.com/en-gb/browse/entity-cac75c8f-a9e2-4d95-ac73-1cf1cc7b9568";
const EP_URL_HEADER = "https://www.disneyplus.com/en-gb/play/";

var contentPort = undefined;
var portReady = false;
var portTimer = false;

var episodeID;
var startDate;

function loadEpisodeInfo()
{
  episodeID = "ffb14e5a-38db-4522-a559-3cfa52bcf4df"; //First episode
  startDate = new Date();
  //startDate.setHours(21,54,0,0);
  testSetNearestHalfHour();
}

function testSetNearestHalfHour()
{
  startDate.setHours(startDate.getHours(),startDate.getMinutes() >= 30 ? 30 : 0,0,0);
}

function navigateToEpisode(tabID)
{
    loadEpisodeInfo();
    chrome.tabs.update( tabID, { url: EP_URL_HEADER + episodeID, 'muted':false } ); 
}

function sendSyncRequest()
{
  clearTimeout(portTimer);
  if (!portReady)
    return;

  let timestamp = new Date().getTime();
  let epTime = (timestamp - startDate.getTime()) / 10000;

  //console.log("Sync Times:: Start Time: " + startDate.getTime() + " Timestamp: " + new Date().getTime() + " EpTime: " + epTime);

  SendMessageToContent(MessageType.SYNC,{"epTime":epTime,"timestamp":timestamp});

  portTimer = setTimeout(sendSyncRequest,5000);
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

      //console.log("Port Message: Sender: " + port.sender.tab.id);

      switch (type)
      {
        case MessageType.HELLO:
            portReady = true;
            contentPort.postMessage({type: MessageType.HELLO, value: null});
            break;
        case MessageType.OPENEP:
          navigateToEpisode(port.sender.tab.id);
          break;
        case MessageType.SYNC:
          sendSyncRequest();
          break;
      }
    });
  }
});

chrome.tabs.onUpdated.addListener(
  function(thisTabID, changeInfo, tab) {
    if (!changeInfo.status || !tab.url)
      return;

    if (changeInfo.status == "complete" && tab.url) { 
      if (tab.url == HOMEPAGE_URL) {
        console.log("Tab OnUpdate::HOMEPAGE_URL");
        chrome.tabs.sendMessage( thisTabID, {
          type: MessageType.UPDURL,
          value: {"url":tab.url,"isHomePage":(tab.url == HOMEPAGE_URL)}
        });
      } else if (tab.url == EP_URL_HEADER + episodeID) {
        loadEpisodeInfo();
        console.log("Tab OnUpdate::EP_URL , startDate: " + startDate);
        chrome.tabs.sendMessage( thisTabID, {
          type: MessageType.UPDURL,
          value: {"url":tab.url,"isEpisode":true,"episodeID":episodeID,"startDate":startDate,"duration":1441000}
        });
      }
    }
  }
);

/*
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
*/
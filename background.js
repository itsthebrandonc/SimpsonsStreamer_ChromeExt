try { importScripts("/helpers/constants.js", "/helpers/episodeInfo.js", "/helpers/timeSync.js"); } catch (e) { console.error(e); }

const HOMEPAGE_URL = "https://www.disneyplus.com/en-gb/browse/entity-cac75c8f-a9e2-4d95-ac73-1cf1cc7b9568";
const EP_URL_HEADER = "https://www.disneyplus.com/en-gb/play/";

var contentPort = undefined;
var portReady = false;
//var portTimer = false;

//var currentEpisode;
var episodeInfo = undefined;

async function loadEpisodeInfo(_callback,...callbackParams)
{
  episodeInfo = await getCurrentEpisode(getSyncDate().getTime());
  //console.log("Ep: " + episodeInfo.episode + ", Time: " + timeIntoEpisode);
  //episodeID = currentEpisode.id;
  //epDuration = currentEpisode.duration;
  //episodeID = "ffb14e5a-38db-4522-a559-3cfa52bcf4df"; //First episode

  _callback.apply(callbackParams);
}

function navigateToEpisode(tabID)
{
    loadEpisodeInfo((...callbackParams) => {
      chrome.tabs.update( tabID, { url: EP_URL_HEADER + episodeInfo.id, 'muted':false } ); 
    },tabID);
    
}

function openEpisode()
{
  chrome.tabs.query({}, tabs => {
      foreach(tab in tabs)
      {
        if (tab.url == EP_URL_HEADER + episodeInfo.id || tab.url == HOMEPAGE_URL)
        {
          chrome.tabs.update(tab.id, {active: true});
          return;
        }
      }
  });
  //chrome.tabs.create({url: HOMEPAGE_URL});
  chrome.tabs.create({url: EP_URL_HEADER + episodeInfo.id});
}

function sendSyncRequest()
{
  //clearTimeout(portTimer);
  if (!portReady)
    return;

  //let timestamp = getSyncDate().getTime();
  //let epTime = (timestamp - startDate.getTime()) / 10000;
  //console.log("Sync Times:: Start Time: " + startDate.getTime() + " Timestamp: " + new Date().getTime() + " EpTime: " + epTime);

  SendMessageToContent(MessageType.SYNC,null);

  //portTimer = setTimeout(sendSyncRequest,5000);
}

function sendInfoToPopup()
{
  loadEpisodeInfo((...callbackParams) => {
    let timestamp = new Date().getTime();
    SendMessageToPopup(MessageType.GETINFO,{episodeInfo:episodeInfo,"timestamp":timestamp});
  });
}

function sendInfoToContent()
{
  loadEpisodeInfo((...callbackParams) => {
    let timestamp = new Date().getTime();
    SendMessageToContent(MessageType.GETINFO,{episodeInfo:episodeInfo,"timestamp":timestamp});
  });
}

function startKeepPortAlive()
{
  pingInterval = setInterval(() => {
    contentPort.postMessage({type: MessageType.HELLO, value: null});
  }, 10000); // Ping every 10 seconds
}

function stopKeepPortAlive()
{
  clearInterval(pingInterval);
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

chrome.runtime.onMessage.addListener((obj, sender, response) => { //POPUP
  const {type, value} = obj;

  switch (type)
  {
    case MessageType.GETINFO:
      sendInfoToPopup();
      break;
    case MessageType.SYNC:
      sendSyncRequest();
      break;
    case MessageType.OPENEP:
      openEpisode();
      break;
  }
});

chrome.runtime.onConnect.addListener(function(port) { //CONTENT
  if (port.name != MessageType.PORT)
  {
    stopKeepPortAlive();
    stopTimeSync();
    port.disconnect();
    console.log("Disconnecting wrong URL port");
  }
  else
  {
    startKeepPortAlive();
    startTimeSync();
    console.log("Connection to port has been made");
    contentPort = port;
    contentPort.onDisconnect.addListener(() => {
      stopKeepPortAlive();
      stopTimeSync();
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
          loadEpisodeInfo(() => {
            sendInfoToContent();
          },null);
          break;
        case MessageType.OPENEP:
          navigateToEpisode(port.sender.tab.id);
          break;
        //case MessageType.SYNC:
        //  sendSyncRequest();
        //  break;
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
      } else if (episodeInfo && tab.url == EP_URL_HEADER + episodeInfo.id) {
        loadEpisodeInfo((...callbackParams) => {
          console.log("Tab OnUpdate::EP_URL , TabID: " + thisTabID + " Episode: " + episodeInfo.id);
          chrome.tabs.sendMessage( thisTabID, {
            type: MessageType.UPDURL,
            value: {"url":tab.url,"isEpisode":true,"episode":episodeInfo}
          });
        },tab.url,thisTabID);
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
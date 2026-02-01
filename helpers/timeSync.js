var worldTimeOffset = 0;
var apiTimer = null;
var syncStarted = false;

function syncWorldTime() {
    stopTimeSync();
    syncStarted = true;
    fetch('https://www.worldtimeapi.org/api/timezone/Etc/UTC')
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(json => {
        var worldTime = new Date(json.utc_datetime);
        var compareTime = new Date(); //Current system Unix time (seconds since 01/01/1970)
        worldTimeOffset = worldTime - compareTime;
        console.log("Time API Offset: " + worldTimeOffset + ", UTC: " + worldTime + ", Local: " + compareTime);
        //console.log("Time API Offset: " + worldTimeOffset + ", Local Time: " + new Date() + ", Sync Time: " + getSyncDate());
        apiTimer = setTimeout(syncWorldTime,60000); //Re-sync every minute
    })
    .catch(function (err) {
        throw new Error("Time API Exception: " + err);
        apiTimer = setTimeout(syncWorldTime,1000); //Re-sync as soon as possible
    });

    //setTimeout(syncWorldTime,60000); //Re-sync every minute
}

function getSyncDate() {
    startTimeSync();
    if (!worldTimeOffset)
        return new Date();

    var currentDate = new Date();
    if ((worldTimeOffset > 1) || (worldTimeOffset < -1))
        currentDate = new Date(currentDate.getTime() + worldTimeOffset);

    return currentDate;
}

function startTimeSync() {
    if (!syncStarted && !apiTimer)
        syncWorldTime();
}

function stopTimeSync() {
    clearTimeout(apiTimer);
    syncStarted = false;
}
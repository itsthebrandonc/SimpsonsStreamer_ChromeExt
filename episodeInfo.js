function getCurrentEpisode(currTime)
{
    var episode = getEpisodeObject()
}

function getDateFromString(strDate)
{
    //yyyy-MM-dd HH:mm:ss,fff"
}

function getCurrentSeason(currTime)
{
    //TODO: Will need to determine what iteration of the marathon we are on, and how far into the current marathon
        //Modulus of total marathon length?
    return 1;
}

function getEpisodeObject(currTime)
{
    const seasonNo = getCurrentSeason(currTime);
    if (seasonNo <= 0)
        console.error("GetCurrentEpisode::Could not get season");

    const dataFile = "./episodeData/season" + seasonNo + ".json";

    fetch(dataFile)
    .then(response => {
        if (response.ok)
            console.log("HTTP Error: " + Response.status);
    })
    .catch(function () {
        console.error("Failed to grab episode data from " + dataFile);
    })
    .then(json => {
        //TODO: Throw all json.episodes into an array, loop through them until finding the one we're currently on
    });
}
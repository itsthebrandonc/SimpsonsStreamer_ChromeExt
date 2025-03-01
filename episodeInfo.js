var startDate;
var totalDuration;
var marathonLoop = 0;
var seasonNo = 0;
var seasonStartDate;
var seasonEndDate;
var seasons = new Array();
var episodes = new Array();
var currentEpisode;
var timeIntoEpisode;

async function getCurrentEpisode(currTime)
{
    return new Promise(async (resolve) => {
        if (seasons.length == 0)
            await getMasterData();
        if (seasonNo == 0 || seasonEndDate <= currTime)
            await getCurrentSeason(currTime);

        let epStartDate = parseInt(seasonStartDate);
        for (var i=0; i<episodes.length; ++i)
        {
            ep = episodes[i];
            if (epStartDate + parseInt(ep.duration) > currTime)
            {
                console.log("Current Episode: S" + ep.season + "E" + ep.episode + ": StartDate: " + unixToString(epStartDate) + ", EndDate: " + unixToString(epStartDate + parseInt(ep.duration)));
                currentEpisode = ep;
                currentEpisode.startDate = epStartDate;
                timeIntoEpisode = currTime - epStartDate;
                currentEpisode.time = timeIntoEpisode;
                break;
            }
            epStartDate += parseInt(ep.duration);
        }
        resolve(currentEpisode);
    });
}

async function getCurrentSeason(currTime)
{
    console.log("CurrTime/StartDate:: " + unixToString(currTime) + " / " + unixToString(startDate));
    var timeSinceStart = currTime - startDate;
    if (timeSinceStart < 0)
    {
        console.error("GetCurrentSeason::Marathon not started");
        return;
    }

    if (timeSinceStart > totalDuration)
    {
        marathonLoop = Math.floor(timeSinceStart / totalDuration);
        seasonStartDate = startDate + totalDuration*marathonLoop;
        seasonEndDate = seasonStartDate;
    }
    else
    {
        seasonStartDate = seasonEndDate = startDate;
    }

    let newSeason = 0;

    seasons.forEach(szn => {
        if (newSeason == 0)
        {
            seasonEndDate += parseInt(szn.duration);
            //console.log("GetCurrentSeason:: S" + szn.seasonNo + ", EndDate: " + unixToString(seasonEndDate));
            if (seasonEndDate > currTime)
            {
                if (szn.seasonNo == seasonNo)
                {
                    return;
                }
                newSeason = szn.seasonNo;
            }
            else
            {
                seasonStartDate = seasonEndDate;
            }
        }
    });

    if (newSeason == 0)
    {
        console.error("GetCurrentSeason::No season found");
        return;
    }

    console.log("GetCurrentSeason:: S" + newSeason + ", Marathon: " + marathonLoop +
        ", SeasonStartDate: " + unixToString(seasonStartDate) + ", SeasonEndDate: " + unixToString(seasonEndDate));

    seasonNo = newSeason;
    await getEpisodeObjects(seasonNo);
}

function getDateFromString(strDate)
{
    //yyyy-MM-dd HH:mm:ss:fff"
    let newDate = getSyncDate();

    //Date
    const dateTimeSplit = strDate.split(" ");
    let strArray = dateTimeSplit[0].split("-");
    if (strArray.length != 3)
        console.error("GetDate::Date: " + strDate);
    newDate.setFullYear(strArray[0],strArray[1]-1,strArray[2]);

    strArray = dateTimeSplit[1].split(":");
    if (strArray.length != 4)
        console.error("GetDate::Time: " + strDate);

    newDate.setHours(strArray[0]);
    newDate.setMinutes(strArray[1]);
    newDate.setSeconds(strArray[2]);
    newDate.setMilliseconds(strArray[3]);

    return newDate.getTime();
}

function unixToString(unixTime)
{
    return new Date(unixTime).toLocaleString();
}

async function getMasterData()
{
    return new Promise((resolve) => {
        fetch("/episodeData/masterData.json")
        .then(response => {
            if (!response.ok)
                console.error("HTTP Error: " + Response.status);
            return response.json();
        })
        .catch(err => {
            console.error("Failed to grab master data: " + err);
        })
        .then(json => {
            console.log("Master Data JSON loaded");

            startDate = getDateFromString(json.startDate);
            totalDuration = json.totalDuration;
            json.seasons.forEach(szn => { seasons.push(szn); });

            resolve();
        });
    });
}

function getEpisodeObjects(sznNo)
{
    if (sznNo.toString().length == 1)
        sznNo = "0" + sznNo;
        
    return new Promise((resolve) => {
        episodes.length = 0;

        const dataFile = "episodeData/season" + sznNo + ".json";

        fetch(dataFile)
        .then(response => {
            if (!response.ok)
                console.log("HTTP Error: " + Response.status);
            return response.json();
        })
        .catch(function () {
            console.error("Failed to grab episode data from " + dataFile);
        })
        .then(json => {
            console.log("Season " + sznNo + " JSON loaded");
            json.episodes.forEach(ep => { episodes.push(ep); });

            resolve();
        });
    });
}
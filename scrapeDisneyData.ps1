#To get this information:
#Go to the season page for The Simpsons on Disney+
#Quickly inspect the page and go to the Network tab
#Search for "durationMs"

#Update this number manually
$seasonObj = [PSCustomObject]@{
    season = 2
    duration = 0
    episodes = @()
}

#Grabs data-dump from disney-Raw.json, creates season file
$json = Get-Content -Raw -Path ./episodeData/disney-Raw.json | ConvertFrom-Json
foreach ($item in $json.data.season.items)
{
    $episode = [PSCustomObject]@{
        id = $($item.actions.upNextID)[0]
        season = [int]$($item.visuals.seasonNumber)
        episode = [int]$($item.visuals.episodeNumber)
        title = $($item.visuals.episodeTitle)
        duration = [int]$($item.visuals.durationMs)
    }

    $seasonObj.episodes += $episode
    $seasonObj.duration += $episode.duration
}

$seasonObj.episodes
$seasonObj | ConvertTo-Json -depth 100 | Out-File "./episodeData/season$($seasonObj.season).json"

#Update Master Data
$masterJson = Get-Content -Raw -Path ./episodeData/masterData.json | ConvertFrom-Json
$masterJson.totalSeasons = 0
$masterJson.totalDuration = 0
$masterJson.seasons = @()

foreach ($season in $(Get-ChildItem -Path ./episodeData -Filter "season*.json"))
{
    $json = Get-Content -Raw -Path "./episodeData/$($season.Name)" | ConvertFrom-Json
    $masterJson.seasons += [PSCustomObject]@{
        seasonNo = $json.season
        episodes = $json.episodes.Length
        duration = $json.duration
    }
    $masterJson.totalSeasons += 1
    $masterJson.totalDuration += $json.duration
}
$masterJson | ConvertTo-Json -depth 100 | Out-File "./episodeData/masterData.json"
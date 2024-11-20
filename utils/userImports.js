

import { clearLocalStorage } from "~/utils/utils.js";

export async function fetchTestUserData(testDataPath){
    clearLocalStorage();
    let testData = await fetch(testDataPath);
    return testData.json();
}

export function importJsonData(data) {

    clearLocalStorage();
    let userName = data["userName"];
    let userName2 = data["userName2"];
    let playerStats2 = data["playerStats2"];
    let playerStats = data["playerStats"];
    let archivedGames = data["parsedGames"];
    let openings = data["openings"];

    window.localStorage.setItem("userName", userName);
    window.localStorage.setItem("userName2", userName2);
    window.localStorage.setItem("playerStats", JSON.stringify(playerStats));
    window.localStorage.setItem("playerStats2", JSON.stringify(playerStats2));

    // pgn games 
    let pgnGames = {}
    for (let i = 0; i < archivedGames.length; i++) {
        pgnGames[archivedGames[i]["gameId"]] = archivedGames[i]["pgn"]
        delete archivedGames.pgn
    }

    let inlineStorage = document.createElement("div");
    let appDiv = document.getElementById("app");
    inlineStorage.setAttribute("id", "pgnGames");
    inlineStorage.setAttribute("hidden", "hidden");
    inlineStorage.textContent = JSON.stringify(pgnGames);
    appDiv.appendChild(inlineStorage)
    console.log("pgnGames saved");

    try {
        window.localStorage.setItem("archivedGames", JSON.stringify(archivedGames));
        console.log("archivedGames saved to local storage")
    } catch (err) {
        let inlineStorage = document.createElement("div");
        let appDiv = document.getElementById("app");
        inlineStorage.setAttribute("id", "archivedGames");
        inlineStorage.setAttribute("hidden", "hidden");
        inlineStorage.textContent = JSON.stringify(archivedGames);
        appDiv.appendChild(inlineStorage);
        console.log("archived games saved to inline storage")

    }

    // openings
    try {
        window.localStorage.setItem("openings", JSON.stringify(openings));
    } catch (err) {
        let inlineStorage = document.createElement("div");
        let appDiv = document.getElementById("app");
        inlineStorage.setAttribute("id", "openingsInlineStorage");
        inlineStorage.setAttribute("hidden", "hidden");
        inlineStorage.textContent = JSON.stringify(openings);
        appDiv.appendChild(inlineStorage);
        console.log("openings saved to inline storage")
    }

}



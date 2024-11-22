import { clearLocalStorage } from "~/utils/utils.js";

// Fetch test user data and clear local storage before loading new data
export async function fetchTestUserData(testDataPath) {
    clearLocalStorage();
    let testData = await fetch(testDataPath);
    return testData.json();
}

// Import JSON data for two users and handle storage
export function importJsonData(data) {
    clearLocalStorage();

    // Extract data for both users
    const { userName, userName2, playerStats, playerStats2, parsedGames, openings } = data;

    // Save usernames and player stats in local storage
    window.localStorage.setItem("userName", userName);
    window.localStorage.setItem("userName2", userName2);
    window.localStorage.setItem("playerStats", JSON.stringify(playerStats));
    window.localStorage.setItem("playerStats2", JSON.stringify(playerStats2));

    // Process and store PGN games
    const pgnGames = {};
    for (let game of parsedGames) {
        pgnGames[game["gameId"]] = game["pgn"];
        delete game.pgn; // Avoid duplication in parsedGames
    }

    const appDiv = document.getElementById("app");

    // Inline storage for PGN games
    saveInlineStorage(appDiv, "pgnGames", JSON.stringify(pgnGames), "PGN games");

    // Save archived games to local storage or inline storage
    try {
        window.localStorage.setItem("archivedGames", JSON.stringify(parsedGames));
        console.log("Archived games saved to local storage");
    } catch (err) {
        saveInlineStorage(appDiv, "archivedGames", JSON.stringify(parsedGames), "Archived games");
    }

    // Save openings to local storage or inline storage
    try {
        window.localStorage.setItem("openings", JSON.stringify(openings));
        console.log("Openings saved to local storage");
    } catch (err) {
        saveInlineStorage(appDiv, "openingsInlineStorage", JSON.stringify(openings), "Openings");
    }

    // Display the data for both users
    displayUserData(userName, playerStats, userName2, playerStats2);
}

// Helper function to save inline storage and log results
function saveInlineStorage(parent, id, content, type) {
    const inlineStorage = document.createElement("div");
    inlineStorage.setAttribute("id", id);
    inlineStorage.setAttribute("hidden", "hidden");
    inlineStorage.textContent = content;
    parent.appendChild(inlineStorage);
    console.log(`${type} saved to inline storage`);
}

// Display user data dynamically in the app
function displayUserData(userName, playerStats, userName2, playerStats2) {
    const appDiv = document.getElementById("app");

    // Create and display User 1 section
    let user1Section = document.createElement("div");
    user1Section.classList.add("user-section");
    user1Section.innerHTML = `
        <h2>User: ${userName}</h2>
        <pre>${JSON.stringify(playerStats, null, 2)}</pre>
    `;
    appDiv.appendChild(user1Section);

    // Create and display User 2 section
    let user2Section = document.createElement("div");
    user2Section.classList.add("user-section");
    user2Section.innerHTML = `
        <h2>User: ${userName2}</h2>
        <pre>${JSON.stringify(playerStats2, null, 2)}</pre>
    `;
    appDiv.appendChild(user2Section);
}

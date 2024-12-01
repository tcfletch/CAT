export function importJsonData(data) {
    // Clear all localStorage or consider scoping to avoid overwriting
    clearLocalStorage();

    // Process data for both users
    const users = [
        {
            id: 1,
            userName: data["userName"],
            playerStats: data["playerStats"],
            archivedGames: data["parsedGames1"] || [], // Default to an empty array if undefined
            openings: data["openings1"] || [], // Default to an empty array if undefined
        },
        {
            id: 2,
            userName: data["userName2"],
            playerStats: data["playerStats2"],
            archivedGames: data["parsedGames2"] || [], // Default to an empty array if undefined
            openings: data["openings2"] || [], // Default to an empty array if undefined
        },
    ];

    users.forEach((user) => {
        const prefix = `user_${user.id}_`;

        // Save user-specific data to localStorage
        window.localStorage.setItem(`${prefix}userName`, user.userName || "Unknown");
        window.localStorage.setItem(`${prefix}playerStats`, JSON.stringify(user.playerStats || {}));

        // Handle PGN games
        const pgnGames = {};
        if (Array.isArray(user.archivedGames)) {
            for (let i = 0; i < user.archivedGames.length; i++) {
                if (user.archivedGames[i] && user.archivedGames[i]["gameId"]) {
                    pgnGames[user.archivedGames[i]["gameId"]] = user.archivedGames[i]["pgn"];
                }
            }
        }

        // Inline storage for PGN games
        saveInlineStorage(`${prefix}pgnGames`, pgnGames);

        // Save archived games
        try {
            window.localStorage.setItem(`${prefix}archivedGames`, JSON.stringify(user.archivedGames || []));
            console.log(`${prefix}archivedGames saved to local storage`);
        } catch (err) {
            saveInlineStorage(`${prefix}archivedGames`, user.archivedGames || []);
        }

        // Save openings
        try {
            window.localStorage.setItem(`${prefix}openings`, JSON.stringify(user.openings || []));
        } catch (err) {
            saveInlineStorage(`${prefix}openings`, user.openings || []);
        }

        console.log(`Data for ${user.userName} saved successfully.`);
    });

    // Helper function to save data in inline storage
function saveInlineStorage(id, data) {
    const inlineStorage = document.createElement("div");
    const appDiv = document.getElementById("app");

    if (!appDiv) {
        console.error("App container not found. Inline storage cannot be saved.");
        return;
    }

    inlineStorage.setAttribute("id", id);
    inlineStorage.setAttribute("hidden", "hidden");
    inlineStorage.textContent = JSON.stringify(data);

    appDiv.appendChild(inlineStorage);
    console.log(`${id} saved to inline storage`);
}

}

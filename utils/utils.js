export function clearLocalStorage(userId = null) {
    if (userId) {
        // Clear specific user data
        const prefix = `user_${userId}_`;
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
        console.log(`Local storage cleared for user ${userId}`);
    } else {
        // Clear all data
        localStorage.clear();
        console.log("Global local storage cleared");
    }

    // Remove inline storage
    document.querySelectorAll("[id*='Games']").forEach((el) => el.remove());
    console.log("Inline storage cleared");
}

export function getPlayerStats(userId) {
    const stats = localStorage.getItem(`user_${userId}_playerStats`);
    return stats ? JSON.parse(stats) : null;
}

export function getUserName(userId) {
    return localStorage.getItem(`user_${userId}_userName`) || null;
}

export function utcToHuman(unixTimestamp) {
    const dateObject = new Date(unixTimestamp * 1000);
    const year = dateObject.getFullYear();
    const month = ('0' + (dateObject.getMonth() + 1)).slice(-2);
    const day = ('0' + dateObject.getDate()).slice(-2);
    const hours = ('0' + dateObject.getHours()).slice(-2);
    const minutes = ('0' + dateObject.getMinutes()).slice(-2);
    const seconds = ('0' + dateObject.getSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function getFormattedTimestamp() {
    const now = new Date();
    const fullYear = now.getFullYear();
    const twoDigitYear = String(fullYear).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${twoDigitYear}${month}${day}${hour}${minute}`;
}

export function getLargestTimeClass(userId) {
    const playerStats = getPlayerStats(userId);
    if (!playerStats) {
        console.error(`No stats found for user ${userId}`);
        return null;
    }

    const timeClassCount = {};
    const timeClasses = ["chess_bullet", "chess_blitz", "chess_rapid", "chess_daily"];

    timeClasses.forEach((timeClass) => {
        if (playerStats.hasOwnProperty(timeClass)) {
            const record = playerStats[timeClass].record;
            timeClassCount[timeClass] = record.win + record.loss + record.draw;
        }
    });

    let maxClass = null;
    let maxCount = 0;
    for (const [timeClass, count] of Object.entries(timeClassCount)) {
        if (count > maxCount) {
            maxClass = timeClass;
            maxCount = count;
        }
    }

    return maxClass;
}

export async function fetchUserStats(userName, userId) {
    const playerStatsUrl = `https://api.chess.com/pub/player/${userName}/stats`;

    try {
        const response = await fetch(playerStatsUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const stats = await response.json();

        // Save stats to localStorage
        localStorage.setItem(`user_${userId}_playerStats`, JSON.stringify(stats));
        localStorage.setItem(`user_${userId}_userName`, userName);
        console.log(`Stats fetched and saved for user ${userId}`);
        return stats;
    } catch (error) {
        console.error(`Failed to fetch stats for ${userName}:`, error);
        return { error: true, message: error.message };
    }
}

export async function fetchArchiveUrls(userName, userId) {
    const archiveUrl = `https://api.chess.com/pub/player/${userName}/games/archives`;

    try {
        const response = await fetch(archiveUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const archives = await response.json();

        // Save archives to localStorage
        localStorage.setItem(`user_${userId}_archives`, JSON.stringify(archives));
        console.log(`Archives fetched and saved for user ${userId}`);
        return archives;
    } catch (error) {
        console.error(`Failed to fetch archives for ${userName}:`, error);
        return { error: true, message: error.message };
    }
}

export function logAPIRequest(userName, userId) {
    const apiUri = "https://chessinsights.xyz";
    fetch(`${apiUri}/api/logRequest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ uname: userName, userId }),
    }).catch((error) => {
        console.error(`Error logging API request for user ${userId}:`, error);
    });
}

export function getResult(result) {
    if (result === "win") {
        return "win";
    } else if (["resigned", "timeout", "checkmated", "abandoned"].includes(result)) {
        return "loss";
    } else {
        return "draw";
    }
}

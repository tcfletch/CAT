// Clear local storage and inline storage
// export function clearLocalStorage() {
//     window.localStorage.clear();

//     const inlineStorages = [
//         { id: 'archivedGames', name: 'inline archived games' },
//         { id: 'pgnGames', name: 'inline PGN games' },
//         { id: 'openings', name: 'inline openings storage' },
//     ];

//     inlineStorages.forEach(({ id, name }) => {
//         const element = document.getElementById(id);
//         if (element) {
//             element.remove();
//             console.log(`${name} cleared`);
//         }
//     });

//     console.log("Local storage cleared");
// }

// Fetch stats for two users
export async function fetchUserStats(userName, userName2) {
    const stats = [];

    try {
        // Fetch stats for the first user
        if (userName) {
            const url1 = `https://api.chess.com/pub/player/${userName}/stats`;
            const response1 = await fetch(url1);
            if (!response1.ok) {
                throw new Error(`HTTP error for ${userName}! Status: ${response1.status}`);
            }
            const data1 = await response1.json();
            stats.push({ user: userName, stats: data1 });
        }

        // Fetch stats for the second user
        if (userName2) {
            const url2 = `https://api.chess.com/pub/player/${userName2}/stats`;
            const response2 = await fetch(url2);
            if (!response2.ok) {
                throw new Error(`HTTP error for ${userName2}! Status: ${response2.status}`);
            }
            const data2 = await response2.json();
            stats.push({ user: userName2, stats: data2 });
        }

        return stats;
    } catch (error) {
        console.error(`Error fetching user stats: ${error.message}`);
        return { error: true, message: error.message };
    }
}

// Fetch game archive URLs for two users
export async function fetchArchiveUrls(userName, userName2) {
    const archives = [];

    try {
        if (userName) {
            const url1 = `https://api.chess.com/pub/player/${userName}/games/archives`;
            const response1 = await fetch(url1);
            if (!response1.ok) {
                throw new Error(`HTTP error for ${userName} archives! Status: ${response1.status}`);
            }
            const data1 = await response1.json();
            archives.push({ user: userName, archives: data1 });
        }

        if (userName2) {
            const url2 = `https://api.chess.com/pub/player/${userName2}/games/archives`;
            const response2 = await fetch(url2);
            if (!response2.ok) {
                throw new Error(`HTTP error for ${userName2} archives! Status: ${response2.status}`);
            }
            const data2 = await response2.json();
            archives.push({ user: userName2, archives: data2 });
        }

        return archives;
    } catch (error) {
        console.error(`Error fetching archives: ${error.message}`);
        return { error: true, message: error.message };
    }
}

// Log API requests for two users
export function logAPIRequest(userName, userName2) {
    const apiUri = "https://chessinsights.xyz"; // API URI

    [userName, userName2].forEach((user) => {
        if (user) {
            fetch(`${apiUri}/api/logRequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uname: user }),
            }).catch((error) => {
                console.error(`Error logging request for ${user}:`, error);
            });
        }
    });
}

// Convert UNIX timestamp to human-readable format
export function utcToHuman(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const [year, month, day, hours, minutes, seconds] = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
        String(date.getHours()).padStart(2, '0'),
        String(date.getMinutes()).padStart(2, '0'),
        String(date.getSeconds()).padStart(2, '0'),
    ];
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Get player stats from local storage
export function getPlayerStats() {
    return JSON.parse(window.localStorage.getItem("playerStats"));
}

// Get username from local storage
export function getUserName() {
    return window.localStorage.getItem("userName");
}

// Get formatted timestamp
export function getFormattedTimestamp() {
    const now = new Date();
    const [year, month, day, hour, minute] = [
        String(now.getFullYear()).slice(-2),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
    ];
    return `${year}${month}${day}${hour}${minute}`;
}

// Determine the most-played time class for multiple users
export function getLargestTimeClassForUsers(userStatsArray) {
    return userStatsArray.map(({ user, stats }) => {
        let timeClassCount = {};

        if (stats.chess_bullet) {
            const record = stats.chess_bullet.record;
            timeClassCount["bullet"] = record.win + record.loss + record.draw;
        }
        if (stats.chess_blitz) {
            const record = stats.chess_blitz.record;
            timeClassCount["blitz"] = record.win + record.loss + record.draw;
        }
        if (stats.chess_rapid) {
            const record = stats.chess_rapid.record;
            timeClassCount["rapid"] = record.win + record.loss + record.draw;
        }
        if (stats.chess_daily) {
            const record = stats.chess_daily.record;
            timeClassCount["daily"] = record.win + record.loss + record.draw;
        }

        const maxClass = Object.keys(timeClassCount).reduce((max, timeClass) =>
            timeClassCount[timeClass] > (timeClassCount[max] || 0) ? timeClass : max, ""
        );

        return { user, largestTimeClass: maxClass };
    });
}

// Determine the most-played time class for the current user
export function getLargestTimeClass() {
    const playerStats = getPlayerStats();
    const timeClassCount = {};

    ["chess_bullet", "chess_blitz", "chess_rapid", "chess_daily"].forEach((key) => {
        if (playerStats && playerStats[key]) {
            const record = playerStats[key].record;
            timeClassCount[key.split("_")[1]] = record.win + record.loss + record.draw;
        }
    });

    return Object.keys(timeClassCount).reduce((max, timeClass) =>
        timeClassCount[timeClass] > (timeClassCount[max] || 0) ? timeClass : max, ""
    );
}

// Determine result from a game outcome
export function getResult(result) {
    if (result === "win") return "win";
    if (["resigned", "timeout", "checkmated", "abandoned"].includes(result)) return "loss";
    return "draw";
}

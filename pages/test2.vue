<template>
    <div>
      <NavBar />
  
      <!-- Username Input Fields -->
      <div class="container">
        <div class="row">
          <div class="col">
            <input
              type="text"
              v-model="userName1"
              placeholder="Enter first username"
              class="form-control"
            />
          </div>
          <div class="col">
            <input
              type="text"
              v-model="userName2"
              placeholder="Enter second username"
              class="form-control"
            />
          </div>
          <div class="col">
            <!-- Single button to fetch data for both users -->
            <button class="btn btn-primary" @click="fetchDataForBothUsers">
              Fetch Data for Both Users
            </button>
          </div>
        </div>
      </div>
  
      <!-- Loading Spinner and Progress Bar -->
      <div v-if="showSpinner" class="container">
        <div class="spinner-border"></div>
        {{ spinnerText }}
      </div>
  
      <ProgBar v-if="showProg" :progress="progress" :games-found="gamesFound" />
  
      <!-- Charts and User Overview -->
      <div v-if="showCharts">
        <!-- Add your UserOverview and Chart Components here -->
      </div>
    </div>
  </template>
  
  <script>
  import {
    getLargestTimeClass,
    clearLocalStorage,
    fetchUserStats,
    fetchArchiveUrls,
    logAPIRequest
  } from '~/utils/utils.js'
  
  import { 
    parseAndSaveArchivedGames, 
    verifyLiveChess,
    getArchivedGames,
    getTotalTimePlayed
  } from '~/utils/archiveUtils.js'
  
  import {
    calcOpeningsData,
    saveOpeningsData,
    getSavedOpeningsData
  } from '~/utils/openingsUtils.js'
  
  export default {
    name: "HomePage",
    data() {
      return {
        userName1: '',
        userName2: '',
        showSpinner: false,
        spinnerText: "",
        showProg: false,
        showCharts: false,
        gamesFound: 0,
        progress: 0,
        maxGames: 10000,
        user1Stats: {},
        user2Stats: {}
      };
    },
  
    methods: {
      async fetchDataForBothUsers() {
        // Check if usernames are provided
        if (!this.userName1 || !this.userName2) {
          alert("Please enter both usernames.");
          return;
        }
  
        console.clear();
        clearLocalStorage();
  
        this.showCharts = false;
        this.showSpinner = true;
        this.spinnerText = "Fetching data for both users...";
        this.showProg = true;
  
        try {
          console.log(`Starting data fetch for users: ${this.userName1} and ${this.userName2}`);
  
          const [user1Data, user2Data] = await Promise.all([
            this.getAllUserData(this.userName1),
            this.getAllUserData(this.userName2)
          ]);
  
          if (user1Data && user2Data) {
            this.user1Stats = user1Data;
            this.user2Stats = user2Data;
            this.showCharts = true;
            this.spinnerText = "Data fetched successfully";
            console.log("Data fetched successfully for both users");
          } else {
            console.error("Error: Data fetch failed for one or both users");
            alert("Error fetching data for one or both users. Please check the console.");
          }
        } catch (error) {
          console.error("An error occurred while fetching data for both users:", error);
          alert("Error fetching data. Please check the console for more details.");
        } finally {
          this.showSpinner = false;
          this.showProg = false;
        }
      },
  
      async getAllUserData(userName) {
        try {
          // Log the entry into this function and the value of userName
          console.log(`Entering getAllUserData with userName: ${userName}`);
  
          // Check if userName is null or undefined at the start
          if (!userName) {
            console.error("Error: userName is null or undefined.");
            alert("The username provided is null or undefined. Please check your input.");
            return null;
          }
  
          console.log(`Fetching user stats for: ${userName}`);
  
          // Fetch user stats
          let userStatsRes = await fetchUserStats(userName);
          if (!userStatsRes.ok) {
            console.error(`Error fetching user stats for ${userName}, status: ${userStatsRes.status}`);
            alert(`Error fetching user stats for ${userName}, status: ${userStatsRes.status}`);
            return null;
          }
  
          let userStats = await userStatsRes.json();
          console.log(`User stats retrieved successfully for: ${userName}`);
  
          // Fetch archive URLs
          console.log(`Fetching archive URLs for: ${userName}`);
          let archiveUrlsRes = await fetchArchiveUrls(userName);
          if (archiveUrlsRes.status !== 200) {
            console.error(`Error fetching archives for ${userName}, status code: ${archiveUrlsRes.status}`);
            alert(`Error fetching archives for ${userName}: Status ${archiveUrlsRes.status}`);
            return null;
          }
  
          let archiveUrls = (await archiveUrlsRes.json()).archives;
          console.log(`Archive URLs retrieved successfully for: ${userName}`);
  
          let totalGames = 0;
          let games = [];
  
          for (let i = 0; i < archiveUrls.length; i++) {
            if (totalGames >= this.maxGames) break;
  
            console.log(`Fetching games from archive URL: ${archiveUrls[i]}`);
            let archive = await fetch(archiveUrls[i]);
            if (!archive.ok) {
              console.error(`Error fetching archive data from ${archiveUrls[i]}, status: ${archive.status}`);
              continue;
            }
  
            let archiveJson = await archive.json();
            let archiveGameList = archiveJson.games;
  
            if (!archiveGameList) {
              console.log(`No games found in archive: ${archiveUrls[i]}`);
              continue;
            }
  
            for (let game of archiveGameList) {
              if (verifyLiveChess(game)) {
                games.push(game);
                totalGames++;
                if (totalGames >= this.maxGames) break;
              }
            }
  
            let prog = Math.ceil(((i + 1) / archiveUrls.length) * 100);
            this.gamesFound = totalGames;
            this.progress = prog;
          }
  
          parseAndSaveArchivedGames(games);
          saveOpeningsData(calcOpeningsData());
          console.log(`Completed fetching and parsing data for user: ${userName}`);
  
          return {
            userName,
            totalGames,
            games,
            userStats
          };
        } catch (error) {
          console.error(`An error occurred while fetching data for ${userName || "unknown user"}:`, error);
          alert(`An error occurred while fetching data for ${userName || "unknown user"}. Check console for details.`);
          return null;
        }
      }
    }
  };
  </script>
  
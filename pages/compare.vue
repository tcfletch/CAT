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
      user1Stats: {},
      user2Stats: {}
    };
  },

  methods: {
    async fetchDataForBothUsers() {
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

      const [user1Data, user2Data] = await Promise.all([
        this.getAllUserData(this.userName1),
        this.getAllUserData(this.userName2)
      ]);

      if (user1Data && user2Data) {
        this.user1Stats = user1Data;
        this.user2Stats = user2Data;
        this.showCharts = true;
        this.spinnerText = "Data fetched successfully";
      } else {
        this.showSpinner = false;
        this.showProg = false;
        alert("Error fetching data for one or both users.");
      }
    },

    async getAllUserData(userName) {
      try {
        let totalGames = 0;
        let games = [];
        let userStatsRes = await fetchUserStats(userName);

        if (userStatsRes.error) {
          console.error(`Error fetching user stats for ${userName}`);
          return null;
        }

        let userStats = await userStatsRes.json();
        let archiveUrlsRes = await fetchArchiveUrls(userName);
        
        if (archiveUrlsRes.status !== 200) {
          console.error(`Error fetching archives for ${userName}`);
          return null;
        }

        let archiveUrls = (await archiveUrlsRes.json()).archives;

        for (let i = 0; i < archiveUrls.length; i++) {
          let archive = await fetch(archiveUrls[i]);
          let archiveJson = await archive.json();
          let archiveGameList = archiveJson.games;

          if (archiveGameList) {
            archiveGameList.forEach((game) => {
              if (verifyLiveChess(game)) {
                games.push(game);
                totalGames++;
              }
            });
          }

          let prog = Math.ceil(((i + 1) / archiveUrls.length) * 100);
          this.gamesFound += totalGames;
          this.progress = prog;
        }

        parseAndSaveArchivedGames(games);
        saveOpeningsData(calcOpeningsData());

        return {
          userName,
          totalGames,
          games,
          userStats
        };

      } catch (error) {
        console.error(`An error occurred while fetching data for ${userName}`, error);
        return null;
      }
    }
  }
};
</script>

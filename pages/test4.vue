<template>
  <div>
    <NavBar />

    <InputForm 
      @get-all-user-data="getAllUserData" 
      @read-file-upload="handleFileUpload" 
    />

    <ProgBar v-if="showProg" :progress="progress" :games-found="gamesFound" />

    <div v-if="showCharts">
      <div class="container px-4">
        <div class="row">
          <div class="col d-flex justify-content-center gap-2">
            <ButtonsClearCharts />
            <ButtonsExploreBtn />
            <ButtonsExportBtn />
          </div>
        </div>
      </div>

      <!-- Display each user's overview and charts side by side -->
      <div class="row">
        <!-- User 1 Data -->
        <div class="col-md-6">
          <UserOverview 
            @update-user-overview="updateOverview($event, 'user1')"
            :userName="userName1"  
            :ovTimeClass="user1.ovTimeClass"
            :ovTotalGames="user1.ovTotalGames" 
            :ovWinPercentage="user1.ovWinPercentage" 
            :ovWinCount="user1.ovWinCount"
            :ovDrawPercentage="user1.ovDrawPercentage" 
            :ovDrawCount="user1.ovDrawCount" 
            :ovLossPercentage="user1.ovLossPercentage"
            :ovLossCount="user1.ovLossCount"
            :ovTimePlayed="user1.ovTimePlayed" 
          />

          <ChartsEloOverTimeChart @update="writeEloOverTime($event, 'user1')" :timeClass="user1.eloTimeClass" />
          <ChartsOpeningChart @update-time-class="user1.openingsTimeClass = $event" :timeClass="user1.openingsTimeClass" :color="user1.openingsColor" />
        </div>

        <!-- User 2 Data -->
        <div class="col-md-6">
          <UserOverview 
            @update-user-overview="updateOverview($event, 'user2')"
            :userName="userName2"  
            :ovTimeClass="user2.ovTimeClass"
            :ovTotalGames="user2.ovTotalGames" 
            :ovWinPercentage="user2.ovWinPercentage" 
            :ovWinCount="user2.ovWinCount"
            :ovDrawPercentage="user2.ovDrawPercentage" 
            :ovDrawCount="user2.ovDrawCount" 
            :ovLossPercentage="user2.ovLossPercentage"
            :ovLossCount="user2.ovLossCount"
            :ovTimePlayed="user2.ovTimePlayed" 
          />

          <ChartsEloOverTimeChart @update="writeEloOverTime($event, 'user2')" :timeClass="user2.eloTimeClass" />
          <ChartsOpeningChart @update-time-class="user2.openingsTimeClass = $event" :timeClass="user2.openingsTimeClass" :color="user2.openingsColor" />
        </div>
      </div>

      <ExportPopup />
    </div>
  </div>
</template>

<script>
import {
  getLargestTimeClass,
  clearLocalStorage,
  fetchUserStats,
  fetchArchiveUrls,
} from '~/utils/utils.js';

import { 
  parseAndSaveArchivedGames, 
  verifyLiveChess,
  getArchivedGames,
  getTotalTimePlayed,
} from '~/utils/archiveUtils.js';

import {
  calcOpeningsData,
  saveOpeningsData,
  getSavedOpeningsData,
} from '~/utils/openingsUtils.js';

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
      user1: {
        ovTimeClass: '',
        ovTotalGames: 0,
        ovWinPercentage: 0,
        ovWinCount: 0,
        ovDrawPercentage: 0,
        ovDrawCount: 0,
        ovLossPercentage: 0,
        ovLossCount: 0,
        ovTimePlayed: 0,
        eloTimeClass: '',
        openingsTimeClass: '',
        openingsColor: '',
      },
      user2: {
        ovTimeClass: '',
        ovTotalGames: 0,
        ovWinPercentage: 0,
        ovWinCount: 0,
        ovDrawPercentage: 0,
        ovDrawCount: 0,
        ovLossPercentage: 0,
        ovLossCount: 0,
        ovTimePlayed: 0,
        eloTimeClass: '',
        openingsTimeClass: '',
        openingsColor: '',
      },
    };
  },
  methods: {
    async getAllUserData({ user1, user2 }) {
      this.showSpinner = true;
      this.spinnerText = "Fetching data for both users...";
      this.showProg = true;
      this.showCharts = false;

      try {
        const [user1Stats, user2Stats] = await Promise.all([
          this.fetchUserData(user1, 'user1'),
          this.fetchUserData(user2, 'user2'),
        ]);

        if (!user1Stats || !user2Stats) {
          throw new Error("Failed to retrieve data for one or both users.");
        }

        this.userName1 = user1;
        this.userName2 = user2;
        this.showCharts = true;

      } catch (error) {
        alert(error.message);
      } finally {
        this.showSpinner = false;
        this.showProg = false;
      }
    },

    async fetchUserData(userName, userKey) {
      try {
        let totalGames = 0;
        const userStatsRes = await fetchUserStats(userName);
        if (!userStatsRes.ok) throw new Error(`Error fetching stats for ${userName}`);
        const userStats = await userStatsRes.json();
        window.localStorage.setItem(`${userKey}Stats`, JSON.stringify(userStats));

        const archiveUrlsRes = await fetchArchiveUrls(userName);
        if (!archiveUrlsRes.ok) throw new Error(`Error fetching archives for ${userName}`);
        const archiveUrls = (await archiveUrlsRes.json()).archives;
        
        const archivedGames = [];
        for (let i = 0; i < archiveUrls.length; i++) {
          const archiveRes = await fetch(archiveUrls[i]);
          const archiveGames = (await archiveRes.json()).games;
          if (archiveGames) {
            archiveGames.forEach(game => {
              if (verifyLiveChess(game)) archivedGames.push(game);
            });
            totalGames += archiveGames.length;
            this.progress = Math.ceil(((i + 1) / archiveUrls.length) * 100);
          }
        }

        parseAndSaveArchivedGames(archivedGames);
        saveOpeningsData(calcOpeningsData());

        this[userKey].ovTotalGames = totalGames;
        this.updateOverview("all", userKey);

      } catch (error) {
        console.error(error.message);
        return null;
      }
    },

    updateOverview(timeClass, userKey) {
      const userStats = JSON.parse(window.localStorage.getItem(`${userKey}Stats`));
      let numWins = 0, numLosses = 0, numDraws = 0;

      const validTimeClasses = ["blitz", "rapid", "bullet", "daily"];
      if (timeClass === "all") {
        validTimeClasses.forEach(cls => {
          const stats = userStats[`chess_${cls}`];
          if (stats) {
            numWins += stats.record.win;
            numLosses += stats.record.loss;
            numDraws += stats.record.draw;
          }
        });
      }

      const totalGames = numWins + numDraws + numLosses;
      this[userKey].ovWinPercentage = ((numWins * 100) / totalGames).toFixed(1);
      this[userKey].ovDrawPercentage = ((numDraws * 100) / totalGames).toFixed(1);
      this[userKey].ovLossPercentage = ((numLosses * 100) / totalGames).toFixed(1);
      this[userKey].ovWinCount = numWins;
      this[userKey].ovDrawCount = numDraws;
      this[userKey].ovLossCount = numLosses;
      this[userKey].ovTimePlayed = getTotalTimePlayed();
    },
  },
};
</script>

<style scoped>
/* Add relevant styling for side-by-side display */
</style>

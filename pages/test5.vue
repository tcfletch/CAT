<template>
    <div>
      <NavBar /> 
    
      <InputForm 
      @get-all-user-data="getAllUserData" 
      @read-file-upload="handleFileUpload" 
      />
    
      <div v-if="showSpinner" class="container">
        <div class="spinner-border">
        </div>
        {{ spinnerText }}
      </div>
    
      <ProgBar 
      v-if="showProg" 
      :progress="progress" 
      :games-found="gamesFound" />
    
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
    
        <UserOverview 
        @update-user-overview="updateOverview($event)" 
        :userName="userName" 
        :ovTimeClass="ovTimeClass"
        :ovTotalGames="ovTotalGames" 
        :ovWinPercentage="ovWinPercentage" 
        :ovWinCount="ovWinCount"
        :ovDrawPercentage="ovDrawPercentage" 
        :ovDrawCount="ovDrawCount" 
        :ovLossPercentage="ovLossPercentage"
        :ovLossCount="ovLossCount"
        :ovTimePlayed="ovTimePlayed" 
        />
    
        <ChartsEloOverTimeChart 
        @update="writeEloOverTime($event)" 
        :timeClass="eloTimeClass" />
    
        <ChartsOpeningChart
        @update-time-class="openingsTimeClass = $event" 
        @update-color="openingsColor = $event" 
        :timeClass="openingsTimeClass" 
        :color="openingsColor" />
    
        <ChartsResByRating
        :timeClass="resByOppTimeClass" 
        @updateResByOpp="resByOppTimeClass = $event" />
    
        <ChartsWinChart 
        @updateWin="winTimeClass = $event" 
        :timeClass="winTimeClass" />
    
        <ChartsLossChart 
        @updateLoss="lossTimeClass = $event" 
        :timeClass="lossTimeClass" 
        />
    
        <ChartsDrawChart 
        @updateDraw="drawTimeClass = $event" 
        :timeClass="drawTimeClass" 
        />
    
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
            userName: '',
            showSpinner: false,
            spinnerText: "",
            showProg: false,
            showCharts: false,
            gamesFound: 0,
            progress: 0,
            totalUserGames: 0,
            eloTimeClass: '',
            resByOppTimeClass: 'all',
            lossTimeClass: 'all',
            winTimeClass: 'all',
            drawTimeClass: 'all',
            ovTimeClass: '',
            ovUserGames: 0,
            ovWinPercentage: 0,
            ovWinCount: 0,
            ovDrawCount: 0,
            ovDrawPercentage: 0,
            ovLossCount: 0,
            ovLossPercentage: 0,
            ovTotalGames: 0,
            ovTimePlayed: 0,
          }
        },
    
        mounted: function () {
          let localData = this.getLocalData();
          if (localData !== null) {
            this.finishSetup();
          }
          else {
            clearLocalStorage();
          }
        },
    
        methods: {
  async getAllUserData(user1, user2) {
    console.clear();
    clearLocalStorage();

    this.showCharts = false;
    this.showSpinner = true;
    this.spinnerText = "Fetching data for both users...";
    this.showProg = true;

    this.gamesFound = 0;
    this.progress = 0;

    user1 = user1.trim();
    user2 = user2.trim();

    // Fetch data for both users concurrently
    try {
      const [user1Data, user2Data] = await Promise.all([
        this.fetchUserData(user1, 'user1'),
        this.fetchUserData(user2, 'user2')
      ]);

      if (!user1Data || !user2Data) {
        throw new Error("Error fetching data for one or both users.");
      }

      this.showCharts = true;

    } catch (error) {
      console.error(error);
      alert("An error occurred while fetching data for both users.");
    } finally {
      this.showSpinner = false;
      this.showProg = false;
    }
  },

  async fetchUserData(userName, userKey) {
    let totalGames = 0;
    this.gamesFound = 0;
    this.progress = 0;

    try {
      // Fetch user stats
      const userStatsRes = await fetchUserStats(userName);
      if (!userStatsRes.ok) {
        throw new Error(`Error fetching stats for ${userName}`);
      }
      const userStats = await userStatsRes.json();
      window.localStorage.setItem(`${userKey}Stats`, JSON.stringify(userStats));

      // Fetch archive URLs
      const archiveUrlsRes = await fetchArchiveUrls(userName);
      if (archiveUrlsRes.status !== 200) {
        throw new Error(`Error fetching archives for ${userName}`);
      }

      const archiveMonths = await archiveUrlsRes.json();
      const archiveUrls = archiveMonths.archives;
      let archivedGames = [];

      // Fetch games from each archive URL
      for (let i = 0; i < archiveUrls.length; i++) {
        const archive = await fetch(archiveUrls[i]);
        const archiveJson = await archive.json();
        const archiveGameList = archiveJson.games;

        if (!archiveGameList) {
          console.log(`No games found in archive ${archiveUrls[i]}`);
          continue;
        }

        // Filter and store games
        for (const game of archiveGameList) {
          if (verifyLiveChess(game)) {
            archivedGames.push(game);
            totalGames += 1;
          }
        }

        this.progress = Math.ceil(((i + 1) / archiveUrls.length) * 100);
        this.gamesFound = totalGames;
      }

      // Store games and additional data in local storage
      window.localStorage.setItem(`${userKey}Games`, JSON.stringify(archivedGames));
      window.localStorage.setItem(`${userKey}TotalGames`, totalGames.toString());

      parseAndSaveArchivedGames(archivedGames);
      saveOpeningsData(calcOpeningsData());

    } catch (error) {
      console.error(error.message);
      return null;
    }

    return { success: true };
  },

  finishSetup() {
    this.showProg = false;
    this.spinnerText = "Saving data...";

    // Setup data for both users
    this.updateOverview("all", "user1");
    this.updateOverview("all", "user2");

    this.showSpinner = false;
    this.showCharts = true;

    const element = document.getElementById('uname');
    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  },

  handleFileUpload() {
        this.showCharts = false;
        this.showSpinner = true;
        this.spinnerText = "Fetching user data...";
        this.showProg = true;
        this.finishSetup();
      },

  writeEloOverTime(timeClass = "rapid", userKey) {
    this[`${userKey}EloTimeClass`] = timeClass;
  },

  updateOverview(timeClass, userKey) {
    const userStats = JSON.parse(window.localStorage.getItem(`${userKey}Stats`));
    let numWins = 0, numLosses = 0, numDraws = 0;
    const validTimeClasses = ["blitz", "rapid", "bullet", "daily"];

    // Aggregate stats across time classes if needed
    if (timeClass === "all") {
      for (const cls of validTimeClasses) {
        const stats = userStats[`chess_${cls}`];
        if (stats) {
          numWins += stats.record.win;
          numLosses += stats.record.loss;
          numDraws += stats.record.draw;
        }
      }
    } else {
      const stats = userStats[`chess_${timeClass}`];
      if (stats) {
        numWins = stats.record.win;
        numLosses = stats.record.loss;
        numDraws = stats.record.draw;
      }
    }

    const totalGames = numWins + numDraws + numLosses;
    const percentWins = ((numWins * 100) / totalGames).toFixed(1);
    const percentDraws = ((numDraws * 100) / totalGames).toFixed(1);
    const percentLosses = ((numLosses * 100) / totalGames).toFixed(1);

    // Store calculated overview data for each user separately
    this[`${userKey}OvTimeClass`] = timeClass;
    this[`${userKey}OvTotalGames`] = totalGames.toString();
    this[`${userKey}OvWinPercentage`] = percentWins.toString();
    this[`${userKey}OvWinCount`] = numWins.toString();
    this[`${userKey}OvDrawPercentage`] = percentDraws.toString();
    this[`${userKey}OvDrawCount`] = numDraws.toString();
    this[`${userKey}OvLossPercentage`] = percentLosses.toString();
    this[`${userKey}OvLossCount`] = numLosses.toString();
    this[`${userKey}OvTimePlayed`] = getTotalTimePlayed();
  },

  getLocalData() {
    const user1Name = window.localStorage.getItem("user1Name");
    const user2Name = window.localStorage.getItem("user2Name");
    const user1Stats = window.localStorage.getItem("user1Stats");
    const user2Stats = window.localStorage.getItem("user2Stats");
    const user1Games = window.localStorage.getItem("user1Games");
    const user2Games = window.localStorage.getItem("user2Games");

    if (!user1Name || !user2Name || !user1Stats || !user2Stats || !user1Games || !user2Games) {
      return null;
    } else {
      return {
        user1: { name: user1Name, stats: user1Stats, games: user1Games },
        user2: { name: user2Name, stats: user2Stats, games: user2Games }
      };
    }
  }
}

      
    
      }
    </script>
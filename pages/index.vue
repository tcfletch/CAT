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


    <div class="user-charts-container">
      <h3 class="text-center">User 1: {{ userName1 }}</h3>
    
    <UserOverview 
    @update-user-overview="updateOverview($event, 'user1')" 
    :userName="userName1" 
    :ovTimeClass="user1.ovTimeClass"
    :ovTotalGames="user1.ovTotalGames" 
    :ovWinPercentage="user1.ovWinPercentage" 
    :ovWinCount="user1.ovWinCount"
    :ovDrawPercentage="user1.ovDrawPercentage" 
    :ovDrawCount="user1.ovDrawCount" 
    :ovLossPercentage="user1.vLossPercentage"
    :ovLossCount="user1.ovLossCount"
    :ovTimePlayed="user1.ovTimePlayed" 
    />

    <ChartsEloOverTimeChart 
    @update="writeEloOverTime($event, 'user1')" 
    :timeClass="user1.eloTimeClass" />

    <ChartsOpeningChart
    @update-time-class="user1.openingsTimeClass = $event" 
    @update-color="user1.openingsColor = $event" 
    :timeClass="user1.openingsTimeClass" 
    :color="user1.openingsColor" />

    <ChartsResByRating
    :timeClass="user1.resByOppTimeClass" 
    @updateResByOpp="user1.resByOppTimeClass = $event" />

    <ChartsWinChart 
    @updateWin="user1.winTimeClass = $event" 
    :timeClass="user1.winTimeClass" />

    <ChartsLossChart 
    @updateLoss="user1.lossTimeClass = $event" 
    :timeClass="user1.lossTimeClass" 
    />

    <ChartsDrawChart 
    @updateDraw="user1.drawTimeClass = $event" 
    :timeClass="user1.drawTimeClass" 
    />
  </div>
  <div class="user-charts-container">
      <h3 class="text-center">User 2: {{ userName2 }}</h3>
    
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
    :ovTimePlayed="user2.vTimePlayed" 
    />

    <ChartsEloOverTimeChart 
    @update="writeEloOverTime($event, 'user2')" 
    :timeClass="user2.eloTimeClass" />

    <ChartsOpeningChart
    @update-time-class="user2.openingsTimeClass = $event" 
    @update-color="user2.openingsColor = $event" 
    :timeClass="user2.openingsTimeClass" 
    :color="user2.openingsColor" />

    <ChartsResByRating
    :timeClass="user2.resByOppTimeClass" 
    @updateResByOpp="user2.resByOppTimeClass = $event" />

    <ChartsWinChart 
    @updateWin="user2.winTimeClass = $event" 
    :timeClass="user2.winTimeClass" />

    <ChartsLossChart 
    @updateLoss="user2.lossTimeClass = $event" 
    :timeClass="user2.lossTimeClass" 
    />

    <ChartsDrawChart 
    @updateDraw="user2.drawTimeClass = $event" 
    :timeClass="user2.drawTimeClass" 
    />
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
        userName1: 'User1',
        userName2: 'User2',
        user1: {
          ovTimeClass: null,
          ovTotalGames: null,
          ovWinPercentage: null,
          ovDrawPercentage: null,
          ovDrawCount: null,
          ovLossPercentage: null,
          ovLossCount: null,
          ovTimePlayed: null,
          eloTimeClass: null,
          openingsTimeClass: null,
          openingsColor: null,
          resByOppTimeClass: null,
          winTimeClass: null,
          lossTimeClass: null,
          drawTimeClass: null,
        },
        user2: {
          ovTimeClass: null,
          ovTotalGames: null,
          ovWinPercentage: null,
          ovDrawPercentage: null,
          ovDrawCount: null,
          ovLossPercentage: null,
          ovLossCount: null,
          ovTimePlayed: null,
          eloTimeClass: null,
          openingsTimeClass: null,
          openingsColor: null,
          resByOppTimeClass: null,
          winTimeClass: null,
          lossTimeClass: null,
          drawTimeClass: null,
        },
        showSpinner: false,
        spinnerText: "",
        showProg: false,
        progress: 0,
        gamesFound: 0,
        showCharts: false,
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
      async getAllUserData(userName) {
        console.clear();
        clearLocalStorage();

        this.showCharts = false;
        this.showSpinner = true;
        this.spinnerText = "Fetching user data...";
        this.showProg = true;
        let totalGames = 0;
        this.gamesFound = 0;
        this.progress = 0;

        userName = userName.replace(/^\s+|\s+$/g, "");

        // logAPIRequest(userName);
        let userStatsRes = await fetchUserStats(userName);

        if (userStatsRes.error){
          alert(`There was an error fetching the user's stats. code: ${userStatsRes.status}`);
          this.showSpinner = false;
          this.showProg = false;
          this.showCharts = false;
          return;
        }
        else {
          let userStats = await userStatsRes.json();
          window.localStorage.setItem("playerStats", JSON.stringify(userStats));
        }


        let archiveUrlsRes = await fetchArchiveUrls(userName);
        if (archiveUrlsRes.status !== 200){
          this.showSpinner = false;
          this.showProg = false;
          this.showCharts = false;
          alert(`There was an error fetching the user's archives code: ${archiveUrlsRes.status}`);
          return;
        }

        let archiveMonths = await archiveUrlsRes.json()
        let archiveUrls = archiveMonths.archives;
        let archivedGames = []

        for (let i = 0; i < archiveUrls.length; i++) {
          let archive = await fetch(archiveUrls[i]);
          let archiveJson = await archive.json();
          let archiveGameList = archiveJson.games;

          if (archiveGameList === null || archiveGameList === undefined) {
            console.log("No games found in this archive");
            continue;
         }
          for (let j = 0; j < archiveGameList.length; j++) {
            if (verifyLiveChess(archiveGameList[j])) {
              archivedGames.push(archiveGameList[j]);
              totalGames = totalGames + 1;
            }
          }
          let prog = Math.ceil((i / archiveUrls.length) * 100);
          this.gamesFound = totalGames;
          this.progress = prog;
        }

        this.totalUserGames = totalGames;

        if (archivedGames.length < 1) {
          this.showSpinner = false;
          this.showCharts = false;
          this.showProg = false;
          alert("No games found under that user")
          return;
        }


        window.localStorage.setItem("userName", userName);
        parseAndSaveArchivedGames(archivedGames);
        saveOpeningsData(calcOpeningsData());
        this.finishSetup();
      },

      finishSetup(){
        this.showProg = false;
        this.spinnerText = "saving data...";

        this.userName = window.localStorage.getItem("userName");
        let largestTimeClass = getLargestTimeClass();
        this.updateOverview("all")
        this.writeEloOverTime(largestTimeClass);
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

      writeEloOverTime(timeClass = "rapid") {
        this.eloTimeClass = timeClass;
      },

      updateOverview(timeClass) {
        let userStats = window.localStorage.getItem("playerStats");
        userStats = JSON.parse(userStats);
        let apiTimeClass = "chess_" + timeClass;
        let numWins = 0;
        let numLosses = 0;
        let numDraws = 0;


        if (timeClass === "all") {
          let validTimeClasses = ["blitz", "rapid", "bullet", "daily"];
          for (let i = 0; i < validTimeClasses.length; i++) {
            apiTimeClass = "chess_" + validTimeClasses[i];
            if (userStats.hasOwnProperty(apiTimeClass)) {
              numWins += userStats[apiTimeClass].record.win;
              numLosses += userStats[apiTimeClass].record.loss;
              numDraws += userStats[apiTimeClass].record.draw;
            }
          }

        } else {

          // eslint-disable-next-line no-prototype-builtins
          if (userStats.hasOwnProperty(apiTimeClass)) {
            numWins = userStats[apiTimeClass].record.win;
            numLosses = userStats[apiTimeClass].record.loss;
            numDraws = userStats[apiTimeClass].record.draw;
          }
        }

        let totalGames = numWins + numDraws + numLosses;


        let decWins = (numWins * 100) / totalGames;
        let percentWins = parseFloat(decWins.toFixed(1));

        let decDraws = (numDraws * 100) / totalGames;
        let percentDraws = parseFloat(decDraws.toFixed(1));

        let decLosses = (numLosses * 100) / totalGames;
        let percentLosses = parseFloat(decLosses.toFixed(1))


        if (isNaN(percentWins)) {
          percentWins = 0;
        }
        if (isNaN(percentDraws)) {
          percentDraws = 0;
        }
        if (isNaN(percentLosses)) {
          percentLosses = 0;
        }

        let timePlayed = getTotalTimePlayed(); 

        this.ovTimeClass = timeClass;
        this.ovTotalGames = totalGames.toString();
        this.ovWinPercentage = percentWins.toString();
        this.ovWinCount = numWins.toString();
        this.ovDrawPercentage = percentDraws.toString();
        this.ovDrawCount = numDraws.toString();
        this.ovLossPercentage = percentLosses.toString();
        this.ovLossCount = numLosses.toString();
        this.ovTimePlayed = timePlayed.toString();

      },

      getLocalData() {
        let userName = window.localStorage.getItem("userName");
        let playerStats = window.localStorage.getItem("playerStats");
        let openings = getSavedOpeningsData(); // added ; 
        let archivedGames = getArchivedGames(); 
      

        if (userName === null || playerStats === null || openings === null || archivedGames === null) {
          return null;
        } else {
          return {
            userName: userName,
            playerStats: playerStats,
            openings: openings,
            archivedGames: archivedGames
          }
        }

      },

    }
  

  }
</script>
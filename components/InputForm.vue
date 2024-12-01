<template>
  <header>  
  <div class="container header-section">
    <img id="chesslogo"
                        src="../assets/chesslogo.png"
                        width="300">
    <h1>Free Chess.com Comparable Insights</h1>
    <p style="text-align:center">Enter two chess.com usernames to generate a full report of compared games.</p>

    <div class="input-group input-group-lg input-group--username">
                        <input type="text" placeholder="Username"
                            list="gmsList"
                            id="uname"
                            aria-describedby="u-addon" 
                            autocapitalize="none" 
                            autocorrect="off"
                            v-model="userName"
                            class="form-control username-input"
                            > 
                          <input type="text" placeholder="Username"
                            list="gmsList"
                            id="uname2"
                            aria-describedby="u-addon" 
                            autocapitalize="none" 
                            autocorrect="off"
                            v-model="userName2"
                            class="form-control username-input"
                            >  
                        <span class="input-group-prepend">
                          <button type="submit"
                                  class="btn btn-secondary"
                                  id="unameBtn"
                                  @click="submitForm()"> 
                                  Compare Users
                          </button>
                          <button type="button"
                                  class="btn btn-secondary"
                                  id="uploadBtn"
                                  data-bs-toggle="tooltip" 
                                  data-bs-placement="top" 
                                  title="Upload json file"
                                  @click="uploadFile">
                                  <font-awesome-icon :icon="['fas', 'file-arrow-up']" />
                          </button>

                      </span>

    </div>

  <div> 
  </div>
  </div>  
  <datalist id="gmsList">
  </datalist>

  <dialog id="invalidUser">
    <h4>
      <strong>Invalid User </strong>
    </h4>
    
    <p>
      {{ userName, userName2 }} is not a valid user. Please enter a valid user.
    </p>
    <button id="closeInvalidUserBtn" @click="closeResetModal">Close</button>
  </dialog>
</header>


</template>

<script>
import { importJsonData } from '~/utils/userImports.js';

export default {
  name: 'InputForm',
  props: {
    storedUserData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      userName: '',
      userName2: '',
      invalidUser: false,
      invalidUserMessage: "",
      allUserData: [...this.storedUserData], // Initialize with parent-provided data
    };
  },
  mounted() {
    this.suggestUserInput();
  },
  methods: {
    async submitForm() {
      this.invalidUserMessage = "";
      this.invalidUser = false;

      const userNames = [this.userName, this.userName2];

      // Check if both usernames are empty
      if (userNames[0] === '' && userNames[1] === '') {
        this.invalidUser = true;
        this.invalidUserMessage = "Both usernames cannot be empty.";
        this.triggerInvalidUserModal();
        return;
      }

      // Check if the usernames are the same
      if (userNames[0] === userNames[1]) {
        this.invalidUser = true;
        this.invalidUserMessage = "Usernames cannot be the same.";
        this.triggerInvalidUserModal();
        return;
      }

      const userDataArray = [];

      // Validate usernames and fetch data
      for (let i = 0; i < userNames.length; i++) {
        const userName = userNames[i];
        let res = null;

        try {
          res = await fetch(`https://api.chess.com/pub/player/${userName}`);
        } catch (error) {
          console.error(`Error fetching user data for ${userName}:`, error);
          this.invalidUser = true;
          this.invalidUserMessage = `Error fetching data for ${userName}.`;
          this.triggerInvalidUserModal();
          return;
        }

        if (res !== null && res.status === 200) {
          const userStats = await res.json();
          userDataArray.push({
            id: i + 1,
            userName,
            stats: userStats,
          });
        } else {
          this.invalidUser = true;
          this.invalidUserMessage = `${userName} is not a valid user.`;
          this.triggerInvalidUserModal();
          return;
        }
      }

      // Save all user data locally and emit it to the parent
      this.allUserData = userDataArray;
      this.storeUserData();
      importJsonData(this.allUserData); // Call to save data to utils
      this.$emit('submit-success', this.allUserData);
    },

    storeUserData() {
      localStorage.setItem("userData", JSON.stringify(this.allUserData));
    },

    closeResetModal() {
      const modal = document.getElementById('invalidUser');
      modal.close();
      this.invalidUser = false;
      this.userName = '';
      this.userName2 = '';
    },

    triggerInvalidUserModal() {
      const modal = document.getElementById('invalidUser');
      modal.showModal();
    },

    suggestUserInput() {
      const input = document.getElementById("uname");
      const input2 = document.getElementById("uname2");
      const gms = [
        "nowhere2b",
        "mastoblood",
        "ajseventeen",
        "slimshaneyyy",
        "betterideas",
        "SvenskaRullstolen",
        "Dolols",
        "micbear1",
        "RedPanda1705",
      ];

      const randGms = gms
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

      const gmsDatalist = document.getElementById("gmsList");

      for (let i = 0; i < gms.length; i++) {
        const option = document.createElement("option");
        option.setAttribute("value", gms[i]);
        gmsDatalist.appendChild(option);
      }

      async function suggestInput(inputElement, suggestions) {
        let index = 0;
        while (true) {
          inputElement.setAttribute("placeholder", suggestions[index]);
          await new Promise(resolve => setTimeout(resolve, 3000));
          index = (index + 1) % suggestions.length;
        }
      }

      suggestInput(input, randGms);
      suggestInput(input2, randGms);
    },
  },
};
</script>

<style>
.form-control::placeholder {
  color: rgba(200, 206, 212, 0.75);
  opacity: 1;

}
#uname {
  color: #ffffff !important;
}
#uploadBtn {
  padding-top: 1rem;
  padding-bottom: 1rem;
  background-color: #85a35a;
  color: #ffffff;
  border: none;
  font-weight: bold;
  box-shadow: 0 5px 12px -2px rgba(0, 0, 0, 0.3);
}

#uploadBtn:hover{
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    z-index: 1;
}


#invalidUser {
  background-color: #312e2b; 
  color: #ffffff; 
  
  border-style: solid;
  border-color: #a94442; 
  border-width: 0 0 0 5px;
  
  border-radius: 4px; 
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2); 
  
  padding: 10px 15px; 
  font-family: sans-serif; 
  font-size: 0.9em; 
  
}


#closeInvalidUserBtn {
  background-color: #505050; 
  color: #ffffff; 
  
  border: none; 
  border-radius: 2px; 
  
  padding: 5px 10px; 
  cursor: pointer; 
  
  font-family: inherit; 
}

#closeInvalidUserBtn:hover {
  background-color: #606060; 
}

</style>
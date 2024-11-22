import requests
import json
import re
import datetime
import sys
import sqlite3

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 chess_api_cli.py [username1] [username2]")
        exit()

    username1 = sys.argv[1]
    username2 = sys.argv[2]

    # Fetch and save games for both users
    combine_data = {}
    combine_data[username1]=get_games(username1)
    combine_data[username2]=get_games(username2)

    save_to_db(combine_data)    

def get_games(user):
    try:
        r = requests.get(f"https://api.chess.com/pub/player/{user}/games/archives")
        if r.status_code != 200:
            print(f"Failed to fetch data for user: {user}")
            return

        month_urls = r.json()["archives"]
        games_dict = {}

        for url in month_urls:
            res = requests.get(url).json()
            year, month = re.search(r"games/(\d{4})/(\d{2})$", url).groups()
            games_dict.setdefault(year, {})[month] = res

        today = datetime.datetime.now().strftime("%Y-%m-%d")
        fname = f"{user}_chess_com_{today}.json"
        with open(fname, "w") as f:
            json.dump(games_dict, f)
        print(f"Data saved for user: {user} to file: {fname}")

    except Exception as e:
        print(f"Error fetching data for {user}: {e}")

def save_to_db(data):
    try:
        today = datetime.datetime.now().strftime("%Y-%m-%d")    
        fname = f"combined_chess_com_{today}.json"
        with open(fname, "w") as f:
            json.dump(data, f, indent=4)
        print(f"Data saved to file: {fname}")
    except Exception as e:
        print(f"Error saving data to file: {e}")    


if __name__ == "__main__":
    main()

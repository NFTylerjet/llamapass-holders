# llamapass-holders
Gets all pass holders from etherscan, and allows them to be hosted via an express server

# Usage
- install node and either yarn or npm
- yarn install | node install
- node puppet.js (This will scrape every page of the pass holders on ether scan and place them into 3 csv files: combined, gold, and silver)

- express.js is for if you want an easy way to serve those files publicly

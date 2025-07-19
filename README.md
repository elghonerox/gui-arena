\# GUI Arena: Aptos Meme Battle

A decentralized meme competition on Aptos Testnet for the Aptos Ideathon. Users submit memes (100 GUI) and vote (10 GUI per vote) using a smart contract. Features a neon-themed UI with Orbitron font and IPFS storage via Pinata.



\## Features

\- Submit memes to IPFS and blockchain (100 GUI).

\- Vote for memes (10 GUI per vote) on the /vote page, featuring "Gigachad Energy", "Epic Futurama Moment", and "Classic Drake Template".

\- View leaderboard of top memes.

\- Petra wallet integration.



\## Setup

1\. \*\*Clone\*\*:

&nbsp;  ```bash

&nbsp;  git clone https://github.com/your-username/gui-arena.git

&nbsp;  cd gui-arena

2\. Frontend:

bash



Collapse



Wrap



Run



Copy

cd gui-arena-frontend

npm install

npm start

Set REACT\_APP\_PINATA\_JWT in .env.

Contract:

Deploy move/sources/meme\_battle.move:



aptos move publish --profile testnet

Address: 0x59da3faa....

Usage

Connect Petra wallet.

Fund with GUI tokens via Aptos Faucet.

Submit memes at /submit, vote at /vote, view leaderboard at /leaderboard.

License

MIT


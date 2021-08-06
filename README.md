# Ampersand: Singleplayer & Multiplayer (Frontend)
Ampersand is a turn-based minimalist logic-based survival game that critics have unanimously hailed as "the single best strategy game since chess."<sup>[verification needed]</sup> Since the release of the lightweight <a href="https://ampersand.netlify.app/">singleplayer edition</a>, players clamored for a cooperative version of ampersand, as well as an official leaderboard to establish worldwide ranking. The wait is over: <a href="https://ampersand-mp.netlify.app/">ampersand v2.0</a> is public!

## Stack
Ampersand's frontend is written fully with React, and leverages the client version of <a href="https://socket.io/">socket.io</a> to communicate with the server via an open-door connection. Game state is handled entirely by the server, allowing React to be only concerned with rendering and preventing possible discrepancies between partners' games.

## Full docs
An in-depth guide to Ampersand's game mechanics can be found <a href="https://ampersand-mp.netlify.app/docs">on the site</a>.
# react-tictactoe

![alt-text](https://imgur.com/pnFGz02.jpg)


A simple browser-based tic-tac-toe game that depends on a locally-run nodejs server. Done for a school assignment in early 2018. 

## Steps to run

`cd react-tictactoe` - cd to project folder.

`npm run first` - npm script install packages for both server and client

This will install all packages needed on both server and client side. After this process is finished, we can
run both the server and client instances with one single command:

`npm run start` - npm script that runs both server and client instances

Now, the server will listen to the specified port (4001) and webpack will compile and host the client code,
listening on a specified port (3000). A browser window should open with the URL ‘http://localhost:3000’.
To run two clients at once, open a new tab with the same URL. The two tabs will now be playing against each
other.

[Assignment Final Report](https://github.com/johngohrw/react-tictactoe/raw/master/Report_JohnGohRengwu_27150437.pdf) 

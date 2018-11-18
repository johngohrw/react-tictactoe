// library imports
import React, {Component} from 'react';
import socketIOClient from 'socket.io-client';
import { Container, Button, ButtonGroup, Alert, Badge } from 'reactstrap';
import { toast, ToastContainer } from 'react-toastify';

// stylesheet imports
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// React App component class, is exported to index.js
export default class App extends Component {
  constructor() {
    super();

    this.endpoint = "http://127.0.0.1:4001" // default server address

    // client's global React.js app state. These are the default values on load.
    this.state = {
      boardState: ['','','','','','','','',''],
      sockets: {},
      room: '',
      mySocketId: '',
      playerSign: '',
      currentTurn: 'X',
      status: 'unstarted',
    };

    // create websocket object, then establish connection with endpoint
    this.socket = socketIOClient(this.endpoint);
    
    // websocket onConnect
    this.socket.on('connect', () => {
      // update client's socketId in React state upon establishing websocket session.
      this.setState({mySocketId: this.socket.id});

      // when a client(any client) connects to the current room, updates the room number
      this.socket.on('connectToRoom', (socketid, roomNo, sockets) => {
        console.log(`${socketid} connected to the game`);
        this.setState({
          room: roomNo,
          sockets: sockets,
        })
      });

      // when a player has disconnected from the room, 
      this.socket.on('userLeft', (leavingSocketId) => {
        this.showToast('Your opponent left the game..', 3);
        this.setState({
          boardState: ['','','','','','','','',''],
          currentTurn: 'X',
          status: 'unstarted',
          playerSign: 'X',
        })
      })
      
      // updates state accordingly when server assigns a playerSign to the client
      this.socket.on('playerSign', (playerSign) => {
        console.log('Received playerSign from server: ', playerSign);
        this.setPlayerSign(playerSign);
      });
  
      // updates game status to 'started' when server emits startGame event
      this.socket.on('startGame', () => {
        console.log('Game is started by the server')
        this.setState({status: 'started'})
      });
  
      // updates this.state.boardState when server emits a new boardState
      this.socket.on('updateBoard', (newBoardState, currentPlayer) => {
        this.setState({
          boardState: newBoardState,
          currentTurn: currentPlayer
        })
      });

      // server announces a winner, update this.state.status accordingly
      this.socket.on('gameWin', (winningPlayer) => {
        console.log(`${winningPlayer} is the winner!`)
        var outcome;
        if (winningPlayer === this.state.playerSign) {
          outcome = 'win';
        } else {
          outcome = 'lose';
        }
        this.setState({
          status: outcome,
        })
      });

      // server announces stalemate, update this.state.status accordingly
      this.socket.on('stalemate', () => {
        console.log(`stalemate!`)
        this.setState({
          status: 'stalemate',
        })
      });

      // reset game state when the server emits a resetGame event
      this.socket.on('resetGame', () => {
        this.setState({
          boardState: ['','','','','','','','',''],
          currentTurn: 'X',
          status: 'started'
        })
        this.showToast('The game has been reset!', 2);
      });

      this.socket.on('incomingTaunt', (message) => {
        this.incomingTauntToast(message, 3);
      })
    });

  };


  // Standard js functions below.

  // return a suiting status message depending on game's state
  getStatusMessage = () => {
    if (this.state.status === "unstarted") {
      return "Waiting for opponent to connect..";
    } else if (this.state.status === "stalemate") {
      return "It's a stalemate!";
    } else if (this.state.status === "win") {
      return "You win!";
    } else if (this.state.status === "lose") {
      return "You lose..";
    } else if (this.state.currentTurn === this.state.playerSign) {
      return "It's your turn";
    } else if (this.state.currentTurn !== this.state.playerSign) {
      return "Opponent's turn";
    }
  }

  // return a suiting color for the alert component depending on game's state
  getStatusColor = () => {
    if (this.state.status === "unstarted") {
      return 'secondary';
    } else if (this.state.status === "stalemate") {
      return 'warning';
    } else if (this.state.status === "win") {
      return 'success';
    } else if (this.state.status === "lose") {
      return 'dark';
    } else if (this.state.currentTurn === this.state.playerSign) {
      return 'primary';
    } else if (this.state.currentTurn !== this.state.playerSign) {
      return 'danger';
    }
  }

  // sends game reset request to server.
  resetGame = () => {
    if (this.state.status === 'unstarted') {
      this.showToast("Your opponent is not here!", 2);
    } else {
      this.socket.emit('resetGame', this.state.room);
    }
  }

  // setter method for playerSign ('X' or 'O')
  setPlayerSign = (sign) => {
    this.setState({ playerSign: sign });
  }

  // get opponent's socket.id (assuming only 2 players in each room)
  getOpponentId = () => {
    let socketArr = Object.keys(this.state.sockets);
    if (socketArr.length < 2) return 'none yet :(';
    socketArr.splice(socketArr.indexOf(this.state.mySocketId), 1);
    return socketArr[0];
  }

  // triggered when the player clicks on a cell
  makeMove = (cellIndex) => {
    if (this.state.status === "unstarted"){
      this.showToast("The game hasn't started yet!", 2);
    } else if (this.state.status === "win" || this.state.status === "lose" || this.state.status === "stalemate") {
      this.showToast("The game is over!", 2);
    } else if (this.state.currentTurn !== this.state.playerSign) {
      this.showToast("It's not your turn!", 2)
    } else if (this.state.boardState[cellIndex] !== '') {
      this.showToast("This spot is taken!", 2);
    } else {
      // eslint-disable-next-line
      this.state.boardState[cellIndex] = this.state.playerSign;
      var opponentSign = this.state.playerSign === 'X' ? 'O' : 'X'; 
      this.setState({currentTurn: opponentSign})
      this.socket.emit('makeMove', this.state.boardState, this.state.room, this.state.playerSign, opponentSign);
    }
    this.forceUpdate(); // force React component re-render
  }

  // show toast with message for a number of seconds (react-toastify)
  showToast = (toastMessage, seconds) => {
    toast(toastMessage, {
      position: toast.POSITION.BOTTOM_RIGHT,
      autoClose: seconds*1000,
      closeButton: false,
      hideProgressBar: true,
      className: 'toast',
    });
  }

  // tells the server to taunt the other opponent.
  tauntOpponent = () => {
    if (this.state.status === 'unstarted') {
      this.showToast('Who are you taunting to?', 2)
    } else {
      this.showToast('You taunted the opponent!', 2)
    }
    this.socket.emit('tauntOpponent', this.getOpponentId())
  }

  toastId = null; // for non-duplicating incoming taunt toasts

  // shows the incoming taunt toast. Is triggered by the opponent.
  incomingTauntToast = (toastMessage, seconds) => {
    if (! toast.isActive(this.toastId)) {
      this.toastId = toast(toastMessage, {
        position: toast.POSITION.TOP_LEFT,
        autoClose: seconds*1000,
        closeButton: true,
        hideProgressBar: true,
        className: 'toast__taunt',
      });
    }
  }

  //
  // React's render method. JSX components provide realtime automatic updates from the state tree upon re-render.
  //
  // All components are wrapped with .page-wrapper, which gives it a 100% viewport height
  // <Container> component from reactstrap will apply a bootstrap .container, wrapping all child nodes, making it mobile-friendly.
  // the TicTacToe game itself is a component, defined by the .tictactoe__container div.
  // Within the tictactoe grid, the 9 buttons are aligned with cssgrid, each triggering the makeMove() event when clicked. 
  //
  render() {
    return(
      <div className="page-wrapper" id="confetti-canvas"> 
        <Container>
          <div className="tictactoe__container">
            <Alert className="tictactoe__status" color={this.getStatusColor()}>
              {this.getStatusMessage()}
            </Alert>
            <div className="tictactoe__grid">
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(0)}>{this.state.boardState[0]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(1)}>{this.state.boardState[1]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(2)}>{this.state.boardState[2]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(3)}>{this.state.boardState[3]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(4)}>{this.state.boardState[4]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(5)}>{this.state.boardState[5]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(6)}>{this.state.boardState[6]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(7)}>{this.state.boardState[7]}</Button>{' '}
              <Button outline color="primary" className="tictactoe__button" onClick={() => this.makeMove(8)}>{this.state.boardState[8]}</Button>{' '}
            </div>
            <ButtonGroup className="button-group">
              <Button onClick={() => this.resetGame()}>Reset Game</Button>
              <Button onClick={() => this.tauntOpponent()}>Taunt</Button>
            </ButtonGroup>      
          </div>
          <div className="tictactoe__infobar">
            <p>Playing in: <Badge color="secondary">{this.state.room}</Badge></p>
            <p>You are: <Badge color="secondary">{this.state.playerSign}</Badge></p>
            <p>Opponent: <Badge color="secondary">{this.getOpponentId()}</Badge></p>
          </div>
        </Container>
        <ToastContainer /> 
      </div>
    )
  }

}
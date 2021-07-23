import Enemy from './../Enemy/Enemy';
import styles from './Game.module.css';
import { useInput } from "../../hooks/useInput";
import io from 'socket.io-client';
import axios from "axios";
import { useEffect, useState } from 'react';

// let CONNECTION_PORT = 'http://localhost:4000/';
let CONNECTION_PORT = 'https://ampersand-backend.herokuapp.com/';
let socket;

const SQUARE_WIDTH = 5;
const validKeys = new Set(['w', 'a', 's', 'd', 'r']);
const getInitialTarget = (pos, dir) => {
  return [pos[0] + 0.15 * dir[0], pos[1] + 0.15 * dir[1]];
}

export default function Game(props) {
  const { value: username, bind: bindUsername } = useInput('');
  const { value: color, bind: bindColor } = useInput('green');
  const { value: character, bind: bindCharacter } = useInput('&');
  const [joiningErrors, setJoiningErrors] = useState([]);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [yourUsername, setYourUsername] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [yourData, setYourData] = useState({});
  const [friendData, setFriendData] = useState({});
  const [youAlive, setYouAlive] = useState(true);
  const [friendAlive, setFriendAlive] = useState(true);
  const [score, setScore] = useState(0);
  const [yourPosition, setYourPosition] = useState([]);
  const [friendPosition, setFriendPosition] = useState([]);
  const [gameState, setGameState] = useState(0);
  const [numBombs, setNumBombs] = useState(3);
  const [enemies, setEnemies] = useState([]);
  const [bombs, setBombs] = useState([]);
  const [whoseTurn, setWhoseTurn] = useState("");
  const [streak, setStreak] = useState(0);
  const [reviverPosition, setReviverPosition] = useState(null);

  const colorMap = {
    green: {
      backgroundColor: 'white',
      color: '#0F9D58'
    },
    blue: {
      backgroundColor: 'white',
      color: '#4285F4'
    },
    yellow: {
      backgroundColor: 'white',
      color: '#F4B400'
    },
    red: {
      backgroundColor: 'white',
      color: '#DB4437'
    },
    black: {
      backgroundColor: 'white',
      color: 'black'
    },
  }

  useEffect(() => {
    socket = io(CONNECTION_PORT);
    return () => {
      socket.disconnect()
    };
  }, []);

  useEffect(() => {
    if (gameState) {
      document.addEventListener("keydown", (event) => {
        let key = event.key;
        if (validKeys.has(key)) {
          socket.emit('keypress', {
            key: key,
            room_id: props.match.params.id,
          });
        }
      })
    }
  }, [gameState, props.match.params.id]);

  useEffect(() => {
    if (friendUsername) {
      socket.on("game_update", (data) => {
        let initial_target, final_pos;
        if (data.playerMoved === yourUsername) {
          final_pos = data.players[yourUsername].position;
          if (vectorsEqual(data.direction, [0, 0])) {
            // Animate "shaking"
            setYourPosition(addVectors(final_pos, [0.15, 0]));
            setTimeout(() => {
              setYourPosition(addVectors(final_pos, [-0.15, 0]));
              setTimeout(() => {
                setYourPosition(final_pos);
              }, 75);
            }, 75);
          } else {
            // Overshoot, then return to final position
            initial_target = getInitialTarget(final_pos, data.direction);
            setYourPosition(initial_target);
            setTimeout(() => {
              setYourPosition(final_pos);
            }, 100);
          }
          if (data.revivedFriend) {
            setFriendPosition(data.players[friendUsername].position);
          }
        } else {
          final_pos = data.players[friendUsername].position;
          initial_target = getInitialTarget(final_pos, data.direction);
          setFriendPosition(initial_target);
          setTimeout(() => {
            setFriendPosition(final_pos);
          }, 100);
          if (data.revivedFriend) {
            setYourPosition(data.players[yourUsername].position);
          }
        }
        setScore(data.score);
        setEnemies(data.enemies);
        setBombs(data.bombs);
        setNumBombs(data.num_bombs);
        setYouAlive(data.players[yourUsername].alive);
        setFriendAlive(data.players[friendUsername].alive);
        setWhoseTurn(data.order[data.whose_turn]);
        setStreak(data.streak);
        setReviverPosition(data.reviver_position)
      });
    }
  }, [yourUsername, friendUsername]);

  useEffect(() => {
    if (yourUsername) {
      socket.on("start_info", (data) => {
        let yourInfo = data.players[yourUsername];
        setYourPosition(yourInfo.position);
        let otherUsername = Object.keys(data.players).find(username => username !== yourUsername);
        let otherInfo = data.players[otherUsername];
        setFriendUsername(otherUsername);
        setFriendPosition(otherInfo.position);
        setFriendData({
          color: otherInfo.color,
          character: otherInfo.character
        })
        setWhoseTurn(data.order[data.whose_turn]);
        setGameState(1);
      });
    }
  }, [yourUsername])
 
  const joinRoom = (e) => {
    e.preventDefault();
    axios.post(`${CONNECTION_PORT}room_available`, {room_id: props.match.params.id}).then(available_res => {
      if (available_res.data.num_players >= 2) {
        setJoiningErrors(['filled']);
      } else {
        axios.post(`${CONNECTION_PORT}uniquely_identifying`, {
          room_id: props.match.params.id,
          username: username,
          color: color,
          character: character
        }).then(unique_res => {
          if (unique_res.data.unique) {
            socket.emit("join_room", {
              room_id: props.match.params.id,
              username: username,
              color: color,
              character: character
            });
            setYourUsername(username);
            setYourData({
              color: color,
              character: character
            });
            setJoinedRoom(true);
          } else {
            setJoiningErrors(unique_res.data.reasons);
          }
        });
      }
    });
  }

  const convertXYtoTopLeft = (position) => {
    let x = position[0], y = position[1];
    let left = x * SQUARE_WIDTH + 1;
    let top = (8 - y) * SQUARE_WIDTH + 1;
    return {
      left: `${left}vw`,
      top: `${top}vw`
    };
  }

  const isOdd = (coord) => {
    return (coord[0] + Math.round(yourPosition[0]) + coord[1] + Math.round(yourPosition[1])) % 2 === 0;
  }

  const constructBoard = () => {
    let indexes = []
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        indexes.push([i, j])
      }
    }
    return <>
      {indexes.map((i) => <div className={styles.square} style={{left: `${i[0]*SQUARE_WIDTH}vw`, top: `${i[1]*SQUARE_WIDTH}vw`}} key={`${i[0]}${i[1]}`} />)}
    </>
  }

  const showEnemies = () => {
    return <>
      {enemies.map(enemy => 
        <Enemy 
          isOdd={isOdd(enemy.position)} 
          position={enemy.position} 
          spawnDirection={enemy.spawnDirection} 
          isNew={enemy.new}
          key={enemy.id}/>
      )};
    </>
  }

  const vectorsEqual = (v1, v2) => {
    return v1[0] === v2[0] && v1[1] === v2[1];
  }

  const addVectors = (v1, v2) => {
    return [v1[0] + v2[0], v1[1] + v2[1]];
  }

  const showBombs = () => {
    return <>
      {bombs.map(bomb => 
        <div
          className={styles.bomb}
          style={{...convertXYtoTopLeft(bomb.position)}}
          key={bomb.id}>*</div>
      )};
    </>
  }

  const showReviver = () => {
    if (reviverPosition) {
      return <div
      className={styles.reviver}
      style={{...convertXYtoTopLeft(reviverPosition)}}>&</div>
    }
  }

  const craftJoiningErrors = () => {
    return <ul>
      {joiningErrors.map((reason, i) => <li key={i}>{reason}</li>)}
    </ul>
  }

  return (
    (!joinedRoom)
      ? <div>
        <form>
          <input
            required
            placeholder="Username"
            {...bindUsername} />
          <select
            required
            placeholder="Color"
            {...bindColor} >
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="yellow">Yellow</option>
              <option value="red">Red</option>
              <option value="black">Black</option>
          </select>
          <input
            required
            placeholder="bindCharacter"
            maxLength="1"
            {...bindCharacter} />
          <button onClick={joinRoom}>Join room</button>
        </form>
        {craftJoiningErrors()}
      </div>
      : <div>
        <div className={styles.title}>ampersand</div>
        <div className={styles.board}>
          {constructBoard()}
          {showEnemies()}
          {showReviver()}
          {showBombs()}
          { gameState
            ? <>
              <div 
                className={styles.player} 
                style={{...convertXYtoTopLeft(yourPosition), ...colorMap[yourData.color], opacity: (youAlive ? 1 : 0)}}>
                {yourData.character}
              </div>
              <div 
                className={styles.player} 
                style={{...convertXYtoTopLeft(friendPosition), ...colorMap[friendData.color], opacity: (friendAlive ? 1 : 0)}}>
                {friendData.character}
              </div>
            </>
            : ''
          }
        </div>
        <br />
        Score: {score}
        <br />
        Bombs: {numBombs}
        <br />
        {yourUsername} ({yourData.character}) {whoseTurn === yourUsername ? '<' : ''}
        <br />
        {friendUsername 
          ? <>
            {friendUsername} ({friendData.character}) {whoseTurn === friendUsername ? '<' : ''}
          </>
          : ''}
        <br />
        {streak >= 3 ? <>streak: {streak}</> : ''}
      </div>
  )
}
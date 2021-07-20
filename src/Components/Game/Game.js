import styles from './Game.module.css';
import { useInput } from "../../hooks/useInput";
import io from 'socket.io-client';
import axios from "axios";
import { useEffect, useState } from 'react';

// let CONNECTION_PORT = 'http://localhost:4000/';
let CONNECTION_PORT = 'https://ampersand-backend.herokuapp.com/';
let socket;

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
  const [score, setScore] = useState(0);
  const [yourPosition, setYourPosition] = useState([]);
  const [friendPosition, setFriendPosition] = useState([]);
  const [gameState, setGameState] = useState(0);

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
    let validKeys = new Set(['w', 'a', 's', 'd']);
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
      const getInitialTarget = (pos, dir) => {
        return [pos[0] + 0.15 * dir[0], pos[1] + 0.15 * dir[1]];
      }
      socket.on("game_update", (data) => {
        let initial_target, final_pos;
        if (data.playerMoved === yourUsername) {
          final_pos = data.players[yourUsername].position;
          initial_target = getInitialTarget(final_pos, data.direction);
          setYourPosition(initial_target);
          setTimeout(() => {
            setYourPosition(final_pos);
          }, 100);
        } else {
          final_pos = data.players[friendUsername].position;
          initial_target = getInitialTarget(final_pos, data.direction);
          setFriendPosition(initial_target);
          setTimeout(() => {
            setFriendPosition(final_pos);
          }, 100);
        }
        setScore(data.score);
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
    let left = x * 5 + 1;
    let top = (8 - y) * 5 + 1;
    return {
      left: `${left}vw`,
      top: `${top}vw`
    }
  }

  const constructBoard = () => {
    let indexes = []
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        indexes.push([i, j])
      }
    }
    return <>
      {indexes.map((i) => <div className={styles.square} style={{left: `${i[0]*5}vw`, top: `${i[1]*5}vw`}} key={`${i[0]}${i[1]}`} />)}
    </>
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
          { gameState
            ? <>
              <div 
                className={styles.player} 
                style={{...convertXYtoTopLeft(yourPosition), ...colorMap[yourData.color]}}>
                {yourData.character}
              </div>
              <div 
                className={styles.player} 
                style={{...convertXYtoTopLeft(friendPosition), ...colorMap[friendData.color]}}>
                {friendData.character}
              </div>
            </>
            : ''
          }
        </div>
        <br />
        Score: {score}
        <br />
        {yourUsername} ({yourData.character})
        <br />
        {friendUsername 
          ? <>
            {friendUsername} ({friendData.character})
          </>
          : ''}
        {/* pos 1: {yourPosition[0]}
        pos 2: {yourPosition[1]} */}
      </div>
  )
}
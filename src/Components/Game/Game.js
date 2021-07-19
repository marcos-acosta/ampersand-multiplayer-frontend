import styles from './Game.module.css';
import { useInput } from "../../hooks/useInput";
import io from 'socket.io-client';
import axios from "axios";
import { useEffect, useState } from 'react';

let CONNECTION_PORT = 'http://localhost:4000/';
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
  const [yourScore, setYourScore] = useState(0);
  const [friendScore, setFriendScore] = useState(0);
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
    return () => {socket.disconnect()};
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
    axios.post("http://localhost:4000/room_available", {room_id: props.match.params.id}).then(available_res => {
      if (available_res.data.num_players >= 2) {
        setJoiningErrors(['filled']);
      } else {
        axios.post("http://localhost:4000/uniquely_identifying", {
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
                style={{top: `${yourPosition[0]*5+1}vw`, left: `${yourPosition[1]*5+1}vw`, ...colorMap[yourData.color]}}>
                {yourData.character}
              </div>
              <div 
                className={styles.player} 
                style={{top: `${friendPosition[0]*5+1}vw`, left: `${friendPosition[1]*5+1}vw`, ...colorMap[friendData.color]}}>
                {friendData.character}
              </div>
            </>
            : ''
          }
        </div>
        <br />
        {yourUsername} ({yourData.character}): {yourScore}
        <br />
        {friendUsername 
          ? <>
            {friendUsername} ({friendData.character}): {friendScore}
          </>
          : ''}
        {/* pos 1: {yourPosition[0]}
        pos 2: {yourPosition[1]} */}
      </div>
  )
}
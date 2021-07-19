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

  useEffect(() => {
    socket = io(CONNECTION_PORT);
    return () => {socket.disconnect()};
  }, []);

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
    return <div className={styles.board}>
      {indexes.map((i) => <div className={styles.square} style={{left: `${i[0]*5}vw`, top: `${i[1]*5}vw`}} key={`${i[0]}${i[1]}`} />)}
    </div>
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
              <option value="white">White</option>
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
        {constructBoard()}
        <br />
        {yourUsername} ({yourData.character}): {yourScore}
        <br />
        {friendUsername 
          ? <>
            {friendUsername} ({friendData.character}): {friendScore}
          </>
          : ''}
      </div>
  )
}
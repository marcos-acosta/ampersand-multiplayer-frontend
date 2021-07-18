// import styles from './Game.module.css';
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
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [joiningErrors, setJoiningErrors] = useState([]);

  useEffect(() => {
    socket = io(CONNECTION_PORT);
    return () => {socket.disconnect()};
  }, []);
 
  const joinRoom = (e) => {
    e.preventDefault();
    axios.post("http://localhost:4000/room_available", {room_id: props.match.params.id}).then(res => {
      if (res.data.num_players >= 2) {
        setJoiningErrors(['filled']);
      } else {
        axios.post("http://localhost:4000/uniquely_identifying", {
          room_id: props.match.params.id,
          username: username,
          color: color,
          character: character
        }).then(res => {
          if (res.data.unique) {
            socket.emit("join_room", {
              room_id: props.match.params.id,
              username: username,
              color: color,
              character: character
            });
            setJoinedRoom(true);
          } else {
            setJoiningErrors(res.data.reasons);
          }
        });
      }
    });
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
      : <>Hey!</>
  )
}
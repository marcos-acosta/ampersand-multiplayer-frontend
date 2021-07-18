// import styles from './Homepage.module.css';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useInput } from '../../hooks/useInput';
import axios from "axios";

export default function Homepage(props) {
  const { value:roomCode, bind: bindRoomCode } = useInput('');
  const [error, setError] = useState('')
  const history = useHistory();

  const joinRoom = async (e) => {
    e.preventDefault();
    let res = await axios.post("http://localhost:4000/room_available", {room_id: roomCode});
    if (res.data.num_players < 2) {
      history.push(`/${roomCode}`);
    } else {
      setError('That room is already full.');
    }
  }

  return (
    <div>
      Ampersand multiplayer
      <form>
        <input
          required
          placeholder="Room code"
          {...bindRoomCode} />
          <button onClick={joinRoom}> Join room </button>
      </form>
      {error}
    </div>
  )
}
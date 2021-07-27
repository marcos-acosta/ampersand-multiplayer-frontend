// import styles from './Homepage.module.css';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useInput } from '../../hooks/useInput';
import axios from "axios";

let CONNECTION_PORT = 'http://localhost:4000/';
// let CONNECTION_PORT = 'https://ampersand-backend.herokuapp.com/';

export default function Homepage(props) {
  const { value:roomCode, bind: bindRoomCode } = useInput('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const history = useHistory();

  const joinRoom = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    let res = await axios.post(`${CONNECTION_PORT}room_available`, {room_id: roomCode});
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
          {!submitted ? <button onClick={joinRoom}> Join room </button> : 'Loading...'}
      </form>
      {error}
    </div>
  )
}
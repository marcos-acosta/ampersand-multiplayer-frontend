import styles from './Homepage.module.css';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useInput } from '../../hooks/useInput';
import axios from "axios";

// let CONNECTION_PORT = 'http://localhost:4000/';
let CONNECTION_PORT = 'https://ampersand-backend.herokuapp.com/';

export default function Homepage(props) {
  const { value:roomCode, bind: bindRoomCode } = useInput('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const history = useHistory();

  const joinRoom = async (e) => {
    e.preventDefault();
    if (roomCode) {
      if (!validRoomCode(roomCode)) {
        setError('[!] the room code should only contain alphanumerics [!]')
        return;
      }
      setSubmitted(true);
      let res = await axios.post(`${CONNECTION_PORT}room_available`, {room_id: roomCode});
      if (res.data.num_players < 2) {
        history.push(`/${roomCode}`);
      } else {
        setError('[!] that room is already full [!]');
        setSubmitted(false);
      }
    }
  }

  const validRoomCode = (roomCode) => {
    return roomCode.match(/^[0-9a-zA-Z]+$/);
  }

  return (
    <div>
      <div className={styles.titleText}>
        ampersand
      </div>
      <div className={styles.subtitleText}>
        [] () [] & @
      </div>
      <div className={`${styles.homepageButton} ${styles.singleplayer} ${styles.info}`}>
        [singleplayer]←
        <span className={styles.tooltiptext}>coming soon!</span>
      </div>
      <div className={styles.multiplayerContents}>
        <form>
          <input
            required
            placeholder="Room code"
            className={styles.inputRoomCode}
            {...bindRoomCode} />
            {!submitted ? 
              <button onClick={joinRoom} className={`${styles.homepageButton} ${styles.multiplayer}`}> [multiplayer]← </button>
              : <div className={`${styles.homepageButton} ${styles.multiplayer}`}> loading... </div>}
        </form>
      </div>
      <div className={styles.errorDiv}>
        {error}
      </div>
    </div>
  )
}
import Enemy from './../Enemy/Enemy';
import styles from './Singleplayer.module.css';
import { useInput } from "../../hooks/useInput";
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

// let CONNECTION_PORT = 'http://localhost:4000/';
let CONNECTION_PORT = 'https://ampersand-backend.herokuapp.com/';
let socket;

const SQUARE_WIDTH = 5;
const getInitialTarget = (pos, dir) => {
  return [pos[0] + 0.15 * dir[0], pos[1] + 0.15 * dir[1]];
}
const defaultStats = {
  hits: 0,
  deaths: 0,
  bombs_collected: 0,
  longest_streak: 0
}
const validKeys = new Set(['w', 'a', 's', 'd', ' ', 'r']);

const validUsername = (username_) => {
  return username_.match(/^[0-9a-zA-Z_]+$/);
}

export default function Game(props) {
  // Form
  const { value: username, bind: bindUsername } = useInput('');
  const { value: color, bind: bindColor } = useInput('green');
  const { value: character, bind: bindCharacter } = useInput('&');
  // Game stuff
  const [joiningErrors, setJoiningErrors] = useState([]);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState("normal");
  // Usernames
  const [yourUsername, setYourUsername] = useState("");
  // Personalization
  const [yourData, setYourData] = useState({});
  // Alive-ness
  const [youAlive, setYouAlive] = useState(true);
  // Shared stats
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [turns, setTurns] = useState(0);
  // Other stats
  const [yourStats, setYourStats] = useState(defaultStats);
  // Position
  const [yourPosition, setYourPosition] = useState([]);
  // Bombs
  const [yourBombs, setYourBombs] = useState(3);
  // Spawnables
  const [enemies, setEnemies] = useState([]);
  const [bombs, setBombs] = useState([]);
  const [nukePosition, setNukePosition] = useState(null);
  // Other
  const [showHelp, setShowHelp] = useState(false);
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardId, setLeaderboardId] = useState(null);

  useEffect(() => {
    socket = io(CONNECTION_PORT);
    return () => {
      socket.disconnect()
    };
  }, []);

  useEffect(() => {
    if (gameStarted) {
      document.addEventListener("keydown", (event) => {
        if (validKeys.has(event.key)) {
          socket.emit('keypress', {
            key: event.key,
            room_id: '_s',
          });
        }
      })
    }
  }, [gameStarted]);

  useEffect(() => {
    const setData = (data) => {
      setGameState(data.game_state);
      setScore(data.score);
      setTurns(data.turns);
      setEnemies(data.enemies);
      setBombs(data.bombs);

      setYouAlive(data.player.alive);

      setYourBombs(data.player.num_bombs);

      setYourStats({
        hits: data.player.hits,
        deaths: data.player.deaths,
        bombs_collected: data.player.bombs_collected,
        longest_streak: data.longest_streak
      });

      setStreak(data.streak);
      setNukePosition(data.nuke_position);
    }

    socket.on("game_update", (data) => {
      let initial_target, final_pos;
      final_pos = data.player.position;
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
      setData(data);
    });

    socket.on("room_reset", (data) => {
      setData(data);
      setYourPosition(data.player.position);
      setShowLeaderboard(false);
    });
  }, []);

  useEffect(() => {
    socket.on("start_info", (data) => {
      let yourInfo = data.player;
      setYourPosition(yourInfo.position);
      setGameStarted(true);
    });
  }, []);

  useEffect(() => {
    if (gameState === 'game_over') {
      socket.emit("send_score", "_s");
    }
  }, [gameState]);

  useEffect(() => {
    socket.on("leaderboard_ready", (data) => {
      setLeaderboard(data.leaderboard);
      if (data.made_leaderboard) {
        setLeaderboardId(data.insertedId);
      } else {
        setLeaderboardId(null);
      }
      setShowLeaderboard(true);
    });
  }, [])
 
  const joinRoom = (e) => {
    if (!username || !character) {
      return;
    }
    e.preventDefault();
    if (!validUsername(username)) {
      setJoiningErrors(['alphanumerics']);
      return;
    }
    socket.emit("join_room", {
      username: username,
      color: color,
      character: character,
      singleplayer: true
    });
    setYourUsername(username);
    setYourData({
      color: color,
      character: character
    });
    setJoinedRoom(true);    
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
    return areOdd(yourPosition, coord);
  }

  const areOdd = (coord1, coord2) => {
    return (Math.round(coord1[0]) + Math.round(coord2[0]) + Math.round(coord1[1]) + Math.round(coord2[1])) % 2 === 0;
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
          key={bomb.id}>@</div>
      )};
    </>
  }

  const showNuke = () => {
    if (nukePosition) {
      return <div
      className={styles.nuke}
      style={{...convertXYtoTopLeft(nukePosition)}}>ø</div>
    }
  }

  const craftJoiningErrors = () => {
    return <>
      {joiningErrors.map((reason, i) => <span key={i}><span>{translateError(reason)}</span><br /></span>)}
    </>
  }

  const translateError = (error) => {
    let err;
    if (error === 'filled') {
      err = 'the room filled up before you could join';
    } else if (error === 'username') {
      err = 'your partner has already taken that username'
    } else if (error === 'appearance') {
      err = "your appearance matches your partner's; change your color or character"
    } else if (error === 'alphanumerics') {
      err = 'username should only contain alphanumerics and underscores'
    } else {
      err = "¿error?"
    }
    return `[!] ${err} [!]`
  }

  const renderLeaderboard = () => {
    return <div className={styles.leaderboard}>
        <div className={styles.leaderboardTitle}>
          ↑ # ↑
        </div>
        <hr />
        {showLeaderboard ? 
          leaderboard.map((entry, i) => {
            let yourScore = leaderboardId && leaderboardId === entry._id;
            let highScore = i === 0;
            return <div key={i} className={`${styles.leaderboardEntry} ${yourScore ? styles.yourScore : ''}`}>
              <div className={`${styles.leaderboardScore} ${highScore ? styles.highScore : ''}`}>
                {yourScore ? "> " : ''}{highScore ? "*" : ''}{entry.score}{highScore ? "*" : ''}{yourScore ? " <" : ''}
              </div>
              <div className={`${styles.leaderboardNames} ${yourScore ? styles.yourNames : ''}`}>
                {entry.username}
              </div>
            </div>
          }) : 
          <div className={styles.leaderboardLoading}>
            fetching leaderboard...
          </div>
        }
      </div>;
  }

  return (
    <>
    {(!joinedRoom)
      ? <div className={styles.customizeScreen}>
        <div className={styles.inputDiv}>
          <form>
            <input
              required
              placeholder="username"
              maxLength="16"
              className={`${styles.customInput} ${styles.usernameInput}`}
              {...bindUsername} />
            <div className={styles.customizeDiv}>
              <select
                required
                placeholder="color"
                className={styles.colorSelector}
                {...bindColor} >
                  <option value="green">green</option>
                  <option value="blue">blue</option>
                  <option value="yellow">yellow</option>
                  <option value="red">red</option>
                  <option value="orange">orange</option>
              </select>
              <input
                required
                placeholder="&"
                maxLength="1"
                className={`${styles.customInput} ${styles.characterInput}`}
                size="1"
                {...bindCharacter} />
            </div>
            <button onClick={joinRoom} className={`${styles.gameButton} ${styles.enterButton}`}>start</button>
            <div className={`${styles.player} ${styles[color]} ${styles.demoPlayer}`}>
              {character}
            </div>
          </form>
        </div>
        <div className={styles.joiningErrorsDiv}>
          {craftJoiningErrors()}
        </div>
      </div>
      : ''}
      <div>
        <div className={styles.title}><u>ampersand</u></div>
        <div className={styles.board}>
          {constructBoard()}
          {showEnemies()}
          {showBombs()}
          {showNuke()}
          { gameStarted
            ? <>
              <div 
                className={`${styles.player} ${styles[yourData.color]}`}
                style={{...convertXYtoTopLeft(yourPosition), opacity: (youAlive ? 1 : 0)}}>
                {yourData.character}
              </div>
            </>
            : ''
          }
        </div>
        <div className={styles.info} onClick={() => setShowHelp(true)}>?</div>
        <div 
          className={styles.waiting} 
          style={{opacity: joinedRoom && !gameStarted ? 1 : 0}}>
          waiting for server...
        </div> 
        <div className={styles.statsPanel}>
          <div className={styles.scoreContainer}>
            {score}
          </div>
          <div className={`${styles.turnsContainer} ${styles.grayText}`}>
            {turns}
          </div>
          <div className={`${styles.nameContainer} ${styles.selected} ${!youAlive ? styles.deadUsername : ''}`}>
            &nbsp;&nbsp;[<span className={styles[yourData.color]}>{yourUsername ? yourData.character : '?'}</span>] {yourUsername ? yourUsername : '---'}: {yourBombs} @
          </div>
          <table className={styles.statsTable}>
            <tbody>
              <tr>
                <td className={styles.grayText}>[x]</td>
                <td>{yourStats.hits}</td>
              </tr>
              <tr>
                <td className={styles.grayText}>xxx</td>
                <td>{yourStats.longest_streak}</td>
              </tr>
              <tr>
                <td className={styles.grayText}>@←&</td>
                <td>{yourStats.bombs_collected}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {streak >= 3 ? 
          <div className={`${styles.streakContainer} ${styles.grayText}`}>
            streak: <span className={styles.whiteText}>{streak}</span>
          </div> : ''
        }
        {
          gameState === 'game_over' ? 
          <>
            <div className={styles.gameOverSmokescreen} />
            <div className={styles.gameOverScreen}>
              <div className={`${styles.gameOverText} ${styles.darkGrayText}`}>
                [&]
              </div>
              <div className={styles.gameOverScore}>
                {score}
              </div>
              <div className={`${styles.tryAgainText} ${styles.darkGrayText}`}>
                <b>wasd</b> to try again to try again
              </div>
            </div>
            {
              renderLeaderboard()
            }
          </> : ''
        }
        {
          showHelp ? <div className={styles.helpContainer}>
            <div className={styles.helpPanel}>
              <div className={styles.helpTitle}>
                ¿&?
              </div>
              <hr />
              <table className={styles.fullWidthTable}>
                <tbody>
                  <tr>
                    <td className={`${styles.lineOnRight} ${styles.help}`}>
                      <ul>
                        <li>use <b>wasd</b></li>
                        <li><b>enemies</b> look like [] and ()</li>
                        <li>[] and () behave exactly alike, but <b>the distinction is helpful</b> to the player</li>
                        <li>enemies move <b>after you move</b></li>
                        <li>kill an enemy <b>adjacent to you</b> using wasd</li>
                        <li>enemies adjacent to you will kill you on their turn</li>
                      </ul>
                    </td>
                    <td className={styles.help}>
                      <ul>
                        <li><b>hitting the edge</b> is a valid strategy</li>
                        <li>press <b>space</b> to use a <b>bomb</b> (@)</li>
                        <li>bombs kill all enemies immediately <b>adjacent and diagonal</b> to you</li>
                        <li>clear all enemies on the board by collecting a <b>ø</b></li>
                        <li><b>occasionally</b>, have fun</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className={`${styles.gameButton} ${styles.helpOkButton}`} onClick={() => setShowHelp(false)}>
                ok
              </div>
            </div>
          </div> : ''
        }
      </div>
    </>
  )
}
import styles from './Docs.module.css';

export default function Docs(props) {
  return <div className={styles.mainBody}>
    <div className={styles.docsTitle}>
      ampersand
    </div>
    <div className={styles.docsSubtitle}>
      detailed docs
    </div>
    <br />
    You found ampersand's <span className={styles.gh}>detailed docs</span>. Below is an in-depth walkthrough of every algorithm
    involved in ampersand's underlying game engine, broken down by game element.
    <h3>Enemy spawning</h3>
    <p>
      An enemy spawn threshold is set at the beginning of the game. On each turn, a random float between 0 and 1 is generated, and
      compared to the spawn threshold. If the random number is above the threshold, and enemy is spawned. If an enemy is spawned,
      another random number is generated and compared to a slightly higher threshold. If this new random number is also above that
      threshold, then a second enemy is generated on the same turn. Pseudocode is shown below:
      <div className={styles.cb}>
        if Math.random() &gt; threshold
        <br />
        &nbsp;&nbsp;spawnEnemy()
        <br />
        &nbsp;&nbsp;if Math.random() &gt; threshold + double_spawn_buffer
          <br />
        &nbsp;&nbsp;&nbsp;&nbsp;spawnEnemy()
      </div>
      Every 10 turns, the spawn threshold is decremented by a constant amount.
    </p>
    <p>
      For singleplayer, the initial spawn threshold, double spawn buffer, and difficulty decrement are set to&nbsp;
      <span className={styles.gh}>0.65</span>, <span className={styles.gh}>0.2</span>, and <span className={styles.gh}>0.01</span>, 
      respectively. For multiplayer, these values are <span className={styles.gh}>0.5</span>, <span className={styles.gh}>0.1</span>, and&nbsp;
      <span className={styles.gh}>0.0275</span>, respectively. Note that the expected value of enemies spawned per turn increases
      quadratically as the number of turns increases. Let <span className={styles.gh}>E(t)</span> be the expected number of enemies
      spawned on turn <span className={styles.gh}>t</span>. On singleplayer, <span className={styles.gh}>E(0) = 0.4</span>,&nbsp;
      <span className={styles.gh}>E(150) = 0.65</span>, and <span className={styles.gh}>E(328)</span> is just over 1. In other words,
      beyond this point, more than one enemy spawns per turn on average. This effect is much more pronounced in the multiplayer version.&nbsp;
      <span className={styles.gh}>E(t) &gt; 1</span> is reached on turn 54, and reaches the upper bound of 2 on turn 220.
    </p>
    <p>
      Enemies only spawn on the edge of the board, and will not spawn on top of a bomb, reviver, or null. Additionally, enemies will
      not spawn on top of nor directly beside a player.
    </p>
    <p>
      Finally, in multiplayer, the enemy spawn threshold instantaneously increases by <span className={styles.gh}>0.175</span> when a player
      is killed to marginally increase the chance of their partner reviving them. Upon revival, the spawn threshold is decreased by the same amount.
    </p>
    <h3>Enemy behavior</h3>
    <p>
      Enemies move almost identically in both singleplayer and multiplayer versions, with the only difference being that enemies in 
      multiplayer target whichever player is nearest them (using Euclidean distance). Internally, the enemies are moved one at a time,
      meaning that an enemy's move may block another's preferred direction. For this reason, each enemy calculates multiple
      candidate moves. The enemy tries all candidate moves in order, and chooses the first valid move. If all candidate moves are invalid
      (i.e. another enemy is occupying the square), the enemy is forced to stand still. The candidate directions are generated
      using this algorithm:
      <div className={styles.cb}>
        if target player is orthogonal to enemy
        <br />
        &nbsp;&nbsp;try moving directly towards player, otherwise, try both sideways directions with no preference
        <br />
        if target player is exactly diagonal to the enemy
        <br />
        &nbsp;&nbsp;try both directions that bring enemy closer to player, with no preference
        <br />
        else (not perfectly diagonal)
        <br />
        &nbsp;&nbsp;try moving in the direction most aligned with the player, otherwise, try second-most
      </div>
      Note that "no preference" means that the moves of equal preference are tried in a random order to prevent a group of enemies
      from exhibiting synchronized movements. Some examples of enemy behavior:
      <ul>
        <li>Player is two squares above enemy</li>
        <ul>
          <li>Primary direction: <span className={styles.gh}>UP</span></li>
          <li>Alternative directions: <span className={styles.gh}>LEFT</span>, <span className={styles.gh}>RIGHT</span> (order of attempt randomized)</li>
        </ul>
        <li>Player is exactly southwest of enemy</li>
        <ul>
          <li>Candidate directions: <span className={styles.gh}>DOWN</span>, <span className={styles.gh}>LEFT</span> (order of attempt randomized)</li>
        </ul>
        <li>Player is four squares below, two squares right of enemy a.k.a. roughly south-south-east</li>
        <ul>
          <li>Primary direction: <span className={styles.gh}>DOWN</span></li>
          <li>Alternative direction: <span className={styles.gh}>RIGHT</span></li>
        </ul>
      </ul>
    </p>
    <h3>Bomb spawning</h3>
    <p>
      The bomb spawn threshold is a function of the number of bombs present on the board. The function is independent of the game
      mode and number of turns elapsed. Let <span className={styles.gh}>T(b)</span> be the spawn threshold as a function of the number
      of bombs on the board <span className={styles.gh}>b</span>.
      <div className={styles.cb}>
        T(b) = 0.98 - (0.98 - 0.7) * exp(-0.6 * b)
      </div>
      Note that, when there are 0 bombs on the board, <span className={styles.gh}>T(0) = 0.7</span>. When there is one bomb on the board,
      the threshold jumps to 0.826. As <span className={styles.gh}>b</span> approaches infinity, <span className={styles.gh}>T(b)</span>
      &nbsp;approaches 0.98.
    </p>
    <h3>Null spawning</h3>
    <p>
      A null will spawn with 10% chance (<span className={styles.gh}>threshold = 0.9</span>) every turn where no null is on the board
      and there are at least 12 enemies present.
    </p>
    <h3>Reviver spawning</h3>
    <p>
      A reviver will spawn with 20% chance (<span className={styles.gh}>threshold = 0.8</span>) every turn where no reviver is on the board
      and only one player is alive.
    </p>
    <h3>Life insurance / bomb donation</h3>
    <p>
      Upon a player's death, all their bombs are immediately transferred to the living player. When a player is revived, they receive one bomb
      from their reviver, provided the reviver has at least 2 bombs.
    </p>
    <h3>Scoring</h3>
    <p>
      The scoring system is outlined below:
      <ul>
        <li>One complete turn: <span className={styles.gh}>1</span> point</li>
        <li>Enemy killed without bomb or null:  <span className={styles.gh}>10 + 5 * (streak - 1)</span> points</li>
        <ul>
          <li>i.e. <span className={styles.gh}>10</span> points for first kill in streak, <span className={styles.gh}>15</span> for second, <span className={styles.gh}>20</span> for third, etc.</li>
          <li>Note that a streak is broken by any player failing to kill an enemy</li>
          <li>Bombs and nulls also break streaks</li>
        </ul>
        <li>Enemy killed with bomb: <span className={styles.gh}>5</span> points</li>
        <li>Collect null: <span className={styles.gh}>50</span> points</li>
        <li>Collect reviver: <span className={styles.gh}>50</span> points</li>
        <li>Kill partner: <span className={styles.gh}>-50</span> points</li>
      </ul>
    </p>
    <div className={styles.docsTitle}>
      &
    </div>
  </div>
}
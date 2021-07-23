import { useEffect, useState } from 'react';
import styles from './Enemy.module.css';

const SQUARE_WIDTH = 5;
const getInitialTarget = (pos, dir) => {
  return [pos[0] - 0.25 * dir[0], pos[1] - 0.25 * dir[1]];
}

export default function Enemy(props) {
  const [isOdd, setOdd] = useState(props.isOdd);
  const spawnDirection = useState(props.spawnDirection)[0];
  const [isNew, setIsNew] = useState(props.isNew);
  const [position, setPosition] = useState(props.position);
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    if (isNew) {
      setPosition(getInitialTarget(props.position, spawnDirection));
      let animation = setTimeout(() => {
        setPosition(props.position);
        setOpacity(1);
      }, 25);
      setIsNew(false);
      return () => clearTimeout(animation);
    } else {
      setPosition(props.position);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.position, spawnDirection]);

  useEffect(() => {
    setOdd(props.isOdd);
  }, [props.isOdd]);

  const convertXYtoTopLeft = (position) => {
    let x = position[0], y = position[1];
    let left = x * SQUARE_WIDTH + 1;
    let top = (8 - y) * SQUARE_WIDTH + 1;
    return {
      left: `${left}vw`,
      top: `${top}vw`
    };
  }

  return (
    <div 
      className={`${styles.enemy} ${isOdd ? styles.enemyOdd : styles.enemyEven}`} 
      style={{...convertXYtoTopLeft(position), opacity: opacity}}>
        {isOdd ? '[]' : '()'}
    </div>
  )
}
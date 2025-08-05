import React from 'react';
import styles from './styles/AnimatedSeparator.module.css';

function AnimatedSeparator() {
  return (
    <div className={styles.separator}>
      <div className={styles.line}></div>
    </div>
  );
}

export default AnimatedSeparator;

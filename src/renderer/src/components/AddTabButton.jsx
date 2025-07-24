import React from "react";
import styles from './styles/AddTabButton.module.css';

function AddTabButton({onAddTab}){
    const handleClick = () =>{
        onAddTab();
    };

    return(
        <div 
        className={styles.addTabBox}
        onClick={handleClick}
        title="New Tab"
        >
            <div className={styles.addTabIcon}>+</div>
        </div>
    );
}

export default AddTabButton;
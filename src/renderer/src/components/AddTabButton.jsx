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
            <div className={styles.addTabIcon}>
                <img src = './assets/add.svg'/>
            </div>
        </div>
    );
}

export default AddTabButton;
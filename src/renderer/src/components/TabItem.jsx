import React from 'react';
import styles from './styles/TabItem.module.css';

function TabItem({ tab, isActive, onClose, onSwitch }){
    const handleClose = (e) => {
        e.stopPropagation();
        onClose(tab.id);
    };

    const handleClick = (e) =>{
        onSwitch(tab.id);
    };

    return(
        <div
            className={`${styles.tabBox} ${isActive ? styles.isActive : ''}`}
            title={tab.title}
            data-tab={tab.id}
            onClick={handleClick}
        >
            <div className={styles.tabFavicon}>
                {tab.favicon && (tab.favicon.startsWith('https://') || tab.favicon.startsWith('http://'))?(
                    <img
                    src = {tab.favicon}
                    alt = 'favicon'
                    onError={(e) => {
                        e.target.outerHTML = '<span>🌐</span>';
                    }}/>
                
                ): (
                    tab.favicon || '🌐'
                )}
            </div>
            <button
                className={styles.closeBtn}
                onClick={handleClose}
                title='Close Tab'
            >
                ×
            </button>
        </div>
    );
}

export default TabItem;

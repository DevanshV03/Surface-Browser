import React, { useState, useEffect } from "react";
import styles from './styles/HistoryPanel.module.css';

function HistoryPanel({ isOpen, onClose }) {
    const [historyItems, setHistoryItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            loadHistory();
        }

        // Real-time update listener
        const handleHistoryUpdate = () => {
            if (isOpen) {
                loadHistory(); // Refresh when new history is added
            }
        };

        window.addEventListener('historyUpdated', handleHistoryUpdate);
        
        return () => {
            window.removeEventListener('historyUpdated', handleHistoryUpdate);
        };
    }, [isOpen]);

    if (!isOpen && !isClosing) return null;
    
    const loadHistory = async () => {
        try {
            const historyData = await window.electronAPI.loadHistoryData(50);
            
            // Transform SQLite data to match JSX expectations
            const transformedData = historyData.map(item => ({
                ...item,
                timestamp: item.visit_time, 
                id: item.url  // Add id for React keys
            }));
            
            setHistoryItems(transformedData);
        } catch (error) {
            console.error('Failed to load history:', error);
            setHistoryItems([]);  // Empty array on error
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 220);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <>
            <div 
                className={`${styles.backdrop} ${isClosing ? styles.closing : ''}`} 
                onClick={handleBackdropClick} 
            />
            <div className={`${styles.panel} ${isClosing ? styles.closing : ''}`}>
                <div className={styles.header}>
                    <h2>History</h2>
                    <div className={styles.spacer} />
                    <button className={styles.closeBtn} onClick={handleClose}>✕</button>
                </div>
                <div className={styles.search}>
                    <input 
                        type="text" 
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.list}>
                    {historyItems.map(item => (
                        <div key={`${item.url}-${item.visit_time}`} className={styles.item}>
                            <div className={styles.favicon}>
                                <img 
                                    src={item.favicon} 
                                    alt="favicon" 
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                    style={{width: '16px', height: '16px'}}
                                />
                                <span className={styles.faviconFallback} style={{display:'none'}}>
                                    {new URL(item.url).hostname.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className={styles.content}>
                                <div className={styles.title}>{item.title}</div>
                                <div className={styles.url}>{item.url}</div>
                            </div>
                            <div className={styles.time}>
                                {new Date(item.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                    {historyItems.length === 0 && (
                        <div className={styles.emptyState}>
                            No browsing history yet. Visit some websites to see them here!
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default HistoryPanel;

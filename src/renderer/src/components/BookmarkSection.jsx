//  src/components/BookmarkSection.jsx
import React, { useState, useEffect } from "react";
import styles from "./styles/BookmarkSection.module.css";
import TabItem from "./TabItem";

function BookmarkSection({onExternalSwitch}) {
  const [bookmarkTabs, setbookmarkTabs] = useState([]);
  
  useEffect(() => {
    const loadbookmarks = async() => {
      try {
        const data = await window.electronAPI.loadBookmarks();
        console.log('loaded bookmarks');
        setbookmarkTabs(data);
      } catch(error) {
        console.error("No bookmark file found. Check for Electron API issues", error);
        setbookmarkTabs([]);
      }
    };
    loadbookmarks();
  }, []);

  const handleOpen = async (bm) => {
    // ✅ CRITICAL: Call external switch first to prevent feedback loop
    if (onExternalSwitch) {
      onExternalSwitch(bm.bookmarkId);
    }
    
    // Then call vanilla JS switch
    if (window.surfaceBrowser && window.surfaceBrowser.handleTabSwitch) {
      window.surfaceBrowser.handleTabSwitch(bm.bookmarkId, {
        id: bm.bookmarkId,
        url: bm.url,
        title: bm.title,
        favicon: bm.favicon,
        webviewId: `webview-${bm.bookmarkId}`
      });
    } else {
      console.error('Tab switching function not available');
    }
  };

  return (
    <div className={styles.bookmarkSection}>
      {bookmarkTabs.map(bm => (
        <TabItem
          key={bm.bookmarkId}
          tab={bm}
          onSwitch={() => handleOpen(bm)}
          hideClose
        />
      ))}
    </div>
  );
}

export default BookmarkSection;

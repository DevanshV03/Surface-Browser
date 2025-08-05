//  src/components/BookmarkSection.jsx
import React, { useState, useEffect } from "react";
import styles from "./styles/BookmarkSection.module.css";
import AnimatedSeparator from "./AnimatedSeparator";
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

    const handleBookmarkAdded = (event) => {
      const savedBookmark = event.detail;
      setbookmarkTabs(prev => {
        // Check if bookmark already exists to prevent duplicates
        const exists = prev.find(b => b.bookmarkId === savedBookmark.bookmarkId);
        if (exists) return prev;
        
        return [...prev, savedBookmark];
      });
    };

    const handleBookmarkDeleted = (event) => {
      const { bookmarkId } = event.detail;
      console.log('Bookmark deleted event received:', bookmarkId);
      
      setbookmarkTabs(prev => prev.filter(bookmark => bookmark.bookmarkId !== bookmarkId));
    };

    window.addEventListener('bookmarkAdded', handleBookmarkAdded);
    window.addEventListener('bookmarkDeleted', handleBookmarkDeleted);

    return () => {
      window.removeEventListener('bookmarkAdded', handleBookmarkAdded);
      window.removeEventListener('bookmarkDeleted', handleBookmarkDeleted);
    };
  }, []);

  const handleDelete = async (bookmarkId) => {
    try {
      console.log('Deleting bookmark:', bookmarkId);
      const result = await window.electronAPI.deleteBookmark(bookmarkId);
      
      if (result.success) {
        // Dispatch event for real-time UI update
        window.dispatchEvent(new CustomEvent('bookmarkDeleted', {
          detail: { bookmarkId }
        }));
        console.log('Bookmark deleted and event dispatched');
      } else {
        console.error('Failed to delete bookmark:', bookmarkId);
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const handleOpen = async (bm) => {
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
          onClose={() => handleDelete(bm.bookmarkId)}
          hideClose={false}
        />
      ))}
      {/*Conditional separator - only shows when bookmarks exist */}
      {bookmarkTabs.length > 0 && <AnimatedSeparator />}
    </div>
  );
}

export default BookmarkSection;

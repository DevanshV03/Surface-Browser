import React from 'react';
import useTabs from '../hooks/useTabs';
import TabItem from './TabItem';
import AddTabButton from './AddTabButton';
import BookmarkSection from './BookmarkSection';
import styles from './styles/TabSidebar.module.css';

function TabSidebar({ onTabSwitch, onTabAdd, onTabRemove, registerUpdateTab}){
    // Pass callbacks to the hook
    const callbacks = { onTabSwitch, onTabAdd, onTabRemove };
    const [tabs, activeTabId, addTab, removeTab, switchToTab, updateTab, switchToExternalTab] = useTabs(callbacks);

    React.useEffect(()=>{
        if(registerUpdateTab) registerUpdateTab(updateTab);
    }, [updateTab]);

    return(
        <div className={styles.TabSidebar}>
            <BookmarkSection onExternalSwitch = {switchToExternalTab}/>
            {tabs.map(tab => (
                <TabItem  
                    key={tab.id}
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    onClose={removeTab} 
                    onSwitch={switchToTab}
                />
            ))}
            <AddTabButton onAddTab={addTab}/>
        </div>
    );
}

export default TabSidebar;

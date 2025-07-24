import React from 'react';
import useTabs from '../hooks/useTabs';
import TabItem from './TabItem';
import AddTabButton from './AddTabButton';
import styles from './styles/TabSidebar.module.css';

function TabSidebar({ onTabSwitch, onTabAdd, onTabRemove }){
    // Pass callbacks to the hook
    const callbacks = { onTabSwitch, onTabAdd, onTabRemove };
    const [tabs, activeTabId, addTab, removeTab, switchToTab, updateTab] = useTabs(callbacks);

    return(
        <div className={styles.TabSidebar}>
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

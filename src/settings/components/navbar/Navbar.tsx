import React from 'react';
import { FaBook, FaCog, FaEye } from 'react-icons/fa';
import { useSettingsContext } from '../core/context';
import { NavbarContainer, NavbarTab, NavbarTabs } from './styled';

/**
 * The settings page navbar.
 *
 * @returns {ReactElement} The navbar component.
 */
const Navbar: React.FC = () => {
    const { currentTab, setCurrentTab } = useSettingsContext();

    return (
        <NavbarContainer>
            <NavbarTabs>
                <NavbarTab
                    className={currentTab === 'general' ? 'active' : ''}
                    onClick={() => setCurrentTab('general')}
                >
                    <FaCog />
                    General
                </NavbarTab>
                <NavbarTab
                    className={currentTab === 'openapi-view' ? 'active' : ''}
                    onClick={() => setCurrentTab('openapi-view')}
                >
                    <FaEye />
                    OpenAPI View
                </NavbarTab>
                {/*<NavbarTab*/}
                {/*    className={*/}
                {/*        currentTab === 'openapi-version-view' ? 'active' : ''*/}
                {/*    }*/}
                {/*    onClick={() => handleTabClick('openapi-version-view')}*/}
                {/*>*/}
                {/*    <TabIcon>*/}
                {/*        <PiGitDiff />*/}
                {/*    </TabIcon>*/}
                {/*    OpenAPI Version View*/}
                {/*</NavbarTab>*/}
                <NavbarTab
                    className={
                        currentTab === 'openapi-entry-view' ? 'active' : ''
                    }
                    onClick={() => setCurrentTab('openapi-entry-view')}
                >
                    <FaBook />
                    OpenAPI Entry View
                </NavbarTab>
            </NavbarTabs>
        </NavbarContainer>
    );
};

export default Navbar;

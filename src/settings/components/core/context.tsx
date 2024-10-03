import React, {
    createContext,
    ReactNode,
    useContext,
    useRef,
    useState,
} from 'react';

interface SettingsContextProps {
    ref: React.RefObject<HTMLDivElement>;
    currentTab: string;
    setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(
    undefined
);

/**
 * Provides a context for the settings tabs.
 *
 * @param {{ children: ReactNode }} props
 * @param {ReactNode} props.children - The content to be rendered within the
 * context.
 *
 * @returns {ReactElement}
 */
export const SettingProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [currentTab, setCurrentTab] = useState<string>('general');

    return (
        <SettingsContext.Provider
            value={{
                ref,
                currentTab,
                setCurrentTab,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

/**
 * Retrieves the settings context.
 *
 * @returns {SettingsContextProps} The settings context.
 *
 * @throws {Error} If the context is used outside a `SettingsProvider`.
 */
export const useSettingsContext = (): SettingsContextProps => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettingsContext must be used within an EntryProvider');
    }
    return context;
};

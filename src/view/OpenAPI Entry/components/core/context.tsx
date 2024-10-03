import React, { createContext, ReactNode, useContext, useState } from 'react';
import { EntryViewData } from 'indexedDB/typing/interfaces';

interface EntryContextProps {
    specData: EntryViewData;
    setSpecData: React.Dispatch<React.SetStateAction<EntryViewData>>;
    columnValue: number;
    setColumnValue: React.Dispatch<React.SetStateAction<number>>;
    detailsOpen: Record<string, boolean>;
    setDetailsOpen: React.Dispatch<
        React.SetStateAction<Record<string, boolean>>
    >;
    currentPage: string;
    setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
}

const EntryContext = createContext<EntryContextProps | undefined>(undefined);

export const EntryProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [specData, setSpecData] = useState<EntryViewData>({});
    const [columnValue, setColumnValue] = useState<number>(4);
    const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
    const [currentPage, setCurrentPage] = useState<string>('entry');

    return (
        <EntryContext.Provider
            value={{
                specData,
                setSpecData,
                columnValue,
                setColumnValue,
                detailsOpen,
                setDetailsOpen,
                currentPage,
                setCurrentPage,
            }}
        >
            {children}
        </EntryContext.Provider>
    );
};

export const useEntryContext = () => {
    const context = useContext(EntryContext);
    if (context === undefined) {
        throw new Error('useEntryContext must be used within an EntryProvider');
    }
    return context;
};

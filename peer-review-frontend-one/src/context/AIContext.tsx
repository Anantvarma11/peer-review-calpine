import { createContext, useContext, useState, ReactNode } from 'react';
import { dashboardAskAI } from '@/lib/api';

// Types
export interface AIAction {
    type: 'UPDATE_CHART' | 'SCROLL_TO' | 'NAVIGATE' | 'NONE';
    parameters?: any;
    projectedData?: any[];
}

export interface AIResponse {
    text: string;
    action?: AIAction;
    isError?: boolean;
}

interface AIContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isThinking: boolean;
    lastQuery: string;
    lastResponse: AIResponse | null;
    askAI: (query: string, customerId: string) => Promise<void>;
    clearResponse: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [lastQuery, setLastQuery] = useState('');
    const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

    const askAI = async (query: string, customerId: string) => {
        setIsOpen(true);
        setLastQuery(query);
        setIsThinking(true);
        setLastResponse(null); // Clear previous while thinking

        try {
            // Call API
            const result = await dashboardAskAI(customerId, query, {});

            const action: AIAction = {
                type: result.action || 'NONE',
                parameters: result.parameters,
                projectedData: result.projected_data
            };

            setLastResponse({
                text: result.response_text,
                action: action
            });

        } catch (error) {
            console.error("AI Error", error);
            setLastResponse({
                text: "I'm having trouble connecting to the AI brain right now. Please try again.",
                isError: true
            });
        } finally {
            setIsThinking(false);
        }
    };

    const clearResponse = () => {
        setLastResponse(null);
        setLastQuery('');
        setIsOpen(false);
    };

    return (
        <AIContext.Provider value={{
            isOpen,
            setIsOpen,
            isThinking,
            lastQuery,
            lastResponse,
            askAI,
            clearResponse
        }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}

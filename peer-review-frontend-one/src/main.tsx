import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AIProvider } from './context/AIContext'
import { UIProvider, useUI } from './lib/do-library/context/UIContext.tsx'
import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import './lib/do-library/styles/theme/theme.dark.css'
import './lib/do-library/styles/theme/theme.light.css'
import './lib/do-library/styles/theme/global.css'
import './lib/do-library/styles/theme/tokens.css'
import './index.css'
import 'leaflet/dist/leaflet.css'
import './maps.css'

const AppWrapper = () => {
    const { isDark } = useUI();
    return (
        <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
            <AIProvider>
                <App />
            </AIProvider>
        </FluentProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <UIProvider>
            <AppWrapper />
        </UIProvider>
    </React.StrictMode>,
)

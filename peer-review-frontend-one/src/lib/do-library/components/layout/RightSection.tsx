import React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';

const useStyles = makeStyles({
    root: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 16px)',
        position: 'relative',
        ...shorthands.overflow('hidden'),
        ...shorthands.borderRadius('12px'),
        backgroundColor: 'var(--bg-root)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        margin: '8px',
        boxShadow: 'none',
        border: '1px solid var(--border-subtle)',
    },
    contentWrap: {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        ...shorthands.overflow('hidden'),
    },
    scrollRegion: {
        flex: 1,
        ...shorthands.overflow('auto'),
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border-strong) transparent',
        '&::-webkit-scrollbar': {
            width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'var(--border-strong)',
            borderRadius: '10px',
        },
        // Glassmorphism for all cards inside right section
        '& .rounded-xl': {
            backgroundColor: 'var(--glass-bg) !important',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '0.5px solid var(--glass-border) !important',
            boxShadow: 'none !important',
        },
    },
});

interface RightSectionProps {
    children: React.ReactNode;
    header?: React.ReactNode;
}

export const RightSection: React.FC<RightSectionProps> = ({ children, header }) => {
    const styles = useStyles();
    return (
        <main className={styles.root}>
            <div className={styles.contentWrap}>
                {header}
                <div className={styles.scrollRegion}>
                    {children}
                </div>
            </div>
        </main>
    );
};

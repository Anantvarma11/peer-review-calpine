import React from 'react';
import { Button as FluentButton, makeStyles, mergeClasses, ButtonProps as FluentButtonProps } from '@fluentui/react-components';

const useStyles = makeStyles({
    base: {
        // Standardize shared styles if needed
    },
    primary: {
        backgroundColor: 'var(--primary-600)',
        color: '#ffffff',
        '&:hover': {
            backgroundColor: 'var(--primary-700)',
            color: '#ffffff',
        }
    },
    destructive: {
        backgroundColor: 'var(--red-500)',
        color: '#ffffff',
        '&:hover': {
            backgroundColor: 'var(--red-700)',
            color: '#ffffff',
        }
    },
    outline: {
        border: '1px solid var(--border-default)',
        backgroundColor: 'transparent',
    },
    ghost: {
        backgroundColor: 'transparent',
        border: 'none',
        '&:hover': {
            backgroundColor: 'var(--bg-surface-2)',
        }
    }
});

interface ButtonProps extends Omit<FluentButtonProps, 'appearance'> {
    appearance?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, appearance = 'secondary', className, ...props }) => {
    const styles = useStyles();

    // Map appearances to Fluent or custom styles
    let customClass = '';
    let fluentAppearance: FluentButtonProps['appearance'] = 'secondary';

    if (appearance === 'primary') {
        customClass = styles.primary;
        fluentAppearance = 'primary';
    } else if (appearance === 'destructive') {
        customClass = styles.destructive;
        fluentAppearance = 'primary';
    } else if (appearance === 'outline') {
        customClass = styles.outline;
        fluentAppearance = 'outline';
    } else if (appearance === 'ghost') {
        customClass = styles.ghost;
        fluentAppearance = 'subtle';
    }

    return (
        <FluentButton
            appearance={fluentAppearance}
            className={mergeClasses(styles.base, customClass, className)}
            {...(props as any)}
        >
            {children}
        </FluentButton>
    );
};

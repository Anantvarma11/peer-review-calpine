import React from 'react';
import { makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
    h1: {
        fontSize: '24px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        lineHeight: '32px',
    },
    h2: {
        fontSize: '20px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        lineHeight: '28px',
    },
    body: {
        fontSize: '14px',
        fontWeight: '400',
        color: 'var(--text-secondary)',
        lineHeight: '20px',
    },
    caption: {
        fontSize: '12px',
        fontWeight: '400',
        color: 'var(--text-tertiary)',
        lineHeight: '16px',
    }
});

interface TypographyProps {
    variant?: 'h1' | 'h2' | 'body' | 'caption';
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
}

export const Typography: React.FC<TypographyProps> = ({ variant = 'body', children, className = '', ...props }) => {
    const styles = useStyles();
    const Tag = variant.startsWith('h') ? (variant as keyof JSX.IntrinsicElements) : 'span';

    return (
        <Tag className={`${styles[variant]} ${className}`} {...props}>
            {children}
        </Tag>
    );
};

import { NavLink } from 'react-router-dom';
import {
    makeStyles,
    shorthands,
    mergeClasses,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    MenuDivider
} from '@fluentui/react-components';
import { useUI } from '../../context/UIContext.tsx';
import {
    Settings24Regular,
    PaintBrush24Regular,
    SignOut24Regular
} from '@fluentui/react-icons';
import { Icons } from '../NavIcons.tsx';

const useStyles = makeStyles({
    sidebar: {
        backgroundColor: 'var(--bg-surface-3)',
        width: '240px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        paddingTop: '8px',
        paddingBottom: '8px',
        flexShrink: 0,
    },
    brand: {
        paddingLeft: '14px',
        paddingRight: '8px',
        marginBottom: '16px',
        marginTop: '8px',
    },
    brandWrapper: {
        backgroundColor: 'var(--bg-surface-2)',
        ...shorthands.borderRadius('8px'),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.padding('8px', '14px'),
        ...shorthands.gap('8px'),
    },
    brandLogo: {
        display: 'flex',
        alignItems: 'center',
        color: '#FFD700',
    },
    brandText: {
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        letterSpacing: '-0.5px'
    },
    divider: {
        height: '1px',
        backgroundColor: 'var(--border-default)',
        marginLeft: '20px',
        marginRight: '20px',
        marginBottom: '20px',
        marginTop: '20px',
        ...shorthands.border('none'),
    },
    scrollContainer: {
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
            width: '0px',
            background: 'transparent',
        }
    },
    section: {
        ...shorthands.borderRadius('6px'),
        marginLeft: '8px',
        marginRight: '8px',
        marginBottom: '8px',
        ...shorthands.padding('4px', '0px'),
        transition: 'background-color 0.2s ease',
    },
    sectionActive: {
        backgroundColor: 'var(--bg-surface-1)',
    },
    sectionTitle: {
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        paddingLeft: '12px',
        marginTop: '0px',
        marginBottom: '8px',
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        height: '36px',
        marginLeft: '4px',
        marginRight: '4px',
        ...shorthands.padding('0', '12px'),
        borderRadius: '6px',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        backgroundColor: 'transparent',
        transition: 'all 0.1s ease',
        ...shorthands.gap('12px'),
        textDecoration: 'none',
        '&:hover': {
            backgroundColor: 'var(--bg-surface-2)',
            color: 'var(--text-primary)',
        }
    },
    itemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        color: '#000000',
        fontWeight: '600',
    },
    itemIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        color: 'inherit',
        '& svg': {
            width: '18px',
            height: '18px',
        }
    },
    itemText: {
        fontSize: '14px',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    profileCard: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('12px'),
        ...shorthands.padding('12px'),
        ...shorthands.margin('8px', '8px', '4px', '8px'),
        backgroundColor: 'var(--bg-surface-1)',
        ...shorthands.borderRadius('12px'),
        ...shorthands.border('1px', 'solid', 'var(--border-subtle)'),
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: 'var(--bg-surface-2)',
            ...shorthands.borderColor('var(--border-default)'),
        }
    },
    profileAvatar: {
        width: '32px',
        height: '32px',
        ...shorthands.borderRadius('16px'),
        backgroundColor: 'var(--bg-surface-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...shorthands.border('1.5px', 'solid', 'var(--border-default)'),
    },
    profileInfo: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    profileName: {
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--text-primary)',
    },
    profileEmail: {
        fontSize: '11px',
        color: 'var(--text-tertiary)',
    },
    popover: {
        backgroundColor: 'var(--bg-surface-3)',
        ...shorthands.border('1px', 'solid', 'var(--border-subtle)'),
        ...shorthands.borderRadius('12px'),
        minWidth: '220px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        ...shorthands.padding('4px'),
    },
    menuList: {
        backgroundColor: 'transparent',
    },
    menuItem: {
        ...shorthands.borderRadius('6px'),
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        '&:hover': {
            backgroundColor: 'var(--bg-surface-4) !important',
            color: 'var(--text-primary) !important',
        }
    },
    logoutItem: {
        color: '#EF4444',
        '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.1) !important',
            color: '#FF5555 !important',
        }
    }
});

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const styles = useStyles();
    return <div className={styles.sidebar}>{children}</div>;
};

interface SidebarBrandProps {
    logo: React.FC;
    text: string;
    color?: string;
}

export const SidebarBrand: React.FC<SidebarBrandProps> = ({ logo: Logo, text, color }) => {
    const styles = useStyles();
    return (
        <div className={styles.brand}>
            <div className={styles.brandWrapper}>
                <div className={styles.brandLogo} style={color ? { color } : {}}>
                    <Logo />
                </div>
                <span className={styles.brandText}>{text}</span>
            </div>
        </div>
    );
};

interface SidebarItemProps {
    path: string;
    icon: React.FC;
    label: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ path, icon: Icon, label }) => {
    const styles = useStyles();
    return (
        <NavLink
            to={path}
            className={({ isActive }) => mergeClasses(styles.item, isActive && styles.itemActive)}
        >
            <div className={styles.itemIcon}><Icon /></div>
            <span className={styles.itemText}>{label}</span>
        </NavLink>
    );
};

interface SidebarSectionProps {
    title: string;
    children: React.ReactNode;
    paths?: string[];
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => {
    const styles = useStyles();

    return (
        <div className={styles.section}>
            <div className={styles.sectionTitle}>{title}</div>
            {children}
        </div>
    );
};

interface SidebarProfileProps {
    name?: string;
    email?: string;
}

export const SidebarProfile: React.FC<SidebarProfileProps> = ({ name = "User", email = "user@example.com" }) => {
    const styles = useStyles();
    const { toggleTheme, isDark } = useUI();

    return (
        <div style={{ marginTop: 'auto' }}>
            <div className={styles.item} style={{ marginBottom: '8px' }} onClick={toggleTheme}>
                <div className={styles.itemIcon}>
                    {isDark ? <Icons.Moon /> : <Icons.Sun />}
                </div>
                <span className={styles.itemText}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>

            <Menu positioning={{ position: 'above', align: 'start', offset: { mainAxis: 8 } }}>
                <MenuTrigger disableButtonEnhancement>
                    <div className={styles.profileCard}>
                        <div className={styles.profileAvatar}>
                            <Icons.Agents />
                        </div>
                        <div className={styles.profileInfo}>
                            <div className={styles.profileName}>{name}</div>
                            <div className={styles.profileEmail}>{email}</div>
                        </div>
                    </div>
                </MenuTrigger>

                <MenuPopover className={styles.popover}>
                    <MenuList className={styles.menuList}>
                        <MenuItem className={styles.menuItem} icon={<PaintBrush24Regular />}>Theme Options</MenuItem>
                        <MenuItem className={styles.menuItem} icon={<Settings24Regular />}>Settings</MenuItem>
                        <MenuDivider />
                        <MenuItem
                            className={mergeClasses(styles.menuItem, styles.logoutItem)}
                            icon={<SignOut24Regular />}
                            onClick={() => window.location.href = '/'}
                        >
                            Logout
                        </MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
        </div>
    );
};

export const SidebarDivider = () => {
    const styles = useStyles();
    return <hr className={styles.divider} />;
};

export const SidebarScrollContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const styles = useStyles();
    return <div className={styles.scrollContainer}>{children}</div>;
};

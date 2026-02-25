import {
    Sidebar,
    SidebarBrand,
    SidebarDivider,
    SidebarScrollContainer,
    SidebarSection,
    SidebarItem,
    SidebarProfile
} from './SidebarComponents.tsx';
import { Icons } from '../NavIcons.tsx';

export const LeftNav = () => {
    return (
        <Sidebar>
            <SidebarBrand logo={Icons.Automations} text="Peer Review" color="#FFD700" />
            <SidebarDivider />

            <SidebarScrollContainer>
                <SidebarSection title="Home" paths={['/dashboard', '/usage']}>
                    <SidebarItem path="/dashboard" icon={Icons.Dashboard} label="Dashboard" />
                    <SidebarItem path="/usage" icon={Icons.Usage} label="My Usage" />
                </SidebarSection>

                <SidebarSection title="Analysis" paths={['/peer', '/weather']}>
                    <SidebarItem path="/peer" icon={Icons.Agents} label="Peer Analysis" />
                    <SidebarItem path="/weather" icon={Icons.Weather} label="Weather Impact" />
                </SidebarSection>

                <SidebarSection title="Billing" paths={['/recommendation', '/compare-plans']}>
                    <SidebarItem path="/recommendation" icon={Icons.Star} label="Recommendations" />
                    <SidebarItem path="/compare-plans" icon={Icons.Chart} label="Compare Plans" />
                </SidebarSection>

                <SidebarSection title="Service" paths={['/ask', '/support']}>
                    <SidebarItem path="/ask" icon={Icons.Search} label="Ask (AI)" />
                    <SidebarItem path="/support" icon={Icons.Help} label="Support Hub" />
                </SidebarSection>
            </SidebarScrollContainer>

            <SidebarProfile name="Admin User" email="admin@calpine.com" />
        </Sidebar>
    );
};

import { Sidebar, SidebarBrand, SidebarDivider, SidebarScrollContainer, SidebarSection, SidebarItem, SidebarProfile } from './SidebarComponents';
import { Icons } from '../NavIcons';

export const LeftNav = () => {
    return (
        <Sidebar>
            <SidebarBrand logo={Icons.Automations} text="Peer Review" color="#FFD700" />
            <SidebarDivider />

            <SidebarScrollContainer>
                <SidebarSection title="Insights" paths={['/dashboard']}>
                    <SidebarItem path="/dashboard" icon={Icons.Dashboard} label="Dashboard" />
                </SidebarSection>

                <SidebarSection title="Analysis" paths={['/peer', '/weather-2', '/weather']}>
                    <SidebarItem path="/peer" icon={Icons.Agents} label="Peer Analysis" />
                    <SidebarItem path="/weather-2" icon={Icons.Weather} label="Weather Impact" />
                    <SidebarItem path="/weather" icon={Icons.Weather} label="Map" />
                </SidebarSection>

                <SidebarSection title="Plan & Actions" paths={['/manage-plan', '/compare-plans']}>
                    <SidebarItem path="/manage-plan" icon={Icons.Config} label="Manage Plan" />
                    <SidebarItem path="/compare-plans" icon={Icons.Chart} label="Compare Plans" />
                </SidebarSection>

                <SidebarSection title="Support" paths={['/ask', '/support']}>
                    <SidebarItem path="/ask" icon={Icons.Search} label="Ask (AI)" />
                    <SidebarItem path="/support" icon={Icons.Help} label="Support Hub" />
                </SidebarSection>
            </SidebarScrollContainer>

            <SidebarProfile name="Admin User" email="admin@calpine.com" />
        </Sidebar>
    );
};

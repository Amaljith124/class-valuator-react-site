import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    BookOpenCheck,
    ChevronDown,
    CircleHelp,
    FileVideo,
    FlaskConical,
    GraduationCap,
    LayoutDashboard,
    LifeBuoy,
    Search,
    Settings2,
    Sparkles,
    Workflow
} from "lucide-react";

const navItems = [
    { to: "/", label: "Overview", icon: LayoutDashboard },
    { to: "/upload", label: "Upload recording", icon: FileVideo },
    { to: "/processes", label: "Processes", icon: Workflow },
    { to: "/testing", label: "Testing session", icon: FlaskConical },
    { to: "/evaluations", label: "Evaluations", icon: BookOpenCheck }
];

export default function Layout({ children })
{
    const location = useLocation();
    const activePage = navItems.find(function (item)
    {
        return item.to === location.pathname;
    });
    let page = "Humaniti";

    if (activePage)
    {
        page = activePage.label;
    }
    else if (location.pathname.startsWith("/evaluations/"))
    {
        page = "Evaluation details";
    }
    else
    {
        // Keep the default page label for paths without a matching navigation item.
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark"><GraduationCap size={22} /></div>
                    <div>
                        <div className="brand-name">humaniti<span>.</span></div>
                        <div className="brand-caption">CLASSROOM INTELLIGENCE</div>
                    </div>
                </div>

                <div className="workspace-switch">
                    <div className="workspace-avatar">H</div>
                    <div className="workspace-copy">
                        <strong>Humaniti Academy</strong>
                        <span>Workspace</span>
                    </div>
                    <ChevronDown size={15} />
                </div>

                <div className="nav-label">WORKSPACE</div>
                <nav className="nav-list">
                    {navItems.map(function ({ to, label, icon: Icon })
                    {
                        return (
                            <NavLink
                                end={to === "/"}
                                key={to}
                                to={to}
                                className={function ({ isActive })
                                {
                                    return `nav-link ${isActive ? "active" : ""}`;
                                }}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="plan-card">
                        <div className="plan-icon"><Sparkles size={17} /></div>
                        <strong>Classroom insights</strong>
                        <p>Turn every lesson into an opportunity to grow.</p>
                        <div className="plan-meter"><span /></div>
                        <small>Analysis workspace <b>Ready</b></small>
                    </div>
                    <NavLink to="/settings" className="nav-link muted">
                        <Settings2 size={18} />
                        <span>Settings</span>
                    </NavLink>
                    <a className="nav-link muted" href="mailto:support@humaniti.example">
                        <CircleHelp size={18} />
                        <span>Help &amp; support</span>
                    </a>
                    <div className="profile-row">
                        <div className="profile-avatar">AA</div>
                        <div className="profile-copy">
                            <strong>Amaljith A.</strong>
                            <span>Administrator</span>
                        </div>
                        <button className="icon-button" aria-label="Profile menu">
                            <ChevronDown size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <div className="breadcrumbs">
                        <span>Workspace</span>
                        <span className="crumb-slash">/</span>
                        <strong>{page}</strong>
                    </div>
                    <div className="topbar-actions">
                        <div className="search-box">
                            <Search size={16} />
                            <span>Search anything</span>
                            <kbd>⌘ K</kbd>
                        </div>
                        <button className="help-button">
                            <LifeBuoy size={16} />
                            <span>Help center</span>
                        </button>
                        <div className="top-avatar">AA</div>
                    </div>
                </header>

                <div className="page-content">{children}</div>
                <footer className="footer">
                    <span>© 2026 Humaniti AI</span>
                    <span><span className="online-dot" /> All systems operational</span>
                    <span>Built for better learning</span>
                </footer>
            </main>
        </div>
    );
}

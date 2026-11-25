import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BellRing,
  Users,
  GraduationCap,
  LifeBuoy,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './AdminLayout.module.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/books', label: 'Books & Materials', icon: BookOpen },
  { path: '/alerts', label: 'Broadcast Alerts', icon: BellRing },
  { path: '/students', label: 'Students Portal', icon: Users },
  { path: '/curriculum', label: 'Curriculum & Classes', icon: GraduationCap },
  { path: '/support', label: 'Support Complaints', icon: LifeBuoy },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout = () => {
  const { logout, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === location.pathname);
    return item ? item.label : 'Admin Portal';
  };

  return (
    <div className={styles.adminContainer}>
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          mobileMenuOpen ? styles.sidebarOpen : ''
        }`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <div className={styles.brandLogoBox}>
              <img src="/assets/logo.png" alt="Vidya Logo" className={styles.brandLogoImg} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Vidya Admin</span>
              <span className={styles.brandSubtitle}>AP SCERT Portal</span>
            </div>
          </div>
          <button
            className={styles.closeMobileBtn}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navGroupLabel}>CORE MANAGEMENT</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={19} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.authStatusCard}>
            <div className={styles.authStatusHeader}>
              <ShieldCheck size={16} color="var(--success)" />
              <span className={styles.authRole}>Admin Authorized</span>
            </div>
            <span className={styles.tokenPill}>{adminUser?.email || 'admin@vidya.test'}</span>
          </div>

          <div className={styles.footerActions}>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className={styles.portalLink}
            >
              <span>Student Portal</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="Logout from Admin"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobileToggleBtn}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className={styles.headerTitleWrap}>
              <h1 className={styles.headerTitle}>{getPageTitle()}</h1>
              <span className={styles.headerBreadcrumb}>
                Vidya Management &bull; {getPageTitle()}
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.systemStatus}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>API :4000 Connected</span>
            </div>

            <div className={styles.adminUserBadge}>
              <div className={styles.adminAvatar}>
                {adminUser?.name ? adminUser.name[0].toUpperCase() : 'A'}
              </div>
              <div className={styles.adminMeta}>
                <span className={styles.adminName}>{adminUser?.name || 'Administrator'}</span>
                <span className={styles.adminSchool}>{adminUser?.email || 'admin@vidya.test'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className={styles.contentBody}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

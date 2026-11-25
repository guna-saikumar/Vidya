import React, { useState, useRef, useEffect } from 'react';
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
  User,
  ChevronUp,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './AdminLayout.module.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/books', label: 'Books & Materials', icon: BookOpen },
  { path: '/alerts', label: 'Broadcast Alerts', icon: BellRing },
  { path: '/students', label: 'Enrolled Students', icon: Users },
  { path: '/curriculum', label: 'Curriculum & Classes', icon: GraduationCap },
  { path: '/support', label: 'Support Complaints', icon: LifeBuoy },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout = () => {
  const { logout, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname === '/profile') return 'Admin Profile';
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

        {/* Profile Section in Left Sidebar Footer */}
        <div className={styles.sidebarFooter} ref={profileRef}>
          {profileMenuOpen && (
            <div className={styles.profileDropdownMenu} role="menu">
              <div className={styles.profileMenuHeader}>
                <div className={styles.profileMenuAvatar}>
                  {adminUser?.name ? adminUser.name[0].toUpperCase() : 'A'}
                </div>
                <div className={styles.profileMenuMeta}>
                  <span className={styles.profileMenuName}>
                    {adminUser?.name || 'Academic Administrator'}
                  </span>
                  <span className={styles.profileMenuEmail}>
                    {adminUser?.email || 'admin@vidya.test'}
                  </span>
                  <span className={styles.profileMenuRole}>
                    {adminUser?.role || 'ADMIN'} &bull; AP SCERT
                  </span>
                </div>
              </div>

              <div className={styles.profileMenuDivider} />

              <button
                type="button"
                className={styles.profileMenuItem}
                onClick={() => {
                  setProfileMenuOpen(false);
                  setMobileMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <User size={16} />
                <span>Admin Profile</span>
              </button>

              <button
                type="button"
                className={styles.profileMenuItem}
                onClick={() => {
                  setProfileMenuOpen(false);
                  setMobileMenuOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings size={16} />
                <span>Portal Settings</span>
              </button>

              <div className={styles.profileMenuDivider} />

              <button
                type="button"
                className={`${styles.profileMenuItem} ${styles.profileMenuItemDanger}`}
                onClick={() => {
                  setProfileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className={`${styles.sidebarProfileButton} ${
              profileMenuOpen ? styles.sidebarProfileButtonActive : ''
            }`}
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-label="Admin Profile Menu"
            aria-expanded={profileMenuOpen}
          >
            <div className={styles.adminAvatarSmall}>
              {adminUser?.name ? adminUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className={styles.adminUserCardMeta}>
              <span className={styles.adminUserName}>
                {adminUser?.name || 'Administrator'}
              </span>
              <span className={styles.adminUserEmail}>
                {adminUser?.email || 'admin@vidya.test'}
              </span>
            </div>
            <ChevronUp
              size={16}
              className={`${styles.profileChevron} ${
                profileMenuOpen ? styles.profileChevronOpen : ''
              }`}
            />
          </button>
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
            <button
              type="button"
              className={styles.adminUserBadgeBtn}
              onClick={() => navigate('/profile')}
              title="View Admin Profile"
            >
              <div className={styles.adminAvatar}>
                {adminUser?.name ? adminUser.name[0].toUpperCase() : 'A'}
              </div>
              <div className={styles.adminMeta}>
                <span className={styles.adminName}>{adminUser?.name || 'Administrator'}</span>
                <span className={styles.adminSchool}>{adminUser?.email || 'admin@vidya.test'}</span>
              </div>
            </button>
          </div>
        </header>

        <main className={styles.contentBody}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

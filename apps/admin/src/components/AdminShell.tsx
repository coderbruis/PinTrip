import { Button, Drawer, Dropdown, Input, type MenuProps } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import type { AdminPageKey } from "../types";
import { AppIcon, type IconName } from "./AppIcon";
import type { AdminProfile } from "../services/authApi";
import type { AdminNavigationGroup } from "../services/adminMenusApi";

const supportedIcons = new Set<IconName>([
  "dashboard", "knowledge", "imports", "tasks", "prompts",
  "settings", "users", "roles", "logs"
]);

function iconName(value: string): IconName {
  return supportedIcons.has(value as IconName) ? value as IconName : "menu";
}

interface Props {
  activePage: AdminPageKey;
  pageTitle: string;
  darkMode: boolean;
  children: ReactNode;
  onNavigate: (page: AdminPageKey) => void;
  onThemeChange: (dark: boolean) => void;
  onSignOut: () => void;
  profile: AdminProfile;
  navigation: AdminNavigationGroup[];
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">P</span>
      <span>
        <strong>PinTrip</strong>
        <small>Travel Intelligence</small>
      </span>
    </div>
  );
}
function Navigation({
  activePage,
  onNavigate,
  navigation,
  collapsed = false
}: Pick<Props, "activePage" | "onNavigate" | "navigation"> & { collapsed?: boolean }) {
  const activeGroup = navigation.find((group) => group.items.some((item) => item.key === activePage))?.key;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ system: true, agent: true });

  useEffect(() => {
    if (activeGroup) setExpanded((current) => ({ ...current, [activeGroup]: true }));
  }, [activeGroup]);

  if (collapsed) {
    return (
      <nav className="side-navigation collapsed-navigation" aria-label="后台主导航">
        {navigation.flatMap((group) => group.items).map((item) => (
          <button
            key={item.key}
            title={item.label}
            className={`nav-item ${activePage === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            <AppIcon name={iconName(item.icon)} />
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="side-navigation" aria-label="后台主导航">
      {navigation.map((group) => {
        const isOpen = expanded[group.key];
        const isActive = group.items.some((item) => item.key === activePage);
        return (
          <section className={`nav-group ${isOpen ? "open" : ""}`} key={group.key}>
            <button
              className={`nav-group-trigger ${isActive ? "contains-active" : ""}`}
              onClick={() => setExpanded((current) => ({ ...current, [group.key]: !isOpen }))}
              aria-expanded={isOpen}
            >
              <AppIcon name={iconName(group.icon)} />
              <span>
                <strong>{group.label}</strong>
                <small>{group.hint}</small>
              </span>
              <span className="nav-chevron"><AppIcon name="chevron" size={15} /></span>
            </button>
            {isOpen && (
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    className={`nav-item ${activePage === item.key ? "active" : ""}`}
                    onClick={() => onNavigate(item.key)}
                  >
                    <AppIcon name={iconName(item.icon)} />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.hint}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </nav>
  );
}

export function AdminShell(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem("pintrip-admin-sidebar") === "collapsed"
  );
  const userMenu: MenuProps["items"] = [
    { key: "profile", label: "账号设置", disabled: true },
    { type: "divider" },
    { key: "logout", label: "退出登录", icon: <AppIcon name="logout" />, onClick: props.onSignOut }
  ];
  const navigateFromDrawer = (page: AdminPageKey) => {
    props.onNavigate(page);
    setDrawerOpen(false);
  };
  const toggleNavigation = () => {
    if (window.matchMedia("(max-width: 820px)").matches) {
      setDrawerOpen(true);
      return;
    }
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("pintrip-admin-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  };
  const initials = props.profile.displayName.trim().slice(0, 2).toUpperCase() || "OP";
  return (
    <div className={`admin-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <header className="topbar">
        <Button
          type="text"
          className="sidebar-toggle"
          icon={<AppIcon name="menu" />}
          onClick={toggleNavigation}
          aria-label={collapsed ? "展开菜单" : "收起菜单"}
        />
        <Brand />
        <div className="topbar-divider" />
        <div className="topbar-context">
          <span>运营控制台</span>
          <b>{props.pageTitle}</b>
        </div>
        <div className="topbar-actions">
          <Input
            className="global-search"
            prefix={<AppIcon name="search" size={15} />}
            placeholder="搜索菜单、任务或攻略"
            suffix={<kbd>⌘ K</kbd>}
          />
          <Button
            type="text"
            className="icon-button"
            icon={<AppIcon name={props.darkMode ? "sun" : "moon"} />}
            onClick={() => props.onThemeChange(!props.darkMode)}
            aria-label="切换主题"
          />
          <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={["click"]}>
            <button className="profile-trigger">
              <span className="avatar small">{initials}</span>
              <span className="profile-copy">
                <strong>{props.profile.displayName}</strong>
                <small>{props.profile.username}</small>
              </span>
            </button>
          </Dropdown>
        </div>
      </header>
      <div className="admin-workspace">
        <aside className="sidebar">
          {!collapsed && <p className="sidebar-label">工作台</p>}
          <Navigation
            activePage={props.activePage}
            onNavigate={props.onNavigate}
            navigation={props.navigation}
            collapsed={collapsed}
          />
          {!collapsed && (
            <div className="sidebar-status">
              <i />
              <span><strong>系统运行正常</strong><small>所有核心服务在线</small></span>
            </div>
          )}
        </aside>
        <div className="admin-main">
          <main className="page-content">{props.children}</main>
        </div>
      </div>
      <Drawer
        placement="left"
        width={280}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 16 } }}
      >
        <Brand />
        <Navigation activePage={props.activePage} onNavigate={navigateFromDrawer} navigation={props.navigation} />
      </Drawer>
    </div>
  );
}

import { Button, Drawer, Dropdown, Input, type MenuProps } from "antd";
import { useState, type ReactNode } from "react";
import type { AdminPageKey } from "../types";
import { AppIcon } from "./AppIcon";

const navigation: Array<{ key: AdminPageKey; label: string; hint: string }> = [
  { key: "dashboard", label: "运营看板", hint: "全局概览" },
  { key: "knowledge", label: "知识库", hint: "攻略与向量" },
  { key: "imports", label: "导入日志", hint: "素材处理" },
  { key: "tasks", label: "Agent 任务", hint: "运行与重试" },
  { key: "prompts", label: "Prompt 模板", hint: "版本管理" }
];

interface Props {
  activePage: AdminPageKey;
  pageTitle: string;
  darkMode: boolean;
  children: ReactNode;
  onNavigate: (page: AdminPageKey) => void;
  onThemeChange: (dark: boolean) => void;
  onSignOut: () => void;
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">P</span>
      <span>
        <strong>PinTrip</strong>
        <small>运营管理中心</small>
      </span>
    </div>
  );
}
function Navigation({ activePage, onNavigate }: Pick<Props, "activePage" | "onNavigate">) {
  return (
    <nav className="side-navigation" aria-label="后台主导航">
      <p className="nav-section-label">工作台</p>
      {navigation.map((item) => (
        <button
          key={item.key}
          className={`nav-item ${activePage === item.key ? "active" : ""}`}
          onClick={() => onNavigate(item.key)}
        >
          <AppIcon name={item.key} />
          <span>
            <strong>{item.label}</strong>
            <small>{item.hint}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}

export function AdminShell(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userMenu: MenuProps["items"] = [
    { key: "profile", label: "账号设置", disabled: true },
    { type: "divider" },
    { key: "logout", label: "退出登录", icon: <AppIcon name="logout" />, onClick: props.onSignOut }
  ];
  const navigateFromDrawer = (page: AdminPageKey) => {
    props.onNavigate(page);
    setDrawerOpen(false);
  };
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Brand />
        <Navigation activePage={props.activePage} onNavigate={props.onNavigate} />
        <div className="sidebar-footer">
          <span className="avatar">OP</span>
          <span>
            <strong>运营管理员</strong>
            <small>operator@pintrip.cn</small>
          </span>
        </div>
      </aside>
      <div className="admin-main">
        <header className="topbar">
          <Button
            className="mobile-menu"
            type="text"
            icon={<AppIcon name="menu" />}
            onClick={() => setDrawerOpen(true)}
            aria-label="打开菜单"
          />
          <div className="breadcrumb">
            <span>PinTrip</span>
            <b>/</b>
            <strong>{props.pageTitle}</strong>
          </div>
          <div className="topbar-actions">
            <Input
              className="global-search"
              prefix={<AppIcon name="search" size={16} />}
              placeholder="搜索菜单、任务或攻略…"
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
                <span className="avatar small">OP</span>
                <span>运营管理员</span>
              </button>
            </Dropdown>
          </div>
        </header>
        <main className="page-content">{props.children}</main>
      </div>
      <Drawer
        placement="left"
        width={280}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 16 } }}
      >
        <Brand />
        <Navigation activePage={props.activePage} onNavigate={navigateFromDrawer} />
      </Drawer>
    </div>
  );
}

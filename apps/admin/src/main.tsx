import { StrictMode, useEffect, useMemo, useState } from "react";
import { ConfigProvider, Empty, Tag, theme } from "antd";
import { createRoot } from "react-dom/client";
import "antd/dist/reset.css";
import "./styles.css";
import { AdminShell } from "./components/AdminShell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { KnowledgePage } from "./pages/KnowledgePage";
import { ImportLogsPage } from "./pages/ImportLogsPage";
import { AgentTasksPage } from "./pages/AgentTasksPage";
import { PromptTemplatesPage } from "./pages/PromptTemplatesPage";
import { SystemManagementPage } from "./pages/SystemManagementPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminRolesPage } from "./pages/AdminRolesPage";
import { MenuManagementPage } from "./pages/MenuManagementPage";
import { PageHeader } from "./components/PageHeader";
import { getAdminNavigation, type AdminNavigationGroup } from "./services/adminMenusApi";
import type { AdminPageKey } from "./types";
import { clearSession, getAccessToken, getCurrentAdmin, type AdminProfile } from "./services/authApi";

const pageTitles: Record<string, string> = {
  dashboard: "运营看板",
  knowledge: "知识库",
  imports: "导入日志",
  tasks: "Agent 任务",
  prompts: "Prompt 模板",
  menus: "菜单与权限",
  users: "用户管理",
  roles: "角色管理",
  logs: "日志记录"
};

function getInitialPage(): AdminPageKey {
  return window.location.hash.replace("#/", "") || "dashboard";
}

function PendingMenuPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="菜单已经生效，对应的业务页面尚未接入。" />
      <section className="panel system-placeholder">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="页面待接入" />
        <Tag color="purple">菜单已配置</Tag>
      </section>
    </>
  );
}

function AdminApp() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [sessionChecked, setSessionChecked] = useState(() => !getAccessToken());
  const [page, setPage] = useState<AdminPageKey>(getInitialPage);
  const [navigation, setNavigation] = useState<AdminNavigationGroup[]>([]);
  const [darkMode, setDarkMode] = useState(
    () => window.localStorage.getItem("pintrip-admin-theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("pintrip-admin-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;
    void getCurrentAdmin()
      .then((admin) => {
        if (active) setProfile(admin);
      })
      .catch(() => {
        if (active) {
          clearSession();
          setProfile(null);
        }
      })
      .finally(() => {
        if (active) setSessionChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!profile) {
      setNavigation([]);
      return;
    }
    let active = true;
    void getAdminNavigation()
      .then((groups) => {
        if (!active) return;
        setNavigation(groups);
        const allowedPages = groups.flatMap((group) => group.items.map((item) => item.key));
        if (!allowedPages.includes(page) && allowedPages[0]) navigate(allowedPages[0]);
      })
      .catch(() => {
        if (active) setNavigation([]);
      });
    return () => {
      active = false;
    };
  }, [profile?.username]);

  const content = useMemo(() => {
    if (page === "dashboard") return <DashboardPage onNavigate={navigate} />;
    if (page === "knowledge") return <KnowledgePage />;
    if (page === "imports") return <ImportLogsPage />;
    if (page === "tasks") return <AgentTasksPage />;
    if (page === "prompts") return <PromptTemplatesPage />;
    if (page === "users") return <AdminUsersPage />;
    if (page === "menus") return <MenuManagementPage onPermissionsChanged={() => {
      void getAdminNavigation().then((groups) => {
        setNavigation(groups);
        const allowedPages = groups.flatMap((group) => group.items.map((item) => item.key));
        if (!allowedPages.includes(page) && allowedPages[0]) navigate(allowedPages[0]);
      });
    }} />;
    if (page === "roles") return <AdminRolesPage onPermissionsChanged={() => {
      void getAdminNavigation().then((groups) => {
        setNavigation(groups);
        const allowedPages = groups.flatMap((group) => group.items.map((item) => item.key));
        if (!allowedPages.includes(page) && allowedPages[0]) navigate(allowedPages[0]);
      });
    }} />;
    if (page === "logs") return <SystemManagementPage page={page} />;
    const dynamicTitle = navigation
      .flatMap((group) => group.items)
      .find((item) => item.key === page)?.label ?? pageTitles[page] ?? "菜单页面";
    return <PendingMenuPage title={dynamicTitle} />;
  }, [page, navigation]);

  function navigate(nextPage: AdminPageKey) {
    window.location.hash = `#/${nextPage}`;
    setPage(nextPage);
  }

  function signIn(admin: AdminProfile) {
    setProfile(admin);
    setSessionChecked(true);
  }

  function signOut() {
    clearSession();
    setProfile(null);
  }

  const antdTheme = {
    algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: "#4e83ee",
      borderRadius: 8,
      fontSize: 13,
      controlHeight: 34,
      colorBorder: darkMode ? "rgba(255,255,255,.1)" : "#e5e7eb",
      colorBgContainer: darkMode ? "#303030" : "#ffffff",
      colorBgElevated: darkMode ? "#333333" : "#ffffff"
    },
    components: {
      Table: {
        headerBg: darkMode ? "#383838" : "#f7f8fa",
        headerColor: darkMode ? "#b5b5b5" : "#646a73",
        rowHoverBg: darkMode ? "#363b44" : "#f8faff"
      },
      Button: { primaryShadow: "none" }
    }
  };

  if (!sessionChecked) return (
    <ConfigProvider theme={antdTheme}>
      <main className="login-page" aria-label="正在验证登录状态" />
    </ConfigProvider>
  );

  if (!profile) return (
    <ConfigProvider theme={antdTheme}>
      <LoginPage onSignIn={signIn} darkMode={darkMode} onThemeChange={setDarkMode} />
    </ConfigProvider>
  );

  return (
    <ConfigProvider theme={antdTheme}>
      <AdminShell
        activePage={page}
        pageTitle={navigation.flatMap((group) => group.items).find((item) => item.key === page)?.label
          ?? pageTitles[page]
          ?? "菜单页面"}
        darkMode={darkMode}
        onNavigate={navigate}
        onThemeChange={setDarkMode}
        onSignOut={signOut}
        profile={profile}
        navigation={navigation}
      >
        {content}
      </AdminShell>
    </ConfigProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);

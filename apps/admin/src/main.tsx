import { StrictMode, useEffect, useMemo, useState } from "react";
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
import type { AdminPageKey } from "./types";
import { clearSession, getAccessToken, getAdminProfile, type AdminProfile } from "./services/authApi";

const pageTitles: Record<AdminPageKey, string> = {
  dashboard: "运营看板",
  knowledge: "知识库",
  imports: "导入日志",
  tasks: "Agent 任务",
  prompts: "Prompt 模板"
};

function getInitialPage(): AdminPageKey {
  const hash = window.location.hash.replace("#/", "") as AdminPageKey;
  return hash in pageTitles ? hash : "dashboard";
}

function AdminApp() {
  const [profile, setProfile] = useState<AdminProfile | null>(() =>
    getAccessToken() ? getAdminProfile() : null
  );
  const [page, setPage] = useState<AdminPageKey>(getInitialPage);
  const [darkMode, setDarkMode] = useState(
    () => window.localStorage.getItem("pintrip-admin-theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("pintrip-admin-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const content = useMemo(() => {
    if (page === "knowledge") return <KnowledgePage />;
    if (page === "imports") return <ImportLogsPage />;
    if (page === "tasks") return <AgentTasksPage />;
    if (page === "prompts") return <PromptTemplatesPage />;
    return <DashboardPage onNavigate={navigate} />;
  }, [page]);

  function navigate(nextPage: AdminPageKey) {
    window.location.hash = `#/${nextPage}`;
    setPage(nextPage);
  }

  function signIn(admin: AdminProfile) {
    setProfile(admin);
  }

  function signOut() {
    clearSession();
    setProfile(null);
  }

  if (!profile)
    return <LoginPage onSignIn={signIn} darkMode={darkMode} onThemeChange={setDarkMode} />;

  return (
    <AdminShell
      activePage={page}
      pageTitle={pageTitles[page]}
      darkMode={darkMode}
      onNavigate={navigate}
      onThemeChange={setDarkMode}
      onSignOut={signOut}
      profile={profile}
    >
      {content}
    </AdminShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);

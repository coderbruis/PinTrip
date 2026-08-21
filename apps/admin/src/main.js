import { jsx as _jsx } from "react/jsx-runtime";
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
const pageTitles = {
  dashboard: "运营看板",
  knowledge: "知识库",
  imports: "导入日志",
  tasks: "Agent 任务",
  prompts: "Prompt 模板"
};
function getInitialPage() {
  const hash = window.location.hash.replace("#/", "");
  return hash in pageTitles ? hash : "dashboard";
}
function AdminApp() {
  const [signedIn, setSignedIn] = useState(
    () => window.sessionStorage.getItem("pintrip-admin-session") === "demo"
  );
  const [page, setPage] = useState(getInitialPage);
  const [darkMode, setDarkMode] = useState(
    () => window.localStorage.getItem("pintrip-admin-theme") === "dark"
  );
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("pintrip-admin-theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  const content = useMemo(() => {
    if (page === "knowledge") return _jsx(KnowledgePage, {});
    if (page === "imports") return _jsx(ImportLogsPage, {});
    if (page === "tasks") return _jsx(AgentTasksPage, {});
    if (page === "prompts") return _jsx(PromptTemplatesPage, {});
    return _jsx(DashboardPage, { onNavigate: navigate });
  }, [page]);
  function navigate(nextPage) {
    window.location.hash = `#/${nextPage}`;
    setPage(nextPage);
  }
  function signIn() {
    window.sessionStorage.setItem("pintrip-admin-session", "demo");
    setSignedIn(true);
  }
  function signOut() {
    window.sessionStorage.removeItem("pintrip-admin-session");
    setSignedIn(false);
  }
  if (!signedIn)
    return _jsx(LoginPage, { onSignIn: signIn, darkMode: darkMode, onThemeChange: setDarkMode });
  return _jsx(AdminShell, {
    activePage: page,
    pageTitle: pageTitles[page],
    darkMode: darkMode,
    onNavigate: navigate,
    onThemeChange: setDarkMode,
    onSignOut: signOut,
    children: content
  });
}
createRoot(document.getElementById("root")).render(
  _jsx(StrictMode, { children: _jsx(AdminApp, {}) })
);

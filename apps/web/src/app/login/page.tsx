import { AuthPage } from "../auth-page";

export default function LoginPage() {
  return (
    <AuthPage
      eyebrow="Welcome Back"
      title="登录拾途"
      subtitle="继续整理你的旅行灵感、路线和预算。"
    >
      <form className="auth-form">
        <label>
          手机号或邮箱
          <input autoComplete="username" placeholder="name@example.com" type="text" />
        </label>
        <label>
          密码
          <input autoComplete="current-password" placeholder="输入密码" type="password" />
        </label>
        <a className="dark-button auth-submit" href="/profile">
          登录
        </a>
      </form>

      <div className="auth-link-row">
        <a href="/register">注册账号</a>
        <a href="/forgot-password">忘记密码</a>
      </div>
    </AuthPage>
  );
}

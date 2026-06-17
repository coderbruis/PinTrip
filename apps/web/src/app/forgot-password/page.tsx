import { AuthPage } from "../auth-page";

export default function ForgotPasswordPage() {
  return (
    <AuthPage
      eyebrow="Reset Password"
      title="找回密码"
      subtitle="输入注册时使用的手机号或邮箱，获取密码重置方式。"
    >
      <form className="auth-form">
        <label>
          手机号或邮箱
          <input autoComplete="username" placeholder="name@example.com" type="text" />
        </label>
        <button className="dark-button auth-submit" type="button">
          发送重置链接
        </button>
      </form>

      <p className="auth-inline-text">
        想起密码了？<a href="/login">返回登录</a>
      </p>
    </AuthPage>
  );
}

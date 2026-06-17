import { AuthPage } from "../auth-page";

export default function RegisterPage() {
  return (
    <AuthPage
      eyebrow="Create Account"
      title="注册账号"
      subtitle="创建账号后，可以保存攻略、导入记录和路线草稿。"
    >
      <form className="auth-form">
        <label>
          用户姓名
          <input autoComplete="name" placeholder="你的名字" type="text" />
        </label>
        <label>
          手机号或邮箱
          <input autoComplete="email" placeholder="name@example.com" type="text" />
        </label>
        <label>
          设置密码
          <input autoComplete="new-password" placeholder="至少 8 位字符" type="password" />
        </label>
        <button className="dark-button auth-submit" type="button">
          创建账号
        </button>
      </form>

      <p className="auth-inline-text">
        已有账号？<a href="/login">去登录</a>
      </p>
    </AuthPage>
  );
}

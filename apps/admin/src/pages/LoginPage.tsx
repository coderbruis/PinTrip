import { Button, Checkbox, Form, Input, message } from "antd";
import { AppIcon } from "../components/AppIcon";
import { login, saveSession, type AdminProfile } from "../services/authApi";

interface Props {
  darkMode: boolean;
  onSignIn: (profile: AdminProfile) => void;
  onThemeChange: (dark: boolean) => void;
}

export function LoginPage({ darkMode, onSignIn, onThemeChange }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const submit = async (values: { username: string; password: string; remember?: boolean }) => {
    try {
      const result = await login(values.username, values.password);
      saveSession(result, Boolean(values.remember));
      messageApi.success("登录成功");
      onSignIn(result.user);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "登录失败");
    }
  };
  return (
    <div className="login-page">
      {contextHolder}
      <button
        className="login-theme"
        onClick={() => onThemeChange(!darkMode)}
        aria-label="切换主题"
      >
        <AppIcon name={darkMode ? "sun" : "moon"} />
      </button>
      <section className="login-story">
        <div className="login-brand">
          <span className="brand-mark large">P</span>
          <strong>PinTrip</strong>
        </div>
        <div>
          <span className="login-kicker">TRAVEL INTELLIGENCE</span>
          <h1>
            让每一份旅行灵感，
            <br />
            沉淀为可靠的知识。
          </h1>
          <p>统一管理攻略知识、素材导入、Agent 任务和 Prompt 版本。</p>
        </div>
        <p className="login-footnote">PinTrip Operations · Internal access only</p>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>登录运营后台</h2>
          <p className="muted">使用运营账号登录，访问知识库与 Agent 管理功能。</p>
          <Form layout="vertical" size="large" onFinish={submit} requiredMark={false}>
            <Form.Item
              label="账号"
              name="username"
              rules={[{ required: true, message: "请输入运营账号" }]}
            >
              <Input placeholder="请输入运营账号" autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[
                {
                  required: true,
                  min: 6,
                  message: "密码至少 6 位"
                }
              ]}
            >
              <Input.Password placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>
            <div className="login-options">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>保持登录</Checkbox>
              </Form.Item>
              <button type="button" onClick={() => messageApi.info("请联系系统管理员重置密码")}>
                忘记密码？
              </button>
            </div>
            <Button type="primary" htmlType="submit" block>
              登录后台 <AppIcon name="arrow" size={16} />
            </Button>
          </Form>
          <p className="login-notice">登录即表示你同意遵守 PinTrip 数据与内容安全规范。</p>
        </div>
      </section>
    </div>
  );
}

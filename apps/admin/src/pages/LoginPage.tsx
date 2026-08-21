import { Button, Checkbox, Form, Input, message } from "antd";
import { AppIcon } from "../components/AppIcon";

interface Props {
  darkMode: boolean;
  onSignIn: () => void;
  onThemeChange: (dark: boolean) => void;
}

export function LoginPage({ darkMode, onSignIn, onThemeChange }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const submit = () => {
    messageApi.success("演示账号登录成功");
    window.setTimeout(onSignIn, 250);
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
          <p className="muted">当前为前端演示登录，提交任意符合格式的账号即可进入。</p>
          <Form layout="vertical" size="large" onFinish={submit} requiredMark={false}>
            <Form.Item
              label="邮箱"
              name="email"
              initialValue="operator@pintrip.cn"
              rules={[{ required: true, type: "email", message: "请输入有效邮箱" }]}
            >
              <Input placeholder="name@pintrip.cn" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              initialValue="pintrip-demo"
              rules={[
                {
                  required: true,
                  min: 6,
                  message: "密码至少 6 位"
                }
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <div className="login-options">
              <Checkbox defaultChecked>保持登录</Checkbox>
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

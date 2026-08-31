import { Button, Empty, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import {
  createAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  type AdminUserItem,
  type CreateAdminUserPayload,
  type UpdateAdminUserPayload
} from "../services/adminUsersApi";
import { listAdminRoles, type AdminRoleItem } from "../services/adminRolesApi";

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function AdminUsersPage() {
  const [userForm] = Form.useForm<CreateAdminUserPayload & UpdateAdminUserPayload>();
  const [passwordForm] = Form.useForm<{ password: string; confirmation: string }>();
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [roles, setRoles] = useState<AdminRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | 1 | 2>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserItem>();
  const [resetting, setResetting] = useState<AdminUserItem>();

  const load = async () => {
    setLoading(true);
    try {
      const [users, availableRoles] = await Promise.all([listAdminUsers(), listAdminRoles()]);
      setItems(users);
      setRoles(availableRoles);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "用户列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword = !keyword
        || `${item.username} ${item.displayName} ${item.email ?? ""}`.toLowerCase().includes(keyword);
      return matchesKeyword && (status === "all" || item.status === status);
    });
  }, [items, query, status]);

  const roleNames = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.roleCode, role.roleName])),
    [roles]
  );

  const roleOptions = useMemo(
    () => roles.map((role) => ({
      value: role.roleCode,
      label: role.roleName,
      disabled: role.status !== 1
    })),
    [roles]
  );

  const openCreate = () => {
    setEditing(undefined);
    userForm.resetFields();
    const defaultRole = roles.find((role) => role.roleCode === "OPERATOR" && role.status === 1)
      ?? roles.find((role) => role.status === 1);
    userForm.setFieldsValue({ roles: defaultRole ? [defaultRole.roleCode] : [], status: 1 });
    setEditorOpen(true);
  };

  const openEdit = (item: AdminUserItem) => {
    setEditing(item);
    userForm.setFieldsValue({
      email: item.email ?? undefined,
      displayName: item.displayName,
      status: item.status,
      roles: item.roles
    });
    setEditorOpen(true);
  };

  const saveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSaving(true);
      const saved = editing
        ? await updateAdminUser(editing.id, {
            email: values.email,
            displayName: values.displayName,
            status: values.status,
            roles: values.roles
          })
        : await createAdminUser({
            username: values.username,
            email: values.email,
            displayName: values.displayName,
            password: values.password,
            roles: values.roles
          });
      setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setEditorOpen(false);
      message.success(editing ? "账号信息已更新" : "运营账号已创建");
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!resetting) return;
    try {
      const values = await passwordForm.validateFields();
      setSaving(true);
      await resetAdminUserPassword(resetting.id, values.password);
      setResetting(undefined);
      passwordForm.resetFields();
      message.success(`已重置 ${resetting.username} 的密码`);
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "用户名称",
      dataIndex: "displayName",
      width: 160
    },
    { title: "登录账号", dataIndex: "username", width: 160 },
    { title: "邮箱", dataIndex: "email", render: (value: string | null) => value || "—" },
    {
      title: "角色",
      dataIndex: "roles",
      render: (roles: string[]) => <Space wrap>{roles.map((role) => <Tag key={role}>{roleNames[role] ?? role}</Tag>)}</Space>
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: 1 | 2) => value === 1
        ? <StatusPill tone="success">正常</StatusPill>
        : <StatusPill tone="neutral">已禁用</StatusPill>
    },
    { title: "最后登录", dataIndex: "lastLoginAt", width: 170, render: formatTime },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_: unknown, row: AdminUserItem) => (
        <Space>
          <Button type="link" onClick={() => openEdit(row)}>编辑</Button>
          <Button type="link" onClick={() => { passwordForm.resetFields(); setResetting(row); }}>重置密码</Button>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="用户管理"
        description="管理运营后台账号、启停状态及角色分配。"
        actions={<Button type="primary" onClick={openCreate}>新建账号</Button>}
      />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <Input.Search
            allowClear
            placeholder="搜索账号、姓名或邮箱"
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "全部状态" },
              { value: 1, label: "正常" },
              { value: 2, label: "已禁用" }
            ]}
          />
          <Button className="toolbar-refresh" loading={loading} onClick={() => void load()}>刷新</Button>
        </div>
        <Table<AdminUserItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无运营账号" /> }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 个账号` }}
          scroll={{ x: 1000 }}
        />
      </section>

      <Modal
        title={editing ? `编辑账号 · ${editing.username}` : "新建运营账号"}
        open={editorOpen}
        confirmLoading={saving}
        onOk={() => void saveUser()}
        onCancel={() => setEditorOpen(false)}
        okText={editing ? "保存修改" : "创建账号"}
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={userForm} layout="vertical" requiredMark="optional">
          {!editing && (
            <Form.Item name="username" label="登录账号" rules={[
              { required: true, message: "请输入登录账号" },
              { min: 3, max: 64, message: "账号长度为 3–64 位" },
              { pattern: /^[A-Za-z0-9._-]+$/, message: "只能包含字母、数字、点、下划线和短横线" }
            ]}><Input autoComplete="off" placeholder="例如：operator.li" /></Form.Item>
          )}
          <div className="form-grid">
            <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: "请输入显示名称" }]}>
              <Input placeholder="例如：李明" />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "请输入正确的邮箱" }]}>
              <Input placeholder="name@pintrip.cn" />
            </Form.Item>
          </div>
          {!editing && (
            <Form.Item name="password" label="初始密码" rules={[
              { required: true, message: "请输入初始密码" },
              { min: 8, max: 72, message: "密码长度为 8–72 位" }
            ]}><Input.Password autoComplete="new-password" /></Form.Item>
          )}
          <Form.Item name="roles" label="分配角色" rules={[{ required: true, message: "请至少选择一个角色" }]}>
            <Select mode="multiple" options={roleOptions} placeholder="选择角色" />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="账号状态" rules={[{ required: true }]}>
              <Select options={[{ value: 1, label: "正常" }, { value: 2, label: "禁用" }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={`重置密码${resetting ? ` · ${resetting.username}` : ""}`}
        open={Boolean(resetting)}
        confirmLoading={saving}
        onOk={() => void savePassword()}
        onCancel={() => setResetting(undefined)}
        okText="确认重置"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="password" label="新密码" rules={[
            { required: true, message: "请输入新密码" },
            { min: 8, max: 72, message: "密码长度为 8–72 位" }
          ]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item
            name="confirmation"
            label="确认新密码"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请再次输入新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || value === getFieldValue("password")
                    ? Promise.resolve()
                    : Promise.reject(new Error("两次输入的密码不一致"));
                }
              })
            ]}
          ><Input.Password autoComplete="new-password" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

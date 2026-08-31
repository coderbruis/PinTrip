import { Alert, Button, Empty, Form, Input, Modal, Select, Space, Spin, Table, Tooltip, Tree, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import {
  createAdminRole,
  deleteAdminRole,
  listAdminRoles,
  updateAdminRole,
  type AdminRoleItem,
  type AdminRoleStatus,
  type CreateAdminRolePayload
} from "../services/adminRolesApi";
import {
  getMenuManagementData,
  updateRoleMenus,
  type MenuManagementData
} from "../services/adminMenusApi";

type RoleFormValues = CreateAdminRolePayload;

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function AdminRolesPage({ onPermissionsChanged }: { onPermissionsChanged: () => void }) {
  const [form] = Form.useForm<RoleFormValues>();
  const [items, setItems] = useState<AdminRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRoleItem>();
  const [permissionRole, setPermissionRole] = useState<AdminRoleItem>();
  const [permissionData, setPermissionData] = useState<MenuManagementData>();
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AdminRoleStatus>("all");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listAdminRoles());
    } catch (error) {
      message.error(error instanceof Error ? error.message : "角色列表加载失败");
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
        || `${item.roleCode} ${item.roleName}`.toLowerCase().includes(keyword);
      return matchesKeyword && (status === "all" || item.status === status);
    });
  }, [items, query, status]);

  const permissionTree = useMemo(() => {
    if (!permissionData) return [];
    return permissionData.menus
      .filter((menu) => !menu.parentKey)
      .map((group) => ({
        key: group.key,
        title: <span className="permission-node"><b>{group.label}</b><small>{group.hint}</small></span>,
        children: permissionData.menus
          .filter((menu) => menu.parentKey === group.key)
          .map((menu) => ({
            key: menu.key,
            title: <span className="permission-node"><b>{menu.label}</b><small>{menu.hint}</small></span>
          }))
      }));
  }, [permissionData]);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setEditorOpen(true);
  };

  const openEdit = (role: AdminRoleItem) => {
    if (role.systemRole) return;
    setEditing(role);
    form.setFieldsValue({
      roleCode: role.roleCode,
      roleName: role.roleName,
      status: role.status
    });
    setEditorOpen(true);
  };

  const saveRole = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const saved = editing
        ? await updateAdminRole(editing.id, { roleName: values.roleName, status: values.status })
        : await createAdminRole({
            roleCode: values.roleCode.trim().toUpperCase(),
            roleName: values.roleName,
            status: values.status
          });
      setItems((current) => current.some((item) => item.id === saved.id)
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]);
      setEditorOpen(false);
      message.success(editing ? "角色已更新" : "角色已创建，可继续配置菜单权限");
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeRole = (role: AdminRoleItem) => {
    if (role.systemRole) return;
    if (role.userCount > 0) {
      message.warning(`该角色仍分配给 ${role.userCount} 个账号，请先在用户管理中解除关联`);
      return;
    }
    Modal.confirm({
      title: `删除角色“${role.roleName}”？`,
      content: "删除后，该角色的菜单权限配置也会一并删除，且无法恢复。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          await deleteAdminRole(role.id);
          setItems((current) => current.filter((item) => item.id !== role.id));
          message.success("角色已删除");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "角色删除失败");
          throw error;
        }
      }
    });
  };

  const openPermissions = async (role: AdminRoleItem) => {
    setPermissionRole(role);
    setPermissionData(undefined);
    setCheckedKeys([]);
    setPermissionLoading(true);
    try {
      const result = await getMenuManagementData();
      setPermissionData(result);
      setCheckedKeys(result.roles.find((item) => item.roleCode === role.roleCode)?.menuKeys ?? []);
    } catch (error) {
      setPermissionRole(undefined);
      message.error(error instanceof Error ? error.message : "角色权限加载失败");
    } finally {
      setPermissionLoading(false);
    }
  };

  const savePermissions = async () => {
    if (!permissionRole || permissionRole.systemRole) return;
    try {
      setPermissionSaving(true);
      const result = await updateRoleMenus(permissionRole.roleCode, checkedKeys.map(String));
      const assignment = result.roles.find((role) => role.roleCode === permissionRole.roleCode);
      setPermissionData(result);
      setCheckedKeys(assignment?.menuKeys ?? []);
      setItems((current) => current.map((role) => role.id === permissionRole.id
        ? { ...role, menuCount: assignment?.menuKeys.length ?? 0 }
        : role));
      setPermissionRole(undefined);
      onPermissionsChanged();
      message.success("角色菜单权限已保存");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "角色权限保存失败");
    } finally {
      setPermissionSaving(false);
    }
  };

  const columns = [
    {
      title: "角色名称",
      dataIndex: "roleName",
      width: 180
    },
    { title: "角色代码", dataIndex: "roleCode", width: 180 },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (value: AdminRoleStatus) => value === 1
        ? <StatusPill tone="success">正常</StatusPill>
        : <StatusPill tone="neutral">已停用</StatusPill>
    },
    { title: "关联账号", dataIndex: "userCount", width: 110, render: (value: number) => `${value} 个` },
    {
      title: "菜单权限",
      key: "permission",
      width: 110,
      render: (_: unknown, role: AdminRoleItem) => (
        <Button type="link" onClick={() => void openPermissions(role)}>查看权限</Button>
      )
    },
    { title: "创建时间", dataIndex: "createdAt", width: 180, render: formatTime },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, role: AdminRoleItem) => role.systemRole ? null : (
        <Space>
          <Button type="link" onClick={() => openEdit(role)}>编辑</Button>
          <Tooltip title={role.userCount > 0 ? "请先解除该角色关联的账号" : undefined}>
            <Button type="link" danger onClick={() => removeRole(role)}>删除</Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="角色管理"
        description="管理后台角色、启停状态及其可见菜单权限。"
        actions={<Button type="primary" onClick={openCreate}>新增角色</Button>}
      />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <Input.Search
            allowClear
            placeholder="搜索角色名称或编码"
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "全部状态" },
              { value: 1, label: "正常" },
              { value: 2, label: "已停用" }
            ]}
          />
          <Button className="toolbar-refresh" loading={loading} onClick={() => void load()}>刷新</Button>
        </div>
        <Table<AdminRoleItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无角色" /> }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 个角色` }}
          scroll={{ x: 950 }}
        />
      </section>

      <Modal
        title={editing ? `编辑角色 · ${editing.roleName}` : "新增角色"}
        open={editorOpen}
        confirmLoading={saving}
        onOk={() => void saveRole()}
        onCancel={() => setEditorOpen(false)}
        okText={editing ? "保存修改" : "创建角色"}
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="roleCode"
            label="角色编码"
            extra="保存后不可修改，例如 CONTENT_EDITOR。"
            rules={[
              { required: true, message: "请输入角色编码" },
              { min: 2, max: 64, message: "角色编码长度为 2–64 位" },
              { pattern: /^[A-Z][A-Z0-9_]+$/, message: "只能包含大写字母、数字和下划线，并以字母开头" }
            ]}
          >
            <Input
              disabled={Boolean(editing)}
              placeholder="CONTENT_EDITOR"
              onChange={(event) => form.setFieldValue("roleCode", event.target.value.toUpperCase())}
            />
          </Form.Item>
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true, message: "请输入角色名称" }]}>
            <Input maxLength={64} placeholder="内容运营" />
          </Form.Item>
          <Form.Item name="status" label="角色状态" rules={[{ required: true, message: "请选择角色状态" }]}>
            <Select options={[{ value: 1, label: "正常" }, { value: 2, label: "停用" }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`查看菜单权限${permissionRole ? ` · ${permissionRole.roleName}` : ""}`}
        open={Boolean(permissionRole)}
        width={640}
        okText="保存权限"
        cancelText={permissionRole?.systemRole ? "关闭" : "取消"}
        okButtonProps={{ disabled: permissionRole?.systemRole || permissionLoading }}
        confirmLoading={permissionSaving}
        onOk={() => void savePermissions()}
        onCancel={() => setPermissionRole(undefined)}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          message={permissionRole?.systemRole ? "超级管理员默认拥有全部菜单" : "菜单可见即代表拥有该模块操作权限"}
          description="选中子菜单时系统会自动保留其父菜单；权限保存后，对应角色的侧边栏将动态更新。"
        />
        {permissionLoading ? (
          <div className="permission-loading"><Spin /></div>
        ) : permissionTree.length ? (
          <Tree
            className="role-permission-tree"
            checkable
            disabled={permissionRole?.systemRole}
            defaultExpandAll
            selectable={false}
            checkedKeys={checkedKeys}
            treeData={permissionTree}
            onCheck={(keys) => setCheckedKeys(keys as React.Key[])}
          />
        ) : <Empty description="暂无可配置菜单" />}
      </Modal>
    </>
  );
}

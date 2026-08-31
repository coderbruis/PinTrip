import { Button, Form, Input, InputNumber, Modal, Select, Space, Spin, Table, Tag, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { AppIcon, type IconName } from "../components/AppIcon";
import { PageHeader } from "../components/PageHeader";
import {
  createMenu,
  deleteMenu,
  getMenuManagementData,
  updateMenu,
  type MenuDefinition,
  type MenuManagementData,
  type MenuPayload
} from "../services/adminMenusApi";

const iconOptions: Array<{ value: IconName; label: string }> = [
  { value: "menu", label: "菜单" },
  { value: "settings", label: "设置" },
  { value: "dashboard", label: "看板" },
  { value: "users", label: "用户" },
  { value: "roles", label: "角色/权限" },
  { value: "logs", label: "日志" },
  { value: "knowledge", label: "知识库" },
  { value: "imports", label: "导入" },
  { value: "tasks", label: "任务" },
  { value: "prompts", label: "Prompt" }
];

const supportedIcons = new Set(iconOptions.map((item) => item.value));

function iconName(value: string): IconName {
  return supportedIcons.has(value as IconName) ? value as IconName : "menu";
}

type MenuFormValues = MenuPayload & { key: string };
type MenuTableItem = MenuDefinition & { children?: MenuTableItem[] };

export function MenuManagementPage({ onPermissionsChanged }: { onPermissionsChanged: () => void }) {
  const [form] = Form.useForm<MenuFormValues>();
  const [data, setData] = useState<MenuManagementData>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MenuDefinition>();
  const parentKey = Form.useWatch("parentKey", form);

  const load = async () => {
    setLoading(true);
    try {
      setData(await getMenuManagementData());
    } catch (error) {
      message.error(error instanceof Error ? error.message : "菜单数据加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rootMenus = useMemo(
    () => data?.menus.filter((menu) => !menu.parentKey && menu.key !== editing?.key) ?? [],
    [data, editing]
  );

  const menuTableData = useMemo<MenuTableItem[]>(() => {
    if (!data) return [];
    const roots = data.menus.filter((menu) => !menu.parentKey);
    const rootKeys = new Set(roots.map((menu) => menu.key));
    const tree = roots.map((root) => {
      const children = data.menus.filter((menu) => menu.parentKey === root.key);
      return { ...root, children: children.length ? children : undefined };
    });
    const orphans = data.menus.filter((menu) => menu.parentKey && !rootKeys.has(menu.parentKey));
    return [...tree, ...orphans];
  }, [data]);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ icon: "menu", sortOrder: 100, parentKey: null });
    setEditorOpen(true);
  };

  const openEdit = (menu: MenuDefinition) => {
    setEditing(menu);
    form.setFieldsValue({
      key: menu.key,
      parentKey: menu.parentKey,
      label: menu.label,
      hint: menu.hint,
      icon: menu.icon,
      route: menu.route,
      sortOrder: menu.sortOrder
    });
    setEditorOpen(true);
  };

  const saveMenu = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: MenuPayload = {
        parentKey: values.parentKey || null,
        label: values.label,
        hint: values.hint,
        icon: values.icon,
        route: values.parentKey ? values.route || null : null,
        sortOrder: values.sortOrder
      };
      const result = editing
        ? await updateMenu(editing.key, payload)
        : await createMenu({ ...payload, key: values.key });
      setData(result);
      setEditorOpen(false);
      onPermissionsChanged();
      message.success(editing ? "菜单已更新" : "菜单已创建");
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMenu = (menu: MenuDefinition) => {
    Modal.confirm({
      title: `删除菜单“${menu.label}”？`,
      content: menu.parentKey
        ? "删除后，该菜单会立即从侧边栏及角色权限中移除。"
        : "一级菜单下仍有子菜单时不能删除，请先删除或移动子菜单。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          const result = await deleteMenu(menu.key);
          setData(result);
          onPermissionsChanged();
          message.success("菜单已删除");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "菜单删除失败");
          throw error;
        }
      }
    });
  };

  const columns = [
    {
      title: "菜单名称",
      key: "menu",
      render: (_: unknown, menu: MenuDefinition) => (
        <div className="menu-definition-title">
          <span className="menu-icon-preview"><AppIcon name={iconName(menu.icon)} /></span>
          <strong>{menu.label}</strong>
        </div>
      )
    },
    { title: "菜单代码", dataIndex: "key", width: 150 },
    {
      title: "层级",
      dataIndex: "parentKey",
      width: 180,
      render: (value: string | null) => value
        ? <Tag>{data?.menus.find((menu) => menu.key === value)?.label ?? value}</Tag>
        : <Tag color="purple">一级菜单</Tag>
    },
    { title: "说明", dataIndex: "hint" },
    { title: "图标", dataIndex: "icon", width: 110 },
    { title: "路由", dataIndex: "route", width: 150, render: (value: string | null) => value || "—" },
    { title: "排序", dataIndex: "sortOrder", width: 80 },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_: unknown, menu: MenuDefinition) => (
        <Space>
          <Button type="link" onClick={() => openEdit(menu)}>编辑</Button>
          <Button type="link" danger onClick={() => removeMenu(menu)}>删除</Button>
        </Space>
      )
    }
  ];

  const menuConfiguration = loading ? (
    <div className="permission-loading"><Spin /></div>
  ) : (
    <>
      <div className="menu-management-toolbar">
        <div>
          <b>菜单配置</b>
          <small>维护侧边栏标题、图标、父级关系和显示顺序</small>
        </div>
        <Button type="primary" onClick={openCreate}>新增菜单</Button>
      </div>
      <Table<MenuTableItem>
        rowKey="key"
        columns={columns}
        dataSource={menuTableData}
        expandable={{ defaultExpandAllRows: true, indentSize: 28 }}
        pagination={false}
        scroll={{ x: 1100 }}
      />
    </>
  );

  return (
    <>
      <PageHeader
        title="菜单管理"
        description="维护后台菜单的标题、图标、父级关系、页面路由和显示顺序。"
      />
      <section className="panel permission-panel menu-management-panel">
        {menuConfiguration}
      </section>

      <Modal
        title={editing ? "编辑菜单" : "新增菜单"}
        open={editorOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={() => void saveMenu()}
        onCancel={() => setEditorOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="menu-editor-form">
          <Form.Item
            label="菜单标识"
            name="key"
            extra="保存后不可修改，用于路由和权限判断，例如 reports。"
            rules={[
              { required: true, message: "请输入菜单标识" },
              { pattern: /^[a-z][a-z0-9-]{1,63}$/, message: "使用至少 2 位小写字母、数字或短横线，并以字母开头" }
            ]}
          >
            <Input disabled={Boolean(editing)} placeholder="reports" />
          </Form.Item>
          <div className="form-grid">
            <Form.Item label="菜单标题" name="label" rules={[{ required: true, message: "请输入菜单标题" }]}>
              <Input maxLength={64} placeholder="数据报表" />
            </Form.Item>
            <Form.Item label="图标" name="icon" rules={[{ required: true, message: "请选择图标" }]}>
              <Select
                options={iconOptions.map((option) => ({
                  value: option.value,
                  label: <Space><AppIcon name={option.value} size={16} />{option.label}</Space>
                }))}
              />
            </Form.Item>
          </div>
          <Form.Item label="菜单说明" name="hint" rules={[{ required: true, message: "请输入菜单说明" }]}>
            <Input maxLength={128} placeholder="显示在侧边栏标题下方" />
          </Form.Item>
          <div className="form-grid">
            <Form.Item label="父级菜单" name="parentKey">
              <Select
                allowClear
                placeholder="无，作为一级菜单"
                options={rootMenus.map((menu) => ({ value: menu.key, label: menu.label }))}
              />
            </Form.Item>
            <Form.Item label="显示顺序" name="sortOrder" rules={[{ required: true, message: "请输入显示顺序" }]}>
              <InputNumber min={0} max={9999} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item
            label="页面路由"
            name="route"
            extra={parentKey ? "留空时自动使用 #/菜单标识。" : "一级菜单只用于分组，不需要页面路由。"}
          >
            <Input disabled={!parentKey} maxLength={128} placeholder="#/reports" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

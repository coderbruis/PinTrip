export default function HomePage() {
  return (
    <main className="workspace">
      <aside className="sidebar">
        <h1>拾途 PinTrip</h1>
        <button>新建旅行</button>
      </aside>
      <section className="content">
        <header>
          <p className="eyebrow">旅行工作台</p>
          <h2>把灵感变成可执行攻略</h2>
        </header>
        <div className="panel">
          <p>这里将展示小红书素材、AI 生成配置、攻略编辑器和路线视图。</p>
        </div>
      </section>
    </main>
  );
}

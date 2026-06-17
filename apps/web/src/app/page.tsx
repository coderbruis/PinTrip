import { UserMenu } from "./UserMenu";

const tabLabels = ["川西周末", "海岛松弛", "城市漫游", "亲子轻徒步", "毕业旅行", "避暑路线"];

const trips = [
  {
    title: "成都出发三天两晚",
    meta: "川西环线 · 自驾 · 18 条灵感",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    tags: ["日照金山", "咖啡窗景", "低强度"],
    stats: "3 天 · 9 个点位 · 人均 1480"
  },
  {
    title: "万宁冲浪与海边咖啡",
    meta: "海南 · 朋友出行 · 12 条灵感",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    tags: ["冲浪课", "海鲜市场", "落日公路"],
    stats: "4 天 · 11 个点位 · 人均 2300"
  },
  {
    title: "东京第一次自由行",
    meta: "城市漫游 · 购物拍照 · 21 条灵感",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80",
    tags: ["地铁友好", "中古店", "夜景"],
    stats: "5 天 · 18 个点位 · 人均 6800"
  },
  {
    title: "杭州亲子自然观察",
    meta: "江浙沪 · 亲子 · 8 条灵感",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    tags: ["博物馆", "湿地", "少走路"],
    stats: "2 天 · 6 个点位 · 人均 900"
  }
];

const imports = [
  { title: "姑弄村岗日噶玛咖啡厅", status: "已抽取 6 个点位" },
  { title: "甲根坝纳梯村避堵路线", status: "等待合并" },
  { title: "格底拉姆天空之城门票", status: "已加入预算" }
];

export default function HomePage() {
  return (
    <main className="home-shell">
      <nav className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">P</span>
          <span>拾途 PinTrip</span>
        </a>
        <div className="nav-links">
          <a href="#">灵感库</a>
          <a href="#">我的攻略</a>
          <a href="#">地图路线</a>
          <a href="#">模板</a>
        </div>
        <div className="nav-actions">
          <button className="ghost-button">导入记录</button>
          <button className="dark-button">新建行程</button>
          <UserMenu />
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI Travel Workspace</p>
          <h1>把旅行灵感整理成一份能直接出发的攻略</h1>
          <p className="hero-subtitle">
            小红书笔记、收藏点位、预算偏好和同行需求会被整理成路线、时间表和可编辑攻略。
          </p>
        </div>

        <form className="import-bar">
          <span className="import-label">小红书 URL</span>
          <input aria-label="小红书链接" placeholder="https://www.xiaohongshu.com/explore/..." />
          <button type="button">导入灵感</button>
        </form>

        <div className="quick-tags" aria-label="热门旅行标签">
          {tabLabels.map((label) => (
            <a key={label} href="#">
              {label}
            </a>
          ))}
        </div>
      </section>

      <section className="workspace-grid">
        <div className="main-feed">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Explore</p>
              <h2>灵感路线</h2>
            </div>
            <button className="ghost-button">查看全部</button>
          </div>

          <div className="tabs">
            <input defaultChecked id="tab-domestic" name="trip-tab" type="radio" />
            <input id="tab-abroad" name="trip-tab" type="radio" />
            <input id="tab-west-sichuan" name="trip-tab" type="radio" />
            <input id="tab-seaside" name="trip-tab" type="radio" />
            <input id="tab-rainforest" name="trip-tab" type="radio" />
            <input id="tab-grassland" name="trip-tab" type="radio" />

            <div className="tab-list" role="tablist" aria-label="攻略分类">
              <label htmlFor="tab-domestic">国内</label>
              <label htmlFor="tab-abroad">国外</label>
              <label htmlFor="tab-west-sichuan">川西</label>
              <label htmlFor="tab-seaside">海边</label>
              <label htmlFor="tab-rainforest">雨林</label>
              <label htmlFor="tab-grassland">草原</label>
            </div>

            <div className="tab-panel domestic-panel">
              <div className="trip-card-grid">
                {trips.map((trip) => (
                  <article className="trip-card" key={trip.title}>
                    <div className="trip-image" style={{ backgroundImage: `url(${trip.image})` }} />
                    <div className="trip-body">
                      <p>{trip.meta}</p>
                      <h3>{trip.title}</h3>
                      <div className="card-tags">
                        {trip.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <strong>{trip.stats}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="tab-panel abroad-panel">
              <div className="trip-card-grid">
                {[trips[2], trips[1]].map((trip) => (
                  <article className="trip-card" key={trip.title}>
                    <div className="trip-image" style={{ backgroundImage: `url(${trip.image})` }} />
                    <div className="trip-body">
                      <p>{trip.meta}</p>
                      <h3>{trip.title}</h3>
                      <div className="card-tags">
                        {trip.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <strong>{trip.stats}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="tab-panel west-sichuan-panel">
              <div className="trip-card-grid">
                {[trips[0]].map((trip) => (
                  <article className="trip-card" key={trip.title}>
                    <div className="trip-image" style={{ backgroundImage: `url(${trip.image})` }} />
                    <div className="trip-body">
                      <p>{trip.meta}</p>
                      <h3>{trip.title}</h3>
                      <div className="card-tags">
                        {trip.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <strong>{trip.stats}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="tab-panel seaside-panel">
              <div className="trip-card-grid">
                {[trips[1]].map((trip) => (
                  <article className="trip-card" key={trip.title}>
                    <div className="trip-image" style={{ backgroundImage: `url(${trip.image})` }} />
                    <div className="trip-body">
                      <p>{trip.meta}</p>
                      <h3>{trip.title}</h3>
                      <div className="card-tags">
                        {trip.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <strong>{trip.stats}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="tab-panel rainforest-panel">
              <div className="list-panel">
                <article className="generation-preview">
                  <p className="eyebrow">Rainforest</p>
                  <h3>西双版纳雨林慢游</h3>
                  <p>适合做成热带植物园、夜市和村寨体验组合路线。</p>
                </article>
              </div>
            </div>

            <div className="tab-panel grassland-panel">
              <div className="list-panel">
                <article className="generation-preview">
                  <p className="eyebrow">Grassland</p>
                  <h3>呼伦贝尔夏季草原</h3>
                  <p>适合做成亲子、自驾、轻户外和摄影主题路线。</p>
                </article>
              </div>
            </div>
          </div>
        </div>

        <aside className="floating-assistant" aria-label="AI 攻略助手">
          <div className="rail-handle">
            <span>AI</span>
            <strong>攻略助手</strong>
          </div>
          <section className="rail-section">
            <p className="eyebrow">Today</p>
            <h2>AI 攻略助手</h2>
            <div className="queue-item">
              <span>01</span>
              <div>
                <h3>整理灵感</h3>
                <p>从 3 篇笔记识别出 14 个候选地点</p>
              </div>
            </div>
            <div className="queue-item">
              <span>02</span>
              <div>
                <h3>安排行程</h3>
                <p>按自驾、轻松拍照、少爬山约束排序</p>
              </div>
            </div>
            <div className="queue-item">
              <span>03</span>
              <div>
                <h3>生成攻略</h3>
                <p>生成每日安排、预算和避坑提醒</p>
              </div>
            </div>
          </section>

          <section className="map-card">
            <div className="map-pin pin-a" />
            <div className="map-pin pin-b" />
            <div className="map-pin pin-c" />
            <div className="route-line" />
            <h2>Route Preview</h2>
            <p>成都 · 新都桥 · 甲根坝</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

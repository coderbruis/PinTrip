const profileTags = ["四川成都", "程序员", "自驾旅行", "攻略分享", "轻徒步"];

const stats = [
  { label: "关注", value: "63" },
  { label: "粉丝", value: "248" },
  { label: "获赞", value: "1,151" },
  { label: "收藏", value: "326" }
];

const myGuides = [
  {
    title: "普通人自学摄影一年，从川西开始记录风景",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    meta: "川西 · 摄影 · 自驾",
    likes: "274",
    collections: "68"
  },
  {
    title: "成都出发三天两晚，低强度看日照金山",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    meta: "新都桥 · 甲根坝 · 咖啡窗景",
    likes: "189",
    collections: "53"
  },
  {
    title: "国庆川西路线导航攻略",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80",
    meta: "避堵 · 导航 · 住宿",
    likes: "97",
    collections: "41"
  }
];

const savedGuides = [
  "万宁冲浪与海边咖啡",
  "东京第一次自由行路线",
  "杭州亲子自然观察",
  "呼伦贝尔夏季草原"
];

const likedGuides = [
  "成都飞亚庇自由行攻略",
  "西双版纳雨林慢游",
  "上海周末城市漫游",
  "大理无车旅行地图"
];

export default function ProfilePage() {
  return (
    <main className="profile-shell">
      <nav className="topbar">
        <a className="brand" href="/">
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
          <a className="ghost-button" href="/">
            返回首页
          </a>
          <button className="dark-button">新建行程</button>
        </div>
      </nav>

      <section className="profile-hero">
        <div className="profile-avatar" aria-label="林小满的头像">
          <span>林</span>
        </div>

        <div className="profile-summary">
          <p className="eyebrow">Travel Creator</p>
          <h1>林小满</h1>
          <p className="profile-note">
            成漂旅行记录者，喜欢把收藏夹里的灵感整理成能直接出发的路线。
          </p>

          <div className="profile-tags" aria-label="个人标签">
            {profileTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="profile-stats" aria-label="账号数据">
            {stats.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-tabs">
        <input defaultChecked id="profile-my" name="profile-tab" type="radio" />
        <input id="profile-saved" name="profile-tab" type="radio" />
        <input id="profile-liked" name="profile-tab" type="radio" />

        <div className="profile-tab-list" role="tablist" aria-label="攻略分类">
          <label htmlFor="profile-my">我的攻略</label>
          <label htmlFor="profile-saved">收藏攻略</label>
          <label htmlFor="profile-liked">点赞攻略</label>
        </div>

        <div className="profile-panel profile-my-panel">
          <div className="profile-guide-grid">
            {myGuides.map((guide) => (
              <article className="profile-guide-card" key={guide.title}>
                <div className="profile-guide-image" style={{ backgroundImage: `url(${guide.image})` }} />
                <div className="profile-guide-body">
                  <p>{guide.meta}</p>
                  <h2>{guide.title}</h2>
                  <div className="profile-guide-stats">
                    <span>♥ {guide.likes}</span>
                    <span>收藏 {guide.collections}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="profile-panel profile-saved-panel">
          <div className="profile-tag-board">
            {savedGuides.map((guide) => (
              <a key={guide} href="#">
                {guide}
              </a>
            ))}
          </div>
        </div>

        <div className="profile-panel profile-liked-panel">
          <div className="profile-tag-board liked-board">
            {likedGuides.map((guide) => (
              <a key={guide} href="#">
                {guide}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

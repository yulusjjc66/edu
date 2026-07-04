(function (global) {
  const SESSION_PASSWORD_KEY = "littleLearnerAdminPassword";
  const DEFAULT_PASSWORD = "1234";

  const SUBJECTS = [
    { id: "english", name: "英语乐园", icon: "🌍" },
    { id: "math", name: "数学乐园", icon: "🔢" },
    { id: "chinese", name: "语文乐园", icon: "📖" },
  ];

  const DEFAULT_GAMES = [
    {
      id: "en-1",
      subject: "english",
      emoji: "🔤",
      badge: "⏱ 每日 5 分钟 · 需联网",
      title: "自然拼读打卡游戏",
      description: "每天练一练自然拼读，打卡闯关，越玩越熟练！",
      url: "https://www.coze.cn/s/xtcdobr_1tM/",
    },
    {
      id: "en-2",
      subject: "english",
      emoji: "📚",
      badge: "📖 1-6 单元 · 需联网",
      title: "英语单词闯关",
      description: "课本 1-6 单元单词，边玩边记，巩固课堂所学！",
      url: "https://www.coze.cn/s/uoGHxGPwfDA/",
    },
    {
      id: "math-1",
      subject: "math",
      emoji: "🎈",
      badge: "📦 本地可玩",
      title: "口算大闯关",
      description: "点击正确答案气球，简单/普通/挑战三种难度，越玩越熟练！",
      url: "/games-local/kousuan.html",
    },
    {
      id: "cn-1",
      subject: "chinese",
      emoji: "✏️",
      badge: "⏱ 约 2 分钟 · 需联网",
      title: "常考词语",
      description: "常考词语快问快答，2 分钟搞定，考试不慌！",
      url: "https://www.coze.cn/s/TDJLzbYg2-k/",
    },
    {
      id: "cn-2",
      subject: "chinese",
      emoji: "🖼️",
      badge: "⏱ 约 5 分钟 · 需联网",
      title: "看图写话",
      description: "看图片发挥想象，练习写话，把故事说出来！",
      url: "https://www.coze.cn/s/SGGIH0nA5rM/",
    },
    {
      id: "cn-3",
      subject: "chinese",
      emoji: "📜",
      badge: "⏱ 约 2 分钟 · 需联网",
      title: "古诗词针对练习",
      description: "古诗词专项小练，2 分钟巩固，背得又牢又熟！",
      url: "https://www.coze.cn/s/m-G6zY8Xdd8/",
    },
    {
      id: "cn-4",
      subject: "chinese",
      emoji: "🏘️",
      badge: "⏱ 约 10 分钟 · 需联网",
      title: "汉字小镇闯关",
      description: "语文基础知识大闯关，汉字小镇等你来探险！",
      url: "https://static.coze.site/2099396689798396_0-data_volume/7655591592882864403-files/%E6%89%80%E6%9C%89%E5%AF%B9%E8%AF%9D/%E4%B8%BB%E5%AF%B9%E8%AF%9D/%E6%B1%89%E5%AD%97%E5%B0%8F%E9%95%87%E9%97%AF%E5%85%B3%E6%B8%B8%E6%88%8F.html?sign=1785478772-e3fd77cf76-0-b2c501b44ce52e0e2b349991e35d7e841a85f34411775f6ff7fd6357a4fabc50",
    },
  ];

  function cloneDefaults() {
    return DEFAULT_GAMES.map(function (g) { return Object.assign({}, g); });
  }

  function generateId() {
    return "game-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function getStoredPassword() {
    return sessionStorage.getItem(SESSION_PASSWORD_KEY) || "";
  }

  function setStoredPassword(password) {
    if (password) {
      sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
    } else {
      sessionStorage.removeItem(SESSION_PASSWORD_KEY);
    }
  }

  function apiHeaders(password) {
    const headers = { "Content-Type": "application/json" };
    const pw = password || getStoredPassword();
    if (pw) headers["X-Admin-Password"] = pw;
    return headers;
  }

  function apiUrl(path) {
    return path.replace(/^\//, "");
  }

  async function loadGames() {
    try {
      const res = await fetch(apiUrl("/api/games"));
      if (!res.ok) throw new Error("load failed");
      const games = await res.json();
      if (!Array.isArray(games) || games.length === 0) return cloneDefaults();
      return games;
    } catch (_) {
      return cloneDefaults();
    }
  }

  async function saveGames(games, password) {
    const res = await fetch(apiUrl("/api/games"), {
      method: "PUT",
      headers: apiHeaders(password),
      body: JSON.stringify(games),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "保存失败");
    return data;
  }

  async function authPassword(password) {
    const res = await fetch(apiUrl("/api/auth"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    });
    return res.ok;
  }

  async function changePassword(newPassword, currentPassword) {
    const res = await fetch(apiUrl("/api/password"), {
      method: "PUT",
      headers: apiHeaders(currentPassword),
      body: JSON.stringify({ newPassword: newPassword }),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "修改密码失败");
    return data;
  }

  async function resetGames(password) {
    const res = await fetch(apiUrl("/api/games/reset"), {
      method: "POST",
      headers: apiHeaders(password),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "恢复默认失败");
    return data.games || cloneDefaults();
  }

  function getSubject(id) {
    return SUBJECTS.find(function (s) { return s.id === id; });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderGameCard(game) {
    return (
      '<article class="game-card ' + escapeHtml(game.subject) + '">' +
        '<div class="card-emoji">' + escapeHtml(game.emoji || "🎮") + '</div>' +
        '<div class="card-content">' +
          '<h3>' + escapeHtml(game.title) + '</h3>' +
          '<span class="card-badge">' + escapeHtml(game.badge || "🌐 需联网") + '</span>' +
          '<p class="card-desc">' + escapeHtml(game.description) + '</p>' +
        '</div>' +
        '<a class="play-btn" href="' + escapeHtml(game.url) + '" target="_blank" rel="noopener noreferrer">去玩 →</a>' +
      '</article>'
    );
  }

  function renderSubjects(games, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = SUBJECTS.map(function (subject) {
      const items = games.filter(function (g) { return g.subject === subject.id; });
      const cards = items.length
        ? items.map(renderGameCard).join("")
        : '<p class="empty-hint">暂无游戏，请到<a href="admin.html">管理后台</a>添加</p>';

      return (
        '<section class="subject-section" id="' + subject.id + '">' +
          '<div class="section-header ' + subject.id + '">' +
            '<span class="section-icon">' + subject.icon + '</span>' +
            '<h2>' + subject.name + '</h2>' +
          '</div>' +
          '<div class="card-grid">' + cards + '</div>' +
        '</section>'
      );
    }).join("");

    container.innerHTML = html;
  }

  global.GamesData = {
    SESSION_PASSWORD_KEY: SESSION_PASSWORD_KEY,
    DEFAULT_PASSWORD: DEFAULT_PASSWORD,
    SUBJECTS: SUBJECTS,
    DEFAULT_GAMES: DEFAULT_GAMES,
    generateId: generateId,
    loadGames: loadGames,
    saveGames: saveGames,
    resetGames: resetGames,
    authPassword: authPassword,
    changePassword: changePassword,
    getStoredPassword: getStoredPassword,
    setStoredPassword: setStoredPassword,
    getSubject: getSubject,
    escapeHtml: escapeHtml,
    renderGameCard: renderGameCard,
    renderSubjects: renderSubjects,
  };
})(window);

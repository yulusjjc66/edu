const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const GAMES_FILE = path.join(ROOT, "games.json");
const DEFAULT_GAMES_FILE = path.join(ROOT, "games.default.json");
const CONFIG_FILE = path.join(ROOT, "config.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(ROOT));

async function readConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    const fallback = { adminPassword: "1234" };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

async function readGames() {
  const raw = await fs.readFile(GAMES_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeGames(games) {
  await fs.writeFile(GAMES_FILE, JSON.stringify(games, null, 2), "utf8");
}

async function readDefaultGames() {
  const raw = await fs.readFile(DEFAULT_GAMES_FILE, "utf8");
  return JSON.parse(raw);
}

function validateGames(games) {
  if (!Array.isArray(games)) return false;
  return games.every(function (g) {
    return g && g.id && g.subject && g.title && g.url;
  });
}

async function isAuthorized(req) {
  const config = await readConfig();
  const password = req.headers["x-admin-password"];
  return Boolean(password && password === config.adminPassword);
}

app.get("/api/games", async function (_req, res) {
  try {
    const games = await readGames();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: "读取 games.json 失败" });
  }
});

app.put("/api/games", async function (req, res) {
  if (!(await isAuthorized(req))) {
    return res.status(401).json({ error: "密码错误或未登录" });
  }
  if (!validateGames(req.body)) {
    return res.status(400).json({ error: "数据格式不正确" });
  }
  try {
    await writeGames(req.body);
    res.json({ ok: true, count: req.body.length });
  } catch (err) {
    res.status(500).json({ error: "写入 games.json 失败" });
  }
});

app.post("/api/auth", async function (req, res) {
  const config = await readConfig();
  if (req.body && req.body.password === config.adminPassword) {
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "密码错误" });
});

app.put("/api/password", async function (req, res) {
  if (!(await isAuthorized(req))) {
    return res.status(401).json({ error: "密码错误或未登录" });
  }
  const newPassword = req.body && req.body.newPassword;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "新密码至少 4 位" });
  }
  try {
    const config = await readConfig();
    config.adminPassword = newPassword;
    await writeConfig(config);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "更新密码失败" });
  }
});

app.post("/api/games/reset", async function (req, res) {
  if (!(await isAuthorized(req))) {
    return res.status(401).json({ error: "密码错误或未登录" });
  }
  try {
    const defaults = await readDefaultGames();
    await writeGames(defaults);
    res.json({ ok: true, games: defaults });
  } catch (err) {
    res.status(500).json({ error: "恢复默认失败" });
  }
});

app.listen(PORT, function () {
  console.log("小小学习乐园已启动: http://localhost:" + PORT);
  console.log("管理后台: http://localhost:" + PORT + "/admin.html");
  console.log("数据文件: games.json");
});

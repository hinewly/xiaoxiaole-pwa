# xiaoxiaole-pwa（消消乐）

DaoBox 家族第 8 个子应用，纯**娱乐休闲**三消小游戏（水果主题）。

- 国内站：https://xiaoxiaole.daobox.net.cn
- 海外站：xiaoxiaole.daobox.app（worker 配置已备好，暂缓部署）
- 统一账号 / 时长体系：portal.js（游客 30 分钟/天、注册 60 分钟/天）

## 玩法

点选（或拖动）两个相邻水果交换位置，凑齐 3 个及以上同类水果即可消除得分；上方水果下落补位，连锁消除（Combo）加分翻倍。支持撤销一步、最高分记录、死局自动洗牌、进度本机保存、PWA 离线缓存。

## 结构

```
xiaoxiaole-pwa/
├── public/         # 前端（index/style/app/manifest/sw/icons）
├── worker/         # Cloudflare Worker（海外：纯静态 ASSETS 托管，暂缓部署）
├── server/         # 国内阿里云 Node 静态服务器（端口 8796）
└── docs/handoff/   # 交接文档
```

## 部署

- 国内：`rsync -a --delete --exclude node_modules --exclude data --exclude .env public server root@47.108.83.209:/opt/xiaoxiaole-pwa/ && ssh root@47.108.83.209 'systemctl restart xiaoxiaole-pwa'`
- 海外（暂缓）：`wrangler deploy`

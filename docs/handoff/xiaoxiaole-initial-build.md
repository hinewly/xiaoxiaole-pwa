# 消消乐（xiaoxiaole-pwa）初始开发 交接

- last_updated: 2026-10-26 00:45
- status: active
- version: v0.1.0

## 任务目标

DaoBox 家族第 8 个子应用：纯娱乐休闲「消消乐」水果三消小游戏，全中文，国内优先上线（用户 2026-10-26 拍板：直接部署国内站，海外等国内跑通后再移）。

## 当前状态

✅ 国内站已上线 + 首页入口已接通：DNS + HTTPS + E2E 全部通过，daobox-home 首页娱乐区「消消乐」卡片上线（v1.4.7-audit，net.cn 自动指向国内域，实测跳转 OK）。

## 最近完成

- 游戏本体：8x8 棋盘、6 种水果（🍉🍓🍇🍋🍑🍒）、相邻交换（点选 + 拖动双输入）、3 连及以上消除、重力下落补位、连锁 Combo（每层 ×1/×2/×3… 计分：水果数 × 10 × combo 层）、死局自动洗牌、撤销一步、分数/最高分、进度 localStorage 自动保存
- 交互：点选高亮 + 相邻确认交换；拖动（>18px）直接换；无消除自动换回 + 抖动动画；消除 pop-out、下落 drop-in、交换 bump、得分飘字、toast 提示
- 家族接入：DB_HOME 双域名适配、portal.js data-app="xiaoxiaole"、daobox:timeexceeded 超时锁、联系邮箱运行时拼接、顶栏版本号 + 刷新按钮
- PWA：manifest + SW（dbxxl-v1）+ 全套图标（PIL 生成，绿底三水果圆）
- worker：纯静态 ASSETS 托管 + wrangler.toml（xiaoxiaole.daobox.app 备用，未部署）
- 服务器端：server/node-server.mjs 端口 8796（suan 8788/shici 8790/cymys 8791/aoshu 8792/sudoku 8793/gomoku 8794/2048 8795 之后）
- 部署完成：rsync → /opt/xiaoxiaole-pwa、systemd xiaoxiaole-pwa（enabled/active）、Caddy xiaoxiaole.daobox.net.cn → 8796、HTTPS 证书签发成功
- DNS：A 记录 xiaoxiaole → 47.108.83.209（阿里云控制台浏览器操作，用户配合短信验证码登录）
- 线上 E2E 实测：全资源 200、portal.js 游客胶囊（剩 14 分）、真实点击消除 +30 分（3×10×1）、无效交换自动换回、撤销回退（分数归 0 最高分保留）、localStorage 保存/恢复、游客 /api/me 401 属正常

## 待办

- [x] 国内部署：rsync 至 /opt/xiaoxiaole-pwa + systemd（端口 8796）+ Caddy（2026-10-26 00:24）
- [x] DNS：A 记录 xiaoxiaole → 47.108.83.209（2026-10-26 00:28）
- [x] 线上 E2E：https://xiaoxiaole.daobox.net.cn 全资源 200 + portal.js 正常 + 真实消除/撤销实测（2026-10-26 00:32）
- [x] daobox-home 首页入口上线（v1.4.7-audit，仅 rsync public 避开其他任务未提交的 worker 改动，commit 4a2559f）
- [ ] 手机实测：点选/拖动交换、连锁动画、撤销、洗牌、加主屏幕、离线
- [x] daobox-home 首页娱乐区加「消消乐」入口（2026-10-26 用户确认后执行，commit 4a2559f，已部署实测）
- [ ] 海外部署（暂缓）：xiaoxiaole.daobox.app

## 重要决策

- 目录名 xiaoxiaole-pwa（用户拍板：拼音比 match3-pwa 清晰）；data-app="xiaoxiaole"；端口 8796
- 元素用水果 emoji（用户拍板），无需图片素材
- 无限模式（不计关卡），死局自动洗牌不判负；撤销仅一步防刷分
- 娱乐类不进 CHECKIN_APPS 打卡名单，与 2048 口径一致
- 海外 worker 配置就绪但不部署，等国内跑通后用户再拍板

## 注意事项

- 计分规则：本次消除水果数 × 10 × 连锁层数，简单直观，后续调参改 resolveMatches()
- SW 缓存键 dbxxl-v1；改前端资源记得同步升 style/app 的 ?v= 和 SW CACHE
- undo 快照只在「交换成功产生消除」时记录，失败交换不留快照
- 洗牌用 newBoard() 全盘重生成（保证无初始匹配且有解），不保留原水果数量

- 仓库：https://github.com/hinewly/xiaoxiaole-pwa（public，初始 commit 091494e）

## 相关文件

- public/{index.html,style.css,app.js,manifest.json,service-worker.js,icons/}
- server/node-server.mjs · worker/{src/index.js,wrangler.toml}
- 服务器（部署后）：/opt/xiaoxiaole-pwa/（root@47.108.83.209，systemd xiaoxiaole-pwa，Caddy 8796）

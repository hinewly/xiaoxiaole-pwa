// Static assets + root EN rewrite (Fruit Match, 2026-11-13 海外英文化).
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // 根路径内部改写为英文版（无跳转、地址栏不变）；国内走 node 服务器不经此 worker
    if (/^(.*\.)?daobox\.app$/.test(url.hostname) || url.hostname === "localhost") {
      if (url.pathname === "/" || url.pathname === "") {
        const enUrl = new URL("/en/", url.origin);
        return env.ASSETS.fetch(new Request(enUrl.toString(), { headers: request.headers }));
      }
    }
    return env.ASSETS.fetch(request);
  },
};

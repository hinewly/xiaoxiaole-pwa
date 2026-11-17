// Static assets + root EN rewrite (Fruit Match, 2026-11-13 海外英文化).
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // P1(2026-11-17)：http 请求 301 到 https（等效 Cloudflare Always Use HTTPS，覆盖 assets 直出之外的域名）
    // localhost/127.x（wrangler dev）不跳
    if (url.protocol === 'http:' && url.hostname !== 'localhost' && !/^127\./.test(url.hostname)) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
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

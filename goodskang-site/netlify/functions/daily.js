// ⏰ 每天排程:呼叫 Netlify Build Hook 重建(抓最新影片與熱門股)。需在 Netlify 設定 BUILD_HOOK 環境變數(Site settings → Build & deploy → Build hooks)
exports.handler = async () => {
  const hook = process.env.BUILD_HOOK;
  if(!hook) return {statusCode: 200, body: 'BUILD_HOOK not set'};
  try{ const r = await fetch(hook, {method: 'POST'}); return {statusCode: 200, body: 'triggered ' + r.status}; }
  catch(e){ return {statusCode: 500, body: e.message}; }
};

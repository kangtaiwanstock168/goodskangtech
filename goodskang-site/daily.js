// ⏰ 每天排程:呼叫 Netlify Build Hook 重建(抓最新影片、IG 貼文與熱門股)。
// 需在 Netlify 設定 BUILD_HOOK 環境變數(Build & deploy → Build hooks);注意:新增/修改環境變數之後一定要再 Trigger deploy 一次,排程函式才讀得到
exports.handler = async () => {
  const hook = process.env.BUILD_HOOK;
  if(!hook){ console.error('[daily] BUILD_HOOK 沒設定或這個部署還沒讀到它——請到 Deploys → Trigger deploy 重新部署一次'); return {statusCode: 200, body: 'BUILD_HOOK not set'}; }
  try{ const r = await fetch(hook, {method: 'POST'}); console.log('[daily] 已觸發重建,Netlify 回應', r.status); return {statusCode: 200, body: 'triggered ' + r.status}; }
  catch(e){ console.error('[daily] 觸發失敗:', e.message); return {statusCode: 500, body: e.message}; }
};

export async function onRequest(context) {
  const { env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // Check if env vars are set
  const missing = [];
  if (!env.DB_HOST) missing.push('DB_HOST');
  if (!env.DB_USER) missing.push('DB_USER');
  if (!env.DB_PASSWORD) missing.push('DB_PASSWORD');
  if (!env.DB_NAME) missing.push('DB_NAME');

  if (missing.length > 0) {
    return new Response(JSON.stringify({
      status: 'error',
      message: '缺少环境变量：' + missing.join(', '),
      missing: missing
    }), { status: 500, headers });
  }

  return new Response(JSON.stringify({
    status: 'ok',
    message: '边缘函数运行正常',
    db: { host: env.DB_HOST, user: env.DB_USER, database: env.DB_NAME }
  }), { headers });
}

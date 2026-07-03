import mysql from 'serverless-mysql';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function getDB(env) {
  return mysql({
    config: {
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      port: Number(env.DB_PORT) || 3306,
      charset: 'utf8'
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Validate env vars
  if (!env.DB_HOST || !env.DB_USER || !env.DB_PASSWORD || !env.DB_NAME) {
    return new Response(JSON.stringify({
      code: -1,
      error: '数据库连接配置不完整，请检查环境变量 DB_HOST / DB_USER / DB_PASSWORD / DB_NAME'
    }), { status: 500, headers });
  }

  const db = getDB(env);

  try {
    // GET - List all records
    if (request.method === 'GET') {
      const rows = await db.query('SELECT * FROM we_xin ORDER BY id DESC');
      await db.end();
      return new Response(JSON.stringify({ code: 0, data: rows }), { headers });
    }

    // POST - Create record
    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (e) {
        await db.end();
        return new Response(JSON.stringify({ code: -1, error: '请求体格式错误' }), { status: 400, headers });
      }

      const { nic, xhr, say, ltd, wix, sjk, qrc, sfp, upy } = body;

      if (!nic || !(nic + '').trim()) {
        await db.end();
        return new Response(JSON.stringify({ code: -1, error: '微信昵称不能为空' }), { status: 400, headers });
      }

      const result = await db.query(
        'INSERT INTO we_xin (nic, xhr, say, ltd, wix, sjk, qrc, sfp, upy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          (nic + '').trim(),
          parseInt(xhr, 10) || 3,
          (say || '').trim(),
          ltd || '未注册',
          (wix || '').trim(),
          (sjk || '').trim(),
          (qrc || '').trim(),
          (sfp || '').trim(),
          (upy || '').trim()
        ]
      );
      await db.end();
      return new Response(JSON.stringify({
        code: 0,
        data: { id: result.insertId },
        message: '创建成功'
      }), { status: 201, headers });
    }

    await db.end();
    return new Response(JSON.stringify({ code: -1, error: 'Method Not Allowed' }), { status: 405, headers });

  } catch (err) {
    try { await db.end(); } catch (e) { /* ignore */ }
    console.error('records.js error:', err);
    return new Response(JSON.stringify({
      code: -1,
      error: err.sqlMessage || err.message || '服务器内部错误'
    }), { status: 500, headers });
  }
}

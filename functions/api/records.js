import mysql from 'mysql2/promise';

function getPool(env) {
  return mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT || 3306,
    charset: 'utf8',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const pool = getPool(env);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // GET - List all records
    if (request.method === 'GET') {
      const [rows] = await pool.query('SELECT * FROM we_xin ORDER BY id DESC');
      await pool.end();
      return new Response(JSON.stringify({ code: 0, data: rows }), { headers });
    }

    // POST - Create record
    if (request.method === 'POST') {
      const body = await request.json();
      const { nic, xhr, say, ltd, wix, sjk, qrc, sfp, upy } = body;

      if (!nic || !nic.trim()) {
        await pool.end();
        return new Response(JSON.stringify({ code: -1, error: '微信昵称不能为空' }), { status: 400, headers });
      }

      const [result] = await pool.query(
        `INSERT INTO we_xin (nic, xhr, say, ltd, wix, sjk, qrc, sfp, upy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nic.trim(),
          xhr || 3,
          (say || '').trim(),
          ltd || '未注册',
          (wix || '').trim(),
          (sjk || '').trim(),
          (qrc || '').trim(),
          (sfp || '').trim(),
          (upy || '').trim()
        ]
      );
      await pool.end();
      return new Response(JSON.stringify({ code: 0, data: { id: result.insertId }, message: '创建成功' }), { status: 201, headers });
    }

    await pool.end();
    return new Response(JSON.stringify({ code: -1, error: 'Method Not Allowed' }), { status: 405, headers });

  } catch (err) {
    try { await pool.end(); } catch (e) { /* ignore */ }
    return new Response(JSON.stringify({ code: -1, error: err.message || '服务器内部错误' }), { status: 500, headers });
  }
}

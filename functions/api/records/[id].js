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
  const { request, env, params } = context;
  const id = parseInt(params.id, 10);
  const pool = getPool(env);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!id || isNaN(id)) {
    await pool.end();
    return new Response(JSON.stringify({ code: -1, error: '无效的 ID' }), { status: 400, headers });
  }

  try {
    // GET - Get single record
    if (request.method === 'GET') {
      const [rows] = await pool.query('SELECT * FROM we_xin WHERE id = ?', [id]);
      await pool.end();
      if (rows.length === 0) {
        return new Response(JSON.stringify({ code: -1, error: '记录不存在' }), { status: 404, headers });
      }
      return new Response(JSON.stringify({ code: 0, data: rows[0] }), { headers });
    }

    // PUT - Update record
    if (request.method === 'PUT') {
      const body = await request.json();
      const { nic, xhr, say, ltd, wix, sjk, qrc, sfp, upy } = body;

      if (nic !== undefined && !nic.trim()) {
        await pool.end();
        return new Response(JSON.stringify({ code: -1, error: '微信昵称不能为空' }), { status: 400, headers });
      }

      const fields = [];
      const values = [];

      if (nic !== undefined) { fields.push('nic = ?'); values.push(nic.trim()); }
      if (xhr !== undefined) { fields.push('xhr = ?'); values.push(parseInt(xhr, 10)); }
      if (say !== undefined) { fields.push('say = ?'); values.push(say.trim()); }
      if (ltd !== undefined) { fields.push('ltd = ?'); values.push(ltd); }
      if (wix !== undefined) { fields.push('wix = ?'); values.push(wix.trim()); }
      if (sjk !== undefined) { fields.push('sjk = ?'); values.push(sjk.trim()); }
      if (qrc !== undefined) { fields.push('qrc = ?'); values.push(qrc.trim()); }
      if (sfp !== undefined) { fields.push('sfp = ?'); values.push(sfp.trim()); }
      if (upy !== undefined) { fields.push('upy = ?'); values.push(upy.trim()); }

      if (fields.length === 0) {
        await pool.end();
        return new Response(JSON.stringify({ code: -1, error: '没有要更新的字段' }), { status: 400, headers });
      }

      values.push(id);
      const [result] = await pool.query(
        `UPDATE we_xin SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      await pool.end();

      if (result.affectedRows === 0) {
        return new Response(JSON.stringify({ code: -1, error: '记录不存在' }), { status: 404, headers });
      }
      return new Response(JSON.stringify({ code: 0, message: '更新成功' }), { headers });
    }

    // DELETE - Delete record
    if (request.method === 'DELETE') {
      const [result] = await pool.query('DELETE FROM we_xin WHERE id = ?', [id]);
      await pool.end();
      if (result.affectedRows === 0) {
        return new Response(JSON.stringify({ code: -1, error: '记录不存在' }), { status: 404, headers });
      }
      return new Response(JSON.stringify({ code: 0, message: '删除成功' }), { headers });
    }

    await pool.end();
    return new Response(JSON.stringify({ code: -1, error: 'Method Not Allowed' }), { status: 405, headers });

  } catch (err) {
    try { await pool.end(); } catch (e) { /* ignore */ }
    return new Response(JSON.stringify({ code: -1, error: err.message || '服务器内部错误' }), { status: 500, headers });
  }
}

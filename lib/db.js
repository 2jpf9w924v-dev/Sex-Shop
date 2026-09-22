const { neon } = require('@neondatabase/serverless');
function db(){ const url=(process.env.DATABASE_URL||'').trim(); if(!url) throw new Error('DATABASE_URL não configurada.'); return neon(url); }
module.exports={db};

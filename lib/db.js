const { neon } = require('@neondatabase/serverless');
function db(){ const url=(process.env.URL_DO_BANCO_DE_DADOS||'').trim(); if(!url) throw new Error('URL_DO_BANCO_DE_DADOS não configurada.'); return neon(url); }
module.exports={db};

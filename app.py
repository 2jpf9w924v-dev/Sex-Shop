from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from pathlib import Path
import json, os, time, uuid, re

ROOT = Path(__file__).resolve().parent
PORT = int(os.getenv('PORT', '8000'))

def load_env():
    p = ROOT / '.env'
    if not p.exists(): return
    for raw in p.read_text(encoding='utf-8').splitlines():
        s=raw.strip()
        if not s or s.startswith('#') or '=' not in s: continue
        k,v=s.split('=',1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
load_env()

CATALOG={
  1:{'title':'Vibrador Ponto G Luxo','unit_price':189.90},
  2:{'title':'Estimulador Premium','unit_price':219.90},
  3:{'title':'Kit Prazer a Dois','unit_price':299.90},
  4:{'title':'Lubrificante Beijável 100ml','unit_price':69.90},
  5:{'title':'Calcinha Sensual em Renda','unit_price':79.90},
  6:{'title':'Algemas em Pelúcia','unit_price':59.90}
}

def mp_request(method, path, payload=None, idempotency=False):
    token=os.getenv('MP_ACCESS_TOKEN','').strip()
    if not token or token.startswith('COLE_AQUI'):
        raise RuntimeError('MP_ACCESS_TOKEN não configurado no arquivo .env.')
    data=None if payload is None else json.dumps(payload).encode('utf-8')
    headers={'Authorization':'Bearer '+token,'Content-Type':'application/json','Accept':'application/json'}
    if idempotency: headers['X-Idempotency-Key']=str(uuid.uuid4())
    req=Request('https://api.mercadopago.com'+path, data=data, method=method, headers=headers)
    try:
        with urlopen(req, timeout=30) as r:
            raw=r.read().decode('utf-8')
            return r.status, json.loads(raw) if raw else {}
    except HTTPError as e:
        try: body=json.loads(e.read().decode('utf-8'))
        except Exception: body={'message':str(e)}
        return e.code, body

def money_str(v): return f'{v:.2f}'

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean=urlparse(path).path.lstrip('/') or 'index.html'
        return str(ROOT / clean)
    def send_json(self, status, obj):
        b=json.dumps(obj,ensure_ascii=False).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
    def read_json(self):
        n=int(self.headers.get('Content-Length','0') or 0)
        try: return json.loads(self.rfile.read(n).decode('utf-8')) if n else {}
        except Exception: return {}
    def do_POST(self):
        p=urlparse(self.path).path
        if p=='/api/create-order': return self.create_order()
        if p=='/api/webhook':
            body=self.read_json(); print('Webhook Mercado Pago:',json.dumps(body,ensure_ascii=False)); return self.send_json(200,{'received':True})
        return self.send_json(404,{'error':'Rota não encontrada.'})
    def do_GET(self):
        p=urlparse(self.path)
        if p.path=='/api/order-status': return self.order_status(parse_qs(p.query))
        return super().do_GET()
    def create_order(self):
        body=self.read_json(); requested=body.get('items') if isinstance(body,dict) else []
        email=(body.get('payer_email') or '').strip().lower() if isinstance(body,dict) else ''
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            return self.send_json(400,{'error':'Informe o e-mail do comprador usado no teste do Mercado Pago.'})
        items=[]; total=0.0
        for x in requested if isinstance(requested,list) else []:
            try: pid=int(x.get('id')); q=max(1,min(20,int(x.get('quantity',1))))
            except Exception: continue
            prod=CATALOG.get(pid)
            if prod:
                subtotal=round(prod['unit_price']*q,2); total=round(total+subtotal,2)
                items.append({'title':prod['title'],'quantity':q,'unit_price':money_str(prod['unit_price'])})
        if not items: return self.send_json(400,{'error':'Carrinho vazio ou inválido.'})
        external=f'LUME-{int(time.time()*1000)}-{uuid.uuid4().hex[:6].upper()}'
        payload={'type':'online','processing_mode':'manual','capture_mode':'automatic_async','total_amount':money_str(total),'external_reference':external,'payer':{'email':email},'items':items,'description':'Compra LUMÉ'}
        base=os.getenv('PUBLIC_BASE_URL','').strip().rstrip('/')
        # URLs de retorno devem ser públicas/HTTPS para o fluxo completo. Em localhost a order ainda pode ser criada e paga.
        if base.startswith('https://'):
            payload['config']={'statement_descriptor':'LUME','online':{'success_url':base+'/success.html','failure_url':base+'/failure.html','pending_url':base+'/pending.html','auto_return':'all'}}
        try:
            print('\n========== LUMÉ / MERCADO PAGO ==========')
            print('Criando order:', external)
            print('Itens:', len(items), '| Total:', money_str(total), '| Comprador:', email[:2] + '***@' + email.split('@',1)[1])
            status,data=mp_request('POST','/v1/orders',payload,idempotency=True)
            print('HTTP Mercado Pago:', status)
            print('Resposta Mercado Pago:', json.dumps(data, ensure_ascii=False, indent=2))
            print('==========================================\n')
            if status>=400:
                detail = (data.get('message') or data.get('error') or data.get('code') or 'Erro não informado.') if isinstance(data,dict) else 'Erro não informado.'
                if isinstance(data,dict) and data.get('details'):
                    detail = detail + ' | ' + json.dumps(data.get('details'), ensure_ascii=False)
                return self.send_json(status,{'error':'Mercado Pago recusou a criação da order.','details':detail,'mercado_pago':data})
            checkout_url=data.get('checkout_url') if isinstance(data,dict) else None
            if not checkout_url:
                return self.send_json(502,{'error':'Order criada, mas o Mercado Pago não retornou checkout_url.','mercado_pago':data})
            return self.send_json(200,{'order_id':data.get('id'),'checkout_url':checkout_url,'external_reference':external,'status':data.get('status'),'local_mode':not base.startswith('https://')})
        except Exception as e: return self.send_json(500,{'error':str(e)})
    def order_status(self, qs):
        oid=(qs.get('order_id',[''])[0] or '').strip()
        if not oid or not re.match(r'^[A-Za-z0-9_-]+$',oid): return self.send_json(400,{'error':'order_id inválido.'})
        try:
            status,d=mp_request('GET','/v1/orders/'+oid)
            if status>=400: return self.send_json(status,{'error':'Order não encontrada.','mercado_pago':d})
            return self.send_json(200,{k:d.get(k) for k in ['id','status','status_detail','external_reference','total_amount','total_paid_amount','last_updated_date']})
        except Exception as e: return self.send_json(500,{'error':str(e)})

if __name__=='__main__':
    os.chdir(ROOT)
    print(f'\nLUMÉ V5.3 - Checkout Pro / Orders API em http://localhost:{PORT}')
    print('Pressione Ctrl+C para encerrar.\n')
    ThreadingHTTPServer(('0.0.0.0',PORT),Handler).serve_forever()

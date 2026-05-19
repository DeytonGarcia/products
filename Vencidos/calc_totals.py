import json, re
src = open('app.js', 'r', encoding='utf8').read()
start = src.index('const initial = {')
count = 0
end = None
for i, ch in enumerate(src[start:], start):
    if ch == '{':
        count += 1
    elif ch == '}':
        count -= 1
        if count == 0:
            end = i + 1
            break
initial_js = src[start + len('const initial = '):end]
text = initial_js
text = re.sub(r'([\{,\s])(\w+)\s*:', r'\1"\2":', text)
text = text.replace('true', 'true').replace('false', 'false')
text = re.sub(r"'([^']*)'", r'"\1"', text)
text = re.sub(r',\s*([}\]])', r'\1', text)
text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
text = re.sub(r'//.*', '', text)
obj = json.loads(text)
EXCLUDED = {'desechos', 'salidas', 'reetiquetados'}
main = [s for s in obj['sections'] if s['id'] not in EXCLUDED]
print(json.dumps({
    'total_all': sum(len(s.get('products', [])) for s in main),
    'active_all': sum(1 for s in main for p in s.get('products', []) if p.get('activo')),
    'inactive_all': sum(1 for s in main for p in s.get('products', []) if not p.get('activo')),
    'monto': sum(sum(float(p.get('total', 0)) for p in s.get('products', [])) for s in main),
    'total_salidas': sum(float(r.get('total', 0)) for r in next((s.get('salidas', []) for s in obj['sections'] if s['id'] == 'salidas'), [])),
}))

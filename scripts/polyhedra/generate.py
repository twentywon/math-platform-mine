"""Rebuild all Platonic meshes and every inequivalent edge net.
Run: python3 scripts/polyhedra/generate.py (requires Python 3 and g++).
The development/build workflow uses the retained JSON catalogs directly.
"""
import base64,json,subprocess,sys,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
subprocess.run([sys.executable,str(root/'scripts/polyhedra/build-solids.py')],cwd=root,check=True)
solids=json.loads((root/'src/data/solids.json').read_text())
expected={'tetrahedron':2,'cube':11,'octahedron':11,'dodecahedron':43380,'icosahedron':43380}
with tempfile.TemporaryDirectory(prefix='monoon-nets-') as directory:
 temp=Path(directory);binary=temp/'enumerate'
 subprocess.run(['g++','-O3','-std=c++17','-o',str(binary),str(root/'scripts/polyhedra/enumerate-nets.cpp')],check=True)
 catalog={}
 for key,s in solids.items():
  data=temp/(key+'.txt');output=temp/(key+'.bin')
  rows=[f"{len(s['faces'])} {len(s['edges'])} {len(s['automorphisms'])}"]
  rows+=[' '.join(map(str,e))for e in s['edgeFaces']]
  rows+=[' '.join(map(str,p))for p in s['automorphisms']]
  data.write_text('\n'.join(rows))
  subprocess.run([str(binary),str(data),str(output)],check=True)
  payload=output.read_bytes()
  assert len(payload)//4==expected[key]
  catalog[key]=base64.b64encode(payload).decode()
 (root/'src/data/nets.json').write_text(json.dumps(catalog,separators=(',',':')))

"""Generate consistently oriented Platonic meshes and graph automorphisms."""
from itertools import product, combinations
from math import sqrt,atan2
from pathlib import Path
import json

def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def unit(a):return [x/sqrt(dot(a,a)) for x in a]
def mean(p):return [sum(a[i] for a in p)/len(p) for i in range(3)]
phi=(1+sqrt(5))/2
solids={
 'tetrahedron':dict(name='정사면체',polygon='정삼각형',meet=3,vertices=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]]),
 'cube':dict(name='정육면체',polygon='정사각형',meet=3,vertices=list(map(list,product([-1,1],repeat=3)))),
 'octahedron':dict(name='정팔면체',polygon='정삼각형',meet=4,vertices=[[s if i==j else 0 for i in range(3)]for j in range(3)for s in [-1,1]]),
 'dodecahedron':dict(name='정십이면체',polygon='정오각형',meet=3,vertices=list(map(list,product([-1,1],repeat=3)))+[[0,a/phi,b*phi]for a,b in product([-1,1],repeat=2)]+[[a/phi,b*phi,0]for a,b in product([-1,1],repeat=2)]+[[b*phi,0,a/phi]for a,b in product([-1,1],repeat=2)]),
 'icosahedron':dict(name='정이십면체',polygon='정삼각형',meet=5,vertices=[[0,a,b*phi]for a,b in product([-1,1],repeat=2)]+[[a,b*phi,0]for a,b in product([-1,1],repeat=2)]+[[b*phi,0,a]for a,b in product([-1,1],repeat=2)]),
}
for key,s in solids.items():
 v=s['vertices'];facets=set()
 for i,j,k in combinations(range(len(v)),3):
  n=cross(sub(v[j],v[i]),sub(v[k],v[i]));norm=sqrt(dot(n,n))
  if norm<1e-8:continue
  distances=[dot(n,sub(p,v[i]))/norm for p in v]
  if max(distances)<1e-7 or min(distances)>-1e-7:facets.add(tuple(a for a,d in enumerate(distances)if abs(d)<1e-7))
 faces=[]
 for f in sorted(facets):
  c=mean([v[i]for i in f]);n=unit(c);x=unit(sub(v[f[0]],c));y=cross(n,x)
  faces.append(sorted(f,key=lambda i:atan2(dot(sub(v[i],c),y),dot(sub(v[i],c),x))))
 edges=sorted({tuple(sorted((f[i],f[(i+1)%len(f)])))for f in faces for i in range(len(f))})
 face_edges=[[edges.index(tuple(sorted((f[i],f[(i+1)%len(f)]))))for i in range(len(f))]for f in faces]
 edge_faces=[[i for i,fe in enumerate(face_edges)if e in fe]for e in range(len(edges))]
 adjacent=[[next(i for i in edge_faces[e]if i!=fi)for e in fe]for fi,fe in enumerate(face_edges)]
 permutations=[]
 for target in range(len(faces)):
  for offset in range(len(faces[0])):
   for sign in [-1,1]:
    mapping={0:target};offsets={0:offset};queue=[0];valid=True
    for a in queue:
     b=mapping[a];n=len(faces[a])
     for i,c in enumerate(adjacent[a]):
      j=(offsets[a]+sign*i)%n;d=adjacent[b][j]
      if c in mapping:
       if mapping[c]!=d:valid=False
      else:
       mapping[c]=d;offsets[c]=(adjacent[d].index(b)-sign*adjacent[c].index(a))%n;queue.append(c)
    if not valid or len(set(mapping.values()))!=len(faces):continue
    permutation=[]
    for a,b in edge_faces:permutation.append(next(e for e,ef in enumerate(edge_faces)if set(ef)=={mapping[a],mapping[b]}))
    if permutation not in permutations:permutations.append(permutation)
 s.update(faces=faces,edges=edges,faceEdges=face_edges,edgeFaces=edge_faces,adjacent=adjacent,automorphisms=permutations)
 print(key,'V E F:',len(v),len(edges),len(faces),'symmetries:',len(permutations))
Path('src/data/solids.json').write_text(json.dumps(solids,separators=(',',':')))

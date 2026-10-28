import test from "node:test";
import assert from "node:assert/strict";
import {
  solids,
  netsFor,
  createNet,
  foldNet,
  polygonsOverlap,
  norm,
  sub,
} from "./polyhedra.js";
const expected = {
  tetrahedron: [4, 6, 4, 3, 2],
  cube: [6, 12, 8, 3, 11],
  octahedron: [8, 12, 6, 4, 11],
  dodecahedron: [12, 30, 20, 3, 43380],
  icosahedron: [20, 30, 12, 5, 43380],
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test("5종 정다면체의 구성 요소와 전개도 전체 개수가 맞는다", () => {
  for (const s of solids) {
    const [F, E, V, meet, count] = expected[s.id];
    assert.equal(s.faces.length, F);
    assert.equal(s.edges.length, E);
    assert.equal(s.vertices.length, V);
    assert.equal(s.meet, meet);
    assert.equal(netsFor(s.id).length, count);
    assert.equal(V - E + F, 2);
    for (let v = 0; v < V; v++)
      assert.equal(s.faces.filter((f) => f.includes(v)).length, meet);
  }
});
test("모든 전개도는 면을 한 번씩 연결하는 트리이고 평면에서 겹치지 않는다", () => {
  for (const s of solids)
    for (const mask of netsFor(s.id)) {
      assert.equal(
        mask.toString(2).replaceAll("0", "").length,
        s.faces.length - 1,
      );
      const net = createNet(s, mask),
        faces = foldNet(net, 0);
      for (let i = 0; i < faces.length; i++) {
        for (const p of faces[i]) near(p[2], 0);
        for (let j = i + 1; j < faces.length; j++)
          assert.equal(
            polygonsOverlap(faces[i], faces[j]),
            false,
            `${s.id} ${mask} faces ${i}/${j}`,
          );
      }
    }
});
test("접는 동안 공유 모서리는 붙어 있고 모든 면은 강체로 유지된다", () => {
  for (const s of solids) {
    const catalog = netsFor(s.id);
    for (const index of [
      0,
      Math.floor(catalog.length / 2),
      catalog.length - 1,
    ]) {
      const net = createNet(s, catalog[index]);
      for (const amount of [0, 0.25, 0.5, 0.75, 1]) {
        const faces = foldNet(net, amount);
        for (let f = 0; f < faces.length; f++)
          for (let i = 0; i < faces[f].length; i++)
            near(
              norm(sub(faces[f][i], faces[f][(i + 1) % faces[f].length])),
              norm(
                sub(
                  s.vertices[s.faces[f][i]],
                  s.vertices[s.faces[f][(i + 1) % faces[f].length]],
                ),
              ),
            );
        for (const e of net.tree.filter((e) => e.parent >= 0))
          for (const vertex of s.edges[e.edge])
            near(
              norm(
                sub(
                  faces[e.face][s.faces[e.face].indexOf(vertex)],
                  faces[e.parent][s.faces[e.parent].indexOf(vertex)],
                ),
              ),
              0,
            );
      }
    }
  }
});
test("완전히 접으면 모든 면이 원래 정다면체의 꼭짓점 위치와 일치한다", () => {
  for (const s of solids) {
    const catalog = netsFor(s.id);
    for (const index of [
      0,
      Math.floor(catalog.length / 2),
      catalog.length - 1,
    ]) {
      const net = createNet(s, catalog[index]),
        faces = foldNet(net, 1);
      for (let f = 0; f < faces.length; f++)
        for (let i = 0; i < faces[f].length; i++)
          near(norm(sub(faces[f][i], net.frame(s.vertices[s.faces[f][i]]))), 0);
    }
  }
});
test("회전·반사로 같은 전개도를 중복 수록하지 않는다", () => {
  for (const s of solids) {
    const masks = new Set(netsFor(s.id));
    assert.equal(masks.size, netsFor(s.id).length);
    for (const mask of masks)
      for (const permutation of s.automorphisms) {
        let mapped = 0;
        for (let edge = 0; edge < s.edges.length; edge++)
          if (mask & (1 << edge)) mapped |= 1 << permutation[edge];
        if (mapped !== mask)
          assert.equal(masks.has(mapped), false, `${s.id} repeated orbit`);
      }
  }
});

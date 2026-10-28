import test from "node:test";
import assert from "node:assert/strict";
import {
  initialFlameLab,
  flameLabReducer as reduce,
  flameContact,
} from "./flameLab.js";
function ignite() {
  let s = initialFlameLab();
  s = reduce(s, { type: "OPEN" });
  s = reduce(s, { type: "MATCH" });
  s = reduce(s, { type: "STRIKE" });
  return reduce(s, { type: "MOVE", tip: { x: 450, y: 329 } });
}
test("실험은 뚜껑이 닫히고 불이 꺼진 상태에서 시작한다", () => {
  const s = initialFlameLab();
  assert.equal(s.cap, "closed");
  assert.equal(s.lit, false);
  assert.equal(s.held, null);
});
test("불붙은 성냥도 뚜껑이 닫혔으면 점화할 수 없다", () => {
  let s = reduce(initialFlameLab(), { type: "MATCH" });
  s = reduce(s, { type: "STRIKE" });
  s = reduce(s, { type: "MOVE", tip: { x: 450, y: 329 } });
  assert.equal(s.lit, false);
  assert.equal(s.cap, "closed");
});
test("성냥을 마찰면에 움직여 점화하고 열린 램프 심지에 불을 붙인다", () => {
  let s = reduce(initialFlameLab(), { type: "OPEN" });
  s = reduce(s, { type: "MATCH" });
  for (let x = 110; x <= 145; x++)
    s = reduce(s, { type: "MOVE", tip: { x, y: 260 } });
  assert.equal(s.matchLit, true);
  s = reduce(s, { type: "MOVE", tip: { x: 450, y: 329 } });
  assert.equal(s.lit, true);
  assert.equal(s.tool, null);
  assert.equal(s.matchLit, false);
});
test("시료는 핀셋을 집은 뒤에만 집을 수 있다", () => {
  let s = reduce(initialFlameLab(), { type: "GRAB", id: "sodium" });
  assert.equal(s.held, null);
  s = reduce(s, { type: "TWEEZERS" });
  s = reduce(s, { type: "GRAB", id: "sodium" });
  assert.equal(s.held, "sodium");
  assert.equal(s.tool, "tweezers");
  assert.equal(flameContact(s), null);
});
test("가열된 시료만 색을 나타내며 빼면 원래 불꽃으로 돌아간다", () => {
  let s = ignite();
  s = reduce(s, { type: "TWEEZERS" });
  s = reduce(s, { type: "GRAB", id: "copper" });
  s = reduce(s, { type: "OBSERVE", id: "copper" });
  assert.equal(s.active, null);
  s = reduce(s, { type: "MOVE", tip: { x: 450, y: 250 } });
  assert.equal(flameContact(s), "copper");
  s = reduce(s, { type: "OBSERVE", id: "copper" });
  assert.equal(s.active, "copper");
  assert.deepEqual(s.records, ["copper"]);
  s = reduce(s, { type: "MOVE", tip: { x: 650, y: 200 } });
  assert.equal(s.active, null);
  assert.equal(s.last, "copper");
  assert.deepEqual(s.records, ["copper"]);
});
test("램프 소화는 뚜껑을 덮어 완료하며 관찰 기록을 보존한다", () => {
  let s = ignite();
  s = reduce(s, { type: "TWEEZERS" });
  s = reduce(s, { type: "GRAB", id: "sodium" });
  s = reduce(s, { type: "MOVE", tip: { x: 450, y: 250 } });
  s = reduce(s, { type: "OBSERVE", id: "sodium" });
  s = reduce(s, { type: "COVER" });
  assert.equal(s.cap, "closing");
  assert.equal(flameContact(s), null);
  s = reduce(s, { type: "COVERED" });
  assert.equal(s.cap, "closed");
  assert.equal(s.lit, false);
  assert.equal(s.active, null);
  assert.deepEqual(s.records, ["sodium"]);
});

test('같은 프레임의 이동을 묶어도 성냥 마찰과 점화 순서를 보존한다',()=>{
 let state=reduce(initialFlameLab(),{type:'OPEN'});state=reduce(state,{type:'MATCH'});
 state=reduce(state,{type:'PATH',points:[{x:120,y:260},{x:145,y:260},{x:450,y:329}]});
 assert.equal(state.lit,true);assert.equal(state.tool,null);
});

test('뚜껑은 드래그해 열고 심지 부근에 놓을 때만 덮인다',()=>{
 let s=reduce(initialFlameLab(),{type:'CAP_MOVE',point:{x:635,y:496}});
 s=reduce(s,{type:'CAP_DROP'});assert.equal(s.cap,'open');assert.equal(s.opened,true);
 s=reduce(s,{type:'CAP_MOVE',point:{x:500,y:440}});s=reduce(s,{type:'CAP_DROP'});assert.equal(s.cap,'open');
 s=reduce({...s,lit:true,ignited:true},{type:'CAP_MOVE',point:{x:445,y:330}});s=reduce(s,{type:'CAP_DROP'});assert.equal(s.cap,'closing');
 s=reduce(s,{type:'COVERED'});assert.equal(s.lit,false);assert.equal(s.extinguished,true);
});
test('핀셋 끝이 시료를 지나면 놓기 전에도 자동으로 집는다',()=>{
 let s=reduce(initialFlameLab(),{type:'TWEEZERS'});
 s=reduce(s,{type:'MOVE',tip:{x:740,y:132}});assert.equal(s.held,null);
 s=reduce(s,{type:'MOVE',tip:{x:800,y:132}});assert.equal(s.held,'lithium');
 assert.deepEqual(s.tip,{x:800,y:132});
 s=reduce(s,{type:'MOVE',tip:{x:770,y:190}});assert.equal(s.held,'lithium','손에 든 시료는 이동만으로 바뀌지 않는다');
});

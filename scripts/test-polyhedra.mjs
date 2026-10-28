import assert from 'node:assert/strict';
import {existsSync}from'node:fs';import{readFile}from'node:fs/promises';import{chromium}from'playwright';
const html=await readFile(process.argv[2]||new URL('../dist/monoon.html',import.meta.url),'utf8');
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{
 const context=await b.newContext({offline:true,viewport:{width:1440,height:1100}}),p=await context.newPage(),errors=[],requests=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));await p.setContent(html);
 await p.getByRole('button',{name:/펼치고 접는 정다면체/}).click();await p.getByRole('heading',{name:/펼치고 접는 정다면체/}).waitFor();
 assert.equal(await p.getByTestId('fold-face').count(),6);assert.equal(await p.getByRole('table',{name:'정다면체의 구성 요소'}).getByRole('row').count(),6);
 const scene=p.locator('.fold-scene'),first=await p.getByTestId('fold-face').first().locator('polygon').getAttribute('points');
 await p.getByRole('button',{name:'입체 보기',exact:true}).click();assert.match(await scene.getAttribute('aria-label'),/100%/);assert.notEqual(await p.getByTestId('fold-face').first().locator('polygon').getAttribute('points'),first);
 const bounds=await scene.boundingBox();await p.mouse.move(bounds.x+bounds.width*.4,bounds.y+bounds.height*.5);await p.mouse.down();await p.mouse.move(bounds.x+bounds.width*.55,bounds.y+bounds.height*.57,{steps:8});await p.mouse.up();
 await p.getByRole('button',{name:'전개도 보기',exact:true}).click();await p.getByRole('button',{name:'접어 보기',exact:true}).click();await p.waitForTimeout(350);await p.getByRole('button',{name:'일시정지',exact:true}).click();assert.ok(Number(await p.getByRole('slider',{name:'접기 정도'}).inputValue())>0);
 for(const [name,F,count]of[['정사면체',4,2],['정육면체',6,11],['정팔면체',8,11],['정십이면체',12,43380],['정이십면체',20,43380]]){
  await p.getByRole('button',{name:new RegExp(`^${name}`)}).click();assert.equal(await p.getByTestId('fold-face').count(),F);
  await p.getByRole('spinbutton',{name:'전개도 번호'}).fill(String(count));await p.getByRole('button',{name:'이동',exact:true}).click();
  await p.getByRole('button',{name:`전개도 ${count} 선택`,exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'다음 전개도',exact:true}).isDisabled(),true);
  await p.getByRole('button',{name:'입체 보기',exact:true}).click();assert.match(await scene.getAttribute('aria-label'),/100%/);
 }
 await p.screenshot({path:'/tmp/monoon-polyhedra-desktop.png',fullPage:true});
 await p.getByRole('button',{name:'전개도 보기',exact:true}).click();await p.getByRole('button',{name:'접어 보기',exact:true}).click();await p.waitForTimeout(4200);assert.match(await scene.getAttribute('aria-label'),/100%/);
 await p.getByRole('button',{name:'펼쳐 보기',exact:true}).click();await p.waitForTimeout(4200);assert.match(await scene.getAttribute('aria-label'),/0%/);
 await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:'/tmp/monoon-polyhedra-mobile.png',fullPage:true});
 await p.getByRole('button',{name:'시뮬레이션 탐색',exact:true}).click();await p.getByRole('button',{name:/데굴데굴, 도형 굴리기/}).click();await p.getByRole('heading',{name:/데굴데굴, 도형 굴리기/}).waitFor();assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log('PASS: 5 solids, full net catalogs including last net, counts table, fold/unfold animation, 3D drag, gallery, mobile, existing simulator navigation; offline, 0 errors');
}finally{await b.close()}

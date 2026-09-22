import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {scenarios,contexts,notes} from '../dist/scenarios.js';

// State/DOM-contract checks. This lightweight fixture is not a browser or an E2E runner.
function fixture(){
 const elements=new Map(),listeners=new Map(),classes=new Set();
 function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',hidden:false,disabled:false,open:false,dataset:{},attrs:{},classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,f){if(k==='close')this.closeEvent=f;else this[k]=f;},focus(){},showModal(){this.open=true;},close(){this.open=false;this.closeEvent?.();},prepend(){},getBoundingClientRect(){return{top:0,left:0,right:760,bottom:600};}});return elements.get(key);}
 const chapters=Array.from({length:5},(_,i)=>({...el('chapter'+i),getBoundingClientRect:()=>({top:76+i*900}),scrollIntoView(){this.scrolled=true;}}));
 const nav=Array.from({length:5},(_,i)=>el('nav'+i));
 const context={scenarios,contexts,notes,console,document:{querySelector:el,querySelectorAll:s=>s==='.chapter'?chapters:nav,body:{classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}}},documentElement:{requestFullscreen:async()=>{}},addEventListener:(k,f)=>listeners.set(k,f),createElement:()=>el('created'),activeElement:el('focus')},window:{addEventListener(){}},requestAnimationFrame:f=>f(),matchMedia:()=>({matches:true}),setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,''),context);
 return{el,context,listeners,classes,chapters,select:i=>el('#scenario-tabs').click({target:{closest:()=>({dataset:{scenario:String(i)}})}})};
}
test('all 13 teaching steps are connected to distinct scene states and remain unexecuted',()=>{
 const f=fixture();assert.equal(scenarios.reduce((n,s)=>n+s.steps.length,0),13);
 for(let i=0;i<scenarios.length;i++){
  f.select(i);const s=scenarios[i];assert.equal(f.el('#step-prev').disabled,true);
  for(let j=0;j<s.steps.length;j++){
   assert.match(f.el('#simulation').innerHTML,new RegExp(`data-screen="${s.steps[j].screen}"`));
   assert.ok(f.el('#step-copy').innerHTML.includes(s.steps[j].assertion));
   assert.equal(f.el('#step-count').textContent,`STEP ${String(j+1).padStart(2,'0')} / ${String(s.steps.length).padStart(2,'0')}`);
   f.el('#step-next').onclick();
  }
  assert.equal(f.el('#step-next').disabled,true);
  assert.equal(s.status,'미실행');
  assert.ok(f.el('#result-list').innerHTML.includes('미실행'));
 }
});
test('previous, reset and scenario switching restore matching visual and text state',()=>{
 const f=fixture();f.el('#step-next').onclick();f.el('#step-next').onclick();
 f.el('#step-prev').onclick();assert.match(f.el('#simulation').innerHTML,/data-screen="seats"/);
 f.el('#reset').onclick();assert.match(f.el('#simulation').innerHTML,/data-screen="concert"/);
 f.select(1);assert.match(f.el('#simulation').innerHTML,/data-screen="available"/);
 f.el('#step-next').onclick();f.el('#step-next').onclick();assert.match(f.el('#simulation').innerHTML,/결제 진행 불가/);
 f.select(2);assert.equal(f.el('#step-count').textContent,'STEP 01 / 04');
 f.el('#step-next').onclick();assert.match(f.el('#simulation').innerHTML,/카드 승인이 거절되었습니다/);assert.doesNotMatch(f.el('#simulation').innerHTML,/예매가 완료되었습니다/);
});
test('context carousel wraps in either direction and centers the selected card',()=>{
 const f=fixture();assert.equal(f.el('#context-count').textContent,'02 / 03');
 f.el('#context-next').onclick();assert.equal(f.el('#context-count').textContent,'03 / 03');
 f.el('#context-next').onclick();assert.equal(f.el('#context-count').textContent,'01 / 03');
 assert.match(f.el('#context-cards').innerHTML,/data-context="2"[\s\S]*data-context="0"[\s\S]*data-context="1"/);
 f.el('#context-prev').onclick();assert.equal(f.el('#context-count').textContent,'03 / 03');
});
test('evidence and notes are labeled examples, and modal blocks presenter keyboard',()=>{
 const f=fixture();f.el('#evidence-open').onclick();assert.equal(f.el('#modal').open,true);
 assert.match(f.el('#modal-content').innerHTML,/교육용 가상 시나리오/);
 f.el('#present').onclick();const before=f.el('#step-count').textContent;
 f.listeners.get('keydown')({key:'ArrowRight',target:{closest:()=>null},preventDefault(){throw new Error('modal must block global shortcut');}});
 assert.equal(f.el('#step-count').textContent,before);
 f.el('#modal-close').onclick();assert.equal(f.el('#modal').open,false);
 f.el('#notes-open').onclick();assert.match(f.el('#modal-content').innerHTML,/실제 테스트 실행이 아닙니다/);
 assert.equal(notes.length,7);
});
test('presentation toggles and keyboard chapter navigation have bounded destinations',()=>{
 const f=fixture();f.el('#present').onclick();assert.equal(f.el('#presentation-bar').hidden,false);assert.ok(f.classes.has('presenting'));
 const key=k=>f.listeners.get('keydown')({key:k,target:{closest:()=>null},preventDefault(){}});
 key('End');assert.equal(f.chapters[4].scrolled,true);key('Home');assert.equal(f.chapters[0].scrolled,true);
 key('Escape');assert.equal(f.el('#presentation-bar').hidden,true);assert.equal(f.el('#present').attrs['aria-pressed'],'false');
});

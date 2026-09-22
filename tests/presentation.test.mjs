import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {scenarios,aiScenarios,contexts,notes} from '../dist/scenarios.js';

// State/DOM-contract checks. This lightweight fixture is not a browser or an E2E runner.
function fixture(){
 const elements=new Map(),listeners=new Map(),classes=new Set();
 function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',hidden:false,disabled:false,open:false,dataset:{},attrs:{},classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,f){if(k==='close')this.closeEvent=f;else this[k]=f;},focus(){},showModal(){this.open=true;},close(){this.open=false;this.closeEvent?.();},prepend(){},getBoundingClientRect(){return{top:0,left:0,right:760,bottom:600};}});return elements.get(key);}
 const chapters=Array.from({length:6},(_,i)=>({...el('chapter'+i),getBoundingClientRect:()=>({top:76+i*900}),scrollIntoView(){this.scrolled=true;}}));
 const nav=Array.from({length:6},(_,i)=>el('nav'+i));
 const context={scenarios,aiScenarios,contexts,notes,console,document:{querySelector:el,querySelectorAll:s=>s==='.chapter'?chapters:nav,body:{classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}}},documentElement:{requestFullscreen:async()=>{}},addEventListener:(k,f)=>listeners.set(k,f),createElement:()=>el('created'),activeElement:el('focus')},window:{addEventListener(){}},requestAnimationFrame:f=>f(),matchMedia:()=>({matches:true}),setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,''),context);
 return{el,context,listeners,classes,chapters,
  select:(p,i)=>el('#'+p+'scenario-tabs').click({target:{closest:()=>({dataset:{scenario:String(i)}})}})};
}
const GROUPS=[['cur-',scenarios],['ai-',aiScenarios]];

test('every step of both halves renders its own scene and keeps an honest status',()=>{
 const f=fixture();
 assert.equal(scenarios.reduce((n,s)=>n+s.steps.length,0),13);
 assert.equal(aiScenarios.reduce((n,s)=>n+s.steps.length,0),12);
 const seen=new Set();
 for(const [p,data] of GROUPS){
  for(let i=0;i<data.length;i++){
   f.select(p,i);const s=data[i];assert.equal(f.el('#'+p+'step-prev').disabled,true);
   for(let j=0;j<s.steps.length;j++){
    const screen=s.steps[j].screen;seen.add(screen);
    // the scene is wired AND actually renders markup for this screen id
    assert.match(f.el('#'+p+'simulation').innerHTML,new RegExp(`data-screen="${screen}"`),`${p}${screen} not mounted`);
    assert.ok(f.el('#'+p+'simulation').innerHTML.split(`data-screen="${screen}">`)[1].length>60,`${screen} rendered empty`);
    assert.ok(f.el('#'+p+'step-copy').innerHTML.includes(s.steps[j].assertion));
    assert.equal(f.el('#'+p+'step-count').textContent,`STEP ${String(j+1).padStart(2,'0')} / ${String(s.steps.length).padStart(2,'0')}`);
    f.el('#'+p+'step-next').onclick();
   }
   assert.equal(f.el('#'+p+'step-next').disabled,true);
   assert.equal(s.status,p==='ai-'?'도입 예정':'결과 미연결');
   assert.ok(f.el('#result-list').innerHTML.includes(s.status));
  }
 }
 assert.equal(seen.size,25,'every step must have its own scene');
});

test('advancing one half never moves the other',()=>{
 const f=fixture();
 f.el('#cur-step-next').onclick();f.el('#cur-step-next').onclick();
 assert.equal(f.el('#cur-step-count').textContent,'STEP 03 / 05');
 assert.equal(f.el('#ai-step-count').textContent,'STEP 01 / 04');
 assert.match(f.el('#ai-simulation').innerHTML,/data-screen="mfa-block"/);
 f.el('#ai-step-next').onclick();
 assert.equal(f.el('#cur-step-count').textContent,'STEP 03 / 05');
 assert.match(f.el('#ai-simulation').innerHTML,/data-screen="mcp-connect"/);
});

test('previous, reset and scenario switching restore matching visual and text state',()=>{
 const f=fixture();f.el('#cur-step-next').onclick();f.el('#cur-step-next').onclick();
 f.el('#cur-step-prev').onclick();assert.match(f.el('#cur-simulation').innerHTML,/data-screen="launch"/);
 f.el('#cur-reset').onclick();assert.match(f.el('#cur-simulation').innerHTML,/data-screen="scheduler"/);
 f.select('cur-',1);assert.match(f.el('#cur-simulation').innerHTML,/data-screen="scheduler-hourly"/);
 f.el('#cur-step-next').onclick();f.el('#cur-step-next').onclick();assert.match(f.el('#cur-simulation').innerHTML,/알림 없음/);
 f.select('cur-',2);assert.equal(f.el('#cur-step-count').textContent,'STEP 01 / 04');
 f.select('ai-',1);assert.match(f.el('#ai-simulation').innerHTML,/data-screen="lang-switch"/);
 f.el('#ai-step-next').onclick();f.el('#ai-step-next').onclick();
 assert.match(f.el('#ai-simulation').innerHTML,/지목했습니다/);
 f.el('#ai-reset').onclick();assert.equal(f.el('#ai-step-count').textContent,'STEP 01 / 04');
});

test('the failure path never renders as a success, and pub stays outside auto alerts',()=>{
 const f=fixture();
 f.select('cur-',1);f.el('#cur-step-next').onclick();f.el('#cur-step-next').onclick();f.el('#cur-step-next').onclick();
 assert.match(f.el('#cur-simulation').innerHTML,/메일 발송/);
 assert.doesNotMatch(f.el('#cur-simulation').innerHTML,/알림 없음/);
 f.select('cur-',2);
 assert.match(f.el('#cur-simulation').innerHTML,/자동 로그인 불가/);
});

test('context carousel wraps in either direction and centers the selected card',()=>{
 const f=fixture();assert.equal(f.el('#context-count').textContent,'02 / 03');
 f.el('#context-next').onclick();assert.equal(f.el('#context-count').textContent,'03 / 03');
 f.el('#context-next').onclick();assert.equal(f.el('#context-count').textContent,'01 / 03');
 assert.match(f.el('#context-cards').innerHTML,/data-context="2"[\s\S]*data-context="0"[\s\S]*data-context="1"/);
 f.el('#context-prev').onclick();assert.equal(f.el('#context-count').textContent,'03 / 03');
});

test('evidence modals stay honest about what has not run and the modal blocks presenter keyboard',()=>{
 const f=fixture();
 f.el('#cur-evidence-open').onclick();assert.match(f.el('#modal-content').innerHTML,/연결하지 않아/);
 f.el('#modal-close').onclick();
 f.el('#ai-evidence-open').onclick();assert.match(f.el('#modal-content').innerHTML,/아직 도입 전/);
 assert.equal(f.el('#modal').open,true);
 f.el('#present').onclick();const before=f.el('#cur-step-count').textContent;
 f.listeners.get('keydown')({key:'ArrowRight',target:{closest:()=>null},preventDefault(){throw new Error('modal must block global shortcut');}});
 assert.equal(f.el('#cur-step-count').textContent,before);
 f.el('#modal-close').onclick();assert.equal(f.el('#modal').open,false);
 f.el('#notes-open').onclick();assert.match(f.el('#modal-content').innerHTML,/실제 테스트 실행이 아닙니다/);
 assert.equal(notes.length,10);
});

test('step changes carry a direction and a stagger order for the motion layer',()=>{
 const f=fixture();
 // 진입 방향: 다음 단계는 next, 이전 단계와 초기화는 prev
 assert.equal(f.el('#cur-simulation').dataset.dir,'next');
 f.el('#cur-step-next').onclick();assert.equal(f.el('#cur-simulation').dataset.dir,'next');
 f.el('#cur-step-prev').onclick();assert.equal(f.el('#cur-simulation').dataset.dir,'prev');
 f.el('#cur-step-next').onclick();f.el('#cur-reset').onclick();
 assert.equal(f.el('#cur-simulation').dataset.dir,'prev');
 f.select('cur-',1);assert.equal(f.el('#cur-simulation').dataset.dir,'next');
 // 로그·체크리스트·요약행은 순서대로 등장하도록 자기 번호를 들고 있어야 한다
 f.select('cur-',0);f.el('#cur-step-next').onclick();
 const launch=f.el('#cur-simulation').innerHTML;
 assert.match(launch,/class="log done" style="--d:0"/);
 assert.match(launch,/class="log wait" style="--d:3"/);
 f.select('ai-',2);
 assert.match(f.el('#ai-simulation').innerHTML,/class="ticket-summary " style="--d:1"/);
 // 제목은 시나리오가 바뀔 때만 다시 올라온다
 assert.equal(f.el('#ai-scenario-title').innerHTML,`<span class="swap">${aiScenarios[2].title}</span>`);
});

test('presentation toggles and keyboard chapter navigation cover all six scenes',()=>{
 const f=fixture();f.el('#present').onclick();assert.equal(f.el('#presentation-bar').hidden,false);assert.ok(f.classes.has('presenting'));
 assert.equal(f.el('#chapter-count').textContent,'01 / 06');
 const key=k=>f.listeners.get('keydown')({key:k,target:{closest:()=>null},preventDefault(){}});
 key('End');assert.equal(f.chapters[5].scrolled,true);key('Home');assert.equal(f.chapters[0].scrolled,true);
 key('Escape');assert.equal(f.el('#presentation-bar').hidden,true);assert.equal(f.el('#present').attrs['aria-pressed'],'false');
});

import {scenarios,aiScenarios,contexts,notes} from './scenarios.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chapters=[...document.querySelectorAll('.chapter')];
const names=['소개','검증 배경','현재 E2E','AI-assisted','검증 범위','발표 자료'];
const LAST=5;
let contextIndex=1,chapter=0,presenting=false,lastFocus=null,toastTimer;
const pad=n=>String(n).padStart(2,'0');
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOTION=!REDUCED&&typeof IntersectionObserver==='function';

// ---------- 재현 화면 부품 ----------
const win=(url,badge,body)=>`<div class="win"><div class="win-bar"><i></i><i></i><i></i><span>${url}</span>${badge?`<b>${badge}</b>`:''}</div><div class="win-body">${body}</div></div>`;
const logs=a=>`<div class="logs">${a.map(([s,t],i)=>`<p class="log ${s}" style="--d:${i}">${t}</p>`).join('')}</div>`;
const clock=(t,sub,tag)=>`<div class="clock"><small>${tag}</small><strong>${t}</strong><span>${sub}</span></div>`;
const rows=a=>a.map(([k,v,c],i)=>`<div class="ticket-summary ${c||''}" style="--d:${i}"><span>${k}</span><strong>${v}</strong></div>`).join('');
const suite=a=>`<div class="suite">${a.map(([s,t],i)=>`<p class="suite-item ${s}" style="--d:${i}"><i>${s==='done'?'✓':s==='run'?'◐':s==='fail'?'✕':'·'}</i>${t}</p>`).join('')}</div>`;
const login=(o={})=>`<div class="login-box"><div class="field ${o.fill?'filled':''}"><small>ID</small><span>${o.id||'qa-bot@test'}</span></div><div class="field ${o.fill?'filled':''}"><small>PASSWORD</small><span>••••••••••</span></div>${o.extra||''}<div class="sim-action ${o.state||''}">${o.button||'로그인'}</div></div>`;
const mail=(o)=>`<div class="mail-card ${o.cls||''}"><div class="mail-top"><span>${o.from}</span><b>${o.time}</b></div><strong>${o.subject}</strong><p>${o.body}</p></div>`;
const pane=(t,body,cls)=>`<div class="pane ${cls||''}"><small>${t}</small>${body}</div>`;

const SCREENS={
// ── 현황 1 · 풀 테스트
 scheduler:()=>clock('08:50','매일 1회 · dev 콘솔 풀 테스트','SCHEDULED TRIGGER')+`<div class="sim-notice">사람이 실행하지 않습니다. 정해진 시각에 스스로 시작합니다.</div>`,
 launch:()=>logs([['done','스케줄 트리거 수신 · target=dev'],['done','Playwright 기동 · headless=true'],['run','콘솔 URL 접속 중…'],['wait','로그인 대기']])+`<div class="sim-notice">화면은 뜨지 않지만 실제 브라우저 엔진이 동작합니다.</div>`,
 'login-auto':()=>win('dev-console / login','HEADLESS',login({fill:1,state:'highlight',button:'자동 로그인 진행'}))+`<div class="sim-notice">테스트 계정 정보는 화면과 로그에 남기지 않습니다.</div>`,
 suite:()=>suite([['done','로그인 및 콘솔 진입'],['done','주요 화면 진입'],['run','콘솔 기능 시나리오 실행 중…'],['pend','이후 시나리오 대기']])+`<div class="sim-notice">실제 시나리오 목록은 회사 저장소에서 채웁니다.</div>`,
 report:()=>`<div class="sim-complete"><div class="checkmark">✦</div><h4>08:5X · 실행 완료</h4><p class="sim-meta">업무 시작 전에 결과가 남아 있습니다.</p></div>`+rows([['대상 환경','dev 콘솔'],['실행 방식','스케줄 · 자동'],['통과 / 전체','— / —','pending'],['리포트 경로','—','pending']])+`<div class="sim-notice">수치는 실제 리포트를 연결한 뒤 채웁니다.</div>`,
// ── 현황 2 · 로그인 감시
 'scheduler-hourly':()=>clock('매시 00분','1시간마다 · 로그인만 확인','HOURLY TRIGGER')+`<div class="sim-notice">풀 테스트보다 가볍게, 대신 자주 확인합니다.</div>`,
 'login-check':()=>win('dev-console / login','HEADLESS',login({fill:1,state:'highlight',button:'로그인 성공 여부만 판정'}))+`<div class="sim-notice">이 실행에서 확인하는 것은 로그인 한 가지입니다.</div>`,
 'pass-silent':()=>`<div class="sim-complete quiet"><div class="checkmark">✓</div><h4>성공 · 알림 없음</h4><p class="sim-meta">조용한 것이 정상입니다.</p></div>`+rows([['판정','로그인 성공'],['메일 발송','없음']])+`<div class="sim-notice">다만 스케줄이 멈춰도 똑같이 조용합니다. 둘은 구분해야 합니다.</div>`,
 'fail-mail':()=>`<div class="sim-notice error highlight">로그인에 실패했습니다.<br>실패한 이 시점에만 메일이 발송됩니다.</div>`+mail({from:'pwdff-console-e2e',time:'방금',subject:'[실패] dev 콘솔 로그인 테스트',body:'로그인 단계에서 실패했습니다. 실행 시각과 단계는 리포트에서 확인합니다.',cls:'alert'})+`<div class="sim-action highlight">담당자 메일 발송</div>`,
// ── 현황 3 · pub 수동
 'pub-locked':()=>win('pub-console / login','자동 불가',login({state:'muted-action',button:'자동 로그인 불가'}))+`<div class="sim-notice error">로그인을 자동화할 수 없어 자동 실행 대상에서 제외됩니다.</div>`,
 'manual-login':()=>win('pub-console / login','사람이 입력',login({fill:1,id:'담당자 계정',state:'highlight',button:'직접 로그인'}))+`<div class="sim-notice">담당자가 로그인해 테스트가 사용할 세션을 엽니다.</div>`,
 'manual-run':()=>logs([['done','pub 세션 확보 (수동)'],['run','수동 실행 · target=pub'],['pend','dev와 동일한 시나리오 수행']])+`<div class="sim-action highlight">수동 실행</div>`,
 'manual-report':()=>`<div class="sim-complete"><div class="checkmark">👁</div><h4>사람이 확인합니다</h4><p class="sim-meta">자동 메일 경로가 아닙니다.</p></div>`+rows([['대상 환경','pub 콘솔'],['실행 방식','수동'],['자동 알림','없음'],['결과 보관','—','pending']])+`<div class="sim-notice">pub이 조용한 것은 정상이라는 뜻이 아니라, 아무 정보도 아닙니다.</div>`,
// ── AI 1 · 2차 인증
 'mfa-block':()=>win('업무망 콘솔 / 2단계 인증','BLOCKED',`<div class="mfa"><small>인증 코드 6자리</small><div class="code"><i>_</i><i>_</i><i>_</i><i>_</i><i>_</i><i>_</i></div></div><div class="sim-action muted-action">코드를 넣을 방법이 없음</div>`)+`<div class="sim-notice error highlight">지금까지 자동화가 멈춰 서던 바로 그 지점입니다.</div>`,
 'mcp-connect':()=>`<div class="flow"><span class="node">E2E 테스트</span><i>→</i><span class="node ai">AI</span><i>→</i><span class="node mcp">Gmail MCP</span></div>`+rows([['접근 대상','테스트 전용 계정 메일함'],['권한 범위','읽기 · 인증 메일 한정'],['운영 메일함','대상 아님']])+`<div class="sim-notice">브라우저 밖의 인증 메일까지 확인할 수 있게 됩니다.</div>`,
 'mfa-code':()=>mail({from:'no-reply · 인증',time:'방금',subject:'인증 코드 안내',body:'요청하신 인증 코드는 <b>418 902</b> 입니다. 5분간 유효합니다.',cls:'found'})+`<div class="mfa"><small>인증 코드 6자리</small><div class="code filled"><i>4</i><i>1</i><i>8</i><i>9</i><i>0</i><i>2</i></div></div><div class="sim-action highlight">코드 입력</div>`,
 'mfa-pass':()=>logs([['done','2단계 인증 통과'],['done','콘솔 진입'],['run','이후 시나리오 수행 중…']])+rows([['막혀 있던 구간','자동 실행 범위로 편입'],['이후 시나리오','dev와 동일']])+`<div class="sim-notice">수동으로 남겨두던 환경을 자동 검증 안으로 되돌립니다.</div>`,
// ── AI 2 · 다국어 레이아웃
 'lang-switch':()=>`<div class="split">${pane('한국어','<div class="mock"><b>예약 관리</b><p>확인</p><p>취소</p></div>')}${pane('ENGLISH','<div class="mock"><b>Reservation</b><p>Confirm</p><p>Cancel</p></div>')}</div><div class="sim-notice">같은 화면인데 글자 길이가 달라지며 폭과 줄 수가 바뀝니다.</div>`,
 'visual-scan':()=>`<div class="split scanning">${pane('한국어','<div class="mock"><b>예약 관리</b><p>확인</p></div>')}${pane('ENGLISH','<div class="mock"><b>Reservation</b><p>Confirm</p></div>')}</div>`+rows([['비교 기준','글자 내용이 아닌 배치'],['보는 것','넘침 · 잘림 · 겹침 · 밀림']])+`<div class="sim-action highlight">AI 시각 비교</div>`,
 'layout-break':()=>`<div class="split">${pane('한국어','<div class="mock"><b>예약 관리</b><p>확인</p></div>')}${pane('ENGLISH','<div class="mock broken"><b>Reservation Man…</b><p class="ovf">Confirm Reservat</p></div>','flag')}</div><div class="sim-notice error highlight">제목 잘림 · 버튼 라벨 넘침 2건을 위치와 함께 지목했습니다.</div>`,
 'layout-report':()=>suite([['fail','예약 관리 · 제목 잘림'],['fail','예약 관리 · 버튼 라벨 넘침'],['run','검토 대기 · 오탐 여부 확인 필요']])+rows([['AI 판정','확정 아님 · 검토 후보'],['최종 판단','사람']])+`<div class="sim-notice">고칠지 넘어갈지는 사람이 정합니다.</div>`,
// ── AI 3 · 기획서 기반 QA
 'spec-input':()=>`<div class="doc"><small>기획서</small><b>예약 관리 기능 정의</b><p>· 예약 확정 후 취소는 24시간 이내만 가능<br>· 취소 시 사유 입력 필수<br>· 관리자는 기간 제한 없이 취소 가능</p></div>`+rows([['근거 문서','기획서 (버전 기록)'],['정상의 기준','문서에서 도출']])+`<div class="sim-notice">무엇이 정상인지의 기준이 코드가 아니라 기획서에서 나옵니다.</div>`,
 'case-derive':()=>suite([['done','24시간 이내 취소 → 성공'],['done','24시간 경과 후 취소 → 차단'],['done','사유 미입력 → 차단'],['done','관리자 계정 → 기간 무관 취소']])+`<div class="sim-notice">사람이 만들던 확인 항목이 근거 위치와 함께 도출됩니다.</div>`,
 'ai-run':()=>win('업무망 콘솔 / 예약 관리','AI RUN',suite([['done','24시간 이내 취소'],['run','24시간 경과 후 취소 시도 중…'],['pend','사유 미입력'],['pend','관리자 취소']]))+`<div class="sim-notice">정해둔 스크립트가 아니라 방금 뽑아낸 항목을 수행합니다.</div>`,
 'ai-finding':()=>`<div class="sim-notice error highlight">기대: 24시간 경과 후 취소 차단<br>실제: 취소가 완료됨</div>`+rows([['기획서 근거','예약 관리 기능 정의'],['판단','구현 문제 / 기획 변경 — 사람 확인'],['첨부','화면 · 문서 위치','pending']])+`<div class="sim-notice">AI가 만든 기대값을 검토 없이 정답으로 쓰지 않습니다.</div>`
};

// ---------- 단계 플레이어 ----------
function createPlayer(p,data,brand){
 const el=k=>$('#'+p+k);
 let selected=0,step=0,mounted=-1,dir='next';
 function render(){
  const s=data[selected],st=s.steps[step];
  if(mounted!==selected){ // 시나리오가 바뀔 때만 교체해 단계 이동마다 제목이 다시 뜨지 않게 한다
   mounted=selected;
   el('scenario-category').textContent=s.category;
   el('scenario-title').innerHTML=`<span class="swap">${escape(s.title)}</span>`;
   el('scenario-description').innerHTML=`<span class="swap">${escape(s.description)}</span>`;
   el('scenario-tabs').innerHTML=data.map((d,i)=>`<button class="scenario-tab" data-scenario="${i}" aria-pressed="${i===selected}"><span>${pad(i+1)}</span>${d.label}</button>`).join('');
  }
  el('step-count').textContent=`STEP ${pad(step+1)} / ${pad(s.steps.length)}`;
  el('step-progress').innerHTML=s.steps.map((_,i)=>`<span class="${i===step?'current':i<step?'done':''}"></span>`).join('');
  el('step-copy').innerHTML=`<h4>${st.title}</h4><p>${st.action}<br>${st.expected}</p><div class="assertion"><span>이 단계에서 확인할 내용</span>${st.assertion}</div>`;
  el('step-prev').disabled=step===0;
  el('step-next').disabled=step===s.steps.length-1;
  el('step-next').textContent=step===s.steps.length-1?'마지막 단계':'다음 단계 →';
  el('simulation').dataset.dir=dir;
  el('simulation').innerHTML=`<div class="sim-header"><strong>${brand}</strong><span>${s.label}</span></div><div class="sim-body" data-screen="${st.screen}">${(SCREENS[st.screen]||(()=>''))()}</div>`;
 }
 const api={render,select(i){dir='next';selected=i;step=0;render();},advance(n){dir=n<0?'prev':'next';step=Math.max(0,Math.min(data[selected].steps.length-1,step+n));render();},reset(){dir='prev';step=0;render();},current(){return data[selected];}};
 el('scenario-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-scenario]');if(b)api.select(Number(b.dataset.scenario));});
 el('step-prev').onclick=()=>api.advance(-1);
 el('step-next').onclick=()=>api.advance(1);
 el('reset').onclick=()=>api.reset();
 el('evidence-open').onclick=()=>showEvidence(api.current());
 return api;
}
const playerCur=createPlayer('cur-',scenarios,'pwdff dev console');
const playerAi=createPlayer('ai-',aiScenarios,'AI-assisted E2E');

// ---------- 검증 배경 카드 ----------
function renderContexts(){$('#context-cards').innerHTML=[(contextIndex+2)%3,contextIndex,(contextIndex+1)%3].map(i=>{const c=contexts[i];return `<button class="context-card ${i===contextIndex?'active':''}" data-context="${i}" aria-pressed="${i===contextIndex}"><small>${c.english}</small><h3>${c.title}</h3><span class="card-image"></span><span class="card-number">${pad(i+1)}</span></button>`;}).join('');$('#context-count').textContent=`${pad(contextIndex+1)} / 03`;$('#context-description').innerHTML=`<span class="swap">${escape(contexts[contextIndex].description)}</span>`;}
$('#context-cards').onclick=e=>{const b=e.target.closest('[data-context]');if(b){contextIndex=Number(b.dataset.context);renderContexts();}};
$('#context-prev').onclick=()=>{contextIndex=(contextIndex+2)%3;renderContexts();};
$('#context-next').onclick=()=>{contextIndex=(contextIndex+1)%3;renderContexts();};

// ---------- 검증 범위 ----------
const row=(s,i,g)=>`<button class="result-row" data-result="${i}" data-group="${g}"><span class="result-num">${pad(i+1)}</span><div><h3>${s.label}</h3><p>${s.risk}을 살펴봅니다</p></div><span class="status ${g==='ai'?'soon':''}">${s.status}</span><span>↗</span></button>`;
$('#result-list').innerHTML=`<p class="result-group">지금 돌고 있는 것 · NCP 독립망 · 스케줄 실행</p>`+scenarios.map((s,i)=>row(s,i,'cur')).join('')+`<p class="result-group">앞으로 할 것 · 업무망 · AI-assisted E2E Testing</p>`+aiScenarios.map((s,i)=>row(s,i,'ai')).join('');
$('#result-list').onclick=e=>{const b=e.target.closest('[data-result]');if(!b)return;const ai=b.dataset.group==='ai';(ai?playerAi:playerCur).select(Number(b.dataset.result));goChapter(ai?3:2);};

// ---------- 모달 ----------
function openModal(kicker,html){lastFocus=document.activeElement;$('#modal-kicker').textContent=kicker;$('#modal-content').innerHTML=html;$('#modal').showModal();$('#modal').scrollTop=0;$('#modal-close').focus();}
function showNotes(){openModal('PRESENTER NOTES / ABOUT 10 MINUTES',`<h2>지금의 E2E, 그리고 AI-assisted E2E Testing</h2><p class="modal-note">발표용 대본입니다. 단계 진행은 시뮬레이션이며 실제 테스트 실행이 아닙니다.</p>${notes.map(n=>`<section class="notes-block"><h3>${n.title}</h3><small>${n.time}</small><p>${n.text}</p></section>`).join('')}`);}
function showEvidence(s){const soon=s.status==='도입 예정';openModal(`SCENARIO BLUEPRINT / ${soon?'NOT ADOPTED':'NOT LINKED'}`,`<h2>${s.label} · 검증 설계</h2><p class="modal-note">${soon?'아직 도입 전인 구성입니다. 실행 결과가 없습니다.':'실행 결과와 코드 근거를 아직 연결하지 않아 파일 경로와 통과 여부를 제시하지 않습니다.'}</p><h3>확인할 내용</h3><ul>${s.checks.map(c=>`<li>${c}</li>`).join('')}</ul><h3>사용자 행동 → 기대 결과</h3><pre>${escape(s.blueprint)}</pre><h3>회사 저장소에서 연결할 자료</h3><p>테스트 파일과 테스트 이름, assertion, 실행 명령과 스케줄 설정, 리포트 경로와 최근 실행 결과가 필요합니다. 원샷 프롬프트를 저장소에서 실행해 연결할 수 있습니다.</p><a class="primary-button download-link" href="scenarios.js" download>시나리오 구성 데이터 다운로드 ↓</a>`);}
$('#notes-open').onclick=showNotes;$('#resource-notes').onclick=showNotes;
$('#resource-design').onclick=()=>showEvidence(playerCur.current());
$('#modal-close').onclick=()=>$('#modal').close();
$('#modal').addEventListener('close',()=>lastFocus?.focus());
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#modal').close();}});

// ---------- 장면 이동 ----------
function syncChapter(){let nearest=0,min=Infinity;chapters.forEach((el,i)=>{let d=Math.abs(el.getBoundingClientRect().top-76);if(d<min){min=d;nearest=i;}});chapter=nearest;document.querySelectorAll('.header nav a').forEach((a,i)=>{a.classList.toggle('active',i===chapter);if(i===chapter)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});$('#chapter-count').textContent=`${pad(chapter+1)} / ${pad(LAST+1)}`;$('#chapter-name').textContent=names[chapter];$('#chapter-prev').disabled=chapter===0;$('#chapter-next').disabled=chapter===LAST;}
let scrollPending=false;window.addEventListener('scroll',()=>{if(!scrollPending){requestAnimationFrame(()=>{syncChapter();motionScroll();scrollPending=false;});scrollPending=true;}},{passive:true});
function goChapter(i){chapters[Math.max(0,Math.min(LAST,i))].scrollIntoView({behavior:REDUCED?'instant':'smooth'});}
function setPresentation(on){presenting=on;document.body.classList.toggle('presenting',on);$('#presentation-bar').hidden=!on;$('#present').setAttribute('aria-pressed',String(on));$('#present').innerHTML=on?'발표 중 <span>✦</span>':'발표 모드 <span>↗</span>';syncChapter();if(on)toast('← → 단계 이동 · PageUp / PageDown 장면 이동 · Esc 종료');}
$('#present').onclick=()=>setPresentation(!presenting);$('#exit-present').onclick=()=>setPresentation(false);
$('#chapter-prev').onclick=()=>goChapter(chapter-1);$('#chapter-next').onclick=()=>goChapter(chapter+1);
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('전체화면을 지원하지 않는 환경입니다. 발표 모드는 계속 사용할 수 있습니다.');}};
document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'전체화면 종료':'전체화면'));
document.addEventListener('keydown',e=>{if($('#modal').open||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(!presenting)return;if(e.key==='Escape'){setPresentation(false);return;}if(['ArrowRight','ArrowLeft','PageDown','PageUp','Home','End'].includes(e.key)){e.preventDefault();syncChapter();const fwd=e.key==='ArrowRight';if(e.key==='Home')goChapter(0);else if(e.key==='End')goChapter(LAST);else if(e.key==='PageDown')goChapter(chapter+1);else if(e.key==='PageUp')goChapter(chapter-1);else if(chapter===2)playerCur.advance(fwd?1:-1);else if(chapter===3)playerAi.advance(fwd?1:-1);else goChapter(chapter+(fwd?1:-1));}});
function starfield(host,count,seed,local){
 const f=document.createElement('div');f.className='starfield'+(local?' local':'');f.setAttribute('aria-hidden','true');
 f.innerHTML=Array.from({length:count},(_,i)=>`<i class="star ${i%9===0?'bright':''}" style="--x:${((i*137.508+seed*29)%100).toFixed(2)}%;--y:${((i*73.913+seed*41)%100).toFixed(2)}%;--delay:${-(i%13)}s;--duration:${5+i%7}s"></i>`).join('')
  +(local?'':Array.from({length:3},(_,i)=>`<i class="shoot" style="--x:${9+i*30}%;--y:${7+i*16}%;--delay:${-(i*7)}s"></i>`).join(''));
 host?.prepend(f);return f;
}
const heroStars=starfield($('.hero'),48,0,false);
starfield($('.journey'),26,3,true);
starfield($('.results'),26,7,true);
playerCur.render();playerAi.render();renderContexts();syncChapter();

// ---------- 움직임 (reduced-motion이거나 DOM 모형이면 통째로 꺼집니다) ----------
function motionScroll(){
 if(!MOTION)return;
 const doc=document.documentElement,y=window.scrollY||0,span=doc.scrollHeight-doc.clientHeight;
 $('#scroll-progress').style.setProperty('--p',(span>0?Math.min(1,y/span):0).toFixed(4));
 heroStars.style.transform=`translate3d(0,${(y*.3).toFixed(1)}px,0)`;
 const hero=$('.hero-content');
 hero.style.transform=`translate3d(0,${(y*.12).toFixed(1)}px,0)`;
 hero.style.opacity=String(Math.max(0,1-y/780));
}
if(MOTION){
 document.body.classList.toggle('motion',true);
 // 화면에 들어올 때 한 번씩 올라오게 한다. 한 번 보이면 관찰을 끊는다.
 const io=new IntersectionObserver((entries,self)=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('in');self.unobserve(e.target);}},{rootMargin:'0px 0px -6% 0px'});
 const order=new Map();
 document.querySelectorAll('.section-heading>*,.context-controls,.context-description,.journey-flow,.scenario-layout>*,.result-intro>*,.result-group,.result-row,.boundary,.resource-card,.closing>*').forEach(node=>{
  const i=order.get(node.parentElement)||0;order.set(node.parentElement,i+1);
  node.style.setProperty('--d',Math.min(i,6));node.classList.add('reveal');io.observe(node);
 });
 // 검증 범위의 숫자는 화면에 들어올 때 세어 올린다
 document.querySelectorAll('.result-intro strong').forEach(node=>{
  const goal=Number(node.textContent);if(!Number.isFinite(goal))return;
  const counter=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   counter.disconnect();
   let start=0;
   const tick=now=>{start||=now;const k=Math.min(1,(now-start)/900);node.textContent=pad(Math.round(goal*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(tick);};
   requestAnimationFrame(tick);
  },{threshold:.5});
  counter.observe(node);
 });
 motionScroll();
}

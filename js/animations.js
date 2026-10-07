/* UQE101 loader, scroll reveal and page-transition effects (moved out of index.html) */
(function(){
var H=document.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)').matches,FINE=matchMedia('(hover:hover) and (pointer:fine)').matches;
H.classList.add('js');
function $(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

/* ---------- loader ---------- */
var L=document.getElementById('loader');
function finish(){H.classList.add('loaded');setTimeout(checkReveal,350);setTimeout(function(){H.classList.add('done')},1500)}
if(L&&!RM){
  var pct=L.querySelector('.pct'),bar=L.querySelector('.bar i'),shown=0,target=70,t0=performance.now(),min=+(L.getAttribute('data-min')||1900),ready=false;
  window.addEventListener('load',function(){ready=true});
  if(document.readyState==='complete')ready=true;
  (function tick(){var el=performance.now()-t0;
    if(ready&&el>min*.5)target=100;else target=Math.min(92,70+el/80);
    shown+=(target-shown)*.08;if(target===100&&shown>99.4)shown=100;
    if(pct)pct.textContent=String(Math.round(shown)).padStart(3,'0');
    if(bar)bar.style.transform='scaleX('+shown/100+')';
    if(shown<100||el<min)requestAnimationFrame(tick);else setTimeout(finish,200)})();
  setTimeout(function(){if(!H.classList.contains('loaded'))finish()},6000);
}else finish();

/* ---------- smooth scroll (Lenis, optional) ---------- */
var lenis=null;
function initLenis(){if(RM||!window.Lenis||lenis)return;try{lenis=new Lenis({duration:1.15,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))},smoothWheel:true});
  (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(performance.now());
  $('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');if(id.length<2)return;var el=document.querySelector(id);if(!el)return;e.preventDefault();lenis.scrollTo(el,{offset:-70})})});
  var d=document.getElementById('modalOverlay');if(d){new MutationObserver(function(){d.classList.contains('open')?lenis.stop():(H.classList.contains('menu-open')||lenis.start())}).observe(d,{attributes:true,attributeFilter:['class']})}
}catch(e){lenis=null}}
if(window.Lenis)initLenis();else{var ls=document.getElementById('lenis-js');if(ls)ls.addEventListener('load',initLenis)}

/* ---------- split text ---------- */
$('[data-split]').forEach(function(el){
  var i=0;(function walk(n){
    Array.prototype.slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3){var parts=c.textContent.split(/(\s+)/),f=document.createDocumentFragment();
        parts.forEach(function(p){if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(' '));return}
          var o=document.createElement('span');o.className='sw';var s=document.createElement('span');s.style.setProperty('--i',i++);s.textContent=p;o.appendChild(s);f.appendChild(o)});
        n.replaceChild(f,c)}
      else if(c.nodeType===1&&!c.classList.contains('sw'))walk(c)})})(el);
  if(!el.hasAttribute('data-reveal'))el.setAttribute('data-reveal','none');
});
$('[data-chars]').forEach(function(el){var t=el.textContent;el.textContent='';t.split('').forEach(function(ch,i){var o=document.createElement('span');o.className='ch';var b=document.createElement('b');b.textContent=ch;b.style.transitionDelay=(.15+i*.07)+'s';o.appendChild(b);el.appendChild(o)})});

/* ---------- random reveal ---------- */
var FX=['up','left','right','zoom','blur','tilt','swing','spin','clip','wipe','iris','down'],IMGFX=['clip','wipe','iris','zoom','blur','tilt'],last='';
function pick(list){var r;do{r=list[Math.floor(Math.random()*list.length)]}while(r===last&&list.length>1);last=r;return r}
$('[data-reveal]').forEach(function(el){var v=el.getAttribute('data-reveal');
  if(v===''||v==='random')el.setAttribute('data-reveal',pick(el.matches('figure,img,.fig')?IMGFX:FX));
  if(v==='none'){el.removeAttribute('data-reveal');el.setAttribute('data-rv','')}});
$('[data-stagger]').forEach(function(g){var base=+g.getAttribute('data-stagger')||90;
  Array.prototype.slice.call(g.children).forEach(function(c,i){if(!c.hasAttribute('data-reveal'))c.setAttribute('data-reveal',pick(FX));c.style.setProperty('--d',(i*base+Math.random()*120|0)+'ms')})});
var pending=$('[data-reveal],[data-rv],[data-split],.fp,[data-count],[data-scramble]');
function checkReveal(){if(!pending||!pending.length||!H.classList.contains('loaded'))return;var vh=innerHeight;
  pending=pending.filter(function(el){var r=el.getBoundingClientRect();if(r.top<vh*.9&&r.bottom>0){el.classList.add('in');onIn(el);return false}return true})}

/* ---------- counters & scramble ---------- */
function onIn(el){
  if(el.hasAttribute('data-count'))count(el);
  if(el.hasAttribute('data-scramble'))scramble(el);
}
function count(el){var raw=el.textContent,m=raw.match(/^([\d,]+)(.*)$/);if(!m||RM)return;var n=+m[1].replace(/,/g,''),suf=m[2],t0=performance.now(),dur=1800,fmt=m[1].indexOf(',')>-1;
  (function f(t){var p=clamp((t-t0)/dur,0,1),e=1-Math.pow(1-p,4),v=Math.round(n*e);el.textContent=(fmt?v.toLocaleString('en-IN'):v)+suf;if(p<1)requestAnimationFrame(f);else el.textContent=raw})(t0)}
var GL='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+';
function scramble(el){if(RM)return;var txt=el.textContent,len=txt.length,fr=0,total=Math.min(40,len+16);
  (function f(){var o='';for(var i=0;i<len;i++){var c=txt[i];if(c===' '||i<(fr/total)*len)o+=c;else o+=GL[Math.random()*GL.length|0]}
    el.textContent=o;if(++fr<=total)requestAnimationFrame(f);else el.textContent=txt})()}

/* ---------- scroll driven: nav, progress, parallax, zoom, horizontal ---------- */
var nav=document.querySelector('nav'),prog=document.querySelector('.progress'),lastY=0,
  px=$('[data-parallax]'),zf=$('.zoomfig'),hs=$('.hs'),lm=$('.lm .fig img'),emb=document.querySelector('.emb');
function layoutHS(){hs.forEach(function(s){var tr=s.querySelector('.photos');if(!tr)return;
  if(innerWidth>900&&!RM){var dist=tr.scrollWidth-innerWidth;s.style.setProperty('--hsh',(innerHeight+Math.max(0,dist))+'px');s._dist=dist}else{s.style.removeProperty('--hsh');tr.style.transform='';s._dist=0}})}
function onScroll(){checkReveal();var y=scrollY,vh=innerHeight,max=document.documentElement.scrollHeight-vh;
  if(prog)prog.style.transform='scaleX('+(max>0?y/max:0)+')';
  if(nav){nav.classList.toggle('scrolled',y>40);if(y>lastY+6&&y>300)nav.classList.add('hide');else if(y<lastY-6)nav.classList.remove('hide');}
  lastY=y;if(RM)return;
  px.forEach(function(el){var r=el.getBoundingClientRect(),sp=+el.getAttribute('data-parallax')||.15,c=r.top+r.height/2-vh/2;el.style.transform='translate3d(0,'+(c*-sp).toFixed(1)+'px,0)'});
  if(emb){emb.style.transform='translate3d(0,'+(y*.3).toFixed(1)+'px,0) rotate('+(y*.02).toFixed(2)+'deg) scale(1.15)'}
  zf.forEach(function(el){var r=el.getBoundingClientRect(),p=clamp((vh-r.top)/(vh*.9),0,1);el.style.setProperty('--p',p.toFixed(3))});
  lm.forEach(function(img){var r=img.parentNode.getBoundingClientRect(),p=clamp((vh-r.top)/(vh+r.height),0,1);img.style.transform='scale(1.12) translate3d('+((p-.5)*-60).toFixed(1)+'px,0,0)'});
  hs.forEach(function(s){if(!s._dist)return;var r=s.getBoundingClientRect(),p=clamp(-r.top/(s.offsetHeight-vh),0,1);s.querySelector('.photos').style.transform='translate3d('+(-p*s._dist).toFixed(1)+'px,0,0)';s.style.setProperty('--hp',p.toFixed(3))});
}
var tick=false;function req(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;onScroll()})}}
addEventListener('scroll',req,{passive:true});addEventListener('resize',function(){layoutHS();req()});
addEventListener('load',function(){layoutHS();req()});layoutHS();onScroll();

/* ---------- pointer effects ---------- */
if(FINE&&!RM){
  var cur=document.createElement('div'),dot=document.createElement('div');cur.className='cursor';cur.innerHTML='<span></span>';dot.className='cursor-dot';document.body.appendChild(cur);document.body.appendChild(dot);
  var mx=-100,my=-100,cx=-100,cy=-100,lab=cur.querySelector('span');
  addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;dot.style.transform='translate3d('+mx+'px,'+my+'px,0)'},{passive:true});
  (function loop(){cx+=(mx-cx)*.18;cy+=(my-cy)*.18;cur.style.transform='translate3d('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px,0)';requestAnimationFrame(loop)})();
  document.addEventListener('pointerover',function(e){var t=e.target.closest('[data-cursor],a,button,input,select,.cc,.post');
    cur.classList.remove('hov','lab');if(!t)return;var l=t.getAttribute('data-cursor');if(l){lab.textContent=l;cur.classList.add('lab')}else cur.classList.add('hov')});
  /* magnetic */
  $('.btn,[data-magnetic]').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.setProperty('--bx',((e.clientX-r.left-r.width/2)*.25).toFixed(1)+'px');b.style.setProperty('--by',((e.clientY-r.top-r.height/2)*.35).toFixed(1)+'px')});
    b.addEventListener('pointerleave',function(){b.style.setProperty('--bx','0px');b.style.setProperty('--by','0px')})});
  /* tilt + spotlight */
  $('[data-tilt],.post').forEach(function(c){var amt=c.hasAttribute('data-tilt')?(+c.getAttribute('data-tilt')||8):0;
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      c.style.setProperty('--mx',(x*100).toFixed(1)+'%');c.style.setProperty('--my',(y*100).toFixed(1)+'%');
      if(amt){c.style.setProperty('--ry',((x-.5)*amt).toFixed(2)+'deg');c.style.setProperty('--rx',((.5-y)*amt).toFixed(2)+'deg')}});
    c.addEventListener('pointerleave',function(){c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')})});
  /* hero spotlight */
  var hero=document.querySelector('.hero');if(hero)hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();hero.style.setProperty('--hx',(e.clientX-r.left)+'px');hero.style.setProperty('--hy',(e.clientY-r.top)+'px')});
}

/* ---------- hero gold dust ---------- */
var cv=document.querySelector('.hero canvas');
if(cv&&!RM&&cv.getContext){var ctx=cv.getContext('2d'),P=[],W,Hh,dpr=Math.min(2,devicePixelRatio||1),vis=true,pmx=.5,pmy=.5;
  function size(){W=cv.offsetWidth;Hh=cv.offsetHeight;cv.width=W*dpr;cv.height=Hh*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  size();addEventListener('resize',size);
  var N=innerWidth<700?36:80;for(var i=0;i<N;i++)P.push({x:Math.random(),y:Math.random(),z:Math.random()*.8+.2,s:Math.random()*1.8+.4,v:Math.random()*.0006+.0002,o:Math.random()*Math.PI*2});
  addEventListener('pointermove',function(e){pmx=e.clientX/innerWidth;pmy=e.clientY/innerHeight},{passive:true});
  new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(cv);
  (function draw(t){requestAnimationFrame(draw);if(!vis)return;ctx.clearRect(0,0,W,Hh);
    P.forEach(function(p){p.y-=p.v*p.z*1.6;if(p.y<-.05){p.y=1.05;p.x=Math.random()}
      var x=(p.x+(pmx-.5)*.04*p.z)*W+Math.sin(t*.0005+p.o)*14*p.z,y=(p.y+(pmy-.5)*.03*p.z)*Hh,a=(.35+.45*Math.sin(t*.002+p.o))*p.z;
      ctx.beginPath();ctx.fillStyle='rgba(243,220,154,'+a.toFixed(3)+')';ctx.shadowColor='rgba(212,175,90,.9)';ctx.shadowBlur=8*p.z;ctx.arc(x,y,p.s*p.z,0,6.283);ctx.fill()})})(0);
}


/* ---------- menu ---------- */
var mb=document.querySelector('.menu-btn'),menu=document.getElementById('menu');
if(mb&&menu){var lastFocus=null;menu.setAttribute('aria-hidden','true');menu.inert=true;
  $('.menu-l li',menu).forEach(function(li,i){var b=li.querySelector('b');b.style.transitionDelay=(.25+i*.06)+'s'});
  function setMenu(open){
    var r=mb.getBoundingClientRect();menu.style.setProperty('--ox',(r.left+r.width/2)+'px');menu.style.setProperty('--oy',(r.top+r.height/2)+'px');
    H.classList.toggle('menu-open',open);mb.setAttribute('aria-expanded',open);mb.setAttribute('aria-label',open?'Close menu':'Open menu');
    mb.querySelector('.mb-t').textContent=open?'Close':'Menu';menu.setAttribute('aria-hidden',!open);menu.inert=!open;
    if(lenis){open?lenis.stop():lenis.start()}document.body.style.overflow=open?'hidden':'';
    if(open){lastFocus=document.activeElement;setTimeout(function(){var a=menu.querySelector('a');a&&a.focus({preventScroll:true})},400)}else if(lastFocus){lastFocus.focus({preventScroll:true})}}
  mb.addEventListener('click',function(){setMenu(!H.classList.contains('menu-open'))});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&H.classList.contains('menu-open'))setMenu(false)});
  $('a,button[data-open-modal]',menu).forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
}
/* ---------- back to top ---------- */
$('.totop').forEach(function(b){b.addEventListener('click',function(){if(lenis)lenis.scrollTo(0);else scrollTo({top:0,behavior:RM?'auto':'smooth'})})});

/* ---------- hero slideshow ---------- */
function show(box,ms,onChange){if(!box)return null;var sl=$('.sl',box),i=0,tm=null;if(sl.length<2)return null;
  function go(n){var prev=sl[i];i=(n+sl.length)%sl.length;if(sl[i]===prev)return;sl.forEach(function(s){s.classList.remove('off')});prev.classList.remove('on');prev.classList.add('off');
    void sl[i].offsetWidth;sl[i].classList.add('on');setTimeout(function(){prev.classList.remove('off')},1700);onChange&&onChange(i,sl[i])}
  function start(){stop();if(!RM)tm=setInterval(function(){go(i+1)},ms)}function stop(){if(tm)clearInterval(tm);tm=null}
  start();document.addEventListener('visibilitychange',function(){document.hidden?stop():start()});
  return {go:function(n){go(n);start()},len:sl.length,cur:function(){return i}}}
var arch=document.querySelector('.arch'),cap=document.querySelector('.hcap'),dots=document.querySelector('.hdots');
function setCap(el){if(!cap||!el)return;cap.classList.add('sw-out');setTimeout(function(){cap.querySelector('b').textContent=el.getAttribute('data-name');cap.querySelector('i').textContent=el.getAttribute('data-kind');cap.classList.remove('sw-out')},350)}
var ss=show(arch,4200,function(i,el){setCap(el);if(dots)$('button',dots).forEach(function(d,k){d.classList.toggle('on',k===i)})});
if(arch)setCap(arch.querySelector('.sl.on'));
if(ss&&dots){for(var k=0;k<ss.len;k++){(function(k){var d=document.createElement('button');d.type='button';d.setAttribute('aria-label','Show image '+(k+1));if(!k)d.classList.add('on');d.addEventListener('click',function(){ss.go(k)});dots.appendChild(d)})(k)}dots.removeAttribute('aria-hidden')}
setTimeout(function(){show(document.querySelector('.orb'),3300)},1600);
if(FINE&&!RM){var hg=document.querySelector('.hgal');if(hg){var hp=$('[data-hparallax]',hg);
  document.querySelector('.hero').addEventListener('pointermove',function(e){var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
    hp.forEach(function(el){var a=+el.getAttribute('data-hparallax');el.style.transform='translate3d('+(x*a).toFixed(1)+'px,'+(y*a).toFixed(1)+'px,0)'})})}}
/* ---------- page exit transition for internal links ---------- */
$('a[href^="/"]').forEach(function(a){a.addEventListener('click',function(e){if(RM||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank'||a.getAttribute('href').indexOf('#')>-1)return;
  if(!L)return;e.preventDefault();var href=a.href;H.classList.remove('done');L.querySelector('.lc').style.display='none';requestAnimationFrame(function(){requestAnimationFrame(function(){H.classList.remove('loaded')})});setTimeout(function(){location.href=href},900)})});
addEventListener('pageshow',function(e){if(e.persisted){H.classList.add('loaded','done');if(L)L.querySelector('.lc').style.display=''}});
})();

/* Opened straight from disk (file://)? Folder links like "blog/x/" don't
   auto-open index.html there, so point them at the file directly. */
(function(){if(location.protocol!=='file:')return;document.querySelectorAll('a[href]').forEach(function(a){var h=a.getAttribute('href');if(/^([a-z]+:|#|\/\/)/i.test(h))return;var m=h.match(/^([^#?]*)(.*)$/);if(m[1]&&/\/$/.test(m[1]))a.setAttribute('href',m[1]+'index.html'+m[2]);});})();

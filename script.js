(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const navigation = document.getElementById('navigation');
  const menu = document.querySelector('.menu-toggle');
  const setMenu = (open) => {
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {if(event.target.closest('a')) setMenu(false);});
  document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape' && navigation.classList.contains('is-open')) {setMenu(false);menu.focus();}
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => {if(event.matches) setMenu(false);});
  let ticking = false;
  const updateProgress = () => {
    const space = document.documentElement.scrollHeight-window.innerHeight;
    const percent = space > 0 ? Math.max(0,Math.min(100,window.scrollY/space*100)) : 0;
    document.documentElement.style.setProperty('--reading-progress',percent+'%');
    ticking = false;
  };
  window.addEventListener('scroll', () => {if(!ticking){ticking=true;window.requestAnimationFrame(updateProgress);}},{passive:true});
  window.addEventListener('resize',updateProgress);
  document.addEventListener('toggle',updateProgress,true);
  window.addEventListener('load',updateProgress);
  updateProgress();
  const status = document.getElementById('status-message');
  const copyButton = document.querySelector('.copy-email');
  const copyLabel = copyButton.querySelector('span');
  let copyTimeout;
  copyButton.addEventListener('click',async () => {
    try{
      await navigator.clipboard.writeText('rathnayakermbtm@gmail.com');
      copyLabel.textContent='Email copied';status.textContent='Email address copied to your clipboard.';
      clearTimeout(copyTimeout);copyTimeout=setTimeout(() => {copyLabel.textContent='Copy email';},3000);
    }catch{
      const range=document.createRange();range.selectNodeContents(document.querySelector('.email-link'));
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      copyLabel.textContent='Email selected';status.textContent='The email address is selected. Use your device copy command.';
    }
  });
  if('IntersectionObserver' in window){
    const links=[...navigation.querySelectorAll('a[href^="#"]')];
    const observer=new IntersectionObserver((entries)=>{
      const entry=entries.filter(item=>item.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!entry)return;
      links.forEach(link=>{if(link.getAttribute('href')==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    },{rootMargin:'-12% 0px -65% 0px',threshold:0});
    document.querySelectorAll('.content-flow > section').forEach(section=>observer.observe(section));
  }
  const evidence=JSON.parse(document.getElementById('eks-evidence-data').textContent);
  const dialog=document.querySelector('.evidence-dialog');
  const title=document.getElementById('evidence-title');
  const image=document.getElementById('evidence-image');
  const caption=document.getElementById('evidence-caption');
  const position=document.getElementById('evidence-position');
  const original=document.getElementById('evidence-original');
  let current=0;let returnFocus;
  const show=(index)=>{
    current=(index+evidence.length)%evidence.length;const item=evidence[current];
    title.textContent=item.title;image.src=item.src;image.alt=item.title+'. '+item.caption;
    caption.textContent=item.caption;position.textContent=(current+1)+' of '+evidence.length;original.href=item.src;
  };
  document.querySelectorAll('[data-evidence]').forEach(trigger=>{
    trigger.addEventListener('click',event=>{
      if(typeof dialog.showModal!=='function')return;
      if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();returnFocus=trigger;show(Number(trigger.dataset.evidence));dialog.showModal();document.body.classList.add('dialog-open');
    });
  });
  document.getElementById('evidence-prev').addEventListener('click',()=>show(current-1));
  document.getElementById('evidence-next').addEventListener('click',()=>show(current+1));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}
    if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');returnFocus?.focus();});
})();

const lessonId=document.body.dataset.id,mk=$('#mark');
function setMk(on){mk.textContent=on?'\u2713 Completed (click to undo)':'Mark as completed';mk.classList.toggle('p',on)}
if(mk){setMk(store.get().includes(lessonId));mk.addEventListener('click',()=>setMk(store.toggle(lessonId)))}
$$('.opt').forEach(b=>b.addEventListener('click',()=>{
  const w=b.closest('.quiz');if(w.dataset.done)return;w.dataset.done=1;
  const ok=b.dataset.ok==='1';b.classList.add(ok?'ok':'no');
  if(!ok)$('[data-ok="1"]',w).classList.add('ok');
  $('.msg',w).textContent=(ok?'Correct! ':'Not quite. ')+w.dataset.why;
}));

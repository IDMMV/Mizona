const pages=[...document.querySelectorAll('.page')];
function showPage(id){
  pages.forEach(p=>p.classList.toggle('active',p.id===id));
  document.querySelectorAll('[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',e=>{
  const link=e.target.closest('[data-page]');
  if(link){e.preventDefault();showPage(link.dataset.page)}
});
function fakeSave(msg='Guardado correctamente') { alert(msg); }
function createCoupon(){
  const title=document.querySelector('#couponTitle')?.value || 'Nueva promoción';
  const list=document.querySelector('#couponList');
  if(list){list.insertAdjacentHTML('afterbegin',`<div class="item"><div class="icon">🎁</div><div><b>${title}</b><div class="muted">Cupón creado en modo prototipo</div></div><span class="pill ok">Activo</span></div>`)}
}
function uploadTransfer(){
  const name=document.querySelector('#transferFile')?.files?.[0]?.name || 'archivo_demo.pdf';
  const box=document.querySelector('#transferResult');
  if(box){box.innerHTML=`<div class="notice"><b>Enlace temporal creado:</b><br> ${name}<br>Vence automáticamente en 7 días.</div>`}
}
window.showPage=showPage; window.fakeSave=fakeSave; window.createCoupon=createCoupon; window.uploadTransfer=uploadTransfer;

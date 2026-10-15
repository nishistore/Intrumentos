(function(){
  if(!window.Motion) return;
  const { animate, scroll } = window.Motion;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;

  // Barra de progreso de lectura (scrollYProgress de toda la página)
  const bar = document.createElement('div');
  bar.style.cssText='position:fixed;top:0;left:0;right:0;height:3px;background:#d8232a;transform-origin:0 50%;transform:scaleX(0);z-index:99999';
  document.body.appendChild(bar);
  scroll(animate(bar,{transform:['scaleX(0)','scaleX(1)']},{ease:'linear'}));

  const done = new WeakSet();
  function reveal(el, from){
    if(!el || done.has(el)) return; done.add(el);
    scroll(animate(el, from, {ease:'linear'}), {target: el, offset:['start end','start 0.65']});
  }
  function aplicar(){
    // Portada: la foto del producto estrella se acerca / sube con parallax
    document.querySelectorAll('.hero-venta .hv-gancho img').forEach(img=>{
      if(done.has(img)) return; done.add(img);
      scroll(animate(img,{transform:['scale(1) translateY(0px)','scale(1.12) translateY(-30px)']},{ease:'linear'}),
             {target: img.closest('.hero-venta'), offset:['start start','end start']});
    });
    // Secciones: aparecen con fade + desplazamiento ligado al scroll
    document.querySelectorAll('.portada-cats,.vitrina,.prueba,.kit,.cierre,.reco').forEach(s=>
      reveal(s,{opacity:[0,1],transform:['translateY(60px)','translateY(0px)']}));
    // Tarjetas con escalonado: cada una empieza un poco más tarde
    document.querySelectorAll('.vitrina .tv, .reco .tv').forEach((c,i)=>{
      if(done.has(c)) return; done.add(c);
      const o = (i%4)*0.04;
      scroll(animate(c,{opacity:[0,1],transform:['translateY(50px) scale(.94)','translateY(0) scale(1)']},{ease:'linear'}),
             {target:c, offset:['start end', `start ${0.85-o}`]});
    });
    // Categorías: entran desde los lados alternando
    document.querySelectorAll('.pc-tile').forEach((t,i)=>{
      if(done.has(t)) return; done.add(t);
      scroll(animate(t,{opacity:[0,1],transform:[`translateX(${i%2?40:-40}px)`,'translateX(0)']},{ease:'linear'}),
             {target:t, offset:['start end','start 0.8']});
    });
    // Bloque oscuro de cierre: zoom suave
    document.querySelectorAll('.cierre,.kit').forEach(s=>{
      scroll(animate(s,{transform:['scale(.94)','scale(1)']},{ease:'linear'}),{target:s,offset:['start end','center center']});
    });
  }
  const app = document.getElementById('app');
  new MutationObserver(()=>aplicar()).observe(app,{childList:true,subtree:true});
  aplicar();
})();

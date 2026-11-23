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

  /* Las secciones y tarjetas de producto YA NO aparecen con fundido. Empezaban
     en opacidad 0 y solo se veían del todo al llegar al 65-85 % de la
     pantalla: la foto ya estaba bajada, pero el cliente la veía "cargando".
     Quitado el 2026-11-23 al comparar con screens4you.se, que no anima nada.
     Si se quiere volver a animar algo, que sea solo transform, nunca opacity. */
  const done = new WeakSet();
  function aplicar(){
    // Portada: la foto del producto estrella se acerca / sube con parallax
    document.querySelectorAll('.hero-venta .hv-gancho img').forEach(img=>{
      if(done.has(img)) return; done.add(img);
      scroll(animate(img,{transform:['scale(1) translateY(0px)','scale(1.12) translateY(-30px)']},{ease:'linear'}),
             {target: img.closest('.hero-venta'), offset:['start start','end start']});
    });
    // Bloque oscuro de cierre: zoom suave. Con `done`, para no sumar otra
    // animación de scroll cada vez que cambia algo dentro de #app.
    document.querySelectorAll('.cierre,.kit').forEach(s=>{
      if(done.has(s)) return; done.add(s);
      scroll(animate(s,{transform:['scale(.94)','scale(1)']},{ease:'linear'}),{target:s,offset:['start end','center center']});
    });
  }
  const app = document.getElementById('app');
  new MutationObserver(()=>aplicar()).observe(app,{childList:true,subtree:true});
  aplicar();
})();

(function(){
let fx=null;
function fallback(el){el.classList.add('fallback')}
function init(){
  const el=document.getElementById('hero');
  if(!el||fx)return;
  if(!(window.VANTA&&window.THREE))return fallback(el);
  let gl=null;
  try{const c=document.createElement('canvas');gl=c.getContext('webgl')||c.getContext('experimental-webgl')}catch(e){}
  if(!gl)return fallback(el);
  const mobile=innerWidth<768;
  try{
    fx=VANTA.BIRDS({el,mouseControls:true,touchControls:true,gyroControls:false,minHeight:200,minWidth:200,scale:1,scaleMobile:1,
      backgroundColor:0x0e284a,color1:0xff0707,color2:0x14abe3,colorMode:'varianceGradient',
      birdSize:1.1,wingSpan:30,speedLimit:5,separation:20,alignment:20,cohesion:20,quantity:mobile?3:5});
  }catch(e){fx=null;fallback(el)}
}
function kill(){if(fx){try{fx.destroy()}catch(e){}fx=null}}
addEventListener('load',init);
addEventListener('pagehide',kill);
addEventListener('beforeunload',kill);
})();

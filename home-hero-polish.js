(function(){
  var hero=document.querySelector('#portalHome .portal-hero h1');
  if(hero){
    hero.innerHTML='<span class="hero-line hero-line-1">临床资料，</span><span class="hero-line hero-line-2">一个入口。</span>';
  }
  var st=document.createElement('style');
  st.id='home-hero-polish-style';
  st.textContent=`
    .portal-hero{
      padding-top:82px!important;
      padding-bottom:64px!important;
    }
    .portal-hero .portal-kicker{
      font-size:17px!important;
      line-height:1.25!important;
      font-weight:600!important;
      letter-spacing:-.01em!important;
      margin:0 0 18px!important;
    }
    .portal-hero h1{
      width:auto!important;
      max-width:calc(100vw - 48px)!important;
      margin:0 auto!important;
      padding:0!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:.015em!important;
      font-size:clamp(52px,4.8vw,68px)!important;
      line-height:.98!important;
      font-weight:700!important;
      letter-spacing:-.042em!important;
      text-align:center!important;
      white-space:normal!important;
    }
    .portal-hero h1 .hero-line{
      display:block!important;
      font:inherit!important;
      line-height:inherit!important;
      white-space:nowrap!important;
      text-align:center!important;
      margin:0!important;
      padding:0!important;
      transform-origin:center center!important;
    }
  `;
  document.head.appendChild(st);
})();

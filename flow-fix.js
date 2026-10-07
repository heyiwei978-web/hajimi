(function(){
  var st=document.createElement('style');
  st.id='guide-flow-layout-fix';
  st.textContent=`
    .guide-section .steps li{
      display:grid!important;
      grid-template-columns:30px minmax(0,1fr)!important;
      grid-template-rows:auto auto!important;
      column-gap:12px!important;
      row-gap:2px!important;
      align-items:start!important;
    }
    .guide-section .steps li::before{
      grid-column:1!important;
      grid-row:1 / span 2!important;
      width:30px!important;
      min-width:30px!important;
    }
    .guide-section .steps li > b{
      grid-column:2!important;
      grid-row:1!important;
      min-width:0!important;
      width:auto!important;
      max-width:none!important;
      display:block!important;
      white-space:normal!important;
      word-break:normal!important;
      overflow-wrap:break-word!important;
      writing-mode:horizontal-tb!important;
    }
    .guide-section .steps li > span{
      grid-column:2!important;
      grid-row:2!important;
      min-width:0!important;
      width:auto!important;
      max-width:none!important;
      display:block!important;
      white-space:normal!important;
      word-break:normal!important;
      overflow-wrap:break-word!important;
      writing-mode:horizontal-tb!important;
    }
    @media(max-width:620px){
      .guide-section .steps li{grid-template-columns:28px minmax(0,1fr)!important;column-gap:10px!important}
      .guide-section .steps li::before{width:28px!important;min-width:28px!important}
    }
  `;
  document.head.appendChild(st);
})();

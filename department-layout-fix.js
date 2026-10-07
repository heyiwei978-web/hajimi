
(function(){
  const routeMap={guke:"骨科",puwai:"普外科",shennei:"肾内科",fuke:"妇科"};
  const slugMap={"骨科":"guke","普外科":"puwai","肾内科":"shennei","妇科":"fuke"};
  const departments=["骨科","普外科","肾内科","妇科"];

  function currentDept(){
    const m=location.pathname.match(/^\/bl\/([^/?#]+)/);
    return m ? (routeMap[m[1]]||null) : null;
  }

  const recordsTile=document.getElementById("recordsTile");
  if(recordsTile){
    const p=recordsTile.querySelector(".tile-copy p"); if(p)p.remove();
    const count=recordsTile.querySelector(".tile-links span"); if(count)count.remove();
  }

  const style=document.createElement("style");
  style.id="department-layout-fix-style";
  style.textContent=`
    body.department-no-sidebar .sidebar{display:block!important}
    body.department-no-sidebar .page{max-width:none!important}
    body.department-index .sidebar{display:none!important}
    body.department-index .page{grid-template-columns:minmax(0,1fr)!important;max-width:1180px!important;margin:0 auto!important}

    .department-index-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important;margin-top:10px}
    .department-index-card{border:1px solid #e5e7eb;border-radius:16px;background:#fff;min-height:190px;padding:22px;display:flex;flex-direction:column;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
    .department-index-card:hover{transform:translateY(-2px)}
  `;
  document.head.appendChild(style);
})();

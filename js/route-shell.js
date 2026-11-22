// Runs synchronously at the top of <body> on /bl and /ecg pages, before first
// paint. It applies the same layout classes the page scripts set once the
// route has rendered, so the sidebar, page width, hero statistics and
// record-book layout do not jump when the deferred scripts finish.
// departments.js and ecg.js remain the authority and re-apply these classes on
// every navigation; this file only predicts the first render.
(function(){
  var slugs={guke:1,puwai:1,shennei:1,fuke:1};
  function libraryClasses(parts){
    if(!parts[1]||!slugs[parts[1]])return ['department-no-sidebar','library-root-page'];
    if(parts[2])return ['department-no-sidebar','disease-book-page'];
    return parts[1]==='guke'?[]:['department-no-sidebar'];
  }
  function ecgClasses(parts){
    if(parts.length<2)return [];
    if(parts[1]==='atlas'){
      if(parts.length<=3)return ['ecg-subpage','ecg-atlas-list'];
      if(parts.length===4)return ['ecg-subpage','ecg-entry-page'];
    }
    return ['ecg-subpage'];
  }
  function classesFor(pathname){
    var parts=String(pathname||'').split('/').filter(Boolean);
    if(parts[0]==='bl')return libraryClasses(parts);
    if(parts[0]==='ecg'||parts[0]==='ecg.html')return ecgClasses(parts);
    return [];
  }
  // /ecg 下除首页以外的页面都要用心电图资料包：在这里（<body> 开头、同步执行）就开始下载，
  // 与页面脚本并行，ecg.js 只需等它完成。地址来自构建时写入的 <meta name="hajimi-ecg-data">。
  function needsEcgData(pathname){
    var parts=String(pathname||'').split('/').filter(Boolean);
    return (parts[0]==='ecg'||parts[0]==='ecg.html')&&parts.length>1;
  }
  function preloadEcgData(doc,pathname){
    if(!needsEcgData(pathname)||doc.getElementById('ecgDataScript'))return null;
    var meta=doc.querySelector('meta[name="hajimi-ecg-data"]'),url=meta&&meta.getAttribute('content');
    if(!url)return null;
    var script=doc.createElement('script');
    script.id='ecgDataScript';script.src=url;script.async=true;
    script.onerror=function(){script.setAttribute('data-state','error');};
    doc.head.appendChild(script);
    return script;
  }
  window.HAJIMI_ROUTE_SHELL={classesFor:classesFor,needsEcgData:needsEcgData,preloadEcgData:preloadEcgData};
  if(typeof document!=='undefined'&&document.body){
    var list=classesFor(location.pathname);
    for(var i=0;i<list.length;i++)document.body.classList.add(list[i]);
    // 词条页的标题和摘要要等资料包：先按常见高度预留位置（ecg.css），资料渲染后由 ecg.js 移除，
    // 搜索框和正文不会在资料到达时被整体推开（布局偏移）。
    if(list.indexOf('ecg-entry-page')>=0)document.body.classList.add('ecg-data-pending');
    preloadEcgData(document,location.pathname);
  }
})();

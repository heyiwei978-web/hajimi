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
  window.HAJIMI_ROUTE_SHELL={classesFor:classesFor};
  if(typeof document!=='undefined'&&document.body){
    var list=classesFor(location.pathname);
    for(var i=0;i<list.length;i++)document.body.classList.add(list[i]);
  }
})();

(function(){
  var files=[
    '/departments.js?v=20261006k',
    '/department-layout-fix.js?v=20261006k',
    '/brand-generic-fix.js?v=20261006k',
    '/flow-fix.js?v=20261006k',
    '/home-alignment-fix.js?v=20261006k',
    '/home-hero-polish.js?v=20261006k',
    '/tools-entry.js?v=20261006k',
    '/cms-core.js?v=20261006k'
  ];
  var i=0;
  function next(){
    if(i>=files.length)return;
    var s=document.createElement('script');
    s.src=files[i++];
    s.onload=next;
    s.onerror=next;
    document.head.appendChild(s);
  }
  next();
})();
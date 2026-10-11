/* Original vector teaching sketches; these are not recorded or calibrated patient ECGs. */
(()=>{
  'use strict';
  let serial=0;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function trace(beats,{p=true,tall=false,deepS=false,invertedT=false,q=false}={}){
    const points=[[28,0]];
    for(const x of beats){
      if(p)points.push([x-42,0],[x-33,-5],[x-25,0]);
      points.push([x-12,0],[x-6,q?9:3],[x,-35],[x+5,deepS?26:9],[x+12,0]);
      points.push([x+26,0],[x+38,invertedT?12:(tall?-35:-12)],[x+50,0],[x+67,0]);
    }
    points.push([612,0]);
    return points;
  }
  function atrialTrace(){
    const points=[];
    for(let x=28;x<=612;x+=3)points.push([x,2*Math.sin(x*.51)+1.2*Math.sin(x*.89)]);
    for(const x of [75,185,266,397,485,552]){
      for(let i=0;i<points.length;i++){
        const d=points[i][0]-x;
        if(d>=-6&&d<=12)points[i][1]+=(d<0?-30*(d+6)/6:d<5?-30+39*d/5:9*(12-d)/7);
        else if(d>=24&&d<=50)points[i][1]+=-10*Math.sin(Math.PI*(d-24)/26);
      }
    }
    return points;
  }
  const drawings={
    normal:{title:'正常窦性节律教学示意',description:'规则的 P 波、QRS 波群和 T 波。标示只用于认识各波段。',rows:[{lead:'II',points:trace([100,240,380,520])}],labels:true},
    af:{title:'房颤教学示意',description:'II 导联示意：RR 不规则，无一致的 P 波，基线有细小波动。',rows:[{lead:'II',points:atrialTrace()}]},
    hyperkalemia:{title:'高钾相关尖高 T 波教学示意',description:'II 导联示意：尖高的 T 波。这只是可能表现之一，不能据此判断血钾数值。',rows:[{lead:'II',points:trace([100,240,380,520],{tall:true})}]},
    pe:{title:'肺栓塞相关非特异性图形教学示意',description:'I 导联深 S 波，III 导联 Q 波及 T 波倒置。这种图形不能确诊或排除肺栓塞。',rows:[{lead:'I',points:trace([100,240,380,520],{deepS:true})},{lead:'III',points:trace([100,240,380,520],{q:true,invertedT:true})}]}
  };
  function render(kind){
    const drawing=drawings[kind];
    if(!drawing)return '';
    const id='ecg-sketch-'+(++serial),height=drawing.rows.length*104+24;
    const rows=drawing.rows.map((row,index)=>{
      const baseline=62+index*104;
      const d=row.points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+' '+(baseline+y).toFixed(1)).join(' ');
      return '<text x="8" y="'+(baseline-39)+'" fill="#293f50" font-size="16">'+row.lead+'</text><path d="'+d+'" fill="none" stroke="#135f9c" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    }).join('');
    const labels=drawing.labels?'<g fill="#142c42" font-size="15"><text x="64" y="43">P</text><text x="87" y="19">QRS</text><text x="132" y="40">T</text></g>':'';
    return '<svg class="ecg-waveform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 '+height+'" role="img" aria-labelledby="'+id+'-title '+id+'-desc">'+
      '<title id="'+id+'-title">'+esc(drawing.title)+'</title><desc id="'+id+'-desc">'+esc(drawing.description)+'</desc>'+
      '<defs><pattern id="'+id+'-small" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" fill="none" stroke="#dce4eb" stroke-width=".5"/></pattern><pattern id="'+id+'-big" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="url(#'+id+'-small)"/><path d="M40 0H0V40" fill="none" stroke="#c1d3e1" stroke-width="1"/></pattern></defs>'+
      '<rect width="640" height="'+height+'" fill="#fff"/><rect width="640" height="'+height+'" fill="url(#'+id+'-big)"/>'+rows+labels+'</svg>';
  }
  window.HAJIMI_ECG_WAVEFORMS=Object.freeze({render});
})();

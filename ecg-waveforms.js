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
  // Component model for the atlas sketches: each row is a sum of smooth bumps sampled
  // every pixel (1 px ≈ 5 ms; small grid square = 40 ms). Negative y is upward.
  const G=(x,c,w,a)=>a*Math.exp(-((x-c)*(x-c))/(2*w*w));
  const plateau=(x,a,b,level)=>level*(1/(1+Math.exp(-(x-a)/1.2))-1/(1+Math.exp(-(x-b)/3)));
  function beat(c,o={}){
    const parts=[],pr=o.pr||28,r=o.r??1,s=o.s??0.3,q=o.q??0,t=o.t??1,tAt=o.tAt||60,tw=o.tw||8;
    if(o.p!==false)parts.push(x=>G(x,c-pr,o.pw||3.5,-5*(o.pAmp||1)));
    if(o.qrs==='wide')parts.push(x=>G(x,c-6,3.4,-30*r)+G(x,c+6,3.4,-27*r)+G(x,c+14,3,9*s));
    else if(o.qrs==='rbbb')parts.push(x=>G(x,c-7,1.6,-12)+G(x,c-1,1.6,10)+G(x,c+7,2.8,-30));
    else if(o.qrs==='rbbbLeft')parts.push(x=>G(x,c-5,1.4,3)+G(x,c,2,-32)+G(x,c+9,4,11));
    else if(o.qrs==='broad')parts.push(x=>G(x,c,5,-32*r)+G(x,c+12,4,10*s));
    else if(o.qrs==='qs')parts.push(x=>G(x,c-2,5,32*r));
    else if(o.qrs==='paced')parts.push(x=>G(x,c+2,4,-26*r)+G(x,c+14,4,-14*r));
    else parts.push(x=>G(x,c-5,1.4,9*q)+G(x,c,2,-34*r)+G(x,c+4,1.8,26*s));
    if(o.st)parts.push(x=>plateau(x,c+(o.qrs?18:9),c+tAt-6,-o.st));
    if(o.scoop)parts.push(x=>G(x,c+24,11,o.scoop)*(x>c+8?1:0));
    if(t)parts.push(x=>G(x,c+tAt,tw,-11*t));
    if(o.u)parts.push(x=>G(x,c+tAt+30,5,-4*o.u));
    return parts;
  }
  const P=(c,amp=1)=>[x=>G(x,c,3.5,-5*amp)];
  function sample(parts,from=28,to=612){
    const points=[];
    for(let x=from;x<=to;x++)points.push([x,parts.reduce((sum,part)=>sum+part(x),0)]);
    return points;
  }
  const row=(lead,parts,spikes=[])=>({lead,points:sample(parts),spikes});
  const beats=(centers,o)=>centers.flatMap(c=>beat(c,o));
  function chaotic(seed,amp,rate){
    return [x=>{const e=0.65+0.35*Math.sin(x*0.013+seed);return amp*e*(Math.sin(x*rate+seed)+0.55*Math.sin(x*rate*1.73+seed*2)+0.3*Math.sin(x*rate*2.9));}];
  }
  const torsade=[x=>x<200?0:-30*Math.sin(Math.PI*(x-200)/205)*Math.sin(2*Math.PI*(x-200)/44)];
  const drawings={
    normal:{title:'正常窦性节律教学示意',description:'规则的 P 波、QRS 波群和 T 波。标示只用于认识各波段。',rows:[{lead:'II',points:trace([100,240,380,520])}],labels:true},
    af:{title:'房颤教学示意',description:'II 导联示意：RR 不规则，无一致的 P 波，基线有细小波动。',rows:[{lead:'II',points:atrialTrace()}]},
    hyperkalemia:{title:'高钾相关尖高 T 波教学示意',description:'II 导联示意：尖高的 T 波。这只是可能表现之一，不能据此判断血钾数值。',rows:[{lead:'II',points:trace([100,240,380,520],{tall:true})}]},
    pe:{title:'肺栓塞相关非特异性图形教学示意',description:'I 导联深 S 波，III 导联 Q 波及 T 波倒置。这种图形不能确诊或排除肺栓塞。',rows:[{lead:'I',points:trace([100,240,380,520],{deepS:true})},{lead:'III',points:trace([100,240,380,520],{q:true,invertedT:true})}]}
  };

  const N=[90,250,410,570];
  Object.assign(drawings,{
    stemi:{title:'下壁 ST 段抬高教学示意',description:'II 导联 ST 段抬高并与 T 波融合；aVL 导联对应性 ST 段压低。仅示意形态，判定需完整 12 导联与动态对比。',rows:[row('II',beats(N,{st:13,t:1.1,tAt:52,tw:11})),row('aVL',beats(N,{st:-6,t:-0.6,r:0.6}))]},
    'nste-ischemia':{title:'ST 段压低与 T 波倒置教学示意',description:'V5 导联水平型 ST 段压低伴 T 波倒置。非特异，需结合症状、肌钙蛋白和动态变化。',rows:[row('V5',beats(N,{st:-6,t:-0.8}))]},
    vt:{title:'单形性室性心动过速教学示意',description:'II 导联宽 QRS 规则心动过速，形态一致，未见与 QRS 固定相关的 P 波。',rows:[row('II',[62,128,194,260,326,392,458,524,590].flatMap(c=>beat(c,{p:false,qrs:'broad',s:0.8,t:-1.1,tAt:32,tw:8})))]},
    vf:{title:'室颤教学示意',description:'II 导联杂乱、不规则的颤动波，无法辨认 QRS 波群和 T 波。',rows:[row('II',chaotic(1.3,15,0.17))]},
    torsades:{title:'尖端扭转型室速教学示意',description:'II 导联：先见 QT 明显延长的窦性搏动，随后为 QRS 振幅与方向围绕基线“扭转”的多形性室速。',rows:[row('II',[...beat(70,{t:0.9,tAt:85,tw:10}),...torsade])]},
    svt:{title:'阵发性室上性心动过速教学示意',description:'II 导联窄 QRS 规则心动过速，P 波不易辨认（可能隐藏在 QRS 内或紧随其后）。',rows:[row('II',[60,128,196,264,332,400,468,536,604].flatMap(c=>beat(c,{p:false,t:0.7,tAt:34,tw:6})))]},
    'sinus-bradycardia':{title:'窦性心动过缓教学示意',description:'II 导联每个 QRS 前均有形态一致的 P 波，PR 固定，心率减慢（RR 间期延长）。',rows:[row('II',beats([120,390],{}))]},
    pvc:{title:'室性早搏教学示意',description:'II 导联第三个搏动提前出现，前无提前的 P 波，QRS 宽大畸形，T 波方向与主波相反，其后有代偿间歇。',rows:[row('II',[...beats([80,240],{}),...beat(345,{p:false,qrs:'broad',r:-1,s:-0.3,t:1.2,tAt:38,tw:10}),...P(372),...beat(560,{})])]},
    'first-degree-avb':{title:'一度房室传导阻滞教学示意',description:'II 导联每个 P 波后均有 QRS，PR 间期固定但延长。',rows:[row('II',beats(N.map(c=>c+10),{pr:58}))]},
    'second-degree-avb':{title:'二度房室传导阻滞教学示意',description:'上行（II）：PR 逐搏延长后一个 P 波未下传（文氏型）。下行（II）：PR 固定，突然出现未下传的 P 波（莫氏 II 型）。',rows:[row('II',[...beat(90,{pr:30}),...beat(250,{pr:44}),...beat(410,{pr:58}),...P(512),...beat(610,{pr:30})]),row('II',[...beat(90,{pr:34}),...beat(250,{pr:34}),...P(376),...beat(570,{pr:34})])]},
    'complete-heart-block':{title:'三度房室传导阻滞教学示意',description:'II 导联 P 波规则出现，QRS 也规则但频率更慢，两者之间没有固定关系（房室分离）。',rows:[row('II',[...[50,150,250,350,450,550].flatMap(c=>P(c)),...[140,440].flatMap(c=>beat(c,{p:false,qrs:'broad',s:0.6,t:-1,tAt:46,tw:10}))])]},
    rbbb:{title:'右束支传导阻滞教学示意',description:'V1 导联 rsR′（“M”形）宽 QRS 并 T 波倒置；V6 导联宽而钝的 S 波。',rows:[row('V1',beats(N,{qrs:'rbbb',t:-0.7})),row('V6',beats(N,{qrs:'rbbbLeft',t:0.9}))]},
    lbbb:{title:'左束支传导阻滞教学示意',description:'V1 导联宽而深的 QS 波；V6 导联宽大、顶部切迹的 R 波，无间隔 q 波，ST-T 与主波方向相反。',rows:[row('V1',beats(N,{qrs:'qs',r:1.3,st:4,t:1.2,tAt:56})),row('V6',beats(N,{qrs:'wide',s:0,st:-3,t:-1,tAt:56,tw:10}))]},
    lvh:{title:'左心室肥厚教学示意',description:'V1 导联深 S 波；V5 导联高 R 波伴 ST 段压低和不对称 T 波倒置（“劳损”样改变）。',rows:[row('V1',beats(N,{r:0.35,s:1.9,t:0.6})),row('V5',beats(N,{r:1.75,s:0.1,st:-4,t:-1.1,tw:10}))]},
    rvh:{title:'右心室肥厚教学示意',description:'V1 导联以 R 波为主（R/S >1）伴 T 波倒置；II 导联 P 波高尖。',rows:[row('V1',beats(N,{r:1.1,s:0.25,t:-0.8})),row('II',beats(N,{pAmp:2.3,pw:3}))]},
    hypokalemia:{title:'低钾相关改变教学示意',description:'II 导联 T 波低平、ST 段轻度压低，T 波后出现明显 U 波。不能据此推算血钾数值。',rows:[row('II',beats(N,{st:-2,t:0.35,u:1.6}))]},
    calcium:{title:'血钙异常相关 QT 改变教学示意',description:'上行（II）：ST 段延长、T 波形态大致正常，QT 延长（低钙）。下行（II）：ST 段缩短，T 波紧随 QRS，QT 缩短（高钙）。',rows:[row('II',beats(N,{tAt:92,tw:8})),row('II',beats(N,{tAt:34,tw:8}))]},
    'drug-qt':{title:'QT 间期延长教学示意',description:'II 导联 T 波终点明显后移，QT 间期延长。测量需选取 T 波终点清楚的导联，并按心率校正。',rows:[row('II',beats([90,290,490],{tAt:100,tw:12,t:0.9}))]},
    digoxin:{title:'地高辛效应教学示意',description:'V5 导联 ST 段呈“鱼钩/勺状”下垂样压低，T 波低平，QT 相对缩短。这代表药物效应，不等于中毒。',rows:[row('V5',beats(N,{scoop:11,t:0.2,tAt:46}))]},
    'ventricular-pacing':{title:'心室起搏心电图教学示意',description:'II 导联每个宽 QRS 前有起搏脉冲（红色竖线），QRS 宽大，ST-T 与主波方向相反。双极起搏的脉冲在体表心电图上可能很小。',rows:[row('II',N.flatMap(c=>beat(c,{p:false,qrs:'paced',t:-1,tAt:50,tw:10})),N.map(c=>c-14))]},
    'pacing-malfunction':{title:'起搏异常教学示意',description:'上行（II）：第二、四个起搏脉冲后无相应 QRS（失夺获）。下行（II）：自身 QRS 后仍有起搏脉冲落在 T 波上（感知不良）。',rows:[row('II',[90,410].flatMap(c=>beat(c,{p:false,qrs:'paced',t:-1,tAt:50,tw:10})),[76,236,396,556]),row('II',[...beats([90,330],{}),...beat(570,{p:false,qrs:'paced',t:-1,tAt:50,tw:10})],[150,556])]}
  });

  const sawtooth=(period,amp)=>[x=>{const k=((x%period)+period)%period/period;return amp*(k<0.8?(k/0.8)*2-1:1-(k-0.8)/0.2*2);}];
  Object.assign(drawings,{
    'atrial-flutter':{title:'典型心房扑动教学示意',description:'II 导联连续的锯齿样扑动波（F 波），波间无等电位线；本例为 4:1 传导，心室率规则。',rows:[row('II',[...sawtooth(32,7),...[60,188,316,444,572].flatMap(c=>beat(c,{p:false,t:0.25,tAt:40,tw:6}))])]},
    wpw:{title:'心室预激（WPW 图形）教学示意',description:'II 导联 PR 间期缩短，QRS 起始部有缓慢上升的 delta 波，QRS 增宽。',rows:[row('II',N.flatMap(c=>[...beat(c,{pr:18,r:1.05}),x=>G(x,c-9,5,-15)]))]},
    brugada:{title:'1 型 Brugada 图形教学示意',description:'V1 导联 QRS 后 ST 段穹窿形抬高（下斜型），随后 T 波倒置。',rows:[row('V1',N.flatMap(c=>[...beat(c,{r:0.4,s:0.6,t:-1.1,tAt:48,tw:8}),x=>(x>c+3?-26*Math.exp(-((x-c-6)**2)/(2*15*15))*(x<c+6?(x-c-3)/3:1):0)]))]},
    pericarditis:{title:'急性心包炎教学示意',description:'II 导联 ST 段凹面向上抬高并 PR 段压低；aVR 导联相反：ST 段压低、PR 段抬高。',rows:[row('II',N.flatMap(c=>[...beat(c,{st:9,t:1.1,tAt:56}),x=>plateau(x,c-22,c-10,3)])),row('aVR',N.flatMap(c=>[...beat(c,{r:-0.7,s:0,st:-4,t:-0.7}),x=>plateau(x,c-22,c-10,-2)]))]},
    'early-repolarization':{title:'早期复极教学示意',description:'V4 导联 QRS 终末部 J 点切迹，ST 段凹面向上轻度抬高，T 波高大。',rows:[row('V4',N.flatMap(c=>[...beat(c,{r:1.2,s:0.15,st:4,t:1.5,tw:9}),x=>G(x,c+9,1.6,-7)]))]},
    lafb:{title:'左前分支阻滞教学示意',description:'I 导联以 R 波为主（qR），aVF 导联以深 S 波为主（rS），提示电轴显著左偏；QRS 时限基本正常。',rows:[row('I',beats(N,{q:0.4,r:1,s:0.1})),row('aVF',beats(N,{r:0.35,s:1.5,t:0.6}))]}
  });
  function render(kind){
    const drawing=drawings[kind];
    if(!drawing)return '';
    const id='ecg-sketch-'+(++serial),height=drawing.rows.length*104+24;
    const rows=drawing.rows.map((row,index)=>{
      const baseline=62+index*104;
      const d=row.points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+' '+(baseline+y).toFixed(1)).join(' ');
      const spikes=(row.spikes||[]).map(x=>'M'+x+' '+(baseline+4)+'V'+(baseline-30)).join('');
      return '<text x="8" y="'+(baseline-39)+'" fill="#293f50" font-size="16">'+esc(row.lead)+'</text><path d="'+d+'" fill="none" stroke="#135f9c" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'+(spikes?'<path d="'+spikes+'" stroke="#b42318" stroke-width="1.6"/>':'');
    }).join('');
    const labels=drawing.labels?'<g fill="#142c42" font-size="15"><text x="64" y="43">P</text><text x="87" y="19">QRS</text><text x="132" y="40">T</text></g>':'';
    return '<svg class="ecg-waveform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 '+height+'" role="img" aria-labelledby="'+id+'-title '+id+'-desc">'+
      '<title id="'+id+'-title">'+esc(drawing.title)+'</title><desc id="'+id+'-desc">'+esc(drawing.description)+'</desc>'+
      '<defs><pattern id="'+id+'-small" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" fill="none" stroke="#dce4eb" stroke-width=".5"/></pattern><pattern id="'+id+'-big" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="url(#'+id+'-small)"/><path d="M40 0H0V40" fill="none" stroke="#c1d3e1" stroke-width="1"/></pattern></defs>'+
      '<rect width="640" height="'+height+'" fill="#fff"/><rect width="640" height="'+height+'" fill="url(#'+id+'-big)"/>'+rows+labels+'</svg>';
  }
  window.HAJIMI_ECG_WAVEFORMS=Object.freeze({render});
})();

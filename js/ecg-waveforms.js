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
    'second-degree-avb':{title:'二度房室传导阻滞教学示意',description:'上行（II）：PR 逐搏延长后一个 P 波未下传（文氏型）。下行（II）：PR 固定，突然出现未下传的 P 波（莫氏 II 型）。',rows:[row('II',[...beat(70,{pr:30}),...beat(212,{pr:42}),...beat(354,{pr:54}),...P(430),...beat(590,{pr:30})]),row('II',[...beat(90,{pr:34}),...beat(250,{pr:34}),...P(376),...beat(570,{pr:34})])]},
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
    'atrial-flutter':{title:'典型心房扑动教学示意',description:'II 导联连续的锯齿样扑动波（F 波），波间无等电位线；本例为 4:1 传导，心室率规则。',rows:[row('II',[...sawtooth(40,7),...[70,230,390,550].flatMap(c=>beat(c,{p:false,t:0.25,tAt:40,tw:6}))])]},
    wpw:{title:'心室预激（WPW 图形）教学示意',description:'II 导联 PR 间期缩短，QRS 起始部有缓慢上升的 delta 波，QRS 增宽。',rows:[row('II',N.flatMap(c=>[...beat(c,{pr:18,r:1.05}),x=>G(x,c-9,5,-15)]))]},
    brugada:{title:'1 型 Brugada 图形教学示意',description:'V1 导联 QRS 后 ST 段穹窿形抬高（下斜型），随后 T 波倒置。',rows:[row('V1',N.flatMap(c=>[...beat(c,{r:0.4,s:0.6,t:-1.1,tAt:48,tw:8}),x=>(x>c+3?-26*Math.exp(-((x-c-6)**2)/(2*15*15))*(x<c+6?(x-c-3)/3:1):0)]))]},
    pericarditis:{title:'急性心包炎教学示意',description:'II 导联 ST 段凹面向上抬高并 PR 段压低；aVR 导联相反：ST 段压低、PR 段抬高。',rows:[row('II',N.flatMap(c=>[...beat(c,{st:9,t:1.1,tAt:56}),x=>plateau(x,c-22,c-10,3)])),row('aVR',N.flatMap(c=>[...beat(c,{r:-0.7,s:0,st:-4,t:-0.7}),x=>plateau(x,c-22,c-10,-2)]))]},
    'early-repolarization':{title:'早期复极教学示意',description:'V4 导联 QRS 终末部 J 点切迹，ST 段凹面向上轻度抬高，T 波高大。',rows:[row('V4',N.flatMap(c=>[...beat(c,{r:1.2,s:0.15,st:4,t:1.5,tw:9}),x=>G(x,c+9,1.6,-7)]))]},
    lafb:{title:'左前分支阻滞教学示意',description:'I 导联以 R 波为主（qR），aVF 导联以深 S 波为主（rS），提示电轴显著左偏；QRS 时限基本正常。',rows:[row('I',beats(N,{q:0.4,r:1,s:0.1})),row('aVF',beats(N,{r:0.35,s:1.5,t:0.6}))]}
  });

  Object.assign(drawings,{
    'mobitz-i':{title:'二度 I 型房室传导阻滞（文氏）教学示意',description:'II 导联 PR 逐搏延长，第 4 个 P 波后 QRS 脱落，脱落后的第一个 PR 最短。',rows:[row('II',[...beat(70,{pr:30}),...beat(212,{pr:42}),...beat(354,{pr:54}),...P(430),...beat(590,{pr:30})])]},
    'mobitz-ii':{title:'二度 II 型房室传导阻滞教学示意',description:'II 导联 PR 固定，第 3 个 P 波后突然没有 QRS；本例 QRS 增宽，提示阻滞部位可能在希浦系统。',rows:[row('II',[...beat(90,{pr:32,qrs:'broad',s:0.4,t:-0.6,tAt:50}),...beat(250,{pr:32,qrs:'broad',s:0.4,t:-0.6,tAt:50}),...P(378),...beat(570,{pr:32,qrs:'broad',s:0.4,t:-0.6,tAt:50})])]},
    'av-block-2-1':{title:'2:1 房室传导阻滞教学示意',description:'II 导联 P 波规则出现，每 2 个 P 波只有 1 个下传，下传的 PR 固定。',rows:[row('II',[...[100,320,540].flatMap(c=>beat(c,{pr:30,tAt:54,tw:7})),...[180,400].flatMap(c=>P(c))])]},
    'high-grade-av-block':{title:'高度房室传导阻滞教学示意',description:'II 导联连续 2 个 P 波未下传（3:1 传导），下传的 PR 固定。',rows:[row('II',[...[100,340,580].flatMap(c=>beat(c,{pr:30})),...[150,230,390,470].flatMap(c=>P(c))])]},
    'sinus-node-dysfunction':{title:'窦性停搏教学示意',description:'II 导联前两个窦性搏动后出现长间歇，其间没有 P 波，随后恢复窦性搏动。',rows:[row('II',beats([70,200,560],{}))]},
    'anterior-stemi':{title:'前壁 ST 段抬高教学示意',description:'V2、V3 导联 ST 段明显抬高并与 T 波融合，R 波振幅降低。',rows:[row('V2',beats(N,{r:0.45,s:1,st:14,t:1.3,tAt:54,tw:11})),row('V3',beats(N,{r:0.6,s:0.7,st:12,t:1.3,tAt:54,tw:11}))]},
    'inferior-stemi':{title:'下壁 ST 段抬高教学示意',description:'III 导联 ST 段抬高（常高于 II 导联）；aVL 导联对应性 ST 段压低。',rows:[row('III',beats(N,{r:0.7,st:14,t:1.2,tAt:54,tw:11})),row('aVL',beats(N,{r:0.5,st:-7,t:-0.7}))]},
    'lateral-stemi':{title:'侧壁 ST 段抬高教学示意',description:'I、aVL 导联 ST 段抬高；下壁导联（此处示 III）对应性压低。',rows:[row('aVL',beats(N,{r:0.7,st:10,t:1,tAt:54,tw:10})),row('III',beats(N,{r:0.6,st:-7,t:-0.7}))]},
    'posterior-mi':{title:'后壁心肌梗死教学示意',description:'V2 导联 R 波增高、水平型 ST 段压低、T 波直立（前壁导联的“镜像”）；V8 导联 ST 段抬高。',rows:[row('V2',beats(N,{r:1.2,s:0.3,st:-8,t:0.9})),row('V8',beats(N,{q:0.6,r:0.4,s:0.2,st:5,t:0.8,tAt:54}))]},
    'rv-infarction':{title:'右心室梗死教学示意',description:'右胸导联 V4R 的 ST 段抬高；常合并下壁 ST 段抬高。',rows:[row('V4R',beats(N,{r:0.4,s:0.8,st:7,t:0.9,tAt:54}))]},
    'lbbb-mi':{title:'左束支阻滞背景下的急性心肌梗死教学示意',description:'V5 导联在宽 QRS 主波向上的同时，ST 段同向（一致性）抬高——这是 Sgarbossa 标准中最有特异性的表现。',rows:[row('V5',beats(N,{qrs:'wide',s:0,st:13,t:1.1,tAt:58,tw:10}))]},
    'de-winter':{title:'de Winter T 波教学示意',description:'V3 导联 J 点压低、ST 段上斜型压低，接续高大、对称的 T 波，无明显 ST 段抬高。',rows:[row('V3',N.flatMap(c=>[...beat(c,{r:0.9,s:0.6,t:2,tAt:44,tw:8}),x=>(x>c+6&&x<c+34?6*(1-(x-c-6)/28):0)]))]},
    wellens:{title:'Wellens 图形教学示意',description:'上行（V2）：T 波正负双向（A 型）。下行（V3）：深而对称的 T 波倒置（B 型）。常见于胸痛缓解后。',rows:[row('V2',N.flatMap(c=>[...beat(c,{r:0.5,s:0.9,t:1.1,tAt:44,tw:6}),x=>G(x,c+62,7,9)])),row('V3',beats(N,{r:0.7,s:0.6,t:-1.6,tAt:52,tw:9}))]},
    'old-mi':{title:'陈旧性心肌梗死（病理性 Q 波）教学示意',description:'III 导联宽而深的 Q 波（QS/Qr 形），伴 T 波倒置；ST 段已回到基线。',rows:[row('III',N.flatMap(c=>[...beat(c,{r:0.25,s:0,t:-0.8}),x=>G(x,c-4,3,24)]))]},
    'sinus-tachycardia':{title:'窦性心动过速教学示意',description:'II 导联每个 QRS 前均有形态正常的 P 波，心率增快（RR 缩短）。',rows:[row('II',[50,150,250,350,450,550].flatMap(c=>beat(c,{pr:26,tAt:46,tw:7})))]},
    'junctional-rhythm':{title:'交界性心律教学示意',description:'II 导联窄 QRS 规则出现，QRS 前没有正常 P 波，QRS 后可见倒置的逆行 P 波。',rows:[row('II',[100,330,560].flatMap(c=>[...beat(c,{p:false}),...P(c+20,-0.8)]))]},
    'atrial-tachycardia':{title:'局灶性房性心动过速教学示意',description:'II 导联 P 波形态异常（此例倒置），P 波之间有等电位线，心率快而规则。',rows:[row('II',[60,145,230,315,400,485,570].flatMap(c=>beat(c,{pAmp:-1,pr:24,t:0.7,tAt:36,tw:6})))]},
    mat:{title:'多源性房性心动过速教学示意',description:'II 导联可见 ≥3 种形态不同的 P 波，PR 间期和 RR 间期不等，心率 >100 次/分。',rows:[row('II',[[60,1,26],[150,-0.7,22],[225,1.8,30],[320,0.5,20],[392,-1,26],[490,1.4,32],[565,0.6,24]].flatMap(([c,a,pr])=>beat(c,{pAmp:a,pr,t:0.7,tAt:36,tw:6})))]},
    aivr:{title:'加速性室性自主心律教学示意',description:'II 导联宽 QRS 规则出现，频率约 60–100 次/分，前无相关 P 波；常见于再灌注后，多可自行终止。',rows:[row('II',[90,240,390,540].flatMap(c=>beat(c,{p:false,qrs:'broad',s:0.6,t:-1,tAt:46,tw:10})))]}
  });

  // Sixth batch (textbook-guided entries): atrial abnormality, premature beats, inherited
  // channelopathies, posterior fascicular block, dextrocardia and low voltage.
  const notchedP=(c,pr=36)=>[x=>G(x,c-pr,3.4,-6)+G(x,c-pr+13,3.6,-7)];
  const biphasicP=(c,pr=36)=>[x=>G(x,c-pr,3,-4)+G(x,c-pr+12,4.5,7)];
  Object.assign(drawings,{
    lae:{title:'左心房异常教学示意',description:'II 导联 P 波增宽、双峰（第二峰略高，峰距 >40 ms）；V1 导联 P 波正负双向，终末负向部分宽而深（Ptf-V1 负值增大）。',rows:[row('II',N.flatMap(c=>[...beat(c,{p:false}),...notchedP(c)])),row('V1',N.flatMap(c=>[...beat(c,{p:false,r:0.35,s:1.3,t:0.5}),...biphasicP(c)]))]},
    rae:{title:'右心房异常教学示意',description:'II 导联 P 波高尖（≥0.25 mV），时限不增宽；V1 导联 P 波直立高尖。',rows:[row('II',beats(N,{pAmp:2.7,pw:2.8})),row('V1',beats(N,{pAmp:2.1,pw:2.8,r:0.4,s:1.1,t:0.4}))]},
    pac:{title:'房性早搏教学示意',description:'II 导联第三个搏动提前出现，其前 P′ 波形态与窦性 P 波不同，QRS 形态正常；其后为不完全性代偿间歇。',rows:[row('II',[...beats([90,250],{}),...beat(370,{pAmp:-0.8,pr:30}),...beats([540],{})])]},
    pjc:{title:'交界性早搏教学示意',description:'II 导联第三个搏动提前出现，QRS 形态与窦性相同，其前无 P 波，QRS 后可见倒置的逆行 P′ 波；其后多为完全性代偿间歇。',rows:[row('II',[...beats([90,250],{}),...beat(370,{p:false}),...P(388,-0.8),...beats([570],{})])]},
    lqts:{title:'先天性长 QT 综合征教学示意',description:'II 导联 QT 间期明显延长，T 波低平并有切迹（双峰）。仅示意形态；不同基因型 T 波形态差异较大。',rows:[row('II',[90,330,570].flatMap(c=>[...beat(c,{t:0.55,tAt:96,tw:9}),x=>G(x,c+122,7,-6)]))]},
    sqts:{title:'短 QT 综合征教学示意',description:'V3 导联 ST 段几乎消失，T 波紧接 QRS、高尖且对称，QT 间期明显缩短。',rows:[row('V3',beats(N,{r:0.8,s:0.6,t:1.9,tAt:30,tw:6}))]},
    cpvt:{title:'双向性室性心动过速教学示意',description:'II 导联宽 QRS 心动过速，QRS 主波方向逐搏交替（向上、向下），为 CPVT 的典型发作形式之一；静息心电图通常正常。',rows:[row('II',[62,128,194,260,326,392,458,524,590].flatMap((c,i)=>beat(c,{p:false,qrs:'broad',r:i%2?-0.9:1,s:i%2?-0.3:0.6,t:i%2?0.9:-0.9,tAt:32,tw:8})))]},
    lpfb:{title:'左后分支阻滞教学示意',description:'I 导联呈 rS（以 S 波为主），III 导联呈 qR（以 R 波为主），提示电轴右偏；QRS 时限基本正常。',rows:[row('I',beats(N,{r:0.35,s:1.3,t:0.5})),row('III',beats(N,{q:0.5,r:1.3,s:0.1}))]},
    dextrocardia:{title:'镜像右位心教学示意',description:'上行为 I 导联：P 波、QRS 和 T 波全部倒置。下行为 V6 导联：R 波很小、以 S 波为主（胸导联 R 波自 V1 向 V6 逐渐变小）——这是与左右上肢电极接反的关键区别。',rows:[row('I',beats(N,{pAmp:-1,r:-0.8,s:-0.3,t:-1})),row('V6',beats(N,{pAmp:0.6,r:0.18,s:0.7,t:0.3}))]},
    'low-voltage':{title:'低电压与电交替教学示意',description:'II 导联 QRS 振幅普遍很小，心率偏快，QRS 振幅逐搏高低交替（电交替），提示大量心包积液的可能。',rows:[row('II',[60,160,260,360,460,560].flatMap((c,i)=>beat(c,{pAmp:0.6,r:i%2?0.22:0.42,s:0.1,t:0.3,tAt:44,tw:7})))]}
  });

  // Seventh batch (textbook arrhythmia chapters).
  Object.assign(drawings,{
    'sa-block':{title:'二度 II 型窦房阻滞教学示意',description:'II 导联前两个窦性搏动后出现长间歇，长 PP 恰为基本 PP 的 2 倍，其间没有 P 波。',rows:[row('II',beats([70,210,490],{}))]},
    wandering:{title:'心房内游走节律教学示意',description:'II 导联 P 波由直立高大逐渐变小、平坦直至倒置，PR 随之缩短，RR 略延长。',rows:[row('II',[[60,1.4,32],[185,0.9,30],[315,0.3,26],[450,-0.7,22],[590,-0.9,20]].flatMap(([c,a,pr])=>beat(c,{pAmp:a,pr})))]},
    'short-pr':{title:'短 PR 间期教学示意',description:'II 导联 PR 明显缩短（<120 ms），QRS 窄，起始部没有 delta 波。',rows:[row('II',beats(N,{pr:17}))]},
    mahaim:{title:'Mahaim 旁路前传心动过速教学示意',description:'V1 导联宽而深的 QS/rS 波（左束支阻滞形）规则快速出现，未见与之相关的 P 波。',rows:[row('V1',[62,132,202,272,342,412,482,552].flatMap(c=>beat(c,{p:false,qrs:'qs',r:1.2,t:0.9,tAt:38,tw:8})))]},
    avrt:{title:'顺向型房室折返性心动过速教学示意',description:'II 导联窄 QRS 规则心动过速，每个 QRS 后的 ST 段上可见倒置的逆行 P′ 波（RP′ 短于 P′R）。',rows:[row('II',[60,138,216,294,372,450,528,606].flatMap(c=>[...beat(c,{p:false,t:0.6,tAt:40,tw:6}),...P(c+22,-0.9)]))]},
    'rvot-vt':{title:'右室流出道特发性室速教学示意',description:'上行 II 导联：宽大高 R 波（电轴下偏）。下行 V1 导联：宽 QS/rS 波（左束支阻滞形）。',rows:[row('II',[62,134,206,278,350,422,494,566].flatMap(c=>beat(c,{p:false,qrs:'broad',r:1.1,s:0.2,t:-0.8,tAt:36,tw:8}))),row('V1',[62,134,206,278,350,422,494,566].flatMap(c=>beat(c,{p:false,qrs:'qs',r:1,t:0.8,tAt:36,tw:8})))]},
    npjt:{title:'非阵发性交界性心动过速教学示意',description:'II 导联窄 QRS 规则出现，约 90 次/分，QRS 前无 P 波，ST 段上可见倒置的逆行 P′ 波。',rows:[row('II',[70,200,330,460,590].flatMap(c=>[...beat(c,{p:false}),...P(c+24,-0.8)]))]},
    pjrt:{title:'持续性交界区反复性心动过速教学示意',description:'II 导联窄 QRS 心动过速，倒置的逆行 P′ 远离前一个 QRS、靠近下一个 QRS（RP′ 长于 P′R）。',rows:[row('II',[60,150,240,330,420,510,600].flatMap(c=>[...beat(c,{p:false,t:0.6,tAt:34,tw:6}),...P(c+60,-1.4)]))]},
    vflutter:{title:'心室扑动教学示意',description:'II 导联规则、连续的正弦样大波（约 280 次/分），没有等电位线，无法分辨 QRS 与 T 波。',rows:[row('II',[x=>-28*Math.sin(2*Math.PI*(x-28)/43)])]}
  });

  // Eighth batch (textbook chapters 4–6 and 9).
  Object.assign(drawings,{
    'mi-evolution':{title:'急性心肌梗死演变教学示意',description:'上行：超急性期 T 波高大宽阔。中行：急性期 ST 弓背向上抬高并与 T 融合（单向曲线）。下行：演变期出现 Q 波，ST 回落，T 波对称倒置。',rows:[row('V3 超急性期',beats(N,{r:1.1,s:0.5,t:2.1,tAt:50,tw:12})),row('V3 急性期',beats(N,{r:0.8,s:0.1,st:24,t:0.9,tAt:56,tw:12})),row('V3 演变期',N.flatMap(c=>[...beat(c,{r:0.35,s:0.2,t:-1.3,tAt:54,tw:9}),x=>G(x,c-4,3,20)]))]},
    'variant-angina':{title:'变异型心绞痛教学示意',description:'上行（发作时）：V3 导联 ST 段抬高、T 波高尖。下行（缓解后数分钟）：ST-T 恢复正常。',rows:[row('V3 发作时',beats(N,{r:1.15,s:0.1,st:20,t:1.3,tAt:54,tw:11})),row('V3 缓解后',beats(N,{r:0.9,s:0.6,t:1}))]},
    aneurysm:{title:'室壁瘤持续性 ST 抬高教学示意',description:'V2 导联 QS 波，其后 ST 段持续抬高并接倒置 T 波；与数周前心电图形态相同。',rows:[row('V2',beats(N,{qrs:'qs',r:1.1,st:7,t:-0.9,tAt:56,tw:9}))]},
    'pseudo-q':{title:'体位相关的 III 导联 Q 波教学示意',description:'上行（平静呼气）：III 导联呈 Qr 形。下行（深吸气后）：Q 波消失，呈以 R 波为主的图形。',rows:[row('III 呼气',N.flatMap(c=>[...beat(c,{r:0.45,s:0.1,t:0.4}),x=>G(x,c-5,2.8,22)])),row('III 深吸气',beats(N,{r:0.9,s:0.2,t:0.6}))]},
    'cns-t':{title:'颅内病变相关 T 波教学示意',description:'V3 导联宽而深的倒置 T 波，QT 间期明显延长。',rows:[row('V3',[90,330,570].flatMap(c=>beat(c,{r:0.9,s:0.5,t:-2.4,tAt:104,tw:20})))]},
    exercise:{title:'运动负荷试验教学示意',description:'上行（静息）：V5 导联 ST 段正常。下行（运动中，心率增快）：ST 段水平型压低。',rows:[row('V5 静息',beats(N,{})),row('V5 运动中',[60,160,260,360,460,560].flatMap(c=>beat(c,{pr:26,s:0.1,st:-11,t:0.35,tAt:50,tw:6})))]},
    antiarrhythmic:{title:'Ia 类抗心律失常药作用教学示意',description:'II 导联 QRS 轻度增宽、T 波低平，QT 间期延长。',rows:[row('II',[90,310,530].flatMap(c=>beat(c,{qrs:'broad',r:0.9,s:0.4,t:0.45,tAt:98,tw:12})))]}
  });

  // Ninth batch (textbook pacing chapters 23–27).
  const VP={p:false,qrs:'paced',t:-1,tAt:50,tw:10};
  Object.assign(drawings,{
    'pacing-vvi':{title:'VVI 起搏教学示意',description:'II 导联前两个为心室起搏搏动（脉冲后宽 QRS）；第三个为自身窄 QRS，起搏器被抑制并从此重新计时，到期后再发放脉冲。',rows:[row('II',[...[90,250].flatMap(c=>beat(c,VP)),...beat(390,{}),...beat(550,VP)],[76,236,536])]},
    'atrial-pacing':{title:'AAI 心房起搏教学示意',description:'II 导联每个心房起搏脉冲后跟一个 P 波，随后为自身下传的窄 QRS。',rows:[row('II',beats(N,{pr:30,pAmp:1.2}),N.map(c=>c-34))]},
    'dual-chamber':{title:'双腔起搏教学示意',description:'上行（房室顺序起搏）：心房脉冲 → P 波 → 心室脉冲 → 宽 QRS。下行（P 波跟踪）：自身 P 波 → 心室脉冲 → 宽 QRS。',rows:[row('II 房室顺序',N.flatMap(c=>[...beat(c,{...VP}),...P(c-34)]),N.flatMap(c=>[c-38,c-14])),row('II P 波跟踪',N.flatMap(c=>[...beat(c,{...VP}),...P(c-34)]),N.map(c=>c-14))]},
    crt:{title:'双心室起搏教学示意',description:'上行 I 导联：起搏 QRS 以负向为主。下行 V1 导联：起搏 QRS 以 R 波为主（右束支阻滞样），时限较右室心尖起搏窄。',rows:[row('I',N.flatMap(c=>[...beat(c,{p:false,qrs:'broad',r:-0.9,s:-0.2,t:0.8,tAt:44,tw:9}),...P(c-34)]),N.map(c=>c-12)),row('V1',N.flatMap(c=>[...beat(c,{p:false,qrs:'broad',r:1.1,s:0.2,t:-0.8,tAt:44,tw:9}),...P(c-34)]),N.map(c=>c-12))]},
    'pacing-fusion':{title:'融合波与伪融合波教学示意',description:'II 导联：前两个为完全起搏的宽 QRS；第三个为融合波，形态介于自身与起搏之间；第四个为伪融合波，脉冲叠加在自身窄 QRS 中，QRS 形态与自身相同。',rows:[row('II',[...[90,250].flatMap(c=>beat(c,VP)),...beat(410,{qrs:'broad',r:0.75,s:0.3,t:-0.3,tAt:46,tw:9}),...beat(570,{})],[76,236,398,568])]},
    pmt:{title:'起搏器介导的心动过速教学示意',description:'II 导联：一个窦性搏动后出现室性早搏，其后每个心室起搏 QRS 后都有倒置的逆行 P 波，被心房通道跟踪，形成连续快速的心室起搏。',rows:[row('II',[...beat(60,{}),...beat(165,{p:false,qrs:'broad',r:-1,s:-0.3,t:1.1,tAt:38,tw:9}),...P(203,-1.5),...[275,375,475,575].flatMap(c=>[...beat(c,{...VP,t:-0.7,tAt:62,tw:8}),...P(c+32,-1.5)])],[261,361,461,561])]}
  });

  // Tenth batch (textbook chapter 7).
  Object.assign(drawings,{
    hcm:{title:'肥厚型心肌病教学示意',description:'上行 V5 导联：深而窄的 Q 波、高 R 波，T 波直立。下行（心尖肥厚型）V4 导联：高 R 波伴对称性巨大倒置 T 波。',rows:[row('V5',N.flatMap(c=>[...beat(c,{r:1.6,s:0.1,t:0.9}),x=>G(x,c-6,1.4,22)])),row('V4 心尖型',beats(N,{r:1.8,s:0.2,st:-3,t:-2.6,tAt:56,tw:10}))]},
    arvc:{title:'致心律失常性右室心肌病教学示意',description:'V1 导联 QRS 终末部可见低振幅小棘波（Epsilon 波），其后 T 波倒置。',rows:[row('V1',N.flatMap(c=>[...beat(c,{r:0.35,s:1,t:-0.9,tAt:56,tw:9}),x=>G(x,c+14,1,-5)+G(x,c+19,0.9,4)]))]},
    asd:{title:'继发孔型房间隔缺损教学示意',description:'上行 V1 导联：rSr′（不完全性右束支阻滞样）。下行 II 导联：R 波顶部附近切迹（“钩型”R 波）。',rows:[row('V1',beats(N,{qrs:'rbbb',t:0.4})),row('II',N.flatMap(c=>[...beat(c,{r:1,s:0.2}),x=>G(x,c-1,0.9,14)]))]}
  });

  // Artifact and lead-reversal sketches for the basics page.
  const noise=(amp,rate,seed=0)=>[x=>amp*(Math.sin(x*rate+seed)*0.6+Math.sin(x*rate*1.9+seed*3)*0.4)];
  Object.assign(drawings,{
    'artifact-tremor':{title:'肌电干扰（震颤）伪差教学示意',description:'II 导联基线上叠加细小、不规则的高频波动；QRS 仍按原节律规则出现，可被误认为房颤或房扑。',rows:[row('II',[...beats(N,{}),...noise(2.4,1.3,0.7),...noise(1.4,2.7,2.1)])]},
    'artifact-ac':{title:'交流电干扰（50 Hz）伪差教学示意',description:'II 导联基线呈规则、致密的细小锯齿状波动（工频干扰），波形本身仍可辨认。',rows:[row('II',[...beats(N,{}),x=>1.6*Math.sin(x*Math.PI*0.9)])]},
    'artifact-wander':{title:'基线漂移教学示意',description:'II 导联基线随呼吸或体动缓慢上下起伏，可干扰 ST 段判断。',rows:[row('II',[...beats(N,{}),x=>12*Math.sin(x/95)])]},
    'artifact-motion':{title:'运动伪差酷似室速教学示意',description:'II 导联中段出现大幅不规则波动，酷似宽 QRS 心动过速；仔细看可见原有窄 QRS 仍按规则节律“穿行”其中。',rows:[row('II',[...beats([70,190,310,430,550],{}),x=>(x>200&&x<470?-28*Math.sin((x-200)*0.14)*Math.sin(Math.PI*(x-200)/270):0)])]},
    'lead-reversal':{title:'左右上肢电极接反教学示意',description:'上行为 I 导联：P 波、QRS 和 T 波全部倒置。下行为同一患者 V6 导联：形态正常（胸导联不受影响）。',rows:[row('I',beats(N,{pAmp:-1,r:-0.8,s:-0.3,t:-1})),row('V6',beats(N,{}))]}
  });
  // Chest-electrode placement diagram (schematic, not to scale).
  function electrodes(){
    const id='ecg-electrodes-'+(++serial);
    const sites=[['V1',268,214],['V2',332,214],['V3',347,246],['V4',362,278],['V5',438,278],['V6',478,278]];
    const ribs=[150,182,214,246,278,310].map((y,i)=>'<path d="M300 '+(y-6)+'Q'+(178-i*6)+' '+(y+10)+' '+(132-i*4)+' '+(y+42)+'M300 '+(y-6)+'Q'+(422+i*6)+' '+(y+10)+' '+(468+i*4)+' '+(y+42)+'" fill="none" stroke="#c9d6e2" stroke-width="2"/>').join('');
    const dots=sites.map(([name,x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="11" fill="#1b66bd"/><text x="'+x+'" y="'+(y+5)+'" fill="#fff" font-size="11" text-anchor="middle" font-weight="700">'+name+'</text>').join('');
    return '<svg class="ecg-waveform ecg-electrodes" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" role="img" aria-labelledby="'+id+'-title '+id+'-desc">'+
      '<title id="'+id+'-title">胸前导联电极位置示意</title><desc id="'+id+'-desc">V1 胸骨右缘第 4 肋间；V2 胸骨左缘第 4 肋间；V4 左锁骨中线第 5 肋间；V3 位于 V2 与 V4 连线中点；V5 左腋前线、V6 左腋中线，均与 V4 同一水平。</desc>'+
      '<rect width="600" height="380" fill="#fff"/><path d="M150 70Q300 20 450 70L520 360H80Z" fill="#f6f9fc" stroke="#9fb3c6" stroke-width="2"/>'+ribs+
      '<rect x="288" y="96" width="24" height="200" rx="10" fill="#e3ebf3" stroke="#9fb3c6"/>'+
      '<path d="M362 120V340" stroke="#e0a43a" stroke-width="2" stroke-dasharray="6 5"/><path d="M438 140V340" stroke="#e0a43a" stroke-width="2" stroke-dasharray="6 5"/><path d="M478 160V340" stroke="#e0a43a" stroke-width="2" stroke-dasharray="6 5"/>'+
      '<g fill="#5b6b7b" font-size="13"><text x="300" y="90" text-anchor="middle">胸骨</text><text x="362" y="356" text-anchor="middle">锁骨中线</text><text x="430" y="372" text-anchor="middle">腋前线</text><text x="500" y="356" text-anchor="middle">腋中线</text><text x="166" y="222">第 4 肋间</text><text x="166" y="286">第 5 肋间</text></g>'+dots+'</svg>';
  }
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
  window.HAJIMI_ECG_WAVEFORMS=Object.freeze({render,electrodes,kinds:()=>Object.keys(drawings),MS_PER_UNIT:5});
})();

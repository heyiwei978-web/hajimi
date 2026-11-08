/* Classic 12-lead ECGs: original teaching drawings generated from a parametric beat
 * model. They are not recordings of patients and are not for diagnostic measurement.
 *
 * Paper: 25 mm/s and 10 mm/mV; one SVG unit is 1 mm, so 1 small square = 40 ms / 0.1 mV.
 * Only leads I, II and V1–V6 are described. III, aVR, aVL and aVF are computed from
 * I and II with Einthoven's and Goldberger's equations, so the frontal axis and the
 * reciprocal limb-lead changes are always consistent with each other.
 *
 * A lead template: p (mV), pNeg (terminal negative P, V1), qrs [[centre ms, sd ms, mV]...]
 * measured from QRS onset, st (mV, J point to T), t (mV), tUp/tDown (ms, T-wave slopes),
 * u (mV), pr (PR-segment shift, mV). Timings per ECG: qt (ms from QRS onset to T end).
 */
(()=>{
  'use strict';
  const LIMB=['I','II','III','aVR','aVL','aVF'],CHEST=['V1','V2','V3','V4','V5','V6'];
  const LAYOUT=[['I','aVR','V1','V4'],['II','aVL','V2','V5'],['III','aVF','V3','V6']];
  const G=(t,c,sd,a)=>a*Math.exp(-((t-c)*(t-c))/(2*sd*sd));
  const AG=(t,c,up,down,a)=>{const sd=t<c?up:down;return a*Math.exp(-((t-c)*(t-c))/(2*sd*sd));};
  const win=(t,a,b,k)=>1/(1+Math.exp(-(t-a)/k))-1/(1+Math.exp(-(t-b)/k));

  // Normal adult templates (frontal axis about +60°, R-wave progression V1→V5).
  const NORMAL={
    I:{p:.1,qrs:[[12,5,-.05],[42,10,.75],[70,8,-.1]],t:.25},
    II:{p:.15,qrs:[[12,5,-.05],[42,10,1.1],[70,8,-.15]],t:.35},
    V1:{p:.06,pNeg:.05,qrs:[[24,8,.25],[56,13,-1]],t:-.08},
    V2:{p:.06,qrs:[[26,9,.45],[60,13,-1.5]],st:.08,t:.5},
    V3:{p:.06,qrs:[[32,10,.85],[64,12,-.95]],st:.05,t:.5},
    V4:{p:.07,qrs:[[38,10,1.4],[70,10,-.5]],t:.45},
    V5:{p:.07,qrs:[[12,5,-.08],[42,10,1.45],[72,9,-.2]],t:.35},
    V6:{p:.07,qrs:[[12,5,-.08],[42,10,1.1],[72,9,-.1]],t:.25}
  };
  const neg=list=>list.map(([c,sd,a])=>[c,sd,-a]);
  // A broad, blunt ventricular deflection (two overlapping lobes), for VT, PVCs and escapes.
  const wide=(c,a,w=24)=>[[c-w*.7,w,a*.62],[c+w*.7,w,a*.62]];

  // ---- rhythm helpers: beats are {at: QRS onset ms, p: P onset ms or null, morph} ----
  function regular(rate,{pr=160,first=360,morph='n',p=true}={}){
    const rr=60000/rate,beats=[];
    for(let at=first;at<10600;at+=rr)beats.push({at,p:p?at-pr:null,morph});
    return {beats};
  }
  function seeded(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};}

  // ---- the classic ECGs ----
  const items=[
    {id:'normal',title:'正常 12 导联心电图',entry:null,link:'/ecg/basics#ecg-normal',category:'基础',rate:'约 72 次/分',
      rhythm:()=>regular(72),qt:380,
      points:['窦性心律：每个 QRS 前有 P 波，P 波在 I、II 直立，aVR 倒置；PR 约 160 ms。','QRS 窄（约 90 ms），电轴约 +60°（I、II、aVF 主波向上）。','胸导联 R 波由 V1 到 V5 逐渐增高，S 波逐渐变浅，移行区在 V3–V4。','ST 段在基线，T 波方向与 QRS 主波一致（aVR、V1 可倒置）。'],
      leads:{}},
    {id:'sinus-tachycardia',title:'窦性心动过速',entry:'sinus-tachycardia',category:'心律失常',rate:'约 115 次/分',
      rhythm:()=>regular(115,{pr:140}),qt:320,tDown:32,
      points:['窦性 P 波（I、II 直立），每个 P 后跟一个 QRS，心率 >100 次/分。','RR 规则，P 波可与前一 T 波靠近。','先找原因：疼痛、发热、贫血、低血容量、缺氧、肺栓塞等。'],
      leads:{}},
    {id:'sinus-bradycardia',title:'窦性心动过缓',entry:'sinus-bradycardia',category:'心律失常',rate:'约 48 次/分',
      rhythm:()=>regular(48,{pr:170}),qt:420,
      points:['窦性 P 波，PR 固定，心率 <60 次/分。','QRS 窄、形态正常。','结合症状、用药（β 受体阻滞剂等）和运动员基础心率判断意义。'],
      leads:{}},
    {id:'atrial-fibrillation',title:'心房颤动（快速心室率）',entry:'atrial-fibrillation',category:'心律失常',rate:'平均约 110 次/分',
      atrial:'fib',qt:330,
      rhythm:()=>{const r=seeded(7),beats=[];for(let at=300;at<10600;at+=380+r()*420)beats.push({at,p:null,morph:'n'});return {beats};},
      points:['RR 绝对不规则。','没有一致的 P 波，代之以细小、不规则的 f 波（V1 最明显）。','QRS 窄；心室率快时注意评估血流动力学与抗凝指征。'],
      leads:{I:{p:0},II:{p:0},V1:{p:0,pNeg:0},V2:{p:0},V3:{p:0},V4:{p:0},V5:{p:0},V6:{p:0}}},
    {id:'atrial-flutter',title:'典型心房扑动（2:1 传导）',entry:'atrial-flutter',category:'心律失常',rate:'心房约 300、心室约 150 次/分',
      atrial:'flutter',qt:300,tDown:30,
      rhythm:()=>regular(150,{p:false,first:330}),
      points:['II、III、aVF 连续的负向锯齿样 F 波，波间没有等电位线。','V1 可见分离的正向 F 波。','心房率约 300 次/分、心室率约 150 次/分规则：遇到心率恰为 150 左右的窄 QRS 心动过速，要想到 2:1 房扑。'],
      leads:{I:{p:0},II:{p:0},V1:{p:0,pNeg:0},V2:{p:0},V3:{p:0},V4:{p:0},V5:{p:0},V6:{p:0}}},
    {id:'svt',title:'阵发性室上性心动过速（房室结折返）',entry:'svt',category:'心律失常',rate:'约 180 次/分',
      qt:270,tDown:28,
      rhythm:()=>regular(180,{p:false,first:300}),
      points:['窄 QRS、RR 绝对规则的心动过速。','看不到窦性 P 波；逆行 P 波常埋在 QRS 内或紧随其后（V1 假性 r′、下壁导联假性 s 波）。','血流动力学稳定时可先试迷走神经刺激，再考虑腺苷。'],
      leads:{I:{p:0},II:{p:0,qrs:[[12,5,-.05],[42,10,1.1],[70,8,-.15],[96,7,-.1]]},V1:{p:0,pNeg:0,qrs:[[24,8,.25],[56,13,-1],[96,7,.12]]},V2:{p:0},V3:{p:0},V4:{p:0},V5:{p:0},V6:{p:0}}},
    {id:'ventricular-tachycardia',title:'单形性室性心动过速',entry:'ventricular-tachycardia',category:'心律失常',rate:'约 170 次/分',
      qt:360,
      rhythm:()=>{const vt=regular(170,{p:false,first:250});const ps=[];for(let p=420;p<10000;p+=800)ps.push(p);return {beats:vt.beats,ps};},
      points:['宽 QRS（约 160 ms）规则心动过速，形态一致。','房室分离：P 波按自身频率出现，与 QRS 无固定关系（偶尔可见于 II 导联）——支持室速。','电轴向上偏（II、III、aVF 主波向下），胸导联正向一致（V1–V4 均以 R 波为主）。','宽 QRS 心动过速在证实前按室速处理；不稳定者立即同步电复律。'],
      leads:{I:{p:.1,qrs:[...wide(60,.55),[135,18,-.12]],t:-.2,tUp:50},II:{p:.15,qrs:[...wide(70,-1.0),[140,16,.1]],t:.45,tUp:50},
        V1:{p:.06,pNeg:0,qrs:wide(75,1.25,26),t:-.45,tUp:50},V2:{p:.06,qrs:wide(75,1.15,26),t:-.4,tUp:50},V3:{p:.06,qrs:[...wide(70,.95),[140,16,-.2]],t:-.3,tUp:50},
        V4:{p:.06,qrs:[...wide(62,.75),[135,18,-.35]],t:-.15,tUp:50},V5:{p:.06,qrs:[[40,16,.3],...wide(115,-.75,20)],t:.25,tUp:50},V6:{p:.06,qrs:[[38,15,.22],...wide(112,-.8,20)],t:.3,tUp:50}}},
    {id:'first-degree-av-block',title:'一度房室传导阻滞',entry:'first-degree-av-block',category:'传导阻滞',rate:'约 70 次/分',
      rhythm:()=>regular(70,{pr:300}),qt:390,
      points:['每个 P 波后都有 QRS，PR 固定但 >200 ms（本例约 300 ms）。','QRS 窄。','单独出现多为良性；注意药物（β 受体阻滞剂、地高辛等）和合并的其他传导异常。'],
      leads:{}},
    {id:'mobitz-i',title:'二度 I 型房室传导阻滞（文氏）',entry:'mobitz-i',category:'传导阻滞',rate:'心房约 80 次/分（4:3 传导）',
      qt:380,
      rhythm:()=>{const beats=[],ps=[],prs=[160,250,310];let k=0;for(let p=200;p<10600;p+=750,k++){const i=k%4;if(i<3)beats.push({at:p+prs[i],p,morph:'n'});else ps.push(p);}return {beats,ps};},
      points:['P 波规则出现，PR 逐搏延长，直至一个 P 波后没有 QRS（本例 4:3 传导）。','脱落后的第一个 PR 最短；RR 逐渐缩短后出现长间歇，QRS 呈“成组”出现。','阻滞多在房室结，QRS 窄，通常预后较好。'],
      leads:{}},
    {id:'mobitz-ii',title:'二度 II 型房室传导阻滞',entry:'mobitz-ii',category:'传导阻滞',rate:'心房约 80 次/分（3:2 传导）',
      qt:390,
      rhythm:()=>{const beats=[],ps=[];let k=0;for(let p=200;p<10600;p+=750,k++){if(k%3<2)beats.push({at:p+180,p,morph:'n'});else ps.push(p);}return {beats,ps};},
      points:['PR 固定，突然出现一个未下传的 P 波（本例每 3 个 P 波脱落 1 个）。','脱落前后 PR 不变——与文氏型的关键区别。','阻滞多在希氏束以下，易进展为高度或三度阻滞，通常需要起搏评估。'],
      leads:{}},
    {id:'complete-heart-block',title:'三度房室传导阻滞（室性逸搏心律）',entry:'complete-heart-block',category:'传导阻滞',rate:'心房约 90、心室约 38 次/分',
      qt:460,
      rhythm:()=>{const beats=[];for(let at=700;at<10600;at+=1580)beats.push({at,p:null,morph:'esc'});const ps=[];for(let p=150;p<10600;p+=667)ps.push(p);return {beats,ps};},
      points:['P 波规则（约 90 次/分），QRS 也规则但更慢（约 38 次/分），两者毫无固定关系（房室分离）。','逸搏 QRS 宽大，提示逸搏起源于心室，频率慢且不稳定。','需紧急评估：停用减慢传导的药物，准备临时起搏。'],
      morphs:{esc:{I:{qrs:[...wide(60,.55,22),[125,18,.25]],t:-.25,tUp:60},II:{qrs:[...wide(65,.6,22),[128,18,.25]],t:-.2,tUp:60},
        V1:{qrs:[[20,7,.08],[80,32,-1.3]],st:.12,t:.35,tUp:60},V2:{qrs:[[20,7,.12],[85,32,-1.7]],st:.18,t:.45,tUp:60},V3:{qrs:[[22,8,.18],[88,30,-1.3]],st:.12,t:.35,tUp:60},
        V4:{qrs:[[50,20,.5],[110,22,-.6]],t:.1,tUp:60},V5:{qrs:[[50,20,.8],[105,22,.75]],st:-.1,t:-.3,tUp:60},V6:{qrs:[[50,20,.75],[105,22,.7]],st:-.08,t:-.28,tUp:60}}},
      leads:{}},
    {id:'right-bundle-branch-block',title:'完全性右束支传导阻滞',entry:'right-bundle-branch-block',category:'传导阻滞',rate:'约 75 次/分',
      rhythm:()=>regular(75),qt:400,
      points:['QRS ≥120 ms（本例约 140 ms）。','V1 呈 rsR′（“M”形），R′ 高于 r；V1–V2 继发性 T 波倒置。','I、V5、V6 有宽而钝的 S 波。','新出现的右束支阻滞要想到肺栓塞、心肌缺血等原因。'],
      leads:{I:{qrs:[[12,5,-.05],[40,10,.7],[105,18,-.35]],t:.2},II:{qrs:[[12,5,-.05],[40,10,.9],[105,18,-.25]],t:.3},
        V1:{qrs:[[22,8,.3],[52,9,-.45],[100,15,.9]],st:-.05,t:-.3},V2:{qrs:[[24,9,.45],[55,11,-.9],[102,15,.6]],t:-.15},
        V3:{qrs:[[36,10,.8],[64,11,-.7],[105,13,.2]],t:.3},V4:{qrs:[[40,10,1.3],[95,16,-.5]],t:.4},
        V5:{qrs:[[12,5,-.08],[42,10,1.3],[100,18,-.45]],t:.35},V6:{qrs:[[12,5,-.08],[42,10,1],[100,18,-.35]],t:.3}}},
    {id:'left-bundle-branch-block',title:'完全性左束支传导阻滞',entry:'left-bundle-branch-block',category:'传导阻滞',rate:'约 72 次/分',
      rhythm:()=>regular(72),qt:420,tUp:60,
      points:['QRS ≥120 ms（本例约 150 ms）。','V1–V3 宽而深的 QS 或 rS 波；I、aVL、V5、V6 宽大、顶部有切迹的 R 波，无间隔 q 波。','ST-T 与 QRS 主波方向相反（继发性改变），不能直接按 ST 判断缺血。','新出现的左束支阻滞合并胸痛时按 Sgarbossa 标准评估急性心肌梗死。'],
      leads:{I:{qrs:[[45,18,.5],[100,22,.6]],st:-.08,t:-.3},II:{qrs:[[50,20,.4],[105,20,.4]],st:-.03,t:-.12},
        V1:{qrs:[[20,7,.1],[80,32,-1.4]],st:.15,t:.35},V2:{qrs:[[20,7,.15],[85,32,-2]],st:.25,t:.5},V3:{qrs:[[22,8,.2],[88,30,-1.6]],st:.2,t:.45},
        V4:{qrs:[[50,18,.5],[110,22,-.8]],st:.05,t:.1},V5:{qrs:[[50,20,.9],[105,22,1]],st:-.12,t:-.35},V6:{qrs:[[50,20,.8],[105,22,.9]],st:-.1,t:-.3}}},
    {id:'left-anterior-fascicular-block',title:'左前分支阻滞',entry:'left-anterior-fascicular-block',category:'传导阻滞',rate:'约 70 次/分',
      rhythm:()=>regular(70),qt:390,
      points:['电轴显著左偏（约 −60°）：I、aVL 呈 qR，II、III、aVF 呈 rS，且 S_III > S_II。','QRS 时限基本正常（<120 ms）。','与右束支阻滞并存称双分支阻滞，需注意进展。'],
      leads:{I:{qrs:[[12,5,-.08],[40,10,.8],[70,8,-.05]],t:.25},II:{qrs:[[28,8,.3],[60,11,-.6]],t:.12},V5:{qrs:[[12,5,-.08],[42,10,1.3],[72,10,-.4]],t:.35},V6:{qrs:[[12,5,-.08],[42,10,1],[72,10,-.35]],t:.25}}},
    {id:'left-ventricular-hypertrophy',title:'左心室肥厚伴劳损',entry:'left-ventricular-hypertrophy',category:'房室肥大',rate:'约 70 次/分',
      rhythm:()=>regular(70),qt:400,
      points:['电压增高：S_V1 + R_V5 约 5.3 mV（Sokolow-Lyon ≥3.5 mV）；aVL R 波约 1.1 mV。','V5、V6、I、aVL 的 ST 段下斜型压低伴不对称 T 波倒置（“劳损”）。','V1–V2 ST 段轻度抬高为镜像，不要误判为前壁梗死。','心电图诊断左室肥厚敏感性有限，需结合超声心动图。'],
      leads:{I:{qrs:[[12,5,-.08],[42,11,1.6],[72,9,-.1]],st:-.08,t:-.22,tUp:70,tDown:30},II:{qrs:[[12,5,-.05],[42,11,1],[72,9,-.15]],st:-.03,t:.05},
        V1:{qrs:[[22,8,.2],[58,15,-2.5]],st:.15,t:.2},V2:{qrs:[[24,9,.3],[62,15,-2.6]],st:.2,t:.35},V3:{qrs:[[32,11,.8],[66,14,-1.7]],st:.1,t:.3},
        V4:{qrs:[[40,11,2],[74,11,-.6]],t:.1},V5:{qrs:[[12,5,-.1],[44,12,2.8],[76,10,-.2]],st:-.12,t:-.35,tUp:70,tDown:30},V6:{qrs:[[12,5,-.1],[44,12,2.3],[76,10,-.1]],st:-.1,t:-.3,tUp:70,tDown:30}}},
    {id:'inferior-stemi',title:'急性下壁 ST 段抬高型心肌梗死',entry:'inferior-stemi',category:'心肌缺血与梗死',rate:'约 78 次/分',
      rhythm:()=>regular(78),qt:390,tUp:45,tDown:45,
      points:['II、III、aVF 的 ST 段抬高并与高大 T 波融合，III 的抬高幅度大于 II（多为右冠状动脉闭塞）。','I、aVL 对应性 ST 段压低——支持急性梗死而非心包炎。','V2 轻度 ST 段压低，可能合并后壁受累；应加做 V4R 评估右室梗死。','立即启动胸痛中心/再灌注流程。'],
      leads:{I:{qrs:[[12,5,-.03],[42,10,.6],[70,8,-.1]],st:-.12,t:-.12},II:{qrs:[[14,6,-.1],[42,10,.9],[70,8,-.15]],st:.32,t:.4,tUp:38},
        V2:{st:-.1,t:.35},V3:{st:-.03,t:.4}}},
    {id:'anterior-stemi',title:'急性前壁 ST 段抬高型心肌梗死',entry:'anterior-stemi',category:'心肌缺血与梗死',rate:'约 90 次/分',
      rhythm:()=>regular(90,{pr:150}),qt:370,tUp:42,tDown:45,
      points:['V1–V4 ST 段明显抬高（V2–V3 最高），与 T 波融合成弓背向上的单向曲线。','V1–V3 R 波消失呈 QS 形，提示透壁性心肌损伤。','下壁导联（III、aVF）轻度对应性 ST 段压低。','多为左前降支近段闭塞，范围大、风险高，需立即再灌注。'],
      leads:{I:{qrs:[[12,5,-.03],[42,10,.6],[70,8,-.1]],st:.05,t:.25},II:{qrs:[[12,5,-.05],[42,10,.9],[70,8,-.15]],st:-.05,t:.2},
        V1:{qrs:[[22,6,.05],[50,14,-.9]],st:.2,t:.4},V2:{qrs:[[50,15,-1]],st:.45,t:.7},V3:{qrs:[[28,9,.2],[56,13,-.6]],st:.5,t:.75},
        V4:{qrs:[[36,10,.6],[66,10,-.3]],st:.35,t:.6},V5:{st:.1,t:.4}}},
    {id:'acute-pericarditis',title:'急性心包炎',entry:'acute-pericarditis',category:'心肌缺血与梗死',rate:'约 100 次/分',
      rhythm:()=>regular(100,{pr:150}),qt:340,
      points:['多数导联 ST 段弥漫性、凹面向上抬高（I、II、aVF、V2–V6），不符合单一冠脉分布。','PR 段压低（II 最明显）；aVR 相反：ST 段压低、PR 段抬高。','除 aVR、V1 外没有对应性 ST 段压低，无病理性 Q 波。','需与急性心肌梗死、早期复极鉴别，结合胸痛性质、心包摩擦音和超声。'],
      leads:{I:{st:.15,t:.3,pr:-.05},II:{st:.2,t:.35,pr:-.08},V1:{st:.05,pr:-.02},V2:{st:.2,t:.55,pr:-.05},V3:{st:.2,t:.55,pr:-.06},V4:{st:.18,t:.5,pr:-.06},V5:{st:.16,t:.4,pr:-.06},V6:{st:.14,t:.3,pr:-.05}}},
    {id:'hyperkalemia',title:'高钾血症',entry:'hyperkalemia',category:'电解质与药物影响',rate:'约 70 次/分',
      rhythm:()=>regular(70,{pr:200}),qt:360,tUp:26,tDown:22,
      points:['T 波高尖、基底窄、对称（胸导联最明显），像“帐篷”。','P 波低平、PR 延长，QRS 轻度增宽——提示血钾进一步升高。','心电图不能估计血钾数值，正常心电图也不能排除高钾；怀疑时立即查血钾并保护心肌。'],
      leads:{I:{p:.05,qrs:[[14,6,-.05],[46,12,.7],[78,11,-.12]],t:.45},II:{p:.06,qrs:[[14,6,-.05],[46,12,1],[78,11,-.18]],t:.75},
        V1:{p:.03,pNeg:.02,qrs:[[26,9,.25],[60,15,-1]],t:.35},V2:{p:.03,qrs:[[28,10,.45],[64,15,-1.4]],t:1.3},V3:{p:.03,qrs:[[34,11,.8],[68,13,-.9]],t:1.4},
        V4:{p:.04,qrs:[[40,11,1.3],[74,11,-.5]],t:1.1},V5:{p:.04,qrs:[[14,6,-.08],[46,12,1.35],[76,10,-.2]],t:.85},V6:{p:.04,qrs:[[14,6,-.08],[46,12,1.05],[76,10,-.1]],t:.6}}},
    {id:'hypokalemia',title:'低钾血症',entry:'hypokalemia',category:'电解质与药物影响',rate:'约 75 次/分',
      rhythm:()=>regular(75),qt:360,tDown:50,
      points:['T 波低平，ST 段轻度压低。','T 波后出现明显的 U 波（V2–V3 最明显），有时 U 波高于 T 波，T、U 融合使“QT”看似延长。','易诱发室性心律失常，尤其合并地高辛或延长 QT 的药物时。'],
      leads:{I:{st:-.04,t:.08,u:.08},II:{st:-.05,t:.1,u:.12},V1:{t:.03,u:.1},V2:{st:-.04,t:.12,u:.25},V3:{st:-.05,t:.12,u:.25},V4:{st:-.05,t:.1,u:.2},V5:{st:-.05,t:.08,u:.12},V6:{st:-.04,t:.06,u:.08}}},
    {id:'long-qt',title:'QT 间期延长',entry:'drug-induced-long-qt',category:'电解质与药物影响',rate:'约 62 次/分',
      rhythm:()=>regular(62),qt:560,tUp:85,tDown:55,
      points:['QT 明显延长（本例约 560 ms；心率约 62 次/分时 QTc 约 570 ms）。','T 波宽大、终点后移；测量取 T 波终点清楚的导联（常用 II、V5）。','QTc >500 ms 时尖端扭转型室速风险显著增加：停用延长 QT 的药物，纠正低钾、低镁。'],
      leads:{}},
    {id:'pre-excitation',title:'心室预激（WPW 图形）',entry:'pre-excitation',category:'传导阻滞',rate:'约 72 次/分',
      rhythm:()=>regular(72,{pr:100}),qt:400,
      points:['PR 间期缩短（<120 ms）。','QRS 起始部有缓慢上升的 delta 波，QRS 增宽。','本例为 V1 以 R 波为主（A 型，左侧旁路）；aVL 负向 delta 波可酷似 Q 波，勿误判为梗死。','合并房颤时禁用房室结阻滞药物。'],
      leads:{I:{qrs:[[22,16,-.1],[62,10,.55],[88,8,-.1]],t:.15},II:{qrs:[[22,16,.25],[58,10,1],[86,8,-.1]],t:.25},
        V1:{pNeg:.03,qrs:[[22,16,.25],[58,12,.9],[90,9,-.3]],t:-.15},V2:{qrs:[[22,16,.3],[60,12,1.3],[92,9,-.4]],t:-.1},V3:{qrs:[[22,16,.3],[60,12,1.4],[92,9,-.3]],t:.1},
        V4:{qrs:[[22,16,.3],[60,11,1.5],[90,9,-.2]],t:.3},V5:{qrs:[[22,16,.25],[60,11,1.4],[90,9,-.1]],t:.3},V6:{qrs:[[22,16,.2],[60,11,1.1],[90,9,-.05]],t:.25}}},
    {id:'brugada',title:'1 型 Brugada 图形',entry:'brugada',category:'心律失常',rate:'约 70 次/分',
      rhythm:()=>regular(70),qt:400,tUp:45,
      points:['V1–V2 的 J 点及 ST 段穹窿形（下斜型）抬高 ≥2 mm，随后 T 波倒置。','其余导联基本正常；QRS 可呈右束支阻滞样。','发热、某些药物可诱发或加重；合并晕厥、家族猝死史需转专科评估。'],
      leads:{V1:{qrs:[[24,8,.2],[52,10,-.4],[96,14,.35]],st:.22,t:-.25},V2:{qrs:[[26,9,.3],[56,11,-.8],[98,14,.45]],st:.3,t:-.2}}},
    {id:'pulmonary-embolism',title:'急性肺栓塞相关改变',entry:'pulmonary-embolism',category:'肺循环与右心负荷',rate:'约 112 次/分',
      rhythm:()=>regular(112,{pr:140}),qt:330,tDown:32,
      points:['窦性心动过速是最常见的表现。','S1Q3T3：I 导联深 S 波，III 导联 Q 波及 T 波倒置。','V1–V3 T 波倒置、不完全性右束支阻滞提示右心负荷增加。','这些表现既不敏感也不特异，不能据此确诊或排除肺栓塞。'],
      leads:{I:{qrs:[[12,5,.15],[40,10,.5],[72,10,-.4]],t:.35},II:{qrs:[[12,5,-.05],[42,10,.7],[70,8,-.2]],t:.1},
        V1:{qrs:[[24,8,.25],[55,11,-.5],[95,10,.35]],t:-.25},V2:{t:-.25},V3:{t:-.15},V4:{t:.2}}},
    {id:'premature-ventricular-contractions',title:'室性早搏二联律',entry:'premature-ventricular-contractions',category:'心律失常',rate:'窦性约 75 次/分',
      qt:390,
      rhythm:()=>{const beats=[];for(let at=360;at<10600;at+=1600){beats.push({at,p:at-160,morph:'n'});beats.push({at:at+460,p:null,morph:'pvc'});}const ps=[];for(let at=360+800;at<10600;at+=1600)ps.push(at-160);return {beats,ps};},
      points:['每个窦性搏动后跟一个提前出现的宽大畸形 QRS（二联律）。','早搏前无提前的 P 波，T 波与 QRS 主波方向相反；窦性 P 波按时出现但埋在早搏内，其后为完全性代偿间歇。','本例早搏 V1 呈左束支阻滞形、下壁导联主波向上，提示起源于右室流出道。'],
      morphs:{pvc:{I:{qrs:wide(65,.3),t:-.15,tUp:55},II:{qrs:wide(65,1.4),t:-.5,tUp:55},
        V1:{qrs:wide(72,-1),t:.4,tUp:55},V2:{qrs:wide(72,-1.2),t:.45,tUp:55},V3:{qrs:[[38,14,.3],...wide(90,-.9,20)],t:.25,tUp:55},
        V4:{qrs:wide(65,.9),t:-.25,tUp:55},V5:{qrs:wide(65,1.2),t:-.4,tUp:55},V6:{qrs:wide(65,1.1),t:-.4,tUp:55}}},
      leads:{}},
    {id:'ventricular-pacing',title:'右心室心尖起搏',entry:'ventricular-pacing',category:'起搏心电图',rate:'约 70 次/分',
      qt:420,tUp:60,
      rhythm:()=>{const r=regular(70,{p:false,first:300});return {beats:r.beats,spikes:r.beats.map(b=>b.at-6)};},
      points:['每个 QRS 前有起搏脉冲（竖直细线；双极起搏时可能很小）。','QRS 宽大，呈左束支阻滞形，电轴左上偏（右室心尖起搏）。','ST-T 与 QRS 主波方向相反属继发性改变；起搏心律下判断缺血需用 Sgarbossa 类标准。'],
      leads:{I:{p:0,qrs:[[60,26,.65]],t:-.25},II:{p:0,qrs:[[60,28,-.8]],t:.3},
        V1:{p:0,pNeg:0,qrs:[[70,30,-1.2]],st:.12,t:.35},V2:{p:0,qrs:[[70,30,-1.5]],st:.18,t:.45},V3:{p:0,qrs:[[70,30,-1.4]],st:.15,t:.4},
        V4:{p:0,qrs:[[70,30,-1]],st:.1,t:.3},V5:{p:0,qrs:[[30,12,.2],[80,26,-.8]],t:.2},V6:{p:0,qrs:[[30,12,.3],[80,26,-.6]],t:.15}}},
    {id:'limb-lead-reversal',title:'左右上肢电极接反',entry:null,link:'/ecg/basics#ecg-electrodes',category:'伪差与操作',rate:'约 72 次/分',
      rhythm:()=>regular(72),qt:380,
      points:['I 导联 P 波、QRS、T 波全部倒置；aVR 反而直立（与 aVL 互换），II 与 III 互换。','胸导联 R 波递增正常——这是与右位心的关键区别（右位心时胸导联 R 波逐渐变小）。','重新放置电极复查即可；不要据此诊断心肌梗死或右位心。'],
      leads:{I:{p:-.1,qrs:neg(NORMAL.I.qrs),t:-.25},II:{p:.05,qrs:[...NORMAL.II.qrs,...neg(NORMAL.I.qrs)],t:.1}}}
  ];

  // ---- waveform generation ----
  function template(item,lead,morph){
    const base={...NORMAL[lead],...(item.leads[lead]||{})};
    return morph&&morph!=='n'&&item.morphs?.[morph]?.[lead]?{...base,p:0,pNeg:0,pr:0,...item.morphs[morph][lead]}:base;
  }
  function beatShape(item,tpl){
    const qt=tpl.qt||item.qt||380,tDown=tpl.tDown||item.tDown||40,tUp=tpl.tUp||item.tUp||60;
    const j=Math.max(...tpl.qrs.map(([c,sd])=>c+2*sd));
    const tPeak=qt-2.3*tDown;
    return {qrs:tpl.qrs,j,tPeak,tUp,tDown,st:tpl.st||0,t:tpl.t??0,u:tpl.u||0,qt};
  }
  function build(item){
    const r=item.rhythm(),beats=r.beats,extraP=r.ps||[],spikes=r.spikes||[];
    const cache={};
    const shape=(lead,morph)=>{const key=lead+'|'+morph;return cache[key]||(cache[key]={tpl:template(item,lead,morph),s:beatShape(item,template(item,lead,morph))});};
    const pTimes=[...beats.filter(b=>b.p!=null).map(b=>({at:b.p,qrs:b.at})),...extraP.map(at=>({at,qrs:null}))];
    const flutterAmp={I:.04,II:-.26,V1:.15,V2:.08,V3:.04,V4:.03,V5:.03,V6:.03},fibAmp={I:.03,II:.05,V1:.09,V2:.06,V3:.04,V4:.03,V5:.03,V6:.03};
    function base(lead,t){
      let v=0;const n=shape(lead,'n').tpl;
      for(const {at,qrs} of pTimes){
        const d=t-at;if(d<-120||d>400)continue;
        v+=G(d,50,20,n.p||0)+G(d,82,16,-(n.pNeg||0));
        if(n.pr&&qrs!=null)v+=n.pr*win(t,at+100,qrs,6);
      }
      for(const b of beats){
        const d=t-b.at;if(d<-60||d>900)continue;
        const {s}=shape(lead,b.morph);
        for(const [c,sd,a] of s.qrs)v+=G(d,c,sd,a);
        if(s.st)v+=s.st*win(d,s.j,s.tPeak,5);
        v+=AG(d,s.tPeak,s.tUp,s.tDown,s.t);
        if(s.u)v+=G(d,s.qt+70,32,s.u);
      }
      if(item.atrial==='fib'){const a=fibAmp[lead]||.03;v+=a*(Math.sin(t/23)*.55+Math.sin(t/14.3+1.7)*.3+Math.sin(t/37+.4)*.25)*(0.75+0.25*Math.sin(t/900));}
      if(item.atrial==='flutter'){
        const a=flutterAmp[lead]||.03,k=((t%200)+200)%200/200;
        v+=lead==='II'||lead==='I'?a*(k<.72?.5-k/.72:-.5+(k-.72)/.28):a*Math.exp(-((k-.3)**2)/(2*.08*.08));
      }
      return v;
    }
    function value(lead,t){
      if(!LIMB.includes(lead)||lead==='I'||lead==='II')return base(lead,t);
      const i=base('I',t),ii=base('II',t);
      return lead==='III'?ii-i:lead==='aVR'?-(i+ii)/2:lead==='aVL'?i-ii/2:ii-i/2;
    }
    return {value,spikes};
  }

  // ---- SVG ----
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let serial=0;
  const ROW=32,TOP=4,LEFT=9,MS=0.025; // 0.025 mm per ms = 25 mm/s
  function path(value,lead,from,to,x0,baseline){
    let d='';
    for(let t=from;t<=to;t+=4){const x=x0+(t-from)*MS,y=baseline-value(lead,t)*10;d+=(d?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);}
    return d;
  }
  function render(id){
    const item=items.find(entry=>entry.id===id);if(!item)return '';
    const {value,spikes}=build(item),key='ecg12-'+(++serial),width=LEFT+250+3,height=TOP+4*ROW+6;
    let traces='',labels='',marks='';
    const calibration=baseline=>'M1 '+baseline+'H3V'+(baseline-10)+'H8V'+baseline+'H'+LEFT;
    const spikePath=(from,to,x0,baseline)=>spikes.filter(s=>s>=from&&s<=to).map(s=>'M'+(x0+(s-from)*MS).toFixed(2)+' '+(baseline+1)+'V'+(baseline-7)).join('');
    LAYOUT.forEach((row,r)=>{
      const baseline=TOP+ROW/2+4+r*ROW;
      marks+=calibration(baseline);
      row.forEach((lead,c)=>{
        const from=c*2500,to=from+2500,x0=LEFT+c*62.5;
        traces+=path(value,lead,from,to-4,x0,baseline);
        marks+=spikePath(from,to,x0,baseline);
        if(c)marks+='M'+x0+' '+(baseline-3)+'V'+(baseline+3);
        labels+='<text x="'+(x0+1.2)+'" y="'+(baseline-9)+'">'+lead+'</text>';
      });
    });
    const rhythmBase=TOP+ROW/2+4+3*ROW;
    marks+=calibration(rhythmBase)+spikePath(0,10000,LEFT,rhythmBase);
    traces+=path(value,'II',0,9996,LEFT,rhythmBase);
    labels+='<text x="'+(LEFT+1.2)+'" y="'+(rhythmBase-9)+'">II</text>';
    return '<svg class="ecg-twelve" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-labelledby="'+key+'-t '+key+'-d">'+
      '<title id="'+key+'-t">'+esc(item.title)+' · 12 导联教学示意</title><desc id="'+key+'-d">'+esc(item.points.join(' '))+'</desc>'+
      '<defs><pattern id="'+key+'-s" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#f3c4c4" stroke-width=".06"/></pattern>'+
      '<pattern id="'+key+'-b" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#'+key+'-s)"/><path d="M5 0H0V5" fill="none" stroke="#e59a9a" stroke-width=".14"/></pattern></defs>'+
      '<rect width="'+width+'" height="'+height+'" fill="#fffafa"/><rect width="'+width+'" height="'+height+'" fill="url(#'+key+'-b)"/>'+
      '<path d="'+traces+'" fill="none" stroke="#1a1a1a" stroke-width=".32" stroke-linejoin="round"/>'+
      '<path d="'+marks+'" fill="none" stroke="#1a1a1a" stroke-width=".3"/>'+
      '<g font-size="3.2" fill="#1a1a1a" font-family="sans-serif">'+labels+'<text x="'+(width-2)+'" y="'+(height-1.5)+'" text-anchor="end" font-size="2.6" fill="#7a5a5a">25 mm/s · 10 mm/mV · 自绘教学示意</text></g></svg>';
  }
  function check(){
    const errors=[];
    for(const item of items){
      try{const {value}=build(item);for(const lead of [...LIMB,...CHEST])for(let t=0;t<10000;t+=97){const v=value(lead,t);if(!Number.isFinite(v)||Math.abs(v)>5)throw new Error(lead+' at '+t+' ms: '+v);}}
      catch(error){errors.push(item.id+': '+error.message);}
    }
    return errors;
  }
  window.HAJIMI_ECG_CLASSIC=Object.freeze({items:Object.freeze(items.map(({id,title,entry,link,category,rate,points})=>Object.freeze({id,title,entry,link:link||null,category,rate,points}))),render,check,value:(id,lead,t)=>{const item=items.find(entry=>entry.id===id);return item?build(item).value(lead,t):NaN;}});
})();

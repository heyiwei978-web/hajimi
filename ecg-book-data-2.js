/* 第七批：参照陈新主编《黄宛临床心电图学》第 6 版（人民卫生出版社，2009）心律失常各章整理的学习要点。
   内容为自行归纳改写，不含原书原文或图片；与现行指南不一致处已注明，并以指南为准。草稿，待临床医师审核。 */
(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA;
  if(!data||!Array.isArray(data.entries))return;
  const UPDATED='2026-10-12';
  const REF={
    brady:{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'},
    svt:{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'},
    va:{title:'2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000549'},
    escVa:{title:'2022 ESC Guidelines for the management of patients with ventricular arrhythmias and the prevention of sudden cardiac death',url:'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Ventricular-Arrhythmias-and-the-prevention-of-sudden-cardiac-death'},
    periop:{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}
  };
  const book=(chapter,pages)=>({chapter,pages});
  const CH13='第 13 章 窦性心律失常',CH14='第 14 章 房室交界区性心律',CH15='第 15 章 室上性心动过速',CH17='第 17 章 心房扑动和心房颤动',CH18='第 18 章 预激综合征',CH19='第 19 章 室性心动过速、心室扑动和心室颤动',CH20='第 20 章 宽、窄 QRS 心动过速的心电图鉴别诊断',CH21='第 21 章 房室阻滞';

  const entries=[
    {
      id:'sinoatrial-block',title:'窦房阻滞',category:'conduction',risk:'medium',
      aliases:['窦房传导阻滞','SA block','二度窦房阻滞','窦房文氏','长PP间期'],
      related:['sinus-node-dysfunction','sinus-bradycardia','mobitz-i'],
      textbook:book(CH13,'240–241'),
      basic:{
        summary:'窦房结已发放激动但传不出到心房：P 波突然脱落，长 PP 间期是基本 PP 的整数倍（二度 II 型）或 PP 逐渐缩短后脱落（二度 I 型）。',
        criteria:[['一度、三度','体表心电图无法识别（三度窦房阻滞与窦性停搏无法区分）'],['二度 II 型','长 PP 间期恰为基本 PP 间期的 2 倍或 3 倍'],['二度 I 型（文氏）','PP 间期逐渐缩短，直到出现长间歇；长 PP 小于两倍短 PP'],['长间歇后','可出现交界性或室性逸搏']],
        diagram:{kind:'sa-block',caption:'二度 II 型窦房阻滞教学示意：长 PP 间期恰为基本 PP 间期的 2 倍，长间歇内无 P 波。'},
        diagnosticPoints:[
          '窦房结本身的电活动体表心电图记录不到，只能从 P 波的有无和 PP 间期的数量关系推断窦房传导。',
          '与窦性停搏鉴别的关键是“倍数关系”：窦性停搏的长 PP 与基本 PP 无倍数关系，窦房阻滞则成整数倍；窦性心律不齐明显时这一判断不可靠。',
          '窦房文氏现象与二度 I 型房室阻滞类似，但变化的是 PP 而不是 RR 或 PR；长间歇前的 PP 逐渐缩短。',
          '多为间歇性，常见于迷走神经张力增高、颈动脉窦过敏；持续存在多提示器质性心脏病。高钾血症、洋地黄、奎尼丁、β 受体阻滞剂等也可引起。'
        ],
        differentialPoints:[
          '窦性停搏：长间歇与基本 PP 无倍数关系。',
          '未下传房性早搏：长间歇前的 T 波上可找到提前出现的 P′ 波，T 波形态与其他 T 波不同。',
          '窦性心动过缓：心率 <40 次/分时要考虑 2:1 窦房阻滞的可能（真实窦房结频率是记录频率的 2 倍）。'
        ]
      },
      periop:{
        timing:'无症状、偶发者通常不影响手术。伴晕厥、黑矇或长间歇（如 >3 秒）时，择期手术前应评估窦房结功能和起搏指征。',
        anesthesia:'告知麻醉团队；留意迷走反射（牵拉、腹腔镜气腹、眼心反射等）和减慢心率的药物，准备阿托品等提升心率的措施和经皮起搏。',
        postoperative:'复查电解质（尤其血钾）和药物；术后监护中出现长间歇伴症状时复查 12 导联心电图。',
        consultation:'伴晕厥、症状性心动过缓或长间歇时请心内科会诊，评估是否需要临时或永久起搏。'
      },
      references:[REF.brady,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'wandering-pacemaker',title:'游走节律（窦房结内 / 心房内）',category:'arrhythmias',risk:'low',
      aliases:['游走心律','游走性节律','窦房结内游走','心房内游走节律','wandering pacemaker','P波形态多变'],
      related:['mat','sinus-bradycardia','junctional-rhythm'],
      textbook:book(CH13,'238–239'),
      basic:{
        summary:'起搏点在窦房结内或窦房结与交界区之间游走：P 波形态、PR 间期随心率同步渐变，心率不快；多为生理现象。',
        criteria:[['窦房结内游走','P 波仍为窦性（II 直立），振幅和形态逐渐变化，PR ≥120 ms，PP 可不齐'],['心房内游走','同一导联可见 ≥3 种形态的 P 波，甚至倒置；起搏点移向交界区时心率减慢、P 波变小或倒置、PR 缩短'],['关键','心率、P 波形态和 PR 间期三者同步、渐进地变化'],['心率','通常 <100 次/分']],
        diagram:{kind:'wandering',caption:'心房内游走节律教学示意：P 波由直立逐渐变小至倒置，PR 随之缩短，心率略减慢。'},
        diagnosticPoints:[
          '与呼吸周期引起的迷走张力变化有关，常见于健康青少年、运动员和老年人，一般无需处理。',
          '变化是“渐变”的：起搏点逐步移向交界区，再逐步移回窦房结，而不是突然出现提前的异形 P 波。',
          '心电图报告时描述 P 波形态变化范围及心率，避免误诊为房性早搏或多源性房速。'
        ],
        differentialPoints:[
          '多源性房性心动过速：同样有 ≥3 种 P 波，但心率 >100 次/分，多见于肺部疾病急性加重，P 波变化是随机而非渐变。',
          '房性早搏：异形 P′ 提前出现，其后有代偿间歇，而不是与心率同步渐变。',
          '交界性心律：持续的逆行 P 波（II 倒置）且 PR <120 ms 或 P 波在 QRS 之后。'
        ]
      },
      periop:{
        timing:'属生理现象，本身不影响手术时机；伴症状性心动过缓或其他心律失常时再单独评估。',
        anesthesia:'无需特殊处理；麻醉诱导时迷走张力变化可使 P 波形态和心率波动，注意与新发心律失常区分。',
        postoperative:'若术后出现心率 >100 次/分并 P 波多形，应考虑多源性房速并查找低氧、肺部病变等诱因。',
        consultation:'通常不需要；伴症状性心动过缓或其他心律失常时再评估。'
      },
      references:[REF.svt,REF.brady],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'lgl-short-pr',title:'短 PR 间期（LGL 综合征）',category:'conduction',risk:'low',
      aliases:['LGL','LGL综合征','Lown-Ganong-Levine','短PR','短PR间期','加速房室结传导','EAVNC','James束'],
      related:['pre-excitation','mahaim','svt'],
      textbook:book(CH18,'313、331–333'),
      basic:{
        summary:'PR <120 ms、QRS 正常、无 delta 波。多数只是加速的房室结传导，单独存在属正常变异；伴反复室上速时才有临床意义。',
        criteria:[['PR 间期','<120 ms'],['QRS','时限和形态正常，起始部无 delta 波'],['临床','伴反复发作的室上性心动过速时，历史上称 LGL 综合征'],['教材观点','“LGL 综合征”已趋于废弃，电生理检查发现的心动过速多为房室结折返或隐匿性旁路']],
        diagram:{kind:'short-pr',caption:'短 PR 间期教学示意：PR 明显缩短，QRS 窄、起始部无 delta 波。'},
        diagnosticPoints:[
          '可能的解剖基础包括房室结内快速传导纤维、心房–希氏束旁路（James 束等），但至今没有统一公认的解剖异常。',
          '电生理特征：AH 间期短（<60 ms），心房快速起搏时 AH 延长幅度小，1:1 房室传导可达 200 次/分以上。',
          '合并房颤、房扑时，心室率可能非常快，这一点与 WPW 相似。'
        ],
        differentialPoints:[
          'WPW：PR 短且 QRS 起始部有 delta 波、QRS 增宽；部分旁路预激程度小，delta 波不明显，需多导联仔细辨认。',
          '低位心房或交界性节律：PR 也短，但 II、III、aVF 的 P 波倒置。',
          '心率快、交感张力高时 PR 本身可缩短；儿童 PR 正常值更短。'
        ]
      },
      periop:{
        timing:'无症状的单纯短 PR 不影响手术。有反复心动过速史者，择期手术前了解发作频率、诱因和既往处理。',
        anesthesia:'告知麻醉团队可能发生室上速；备好终止室上速的药物和电复律设备，避免交感过度兴奋。',
        postoperative:'术后出现心悸时尽快记录 12 导联心电图，以明确心动过速的类型。',
        consultation:'反复发作室上速，或合并房颤、房扑伴快心室率时请心内科会诊。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'mahaim',title:'Mahaim 纤维（房束旁路）',category:'conduction',risk:'medium',
      aliases:['Mahaim','房束旁路','结束旁路','结室旁路','慢传导旁路','左束支阻滞形心动过速'],
      related:['pre-excitation','lgl-short-pr','wide-complex-tachycardia'],
      textbook:book(CH18,'333–335'),
      basic:{
        summary:'多为起自右心房、止于右束支的慢传导旁路：窦律时 PR 正常、预激轻微，心动过速时为左束支阻滞形宽 QRS。',
        criteria:[['窦性心律','PR 正常，QRS 起始部可有很小的预激波或完全正常'],['预激时 QRS','左束支阻滞形，时限延长，可伴继发 ST-T 改变'],['心动过速','逆向型房室折返：左束支阻滞形宽 QRS，电轴常左偏'],['传导特性','具递减传导，只能前传、不能逆传']],
        diagram:{kind:'mahaim',caption:'Mahaim 旁路前传的心动过速教学示意：V1 呈宽而深的 QS/rS（左束支阻滞形），PR 正常时的预激并不明显。'},
        diagnosticPoints:[
          '传统称“结–束”或“结–室”纤维；现认为大多数是起自三尖瓣环外侧的右心房、止于右束支远端附近的房–束旁路，传导慢、有递减特性，类似房室结。',
          '心房快速起搏时 AH 逐渐延长、QRS 逐渐变宽到最大预激，HV 缩短甚至为负值，是电生理上的特征。',
          '心动过速时旁路前传、房室结逆传，所以表现为左束支阻滞形宽 QRS 心动过速；也可合并房室结折返或普通旁路，使图形更复杂。'
        ],
        differentialPoints:[
          '室性心动过速：同为左束支阻滞形宽 QRS，但 Mahaim 患者多年轻、无器质性心脏病，窦律时可有轻微预激；最终依赖电生理检查。',
          '室上速伴左束支阻滞：窦律时即有完全性左束支阻滞，形态与心动过速时一致。',
          '典型 WPW：窦律时 PR 短、delta 波明显，与 Mahaim 窦律时 PR 正常不同。'
        ]
      },
      periop:{
        timing:'已知旁路但无发作者通常可按期手术；近期频繁发作或发作时血流动力学不稳者，择期手术前请心内科评估（多数可经导管消融根治）。',
        anesthesia:'告知麻醉团队可能出现左束支阻滞形宽 QRS 心动过速；不稳定时按宽 QRS 心动过速处理，立即同步电复律。',
        postoperative:'出现宽 QRS 心动过速时记录 12 导联心电图，与既往图对比；不能确定性质时按室速处理。',
        consultation:'发作宽 QRS 心动过速或诊断不明时请心内科会诊。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'avrt',title:'房室折返性心动过速（顺向型 / 逆向型）',category:'arrhythmias',risk:'medium',
      aliases:['AVRT','房室折返','顺向型','逆向型','orthodromic','antidromic','旁路折返','隐匿性旁路','预激伴室上速'],
      related:['pre-excitation','svt','narrow-complex-tachycardia','wide-complex-tachycardia'],
      textbook:book(CH15,'259–264'),
      basic:{
        summary:'以房室旁路为折返环一部分的心动过速：顺向型（约 95%）为窄 QRS、逆行 P′ 位于 ST 段；逆向型（约 5%）为完全预激的宽 QRS。',
        criteria:[['顺向型','房室结前传、旁路逆传；窄 QRS（伴束支阻滞时可宽），无 delta 波；逆行 P′ 常位于 ST 段，RP′ < P′R，RP′ >70 ms'],['逆向型','旁路前传、房室结逆传；完全预激的宽大畸形 QRS；可见逆行 P′ 时 P′R < RP′'],['与旁路同侧束支阻滞','发生同侧束支阻滞时心动过速周期延长（≥35 ms），提示旁路位于该侧'],['逆行 P′ 电轴','左侧旁路 I、aVL、V5–V6 的 P′ 倒置；右侧旁路 I 导联 P′ 直立、II、III、aVF 倒置']],
        diagram:{kind:'avrt',caption:'顺向型房室折返性心动过速教学示意：窄 QRS 规则心动过速，逆行 P′ 位于 ST 段（RP′ 短于 P′R，但 >70 ms）。'},
        diagnosticPoints:[
          '顺向型多由临界的房性或室性早搏诱发：早搏到达旁路时旁路仍处于不应期，激动只能经房室结下传，再经旁路逆传回心房。',
          '隐匿性旁路只能逆传，窦律心电图完全正常，但同样可形成顺向型房室折返；窦律时有预激波则支持房室折返（特异性高、敏感性较低）。',
          '心动过速中 QRS 突然由窄变宽、或在维拉帕米等药物作用后由宽变窄，应想到旁路参与，避免误判为室速或室上速伴差传。',
          '心动过速时 aVR 导联 ST 抬高、明显 ST 压低（>0.2 mV）或 QRS 电交替，更多见于房室折返而非房室结折返，但都不具决定性。'
        ],
        differentialPoints:[
          '房室结折返性心动过速：逆行 P′ 多藏于 QRS 内或紧随其后（RP′ ≤70 ms），可见假 s 波（II、III、aVF）和假 r′ 波（V1）。',
          '房性心动过速：P′ 在 QRS 之前（RP′ > P′R），出现房室阻滞时心动过速仍可持续——这一点可除外房室折返。',
          '逆向型与室性心动过速：都是宽 QRS；窦律心电图有显性预激、年轻无器质性心脏病者支持逆向型，鉴别困难时按室速处理。'
        ]
      },
      periop:{
        timing:'有反复发作史者，择期手术前了解发作情况；预激合并房颤或高危旁路者建议先请心内科评估，多数可先行导管消融。',
        anesthesia:'备好腺苷、电复律设备；预激患者合并房颤时避免使用房室结阻滞药物（腺苷、维拉帕米、地尔硫䓬、地高辛、静脉 β 受体阻滞剂），以免加快旁路下传。',
        postoperative:'术后发作时记录 12 导联心电图；稳定的窄 QRS 心动过速可先尝试迷走神经刺激，不稳定者立即同步电复律。',
        consultation:'反复发作、宽 QRS 心动过速、预激合并房颤或血流动力学不稳时请心内科会诊。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'narrow-complex-tachycardia',title:'窄 QRS 心动过速的鉴别',category:'arrhythmias',risk:'medium',
      aliases:['窄QRS心动过速','室上性心动过速鉴别','AVNRT','房室结折返','RP/PR','假s波','假r波','PJRT'],
      related:['svt','avrt','atrial-flutter','atrial-tachycardia','sinus-tachycardia'],
      textbook:book(CH20,'361–366'),
      basic:{
        summary:'窦速、房速、房扑、房室结折返（AVNRT）和房室折返（AVRT）的鉴别：心率帮助不大，关键看 P 波位置、RP/PR 和有无房室阻滞。',
        criteria:[['心率 150 次/分左右','先排除 2:1 下传的房扑：在 II、III、aVF、V1 寻找扑动波和“无等电位线”'],['RP < PR，RP ≤70 ms','多为 AVNRT'],['RP < PR，RP >70 ms','多为 AVRT（顺向型）'],['RP ≥ PR','房速、非典型（快–慢型）AVNRT 或持续性交界区反复性心动过速（PJRT）'],['假 s 波 / 假 r′ 波','心动过速时 II、III、aVF 出现 s 波、V1 出现 r′，而窦律时没有——强烈提示 AVNRT'],['出现房室阻滞而心动过速持续','可除外 AVRT，多为房扑或房速']],
        diagram:{kind:'svt',caption:'窄 QRS 规则心动过速教学示意：P 波不易辨认，需在多个导联中寻找逆行 P′ 并与窦律心电图比较。'},
        diagnosticPoints:[
          '教材推荐的鉴别顺序：①有无二度房室阻滞（有则多为房扑或房速）→ ②有无假 s 波、假 r′ 波（有则 AVNRT）→ ③窦律时有无预激（有则 AVRT）→ ④根据 P 波位置（RP 与 PR 的关系）判断。',
          '研究显示 AVRT、AVNRT、房速的平均心率相近，单凭心率不能鉴别。',
          'QRS 电交替（相邻 QRS 振幅差 ≥1 mm）在 AVRT 中更常见，但也与心率快有关；心动过速时的 ST 压低多与心率相关，不代表心肌缺血。',
          '一定要把发作时与窦律时的 12 导联心电图放在一起比较——许多线索（假 s 波、假 r′ 波、预激）只有对比才能发现。'
        ],
        differentialPoints:[
          '窦性心动过速：逐渐起始和终止，P 波为窦性形态、位于 QRS 之前，有可寻找的病因（发热、疼痛、低血容量、贫血等）。',
          '房扑 2:1：心室率常恰为 150 次/分左右，扑动波可能有一半藏在 QRS 或 T 波中；迷走神经刺激可暂时增加阻滞、显露扑动波。',
          '伴差异性传导或原有束支阻滞时，室上速可表现为宽 QRS（见“宽 QRS 心动过速的鉴别”）。'
        ]
      },
      periop:{
        timing:'术前发现未明确诊断的阵发性心动过速史时，择期手术前请心内科评估，必要时先明确类型和治疗。',
        anesthesia:'术中发作：先判断血流动力学是否稳定；不稳定者立即同步电复律，稳定者可尝试迷走神经刺激或腺苷，并记录发作时的心电图。',
        postoperative:'术后窄 QRS 心动过速最常见的是窦速、房颤、房扑；先找诱因（疼痛、低血容量、贫血、低氧、发热、电解质紊乱），再判断是否为折返性心动过速。',
        consultation:'反复发作、药物难以终止，或诊断不明时请心内科会诊。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'idiopathic-vt',title:'特发性室性心动过速',category:'arrhythmias',risk:'medium',
      aliases:['特发性室速','右室流出道室速','RVOT','左室分支型室速','维拉帕米敏感性室速','ILVT','反复性单形室速','RMVT','流出道室早'],
      related:['ventricular-tachycardia','wide-complex-tachycardia','premature-ventricular-contractions'],
      textbook:book(CH19,'342–348'),
      basic:{
        summary:'发生于结构正常心脏的单形室速：右室流出道型最常见（左束支阻滞形 + 电轴下偏），左室分支型呈右束支阻滞形 + 电轴左偏、对维拉帕米敏感。',
        criteria:[['右室流出道（RVOT）','左束支阻滞形，II、III、aVF 高大 R 波（电轴下偏/正常或右偏），aVL 常为 QS，胸导联 R/S 移行多在 V3–V4'],['左室分支型（ILVT）','右束支阻滞形，QRS 相对较窄（≤140 ms），电轴多左偏（起源于左后分支区域）'],['常见形式','反复性单形室速（频发室早、成对、短阵室速交替出现）或阵发持续性室速'],['前提','排除器质性心脏病和已知离子通道病']],
        diagram:{kind:'rvot-vt',caption:'右室流出道室速教学示意：II 导联宽大高 R 波（电轴下偏），V1 呈左束支阻滞形（宽 QS/rS）。'},
        diagnosticPoints:[
          '约占全部室速的 10%。RVOT 型多为儿茶酚胺介导的触发活动，常在运动、情绪紧张时发作，对 β 受体阻滞剂和腺苷敏感。',
          '流出道起源的定位线索：I 导联 QS 或主波向下提示靠近间隔，I 导联 R 波提示靠游离壁；胸导联 R/S 移行在 V2 或更早提示左室流出道或主动脉窦起源，在 V4 或更晚多为右室流出道，V3 移行需结合其他指标判断。',
          'ILVT 多见于 15–40 岁男性，可在运动或情绪激动时诱发，也可静息发作；QRS 呈右束支阻滞伴电轴左偏，维拉帕米可终止。',
          '起源于右室流入道或心尖、左束支阻滞伴电轴左偏者，要警惕致心律失常性右室心肌病（ARVC）首发，窦律时注意 V1–V3 的 Epsilon 波和 T 波倒置。'
        ],
        differentialPoints:[
          '器质性心脏病室速（陈旧性心梗、心肌病）：有基础心脏病、多为瘢痕相关折返，预后较差；特发性室速诊断前需完成超声、必要时心脏磁共振。',
          '室上速伴差异性传导：左束支或右束支阻滞形宽 QRS 都可能，按宽 QRS 心动过速流程鉴别。',
          '束支折返性室速：多见于扩张型心肌病，QRS 常呈典型左束支阻滞形，与窦律时的左束支阻滞形态相似。'
        ]
      },
      periop:{
        timing:'已明确诊断、无症状或发作少者通常可按期手术；近期频繁发作、症状明显或尚未排除器质性心脏病者，择期手术前请心内科评估。',
        anesthesia:'告知麻醉团队；避免交感过度兴奋和外源性儿茶酚胺，维持电解质正常；术中发作持续性室速且不稳定时立即同步电复律。',
        postoperative:'术后疼痛、焦虑、低钾低镁可诱发；充分镇痛，复查电解质，频发时监护。',
        consultation:'持续性室速、晕厥，或首次发现、尚未明确是否为特发性时请心内科会诊。'
      },
      references:[REF.va,REF.escVa,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'ventricular-flutter',title:'心室扑动',category:'arrhythmias',risk:'high',
      aliases:['室扑','VFL','ventricular flutter','正弦波室速'],
      related:['ventricular-fibrillation','ventricular-tachycardia','torsades-de-pointes'],
      textbook:book(CH19,'358–359'),
      basic:{
        summary:'介于室速与室颤之间：规则、单一形态的正弦样大波，约 250–300 次/分，QRS 与 T 波无法区分，很快蜕变为室颤。',
        criteria:[['节律','规则，循环周期变异 ≤30 ms'],['频率','约 250–300 次/分（周期约 200 ms）'],['形态','QRS 形态单一，连续的波之间找不到等电位线，无法分辨 QRS 与 T 波'],['对比室颤','室颤频率常 >300 次/分（周期 ≤180 ms），节律、宽度、形态和振幅都不规则']],
        diagram:{kind:'vflutter',caption:'心室扑动教学示意：规则、连续的正弦样波，无等电位线，无法分辨 QRS 与 T 波。'},
        diagnosticPoints:[
          '心室扑动通常不能维持，很快蜕变为室颤；血流动力学上与室颤同样等同于心脏骤停。',
          '室颤可由落在易损期的室早（R on T）诱发，也可无先兆出现。',
          '确认患者无反应、无脉搏后立即启动心肺复苏和除颤，不要因判读“室扑还是室速”而延误。'
        ],
        differentialPoints:[
          '单形性快速室速：仍可分辨 QRS 与 T 波、波间常有等电位成分，频率多 <250 次/分。',
          '运动伪差、电极脱落：患者清醒、有脉搏，伪差中可见原有 QRS 按节律“穿行”。'
        ]
      },
      periop:{
        timing:'术前有室扑/室颤或心脏骤停史者，择期手术前必须由心内科评估原因及是否已植入除颤器。',
        anesthesia:'备好除颤器；植入式除颤器患者按程控要求术前调整，术中使用体外除颤电极片。',
        postoperative:'复苏成功后查找诱因：急性缺血、电解质紊乱（低钾、低镁）、低氧、QT 延长药物等，并持续监护。',
        consultation:'一旦发生立即启动急救流程，同时联系心内科和重症团队。'
      },
      references:[REF.va,REF.escVa],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'nonparoxysmal-junctional-tachycardia',title:'非阵发性交界性心动过速',category:'arrhythmias',risk:'medium',
      aliases:['加速性交界性心律','加速性交界性心动过速','NPJT','AJT','交界性心动过速','JET','交界性异位性心动过速'],
      related:['junctional-rhythm','digoxin-effect','atrial-fibrillation'],
      textbook:book(CH14,'250–255'),
      basic:{
        summary:'交界区自律性增高，频率 70–130 次/分（多 70–100），逐渐起始、逐渐终止，常与窦性心律交替控制心室；多见于洋地黄过量、急性心梗、心肌炎和心脏术后。',
        criteria:[['频率','多为 70–130 次/分，大多在 70–100 次/分'],['QRS','与窦性时基本相同（窄）'],['心房','可被逆传激动（II、III、aVF 逆行 P′），更多时仍由窦房结控制，形成干扰性房室分离'],['特征','与窦性心律频率接近时，心室时而由窦房结、时而由交界区控制（“逐渐出现、逐渐消失”），可见房性融合波'],['命名（教材）','<70 次/分称交界性心律，70 至 130–140 次/分称交界性心动过速；国际常用划分为 60–100 次/分称加速性交界性心律、>100 次/分称交界性心动过速（见“交界性心律”）']],
        diagram:{kind:'npjt',caption:'非阵发性交界性心动过速教学示意：窄 QRS 约 90 次/分，QRS 后有逆行 P′，与心房活动无固定前传关系。'},
        diagnosticPoints:[
          '与被动性交界性心律（逸搏心律，40–50 次/分，是保护性的生理现象）不同，这是主动性心律，提示交界区存在病理状态，但不等于一定有器质性心脏病。',
          '常见病因：洋地黄过量（尤其合并低钾）、急性下壁心梗或缺血再灌注、风湿性心肌炎、心脏外科术后、电解质紊乱、缺氧。',
          '房颤患者服用洋地黄后心室律突然变得规则（约 70–100 次/分），要想到房颤合并非阵发性交界性心动过速和房室分离，是洋地黄中毒的重要线索。',
          '交界性异位性心动过速（JET）机制相同但更快（婴幼儿可达 140–370 次/分），多见于先天性心脏病矫治术后 24 小时内，可伴房室分离，死亡率较高。'
        ],
        differentialPoints:[
          '阵发性室上速：突发突止、频率多 150–250 次/分，为折返机制。',
          '窦性心动过速：P 波为窦性、位于 QRS 前，PR 正常。',
          '“冠状窦性心律”（II、III、aVF 的 P 倒置但 PR >120 ms）：现认为多为低位房性节律或房速，而非交界性心律。'
        ]
      },
      periop:{
        timing:'新出现者先查原因（地高辛浓度、血钾、心肌缺血、心肌炎）；病因未明确前择期手术宜推迟。',
        anesthesia:'告知麻醉团队；纠正低钾低镁，暂停可疑药物（如洋地黄），房室不同步可使心排量下降，注意血压。',
        postoperative:'心脏或胸部手术后较常见；复查电解质和用药，伴低血压时联系相关团队。',
        consultation:'疑似洋地黄中毒、急性缺血，或伴血流动力学改变时请心内科会诊。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'pjrt',title:'持续性交界区反复性心动过速（PJRT）',category:'arrhythmias',risk:'medium',
      aliases:['PJRT','持续性交界区反复性心动过速','无休止性室上速','慢旁路','长RP心动过速','心动过速性心肌病'],
      related:['avrt','narrow-complex-tachycardia','atrial-tachycardia'],
      textbook:book(CH15,'264–265'),
      basic:{
        summary:'由逆传慢旁路参与的顺向型房室折返：长 RP′（RP′ ≥ P′R）、下壁导联 P′ 深倒，几乎不间断发作，多见于儿童青少年，可致心动过速性心肌病。',
        criteria:[['心率','多为 140–240 次/分'],['逆行 P′','II、III、aVF 及 V3–V6 倒置，aVR 直立；P′ 电轴指向上方'],['P′ 位置','离 QRS 较远，RP′/P′R ≥1（长 RP 心动过速）'],['发作方式','可由窦性心率加快、房早、室早或交界性早搏诱发；心动过速占 24 小时心搏的大部分（教材：>90% 为无休止型）'],['窦性心律时','P 波、PR 和 QRS 正常，无预激']],
        diagram:{kind:'pjrt',caption:'PJRT 教学示意：窄 QRS 心动过速，倒置的逆行 P′ 远离前一个 QRS、靠近下一个 QRS（RP′ 长于 P′R）。'},
        diagnosticPoints:[
          '本质是具有递减传导功能的隐匿性慢旁路参与的顺向型房室折返，旁路多位于右后间隔，也可在其他部位或多条并存。',
          '因发作几乎不间断，部分患者出现左心功能下降甚至“致心律失常型心肌病”，心动过速控制后心功能可明显改善。',
          '药物多数无效，导管消融是首选治疗；心肌病不是消融禁忌证，反而应尽早治疗。'
        ],
        differentialPoints:[
          '房性心动过速（尤其起源于右房下部或冠状窦口附近）：同样表现为长 RP′、下壁 P′ 倒置；出现房室阻滞而心动过速持续支持房速。',
          '非典型（快–慢型）房室结折返：同为长 RP′，体表心电图难以区分，需电生理检查。',
          '窦性心动过速：P 波为窦性形态（II 直立）。'
        ]
      },
      periop:{
        timing:'持续或频繁发作者，择期手术前应先评估心功能，并请心内科考虑消融。',
        anesthesia:'告知麻醉团队；心功能下降者注意容量和血压管理，备好电复律。',
        postoperative:'术后持续心动过速伴低血压或心衰加重时及时处理并联系心内科。',
        consultation:'确诊或疑似者均建议心内科评估，尤其伴心功能下降时。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'sinus-node-reentry',title:'窦房结折返性心动过速',category:'arrhythmias',risk:'low',
      aliases:['SNRT','SANRT','窦房折返','窦房结折返','阵发性窦速'],
      related:['sinus-tachycardia','atrial-tachycardia','narrow-complex-tachycardia'],
      textbook:book(CH15,'271–272'),
      basic:{
        summary:'P 波形态与窦性完全相同的阵发性心动过速，突发突止，频率 120–200 次/分，可被早搏诱发和终止，迷走刺激可终止。',
        criteria:[['P 波','形态、激动顺序与窦性相同'],['频率','120–200 次/分，节律可整齐也可不齐'],['起止','突发突止，适时的房性或室性早搏可诱发或终止'],['终止后','间歇等于或略长于一个窦性周期'],['其他','出现房室阻滞不影响心动过速；PR 长短与心率有关']],
        diagram:{kind:'sinus-tachycardia',caption:'窦房结折返性心动过速与窦速图形相似：P 波为窦性形态，需看起止方式区分。'},
        diagnosticPoints:[
          '约占室上速的 5%，多见于老年人和有器质性心脏病者；机制可能是窦房结及其周围组织提供了缓慢传导区。',
          '与生理性窦速的关键区别：窦速逐渐加快、逐渐减慢，有发热、疼痛、低血容量等诱因；SNRT 突然开始、突然终止，可被早搏诱发。',
          '频率通常不太快、发作呈阵发性，对患者影响多不严重，症状不明显者可不做特殊处理。'
        ],
        differentialPoints:[
          '窦性心动过速：渐起渐止，有可解释的生理或病理原因。',
          '起源于窦房结附近的房速：P′ 形态与窦性 P 波十分相似，体表心电图难以鉴别，需电生理检查。',
          '不适当窦性心动过速：持续性窦速、静息时也偏快，没有突发突止的特点。'
        ]
      },
      periop:{
        timing:'发作少、症状轻者通常不影响手术时机；频繁发作伴明显症状时，择期手术前可请心内科评估。',
        anesthesia:'发作时与窦速图形相似，先排除疼痛、浅麻醉、低血容量、发热等引起的生理性窦速。',
        postoperative:'术后心率突然加快且 P 波为窦性时，记录起止过程有助于鉴别。',
        consultation:'症状明显或反复发作时可请心内科评估。'
      },
      references:[REF.svt],updatedAt:UPDATED,reviewStatus:'待审核'
    }
  ];
  for(const entry of entries)if(!data.entries.some(item=>item.id===entry.id))data.entries.push(entry);

  const find=id=>data.entries.find(item=>item.id===id);
  const extend=(id,{textbook,criteria=[],points=[],differentials=[],related=[]})=>{
    const entry=find(id);if(!entry)return;
    if(textbook&&!entry.textbook)entry.textbook=textbook;
    entry.basic.criteria=[...(entry.basic.criteria||[]),...criteria];
    entry.basic.diagnosticPoints.push(...points);
    entry.basic.differentialPoints.push(...differentials);
    entry.related=[...new Set([...(entry.related||[]),...related])].filter(other=>other!==id);
    entry.updatedAt=UPDATED;
  };

  extend('junctional-rhythm',{textbook:book(CH14,'243–250'),
    criteria:[['交界性逸搏（教材）','延迟出现于长间歇之后；QRS 与窦性相同或稍有差异；QRS 前即使有窦性 P 波，PR 也 <0.10 s，或可见逆行 P 波（II、III、aVF 倒置，aVR 直立）'],['交界性逸搏心律','连续 ≥3 个交界性逸搏，节律匀齐，40–50 次/分']],
    points:['逆行 P′ 与 QRS 的先后关系取决于逆传和前传速度，不能据此定位起搏点的“上、中、下”；经房室结快径逆传时 P′ 多与 QRS 重叠、在下壁导联倒置不深，经慢径逆传时 P′ 离 QRS 较远、倒置明显。','被动性交界性心律是窦性激动迟迟不能下传时的保护性心律，见于窦缓、窦性停搏、早搏后长间歇、房室阻滞等，本身不是病理现象；窦性 P 波落在交界区不应期而不能下传，形成干扰性房室分离，需与房室阻滞区别。','反复搏动：交界性搏动后逆传心房（逆行 P′，RP′ 常 >0.14 s），再经快径折返下传形成第二个 QRS。要与“逸搏–夺获”区别：后者两个 QRS 之间夹的是直立的窦性 P 波。'],
    related:['nonparoxysmal-junctional-tachycardia']});
  extend('digoxin-effect',{related:['nonparoxysmal-junctional-tachycardia']});
  extend('svt',{textbook:book(CH15,'259–272'),
    criteria:[['教材：AVNRT 分型','慢–快型约占 90%（RP′ <70 ms，P′ 多藏于 QRS 内，可见假 s 波、V1 假 r′ 波）；快–慢型与慢–慢型约占 10%（RP′ >70 ms，快–慢型 RP′ > P′R）'],['教材：顺向型 AVRT','窄 QRS，150–250 次/分，RP′ >70 ms 且 RP′ < P′R，可见 QRS 电交替']],
    points:['V1 假 r′ 波对诊断慢–快型 AVNRT 的敏感性约 77%、特异性约 99%；下壁导联假 s 波发生率 30%–46%；约一半病例看不到逆行 P′（心房和心室同时除极）。','AVNRT 时心房和心室都不是折返环的必需部分，因此可出现 2:1 房室传导或 2:1 室房传导而心动过速不终止；AVRT 则一旦出现房室阻滞就会终止。','程控期前刺激时 A2H2 突然延长 ≥50 ms 称“跳跃现象”，提示房室结双径路；10%–30% 无心动过速史的人也可有跳跃现象。','鉴别 AVNRT 与 AVRT 的五项指标：假 r′ 波、假 s 波、逆行 P′ 有无及 RP′ 间期、ST 段改变（V4–V5 同时压低 ≥2 mm、V3–V6 同时压低 ≥1 mm、或 V6 压低 ≥1 mm 伴 aVR 抬高 ≥1 mm 时支持 AVRT）。']});
  extend('avrt',{textbook:book(CH15,'259–264'),
    points:['教材补充：顺向型约占房室折返的 90% 以上；约半数发作中出现束支阻滞形 QRS，以左束支阻滞形常见。发生与旁路同侧的束支阻滞时心动过速周长延长 ≥35 ms 是诊断同侧游离壁旁路的指标；对侧阻滞则周长不变。','隐匿性旁路的心动过速时，I 导联 P′ 负向、V1 导联 P′ 正向提示左侧旁路。根据 delta 波极向的旁路定位表：I、aVL 负向提示左前侧，II、III、aVF 负向提示后间隔或后侧。']});
  extend('atrial-tachycardia',{textbook:book(CH15,'272–274'),
    criteria:[['教材：P′ 定位','起源右房上部：II、III、aVF 的 P′ 直立；右房下部：II、III、aVF 倒置；I、aVL 倒置高度提示左房起源（P′ 电轴 +91° 至 +180°）'],['教材：机制区分','自律性房速有“温醒”（起始逐渐加快）和“冷却”现象，迷走刺激和腺苷不能终止；折返性房速突发突止，可被刺激诱发和终止']],
    points:['房速约占室上速的 7%–10%，儿童和 60 岁以上患者比例更高；典型频率 150–250 次/分，常 <250 次/分。','房速 1:1 下传时易与依赖房室结的室上速混淆；出现房室阻滞时诊断容易——心动过速持续说明房室结不是折返环的一部分。']});
  extend('mat',{textbook:book(CH15,'272'),points:['教材将其归为多源性（紊乱性）房速：同一导联 P′ 有 3 种或更多形态，P′P′、P′R 和 RR 间期均有变化。']});
  extend('atrial-flutter',{textbook:book(CH17,'287–299'),
    criteria:[['教材：F 波','形态、方向、大小一致的锯齿状波，波间间隔极匀齐（相差 ≤20 ms），下壁导联最清楚'],['逆钟向（常见型）','II、III、aVF 的 F 波负向、下降支平缓上升支陡直，波间无等电位线；V1 正向、V6 负向'],['顺钟向（少见型）','II、III、aVF 的 F 波正向带切迹、较圆钝；V1 负向、V6 正向'],['频率','典型房扑 240–340 次/分；房速多为 160–220 次/分，两者有重叠'],['传导比例','未治疗时多为 2:1（心室率约 150 次/分），比例多为偶数；成人 1:1 下传少见，多见于预激或 Ic 类药物作用后']],
    points:['典型房扑是围绕三尖瓣环的右房大折返，必经下腔静脉口与三尖瓣环之间的峡部（峡部依赖性），峡部线性消融成功率约 95%；非峡部依赖性（瘢痕、间隔、左房）房扑 F 波形态无固定规律，消融难度大。','“不纯性房扑”：F 波形态、频率不完全一致，常 >350 次/分，部分时间表现为房颤。间隔性房扑的肢体导联几乎看不到扑动波，仅 V1 可见小 F 波与等电位线，易漏诊。','窄 QRS 规则心动过速、心室率恰为 150 次/分时，即使看不清 F 波也应考虑房扑 2:1；刺激迷走神经可增加阻滞比例、显露 F 波，而 F 波频率不变。','传导比例 ≥5:1 且排除了洋地黄、β 受体阻滞剂等药物影响时，才考虑合并房室阻滞；描述时应写出最小和最大传导比例（如 2:1 至 7:1）。','Ic 类或奎尼丁类药物使 F 波减慢（如 250→220 次/分）时，3:1 可能变为 2:1、甚至 1:1，心室率反而加快，需同时使用房室结阻滞药物。','房扑持续超过 48 小时，复律前应与房颤一样进行抗凝评估。'],
    differentials:['与房速鉴别：房扑多数导联无等电位线（房速在可辨认 P 波的导联都有等电位线），F 波较宽大；房速多 1:1 下传，心室率可快于 2:1 的房扑。','房扑伴室内差异性传导或室早：差传 QRS 起始向量与正常相同，V1 多呈三相 rSR′；室性者 V1 多为单相或双相（qR、QR、RS）。','房扑经旁路 1:1 下传可形成极快的宽 QRS 心动过速，与室速难以区分，需紧急处理。'],
    related:['atrial-tachycardia','narrow-complex-tachycardia']});
  extend('atrial-fibrillation',{textbook:book(CH17,'299–309'),
    criteria:[['教材：f 波','P 波消失，代之以大小、形态、间隔都不一的颤动波（f 波），350–600 次/分；V1 或 II 导联最易辨认'],['粗颤与细颤','f 波粗大者频率较低、较易复律；细颤时基线几乎平直，只能依靠 RR 绝对不齐诊断'],['心室率','无旁路或希浦系统病变时多为窄 QRS；心室率 >200 次/分提示可能经旁路下传']],
    points:['RR 绝对不齐是最重要的诊断依据；但房颤合并完全性房室阻滞时，心室由逸搏控制，RR 反而完全匀齐（缓慢规则）——这本身就是一个重要的诊断。心室率极快时 RR 看似规则，用分规测量即可发现不齐。','心室率不齐的机制是房室结的隐匿性传导：大量 f 波只部分进入房室结，改变其不应期。迷走张力高（睡眠）时心室率慢，交感兴奋（运动）时心室率快。','房颤时出现宽 QRS：长 RR 之后紧跟短 RR（“长间歇–短配对”，Ashman 现象）时，多为室内差异性传导，通常呈右束支阻滞形，QRS 起始部与正常相同；室早则无这种长–短规律，形态与室上性 QRS 完全不同。服洋地黄者出现室早二联律和“鱼钩样” ST-T 时要想到洋地黄过量。','预激合并房颤：心室率极快、QRS 宽窄不一且绝对不齐，最短预激 RR 间期 ≤250 ms 提示高危旁路和猝死风险；此时禁用洋地黄、维拉帕米、地尔硫䓬等房室结阻滞药物。','房颤可与房扑相互转换、并存；房扑的峡部消融可使部分患者房颤发作减少。'],
    differentials:['教材治疗部分（抗凝目标、药物选择）出版于 2009 年，已被后续指南更新，临床处理请以现行房颤指南为准。'],
    related:['pre-excitation']});
  extend('sinus-tachycardia',{textbook:book(CH13,'236–237'),
    criteria:[['教材标准','窦性 P 波；频率 ≥100 次/分；PR >120 ms']],
    points:['窦速时 P 波可略增高，PR 略缩短，P 波可与前一个 T 波重叠而不易辨认；持续时间长或原有心脏病时可出现 ST 段轻度压低、T 波低平或倒置。','体温每升高 1 ℃，窦性心率约增快 8 次/分。']});
  extend('sinus-bradycardia',{textbook:book(CH13,'237–238'),
    criteria:[['教材标准','窦性 P 波；频率 <60 次/分，<45 次/分为严重窦缓；常伴窦性心律不齐']],
    points:['窦性心率 <40 次/分时要考虑 2:1 窦房阻滞。严重窦缓可出现逸搏和干扰性房室分离，需与房室阻滞鉴别：前者窦性心率慢于逸搏心率，后者窦性心率快于逸搏心率。'],
    related:['sinoatrial-block']});
  extend('sinus-node-dysfunction',{textbook:book(CH13,'240–241'),
    points:['教材提示：二度窦房阻滞的长 PP 是基本 PP 的 2 倍或 3 倍，窦性停搏则无倍数关系；三度窦房阻滞与窦性停搏在体表心电图上无法区分。病窦综合征患者近半数在心动过缓的基础上发生房颤等快速心律（慢–快综合征）。'],
    related:['sinoatrial-block']});
  extend('pre-excitation',{textbook:book(CH18,'312–331'),
    criteria:[['教材：典型 WPW','PR <120 ms；QRS >100 ms；QRS 起始部 delta 波；PJ 间期正常（多 ≤260 ms，因 PR 缩短与 QRS 增宽相互抵消）；继发性 ST-T 改变。右侧旁路预激通常较明显，左侧旁路常不明显；预激可间歇出现'],['与束支阻滞鉴别（教材）','WPW：PR <120 ms、PJ 间期 <270 ms、QRS 起始部有 delta 波、图形可变、常伴室上速；束支阻滞：PR >120 ms、PJ 常 >270 ms、QRS 虽有切迹但起始部无 delta 波、图形较恒定']],
    points:['旁路粗略定位：V1 主波向上多为左侧旁路（A 型），V1 主波向下多为右侧旁路（B 型）；I、aVL 预激波负向提示左侧游离壁，II、III、aVF 预激波负向提示后间隔或后壁。定位受预激程度影响，准确定位需电生理检查。','预激合并房颤的发生率约 11%–39%，最大危险是经旁路下传的极快心室率蜕变为室颤；房颤时最短的预激 RR 间期 <250 ms 提示高危旁路。'],
    differentials:['delta 波可酷似病理性 Q 波：B 型预激 V1–V3 的 QS 形似前间壁梗死，III、aVF 负向 delta 波似下壁梗死，A 型 V1 高 R 波似后壁梗死；判断心梗要依靠症状和 ST-T 的动态演变。','预激的 ST-T 改变多为继发性，不一定代表心肌缺血；必要时比较预激消失时的心电图。'],
    related:['avrt','lgl-short-pr','mahaim']});
  extend('svt',{textbook:book(CH20,'361–366'),related:['avrt','narrow-complex-tachycardia']});
  extend('ventricular-tachycardia',{textbook:book(CH19,'336–358'),
    criteria:[['教材分类','非持续性（<30 秒自行终止）与持续性（≥30 秒或需干预终止）；按形态分单形、多形、双向性、尖端扭转型；另有束支折返性室速'],['教材 “ABCDEF” 线索','A 房室分离；B QRS 宽度（右束支阻滞形 >140 ms 或左束支阻滞形 >160 ms）；C 胸导联同向；D 电轴偏向“无人区”（−90° 至 ±180°）；E 迷走刺激的效果；F 符合室速的 QRS 形态（如 V1 “左兔耳”征）']],
    points:['非持续性室速常见于器质性心脏病，也可见于 0–3% 的健康人；评估重点是症状和是否有基础心脏病。','反复性单形室速（RMVT）：频发室早、成对和短阵室速反复交替，形态一致，多为右室流出道起源的特发性室速。','束支折返性室速约占可诱发持续性室速的 6%，多见于扩张型心肌病，常呈典型左束支阻滞形，可通过消融右束支根治。'],
    related:['idiopathic-vt','ventricular-flutter']});
  extend('wide-complex-tachycardia',{textbook:book(CH20,'366–372'),
    criteria:[['Brugada 四步法（1991）','①所有胸导联均无 RS 形 → 室速；②任一胸导联 R 波起点至 S 波最低点 >100 ms → 室速；③有房室分离 → 室速；④V1 和 V6 均符合室速形态 → 室速；否则为室上速伴差传'],['aVR 四步法（Vereckei 2008）','①房室分离 → 室速；②aVR 起始为 R 波 → 室速；③QRS 形态不像束支或分支阻滞 → 室速；④Vi/Vt ≤1（QRS 起始 40 ms 与终末 40 ms 电压变化之比）→ 室速，>1 为室上速'],['V1/V6 形态线索','右束支阻滞形：V1 呈 R、qR 或 RsR′ 且 R>R′（“左兔耳”），V6 R/S <1 或 QS → 室速；左束支阻滞形：V1–V2 r 波 >30 ms、S 波降支顿挫或切迹、R 起点至 S 最低点 >60 ms（Kindwall 标准；部分教材写 70 ms），V6 呈 qR/QS → 室速']],
    points:['房室分离诊断室速的特异性接近 100%，但敏感性只有约 20%；心率越快越难发现，V1 导联最容易看到。','临床上宽 QRS 心动过速约 80%–90% 最终证实为室速，约 10% 用各种标准仍无法鉴别；鉴别困难时按室速处理，不稳定者立即电复律。','Vi/Vt 法的原理：室上性激动经希浦系统，起始除极快、阻滞部位在中末段；室性激动起始在心肌内缓慢传导，所以起始 40 ms 的电压变化小于终末 40 ms。'],
    related:['idiopathic-vt','avrt','mahaim']});
  extend('torsades-de-pointes',{textbook:book(CH19,'353–356'),
    points:['教材强调 QT 延长是尖端扭转的根本特点：发作常由联律间期较长的舒张晚期室早诱发，典型呈“短–长–短”周期。QT 正常时的多形性室速应称为多形性室速，不称尖端扭转。','短联律间期变异型：QT 正常，由联律间期 <300 ms（常 220–280 ms）的室早触发，多见于中青年，维拉帕米可能有效，需排除 ARVC、Brugada 等。','继发性长 QT 的常见病因：影响复极的药物、低钾低镁低钙、严重心动过缓（三度房室阻滞、病窦）、心肌炎、颅内病变等；急诊处理包括静脉补镁补钾、提高基础心率（90–120 次/分）。']});
  extend('ventricular-fibrillation',{textbook:book(CH19,'358–359'),
    criteria:[['教材标准','心室率通常 >300 次/分（周期 ≤180 ms），节律、QRS 宽度、形态和振幅均不规则']],
    related:['ventricular-flutter']});
  extend('first-degree-av-block',{textbook:book(CH21,'378–383'),
    criteria:[['教材标准','PR ≥0.21 s（14 岁以下儿童 ≥0.18 s），或超过相应心率的正常上限；心率未变而 PR 较原来延长 >0.04 s 也应考虑']],
    points:['延长的 PR 多在 0.21–0.35 s，偶可达 1 s；PR 很长时 P 波可埋在前一个 T 波里，易误认为交界性心律，压迫颈动脉窦使窦率减慢可使 P 波显露。','窄 QRS 时阻滞多在房室结；伴束支阻滞时阻滞可能在希浦系统，PR 正常也不能完全排除房室传导障碍（如希氏束内延迟）。']});
  extend('mobitz-i',{textbook:book(CH21,'383–386'),
    points:['典型文氏周期的三个特点：PR 增加量逐渐减少（最大增量在第二个下传搏动）；RR 间期因此逐渐缩短；含脱落的长 RR 小于任意两个最短 RR 之和。实际上不典型文氏周期更常见，传导比例越大越不典型。','二度 I 型阻滞约 70% 在房室结，常见于下壁心梗（多为可逆的缺血），通常较良性；伴宽 QRS 时阻滞可能在希浦系统。']});
  extend('mobitz-ii',{textbook:book(CH21,'388–389'),
    points:['二度 II 型阻滞几乎全部位于希浦系统（希氏束内或以下），约 7 成伴宽 QRS；常见于前壁心梗合并束支损伤，预后较差，易进展为完全性阻滞或晕厥（阿–斯综合征）。']});
  extend('av-block-2-1',{textbook:book(CH21,'389'),
    points:['2:1 阻滞本身无法区分 I 型或 II 型，阻滞可在房室结、希氏束内或双侧束支水平；窄 QRS 约占一半。观察同一记录中是否出现 3:2 文氏周期，或用阿托品、运动观察传导比例变化有助于判断。','由 3:2 转为 2:1 不一定代表阻滞加重（心房率稍增快即可发生）；由 2:1 转为 3:1 则多表示房室传导进一步恶化。']});
  extend('complete-heart-block',{textbook:book(CH21,'396–399'),
    criteria:[['教材标准','完全性房室分离，心房率快于心室率；心室律缓慢匀齐，通常 30–45 次/分（先天性者较快）']],
    points:['心房为房扑或房颤时也可合并完全性房室阻滞：RR 缓慢而绝对规则，与 F 波或 f 波无固定关系。','“窦率 70 次/分、独立的缓慢心室率 30 次/分、没有一个 P 波下传”才是真正的完全性阻滞；若交界区逸搏频率超过 60 次/分、P 波因干扰不能下传，属于干扰性房室分离，不是完全性房室阻滞。']});
  extend('high-grade-av-block',{textbook:book(CH21,'376、388'),
    points:['教材定义：阻滞程度为 3:1 或更重的二度房室阻滞称高度房室阻滞，可为 I 型或 II 型。']});
})();

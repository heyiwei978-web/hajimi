/* 第六批：参照陈新主编《黄宛临床心电图学》第 6 版（人民卫生出版社，2009）整理的学习要点。
   内容为自行归纳改写，不含原书原文或图片；与现行指南不一致处已注明，并以指南为准。草稿，待临床医师审核。 */
(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA;
  if(!data||!Array.isArray(data.entries))return;
  const UPDATED='2026-10-12';
  const REF={
    hrsChamber:{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part V：心腔肥大相关心电图改变（2009）',url:'https://hrsonline.org/guidance/clinical-resources/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-v'},
    hrsConduction:{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part III：室内传导障碍（2009）',url:'https://pubmed.ncbi.nlm.nih.gov/19281930/'},
    svt:{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia',url:'https://hrsonline.org/guidance/clinical-resources/2015-accahahrs-guideline-management-adult-patients-supraventricular-tachycardia'},
    ipas:{title:'2013 HRS/EHRA/APHRS 遗传性原发性心律失常综合征诊治专家共识',url:'https://hrsonline.org/guidance/clinical-resources/2013-hrsehraaphrs-expert-consensus-statement-diagnosis-and-management-patients-inherited-primary'},
    escVa:{title:'2022 ESC Guidelines for the management of patients with ventricular arrhythmias and the prevention of sudden cardiac death',url:'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Ventricular-Arrhythmias-and-the-prevention-of-sudden-cardiac-death'},
    pericardial:{title:'2015 ESC Guidelines for the diagnosis and management of pericardial diseases · Eur Heart J 2015',url:'https://pubmed.ncbi.nlm.nih.gov/26320112/'},
    leadReversal:{title:'Common ECG Lead Placement Errors. Part I: Limb Lead Reversals · Int J Med Students',url:'https://ijms.pitt.edu/IJMS/article/view/95'},
    periop:{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}
  };
  const BOOK='陈新主编《黄宛临床心电图学》第 6 版，人民卫生出版社，2009';
  data.textbook={title:BOOK,note:'教材要点为自行归纳，未转载原文和图片；教材出版于 2009 年，部分界值已被后续指南修订，冲突时以现行指南和本院标准为准。'};
  const book=(chapter,pages)=>({chapter,pages});

  if(!data.categories.some(item=>item.id==='structural'))data.categories.push({id:'structural',title:'心包、心肌与位置异常',description:'低电压、心包积液与右位心等。'});

  const entries=[
    {
      id:'left-atrial-abnormality',title:'左心房异常（左房肥大）',category:'enlargement',risk:'low',
      aliases:['左房肥大','左心房肥大','左房扩大','二尖瓣型P波','P mitrale','Ptf-V1','双峰P波','双心房肥大','LAE'],
      related:['right-atrial-abnormality','left-ventricular-hypertrophy','atrial-fibrillation'],
      textbook:book('第 3 章 心房与心室的扩大与肥厚','21–24、26–27'),
      basic:{
        summary:'P 波增宽、双峰，V1 导联 P 波终末负向部分加深；常见于二尖瓣病变和高血压，易伴房性心律失常。',
        criteria:[['P 波时限','教材：≥110 ms；AHA/ACCF/HRS 2009 建议成人以 ≥120 ms 为界'],['P 波形态','双峰，峰距 >40 ms，第二峰常高于第一峰；I、II、aVL、V4–V6 最典型'],['Ptf-V1','V1 导联 P 波终末负向部分增深增宽：负向振幅（mm）× 时间（s），绝对值增大；常用异常界值 ≤ −0.04 mm·s'],['双心房异常','P 波振幅 ≥0.25 mV 且时限 ≥110 ms 同时存在']],
        diagram:{kind:'lae',caption:'左心房异常教学示意：II 导联 P 波增宽双峰；V1 导联 P 波终末负向部分宽而深。'},
        diagnosticPoints:[
          '左心房最后除极，扩大后除极时间延长，因此主要表现为 P 波“变宽”而非“变高”：P 波时限延长、双峰，额面 P 电轴可轻度左偏。',
          '测量 Ptf-V1 时可把走纸速度改为 50 mm/s、增益加倍，计算时注意换算回标准比例。肺气肿或胸导联放置过高时 V1 的 P 波也可倒置，需核对电极位置。',
          '常伴房性早搏、房速、房扑或房颤；风湿性二尖瓣狭窄者房性快速心律失常的发生率很高。也可合并右心室肥厚的表现（二尖瓣狭窄致肺动脉高压）。',
          '双心房异常：同时具备 P 波增高（≥0.25 mV）与增宽（≥110 ms），V1 导联 P 波正负双向且两部分都明显。'
        ],
        differentialPoints:[
          '不完全性心房内阻滞（Bachmann 束传导延缓）可呈完全相同的宽双峰 P 波，但没有左心房扩大的证据，多见于冠心病；心电图本身无法区分，需超声确认。',
          '非典型预激：delta 波起始于 P 波降支、振幅较小时，可与 P 波融合，酷似双峰 P 波。',
          '心电图诊断心房扩大的敏感性和特异性都有限，“左心房异常”比“左房肥大”更准确；结构判断以超声心动图为准。'
        ]
      },
      periop:{
        timing:'单独的左心房异常一般不影响手术时机。若提示未评估过的二尖瓣狭窄、心衰或新发房颤，择期手术前应完成超声心动图评估。',
        anesthesia:'告知麻醉团队可能的瓣膜病和房性心律失常风险；二尖瓣狭窄患者对心动过速和容量过多耐受差，需维持较慢心室率和适当前负荷。',
        postoperative:'术后疼痛、低氧、电解质紊乱和容量变化易诱发房颤，留意心悸和心率突然加快，必要时复查心电图。',
        consultation:'疑似中重度瓣膜病、心衰，或术后新发房颤、房扑时请心内科会诊。'
      },
      references:[REF.hrsChamber,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'right-atrial-abnormality',title:'右心房异常（右房肥大）',category:'enlargement',risk:'low',
      aliases:['右房肥大','右心房肥大','右房扩大','肺型P波','P pulmonale','先天性P波','高尖P波','RAE'],
      related:['left-atrial-abnormality','right-ventricular-hypertrophy','pulmonary-embolism'],
      textbook:book('第 3 章 心房与心室的扩大与肥厚','24–26'),
      basic:{
        summary:'P 波高尖而时限不宽：肢体导联 ≥0.25 mV、V1–V2 ≥0.20 mV；见于肺心病、肺动脉高压和先天性心脏病。',
        criteria:[['肢体导联 P 波','高尖，II、III、aVF 振幅 ≥0.25 mV'],['胸导联 P 波','V1、V2 直立高尖，振幅 ≥0.20 mV'],['P 波时限','不增宽（一般 ≤100 ms）'],['伴随表现','PR 段可因心房复极波而轻度下移']],
        diagram:{kind:'rae',caption:'右心房异常教学示意：II 导联 P 波高尖，时限正常；V1 导联 P 波直立高尖。'},
        diagnosticPoints:[
          '右心房先除极、先结束，扩大后主要增加向右前下的 P 向量，所以 P 波“变高”而不“变宽”，II、III、aVF 最明显。',
          '慢性肺病所致者习称“肺型 P 波”；法洛四联症、房间隔缺损等先天性心脏病所致者称“先天性 P 波”。',
          '常与右心室肥厚、电轴右偏同时出现；病因治疗后高尖 P 波可减轻或消失。'
        ],
        differentialPoints:[
          '心动过速（运动试验、窦速、房速）本身可使下壁导联 P 波增高至 ≥0.25 mV，心率减慢后恢复，不应诊断为右心房异常。',
          '右心房内阻滞（包括心率相关的 3 相、4 相阻滞）也可使 P 波增高变尖，阻滞消失后 P 波恢复正常。',
          '单凭 P 波振幅诊断右心房扩大的准确性有限，需结合临床病因和超声心动图。'
        ]
      },
      periop:{
        timing:'本身不改变手术时机；但提示慢性肺病、肺动脉高压或先天性心脏病时，择期手术前应明确右心功能和肺动脉压。',
        anesthesia:'若存在肺动脉高压，避免低氧、高碳酸血症、酸中毒和低体温，避免低血压；骨科髓内钉和骨水泥植入时留意栓塞所致的急性右心负荷。',
        postoperative:'关注氧合、液体平衡和右心衰征象；术后肺不张、疼痛限制呼吸会加重低氧。',
        consultation:'疑似中重度肺动脉高压、右心衰或未评估的先天性心脏病时，术前请心内科或呼吸科会诊。'
      },
      references:[REF.hrsChamber,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'premature-atrial-contractions',title:'房性早搏',category:'arrhythmias',risk:'low',
      aliases:['房早','房性期前收缩','PAC','APB','未下传房早','房早未下传','房早伴差传','室内差异性传导','早搏'],
      related:['premature-junctional-contractions','premature-ventricular-contractions','atrial-fibrillation'],
      textbook:book('第 16 章 期前收缩','275–278、283–285'),
      basic:{
        summary:'提前出现、形态与窦性不同的 P′ 波，P′R ≥120 ms，其后 QRS 多正常；常伴不完全性代偿间歇。',
        criteria:[['P′ 波','提前出现，形态与窦性 P 波不同（可直立或倒置），常重叠在前一个 T 波上'],['P′R 间期','≥120 ms（过早者可因干扰而延长）'],['其后 QRS','正常；或缺如（未下传）；或宽大畸形（伴室内差异性传导，多呈右束支阻滞形）'],['代偿间歇','多为不完全性（早搏前后两个窦性 P 波间距 < 2 个窦性 PP）']],
        diagram:{kind:'pac',caption:'房性早搏教学示意：提前出现的 P′ 波形态不同，QRS 正常，其后为不完全性代偿间歇。'},
        diagnosticPoints:[
          '先找提前出现的 P′ 波：早发的 P′ 常藏在前一个 T 波里，使 T 波出现切迹、变尖或振幅改变；选 T 波平坦、P 波清楚的导联比较。',
          '异位激动常逆传侵入窦房结、使其节律重整，所以代偿间歇多不完全；少数窦房结已先发放激动时，代偿间歇可以完全。',
          '舒张早期的 P′ 到达房室交界区时若处于不应期，则不能下传（未下传房早）；落在相对不应期时 P′R 延长，或使 QRS 呈差异性传导而增宽。',
          '描述时注明频率、是否成对、二联律或三联律、是否多源（P′ 形态和联律间期多变）以及是否诱发短阵房速。'
        ],
        differentialPoints:[
          '未下传房早 vs 窦性停搏或二度房室阻滞：长间歇前一个 T 波若有“额外”的 P′，即为未下传房早；未下传房早二联律常被误认为窦性心动过缓。',
          '房早伴差异性传导 vs 室性早搏：前者 QRS 前有提前的 P′，QRS 多呈右束支阻滞形且起始向量与窦性相同；不能只凭 QRS 增宽就判为室早。',
          '交界性早搏：逆行 P′ 在 II、III、aVF 倒置，且 P′R <120 ms 或 P′ 位于 QRS 之后；低位房性早搏也可有逆行 P′，需结合 P′R 判断。'
        ]
      },
      periop:{
        timing:'偶发、无症状的房性早搏不需要推迟手术。频发或成串时，查找电解质紊乱、甲亢、低氧、贫血、疼痛焦虑和药物等诱因。',
        anesthesia:'告知麻醉团队基线节律；术中交感兴奋、低氧和电解质异常可使房早增多，并可能诱发房颤或房扑。',
        postoperative:'频发房早常是术后房颤的前兆，结合诱因处理，必要时监护；纠正低钾、低镁。',
        consultation:'频发多源房早伴心悸、心衰症状，或进展为房速、房颤、房扑时请心内科会诊。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'premature-junctional-contractions',title:'交界性早搏',category:'arrhythmias',risk:'low',
      aliases:['交界性期前收缩','房室交界性早搏','交界区早搏','PJC','逆行P波','早搏'],
      related:['premature-atrial-contractions','premature-ventricular-contractions','junctional-rhythm'],
      textbook:book('第 16 章 期前收缩','278–279、283–284'),
      basic:{
        summary:'提前出现的窄 QRS（与窦性相同），其前无窦性 P 波，可伴逆行 P′；多为完全性代偿间歇。',
        criteria:[['QRS','提前出现，形态与窦性基本相同（可伴差异性传导）'],['逆行 P′','II、III、aVF 倒置，aVR 直立'],['P′ 位置','QRS 前（P′R <120 ms）、QRS 中（看不到）或 QRS 后（RP′ <200 ms）'],['代偿间歇','多为完全性']],
        diagram:{kind:'pjc',caption:'交界性早搏教学示意：提前出现的窄 QRS 前无 P 波，其后可见倒置的逆行 P′ 波。'},
        diagnosticPoints:[
          '交界区激动同时向下传到心室、向上逆传到心房，逆行 P′ 出现在 QRS 前、中、后，取决于前传与逆传速度的快慢。',
          '交界性激动较少逆传侵入窦房结，窦性节律不被打乱，因此代偿间歇多为完全性；窦性心率慢且早搏较早、又逆传侵入窦房结时，也可不完全。',
          '窦性心率较慢、早搏又不逆传时，可出现插在两个窦性搏动之间的间位性交界性早搏；也可呈二联律、三联律。'
        ],
        differentialPoints:[
          '低位房性早搏也可有倒置 P′，但 P′R 一般 ≥120 ms。',
          '交界性早搏伴差异性传导时 QRS 增宽，易误认为室性早搏；寻找逆行 P′ 及与窦性 QRS 的形态比较有助于鉴别。',
          '交界性逸搏出现在长间歇之后（延迟出现），而交界性早搏是提前出现，两者意义不同。'
        ]
      },
      periop:{
        timing:'偶发交界性早搏通常不影响手术。频发时查找洋地黄类药物、电解质紊乱、缺血等诱因。',
        anesthesia:'告知麻醉团队基线节律；注意洋地黄类药物使用史及血钾水平。',
        postoperative:'频发或伴交界性心动过速时，复查电解质、药物浓度（如地高辛），结合监护观察。',
        consultation:'伴心悸、晕厥，或疑似洋地黄中毒、交界性心动过速时请心内科会诊。'
      },
      references:[REF.svt,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'congenital-long-qt',title:'先天性长 QT 综合征',category:'arrhythmias',risk:'high',
      aliases:['长QT综合征','LQTS','LQT1','LQT2','LQT3','遗传性长QT','Romano-Ward','Jervell-Lange-Nielsen','Schwartz评分','T波电交替'],
      related:['drug-induced-long-qt','torsades-de-pointes','short-qt','cpvt'],
      textbook:book('第 8 章 原发性心电疾病心电图（长 QT 综合征）','132–141'),
      basic:{
        summary:'离子通道基因异常致复极延长：QT 延长、T 波形态异常，应激时可发生尖端扭转型室速、晕厥和猝死；诊断需结合病史和家族史。',
        criteria:[['QTc（Bazett）计分','≥480 ms 3 分；460–479 ms 2 分；男性 450–459 ms 1 分'],['其他心电图计分','尖端扭转型室速 2 分；T 波电交替 1 分；3 个导联 T 波切迹 1 分；静息心率低于同龄 0.5 分'],['临床与家族史','应激诱发晕厥 2 分、非应激晕厥 1 分；先天性耳聋 0.5 分；家族成员确诊 1 分；30 岁以下直系亲属不明原因猝死 0.5 分'],['可能性分级','教材（1993 版）：≤1 分低、2–3 分中、≥4 分高；现行共识（Schwartz 评分）：≥3.5 分高度可能'],['现行共识诊断','评分 ≥3.5，或多次心电图 QTc ≥500 ms，或检出致病突变；QTc 480–499 ms 伴不明原因晕厥时也可诊断']],
        diagram:{kind:'lqts',caption:'先天性长 QT 综合征教学示意：QT 明显延长，T 波低平、有切迹。'},
        diagnosticPoints:[
          '心电图只能报告“QT 间期延长”，“长 QT 综合征”是结合症状、家族史和基因检测的临床诊断；约三成为散发病例。',
          '不同基因型的 T 波形态有提示作用：LQT1 常为基底宽大的 T 波；LQT2 为低平、双峰或带切迹的 T 波；LQT3 为 ST 段平直延长后出现晚发而尖锐的 T 波。但形态常有重叠，不能替代基因检测。',
          '诱因有特点：LQT1 多在运动（尤其游泳）时发作；LQT2 多由情绪激动或突然声响（如闹钟）诱发；LQT3 多在休息或睡眠时发作。',
          'T 波电交替（逐搏极性或振幅交替）多在应激时短暂出现，是电不稳定的高危标志；长间歇后 T 波变形，常继之以尖端扭转型室速。',
          '部分基因携带者静息 QTc 正常（“隐匿型”），QTc 正常不能排除；这类人可能在用药后才表现为药物性尖端扭转。'
        ],
        differentialPoints:[
          '获得性 QT 延长：药物、低钾、低镁、低钙、心动过缓、心肌缺血、颅内出血（如蛛网膜下腔出血）等，先逐一排除（见“药物相关 QT 间期延长”）。',
          '测量误差：把 U 波算入 QT（QU 间期）会误判延长；心率快时 Bazett 公式会高估 QTc，应选 T 波终点清楚的导联并结合其他公式。',
          '正常年轻女性 QTc 可超过 460 ms，单次边界值不宜直接诊断。'
        ]
      },
      periop:{
        timing:'已确诊或高度怀疑者，择期手术前应由心内科评估：确认 β 受体阻滞剂规律服用、电解质正常，有植入式除颤器者按程控要求处理。未明确的显著 QT 延长（如 QTc ≥500 ms）应先查原因再决定手术时机。',
        anesthesia:'术前告知麻醉团队，备好除颤器和硫酸镁；避免延长 QT 的药物（部分止吐药、抗生素、抗精神病药等），维持钾、镁在正常偏高水平，避免交感兴奋（疼痛、焦虑、浅麻醉、突然噪声）。',
        postoperative:'持续心电监护，复查 QTc 和电解质；术后新增药物逐一核对 QT 风险；充分镇痛，避免突然的声响刺激（LQT2）。',
        consultation:'所有确诊或疑似患者均建议围手术期心内科共同管理；术中术后出现尖端扭转、晕厥或 QTc 明显延长时立即联系。'
      },
      references:[REF.ipas,REF.escVa,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'short-qt',title:'短 QT 综合征',category:'arrhythmias',risk:'high',
      aliases:['SQTS','短QT','QT缩短','QT间期缩短'],
      related:['congenital-long-qt','ventricular-fibrillation','atrial-fibrillation'],
      textbook:book('第 8 章 原发性心电疾病心电图（短 QT 综合征）','151–154'),
      basic:{
        summary:'QT 明显缩短、胸导联 T 波高尖对称，易发房颤、室速、室颤和猝死；心脏结构通常正常。',
        criteria:[['QTc','教材（2009）：QTc <300 ms 应考虑；后续指南多采用 ≤340–360 ms 并结合突变、家族史或心脏骤停史，具体以最新 ESC 指南为准'],['ST-T','ST 段短或几乎消失，胸导联 T 波高尖、多对称'],['频率适应','QT 不随心率减慢而相应延长'],['临床','心悸、阵发性房颤、晕厥、室速/室颤或猝死，常有家族史']],
        diagram:{kind:'sqts',caption:'短 QT 综合征教学示意：ST 段几乎消失，T 波紧接 QRS、高尖对称。'},
        diagnosticPoints:[
          '多为钾通道功能增强（如 HERG/KCNH2、KCNQ1、KCNJ2 突变），复极加快、心房和心室有效不应期缩短，易形成折返。',
          '短 QT 在慢心率时更显异常：正常人心率减慢时 QT 延长，SQTS 患者则不延长；应在心率 60–100 次/分时测量。',
          '部分患者以阵发性房颤为首发表现，年轻人不明原因房颤时应留意 QT。'
        ],
        differentialPoints:[
          '获得性 QT 缩短：高钙血症、地高辛效应、高热、酸中毒、高钾血症等，先纠正并复查。',
          '心动过速时 QT 本身缩短；Bazett 公式在心动过缓时会低估 QTc，单次测量不宜下结论。',
          '早期复极也可有高 T 波和短 ST 段，但 QTc 通常正常。'
        ]
      },
      periop:{
        timing:'确诊或疑似者择期手术前请心内科评估，有植入式除颤器者按程控要求处理；先排除并纠正高钙等获得性原因。',
        anesthesia:'告知麻醉团队，备好除颤器；维持电解质稳定，留意房颤和室性心律失常。',
        postoperative:'术后持续心电监护，复查电解质；新发房颤或室性心律失常及时处理。',
        consultation:'所有确诊或疑似患者均建议心内科共同管理；有晕厥、心脏骤停史或家族猝死史者尤其需要。'
      },
      references:[REF.escVa,REF.ipas],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'cpvt',title:'儿茶酚胺敏感性多形性室速（CPVT）',category:'arrhythmias',risk:'high',
      aliases:['CPVT','儿茶酚胺敏感性室速','儿茶酚胺诱导的多形性室速','双向性室速','RyR2','运动诱发室速'],
      related:['congenital-long-qt','ventricular-tachycardia','digoxin-effect'],
      textbook:book('第 8 章 原发性心电疾病心电图（儿茶酚胺诱导的多形性室速）','149–151'),
      basic:{
        summary:'静息心电图基本正常，运动或情绪激动时出现双向性或多形性室速，可致晕厥和猝死；多在儿童、青少年起病。',
        criteria:[['静息心电图','通常正常，QT 正常，可有轻度窦性心动过缓'],['运动试验','心率达约 120–130 次/分时出现室早，随负荷增加发展为二联律、成对、短阵室速'],['典型发作','双向性室速（QRS 电轴逐搏交替 180°）或多形性室速，可恶化为室颤'],['基因','多为 RyR2 突变，其次 CASQ2']],
        diagram:{kind:'cpvt',caption:'双向性室性心动过速教学示意：宽 QRS 主波方向逐搏交替。'},
        diagnosticPoints:[
          '核心是“肾上腺素能依赖”：心律失常与运动、情绪应激直接相关，停止运动后逐渐消失并恢复窦律。',
          '运动负荷试验或动态心电图对诊断最有价值；运动中室早随心率升高而增多、复杂化，是重要线索。',
          '首次症状多在儿童期（平均约 8 岁），常被误诊为癫痫或血管迷走性晕厥；运动或受惊时晕厥的年轻人应考虑。'
        ],
        differentialPoints:[
          '洋地黄中毒也可出现双向性室速，结合用药史和血药浓度鉴别。',
          '长 QT 综合征（尤其 LQT1）同样在运动时发作，但静息 QT 延长、发作为尖端扭转；Andersen-Tawil 综合征（LQT7）也可有双向性室性心律失常。',
          '心肌缺血、心肌病所致的运动诱发室性心律失常：需结合影像和冠脉评估排除器质性心脏病。'
        ]
      },
      periop:{
        timing:'确诊或疑似者择期手术前请心内科评估，确认 β 受体阻滞剂（及氟卡尼等）规律服用，有植入式除颤器者按程控要求处理。',
        anesthesia:'核心是避免儿茶酚胺骤增：术前充分镇静抗焦虑、足够麻醉深度和镇痛；尽量避免外源性肾上腺素、异丙肾上腺素等 β 受体激动剂（局麻药中的肾上腺素也需权衡）；备好除颤器。',
        postoperative:'术后继续 β 受体阻滞剂，持续监护；充分镇痛，避免疼痛、躁动、寒战引起的交感兴奋。',
        consultation:'所有确诊或疑似患者均建议心内科共同管理；术中术后出现频发室早、双向性或多形性室速时立即联系。'
      },
      references:[REF.escVa,REF.ipas],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'left-posterior-fascicular-block',title:'左后分支阻滞',category:'conduction',risk:'medium',
      aliases:['LPFB','LPHB','左后半阻滞','左后分支传导阻滞','电轴右偏','双分支阻滞'],
      related:['left-anterior-fascicular-block','right-bundle-branch-block','right-ventricular-hypertrophy'],
      textbook:book('第 22 章 室内阻滞（左束支分支阻滞）','424、427–429'),
      basic:{
        summary:'电轴右偏（约 +90° 至 +120°）、I 和 aVL 呈 rS、下壁导联呈 qR，QRS 不增宽；须先排除右心室肥厚等更常见原因。',
        criteria:[['额面电轴','右偏，教材 +90° 至 +120°（部分标准放宽至 +180°）'],['I、aVL','rS'],['II、III、aVF','qR，q 波时限 <40 ms'],['QRS','不增宽或轻度增宽（一般 ≤110 ms）'],['前提','排除右心室肥厚、瘦长体型、肺气肿、肺栓塞和广泛侧壁心肌梗死']],
        diagram:{kind:'lpfb',caption:'左后分支阻滞教学示意：I 导联 rS，III 导联 qR，电轴右偏。'},
        diagnosticPoints:[
          '左后分支阻滞时，左心室除极先沿左前分支进行，起始向量向左上（形成 I、aVL 的 r 和下壁 q），随后转向右下，额面 QRS 环顺钟向运行。',
          '左后分支短而粗，位于血流较缓的左室流入道，并接受双重血供，因此单独阻滞少见；一旦出现常提示心肌病变范围较广。',
          '与右束支阻滞合并时为双分支阻滞，进展为完全性房室阻滞的风险高于右束支阻滞合并左前分支阻滞。',
          '下壁心肌梗死毁损大量左后分支纤维时，II、III、aVF 可出现宽度达 40 ms 的 Q 波，QRS 可增宽（旧称下壁梗死周围阻滞）。'
        ],
        differentialPoints:[
          '右心室肥厚：多有先天性心脏病或肺心病，电轴常 >+110°，下壁导联可呈 R 型，有顺钟向转位、V1 高 R 波和超声证据；左后分支阻滞无右室肥厚证据，下壁呈 qR。',
          '垂位心与瘦长体型：电轴多不超过 +110°，aVR 的 Q/R <1、V5–V6 的 R/S >1，无右心负荷证据。',
          '左右上肢电极接反、右位心也可造成假性电轴右偏，先核对 I 导联 P 波方向和胸导联 R 波递增。'
        ]
      },
      periop:{
        timing:'无症状的单纯左后分支阻滞一般不需推迟手术，但应查找基础心脏病。合并右束支阻滞且有晕厥史时，择期手术前应评估是否存在间歇性高度房室阻滞。',
        anesthesia:'告知麻醉团队；合并右束支阻滞者备好经皮起搏，留意迷走反射及减慢传导的药物。',
        postoperative:'术后监护中出现新发房室阻滞、心动过缓或晕厥时，复查 12 导联心电图并评估药物、电解质和缺血因素。',
        consultation:'新发左后分支阻滞、合并右束支阻滞伴晕厥，或出现房室阻滞时请心内科会诊。'
      },
      references:[REF.hrsConduction,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'dextrocardia',title:'右位心',category:'structural',risk:'low',
      aliases:['镜像右位心','右旋心','心脏右移','内脏反位','dextrocardia','I导联倒置'],
      related:['right-ventricular-hypertrophy','left-posterior-fascicular-block'],
      textbook:book('第 7 章 与疾病相关的心电图改变（右位心）','113–115'),
      basic:{
        summary:'I 导联 P、QRS、T 全部倒置，II 与 III、aVR 与 aVL 互换，胸导联 R 波自 V1 向 V6 逐渐变小；需与左右上肢电极接反鉴别。',
        criteria:[['I 导联','P 波、QRS、T 波全部倒置'],['其他肢体导联','II 与 III 互换，aVR 与 aVL 互换，aVF 不变'],['胸导联','V1–V6 多呈 rS，R 波自右向左逐渐减小'],['右胸导联','V3R–V6R 呈正常人左胸导联的图形']],
        diagram:{kind:'dextrocardia',caption:'镜像右位心教学示意：I 导联全部倒置；V6 导联 R 波很小、以 S 波为主。'},
        diagnosticPoints:[
          '镜像右位心：心脏位置和房室关系与正常呈镜像，窦房结位于左上，P 向量指向右下，因此 I 导联 P 波倒置、aVF 导联 P 波直立。',
          '右旋心（孤立性右位心，不伴内脏反位）心电图与镜像右位心相似，但更常合并房间隔缺损、室间隔缺损等畸形；心脏右移（假性右位心）由肺、胸廓病变牵拉或推移所致，除电轴改变外无特征性变化。',
          '疑诊时应加做左右上肢电极反接的肢体导联及 V1、V2、V3R–V6R：反接后得到的 12 导联可按常规标准判读，避免漏诊合并的心室肥厚、束支阻滞、心肌梗死等。'
        ],
        differentialPoints:[
          '左右上肢电极接反：肢体导联改变相同，但胸导联 R 波递增正常——这是最可靠的鉴别点；先排除技术错误再诊断右位心。',
          '电轴右偏的其他原因（右心室肥厚、左后分支阻滞）不会出现 I 导联 P 波倒置。'
        ]
      },
      periop:{
        timing:'右位心本身不影响手术时机；首次发现者应明确是否合并先天性心脏病或内脏反位，必要时术前行超声心动图。',
        anesthesia:'告知麻醉团队：心电图需按反接导联判读；除颤、电复律电极片和听诊部位相应改到右侧；内脏反位者注意解剖变异（如中心静脉置管、腹部器官位置）。',
        postoperative:'术后心电图复查同样需加做反接导联，并与术前同法记录的心电图比较，避免把右位心图形误判为新发异常。',
        consultation:'合并先天性心脏病、心功能不全或心律失常时请心内科会诊。'
      },
      references:[REF.leadReversal,REF.hrsChamber],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'low-voltage-effusion',title:'QRS 低电压与心包积液（电交替）',category:'structural',risk:'medium',
      aliases:['低电压','QRS低电压','心包积液','心包填塞','心脏压塞','电交替','electrical alternans','low voltage'],
      related:['acute-pericarditis','sinus-tachycardia','pulmonary-embolism'],
      textbook:book('第 7 章 与疾病相关的心电图改变（心包炎）','110–113'),
      basic:{
        summary:'每个肢体导联 QRS <0.5 mV（胸导联 <1.0 mV）为低电压；伴窦速和电交替时要警惕大量心包积液或心脏压塞。',
        criteria:[['肢体导联低电压','每个肢体导联 QRS 振幅（R+S）均 <0.5 mV'],['胸导联低电压','每个胸导联 QRS 振幅均 <1.0 mV'],['电交替','QRS（不完全性）或 P、QRS、T 一起（完全性）逐搏高低交替'],['伴随','窦性心动过速；心包炎时可有广泛 ST 抬高和 PR 段压低']],
        diagram:{kind:'low-voltage',caption:'低电压与电交替教学示意：QRS 振幅普遍很小并逐搏高低交替，心率偏快。'},
        diagnosticPoints:[
          '心包积液使心电流“短路”，QRS 振幅降低；P 波多不受影响（右心房后方部分无心包覆盖）。积液吸收或穿刺引流后电压可恢复，若不恢复需考虑纤维素沉积或缩窄。',
          '电交替源于心脏在积液中摆动：完全性电交替特异性高但少见，多见于大量积液伴心脏压塞；不完全性电交替较常见，持续存在且明显时有提示意义。',
          '低电压对心包积液的预测价值有限，电压降低程度与积液量也不成比例；疑诊时以床旁超声为准。'
        ],
        differentialPoints:[
          '心脏以外的原因：肥胖、肺气肿、胸腔积液、气胸、全身水肿等使电流传导受阻。',
          '心肌原因：甲状腺功能减退（黏液性水肿）、心肌淀粉样变、广泛心肌梗死或纤维化、浸润性心肌病。',
          '技术原因：增益设为 5 mm/mV（半电压）会造成“假低电压”，判读前先核对定标。'
        ]
      },
      periop:{
        timing:'新发低电压或电交替应先行超声心动图排除大量心包积液；存在心脏压塞征象（低血压、颈静脉怒张、奇脉、窦速）时，择期手术应推迟，先处理积液。',
        anesthesia:'心包积液患者对麻醉诱导的血管扩张、心动过缓和正压通气耐受差，可能突发循环衰竭；需提前告知麻醉团队，维持前负荷和心率，必要时先行心包穿刺。',
        postoperative:'术后出现低血压、心率加快且新出现 QRS 电压降低时，考虑心包积液或压塞（尤其接受抗凝或心脏相关操作后），尽快床旁超声。',
        consultation:'中大量心包积液或疑似心脏压塞时立即请心内科会诊；低电压原因不明时，结合甲状腺功能等检查请相关专科评估。'
      },
      references:[REF.pericardial,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    }
  ];
  for(const entry of entries)if(!data.entries.some(item=>item.id===entry.id))data.entries.push(entry);

  // Textbook cross-references and criteria from the same chapters for existing entries.
  const find=id=>data.entries.find(item=>item.id===id);
  const extend=(id,{textbook,criteria=[],points=[],differentials=[],related=[]})=>{
    const entry=find(id);if(!entry)return;
    if(textbook)entry.textbook=textbook;
    entry.basic.criteria=[...(entry.basic.criteria||[]),...criteria];
    entry.basic.diagnosticPoints.push(...points);
    entry.basic.differentialPoints.push(...differentials);
    entry.related=[...new Set([...(entry.related||[]),...related])];
    entry.updatedAt=UPDATED;
  };
  extend('left-ventricular-hypertrophy',{
    textbook:book('第 3 章 心房与心室的扩大与肥厚（左心室肥厚）','28–34'),
    criteria:[['国内常用电压标准（教材）','RV5 或 RV6 >2.5 mV；RV5 + SV1 >4.0 mV（男）或 >3.5 mV（女）；RaVL >1.2 mV；RaVF >2.0 mV；RI >1.5 mV；RI + SIII >2.5 mV；RaVL + SV3 >2.8 mV（男）或 >2.0 mV（女）'],['其他支持（教材）','电轴轻中度左偏（一般不超过 −30°）；QRS 轻度增宽（一般 ≤110 ms）；V5/V6 室壁激动时间 ≥50 ms']],
    points:['教材分型：压力负荷型（高血压、主动脉瓣狭窄）以 V5–V6 高 R 伴 ST 压低、T 波倒置为主；容量负荷型（主动脉瓣关闭不全、动脉导管未闭）可见 V4–V6 深而窄的 Q 波、R 波增高、T 波直立高耸。','教材建议慎用“劳损”一词：ST 压低 ≥0.15 mV、T 波倒置深而对称或伴 QT 延长时，提示继发性改变之外还合并原发性改变（如缺血）。QRS >120 ms 提示合并束支阻滞或室内阻滞。'],
    differentials:['左心室肥厚合并前间壁梗死时 V5–V6 R 波可更高；合并前侧壁梗死时高电压可被掩盖，此时电压标准不可靠。']
  });
  extend('right-ventricular-hypertrophy',{
    textbook:book('第 3 章 心房与心室的扩大与肥厚（右心室肥厚）','34–41'),
    criteria:[['教材标准','电轴 >+110°；RaVR ≥0.5 mV（aVR 的 Q/R <1 或 R/S >1）；V1 或 V3R 的 R 波 ≥1.0 mV、呈 Rs、R、qR 或 rsR′；V5–V6 的 R/S <1；V1 室壁激动时间 >30 ms；RV1 + SV5 >1.2 mV']],
    points:['教材按右室负荷分型：压力负荷型（肺动脉狭窄、肺动脉高压）以 V1 高 R、右胸导联 ST 压低和 T 波倒置为主；容量负荷型（房间隔缺损）V1 多呈 rsR′，类似不完全性右束支阻滞。','轻度右室肥厚心电图敏感性低，常仅表现为轻度电轴右偏和顺钟向转位；一旦出现典型图形，诊断准确性高于左心室肥厚。'],
    differentials:['与垂位心鉴别：垂位心电轴多不超过 +110°，aVR 的 Q/R <1、V5–V6 的 R/S >1，且无右心负荷病因。','与左后分支阻滞鉴别：后者无右室肥厚的影像证据，下壁导联呈 qR、无明显顺钟向转位（见“左后分支阻滞”）。','与不完全性右束支阻滞鉴别：右室肥厚电轴明显右偏，V5–V6 S 波加深；不完全性右束支阻滞电轴正常，S 波略宽但不深。'],
    related:['left-posterior-fascicular-block','right-atrial-abnormality']
  });
  extend('left-anterior-fascicular-block',{textbook:book('第 22 章 室内阻滞（左束支分支阻滞）','424–425'),points:['教材提示：左前分支阻滞可掩盖小范围下壁心肌梗死（下壁 Q 波不出现）；反之，下壁梗死也可掩盖合并的左前分支阻滞，需结合前后系列心电图。电极位置过高时右胸导联可出现 r′ 或 q 波，降低一个肋间复查可鉴别。'],related:['left-posterior-fascicular-block']});
  extend('premature-ventricular-contractions',{textbook:book('第 16 章 期前收缩（室性期前收缩）','279–285'),points:['间位性室早插在两个窦性搏动之间、没有代偿间歇，常使其后窦性搏动的 PR 延长（隐匿性传导），甚至出现差异性传导，不要误认为又一个室早。','Lown 分级（0–V 级）源于急性心肌梗死后的监护观察，对一般室早患者并无预后意义，不宜据此判断“危险程度”。'],related:['premature-atrial-contractions','premature-junctional-contractions']});
  extend('acute-pericarditis',{textbook:book('第 7 章 与疾病相关的心电图改变（心包炎）','110–113'),points:['教材提示：PR 段偏移与 ST 抬高同样常见，可在胸痛第 1 天即出现，且持续时间更长；T 波倒置多出现在 ST 段回到基线之后，通常较浅，少有深而对称的倒置。'],related:['low-voltage-effusion']});
  extend('drug-induced-long-qt',{textbook:book('第 8 章 原发性心电疾病心电图（长 QT 综合征）','140–141'),related:['congenital-long-qt']});
  extend('brugada',{textbook:book('第 8 章 原发性心电疾病心电图（Brugada 综合征）','141–149')});

  // Basics: per-lead normal values and QRS naming (chapter 2).
  if(data.basics)Object.assign(data.basics,{
    textbookNormals:{
      source:book('第 2 章 正常心电图','6–20'),
      rows:[
        ['P 波','时限 ≤110 ms；肢体导联 ≤0.25 mV，胸导联直立时 ≤0.15 mV（V1、V2 总高度 ≤0.20 mV）；aVR 一定倒置，aVF 绝大多数直立'],
        ['Ptf-V1','V1 导联 P 波负向部分振幅 × 时间；正常人绝对值较小，负向部分明显时才需测量'],
        ['PR 间期','120–200 ms；心率快时略短；成人 <120 ms 视为异常。教材主张将 PR 延长称为“房室传导延长”而非直接诊断一度阻滞'],
        ['QRS 时限','多为 60–100 ms，>100 ms 需详细描述，≥120 ms 考虑束支阻滞或室内差异性传导'],
        ['q 波','I、aVL、aVF、V5、V6 可有宽 <20 ms 的小 q 波；宽 ≥40 ms 或深 ≥0.4 mV 时应重视；q 波一般不超过同导联 R 波的 1/4'],
        ['肢体导联 R 波','aVL 以 R 波为主时 R ≤1.2 mV；aVF 以 R 波为主时 R ≤2.0 mV（个别男性达 2.3 mV）；aVR 的 R ≤0.5 mV'],
        ['胸导联 R 波','V1 的 R ≤1.0 mV，V5 的 R ≤2.5 mV；R/S 自 V1 向 V5 逐渐增大，V1 的 R/S ≤1，V5 的 R/S ≥1'],
        ['组合电压','RV1 + SV5 ≤1.2 mV（超过提示右室肥厚可能）；RV5 + SV1 男性 ≤4.0 mV、女性 ≤3.5 mV（超过提示左室肥厚可能）'],
        ['低电压','三个标准导联或三个加压肢体导联的 R+S 均 <0.5 mV；正常人约 1% 也可出现，单独不足以判为异常'],
        ['ST 段','肢体导联抬高 ≤0.1 mV；V1–V3 可抬高至 0.3 mV，V4–V5 很少超过 0.1 mV；任何导联压低不应超过 0.05 mV；明显水平型压低即使未达界值也应留意'],
        ['T 波','I、II 直立，aVR 倒置；V1 甚至 V3 可倒置（成人深度一般 ≤0.25 mV），但 V3 倒置时 V1、V2 不应直立；V4–V6 应直立；肢体导联一般 ≤0.5 mV，胸导联 ≤1.0 mV'],
        ['U 波','V2–V3 最清楚，方向与 T 波一致，振幅一般不超过 T 波的一半；心率慢时更明显，低钾时增大，倒置 U 波需重视'],
        ['QT 间期','随心率变化；教材推荐按附录中不同心率的 QT 正常范围表判断（心率 60–80 次/分时最准确），而非单一公式'],
        ['窦性心率','60–100 次/分；最短与最长 RR 相差 ≥120 ms 为窦性心律不齐，属正常变异；也有研究主张正常范围为 50–90 次/分']
      ],
      note:'教材数值来自 2009 年版本，部分与现行国际建议不同（如 P 波时限、QTc 界值）。上方“正常心电图”卡片为现行常用参考，二者冲突时以现行指南和本院标准为准。'
    },
    qrsNaming:[
      'QRS 波群中第一个向上的波称 R 波（矮小者写作 r）；R 波之前向下的波称 Q 波（宽 <40 ms、深 <0.15 mV 的小波写作 q）；R 波之后向下的波称 S 波（小者写作 s）。',
      'S 波之后再出现向上的波称 R′（或 r′），其后再向下的波称 S′（或 s′），例如 rSR′、RSr′s′。',
      '只有一个向上的波时写作 R 型；只有一个宽大向下的波时习惯写作 QS 型（而不是“大 Q 波”）。',
      'R 波升支或 S 波降支出现局部迟缓称为“粗钝”，进一步形成转折称为“错折（切迹）”；单独出现多无诊断意义，常见于束支阻滞、心室肥厚。',
      '测量振幅时，向上的波从基线上缘量到波顶，向下的波从基线下缘量到波底；时间从波起始离开基线量到回到基线。'
    ]
  });

  // Electrophysiological phenomena (chapter 12), summarised for the phenomena page.
  data.phenomena={
    source:book('第 12 章 常见的心电现象','214–234'),
    items:[
      {id:'supernormal',title:'超常传导',definition:'原有传导障碍的心肌出现意料之外、暂时性的传导改善；本质是在异常基础上的改善，而不是传导超过正常。',ecg:['高度或三度房室阻滞中，某段时间突然出现 1:1 下传，随后又恢复阻滞。','矛盾的 RP–PR 关系：长 RP 后 PR 反而延长，短 RP 后 PR 反而缩短。','束支阻滞患者中，提前出现的激动反而传导正常、QRS 变窄。'],significance:'低钾血症等病理状态可使超常期延长。只有无法用已知机制解释的改善才称“真正的超常传导”，其余（裂隙现象、韦金斯基现象等）归为伪超常传导。'},
      {id:'gap',title:'裂隙现象',definition:'传导系统不同部位的不应期和传导速度不同，使某一联律间期范围内的激动不能下传，而更早或更晚的激动反而能下传，这一范围称为裂隙带。',ecg:['联律间期较长的房早正常下传；联律间期稍短的房早不能下传；联律间期更短的房早却又能下传，且伴 PR 延长。'],significance:'更早的激动在近端落入相对不应期、传导减慢，到达远端时远端已脱离有效不应期，故能下传——属于伪超常传导。了解它有助于解释“越早越能下传”的矛盾现象。'},
      {id:'wedensky',title:'韦金斯基现象',definition:'阻滞区远端的一次强刺激（如逸搏、早搏、起搏）降低了阻滞区的阈电位，使其后的室上性激动得以通过阻滞区下传。',ecg:['高度房室阻滞中连续数个 P 波未下传；出现一次室性或交界性逸搏、早搏后，紧随的 P 波得以下传（易化作用）。','此后连续多个 P 波都能下传（韦金斯基效应）。'],significance:'是严重阻滞时防止长时间心室停搏的一种代偿机制。与阵发性阻滞不同：传导改善之前通常有阻滞区远端的逸搏或早搏。'},
      {id:'concealed',title:'隐匿性传导',definition:'激动在传导系统中走了一段路但未能传到心房或心室，体表心电图看不到，却因它产生的不应期影响了下一次激动的形成或传导。',ecg:['间位性室早后窦性搏动 PR 延长（室早逆传入交界区所致）。','房颤时心室律绝对不齐；房扑由 2:1 变为 4:1 下传。','未下传房早之后的窦性 P 波不能下传或 PR 延长。','房早逆传入窦房结使其节律重整，形成不完全性代偿间歇。'],significance:'最常见于房室交界区，可为生理性（房颤时限制过多激动下传）或病理性。洋地黄中毒时尤其常见，是复杂心律失常的常见原因之一。'},
      {id:'linking',title:'蝉联现象',definition:'激动下传途径中存在两条并行通路，一条因不应期发生功能性阻滞，激动沿另一条下传并持续逆向隐匿侵入阻滞侧，使其连续处于功能性阻滞状态。',ecg:['室上性心动过速、房扑、房颤时，连续 3 个以上快速宽 QRS，多呈右束支阻滞形（右束支不应期较长），也可呈左束支阻滞形或左右交替。','预激综合征中可表现为旁路蝉联（QRS 正常）或正路蝉联（完全预激的宽 QRS）。','房室结双径路时，PR 突然跳跃式延长并持续。'],significance:'与室早、室速鉴别：蝉联时 QRS 起始向量与正常下传相同，V1 多为三相波（rsR′）；室性者 V1 多为单相或双相，并可见代偿间歇和融合波。心率减慢、增快或一次正常 QRS 出现后蝉联即终止。'},
      {id:'exit-block',title:'传出阻滞',definition:'起搏点发出的激动在向周围心肌传出时发生延缓或中断。可发生于窦房结、异位起搏点、折返环或起搏器电极与心肌交界处。',ecg:['二度 I 型窦房阻滞：PP 逐渐缩短，直到一次 P 波脱落，长 PP 小于两倍短 PP。','二度 II 型窦房阻滞：长 PP 是基本 PP 的整数倍。','并行心律：异位激动周围有保护性传入阻滞，同时存在不同程度的传出阻滞。','起搏器：起搏脉冲后无相应除极波，即起搏阈值升高（失夺获）。'],significance:'一度窦房阻滞体表心电图无法识别；三度窦房阻滞与窦性停搏很难区分。传出阻滞的概念有助于理解窦房阻滞、并行心律和起搏失夺获。'},
      {id:'dissociation',title:'干扰与脱节',definition:'起搏点激动后处于生理性不应期，不能被另一起搏点的激动兴奋，称为干扰；两个频率相近的独立起搏点连续 3 次以上发生完全性干扰，称为干扰性脱节。',ecg:['干扰性房室脱节：P 波与 QRS 各自规律出现、P 在 QRS 前后游走，两者无固定关系；心室率通常略快于或接近心房率。','不完全性脱节时可见心室夺获（提前出现的室上性 QRS，其前有相关 P 波）或心房夺获。','阻滞性房室脱节：心房率明显快于心室率，原因是房室传导系统的病理性阻滞（见三度房室阻滞）。'],significance:'鉴别关键是心房率与心室率的关系：干扰性脱节两者接近、可有夺获，属生理现象，常见于窦缓伴加速性交界性或室性心律；阻滞性脱节心房率远快于心室率，属病理性传导障碍。'},
      {id:'accrochage',title:'钩拢现象',definition:'两个起搏点并存时，副节律点（如室早、室性心律）的出现使主节律点（通常为窦房结）的频率暂时加快，甚至两者趋于同步。',ecg:['同时存在主导节律和频率更快的副节律。','副节律出现时窦性心率随之暂时加快，副节律终止后窦性心率逐渐回落。'],significance:'机制主要是异位搏动使动脉压短暂下降，经压力反射使窦性心率加快。需与等频现象（两种节律频率相等）鉴别。钩拢现象存在说明自主神经调节功能正常。'},
      {id:'cardiac-memory',title:'电张调整性 T 波与心脏记忆',definition:'心室除极顺序改变一段时间（如心室起搏、室速、预激）后，恢复正常除极时 T 波方向仍与改变期间的 QRS 主波方向一致，称为心脏记忆。',ecg:['右心室起搏后恢复自身心律：II、III、aVF 及 V1–V4 出现 T 波倒置，深度常为 III ≥ aVF ≥ II，胸导联呈“中间深、两头浅”（V3–V4 最深）。','室速终止后：倒置 T 波多见于 V4–V6，可累及 V3。','后间隔旁路消融后：T 波倒置主要见于 II、III、aVF。'],significance:'T 波改变不伴 ST 段移位，可自行恢复。结合近期起搏、心动过速或消融史，并核对倒置 T 波的导联是否与原宽 QRS 主波向下的导联吻合，可避免误判为心肌缺血和不必要的冠脉造影。'},
      {id:'reset',title:'节律重整',definition:'两个起搏点并存时，干扰起搏点的激动提前侵入主导起搏点，使其提前除极，主导起搏点随后以原有周期重新安排节律。',ecg:['常见于窦性心律、起搏心律和各种心动过速。','房早后的不完全性代偿间歇：早搏到下一个窦性 P 波的间距约等于一个基本窦性周期。','反之，出现完全性代偿间歇说明基本节律有传入保护，未发生节律重整。'],significance:'是心电图最常见的现象之一，可用来解释早搏后的代偿间歇长短、起搏器计时和许多疑难心电图。'},
      {id:'entrainment',title:'拖带现象',definition:'以略快于心动过速的频率超速起搏，心动过速的频率被提升到起搏频率；停止起搏后心动过速恢复原频率。可理解为连续发生的节律重整。',ecg:['起搏期间心动过速频率等于起搏频率，停止起搏后恢复原来的周期。','伴融合波者称显性拖带，不伴融合波者称隐匿性拖带。'],significance:'能被拖带的心动过速是折返性心动过速。起搏后间期（PPI）与心动过速周期接近时，提示起搏点位于折返环内，常是射频消融的有效靶点；主要用于电生理检查。'}
    ]
  };
})();

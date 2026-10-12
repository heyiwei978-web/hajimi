/* 第十批：参照陈新主编《黄宛临床心电图学》第 6 版（人民卫生出版社，2009）第 7 章（心肌炎、心肌病、先天性心脏病、瓣膜病）
   及附录（PR 上限表、动态心电图）整理的学习要点。内容为自行归纳改写，不含原书原文或图片；诊断和治疗以现行指南为准。草稿，待临床医师审核。 */
(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA;
  if(!data||!Array.isArray(data.entries))return;
  const UPDATED='2026-10-12';
  const REF={
    cmp:{title:'2023 ESC Guidelines for the management of cardiomyopathies（指南摘要）',url:'https://www.guidelinecentral.com/guideline/3181885'},
    arvc:{title:'Diagnosis of ARVC/D: Proposed Modification of the Task Force Criteria · Circulation 2010',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2860804'},
    vhd:{title:'2020 ACC/AHA Guideline for the Management of Patients With Valvular Heart Disease',url:'https://professional.heart.org/en/science-news/2020-acc-aha-guideline-for-the-management-of-patients-with-valvular-heart-disease/top-things-to-know'},
    achd:{title:'2018 AHA/ACC Guideline for the Management of Adults With Congenital Heart Disease',url:'https://professional.heart.org/en/guidelines-statements/2018-ahaacc-guideline-for-the-management-of-adults-with-congenital-heartcir0000000000000603'},
    periop:{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}
  };
  const CH7='第 7 章 与疾病相关的心电图改变';
  const book=pages=>({chapter:CH7,pages});

  const structural=data.categories.find(item=>item.id==='structural');
  if(structural){structural.title='心肌、心包、瓣膜与先心病';structural.description='心肌炎、心肌病、心包疾病、瓣膜病、先天性心脏病与右位心。';}

  const entries=[
    {
      id:'hypertrophic-cardiomyopathy',title:'肥厚型心肌病（含心尖肥厚型）',category:'structural',risk:'high',
      aliases:['肥厚型心肌病','HCM','梗阻性肥厚型心肌病','HOCM','心尖肥厚型心肌病','AHCM','巨大倒置T波','深窄Q波','Yamaguchi'],
      related:['left-ventricular-hypertrophy','pseudo-infarct-q','t-wave-inversion','cns-t-waves'],
      textbook:book('103–106'),
      basic:{
        summary:'多数患者心电图异常且常早于超声发现：左室高电压、深而窄的病理性 Q 波（同导联 T 波直立）、ST-T 改变；心尖肥厚型以胸导联对称性巨大倒置 T 波为特征。年轻人出现这些改变应想到本病。',
        criteria:[['病理性 Q 波','深（≥同导联 R 波的 1/4）而窄（时限 <30 ms），见于 I、aVL、V4–V6 或下壁导联；同导联 T 波多直立（Q 与 T 方向分离）'],['左室肥厚','约 1/3–2/3 有电压增高；V5–V6 高 R、V1–V2 深 S，伴 ST 压低和 T 倒置'],['心尖肥厚型','胸前及左胸导联对称性巨大倒置 T 波（可 >1.0 mV，个别达 4 mV），常以 V4 最深（TV4 > TV5 > TV3），伴左室高电压、RV4 > RV5；通常无异常 Q 波'],['其他','左房增大、电轴左偏（10%–30%）、左前分支阻滞（约 1/3）、QTc 延长；少数有 delta 样波'],['心电图正常','约 8%–18%']],
        diagram:{kind:'hcm',caption:'肥厚型心肌病教学示意：上行 V5 导联深而窄的 Q 波、高 R 波、T 波直立；下行为心尖肥厚型，V4 导联高 R 波伴对称性巨大倒置 T 波。'},
        diagnosticPoints:[
          '病理性 Q 波与室间隔肥厚致初始除极向量增大有关；随病程进展（游离壁增厚或纤维化）Q 波可变浅甚至消失。',
          '心尖肥厚型的巨大倒置 T 波长期稳定存在，运动时可变浅或“伪正常化”，ST 压低程度与 T 波倒置深度相关；心电图改变常早于超声，必要时行心脏磁共振。',
          '心律失常常见：室上速见于 1/4–1/2 的患者；房颤 7%–16%，多在晚期出现并使病情恶化；复杂室早 33%–48%，非持续性室速 15%–26%，后者猝死风险约为无此类心律失常者的 8 倍。猝死是主要死因，室颤为直接机制。'
        ],
        differentialPoints:[
          '陈旧性心梗：Q 波宽（≥30–40 ms）、伴 T 倒置、按冠脉供血区分布，多为中老年有冠心病危险因素者。',
          'Wellens 图形、颅内病变和应激性心肌病的深倒置 T 波是动态变化的，而心尖肥厚型的 T 波长期稳定。',
          '高血压或运动员的左室肥厚：病史和超声可鉴别，运动员心电图通常无病理性 Q 波和巨大倒置 T 波。'
        ]
      },
      periop:{
        timing:'疑诊而未评估者，择期手术前完成超声心动图；梗阻性、有晕厥或心衰症状者需心内科评估，必要时推迟择期手术。',
        anesthesia:'流出道梗阻者对低血容量、血管扩张、心动过速和正性肌力药耐受差：维持前负荷和后负荷，避免心动过速，低血压优先用 α 受体激动剂而非 β 受体激动剂；椎管内麻醉需谨慎控制交感阻滞。备好除颤器，房颤会显著加重血流动力学恶化。',
        postoperative:'维持容量，充分镇痛，避免心动过速；术后新发房颤应及时控制心室率或复律。',
        consultation:'所有确诊或疑诊者建议心内科共同管理；植入 ICD 者按器械流程处理。'
      },
      references:[REF.cmp,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'arvc',title:'致心律失常性右室心肌病（ARVC）',category:'structural',risk:'high',
      aliases:['ARVC','ARVD','致心律失常性右室心肌病','Epsilon波','ε波','右室心肌病','左束支阻滞形室速','右胸导联T波倒置'],
      related:['idiopathic-vt','brugada','t-wave-inversion','right-bundle-branch-block'],
      textbook:book('105–107'),
      basic:{
        summary:'右室心肌被纤维脂肪组织取代：V1–V3 T 波倒置、Epsilon 波、右胸导联局限性 QRS 增宽，以及左束支阻滞形室性心律失常；早期约 40% 心电图正常。',
        criteria:[['Epsilon 波','QRS 末尾或 ST 段起始处的低振幅小棘波，V1–V2 最明显；常规记录检出约 30%，提高增益（20 mm/mV）、纸速（50 mm/s）或用 Fontaine 双极胸导联可提高 2–3 倍'],['T 波倒置','约 85% 有 V1–V3 T 波倒置；超过 V3 提示左室也受累'],['局限性 QRS 增宽','V1–V3 QRS ≥110 ms；(V1+V2+V3)/(V4+V5+V6) QRS 时限比 ≥1.2；右胸导联 S 波升支 ≥55 ms'],['室性心律失常','室早、室速多呈左束支阻滞形：电轴向下提示右室流出道起源，电轴向上提示右室下壁起源'],['现行诊断','采用 2010 修订的工作组标准（结构、组织学、复极、除极、心律失常、家族史的主次标准组合）']],
        diagram:{kind:'arvc',caption:'ARVC 教学示意：V1 导联 QRS 终末部的 Epsilon 小棘波，其后 T 波倒置。'},
        diagnosticPoints:[
          'Epsilon 波是右室部分心肌延迟除极的表现，特异性较强，是重要的诊断线索；看不到不能排除。',
          '约 14%–18% 合并右束支阻滞样图形，多为右室壁内传导延迟；在右束支阻滞基础上 V1–V3 QRS 比 V6 宽 ≥25–50 ms 有诊断价值。',
          '约 25% 有 V1–V3 自发性 ST 抬高；QT 延长和 QT 离散度增加也不少见。',
          '中青年出现运动相关的左束支阻滞形室速，尤其电轴向上（非流出道起源）时，需排除 ARVC，而不是直接诊断为特发性室速。'
        ],
        differentialPoints:[
          '右室流出道特发性室速：心脏结构和窦律心电图正常，无 Epsilon 波和右胸 T 倒置。',
          'Brugada 图形：V1–V2 穹窿形 ST 抬高接倒置 T 波，无右室结构异常；两者偶可重叠。',
          '青少年右胸导联 T 波倒置（幼年型 T 波）可为正常变异，通常不超过 V2–V3 且无其他异常。'
        ]
      },
      periop:{
        timing:'确诊或疑诊者择期手术前请心内科评估心律失常负担和右心功能，确认 ICD 情况。',
        anesthesia:'避免交感过度兴奋和外源性儿茶酚胺，维持电解质正常，备好除颤器；ICD 按器械流程处理。',
        postoperative:'持续监护，充分镇痛；关注室性心律失常和右心衰。',
        consultation:'所有确诊或疑诊者建议心内科共同管理。'
      },
      references:[REF.arvc,REF.cmp],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'dilated-cardiomyopathy',title:'扩张型心肌病',category:'structural',risk:'medium',
      aliases:['扩张型心肌病','DCM','扩心病','心衰心电图','R波递增不良','QRS-T夹角增宽'],
      related:['left-bundle-branch-block','crt-pacing','left-atrial-abnormality','atrial-fibrillation'],
      textbook:book('107–110'),
      basic:{
        summary:'心电图几乎总是异常但不特异：左房增大、左室高电压或肢导低电压、R 波递增不良、左束支阻滞或室内阻滞、病理性 Q 波，以及频发室早和房颤。',
        criteria:[['传导异常','左束支阻滞 10%–15%（部分报道达 40%）；左前分支阻滞约 42%；右束支阻滞 <4%；一度房室阻滞 6%–30%；常见不典型的室内阻滞'],['QRS','约 1/3 以上有左室肥厚电压；也常见肢导低电压和胸导联 R 波递增不良'],['病理性 Q 波','多见于右、中胸导联，常 ≥40 ms 伴 T 倒置，可酷似陈旧性心梗'],['ST-T','多为继发性改变；不出现心尖肥厚型那样的对称性巨大倒置 T 波；QRS-T 夹角增宽（>45°）常见'],['心律失常','Holter 中频发室早约 83%、非持续性室速约 60%；房颤常见']],
        diagram:{kind:'lbbb',caption:'扩张型心肌病常见左束支阻滞：V1 宽而深的 QS 波，V6 宽大切迹 R 波伴 ST-T 与主波方向相反。'},
        diagnosticPoints:[
          '心电图异常程度与心功能受损程度不完全平行，但新出现左束支阻滞或 QRS 进行性增宽提示病情进展，也是考虑 CRT 的依据之一。',
          '左束支阻滞可掩盖左室肥厚和梗死图形；室间隔纤维化使左胸导联 q 波消失。',
          '室速和室颤是猝死的重要原因。'
        ],
        differentialPoints:[
          '缺血性心肌病：有心梗病史，Q 波按冠脉供血区分布，需冠脉评估。',
          '心肌炎转为慢性者心电图可与扩张型心肌病相似。'
        ]
      },
      periop:{
        timing:'射血分数明显降低、心衰未控制者应先优化心衰治疗，择期手术需心内科评估。',
        anesthesia:'避免心肌抑制和后负荷骤增，谨慎补液；植入 CRT/ICD 者按器械流程处理；备好除颤器。',
        postoperative:'严密监测容量、电解质（钾、镁）和心律；新发房颤、室性心律失常和心衰加重需及时处理。',
        consultation:'所有中重度心功能不全者建议心内科共同管理。'
      },
      references:[REF.cmp,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'myocarditis',title:'急性心肌炎',category:'structural',risk:'high',
      aliases:['心肌炎','病毒性心肌炎','暴发性心肌炎','myocarditis','心肌炎心电图'],
      related:['acute-pericarditis','stemi','complete-heart-block','low-voltage-effusion'],
      textbook:book('100–102'),
      basic:{
        summary:'心电图常是首选检查但改变多样且不特异：ST-T 改变（约半数）、窦速、室早、房室阻滞、QRS 增宽或低电压，重症可出现异常 Q 波，酷似心梗。',
        criteria:[['ST-T','约 50%，压低或抬高均可；抬高时可似心包炎或心梗，T 波低平或倒置'],['QRS','低电压（需排除心外原因）、增宽、切迹；重症可出现异常 Q 波（提示病情严重）'],['传导','房室阻滞较多见（一度最常见）；莫氏 II 型、三度阻滞和左束支阻滞提示病变广泛，是猝死原因之一；多为暂时性，偶可永久'],['QTc','可明显延长（文献报道 0.60–0.70 s），QT 离散度增加'],['心律失常','窦速和室早最常见，也可有交界性心动过速、房扑房颤、室速室颤']],
        diagram:{kind:'pericarditis',caption:'心肌炎可伴广泛 ST 抬高，与心包炎图形相似（示意）；需结合肌钙蛋白、超声和临床判断。'},
        diagnosticPoints:[
          '与急性心梗 Q 波的区别：心肌炎多见于儿童和青壮年，有近期病毒感染史，以胸闷、心悸为主；Q 波和 ST 改变常在数天（3–7 天）内消失；ST 抬高通常没有对应导联压低；ST 恢复的同时 T 波逐渐恢复。',
          '心电图改变不能单独用于诊断或排除心肌炎，需结合肌钙蛋白、超声、心脏磁共振，必要时冠脉造影排除心梗。',
          '治疗后多数异常可恢复，左胸导联倒置 T 波可持续数周至数月；转为慢性者心电图类似扩张型心肌病。'
        ],
        differentialPoints:[
          '急性心包炎：广泛凹面向上 ST 抬高伴 PR 段压低，一般无 Q 波和传导阻滞；两者常合并存在（心肌心包炎）。',
          '急性心梗：按冠脉供血区分布、有对应性压低和典型演变；年轻患者也不能仅凭年龄排除。'
        ]
      },
      periop:{
        timing:'急性心肌炎期间择期手术应推迟，通常待病情稳定、心功能和心律恢复后再评估。',
        anesthesia:'急诊手术时按心功能不全和高心律失常风险准备：监测血流动力学，备好临时起搏和除颤。',
        postoperative:'持续心电监护，复查肌钙蛋白、心电图和超声；警惕高度房室阻滞和室性心律失常。',
        consultation:'疑诊即请心内科会诊；暴发性病程需尽早转入监护病房。'
      },
      references:[REF.cmp,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'atrial-septal-defect',title:'房间隔缺损',category:'structural',risk:'low',
      aliases:['房间隔缺损','ASD','继发孔','原发孔','钩型R波','crochetage','不完全性右束支阻滞','rSR′'],
      related:['right-bundle-branch-block','right-ventricular-hypertrophy','left-anterior-fascicular-block','atrial-fibrillation'],
      textbook:book('116–118'),
      basic:{
        summary:'继发孔型：电轴右偏 + V1 rSr′（不完全性右束支阻滞样）+ 下壁导联“钩型”R 波；原发孔型：同样的 V1 图形但电轴左偏，并常有 PR 延长。',
        criteria:[['继发孔型','电轴 +90° 至 +120°；V1 呈 rSr′ 或 rsR′（右室舒张期负荷），QRS 一般 <120 ms；P 波可高尖；顺钟向转位'],['“钩型”R 波（crochetage）','II、III、aVF 的 R 波顶部附近有切迹，约 73% 的继发孔型患者可见；与不完全性右束支阻滞同时出现或三个下壁导联都有时，诊断敏感性和特异性较高；修补后约 1/3 消失'],['原发孔型','电轴左偏（−30° 以上，近乎全部），图形类似左前分支阻滞，是与继发孔型最重要的区别；V1 同样 rSR′；PR 延长约 70%'],['心律失常','中年（约 40 岁）以后房扑、房颤、室上速增多；修补术后仍可新发或持续']],
        diagram:{kind:'asd',caption:'继发孔型房间隔缺损教学示意：上行 V1 导联 rSr′（不完全性右束支阻滞样）；下行 II 导联 R 波顶部附近切迹（“钩型”）。'},
        diagnosticPoints:[
          '小缺损（约 0.5 cm² 以下）、分流少者心电图可正常。',
          'V1 的 rSr′ 主要反映右室扩大、右束支被牵拉，而不一定是真正的传导延迟；出现 qR 或 Rs、R 波明显增高时提示已发展为肺动脉高压。',
          '中青年出现不完全性右束支阻滞伴电轴右偏，或伴“钩型”R 波，值得做超声排查房间隔缺损。'
        ],
        differentialPoints:[
          '单纯不完全性右束支阻滞：电轴正常、无右心负荷证据，可为正常变异。',
          '右室肥厚的其他原因（肺动脉高压、肺动脉瓣狭窄）：V1 多为高 R 或 qR，而非 rSr′。'
        ]
      },
      periop:{
        timing:'未修补的小缺损通常不影响手术；合并肺动脉高压、右心衰或艾森门格生理者风险显著升高，择期手术前需专科评估。',
        anesthesia:'避免静脉气体进入（反常栓塞风险），静脉通路排气；有肺动脉高压者避免低氧和高碳酸血症。骨科手术需注意脂肪/空气栓塞经缺损进入体循环的可能。',
        postoperative:'关注房性心律失常和氧合；早期活动和血栓预防同样重要。',
        consultation:'合并肺动脉高压、发绀或心律失常时请心内科会诊。'
      },
      references:[REF.achd,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'shunt-chd',title:'室间隔缺损、动脉导管未闭与艾森门格综合征',category:'structural',risk:'medium',
      aliases:['室间隔缺损','VSD','动脉导管未闭','PDA','艾森门格综合征','Eisenmenger','Katz-Wachtel','双室肥厚','左向右分流'],
      related:['atrial-septal-defect','left-ventricular-hypertrophy','right-ventricular-hypertrophy','right-bundle-branch-block'],
      textbook:book('118–124'),
      basic:{
        summary:'左向右分流的心电图随分流量和肺血管阻力演变：小分流正常 → 左室容量负荷（V5–V6 深窄 q、高 R、T 直立高）和左房大 → 双室肥厚 → 肺动脉高压/艾森门格时以右室肥厚为主。',
        criteria:[['小缺损','心电图基本正常'],['中度左向右分流','左室舒张期负荷：II、III、aVF、V5–V6 深而窄的 q 波，V5–V6 高 R，ST 轻度抬高，T 波直立高耸；左房增大'],['大分流（Katz-Wachtel 现象）','双室肥厚：V2–V4 出现振幅很大的双向 RS 波'],['肺动脉高压 / 艾森门格','电轴右偏（>+120°）、右室肥厚（V1–V3 Rs 或 qR，V5–V6 rS）、右房增大（约 70%）；左胸导联 q 波减小或消失'],['传导','约 10% 的室间隔缺损有右束支阻滞；膜部缺损修补术易并发房室阻滞或右束支阻滞']],
        diagram:{kind:'lvh',caption:'左向右分流的左室容量负荷可表现为左胸导联高 R 波（示意）；容量负荷型的 T 波多直立，与压力负荷型不同。'},
        diagnosticPoints:[
          '心电图可间接反映分流量和肺血管阻力：电轴右偏逐渐加重提示肺循环阻力升高、预后较差；新生儿期电轴从 +90°–+130° 逐渐降至 +60°–+70° 则提示肺阻力下降。',
          '动脉导管未闭伴中重度肺动脉高压时，右室肥厚可掩盖左室肥厚，表现为 V5–V6 R/S 降低和电轴右偏。',
          '艾森门格患者很少出现严重心律失常，缺氧所致窦速常见；前壁导联 T 波倒置提示右室心肌弥漫性损害。'
        ],
        differentialPoints:[
          '高血压或主动脉瓣狭窄的左室肥厚为压力负荷型，多伴 ST 压低、T 倒置，而非直立高耸的 T 波。',
          '原发性肺动脉高压的右室肥厚图形与艾森门格相似，需超声明确有无分流。'
        ]
      },
      periop:{
        timing:'无肺动脉高压的小分流通常不影响手术；艾森门格综合征属极高风险，择期手术需在有先心病经验的中心多学科评估后进行。',
        anesthesia:'艾森门格患者：避免体循环阻力下降（会加重右向左分流和发绀）、避免低氧、高碳酸血症和酸中毒；严格排除静脉通路中的气泡。',
        postoperative:'关注氧合、容量和出血/血栓平衡（红细胞增多症）；警惕心律失常和右心衰。',
        consultation:'合并肺动脉高压、发绀或既往修补术后传导异常者，术前请心内科或先心病专科会诊。'
      },
      references:[REF.achd,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'mitral-valve-disease',title:'二尖瓣狭窄与二尖瓣脱垂',category:'structural',risk:'medium',
      aliases:['二尖瓣狭窄','MS','二尖瓣型P波','风湿性心脏病','二尖瓣脱垂','MVP','两点半','孤立性T波负向综合征'],
      related:['left-atrial-abnormality','right-ventricular-hypertrophy','atrial-fibrillation','premature-ventricular-contractions'],
      textbook:book('124–128'),
      basic:{
        summary:'二尖瓣狭窄：二尖瓣型 P 波（宽 ≥0.12 s、双峰）、V1 P 波终末负向增大、右室肥厚和电轴右偏，房颤极常见；二尖瓣脱垂：多数正常，约 1/3 有下壁 ST-T 改变，常见房性和室性早搏。',
        criteria:[['二尖瓣型 P 波','I、II、aVL P 波时限 ≥0.12 s，双峰间距 ≥0.04 s；V1 双向 P 波终末负向部分增大——见于约 90% 的显著狭窄者，但不特异'],['右室肥厚','取决于右室收缩压：<70 mmHg 多无，70–100 mmHg 约半数，>100 mmHg 几乎都有'],['电轴','右偏 +80° 至 +120°，右偏程度与肺动脉压相关；电轴 > +60° 时瓣口面积多 <1.3 cm²'],['V1 演变','轻度：V1 振幅减小；中度：R≈S；重度：V1 高尖 R 或 qR、R/S >1，V5–V6 呈 rS'],['二尖瓣脱垂','约 1/3 有 II、III、aVF ST 压低、T 低平或倒置；QRS 电轴约 +80°–+100° 而 T 电轴约 −40°（“两点半”现象）；心律失常 40%–70%']],
        diagram:{kind:'lae',caption:'二尖瓣狭窄的二尖瓣型 P 波：II 导联 P 波增宽双峰，V1 导联 P 波终末负向部分加深（示意）。'},
        diagnosticPoints:[
          '二尖瓣狭窄患者房性心律失常发生率高达 50%–100%，常从房早、房扑逐渐转为持续房颤；V1 粗大的颤动波（≥1 mm）可能提示左房增大。合并风湿活动时约 20% 出现 PR 延长。',
          '二尖瓣脱垂的 ST-T 改变在吸入亚硝酸异戊酯或运动后可加重、服用普萘洛尔后可消失，提示与交感张力有关，但不能据此排除结构性心脏病。',
          '二尖瓣脱垂的猝死罕见，多与严重反流或瓣叶明显畸形、室早 R on T 诱发室颤有关；QT 延长者风险增加。'
        ],
        differentialPoints:[
          '高血压、冠心病患者的 P 波也可有切迹，但时限和振幅未达标准时不应诊断二尖瓣型 P 波。',
          '二尖瓣脱垂的下壁 T 倒置需与下壁缺血鉴别，结合症状、运动试验或影像。'
        ]
      },
      periop:{
        timing:'中重度二尖瓣狭窄（尤其有症状或肺动脉高压）择期手术前应先评估是否需要瓣膜干预；单纯二尖瓣脱垂无明显反流者通常不影响手术。',
        anesthesia:'二尖瓣狭窄：控制心率、避免心动过速（舒张期缩短会使左房压骤升），谨慎补液，避免低氧和高碳酸血症；房颤者控制心室率并评估抗凝衔接。',
        postoperative:'关注新发房颤、肺水肿和抗凝管理。',
        consultation:'中重度狭窄、症状明显或新发房颤时请心内科会诊。'
      },
      references:[REF.vhd,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'aortic-stenosis-ecg',title:'主动脉瓣狭窄',category:'structural',risk:'high',
      aliases:['主动脉瓣狭窄','AS','钙化性主动脉瓣狭窄','左室肥厚劳损','主动脉瓣钙化'],
      related:['left-ventricular-hypertrophy','left-atrial-abnormality','left-anterior-fascicular-block','complete-heart-block'],
      textbook:book('128–129'),
      basic:{
        summary:'约 85% 重度狭窄有左室肥厚、80% 以上有左房增大，但心电图正常不能排除重度狭窄；ST 压低 >0.2 mV 提示严重肥厚劳损，钙化可累及传导系统。',
        criteria:[['左室肥厚','约 85% 的重度单纯主动脉瓣狭窄可见；V1–V2 S 波加深，V5–V6 R 波增高（可 >27 mm），RV6 > RV5，q 波变浅'],['左房增大','80% 以上：V1 P 波终末负向增大'],['劳损','不到 50% 有明显 ST-T 改变；ST 压低 >0.2 mV 提示严重肥厚，进行性改变提示病情进展'],['传导','约 10% 的主动脉瓣钙化患者有左前分支阻滞；钙化延伸至传导系统可致各级房室阻滞、室内阻滞'],['其他','偶见右胸导联 r 波消失的“假性梗死”图形；房颤少见，若出现提示合并二尖瓣病变或心功能下降']],
        diagram:{kind:'lvh',caption:'主动脉瓣狭窄常见左室肥厚伴劳损：V1 深 S 波，V5 高 R 波伴 ST 压低和不对称 T 波倒置（示意）。'},
        diagnosticPoints:[
          '心电图左室肥厚的阴性预测值较低：没有左室肥厚表现不能排除主动脉瓣狭窄，即使严重的老年钙化性狭窄心电图也可正常。',
          '儿童中胸导联 QRS 振幅与狭窄程度有关，成人则不然；判断严重程度依靠超声。',
          '新出现的房室阻滞或束支阻滞（包括经导管主动脉瓣置换术后）要想到钙化或手术累及传导系统。'
        ],
        differentialPoints:[
          '高血压性左室肥厚：病史和听诊、超声鉴别。',
          '肥厚型心肌病：可有深窄 Q 波和巨大倒置 T 波，超声可见非对称性肥厚和动态梗阻。'
        ]
      },
      periop:{
        timing:'术前听到收缩期杂音或心电图左室肥厚伴晕厥、劳力性胸痛、气促者，择期手术前完成超声；有症状的重度狭窄通常应先评估瓣膜干预。',
        anesthesia:'重度狭窄对低血压、血管扩张、心动过速和心律失常耐受差：维持窦律和前负荷，及时用 α 受体激动剂纠正低血压；椎管内麻醉需特别谨慎（尤其单次腰麻）。',
        postoperative:'维持容量和血压，避免心动过速；新发房颤可迅速导致失代偿，需及时处理。',
        consultation:'中重度或有症状的主动脉瓣狭窄，术前请心内科评估。'
      },
      references:[REF.vhd,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    }
  ];
  for(const entry of entries)if(!data.entries.some(item=>item.id===entry.id))data.entries.push(entry);

  const find=id=>data.entries.find(item=>item.id===id);
  const link=(id,others)=>{const entry=find(id);if(entry){entry.related=[...new Set([...(entry.related||[]),...others])].filter(other=>other!==id);}};
  link('left-ventricular-hypertrophy',['hypertrophic-cardiomyopathy','aortic-stenosis-ecg']);
  link('right-bundle-branch-block',['atrial-septal-defect']);
  link('acute-pericarditis',['myocarditis']);
  link('idiopathic-vt',['arvc']);
  link('left-atrial-abnormality',['mitral-valve-disease']);
  link('pseudo-infarct-q',['hypertrophic-cardiomyopathy']);
  const hcmDiff=find('pseudo-infarct-q');if(hcmDiff)hcmDiff.updatedAt=UPDATED;

  // Appendix: PR upper limits by heart rate and age; Holter essentials.
  if(data.basics)Object.assign(data.basics,{
    prLimits:{
      source:{chapter:'附录 1 心率推算表（正常 PR 间期的最高限度表）',pages:'548'},
      head:['年龄 \\ 心率（次/分）','≤70','71–90','91–110','111–130','>130'],
      rows:[
        ['成人','200','190','180','170','160'],
        ['14–17 岁','190','180','170','160','150'],
        ['7–13 岁','180','170','160','150','140'],
        ['1.5–6 岁','170','165','155','145','135'],
        ['0–1.5 岁','160','150','145','135','125']
      ],
      note:'单位 ms。心率越快、年龄越小，PR 上限越短；成人心率 >130 次/分时 PR 超过 160 ms 即应考虑传导延长。'
    },
    holter:[
      'I 类适应证：不明原因的晕厥、近乎晕厥或发作性头晕；无法解释的反复心悸；评估起搏器或 ICD 的功能（如肌电抑制、起搏器介导的心动过速、频率适应和模式转换设置）。',
      '可考虑：不能用其他原因解释的气短、胸痛或乏力；怀疑变异型心绞痛（监测一过性 ST 抬高）；评估房颤心室率控制。',
      '记录器的频率响应、采样率和分辨率会影响波形：低频响应过高使 ST 段失真，采样率过低使 Q、R、S 振幅失真；识别起搏脉冲需要很高的采样率（专门的起搏通道）。',
      '心率变异性（HRV）常用指标：SDNN、SDANN、RMSSD 和三角指数；HRV 降低与心梗后严重心律失常和猝死相关，但不能单独决定治疗。',
      'T 波电交替（逐搏 T 波振幅、形态或极性交替而 QRS 不变）提示复极不稳定，是恶性室性心律失常的预测指标；肉眼可见者多见于急性缺血、长 QT 和电解质紊乱。'
    ]
  });
})();

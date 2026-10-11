/* First-stage educational drafts. Review each entry before using it as clinical guidance. */
window.HAJIMI_ECG_DATA = {
  schema: 1,
  updatedAt: '2026-10-11',
  categories: [
    {id:'arrhythmias',title:'心律失常',description:'节律、P 波和 RR 间期的识别。'},
    {id:'conduction',title:'传导阻滞',description:'房室与室内传导异常。'},
    {id:'ischemia',title:'心肌缺血与梗死',description:'结合症状、动态变化与心肌损伤标志物读图。'},
    {id:'enlargement',title:'房室肥大',description:'房室增大的心电图线索及其局限。'},
    {id:'electrolytes',title:'电解质与药物影响',description:'电解质、药物与复极改变。'},
    {id:'pacing',title:'起搏心电图',description:'起搏脉冲、感知和夺获的识别。'},
    {id:'pulmonary',title:'肺循环与右心负荷',description:'肺栓塞等急性右心负荷的非特异性表现。'}
  ],
  basics: {
    introduction: [
      {id:'electrical',title:'心脏电活动',points:[
        '窦房结起搏后，兴奋经心房、房室结、希氏束和浦肯野系统传至心室。体表心电图记录电位差，并不直接测量心肌收缩能力。',
        'P 波主要反映心房除极，QRS 波群主要反映心室除极，T 波主要反映心室复极；心房复极通常被 QRS 波群遮盖。',
        '心电图必须与症状、生命体征、既往记录及其他检查结合；单一波形不能替代临床诊断。'
      ]},
      {id:'leads',title:'导联体系',points:[
        '标准 12 导联使用 10 个电极：肢体导联 I、II、III、aVR、aVL、aVF 观察额面，胸前导联 V1–V6 观察水平面。导联与电极不是同一个概念。',
        'V1：胸骨右缘第 4 肋间；V2：胸骨左缘第 4 肋间；V4：左侧第 5 肋间锁骨中线；V3：V2 与 V4 之间。',
        'V5、V6 分别位于左腋前线、左腋中线，与 V4 保持同一水平。先核对电极位置、导联标识和伪差，再解释异常。'
      ]},
      {id:'paper',title:'心电图纸与测量',points:[
        '先看走纸速度和增益。25 mm/s、10 mm/mV 时：横向 1 小格 = 40 ms，1 大格 = 200 ms；纵向 1 小格 = 0.1 mV，1 大格 = 0.5 mV。',
        '50 mm/s 时，横向 1 小格 = 20 ms、1 大格 = 100 ms。速度或增益改变后不能照搬常用格数。',
        'RR 从相邻 R 波峰测量；PR 从 P 波起点至 QRS 起点；QT 从 QRS 起点至 T 波终点。房颤、明显 U 波、宽 QRS 或起搏时，测量和解释需格外谨慎。'
      ]}
    ],
    normalValues: [
      {name:'心率与窦性节律',value:'成人静息常用参考 60–100 次/分',note:'每个 QRS 前有形态一致的 P 波，PR 相对稳定；结合 II 导联与 aVR 等导联判断。'},
      {name:'P 波',value:'时限通常 <120 ms；肢体导联振幅通常 <0.25 mV',note:'这是常用成人参考，需结合导联、年龄和临床背景。'},
      {name:'PR 间期',value:'120–200 ms',note:'随心率和年龄变化；只在能够辨认 P 波时测量。'},
      {name:'QRS 波群',value:'时限通常 <120 ms',note:'形态和导联分布同样重要，不能只依据时限判读。'},
      {name:'额面 QRS 电轴',value:'成人常用参考约 −30° 至 +90°',note:'年龄、体型和其他情况可影响范围；必要时进一步计算。'},
      {name:'QT 与 QTc',value:'QT 随心率变化；QTc 常用参考：男性 <450 ms、女性 <460 ms',note:'不同指南、公式和人群阈值有差异；不把边界值直接当作诊断或手术许可。'},
      {name:'ST 段与 T 波',value:'结合等电位线、相邻导联、旧图和动态变化判断',note:'不存在适用于所有导联、年龄和临床场景的单一正常数值。'}
    ],
    variants: [
      '呼吸性窦性心律不齐：RR 可随呼吸变化，仍需辨认一致的窦性 P 波。',
      '训练者或睡眠时可有窦性心动过缓；有晕厥、低灌注或新发传导异常时，不应简单视为生理变异。',
      '部分健康人存在早期复极或特定导联 T 波变异；新发胸痛、动态 ST-T 改变时，应重新评估，不能套用“正常变异”。'
    ],
    steps: [
      {title:'心率',body:'确认走纸速度，节律规则时用 RR 间期估算；节律不规则时观察更长记录并报告平均及变化范围。'},
      {title:'节律',body:'寻找 P 波，比较 P 与 QRS 的关系、PR 是否固定、RR 是否规则；考虑伪差、早搏和起搏。'},
      {title:'电轴',body:'先用 I、aVF 导联粗略判断象限；边界或异常时结合 II 导联等进一步确认。'},
      {title:'间期',body:'测 PR、QRS、QT；QTc 要注明校正公式，宽 QRS、起搏和不规则节律需结合专科意见。'},
      {title:'波形',body:'按导联检查 P 波、QRS、R 波进展、异常 Q 波及电压；核对电极位置并与旧图比较。'},
      {title:'ST-T',body:'观察相邻导联的 ST-T 变化、分布和动态趋势，联系症状及相关检查，最后形成完整描述。'}
    ]
  },
  periop: {
    assessment: [
      '先确认手术紧迫性、既往心血管病、症状、功能状态、用药以及可供比较的旧心电图。并非所有无症状低风险患者都需要常规术前心电图。',
      '新发胸痛、晕厥、低灌注、明显心律失常或疑似急性心血管病时，应先评估并与麻醉、心内科和手术团队讨论手术时机。',
      '心电图异常不等于自动取消手术。结合病因、稳定性、手术风险与紧迫性作共同决策；RCRI 可作风险评估的一部分。'
    ],
    scenarios: [
      {id:'pe',title:'肺栓塞',entry:'pulmonary-embolism',body:'骨科围手术期突发气促、胸痛、低氧或晕厥，应结合 VTE 风险及时评估；心电图正常不能排除肺栓塞。'},
      {id:'high-potassium',title:'高钾血症',entry:'hyperkalemia',body:'结合血钾、肾功能、药物及监护变化判断；危险的高钾血症也可能没有典型心电图表现。'},
      {id:'low-potassium',entry:'hypokalemia',title:'低钾血症',body:'可见 T 波低平、ST 压低及明显 U 波；U 波可能干扰 QT 测量。核对电解质及相关药物。'},
      {id:'long-qt',entry:'drug-induced-long-qt',title:'QT 延长',body:'复核 QT 测量、校正公式、药物和钾镁等电解质；晕厥或可疑室性心律失常时需及时评估。'},
      {id:'postop-af',title:'术后房颤',entry:'atrial-fibrillation',body:'关注血流动力学状态，寻找疼痛、低氧、感染及电解质紊乱等诱因；治疗与抗凝需结合出血风险共同决定。'},
      {id:'myocardial-injury',entry:'nste-ischemia',title:'术后心肌损伤',body:'可能缺乏胸痛或典型心电图改变。结合肌钙蛋白动态、供需失衡及其他病因评估；不能仅凭一张心电图排除。'}
    ],
    onCall: [
      {title:'术后胸痛',points:['先评估生命体征及循环状态，并按本院急症流程处理。','尽快获取 12 导联心电图并与旧图比较，结合必要的动态复查和肌钙蛋白等检查。','同时考虑急性冠脉综合征、肺栓塞等病因；持续症状或不稳定时及时升级处置。']},
      {title:'术后气促',points:['评估低氧、呼吸频率和循环状态；考虑肺栓塞、心衰、肺部病变、贫血等。','心电图用于识别节律与右心负荷等线索，不能单独排除肺栓塞。','结合床旁评估、相关实验室与影像检查决定下一步；不稳定时启动急救与会诊。']},
      {title:'术后心悸',points:['核对症状发生时的心率、血压、意识与持续时间，获取心电图或监护记录。','区分伪差、早搏、房颤及其他快速或缓慢心律，核查电解质和诱因。','伴胸痛、晕厥、低灌注或持续显著异常时，及时联系相关专科。']}
    ]
  },
  entries: [
    {
      id:'atrial-fibrillation',title:'房颤',category:'arrhythmias',risk:'medium',aliases:['心房颤动','AF','atrial fibrillation','术后房颤'],
      related:['atrial-flutter','mat','sinus-node-dysfunction'],
      basic:{
        summary:'识别不规则心室节律和缺乏一致 P 波，并排除伪差及其他不规则节律。',
        criteria:[['P 波','无可辨认、形态一致的 P 波'],['RR 间期','绝对不规则（合并完全性房室阻滞或起搏时例外）'],['记录要求','12 导联或单导联记录 ≥30 秒']],
        diagram:{kind:'af',caption:'II 导联房颤教学示意：RR 间期不规则，未见一致的 P 波，基线可有细小颤动波。'},
        diagnosticPoints:['通常没有可辨认且重复一致的 P 波，RR 间期呈不规则不齐；单导联短片段不能代替完整记录。','房颤合并完全性房室传导阻滞或起搏时，心室节律可能规则，不能机械套用“RR 必须不规则”。','需要可解释的心电图记录及临床确认；监护报警、脉搏不齐或设备提示不能单独作为最终诊断。'],
        differentialPoints:['肌肉震颤或电极接触不良可造成假性颤动基线，应核对多个导联和脉搏。','房扑伴不同比例传导、多源性房性心动过速及频发早搏也可能不规则，要仔细寻找心房活动。']
      },
      periop:{
        timing:'新发或未控制的房颤应先评估症状、心室率和血流动力学状态。择期手术是否延后由病因、稳定性与手术风险共同决定；急诊手术需团队协同。',
        anesthesia:'向麻醉团队说明既往节律、心室率、心功能与抗凝用药；结合低氧、容量状态、电解质和药物等潜在诱因制定监护方案。',
        postoperative:'复查节律和诱因，结合病程与风险决定监护及随访。卒中预防与抗凝时机需同时评估血栓和手术出血风险，不在此草稿给出固定用药方案。',
        consultation:'新发房颤、持续症状、难以控制的心室率或抗凝决策存在困难时考虑心内科会诊；伴低灌注、缺血症状或意识异常时及时启动急症流程。'
      },
      references:[{title:'2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001193'},{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'hyperkalemia',title:'高钾血症',category:'electrolytes',risk:'high',aliases:['高血钾','hyperkalemia','potassium','血钾升高'],
      basic:{
        summary:'高钾可影响传导和复极；心电图用于发现危险线索，不能可靠估计血钾或排除高钾。',
        diagram:{kind:'hyperkalemia',caption:'II 导联高钾相关尖高 T 波教学示意：展示一种可能的复极改变，不表示血钾数值或病情分级。'},
        diagnosticPoints:['可能出现尖高 T 波、P 波低平或消失、PR 延长、QRS 增宽等；这些变化并非必然出现，也不总是按固定顺序发展。','正常或非典型心电图不能排除危险的高钾血症；应结合及时的血钾检测、病史、肾功能和用药判断。','采样溶血等可导致假性高钾，需核查检验背景；怀疑急症时不能因等待复核而忽视临床状态。'],
        differentialPoints:['早期复极、心肌缺血等也可能出现高大 T 波，要结合分布、形态和动态变化。','QRS 增宽还可来自束支传导阻滞、起搏、药物影响或室性节律，不能单凭宽 QRS 判断高钾。']
      },
      periop:{
        timing:'发现高钾或疑似相关心电图改变时，先确认临床状态并查找病因。择期手术时机需与麻醉及相关专科共同讨论；此草稿不设统一“可手术血钾阈值”。',
        anesthesia:'提示麻醉团队关注肾功能、电解质、酸碱状态及可能影响血钾的药物和操作，结合病情确定监护与处理计划。',
        postoperative:'动态复核血钾、心电监护和病因变化，关注治疗后的反跳及肾功能；具体监测与处理按本院流程。',
        consultation:'显著升高、快速变化、出现传导异常或合并症状时及时升级评估；肾功能受损、治疗困难或需要肾脏替代治疗评估时联系相关专科。'
      },
      references:[{title:'StatPearls: Hyperkalemia（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK470284/'},{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part IV：ST 段、T 波、U 波与 QT 间期（2009）',url:'https://www.hrsonline.org/resource/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-iv-st-segment/'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'pulmonary-embolism',title:'肺栓塞',category:'pulmonary',risk:'high',aliases:['PE','pulmonary embolism','肺动脉栓塞','S1Q3T3','右心负荷'],
      basic:{
        summary:'心电图可提供心率及右心负荷线索，既不能单独确诊，也不能排除肺栓塞。',
        diagram:{kind:'pe',caption:'I、III 导联 SⅠQⅢTⅢ 教学示意：I 导联较深 S 波、III 导联 Q 波和 T 波倒置。该组合并不敏感，也不特异。'},
        diagnosticPoints:['窦性心动过速、右心负荷相关 ST-T 改变或右束支传导阻滞等均可能出现，但均非特异性。','SⅠQⅢTⅢ 并非肺栓塞的必要表现或确诊标准；正常心电图同样不能排除肺栓塞。','结合症状、生命体征、VTE 风险和临床概率，再按适用流程选择实验室与影像评估；不要仅凭心电图决定抗凝。'],
        differentialPoints:['其他急慢性右心负荷状态也可能产生类似图形，需要结合临床及旧图判断。','胸痛、气促和心动过速还可见于急性冠脉综合征、心衰、肺部疾病、贫血及其他术后问题。']
      },
      periop:{
        timing:'疑似或确诊急性肺栓塞时，手术时机取决于循环稳定性、病情和手术紧迫性。择期操作与抗凝中断安排需要相关团队共同决定。',
        anesthesia:'应告知麻醉团队肺循环与右心功能风险、氧合情况及正在使用的抗凝药物，制定围手术期监护与应急计划。',
        postoperative:'关注氧合、循环状态、右心功能和出血风险；抗凝及随访按专科方案与本院流程，心电图仅作为综合评估的一部分。',
        consultation:'突发气促、胸痛、低氧、晕厥或疑似急性肺栓塞时及时评估并联系相关专科；循环不稳定时立即启动急救流程。'
      },
      references:[{title:'2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism · Eur Heart J 2020',url:'https://pubmed.ncbi.nlm.nih.gov/31504429/'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'stemi',title:'急性 ST 段抬高型心肌梗死',category:'ischemia',risk:'high',
      aliases:['STEMI','ST段抬高','ST 抬高','心梗','急性心梗','下壁心梗','前壁心梗','MI'],
      related:['anterior-stemi','inferior-stemi','lateral-stemi','posterior-mi','rv-infarction','lbbb-paced-mi','de-winter','st-elevation-differential'],
      basic:{
        summary:'在相邻导联寻找新发 ST 段抬高及对应性压低，结合症状与动态变化，尽快启动再灌注评估。',
        criteria:[['测量位置','J 点（QRS 终点）'],['导联要求','≥2 个相邻导联新发 ST 段抬高'],['V2–V3','男性 ≥40 岁 ≥2 mm；男性 <40 岁 ≥2.5 mm；女性 ≥1.5 mm'],['其余导联','≥1 mm'],['后壁导联 V7–V9','≥0.5 mm（男性 <40 岁 ≥1 mm）'],['右胸导联 V3R–V4R','≥0.5 mm（男性 <30 岁 ≥1 mm）'],['适用前提','无左室肥厚、无左束支阻滞']],
        diagram:{kind:'stemi',caption:'下壁 ST 段抬高教学示意：II 导联 ST 段抬高并与 T 波融合，aVL 导联对应性压低。'},
        diagnosticPoints:[
          '在 J 点测量：至少 2 个相邻导联新发 ST 段抬高。常用标准为 V2–V3 以外导联 ≥1 mm；V2–V3 男性 ≥40 岁 ≥2 mm、<40 岁 ≥2.5 mm，女性 ≥1.5 mm（无左室肥厚和左束支阻滞时）。',
          '按导联定位：II、III、aVF 对应下壁；V1–V4 对应前间壁/前壁；I、aVL、V5–V6 对应侧壁。下壁抬高时加做右胸导联（V4R）评估右室受累。',
          '对应性 ST 段压低支持缺血性抬高；V1–V3 明显 ST 压低伴高 R 波需考虑后壁梗死，可加做 V7–V9。',
          '超急性 T 波（宽大、对称、高耸）可能早于 ST 抬高出现；首份心电图不典型时应在短时间内复查并与旧图对比。'
        ],
        differentialPoints:[
          '早期复极、急性心包炎（广泛凹面 ST 抬高、PR 段压低、常无对应性压低）、左室肥厚、室壁瘤和 Brugada 图形都可造成 ST 抬高。',
          '左束支阻滞和心室起搏时 ST 段本身与主波方向相反，需用专门标准（如 Sgarbossa 标准）并结合临床；高钾血症也可出现类似 ST 抬高。'
        ]
      },
      periop:{
        timing:'疑似 STEMI 时择期手术必须暂停。近期心肌梗死后的择期非心脏手术通常需推迟，具体间隔由心内科根据再灌注方式与心功能评估决定。',
        anesthesia:'若为急诊手术，需告知麻醉团队缺血范围、心功能、抗血小板药物和支架情况；术中重点避免心动过速、低血压、贫血和低氧，维持心肌氧供需平衡。',
        postoperative:'术后心肌梗死常缺乏典型胸痛，可表现为心动过速、低血压或气促。新发 ST 改变时复查 12 导联并结合肌钙蛋白动态变化；抗栓治疗需与手术出血风险共同权衡。',
        consultation:'一旦怀疑 STEMI，立即联系心内科，按本院胸痛中心流程评估急诊再灌注；同时请手术团队评估出血风险，不要等待复查结果后再联系。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'},{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'nste-ischemia',title:'ST 段压低与 T 波倒置（可疑缺血）',category:'ischemia',risk:'high',
      aliases:['NSTEMI','非ST段抬高','ST压低','ST 压低','T波倒置','T 波倒置','心肌缺血','ACS','ST-T改变'],
      related:['wellens','de-winter','posterior-mi','t-wave-inversion'],
      basic:{
        summary:'水平型或下斜型 ST 段压低、新发 T 波倒置提示可能缺血，但特异性有限，需结合症状、肌钙蛋白和动态变化。',
        criteria:[['ST 段压低','新发水平型或下斜型 ≥0.5 mm，≥2 个相邻导联'],['T 波倒置','>1 mm，见于 R 波为主或 R/S >1 的相邻导联'],['高危提示','≥8 个导联 ST 压低 ≥1 mm，伴 aVR 和/或 V1 抬高']],
        diagram:{kind:'nste-ischemia',caption:'V5 导联水平型 ST 段压低伴 T 波倒置教学示意。'},
        diagnosticPoints:[
          '新发水平型或下斜型 ST 段压低 ≥0.5 mm（2 个相邻导联）提示心肌缺血；上斜型压低特异性较低。',
          '新发 T 波倒置 ≥1 mm（R 波为主或 R/S >1 的相邻导联）也可提示缺血；V2–V3 深而对称的 T 波倒置需警惕前降支近段病变（Wellens 图形）。',
          '广泛 ST 段压低（≥8 个导联、≥1 mm）伴 aVR 和/或 V1 导联 ST 抬高，提示左主干或多支病变可能，属于高危表现。',
          '心电图正常不能排除急性冠脉综合征。症状持续时应复查心电图并结合肌钙蛋白动态变化判断。'
        ],
        differentialPoints:[
          '左室肥厚劳损、束支阻滞、起搏、地高辛效应、低钾血症和心动过速后改变都可引起继发性 ST-T 改变，应先找有无这些背景。',
          '与旧图对比十分重要：长期稳定的 ST-T 改变与新发改变的临床意义完全不同；后壁梗死在 V1–V3 也表现为 ST 压低。'
        ]
      },
      periop:{
        timing:'术前发现新发缺血性 ST-T 改变，或伴有胸痛、气促、运动耐量下降时，择期手术应暂缓并完成评估；长期稳定且已解释的改变一般不单独决定手术时机。',
        anesthesia:'告知麻醉团队缺血性改变与既往心脏病史，以便确定监护导联（常选 II 和 V5）和血流动力学目标，避免心动过速和低血压。',
        postoperative:'术后肌钙蛋白升高而无典型症状（术后心肌损伤）并不少见，与不良预后相关。高危患者可按本院方案监测肌钙蛋白，新发改变要寻找贫血、低氧、低血压、疼痛和心动过速等诱因。',
        consultation:'新发缺血性改变伴症状或肌钙蛋白升高、广泛 ST 压低伴 aVR 抬高、血流动力学不稳定时，及时请心内科会诊。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'},{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'},{title:'2022 ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery（ESC 指南页）',url:'https://escardio.org/Guidelines/Clinical-Practice-Guidelines/ESC-Guidelines-on-non-cardiac-surgery-cardiovascular-assessment-and-managem'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'ventricular-tachycardia',title:'室性心动过速',category:'arrhythmias',risk:'high',
      aliases:['室速','VT','宽QRS心动过速','宽 QRS 心动过速','宽波心动过速'],
      related:['wide-complex-tachycardia','torsades-de-pointes','aivr'],
      basic:{
        summary:'宽 QRS 规则心动过速首先按室速处理，判读要先看患者是否稳定、有无脉搏。',
        criteria:[['定义','≥3 个连续室性搏动，频率 >100 次/分'],['持续性','持续 >30 秒，或因血流动力学障碍需提前终止'],['QRS','通常 ≥120 ms'],['支持室速','房室分离、夺获/融合波、胸前导联 QRS 同向']],
        diagram:{kind:'vt',caption:'单形性室性心动过速教学示意：宽 QRS、规则、形态一致，未见与 QRS 固定相关的 P 波。'},
        diagnosticPoints:[
          '连续 ≥3 个室性搏动、频率 >100 次/分；持续 >30 秒或伴血流动力学障碍为持续性室速。QRS 通常 ≥120 ms，常明显更宽。',
          '支持室速的线索：房室分离（独立出现的 P 波）、心室夺获或融合波、胸前导联 QRS 同向（全正或全负）、电轴极度偏移。',
          '单形性室速 QRS 形态一致；多形性室速形态逐搏变化，需关注 QT 间期（见尖端扭转型室速）和急性缺血。',
          '既往心肌梗死、心衰或结构性心脏病患者出现宽 QRS 心动过速时，室速的可能性很高。'
        ],
        differentialPoints:[
          '室上速伴差异性传导或原有束支阻滞、预激综合征伴旁路前传、起搏器介导的心动过速、高钾血症都可表现为宽 QRS 心动过速；鉴别困难时按室速处理更安全。',
          '肢体运动或电极接触不良可造成假性宽 QRS 心动过速；其中常能在伪差中看到正常节律的 QRS，并应立即核对患者脉搏和意识。'
        ]
      },
      periop:{
        timing:'持续性室速出现时，择期手术必须停止。既往室速或植入 ICD 的患者，术前需评估病因、心功能和器械情况后再定手术时机。',
        anesthesia:'告知麻醉团队室速病史、心功能和 ICD 情况；术前纠正低钾、低镁，准备除颤设备，器械患者按本院流程处理快速心律失常治疗功能。',
        postoperative:'寻找诱因：心肌缺血、低钾/低镁、低氧、酸中毒、中心静脉导管或导丝位置过深、致心律失常药物。持续心电监护，动态复查电解质和 12 导联心电图。',
        consultation:'无脉搏立即按心脏骤停流程处理；有脉搏但不稳定（低血压、意识改变、胸痛、心衰）时立即启动急救并考虑同步电复律；稳定的室速也应尽快请心内科会诊。'
      },
      references:[{title:'2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000549'},{title:'2022 ESC Guidelines for the management of patients with ventricular arrhythmias and the prevention of sudden cardiac death · Eur Heart J 2022',url:'https://doi.org/10.1093/eurheartj/ehac262'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'ventricular-fibrillation',title:'心室颤动',category:'arrhythmias',risk:'high',
      aliases:['室颤','VF','心室纤颤','心脏骤停'],
      basic:{
        summary:'杂乱无序的颤动波、无可辨认的 QRS 波群；确认患者无反应、无脉搏后立即除颤。',
        diagram:{kind:'vf',caption:'室颤教学示意：杂乱、不规则的颤动波，无法辨认 QRS 波群和 T 波。'},
        diagnosticPoints:[
          '波形完全不规则，振幅和形态不断变化，看不到可辨认的 P 波、QRS 波群和 T 波。',
          '粗颤振幅较大；细颤振幅低，可能与心室停搏难以区分，应换导联、调高增益确认。',
          '先看患者，不只看监护：室颤一定伴意识丧失和大动脉搏动消失。'
        ],
        differentialPoints:[
          '患者活动、寒战、电极脱落或导线接触不良都可产生类似室颤的伪差；患者清醒、有脉搏时首先排查伪差。',
          '多形性室速、尖端扭转型室速可迅速转为室颤；细颤需与心室停搏鉴别，因两者处理不同（停搏不除颤）。'
        ]
      },
      periop:{
        timing:'术中或术后发生室颤属于心脏骤停，手术操作服从复苏。复苏成功后，择期手术需在病因明确、病情稳定后重新评估。',
        anesthesia:'术中出现室颤时，立即告知全体团队、开始胸外按压并尽快除颤；同时排查可逆病因：低氧、低血容量、酸中毒、高/低钾、低体温、张力性气胸、心包填塞、中毒、血栓（冠脉或肺）。',
        postoperative:'复苏后进入监护，评估缺血、电解质、药物和结构性心脏病；按心脏骤停后综合治疗流程管理。',
        consultation:'立即呼叫复苏团队并按本院心脏骤停流程处理；复苏后尽快请心内科及重症医学科会诊，评估冠脉造影和后续治疗。'
      },
      references:[{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'},{title:'2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000549'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'torsades-de-pointes',title:'尖端扭转型室速',category:'arrhythmias',risk:'high',
      aliases:['尖端扭转','TdP','torsades','多形性室速','长QT'],
      basic:{
        summary:'QT 延长背景下出现的多形性室速，QRS 方向和振幅围绕基线“扭转”，可自行终止或恶化为室颤。',
        criteria:[['QRS','多形，振幅和方向周期性围绕基线扭转'],['频率','约 160–250 次/分'],['背景','发作前 QT/QTc 明显延长（常 >500 ms）']],
        diagram:{kind:'torsades',caption:'尖端扭转型室速教学示意：QT 明显延长的窦性搏动后，出现振幅和方向周期性变化的多形性室速。'},
        diagnosticPoints:[
          '多形性室速，QRS 振幅周期性增大、减小，主波方向围绕等电位线扭转，频率常为 160–250 次/分。',
          '发作前的窦性搏动 QT（QTc）明显延长；常由“短–长–短”周期诱发（早搏后长间歇，再出现早搏）。',
          '常见诱因：致 QT 延长药物、低钾、低镁、心动过缓或长间歇、先天性长 QT 综合征。'
        ],
        differentialPoints:[
          'QT 正常时出现的多形性室速更常见于急性心肌缺血，处理思路与 TdP 不同，需寻找缺血证据。',
          '伪差、室颤和快速房颤伴预激也可能形态多变，需结合患者状态和发作前心电图判断。'
        ]
      },
      periop:{
        timing:'发作 TdP 或 QTc 显著延长（常以 >500 ms 为高危）时，择期手术应暂缓，先纠正可逆因素。',
        anesthesia:'提醒麻醉团队避免或慎用延长 QT 的药物（部分止吐药、抗精神病药、抗生素等），维持血钾、血镁正常，避免心动过缓和长间歇。',
        postoperative:'梳理并停用可疑药物，纠正电解质，持续监护；心动过缓相关者可能需要提高心率。用药方案按本院流程和专科意见，本草稿不给出固定剂量。',
        consultation:'发作时：无脉搏按心脏骤停流程除颤；有脉搏时立即启动急救，静脉镁剂是常用一线措施，按本院流程执行。发作后尽快请心内科会诊。'
      },
      references:[{title:'Prevention of Torsade de Pointes in Hospital Settings（AHA/ACCF 科学声明）· Circulation 2010',url:'https://doi.org/10.1161/CIRCULATIONAHA.109.192704'},{title:'2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000549'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'svt',title:'阵发性室上性心动过速',category:'arrhythmias',risk:'medium',
      aliases:['室上速','PSVT','SVT','AVNRT','AVRT','窄QRS心动过速','窄 QRS 心动过速'],
      related:['sinus-tachycardia','atrial-tachycardia','atrial-flutter','wide-complex-tachycardia'],
      basic:{
        summary:'突发突止的规则窄 QRS 心动过速，P 波常隐藏或逆行出现；需与窦速和房扑 2:1 鉴别。',
        criteria:[['QRS','<120 ms（无差异性传导时）'],['节律','规则'],['频率','常 150–250 次/分'],['P 波','隐藏于 QRS 内或紧随其后（逆行）']],
        diagram:{kind:'svt',caption:'阵发性室上性心动过速教学示意：窄 QRS、规则、心率快，P 波不易辨认。'},
        diagnosticPoints:[
          '规则窄 QRS 心动过速（QRS <120 ms），频率多在 150–250 次/分，常突然发作、突然终止。',
          'AVNRT 的 P 波常隐藏在 QRS 内，或在 V1 表现为假性 r′、在下壁导联表现为假性 S 波；AVRT 的逆行 P 波常位于 QRS 之后的 ST 段。',
          '对比发作前后的窦性心电图，可帮助发现预激（短 PR、delta 波）等基础问题。'
        ],
        differentialPoints:[
          '窦性心动过速逐渐加快、逐渐减慢，QRS 前可见正常 P 波，常有发热、疼痛、低血容量、贫血等诱因，应治疗诱因而非“转律”。',
          '心室率约 150 次/分的规则窄 QRS 心动过速要警惕房扑 2:1 传导，在 II、III、aVF、V1 导联寻找锯齿样扑动波；房速也需鉴别。'
        ]
      },
      periop:{
        timing:'发作期间择期手术应暂停；终止后、病因明确且未反复发作时，通常可在评估后继续安排手术。反复发作者术前宜请专科评估。',
        anesthesia:'告知麻醉团队既往发作情况与终止方法；术中交感兴奋、浅麻醉、电解质紊乱可诱发发作，需准备相应药物和同步电复律设备。',
        postoperative:'先区分窦性心动过速与室上速：术后窦速常见，应寻找疼痛、出血、低血容量、发热、低氧和肺栓塞等原因。',
        consultation:'稳定患者可按本院流程尝试迷走神经刺激和药物转复；伴低血压、意识改变、胸痛或心衰时立即启动急救并考虑同步电复律；反复发作或疑有预激时请心内科会诊。'
      },
      references:[{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'sinus-bradycardia',title:'窦性心动过缓',category:'arrhythmias',risk:'medium',
      aliases:['心动过缓','窦缓','心率慢','bradycardia'],
      related:['sinus-node-dysfunction','junctional-rhythm','mobitz-i'],
      basic:{
        summary:'窦性 P 波后均有 QRS、心率 <60 次/分；无症状者常为生理性，关键在于评估症状和诱因。',
        criteria:[['心率','<50 次/分（2018 ACC/AHA/HRS 指南定义；临床常用 <60 次/分描述）'],['P 波','窦性 P 波（II 直立、aVR 倒置）'],['PR','固定，每个 P 波均下传']],
        diagram:{kind:'sinus-bradycardia',caption:'窦性心动过缓教学示意：每个 QRS 前有形态一致的 P 波，PR 固定，RR 间期延长。'},
        diagnosticPoints:[
          '每个 QRS 前有窦性 P 波（II 导联直立、aVR 倒置），PR 间期固定，心率 <60 次/分；部分资料以 <50 次/分作为临床意义更明确的阈值。',
          '常见原因：运动员与睡眠（生理性）、β 受体阻滞剂等减慢心率药物、甲状腺功能减退、低体温、颅内压增高、下壁心肌缺血、病态窦房结综合征。',
          '关注是否伴随头晕、晕厥、乏力、低血压或长间歇（窦性停搏）。'
        ],
        differentialPoints:[
          '房性早搏二联律未下传时，未下传的 P 波常隐藏在 T 波中，会被误认为窦缓；仔细对比 T 波形态。',
          '2:1 房室传导阻滞、窦房阻滞和交界性逸搏心律都可表现为心率慢，需要逐一确认 P 波与 QRS 的关系。'
        ]
      },
      periop:{
        timing:'无症状、心率尚可的窦缓一般不需推迟手术。伴晕厥、症状性心动过缓或怀疑病态窦房结综合征时，择期手术前应完成评估。',
        anesthesia:'椎管内麻醉、迷走神经反射（牵拉、气腹）和部分麻醉药物可进一步减慢心率。骨科需特别注意：沙滩椅体位肩关节手术合并肌间沟阻滞时，可突发低血压伴心动过缓，应提前告知麻醉团队。',
        postoperative:'术后心率明显下降时，复核药物（β 受体阻滞剂、右美托咪定、阿片类等）、体温、电解质和疼痛控制情况，并评估灌注是否充足。',
        consultation:'症状性心动过缓、伴低血压或意识改变时，按本院流程启动急救（药物与经皮起搏准备）；长间歇、怀疑病窦或需临时起搏时请心内科会诊。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'},{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'premature-ventricular-contractions',title:'室性早搏',category:'arrhythmias',risk:'low',
      aliases:['室早','PVC','VPB','早搏','期前收缩','二联律'],
      basic:{
        summary:'提前出现、前无提前 P 波的宽大畸形 QRS，单个、无症状者多为良性，频发或成对时要找诱因。',
        criteria:[['时相','提前出现'],['QRS','宽大畸形，常 ≥120 ms'],['P 波','其前无提前出现的 P 波'],['代偿间歇','多为完全性']],
        diagram:{kind:'pvc',caption:'室性早搏教学示意：提前出现的宽大畸形 QRS，T 波方向与主波相反，其后有代偿间歇。'},
        diagnosticPoints:[
          '提前出现的 QRS 宽大畸形（常 ≥120 ms），其前没有提前出现的 P 波，ST-T 方向通常与 QRS 主波相反。',
          '常伴完全性代偿间歇：早搏前后两个窦性 QRS 的间距约为正常 RR 的 2 倍。',
          '描述时注明频率（偶发/频发）、形态（单形/多形）、成对、二联律或三联律，以及是否出现 R-on-T 或短阵室速。'
        ],
        differentialPoints:[
          '房性早搏伴差异性传导：QRS 前可见提前的 P 波（常隐藏在前一个 T 波中），QRS 多呈右束支阻滞形态。',
          '间歇出现的心室起搏、伪差也可表现为单个宽 QRS；伪差时通常能在其中看到正常节律的 QRS。'
        ]
      },
      periop:{
        timing:'偶发、无症状、心脏结构正常者通常不需推迟手术。频发、多形、成对或短阵室速，或伴心衰、晕厥、心肌缺血症状时，择期手术前应评估结构性心脏病。',
        anesthesia:'告知麻醉团队早搏负荷和心功能；术前纠正低钾、低镁，避免低氧、高碳酸血症和交感过度兴奋。',
        postoperative:'术后新发频发室早，先排查低钾、低镁、低氧、心肌缺血、疼痛，以及中心静脉导管或导丝刺激右心室（尖端位置过深）。',
        consultation:'出现短阵或持续室速、多形性室早伴 QT 延长、合并胸痛或血流动力学改变时，及时请心内科会诊。'
      },
      references:[{title:'2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000549'},{title:'2022 ESC Guidelines for the management of patients with ventricular arrhythmias and the prevention of sudden cardiac death · Eur Heart J 2022',url:'https://doi.org/10.1093/eurheartj/ehac262'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'first-degree-av-block',title:'一度房室传导阻滞',category:'conduction',risk:'low',
      aliases:['一度房室阻滞','一度AVB','I度房室传导阻滞','PR延长','PR 延长','1度房室阻滞'],
      related:['mobitz-i','second-degree-av-block'],
      basic:{
        summary:'PR 间期 >200 ms、每个 P 波均下传；单独存在时多数无需特殊处理。',
        criteria:[['PR 间期','>200 ms，且固定'],['房室关系','每个 P 波后均有 QRS']],
        diagram:{kind:'first-degree-avb',caption:'一度房室传导阻滞教学示意：每个 P 波后均有 QRS，PR 间期固定但延长。'},
        diagnosticPoints:[
          'PR 间期 >200 ms（25 mm/s 时超过 1 个大格），且每个 P 波后都有 QRS，PR 固定不变。',
          '常见原因：迷走张力增高、减慢房室传导的药物（β 受体阻滞剂、非二氢吡啶类钙通道阻滞剂、地高辛、胺碘酮）、退行性传导系统病变、下壁缺血和电解质紊乱。',
          'PR 明显延长（常以 >300 ms 为界）时，P 波可能埋在前一个 T 波中，需仔细寻找。'
        ],
        differentialPoints:[
          '二度 I 型（文氏）阻滞中 PR 是逐搏延长并最终脱落，不是固定延长；需观察足够长的节律条。',
          '心率快时 P 波与前一个 T 波重叠，可能被误判为交界性心律或其他节律。'
        ]
      },
      periop:{
        timing:'单纯一度房室阻滞且无症状时，通常不需推迟手术。合并双分支阻滞、晕厥史或 PR 显著延长伴症状时，择期手术前建议评估。',
        anesthesia:'告知麻醉团队，留意减慢房室传导的药物和迷走反射；合并其他传导异常时，提前确认经皮起搏等应急准备。',
        postoperative:'复核术后新加用的减慢房室传导药物和电解质；若 PR 进行性延长或出现脱落，应提高警惕。',
        consultation:'进展为二度或三度房室阻滞、伴晕厥或症状性心动过缓，或合并双分支阻滞时，请心内科会诊。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'second-degree-av-block',title:'二度房室传导阻滞',category:'conduction',risk:'medium',
      aliases:['二度房室阻滞','文氏','文氏阻滞','莫氏','莫氏II型','Mobitz','Wenckebach','II度房室传导阻滞','2:1房室阻滞'],
      related:['mobitz-i','mobitz-ii','av-block-2-1','high-grade-av-block','complete-heart-block'],
      basic:{
        summary:'部分 P 波不能下传。区分文氏型（PR 逐搏延长）和莫氏 II 型（PR 固定、突然脱落），后者风险更高。',
        criteria:[['文氏型（I 型）','PR 逐搏延长，直至 1 个 P 波后 QRS 脱落'],['莫氏 II 型','PR 固定，突然出现未下传的 P 波'],['2:1 阻滞','每 2 个 P 波仅下传 1 个，无法据此分型'],['高度阻滞','连续 ≥2 个 P 波未下传，但仍有部分下传']],
        diagram:{kind:'second-degree-avb',caption:'二度房室传导阻滞教学示意：上行为文氏型，下行为莫氏 II 型。'},
        diagnosticPoints:[
          '文氏型（莫氏 I 型）：PR 逐搏延长，直至一个 P 波后 QRS 脱落，然后周期重复；脱落后的第一个 PR 最短。阻滞多在房室结，常见于迷走张力高、下壁缺血和药物影响。',
          '莫氏 II 型：PR 间期固定，突然出现 P 波后 QRS 脱落；阻滞多在希氏束以下，常合并束支阻滞（宽 QRS），易进展为三度阻滞。',
          '2:1 传导时无法根据连续两个下传 PR 判断分型：QRS 宽、无迷走诱因时更倾向希浦系统病变，应按高风险对待并延长记录。',
          '连续 2 个及以上 P 波不能下传为高度房室阻滞，风险高于普通二度阻滞。'
        ],
        differentialPoints:[
          '未下传的房性早搏：提前出现的 P 波未下传，P-P 间期不规则；而二度阻滞中 P-P 间期基本规则。',
          '窦性停搏、窦房阻滞时 P 波本身也消失，与 P 波存在但未下传的二度房室阻滞不同。'
        ]
      },
      periop:{
        timing:'无症状的文氏型通常不需推迟手术。莫氏 II 型、2:1 伴宽 QRS 或高度房室阻滞时，择期手术前应完成心内科评估，部分患者需先植入起搏器。',
        anesthesia:'告知麻醉团队阻滞类型。莫氏 II 型和高度阻滞患者应提前准备经皮起搏（贴好电极片）或临时起搏方案；注意迷走反射和减慢传导的药物。',
        postoperative:'持续心电监护，复核药物、电解质和缺血情况；文氏型在睡眠时出现可以是生理性的，但新发的莫氏 II 型需高度重视。',
        consultation:'莫氏 II 型、高度房室阻滞、伴晕厥、低血压或宽 QRS 的 2:1 阻滞，应及时请心内科会诊，评估临时或永久起搏。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'complete-heart-block',title:'三度房室传导阻滞',category:'conduction',risk:'high',
      aliases:['三度房室阻滞','完全性房室传导阻滞','完全性房室阻滞','III度房室传导阻滞','CHB','房室分离'],
      related:['high-grade-av-block','mobitz-ii','junctional-rhythm','aivr'],
      basic:{
        summary:'心房和心室各自独立活动，P 波与 QRS 无固定关系，心室依靠缓慢的逸搏维持，属于高危传导异常。',
        criteria:[['房室关系','P 波与 QRS 无固定关系（房室分离）'],['频率','心房率快于心室率'],['交界性逸搏','QRS 窄，约 40–60 次/分'],['室性逸搏','QRS 宽，约 20–40 次/分']],
        diagram:{kind:'complete-heart-block',caption:'三度房室传导阻滞教学示意：P 波规则出现，QRS 规则但更慢，两者之间没有固定关系。'},
        diagnosticPoints:[
          'P-P 间期规则，R-R 间期也规则，但 PR 间期不断变化，P 波可落在 QRS、ST 段或 T 波上；心房率快于心室率。',
          '逸搏部位决定 QRS 形态和频率：交界性逸搏 QRS 窄、约 40–60 次/分；室性逸搏 QRS 宽、常 <40 次/分，更不稳定。',
          '常见原因：退行性传导系统疾病、急性下壁或前壁心肌梗死、药物（β 受体阻滞剂、钙通道阻滞剂、地高辛）、高钾血症、心脏手术后。'
        ],
        differentialPoints:[
          '加速性交界性或室性心律引起的房室分离：心室率快于心房率，P 波仍可下传，并非真正的完全性阻滞。',
          '高度房室阻滞和 2:1 阻滞仍有部分 P 波能够下传，可见固定的 PR 间期。'
        ]
      },
      periop:{
        timing:'择期手术必须推迟，先处理阻滞（通常需要起搏）。急诊手术需在临时起搏或经皮起搏保障下进行。',
        anesthesia:'告知麻醉团队，术前建立临时起搏或贴好经皮起搏电极并测试；避免减慢心率和传导的药物，备好正性变时药物。',
        postoperative:'持续心电监护，评估可逆因素（药物、高钾、缺血）；明确是否需要永久起搏器。',
        consultation:'立即请心内科会诊。伴低血压、意识改变、晕厥或心衰时，按本院流程启动急救并准备经皮起搏。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'right-bundle-branch-block',title:'右束支传导阻滞',category:'conduction',risk:'low',
      aliases:['右束支阻滞','RBBB','完全性右束支传导阻滞','不完全性右束支传导阻滞','rsR'],
      basic:{
        summary:'V1 呈 rsR′、I 和 V6 有宽钝 S 波；孤立存在多为良性，新发时要考虑右心负荷等原因。',
        criteria:[['QRS','≥120 ms（110–119 ms 为不完全性）'],['V1–V2','rsR′、rSR′ 或宽而有切迹的 R 波'],['I、V6','S 波时限 > R 波或 >40 ms']],
        diagram:{kind:'rbbb',caption:'右束支传导阻滞教学示意：V1 导联 rsR′ 宽 QRS 伴 T 波倒置，V6 导联宽而钝的 S 波。'},
        diagnosticPoints:[
          '完全性右束支阻滞：QRS ≥120 ms；V1–V2 呈 rsR′（“M”形）或宽 R 波；I、aVL、V5–V6 有宽而钝的 S 波。',
          'QRS 110–119 ms 且形态类似者为不完全性右束支阻滞，常见于正常人。',
          'V1–V3 的 ST 压低、T 波倒置属于继发性改变；ST 抬高不能用右束支阻滞解释，仍应警惕急性心肌梗死。',
          '合并电轴明显左偏（左前分支阻滞）为双分支阻滞，需关注是否有晕厥。'
        ],
        differentialPoints:[
          'Brugada 图形（V1–V2 穹窿形 ST 抬高）、右心室肥厚、后壁心肌梗死和预激综合征都可在 V1 出现高 R 或 R′。',
          '急性肺栓塞可出现新发右束支阻滞；胸前导联电极位置偏高也可造成假性 rSr′。'
        ]
      },
      periop:{
        timing:'孤立、无症状的右束支阻滞一般不需推迟手术。新发者伴气促、低氧或胸痛时，应先评估肺栓塞、缺血等急性原因。',
        anesthesia:'单纯右束支阻滞对麻醉影响小；合并双分支阻滞或晕厥史时，告知麻醉团队并准备经皮起搏。',
        postoperative:'术后新发右束支阻滞伴气促、心动过速或低氧时，应首先想到肺栓塞，结合临床概率和其他检查评估。',
        consultation:'新发右束支阻滞伴心肺症状、双分支阻滞伴晕厥，或合并房室阻滞时请心内科会诊。'
      },
      references:[{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part III：室内传导障碍（2009）',url:'https://pubmed.ncbi.nlm.nih.gov/19281930/'},{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'left-bundle-branch-block',title:'左束支传导阻滞',category:'conduction',risk:'medium',
      aliases:['左束支阻滞','LBBB','完全性左束支传导阻滞'],
      related:['lbbb-paced-mi','right-bundle-branch-block','left-anterior-fascicular-block'],
      basic:{
        summary:'V1 深宽 QS、V6 宽大切迹 R 波、无间隔 q 波；常提示结构性心脏病，并会干扰缺血判读。',
        criteria:[['QRS','≥120 ms'],['I、aVL、V5–V6','宽大、切迹或平钝的 R 波，无间隔性 q 波'],['V1','QS 或 rS'],['V5–V6 R 峰时间','>60 ms'],['ST-T','与 QRS 主波方向相反']],
        diagram:{kind:'lbbb',caption:'左束支传导阻滞教学示意：V1 导联宽而深的 QS 波，V6 导联宽大、切迹的 R 波，ST-T 与主波方向相反。'},
        diagnosticPoints:[
          'QRS ≥120 ms；V1 呈 QS 或 rS（深而宽）；I、aVL、V5–V6 为宽大、顶部切迹或平钝的 R 波，且无间隔性 q 波。',
          'ST-T 方向与 QRS 主波相反（不一致性），属于继发性改变。',
          '常见于高血压心脏病、冠心病、心肌病和主动脉瓣疾病；新发左束支阻滞通常需要评估心脏结构和功能。'
        ],
        differentialPoints:[
          '右心室起搏心律形态与左束支阻滞相似，查找起搏脉冲；左心室肥厚、非特异性室内传导延迟和高钾血症也可使 QRS 增宽。',
          '左束支阻滞时常规 ST 标准不适用；疑似急性心肌梗死时用专门标准（如 Sgarbossa 标准）并结合症状和肌钙蛋白。'
        ]
      },
      periop:{
        timing:'已知且稳定的左束支阻滞一般不单独决定手术时机。新发者，或伴心衰症状、运动耐量下降时，择期手术前建议做超声心动图等评估。',
        anesthesia:'告知麻醉团队：已有左束支阻滞的患者，右心导管（如肺动脉导管）操作可能诱发右束支阻滞，形成完全性房室阻滞，需准备起搏方案；缺血监测时 ST 段变化难以解读。',
        postoperative:'术后胸痛时不能依赖 ST 段判断，需结合肌钙蛋白动态变化和临床表现，必要时与旧图对比。',
        consultation:'新发左束支阻滞、伴胸痛疑似急性心肌梗死、伴心衰或晕厥时请心内科会诊。'
      },
      references:[{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part III：室内传导障碍（2009）',url:'https://pubmed.ncbi.nlm.nih.gov/19281930/'},{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'},{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'left-ventricular-hypertrophy',title:'左心室肥厚',category:'enlargement',risk:'low',
      aliases:['左室肥厚','LVH','左室高电压','劳损','左心室高电压'],
      basic:{
        summary:'胸前导联高电压，可伴 ST 压低和不对称 T 波倒置；心电图敏感性有限，确诊依赖影像学。',
        criteria:[['Sokolow-Lyon','SV1 + RV5 或 RV6 ≥35 mm'],['Cornell','RaVL + SV3：男性 >28 mm，女性 >20 mm'],['支持表现','劳损样 ST-T、左房异常、电轴左偏']],
        diagram:{kind:'lvh',caption:'左心室肥厚教学示意：V1 深 S 波，V5 高 R 波伴 ST 段压低和不对称 T 波倒置。'},
        diagnosticPoints:[
          '常用电压标准：Sokolow-Lyon（SV1 + RV5 或 RV6 ≥35 mm）；Cornell（RaVL + SV3 >28 mm 男性、>20 mm 女性）。',
          '“劳损”样改变：R 波为主的侧壁导联出现下斜型 ST 段压低和不对称 T 波倒置，提示更显著的肥厚。',
          '可伴左心房异常（V1 导联 P 波终末负向部分加深）和电轴左偏。电压标准敏感性较低，心电图正常不能排除左室肥厚。'
        ],
        differentialPoints:[
          '年轻、体型偏瘦者胸壁薄，可出现单纯高电压而无肥厚；仅凭电压不足以诊断。',
          '劳损样 ST-T 改变需与心肌缺血、地高辛效应和束支阻滞鉴别；肥厚型心肌病可出现深大 Q 波或巨大倒置 T 波。'
        ]
      },
      periop:{
        timing:'左室肥厚本身通常不推迟手术，但提示高血压控制不佳、主动脉瓣狭窄或肥厚型心肌病。合并杂音、晕厥、劳力性胸痛或气促时，择期手术前应完成超声心动图。',
        anesthesia:'告知麻醉团队可能的舒张功能不全：维持窦性心律和合适前负荷，避免心动过速和低血压；严重主动脉瓣狭窄或梗阻性肥厚型心肌病对血管扩张和低血容量耐受差。',
        postoperative:'控制疼痛和血压，避免容量过多或不足；基础 ST-T 改变会干扰术后缺血判断，需与术前心电图对比。',
        consultation:'疑似重度主动脉瓣狭窄、肥厚型心肌病，或伴心衰、晕厥等症状时请心内科会诊。'
      },
      references:[{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part V：心腔肥大相关心电图改变（2009）',url:'https://hrsonline.org/guidance/clinical-resources/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-v'},{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'right-ventricular-hypertrophy',title:'右心室肥厚与慢性右心负荷',category:'pulmonary',risk:'medium',
      aliases:['右室肥厚','RVH','肺心病','慢性肺心病','肺动脉高压','肺型P波','P pulmonale','右心负荷'],
      basic:{
        summary:'电轴右偏、V1 以 R 波为主伴 ST-T 改变、肺型 P 波，提示慢性右心压力负荷，常见于肺动脉高压和慢性肺病。',
        criteria:[['电轴','右偏（>+90° 至 +110°）'],['V1','R/S >1 或 R 波 ≥7 mm'],['支持表现','右胸及下壁导联 ST-T 改变；II 导联 P 波 ≥2.5 mm']],
        diagram:{kind:'rvh',caption:'右心室肥厚教学示意：V1 导联以 R 波为主伴 T 波倒置，II 导联 P 波高尖。'},
        diagnosticPoints:[
          '电轴右偏（成人常以 >+90° 至 +110° 为界）；V1 R/S >1 或 R 波 ≥7 mm；V5–V6 有较深的 S 波。',
          '右心“劳损”：V1–V3 及下壁导联 ST 段压低、T 波倒置。',
          '右心房异常：II 导联 P 波高尖（≥2.5 mm，“肺型 P 波”）。慢性阻塞性肺病患者可见肢体导联低电压和顺钟向转位。'
        ],
        differentialPoints:[
          '急性肺栓塞是急性右心负荷，常伴窦速和新发改变，需与旧图对比（见“肺栓塞”词条）；后壁心肌梗死、右束支阻滞和预激也可使 V1 出现高 R 波。',
          '肢体导联电极左右接反、右位心可造成假性电轴右偏；先核对 I 导联 P 波方向和导联连接。'
        ]
      },
      periop:{
        timing:'提示肺动脉高压或慢性右心功能不全时，围手术期风险明显升高。择期手术前应完成超声心动图等评估，并让病情处于最佳状态。',
        anesthesia:'告知麻醉团队右心功能和肺动脉压情况：避免低氧、高碳酸血症、酸中毒和低体温（均可升高肺血管阻力），避免低血压，谨慎补液。骨科需注意髓内钉和骨水泥植入时的栓塞风险。',
        postoperative:'关注氧合、液体平衡和右心衰征象（颈静脉怒张、外周水肿、低血压）；术后疼痛和肺不张会加重低氧。',
        consultation:'疑似中重度肺动脉高压或右心衰时，术前请心内科或呼吸科会诊；术中、术后循环不稳定时及时联系重症团队。'
      },
      references:[{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part V：心腔肥大相关心电图改变（2009）',url:'https://hrsonline.org/guidance/clinical-resources/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-v'},{title:'2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension · Eur Heart J 2022',url:'https://doi.org/10.1093/eurheartj/ehac237'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'hypokalemia',title:'低钾血症',category:'electrolytes',risk:'medium',
      aliases:['低钾','血钾低','U波','U 波','hypokalemia'],
      basic:{
        summary:'T 波低平、ST 压低和明显 U 波提示低钾可能，易诱发心律失常；心电图不能用于推算血钾数值。',
        diagram:{kind:'hypokalemia',caption:'低钾相关改变教学示意：T 波低平、ST 段轻度压低，T 波后出现明显 U 波。'},
        diagnosticPoints:[
          '常见改变：T 波低平或倒置、ST 段压低、U 波明显（振幅可超过 T 波），T 与 U 融合时易被误测为 QT 延长（实为 QU 间期）。',
          '可诱发房性和室性早搏、室速，并增加尖端扭转型室速和地高辛中毒的风险。',
          '心电图改变与血钾水平相关性差，正常心电图不能排除低钾，应以血钾检测为准，并同时检查血镁。'
        ],
        differentialPoints:[
          '地高辛效应、心肌缺血、左室肥厚劳损也可引起 ST 压低和 T 波改变。',
          '药物所致长 QT 与低钾常同时存在；心动过缓时 U 波也可以较明显。'
        ]
      },
      periop:{
        timing:'中重度或有症状的低钾，以及伴心律失常者，择期手术前应先纠正；轻度低钾是否推迟由手术类型、心脏情况和本院标准决定。',
        anesthesia:'告知麻醉团队血钾和补钾情况；过度通气（碱中毒）、胰岛素、β 受体激动剂和利尿剂会进一步降低血钾。',
        postoperative:'术后利尿、胃肠减压、呕吐、腹泻和补液不当都可导致低钾；按本院流程监测和补钾，同时纠正低镁。',
        consultation:'伴心律失常、QT 明显延长、肌无力或难以纠正的低钾时，及时与内科或相关专科讨论；出现室性心律失常时按急救流程处理。'
      },
      references:[{title:'StatPearls: Hypokalemia（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK482465/'},{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part IV：ST 段、T 波、U 波与 QT 间期（2009）',url:'https://www.hrsonline.org/resource/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-iv-st-segment/'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'calcium-disorders',title:'血钙异常（低钙 / 高钙）',category:'electrolytes',risk:'medium',
      aliases:['低钙','高钙','低钙血症','高钙血症','血钙','QT延长','QT缩短'],
      basic:{
        summary:'低钙主要使 ST 段延长、QT 延长；高钙使 ST 段缩短、QT 缩短。两者都应以血钙（最好是离子钙）为准。',
        diagram:{kind:'calcium',caption:'血钙异常教学示意：上行 ST 段延长、QT 延长（低钙）；下行 ST 段缩短、QT 缩短（高钙）。'},
        diagnosticPoints:[
          '低钙血症：ST 段平直延长，T 波形态大致正常，QTc 延长；严重时可诱发尖端扭转型室速。',
          '高钙血症：ST 段缩短甚至消失，T 波紧接 QRS，QTc 缩短；严重时可出现心动过缓、房室阻滞和 J 波。',
          '心电图对血钙变化不敏感，判读须结合血钙（离子钙或白蛋白校正后血钙）及镁、磷水平。'
        ],
        differentialPoints:[
          '药物、低钾、低镁和心肌缺血也会使 QT 延长；低钙的特点是延长主要发生在 ST 段，而非 T 波增宽。',
          'QT 缩短还见于地高辛效应、高热和先天性短 QT 综合征。'
        ]
      },
      periop:{
        timing:'有症状或程度较重的血钙异常应先纠正并寻找病因，再安排择期手术。骨科需注意：病理性骨折、骨转移瘤、多发性骨髓瘤和长期制动都可导致高钙血症。',
        anesthesia:'低钙：大量输血（枸橼酸盐抗凝）可致离子钙下降，引起低血压和心肌抑制，骨科创伤大量输血时要监测离子钙。高钙：注意脱水、肾功能和心律失常。',
        postoperative:'甲状腺或甲状旁腺术后、大量输血后应监测离子钙；高钙患者注意补液、肾功能和意识状态。',
        consultation:'伴心律失常、QT 明显改变、抽搐、意识改变的血钙异常，以及病因不明的高钙血症，及时请内分泌科或相关专科会诊。'
      },
      references:[{title:'StatPearls: Hypocalcemia（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK430912/'},{title:'StatPearls: Hypercalcemia（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK430714/'},{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part IV：ST 段、T 波、U 波与 QT 间期（2009）',url:'https://www.hrsonline.org/resource/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-iv-st-segment/'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'drug-induced-long-qt',title:'药物相关 QT 间期延长',category:'electrolytes',risk:'medium',
      aliases:['QT延长','长QT','QTc延长','QT 延长','药物QT','LQT'],
      basic:{
        summary:'多种围手术期常用药物可延长 QT，叠加低钾、低镁和心动过缓时尖端扭转型室速风险升高。',
        criteria:[['QTc 常用上限','男性约 450 ms，女性约 460 ms'],['高危阈值','QTc >500 ms，或较基线延长 >60 ms'],['测量','II 或 V5 导联，切线法定 T 波终点，排除 U 波']],
        diagram:{kind:'drug-qt',caption:'QT 间期延长教学示意：T 波终点明显后移。测量需选择 T 波终点清楚的导联并按心率校正。'},
        diagnosticPoints:[
          'QT 从 QRS 起点量到 T 波终点，常选 II 或 V5 导联，并用切线法确定 T 波终点、排除 U 波；再按心率计算 QTc（可使用本栏目的 QTc 工具）。',
          'QTc 常用参考上限：男性约 450 ms、女性约 460 ms；QTc >500 ms 或较基线延长 >60 ms 时，尖端扭转型室速风险明显增加。',
          '宽 QRS（束支阻滞、起搏）会使 QT 延长，此时需要用专门方法校正，不能直接套用常规阈值。'
        ],
        differentialPoints:[
          '先天性长 QT 综合征、低钾、低镁、低钙、心肌缺血、颅内病变和甲状腺功能减退也可延长 QT。',
          '明显 U 波（低钾）与 T 波融合时容易高估 QT；心动过速时 Bazett 公式会高估 QTc，可同时参考 Fridericia 公式。'
        ]
      },
      periop:{
        timing:'QTc 明显延长（尤其 >500 ms）时，择期手术前应寻找原因、调整用药并纠正电解质。',
        anesthesia:'告知麻醉团队 QTc 数值和正在使用的延长 QT 药物；围手术期常见的有部分止吐药、抗精神病药、大环内酯和喹诺酮类抗生素、美沙酮及某些抗心律失常药。尽量避免同时使用多种此类药物。',
        postoperative:'新加药物前核对 QT 风险，维持血钾、血镁正常；高风险患者用药后复查心电图。',
        consultation:'QTc >500 ms、出现室性早搏增多或尖端扭转型室速，或怀疑先天性长 QT 综合征时，请心内科会诊。'
      },
      references:[{title:'Prevention of Torsade de Pointes in Hospital Settings（AHA/ACCF 科学声明）· Circulation 2010',url:'https://doi.org/10.1161/CIRCULATIONAHA.109.192704'},{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part IV：ST 段、T 波、U 波与 QT 间期（2009）',url:'https://www.hrsonline.org/resource/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-iv-st-segment/'},{title:'CredibleMeds：QT 延长与尖端扭转风险药物数据库',url:'https://crediblemeds.org/healthcare-providers'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'digoxin-effect',title:'地高辛效应与中毒',category:'electrolytes',risk:'medium',
      aliases:['地高辛','洋地黄','洋地黄中毒','地高辛中毒','鱼钩样','digoxin'],
      basic:{
        summary:'“鱼钩样” ST 段压低表示地高辛效应，不等于中毒；中毒以新发心律失常为主要线索，须结合血药浓度和血钾判断。',
        diagram:{kind:'digoxin',caption:'地高辛效应教学示意：ST 段呈勺状下垂样压低，T 波低平，QT 相对缩短。'},
        diagnosticPoints:[
          '地高辛效应：ST 段下斜、呈勺状或“鱼钩样”压低（侧壁导联明显），T 波低平或倒置，QT 缩短，PR 可轻度延长。',
          '中毒提示：频发室早或二联律、房速伴房室阻滞、加速性交界性心律、双向性室速、各类房室阻滞；房颤患者心室律变得规则时需警惕合并完全性阻滞。',
          '易感因素：肾功能不全、低钾、低镁、高钙、高龄，以及合用胺碘酮、维拉帕米、部分大环内酯类等药物。'
        ],
        differentialPoints:[
          '心肌缺血、左室肥厚劳损和低钾也可引起 ST 压低；地高辛效应的特点是勺状形态和 QT 缩短。',
          '单纯的地高辛效应可见于治疗浓度内的患者，不应据此停药或诊断中毒。'
        ]
      },
      periop:{
        timing:'怀疑地高辛中毒时，择期手术应暂缓，先评估血药浓度、血钾和肾功能。',
        anesthesia:'告知麻醉团队地高辛用药情况；低钾会增加中毒风险，同时注意血钙和镁。电复律时中毒患者发生心律失常的风险更高，需要谨慎。',
        postoperative:'术后肾功能变化、电解质紊乱和新增相互作用药物都可能诱发中毒；必要时监测血药浓度。',
        consultation:'疑似中毒伴心律失常或血流动力学改变时，及时联系心内科及中毒救治团队，评估特异性解毒剂等治疗；不在此草稿给出固定方案。'
      },
      references:[{title:'StatPearls: Digitalis Toxicity（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK470568/'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'ventricular-pacing',title:'心室起搏心电图',category:'pacing',risk:'low',
      aliases:['起搏器','起搏心律','起搏','心室起搏','VVI','DDD','ICD','起搏钉','起搏脉冲'],
      related:['lbbb-paced-mi','pacing-malfunction'],
      basic:{
        summary:'起搏脉冲后紧跟宽 QRS（右室心尖起搏时呈类左束支阻滞形态），读图要先确认起搏模式和起搏是否有效。',
        diagram:{kind:'ventricular-pacing',caption:'心室起搏心电图教学示意：每个宽 QRS 前有起搏脉冲（红色竖线），ST-T 与主波方向相反。'},
        diagnosticPoints:[
          '起搏脉冲呈窄而陡的竖线；心室起搏后为宽 QRS，右室心尖起搏常呈类左束支阻滞形态，ST-T 与 QRS 主波方向相反。',
          '心房起搏时脉冲后跟 P 波；双腔起搏可同时见到心房和心室脉冲。双极导线脉冲很小，可能在体表心电图上看不清。',
          '读图时确认：起搏模式与设定频率、每个脉冲是否有夺获（后有相应波形）、自身心律出现时是否被正确感知。'
        ],
        differentialPoints:[
          '左束支阻滞和室速同样表现为宽 QRS；放大查看有无起搏脉冲，并询问是否装有起搏器。',
          '肌电干扰和监护仪滤波可产生假性“起搏脉冲”，或掩盖真正的脉冲；以 12 导联诊断模式记录核对。'
        ]
      },
      periop:{
        timing:'择期手术前应了解器械类型（起搏器或 ICD）、植入原因、是否为起搏依赖、最近一次程控时间和电池状态；信息不全时先联系程控。',
        anesthesia:'告知麻醉团队器械信息。单极电刀（尤其在脐以上部位）可干扰器械：起搏依赖者可能需程控为非同步模式；ICD 需按本院流程暂停快速心律失常治疗，并准备体外除颤。磁铁对起搏器和 ICD 的作用不同，应按器械说明和本院流程使用。',
        postoperative:'术中曾重新程控或暂停治疗的器械，术后必须恢复原设置并确认功能正常，在恢复前持续监护。',
        consultation:'术前器械信息不明、起搏依赖、术中可能需要调整设置，或术后怀疑器械功能异常时，联系心内科或器械程控团队。'
      },
      references:[{title:'HRS/ASA 2011 Expert Consensus Statement on the Perioperative Management of Patients with Implantable Defibrillators, Pacemakers and Arrhythmia Monitors',url:'https://www.hrsonline.org/resource/2011-expert-consensus-statement-perioperative-management-patients-implantable-defibrillators/'},{title:'ASA Practice Advisory for the Perioperative Management of Patients with Cardiac Implantable Electronic Devices · Anesthesiology 2020',url:'https://pubmed.ncbi.nlm.nih.gov/32032098/'},{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'pacing-malfunction',title:'起搏功能异常',category:'pacing',risk:'high',
      aliases:['起搏失夺获','失夺获','感知不良','感知过度','起搏故障','起搏器故障','failure to capture','undersensing','oversensing'],
      basic:{
        summary:'识别三类问题：失夺获（有脉冲无心电反应）、感知不良（脉冲出现在不该出现的位置）、感知过度（该起搏时不起搏）。',
        diagram:{kind:'pacing-malfunction',caption:'起搏异常教学示意：上行为失夺获，下行为感知不良（起搏脉冲落在 T 波上）。'},
        diagnosticPoints:[
          '失夺获：起搏脉冲后没有相应的 P 波或 QRS 波。常见原因有导线脱位（植入后早期）、起搏阈值升高（心肌缺血、高钾、药物）和电池耗竭。',
          '感知不良：器械没有识别自身心搏，在自身 QRS 之后不久仍发放脉冲，脉冲可落在 T 波上，有诱发室性心律失常的风险。',
          '感知过度：器械把肌电、电刀干扰或 T 波误认为心搏而抑制起搏，表现为长间歇；起搏依赖者可出现晕厥或心脏停搏。'
        ],
        differentialPoints:[
          '许多“异常”其实是正常的器械功能，如频率滞后、夜间低限频率、融合波和假性融合波；判定故障前应结合器械参数。',
          '监护仪的起搏脉冲标记可能误标或漏标；以 12 导联心电图和器械程控结果为准。'
        ]
      },
      periop:{
        timing:'发现起搏功能异常时，择期手术应推迟，先完成器械程控检查和处理。',
        anesthesia:'起搏依赖患者出现失夺获或感知过度时，可迅速发生严重心动过缓甚至停搏，需提前贴好经皮起搏电极并备好药物；术中电刀干扰导致的抑制应及时告知手术团队。',
        postoperative:'术后（尤其是器械植入后早期或术中曾受电刀干扰者）持续监护，复查起搏功能；纠正高钾、缺血等可升高起搏阈值的因素。',
        consultation:'一旦怀疑起搏功能异常，尽快联系心内科或器械程控团队；伴严重心动过缓、低血压或晕厥时，立即启动急救并经皮起搏。'
      },
      references:[{title:'HRS/ASA 2011 Expert Consensus Statement on the Perioperative Management of Patients with Implantable Defibrillators, Pacemakers and Arrhythmia Monitors',url:'https://www.hrsonline.org/resource/2011-expert-consensus-statement-perioperative-management-patients-implantable-defibrillators/'},{title:'ASA Practice Advisory for the Perioperative Management of Patients with Cardiac Implantable Electronic Devices · Anesthesiology 2020',url:'https://pubmed.ncbi.nlm.nih.gov/32032098/'},{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'atrial-flutter',title:'心房扑动',category:'arrhythmias',risk:'medium',
      aliases:['房扑','AFL','atrial flutter','锯齿波','F波','2:1房扑'],
      related:['atrial-fibrillation','atrial-tachycardia','sinus-tachycardia'],
      basic:{
        summary:'连续的锯齿样扑动波、心房率约 300 次/分；2:1 传导时心室率约 150 次/分，容易被误认为窦速或室上速。',
        criteria:[['F 波','II、III、aVF 负向锯齿波，V1 多为正向，波间无等电位线'],['心房率','250–350 次/分'],['传导','2:1 时心室率约 150 次/分']],
        diagram:{kind:'atrial-flutter',caption:'典型心房扑动教学示意：II 导联连续锯齿样 F 波，波间无等电位线，本例为 4:1 传导。'},
        diagnosticPoints:[
          '典型（三尖瓣峡部依赖）房扑：II、III、aVF 导联呈负向锯齿样 F 波，V1 导联多为正向，F 波之间没有等电位线。',
          '心房率通常在 250–350 次/分（典型约 300 次/分）；常见 2:1 传导，心室率约 150 次/分。传导比例固定时心室律规则，比例变化时心室律不规则。',
          '心室率稳定在约 150 次/分的规则窄 QRS 心动过速，应主动寻找“藏在” QRS 或 T 波中的第二个 F 波。'
        ],
        differentialPoints:[
          '房颤的心房活动杂乱无序、RR 绝对不齐；粗颤的房颤可被误认为房扑，需对比多个导联。',
          '房性心动过速的 P 波之间有等电位线，心房率多为 150–250 次/分；窦性心动过速 P 波形态正常，且心率逐渐变化。'
        ]
      },
      periop:{
        timing:'新发或心室率未控制的房扑，择期手术前应先控制心室率并评估诱因与血栓风险；病情稳定、心室率控制良好的慢性房扑一般可结合风险评估安排手术。',
        anesthesia:'告知麻醉团队心室率、心功能和抗凝情况。房扑的心室率常比房颤更难用药物控制，术中交感兴奋可使传导比例由 4:1 变为 2:1 甚至 1:1，应备好同步电复律设备。',
        postoperative:'寻找低氧、疼痛、电解质紊乱、容量异常等诱因；卒中风险评估和抗凝原则与房颤相近，需与手术出血风险共同权衡。',
        consultation:'心室率难以控制、伴低血压或心衰、需要抗凝决策，或考虑电复律/导管消融时请心内科会诊；血流动力学不稳定时按急救流程同步电复律。'
      },
      references:[{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'},{title:'2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001193'}],
      updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'pre-excitation',title:'预激综合征（WPW）',category:'conduction',risk:'high',
      aliases:['预激','WPW','delta波','delta 波','δ波','旁路','短PR','预激综合征'],
      basic:{
        summary:'PR 缩短、QRS 起始部 delta 波、QRS 增宽，提示存在房室旁路；合并房颤时可出现危险的极快心室率。',
        criteria:[['PR','<120 ms'],['delta 波','QRS 起始部顿挫'],['QRS','常 >110–120 ms，伴继发性 ST-T 改变']],
        diagram:{kind:'wpw',caption:'心室预激教学示意：II 导联 PR 缩短，QRS 起始部有缓慢上升的 delta 波，QRS 增宽。'},
        diagnosticPoints:[
          '典型图形：PR 间期 <120 ms，QRS 起始部顿挫（delta 波），QRS 增宽（常 >110–120 ms），可伴继发性 ST-T 改变。',
          '仅有心电图表现、无心动过速发作称为“预激图形”；同时有心动过速发作才称为预激综合征。',
          '预激合并房颤：QRS 宽窄不一、形态多变、节律绝对不齐，心室率可极快，有恶化为室颤的风险。'
        ],
        differentialPoints:[
          'delta 波可在下壁或其他导联形成“假性 Q 波”，被误认为陈旧性心肌梗死；也可类似束支阻滞或左室肥厚。',
          '只有 PR 缩短而没有 delta 波、QRS 正常者，不属于典型心室预激；间歇性预激的 delta 波可时有时无。'
        ]
      },
      periop:{
        timing:'无症状的预激图形一般不单独推迟手术；有心悸、晕厥或心动过速发作史者，择期手术前建议先请心内科评估。',
        anesthesia:'告知麻醉团队旁路情况，避免交感过度兴奋，备好同步电复律设备。预激合并房颤时，应避免使用主要阻断房室结的药物（如腺苷、β 受体阻滞剂、非二氢吡啶类钙通道阻滞剂、地高辛），以免加快旁路传导。',
        postoperative:'术后新发心悸要尽快记录心电图，区分顺向型折返性心动过速与预激合并房颤，二者处理不同。',
        consultation:'宽 QRS、不规则、极快心率疑似预激合并房颤时，立即启动急救流程（不稳定时同步电复律）并请心内科会诊；有症状的预激患者择期请心内科评估是否消融。'
      },
      references:[{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],
      updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'brugada',title:'Brugada 图形',category:'arrhythmias',risk:'high',
      aliases:['Brugada','布鲁加达','Brugada综合征','穹窿形ST抬高','钠通道病'],
      basic:{
        summary:'右胸导联穹窿形 ST 段抬高伴 T 波倒置（1 型）具有诊断意义；发热和部分药物可诱发或加重，与猝死风险相关。',
        criteria:[['1 型（诊断性）','V1–V2（可置于第 2–4 肋间）≥1 个导联穹窿形 ST 抬高 ≥2 mm，伴 T 波倒置'],['2 型','马鞍形 ST 抬高，单独不能诊断']],
        diagram:{kind:'brugada',caption:'1 型 Brugada 图形教学示意：V1 导联穹窿形（下斜型）ST 段抬高，随后 T 波倒置。'},
        diagnosticPoints:[
          '1 型（穹窿形）：V1–V2 中至少 1 个导联（可放在第 2、3 或 4 肋间）J 点/ST 段抬高 ≥2 mm，呈下斜型，随后 T 波倒置。只有 1 型具有诊断意义。',
          '2 型（马鞍形）ST 抬高本身不能确诊，需要专科进一步评估。',
          '图形可间歇出现；发热、钠通道阻滞药物、迷走张力增高等可使其显现或加重。'
        ],
        differentialPoints:[
          '右束支阻滞、早期复极、致心律失常性右室心肌病、急性前间壁心肌梗死、高钾血症、漏斗胸以及 V1–V2 电极位置过高均可产生类似图形。',
          '与右束支阻滞不同，Brugada 图形的 ST 抬高位于右胸导联，且 I、V6 导联常没有宽钝的 S 波。'
        ]
      },
      periop:{
        timing:'术前新发现 1 型图形或有晕厥、猝死家族史者，择期手术前应请心内科评估；已植入 ICD 的患者按器械流程准备。',
        anesthesia:'告知麻醉团队：及时控制发热；尽量避免已知可能诱发 Brugada 图形的药物（部分钠通道阻滞剂、某些局部麻醉药的大剂量使用等，请麻醉科结合专门的药物清单判断）；术中持续心电监护并贴好体外除颤电极。',
        postoperative:'术后发热要积极退热，持续监护右胸导联变化；出现晕厥、室性心律失常时立即处理。',
        consultation:'1 型图形、伴晕厥或室性心律失常、有猝死家族史时请心内科会诊；发生室颤或多形性室速时按心脏骤停流程处理。'
      },
      references:[{title:'2022 ESC Guidelines for the management of patients with ventricular arrhythmias and the prevention of sudden cardiac death · Eur Heart J 2022',url:'https://doi.org/10.1093/eurheartj/ehac262'},{title:'J-Wave syndromes expert consensus conference report: emerging concepts and gaps in knowledge · Heart Rhythm 2016',url:'https://pubmed.ncbi.nlm.nih.gov/27423412/'}],
      updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'acute-pericarditis',title:'急性心包炎',category:'ischemia',risk:'medium',
      aliases:['心包炎','pericarditis','广泛ST抬高','PR压低','PR 压低','心包积液'],
      related:['st-elevation-differential','early-repolarization','stemi'],
      basic:{
        summary:'多数导联凹面向上的 ST 段抬高伴 PR 段压低，aVR 导联相反；是 ST 抬高的重要鉴别诊断。',
        criteria:[['ST 段','广泛凹面向上抬高，不按冠脉供血区分布'],['PR 段','压低（aVR 导联抬高）'],['对应性压低','除 aVR、V1 外一般没有'],['Q 波','通常不出现']],
        diagram:{kind:'pericarditis',caption:'急性心包炎教学示意：II 导联 ST 段凹面抬高并 PR 段压低；aVR 导联 ST 段压低、PR 段抬高。'},
        diagnosticPoints:[
          '广泛、不按冠脉供血区分布的凹面向上 ST 段抬高；aVR（有时 V1）导联 ST 段压低。',
          'PR 段压低（aVR 导联 PR 段抬高）是较有特点的表现；通常没有病理性 Q 波，除 aVR、V1 外一般无对应性 ST 压低。',
          '心电图可随病程演变（ST 抬高 → 恢复 → T 波倒置 → 恢复），且并非所有患者都有典型改变。低电压或电交替提示可能存在较多心包积液。'
        ],
        differentialPoints:[
          '急性 ST 段抬高型心肌梗死：ST 抬高常呈凸面、局限于某一供血区、有对应性压低，可出现 Q 波，且多有肌钙蛋白显著升高和室壁运动异常。',
          '早期复极：多见于年轻人，ST 抬高相对稳定，PR 段压低不明显；V6 导联 ST 抬高幅度与 T 波振幅之比较小也支持早期复极。'
        ]
      },
      periop:{
        timing:'急性心包炎期间，择期手术一般应推迟至炎症控制；伴心包积液时需评估积液量和血流动力学影响。',
        anesthesia:'告知麻醉团队有无心包积液。较多积液或心包填塞时，麻醉诱导、正压通气和血容量下降可导致循环骤然衰竭，需要专门的麻醉计划。',
        postoperative:'术后胸痛伴广泛 ST 抬高时，仍需首先排除急性心肌梗死；心脏手术后的心包切开术后综合征也可出现类似表现。',
        consultation:'胸痛伴 ST 抬高、诊断不明确时立即请心内科评估；怀疑心包填塞（低血压、颈静脉怒张、奇脉）时立即启动急救并联系相关专科。'
      },
      references:[{title:'2015 ESC Guidelines for the diagnosis and management of pericardial diseases · Eur Heart J 2015',url:'https://pubmed.ncbi.nlm.nih.gov/26320112/'},{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'}],
      updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'early-repolarization',title:'早期复极',category:'ischemia',risk:'low',
      aliases:['早复极','早期复极综合征','J点抬高','J 点抬高','J波','ER','良性早期复极'],
      related:['st-elevation-differential','acute-pericarditis','brugada'],
      basic:{
        summary:'下壁或侧壁导联 QRS 终末部切迹或顿挫、J 点抬高，多见于年轻人和运动员；通常为良性，但需与急性心肌梗死和心包炎鉴别。',
        criteria:[['J 点','下壁和/或侧壁 ≥2 个相邻导联抬高 ≥1 mm'],['形态','QRS 终末部切迹或顿挫'],['早期复极综合征','仅指伴不明原因室颤/心脏骤停者']],
        diagram:{kind:'early-repolarization',caption:'早期复极教学示意：V4 导联 QRS 终末部 J 点切迹，ST 段凹面向上轻度抬高，T 波高大。'},
        diagnosticPoints:[
          '早期复极图形：在下壁和/或侧壁至少 2 个相邻导联中，QRS 终末部出现切迹或顿挫，J 点抬高 ≥1 mm。',
          'ST 段多呈凹面向上抬高，常伴高大 T 波；心率增快时可减轻，与旧图相比通常长期稳定。',
          '“早期复极综合征”专指有不明原因室颤或心脏骤停史的患者，绝大多数早期复极图形者没有心律失常风险。'
        ],
        differentialPoints:[
          '急性心肌梗死：ST 抬高动态变化，有对应性压低、Q 波形成或缺血症状；不能确定时复查心电图并查肌钙蛋白。',
          '急性心包炎：分布更广泛，伴 PR 段压低；Brugada 图形局限于右胸导联；高钾血症也可出现 ST-T 改变。'
        ]
      },
      periop:{
        timing:'无症状的早期复极图形不需推迟手术。有晕厥、心脏骤停史或猝死家族史时，择期手术前请心内科评估。',
        anesthesia:'告知麻醉团队术前已有 ST 抬高，避免术中监护时误判为急性缺血；保留术前 12 导联心电图作对比。',
        postoperative:'术后胸痛时，将当前心电图与术前心电图仔细对比，新发或动态变化的 ST 改变仍需按急性冠脉综合征评估。',
        consultation:'ST 抬高与旧图不同、伴胸痛或肌钙蛋白升高，或有室性心律失常、晕厥史时请心内科会诊。'
      },
      references:[{title:'J-Wave syndromes expert consensus conference report: emerging concepts and gaps in knowledge · Heart Rhythm 2016',url:'https://pubmed.ncbi.nlm.nih.gov/27423412/'},{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'}],
      updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'left-anterior-fascicular-block',title:'左前分支阻滞与双分支阻滞',category:'conduction',risk:'low',
      aliases:['左前分支阻滞','LAFB','LAHB','左前半阻滞','双分支阻滞','三分支阻滞','电轴左偏','分支阻滞'],
      basic:{
        summary:'电轴显著左偏（−45° 至 −90°）、I 和 aVL 呈 qR、下壁导联呈 rS；合并右束支阻滞即为双分支阻滞。',
        criteria:[['额面电轴','−45° 至 −90°'],['I、aVL','qR'],['II、III、aVF','rS'],['QRS','<120 ms（单纯分支阻滞）']],
        diagram:{kind:'lafb',caption:'左前分支阻滞教学示意：I 导联以 R 波为主（qR），aVF 导联以深 S 波为主（rS），电轴显著左偏。'},
        diagnosticPoints:[
          '左前分支阻滞：额面电轴 −45° 至 −90°；I、aVL 呈 qR；II、III、aVF 呈 rS；QRS 时限 <120 ms（单纯分支阻滞时）。',
          '双分支阻滞：右束支阻滞合并左前分支阻滞（较常见）或左后分支阻滞。',
          '双分支阻滞合并一度房室阻滞过去常被称为“三分支阻滞”，但 PR 延长不一定来自希浦系统，该名称现已不推荐作为诊断。'
        ],
        differentialPoints:[
          '下壁心肌梗死：II、III、aVF 呈 Q 波（QS 或 Qr），而不是以小 r 波开始的 rS。',
          '左后分支阻滞表现为电轴右偏（约 +90° 至 +180°），诊断前需先排除右心室肥厚、肺部疾病和体型因素等更常见的原因。'
        ]
      },
      periop:{
        timing:'无症状的单纯左前分支阻滞或双分支阻滞，一般不需推迟手术，也通常不需要术前预防性植入起搏器。有晕厥史时，择期手术前应评估是否存在间歇性高度房室阻滞。',
        anesthesia:'告知麻醉团队；双分支阻滞患者应备好经皮起搏，留意迷走反射和减慢传导的药物。若已有完全性左束支阻滞，右心导管（如肺动脉导管）操作诱发右束支阻滞时可导致完全性房室阻滞。',
        postoperative:'术后监护中出现新发房室阻滞、心动过缓或晕厥时，复查 12 导联心电图并评估药物、电解质和缺血因素。',
        consultation:'双分支阻滞伴晕厥、新发房室阻滞或心动过缓症状时请心内科会诊，评估是否需要起搏。'
      },
      references:[{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part III：室内传导障碍（2009）',url:'https://pubmed.ncbi.nlm.nih.gov/19281930/'},{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],
      updatedAt:'2026-10-11',reviewStatus:'待审核'
    },
    {
      id:'mobitz-i',title:'二度 I 型房室传导阻滞（文氏）',category:'conduction',risk:'low',
      aliases:['文氏','文氏阻滞','Wenckebach','莫氏I型','Mobitz I','二度I型','二度一型'],
      related:['second-degree-av-block','mobitz-ii','av-block-2-1','first-degree-av-block'],
      basic:{
        summary:'PR 逐搏延长直至 1 个 P 波未下传，阻滞多位于房室结，通常较良性。',
        criteria:[['P-P 间期','规则（窦性）'],['PR 间期','逐搏延长，直至 1 个 P 波后 QRS 脱落'],['脱落后','第一个 PR 最短，周期重复'],['RR 间期','逐渐缩短；含脱落的长 RR < 2 个 P-P 间期'],['QRS','多为窄 QRS']],
        diagram:{kind:'mobitz-i',caption:'文氏阻滞教学示意：P-P 规则，PR 逐搏延长后第 4 个 P 波未下传。'},
        diagnosticPoints:[
          '先确认 P 波规则出现，再逐个测量 PR：PR 逐渐延长，直到一个 P 波后没有 QRS，脱落后的 PR 回到最短。',
          '心室搏动呈“成组”出现（成组搏动）；典型周期中 PR 增量逐渐减小，RR 间期逐渐缩短。',
          '常见于迷走张力增高（睡眠、运动员）、下壁心肌缺血/梗死和减慢房室结传导的药物；QRS 窄时阻滞多在房室结。'
        ],
        differentialPoints:[
          '莫氏 II 型：PR 固定不变后突然脱落；不能确定时，比较脱落前后 PR 是否相同。',
          '未下传的房性早搏：脱落的 P 波提前出现、形态不同，P-P 间期不规则。'
        ]
      },
      periop:{
        timing:'无症状、窄 QRS 的文氏阻滞通常不需推迟手术；伴头晕、晕厥或宽 QRS 时，择期手术前请心内科评估。',
        anesthesia:'告知麻醉团队；注意迷走反射和减慢房室结传导的药物（β 受体阻滞剂、非二氢吡啶类钙通道阻滞剂、地高辛、右美托咪定等）。',
        postoperative:'睡眠中出现的文氏阻滞多为生理性；新发且伴下壁缺血表现时，需评估心肌缺血。',
        consultation:'进展为莫氏 II 型、高度或三度阻滞，或伴症状性心动过缓时请心内科会诊。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'mobitz-ii',title:'二度 II 型房室传导阻滞（莫氏 II 型）',category:'conduction',risk:'high',
      aliases:['莫氏II型','莫氏2型','Mobitz II','二度II型','二度二型','莫氏'],
      related:['second-degree-av-block','mobitz-i','av-block-2-1','high-grade-av-block','complete-heart-block'],
      basic:{
        summary:'PR 固定，突然出现未下传的 P 波；阻滞多位于希浦系统，易进展为完全性阻滞，属于高危。',
        criteria:[['P-P 间期','规则'],['PR 间期','下传搏动的 PR 固定不变（脱落前后相同）'],['脱落','突然出现 P 波后无 QRS'],['QRS','常增宽（合并束支阻滞），提示希浦系统病变']],
        diagram:{kind:'mobitz-ii',caption:'莫氏 II 型教学示意：PR 固定，第 3 个 P 波突然未下传；QRS 增宽。'},
        diagnosticPoints:[
          '下传搏动的 PR 固定（可以正常或延长），脱落前后的 PR 相同，是与文氏型区分的关键。',
          '常合并束支或分支阻滞（宽 QRS），阻滞部位多在希氏束或其以下，可突然进展为高度或三度房室阻滞。',
          '常见原因：传导系统退行性病变、前壁心肌梗死、心脏瓣膜手术后、浸润性心肌病等。'
        ],
        differentialPoints:[
          '文氏型：PR 逐搏延长后脱落，脱落后 PR 缩短。',
          '未下传的房性早搏和窦性停搏：前者 P 波提前出现，后者 P 波本身消失，均不是真正的二度房室阻滞。'
        ]
      },
      periop:{
        timing:'择期手术应推迟，先请心内科评估，多数患者需要植入永久起搏器；急诊手术需在临时或经皮起搏保障下进行。',
        anesthesia:'告知麻醉团队，术前贴好经皮起搏电极并测试，必要时放置临时起搏；避免减慢传导的药物，备好正性变时药物。',
        postoperative:'持续心电监护，警惕进展为高度或三度房室阻滞；纠正高钾、缺血等可逆因素。',
        consultation:'一经发现即请心内科会诊；伴晕厥、低血压或心衰时按急救流程处理并准备起搏。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'av-block-2-1',title:'2:1 房室传导阻滞',category:'conduction',risk:'high',
      aliases:['2:1房室阻滞','2:1阻滞','二比一房室传导阻滞','2比1'],
      related:['second-degree-av-block','mobitz-i','mobitz-ii','high-grade-av-block'],
      basic:{
        summary:'每 2 个 P 波下传 1 个，无法凭此判断是文氏型还是莫氏 II 型；在明确阻滞部位前按高风险处理。',
        criteria:[['P-P 间期','规则'],['传导比例','固定 2:1，每隔 1 个 P 波脱落 1 次'],['下传 PR','固定'],['分型','连续下传搏动不足 2 个，不能确定 I 型或 II 型']],
        diagram:{kind:'av-block-2-1',caption:'2:1 房室传导阻滞教学示意：P 波规则，每 2 个 P 波只有 1 个下传。'},
        diagnosticPoints:[
          '仔细寻找“藏在” T 波中或 T 波后的未下传 P 波；漏看时容易误判为窦性心动过缓。',
          '支持阻滞在房室结（较良性）：QRS 窄、下传 PR 延长、长时程记录中可见文氏周期、阿托品或运动后传导改善。',
          '支持希浦系统阻滞（高危）：QRS 宽（束支阻滞）、下传 PR 正常、阿托品后阻滞加重。'
        ],
        differentialPoints:[
          '未下传的房性早搏二联律：未下传的 P 波提前出现，P-P 间期不等。',
          '窦性心动过缓：没有额外的 P 波；比较 T 波形态有无“切迹”可帮助发现隐藏的 P 波。'
        ]
      },
      periop:{
        timing:'择期手术前请心内科明确阻滞部位；宽 QRS 或有症状者通常需先处理（常需起搏）。',
        anesthesia:'按高风险准备：贴好经皮起搏电极，避免减慢传导的药物，备好正性变时药物和临时起搏方案。',
        postoperative:'延长心电监护，观察是否出现文氏周期（倾向良性）或进展为高度/三度阻滞（高危）。',
        consultation:'发现 2:1 阻滞即请心内科会诊；伴症状、宽 QRS 或血流动力学不稳定时紧急处理。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'high-grade-av-block',title:'高度房室传导阻滞',category:'conduction',risk:'high',
      aliases:['高度房室阻滞','高度阻滞','3:1房室阻滞','进展型房室阻滞','high-grade AV block'],
      related:['second-degree-av-block','mobitz-ii','av-block-2-1','complete-heart-block'],
      basic:{
        summary:'连续 2 个或以上 P 波未下传，但仍有部分 P 波下传；介于二度与三度之间，风险高。',
        criteria:[['P-P 间期','规则'],['未下传','连续 ≥2 个 P 波（如 3:1、4:1）'],['下传搏动','仍存在，且下传 PR 固定'],['与三度区别','三度阻滞时没有任何 P 波下传']],
        diagram:{kind:'high-grade-av-block',caption:'高度房室传导阻滞教学示意：连续 2 个 P 波未下传（3:1），下传 PR 固定。'},
        diagnosticPoints:[
          '计数 P 波与 QRS 的比例：3:1、4:1 或更高比例的传导，仍可见固定 PR 的下传搏动。',
          '长间歇中可出现交界性或室性逸搏；逸搏可能使图形类似三度阻滞，需长条记录鉴别。',
          '与莫氏 II 型同样多为希浦系统病变，易进展为完全性房室阻滞或心脏停搏。'
        ],
        differentialPoints:[
          '三度房室阻滞：PR 不断变化、P 与 QRS 完全无关，没有真正下传的搏动。',
          '迷走张力极高时也可出现短暂高比例阻滞（常伴窦性减慢），但仍需排除器质性病因。'
        ]
      },
      periop:{
        timing:'择期手术必须推迟，先评估并处理（多数需要起搏）；急诊手术在起搏保障下进行。',
        anesthesia:'术前贴好经皮起搏电极并测试，必要时放置临时起搏；避免减慢心率和传导的药物。',
        postoperative:'持续监护，评估可逆因素（药物、高钾、缺血），明确是否需永久起搏。',
        consultation:'立即请心内科会诊；伴晕厥、低血压或意识改变时按急救流程处理并经皮起搏。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'sinus-node-dysfunction',title:'窦房结功能障碍（窦性停搏）',category:'arrhythmias',risk:'medium',
      aliases:['病态窦房结综合征','病窦','SSS','窦性停搏','窦性暂停','窦房阻滞','快慢综合征','sinus pause'],
      related:['sinus-bradycardia','junctional-rhythm','atrial-fibrillation'],
      basic:{
        summary:'窦性心动过缓、窦性停搏、窦房阻滞或快慢综合征，与症状相关时才构成需要干预的窦房结功能障碍。',
        criteria:[['窦性停搏','长间歇内无 P 波，长间歇不是 P-P 间期的整数倍'],['二度窦房阻滞','长间歇为基础 P-P 间期的整数倍（常为 2 倍）'],['快慢综合征','房颤/房扑等快速心律终止后出现长间歇'],['关键','心电图异常与症状（头晕、晕厥）的对应关系']],
        diagram:{kind:'sinus-node-dysfunction',caption:'窦性停搏教学示意：前两个窦性搏动后出现长间歇，其间没有 P 波。'},
        diagnosticPoints:[
          '表现可包括持续性窦性心动过缓、窦性停搏/窦房阻滞、变时功能不全，以及房性快速心律失常与心动过缓交替（快慢综合征）。',
          '常见于老年人和传导系统退行性病变；药物（β 受体阻滞剂、钙通道阻滞剂、抗心律失常药）、甲状腺功能减退、低体温、高钾等可逆因素需先排除。',
          '睡眠或迷走张力高时出现的短暂停搏可为生理性；清醒状态下的长间歇（常以 ≥3 秒作为需重视的参考）意义更大。'
        ],
        differentialPoints:[
          '未下传的房性早搏：长间歇前的 T 波中可见提前出现的 P 波。',
          '二度房室阻滞：P 波存在但不下传；窦房结功能障碍时 P 波本身缺失。'
        ]
      },
      periop:{
        timing:'无症状的窦性心动过缓通常不需推迟手术；有晕厥、症状性长间歇或快慢综合征者，择期手术前请心内科评估是否需起搏。',
        anesthesia:'告知麻醉团队；麻醉药物、椎管内阻滞和迷走反射可加重心动过缓或停搏，需备好正性变时药物和经皮起搏。',
        postoperative:'复核术后新用药（β 受体阻滞剂、右美托咪定、阿片类等）、电解质和体温；快慢综合征患者控制房颤心室率时需警惕停搏。',
        consultation:'症状性心动过缓、清醒时长间歇、晕厥或需要同时处理快速心律失常时请心内科会诊。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'anterior-stemi',title:'前壁 ST 段抬高型心肌梗死',category:'ischemia',risk:'high',
      aliases:['前壁心梗','前间壁心梗','广泛前壁心梗','前壁STEMI','前降支','LAD闭塞'],
      related:['stemi','de-winter','wellens','st-elevation-differential','left-bundle-branch-block'],
      basic:{
        summary:'胸前导联（V1–V4，广泛前壁可至 V5–V6、I、aVL）ST 段抬高，多为左前降支闭塞，范围大、风险高。',
        criteria:[['前间壁','V1–V2（可至 V3）'],['前壁','V3–V4'],['广泛前壁','V1–V6，常累及 I、aVL'],['抬高幅度','V2–V3：男 ≥40 岁 ≥2 mm，男 <40 岁 ≥2.5 mm，女 ≥1.5 mm；其余导联 ≥1 mm'],['对应性改变','下壁导联 ST 压低（近段闭塞时更明显）']],
        diagram:{kind:'anterior-stemi',caption:'前壁 ST 段抬高教学示意：V2、V3 导联 ST 段明显抬高并与 T 波融合。'},
        diagnosticPoints:[
          '胸前相邻导联新发 ST 段抬高，可伴 R 波振幅降低或 Q 波形成；超急性期可仅见宽大高耸的 T 波。',
          '同时累及 I、aVL 并伴下壁导联对应性压低，提示前降支近段（第一对角支以上）闭塞，梗死范围更大。',
          '新发右束支阻滞或左前分支阻滞合并前壁 ST 抬高，提示近段闭塞、风险更高。'
        ],
        differentialPoints:[
          '左心室肥厚、左束支阻滞、早期复极、Brugada 图形、室壁瘤（陈旧性前壁心梗后持续 ST 抬高）都可在胸前导联出现 ST 抬高。',
          'V1–V3 少量 ST 抬高可见于健康年轻男性；判断时严格按年龄、性别阈值，并结合症状和动态变化。'
        ]
      },
      periop:{
        timing:'择期手术立即暂停；急诊再灌注优先于非急诊手术。',
        anesthesia:'若必须急诊手术，告知麻醉团队梗死范围与心功能；前壁大面积梗死易合并心衰、心源性休克和室性心律失常，需备好除颤和循环支持。',
        postoperative:'术后新发前壁 ST 抬高按 STEMI 处理，同时评估出血风险与抗栓治疗的平衡。',
        consultation:'立即联系心内科，按胸痛中心流程评估急诊冠脉造影。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'inferior-stemi',title:'下壁 ST 段抬高型心肌梗死',category:'ischemia',risk:'high',
      aliases:['下壁心梗','下壁STEMI','右冠闭塞','回旋支闭塞','II III aVF'],
      related:['stemi','rv-infarction','posterior-mi','st-elevation-differential','mobitz-i','complete-heart-block'],
      basic:{
        summary:'II、III、aVF 导联 ST 段抬高，常伴 aVL 对应性压低；须常规加做右胸导联和后壁导联，并警惕心动过缓和房室阻滞。',
        criteria:[['导联','II、III、aVF 中 ≥2 个导联 ST 抬高 ≥1 mm'],['对应性改变','aVL（常有 I）ST 压低'],['提示右冠','III 抬高 > II；合并 V1 抬高或 V4R 抬高（右室受累）'],['提示回旋支','II 抬高 ≥ III；I、aVL、V5–V6 抬高或 V1–V3 压低（后壁受累）']],
        diagram:{kind:'inferior-stemi',caption:'下壁 ST 段抬高教学示意：III 导联 ST 段抬高，aVL 导联对应性压低。'},
        diagnosticPoints:[
          'aVL 导联的对应性 ST 压低是早期、敏感的线索，可早于下壁导联明显抬高出现。',
          '下壁 STEMI 时应加做 V4R（评估右室梗死）和 V7–V9（评估后壁梗死），这两者都会改变处理策略。',
          '下壁梗死常伴窦性心动过缓、文氏阻滞或三度房室阻滞（多为房室结水平，常可恢复）。'
        ],
        differentialPoints:[
          '急性心包炎：广泛 ST 抬高伴 PR 压低，aVL 通常无对应性压低。',
          '早期复极也可出现下壁导联 J 点抬高，但无动态变化、无对应性压低。'
        ]
      },
      periop:{
        timing:'择期手术立即暂停，按 STEMI 流程处理。',
        anesthesia:'合并右室梗死时患者依赖前负荷，硝酸酯类、利尿剂、椎管内麻醉和正压通气可引起严重低血压；同时警惕心动过缓和房室阻滞。',
        postoperative:'监测心率、房室传导和血压；新发房室阻滞需持续监护并准备起搏。',
        consultation:'立即联系心内科，按胸痛中心流程评估急诊再灌注。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'lateral-stemi',title:'侧壁 ST 段抬高型心肌梗死',category:'ischemia',risk:'high',
      aliases:['侧壁心梗','高侧壁心梗','侧壁STEMI','对角支','回旋支','I aVL'],
      related:['stemi','anterior-stemi','inferior-stemi','posterior-mi'],
      basic:{
        summary:'I、aVL（高侧壁）和/或 V5–V6（低侧壁）ST 段抬高；高侧壁抬高幅度常较小，容易漏诊。',
        criteria:[['高侧壁','I、aVL ST 抬高 ≥1 mm'],['低侧壁','V5–V6 ST 抬高 ≥1 mm'],['对应性改变','III、aVF ST 压低'],['常见血管','对角支、钝缘支或回旋支']],
        diagram:{kind:'lateral-stemi',caption:'侧壁 ST 段抬高教学示意：aVL 导联 ST 段抬高，III 导联对应性压低。'},
        diagnosticPoints:[
          'I、aVL 的 QRS 振幅较低，ST 抬高幅度可能只有 1 mm 左右；下壁导联出现对应性压低时应高度怀疑。',
          '回旋支闭塞时心电图可能表现不明显（“电静默区”），需结合症状、超声和肌钙蛋白，必要时加做后壁导联。',
          '与前壁或下壁抬高同时出现时，提示梗死范围较大。'
        ],
        differentialPoints:[
          '左心室肥厚和左束支阻滞可在侧壁导联出现继发性 ST-T 改变，但 ST 改变多与主波方向相反。',
          '急性心包炎为广泛 ST 抬高伴 PR 压低，无下壁导联对应性压低。'
        ]
      },
      periop:{
        timing:'择期手术立即暂停，按 STEMI 流程处理。',
        anesthesia:'若需急诊手术，告知麻醉团队梗死范围与心功能，避免心动过速和低血压。',
        postoperative:'术后胸痛或血流动力学变化时，注意侧壁导联细微 ST 抬高及下壁对应性压低。',
        consultation:'立即联系心内科，按胸痛中心流程评估急诊再灌注；同时请手术团队评估抗栓治疗的出血风险。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'posterior-mi',title:'后壁心肌梗死',category:'ischemia',risk:'high',
      aliases:['后壁心梗','正后壁心梗','后壁STEMI','V7-V9','V1-V3压低','下侧壁'],
      related:['stemi','inferior-stemi','lateral-stemi','nste-ischemia'],
      basic:{
        summary:'常规 12 导联上表现为 V1–V3 ST 段压低伴高 R 波和直立 T 波（镜像改变）；加做 V7–V9 见 ST 抬高可确认。',
        criteria:[['V1–V3','水平型 ST 压低，常伴 R 波增高（R/S >1）和直立 T 波'],['V7–V9','ST 抬高 ≥0.5 mm（男性 <40 岁 ≥1 mm）'],['常伴随','下壁和/或侧壁 ST 抬高'],['处理意义','孤立后壁梗死属于 STEMI 等危，需紧急再灌注评估']],
        diagram:{kind:'posterior-mi',caption:'后壁心肌梗死教学示意：V2 导联 R 波增高、ST 段水平压低、T 波直立；V8 导联 ST 段抬高。'},
        diagnosticPoints:[
          '前壁导联的 ST 压低，是后壁 ST 抬高的“镜像”：把 V1–V3 图形上下翻转，可看到 Q 波、ST 抬高和 T 波倒置。',
          '胸痛伴 V1–V3 明显 ST 压低时，应加做 V7–V9（左腋后线、肩胛线、脊柱旁线，与 V6 同一水平）。',
          '孤立后壁梗死容易被误判为非 ST 抬高型心梗而延误再灌注。'
        ],
        differentialPoints:[
          '前壁心内膜下缺血：ST 压低常伴 T 波倒置，V7–V9 无 ST 抬高。',
          'V1 高 R 波还见于右心室肥厚、右束支阻滞、预激综合征和电极位置错误。'
        ]
      },
      periop:{
        timing:'择期手术立即暂停，按 STEMI 等危处理。',
        anesthesia:'告知麻醉团队梗死部位与心功能；常合并下壁或侧壁梗死，注意心动过缓与血流动力学变化。',
        postoperative:'术后胸痛伴 V1–V3 ST 压低时，不要只按“心肌缺血”观察，需加做后壁导联。',
        consultation:'立即联系心内科评估急诊冠脉造影；加做 V7–V9 的结果应一并告知，避免按非 ST 抬高型心梗延误。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'rv-infarction',title:'右心室梗死',category:'ischemia',risk:'high',
      aliases:['右室心梗','右室梗死','V4R','右胸导联','RV infarction'],
      related:['inferior-stemi','stemi','right-ventricular-hypertrophy'],
      basic:{
        summary:'多合并下壁 STEMI；右胸导联 V4R ST 抬高是最有价值的心电图线索，患者对前负荷高度依赖。',
        criteria:[['V3R–V4R','ST 抬高 ≥0.5 mm（男性 <30 岁 ≥1 mm）'],['V4R 时机','发病早期最敏感，数小时后可消失'],['提示线索','下壁 STEMI 时 III 抬高 > II，V1 ST 抬高'],['临床三联征','低血压、颈静脉怒张、肺部清晰']],
        diagram:{kind:'rv-infarction',caption:'右心室梗死教学示意：右胸导联 V4R 的 ST 段抬高。'},
        diagnosticPoints:[
          '所有下壁 STEMI 都应尽早加做右胸导联（V4R 位于右侧锁骨中线第 5 肋间）。',
          'V1 导联 ST 抬高（尤其 V1 抬高而 V2 压低）伴下壁抬高，提示右室受累。',
          '右室梗死常伴心动过缓、房室阻滞和低血压。'
        ],
        differentialPoints:[
          '急性肺栓塞也可出现右胸导联 ST-T 改变和低血压，但通常无下壁 ST 抬高。',
          '前间壁梗死也有 V1 抬高，但 V1–V3 同步抬高且无下壁抬高。'
        ]
      },
      periop:{
        timing:'择期手术立即暂停，按 STEMI 流程处理。',
        anesthesia:'右室梗死患者依赖前负荷：避免硝酸酯类、利尿剂和过度镇静；椎管内麻醉、正压通气和低血容量都可能导致严重低血压。',
        postoperative:'低血压时优先评估容量状态，监测心率与房室传导，警惕心动过缓。',
        consultation:'立即联系心内科；伴低血压或休克时同时联系重症团队。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'lbbb-paced-mi',title:'左束支阻滞或心室起搏时的急性心肌梗死',category:'ischemia',risk:'high',
      aliases:['Sgarbossa','Sgarbossa标准','改良Sgarbossa','Smith改良','左束支阻滞心梗','起搏心梗','LBBB MI'],
      related:['left-bundle-branch-block','ventricular-pacing','stemi','st-elevation-differential'],
      basic:{
        summary:'左束支阻滞和心室起搏会使常规 ST 标准失效；用 Sgarbossa（及改良）标准寻找与 QRS 主波方向“同向”的 ST 改变。',
        criteria:[['同向 ST 抬高','QRS 主波向上的导联中 ST 抬高 ≥1 mm（特异性最高）'],['同向 ST 压低','V1–V3 中 ST 压低 ≥1 mm'],['不成比例的反向抬高','原始标准：QRS 主波向下导联 ST 抬高 ≥5 mm；改良（Smith）：ST 抬高幅度 / 前方 S 波深度 ≥0.25（不同研究阈值略有差异）'],['临床原则','症状提示持续缺血时，即使心电图不典型也应紧急评估']],
        diagram:{kind:'lbbb-mi',caption:'左束支阻滞背景下急性心肌梗死教学示意：V5 导联主波向上，ST 段同向抬高。'},
        diagnosticPoints:[
          '左束支阻滞或右室起搏时，ST-T 本应与 QRS 主波方向相反（不一致）；出现“同向”的 ST 抬高或压低提示急性梗死。',
          '与旧图对比价值很大：既往已存在的左束支阻滞并不等于新发 STEMI，但持续缺血症状的患者不应因此延误评估。',
          '这些标准特异性较高、敏感性有限；阴性结果不能排除心肌梗死，需结合肌钙蛋白和临床。'
        ],
        differentialPoints:[
          '高钾血症、药物毒性等也可改变宽 QRS 的 ST-T 形态。',
          '心室起搏时需先确认起搏夺获正常；间歇起搏后可出现“记忆性” T 波倒置，不代表缺血。'
        ]
      },
      periop:{
        timing:'怀疑急性心肌梗死时择期手术立即暂停；已知左束支阻滞或起搏的患者，术前应保存一份基线 12 导联心电图供对比。',
        anesthesia:'左束支阻滞或起搏患者术中 ST 监测价值有限，应结合血流动力学、超声和肌钙蛋白；起搏器患者按器械流程管理。',
        postoperative:'术后胸痛或不明原因低血压时，结合 Sgarbossa 标准、旧图对比和肌钙蛋白动态评估。',
        consultation:'满足同向 ST 改变或临床高度怀疑时立即联系心内科。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'de-winter',title:'de Winter T 波',category:'ischemia',risk:'high',
      aliases:['de Winter','德温特','上斜型ST压低','高尖T波','STEMI等危','前降支近段'],
      related:['anterior-stemi','stemi','wellens','nste-ischemia'],
      basic:{
        summary:'胸前导联 J 点压低伴上斜型 ST 压低、接续高大对称 T 波，无 ST 抬高；提示前降支近段急性闭塞，属 STEMI 等危。',
        criteria:[['胸前导联','V1–V6 J 点压低 1–3 mm，ST 段上斜型压低'],['T 波','高大、对称、宽基'],['aVR','常有轻度 ST 抬高（约 1–2 mm）'],['特点','无明显 ST 抬高，形态可持续存在']],
        diagram:{kind:'de-winter',caption:'de Winter T 波教学示意：V3 导联 J 点压低、ST 段上斜型压低，接续高大对称的 T 波。'},
        diagnosticPoints:[
          '胸痛患者胸前导联出现“上斜型 ST 压低 + 高大 T 波”，不能因为没有 ST 抬高而按非 ST 抬高处理。',
          '原始报道认为该形态可在闭塞期间持续，并不一定演变为典型 ST 抬高。',
          '需与超急性 T 波一起理解：二者都可能是急性冠脉闭塞的早期表现。'
        ],
        differentialPoints:[
          '高钾血症：T 波高尖但基底窄，常伴 P 波低平和 QRS 增宽，ST 段多无上斜型压低。',
          '早期复极和左室肥厚也可见高大 T 波，但无 J 点压低和胸痛的动态背景。'
        ]
      },
      periop:{
        timing:'择期手术立即暂停，按 STEMI 等危处理。',
        anesthesia:'若需急诊手术，按急性冠脉闭塞的高风险准备：告知麻醉团队，避免心动过速、低血压和贫血，备好除颤与循环支持。',
        postoperative:'术后胸痛时注意该形态，及时复查心电图并评估肌钙蛋白。',
        consultation:'立即联系心内科评估急诊冠脉造影；不要因为没有 ST 抬高而按非 ST 抬高型心梗等待。'
      },
      references:[{title:'A new ECG sign of proximal LAD occlusion（de Winter 等）· N Engl J Med 2008',url:'https://pubmed.ncbi.nlm.nih.gov/18987380/'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'wellens',title:'Wellens 综合征',category:'ischemia',risk:'high',
      aliases:['Wellens','韦伦斯','双向T波','深倒置T波','前降支近段狭窄'],
      related:['nste-ischemia','anterior-stemi','de-winter','t-wave-inversion'],
      basic:{
        summary:'胸痛缓解后 V2–V3 出现双向或深而对称的 T 波倒置，提示前降支近段严重狭窄，短期内有发生大面积前壁梗死的风险。',
        criteria:[['A 型','V2–V3 T 波正负双向'],['B 型','V2–V3（可至 V1–V6）T 波深而对称倒置'],['ST 段','无明显抬高（≤1 mm）'],['其他','胸前导联 R 波递增正常、无病理性 Q 波；常见于无痛期，心肌标志物可正常或轻度升高']],
        diagram:{kind:'wellens',caption:'Wellens 图形教学示意：上行为 A 型（T 波双向），下行为 B 型（深而对称的 T 波倒置）。'},
        diagnosticPoints:[
          '典型场景：有胸痛史，就诊时胸痛已缓解，心电图出现上述 T 波改变。',
          '发作胸痛时可能“伪正常化”（T 波转为直立或出现 ST 抬高），因此动态复查很重要。',
          'Wellens 图形患者不宜做负荷试验，因为可能诱发急性心肌梗死。'
        ],
        differentialPoints:[
          '持续幼年型 T 波、左室肥厚劳损、右心负荷（肺栓塞）、颅内病变、起搏后记忆性 T 波等也可导致胸前导联 T 波倒置。',
          '已演变的前壁心梗也有 T 波倒置，但常伴 Q 波和 R 波递增不良。'
        ]
      },
      periop:{
        timing:'择期手术应推迟，先完成心内科评估（通常需冠脉造影）。',
        anesthesia:'若需急诊手术，按严重冠脉病变的高风险准备，避免心动过速、低血压和贫血。',
        postoperative:'术后出现此类 T 波改变伴胸痛史时，及时复查心电图和肌钙蛋白。',
        consultation:'尽快请心内科会诊，评估早期冠脉造影；胸痛再发时立即复查心电图并按急性冠脉综合征处理。'
      },
      references:[{title:'StatPearls: Wellens Syndrome（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK482490/'},{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'old-mi',title:'陈旧性心肌梗死（病理性 Q 波）',category:'ischemia',risk:'medium',
      aliases:['陈旧性心梗','病理性Q波','Q波','QS波','既往心梗','室壁瘤'],
      related:['stemi','st-elevation-differential','left-bundle-branch-block'],
      basic:{
        summary:'相邻导联出现病理性 Q 波或 QS 波提示既往心肌梗死；术前心电图常见，对评估心功能和围手术期风险有意义。',
        criteria:[['V2–V3','任何 Q 波 >20 ms，或 QS 波'],['其余导联','同一导联组 ≥2 个相邻导联 Q 波 ≥30 ms 且深 ≥1 mm，或 QS 波'],['V1–V2 等位改变','R 波 >40 ms 且 R/S >1，伴直立 T 波（无传导障碍时提示陈旧性后壁梗死）'],['持续 ST 抬高','梗死后 ST 抬高持续数周以上，提示室壁瘤可能']],
        diagram:{kind:'old-mi',caption:'陈旧性心肌梗死教学示意：III 导联宽而深的 Q 波，伴 T 波倒置，ST 段回到基线。'},
        diagnosticPoints:[
          'III 导联单独的 Q 波、aVR 的 QS 波和 V1 的 QS 波可为正常表现，不能单独据此诊断。',
          '病理性 Q 波提示透壁性心肌坏死或瘢痕；结合超声心动图评估室壁运动和射血分数。',
          '与旧图对比可判断是否为新发 Q 波；新发 Q 波伴症状需排除近期心梗。'
        ],
        differentialPoints:[
          '肥厚型心肌病、预激综合征（负向 delta 波）、左束支阻滞、左前分支阻滞、慢性肺病和电极位置错误都可出现“假性 Q 波”。',
          '前壁 R 波递增不良也可见于胸前电极位置偏高、左室肥厚和肺气肿，不等于前壁梗死。'
        ]
      },
      periop:{
        timing:'既往心梗本身并非手术禁忌；近期（常以 60 天内为界）心梗者择期非心脏手术通常需推迟。新发 Q 波、心衰症状或活动耐量差时，术前完成评估。',
        anesthesia:'告知麻醉团队心梗时间、心功能、支架与抗血小板药物情况；维持心肌氧供需平衡。',
        postoperative:'基础 Q 波和 ST-T 改变会干扰术后缺血判断，务必保存术前心电图作对比。',
        consultation:'近期心梗、射血分数降低、心衰症状或抗血小板药物需要调整时请心内科会诊。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'st-elevation-differential',title:'ST 段抬高的鉴别思路',category:'ischemia',risk:'high',
      aliases:['ST抬高鉴别','ST 抬高','ST段抬高','STEMI鉴别','假性STEMI','STEMI mimics'],
      related:['stemi','acute-pericarditis','early-repolarization','left-ventricular-hypertrophy','left-bundle-branch-block','brugada','hyperkalemia','old-mi'],
      basic:{
        summary:'先按急性心梗处理思路排查，再系统考虑心包炎、早期复极、左室肥厚、束支阻滞、室壁瘤、Brugada 和高钾等原因。',
        criteria:[['支持急性心梗','按供血区分布、对应性压低、动态演变、凸面或水平型抬高、Q 波形成'],['支持心包炎','广泛分布、凹面向上、PR 段压低、无对应性压低（aVR 除外）'],['支持早期复极','J 点切迹/顿挫、年轻人、长期稳定、与旧图一致'],['继发性 ST 抬高','左束支阻滞、心室起搏、左室肥厚：ST 改变与 QRS 主波方向相反'],['其他','室壁瘤（陈旧 Q 波 + 持续抬高）、Brugada（右胸导联）、高钾、急性肺栓塞、应激性心肌病']],
        diagram:{kind:'stemi',caption:'ST 段抬高教学示意：II 导联 ST 段抬高，aVL 导联对应性压低（支持急性心梗的特征之一）。'},
        diagnosticPoints:[
          '第一步：有无持续胸痛或缺血等同症状；第二步：抬高是否按冠脉供血区分布、是否有对应性压低；第三步：与旧图对比并在 15–30 分钟内复查。',
          '对应性 ST 压低是区分急性心梗与其他原因最有用的特征之一。',
          '不能确定时按急性冠脉综合征处理更安全，并结合肌钙蛋白动态和床旁超声。'
        ],
        differentialPoints:[
          '应激性心肌病（Takotsubo）可酷似前壁 STEMI，需冠脉造影鉴别。',
          '心肌炎可出现 ST 抬高和肌钙蛋白升高，但分布常不符合单一冠脉。'
        ]
      },
      periop:{
        timing:'术前或术中发现 ST 抬高且原因不明时，择期手术暂停，先排除急性心梗。',
        anesthesia:'已知且稳定的 ST 抬高（如早期复极、室壁瘤）需在术前告知麻醉团队，避免术中误判。',
        postoperative:'术后 ST 抬高一律与术前心电图对比，并结合症状、血流动力学和肌钙蛋白判断。',
        consultation:'不能排除急性心梗时立即联系心内科，并尽快复查心电图、肌钙蛋白和床旁超声。'
      },
      references:[{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},{title:'2015 ESC Guidelines for the diagnosis and management of pericardial diseases · Eur Heart J 2015',url:'https://pubmed.ncbi.nlm.nih.gov/26320112/'},{title:'J-Wave syndromes expert consensus conference report: emerging concepts and gaps in knowledge · Heart Rhythm 2016',url:'https://pubmed.ncbi.nlm.nih.gov/27423412/'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'t-wave-inversion',title:'T 波倒置的鉴别',category:'ischemia',risk:'medium',
      aliases:['T波倒置','T 波倒置','T波改变','ST-T改变','非特异性ST-T改变','劳损'],
      related:['nste-ischemia','wellens','left-ventricular-hypertrophy','pulmonary-embolism','hypokalemia','digoxin-effect'],
      basic:{
        summary:'T 波倒置原因很多；先区分正常变异、继发性（传导异常、肥厚）和原发性（缺血、心肌病变、电解质、颅内病变等）。',
        criteria:[['正常可倒置','aVR；III、V1 单独倒置；儿童及部分年轻人 V1–V3（幼年型 T 波）'],['提示缺血','新发、对称、深倒置（>1 mm），R 波为主的相邻导联，动态变化'],['继发性','束支阻滞、心室起搏、左/右室肥厚：T 波与 QRS 主波方向相反'],['需警惕','V2–V3 深而对称（Wellens）；广泛深倒置伴 QT 延长（颅内出血、应激性心肌病）']],
        diagram:{kind:'nste-ischemia',caption:'T 波倒置教学示意：V5 导联 ST 段压低伴 T 波倒置。'},
        diagnosticPoints:[
          '判断要点：倒置分布在哪些导联、是否对称、深度如何、是否新发、是否伴 ST 段压低或 QT 延长。',
          '右胸导联（V1–V3）T 波倒置伴右心负荷线索时，要考虑急性肺栓塞。',
          '巨大倒置 T 波还见于心尖肥厚型心肌病、颅内出血和应激性心肌病。'
        ],
        differentialPoints:[
          '药物（如地高辛）、低钾、过度通气、体位改变和进食后也可出现非特异性 T 波改变。',
          '起搏或预激消失后可出现“心脏记忆性” T 波倒置，不代表缺血。'
        ]
      },
      periop:{
        timing:'长期稳定且原因明确的 T 波倒置通常不影响手术时机；新发、伴症状或疑似缺血者，择期手术前完成评估。',
        anesthesia:'告知麻醉团队术前已有的 T 波改变，避免术中误判。',
        postoperative:'术后新发 T 波倒置要结合症状、肌钙蛋白、电解质和氧合，排查缺血、肺栓塞和电解质紊乱。',
        consultation:'新发、对称深倒置或伴胸痛、肌钙蛋白升高时请心内科会诊。'
      },
      references:[{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part IV：ST 段、T 波、U 波与 QT 间期（2009）',url:'https://www.hrsonline.org/resource/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-iv-st-segment/'},{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'wide-complex-tachycardia',title:'宽 QRS 心动过速的鉴别',category:'arrhythmias',risk:'high',
      aliases:['宽QRS心动过速','宽 QRS 心动过速','WCT','宽波心动过速','室速鉴别','Brugada流程','差异性传导'],
      related:['ventricular-tachycardia','svt','pre-excitation','hyperkalemia','ventricular-pacing','torsades-de-pointes'],
      basic:{
        summary:'QRS ≥120 ms、心率 >100 次/分的心动过速，先看患者是否稳定；鉴别困难时按室速处理。',
        criteria:[['定义','QRS ≥120 ms，心率 >100 次/分'],['首先判断','有无脉搏、血压与意识；不稳定者立即电复律'],['强烈支持室速','房室分离、心室夺获或融合波'],['支持室速','胸前导联 QRS 同向（全正或全负）、电轴极度偏移（−90° 至 ±180°）、胸前导联无 RS 波或 R 至 S 最低点 >100 ms'],['支持室上速伴差传','与既往束支阻滞形态一致，典型右或左束支阻滞形态']],
        diagram:{kind:'vt',caption:'宽 QRS 心动过速教学示意：宽 QRS、规则、形态一致，未见与 QRS 固定相关的 P 波。'},
        diagnosticPoints:[
          '病史最有价值：既往心肌梗死、心衰或结构性心脏病患者出现宽 QRS 心动过速，室速可能性很高。',
          '寻找房室分离：P 波独立于 QRS 出现，有时只表现为 T 波或 QRS 形态的不规则“切迹”。',
          '鉴别流程（如 Brugada 流程）有助于判断，但不应拖延对不稳定患者的处理。'
        ],
        differentialPoints:[
          '室上速伴差异性传导或原有束支阻滞、预激综合征伴旁路前传（尤其预激合并房颤）、起搏器介导心动过速。',
          '高钾血症、钠通道阻滞剂中毒可使 QRS 增宽；伪差也可酷似宽 QRS 心动过速。'
        ]
      },
      periop:{
        timing:'择期手术立即暂停，先明确诊断并稳定病情。',
        anesthesia:'术中发生时立即告知团队，评估血流动力学，备好同步电复律和除颤；不稳定时不要因鉴别而延误电复律。',
        postoperative:'寻找诱因：缺血、电解质紊乱、低氧、导管或导丝刺激、药物；记录 12 导联心电图以便鉴别。',
        consultation:'立即请心内科会诊；无脉搏按心脏骤停流程处理。'
      },
      references:[{title:'2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000549'},{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'},{title:'Part 3: Adult Basic and Advanced Life Support · 2020 AHA Guidelines for CPR and ECC · Circulation 2020',url:'https://doi.org/10.1161/CIR.0000000000000916'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'sinus-tachycardia',title:'窦性心动过速',category:'arrhythmias',risk:'medium',
      aliases:['窦速','心率快','心动过速','sinus tachycardia'],
      related:['svt','atrial-flutter','atrial-tachycardia','pulmonary-embolism'],
      basic:{
        summary:'窦性 P 波、心率 >100 次/分；本身通常是“信号”而非病因，围手术期要找出背后的原因。',
        criteria:[['心率','>100 次/分'],['P 波','窦性形态（II 直立、aVR 倒置），每个 P 波后有 QRS'],['PR','固定'],['发作方式','逐渐加快、逐渐减慢']],
        diagram:{kind:'sinus-tachycardia',caption:'窦性心动过速教学示意：每个 QRS 前均有正常 P 波，心率增快。'},
        diagnosticPoints:[
          '心率较快时 P 波可与前一个 T 波融合，需仔细辨认。',
          '围手术期常见原因：疼痛、焦虑、出血/低血容量、发热/感染、贫血、低氧、肺栓塞、心衰、甲亢、戒断反应和药物（β 受体激动剂等）。',
          '成人窦性心动过速一般不超过（220 − 年龄）次/分；心率稳定在约 150 次/分时要排除房扑 2:1。'
        ],
        differentialPoints:[
          '房扑 2:1：心室率约 150 次/分，下壁导联可见锯齿波。',
          '房性心动过速和室上速：心率突然改变，P 波形态异常或不可见。'
        ]
      },
      periop:{
        timing:'术前不明原因的持续窦速应先寻找病因（贫血、感染、甲亢、心衰、低血容量等）再安排择期手术。',
        anesthesia:'告知麻醉团队术前心率和可能原因；窦速会增加心肌耗氧，冠心病患者尤需控制诱因。',
        postoperative:'术后窦速首先评估疼痛、出血、容量、发热、低氧和肺栓塞；不要只用减慢心率的药物掩盖病因。',
        consultation:'伴胸痛、低氧、低血压或怀疑肺栓塞、心衰时及时联系相关专科。'
      },
      references:[{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'},{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'junctional-rhythm',title:'交界性心律',category:'arrhythmias',risk:'medium',
      aliases:['交界性逸搏','交界区心律','结性心律','加速性交界性心律','逆行P波','junctional'],
      related:['sinus-node-dysfunction','complete-heart-block','digoxin-effect','sinus-bradycardia'],
      basic:{
        summary:'窄 QRS、前无正常 P 波，P 波可缺失或逆行；按频率分为交界性逸搏心律、加速性交界性心律和交界性心动过速。',
        criteria:[['QRS','窄（与窦性时相同）'],['P 波','无，或逆行 P 波（II、III、aVF 倒置）位于 QRS 前（PR <120 ms）、内或后'],['交界性逸搏心律','40–60 次/分'],['加速性交界性心律','60–100 次/分'],['交界性心动过速','>100 次/分']],
        diagram:{kind:'junctional-rhythm',caption:'交界性心律教学示意：窄 QRS 规则出现，前无正常 P 波，其后可见倒置的逆行 P 波。'},
        diagnosticPoints:[
          '交界性逸搏心律常是窦房结功能低下或房室阻滞时的“保护性”节律，本身不应被抑制。',
          '加速性交界性心律可见于地高辛中毒、心肌缺血/心梗、心脏手术后和儿茶酚胺作用。',
          '房颤患者心室律突然变得规则缓慢时，要想到交界性心律合并完全性房室阻滞（如地高辛中毒）。'
        ],
        differentialPoints:[
          '低位房性心律：P 波倒置但 PR ≥120 ms。',
          '室性逸搏心律：QRS 宽大畸形、频率更慢（20–40 次/分）。'
        ]
      },
      periop:{
        timing:'无症状、血流动力学稳定的交界性心律多不推迟手术，但需明确原因（窦房结功能、药物、电解质）。',
        anesthesia:'失去心房收缩可使心输出量下降（尤其舒张功能不全者）；麻醉中出现交界性心律伴低血压时需及时处理。',
        postoperative:'复核药物（地高辛、β 受体阻滞剂等）和电解质；新发加速性交界性心律需排查缺血和药物中毒。',
        consultation:'伴低血压、心动过缓症状、疑似地高辛中毒或需评估窦房结功能时请心内科会诊。'
      },
      references:[{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'},{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'atrial-tachycardia',title:'局灶性房性心动过速',category:'arrhythmias',risk:'medium',
      aliases:['房速','房性心动过速','局灶性房速','AT','房速伴阻滞'],
      related:['svt','atrial-flutter','mat','sinus-tachycardia','digoxin-effect'],
      basic:{
        summary:'形态异常但一致的 P 波、P 波之间有等电位线，心房率多为 100–250 次/分；需与窦速、房扑和其他室上速鉴别。',
        criteria:[['心房率','约 100–250 次/分'],['P 波','形态与窦性不同，但彼此一致（单一形态）'],['等电位线','P 波之间存在（区别于房扑）'],['房室传导','可 1:1，也可伴房室阻滞（2:1 等）']],
        diagram:{kind:'atrial-tachycardia',caption:'局灶性房性心动过速教学示意：P 波形态异常（此例倒置），P 波之间有等电位线，心率快而规则。'},
        diagnosticPoints:[
          'P 波电轴和形态提示起源部位：II、III、aVF 倒置的 P 波提示低位心房起源。',
          '可出现“温醒”（逐渐加快）和“冷却”（逐渐减慢）现象，与折返性室上速的突发突止不同。',
          '房速伴房室阻滞（尤其 2:1）是地高辛中毒的经典表现之一。'
        ],
        differentialPoints:[
          '窦性心动过速：P 波形态为窦性。',
          '房扑：锯齿波，无等电位线，心房率通常更快（250–350 次/分）；多源性房速：P 波形态 ≥3 种。'
        ]
      },
      periop:{
        timing:'新发或心率未控制的房速，择期手术前应控制心率并寻找诱因（电解质、药物、甲亢、肺部疾病）。',
        anesthesia:'告知麻醉团队；交感兴奋和低钾、低镁可诱发或加速，准备控制心率的药物和同步电复律设备。',
        postoperative:'复核电解质、地高辛使用和低氧情况；持续发作或心率快时持续监护。',
        consultation:'心率难以控制、伴心功能不全、疑似地高辛中毒时请心内科会诊。'
      },
      references:[{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'mat',title:'多源性房性心动过速',category:'arrhythmias',risk:'medium',
      aliases:['多源性房速','MAT','紊乱性房性心动过速','多形性P波'],
      related:['atrial-tachycardia','atrial-fibrillation','sinus-tachycardia'],
      basic:{
        summary:'≥3 种不同形态的 P 波、PR 和 RR 不等、心率 >100 次/分；多见于重症肺部疾病，治疗重点是基础病。',
        criteria:[['P 波','同一导联中 ≥3 种不同形态'],['心率','>100 次/分'],['节律','P-P、PR、RR 间期均不规则'],['等电位线','P 波之间存在']],
        diagram:{kind:'mat',caption:'多源性房性心动过速教学示意：P 波形态多样，PR 与 RR 间期不等。'},
        diagnosticPoints:[
          '常见基础：慢性阻塞性肺病急性加重、低氧、肺炎、心衰、低钾低镁、茶碱等药物。',
          '每个 QRS 前都有 P 波，只是形态各异——这一点与房颤不同。',
          '心率 <100 次/分时称为多源性房性心律（游走性心律）。'
        ],
        differentialPoints:[
          '房颤：没有可辨认的 P 波，基线为颤动波；监护单导联上二者容易混淆。',
          '窦性心律伴频发多源房早：基本节律仍为窦性，P 波形态以窦性为主。'
        ]
      },
      periop:{
        timing:'提示基础疾病（尤其肺部疾病）控制不佳，择期手术前应先改善肺功能、氧合和电解质。',
        anesthesia:'告知麻醉团队肺部基础疾病；避免低氧、高碳酸血症，谨慎使用 β 受体激动剂。',
        postoperative:'纠正低氧、低钾、低镁和感染；电复律通常无效，抗心律失常药效果有限。',
        consultation:'心率持续过快、伴呼吸衰竭或心衰时请呼吸科、心内科会诊。'
      },
      references:[{title:'2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia · Circulation 2016',url:'https://doi.org/10.1161/CIR.0000000000000311'},{title:'StatPearls: Multifocal Atrial Tachycardia（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK459152/'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    },
    {
      id:'aivr',title:'加速性室性自主心律',category:'arrhythmias',risk:'low',
      aliases:['加速性室性自主心律','AIVR','慢室速','再灌注心律','室性自主心律','室性逸搏心律'],
      related:['ventricular-tachycardia','wide-complex-tachycardia','complete-heart-block','stemi'],
      basic:{
        summary:'宽 QRS 规则节律、频率约 40–120 次/分（多为 60–100），常见于心梗再灌注后，多为良性、可自行终止。',
        criteria:[['QRS','宽大畸形（≥120 ms）'],['频率','约 40–120 次/分（常 60–100 次/分），高于室性逸搏、低于室速'],['与窦性心律关系','常在窦性减慢时出现，可见融合波、夺获波'],['持续时间','通常短暂，可自行终止']],
        diagram:{kind:'aivr',caption:'加速性室性自主心律教学示意：宽 QRS 规则出现，前无相关 P 波，频率不快。'},
        diagnosticPoints:[
          '典型场景：急性心梗再灌注（溶栓或介入）后，也可见于地高辛中毒、心肌炎和麻醉中。',
          '与窦性心律“竞争”：窦性心率减慢时出现，窦性加快时消失，交替处可见融合波。',
          '多数不需要抗心律失常治疗；抑制它可能导致严重心动过缓（尤其是作为逸搏节律时）。'
        ],
        differentialPoints:[
          '室性心动过速：频率 >100–120 次/分，常有血流动力学影响。',
          '室性逸搏心律（完全性房室阻滞时）：频率 20–40 次/分，P 波规律出现且与 QRS 无关。'
        ]
      },
      periop:{
        timing:'短暂、血流动力学稳定的 AIVR 一般不影响手术安排，但需了解出现背景（近期再灌注、药物中毒）。',
        anesthesia:'麻醉中可短暂出现；失去房室同步可降低血压，必要时提高窦性心率可使其消失。',
        postoperative:'复核电解质、地高辛等药物和缺血情况；持续存在或伴低血压时持续监护。',
        consultation:'伴血流动力学障碍、与室速难以区分或怀疑药物中毒时请心内科会诊。'
      },
      references:[{title:'StatPearls: Accelerated Idioventricular Rhythm',url:'https://www.statpearls.com/point-of-care/23353'},{title:'2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000549'}],
      updatedAt:'2026-10-12',reviewStatus:'待审核'
    }
  ]
};

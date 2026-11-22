/* 围手术期判断专题（第三批）：草稿，待临床医师审核。不含固定药物剂量，具体处理按本院流程。 */
(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA;
  if(!data||!data.periop)return;
  Object.assign(data.periop,{
    updatedAt:'2026-10-12',
    indications:{
      intro:'术前心电图的主要价值是发现需要处理的高危异常，并为术后对比留下基线；它不能单独预测或排除围手术期心脏事件。',
      points:[
        '低风险手术（如手足小手术、关节镜等），且无心血管疾病、无可疑心脏症状的患者，一般不需要常规术前心电图。',
        '已知冠心病、明显心律失常、心衰、结构性心脏病、脑血管或外周血管疾病的患者，拟行中高风险手术时，建议术前记录 12 导联心电图作为基线。',
        '有心血管危险因素或可疑症状（胸痛、气促、晕厥、心悸、活动耐量下降），以及高龄患者（ESC 2022 指南将 ≥65 岁作为危险因素之一）拟行中高风险手术时，可考虑术前心电图。',
        '使用近期的心电图；病情或症状有变化时应重新记录。',
        '髋部骨折等时间敏感手术，不应为了常规心脏检查而延误；只有存在不稳定心脏情况（急性冠脉综合征、失代偿心衰、严重心律失常、重度瓣膜病伴症状）时，才需要先处理。'
      ]
    },
    surgeryRisk:[
      ['骨科小手术：关节镜、手足手术、内固定取出等','低风险（30 天心血管死亡/心梗估计 <1%）','无心脏症状者通常无需额外心脏检查'],
      ['骨科大手术：髋部手术（含髋部骨折）、脊柱手术等','中等风险（约 1–5%）','结合患者因素决定心电图、肌钙蛋白、BNP 和超声等评估'],
      ['下肢截肢（多见于血管疾病患者）','高风险（>5%）','通常需要更全面的术前心血管评估'],
      ['急诊 / 限期手术','风险高于同类择期手术','评估时间有限，重点识别并处理不稳定的心脏情况']
    ],
    abnormal:[
      {finding:'新发房颤 / 房扑，心室率快或有症状',level:'postpone',action:'推迟择期手术；控制心室率，寻找诱因，评估卒中风险与抗凝。',entry:'atrial-fibrillation'},
      {finding:'心室率控制良好的慢性房颤',level:'proceed',action:'通常可以手术；按方案安排抗凝药物的停用与恢复。',entry:'atrial-fibrillation'},
      {finding:'窦性心动过速（原因不明）',level:'evaluate',action:'先查贫血、感染、低血容量、甲亢、心衰和肺栓塞等原因。',entry:'sinus-tachycardia'},
      {finding:'无症状窦性心动过缓、一度房室阻滞、文氏阻滞',level:'proceed',action:'通常可以手术；告知麻醉团队，注意迷走反射与减慢心率的药物。',entry:'mobitz-i'},
      {finding:'莫氏 II 型、2:1、高度或三度房室阻滞',level:'postpone',action:'推迟择期手术，请心内科评估起搏；急诊手术在起搏保障下进行。',entry:'mobitz-ii'},
      {finding:'孤立右束支阻滞或左前分支阻滞',level:'proceed',action:'通常可以手术；新发者伴气促或低氧时先排除肺栓塞。',entry:'right-bundle-branch-block'},
      {finding:'双分支阻滞',level:'evaluate',action:'无晕厥：一般可手术，备好经皮起搏；有晕厥：先请心内科评估。',entry:'left-anterior-fascicular-block'},
      {finding:'新发左束支阻滞',level:'evaluate',action:'评估结构性心脏病（超声心动图）；已知且稳定者通常可手术。',entry:'left-bundle-branch-block'},
      {finding:'病理性 Q 波（陈旧性心梗）',level:'evaluate',action:'了解心梗时间（近期心梗者推迟择期手术）、心功能和支架/抗血小板情况。',entry:'old-mi'},
      {finding:'新发缺血性 ST-T 改变，或伴胸痛、气促',level:'postpone',action:'推迟择期手术，复查心电图与肌钙蛋白，请心内科评估。',entry:'nste-ischemia'},
      {finding:'长期稳定的非特异性 ST-T 改变',level:'proceed',action:'通常可以手术；保存心电图作为术后对比基线。',entry:'t-wave-inversion'},
      {finding:'左心室肥厚 ± 劳损',level:'evaluate',action:'核查血压控制；有杂音、晕厥或劳力性症状时做超声，排除主动脉瓣狭窄和肥厚型心肌病。',entry:'left-ventricular-hypertrophy'},
      {finding:'QTc >500 ms',level:'postpone',action:'推迟择期手术，纠正低钾/低镁，调整延长 QT 的药物。',entry:'drug-induced-long-qt'},
      {finding:'频发或多形室早、短阵室速',level:'evaluate',action:'纠正电解质，评估结构性心脏病和缺血。',entry:'premature-ventricular-contractions'},
      {finding:'预激图形',level:'evaluate',action:'无症状者通常可手术；有心悸、晕厥或心动过速史者先请心内科评估。',entry:'pre-excitation'},
      {finding:'1 型 Brugada 图形',level:'evaluate',action:'请心内科评估；麻醉中避免已知诱发药物，及时控制发热。',entry:'brugada'},
      {finding:'起搏器或 ICD',level:'evaluate',action:'获取器械类型、起搏依赖情况与最近程控报告，制定术中电刀与器械管理方案。',entry:'ventricular-pacing'}
    ],
    anesthesia:[
      {title:'骨水泥植入综合征',context:'骨水泥型髋关节置换或半髋置换，尤其是高龄股骨颈骨折、病理性骨折或合并肺动脉高压的患者。',ecg:'骨水泥植入或假体插入后数分钟内出现低氧、低血压、心动过速或过缓、右心负荷改变、ST 段改变、室性心律失常，严重时心脏骤停。',response:'术前识别高危患者并告知麻醉团队；植入前确保充分氧合与容量，加强监测；手术与麻醉团队沟通关键步骤。出现循环衰竭时按复苏流程处理，重点支持右心功能。',link:''},
      {title:'沙滩椅位肩关节手术 + 肌间沟臂丛阻滞',context:'坐位（沙滩椅位）肩关节镜或肩关节置换。',ecg:'可突发严重心动过缓和低血压，少数出现心脏停搏（常被认为与 Bezold-Jarisch 反射有关）。',response:'术前告知麻醉团队；术中持续监测心率和血压，注意容量状态，备好正性变时与升压药物。',link:'sinus-bradycardia'},
      {title:'椎管内麻醉（腰麻、硬膜外）',context:'下肢、髋部手术常用。',ecg:'交感阻滞可导致心动过缓和低血压；阻滞平面过高、基础心率慢或使用 β 受体阻滞剂时风险增加，偶可发生突然心脏骤停。',response:'了解基础心率和传导异常；高度房室阻滞患者需提前制定起搏预案；出现严重心动过缓时及时处理并呼叫支援。',link:'sinus-node-dysfunction'},
      {title:'局部麻醉药全身毒性（LAST）',context:'大容量神经阻滞、关节周围浸润（如膝关节置换“鸡尾酒”注射）、连续导管给药。',ecg:'可出现 PR 延长、QRS 增宽、心动过缓、室性心律失常或心脏停搏；可先有口周麻木、耳鸣、抽搐等神经症状，也可直接表现为心血管事件。',response:'立即停止给药、呼救，保护气道、控制抽搐，按本院 LAST 流程使用脂肪乳剂；复苏时流程有特殊调整，应遵循专门流程而非常规方案。',link:'wide-complex-tachycardia'},
      {title:'琥珀胆碱相关高钾血症',context:'长期制动、截瘫或神经肌肉疾病、大面积烧伤、挤压伤的骨科创伤患者（损伤后受体上调）。',ecg:'用药后血钾骤升：T 波高尖、QRS 增宽，可迅速进展为室性心律失常或心脏停搏。',response:'术前提醒麻醉团队患者属于高危人群，通常应避免使用琥珀胆碱；一旦发生按高钾血症急救流程处理。',link:'hyperkalemia'},
      {title:'止血带松开',context:'膝关节置换等下肢止血带手术。',ecg:'再灌注后可出现血压下降、心动过速，偶见心律失常；极少数与栓塞事件相关。',response:'松止血带前告知麻醉团队，观察血压、心率和呼气末二氧化碳。',link:''},
      {title:'脂肪栓塞综合征',context:'长骨或骨盆骨折、髓内钉固定后，多在伤后 24–72 小时出现。',ecg:'窦性心动过速最常见；可有右心负荷表现（新发右束支阻滞、右胸导联 T 波倒置）和非特异 ST-T 改变。',response:'低氧、神经系统症状和皮肤瘀点同时出现时要想到本病；以支持治疗为主，并与肺栓塞鉴别。',link:'pulmonary-embolism'},
      {title:'电刀与起搏器 / ICD',context:'所有植入心脏电子器械的患者，尤其是脐以上部位使用单极电刀。',ecg:'电刀干扰可抑制起搏（起搏依赖者出现长间歇），或被 ICD 误判为室颤而放电。',response:'术前获取器械信息并与心内科/程控团队制定方案；术后恢复原设置并确认功能。',link:'ventricular-pacing'},
      {title:'延长 QT 的围手术期药物',context:'止吐药、部分抗精神病药和抗生素等，叠加低钾、低镁或心动过缓时风险更高。',ecg:'QTc 延长，严重时可诱发尖端扭转型室速。',response:'术前 QTc 明显延长者告知麻醉团队，尽量避免多种延长 QT 的药物叠加，并维持电解质正常。',link:'drug-induced-long-qt'}
    ],
    postopFlow:[
      {title:'先看人，再看图',body:'评估意识、气道、呼吸频率、血氧、血压和心率。不稳定时立即呼救、启动急救流程，不要等心电图结果。'},
      {title:'10 分钟内完成 12 导联心电图',body:'与术前心电图逐导联对比。症状持续而首份心电图不典型时，15–30 分钟内复查。'},
      {title:'按心电图分流',body:'ST 抬高或等危图形（后壁、de Winter、左束支阻滞下同向 ST 改变）→ 立即联系心内科；新发心律失常 → 按相应词条处理；右心负荷伴低氧 → 评估肺栓塞或脂肪栓塞；正常或非特异 → 继续寻找原因。'},
      {title:'同步完成床旁检查',body:'肌钙蛋白（并动态复查）、血常规（贫血/出血）、血气与电解质、BNP，必要时做胸片和床旁超声。'},
      {title:'逐项排查骨科术后常见原因',body:'急性冠脉综合征 / 2 型心梗、肺栓塞、脂肪栓塞、房颤快心室率、心衰或容量过多、肺不张或肺炎、气胸（锁骨上臂丛阻滞或中心静脉穿刺后）、膈神经阻滞（肌间沟阻滞后）、贫血/出血、阿片类药物导致的通气不足、疼痛与焦虑。'},
      {title:'及时会诊',body:'心电图提示急性心梗、新发高度房室阻滞或室性心律失常、肌钙蛋白明显升高，或血流动力学不稳定时，立即联系心内科和相关团队。'}
    ],
    injury:{
      intro:'术后心肌损伤（PMI / MINS）指非心脏手术后肌钙蛋白升高（较术前升高超过参考上限，或超过第 99 百分位上限），主要由缺血引起；大多数患者没有胸痛，也可以没有心电图改变。',
      rows:[
        ['发生时间','多在术后 2–3 天内，常见于术后 24–48 小时'],
        ['典型表现','无症状的肌钙蛋白升高；少数伴胸痛、气促或心电图缺血改变'],
        ['预后意义','即使无症状，也与术后 30 天死亡率升高相关'],
        ['筛查人群','ESC 2022 指南建议：已知心血管疾病、有危险因素（含 ≥65 岁）或可疑症状的患者，在中高风险手术前及术后 24、48 小时检测高敏肌钙蛋白；AHA/ACC 2024 指南也将其作为高危患者的可选策略'],
        ['需要区分','1 型心梗（斑块破裂）、2 型心梗（供需失衡：低血压、贫血、心动过速、低氧）、非缺血性心肌损伤（肺栓塞、脓毒症、快速房颤、心衰、肾功能不全）']
      ],
      points:[
        '发现肌钙蛋白升高时：立即做 12 导联心电图并与术前对比，询问症状，复查肌钙蛋白看动态变化。',
        '积极寻找并纠正供需失衡：低血压、贫血/出血、心动过速、低氧、疼痛和容量问题。',
        '请心内科评估：是否需要进一步检查（超声、冠脉评估）以及二级预防方案，抗栓治疗需与手术出血风险权衡。',
        '出院前安排随访，让后续医生知道患者曾发生术后心肌损伤。'
      ]
    },
    references:[
      {title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'},
      {title:'2022 ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery（ESC 指南页）',url:'https://escardio.org/Guidelines/Clinical-Practice-Guidelines/ESC-Guidelines-on-non-cardiac-surgery-cardiovascular-assessment-and-managem'},
      {title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},
      {title:'Bone cement implantation syndrome（Donaldson 等）· Br J Anaesth 2009',url:'https://pubmed.ncbi.nlm.nih.gov/19059919/'},
      {title:'The Third ASRA Practice Advisory on Local Anesthetic Systemic Toxicity · Reg Anesth Pain Med 2018',url:'https://rapm.bmj.com/content/43/2/113'},
      {title:'StatPearls: Fat Embolism Syndrome（NCBI Bookshelf）',url:'https://www.ncbi.nlm.nih.gov/books/NBK499885/'},
      {title:'StatPearls: Succinylcholine Chloride',url:'https://statpearls.com/ArticleLibrary/viewarticle/20362'},
      {title:'HRS/ASA 2011 Expert Consensus Statement on the Perioperative Management of Patients with Implantable Defibrillators, Pacemakers and Arrhythmia Monitors',url:'https://www.hrsonline.org/resource/2011-expert-consensus-statement-perioperative-management-patients-implantable-defibrillators/'},
      {title:'ASA Practice Advisory for the Perioperative Management of Patients with Cardiac Implantable Electronic Devices · Anesthesiology 2020',url:'https://pubmed.ncbi.nlm.nih.gov/32032098/'}
    ]
  });
})();

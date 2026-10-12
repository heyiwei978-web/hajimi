/* 第八批：参照陈新主编《黄宛临床心电图学》第 6 版（人民卫生出版社，2009）第 4、5、6、9 章
   （心肌梗死、心肌缺血、肺栓塞、药物与电解质）整理的学习要点。
   内容为自行归纳改写，不含原书原文或图片；STEMI 诊断阈值以第四版全球心肌梗死定义为准，教材差异处已注明。草稿，待临床医师审核。 */
(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA;
  if(!data||!Array.isArray(data.entries))return;
  const UPDATED='2026-10-12';
  const REF={
    udmi:{title:'Fourth Universal Definition of Myocardial Infarction (2018) · Circulation 2018',url:'https://doi.org/10.1161/CIR.0000000000000617'},
    acs:{title:'2023 ESC Guidelines for the management of acute coronary syndromes · Eur Heart J 2023',url:'https://doi.org/10.1093/eurheartj/ehad191'},
    chestPain:{title:'2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain',url:'https://professional.heart.org/en/guidelines-statements/2021-ahaaccasechestsaemscctscmr-guideline-for-the-evaluation-and-diagnosis-ofcir0000000000001029'},
    exercise:{title:'AHA Scientific Statement: Exercise Standards for Testing and Training (2013)',url:'https://professional.heart.org/en/science-news/exercise-standards-for-testing-and-training/top-things-to-know'},
    stPart4:{title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part IV：ST 段、T 波、U 波与 QT 间期（2009）',url:'https://www.hrsonline.org/resource/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-iv-st-segment/'},
    pe:{title:'2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism · Eur Heart J 2020',url:'https://pubmed.ncbi.nlm.nih.gov/31504429/'},
    crediblemeds:{title:'CredibleMeds：QT 延长与尖端扭转风险药物数据库',url:'https://crediblemeds.org/healthcare-providers'},
    periop:{title:'2024 AHA/ACC 等 Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery · Circulation 2024',url:'https://doi.org/10.1161/CIR.0000000000001285'}
  };
  const book=(chapter,pages)=>({chapter,pages});
  const CH4='第 4 章 心肌梗死',CH5='第 5 章 心肌缺血',CH6='第 6 章 肺栓塞',CH9='第 9 章 药物及电解质紊乱对心电图的影响';

  const entries=[
    {
      id:'mi-evolution',title:'急性心肌梗死的心电图演变与分期',category:'ischemia',risk:'high',
      aliases:['心梗演变','超急性期','超急性T波','墓碑样ST抬高','单向曲线','缺血 损伤 坏死','心梗分期','hyperacute T'],
      related:['stemi','old-mi','ventricular-aneurysm','nste-ischemia','st-elevation-differential'],
      textbook:book(CH4,'42–51'),
      basic:{
        summary:'冠脉闭塞后心电图依次出现缺血型（T 波）、损伤型（ST 段）、坏死型（Q 波）改变；超急性期的高大 T 波常被错过，演变过程本身就是诊断依据。',
        criteria:[['超急性期（数分钟–数十分钟）','T 波高耸宽大；J 点上移、ST 上斜抬高；R 波可轻度增高变宽（急性损伤性阻滞）'],['急性期（数十分钟–数小时）','ST 弓背向上抬高，与 T 波融合成单向曲线；严重者 R 波降低、与 ST 融合呈“墓碑”样；Q/QS 波开始出现'],['亚急性/演变期（数小时–数周）','ST 逐渐回落；T 波对称倒置并逐渐加深（多在 3–6 周最深）'],['陈旧期（数月后）','T 波可恢复直立，也可永久倒置；Q 波多永久存在，少数（尤其下壁）可变小或消失'],['教材病理 Q 标准','Q 时限 >30 ms 且 Q/R >1/4（现行定义见“陈旧性心肌梗死”词条）']],
        diagram:{kind:'mi-evolution',caption:'急性心肌梗死演变教学示意：超急性期高大 T 波 → 急性期 ST 弓背抬高（单向曲线）→ 演变期 Q 波形成伴 T 波倒置。'},
        diagnosticPoints:[
          '三种基本图形的机制：缺血使复极延迟，产生 T 波改变（内膜下缺血 T 高尖，外膜下缺血 T 倒置），可逆；损伤产生“舒张期和收缩期损伤电流”，表现为 ST 偏移，及时再灌注仍可恢复；坏死心肌不能除极，形成 Q/QS 波，不可逆。',
          '实际心电图常同时含有缺血、损伤、坏死成分：梗死中心为坏死，外周依次为损伤和缺血。',
          '定位应以 Q 波或异常 R 波（坏死）所在导联为准，而不是 ST-T 改变的范围——缺血和损伤区通常更广，且可以恢复。',
          'Q 波的“等位”表现：正常 q 波消失（V5–V6 原有 q 消失提示室间隔受累）；R 波递增顺序异常（如 RV4 < RV3）；V1–V3 R 波异常增高是正后壁坏死的镜像。',
          '部分患者有“梗死周围阻滞”：QRS 终末部增宽，高侧壁梗死时 I、aVL 的 Q 波后出现宽 R 波；严重缺血可出现暂时性 Q 波（心肌顿抑），恢复灌注后消失。'
        ],
        differentialPoints:[
          '超急性 T 波需与高钾血症（T 窄而尖、基底窄，QT 缩短，常伴 QRS 增宽）、早期复极、左室肥厚鉴别；关键是症状、对应性改变和数分钟至数十分钟内的动态变化。',
          '持续 ST 抬高数周以上不再代表急性损伤，需考虑室壁瘤（见“室壁瘤与持续性 ST 抬高”）。',
          '心包炎的 ST 抬高广泛、凹面向上、无 Q 波形成，T 波倒置出现在 ST 回到基线之后。'
        ]
      },
      periop:{
        timing:'近期（尤其 60 天内）心肌梗死患者的择期非心脏手术应推迟；术前心电图出现符合急性演变的改变时，先按急性冠脉综合征处理。',
        anesthesia:'告知麻醉团队梗死时间、部位和心功能；维持氧供需平衡，避免心动过速、低血压和贫血。',
        postoperative:'术后心肌梗死常无典型胸痛，心电图可只表现为 T 波或 ST 改变；与术前心电图逐导联比较，并结合肌钙蛋白动态变化。',
        consultation:'心电图呈急性演变或肌钙蛋白升高时立即联系心内科。'
      },
      references:[REF.udmi,REF.acs,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'variant-angina',title:'变异型心绞痛（冠脉痉挛）',category:'ischemia',risk:'high',
      aliases:['变异型心绞痛','Prinzmetal','冠脉痉挛','冠状动脉痉挛','血管痉挛性心绞痛','一过性ST抬高','vasospastic angina'],
      related:['stemi','nste-ischemia','mi-evolution','st-elevation-differential'],
      textbook:book(CH5,'75–79'),
      basic:{
        summary:'冠脉痉挛引起的透壁缺血：发作时一过性 ST 抬高伴对应性压低，缓解后恢复；多在夜间或凌晨、与活动无关，可伴严重心律失常。',
        criteria:[['发作时','相邻导联 ST 段抬高（可呈单向曲线），伴对应导联 ST 压低'],['缓解后','ST 段在数分钟内恢复，部分患者先抬高后压低'],['伴随','T 波增高变尖（有时比 ST 抬高更显著）；R 波增高变宽、S 波变小；U 波倒置'],['心律失常','室性早搏较多见，也可出现房室阻滞和短阵室速'],['临床','静息发作、周期性（夜间、凌晨），疼痛较重、持续较久；硝酸甘油可迅速缓解']],
        diagram:{kind:'variant-angina',caption:'变异型心绞痛教学示意：发作时 V3 导联 ST 段抬高、T 波高尖；缓解后数分钟内恢复正常。'},
        diagnosticPoints:[
          '急性冠脉供血不足的心电图改变多持续 10（5–30）分钟，发作时与缓解后各记录一份心电图对比，诊断价值最大。',
          '冠脉造影可正常或仅轻度病变；痉挛也可发生在原有动脉粥样硬化斑块的基础上。',
          '严重或持续的痉挛可出现暂时性 Q 波（顿抑），反复发作或持续时间长可演变为心肌梗死。',
          '下壁缺血发作常伴窦缓、窦性停搏和房室阻滞；前壁缺血易伴血压升高和室性心律失常。'
        ],
        differentialPoints:[
          '急性 STEMI：ST 抬高持续不回落、出现 Q 波和肌钙蛋白升高；不能因怀疑痉挛而延误再灌注评估。',
          '早期复极、心包炎：ST 抬高稳定或广泛分布，无对应性压低，无症状相关的快速变化。',
          '稳定型心绞痛发作时多为 ST 水平或下斜型压低，很少抬高。'
        ]
      },
      periop:{
        timing:'有痉挛性心绞痛史者，择期手术前确认症状已控制、钙通道阻滞剂等药物规律使用，不要突然停药。',
        anesthesia:'告知麻醉团队；避免过度通气、低体温、强烈交感刺激和可诱发痉挛的药物；术中出现一过性 ST 抬高时考虑痉挛，同时排除急性闭塞。',
        postoperative:'继续抗痉挛药物；术后胸痛伴 ST 抬高时立即记录 12 导联心电图并复查，ST 不回落或肌钙蛋白升高时按 STEMI 流程处理。',
        consultation:'发作频繁、伴晕厥或心律失常，或 ST 抬高不能迅速恢复时立即联系心内科。'
      },
      references:[REF.acs,REF.chestPain,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'ventricular-aneurysm',title:'室壁瘤与持续性 ST 抬高',category:'ischemia',risk:'medium',
      aliases:['室壁瘤','心室壁瘤','持续性ST抬高','陈旧性前壁心梗ST抬高','LV aneurysm'],
      related:['old-mi','mi-evolution','stemi','st-elevation-differential'],
      textbook:book(CH4,'66–67'),
      basic:{
        summary:'心肌梗死后 ST 抬高持续数周至数月不回落，常伴 Q/QS 波，多见于广泛前壁梗死；提示室壁瘤或大面积运动障碍，但需超声确认。',
        criteria:[['时间','梗死后 ST 抬高持续超过数周（教材：持续 6 个月以上更提示室壁瘤）'],['形态','Q 或 QS 波基础上的 ST 抬高，T 波多倒置，无动态演变'],['常见导联','V1–V4（前壁、心尖）'],['确诊','超声心动图或其他影像证实室壁运动异常或矛盾运动']],
        diagram:{kind:'aneurysm',caption:'室壁瘤教学示意：V2 导联 QS 波伴持续 ST 抬高和 T 波倒置，多次复查形态不变。'},
        diagnosticPoints:[
          '大多数患者的 ST 抬高在再灌注后数小时至数日内回落，逐渐被缺血型 T 波倒置取代；未及时再灌注或梗死范围大者，ST 抬高可持续数月。',
          '机制尚不完全清楚，可能与瘤壁瘢痕和邻近正常心肌在收缩时的反向运动产生的损伤电流有关。',
          '临床上不宜只凭 ST 持续抬高诊断室壁瘤，也不应把它当作“新的急性梗死”——关键是与既往心电图对比。'
        ],
        differentialPoints:[
          '急性再梗死：新出现胸痛、ST 进一步抬高或范围扩大、肌钙蛋白动态升高；T 波由倒置转为直立高尖也需警惕。',
          '其他持续 ST 抬高：左束支阻滞、左室肥厚、早期复极、Brugada 图形。'
        ]
      },
      periop:{
        timing:'已知室壁瘤本身不一定推迟手术，但应先评估心功能、附壁血栓和室性心律失常；首次发现者择期手术前完成超声心动图。',
        anesthesia:'告知麻醉团队心功能和抗凝情况；心功能差者注意容量和血压，备好除颤器。',
        postoperative:'术后心电图与术前对比；持续 ST 抬高形态不变时不必按新发 STEMI 处理，但出现新的症状或形态变化时应复查肌钙蛋白。',
        consultation:'射血分数明显降低、附壁血栓、室性心律失常或诊断不明确时请心内科会诊。'
      },
      references:[REF.udmi,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'pseudo-infarct-q',title:'非梗死性 Q 波（假性梗死图形）',category:'ischemia',risk:'low',
      aliases:['假性心梗','假性梗死','非梗死性Q波','III导联Q波','V1V2 QS','孤立Q波','pseudoinfarction','异常Q波鉴别'],
      related:['old-mi','pre-excitation','left-ventricular-hypertrophy','left-bundle-branch-block','pulmonary-embolism'],
      textbook:book(CH4,'67–69'),
      basic:{
        summary:'异常 Q/QS 波不一定是陈旧性心梗：电极位置、体位、心室肥厚、束支阻滞、预激、肺部疾病和心肌病都可产生；单个导联的 Q 波尤其需要谨慎。',
        criteria:[['单独 III 导联 Q 波','多数正常（初始向量与 III 导联轴近乎垂直），深吸气后可消失'],['单独 aVF 或 aVL Q 波','电轴左偏时 aVF、电轴右偏时 aVL 出现 Q 波可为正常'],['V1–V2 Q/QS','电极位置偏高、左室肥厚、左束支阻滞、横位心、肺气肿、右室肥厚等均可出现；下移一个肋间复查常恢复 rS'],['I、aVL、V5–V6','正常室间隔 q 宽 ≤20 ms、深 ≤R/4；≥30 ms 才需考虑侧壁梗死'],['较可靠的情况','多个相邻导联同时出现，伴 R 波降低和 ST-T 改变，并与临床资料相符']],
        diagram:{kind:'pseudo-q',caption:'III 导联 Q 波教学示意：平静呼气时 III 导联呈 Qr；深吸气后 Q 波消失呈 R 波，提示体位所致而非心梗。'},
        diagnosticPoints:[
          '教材引用的尸检对照：以异常 Q 波诊断陈旧性心梗，敏感性约 61%、特异性约 89%；II、III、aVF 有 Q 波的 56 例中，31 例尸检无心肌坏死。',
          '反过来，约 20% 的陈旧性心梗心电图没有异常 Q 波（梗死小、瘢痕收缩或被束支阻滞掩盖）；束支阻滞时窦性搏动看不到的 Q 波，可能在室性早搏中暴露出来。',
          'V1–V3 出现 qrS 或 qRs（起始小 q 后有 r）时，无论 q 多小都应考虑梗死或瘢痕；而孤立的 V1–V3 QS 不伴 ST-T 改变，不足以诊断前间壁梗死。',
          '下结论前，多做一份降低一个肋间的胸导联、深吸气后的肢体导联，并与既往心电图对比。'
        ],
        differentialPoints:[
          '预激：delta 波负向时可呈 Q/QS，B 型酷似前间壁梗死，负向 delta 波在下壁导联似下壁梗死；看 PR 是否缩短。',
          '肥厚型心肌病：I、aVL 和左胸导联深而窄的 Q 波，多见于青壮年，常伴左室肥厚表现。',
          '急性肺栓塞、肺气肿、心肌炎、浸润性心肌病也可出现 Q 波；需结合影像和临床。'
        ]
      },
      periop:{
        timing:'仅凭术前心电图的孤立 Q 波不应诊断“陈旧性心梗”或推迟手术；有症状、多导联 Q 波或心功能不明者，可术前完善超声心动图。',
        anesthesia:'按实际心脏情况评估风险，避免因误诊增加不必要的检查和延误。',
        postoperative:'术后复查时注意电极位置一致，避免把电极移位造成的 Q 波或 R 波递增不良误判为新发梗死。',
        consultation:'Q 波性质不明且合并症状、心衰或室壁运动异常时请心内科会诊。'
      },
      references:[REF.udmi,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'cns-t-waves',title:'颅内病变相关的巨大倒置 T 波',category:'ischemia',risk:'high',
      aliases:['脑型T波','CNS T波','蛛网膜下腔出血心电图','脑出血T波','巨大倒置T波','神经源性心电图改变','cerebral T waves'],
      related:['t-wave-inversion','drug-induced-long-qt','wellens','nste-ischemia'],
      textbook:book(CH4,'66'),
      basic:{
        summary:'脑出血、蛛网膜下腔出血等可出现胸导联宽而深的倒置 T 波伴 QT（QU）明显延长，酷似心肌梗死；需结合神经系统表现、心肌标志物和超声鉴别。',
        criteria:[['T 波','宽大、深倒置，常见于胸前导联，也可见于肢体导联；可逐渐加深、变浅，再恢复'],['QT/QU','明显延长'],['可伴','U 波明显、ST 改变、各种心律失常'],['临床背景','急性脑出血、蛛网膜下腔出血、颅脑外伤等']],
        diagram:{kind:'cns-t',caption:'颅内病变相关 T 波教学示意：V3 导联宽而深的倒置 T 波，QT 间期明显延长。'},
        diagnosticPoints:[
          '机制尚无定论，较受关注的解释是急性脑血管病造成双侧交感神经张力失衡，使各部位心肌复极失去同步。',
          '这类患者也可同时存在真正的心肌损伤（应激性心肌病、神经源性心肌顿抑），肌钙蛋白可轻度升高；需结合心肌标志物变化和超声室壁运动判断。',
          'QT 明显延长时有发生尖端扭转的风险，注意补钾补镁、避免延长 QT 的药物。'
        ],
        differentialPoints:[
          'Wellens 图形和急性冠脉综合征：T 波倒置按冠脉供血区分布，QT 延长通常不如此显著，有胸痛史。',
          '心尖肥厚型心肌病：胸导联巨大倒置 T 波长期稳定存在，伴左胸导联高电压。',
          '应激性心肌病（Takotsubo）：可有 ST 抬高后广泛深倒置 T 波和 QT 延长，超声见心尖气球样变。'
        ]
      },
      periop:{
        timing:'神经外科或创伤患者术前出现此类改变，不应自动视为心梗而延误神经外科急诊手术；结合肌钙蛋白、超声和血流动力学共同决策。',
        anesthesia:'告知麻醉团队 QT 延长和可能的心肌功能异常；维持电解质正常，避免延长 QT 的药物，备好除颤器和硫酸镁。',
        postoperative:'持续心电监护，复查 QTc、电解质和心肌标志物；关注心律失常和低血压。',
        consultation:'肌钙蛋白明显升高、室壁运动异常或出现室性心律失常时请心内科会诊。'
      },
      references:[REF.stPart4,REF.crediblemeds],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'exercise-test',title:'运动负荷试验的心电图判读',category:'ischemia',risk:'medium',
      aliases:['运动试验','平板运动试验','运动负荷心电图','Bruce方案','踏车试验','ST/HR斜率','treadmill test','负荷试验'],
      related:['nste-ischemia','variant-angina','digoxin-effect','left-ventricular-hypertrophy'],
      textbook:book(CH5,'82–85'),
      basic:{
        summary:'通过运动增加心肌耗氧诱发缺血：以 J 点后 80 ms 处水平或下斜型 ST 压低 ≥0.1 mV 为主要阳性标准；结果需结合验前概率解读。',
        criteria:[['目标心率','次极量运动为最大心率（220 − 年龄）的 85%–90%'],['阳性 ST 压低','J 点后 80 ms 处水平型或下斜型压低 ≥0.1 mV；上斜型需 ≥0.15 mV；原有压低者需在原基础上再降 ≥0.1 mV 并持续 ≥2 分钟'],['其他阳性','无 Q 波导联 ST 抬高 ≥0.1 mV（aVR 除外）；运动中出现典型心绞痛'],['提示严重病变','运动耐量 <6 METs 即出现阳性；收缩压不升或下降；ST 压低 ≥0.2 mV 或 >5 个导联；恢复期持续 ≥5–8 分钟；运动诱发持续室速'],['终止指征','心绞痛、ST 压低达 0.2 mV、严重心律失常、收缩压下降 ≥20 mmHg、头晕或步态不稳、极度疲劳']],
        diagram:{kind:'exercise',caption:'运动负荷试验教学示意：静息时 V5 导联 ST 正常；运动中出现水平型 ST 压低。'},
        diagnosticPoints:[
          '教材资料：以水平或下斜型 ST 压低 ≥0.1 mV 为标准，特异性约 84%、敏感性约 66%（单支病变约 40%，三支病变约 90%）。',
          '运动中 J 点下移伴 ST 快速上斜属于正常反应；下斜型压低特异性最高。',
          'ST 抬高的意义取决于导联：有病理性 Q 波的导联多反映室壁运动异常或室壁瘤；无 Q 波的导联提示近端严重病变或痉挛，更易诱发室性心律失常。',
          '运动诱发 U 波倒置提示前降支病变；ST/HR 斜率 ≥2.4 µV/(次·分) 视为异常（教材）。'
        ],
        differentialPoints:[
          '假阳性：服用洋地黄、低钾、左室肥厚、瓣膜病、心肌病、静息 ST 已压低、预激、左束支阻滞；女性假阳性率较高。',
          '假阴性：服用 β 受体阻滞剂、钙通道阻滞剂或硝酸酯类，单支病变，运动量不足。',
          '左束支阻滞、预激、起搏心律和静息 ST 压低 ≥1 mm 时运动心电图不可靠，应改用负荷影像检查。'
        ]
      },
      periop:{
        timing:'术前不常规做运动试验；仅在结果会改变处理、且患者功能状态不明时考虑。能完成 ≥4 METs 活动者通常无需进一步负荷检查。',
        anesthesia:'术前运动试验提示低运动量即缺血或血压下降时，告知麻醉团队高风险，需心内科评估后再定手术时机。',
        postoperative:'术后早期不做运动试验；术后缺血评估依靠症状、心电图对比和肌钙蛋白。',
        consultation:'运动试验强阳性或提示多支/左主干病变时，择期手术前请心内科会诊。'
      },
      references:[REF.exercise,REF.chestPain,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'antiarrhythmic-drug-effects',title:'抗心律失常药物对心电图的影响',category:'electrolytes',risk:'medium',
      aliases:['奎尼丁','胺碘酮','索他洛尔','抗心律失常药','药物性QRS增宽','Ia类','III类','普罗帕酮','QT延长药物'],
      related:['drug-induced-long-qt','torsades-de-pointes','digoxin-effect','sinus-bradycardia'],
      textbook:book(CH9,'167–168、172–174'),
      basic:{
        summary:'Ia 类（奎尼丁）使 QRS 增宽、QT 延长；III 类（胺碘酮、索他洛尔）主要使 QT 延长和窦性心率减慢；两者都可诱发尖端扭转。Ib、Ic 和 II 类对心电图影响相对较小。',
        criteria:[['Ia 类（奎尼丁等）','减慢 0 相上升速度 → QRS 增宽；延长复极 → QT 延长、T 波低平'],['III 类（胺碘酮、索他洛尔）','阻滞 IKr/IKs → QT 延长；减慢窦性心率；胺碘酮兼有 I、II、IV 类作用'],['停药或减量指征（教材，奎尼丁）','QRS 较用药前增宽 >50%，或出现房室阻滞、明显窦性心动过缓'],['尖端扭转风险','与剂量不一定相关（奎尼丁小剂量即可在 2%–4% 患者中发生）；心动过缓和低钾时风险增加'],['房扑时注意','Ia、Ic 类使 F 波减慢后可出现 1:1 下传、心室率反而加快，需同时用房室结阻滞药物']],
        diagram:{kind:'antiarrhythmic',caption:'Ia 类药物作用教学示意：II 导联 QRS 轻度增宽、T 波低平、QT 间期延长。'},
        diagnosticPoints:[
          '药物和电解质影响心电图的途径：直接改变心肌动作电位、影响传导系统、改变血流动力学和代谢，或造成器质性损害——前三者随药物清除而消失，器质性损害则可持续存在。',
          '动作电位与心电图的对应：0 相减慢 → QRS 增宽；平台期延长 → ST 延长；整体复极延长 → QT 延长；3 相变平 → T 波低平；复极末期延长 → U 波增高。',
          '胺碘酮可提高地高辛血药浓度，合用时注意洋地黄中毒表现。'
        ],
        differentialPoints:[
          '高钾血症：QRS 均匀增宽伴 T 波高尖、QT 缩短，与药物性 QRS 增宽伴 QT 延长不同。',
          '先天性长 QT：停药后 QT 仍延长，可有家族史和特征性 T 波形态。',
          '束支阻滞：QRS 形态呈典型左或右束支阻滞图形，且与用药无关。'
        ]
      },
      periop:{
        timing:'长期服用胺碘酮、索他洛尔等药物者，术前复查心电图（QTc、心率、传导）和电解质；QTc 明显延长（如 ≥500 ms）时先查原因再定手术时机。',
        anesthesia:'告知麻醉团队所用抗心律失常药；避免叠加延长 QT 的药物，维持钾、镁正常；胺碘酮者注意心动过缓和低血压。',
        postoperative:'术后新增药物时核对 QT 风险；禁食、呕吐、利尿导致低钾低镁时更易诱发尖端扭转。',
        consultation:'QRS 或 QTc 明显延长、出现房室阻滞或尖端扭转时立即联系心内科。'
      },
      references:[REF.crediblemeds,REF.stPart4,REF.periop],updatedAt:UPDATED,reviewStatus:'待审核'
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

  extend('stemi',{textbook:book(CH4,'42–66'),
    points:['教材强调 ST 抬高常伴对应导联 ST 压低；非 ST 抬高的广泛前壁缺血时，V4–V6 压低常伴 aVR 抬高，左主干或前降支近段闭塞时 aVR 也可抬高。','教材定位提示：下壁梗死时 ST(III) > ST(II)、aVL 压低 > I 导联，提示右冠近段；前降支包绕心尖时，前壁梗死可同时累及下壁。'],
    related:['mi-evolution','variant-angina']});
  extend('old-mi',{textbook:book(CH4,'67–69'),
    points:['教材资料：以异常 Q 波诊断陈旧性心梗敏感性约 61%、特异性约 89%；约 20% 的陈旧性心梗没有异常 Q 波。','V1–V3 呈 qrS 或 qRs 时应考虑梗死；孤立的 V1–V3 QS 而无 ST-T 改变，不足以诊断前间壁梗死（见“非梗死性 Q 波”）。'],
    related:['pseudo-infarct-q','ventricular-aneurysm','mi-evolution']});
  extend('posterior-mi',{textbook:book(CH4,'52–61'),
    points:['教材病例：正后壁梗死早期只见 V1–V4 ST 压低，V7–V9 轻度抬高（≥0.1 mV 已有意义）；约 1 周后 V1–V2 由 rS 变为 Rs、T 波高耸，V7–V9 出现 QS 波。']});
  extend('rv-infarction',{textbook:book(CH4,'63–64'),
    points:['教材资料：下后壁梗死的病理研究中，右室游离壁受累可达约 19%（最高 43%）；常规 12 导联对右室梗死几乎无诊断价值，必须加做 V3R–V6R。']});
  extend('nste-ischemia',{textbook:book(CH5,'70–81'),
    criteria:[['教材：急性冠脉供血不足','发作时 ST 水平或下斜型压低 ≥0.1 mV、持续 ≥1 分钟；R 波与 ST 夹角 >90°（下斜型）提示缺血更重'],['教材：慢性冠脉供血不足','ST 轻度压低 0.05–0.15 mV；T 波低平（< 同导联 R 波的 1/10）、双向或倒置；“冠状 T 波”为基底窄、双肢对称的倒置 T 波']],
    points:['ST 改变至少出现在两个或以上相邻导联；多支弥漫病变时不同区域的改变可互相抵消，出现“伪正常化”——原来倒置的 T 波在缺血发作时变为直立。','缺血发作可伴一过性 U 波倒置、暂时性 Q 波（顿抑）和一过性心律失常；缓解后恢复。','NSTEMI 的 ST-T 改变不具特异性，诊断依赖肌钙蛋白动态变化；需与电解质紊乱、药物、急性心包炎和急性脑血管病鉴别。','慢性缺血时 QRS 时限延长（教材：男性 ≥118 ms、女性 ≥101 ms）与猝死风险相关；Ptf-V1 绝对值 ≥0.03 mm·s 也可见。'],
    related:['variant-angina','exercise-test','cns-t-waves']});
  extend('t-wave-inversion',{related:['cns-t-waves','mi-evolution']});
  extend('st-elevation-differential',{related:['ventricular-aneurysm','variant-angina','mi-evolution']});
  extend('pulmonary-embolism',{textbook:book(CH6,'89–99'),
    criteria:[['教材：常见改变及发生率','约 82% 有右心劳损改变，10%–25% 心电图完全正常；窦速最常见；右束支阻滞约 25%；S1Q3T3 约 15%–25%；胸导联 T 波倒置 40%–68%'],['教材：21 分心电图评分','心动过速 2；不完全右束支阻滞 2；完全右束支阻滞 3；V1–V4 T 波倒置 4；V1 T 倒置 <1/1–2/>2 mm 计 0/1/2；V2、V3 各计 1/2/3；QIII 1；TIII 倒置 1；S1Q3T3 2（最高 21 分）'],['评分意义','≥3 分预测右心功能不良：敏感性约 76%、特异性约 82%；<3 分者短期转归较好'],['与 ACS 鉴别（教材引用）','III 和 V1 导联同时 T 波倒置：肺栓塞约 88%，急性冠脉综合征约 1%']],
    points:['典型时序：一过性右束支阻滞 → S1Q3T3 和右胸导联 S 波改变 → T 波倒置 → Q3 变为 r 波、S1 变浅 → 倒置 T 波逐渐变浅、恢复直立。需多次复查、动态比较。','胸导联 T 波倒置多为对称性，深度由右向左逐渐变浅（与冠心病不同）；倒置的导联数越多，右心功能不良和院内并发症越多（≥7 个导联为独立预测因素）。','新出现的右束支阻滞提示大块肺动脉主干栓塞；右束支阻滞可伴右胸导联 ST 抬高和 T 直立，酷似前壁或后壁梗死。','有效溶栓后：心率减慢、电轴左移、S1 变浅、Q3T3 好转、右束支阻滞消失；胸导联 T 波倒置反而常加深，不代表病情恶化。'],
    differentials:['Sreeram 标准（≥3 条提示肺栓塞可能）：右束支阻滞伴 V1 ST 抬高或 T 倒置；I、aVL S 波 >1.5 mm；移行区左移至 V5；III、aVF 有 Q 波而 II 无；电轴右偏或不可测；肢导低电压；III、aVF 或 V2–V4 T 波倒置。']});
  extend('hyperkalemia',{textbook:book(CH9,'174–177'),
    criteria:[['教材：血钾与心电图（大致对应）','>5.5 mmol/L：T 波高尖、QT 缩短；>6.5：QRS 增宽（均匀的室内阻滞）；>7.0：P 波变低变宽；>8.5：P 波消失（窦室传导）；>10：QRS 宽大缓慢与 T 波融合呈正弦波，继而停搏或室颤']],
    points:['高钾时的室内阻滞在心室各部位是均匀的，因此 QRS 增宽不呈典型束支阻滞或预激图形。','实际血钾与心电图常不一致：同时存在的钠、钙异常（钙剂有拮抗作用），原有心室肥厚、缺血或洋地黄，都会改变表现。合并低钙时可见 ST 段延长后接高尖 T 波。']});
  extend('hypokalemia',{textbook:book(CH9,'177–180'),
    points:['低钾使复极 3 相延长：T 波低平、U 波明显，T 与 U 融合成“驼峰”状，QT 难以准确测量（常为 QU 间期）。','低钾增加心肌自律性，可出现房性和室性早搏、心动过速（室性多见）；与洋地黄相互加重毒性，补钾可使部分洋地黄中毒表现消失。','鉴别：自主神经紊乱、过度换气、焦虑引起的非特异性 T 波改变，口服钾盐后可恢复正常。低钾合并低钙时 QT 显著延长，易发生尖端扭转。']});
  extend('calcium-disorders',{textbook:book(CH9,'181–182'),
    points:['教材：低钙使动作电位 2 相延长，表现为 ST 段延长、T 波宽度基本正常、QT 延长；合并高钾时 ST 延长后接高尖 T 波，合并低钾时 T 平坦、U 波突出。','高钙使 2 相缩短：ST 段不明显、QT 缩短，ST-T 形态与洋地黄作用相似；服用洋地黄者避免同时静脉推注钙剂。']});
  extend('digoxin-effect',{textbook:book(CH9,'168–172'),
    points:['教材：洋地黄使动作电位 2 相缩短甚至消失，先出现 T 波降低和 QT 缩短，继之 ST 下斜型压低与 T 融合（“鱼钩”样）；以 R 波为主的导联最明显。快作用制剂的改变在 10–15 分钟出现、2 小时内消失，地高辛等可持续 2–3 周甚至 6 周。','ST-T 改变程度与剂量无一定关系，“洋地黄影响”不等于中毒；部分中毒者反而没有这种 ST-T 改变。','中毒心律失常往往是“自律性增高 + 传导抑制”的组合：房速伴房室阻滞、房颤伴完全性房室阻滞和规则的交界性逸搏心律、双向性室速、室早二联律。低钾、利尿剂、心肌损害及合用胺碘酮会增加中毒风险。','服用洋地黄者运动试验易出现假阳性。'],
    related:['antiarrhythmic-drug-effects','exercise-test']});
  extend('drug-induced-long-qt',{related:['antiarrhythmic-drug-effects','cns-t-waves']});
})();

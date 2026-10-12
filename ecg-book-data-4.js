/* 第九批：参照陈新主编《黄宛临床心电图学》第 6 版（人民卫生出版社，2009）第 23–27 章（起搏心电图）整理的学习要点。
   内容为自行归纳改写，不含原书原文或图片；起搏适应证、CRT 适应证以现行指南为准，教材时代标准已标注。
   各厂家器械计时细节不同，判读以器械说明和程控结果为准。草稿，待临床医师审核。 */
(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA;
  if(!data||!Array.isArray(data.entries))return;
  const UPDATED='2026-10-12';
  const REF={
    brady:{title:'2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay · Circulation 2019',url:'https://doi.org/10.1161/CIR.0000000000000628'},
    hrsAsa:{title:'HRS/ASA 2011 Expert Consensus Statement on the Perioperative Management of Patients with Implantable Defibrillators, Pacemakers and Arrhythmia Monitors',url:'https://www.hrsonline.org/resource/2011-expert-consensus-statement-perioperative-management-patients-implantable-defibrillators/'},
    asa:{title:'ASA Practice Advisory for the Perioperative Management of Patients with Cardiac Implantable Electronic Devices · Anesthesiology 2020',url:'https://pubmed.ncbi.nlm.nih.gov/32032098/'}
  };
  const book=(chapter,pages)=>({chapter,pages});
  const CH23='第 23 章 心脏起搏和起搏心电图概论',CH24='第 24 章 心室起搏心电图',CH25='第 25 章 心房起搏和频率适应性起搏心电图',CH26='第 26 章 生理性起搏心电图',CH27='第 27 章 起搏器故障的心电图';

  const entries=[
    {
      id:'pacing-modes',title:'起搏器代码与工作方式（NBG 代码、计时周期）',category:'pacing',risk:'low',
      aliases:['NBG代码','起搏模式','VVI','AAI','DDD','VOO','DDI','VDD','VVIR','DDDR','起搏器代码','下限频率','逸搏间期','不应期','空白期','频率滞后','hysteresis'],
      related:['ventricular-pacing','atrial-pacing','dual-chamber-pacing','pacing-normal-variants','pacing-malfunction'],
      textbook:book(CH23,'460–473'),
      basic:{
        summary:'起搏器代码的前三位依次是起搏心腔、感知心腔、感知后反应（第四位 R 表示频率适应）；读起搏心电图之前，先弄清模式、下限频率和主要计时间期。',
        criteria:[['第 1 位：起搏心腔','V 心室，A 心房，D 双腔，O 无'],['第 2 位：感知心腔','V、A、D、O'],['第 3 位：感知后反应','I 抑制，T 触发，D 双重（抑制 + 触发），O 无反应'],['第 4 位','R 表示频率适应性（随活动提高起搏频率）'],['常见模式','VVI：心室按需；AAI：心房按需；DDD：双腔全能；VOO/DOO：非同步固定频率；DDI：双腔感知但不跟踪 P 波；VDD：感知心房、只起搏心室'],['基本计时','下限频率间期（无自身心搏时的最长等待时间）；感知或起搏后的不应期及其起始的空白期；有滞后功能时，自身心搏后的逸搏间期长于起搏间期']],
        diagram:{kind:'pacing-vvi',caption:'VVI 起搏教学示意：前两个为心室起搏搏动；自身 QRS 出现后起搏器被抑制并从该搏动重新计时。'},
        diagnosticPoints:[
          'VVI：感知到自身 QRS 就抑制输出并重新计时，自身心率快于下限频率时心电图上看不到起搏脉冲——此时无法判断起搏功能，可用磁铁转为非同步模式检查（按器械说明和本院流程进行）。',
          '体表测得的逸搏间期常略长于程控的起搏间期：起搏器感知的是 QRS 中电位变化最快的部分，而不是 QRS 起点。',
          '频率滞后（hysteresis）：例如起搏频率 70 次/分、滞后频率 50 次/分，自身心搏后要等 1200 ms 才发放脉冲，之后又按 857 ms（70 次/分）起搏——这是鼓励自身心律的正常功能，不是故障。',
          'VOO/AOO/DOO 没有感知功能，按固定频率发放脉冲，会与自身心律竞争；脉冲落在 T 波易损期可诱发室速或室颤。永久起搏一般不用，主要见于磁铁试验、术中防电刀干扰的临时程控，以及电池耗竭或强电磁干扰时。',
          'VVT/AAT（触发型）在感知自身心搏后立即发放一个落在不应期内的无效脉冲，表现为每个自身 QRS 起始后 20–40 ms 处叠加脉冲，属正常行为。',
          '临床上永久双腔起搏器几乎都是 DDD（可程控为 DDI、VDD、DVI、VVI、AAI、DOO、VOO 等多种模式）。'
        ],
        differentialPoints:[
          '不同厂家对计时的处理不同（以心室或心房为基础计时），同样的心电图在不同器械上的解释可能不同；疑难图形以程控报告和标记通道为准。',
          '把正常功能（滞后、频率适应、自动模式转换、心室安全起搏）误判为故障是最常见的读图错误（见“起搏心电图中易被误判为故障的正常现象”）。'
        ]
      },
      periop:{
        timing:'术前确认器械类型（起搏器 / ICD / CRT）、当前模式与下限频率、是否起搏依赖、电池状态和最近程控时间；信息不全时联系程控团队。',
        anesthesia:'起搏依赖者使用单极电刀时，可能需要程控为非同步模式（VOO/DOO）或按流程使用磁铁；非同步起搏期间注意与自身心律竞争。ICD 的磁铁反应与起搏器不同。',
        postoperative:'术中改过模式或暂停功能的器械，术后恢复原设置并确认感知和起搏正常。',
        consultation:'器械信息不明、起搏依赖或术中需调整参数时，提前联系心内科或程控团队。'
      },
      references:[REF.hrsAsa,REF.asa,REF.brady],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'atrial-pacing',title:'心房起搏与频率适应性起搏心电图',category:'pacing',risk:'low',
      aliases:['心房起搏','AAI','AAIR','心房起搏P波','频率适应性起搏','频率应答','VVIR','DDDR','传感器','变时功能不全','rate responsive'],
      related:['pacing-modes','dual-chamber-pacing','sinus-node-dysfunction'],
      textbook:book(CH25,'492–497'),
      basic:{
        summary:'心房起搏：脉冲后跟 P 波，房室传导正常时其后为自身窄 QRS；频率适应性起搏在活动时起搏频率高于下限频率，属正常功能。',
        criteria:[['心房起搏图形','起搏脉冲 → P 波 → 自身下传的 QRS（房室传导正常时）'],['P 波形态','右心耳或右房上部起搏时接近窦性；右房下部、房间隔、冠状窦起搏时与窦性 P 波不同（低位间隔起搏时下壁导联 P 波负向）'],['脉冲大小','单极起搏脉冲大，双极起搏脉冲很小，需在 12 导联中寻找'],['频率适应性（R）','依靠体动、加速度、每分通气量、QT 等传感器提高频率；如基础 60 次/分，活动后可起搏至 120 次/分']],
        diagram:{kind:'atrial-pacing',caption:'AAI 心房起搏教学示意：每个心房起搏脉冲后跟一个 P 波，之后为自身下传的窄 QRS。'},
        diagnosticPoints:[
          'AAI 适用于窦房结功能障碍而房室传导正常的患者，能保持房室顺序和正常的心室激动顺序；但病窦患者每年约 1%–2% 新发房室阻滞，发生房颤后 AAI 也失去作用，因此临床更多选择 DDD(R)。',
          'AAI 的心房通道可能感知到远场的 QRS（交叉感知）而重整心房计时，表现为心房起搏间期不规律；可通过降低心房灵敏度或延长心房不应期纠正。',
          '室性早搏不会抑制 AAI 起搏器；若心房脉冲后的 P 波不能下传（房室阻滞），QRS 会缺失——这是传导问题，不是起搏故障。',
          '频率适应性起搏用于变时功能不全的患者；活动后心率升高、静息时回落到下限频率，属于预期行为。'
        ],
        differentialPoints:[
          '心房失夺获：脉冲后没有 P 波；心房感知不良：自身 P 波后仍按时发放心房脉冲。',
          '频率适应导致的快速起搏 vs 起搏器介导的心动过速：前者与活动相关、逐渐升降，多为心房起搏；后者突发、常为心室起搏且频率接近上限跟踪频率。'
        ]
      },
      periop:{
        timing:'本身不影响手术时机；术前确认是否带频率适应功能。',
        anesthesia:'体动或通气量传感器可被术中震动、过度通气、电刀等触发，出现不明原因的起搏频率升高；必要时按流程关闭频率适应功能。',
        postoperative:'术后寒战、躁动可使体动传感器提高起搏频率；结合临床判断，不要误认为心动过速。',
        consultation:'术中术后出现无法解释的起搏频率变化时联系程控团队。'
      },
      references:[REF.brady,REF.hrsAsa],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'dual-chamber-pacing',title:'双腔起搏（DDD）心电图与上限频率行为',category:'pacing',risk:'low',
      aliases:['双腔起搏','DDD','DDDR','VAT','房室顺序起搏','DVI','AV间期','PVARP','总心房不应期','TARP','上限跟踪频率','伪文氏','2:1阻滞','模式转换','心室安全起搏','110 ms现象','交叉感知'],
      related:['pacing-modes','atrial-pacing','pmt','pacing-normal-variants','pacing-malfunction'],
      textbook:book(CH26,'498–507'),
      basic:{
        summary:'DDD 起搏器根据自身心律在四种状态间切换：心房起搏 + 自身下传、P 波跟踪心室起搏、房室顺序起搏、完全抑制；心房率超过上限时出现伪文氏、2:1 或模式转换。',
        criteria:[['AAI 样状态','窦缓但房室传导正常：只有心房脉冲，其后为自身 QRS'],['VAT（P 波跟踪）','窦律正常、房室传导异常：自身 P 波后经程控 AV 间期（常 140–230 ms）发放心室脉冲'],['房室顺序起搏（DVI 样）','窦缓 + 房室传导异常：心房、心室两个脉冲依次出现'],['完全抑制','自身心率快于下限、PR 短于程控 AV 间期：看不到脉冲'],['总心房不应期 TARP','= AV 间期 + 心室后心房不应期（PVARP）；例 150 + 300 = 450 ms，对应 133 次/分，是能跟踪的最快心房率'],['上限频率行为','心房率超过上限跟踪频率 → 伪文氏（PV 逐渐延长，直到一个 P 波落入 PVARP 不被跟踪）；超过 TARP 对应频率 → 固定 2:1；有模式转换功能时房性快速心律失常发作会自动转为不跟踪模式（如 DDI/VVI）']],
        diagram:{kind:'dual-chamber',caption:'双腔起搏教学示意：上行为房室顺序起搏（两个脉冲），下行为 P 波跟踪的心室起搏（自身 P 波后一个心室脉冲）。'},
        diagnosticPoints:[
          '起搏后 AV 间期（PAV）通常比感知后 AV 间期（SAV）长 20–50 ms，因此心房起搏和自身 P 波后的 AV 间期不同，是正常设计。',
          '心室安全起搏（“110 ms 现象”）：心房脉冲后的短窗口内心室通道感知到信号时，起搏器无法区分是交叉感知还是自身 QRS，会在约 100–120 ms 处发放一个心室脉冲。表现为 AV 间期突然缩短、脉冲落在自身 QRS 内或紧随其后——是防止心室停搏的安全机制。',
          '为减少右室起搏，许多器械有 AV 搜索、心室起搏管理（MVP，在 AAI(R) 与 DDD(R) 间自动切换）等功能：心电图上可见很长的 PR 间期、偶发的心室脉冲或个别 QRS 脱落后补发心室起搏，属于正常算法。',
          '上限频率时的伪文氏会被误认为二度房室阻滞，2:1 跟踪会使心室率突然减半；需结合程控的上限频率和 PVARP 解释。'
        ],
        differentialPoints:[
          '起搏器介导的心动过速：心室起搏频率常等于上限频率、由室早等触发、逆行 P 波驱动，见“起搏器介导的心动过速（PMT）”。',
          'DDD 心房感知过度（如感知胸大肌肌电位）会使心室跟踪起搏不规则加快；心房感知不良则表现为自身 P 波后又出现心房脉冲。'
        ]
      },
      periop:{
        timing:'本身不影响手术时机；术前了解模式、下限和上限频率、是否起搏依赖。',
        anesthesia:'电刀干扰可被心房通道误感知而触发快速心室起搏，或被心室通道感知而抑制输出；起搏依赖者按流程程控为 DOO 或使用磁铁。术中房性快速心律失常时，有模式转换的器械会自动停止跟踪。',
        postoperative:'术后恢复原程控；新发房颤时关注是否已发生模式转换、心室率是否合适。',
        consultation:'上限频率附近出现症状性心率骤降、怀疑感知异常或 PMT 时联系程控团队。'
      },
      references:[REF.brady,REF.hrsAsa,REF.asa],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'crt-pacing',title:'心脏再同步治疗（双心室起搏）心电图',category:'pacing',risk:'medium',
      aliases:['CRT','双心室起搏','心脏再同步','左室起搏','CRT-D','CRT-P','冠状窦电极','BiV pacing'],
      related:['dual-chamber-pacing','ventricular-pacing','left-bundle-branch-block'],
      textbook:book(CH26,'507–510'),
      basic:{
        summary:'左室导线经冠状窦置于侧静脉等部位：左室起搏呈右束支阻滞样图形、I 导联常以负向为主；双心室起搏的 QRS 通常比单纯右室起搏窄。',
        criteria:[['左室起搏','右束支阻滞样 QRS；额面电轴取决于导线位置，朝向心尖时电轴左偏，I 导联主波向下较常见'],['双心室起搏','形态取决于左、右心室哪一侧提前及 VV 间期；QRS 时限通常较自身左束支阻滞或单纯右室起搏缩短'],['教材时代适应证（2007–2009）','LVEF ≤35%、QRS ≥120 ms、窦律、充分药物治疗后 NYHA III–IV 级；现行指南更强调左束支阻滞形态和更宽的 QRS，以最新心衰/起搏指南为准']],
        diagram:{kind:'crt',caption:'双心室起搏教学示意：I 导联以负向为主；V1 导联起搏 QRS 以 R 波为主（右束支阻滞样），且较单纯右室心尖起搏窄。'},
        diagnosticPoints:[
          'CRT 的目标是尽量 100% 双心室起搏；心电图上出现自身 QRS、融合波比例增多（如房颤、频发室早、自身房室传导过快）提示再同步效果下降。',
          '原本的双心室起搏图形突然变成典型右室心尖起搏图形（左束支阻滞样、I 导联正向）时，提示左室导线失夺获或移位。',
          '左室导线可刺激膈神经，引起与心跳同步的上腹部或膈肌跳动。'
        ],
        differentialPoints:[
          '右室导线误入冠状窦或穿孔：同样可表现为右束支阻滞样起搏图形，需结合病史与影像判断。',
          '房颤伴快心室率时自身下传抑制双心室起搏，QRS 变宽、形态改变，不是器械本身故障。'
        ]
      },
      periop:{
        timing:'CRT 患者多有严重心衰，术前评估心功能是否稳定；了解是否为 CRT-D（带除颤功能）。',
        anesthesia:'维持双心室起搏比例：避免心房快速心律失常和心动过速导致自身下传；CRT-D 需按流程处理快速心律失常治疗功能并备好体外除颤。',
        postoperative:'复查起搏图形，确认仍为双心室起搏；关注容量、心衰加重和房颤。',
        consultation:'起搏图形改变、双心室起搏比例下降或心衰加重时联系心内科和程控团队。'
      },
      references:[REF.brady,REF.hrsAsa],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'pacing-normal-variants',title:'起搏心电图中易被误判为故障的正常现象',category:'pacing',risk:'low',
      aliases:['融合波','伪融合波','假性融合','频率滞后','心室安全起搏','110ms','起搏频率升高','起搏位置','右室流出道起搏','间隔部起搏','起搏电轴'],
      related:['pacing-modes','dual-chamber-pacing','pacing-malfunction','ventricular-pacing'],
      textbook:book(CH24,'486–490'),
      basic:{
        summary:'融合波、伪融合波、频率滞后、心室安全起搏、频率适应性加速和不同起搏部位造成的图形差异，都是常见的正常表现，判定“故障”前先逐一排除。',
        criteria:[['融合波','自身激动与起搏脉冲共同除极心室，QRS 形态和时限介于自身与起搏之间'],['伪融合波','心室已被自身激动完全除极，脉冲落在不应期内，只是叠加在自身 QRS 上，QRS 形态与自身完全相同'],['频率滞后','自身心搏后的逸搏间期长于起搏间期'],['心室安全起搏','双腔起搏时 AV 间期突然缩短到约 100–120 ms'],['起搏部位','右室心尖：左束支阻滞样 + 电轴左偏（−30° 至 −90°）；右室流出道间隔部：左束支阻滞样 + 电轴右偏、下壁导联高 R、QRS 较窄；流出道游离壁：电轴正常、I 导联正向、下壁 R 波有切迹']],
        diagram:{kind:'pacing-fusion',caption:'VVI 起搏教学示意：前两个为完全起搏的宽 QRS；第三个为融合波（形态介于两者之间）；第四个为伪融合波（脉冲叠加在自身窄 QRS 上）。'},
        diagnosticPoints:[
          '融合波和伪融合波多见于自身心率接近起搏频率时，本身不是故障；但长期大量伪融合可能提示感知稍迟，可在程控时复核。',
          '右室心尖起搏患者如果起搏电轴由左偏变为正常或右偏，应想到导线可能移位到流入道或流出道；原为左束支阻滞样突然变为右束支阻滞样时，要考虑导线穿孔或误入冠状静脉。',
          '同一份心电图里出现起搏频率不一致时，先想到频率适应、滞后、睡眠频率、AV 搜索等程控功能，再考虑故障。'
        ],
        differentialPoints:[
          '真正的失夺获：脉冲落在不应期之外仍无相应的 P 或 QRS（见“起搏功能异常”）。',
          '感知不良：脉冲出现在自身心搏之后、不应期之外的位置，而不是叠加在 QRS 内。'
        ]
      },
      periop:{
        timing:'这些都是器械的正常功能，本身不影响手术时机；术前读图时注意不要误判为故障而推迟手术。',
        anesthesia:'术中监护见到融合波或起搏频率变化时，先结合程控参数判断，避免不必要的处理。',
        postoperative:'与术前心电图比较起搏 QRS 形态和电轴，形态改变时排除导线移位。',
        consultation:'起搏 QRS 形态或电轴明显改变时联系程控团队，必要时拍胸片。'
      },
      references:[REF.brady,REF.hrsAsa],updatedAt:UPDATED,reviewStatus:'待审核'
    },
    {
      id:'pmt',title:'起搏器介导的心动过速（PMT）',category:'pacing',risk:'medium',
      aliases:['PMT','起搏器介导的心动过速','无休止环形心动过速','ELT','pacemaker mediated tachycardia','逆行P波跟踪'],
      related:['dual-chamber-pacing','premature-ventricular-contractions','wide-complex-tachycardia'],
      textbook:book(CH27,'522–526'),
      basic:{
        summary:'双腔起搏特有的环形心动过速：心室激动逆传至心房，逆行 P 波被心房通道感知并触发心室起搏，再逆传，周而复始；多由室性早搏诱发。',
        criteria:[['前提','完好的室房逆传 + 双腔起搏（DDD/VDD）'],['常见诱因','室性早搏（最常见）；房早伴长 AV 间期；心房感知不良或感知过度；心房失夺获；程控 AV 间期过长'],['心电图','心室起搏的宽 QRS 心动过速，频率多接近上限跟踪频率（也可更低）；每个 QRS 后可见逆行 P 波，呈 P 波跟踪（VAT）样'],['预防','程控 PVARP 长于室房逆传时间；开启抗 PMT 算法（识别后自动延长 PVARP 一次以打断环路）']],
        diagram:{kind:'pmt',caption:'PMT 教学示意：一个室性早搏后，逆行 P 波（倒置）被跟踪，触发连续快速的心室起搏，频率接近上限跟踪频率。'},
        diagnosticPoints:[
          '与其他折返性心动过速相同，短的心房不应期和长的 AV 间期有利于诱发和维持。',
          '教材病例：心房感知过度（感知胸大肌肌电位，活动右上肢时诱发）和心房失夺获都可诱发 PMT；降低心房灵敏度、延长 PVARP 或提高心房输出后不再发作。',
          '临床上可用磁铁使起搏器转为非同步模式（不再感知心房）来终止 PMT；具体做法以器械说明和本院流程为准。'
        ],
        differentialPoints:[
          '窦速或房速的正常跟踪：有窦性或房性 P 波在前、频率随生理状态变化。',
          '室性心动过速：宽 QRS 前没有起搏脉冲，形态与起搏 QRS 不同。',
          '频率适应性起搏加速：与活动相关、逐渐升降。'
        ]
      },
      periop:{
        timing:'既往有 PMT 发作者，术前确认抗 PMT 功能已开启。',
        anesthesia:'术中室性早搏、电刀干扰引起的心房感知过度都可诱发 PMT；备好磁铁并按流程使用，同时排除低钾、缺血等诱发室早的因素。',
        postoperative:'术后突然出现接近上限频率的规则心室起搏心动过速时，先考虑 PMT；记录 12 导联心电图并联系程控团队。',
        consultation:'发作反复或伴低血压时立即联系程控团队；必要时程控延长 PVARP。'
      },
      references:[REF.brady,REF.hrsAsa,REF.asa],updatedAt:UPDATED,reviewStatus:'待审核'
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
  extend('ventricular-pacing',{textbook:book(CH24,'480–490'),
    criteria:[['教材：起搏脉冲','脉宽约 0.5 ms，纸上为陡直细线；振幅与两极距离成正比——单极大（可有反向“过冲”和衰减曲线，使 QRS、ST 变形），双极小（部分导联看不见）'],['教材：右室心尖起搏','QRS ≥120 ms，左束支阻滞样，电轴显著左偏（−30° 至 −90°）；V5–V6 可呈宽 R 波或以 S 波为主（后者稍多）；T 波与 QRS 主波方向相反']],
    points:['单极起搏时脉冲方向取决于机壳所在位置，不能根据脉冲方向判断起搏部位；起搏部位要看起搏 QRS 的形态和电轴。','较大的脉冲及其衰减曲线可酷似 QRS：判断是否真正夺获，要看其后有没有 T 波。','教材强调右室心尖长期起搏会造成心室不同步，增加房颤和心衰风险；现代器械多通过减少不必要的心室起搏或选择间隔、希浦系统起搏改善。'],
    related:['pacing-modes','pacing-normal-variants','crt-pacing']});
  extend('pacing-malfunction',{textbook:book(CH27,'514–526'),
    criteria:[['教材：无输出','该出现脉冲时没有脉冲：单腔表现为心率慢；DDD 心房无输出时表现为 VVI 方式，心室无输出伴房室阻滞时心率慢或停搏'],['教材：失夺获','脉冲在不应期外仍无相应 P 或 QRS（持续或间歇）'],['教材：感知不足','出现自身 P 或 QRS，起搏器仍按时发放脉冲；落在不应期内不起搏（功能性失夺获），落在不应期外则起搏，类似早搏'],['教材：感知过度','心室感知过度 → 脉冲被不规则抑制，出现长于起搏间期的间歇；DDD 心房感知过度 → 心室跟踪起搏不规则加快'],['电池耗竭','起搏频率降低，模式改变（VVI→VOO、AAI→AOO、DDD→DOO 或 VVI），起搏与感知功能障碍']],
    points:['无输出的常见原因：导线断裂（阻抗显著升高，可在体位改变时才出现，如站立时晕厥）、绝缘层破损（阻抗降低）、单极导线被程控为双极、接口松动、电池耗竭。植入早期多为接口问题，3–4 年后多为导线和电池问题。','失夺获最常见的原因是导线移位（尤其植入早期，胸片可证实），其次为起搏阈值升高、安全范围不足、电池耗竭、导线损坏和心肌穿孔。','感知不足最常见的原因是感知灵敏度设置不当（自身 P/R 波振幅低于设定值），其次为导线移位、导线损坏和极性程控错误。','感知过度最常见的原因是感知肌电位（活动上肢时出现），其次为外界电磁干扰、导线损坏和双腔起搏的交叉感知。','教材病例：心房、心室导线插反时，第一个脉冲后出现宽 QRS，第二个脉冲后无反应，两脉冲间隔 110 ms（心室安全起搏）；心室导线移位进入冠状静脉时起搏 QRS 呈右束支阻滞样，伴与心跳同步的上腹部跳动。','排查顺序：病史和症状 → 囊袋与肌肉抽动 → 12 导联与 Holter → 胸片（导线位置、断裂、穿孔）→ 程控（电池、阻抗、阈值、心内电图与标记通道）。'],
    differentials:['DDD 心房感知不良时，自身 P 波后又发放心房脉冲，AV 间期可缩短到约 110 ms（触发心室安全起搏），不要误认为心室感知问题。'],
    related:['pacing-normal-variants','pmt','dual-chamber-pacing']});
  extend('lbbb-paced-mi',{related:['crt-pacing']});
})();

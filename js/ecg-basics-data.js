/* 判读基础（第四批）：电极位置与接反、电轴、间期测量、伪差识别。草稿，待临床医师审核。 */
(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA;
  if(!data||!data.basics)return;
  Object.assign(data.basics,{
    calibration:{
      points:[
        '每份心电图先看定标方波：标准增益 10 mm/mV（方波高 10 mm），走纸速度 25 mm/s。',
        '“半电压”（5 mm/mV）常用于高电压 QRS，此时所有振幅都被缩小一半；“双电压”（20 mm/mV）则放大一倍。判断左室肥厚、低电压和 ST 偏移时必须先确认增益。',
        '走纸速度 50 mm/s 时，所有间期在纸上加宽一倍，心率看起来“变慢”、QRS 看起来“变宽”；直接用 25 mm/s 的格数换算会出错。',
        '肢体导联与胸导联可分别设置增益，有的机器会在不同区段标注不同方波，判读前逐一核对。'
      ]
    },
    electrodes:{
      limb:[
        '四肢电极：右上肢（RA，红）、左上肢（LA，黄）、左下肢（LL，绿）、右下肢（RL，黑，为参考/接地电极）。颜色为国际电工委员会（IEC）常用配色，不同厂家可能不同，以电极标签为准。',
        '肢体电极可放在手腕、脚踝或靠近躯干的位置，但左右须对称；靠近躯干放置（如运动试验、监护）会改变电轴和振幅，与常规心电图对比时需注意。'
      ],
      chest:[
        'V1：胸骨右缘第 4 肋间。V2：胸骨左缘第 4 肋间。',
        'V4：左锁骨中线第 5 肋间。V3：V2 与 V4 连线的中点。',
        'V5：左腋前线，与 V4 同一水平。V6：左腋中线，与 V4、V5 同一水平（不是沿肋间向上走）。',
        '找肋间的方法：先摸到胸骨角（Louis 角），其两侧为第 2 肋，向下依次数到第 4 肋间。女性 V4–V6 放在乳房下方，不要放在乳房表面。',
        '附加导联：右胸导联 V3R–V4R 与 V3–V4 位置左右对称，用于评估右室梗死；后壁导联 V7（左腋后线）、V8（肩胛线）、V9（脊柱旁线）与 V6 同一水平，用于评估后壁梗死。'
      ],
      reversals:[
        ['左右上肢接反（LA/RA）','最常见。I 导联 P 波、QRS、T 波全部倒置；aVR 与 aVL 互换（aVR 变为直立）；II 与 III 互换；胸导联正常。与右位心鉴别：右位心时胸导联 R 波从 V1 到 V6 逐渐降低。'],
        ['右上肢与左下肢接反（RA/LL）','II 导联倒置（P、QRS、T 均倒置）；I、III 导联变为倒置后互换；aVR 与 aVF 互换；aVL 不变。'],
        ['左上肢与左下肢接反（LA/LL）','较隐蔽：I 与 II 互换，III 倒置，aVL 与 aVF 互换。线索：I 导联 P 波比 II 导联更高，或下壁导联“新出现”异常。'],
        ['涉及右下肢（中性电极）的接反','RA 与 RL 接反时 II 导联近乎一条直线；LA 与 RL 接反时 III 导联近乎一条直线。两下肢互换（LL/RL）通常几乎没有变化。'],
        ['胸导联放置过高','V1–V2 放到第 2–3 肋间：可出现 rSr′、T 波倒置、P 波倒置，酷似右束支阻滞、前间壁梗死或 Brugada 图形。'],
        ['胸导联顺序接错','R 波递增突然中断（如 V3 振幅异常小于 V2 和 V4），而相邻导联形态“互换”；重新核对电极顺序后复查。']
      ]
    },
    axisGuide:{
      steps:[
        '计算 QRS 净振幅：R 波高度减去 Q 波和 S 波的深度（单位 mm）。净值为正表示该导联 QRS 主波向上。',
        '象限法（最常用）：看 I 和 aVF。I 正、aVF 正 → 正常（0° 至 +90°）；I 正、aVF 负 → 需看 II 导联：II 正则为 0° 至 −30°（仍属正常），II 负则为电轴左偏；I 负、aVF 正 → 电轴右偏；I 负、aVF 负 → 极度电轴偏移。',
        '等电位导联法：找 QRS 净振幅最接近 0 的肢体导联，电轴与该导联垂直；再根据垂直导联的正负确定方向。',
        '精确计算：以 I 导联为 0°、aVF 为 +90°，电轴 ≈ arctan（aVF 净振幅 / I 净振幅）。可用下方工具或“心电图工具”页直接计算。'
      ],
      ranges:[
        ['正常电轴','−30° 至 +90°'],
        ['电轴左偏','−30° 至 −90°（常见于左前分支阻滞、下壁心梗、左室肥厚、预激等）'],
        ['电轴右偏','+90° 至 +180°（常见于右室肥厚、左后分支阻滞、肺栓塞、慢性肺病、侧壁心梗，也见于体型瘦长者和儿童）'],
        ['极度电轴偏移','−90° 至 −180°（需考虑室性心律、导联接反、高钾血症等）']
      ]
    },
    intervals:[
      ['心率','规则节律：60000 / RR（ms）；或 300 / RR 间大格数、1500 / RR 间小格数（25 mm/s）。不规则节律：数 6 秒内 QRS 个数 × 10，并报告范围。'],
      ['PR 间期','P 波起点至 QRS 起点。选 P 波最清楚、PR 最长的导联（常为 II）。正常 120–200 ms。'],
      ['QRS 时限','QRS 起点至终点（J 点）。选 QRS 最宽的导联，最好在多个导联同步测量。正常 <120 ms；110–119 ms 为不完全性传导延迟。'],
      ['QT 间期','QRS 起点至 T 波终点。常选 II 或 V5；T 波终点用“切线法”：T 波下降支最陡处作切线，与基线交点即为终点；U 波不计入 QT。'],
      ['QTc','RR 应取 QT 所在心搏之前的 RR。心率 60–90 次/分时各公式结果接近；心率快时 Bazett 会高估，可同时参考 Fridericia 等公式，并注明所用公式。'],
      ['不规则节律下的测量','房颤等节律时测量 3–5 个心搏取平均值，或在相对较长和较短的 RR 后分别测量后取平均。'],
      ['宽 QRS 时的 QT','束支阻滞、起搏时 QRS 增宽会使 QT 延长，常规阈值不适用；可参考 JT 间期（QT − QRS）或专门的校正方法，并请专科判断。']
    ],
    artifacts:[
      {kind:'artifact-tremor',title:'肌电干扰（震颤、寒战、紧张）',points:['基线上叠加细小、不规则的高频波动，四肢导联常更明显。','可被误认为房颤（细颤波）或房扑；帕金森病静止性震颤（约 4–6 Hz）可酷似房扑波。','鉴别：QRS 节律仍规则；让患者放松、保暖、手臂平放后复查。']},
      {kind:'artifact-ac',title:'交流电干扰（工频 50 Hz）',points:['基线呈规则、致密的细锯齿状波动，频率固定（国内电网为 50 Hz）。','常见原因：电极接触不良、导线靠近电源线、床旁电器未接地。','处理：检查电极与皮肤接触，远离电器，必要时开启机器的工频滤波。']},
      {kind:'artifact-wander',title:'基线漂移',points:['基线随呼吸或体动缓慢上下起伏。','会干扰 ST 段和 T 波判断，造成假性 ST 抬高或压低。','处理：清洁皮肤、电极贴牢，嘱患者平静呼吸；比较多个心搏的 ST 段是否一致。']},
      {kind:'artifact-motion',title:'运动伪差酷似室速或室颤',points:['刷牙、拍背、颤抖、搬动患者或胸外按压时，可出现大幅不规则波动，酷似室速或室颤。','关键线索：原有窄 QRS 仍按规律“穿行”在伪差中；伪差只见于部分导联；患者清醒、有脉搏。','永远先看患者：清醒、有脉搏时不应按室颤除颤。']}
    ],
    references:[
      {title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part I：心电图及其技术（2007）',url:'https://hrsonline.org/guidance/clinical-resources/ahaaccfhrs-scientific-statement-recommendations-standardization-and-interpretation'},
      {title:'Common ECG Lead Placement Errors. Part I: Limb Lead Reversals · Int J Med Students',url:'https://ijms.pitt.edu/IJMS/article/view/95'},
      {title:'Common ECG Lead Placement Errors. Part II: Precordial Misplacements · Int J Med Students',url:'https://ijms.pitt.edu/IJMS/article/view/96'},
      {title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part IV：ST 段、T 波、U 波与 QT 间期（2009）',url:'https://www.hrsonline.org/resource/ahaaccfhrs-recommendations-standardization-and-interpretation-electrocardiogram-part-iv-st-segment/'},
      {title:'AHA/ACCF/HRS 心电图标准化与判读建议 Part III：室内传导障碍（2009）',url:'https://pubmed.ncbi.nlm.nih.gov/19281930/'}
    ]
  });
})();

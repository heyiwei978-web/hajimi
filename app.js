const traumaGroups = [
  '股骨转子间骨折','股骨干骨折','胫骨干骨折','胫骨平台骨折','踝关节三踝骨折','跟骨骨折','桡骨远端骨折','肱骨近端骨折','肱骨干骨折','锁骨骨折','尺桡骨干骨折','髌骨骨折','掌骨骨折','指骨骨折','跖骨骨折','趾骨骨折','骨盆骨折'
];
const groups = ['TKA','THA','人工股骨头置换',...traumaGroups];
const types = [
  ['入院首次病程','入院','入院首程','完整病例特点、专科查体、诊断依据、鉴别及诊疗计划。'],
  ['入院期间查房','入院','查房','记录尚未手术阶段的变化、手术时机判断和围手术期风险优化。'],
  ['术前主刀查房','术前','查房','记录手术指征、手术方式、风险评估、会诊落实及术前准备。'],
  ['多学科术前讨论','术前','术前讨论','包含住院医师、主治医师、麻醉医师、内科医师、护士长及主任医师发言。'],
  ['完整手术记录','术中','手术记录','包括麻醉、体位、切口、显露、复位或置换、固定、冲洗、缝合及术后处理。'],
  ['术后首次病程','术后','术后病程','手术简述、术后查体、病情分析、风险判断及处理意见。'],
  ['术后第1天查房','术后','查房','疼痛、切口、引流、患肢血运感觉运动、化验及康复启动。'],
  ['术后第3天日常病程','术后','术后病程','复查结果、切口和引流变化、并发症筛查及康复进展。'],
  ['康复评估与训练记录','术后','康复记录','记录功能基线、训练内容、负重级别、ROM或肌力、反应及下一阶段目标。'],
  ['影像复查申请与结果分析','术后','检查理由','明确复查的临床问题、检查部位、结果分析及对后续治疗的影响。'],
  ['正式会诊申请单','术前','会诊申请单','完整病情摘要、申请依据、拟手术信息及需要会诊解决的问题。'],
  ['会诊回报与落实','术前','会诊记录','记录会诊意见、执行措施、复评情况及对手术时机的影响。'],
  ['选择治疗方案沟通记录','术前','沟通记录','记录保守与手术方案的获益、风险、局限和患者最终选择。']
];
const scenarios = [
  ['通用场景','下肢肿胀：静脉超声理由与回报','术后','检查理由','新发或加重下肢肿胀时，记录静脉超声检查理由、结果与处理。'],
  ['通用场景','术后切口少量渗液记录','术后','术后病程','记录渗液量、性质、局部查体、感染鉴别和后续复评。'],
  ['通用场景','新发气促：心超申请及会诊单','术前','会诊申请单','围手术期新发气促时，记录进一步心脏评估和手术风险处理。'],
  ['通用场景','拒绝进一步心脏检查沟通','术前','沟通记录','记录患者拒绝进一步检查的内容、风险告知、替代方案与后续安排。']
];

const profile = {
  TKA:{dx:'膝关节骨性关节炎（终末期）',surgery:'全膝关节置换术',site:'膝关节',exam:'膝关节肿胀，内外侧关节间隙压痛，活动度受限，屈伸时疼痛，可伴内翻或外翻畸形；末梢血运、感觉及足趾活动可。',rehab:'股四头肌等长收缩、踝泵、直腿抬高及膝关节屈伸训练，逐步增加ROM和助行器下负重行走。'},
  THA:{dx:'髋关节疾病',surgery:'全髋关节置换术',site:'髋关节',exam:'髋部压痛，髋关节主动及被动活动受限，屈曲、内旋或外展时疼痛明显；患肢末梢血运及感觉运动可。',rehab:'踝泵、股四头肌及臀肌等长收缩，床边转移和助行器下行走训练；结合入路执行髋关节脱位预防。'},
  '人工股骨头置换':{dx:'股骨颈骨折',surgery:'人工股骨头置换术',site:'髋部',exam:'患髋疼痛，患肢可见短缩外旋畸形，腹股沟区及大粗隆周围压痛，轴向叩击痛阳性；末梢循环及感觉运动可。',rehab:'术后早期踝泵、肌力训练、床边坐起及助行器下分级负重，强调髋关节脱位预防。'},
  '股骨转子间骨折':{dx:'股骨转子间骨折',surgery:'股骨转子间骨折闭合/切开复位内固定术（髓内钉）',site:'髋部及大腿近端',exam:'髋部及大腿近端肿胀、压痛，患肢活动明显受限，可呈短缩外旋；足背动脉搏动可，末梢感觉运动可。',rehab:'踝泵、股四头肌等长收缩及床上转移训练；根据固定稳定性和骨质条件逐步进行助行器下负重。'},
  '股骨干骨折':{dx:'股骨干骨折',surgery:'股骨干骨折复位髓内钉内固定术',site:'大腿',exam:'大腿肿胀、压痛及纵向叩击痛，局部可触及骨擦感或异常活动；膝踝活动因疼痛受限，末梢循环及感觉运动可。',rehab:'踝泵、股四头肌等长收缩、膝关节活动及助行器下分级负重。'},
  '胫骨干骨折':{dx:'胫骨干骨折',surgery:'胫骨干骨折复位髓内钉内固定术',site:'小腿',exam:'小腿肿胀、压痛，局部畸形或异常活动；重点观察皮肤张力、筋膜室张力及足背/胫后动脉，足趾感觉活动。',rehab:'踝泵、膝踝关节主动活动及肌力训练，根据骨折稳定性逐步负重。'},
  '胫骨平台骨折':{dx:'胫骨平台骨折',surgery:'胫骨平台骨折切开复位内固定术',site:'膝关节及胫骨近端',exam:'膝关节及胫骨近端肿胀、压痛，关节活动因疼痛受限；检查皮肤软组织、侧副韧带稳定性及远端血运感觉。',rehab:'早期踝泵、股四头肌收缩和保护下膝关节ROM训练，按骨折类型与固定稳定性控制负重。'},
  '踝关节三踝骨折':{dx:'踝关节三踝骨折',surgery:'踝关节三踝骨折切开复位内固定术',site:'踝关节',exam:'踝周明显肿胀、压痛，可见畸形或皮下瘀斑，踝关节活动受限；检查皮肤张力、水疱、足背及胫后动脉、足趾感觉运动。',rehab:'抬高消肿、足趾主动活动，固定允许后逐步踝关节ROM；未获医嘱前避免负重。'},
  '跟骨骨折':{dx:'跟骨骨折',surgery:'跟骨骨折切开复位内固定术',site:'足跟',exam:'足跟明显肿胀、压痛及瘀斑，跟骨横径增宽，可见张力性水疱；踝足活动因疼痛受限，末梢循环感觉可。',rehab:'抬高、足趾活动和消肿治疗；切口稳定后逐步踝足ROM，按骨折愈合情况控制负重。'},
  '桡骨远端骨折':{dx:'桡骨远端骨折',surgery:'桡骨远端骨折切开复位内固定术',site:'腕部',exam:'腕部肿胀、压痛，可见畸形，腕关节活动明显受限；检查正中神经感觉、拇指对掌及手指屈伸，桡动脉搏动可。',rehab:'抬高消肿、手指全范围活动，固定稳定后开始腕关节渐进ROM及握力训练。'},
  '肱骨近端骨折':{dx:'肱骨近端骨折',surgery:'肱骨近端骨折切开复位内固定术',site:'肩部',exam:'肩部肿胀、压痛及活动受限；重点检查腋神经支配区感觉、三角肌收缩及桡动脉搏动、手指感觉运动。',rehab:'手腕肘主动活动，肩部按固定和肩袖情况进行钟摆及被动/主动辅助活动。'},
  '肱骨干骨折':{dx:'肱骨干骨折',surgery:'肱骨干骨折切开复位内固定术',site:'上臂',exam:'上臂肿胀、压痛及异常活动；重点检查桡神经功能，包括腕背伸、指伸及虎口背侧感觉，末梢循环可。',rehab:'手指、腕、肘主动活动和肌力训练，肩部按疼痛及固定稳定性逐步恢复。'},
  '锁骨骨折':{dx:'锁骨骨折',surgery:'锁骨骨折切开复位内固定术',site:'锁骨区',exam:'锁骨区肿胀、隆起、压痛，可触及骨擦感；检查局部皮肤受压情况及上肢末梢血运、感觉运动。',rehab:'早期手指、腕、肘活动；肩关节按固定稳定性逐步进行钟摆和主动辅助训练。'},
  '尺桡骨干骨折':{dx:'尺桡骨干骨折',surgery:'尺桡骨干骨折切开复位内固定术',site:'前臂',exam:'前臂肿胀、压痛、旋转受限；检查正中、尺、桡神经感觉运动及桡动脉搏动，注意筋膜室张力。',rehab:'抬高消肿，手指腕肘主动活动，逐步恢复前臂旋前旋后。'},
  '髌骨骨折':{dx:'髌骨骨折',surgery:'髌骨骨折切开复位内固定术',site:'膝前区',exam:'膝前区肿胀、压痛，可触及骨折间隙；评估主动直腿抬高及伸膝装置连续性，末梢循环感觉运动可。',rehab:'根据内固定稳定性进行股四头肌收缩和分阶段屈膝训练，支具保护下负重。'},
  '掌骨骨折':{dx:'掌骨骨折',surgery:'掌骨骨折切开/闭合复位内固定术',site:'手部',exam:'手背肿胀、压痛，握拳受限；重点观察手指旋转畸形、指端血运、感觉及屈伸功能。',rehab:'抬高消肿和未固定关节早期活动，稳定后逐步增加掌指关节ROM与握力。'},
  '指骨骨折':{dx:'指骨骨折',surgery:'指骨骨折复位内固定术',site:'手指',exam:'患指肿胀、压痛、活动受限，可见成角或旋转畸形；指端毛细血管充盈及感觉可，屈伸肌腱功能评估。',rehab:'保护固定同时尽早活动未受限关节，按稳定性逐步恢复患指屈伸，预防粘连和僵硬。'},
  '跖骨骨折':{dx:'跖骨骨折',surgery:'跖骨骨折复位内固定术',site:'足部',exam:'足背肿胀、压痛及负重痛；检查足趾排列、足背动脉搏动、足趾感觉和主动活动。',rehab:'抬高消肿，足趾主动活动；按骨折部位和固定方式限制或逐步恢复负重。'},
  '趾骨骨折':{dx:'趾骨骨折/足趾毁损伤',surgery:'趾骨骨折复位内固定术或清创修复术',site:'足趾',exam:'患趾肿胀、压痛、活动受限；如伴创面，记录大小、污染、软组织及骨外露情况，并评估趾端血运感觉。',rehab:'创面和固定保护下进行允许范围内足趾活动，逐步恢复负重及步态。'},
  '骨盆骨折':{dx:'骨盆骨折',surgery:'骨盆骨折复位内固定术',site:'骨盆及髋周',exam:'骨盆及腹股沟区压痛，骨盆挤压/分离试验谨慎评估；同时关注腹部、会阴、泌尿系统症状及双下肢神经血管。',rehab:'早期呼吸训练、踝泵和下肢等长收缩；依据骨盆稳定性制定床边转移及负重计划。'}
};

const state={group:'all',stage:'all',type:'all',q:'',patient:null,activeTemplate:null};
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];

function labelFor(g){return g==='TKA'?'全膝关节置换':g==='THA'?'全髋关节置换':g;}
function makeTemplates(){
  const arr=[]; groups.forEach(g=>types.forEach(([name,stage,type,desc])=>arr.push({group:g,name:`${labelFor(g)} · ${name}`,short:name,stage,type,desc})));
  scenarios.forEach(([group,name,stage,type,desc])=>arr.push({group,name,short:name,stage,type,desc}));
  return arr;
}
const templates=makeTemplates();

function patient(){return state.patient||{name:'患者',sex:'',age:'',admissionNo:'',bedNo:'',side:'右',diagnosis:'',history:'',note:''};}
function hxText(p){return p.history?`既往史：${p.history}。`:'既往史、个人史及过敏史以实际询问及病历资料为准。';}
function identity(p){return `${p.name||'患者'}${p.sex?`，${p.sex}`:'' }${p.age?`，${p.age}岁`:'' }${p.admissionNo?`，住院号：${p.admissionNo}`:'' }${p.bedNo?`，床号：${p.bedNo}`:'' }`;}
function disease(g,p){const d=profile[g]||profile['TKA']; return {...d,dx:p.diagnosis||`${p.side||'右'}侧${d.dx}`};}
function commonHeader(t,p,d){return `记录名称：${t.name}\n患者信息：${identity(p)}\n主要诊断：${d.dx}\n\n`;}
function generate(t){
  const p=patient();
  if(t.group==='通用场景') return generateScenario(t,p);
  const d=disease(t.group,p); const side=p.side||'右'; const note=p.note?`\n补充情况：${p.note}`:'';
  const H=commonHeader(t,p,d);
  const map={
    '入院首次病程':`${H}一、病例特点\n${identity(p)}，因${d.dx}收入院。现主要表现为${d.site}疼痛、肿胀或活动受限，具体受伤机制、起病时间及既往治疗经过以实际病史为准。${hxText(p)}${note}\n\n二、专科检查\n${side}侧${d.exam}\n\n三、诊断依据\n结合病史、体征及已完成的X线/CT/MRI等影像资料，当前诊断考虑${d.dx}。影像分型、移位程度、软组织条件及合并损伤应按实际检查记录。\n\n四、鉴别诊断\n需结合具体疾病与关节/骨折部位，鉴别隐匿骨折、病理性骨折、感染性疾病、神经血管损伤及其他可导致局部疼痛和功能障碍的疾病。若存在发热、异常炎症指标、非典型影像或神经血管异常，进一步完善针对性检查。\n\n五、诊疗计划\n1. 完善必要的术前实验室和影像学评估，避免与临床问题无关的固定套餐式检查。\n2. 动态观察疼痛、肿胀、皮肤软组织、远端血运及感觉运动。\n3. 根据病情给予制动/保护、抬高消肿及多模式镇痛；评估VTE风险并制定机械或药物预防。\n4. 结合全身情况、局部软组织和影像学结果评估${d.surgery}的适应证及手术时机。\n5. 向患者及家属说明保守与手术治疗的预期获益、局限和常见风险，形成共同决策。`,
    '入院期间查房':`${H}今日查房，患者一般情况平稳，${d.site}疼痛及肿胀较入院时【减轻/无明显变化】，无新发肢体麻木、明显憋胀或末梢循环障碍。查体：${side}侧${d.exam}\n\n目前诊断明确。继续评估局部软组织条件和全身手术耐受性。若存在明显肿胀、水疱、皮肤张力增高或内科风险未优化，暂缓手术并继续消肿、制动及风险处理；待条件允许后实施${d.surgery}。已再次核对必要化验和影像，异常结果逐项分析并处理。`,
    '术前主刀查房':`${H}主刀医师术前查房：患者诊断为${d.dx}，结合症状、功能障碍及影像学表现，当前具备相应手术指征，拟行${d.surgery}。查体：${side}侧${d.exam}\n\n术前重点：1. 核对手术侧别、影像及植入物/器械；2. 评估皮肤软组织及感染风险；3. 复核血红蛋白、凝血、肝肾功能及需要处理的内科问题；4. 结合个体风险制定VTE预防、抗菌药物预防和围手术期镇痛方案；5. 已就感染、出血、神经血管损伤、内固定/假体相关并发症、关节僵硬、血栓栓塞及再次手术可能等进行沟通。患者及家属理解后同意拟定方案。`,
    '多学科术前讨论':`${H}讨论时间：【填写】\n讨论地点：【填写】\n主持人：主任医师\n参加人员：住院医师、主治医师/主刀医师、麻醉医师、内科医师、护士长、主任医师等。\n\n住院医师汇报：患者诊断${d.dx}，现有病史、体征及影像相互支持。${hxText(p)} 当前拟行${d.surgery}。\n\n主治医师发言：手术指征结合疼痛/功能障碍、影像学严重程度或骨折移位与稳定性综合判断。术中需重视解剖复位/假体位置、软组织保护、止血和神经血管保护，术后根据固定稳定性制定康复。\n\n麻醉医师发言：依据ASA分级、心肺功能、气道、化验及合并症评估麻醉风险，建议按实际情况选择麻醉方式并加强围术期监测。\n\n内科医师发言：结合患者基础疾病及当前检查评估围术期风险，对血压、血糖、心肺功能、抗栓药物等提出个体化调整意见；若无活动性不稳定内科疾病，可在监测及优化后手术。\n\n护士长发言：已完成术前宣教、皮肤及身份侧别核对、跌倒和VTE风险宣教，术后重点观察生命体征、切口引流、患肢血运感觉运动和康复执行。\n\n主任医师总结：综合讨论意见，目前诊断明确，拟行${d.surgery}。术前充分优化全身及局部条件，术中严格无菌并保护重要组织，术后加强疼痛、感染、VTE及功能恢复管理。若出现新的风险因素，及时调整手术时机或方案。`,
    '完整手术记录':`${H}术前诊断：${d.dx}\n术后诊断：${d.dx}\n手术名称：${d.surgery}\n麻醉方式：【按实际填写】\n手术体位：【按实际填写】\n术者/助手：【按实际填写】\n\n手术经过：患者入室后核对身份、手术部位及手术方式。麻醉满意后取相应体位，常规消毒铺巾。根据${d.site}解剖及手术计划选择合适切口，逐层切开并保护重要神经血管及软组织。显露病变部位后，在透视/直视下完成复位、截骨、髓腔处理或关节面处理；按术前计划及术中实际情况置入相应内固定物或假体，检查位置、长度、力线、稳定性及关节活动情况满意。充分冲洗术野，彻底止血，必要时留置引流，逐层缝合切口并无菌敷料覆盖。术中标本、植入物型号、出血量、输血量及并发情况均应按实际记录。患者术毕生命体征平稳，安返病房/复苏室。\n\n术后计划：抬高或体位保护，多模式镇痛，按指征进行抗菌药物预防和VTE预防；复查影像评估复位/固定/假体位置；根据固定稳定性执行${d.rehab}`,
    '术后首次病程':`${H}患者今日在麻醉下行${d.surgery}，手术过程按手术记录。术后返回病房时生命体征【平稳】，神志【清楚】。${side}侧切口敷料【干燥/少量渗血】，引流管【通畅/无】，引流液性质及量按实际记录。患肢末梢血运、感觉及主动活动较术前【无明显异常变化】。\n\n术后病情分析：目前处于术后早期，应重点观察麻醉恢复、出血及贫血、切口与引流、感染、VTE、疼痛、尿潴留及神经血管变化。\n\n处理：1. 监测生命体征和切口引流；2. 多模式镇痛并根据疼痛评分调整；3. 按个体风险实施VTE预防；4. 完成必要的术后血常规/电解质及影像复查；5. 指导踝泵、呼吸及允许范围内早期活动；6. 结合手术稳定性逐步执行${d.rehab}`,
    '术后第1天查房':`${H}术后第1天查房：患者夜间休息【可】，诉切口及${d.site}疼痛【可耐受/需追加镇痛】，无胸闷、气促、明显头晕或患肢进行性麻木。切口敷料【干燥】，引流【通畅】，24小时引流量【填写】ml。${side}侧末梢血运、感觉和主动活动可。\n\n复查血常规及生化重点关注Hb、WBC、电解质及肾功能；如存在术后贫血、低钠、低钾或炎症指标异常，应结合症状与趋势处理，避免仅凭单次异常值机械用药。\n\n今日开始/继续康复：${d.rehab} 训练强度以疼痛和生命体征耐受为限。继续VTE预防、镇痛、切口管理和并发症筛查。`,
    '术后第3天日常病程':`${H}术后第3天，患者一般情况平稳，${d.site}疼痛较前减轻。切口无明显红肿，敷料【干燥/少量渗液】，引流量较前减少；达到拔管条件时按无菌原则拔除并观察针孔渗液。${side}侧末梢循环及感觉运动可。\n\n已复查【X线/DR/CT】提示复位、内固定或假体位置【满意】，未见明显继发移位等异常；如为下肢手术且出现患肢肿胀、疼痛不对称、周径增加或VTE风险较高，则根据临床问题行下肢静脉超声，而非无指征重复检查。\n\n继续康复：${d.rehab} 记录实际ROM、步行距离、辅助器具和负重级别，根据切口、疼痛及影像结果逐步调整。`,
    '康复评估与训练记录':`${H}康复评估：生命体征稳定，疼痛评分【填写】分。${d.site}切口/软组织情况【填写】。肌力、关节活动度、转移能力、步行能力及辅助器具使用情况按实际量化记录。\n\n今日训练：${d.rehab}\n\n训练剂量：【组数/次数/时长】；负重级别：【不负重/部分负重/耐受负重/完全负重，以术式和医嘱为准】。训练后患者无明显胸闷、气促、头晕或患肢异常疼痛。\n\n阶段目标：在保证固定/假体及软组织安全的前提下，改善ROM、肌力、转移和步态，降低关节僵硬、失用性肌萎缩及VTE风险。下一次根据实际测量结果调整训练。`,
    '影像复查申请与结果分析':`${H}复查目的：患者术后需评估${d.site}复位、内固定/假体位置、力线及有无继发移位等，影像结果将直接影响负重及康复方案，故申请【DR/X线/CT，按实际需要】复查。\n\n检查结果：【填写正式报告核心内容】。\n\n结果分析：影像示【复位/固定/假体位置满意或具体异常】。结合患者疼痛、切口及神经血管查体，目前【可继续原康复方案/需限制负重/需进一步CT或专科处理】。若无新的临床问题，不进行无指征重复影像。`,
    '正式会诊申请单':`${H}申请科室：【内科/心内科/麻醉科/其他】\n申请目的：围手术期风险评估及治疗建议。\n\n病情摘要：${identity(p)}，目前诊断${d.dx}，拟行${d.surgery}。${hxText(p)} 当前生命体征、心肺症状、心电图、心脏超声、实验室等关键结果请按实际填写。\n\n申请理由：患者拟接受手术及麻醉，现存在【具体合并症/异常检查/症状】，需进一步判断其是否属于需要术前处理的不稳定情况，并优化围手术期用药及监测。\n\n请会诊重点解决：1. 当前内科风险分层；2. 既往长期用药围手术期调整；3. 是否需要追加针对性检查或治疗；4. 是否存在暂缓手术的医学指征；5. 围手术期监测建议。`,
    '会诊回报与落实':`${H}今日收到【科室】会诊意见：结合患者${d.dx}及拟行${d.surgery}，会诊医师认为【填写风险判断】；建议【填写药物调整、监测、追加检查或其他措施】。\n\n已落实：1. 【填写执行措施】；2. 对相关指标进行复查/监测；3. 将会诊意见告知患者及家属，并与麻醉及手术团队沟通。\n\n目前对手术时机的影响：【可按计划手术/需进一步优化后再评估/建议暂缓】。后续若出现胸痛、明显气促、循环不稳定或其他新发症状，及时重新评估。`,
    '选择治疗方案沟通记录':`${H}今日就${d.dx}治疗方案与患者及家属充分沟通。\n\n可选方案一：继续保守治疗，包括保护/固定、镇痛、消肿、康复及必要复查。优点为避免近期手术和麻醉风险；局限在于对于明显移位、不稳定骨折或终末期关节病，可能存在疼痛持续、畸形愈合/不愈合、功能受限或后期仍需手术的可能。\n\n可选方案二：${d.surgery}。潜在获益为恢复稳定性、解剖关系或改善疼痛和功能；风险包括感染、出血、神经血管损伤、血栓栓塞、切口问题、关节僵硬、内固定/假体相关并发症、麻醉及心脑血管事件，以及再次手术可能。\n\n已说明两种方案均不能保证完全恢复，最终疗效受年龄、骨质、软组织、基础疾病、康复依从性等因素影响。患者及家属经考虑后选择：【填写】。相关疑问已解答。`
  };
  return map[t.short]||H+t.desc;
}

function generateScenario(t,p){
 const H=`记录名称：${t.name}\n患者信息：${identity(p)}\n\n`;
 if(t.short.includes('下肢肿胀')) return H+`患者术后出现患肢肿胀/憋胀，需结合术后反应性水肿、静脉回流障碍及下肢深静脉血栓形成等鉴别。查体应记录双侧周径差、皮温、压痛、足背/胫后动脉、感觉运动及有无胸闷气促。因临床表现不能可靠排除DVT，且结果将影响抗凝及活动方案，故申请下肢静脉超声。\n\n超声回报：【填写具体静脉及是否血栓】。\n\n分析及处理：【如无DVT，继续常规VTE预防、抬高和康复；如检出血栓，根据部位、症状及出血风险制定抗凝/会诊/复查方案】。`;
 if(t.short.includes('切口少量渗液')) return H+`今日查房见术后切口敷料局部少量渗液，约【填写】cm范围，颜色【淡血性/浆液性/其他】，无明显恶臭。切口周围【无/有】进行性红肿、皮温升高、明显压痛或波动感，患者体温【填写】，全身情况【填写】。\n\n考虑术后早期少量渗液需动态观察，当前尚不能仅据此诊断感染。给予更换无菌敷料、减少污染和机械牵拉，复查血常规/CRP需结合临床趋势解释。若渗液持续增加、出现脓性分泌物、进行性红肿热痛、发热或炎症指标持续异常，则及时行创面评估、培养及进一步处理。`;
 if(t.short.includes('新发气促')) return H+`患者拟行骨科手术，术前新发气促/活动耐量下降。查体记录血压、心率、SpO₂、双肺呼吸音、下肢水肿及心脏杂音。鉴于症状可能提示心功能异常、容量负荷问题或其他心肺疾病，且结果将影响麻醉风险和手术时机，故申请心脏超声并请内科/心内科会诊。\n\n会诊重点：明确是否存在失代偿性心衰、严重瓣膜病或其他需要术前处理的不稳定心脏问题；提出用药、容量管理及围术期监测建议。在病因未明确或病情未稳定前，暂缓择期手术更为稳妥。`;
 return H+`患者因既往心脏病史/异常检查，医师建议进一步完善针对性心脏检查及会诊，以评估围手术期心血管风险。已向患者及家属说明：拒绝进一步评估可能导致未识别的心功能不全、心肌缺血、心律失常或其他高风险情况，围手术期可出现严重心脑血管事件甚至危及生命。\n\n患者/家属经充分考虑后仍拒绝【具体检查或会诊】，表示已理解上述风险。已说明可选择延期手术、继续保守治疗或待进一步评估后再决定。后续若仍拟手术，需由手术、麻醉及相关内科团队基于现有信息重新进行风险—获益判断，并如实记录共同决策。`;
}

function selectGroup(g){
 state.group=g;state.stage='all';state.type='all';state.q='';
 $('#searchInput').value='';$('#stageFilter').value='all';$('#typeFilter').value='all';
 $$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.group===g));render();
 if(innerWidth<760)document.querySelector('.content').scrollIntoView({behavior:'smooth'});
}
function renderNav(){
 $('#traumaNav').innerHTML=traumaGroups.map(g=>`<button class="nav-item" data-group="${g}">${g}</button>`).join('');
 $$('.nav-item').forEach(b=>b.addEventListener('click',()=>selectGroup(b.dataset.group)));
}
function renderTypeFilter(){
 const unique=[...new Set(types.map(x=>x[2]).concat(scenarios.map(x=>x[3])))];
 $('#typeFilter').innerHTML='<option value="all">全部记录类型</option>'+unique.map(x=>`<option>${x}</option>`).join('');
}
function filtered(){const q=state.q.trim().toLowerCase(); return templates.filter(t=>(state.group==='all'||t.group===state.group)&&(state.stage==='all'||t.stage===state.stage)&&(state.type==='all'||t.type===state.type)&&(!q||`${t.group} ${t.name} ${t.type} ${t.stage} ${t.desc}`.toLowerCase().includes(q)));}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function projectCategory(g){if(g==='TKA'||g==='THA'||g==='人工股骨头置换')return '关节置换';if(g==='通用场景')return '围手术期';return '创伤骨科';}
function templateCard(t){return `<article class="card"><div class="tags"><span class="tag stage">${t.stage}</span><span class="tag">${t.type}</span></div><h3>${state.group==='all'?t.name:t.short}</h3><p>${t.desc}</p><div class="card-actions"><button class="btn ghost preview" data-index="${templates.indexOf(t)}">预览</button><button class="btn primary copy" data-index="${templates.indexOf(t)}">复制</button></div></article>`;}
function bindTemplateActions(){$$('.preview').forEach(b=>b.onclick=()=>openPreview(templates[+b.dataset.index]));$$('.copy').forEach(b=>b.onclick=()=>copyText(generate(templates[+b.dataset.index])));}
function renderProjectOverview(list){const po=[...groups,'通用场景'];const cards=po.map(g=>{const items=list.filter(t=>t.group===g);if(!items.length)return '';const chips=['入院','术前','术中','术后'].map(s=>{const n=items.filter(t=>t.stage===s).length;return n?`<span>${s} ${n}</span>`:''}).join('');return `<article class="project-card" data-project="${g}" role="button" tabindex="0"><div class="project-card-top"><span class="project-kind">${projectCategory(g)}</span><strong>${items.length} 份</strong></div><h3>${labelFor(g)}</h3><p>点击进入后按入院、术前、术中、术后分类浏览相关记录。</p><div class="project-stage-chips">${chips}</div><div class="project-open">打开项目 <span>→</span></div></article>`;}).join('');$('#templateGrid').innerHTML=`<div class="project-grid">${cards}</div>`;const pcs=$$('.project-card');pcs.forEach(c=>{const o=()=>selectGroup(c.dataset.project);c.onclick=o;c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();o()}}});return pcs.length;}
function renderGroupView(list){const sec=['入院','术前','术中','术后'].map(stage=>{const items=list.filter(t=>t.stage===stage);if(!items.length)return '';return `<section class="stage-section"><div class="stage-section-head"><div><span class="stage-dot"></span><h3>${stage}</h3></div><span>${items.length} 份</span></div><div class="stage-template-list">${items.map(templateCard).join('')}</div></section>`;}).join('');$('#templateGrid').innerHTML=`<div class="group-toolbar"><button id="backProjects" class="btn ghost">← 返回全部项目</button><span>当前按入院、术前、术中、术后分类</span></div>${sec}`;const back=$('#backProjects');if(back)back.onclick=()=>selectGroup('all');bindTemplateActions();}
function render(){const list=filtered();$('#templateCount').textContent=templates.length;$('#allCount').textContent=templates.length;if(state.group==='all'&&!state.q.trim()){const n=renderProjectOverview(list);$('#resultTitle').textContent='全部项目';$('#resultCount').textContent=`${n} 个项目 · ${list.length} 份模板`;$('#emptyState').hidden=n>0;return;}if(state.group==='all'){$('#resultTitle').textContent='搜索结果';$('#resultCount').textContent=`${list.length} 份`;$('#templateGrid').innerHTML=list.map(templateCard).join('');$('#emptyState').hidden=list.length>0;bindTemplateActions();return;}$('#resultTitle').textContent=labelFor(state.group);$('#resultCount').textContent=`${list.length} 份`;renderGroupView(list);$('#emptyState').hidden=list.length>0;}
function openPreview(t){state.activeTemplate=t; $('#previewTitle').textContent=t.name; $('#previewMeta').textContent=`${t.stage} · ${t.type}`; $('#previewContent').textContent=generate(t); $('#previewDialog').showModal();}
async function copyText(text){try{await navigator.clipboard.writeText(text); toast('已复制到剪贴板');}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('已复制到剪贴板');}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1600);}
function openPatient(){const f=$('#patientForm'); if(state.patient) Object.entries(state.patient).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v||''}); $('#patientDialog').showModal();}
function savePatient(e){e.preventDefault(); const data=Object.fromEntries(new FormData($('#patientForm')).entries()); state.patient=data; sessionStorage.setItem('orthoPatient',JSON.stringify(data)); updatePatient(); $('#patientDialog').close(); if(state.activeTemplate&&$('#previewDialog').open) $('#previewContent').textContent=generate(state.activeTemplate); toast('患者信息已应用');}
function updatePatient(){const p=state.patient; $('#patientStrip').hidden=!p; if(p){$('#patientNameView').textContent=p.name||'未命名患者';$('#patientMetaView').textContent=[p.sex,p.age&&`${p.age}岁`,p.admissionNo&&`住院号 ${p.admissionNo}`,p.side&&`${p.side}侧`].filter(Boolean).join(' · ');}}

renderNav(); renderTypeFilter(); render();
try{state.patient=JSON.parse(sessionStorage.getItem('orthoPatient')||'null')}catch{} updatePatient();
$('#searchInput').addEventListener('input',e=>{state.q=e.target.value;render()}); $('#stageFilter').onchange=e=>{state.stage=e.target.value;render()}; $('#typeFilter').onchange=e=>{state.type=e.target.value;render()};
$('#resetFilters').onclick=()=>selectGroup('all');
$('#patientBtn').onclick=openPatient; $('#editPatientBtn').onclick=openPatient; $('#savePatient').onclick=savePatient; $('#clearPatientBtn').onclick=()=>{state.patient=null;sessionStorage.removeItem('orthoPatient');updatePatient();toast('患者信息已清除')};
$('#closePreview').onclick=()=>$('#previewDialog').close(); $('#copyPreview').onclick=()=>state.activeTemplate&&copyText(generate(state.activeTemplate)); $('#printPreview').onclick=()=>window.print();
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus()}});

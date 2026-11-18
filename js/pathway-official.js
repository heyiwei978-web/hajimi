(()=>{
  const notice='https://www.nhc.gov.cn/yzygj/c100068/202310/ff33d2ec3ac6488ab8083fbd6f9c59c1.shtml';
  const enc=(name)=>'/bl/guke/'+encodeURIComponent(name);
  const commonQuality=[
    '路径入组率、完成率、变异率和退出率',
    '术前住院日、总住院日及非计划延长住院',
    '预防性抗菌药物使用、VTE预防和疼痛管理执行情况',
    '切口并发症、VTE、神经血管并发症及非计划再次手术',
    '术后功能恢复、再入院及门诊随访完成情况'
  ];
  const commonPatient=[
    ['入院','完成病史、查体、必要影像和围手术期风险评估。'],
    ['术前','完成手术与麻醉评估、知情沟通和术前康复训练。'],
    ['手术','实施计划术式并启动疼痛、血液、感染及血栓管理。'],
    ['康复','根据术式逐步恢复关节活动、肌力、转移和步行能力。'],
    ['出院','达到切口、疼痛、功能及安全标准后出院并按计划复诊。']
  ];
  const commonVariances=[
    '基础疾病控制不佳或加重，需额外专科治疗并影响原路径进度。',
    '发生切口感染、VTE、神经血管损伤、肺部并发症等围手术期问题。',
    '软组织条件、骨质情况、骨折/肿瘤范围或术中发现导致手术方案调整。',
    '患者主动改变治疗方式、诊断发生变化或出现需长期住院处理的并发症。'
  ];
  const pathways={
    tha:{
      name:'全髋关节置换术加速康复临床路径',nav:'全髋关节置换术',category:'关节置换 / 翻修',
      stay:'2～7天',surgeryDay:'住院第2～3天',recordUrl:'/bl/guke/THA',
      applies:'适用于符合路径诊断并拟行初次全髋关节置换术的患者，包括原发/继发性髋关节病、股骨头缺血性坏死、部分陈旧性股骨颈骨折等。',
      entry:['诊断明确、症状与影像相符，保守治疗无效且手术指征明确。','基础疾病在住院期间不需要特殊专科处理或不会影响路径实施。','完成围手术期风险评估、功能评估及患者教育，能够配合早期康复。'],
      tests:'血常规、尿/粪常规、肝肾功能、电解质、血糖、凝血、感染筛查；骨盆及患髋X线；胸部影像、心电图、下肢静脉超声。根据基础疾病选择心超、肺功能、冠脉评估及其他检查。',
      preop:'完成上级医师/主刀评估、术前讨论、必要会诊和麻醉评估；确认假体及手术计划；完成知情同意、血液管理、VTE风险评估和康复预演。',
      operation:'按计划完成全髋关节置换；执行预防感染、血液管理和多模式镇痛策略；术后完成手术记录、首次病程和肢端神经血管评估。',
      postop:'术后尽早开展踝泵、肌力、床椅转移和助行器步行训练；动态评估切口、疼痛、血红蛋白、VTE风险及影像学假体位置。',
      discharge:['生命体征平稳，精神食欲及大小便恢复。','切口干燥，无红肿、渗出、硬结等感染征象。','髋关节主动屈曲至少90°、外展至少35°、伸直0°；严重术前畸形/僵硬者可按国家路径降低相应功能阈值。','可扶助行器自主下地行走并完成基本如厕。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/1f94f9136c6442d881fa5c60c2a18d70.pdf',notice
    },
    fnf:{
      name:'股骨颈骨折闭合复位内固定术加速康复临床路径',nav:'股骨颈骨折内固定',category:'成人创伤',
      stay:'3～8天',surgeryDay:'住院第1～3天',recordUrl:enc('股骨颈骨折内固定'),
      applies:'适用于股骨颈骨折并拟行闭合复位内固定术的患者，内固定方式可包括空心螺钉、DHS、FNS、股骨近端髓内钉或钢板螺钉等。',
      entry:['股骨颈骨折诊断明确，结合年龄、骨折类型和骨质情况具有保头内固定指征。','评估软组织、肢端循环和神经功能，排除需要优先处理的其他严重损伤。','基础疾病经评估可耐受手术并能够进入早期康复流程。'],
      tests:'骨盆正位、患髋/股骨颈X线，必要时CT或MRI；常规血液、凝血、肝肾功能、电解质检查；胸部影像、心电图及下肢静脉超声，合并疾病者按需扩展。',
      preop:'尽早完成骨折分型、复位与固定策略、麻醉及会诊评估；完成VTE、营养、疼痛和功能状态评估，并进行踝泵、股四头肌及床上活动指导。',
      operation:'在影像监视下完成闭合复位和内固定，关注复位质量、植入物位置与股骨头血供保护；术后进行疼痛、切口、血液及VTE管理。',
      postop:'进行踝泵、股四头肌及髋膝活动训练，负重等级依据骨折稳定性和固定方式个体化；复查骨盆/患髋影像并监测内固定位置。',
      discharge:['一般情况恢复良好，轻度疼痛不影响睡眠和锻炼。','切口干燥，无感染征象。','髋关节主动屈曲至少90°、伸直0°，基本如厕无明显困难。','复查影像显示骨折复位和内固定位置满意，无松动等征象。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/d559ee34c9f24c36a7379a18fdeb66cb.pdf',notice
    },
    intertroch:{
      name:'股骨转子间骨折闭合复位内固定术加速康复临床路径',nav:'股骨转子间骨折',category:'成人创伤',
      stay:'3～10天',surgeryDay:'住院第1～4天',recordUrl:enc('股骨转子间骨折'),
      applies:'适用于股骨转子间骨折并拟行闭合复位内固定术的患者。',
      entry:['外伤史、查体及影像学支持股骨转子间骨折，手术指征明确。','重点评估老年患者心肺、营养、贫血、VTE及谵妄风险并尽快优化。','无需要优先处理的危及生命合并伤，基础疾病可支持进入手术路径。'],
      tests:'骨盆及患侧股骨近端X线，必要时CT/MRI；常规实验室、凝血、感染筛查、胸部影像、心电图及下肢静脉超声，老年患者按需完善心肺等评估。',
      preop:'尽早完成麻醉和内科风险评估，明确闭合复位及内固定方案；进行疼痛、营养、VTE、压疮和早期活动计划。',
      operation:'完成闭合复位内固定，重点恢复长度、力线和稳定性；执行围术期抗菌、血液管理、镇痛和VTE预防。',
      postop:'早期开展踝泵、股四头肌、坐起及转移训练，负重程度依据固定稳定性和骨质情况决定；复查影像并关注贫血、谵妄和VTE。',
      discharge:['生命体征平稳，饮食、睡眠及排泄恢复，疼痛不明显影响锻炼。','切口干燥，无红肿、渗出和感染征象。','髋关节主动屈曲至少90°、伸直0°，坐便如厕无明显困难。','骨盆及患髋复查影像显示内固定位置良好，无松动等征象。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/39b1117f28284a21b9175d9afdba049b.pdf',notice
    },
    pilon:{
      name:'Pilon骨折切开复位内固定术加速康复临床路径',nav:'Pilon骨折',category:'成人创伤',
      stay:'7～14天',surgeryDay:'住院第1～7天',recordUrl:enc('胫骨Pilon骨折'),
      applies:'适用于胫骨远端Pilon骨折并拟行切开复位内固定术的患者。',
      entry:['高能量损伤史、踝部体征及X线/CT证实胫骨远端关节面骨折。','术前必须重点评估软组织肿胀、水疱、开放伤及神经血管状态，手术时机取决于软组织条件。','合并严重软组织危象或骨筋膜室综合征时需先处理急症并视情况产生路径变异。'],
      tests:'踝关节X线及CT三维重建；常规血液、肝肾功能、电解质、凝血、感染筛查；胸部影像、心电图、下肢静脉超声，按病情选择动脉超声及心肺检查。',
      preop:'持续抬高、消肿和软组织监测，明确分期或一期固定策略；完成麻醉、术前讨论、必要会诊、VTE和感染风险评估。',
      operation:'根据骨折形态和软组织条件行切开复位内固定，恢复关节面及下肢力线；围术期执行抗菌、镇痛、血液和VTE管理。',
      postop:'持续观察足踝肿胀、皮温、颜色、感觉运动及切口；开展直腿抬高和非负重转移训练，复查影像确认关节面复位和内固定位置。',
      discharge:['生命体征和一般情况稳定，疼痛可控。','切口干燥，无感染或进行性软组织危象。','可完成主动直腿抬高，官方路径以无外力抬离床面30°、持续5秒作为功能目标之一。','影像显示关节面复位满意，无≥2mm明显台阶/分离，肢体力线及内固定位置正确。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/4b0fcf7cc6b44052a66aca1a3ddd61a0.pdf',notice
    },
    trimalleolar:{
      name:'三踝骨折切开复位内固定术加速康复临床路径',nav:'三踝骨折',category:'成人创伤',
      stay:'7～10天',surgeryDay:'住院第1～4天',recordUrl:enc('踝关节三踝骨折'),
      applies:'适用于三踝骨折（包括符合条件的开放性三踝骨折）并拟行切开复位内固定术的患者。',
      entry:['明确踝部外伤史和典型肿胀、瘀斑、畸形、压痛与活动受限。','踝关节X线及CT三维重建显示内踝、外踝和后踝骨折，与临床表现相符。','重点评估软组织条件、末梢循环、神经功能及VTE风险。'],
      tests:'踝关节及胫腓骨X线、踝关节CT三维重建；常规实验室、胸部影像、心电图和下肢静脉超声，按病情选择下肢动脉、心肺等进一步检查。',
      preop:'抬高消肿并等待软组织条件允许；完成骨折分型、手术入路和固定顺序讨论，完成麻醉、知情同意、VTE及感染预防计划。',
      operation:'完成三踝骨折切开复位内固定并评估踝穴和下胫腓联合稳定性；执行围术期抗菌、镇痛、血液及VTE管理。',
      postop:'术后72小时内密切观察肿胀和末梢循环；进行肌力、膝关节及足趾活动，按固定稳定性进行踝ROM和非负重助行训练。',
      discharge:['生命体征平稳，切口干燥，无感染或软组织危象。','术侧踝关节无畸形，官方路径目标为主动背伸>20°、跖屈≥30°。','可扶助行器不负重自主下地行走。','口服镇痛药可控制疼痛，不影响睡眠和功能训练。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/cf8cb69a8c5b4b169c3d65e90a5e3090.pdf',notice
    },
    acdf:{
      name:'颈椎前路椎间盘切除减压融合术加速康复临床路径',nav:'颈椎前路减压融合（ACDF）',category:'脊柱',
      stay:'3～7天',surgeryDay:'住院第2～3天',recordUrl:enc('脊髓型颈椎病'),
      applies:'适用于符合路径诊断并拟行颈椎前路椎间盘切除减压融合术的患者，包括部分神经根型/脊髓型颈椎病、颈椎间盘突出及颈椎后纵韧带骨化等。',
      entry:['症状、神经系统查体和影像学压迫节段相符，具有明确手术指征。','完成颈椎X线及MRI/CT等必要影像，明确节段、稳定性和前路手术可行性。','评估吞咽、气道、神经功能及基础疾病，能够实施术后颈托保护和早期活动。'],
      tests:'常规实验室、胸部影像、心电图、下肢静脉超声；颈椎正侧位/斜位X线及MRI，必要时CT三维重建、动力位X线和其他神经电生理检查。',
      preop:'明确减压和融合节段，完成术前讨论、麻醉评估、必要会诊及神经功能基线记录；讲解颈托、吞咽/声音变化和神经症状监测。',
      operation:'完成前路椎间盘切除、神经结构减压、植骨融合和内固定；可根据条件选择术中神经电生理监测；术后重点观察气道、切口血肿和神经功能。',
      postop:'颈托保护下逐渐坐起和下床，评估四肢感觉运动、吞咽、声音、切口和引流；复查影像确认内置物位置。',
      discharge:['生命体征平稳、实验室检查无明显异常。','引流管拔除，伤口无感染及皮瓣坏死。','术后影像显示内置物位置满意，原有症状缓解。','无需要继续住院治疗的并发症或合并症。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/c47d9d48328140d3b636b93a46d5dc09.pdf',notice
    },
    lumbarFusion:{
      name:'腰椎后路短节段减压融合术加速康复临床路径',nav:'腰椎后路短节段减压融合',category:'脊柱',
      stay:'3～10天',surgeryDay:'住院第2～4天',recordUrl:enc('腰椎滑脱症'),
      applies:'适用于腰椎不稳定、腰椎管狭窄合并需要融合的情况及腰椎滑脱等，并拟行后路短节段减压融合术者。',
      entry:['腰痛、下肢放射痛/麻木或间歇性跛行与影像相符，正规保守治疗无效并存在手术指征。','明确是否存在节段不稳、滑脱和需要融合的节段，不将单纯减压病例机械套入本路径。','完成神经功能、VTE、营养及基础疾病风险评估。'],
      tests:'常规实验室、胸部影像、心电图、下肢静脉超声；腰椎正侧位及动力位X线、MRI，必要时CT及其他神经功能检查。',
      preop:'确定减压和融合节段、内固定及植骨策略；完成麻醉、术前讨论、必要会诊和神经功能基线记录，指导腰围使用和术后翻身下床方法。',
      operation:'完成后路减压、短节段固定与融合；术后关注神经功能、脑脊液漏、切口/引流和疼痛，按风险实施VTE预防。',
      postop:'腰围或支具保护下逐步坐起、站立和步行，进行双下肢肌力及核心稳定训练；复查血常规、肝肾功能及影像学内固定位置。',
      discharge:['生命体征、饮食排泄及血液/肝肾功能基本稳定。','引流管已拔除，切口干燥，无红肿、硬结或皮下积液。','无严重腰痛，下肢疼痛/麻木改善，口服镇痛药可控制疼痛。','复查X线提示内固定位置满意，无新发神经损伤及其他需住院处理问题。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/fef5bce5594d43a6aa55e9132c492647.pdf',notice
    },
    pvp:{
      name:'经皮椎体成形术/经皮椎体后凸成形术加速康复临床路径',nav:'椎体成形 / 后凸成形',category:'脊柱',
      stay:'1～4天',surgeryDay:'住院第1～2天',recordUrl:null,
      applies:'适用于骨质疏松性椎体压缩/病理性骨折并拟行PVP或PKP的患者。',
      entry:['低能量损伤或无明显外伤后的胸腰背痛，影像学支持骨质疏松性椎体压缩骨折。','疼痛节段与MRI/CT等影像学责任椎体相符，并具有椎体强化手术指征。','排除需优先处理的感染、肿瘤或神经压迫等其他病因。'],
      tests:'胸腰椎X线、CT和MRI，必要时全脊柱影像；骨密度、骨代谢指标；常规实验室及基础心肺评估。',
      preop:'确认责任椎体和穿刺节段，评估骨质疏松治疗计划和麻醉/镇静风险，完成手术沟通和术后早期活动宣教。',
      operation:'在影像引导下完成PVP/PKP，重点监测骨水泥分布及渗漏风险；术后观察下肢神经功能、呼吸及胸腹部不适。',
      postop:'国家路径提出术后早期坐起和活动；继续镇痛及抗骨质疏松治疗，观察穿刺点和新发神经、胸肺症状。',
      discharge:['生命体征、精神食欲和排泄稳定。','穿刺切口干燥，无红肿、硬结等感染征象。','口服镇痛药能够有效控制疼痛，不影响睡眠和功能锻炼。','继续抗骨质疏松治疗并按计划复诊。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/0786822d2755448fa229f0dc74ed2664.pdf',notice
    },
    taa:{
      name:'全踝关节置换术加速康复临床路径',nav:'全踝关节置换术',category:'足踝 / 关节置换',
      stay:'5～8天',surgeryDay:'住院第2～3天',recordUrl:null,
      applies:'适用于原发性、创伤后或其他符合手术指征的终末期踝关节病变，并拟行全踝关节置换术的患者。',
      entry:['长期踝痛和活动受限，负重位影像显示胫距关节严重退变。','完成双下肢力线、足踝畸形、韧带稳定性和软组织条件评估。','不存在无法纠正的严重畸形、感染或其他手术禁忌。'],
      tests:'踝关节负重位X线、跟骨轴位、过伸过屈位及双下肢全长X线，必要时CT/MRI；常规围术期实验室及心肺、VTE评估。',
      preop:'确认假体方案、下肢力线和是否需要同期截骨/韧带平衡；完成麻醉、术前讨论、VTE和感染预防。',
      operation:'完成全踝关节置换及必要的软组织平衡/矫形操作，执行围术期抗菌、血液、镇痛和VTE管理。',
      postop:'踝关节支具保护、抬高消肿，按是否同期韧带修复/截骨决定ROM和负重进度；复查踝穴位、侧位、跟骨轴位及下肢全长影像。',
      discharge:['生命体征平稳，切口干燥，无感染征象。','国家路径功能目标包括术侧踝主动伸直0°或-5°以内、屈曲至少30°。','口服镇痛药可控制疼痛，不影响睡眠和康复。','影像显示假体位置与大小合适，跟骨无明显内外翻畸形。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/762260d347d64beb83411b899d871563.pdf',notice
    },
    tumorHip:{
      name:'肿瘤半髋/全髋关节置换术加速康复临床路径',nav:'肿瘤半髋 / 全髋置换',category:'骨肿瘤 / 重建',
      stay:'6～12天',surgeryDay:'住院第3～4天',recordUrl:null,
      applies:'适用于符合保肢及重建条件的股骨近端/髋周骨与软组织肿瘤以及部分假体相关复杂病例，并拟行肿瘤半髋或全髋关节置换术者。',
      entry:['病史、影像和病理“三结合”诊断明确，外科边界和保肢手术指征明确。','主要神经血管束可安全分离或重建，手术能够改善生存或生活质量。','完成肿瘤分期、重建方案、输血与围术期多学科评估。'],
      tests:'肿瘤局部X线、CT、MRI及必要的全身分期检查；常规实验室、炎症指标、心肺评估和VTE筛查，必要时血管影像。',
      preop:'由骨肿瘤、麻醉及相关专科完成多学科评估，确认切除边界、假体重建、血管神经保护/重建和输血策略。',
      operation:'按肿瘤学原则完成切除与半髋/全髋重建，围术期强化血液、感染、镇痛及VTE管理，术后康复需结合切除范围和软组织重建个体化。',
      postop:'监测切口、引流、神经血管和肿瘤重建稳定性；按重建情况推进肌力、转移和步行训练，必要时延迟负重。',
      discharge:['生命体征、精神食欲和排泄稳定。','切口干燥，无红肿、硬结等感染征象。','国家路径提出术侧髋主动伸直达到0°附近（允许轻度屈曲挛缩）并屈曲约30°作为基础功能目标。','疼痛可由口服药控制，无需要继续住院处理的重大问题。'],
      source:'https://www.nhc.gov.cn/cms-search/downFiles/b89e096b6576415081eeba5cbe8399d2.pdf',notice
    },
    tumorKnee:{
      name:'肿瘤膝关节置换术加速康复临床路径',nav:'肿瘤膝关节置换术',category:'骨肿瘤 / 重建',
      stay:'6～12天',surgeryDay:'依肿瘤范围及术前评估安排',recordUrl:null,
      applies:'适用于符合保肢及重建条件的股骨远端、胫骨近端及膝周骨/软组织肿瘤或复杂假体相关病例，并拟行肿瘤膝关节置换术者。',
      entry:['病史、影像和病理综合诊断明确，具备保肢和关节重建指征。','主要神经血管束可安全分离或重建，切除边界和假体重建方案明确。','完成肿瘤分期、营养、血液、VTE及多学科围术期评估。'],
      tests:'局部X线、CT、MRI及必要的全身肿瘤分期检查；常规实验室、炎症指标、心肺和VTE评估，按需完善血管影像。',
      preop:'完成肿瘤切除边界、假体长度与旋转、软组织重建及输血策略讨论，并完成麻醉及相关科室会诊。',
      operation:'遵循肿瘤学切除原则完成病灶切除和膝关节重建；强化术中血液管理、感染预防、镇痛和神经血管保护。',
      postop:'根据伸膝装置、肌腱与软组织重建情况制定个体化ROM和负重计划，持续监测切口、引流、神经血管和VTE。',
      discharge:['一般情况和切口恢复良好，疼痛可控。','肢体神经血管状态稳定，假体和重建结构影像学位置满意。','能够在规定支具/助行器保护下完成团队设定的安全转移和基础活动目标。','无需要继续住院处理的感染、血栓、伤口或其他重大并发症。'],
      source:'https://www.nhc.gov.cn/yzygj/c100068/202310/ff33d2ec3ac6488ab8083fbd6f9c59c1/files/1732871293759_87401.pdf',notice
    }
  };

  function esc(s){
    return String(s??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function bullets(items){return '<ul>'+items.map((x)=>'<li>'+esc(x)+'</li>').join('')+'</ul>';}
  function pathwayMarkup(p){
    const record=p.recordUrl?'<a href="'+p.recordUrl+'">对应完整病历 ↗</a>':'';
    const patient=commonPatient.map(([title,copy],i)=>'<div><b>'+(i+1)+'</b><span>'+esc(title)+'</span><p>'+esc(copy)+'</p></div>'+(i<commonPatient.length-1?'<i>→</i>':'')).join('');
    return `
      <section class="pathway-title-card">
        <div>
          <span class="pathway-status">国家卫健委2023版 · 已完成</span>
          <h2>${esc(p.name)}</h2>
          <p>${esc(p.applies)}</p>
        </div>
        <div class="pathway-title-actions">
          ${record}
          <button class="dynamic-print-pathway" type="button">打印路径</button>
        </div>
      </section>
      <section class="pathway-overview-grid">
        <div><span>标准住院日</span><strong>${esc(p.stay)}</strong></div>
        <div><span>手术时间窗</span><strong>${esc(p.surgeryDay)}</strong></div>
        <div><span>路径类别</span><strong>${esc(p.category)}</strong></div>
        <div><span>版本</span><strong>国家卫健委 2023</strong></div>
      </section>

      <section class="pathway-section">
        <div class="pathway-section-head"><span>01</span><div><small>ENTRY & ELIGIBILITY</small><h3>路径准入</h3></div></div>
        <div class="pathway-two-col">
          <div class="pathway-panel"><h4>进入路径重点</h4>${bullets(p.entry)}</div>
          <div class="pathway-panel accent"><h4>入院必需评估 / 检查</h4><p class="pathway-copy">${esc(p.tests)}</p></div>
        </div>
      </section>

      <section class="pathway-section">
        <div class="pathway-section-head"><span>02</span><div><small>PHYSICIAN PATHWAY</small><h3>医师版时间轴</h3></div></div>
        <div class="pathway-timeline">
          <article class="path-step">
            <div class="path-step-time"><b>D1</b><span>住院第1天</span></div>
            <div class="path-step-content"><h4>评估、准入与完善检查</h4><div class="path-step-columns">
              <div><strong>主要工作</strong><p>完成病史、查体、首次病程和上级医师评估，确认诊断、手术指征和路径准入。</p></div>
              <div><strong>检查</strong><p>${esc(p.tests)}</p></div>
              <div><strong>风险评估</strong><p>完成疼痛、营养、VTE、基础疾病及康复能力评估，按病种补充神经血管或软组织评估。</p></div>
              <div><strong>患者教育</strong><p>说明治疗计划、预期恢复、可能变异和术后功能训练方法。</p></div>
            </div></div>
          </article>
          <article class="path-step">
            <div class="path-step-time"><b>PRE</b><span>术前阶段</span></div>
            <div class="path-step-content"><h4>完成术前准备</h4><div class="path-step-columns">
              <div><strong>主刀 / 上级医师</strong><p>${esc(p.preop)}</p></div>
              <div><strong>麻醉与会诊</strong><p>完成麻醉评估和必要的内科/相关专科会诊，确认基础疾病已达到可手术状态。</p></div>
              <div><strong>安全准备</strong><p>完成手术与麻醉知情同意、术侧标识、抗菌药物计划、血液管理及植入物/器械准备。</p></div>
              <div><strong>康复预演</strong><p>根据术式训练呼吸、肌力、关节活动、床椅转移、助行器或支具使用。</p></div>
            </div></div>
          </article>
          <article class="path-step major">
            <div class="path-step-time"><b>OP</b><span>${esc(p.surgeryDay)}</span></div>
            <div class="path-step-content"><h4>手术日</h4><div class="path-step-columns">
              <div><strong>手术</strong><p>${esc(p.operation)}</p></div>
              <div><strong>术后即刻</strong><p>完成手术记录和术后首次病程，复核生命体征、切口/引流、疼痛及神经血管状态。</p></div>
              <div><strong>预防措施</strong><p>按风险执行抗菌药物、VTE预防、血液管理、恶心呕吐预防及多模式镇痛。</p></div>
              <div><strong>康复启动</strong><p>在安全前提下尽早开始与术式相匹配的肌力、关节活动和转移训练。</p></div>
            </div></div>
          </article>
          <article class="path-step">
            <div class="path-step-time"><b>POST</b><span>术后至出院</span></div>
            <div class="path-step-content"><h4>术后康复与复查</h4><div class="path-step-columns">
              <div><strong>每日查房</strong><p>记录生命体征、切口、疼痛、神经血管、活动能力及并发症筛查。</p></div>
              <div><strong>复查</strong><p>根据路径和术式复查实验室、影像及VTE相关检查，关注植入物/骨折复位和功能恢复。</p></div>
              <div><strong>治疗</strong><p>继续镇痛、营养、VTE及切口管理；抗菌药物使用遵循路径及抗菌药物指导原则。</p></div>
              <div><strong>康复</strong><p>${esc(p.postop)}</p></div>
            </div></div>
          </article>
          <article class="path-step discharge">
            <div class="path-step-time"><b>DC</b><span>达到标准后</span></div>
            <div class="path-step-content"><h4>出院标准</h4><div class="pathway-panel">${bullets(p.discharge)}</div></div>
          </article>
        </div>
      </section>

      <section class="pathway-section">
        <div class="pathway-section-head"><span>03</span><div><small>VARIANCE MANAGEMENT</small><h3>路径变异与退出</h3></div></div>
        <div class="variance-grid">${commonVariances.map((x,i)=>'<div class="variance-card"><span>0'+(i+1)+'</span><h4>'+(i<3?'常见变异':'退出评估')+'</h4><p>'+esc(x)+'</p></div>').join('')}</div>
      </section>

      <section class="pathway-section">
        <div class="pathway-section-head"><span>04</span><div><small>PATIENT VERSION</small><h3>患者版路径告知</h3></div></div>
        <div class="patient-path">${patient}</div>
      </section>

      <section class="pathway-section">
        <div class="pathway-section-head"><span>05</span><div><small>QUALITY CONTROL</small><h3>路径质控指标</h3></div></div>
        <div class="quality-grid">${commonQuality.map((x,i)=>'<div><span>'+(i===0?'路径':i===1?'效率':i===2?'治疗':i===3?'安全':'康复')+'</span><b>'+esc(x)+'</b></div>').join('')}</div>
      </section>

      <section class="pathway-section sources">
        <div class="pathway-section-head"><span>06</span><div><small>SOURCE & VERSION</small><h3>依据与版本</h3></div></div>
        <div class="source-list">
          <a href="${esc(p.source)}" target="_blank" rel="noopener"><strong>${esc(p.name)}（2023年版）</strong><span>国家卫生健康委官方附件。</span></a>
          <a href="${esc(p.notice)}" target="_blank" rel="noopener"><strong>骨科有关手术加速康复临床路径（2023年版）通知</strong><span>国家卫生健康委医政司发布，共12个骨科手术路径。</span></a>
        </div>
        <p class="version-note">站内整理版 v1.0 · 2026-10-08。内容用于临床路径标准化辅助，正式执行需结合本院制度和患者实际情况。</p>
      </section>
    `;
  }

  window.HAJIMI_OFFICIAL_PATHWAYS={pathways,pathwayMarkup,commonQuality,commonPatient,commonVariances};
})();
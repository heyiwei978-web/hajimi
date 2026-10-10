/* Four literature-search batches consolidated; external figure links are references, not embedded images. */
window.HAJIMI_CLASSIFICATION_DATA = {
  "schema": 1,
  "updated": "2026-10-10",
  "departments": [
    {
      "id": "guke",
      "name": "骨科",
      "description": "骨折及关节损伤分型与手术指征",
      "ready": true
    },
    {
      "id": "puwai",
      "name": "普外科",
      "description": "预留疾病分期、分级和手术指征",
      "ready": false
    },
    {
      "id": "shennei",
      "name": "肾内科",
      "description": "预留肾脏疾病分型与风险分层",
      "ready": false
    },
    {
      "id": "fuke",
      "name": "妇科",
      "description": "预留妇科疾病分期和治疗指征",
      "ready": false
    }
  ],
  "entries": [
    {
      "id": "femoral-neck",
      "name": "股骨颈骨折",
      "area": "髋部与股骨",
      "system": "Garden Ⅰ–Ⅳ；辅助Pauwels、AO/OTA 31B",
      "types": [
        {
          "code": "Ⅰ型",
          "feature": "不完全骨折或外翻嵌插"
        },
        {
          "code": "Ⅱ型",
          "feature": "完全骨折、无明显移位"
        },
        {
          "code": "Ⅲ型",
          "feature": "完全骨折、部分移位"
        },
        {
          "code": "Ⅳ型",
          "feature": "完全骨折、完全移位"
        }
      ],
      "decision": "Ⅰ、Ⅱ型不能机械规定必须手术，应评估侧位后倾、继发移位、患者生理年龄和活动需求；老年Ⅲ、Ⅳ型更倾向关节置换，年轻患者须另行评估保头复位内固定。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7345750/#fig1",
          "fig": "Figure 1a–d",
          "match": "Ⅰ、Ⅱ、Ⅲ、Ⅳ型真实DR",
          "status": "原文逐型标注；转载许可待逐图核验"
        }
      ],
      "evidence": [
        {
          "name": "AAOS 老年髋部骨折指南（2021）",
          "url": "https://www.aaos.org/quality/quality-programs/hip-fractures-in-older-adults/",
          "claim": "老年移位型股骨颈骨折推荐关节置换；稳定型存在多种治疗选择。",
          "scope": "该指南针对老年患者；不同条款推荐强度不同。",
          "level": "指南"
        },
        {
          "name": "NICE CG124",
          "url": "https://www.nice.org.uk/guidance/cg124/chapter/recommendations",
          "claim": "老年移位型关节囊内骨折建议关节置换；符合一定活动与生活能力者考虑全髋。",
          "scope": "不能根据Garden分型单独选择半髋或全髋。",
          "level": "指南"
        }
      ],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "intertrochanteric",
      "name": "股骨转子间骨折",
      "area": "髋部与股骨",
      "system": "AO/OTA 2018 31A1–A3",
      "types": [
        {
          "code": "31A1",
          "feature": "相对简单、通常较稳定的转子间骨折"
        },
        {
          "code": "31A2",
          "feature": "多骨块、外侧壁受损的不稳定骨折"
        },
        {
          "code": "31A3",
          "feature": "反斜形等不稳定骨折"
        }
      ],
      "decision": "稳定骨折常可选择DHS或头髓钉，不稳定和反斜型通常倾向头髓钉。孤立大转子骨折须先排除隐匿延伸。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12888606/#Fig2",
          "fig": "Figure 2a/c/e/g",
          "match": "31A1.1、A3、A1.3、A2.3术前DR",
          "status": "原文明确为术前/术后对应病例"
        }
      ],
      "evidence": [
        {
          "name": "AAOS 老年髋部骨折指南（2021）",
          "url": "https://www.aaos.org/quality/quality-programs/hip-fractures-in-older-adults/",
          "claim": "稳定型可采用滑动髋螺钉或头髓钉；不稳定及反斜型支持头髓钉。",
          "scope": "主要为老年髋部骨折的固定术式建议。",
          "level": "指南"
        },
        {
          "name": "NICE CG124",
          "url": "https://www.nice.org.uk/guidance/cg124/chapter/recommendations",
          "claim": "髋部骨折应及时手术；植入物选择需结合不同推荐体系。",
          "scope": "AAOS与NICE对于部分稳定型的术式优先级不同。",
          "level": "指南"
        }
      ],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "distal-femur",
      "name": "股骨远端骨折",
      "area": "髋部与股骨",
      "system": "AO/OTA 33A、33B、33C",
      "types": [
        {
          "code": "33A",
          "feature": "关节外骨折"
        },
        {
          "code": "33B",
          "feature": "部分关节内骨折（注意Hoffa）"
        },
        {
          "code": "33C1",
          "feature": "关节面与干骺端均简单"
        },
        {
          "code": "33C2",
          "feature": "关节面简单、干骺端粉碎"
        },
        {
          "code": "33C3",
          "feature": "关节面粉碎"
        }
      ],
      "decision": "移位、不稳定、关节面不匹配或力线异常时评估内固定；固定可行性还取决于骨质、软组织及全身情况。具体手术阈值尚待指南逐条核对。",
      "figures": [
        {
          "url": "https://e-jmt.org/journal/view.php?number=2418",
          "fig": "Figure 2 A/B/C各组a、b",
          "match": "33C1、C2、C3术前正侧位DR",
          "status": "原文明确标注；许可待核实"
        }
      ],
      "evidence": [],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "tibial-plateau",
      "name": "胫骨平台骨折",
      "area": "膝部与小腿",
      "system": "Schatzker Ⅰ–Ⅵ",
      "types": [
        {
          "code": "Ⅰ型",
          "feature": "外侧平台劈裂"
        },
        {
          "code": "Ⅱ型",
          "feature": "外侧平台劈裂合并塌陷"
        },
        {
          "code": "Ⅲ型",
          "feature": "外侧平台纯塌陷（CT可能发现劈裂）"
        },
        {
          "code": "Ⅳ型",
          "feature": "内侧平台骨折"
        },
        {
          "code": "Ⅴ型",
          "feature": "双髁骨折"
        },
        {
          "code": "Ⅵ型",
          "feature": "平台骨折伴干骺端与骨干分离"
        }
      ],
      "decision": "治疗基于平台塌陷、关节面台阶、下肢力线与稳定性，而不是仅凭Schatzker数字。需排查高能量损伤的血管、韧带和软组织问题。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3482433/",
          "fig": "Figure 7–8、15–16",
          "match": "Ⅴ、Ⅵ型正侧位术前DR",
          "status": "候选图源（待逐图复核）"
        },
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4976737/#fig3",
          "fig": "Figure 3",
          "match": "Ⅱ型术前DR及CT",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [],
      "imaging": "膝正侧位DR，术前CT评价塌陷、后柱及骨块；有血管损伤体征时补充相应检查。"
    },
    {
      "id": "tibial-shaft",
      "name": "胫骨干骨折",
      "area": "膝部与小腿",
      "system": "AO/OTA 2018 42A/B/C",
      "types": [
        {
          "code": "42A",
          "feature": "简单骨折"
        },
        {
          "code": "42B",
          "feature": "楔形骨折"
        },
        {
          "code": "42C",
          "feature": "多骨块、节段或复杂粉碎"
        }
      ],
      "decision": "可复位且能稳定维持对位对线的部分闭合骨折可考虑石膏或功能支具；不稳定、开放骨折、血管损伤或骨筋膜室综合征应分别判断急诊处置与固定指征。",
      "figures": [
        {
          "url": "https://www.wjgnet.com/2307-8960/full/v8/i20/4743.htm",
          "fig": "Figure 3A",
          "match": "42A1术前DR",
          "status": "候选图源（待逐图复核）"
        },
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4799215/",
          "fig": "Figure 1等",
          "match": "42B3、42C2病例候选（需确认术前片）",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "pilon",
      "name": "胫骨Pilon骨折",
      "area": "膝部与小腿",
      "system": "Rüedi–Allgöwer Ⅰ–Ⅲ；补充AO/OTA 43",
      "types": [
        {
          "code": "Ⅰ型",
          "feature": "关节面无明显移位"
        },
        {
          "code": "Ⅱ型",
          "feature": "关节面移位但无明显粉碎"
        },
        {
          "code": "Ⅲ型",
          "feature": "关节面粉碎并可能伴干骺端压缩"
        }
      ],
      "decision": "稳定无移位者可经评估选择非手术；成人移位型需要快速制定治疗计划并完成首次手术，可能是临时固定而非立即最终ORIF。软组织肿胀及开放伤决定分期。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5449320/",
          "fig": "Figure 1A、2A、3A",
          "match": "Ⅰ、Ⅱ、Ⅲ型真实DR",
          "status": "原文逐型明确标注"
        }
      ],
      "evidence": [
        {
          "name": "NICE NG37 §1.2.32",
          "url": "https://www.nice.org.uk/guidance/ng37/chapter/recommendations",
          "claim": "成人移位型Pilon骨折在受伤24小时内制定确定性治疗计划并实施首次临时或最终手术。",
          "scope": "绝不等同24小时内必须完成最终切开复位内固定。",
          "level": "指南原文"
        }
      ],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "patella",
      "name": "髌骨骨折",
      "area": "膝部与小腿",
      "system": "影像形态分型",
      "types": [
        {
          "code": "横形",
          "feature": "骨折线横跨髌骨"
        },
        {
          "code": "纵形",
          "feature": "纵向裂隙，轴位可能更清晰"
        },
        {
          "code": "粉碎／星芒",
          "feature": "多个骨块"
        },
        {
          "code": "下极／袖套",
          "feature": "牵涉伸膝装置附着"
        }
      ],
      "decision": "术式主要依据伸膝装置是否完整、关节面是否不匹配、移位与稳定性。无明显移位且伸膝功能完整者可考虑保守。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5265199/",
          "fig": "Figure 3～9",
          "match": "横形、纵形、粉碎、下极等术前DR",
          "status": "原文影像图谱；部分第三方图须另核版权"
        }
      ],
      "evidence": [],
      "imaging": "膝正侧位、必要时髌骨轴位DR；复杂关节面骨折可补CT。"
    },
    {
      "id": "proximal-humerus",
      "name": "肱骨近端骨折",
      "area": "肩部、上臂与前臂",
      "system": "Neer一～四部分",
      "types": [
        {
          "code": "一部分",
          "feature": "尚未达到显著移位判据，非指只有一条骨折线"
        },
        {
          "code": "二部分",
          "feature": "一个骨段明显移位"
        },
        {
          "code": "三部分",
          "feature": "两个骨段明显移位"
        },
        {
          "code": "四部分",
          "feature": "三个骨段明显移位"
        }
      ],
      "decision": "结合骨折移位、成角、骨质、肩袖附着和患者功能决定保守、锁定板、髓内钉或置换；Neer四部分不能等同必须置换。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5788098/#Fig3",
          "fig": "Figure 3及相关病例",
          "match": "一部分／微移位候选DR",
          "status": "候选图源（待逐图复核）"
        },
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5788098/",
          "fig": "其他病例待逐图核查",
          "match": "二～四部分待核实",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "distal-humerus",
      "name": "肱骨远端骨折",
      "area": "肩部、上臂与前臂",
      "system": "AO/OTA 13A/B/C",
      "types": [
        {
          "code": "13A",
          "feature": "关节外骨折"
        },
        {
          "code": "13B",
          "feature": "部分关节内骨折"
        },
        {
          "code": "13C1",
          "feature": "关节面与干骺端均简单"
        },
        {
          "code": "13C2",
          "feature": "关节面简单而干骺端粉碎"
        },
        {
          "code": "13C3",
          "feature": "关节面粉碎"
        }
      ],
      "decision": "移位关节内或不稳定骨折通常需复位固定；高龄、骨质疏松且关节面难以重建者可讨论置换。明确阈值尚待专项审核。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5834588/",
          "fig": "Figure 4a",
          "match": "13A2候选术前DR",
          "status": "候选图源（待逐图复核）"
        },
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10024368/",
          "fig": "Figure 4a/b",
          "match": "13A3候选术前DR",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "clavicle",
      "name": "锁骨骨折",
      "area": "肩部、上臂与前臂",
      "system": "Robinson（中段）＋Neer（远端）",
      "types": [
        {
          "code": "Robinson 2A",
          "feature": "中段无明显移位"
        },
        {
          "code": "Robinson 2B1",
          "feature": "中段移位简单骨折"
        },
        {
          "code": "Robinson 2B2",
          "feature": "中段移位粉碎骨折"
        },
        {
          "code": "Neer ⅡB／ⅡC／Ⅴ",
          "feature": "远端不稳定骨折"
        }
      ],
      "decision": "结合皮肤张力、开放伤、神经血管、移位与粉碎、喙锁韧带稳定性及功能需求评估。不能把单一短缩数字当作统一强制手术标准。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7726359/",
          "fig": "Figure 2A／3A",
          "match": "Robinson 2B2术前DR",
          "status": "候选图源（待逐图复核）"
        },
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12177480/",
          "fig": "Figure 2",
          "match": "NeerⅤ型术前DR",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "distal-radius",
      "name": "桡骨远端骨折",
      "area": "肩部、上臂与前臂",
      "system": "AO/OTA 2R3A/B/C",
      "types": [
        {
          "code": "2R3A",
          "feature": "关节外骨折"
        },
        {
          "code": "2R3B",
          "feature": "部分关节内骨折"
        },
        {
          "code": "2R3C",
          "feature": "完全关节内骨折"
        }
      ],
      "decision": "非老年成人复位后桡骨短缩>3mm、背倾>10°或关节内移位／台阶>2mm时指南中等强度支持手术；老年患者不能直接照搬这一结论。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12279608/#Fig1",
          "fig": "Figure 1",
          "match": "2R3A/B/C大类标注DR",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [
        {
          "name": "AAOS/ASSH 桡骨远端骨折指南（2020）",
          "url": "https://www.aaos.org/aaos-home/newsroom/press-releases/management-of-distal-radius-fractures-clinical-practice-guidelines-cpg-fact-sheet/",
          "claim": "非老年成人满足规定复位后阈值时，手术改善影像与患者报告结局；老年组长期患者报告结局不显著优于保守。",
          "scope": "非老年研究通常定义<65岁；仍需综合生理年龄和功能需求。",
          "level": "非老年中等证据／老年强证据"
        }
      ],
      "imaging": "术前正侧位DR；复杂骨折需结合CT复核。"
    },
    {
      "id": "scaphoid",
      "name": "腕舟骨骨折",
      "area": "肩部、上臂与前臂",
      "system": "Herbert A/B/C/D",
      "types": [
        {
          "code": "A1／A2",
          "feature": "结节或不完全腰部稳定型"
        },
        {
          "code": "B1／B2",
          "feature": "远端斜形、完全或移位腰部型"
        },
        {
          "code": "B3／B4／B5",
          "feature": "近极、经舟骨周月骨脱位、粉碎型"
        },
        {
          "code": "C／D",
          "feature": "延迟愈合／骨不连"
        }
      ],
      "decision": "A型稳定新鲜骨折可考虑保守；B型不稳定、移位、近极或合并腕骨脱位病例需评估内固定；C/D另按骨愈合障碍决策。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6117179/#Fig1",
          "fig": "Figure 1",
          "match": "近极与腰部真实DR，但不能直接对应全部Herbert亚型",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [
        {
          "name": "舟骨骨折与骨不连综述",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4405116/",
          "claim": "Herbert A1/A2相对稳定；B1–B5为不稳定型，需考虑手术；C/D为愈合问题。",
          "scope": "综述并非AAOS等组织最新分型特异性指南；具体决定需CT与症状支持。",
          "level": "专家综述"
        }
      ],
      "imaging": "腕舟骨专用位DR；早期X线阴性或疑不稳定时考虑CT/MRI。"
    },
    {
      "id": "ankle",
      "name": "踝关节骨折",
      "area": "足踝",
      "system": "Danis–Weber A/B/C；辅助Lauge–Hansen",
      "types": [
        {
          "code": "Weber A",
          "feature": "腓骨骨折位于下胫腓联合以下"
        },
        {
          "code": "Weber B",
          "feature": "骨折约在联合水平"
        },
        {
          "code": "Weber C",
          "feature": "骨折位于联合以上，常伴联合损伤"
        }
      ],
      "decision": "联合水平与稳定性并非同义；尤其B型需结合内侧三角韧带、内外踝及负重/应力位评价。关节不匹配或不稳者考虑固定。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4562928/",
          "fig": "Figure 1、2、3–4",
          "match": "Weber A、B、C对应的真实踝穴/正侧位DR",
          "status": "原文分别明确对照Weber"
        }
      ],
      "evidence": [],
      "imaging": "踝正侧及踝穴位DR，必要时负重/应力位；后踝复杂骨折补CT。"
    },
    {
      "id": "calcaneus",
      "name": "跟骨骨折",
      "area": "足踝",
      "system": "Essex-Lopresti；Sanders（CT）",
      "types": [
        {
          "code": "舌形（tongue-type）",
          "feature": "后结节骨块可能向后上方移位"
        },
        {
          "code": "关节压缩型",
          "feature": "后关节面塌陷／挤压"
        },
        {
          "code": "SandersⅠ～Ⅳ",
          "feature": "依据冠状位CT后关节面骨折线分类"
        }
      ],
      "decision": "舌形骨折合并后方皮肤受压、苍白或濒临坏死为紧急评估复位的重要情况；其余根据关节面与跟骨形态、皮肤和软组织条件选择治疗。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10293754/",
          "fig": "Figure 1A",
          "match": "Essex-Lopresti 舌形跟骨骨折：术前跟骨侧位DR",
          "status": "原文明确分型；版权许可仍需逐图核验"
        },
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8725541/",
          "fig": "Figure 1A、2A",
          "match": "关节压缩型跟骨骨折：真实术前侧位DR",
          "status": "原文明确分型；版权许可仍需逐图核验"
        }
      ],
      "evidence": [],
      "imaging": "跟骨侧位、轴位DR；Sanders必须以冠状位CT为主，不可用普通DR替代。"
    },
    {
      "id": "talus",
      "name": "距骨颈骨折",
      "area": "足踝",
      "system": "Hawkins Ⅰ～Ⅳ",
      "types": [
        {
          "code": "Ⅰ型",
          "feature": "骨折无明显移位、距下关节无脱位"
        },
        {
          "code": "Ⅱ型",
          "feature": "伴距下关节半脱位或脱位"
        },
        {
          "code": "Ⅲ型",
          "feature": "合并距下与胫距关节脱位"
        },
        {
          "code": "Ⅳ型",
          "feature": "进一步合并距舟关节脱位"
        }
      ],
      "decision": "注意急诊复位脱位和软组织/神经血管损伤；骨折移位及多个关节脱位增加缺血坏死风险，术式以复位可行性和稳定性为核心。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5534889/",
          "fig": "Figure 1、2",
          "match": "HawkinsⅠ型儿童术前DR；不能代表成人治疗证据",
          "status": "候选图源（待逐图复核）"
        },
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5534889/",
          "fig": "Ⅱ～Ⅳ型图源仍待独立核实",
          "match": "不作为已完成影像",
          "status": "候选图源（待逐图复核）"
        }
      ],
      "evidence": [],
      "imaging": "距骨颈正侧位和踝穴位DR；CT评价骨折线、移位及关节匹配。"
    },
    {
      "id": "pelvic-ring",
      "name": "骨盆环损伤",
      "area": "骨盆与髋臼",
      "system": "Young–Burgess APC/LC/VS/CM",
      "types": [
        {
          "code": "APC Ⅰ～Ⅲ",
          "feature": "前后压缩，按旋转及后环不稳定程度细分"
        },
        {
          "code": "LC Ⅰ～Ⅲ",
          "feature": "侧方压缩，需判断后环稳定"
        },
        {
          "code": "VS",
          "feature": "垂直剪切型，常垂直不稳定"
        },
        {
          "code": "CM",
          "feature": "混合机制型"
        }
      ],
      "decision": "APCⅠ、稳定LCⅠ常可非手术；旋转或垂直不稳定、后环不稳定是固定的重要依据；血流动力学不稳定者先处理止血与损伤控制。",
      "figures": [
        {
          "url": "https://onlinelibrary.wiley.com/doi/full/10.1177/1024907919857008",
          "fig": "Figure 2a–h",
          "match": "APCⅠ～Ⅲ、LCⅠ～Ⅲ、VS真实骨盆DR",
          "status": "转载许可待核实"
        }
      ],
      "evidence": [
        {
          "name": "WSES骨盆创伤指南（2017）",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5241998/",
          "claim": "后环不稳定及APCⅡ/Ⅲ、LCⅡ/Ⅲ、VS、CM等旋转/垂直不稳定型可需手术稳定。",
          "scope": "须同时评估血流动力学、CT与合并伤；指南对相应推荐标注Grade 2A。",
          "level": "指南"
        }
      ],
      "imaging": "骨盆正位DR＋CT骨盆前后环；必要时动态稳定性检查。"
    },
    {
      "id": "acetabulum",
      "name": "髋臼骨折",
      "area": "骨盆与髋臼",
      "system": "Judet–Letournel：5基本型＋5联合型",
      "types": [
        {
          "code": "基本型",
          "feature": "后壁、后柱、前壁、前柱、横形"
        },
        {
          "code": "联合型",
          "feature": "后柱伴后壁、横形伴后壁、T型、前柱伴后半横形、双柱"
        }
      ],
      "decision": "根据股骨头与髋臼匹配、负重顶区完整性、关节稳定性、关节面移位等判断；不是凡移位都必须同一术式。细分手术阈值待文献审定。",
      "figures": [
        {
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3620582/",
          "fig": "Figure 6、9、13",
          "match": "前柱伴后半横形、横形伴后壁、T型术前三体位DR",
          "status": "三组图源已定位，其他7型待补"
        }
      ],
      "evidence": [],
      "imaging": "骨盆正位、闭孔斜位、髂骨斜位DR＋骨盆薄层CT。"
    }
  ]
};

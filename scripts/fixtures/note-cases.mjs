// 仅用于回归的合成病例；不读取病历库，不含真实患者或身份信息。
export const NOTE_CASES = [
  {id: 'femoral-neck', title: '股骨颈骨折人工股骨头置换术', sex: '女', age: '78',
    complaint: '摔伤致右髋部疼痛、活动受限3小时', diagnosis: '右股骨颈骨折（Garden Ⅳ型）',
    operation: '右侧人工股骨头置换术', anesthesia: '腰硬联合麻醉',
    history: '虚构教学病例。平地摔伤，右下肢短缩、外旋，右足背动脉搏动可触及。X线提示右股骨颈骨折（Garden Ⅳ型）。血红蛋白108 g/L。',
    secondary: '高血压病2级', lab: '108 g/L',
    operative: '采用后外侧入路，骨水泥型股骨柄，术中出血180 mL，未输血，未放置引流管。具体假体型号未提供。',
    daily: '术后第2天，今日主治医师查房。体温37.2℃，切口敷料干燥，右足感觉及趾活动存在。血红蛋白103 g/L。未放置引流管。医嘱暂不负重，避免髋关节过度屈曲、内收及内旋。', dailyLab: '103 g/L',
    prohibited: ['左侧人工股骨头置换', '引流管通畅', '拔除引流管', '已输血']},
  {id: 'intertrochanteric-pfna', title: '股骨粗隆间骨折PFNA内固定术', sex: '男', age: '81',
    complaint: '摔伤致左髋部疼痛、活动受限6小时', diagnosis: '左股骨粗隆间骨折（AO/OTA 31-A2型）',
    operation: '左股骨粗隆间骨折闭合复位PFNA内固定术', anesthesia: '椎管内麻醉',
    history: '虚构教学病例。左髋肿胀压痛，左足感觉存在。X线提示左股骨粗隆间骨折（AO/OTA 31-A2型）。血红蛋白96 g/L。',
    secondary: '2型糖尿病', lab: '96 g/L',
    operative: '闭合复位后置入PFNA，透视复位满意，术中出血120 mL，未输血，未行切开复位。钉体和螺旋刀片具体参数未提供。',
    daily: '术后第2天，今日主任医师查房。体温36.8℃，左大腿肿胀较前减轻，足背动脉可触及。血红蛋白92 g/L。左下肢禁止负重，进行踝泵训练。', dailyLab: '92 g/L',
    prohibited: ['右股骨粗隆间骨折', '已行切开复位', '已输血', '立即完全负重']},
  {id: 'tibial-plateau', title: '胫骨平台骨折钢板内固定术', sex: '男', age: '46',
    complaint: '外伤致右膝疼痛、肿胀、活动受限8小时', diagnosis: '右胫骨平台骨折（Schatzker Ⅱ型）',
    operation: '右胫骨平台骨折切开复位钢板内固定术', anesthesia: '全身麻醉',
    history: '虚构教学病例。右膝外侧压痛，皮肤完整，足趾活动及感觉存在。CT提示右胫骨外侧平台劈裂并塌陷。血红蛋白132 g/L。',
    secondary: '', lab: '132 g/L',
    operative: '外侧入路复位并钢板固定，未植骨，未行半月板切除。术中出血160 mL。钢板型号及螺钉长度未提供。',
    daily: '术后第2天，今日主治医师查房。体温37.0℃，右膝敷料干燥，足趾感觉及活动存在。血红蛋白125 g/L。右下肢严格禁止负重，按医嘱进行非负重功能锻炼。', dailyLab: '125 g/L',
    prohibited: ['左胫骨平台骨折', '已植骨', '已行半月板切除', '立即完全负重']},
  {id: 'total-knee', title: '全膝关节置换术', sex: '女', age: '67',
    complaint: '右膝疼痛5年，加重伴活动受限6个月', diagnosis: '右膝关节骨性关节炎（K-L Ⅳ级）',
    operation: '右侧人工全膝关节置换术', anesthesia: '全身麻醉',
    history: '虚构教学病例。保守治疗后仍有疼痛，右膝内翻，活动范围10°～95°。负重X线提示右膝内侧关节间隙明显狭窄及骨赘。血红蛋白121 g/L。',
    secondary: '2型糖尿病；青霉素过敏', lab: '121 g/L',
    operative: '采用内侧髌旁入路，未行髌骨置换，术中出血150 mL。具体假体型号及截骨参数未提供。',
    daily: '术后第2天，今日副主任医师查房。体温36.9℃，右膝敷料干燥，右足感觉及活动存在。血红蛋白112 g/L。医嘱在助行器保护下部分负重。青霉素过敏。', dailyLab: '112 g/L',
    prohibited: ['左侧人工全膝', '已行髌骨置换', '立即完全负重']},
  {id: 'distal-radius', title: '桡骨远端骨折内固定术', sex: '女', age: '59',
    complaint: '摔伤致左腕疼痛、肿胀、畸形4小时', diagnosis: '左桡骨远端骨折（AO/OTA 2R3-C1型）',
    operation: '左桡骨远端骨折切开复位钢板内固定术', anesthesia: '神经阻滞麻醉',
    history: '虚构教学病例。左腕肿胀压痛，拇、示、中指麻木，桡动脉搏动存在。X线提示左桡骨远端关节内骨折。血红蛋白128 g/L。',
    secondary: '', lab: '128 g/L',
    operative: '采用掌侧入路、掌侧锁定钢板固定，未行腕管松解，术中出血30 mL。钢板型号和螺钉长度未提供。',
    daily: '术后第2天，今日主治医师查房。体温36.7℃，左手拇、示、中指仍有麻木，桡动脉搏动存在。血红蛋白126 g/L。左手禁止提重物，按医嘱进行手指主动活动。', dailyLab: '126 g/L',
    prohibited: ['右桡骨远端骨折', '已行腕管松解', '左手感觉正常']}
];

export const NOTE_SCENARIOS = NOTE_CASES.flatMap(item => ['first', 'preop', 'op', 'postDaily'].map(type => {
  const body = {type, department: '骨科', sex: item.sex, age: item.age, complaint: item.complaint,
    diagnosis: item.diagnosis, operation: item.operation, anesthesia: item.anesthesia,
    history: item.history, secondary: item.secondary};
  if (type === 'op') body.extra = '虚构教学手术，2026年10月12日09:00至10:30。' + item.operative;
  if (type === 'postDaily') { body.day = '2'; body.daily = item.daily; }
  return {id: item.id + '-' + type, title: item.title, body,
    requiredFacts: [item.diagnosis, ...(type === 'first' ? [] : [item.operation]),
      ...(type === 'op' ? [] : [type === 'postDaily' ? item.dailyLab : item.lab])],
    prohibited: item.prohibited};
}));

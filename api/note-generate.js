import {guardRequest} from './_security.js';

// AI 病历草稿生成（/note 页面使用）。
// - 仅登录的管理员可用，防止他人消耗接口额度。
// - 不保存、不记录任何输入或生成内容；只把病情要点转发给大模型接口。
// - 拒绝含身份证号、手机号、姓名/住院号等身份信息的输入。
// - 模型接口为 OpenAI 兼容格式，配置只放在 Vercel 环境变量：
//   NOTE_AI_API_KEY（必填）、NOTE_AI_BASE_URL（默认 DeepSeek）、NOTE_AI_MODEL（默认 deepseek-chat）。

export const maxDuration = 60;

export const DOC_TYPES = Object.freeze({
  spec: {label: '专科检查', needsOperation: false,
    guide: '只写骨科专科检查部分：按视诊、触诊、动诊、量诊顺序，再写相关特殊检查，最后写患肢远端血运、感觉、运动情况。写出该诊断常见的阳性体征和需要记录的重要阴性体征；需要测量的数值（周径、长度、活动度角度等）写成【待补充】。'},
  first: {label: '首次病程记录', needsOperation: false,
    guide: '按“病例特点、拟诊讨论（诊断依据及鉴别诊断）、诊疗计划”三部分书写首次病程记录。病例特点概括主诉、现病史要点、专科查体要点、辅助检查（未提供的写【待补充】）。鉴别诊断列出 2～3 个与本病需鉴别的疾病并简述鉴别要点。诊疗计划写骨科常规：完善术前检查、患肢制动/牵引、消肿止痛、预防血栓、评估手术指征等，用药不写具体剂量。'},
  preop: {label: '术前小结', needsOperation: true,
    guide: '书写术前小结：简要病情、术前诊断、手术指征、拟施手术名称和方式、拟施麻醉方式、注意事项（含术中术后可能出现的风险及预防措施）、术前准备情况。化验检查结果未提供的写【待补充】。'},
  op: {label: '手术记录', needsOperation: true,
    guide: '书写手术记录：术前诊断、术中诊断、手术名称、麻醉方式、手术经过（体位、消毒铺巾、切口与入路、显露、复位或操作、内固定/假体植入、透视确认、冲洗、放置引流、逐层缝合）、术中出血量、输血、标本、术后患者去向。按该术式常规步骤写；术中所见、骨折具体形态、复位情况、内固定物或假体的品牌型号规格、螺钉数目、出血量、引流、输血、标本等实际情况一律写【按实际填写】，不得编造。'},
  postop: {label: '术后首次病程记录', needsOperation: true,
    guide: '书写术后首次病程记录：手术时间（写【按实际填写】）、麻醉方式、手术方式、术中诊断、手术简要经过、术后处理措施（抗感染、镇痛、抗凝预防血栓、伤口与引流观察、功能锻炼指导等，不写具体药名剂量）、应当特别注意观察的事项（患肢血运感觉运动、伤口渗血、引流量、生命体征等）。'}
});

const FIELDS = Object.freeze({
  sex: 4, age: 3, complaint: 120, history: 600, diagnosis: 160, secondary: 300,
  operation: 160, anesthesia: 40, extra: 400
});

const IDENTIFIER_PATTERNS = [
  [/\d{17}[\dXx]/, '身份证号'],
  [/(?<!\d)1[3-9]\d{9}(?!\d)/, '手机号'],
  [/(姓名|住院号|病案号|门诊号|床号|身份证|医保号|联系电话)/, '姓名、住院号等身份信息']
];

export function findIdentifier(text) {
  for (const [pattern, label] of IDENTIFIER_PATTERNS) if (pattern.test(text)) return label;
  return null;
}

export function validateInput(body) {
  const type = typeof body.type === 'string' ? body.type : '';
  const doc = Object.hasOwn(DOC_TYPES, type) ? DOC_TYPES[type] : null;
  if (!doc) return {error: '请选择要生成的文书'};
  const input = {};
  for (const [name, limit] of Object.entries(FIELDS)) {
    const value = body[name] === undefined || body[name] === null ? '' : body[name];
    if (typeof value !== 'string' && typeof value !== 'number') return {error: '输入格式错误'};
    const text = String(value).trim();
    if (text.length > limit) return {error: '输入内容过长'};
    input[name] = text;
  }
  if (input.age && !/^\d{1,3}$/.test(input.age)) return {error: '年龄请填数字'};
  if (input.sex && !['男', '女'].includes(input.sex)) return {error: '性别格式错误'};
  if (!input.complaint || !input.diagnosis) return {error: '请填写主诉和主诊断'};
  if (doc.needsOperation && !input.operation) return {error: '生成' + doc.label + '需要填写手术方式'};
  const found = findIdentifier(Object.values(input).join('\n'));
  if (found) return {error: '检测到可能的' + found + '，请删除后再生成（本工具只需要病情，不需要身份信息）'};
  return {type, doc, input};
}

const SYSTEM_PROMPT = [
  '你是一名中国三甲医院骨科的高年资住院医师，负责书写住院病历文书草稿。',
  '书写要求：',
  '1. 使用规范的中文医学术语，格式符合国家卫健委《病历书写基本规范》和国内骨科病历的常见写法，语言简洁、客观。',
  '2. 患者一律称“患者”，不写任何姓名、住院号、床号等身份信息。',
  '3. 不得编造用户没有提供的具体数值或事实：化验结果、影像具体所见、术中所见、出血量、内植物或假体型号、日期时间等，一律写【待补充】或【按实际填写】。',
  '4. 用户提供的信息必须照用，不要改动诊断名称和手术名称。',
  '5. 只输出文书正文，不要任何开场白或解释；不要使用 Markdown 符号（不要 #、*、**、表格），分段用“一、二、三”或“1. 2. 3.”编号，便于直接粘贴进医院系统。',
  '6. 正文最后单独一行写：※ 本文为草稿，请按患者实际情况核对修改。'
].join('\n');

export function buildMessages({doc, input}) {
  const lines = [
    '请书写：' + doc.label,
    '书写说明：' + doc.guide,
    '',
    '病情信息：',
    '性别：' + (input.sex || '未提供'),
    '年龄：' + (input.age ? input.age + '岁' : '未提供'),
    '主诉：' + input.complaint,
    '主诊断：' + input.diagnosis
  ];
  if (input.history) lines.push('现病史要点：' + input.history);
  if (input.secondary) lines.push('其他诊断/合并症：' + input.secondary);
  if (input.operation) lines.push('手术方式：' + input.operation);
  if (input.anesthesia) lines.push('麻醉方式：' + input.anesthesia);
  if (input.extra) lines.push('补充说明：' + input.extra);
  return [{role: 'system', content: SYSTEM_PROMPT}, {role: 'user', content: lines.join('\n')}];
}

function aiConfig(env) {
  const key = typeof env.NOTE_AI_API_KEY === 'string' ? env.NOTE_AI_API_KEY.trim() : '';
  const base = (typeof env.NOTE_AI_BASE_URL === 'string' && env.NOTE_AI_BASE_URL.trim()) || 'https://api.deepseek.com';
  const model = (typeof env.NOTE_AI_MODEL === 'string' && env.NOTE_AI_MODEL.trim()) || 'deepseek-chat';
  if (!key || !/^https:\/\//.test(base)) return null;
  return {key, url: base.replace(/\/+$/, '') + '/chat/completions', model};
}

export function createNoteHandler({fetchImpl = globalThis.fetch, env = process.env, timeoutMs = 55000} = {}) {
  return async function handler(req, res) {
    if (!guardRequest(req, res, {methods: ['POST'], admin: true, json: true, bodyLimit: 8192})) return;
    const checked = validateInput(req.body);
    if (checked.error) return res.status(400).json({error: checked.error});
    const config = aiConfig(env);
    if (!config) return res.status(503).json({error: 'AI 接口尚未配置，请在 Vercel 环境变量中设置 NOTE_AI_API_KEY'});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(config.url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + config.key},
        body: JSON.stringify({model: config.model, messages: buildMessages(checked), temperature: 0.3, max_tokens: 2500, stream: false}),
        signal: controller.signal
      });
      if (!response.ok) {
        const status = response.status;
        const message = status === 401 || status === 403 ? 'AI 接口密钥无效，请检查 NOTE_AI_API_KEY'
          : status === 402 ? 'AI 接口余额不足，请充值后再试'
          : status === 429 ? 'AI 接口请求太频繁，请稍后再试'
          : 'AI 接口暂时不可用，请稍后再试';
        return res.status(502).json({error: message});
      }
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text.trim()) return res.status(502).json({error: 'AI 没有返回内容，请重试'});
      return res.status(200).json({type: checked.type, label: checked.doc.label, text: text.replace(/\*\*/g, '').trim()});
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      return res.status(timedOut ? 504 : 502).json({error: timedOut ? '生成超时，请重试' : 'AI 接口连接失败，请稍后再试'});
    } finally {
      clearTimeout(timer);
    }
  };
}

export default createNoteHandler();

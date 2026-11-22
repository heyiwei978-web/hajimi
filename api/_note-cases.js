import {createHash} from 'node:crypto';
import '../js/note-case-core.js';
import {blob} from './_blob-auth.js';
import {ContentError,createContentStore} from './_content-store.js';
import {findIdentifier,validateInput} from './note-generate.js';

const Core = globalThis.HajimiNoteCaseCore;
export const CASE_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value);

export function validateCompletedCase(body) {
  if (!plain(body) || !CASE_ID.test(body.id || '') || typeof body.title !== 'string'
    || !body.title.trim() || body.title.trim().length > 100 || body.confirmed !== true
    || typeof body.revision !== 'string' || !body.revision || body.revision.length > 200
    || !plain(body.facts) || !Array.isArray(body.sections)) throw new ContentError(400,'请填写病历名称并确认整套内容已核对');
  let settings, expected;
  try { settings = Core.settings(body.settings); expected = Core.build(settings); }
  catch (error) { throw new ContentError(400,error.message); }
  if (body.sections.length !== expected.length) throw new ContentError(400,'病历章节不完整，未保存');
  const facts = Core.facts(body.facts);
  if (settings.mode === 'surgery' && !facts.operation) throw new ContentError(400,'手术病历需要填写手术方式');
  const checked = validateInput(Core.inputFor(expected[0],facts));
  if (checked.error) throw new ContentError(400,checked.error);
  const factsKey = JSON.stringify(facts);
  const sections = expected.map((definition,index) => {
    const entry = body.sections[index];
    if (!plain(entry) || entry.id !== definition.id || typeof entry.text !== 'string' || !entry.text.trim()
      || entry.text.length > 16000 || entry.confirmed !== true || entry.stale === true
      || entry.factsKey !== factsKey || (entry.notes !== undefined && (typeof entry.notes !== 'string' || entry.notes.length > 600))
      || (entry.model !== undefined && (typeof entry.model !== 'string' || entry.model.length > 100))) {
      throw new ContentError(400,'请完成并重新核对「'+definition.title+'」后保存');
    }
    return {...definition,text:entry.text,notes:entry.notes || '',model:entry.model || '',factsKey,confirmed:true,stale:false};
  });
  const text = Core.combine(body.title.trim(),sections);
  const identifier = findIdentifier(text+'\n'+Object.values(facts).join('\n')+'\n'+sections.map(s=>s.notes).join('\n'));
  if (identifier) throw new ContentError(400,'检测到可能的'+identifier+'，仅可保存无身份信息的虚构教学病例');
  if (Buffer.byteLength(text) > 1100000) throw new ContentError(413,'整套病历内容过大，请缩短后保存');
  return {id:body.id,template:'__note_case__',published:false,title:body.title.trim(),settings,facts,sections,
    text,status:'completed',confirmed:true,completedAt:new Date().toISOString()};
}

export function createNoteCaseRepository(user, storage = blob) {
  const owner = createHash('sha256').update(user).digest('hex');
  const prefix = 'private-note-cases/'+owner+'/';
  const index = createContentStore(storage,{currentPath:prefix+'index.json',historyPrefix:prefix+'history/'});
  const storeFor = id => {
    if (!CASE_ID.test(id || '')) throw new ContentError(400,'病历编号无效');
    return createContentStore(storage,{currentPath:prefix+id+'/content.json',historyPrefix:prefix+id+'/history/'});
  };
  function indexItems(current) {
    const items = current.data.cases;
    if (items.some(item=>item.template!=='__note_case_index__'||item.published!==false||!CASE_ID.test(item.id || '')
      ||typeof item.title!=='string'||typeof item.completedAt!=='string')) throw new ContentError(503,'病历目录异常，已停止修改');
    return items;
  }
  async function register(id) {
    for (let attempt=0;attempt<3;attempt++) {
      // Read the index first, then the current record. The conditional index
      // write rejects an older registration that races a newer index update.
      const current = await index.read(), items = indexItems(current);
      const latest = await storeFor(id).read(), record = latest.data.cases[0];
      if (!record || record.id!==id || record.template!=='__note_case__' || record.published!==false) throw new ContentError(503,'病历格式异常，目录未更新');
      if (items.some(item=>item.id===id&&item.recordRevision===latest.revision)) return;
      if (!items.some(item=>item.id===id) && items.length>=500) throw new ContentError(413,'已保存病历达到 500 套上限');
      const metadata = {id,template:'__note_case_index__',published:false,title:record.title,
        department:record.facts.department,diagnosis:record.facts.diagnosis,sectionCount:record.sections.length,
        completedAt:record.completedAt,recordRevision:latest.revision};
      try {
        await index.save({version:1,templateOverrides:{},cases:[metadata,...items.filter(item=>item.id!==id)]},
          current.revision,user);
        if ((await storeFor(id).read()).revision===latest.revision) return;
      } catch (error) { if (error.status!==409 || attempt===2) throw error; }
    }
    throw new ContentError(409,'病历仍在更新，目录同步待确认');
  }
  return {
    async list() { return indexItems(await index.read()).map(({id,title,department,diagnosis,sectionCount,completedAt})=>({id,title,department,diagnosis,sectionCount,completedAt})); },
    async get(id) {
      const current = await storeFor(id).read(), record = current.data.cases[0];
      if (!record) throw new ContentError(404,'病历不存在');
      if (record.id!==id||record.template!=='__note_case__'||record.published!==false) throw new ContentError(503,'病历格式异常');
      return {record,revision:current.revision};
    },
    async save(body) {
      const record = validateCompletedCase(body), target = storeFor(record.id);
      const current = await target.read();
      if (current.data.cases.length>1 || current.data.cases.some(item=>item.id!==record.id||item.template!=='__note_case__'||item.published!==false)) throw new ContentError(503,'病历格式异常，已停止修改');
      const saved = await target.save({version:1,templateOverrides:{},cases:[record]},body.revision,user,'complete',current);
      let indexed = true;
      try { await register(record.id); } catch { indexed = false; }
      return {record,revision:saved.revision,indexed,...(!indexed ? {warning:'正文已保存，目录更新未完成；请保留本病历链接，稍后再次保存以更新目录'} : {})};
    }
  };
}

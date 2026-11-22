import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/note-workflow.js';
import {validateInput, buildMessages, chapterDailyPhase} from '../api/note-generate.js';

const workflow = globalThis.HajimiNoteWorkflow;
const input = {complaint:'虚构：右髋疼痛6小时', diagnosis:'右股骨颈骨折', operation:'右侧人工股骨头置换术', day:'2',
  allergies:'青霉素过敏', checks:'入院 Hb 108 g/L', operativeFacts:'失血120 mL，未输血，未放置引流管，假体型号为虚构TEST-42', daily:'今日 Hb 98 g/L，右下肢暂不负重。'};

test('documents of different stages and days have separate identities; editing the same one replaces only it', () => {
  assert.notEqual(workflow.key('first', input), workflow.key('preop', input));
  assert.notEqual(workflow.key('preDaily', input), workflow.key('postDaily', input));
  assert.notEqual(workflow.key('postDaily', input), workflow.key('postDaily', {...input, day:'3'}));
  assert.equal(workflow.key('op', input), workflow.key('op', {...input, day:'3'}));
  assert.notEqual(workflow.key('caseChapter', {...input, chapterTitle:'入院记录'}), workflow.key('caseChapter', {...input, chapterTitle:'术后首次病程'}));
  assert.match(workflow.title('postDaily', input), /第2天/);
});

test('fact comparison exposes original input including numbers and restrictions without rewriting the body', () => {
  assert.ok(workflow.facts(input).some(([, value]) => value === input.operativeFacts));
  assert.equal(workflow.contains('Hb 108 g/L，右侧手术', 'Hb 108 g/L'), true);
  assert.equal(workflow.contains('Hb 88 g/L', 'Hb 108 g/L'), false);
  assert.equal(workflow.contains('未放置引流管', '已放置引流管'), false);
});

test('shared facts remain exact and operative details never enter admission or preoperative requests', () => {
  for (const type of ['first','preop','preDaily','spec','op','postop','postDaily']) {
    const checked = validateInput({type,...input});
    assert.equal(checked.error, undefined);
    const [system,user] = buildMessages(checked);
    assert.ok(user.content.includes(input.allergies));
    assert.ok(user.content.includes(input.checks));
    assert.equal(user.content.includes(input.operativeFacts), ['op','postop','postDaily'].includes(type),type);
    assert.equal(user.content.includes(input.daily), ['preDaily','postDaily'].includes(type),type);
    assert.match(system.content,/未填当日变化时仍按现有补全模式/);
    assert.match(system.content,/不写成今日复查/);
  }
  for (const chapterTitle of ['首次病程记录','术前小结','术后第2天病程记录','手术记录']) {
    const checked=validateInput({...input,type:'caseChapter',caseReference:'教学病例',chapterTitle});
    assert.equal(buildMessages(checked)[1].content.includes(input.operativeFacts),/术后|手术记录/.test(chapterTitle));
  }
});

test('optional workflow fields keep privacy checks and size limits; minimal completion remains allowed', () => {
  for (const [field,limit] of [['allergies',200],['checks',400],['operativeFacts',600]]) {
    assert.match(validateInput({type:'first',...input,[field]:'姓名：测试'}).error,/身份信息/);
    assert.match(validateInput({type:'first',...input,[field]:'字'.repeat(limit+1)}).error,/过长/);
  }
  assert.equal(validateInput({type:'first',complaint:'右髋疼痛',diagnosis:'右股骨颈骨折'}).error,undefined);
});

test('reference admission, first course and discharge do not receive daily facts or acquire daily identities', () => {
  for(const chapterTitle of ['入院记录','首次病程记录','术后首次病程记录','出院查房记录','手术记录','术前小结']){
    const body={...input,type:'caseChapter',caseReference:'虚构病例',chapterTitle,dailyPhase:'post'};
    const user=buildMessages(validateInput(body))[1].content;
    assert(!user.includes(input.daily),chapterTitle);
    assert.doesNotMatch(user,/记录天数（以所选章节阶段为准）/);
    assert.equal(workflow.key('caseChapter',body),workflow.key('caseChapter',{...body,day:'3'}));
    assert.equal(workflow.dailyPhase(chapterTitle),chapterDailyPhase(chapterTitle));
  }
  for(const chapterTitle of ['住院第2天术前病程记录','术后第3天主治医师查房记录','主任医师查房记录']){
    assert.equal(workflow.dailyPhase(chapterTitle),chapterDailyPhase(chapterTitle));
    assert.notEqual(workflow.key('caseChapter',{...input,chapterTitle}),workflow.key('caseChapter',{...input,chapterTitle,day:'3'}));
  }
});

test('operative-only supplements are stage scoped, and mismatched daily phases are rejected',()=>{
  for(const type of ['first','preDaily','preop','spec','op','postop','postDaily']){
    const checked=validateInput({...input,type,extra:'术中放置引流管1根',extraScope:'operative'});
    assert.equal(buildMessages(checked)[1].content.includes('术中放置引流管1根'),['op','postop','postDaily'].includes(type));
  }
  assert.match(validateInput({...input,type:'preDaily',dailyPhase:'post'}).error,/阶段与文书不符/);
  assert.match(validateInput({...input,type:'caseChapter',caseReference:'教学病例',chapterTitle:'术前病程记录',dailyPhase:'post'}).error,/阶段与文书不符/);
  assert.match(validateInput({...input,type:'preDaily',dailyPhase:'post',daily:''}).error,/阶段与文书不符/);
  assert.equal(workflow.key('caseChapter',{...input,chapterTitle:'术前病程记录',dailyPhase:'pre'}),workflow.key('caseChapter',{...input,chapterTitle:'术前病程记录',dailyPhase:'post'}));
  const legacy=buildMessages(validateInput({...input,type:'first',extra:'青霉素过敏；术中未输血'}))[1].content;
  assert.match(legacy,/旧版补充说明（未分类/);
  assert.match(legacy,/青霉素过敏；术中未输血/);
});

test('published procedure chapter titles retain confirmed operative facts without leaking into planning chapters',()=>{
  for(const chapterTitle of ['第一次切口清创缝合术（2026-08-07）','第二次切口清创缝合术（2026-08-13）','第三次清创·左膝关节清创术（2026-08-20）','穿刺置管引流记录']){
    const checked=validateInput({...input,type:'caseChapter',caseReference:'虚构参考',chapterTitle,extra:'术中已取标本',extraScope:'operative'});
    const message=buildMessages(checked)[1].content;
    assert.ok(message.includes(input.operativeFacts),chapterTitle);
    assert.ok(message.includes('术中已取标本'),chapterTitle);
  }
  for(const chapterTitle of ['手术知情同意记录','再次清创术术前小结（2026-08-20）','高热40.5℃+切口周围积液·再手术决策（2026-08-20）']){
    const message=buildMessages(validateInput({...input,type:'caseChapter',caseReference:'虚构参考',chapterTitle,extra:'术中已取标本',extraScope:'operative'}))[1].content;
    assert(!message.includes(input.operativeFacts),chapterTitle);
    assert(!message.includes('术中已取标本'),chapterTitle);
  }
});

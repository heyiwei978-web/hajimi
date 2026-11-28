(function () {
  'use strict';

  const regions = ['knee', 'shoulder', 'hip', 'wrist', 'ankle', 'elbow'];
  const requiredArrays = regions.flatMap(region => ['KNOWLEDGE', 'CASES'].map(kind => region.toUpperCase() + '_' + kind));
  const maxBytes = 1024 * 1024;
  const maxDepth = 24;
  const allowedKeys = /^[a-z][a-z0-9_-]*$/i;

  // v10 stores its reference data in JavaScript literals. Read only that subset
  // from the file as text. The HTML and the surrounding script never enter the DOM.
  function readLiteral(source, offset) {
    const tokens = /(?:\s+|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)*("(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'|[a-zA-Z_$][\w$]*|-?\d+(?:\.\d+)?|[{}\[\]:,;])/y;
    tokens.lastIndex = offset;
    let next = '';
    function take() {
      const value = next;
      next = tokens.exec(source)?.[1] || '';
      return value;
    }
    function expect(token) {
      if (take() !== token) throw new Error('资料格式不符');
    }
    function string(token) {
      if (token.startsWith('"')) return JSON.parse(token);
      return JSON.parse('"' + token.slice(1, -1).replace(/\\'|"/g, match => match === '"' ? '\\"' : "'") + '"');
    }
    function collection(open, depth) {
      const isObject = open === '{';
      const result = isObject ? Object.create(null) : [];
      const end = isObject ? '}' : ']';
      take();
      while (next !== end) {
        if (isObject) {
          const token = take();
          const key = /^["']/.test(token) ? string(token) : token;
          if (!key || ['__proto__', 'constructor', 'prototype'].includes(key) || Object.hasOwn(result, key)) {
            throw new Error('资料字段无效');
          }
          expect(':');
          result[key] = value(depth);
        } else {
          result.push(value(depth));
        }
        if (next !== end) expect(',');
      }
      expect(end);
      return result;
    }
    function value(depth) {
      if (depth >= maxDepth) throw new Error('资料层级过深');
      if (next === '{' || next === '[') return collection(next, depth + 1);
      const token = take();
      if (/^["']/.test(token)) return string(token);
      if (/^-?\d/.test(token)) return Number(token);
      if (token === 'true') return true;
      if (token === 'false') return false;
      if (token === 'null') return null;
      throw new Error('资料包含不支持的表达式');
    }

    take();
    const result = value(0);
    if (next !== ';') throw new Error('资料声明未结束');
    return result;
  }

  const isString = value => typeof value === 'string';
  const strings = value => Array.isArray(value) && value.every(isString);
  const pairs = value => Array.isArray(value) && value.every(pair => strings(pair) && pair.length === 2);
  const record = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const fields = (value, keys) => record(value) && keys.every(key => isString(value[key]));
  const validId = value => isString(value) && allowedKeys.test(value);

  function parse(html) {
    if (html.length > maxBytes) throw new Error('资料文件过大');
    const names = ['JOINTS', 'SPECIAL', 'DECISION_GUIDES', 'diseases', 'OPTS', ...requiredArrays];
    const declarations = new Map();
    for (const match of html.matchAll(/^[\t ]*const\s+([\w]+)\s*=\s*/gm)) {
      if (!names.includes(match[1])) continue;
      if (declarations.has(match[1])) throw new Error('资料声明重复');
      declarations.set(match[1], readLiteral(html, match.index + match[0].length));
    }
    if (declarations.size !== names.length) throw new Error('请选择原查体书写器 v10 HTML 文件');

    const joints = declarations.get('JOINTS');
    const special = declarations.get('SPECIAL');
    const guides = declarations.get('DECISION_GUIDES');
    const diseases = declarations.get('diseases');
    const options = declarations.get('OPTS');
    const knowledge = Object.fromEntries(regions.map(region => [region, declarations.get(region.toUpperCase() + '_KNOWLEDGE')]));
    const cases = requiredArrays.filter(name => name.endsWith('_CASES')).map(name => declarations.get(name));
    if (!record(joints) || !Object.values(joints).every(joint => fields(joint, ['name']) && pairs(joint.dirs)) ||
        !record(special) || !Object.values(special).every(item => fields(item, ['how', 'meaning', 'positive']) &&
          (item.caution === undefined || isString(item.caution))) ||
        !record(guides) || !Object.values(guides).every(guide => fields(guide, ['name']) &&
          Array.isArray(guide.stages) && guide.stages.length && guide.stages.every(stage =>
            fields(stage, ['title', 'why']) && (stage.checks === undefined ? pairs(stage.tests) : pairs(stage.checks) && stage.tests === undefined))) ||
        !Array.isArray(diseases) || !diseases.every(item =>
          fields(item, ['id', 'category', 'name', 'head', 'tip', 'template']) && validId(item.id) &&
          ['joints', 'inspect', 'palp', 'special'].every(key => strings(item[key])) &&
          item.joints.every(joint => Object.hasOwn(joints, joint))) ||
        !record(options) || !Object.values(options).every(item => record(item) && strings(item.inspect) && strings(item.palp)) ||
        !Object.values(knowledge).every(list => Array.isArray(list) && list.every(item =>
          fields(item, ['id', 'name', 'subtitle', 'pearl']) && validId(item.id) && (item.exams === undefined || strings(item.exams)) &&
          Array.isArray(item.sections) && item.sections.every(section => Array.isArray(section) &&
            section.length === 2 && isString(section[0]) && (isString(section[1]) || strings(section[1]))))) ||
        !cases.every(list => Array.isArray(list) && list.every(item => fields(item, ['id', 'title', 'disease', 'level', 'story']) &&
          validId(item.id) && strings(item.reveals) && Array.isArray(item.questions) && item.questions.length &&
          item.questions.every(question => fields(question, ['q', 'why']) && strings(question.opts) &&
            Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.opts.length)))) {
      throw new Error('资料字段不完整或格式不符');
    }

    // Standalone spine templates were previously withdrawn from the workstation.
    const templates = diseases.filter(item => item.category !== '脊柱疾病').map(item => ({
      ...item,
      inspect: options[item.id]?.inspect || item.inspect,
      palp: options[item.id]?.palp || item.palp
    }));
    // The v10 topic and case collections are paired in the same order within each region.
    const caseForTopic = Object.create(null);
    Object.values(knowledge).forEach((topics, index) => {
      if (topics.length !== cases[index].length) return;
      topics.forEach((topic, topicIndex) => {caseForTopic[topic.id] = cases[index][topicIndex].id;});
    });
    return {joints, guides, special, templates, knowledge, cases: cases.flat(), caseForTopic};
  }

  globalThis.HajimiOrthoExamImport = {parse, maxBytes};
})();

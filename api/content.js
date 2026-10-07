import {get,put} from '@vercel/blob';
import {guardRequest} from './_security.js';

const P = 'cms/content.json';
const empty = () => ({version:1,templateOverrides:{},cases:[]});
async function read() {
  try {
    const result = await get(P,{access:'private',useCache:false});
    if (!result || result.statusCode !== 200) return empty();
    const data = JSON.parse(await new Response(result.stream).text());
    return {version:1,templateOverrides:data.templateOverrides || {},cases:Array.isArray(data.cases) ? data.cases : []};
  } catch { return empty(); }
}

export default async function handler(req,res) {
  if (!guardRequest(req,res,{methods:['GET','PUT'],admin:req.method === 'PUT',json:req.method === 'PUT',bodyLimit:1500000})) return;
  if (req.method === 'GET') return res.status(200).json(await read());
  const body = req.body;
  const content = {
    version:1,
    templateOverrides:body.templateOverrides && typeof body.templateOverrides === 'object' && !Array.isArray(body.templateOverrides) ? body.templateOverrides : {},
    cases:Array.isArray(body.cases) ? body.cases.slice(0,500) : []
  };
  const text = JSON.stringify(content);
  if (Buffer.byteLength(text) > 1500000) return res.status(413).json({error:'内容数据过大'});
  await put(P,text,{access:'private',allowOverwrite:true,contentType:'application/json; charset=utf-8'});
  return res.status(200).json(content);
}

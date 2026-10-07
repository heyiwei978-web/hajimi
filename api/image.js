import {get} from '@vercel/blob';
import {guardRequest} from './_security.js';

export default async function handler(req,res) {
  if (!guardRequest(req,res,{methods:['GET']})) return;
  const pathname = req.query.path;
  if (typeof pathname !== 'string' || !/^cases\/[A-Za-z0-9_/-]+\.(?:jpe?g|png|webp)$/.test(pathname) || pathname.includes('..')) return res.status(400).end();
  try {
    const result = await get(pathname,{access:'private',useCache:true});
    if (!result || result.statusCode !== 200) return res.status(404).end();
    const contentType = result.blob.contentType;
    if (!/^image\/(jpeg|png|webp)$/.test(contentType)) return res.status(404).end();
    const buffer = await new Response(result.stream).arrayBuffer();
    res.setHeader('Content-Type',contentType);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','public,max-age=3600');
    return res.status(200).end(Buffer.from(buffer));
  } catch { return res.status(404).end(); }
}

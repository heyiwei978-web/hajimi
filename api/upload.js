import crypto from 'node:crypto';
import {blob} from './_blob-auth.js';
import {guardRequest} from './_security.js';

function matchesImage(buffer, type) {
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]));
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return buffer.length >= 12 && buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP';
}

export default async function handler(req,res) {
  // Includes base64 overhead and stays below Vercel's function request-size ceiling.
  if (!guardRequest(req,res,{methods:['POST'],admin:true,json:true,bodyLimit:4400000})) return;
  const {type, data} = req.body;
  if (!/^image\/(jpeg|png|webp)$/.test(type || '')) return res.status(400).json({error:'仅支持 JPG、PNG、WebP'});
  if (typeof data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) {
    return res.status(400).json({error:'图片编码错误'});
  }
  const buffer = Buffer.from(data,'base64');
  if (!buffer.length || buffer.length > 4000000) return res.status(413).json({error:'单张图片压缩后需小于 4MB'});
  if (!matchesImage(buffer,type)) return res.status(400).json({error:'图片内容与格式不符'});
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const pathname = 'cases/' + Date.now() + '-' + crypto.randomBytes(6).toString('hex') + '.' + extension;
  const stored = await blob.put(pathname,buffer,{access:'private',contentType:type});
  return res.status(200).json({pathname:stored.pathname});
}

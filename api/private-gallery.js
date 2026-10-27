import {randomUUID} from 'node:crypto';
import {blob as blobClient} from './_blob-auth.js';
import {readSession} from './_auth.js';
import {guardRequest} from './_security.js';
import {ContentError} from './_content-store.js';
import {privateGalleryStore,galleryItems,CATEGORIES} from './_private-gallery.js';

function matchesImage(buffer,type){
  if(type==='image/jpeg')return buffer.length>=3&&buffer.subarray(0,3).equals(Buffer.from([255,216,255]));
  if(type==='image/png')return buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return buffer.length>=12&&buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP';
}
export function createPrivateGalleryHandler({store=privateGalleryStore,blob=blobClient}={}){
  return async function handler(req,res){
    if(!guardRequest(req,res,{methods:['GET','POST'],admin:true,json:req.method==='POST',bodyLimit:4400000}))return;
    res.setHeader('Cache-Control','private, no-store');
    const user=readSession(req)?.u;
    if(!user)return res.status(401).json({error:'未登录或会话已失效'});
    try{
      if(req.method==='GET'){
        const current=await store.read();
        return res.status(200).json({items:galleryItems(current),revision:current.revision});
      }
      const {title,description='',category,type,data,revision}=req.body;
      if(typeof title!=='string'||!title.trim()||title.trim().length>100
        ||typeof description!=='string'||description.length>2000||!CATEGORIES.includes(category)){
        return res.status(400).json({error:'请填写标题（最多100字）、分类与说明（最多2000字）'});
      }
      if(typeof revision!=='string'||!revision)return res.status(428).json({error:'请先加载图片库再上传'});
      if(!/^image\/(jpeg|png|webp)$/.test(type||'')||typeof data!=='string'
        ||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)){
        return res.status(400).json({error:'仅支持有效的 JPG、PNG、WebP 图片'});
      }
      const buffer=Buffer.from(data,'base64');
      if(!buffer.length||buffer.length>3000000)return res.status(413).json({error:'单张图片压缩后需小于3MB'});
      if(!matchesImage(buffer,type))return res.status(400).json({error:'图片内容与格式不符'});
      const current=await store.read();galleryItems(current);
      if(current.revision!==revision)throw new ContentError(409,'图片库已更新，请刷新后再上传');
      if(current.data.cases.length>=500)throw new ContentError(413,'图片库已达500张上限');
      const id=randomUUID(),extension=type==='image/jpeg'?'jpg':type==='image/png'?'png':'webp';
      const pathname='private-gallery/images/'+id+'.'+extension;
      await blob.put(pathname,buffer,{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:type});
      const item={id,template:'__private_gallery__',published:false,title:title.trim(),description:description.trim(),category,images:[pathname],createdAt:new Date().toISOString()};
      // If the conditional save fails, the unindexed image remains private and inaccessible.
      const result=await store.save({...current.data,cases:[item,...current.data.cases]},revision,user,'private-upload',current);
      return res.status(201).json({item:galleryItems({data:{cases:[item]}})[0],revision:result.revision});
    }catch(error){
      return res.status(error instanceof ContentError?error.status:503).json({error:error instanceof ContentError?error.message:'图片保存结果待确认，请刷新图片库核对后再操作'});
    }
  };
}
export default createPrivateGalleryHandler();

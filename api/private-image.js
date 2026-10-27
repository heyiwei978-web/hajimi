import {blob as blobClient} from './_blob-auth.js';
import {guardRequest} from './_security.js';
import {privateGalleryStore,galleryItems,PRIVATE_IMAGE_PATH} from './_private-gallery.js';

export function createPrivateImageHandler({store=privateGalleryStore,blob=blobClient}={}){
  return async function handler(req,res){
    if(!guardRequest(req,res,{methods:['GET'],admin:true}))return;
    res.setHeader('Cache-Control','private, no-store');
    const pathname=req.query.path;
    if(typeof pathname!=='string'||!PRIVATE_IMAGE_PATH.test(pathname))return res.status(400).end();
    try{
      if(!galleryItems(await store.read()).some(item=>item.images.includes(pathname)))return res.status(404).end();
      const result=await blob.get(pathname,{access:'private',useCache:false});
      if(!result||result.statusCode!==200||!/^image\/(jpeg|png|webp)$/.test(result.blob.contentType))return res.status(404).end();
      const buffer=Buffer.from(await new Response(result.stream).arrayBuffer());
      res.setHeader('Content-Type',result.blob.contentType);
      res.setHeader('X-Content-Type-Options','nosniff');
      return res.status(200).end(buffer);
    }catch{return res.status(503).end();}
  };
}
export default createPrivateImageHandler();

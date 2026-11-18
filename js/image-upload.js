(() => {
  window.HAJIMI_IMAGE={async prepare(file){
    if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('仅支持 JPG、PNG、WebP');
    const image=await createImageBitmap(file);
    try{
      let width=image.width,height=image.height;
      if(Math.max(width,height)>1800){const ratio=1800/Math.max(width,height);width=Math.round(width*ratio);height=Math.round(height*ratio);}
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);
      const encode=quality=>new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
      let blob=await encode(.88);if(!blob)throw new Error('图片处理失败，请换一张图片重试');if(blob.size>3000000)blob=await encode(.72);
      if(!blob||blob.size>3000000)throw new Error('图片压缩后仍过大，请缩小图片后重试');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('图片读取失败'));reader.readAsDataURL(blob);});
      return {name:file.name.replace(/\.[^.]+$/,'')+'.jpg',type:'image/jpeg',data};
    }finally{image.close?.();}
  }};
})();

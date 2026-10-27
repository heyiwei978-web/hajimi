import {blob} from './_blob-auth.js';
import {ContentError,createContentStore} from './_content-store.js';

// Separate from public CMS data, including its backups and restore operations.
export const privateGalleryStore=createContentStore(blob,{
  currentPath:'private-gallery/index.json',historyPrefix:'private-gallery/history/'
});
export const PRIVATE_IMAGE_PATH=/^private-gallery\/images\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/;
export const CATEGORIES=['DR','外伤','术中','其他'];
export function galleryItems(current){
  const items=current.data.cases;
  if(items.some(item=>item.template!=='__private_gallery__'||item.published!==false
    ||typeof item.title!=='string'||typeof item.description!=='string'||!CATEGORIES.includes(item.category)
    ||!Array.isArray(item.images)||item.images.length!==1||!PRIVATE_IMAGE_PATH.test(item.images[0])
    ||typeof item.createdAt!=='string'))throw new ContentError(503,'私人图片库格式异常，已停止修改');
  return items.map(({id,title,description,category,images,createdAt})=>({id,title,description,category,images,createdAt}));
}

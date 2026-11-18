// 使用病历生成的同一提供方、地址和服务端密钥发现模型；不接受客户端地址或密钥。
export function createModelCatalog(fetchImpl, {timeoutMs = 3500, now = Date.now} = {}) {
  let cached = null;
  return async config => {
    if (cached && cached.url === config.url && cached.key === config.key && cached.until > now()) return cached.models;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(config.url.replace(/\/chat\/completions$/, '/models'), {
        headers:{Authorization:'Bearer '+config.key},signal:controller.signal
      });
      if (!response.ok) throw new Error('Model discovery failed');
      const data = await response.json();
      if (!Array.isArray(data?.data)) throw new Error('Invalid model catalog');
      const models = data.data.filter(item => item && typeof item.id === 'string'
        && /^deepseek-[a-zA-Z0-9._:-]{1,90}$/.test(item.id))
        .slice(0,50).map(item => ({id:item.id,name:typeof item.name === 'string' ? item.name.slice(0,100) : item.id}));
      const unique = [...new Map(models.map(item => [item.id,item])).values()];
      cached = {url:config.url,key:config.key,until:now()+300000,models:unique};
      return unique;
    } finally { clearTimeout(timer); }
  };
}

// 单实例内存计数（2026-11-20，优化方案 P0-3 / P0-4）。
// Blob 中的限流计数是「读 → 加一 → 覆盖写」，同一时刻的并发请求会读到同一个旧值而漏计，
// 存储故障时还会放行。内存计数在同一个函数实例里是准确的（JavaScript 单线程），
// 可以挡住打到同一实例的突发请求，而且不消耗 Blob 操作额度。
// 它只是第一道防线：不同实例之间不共享，实例回收后清零；跨实例的限制仍靠 Blob 计数和 Vercel WAF。
// 只保存网络地址摘要等键名和次数，不保存请求内容。各方法可传入当前时间 at，便于测试。
export function createMemoryLimiter({windowMs, maxKeys = 2000, now = () => Date.now()}) {
  const entries = new Map();
  const live = (entry, at) => entry && at - entry.start < windowMs;
  function prune(at) {
    for (const [key, entry] of entries) if (!live(entry, at)) entries.delete(key);
    // 仍然超出上限时淘汰最早写入的键，内存占用始终有界。
    while (entries.size > maxKeys) entries.delete(entries.keys().next().value);
  }
  return {
    // 当前窗口内的次数。
    count(key, at = now()) {
      const entry = entries.get(key);
      return live(entry, at) ? entry.count : 0;
    },
    // 加一并返回加后的次数和窗口开始时间。
    add(key, at = now()) {
      let entry = entries.get(key);
      if (!live(entry, at)) {
        entries.delete(key);
        entry = {start: at, count: 0};
        entries.set(key, entry);
        if (entries.size > maxKeys) prune(at);
      }
      entry.count += 1;
      return {count: entry.count, start: entry.start};
    },
    // 窗口还剩多少毫秒；没有记录时为 0。
    remaining(key, at = now()) {
      const entry = entries.get(key);
      return live(entry, at) ? entry.start + windowMs - at : 0;
    },
    reset(key) { entries.delete(key); },
    get size() { return entries.size; }
  };
}

/* Inputs use milliseconds; calculations stay in the browser. No diagnostic thresholds. */
(()=>{
  'use strict';
  function positive(value){
    const number=typeof value==='number'||typeof value==='string'?Number(value):NaN;
    if(!Number.isFinite(number)||number<=0)throw new RangeError('请完整输入大于 0 的有限数值，单位为 ms。');
    return number;
  }
  function heartRate(rrMs){
    const result=60000/positive(rrMs);
    if(!Number.isFinite(result))throw new RangeError('RR 间期过小，无法计算，请核对单位。');
    return result;
  }
  function qtc(qtMs,rrMs){
    const qt=positive(qtMs),rrSeconds=positive(rrMs)/1000;
    const bazett=qt/Math.sqrt(rrSeconds),fridericia=qt/Math.cbrt(rrSeconds);
    if(!Number.isFinite(bazett)||!Number.isFinite(fridericia))throw new RangeError('数值超出计算范围，请核对单位。');
    return {bazett,fridericia,rrSeconds,heartRate:heartRate(rrMs)};
  }
  window.HAJIMI_ECG_CALCULATORS=Object.freeze({heartRate,qtc});
})();

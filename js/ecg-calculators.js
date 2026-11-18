/* Inputs use milliseconds unless stated; calculations stay in the browser. Reference ranges are adult teaching values, not diagnoses. */
(()=>{
  'use strict';
  function positive(value,unit='ms'){
    const number=typeof value==='number'||typeof value==='string'?Number(value):NaN;
    if(value===''||value===null||typeof value==='boolean'||!Number.isFinite(number)||number<=0)throw new RangeError('请完整输入大于 0 的有限数值，单位为 '+unit+'。');
    return number;
  }
  function finite(value,label){
    if(value===''||value===null||value===undefined||typeof value==='boolean')throw new RangeError('请完整输入'+label+'（可为负数）。');
    const number=Number(value);
    if(!Number.isFinite(number))throw new RangeError('请完整输入'+label+'（可为负数）。');
    return number;
  }
  function heartRate(rrMs){
    const result=60000/positive(rrMs);
    if(!Number.isFinite(result))throw new RangeError('RR 间期过小，无法计算，请核对单位。');
    return result;
  }
  // Bazett and Fridericia (RR in seconds), Framingham (Sagie 1992) and Hodges (heart rate based).
  function qtc(qtMs,rrMs){
    const qt=positive(qtMs),rrSeconds=positive(rrMs)/1000,rate=heartRate(rrMs);
    const bazett=qt/Math.sqrt(rrSeconds),fridericia=qt/Math.cbrt(rrSeconds);
    const framingham=qt+154*(1-rrSeconds),hodges=qt+1.75*(rate-60);
    if(![bazett,fridericia,framingham,hodges].every(Number.isFinite))throw new RangeError('数值超出计算范围，请核对单位。');
    return {bazett,fridericia,framingham,hodges,rrSeconds,heartRate:rate};
  }
  // Frontal QRS axis from the net QRS deflection (R minus |Q+S|, any consistent unit) in leads I and aVF.
  function axis(netI,netAvf){
    const i=finite(netI,' I 导联净振幅'),f=finite(netAvf,' aVF 导联净振幅');
    if(i===0&&f===0)throw new RangeError('I 与 aVF 导联净振幅不能同时为 0，请改用其他导联判断。');
    const degrees=Math.round(Math.atan2(f,i)*180/Math.PI);
    let category;
    if(degrees>=-30&&degrees<=90)category='正常电轴（−30° 至 +90°）';
    else if(degrees<-30&&degrees>=-90)category='电轴左偏（−30° 至 −90°）';
    else if(degrees>90&&degrees<=180)category='电轴右偏（+90° 至 +180°）';
    else category='极度电轴偏移（−90° 至 −180°）';
    return {degrees,category};
  }
  // Grid conversion: small squares (1 mm) at the given paper speed (mm/s) and gain (mm/mV).
  function boxesToMs(smallBoxes,speed=25){
    const boxes=positive(smallBoxes,'小格'),mmPerSecond=positive(speed,'mm/s');
    return boxes*1000/mmPerSecond;
  }
  function mmToMv(mm,gain=10){
    return finite(mm,'振幅（mm）')/positive(gain,'mm/mV');
  }
  function heartRateFromBoxes(smallBoxes,speed=25){
    return heartRate(boxesToMs(smallBoxes,speed));
  }
  function heartRateSixSecond(qrsCount){
    const count=positive(qrsCount,'个');
    if(!Number.isInteger(count))throw new RangeError('请输入 6 秒内 QRS 波的个数（整数）。');
    return count*10;
  }
  window.HAJIMI_ECG_CALCULATORS=Object.freeze({heartRate,qtc,axis,boxesToMs,mmToMv,heartRateFromBoxes,heartRateSixSecond});
})();

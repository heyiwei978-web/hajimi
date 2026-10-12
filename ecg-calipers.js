/* Electronic calipers for the teaching sketches.
 * Idea from open-source EP Calipers (github.com/mannd/epcalipers): two movable
 * legs over the tracing, reading the interval and the equivalent rate. This is
 * an independent implementation for SVG sketches drawn at 1 unit = 5 ms. */
(()=>{
  'use strict';
  const NS='http://www.w3.org/2000/svg',BOX=8;
  const el=(name,attrs)=>{const node=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node;};
  const msPerUnit=()=>(window.HAJIMI_ECG_WAVEFORMS&&window.HAJIMI_ECG_WAVEFORMS.MS_PER_UNIT)||5;

  function reading(a,b){
    const ms=Math.round(Math.abs(b-a)*msPerUnit()/5)*5;
    return {ms,rate:ms>0?Math.round(60000/ms):null};
  }
  function describe(r){return r.ms?r.ms+' ms'+(r.rate?' · 相当于 '+r.rate+' 次/分':''):'请拉开两条测量线';}

  function attach(figure){
    const svg=figure.querySelector('svg.ecg-waveform:not(.ecg-electrodes)');
    if(!svg||figure.querySelector('.ecg-caliper-toggle'))return;
    const box=svg.viewBox.baseVal,height=box.height,width=box.width;
    const caption=figure.querySelector('figcaption');
    const button=document.createElement('button');
    button.type='button';button.className='btn ecg-caliper-toggle';button.setAttribute('aria-pressed','false');button.textContent='卡尺测量';
    const output=document.createElement('p');output.className='ecg-caliper-readout';output.setAttribute('role','status');output.setAttribute('aria-live','polite');output.hidden=true;
    caption.append(button,output);
    let layer=null,legs=[250,410],active=1,drag=null;

    function draw(){
      const [a,b]=legs,r=reading(a,b),left=Math.min(a,b),right=Math.max(a,b);
      layer.querySelector('[data-leg="0"]').setAttribute('x1',a);layer.querySelector('[data-leg="0"]').setAttribute('x2',a);
      layer.querySelector('[data-leg="1"]').setAttribute('x1',b);layer.querySelector('[data-leg="1"]').setAttribute('x2',b);
      const bar=layer.querySelector('.ecg-caliper-bar');bar.setAttribute('x1',left);bar.setAttribute('x2',right);
      const label=layer.querySelector('text');label.textContent=r.ms+' ms'+(r.rate?' · '+r.rate+'/分':'');
      label.setAttribute('x',Math.min(Math.max((left+right)/2,70),width-70));
      layer.querySelectorAll('line[data-leg]').forEach(line=>line.classList.toggle('is-active',Number(line.dataset.leg)===active));
      output.innerHTML='';const value=document.createElement('strong');value.textContent='卡尺：'+describe(r);const hint=document.createElement('small');hint.textContent='拖动或点按移动最近的红线；键盘：方向键移动右线，Shift+方向键移动左线，Alt 微调。按网格计算（1 小格 = 40 ms），仅用于练习测量方法。';output.append(value,hint);
    }
    function toSvgX(event){
      const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
      const matrix=svg.getScreenCTM();if(!matrix)return null;
      return Math.min(Math.max(point.matrixTransform(matrix.inverse()).x,0),width);
    }
    function enable(){
      layer=el('g',{class:'ecg-caliper','aria-hidden':'true'});
      layer.append(
        el('rect',{class:'ecg-caliper-hit',x:0,y:0,width,height,fill:'transparent'}),
        el('line',{'data-leg':0,y1:6,y2:height-6}),el('line',{'data-leg':1,y1:6,y2:height-6}),
        el('line',{class:'ecg-caliper-bar',y1:14,y2:14}),
        el('text',{y:30,'text-anchor':'middle'}));
      svg.append(layer);
      svg.classList.add('is-measuring');svg.setAttribute('tabindex','0');
      figure.querySelector('.ecg-figure-scroll').classList.add('is-measuring');
      button.setAttribute('aria-pressed','true');button.textContent='关闭卡尺';output.hidden=false;
      draw();
    }
    function disable(){
      layer?.remove();layer=null;svg.classList.remove('is-measuring');svg.removeAttribute('tabindex');
      figure.querySelector('.ecg-figure-scroll').classList.remove('is-measuring');
      button.setAttribute('aria-pressed','false');button.textContent='卡尺测量';output.hidden=true;
    }
    button.addEventListener('click',()=>layer?disable():enable());
    svg.addEventListener('pointerdown',event=>{
      if(!layer)return;
      const x=toSvgX(event);if(x==null)return;
      // Grab whichever leg is closer, so a tap moves the nearest line.
      active=Math.abs(x-legs[0])<=Math.abs(x-legs[1])?0:1;
      legs[active]=x;drag=event.pointerId;svg.setPointerCapture?.(event.pointerId);draw();event.preventDefault();
    });
    svg.addEventListener('pointermove',event=>{if(layer&&drag===event.pointerId){const x=toSvgX(event);if(x!=null){legs[active]=x;draw();}}});
    const stop=event=>{if(drag===event.pointerId)drag=null;};
    svg.addEventListener('pointerup',stop);svg.addEventListener('pointercancel',stop);
    svg.addEventListener('keydown',event=>{
      if(!layer)return;
      const step=event.altKey?1:BOX;
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        active=event.shiftKey?0:1;
        legs[active]=Math.min(Math.max(legs[active]+(event.key==='ArrowLeft'?-step:step),0),width);draw();event.preventDefault();
      }else if(event.key==='Escape'){disable();button.focus();}
    });
  }

  function enhance(root=document){root.querySelectorAll('figure.ecg-figure').forEach(attach);}
  window.HAJIMI_ECG_CALIPERS=Object.freeze({enhance,reading});
})();

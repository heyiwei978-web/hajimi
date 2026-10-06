(function(){
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const NICE='https://www.nice.org.uk/guidance/ng158/chapter/recommendations';
const SRC={
bmi:['CDC','成人 BMI'],egfr:['NIDDK','eGFR · CKD-EPI 2021'],dvt:['NICE NG158','DVT Wells · 2级'],pe:['NICE NG158','PE Wells · 2级'],news2:['RCP','NEWS2'],rcri:['ACC/AHA','Revised Cardiac Risk Index']
};
function ck(g,t,v){return '<label class="check"><input type="checkbox" data-g="'+g+'" data-v="'+v+'"><span>'+t+' <b>'+(v>0?'+':'')+v+'</b></span></label>'}
function source(u,n){return '<div class="cite">官方依据：<a href="'+u+'" target="_blank" rel="noopener">'+n+' ↗</a></div>'}
function result(h){const r=$('#res');r.hidden=false;r.innerHTML=h}
function score(g){return $$('input[data-g="'+g+'"]:checked').reduce((a,x)=>a+Number(x.dataset.v),0)}
function openTool(k){const t=SRC[k];$('#deyebrow').textContent=t[0];$('#dtitle').textContent=t[1];$('#dbody').innerHTML=body(k);$('#dlg').showModal();bind(k)}
function body(k){
 if(k==='bmi')return '<div class="body"><div class="formgrid"><label class="field">身高（cm）<input id="h" type="number" step=".1"></label><label class="field">体重（kg）<input id="w" type="number" step=".1"></label></div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div><div id="res" class="result" hidden></div>'+source('https://www.cdc.gov/bmi/adult-calculator/index.html','CDC Adult BMI Calculator')+'</div>';
 if(k==='egfr')return '<div class="body"><div class="formgrid"><label class="field">年龄（岁）<input id="age" type="number" min="18"></label><label class="field">性别<select id="sex"><option value="m">男</option><option value="f">女</option></select></label><label class="field">血清肌酐<input id="cr" type="number" step=".1"></label><label class="field">单位<select id="unit"><option value="u">μmol/L</option><option value="m">mg/dL</option></select></label></div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div><div id="res" class="result" hidden></div><div class="warn">适用于成人。接近关键临床决策阈值时，可结合胱抑素C等进一步评估。</div>'+source('https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults','NIDDK 2021 CKD-EPI')+'</div>';
 if(k==='dvt')return '<div class="body"><div class="checks">'+ck('d','活动性肿瘤（正在治疗、6个月内治疗或姑息）',1)+ck('d','下肢瘫痪/轻瘫，或近期石膏固定',1)+ck('d','卧床≥3天，或12周内需全麻/区域麻醉的大手术',1)+ck('d','沿深静脉走行的局部压痛',1)+ck('d','整条患肢肿胀',1)+ck('d','小腿周径较无症状侧大≥3cm',1)+ck('d','凹陷性水肿局限于有症状下肢',1)+ck('d','侧支浅静脉（非静脉曲张）',1)+ck('d','既往明确 DVT',1)+ck('d','其他诊断至少与 DVT 同样可能',-2)+'</div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div><div id="res" class="result" hidden></div>'+source(NICE,'NICE NG158')+'</div>';
 if(k==='pe')return '<div class="body"><div class="checks">'+ck('p','DVT 临床症状和体征',3)+ck('p','其他诊断不如 PE 可能',3)+ck('p','心率 >100 次/分',1.5)+ck('p','制动 >3天或4周内手术',1.5)+ck('p','既往 DVT / PE',1.5)+ck('p','咯血',1)+ck('p','恶性肿瘤（正在治疗、6个月内治疗或姑息）',1)+'</div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div><div id="res" class="result" hidden></div>'+source(NICE,'NICE NG158')+'</div>';
 if(k==='rcri')return '<div class="body"><div class="checks">'+ck('r','缺血性心脏病史/证据',1)+ck('r','脑血管疾病史',1)+ck('r','心力衰竭史/证据',1)+ck('r','糖尿病需要胰岛素治疗',1)+ck('r','血清肌酐 ≥2.0 mg/dL（约177 μmol/L）',1)+ck('r','计划高风险手术：腹腔内、胸腔内或血管手术',1)+'</div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div><div id="res" class="result" hidden></div><div class="warn">RCRI 不应单独决定是否手术或是否追加检查，应结合手术紧急程度、活动性心血管疾病与功能状态。</div>'+source('https://www.acc.org/latest-in-cardiology/ten-points-to-remember/2024/09/23/04/15/2024-aha-acc-perioperative-guideline-gl','ACC/AHA perioperative guidance')+'</div>';
 if(k==='news2')return '<div class="body"><div class="formgrid"><label class="field">呼吸频率（/min）<input id="rr" type="number"></label><label class="field">SpO₂（%）<input id="spo2" type="number"></label><label class="field">SpO₂量表<select id="scale"><option value="1">Scale 1</option><option value="2">Scale 2（仅适用于有明确高碳酸血症呼吸衰竭目标范围者）</option></select></label><label class="field">吸氧<select id="o2"><option value="0">否</option><option value="2">是</option></select></label><label class="field">收缩压（mmHg）<input id="sbp" type="number"></label><label class="field">脉搏（/min）<input id="pulse" type="number"></label><label class="field">体温（℃）<input id="temp" type="number" step=".1"></label><label class="field">意识<select id="con"><option value="0">清醒 A</option><option value="3">新发意识混乱 / V / P / U</option></select></label></div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div><div id="res" class="result" hidden></div><div class="warn">Scale 2 仅应在临床明确需要较低氧饱和度目标范围时使用。</div>'+source('https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/','Royal College of Physicians NEWS2')+'</div>';
}
function newsScore(){
 const rr=+$('#rr').value,sp=+$('#spo2').value,scale=$('#scale').value,sbp=+$('#sbp').value,p=+$('#pulse').value,t=+$('#temp').value;
 if(!(rr>0&&sp>0&&sbp>0&&p>0&&t>0))return null;
 let s=0;
 s+=rr<=8?3:rr<=11?1:rr<=20?0:rr<=24?2:3;
 if(scale==='1')s+=sp<=91?3:sp<=93?2:sp<=95?1:0;
 else s+=sp<=83?3:sp<=85?2:sp<=87?1:sp<=92?0:sp<=94?1:sp<=96?2:3;
 s+=+$('#o2').value;
 s+=sbp<=90?3:sbp<=100?2:sbp<=110?1:sbp<=219?0:3;
 s+=p<=40?3:p<=50?1:p<=90?0:p<=110?1:p<=130?2:3;
 s+=t<=35?3:t<=36?1:t<=38?0:t<=39?1:2;
 s+=+$('#con').value;
 return s;
}
function bind(k){
 const clear=$('#clear');if(clear)clear.onclick=()=>{$$('#dlg input').forEach(x=>{if(x.type==='checkbox')x.checked=false;else x.value=''});const r=$('#res');if(r){r.hidden=true;r.innerHTML=''}};
 if(k==='bmi')$('#go').onclick=()=>{const h=+$('#h').value,w=+$('#w').value;if(!(h>0&&w>0))return result('<strong>请完整输入</strong>');const n=w/Math.pow(h/100,2);const c=n<18.5?'偏低':n<25?'健康体重':n<30?'超重':n<35?'肥胖 I 级':n<40?'肥胖 II 级':'肥胖 III 级';result('<strong>'+n.toFixed(1)+' kg/m²</strong><span>成人 BMI 分类：'+c+'。BMI 是筛查指标。</span>')};
 if(k==='egfr')$('#go').onclick=()=>{const a=+$('#age').value,s=$('#sex').value,c0=+$('#cr').value,u=$('#unit').value;if(!(a>=18&&c0>0))return result('<strong>请检查输入</strong>');const c=u==='u'?c0/88.4:c0,f=s==='f',K=f?.7:.9,A=f?-.241:-.302,r=c/K,e=142*Math.pow(Math.min(r,1),A)*Math.pow(Math.max(r,1),-1.2)*Math.pow(.9938,a)*(f?1.012:1);result('<strong>'+e.toFixed(1)+' mL/min/1.73m²</strong><span>2021 CKD-EPI creatinine equation。</span>')};
 if(k==='dvt')$('#go').onclick=()=>{const s=score('d');result('<strong>'+s+' 分 · '+(s>=2?'DVT likely':'DVT unlikely')+'</strong><span>NICE：≥2分 likely；≤1分 unlikely。后续检查和治疗按临床路径处理。</span>')};
 if(k==='pe')$('#go').onclick=()=>{const s=score('p');result('<strong>'+s+' 分 · '+(s>4?'PE likely':'PE unlikely')+'</strong><span>NICE：>4分 likely；≤4分 unlikely。</span>')};
 if(k==='rcri')$('#go').onclick=()=>{const s=score('r');result('<strong>RCRI '+s+' 分</strong><span>共 '+s+' 项风险变量。应结合手术风险、功能状态和活动性心血管疾病解释。</span>')};
 if(k==='news2')$('#go').onclick=()=>{const s=newsScore();if(s===null)return result('<strong>请完整输入</strong>');const band=s>=7?'高风险':s>=5?'中风险':s>=1?'低风险':'低风险';result('<strong>NEWS2 '+s+' 分</strong><span>'+band+'。单项出现3分也具有临床意义；具体升级响应按本机构NEWS2流程执行。</span>')};
}
$$('.card[data-tool]').forEach(c=>c.addEventListener('click',(e)=>{if(e.target.closest('a'))return;openTool(c.dataset.tool)}));
$('#close').onclick=()=>$('#dlg').close();
$('#dlg').addEventListener('click',(e)=>{if(e.target===$('#dlg'))$('#dlg').close()});
})();
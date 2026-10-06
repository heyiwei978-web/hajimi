(function(){
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const NICE='https://www.nice.org.uk/guidance/ng158/chapter/recommendations';
const SRC={
bmi:['CDC','成人 BMI','https://www.cdc.gov/bmi/about/index.html'],
bsa:['PubMed','体表面积 · Mosteller','https://pubmed.ncbi.nlm.nih.gov/16546483/'],
ibw:['PubMed','理想体重 · Devine','https://pubmed.ncbi.nlm.nih.gov/38580757/'],
pbw:['NHLBI','预测体重与肺保护潮气量','https://biolincc.nhlbi.nih.gov/media/studies/factt/Protocol.pdf'],
egfr:['NIDDK','eGFR · CKD-EPI 2021','https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults'],
egfrcc:['NIDDK','eGFR · 肌酐+胱抑素C','https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults'],
ckidu25:['NIDDK','CKiD U25 eGFR','https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/children-adolescents-young-adults'],
ckidbed:['NIDDK','CKiD bedside 2009','https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/children-adolescents-young-adults'],
crcl:['FDA','Cockcroft–Gault 肌酐清除率','https://www.fda.gov/media/71114/download'],
fena:['NIH','钠排泄分数 FeNa','https://pmc.ncbi.nlm.nih.gov/articles/PMC5516416/'],
feurea:['Mayo Clinic Labs','尿素排泄分数 FeUrea','https://www.mayocliniclabs.com/test-catalog/overview/614061'],
ag:['NIH','阴离子间隙','https://pmc.ncbi.nlm.nih.gov/articles/PMC5757582/'],
corrag:['NIH','白蛋白校正阴离子间隙','https://pmc.ncbi.nlm.nih.gov/articles/PMC12067511/'],
osm:['NIH','计算血清渗透压','https://pmc.ncbi.nlm.nih.gov/articles/PMC7315350/'],
osmgap:['NIH','渗透压间隙','https://pmc.ncbi.nlm.nih.gov/articles/PMC1472985/'],
corrna:['NIH','高血糖校正钠','https://pmc.ncbi.nlm.nih.gov/articles/PMC7479837/'],
winter:['NIH','Winter 公式','https://www.ncbi.nlm.nih.gov/books/NBK507807/'],
deltaratio:['NIH','Delta ratio','https://www.ncbi.nlm.nih.gov/books/NBK448090/'],
map:['NIH','平均动脉压 MAP','https://pubmed.ncbi.nlm.nih.gov/29489154/'],
shock:['PubMed','休克指数 Shock Index','https://pubmed.ncbi.nlm.nih.gov/26721174/'],
qtc:['PubMed','QTc · Bazett / Fridericia','https://pubmed.ncbi.nlm.nih.gov/8195512/'],
chads:['AHA/ACC','CHA₂DS₂-VASc','https://professional.heart.org/en/science-news/2023-acc-aha-accp-hrs-guideline-for-the-diagnosis-and-management-of-atrial-fibrillation'],
rcri:['ACC/AHA','Revised Cardiac Risk Index','https://www.acc.org/latest-in-cardiology/ten-points-to-remember/2024/09/23/04/15/2024-aha-acc-perioperative-guideline-gl'],
pf:['Berlin ARDS','PaO₂/FiO₂ 比值','https://pubmed.ncbi.nlm.nih.gov/22797452/'],
aagrad:['NIH','肺泡-动脉氧梯度','https://pubmed.ncbi.nlm.nih.gov/31424737/'],
news2:['RCP','NEWS2','https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/'],
dvt:['NICE NG158','DVT Wells · 2级',NICE],
pe:['NICE NG158','PE Wells · 2级',NICE],
curb65:['NICE NG250','CURB-65','https://www.nice.org.uk/guidance/NG250/chapter/recommendations'],
fib4:['AASLD','FIB-4','https://www.aasld.org/liver-fellow-network/core-series/why-series/why-are-non-invasive-risk-scores-such-fib-4-used'],
apri:['NIH','APRI','https://pmc.ncbi.nlm.nih.gov/articles/PMC3266187/'],
meld3:['HRSA/OPTN','MELD 3.0','https://www.hrsa.gov/optn/data-calculators/allocation-calculators/meld-calculator'],
anc:['NIH','绝对中性粒细胞计数 ANC','https://pmc.ncbi.nlm.nih.gov/articles/PMC6060634/'],
retic:['NIH','校正网织红细胞百分比','https://www.ncbi.nlm.nih.gov/books/NBK499994/'],
pp:['NIH','脉压 Pulse Pressure','https://www.ncbi.nlm.nih.gov/books/NBK482408/'],
ci:['NIH','心脏指数 Cardiac Index','https://www.ncbi.nlm.nih.gov/books/NBK539905/'],
svr:['NIH','系统血管阻力 SVR','https://www.ncbi.nlm.nih.gov/books/NBK556075/'],
cpp:['NIH','脑灌注压 CPP','https://www.ncbi.nlm.nih.gov/books/NBK537271/'],
rox:['PubMed','ROX index','https://pubmed.ncbi.nlm.nih.gov/33039213/'],
rsbi:['NIH','浅快呼吸指数 RSBI','https://www.ncbi.nlm.nih.gov/books/NBK526012/'],
cao2:['NIH','动脉血氧含量 CaO₂','https://www.ncbi.nlm.nih.gov/books/NBK525974/'],
do2:['NIH','氧输送量 DO₂','https://www.ncbi.nlm.nih.gov/books/NBK525974/'],
qsofa:['NIH','qSOFA','https://www.ncbi.nlm.nih.gov/books/NBK621512/'],
sirs:['NIH','SIRS criteria','https://www.ncbi.nlm.nih.gov/books/NBK547669/'],
childpugh:['NCBI','Child-Pugh','https://www.ncbi.nlm.nih.gov/books/NBK224641/'],
maddrey:['NICE/NCBI','Maddrey DF','https://www.ncbi.nlm.nih.gov/books/NBK549995/'],
rpi:['NIH','网织红细胞生成指数 RPI','https://www.ncbi.nlm.nih.gov/books/NBK499994/'],
mentzer:['PubMed','Mentzer index','https://pubmed.ncbi.nlm.nih.gov/26076394/'],
tsat:['NIH','转铁蛋白饱和度','https://www.ncbi.nlm.nih.gov/books/NBK559119/'],
corrca:['NIH','白蛋白校正钙','https://www.ncbi.nlm.nih.gov/books/NBK482128/'],
freewater:['NIH','自由水缺失量','https://www.ncbi.nlm.nih.gov/books/NBK441960/'],
eag:['ADA','A1C → eAG','https://doi.org/10.2337/dc26-s006'],
ldl:['NCBI','Friedewald LDL-C','https://www.ncbi.nlm.nih.gov/books/NBK355892/'],
nonhdl:['NCBI','non-HDL-C','https://www.ncbi.nlm.nih.gov/books/NBK355892/']
};
function f(id,label,extra=''){return '<label class="field">'+label+'<input id="'+id+'" type="number" '+extra+'></label>'}
function sel(id,label,opts){return '<label class="field">'+label+'<select id="'+id+'">'+opts.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select></label>'}
function ck(g,t,v){return '<label class="check"><input type="checkbox" data-g="'+g+'" data-v="'+v+'"><span>'+t+' <b>'+(v>0?'+':'')+v+'</b></span></label>'}
function wrap(inner,note=''){return '<div class="body">'+inner+(note?'<div class="warn">'+note+'</div>':'')+'<div id="res" class="result" hidden></div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div></div>'}
function source(k){const s=SRC[k];return '<div class="cite">来源：<a href="'+s[2]+'" target="_blank" rel="noopener">'+s[0]+' · '+s[1]+' ↗</a></div>'}
function result(h){const r=$('#res');r.hidden=false;r.innerHTML=h}
function score(g){return $$('input[data-g="'+g+'"]:checked').reduce((a,x)=>a+Number(x.dataset.v),0)}
function num(id){return Number($(id).value)}
function allPositive(...ids){return ids.every(id=>Number($(id).value)>0)}
function finish(k,html){return html.replace('</div>','</div>'+source(k))}
function openTool(k){const t=SRC[k];if(!t)return;$('#deyebrow').textContent=t[0];$('#dtitle').textContent=t[1];$('#dbody').innerHTML=body(k);$('#dlg').showModal();bind(k)}
function body(k){
 const grid=x=>'<div class="formgrid">'+x+'</div>';
 if(k==='bmi')return finish(k,wrap(grid(f('h','身高（cm）','step=".1"')+f('w','体重（kg）','step=".1"'))));
 if(k==='bsa')return finish(k,wrap(grid(f('h','身高（cm）','step=".1"')+f('w','体重（kg）','step=".1"'))));
 if(k==='ibw')return finish(k,wrap(grid(f('h','身高（cm）','step=".1"')+sel('sex','性别',[['m','男'],['f','女']])),'Devine 公式最初用于药物剂量相关体重估算；并非所有临床场景都应使用理想体重。'));
 if(k==='pbw')return finish(k,wrap(grid(f('h','身高（cm）','step=".1"')+sel('sex','性别',[['m','男'],['f','女']])),'输出 ARDSNet 预测体重及 4、6、8 mL/kg 的潮气量参考；实际通气设置需结合病情和平台压。'));
 if(k==='egfr')return finish(k,wrap(grid(f('age','年龄（岁）','min="18"')+sel('sex','性别',[['m','男'],['f','女']])+f('cr','血清肌酐','step=".1"')+sel('unit','肌酐单位',[['u','μmol/L'],['m','mg/dL']])),'适用于≥18岁成人；18–25岁可同时参考 CKiD U25。'));
 if(k==='egfrcc')return finish(k,wrap(grid(f('age','年龄（岁）','min="18"')+sel('sex','性别',[['m','男'],['f','女']])+f('cr','血清肌酐（mg/dL）','step=".01"')+f('cys','胱抑素C（mg/L）','step=".01"')),'NIDDK指出在接近关键临床决策阈值时，肌酐+胱抑素C联合方程通常更准确。'));
 if(k==='ckidu25')return finish(k,wrap(grid(f('age','年龄（岁）','min="1" max="25" step=".1"')+sel('sex','性别',[['m','男'],['f','女']])+f('h','身高（cm）','step=".1"')+f('cr','血清肌酐（mg/dL）','step=".01"')),'适用于1–25岁；主要用于儿童、青少年和青年CKD人群。'));
 if(k==='ckidbed')return finish(k,wrap(grid(f('h','身高（cm）','step=".1"')+f('cr','血清肌酐（mg/dL）','step=".01"')),'2009 CKiD bedside 为较旧的儿童快速估算式；NIDDK目前更推荐 CKiD U25。'));
 if(k==='crcl')return finish(k,wrap(grid(f('age','年龄（岁）','min="18"')+sel('sex','性别',[['m','男'],['f','女']])+f('w','体重（kg）','step=".1"')+f('cr','血清肌酐（mg/dL）','step=".01"')),'Cockcroft–Gault 的体重选择在肥胖、消瘦及水肿患者中需结合药品说明书和药师/专科建议。'));
 if(k==='fena')return finish(k,wrap(grid(f('una','尿钠')+f('sna','血钠')+f('ucr','尿肌酐')+f('scr','血肌酐')),'尿钠与血钠单位应一致，尿肌酐与血肌酐单位应一致；需尽量使用同步采样。'));
 if(k==='feurea')return finish(k,wrap(grid(f('uu','尿尿素/尿BUN')+f('su','血尿素/血BUN')+f('ucr','尿肌酐')+f('scr','血肌酐')),'尿/血尿素应使用一致单位，尿/血肌酐应使用一致单位；利尿剂使用时常比 FeNa 更有参考价值，但不能单独诊断AKI病因。'));
 if(k==='ag')return finish(k,wrap(grid(f('na','Na⁺（mmol/L）')+f('cl','Cl⁻（mmol/L）')+f('hco3','HCO₃⁻（mmol/L）'))));
 if(k==='corrag')return finish(k,wrap(grid(f('na','Na⁺（mmol/L）')+f('cl','Cl⁻（mmol/L）')+f('hco3','HCO₃⁻（mmol/L）')+f('alb','白蛋白（g/dL）','step=".1"')),'采用常见校正式：校正AG = AG + 2.5 × (4.0 − 白蛋白)。不同实验室参考范围需分别解释。'));
 if(k==='osm')return finish(k,wrap(grid(f('na','Na⁺（mmol/L）')+f('glu','葡萄糖（mg/dL）')+f('bun','BUN（mg/dL）'))));
 if(k==='osmgap')return finish(k,wrap(grid(f('na','Na⁺（mmol/L）')+f('glu','葡萄糖（mg/dL）')+f('bun','BUN（mg/dL）')+f('meas','实测血清渗透压（mOsm/kg）')),'渗透压间隙受乙醇、造影剂等多种因素影响，不能单独诊断毒物摄入。'));
 if(k==='corrna')return finish(k,wrap(grid(f('na','实测Na⁺（mmol/L）')+f('glu','葡萄糖（mg/dL）')),'使用 1.6 mmol/L / 每100 mg/dL血糖高于100的传统Katz校正；极端高血糖时不同校正系数可能产生差异。'));
 if(k==='winter')return finish(k,wrap(grid(f('hco3','HCO₃⁻（mmol/L）')),'适用于原发代谢性酸中毒的呼吸代偿评估。'));
 if(k==='deltaratio')return finish(k,wrap(grid(f('agv','实测阴离子间隙')+f('hco3','HCO₃⁻（mmol/L）')),'采用常用基线 AG=12、HCO₃⁻=24。需结合本实验室正常范围。'));
 if(k==='map')return finish(k,wrap(grid(f('sbp','收缩压 SBP（mmHg）')+f('dbp','舒张压 DBP（mmHg）'))));
 if(k==='shock')return finish(k,wrap(grid(f('hr','心率（次/分）')+f('sbp','收缩压 SBP（mmHg）')),'休克指数必须结合年龄、基础心率、药物和具体病因解释。'));
 if(k==='qtc')return finish(k,wrap(grid(f('qt','QT（ms）')+f('hr','心率（次/分）')),'同时显示 Bazett 与 Fridericia；心率极端时不同校正公式差异可明显。'));
 if(k==='chads')return finish(k,wrap(grid(f('age','年龄（岁）')+sel('sex','性别',[['m','男'],['f','女']]))+'<div class="checks span-all">'+ck('c','充血性心衰/LV功能不全',1)+ck('c','高血压',1)+ck('c','糖尿病',1)+ck('c','既往卒中/TIA/血栓栓塞',2)+ck('c','血管疾病（MI/PAD/主动脉斑块等）',1)+'</div>','评分用于风险分层；抗凝决策应依据当前房颤指南、出血风险和共同决策，不以单一总分机械决定。'));
 if(k==='rcri')return finish(k,wrap('<div class="checks">'+ck('r','缺血性心脏病史/证据',1)+ck('r','脑血管疾病史',1)+ck('r','心力衰竭史/证据',1)+ck('r','糖尿病需要胰岛素治疗',1)+ck('r','血清肌酐 ≥2.0 mg/dL（约177 μmol/L）',1)+ck('r','高风险手术：腹腔内、胸腔内或血管手术',1)+'</div>','RCRI用于风险估计，不应单独决定是否手术或是否进行负荷试验。'));
 if(k==='pf')return finish(k,wrap(grid(f('pao2','PaO₂（mmHg）')+f('fio2','FiO₂（%）','min="21" max="100"')),'Berlin ARDS 分级还要求时间、影像、肺水肿来源及 PEEP/CPAP 等条件，P/F 比值不能单独诊断 ARDS。'));
 if(k==='aagrad')return finish(k,wrap(grid(f('pao2','PaO₂（mmHg）')+f('paco2','PaCO₂（mmHg）')+f('fio2','FiO₂（%）','min="21" max="100"')+f('patm','大气压 Patm（mmHg）','value="760"')+f('rq','呼吸商 RQ','value="0.8" step=".05"')),'肺泡水蒸气压按37℃时47 mmHg。高海拔环境应修改大气压。'));
 if(k==='news2')return finish(k,wrap(grid(f('rr','呼吸频率（/min）')+f('spo2','SpO₂（%）')+sel('scale','SpO₂量表',[['1','Scale 1'],['2','Scale 2（仅已确认高碳酸血症呼吸衰竭）']])+sel('o2','吸氧',[['0','否/空气'],['1','是/补充氧']])+f('sbp','收缩压（mmHg）')+f('pulse','脉搏（/min）')+f('temp','体温（℃）','step=".1"')+sel('con','意识',[['0','清醒 Alert'],['3','新发意识混乱 / C / V / P / U']])),'Scale 2 仅在有明确临床指征并记录目标SpO₂ 88–92%时使用；补充氧按NEWS2再加2分。'));
 if(k==='dvt')return finish(k,wrap('<div class="checks">'+ck('d','活动性肿瘤（正在治疗、6个月内治疗或姑息）',1)+ck('d','下肢瘫痪/轻瘫，或近期石膏固定',1)+ck('d','卧床≥3天，或12周内需全麻/区域麻醉的大手术',1)+ck('d','沿深静脉走行的局部压痛',1)+ck('d','整条患肢肿胀',1)+ck('d','小腿周径较无症状侧大≥3cm',1)+ck('d','凹陷性水肿局限于有症状下肢',1)+ck('d','侧支浅静脉（非静脉曲张）',1)+ck('d','既往明确 DVT',1)+ck('d','其他诊断至少与 DVT 同样可能',-2)+'</div>'));
 if(k==='pe')return finish(k,wrap('<div class="checks">'+ck('p','DVT 临床症状和体征',3)+ck('p','其他诊断不如 PE 可能',3)+ck('p','心率 >100 次/分',1.5)+ck('p','制动 >3天或4周内手术',1.5)+ck('p','既往 DVT / PE',1.5)+ck('p','咯血',1)+ck('p','恶性肿瘤（正在治疗、6个月内治疗或姑息）',1)+'</div>'));
 if(k==='curb65')return finish(k,wrap(grid(f('age','年龄（岁）')+f('urea','尿素（mmol/L）','step=".1"')+f('rr','呼吸频率（/min）')+f('sbp','收缩压（mmHg）')+f('dbp','舒张压（mmHg）'))+'<div class="checks span-all">'+ck('u','新发意识混乱/定向障碍',1)+'</div>','用于成人社区获得性肺炎住院风险分层，仍需结合临床判断及其他严重征象。'));
 if(k==='fib4')return finish(k,wrap(grid(f('age','年龄（岁）')+f('ast','AST（U/L）')+f('alt','ALT（U/L）')+f('plt','血小板（×10⁹/L）')),'不同肝病人群和年龄层的阈值不同；AASLD强调FIB-4用于初筛和决定是否需进一步无创检测。'));
 if(k==='apri')return finish(k,wrap(grid(f('ast','AST（U/L）')+f('uln','AST实验室正常上限 ULN（U/L）','value="40"')+f('plt','血小板（×10⁹/L）')),'必须输入本实验室AST正常上限，不能固定假设所有实验室均为40 U/L。'));
 if(k==='meld3')return finish(k,wrap(grid(sel('sex','性别',[['m','男'],['f','女']])+f('bili','总胆红素（mg/dL）','step=".01"')+f('na','血钠（mEq/L）','step=".1"')+f('inr','INR','step=".01"')+f('alb','白蛋白（g/dL）','step=".1"')+f('cr','肌酐（mg/dL）','step=".01"')+sel('dial','近7天透析≥2次或CVVHD≥24h',[['0','否'],['1','是']])),'本站按公开MELD 3.0方程显示估算值。正式移植分配必须以HRSA/OPTN系统及当期政策为准。'));
 if(k==='anc')return finish(k,wrap(grid(f('wbc','WBC（×10⁹/L）','step=".01"')+f('neut','中性粒细胞（%）','step=".1"')+f('band','杆状核（%）','value="0" step=".1"'))));
 if(k==='retic')return finish(k,wrap(grid(f('retic','网织红细胞（%）','step=".1"')+f('hct','患者Hct（%）','step=".1"')+f('refhct','参考Hct（%）','value="45" step=".1"')),'校正网织红细胞百分比不是RPI；RPI还需根据贫血程度考虑网织红细胞成熟时间。'));

 if(k==='pp')return finish(k,wrap(grid(f('sbp','收缩压 SBP（mmHg）')+f('dbp','舒张压 DBP（mmHg）'))));
 if(k==='ci')return finish(k,wrap(grid(f('co','心排量 CO（L/min）','step=".01"')+f('bsa','体表面积 BSA（m²）','step=".01"'))));
 if(k==='svr')return finish(k,wrap(grid(f('mapv','MAP（mmHg）','step=".1"')+f('cvp','CVP（mmHg）','step=".1"')+f('co','心排量 CO（L/min）','step=".01"')),'SVR计算依赖同时、可靠的压力和心排量测量。'));
 if(k==='cpp')return finish(k,wrap(grid(f('mapv','MAP（mmHg）','step=".1"')+f('icp','ICP（mmHg）','step=".1"')),'MAP与ICP应尽量为同期可靠测量；目标CPP需结合具体神经重症情境。'));
 if(k==='rox')return finish(k,wrap(grid(f('spo2','SpO₂（%）','step=".1"')+f('fio2','FiO₂（%）','min="21" max="100" step=".1"')+f('rr','呼吸频率（/min）','step=".1"')),'ROX主要用于HFNC患者的趋势和风险辅助判断，不应以单次值替代临床评估。'));
 if(k==='rsbi')return finish(k,wrap(grid(f('rr','呼吸频率（/min）','step=".1"')+f('vt','潮气量 VT（mL）','step="1"')),'RSBI = f/VT(L)。脱机判断还需综合气体交换、呼吸肌力、意识和血流动力学。'));
 if(k==='cao2')return finish(k,wrap(grid(f('hb','Hb（g/dL）','step=".1"')+f('sao2','SaO₂（%）','step=".1"')+f('pao2','PaO₂（mmHg）','step=".1"'))));
 if(k==='do2')return finish(k,wrap(grid(f('co','心排量 CO（L/min）','step=".01"')+f('hb','Hb（g/dL）','step=".1"')+f('sao2','SaO₂（%）','step=".1"')+f('pao2','PaO₂（mmHg）','step=".1"')),'DO₂为估算值，取决于心排量和动脉血氧含量。'));
 if(k==='qsofa')return finish(k,wrap(grid(f('rr','呼吸频率（/min）')+f('sbp','收缩压（mmHg）'))+'<div class="checks span-all">'+ck('q','意识状态改变 / GCS <15',1)+'</div>','qSOFA用于感染患者床旁风险提示，不等同于脓毒症诊断。'));
 if(k==='sirs')return finish(k,wrap(grid(f('temp','体温（℃）','step=".1"')+f('hr','心率（/min）')+f('rr','呼吸频率（/min）')+f('paco2','PaCO₂（mmHg，可留空）','step=".1"')+f('wbc','WBC（×10⁹/L）','step=".1"')+f('band','未成熟杆状核（%，可留空）','step=".1"')),'SIRS敏感但不特异，不等同于感染或脓毒症诊断。'));
 if(k==='childpugh')return finish(k,wrap(grid(f('bili','总胆红素（mg/dL）','step=".1"')+f('alb','白蛋白（g/dL）','step=".1"')+f('inr','INR','step=".01"')+sel('ascites','腹水',[['1','无'],['2','轻度/利尿剂可控制'],['3','中重度/难控制']])+sel('enceph','肝性脑病',[['1','无'],['2','I–II级'],['3','III–IV级']])),'常规非胆汁淤积性肝病阈值；胆汁淤积性肝病胆红素分档可不同。'));
 if(k==='maddrey')return finish(k,wrap(grid(f('pt','患者PT（秒）','step=".1"')+f('controlpt','对照PT（秒）','step=".1"')+f('bili','总胆红素（mg/dL）','step=".1"')),'Maddrey DF用于酒精相关肝炎严重度辅助评估；治疗决策还需结合感染、出血、肾功能等。'));
 if(k==='rpi')return finish(k,wrap(grid(f('retic','网织红细胞（%）','step=".1"')+f('hct','患者Hct（%）','step=".1"')+f('refhct','参考Hct（%）','value="45" step=".1"')+sel('maturation','成熟因子',[['1','1.0（Hct约45%）'],['1.5','1.5（Hct约35%）'],['2','2.0（Hct约25%）'],['2.5','2.5（Hct约15%）']])),'RPI = 校正网织红细胞% / 成熟因子。参考Hct及成熟因子应结合患者性别与贫血程度。'));
 if(k==='mentzer')return finish(k,wrap(grid(f('mcv','MCV（fL）','step=".1"')+f('rbc','RBC（×10¹²/L）','step=".01"')),'Mentzer指数仅用于小细胞性贫血的初步鉴别辅助，不能替代铁蛋白、血红蛋白电泳/基因检测。'));
 if(k==='tsat')return finish(k,wrap(grid(f('iron','血清铁（μg/dL）','step=".1"')+f('tibc','TIBC（μg/dL）','step=".1"'))));
 if(k==='corrca')return finish(k,wrap(grid(f('ca','总钙（mg/dL）','step=".01"')+f('alb','白蛋白（g/dL）','step=".1"')),'校正钙仅为粗略估算；危重、CKD或明显酸碱紊乱时应优先直接测离子钙。'));
 if(k==='freewater')return finish(k,wrap(grid(sel('sex','性别',[['m','男'],['f','女']])+f('w','体重（kg）','step=".1"')+f('na','血钠（mmol/L）','step=".1"')),'采用TBW≈0.6×体重（男）或0.5×体重（女）；高龄、肥胖、容量状态异常时系数可能需要调整。自由水缺失仅是初始估算，纠钠速度必须动态监测。'));
 if(k==='eag')return finish(k,wrap(grid(f('a1c','HbA1c（%）','step=".1"')),'eAG是群体回归估计，个体CGM/指尖血糖与A1C可能不完全一致。'));
 if(k==='ldl')return finish(k,wrap(grid(f('tc','总胆固醇 TC（mg/dL）','step=".1"')+f('hdl','HDL-C（mg/dL）','step=".1"')+f('tg','甘油三酯 TG（mg/dL）','step=".1"')),'Friedewald公式在TG≥400 mg/dL时不可靠，非空腹、高TG和极低LDL时也可能偏差明显。'));
 if(k==='nonhdl')return finish(k,wrap(grid(f('tc','总胆固醇 TC（mg/dL）','step=".1"')+f('hdl','HDL-C（mg/dL）','step=".1"'))));
 return '<div class="body">该工具暂不可用。</div>';
}
function newsScore(){
 const rr=num('#rr'),sp=num('#spo2'),scale=$('#scale').value,onO2=$('#o2').value==='1',sbp=num('#sbp'),p=num('#pulse'),t=num('#temp');
 if(!(rr>0&&sp>0&&sbp>0&&p>0&&t>0))return null;
 let s=rr<=8?3:rr<=11?1:rr<=20?0:rr<=24?2:3;
 if(scale==='1')s+=sp<=91?3:sp<=93?2:sp<=95?1:0;
 else{
   if(sp<=83)s+=3;else if(sp<=85)s+=2;else if(sp<=87)s+=1;else if(!onO2)s+=0;else if(sp<=92)s+=0;else if(sp<=94)s+=1;else if(sp<=96)s+=2;else s+=3;
 }
 if(onO2)s+=2;
 s+=sbp<=90?3:sbp<=100?2:sbp<=110?1:sbp<=219?0:3;
 s+=p<=40?3:p<=50?1:p<=90?0:p<=110?1:p<=130?2:3;
 s+=t<=35?3:t<=36?1:t<=38?0:t<=39?1:2;
 s+=num('#con');
 return s;
}
function bind(k){
 const clear=$('#clear');if(clear)clear.onclick=()=>{$$('#dlg input').forEach(x=>{if(x.type==='checkbox')x.checked=false;else if(!x.hasAttribute('value'))x.value=''});const r=$('#res');if(r){r.hidden=true;r.innerHTML=''}};
 const go=$('#go');if(!go)return;
 if(k==='bmi')go.onclick=()=>{if(!allPositive('#h','#w'))return result('<strong>请完整输入</strong>');const v=num('#w')/Math.pow(num('#h')/100,2),c=v<18.5?'偏低':v<25?'健康体重':v<30?'超重':v<35?'肥胖 I 级':v<40?'肥胖 II 级':'肥胖 III 级';result('<strong>'+v.toFixed(1)+' kg/m²</strong><span>CDC成人分类：'+c+'。BMI是筛查指标。</span>')};
 else if(k==='bsa')go.onclick=()=>{if(!allPositive('#h','#w'))return result('<strong>请完整输入</strong>');const v=Math.sqrt(num('#h')*num('#w')/3600);result('<strong>'+v.toFixed(3)+' m²</strong><span>Mosteller：BSA = √(身高cm × 体重kg / 3600)。</span>')};
 else if(k==='ibw')go.onclick=()=>{if(!allPositive('#h'))return result('<strong>请输入身高</strong>');const inch=num('#h')/2.54,base=$('#sex').value==='f'?45.5:50,v=base+2.3*(inch-60);result('<strong>'+v.toFixed(1)+' kg</strong><span>Devine理想体重估算。</span>')};
 else if(k==='pbw')go.onclick=()=>{if(!allPositive('#h'))return result('<strong>请输入身高</strong>');const v=($('#sex').value==='f'?45.5:50)+0.91*(num('#h')-152.4);result('<strong>PBW '+v.toFixed(1)+' kg</strong><span>潮气量：4 mL/kg ≈ '+(4*v).toFixed(0)+' mL；6 mL/kg ≈ '+(6*v).toFixed(0)+' mL；8 mL/kg ≈ '+(8*v).toFixed(0)+' mL。</span>')};
 else if(k==='egfr')go.onclick=()=>{const a=num('#age'),c0=num('#cr');if(!(a>=18&&c0>0))return result('<strong>请检查输入</strong>');const c=$('#unit').value==='u'?c0/88.4:c0,fem=$('#sex').value==='f',K=fem?.7:.9,A=fem?-.241:-.302,r=c/K,e=142*Math.pow(Math.min(r,1),A)*Math.pow(Math.max(r,1),-1.2)*Math.pow(.9938,a)*(fem?1.012:1);result('<strong>'+e.toFixed(1)+' mL/min/1.73m²</strong><span>2021 CKD-EPI creatinine equation。</span>')};
 else if(k==='egfrcc')go.onclick=()=>{const a=num('#age'),cr=num('#cr'),cy=num('#cys');if(!(a>=18&&cr>0&&cy>0))return result('<strong>请检查输入</strong>');const fem=$('#sex').value==='f',K=fem?.7:.9,A=fem?-.219:-.144,rr=cr/K,rc=cy/.8,e=135*Math.pow(Math.min(rr,1),A)*Math.pow(Math.max(rr,1),-.544)*Math.pow(Math.min(rc,1),-.323)*Math.pow(Math.max(rc,1),-.778)*Math.pow(.9961,a)*(fem?.963:1);result('<strong>'+e.toFixed(1)+' mL/min/1.73m²</strong><span>2021 CKD-EPI creatinine-cystatin C equation。</span>')};
 else if(k==='ckidu25')go.onclick=()=>{const a=num('#age'),h=num('#h')/100,cr=num('#cr');if(!(a>=1&&a<=25&&h>0&&cr>0))return result('<strong>请检查输入</strong>');const fem=$('#sex').value==='f';let K;if(a<12)K=(fem?36.1:39)*Math.pow(1.008,a-12);else if(a<18)K=(fem?36.1*Math.pow(1.023,a-12):39*Math.pow(1.045,a-12));else K=fem?41.4:50.8;const e=K*h/cr;result('<strong>'+e.toFixed(1)+' mL/min/1.73m²</strong><span>CKiD U25 creatinine equation。</span>')};
 else if(k==='ckidbed')go.onclick=()=>{const h=num('#h')/100,cr=num('#cr');if(!(h>0&&cr>0))return result('<strong>请检查输入</strong>');const e=41.3*h/cr;result('<strong>'+e.toFixed(1)+' mL/min/1.73m²</strong><span>2009 CKiD bedside equation。</span>')};
 else if(k==='crcl')go.onclick=()=>{const a=num('#age'),w=num('#w'),cr=num('#cr');if(!(a>0&&w>0&&cr>0))return result('<strong>请检查输入</strong>');let e=(140-a)*w/(72*cr);if($('#sex').value==='f')e*=.85;result('<strong>'+e.toFixed(1)+' mL/min</strong><span>Cockcroft–Gault估算肌酐清除率。</span>')};
 else if(k==='fena')go.onclick=()=>{if(!allPositive('#una','#sna','#ucr','#scr'))return result('<strong>请完整输入</strong>');const e=num('#una')*num('#scr')/(num('#sna')*num('#ucr'))*100;result('<strong>'+e.toFixed(2)+'%</strong><span>FeNa = (UNa × SCr)/(SNa × UCr) ×100%。</span>')};
 else if(k==='feurea')go.onclick=()=>{if(!allPositive('#uu','#su','#ucr','#scr'))return result('<strong>请完整输入</strong>');const e=num('#uu')*num('#scr')/(num('#su')*num('#ucr'))*100;result('<strong>'+e.toFixed(1)+'%</strong><span>FeUrea = (Uurea × SCr)/(Surea × UCr) ×100%。</span>')};
 else if(k==='ag')go.onclick=()=>{if(!allPositive('#na','#cl','#hco3'))return result('<strong>请完整输入</strong>');const e=num('#na')-num('#cl')-num('#hco3');result('<strong>'+e.toFixed(1)+' mEq/L</strong><span>AG = Na − (Cl + HCO₃⁻)。</span>')};
 else if(k==='corrag')go.onclick=()=>{if(!allPositive('#na','#cl','#hco3','#alb'))return result('<strong>请完整输入</strong>');const ag=num('#na')-num('#cl')-num('#hco3'),e=ag+2.5*(4-num('#alb'));result('<strong>'+e.toFixed(1)+' mEq/L</strong><span>原始AG '+ag.toFixed(1)+'；校正AG = AG + 2.5×(4−Alb)。</span>')};
 else if(k==='osm')go.onclick=()=>{if(!allPositive('#na','#glu','#bun'))return result('<strong>请完整输入</strong>');const e=2*num('#na')+num('#glu')/18+num('#bun')/2.8;result('<strong>'+e.toFixed(1)+' mOsm/kg</strong><span>计算血清渗透压。</span>')};
 else if(k==='osmgap')go.onclick=()=>{if(!allPositive('#na','#glu','#bun','#meas'))return result('<strong>请完整输入</strong>');const calc=2*num('#na')+num('#glu')/18+num('#bun')/2.8,e=num('#meas')-calc;result('<strong>'+e.toFixed(1)+' mOsm/kg</strong><span>计算渗透压 '+calc.toFixed(1)+'；渗透压间隙 = 实测 − 计算。</span>')};
 else if(k==='corrna')go.onclick=()=>{if(!allPositive('#na','#glu'))return result('<strong>请完整输入</strong>');const g=num('#glu'),e=num('#na')+1.6*Math.max(0,g-100)/100;result('<strong>'+e.toFixed(1)+' mmol/L</strong><span>按血糖每高于100 mg/dL的100 mg/dL增加1.6 mmol/L校正。</span>')};
 else if(k==='winter')go.onclick=()=>{if(!allPositive('#hco3'))return result('<strong>请输入HCO₃⁻</strong>');const e=1.5*num('#hco3')+8;result('<strong>'+e.toFixed(1)+' mmHg</strong><span>预计PaCO₂范围 '+(e-2).toFixed(1)+'–'+(e+2).toFixed(1)+' mmHg。</span>')};
 else if(k==='deltaratio')go.onclick=()=>{const ag=num('#agv'),b=num('#hco3');if(!(ag>0&&b>0&&b<24))return result('<strong>请检查输入</strong><span>HCO₃⁻需低于24才能按该常用式计算。</span>');const e=(ag-12)/(24-b);result('<strong>'+e.toFixed(2)+'</strong><span>&lt;1常提示合并正常AG代谢性酸中毒；约1–2较符合单纯HAGMA；&gt;2考虑合并代谢性碱中毒/既往高HCO₃⁻，仅作辅助。</span>')};
 else if(k==='map')go.onclick=()=>{if(!allPositive('#sbp','#dbp'))return result('<strong>请完整输入</strong>');const e=(num('#sbp')+2*num('#dbp'))/3;result('<strong>'+e.toFixed(1)+' mmHg</strong><span>MAP ≈ (SBP + 2×DBP)/3。</span>')};
 else if(k==='shock')go.onclick=()=>{if(!allPositive('#hr','#sbp'))return result('<strong>请完整输入</strong>');const e=num('#hr')/num('#sbp');result('<strong>'+e.toFixed(2)+'</strong><span>Shock Index = HR / SBP。</span>')};
 else if(k==='qtc')go.onclick=()=>{if(!allPositive('#qt','#hr'))return result('<strong>请完整输入</strong>');const rr=60/num('#hr'),qt=num('#qt')/1000,b=qt/Math.sqrt(rr)*1000,f=qt/Math.cbrt(rr)*1000;result('<strong>Bazett '+b.toFixed(0)+' ms</strong><span>Fridericia '+f.toFixed(0)+' ms；RR '+rr.toFixed(3)+' s。</span>')};
 else if(k==='chads')go.onclick=()=>{const a=num('#age');if(!(a>0))return result('<strong>请输入年龄</strong>');let s=score('c');if(a>=75)s+=2;else if(a>=65)s+=1;if($('#sex').value==='f')s+=1;result('<strong>CHA₂DS₂-VASc '+s+' 分</strong><span>年龄和性别已自动计分；其余风险项按勾选计分。</span>')};
 else if(k==='rcri')go.onclick=()=>{const s=score('r');result('<strong>RCRI '+s+' 分</strong><span>共 '+s+' 项风险变量。结合手术类型、功能状态及活动性心血管疾病解释。</span>')};
 else if(k==='pf')go.onclick=()=>{if(!allPositive('#pao2','#fio2'))return result('<strong>请完整输入</strong>');const e=num('#pao2')/(num('#fio2')/100);result('<strong>'+e.toFixed(0)+' mmHg</strong><span>PaO₂/FiO₂ = '+e.toFixed(0)+'。Berlin ARDS严重度阈值需在满足完整ARDS定义条件时使用。</span>')};
 else if(k==='aagrad')go.onclick=()=>{if(!allPositive('#pao2','#paco2','#fio2','#patm','#rq'))return result('<strong>请完整输入</strong>');const pa=(num('#patm')-47)*(num('#fio2')/100)-num('#paco2')/num('#rq'),e=pa-num('#pao2');result('<strong>'+e.toFixed(1)+' mmHg</strong><span>估算PAO₂ '+pa.toFixed(1)+' mmHg；A–a = PAO₂ − PaO₂。</span>')};
 else if(k==='news2')go.onclick=()=>{const s=newsScore();if(s===null)return result('<strong>请完整输入</strong>');const band=s>=7?'高风险':s>=5?'中风险':s>=1?'低风险':'低风险';result('<strong>NEWS2 '+s+' 分</strong><span>'+band+'。任何单项3分也具有临床升级意义，具体响应按本机构流程。</span>')};
 else if(k==='dvt')go.onclick=()=>{const s=score('d');result('<strong>'+s+' 分 · '+(s>=2?'DVT likely':'DVT unlikely')+'</strong><span>NICE：≥2分 likely；≤1分 unlikely。</span>')};
 else if(k==='pe')go.onclick=()=>{const s=score('p');result('<strong>'+s+' 分 · '+(s>4?'PE likely':'PE unlikely')+'</strong><span>NICE：>4分 likely；≤4分 unlikely。</span>')};
 else if(k==='curb65')go.onclick=()=>{if(!allPositive('#age','#urea','#rr','#sbp','#dbp'))return result('<strong>请完整输入</strong>');let s=score('u');if(num('#urea')>7)s++;if(num('#rr')>=30)s++;if(num('#sbp')<90||num('#dbp')<=60)s++;if(num('#age')>=65)s++;const band=s<=1?'低风险':s===2?'中风险':'高风险';result('<strong>CURB-65 '+s+' 分</strong><span>'+band+'。NICE住院成人：0–1低风险，2中风险，3–5高风险。</span>')};
 else if(k==='fib4')go.onclick=()=>{if(!allPositive('#age','#ast','#alt','#plt'))return result('<strong>请完整输入</strong>');const e=num('#age')*num('#ast')/(num('#plt')*Math.sqrt(num('#alt')));result('<strong>'+e.toFixed(2)+'</strong><span>FIB-4 = 年龄×AST / (血小板×√ALT)。阈值需按肝病病因和年龄解释。</span>')};
 else if(k==='apri')go.onclick=()=>{if(!allPositive('#ast','#uln','#plt'))return result('<strong>请完整输入</strong>');const e=(num('#ast')/num('#uln'))/num('#plt')*100;result('<strong>'+e.toFixed(2)+'</strong><span>APRI = (AST/ULN)/血小板 ×100。</span>')};
 else if(k==='meld3')go.onclick=()=>{if(!allPositive('#bili','#na','#inr','#alb','#cr'))return result('<strong>请完整输入</strong>');let b=Math.max(1,num('#bili')),n=Math.min(137,Math.max(125,num('#na'))),i=Math.max(1,num('#inr')),a=Math.min(3.5,Math.max(1.5,num('#alb'))),c=$('#dial').value==='1'?3:Math.min(3,Math.max(1,num('#cr')));let m=($('#sex').value==='f'?1.33:0)+4.56*Math.log(b)+.82*(137-n)-.24*(137-n)*Math.log(b)+9.09*Math.log(i)+11.14*Math.log(c)+1.85*(3.5-a)-1.83*(3.5-a)*Math.log(c)+6;m=Math.max(6,Math.min(40,Math.round(m)));result('<strong>MELD 3.0 = '+m+'</strong><span>已按公开规则限制：胆红素/INR/肌酐下限1；Na 125–137；Alb 1.5–3.5；肌酐上限3或满足透析条件取3。正式分配以OPTN系统为准。</span>')};
 else if(k==='anc')go.onclick=()=>{const w=num('#wbc'),n=num('#neut'),b=num('#band');if(!(w>0&&n>=0&&b>=0))return result('<strong>请检查输入</strong>');const e=w*1000*(n+b)/100;result('<strong>'+e.toFixed(0)+' /µL</strong><span>等于 '+(e/1000).toFixed(3)+' ×10⁹/L。ANC = WBC × (中性粒细胞% + 杆状核%)/100。</span>')};
 else if(k==='retic')go.onclick=()=>{if(!allPositive('#retic','#hct','#refhct'))return result('<strong>请完整输入</strong>');const e=num('#retic')*num('#hct')/num('#refhct');result('<strong>'+e.toFixed(2)+'%</strong><span>校正网织红细胞% = Retic% × 患者Hct / 参考Hct。</span>')};

 else if(k==='pp')go.onclick=()=>{if(!allPositive('#sbp','#dbp'))return result('<strong>请完整输入</strong>');const e=num('#sbp')-num('#dbp');result('<strong>'+e.toFixed(1)+' mmHg</strong><span>Pulse Pressure = SBP − DBP。</span>')};
 else if(k==='ci')go.onclick=()=>{if(!allPositive('#co','#bsa'))return result('<strong>请完整输入</strong>');const e=num('#co')/num('#bsa');result('<strong>'+e.toFixed(2)+' L/min/m²</strong><span>Cardiac Index = CO / BSA。</span>')};
 else if(k==='svr')go.onclick=()=>{if(!allPositive('#mapv','#co')||num('#cvp')<0)return result('<strong>请检查输入</strong>');const e=80*(num('#mapv')-num('#cvp'))/num('#co');result('<strong>'+e.toFixed(0)+' dyn·s/cm⁵</strong><span>SVR = 80 × (MAP − CVP) / CO。</span>')};
 else if(k==='cpp')go.onclick=()=>{if(!allPositive('#mapv')||num('#icp')<0)return result('<strong>请检查输入</strong>');const e=num('#mapv')-num('#icp');result('<strong>'+e.toFixed(1)+' mmHg</strong><span>CPP = MAP − ICP。</span>')};
 else if(k==='rox')go.onclick=()=>{if(!allPositive('#spo2','#fio2','#rr'))return result('<strong>请完整输入</strong>');const e=(num('#spo2')/(num('#fio2')/100))/num('#rr');result('<strong>'+e.toFixed(2)+'</strong><span>ROX = (SpO₂/FiO₂) / RR。</span>')};
 else if(k==='rsbi')go.onclick=()=>{if(!allPositive('#rr','#vt'))return result('<strong>请完整输入</strong>');const e=num('#rr')/(num('#vt')/1000);result('<strong>'+e.toFixed(1)+' breaths/min/L</strong><span>RSBI = respiratory rate / tidal volume(L)。</span>')};
 else if(k==='cao2')go.onclick=()=>{if(!allPositive('#hb','#sao2','#pao2'))return result('<strong>请完整输入</strong>');const e=1.34*num('#hb')*(num('#sao2')/100)+.003*num('#pao2');result('<strong>'+e.toFixed(2)+' mL O₂/dL</strong><span>CaO₂ = 1.34×Hb×SaO₂ + 0.003×PaO₂。</span>')};
 else if(k==='do2')go.onclick=()=>{if(!allPositive('#co','#hb','#sao2','#pao2'))return result('<strong>请完整输入</strong>');const ca=1.34*num('#hb')*(num('#sao2')/100)+.003*num('#pao2'),e=num('#co')*ca*10;result('<strong>'+e.toFixed(0)+' mL O₂/min</strong><span>CaO₂ '+ca.toFixed(2)+' mL/dL；DO₂ = CO × CaO₂ ×10。</span>')};
 else if(k==='qsofa')go.onclick=()=>{if(!allPositive('#rr','#sbp'))return result('<strong>请完整输入</strong>');let s=score('q');if(num('#rr')>=22)s++;if(num('#sbp')<=100)s++;result('<strong>qSOFA '+s+' 分</strong><span>RR≥22、SBP≤100、意识改变各1分。仅用于风险提示。</span>')};
 else if(k==='sirs')go.onclick=()=>{if(!allPositive('#temp','#hr','#rr','#wbc'))return result('<strong>请填写体温、心率、呼吸频率和WBC</strong>');let s=0;if(num('#temp')>38||num('#temp')<36)s++;if(num('#hr')>90)s++;if(num('#rr')>20||(num('#paco2')>0&&num('#paco2')<32))s++;if(num('#wbc')>12||num('#wbc')<4||num('#band')>10)s++;result('<strong>SIRS '+s+' 项</strong><span>传统定义通常≥2项；SIRS不等同于感染或脓毒症。</span>')};
 else if(k==='childpugh')go.onclick=()=>{if(!allPositive('#bili','#alb','#inr'))return result('<strong>请完整输入</strong>');let s=0,b=num('#bili'),a=num('#alb'),i=num('#inr');s+=b<2?1:b<=3?2:3;s+=a>3.5?1:a>=2.8?2:3;s+=i<1.7?1:i<=2.3?2:3;s+=num('#ascites')+num('#enceph');const cls=s<=6?'A':s<=9?'B':'C';result('<strong>Child-Pugh '+s+' 分 · '+cls+'级</strong><span>非胆汁淤积性肝病常用分档。</span>')};
 else if(k==='maddrey')go.onclick=()=>{if(!allPositive('#pt','#controlpt','#bili'))return result('<strong>请完整输入</strong>');const e=4.6*(num('#pt')-num('#controlpt'))+num('#bili');result('<strong>Maddrey DF '+e.toFixed(1)+'</strong><span>传统上≥32提示重症酒精相关肝炎，但治疗决策需综合禁忌证和当前指南。</span>')};
 else if(k==='rpi')go.onclick=()=>{if(!allPositive('#retic','#hct','#refhct'))return result('<strong>请完整输入</strong>');const corr=num('#retic')*num('#hct')/num('#refhct'),e=corr/num('#maturation');result('<strong>RPI '+e.toFixed(2)+'</strong><span>校正网织红细胞 '+corr.toFixed(2)+'%；RPI = 校正值 / 成熟因子。</span>')};
 else if(k==='mentzer')go.onclick=()=>{if(!allPositive('#mcv','#rbc'))return result('<strong>请完整输入</strong>');const e=num('#mcv')/num('#rbc');result('<strong>'+e.toFixed(2)+'</strong><span>Mentzer = MCV/RBC。经典经验：<13偏向地中海贫血携带状态，>13偏向缺铁，但诊断不能只依赖该指数。</span>')};
 else if(k==='tsat')go.onclick=()=>{if(!allPositive('#iron','#tibc'))return result('<strong>请完整输入</strong>');const e=num('#iron')/num('#tibc')*100;result('<strong>'+e.toFixed(1)+'%</strong><span>TSAT = serum iron / TIBC ×100%。</span>')};
 else if(k==='corrca')go.onclick=()=>{if(!allPositive('#ca','#alb'))return result('<strong>请完整输入</strong>');const e=num('#ca')+.8*(4-num('#alb'));result('<strong>'+e.toFixed(2)+' mg/dL</strong><span>Corrected Ca = measured Ca + 0.8×(4−albumin)。危重/CKD/酸碱紊乱优先离子钙。</span>')};
 else if(k==='freewater')go.onclick=()=>{if(!allPositive('#w','#na'))return result('<strong>请完整输入</strong>');const tbw=($('#sex').value==='m'?.6:.5)*num('#w'),e=tbw*(num('#na')/140-1);result('<strong>'+e.toFixed(2)+' L</strong><span>TBW≈'+tbw.toFixed(1)+' L；自由水缺失 = TBW×(Na/140−1)。仅作初始估算。</span>')};
 else if(k==='eag')go.onclick=()=>{if(!allPositive('#a1c'))return result('<strong>请输入HbA1c</strong>');const mg=28.7*num('#a1c')-46.7;result('<strong>'+mg.toFixed(0)+' mg/dL</strong><span>约 '+(mg/18).toFixed(1)+' mmol/L；eAG = 28.7×A1C − 46.7。</span>')};
 else if(k==='ldl')go.onclick=()=>{if(!allPositive('#tc','#hdl','#tg'))return result('<strong>请完整输入</strong>');if(num('#tg')>=400)return result('<strong>不建议使用Friedewald</strong><span>TG≥400 mg/dL时公式不可靠，考虑直接LDL-C或其他经验证方法。</span>');const e=num('#tc')-num('#hdl')-num('#tg')/5;result('<strong>'+e.toFixed(1)+' mg/dL</strong><span>LDL-C = TC − HDL-C − TG/5。</span>')};
 else if(k==='nonhdl')go.onclick=()=>{if(!allPositive('#tc','#hdl'))return result('<strong>请完整输入</strong>');const e=num('#tc')-num('#hdl');result('<strong>'+e.toFixed(1)+' mg/dL</strong><span>non-HDL-C = TC − HDL-C。</span>')};
}
$$('.card[data-tool]').forEach(c=>c.addEventListener('click',e=>{if(e.target.closest('a'))return;openTool(c.dataset.tool)}));
$('#close').onclick=()=>$('#dlg').close();
$('#dlg').addEventListener('click',e=>{if(e.target===$('#dlg'))$('#dlg').close()});
const search=$('#formulaSearch'),cards=$$('.card');
function filterCards(){
 const q=(search.value||'').trim().toLowerCase();let visible=0;
 cards.forEach(c=>{const hit=!q||c.textContent.toLowerCase().includes(q);c.hidden=!hit;if(hit)visible++;});
 $$('.section').forEach(s=>{const cs=$$('.card').filter(c=>s.contains(c));if(cs.length)s.hidden=cs.every(c=>c.hidden);});
 $('#formulaCount').textContent=visible+' 个工具';
}
search.addEventListener('input',filterCards);filterCards();
})();
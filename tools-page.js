(function(){
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const D='https://www.nice.org.uk/guidance/ng158/chapter/recommendations';
function ck(g,t,v){return '<label class="check"><input type="checkbox" data-g="'+g+'" data-v="'+v+'"><span>'+t+' <b>'+(v>0?'+':'')+v+'</b></span></label>'}
function src(u,n){return '<div class="cite">官方依据：<a href="'+u+'" target="_blank" rel="noopener">'+n+' ↗</a></div>'}
function result(h){const r=$('#res');r.hidden=false;r.innerHTML=h}
function score(g){return $$('input[data-g="'+g+'"]:checked').reduce((a,x)=>a+Number(x.dataset.v),0)}
function body(k){
if(k==='bmi')return '<div class="body"><div class="formgrid"><label class="field">身高（cm）<input id="h" type="number" step=".1"></label><label class="field">体重（kg）<input id="w" type="number" step=".1"></label></div><div class="actions"><button class="calc" id="go">计算</button><button class="reset" id="clear">清空</button></div><div id="res" class="result" hidden></div>'+src('https://www.cdc.gov/bmi/adult-calculator/index.html','CDC Adult BMI Calculator')+'</div>';
if(k==='egfr')return '<div class="body"><div class="formgrid"><label class="field">年龄（岁）<input id="age" type="number" min="18"></label><label class="field">性别<select id="sex"><option value="m">男</option><option value="f">女</option></select></label><label class="field">血清肌酐<input id="cr" type="number" step=".1"></label><label class="field">单���q�^
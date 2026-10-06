(function departmentModule(seed){
  try{
    if(typeof templates==="undefined"||!Array.isArray(templates)) return;
    const originalCount=templates.length;
    templates.forEach((t)=>{if(!t.department)t.department="骨科";});
    const existing=new Set(templates.map((t)=>t.name));
    seed.forEach((t)=>{if(!existing.has(t.name))templates.push(t);});

    if(typeof generate==="function"){
      const baseGenerate=generate;
      generate=function(t){return t&&t.sourceBody?t.sourceBody:baseGenerate(t);};
    }

    ["入院记录","首次病程","主治查房","主任查房"].forEach((v)=>{
      const sel=document.getElementById("typeFilter");
      if(sel&&!Array.from(sel.options).some((o)=>o.value===v)){
        const o=document.createElement("option");o.value=v;o.textContent=v;sel.appendChild(o);
      }
    });

    const departments=["骨科","普外科","肾内科","妇科"];
    const diseaseMap={
      "普外科":["肝脓肿"],
      "肾内科":["化疗药物性肾功能损伤"],
      "妇科":["妊娠组织物残留"]
    };
    let current=null;
    const coreFiltered=typeof filtered==="function"?filtered:null;
    const coreRender=typeof render==="function"?render:null;

    if(coreFiltered){
      filtered=function(){
        const list=coreFiltered();
        return current?list.filter((t)=>t.department===current):list;
      };
    }

    const style=document.createElement("style");
    style.textContent=`
      .department-no-sidebar .sidebar{display:none!i���q�^
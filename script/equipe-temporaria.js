(function(){
"use strict";

const URL_EQUIPE = "https://script.google.com/macros/s/AKfycbxeydaON6aaQpGo4qZxcsikoF8RQcg1XaaGgrM6ttGnyarZrFL8DXsKTckp9YPi0Lzgbg/exec";                  // cole aqui a URL da implantação do script novo
const CHAVE      = "ehstemp2026"; 

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MAX=10; 
const rec=$("#rRec"),host=$("#rSiteRec"),form=$("#form");
if(!rec||!host||!form)return;

const lblRec=document.querySelector('label[for="rRec"]');
const LBL_ORIG=lblRec?lblRec.textContent:"";
const PH_ORIG=rec.placeholder;

let incorreta=false;                
let nomes=[""];
const box=document.createElement("div");
box.id="etBox";
box.style.cssText="grid-column:1/-1";
box.innerHTML=
  '<div class="eyebrow">Equipe correta?</div>'+
  '<div class="seg" id="etSeg" role="group" aria-label="Equipe correta?">'+
    '<button type="button" data-v="SIM" aria-pressed="true">Sim</button>'+
    '<button type="button" data-v="NAO" aria-pressed="false">Não</button>'+
  '</div>'+
  '<div id="etPainel" hidden style="margin-top:10px">'+
    '<p class="small muted" style="margin:0 0 8px">Informe quem realmente participou do EHS. O número de integrantes é calculado automaticamente.</p>'+
    '<div id="etLista"></div>'+
    '<div class="acoes" style="justify-content:space-between;margin-top:8px">'+
      '<button type="button" class="secundario pq" id="etAdd">Adicionar mais um integrante</button>'+
      '<span class="small muted" id="etQtd"></span>'+
    '</div>'+
  '</div>';
host.appendChild(box);
const lista=$("#etLista"),painel=$("#etPainel");
function modo(){
  box.querySelectorAll("#etSeg button").forEach(x=>x.setAttribute("aria-pressed",String((x.dataset.v==="NAO")===incorreta)));
  painel.hidden=!incorreta;
  rec.readOnly=incorreta;
  rec.required=!incorreta;
  rec.placeholder=incorreta?"Automático":PH_ORIG;
  if(lblRec)lblRec.textContent=incorreta?"Integrantes no EHS (automático)":LBL_ORIG;
}
function render(foco){
  lista.innerHTML=nomes.map((n,i)=>
    '<div class="acoes" style="margin-top:6px;align-items:center">'+
      '<input type="text" data-i="'+i+'" value="'+esc(n)+'" placeholder="Nome do integrante '+(i+1)+'" autocomplete="off" style="flex:1">'+
      (nomes.length>1?'<button type="button" class="perigo pq" data-rm="'+i+'">Remover</button>':"")+
    '</div>').join("");
  $("#etAdd").disabled=nomes.length>=MAX;
  if(foco){const l=lista.querySelectorAll("input");if(l.length)l[l.length-1].focus();}
  sync();
}
function qtd(){return nomes.filter(n=>n.trim()).length;}
function sync(){
  $("#etQtd").textContent=qtd()+" de "+MAX;
  if(!incorreta)return;
  rec.value=qtd()||"";
  rec.dispatchEvent(new Event("input",{bubbles:true}));
}
$("#etSeg").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  incorreta=b.dataset.v==="NAO";
  modo();
  if(incorreta)sync();
  else{rec.value="";rec.dispatchEvent(new Event("input",{bubbles:true}));}
});
$("#etAdd").addEventListener("click",()=>{if(nomes.length<MAX){nomes.push("");render(true);}});
lista.addEventListener("input",e=>{const i=e.target.dataset.i;if(i==null)return;nomes[+i]=e.target.value;sync();});
lista.addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(!b)return;nomes.splice(+b.dataset.rm,1);render(false);});
form.addEventListener("reset",()=>{incorreta=false;nomes=[""];modo();render(false);});

function avisar(m){const t=document.getElementById("toast");if(!t)return;t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),6000);}
window.EquipeTemp={
  ativo:()=>incorreta,
  validar(){
    if(!incorreta)return null;
    const f=nomes.map(n=>n.trim());
    if(!f.some(Boolean))return "Informe pelo menos um integrante da equipe.";
    if(f.some(n=>!n))return "Preencha ou remova os integrantes em branco.";
    const u=f.map(n=>n.toUpperCase());
    if(new Set(u).size!==u.length)return "Há integrantes repetidos na lista.";
    return null;
  },

  aplicar(r){
    if(!incorreta)return r;
    const l=nomes.map(n=>n.trim().toUpperCase()).filter(Boolean);
    Object.defineProperty(r,"_et",{value:l,enumerable:false});
    r.obs="[Equipe informada manualmente: "+l.join(", ")+"]"+(r.obs?" "+r.obs:"");
    return r;
  },
  async salvou(novos){
    const itens=novos.filter(n=>n._et&&n._et.length);
    if(!itens.length)return;
    if(!URL_EQUIPE){console.warn("equipe-temporaria.js: URL_EQUIPE vazia, integrantes só ficaram nas observações.");return;}
    try{
      const r=await fetch(URL_EQUIPE,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify({chave:CHAVE,registros:itens.map(n=>({
          id:n.id,data:n.data,lider:n.lider,equipe:n.equipe,cc:n.cc,uf:n.uf,coordenador:n.coordenador,
          site:n.site,projeto:n.projeto,inspetor:n.inspetor,criadoEm:n.criadoEm,integrantes:n._et}))})});
      const j=await r.json();
      if(!j.ok)throw new Error(j.erro||"falha");
    }catch(e){
      avisar("Inspeção salva, mas os integrantes não foram para a planilha de apoio ("+e.message+"). Eles estão nas observações.");
    }
  },
  async buscar(dias){
    if(!URL_EQUIPE)return {};
    const r=await fetch(URL_EQUIPE+"?action=integrantes&dias="+(dias||60)+"&chave="+encodeURIComponent(CHAVE));
    const j=await r.json();
    if(!j.ok)throw new Error(j.erro||"falha");
    return j.dados||{};
  }
};
modo();
render(false);
})();
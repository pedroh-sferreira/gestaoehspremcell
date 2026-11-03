(function(){
"use strict";
const REGIOES=["BA","CO","NE1","NE2","NO","SO","SP"];
const sa=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase();
const U=(window.SESSAO||{}).usuario||{};
const ADMIN=["ADMIN","ADMINISTRADOR"].includes(sa(U.funcao));
const bruto=Array.isArray(U.regioes)?U.regioes:String(U.regioes||"").split(/[,;|]/);
const MINHAS=bruto.map(sa).filter(Boolean);

window.ACESSO={
  REGIOES:REGIOES,
  ADMIN:ADMIN,
  MINHAS:MINHAS,
  ve:cc=>ADMIN||MINHAS.includes(sa(cc)),
  filtrar:(arr,campo)=>ADMIN?arr:(arr||[]).filter(x=>MINHAS.includes(sa(x[campo||"cc"]))),
  semRegiao:!ADMIN&&!MINHAS.length
};
document.addEventListener("DOMContentLoaded",()=>{
  let li=document.getElementById("liRegioes");
  if(!ADMIN){if(li)li.hidden=true;return;}
  if(!li){
    const ul=document.querySelector(".menu ul");
    if(!ul)return;
    li=document.createElement("li");
    li.id="liRegioes";
    const a=document.createElement("a");
    a.href="regioes.html";
    a.textContent="Controle de Região";
    if(/regioes\.html$/i.test(location.pathname))a.setAttribute("aria-current","page");
    li.appendChild(a);
    const ref=(document.getElementById("usu")||document.getElementById("sair"));
    const refLi=ref&&ref.closest("li");
    if(refLi&&refLi.parentNode===ul)ul.insertBefore(li,refLi);else ul.appendChild(li);
  }
  li.hidden=false;
});
})();
/* V346 UI-only label fix: no login/save/order logic changes */
(function(){
  'use strict';
  function textReplace(root){
    if(!root) return;
    var walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while((n=walker.nextNode())){
      var t=n.nodeValue || '';
      var nt=t
        .replace(/\bOrder items\b/g,'Deposit / Advance Payment')
        .replace(/\bDeposit Advance\b/g,'Advance');
      if(nt!==t) n.nodeValue=nt;
    }
  }
  function addUnallocatedDisplay(){
    var bodyText=(document.body && document.body.innerText) || '';
    if(!/Deposits\s*\/\s*Advances/i.test(bodyText)) return;
    if(/Unallocated Deposits/i.test(bodyText)) return;
    var cards=Array.from(document.querySelectorAll('.card, [class*="card"'));
    var depCard=cards.find(function(c){return /Deposits\s*\/\s*Advances/i.test(c.innerText||'');});
    if(!depCard || !depCard.parentElement) return;
    var amountEl=depCard.querySelector('.value, [class*="value"') || depCard;
    var amount=(amountEl.innerText||'0.00').trim().split(/\n/).pop();
    var clone=depCard.cloneNode(true);
    clone.querySelectorAll('.label, [class*="label"').forEach(function(x){x.textContent='Unallocated Deposits';});
    var val=clone.querySelector('.value, [class*="value"');
    if(val) val.textContent=amount;
    depCard.parentElement.appendChild(clone);
  }
  function run(){
    textReplace(document.body);
    addUnallocatedDisplay();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run); else run();
  new MutationObserver(function(){ clearTimeout(window.__v346UiLabelFixT); window.__v346UiLabelFixT=setTimeout(run,80); }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();

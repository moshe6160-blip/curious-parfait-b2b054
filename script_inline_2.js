
/* V88: Login guard only. Does not change users/auth credentials.
   It re-binds the existing Login button to the original safeLoginClick function
   and makes sure the button remains clickable after upload/cache issues. */
(function(){
  function bindLoginGuard(){
    var btn = document.getElementById("loginBtn");
    if(!btn || btn.dataset.v88LoginGuard === "1") return;
    btn.dataset.v88LoginGuard = "1";
    btn.disabled = false;
    btn.style.pointerEvents = "auto";
    btn.style.position = btn.style.position || "relative";
    btn.style.zIndex = "10";
    btn.addEventListener("click", function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      btn.disabled = false;
      if(typeof window.safeLoginClick === "function"){
        window.safeLoginClick();
      } else if(typeof window.login === "function"){
        window.login();
      } else {
        var st = document.getElementById("loginStatus");
        if(st) st.textContent = "Login is loading. Refresh and try again.";
      }
    }, true);
  }
  document.addEventListener("DOMContentLoaded", bindLoginGuard);
  window.addEventListener("load", bindLoginGuard);
  setTimeout(bindLoginGuard, 300);
  setTimeout(bindLoginGuard, 1200);
})();

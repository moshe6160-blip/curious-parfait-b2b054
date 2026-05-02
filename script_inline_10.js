
(function(){if("serviceWorker" in navigator && location.protocol !== "file:"){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(e){console.warn("SW registration failed",e);});});}})();

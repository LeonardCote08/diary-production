/**
* ios-haptics v0.1.2
* tijn.dev
* @license MIT
**/function t(){try{if(navigator.vibrate){navigator.vibrate(50);return}const e=document.createElement("label");e.ariaHidden="true",e.style.display="none";const a=document.createElement("input");a.type="checkbox",a.setAttribute("switch",""),e.appendChild(a),document.head.appendChild(e),e.click(),document.head.removeChild(e)}catch{}}t.confirm=()=>{if(navigator.vibrate){navigator.vibrate([50,70,50]);return}t(),setTimeout(()=>t(),120)};t.error=()=>{if(navigator.vibrate){navigator.vibrate([50,70,50,70,50]);return}t(),setTimeout(()=>t(),120),setTimeout(()=>t(),240)};const i=t;export{i as haptic};

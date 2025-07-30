class y{constructor(){this.samples=[],this.maxSamples=30,this.lastTime=performance.now(),this.frameCount=0,this.isRunning=!1,this.createOverlay()}createOverlay(){this.overlay=document.createElement("div"),this.overlay.id="realtime-monitor",this.overlay.style.cssText=`
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            border-radius: 5px;
            min-width: 200px;
            display: none;
        `,document.body.appendChild(this.overlay)}start(){this.isRunning=!0,this.overlay.style.display="block",this.update()}stop(){this.isRunning=!1,this.overlay.style.display="none"}update(){var s,o,n,a,l;if(!this.isRunning)return;const i=performance.now(),r=i-this.lastTime;this.lastTime=i;const d=1e3/r;this.samples.push(d),this.samples.length>this.maxSamples&&this.samples.shift();const e=this.samples.reduce((f,u)=>f+u,0)/this.samples.length,p=Math.min(...this.samples),m=Math.max(...this.samples),h=((o=(s=window.nativeHotspotRenderer)==null?void 0:s.activeHotspotManager)==null?void 0:o.getStats().activeHotspots)||0,c=647,v=((a=(n=window.viewer)==null?void 0:n.tileCache)==null?void 0:a._numTilesLoaded)||0,w=((l=window.viewer)==null?void 0:l.maxImageCacheCount)||0;this.overlay.innerHTML=`
            <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">REALTIME MONITOR</div>
            <div>FPS: <span style="color: ${e<30?"#f00":e<45?"#ff0":"#0f0"}">${e.toFixed(1)}</span></div>
            <div>Min/Max: ${p.toFixed(0)}/${m.toFixed(0)}</div>
            <div style="margin-top: 5px;">Hotspots: ${h}/${c}</div>
            <div>Cache: ${v}/${w}</div>
            <div style="margin-top: 5px; color: #888;">Press ESC to hide</div>
        `,requestAnimationFrame(()=>this.update())}}window.realtimeMonitor=new y;document.addEventListener("keydown",t=>{t.key==="F9"?window.realtimeMonitor.isRunning?window.realtimeMonitor.stop():window.realtimeMonitor.start():t.key==="Escape"&&window.realtimeMonitor.isRunning&&window.realtimeMonitor.stop()});console.log("Realtime Monitor loaded - Press F9 to toggle");export{y as default};

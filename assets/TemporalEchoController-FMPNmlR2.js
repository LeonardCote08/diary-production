import{O as w,i as x}from"./main-DKh9icNd.js";const a={IDLE:"idle",UNDETERMINED:"undetermined",DOUBLE_TAP_WAIT:"double_tap_wait",HOLD:"hold",PAN:"pan",PINCH:"pinch",CANCELLED:"cancelled"};class R{constructor(e={}){this.config={quickTapThreshold:e.quickTapThreshold||200,doubleTapThreshold:e.doubleTapThreshold||300,holdThreshold:e.holdThreshold||400,movementThreshold:e.movementThreshold||10,mobileMovementThreshold:e.mobileMovementThreshold||20,velocityThreshold:e.velocityThreshold||5,debug:e.debug||!1},this.state=a.IDLE,this.previousState=null,this.gestureData=null,this.activePointers=new Map,this.gestureStartTime=0,this.lastTapTime=0,this.lastTapPosition=null,this.quickTapTimer=null,this.holdTimer=null,this.doubleTapTimer=null,this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.callbacks={onQuickTap:e.onQuickTap||(()=>{}),onDoubleTap:e.onDoubleTap||(()=>{}),onHoldStart:e.onHoldStart||(()=>{}),onHoldEnd:e.onHoldEnd||(()=>{}),onPanStart:e.onPanStart||(()=>{}),onPinchStart:e.onPinchStart||(()=>{}),onGestureCancel:e.onGestureCancel||(()=>{})},this.startGesture=this.startGesture.bind(this),this.updateGesture=this.updateGesture.bind(this),this.endGesture=this.endGesture.bind(this),this.cancelGesture=this.cancelGesture.bind(this)}startGesture(e){const t=e.pointerId||0,o=performance.now();if(this.activePointers.set(t,{startX:e.x,startY:e.y,currentX:e.x,currentY:e.y,startTime:o}),this.activePointers.size>=2){this.transitionTo(a.PINCH),this.callbacks.onPinchStart(this.getGestureData());return}this.gestureStartTime=o,this.gestureData={startX:e.x,startY:e.y,currentX:e.x,currentY:e.y,pointerId:t},this.transitionTo(a.UNDETERMINED),this.startDetectionTimers(),this.log("Gesture started",this.gestureData)}updateGesture(e){const t=e.pointerId||0,o=this.activePointers.get(t);if(!o||this.state===a.IDLE)return;o.currentX=e.x,o.currentY=e.y,this.gestureData&&this.gestureData.pointerId===t&&(this.gestureData.currentX=e.x,this.gestureData.currentY=e.y);const i=e.x-o.startX,s=e.y-o.startY,r=Math.sqrt(i*i+s*s),l=this.isMobile?this.config.mobileMovementThreshold:this.config.movementThreshold;r>l&&this.state===a.UNDETERMINED&&(this.clearDetectionTimers(),this.transitionTo(a.PAN),this.callbacks.onPanStart(this.getGestureData()))}endGesture(e){const t=e.pointerId||0,o=this.activePointers.get(t);if(!o)return;const i=performance.now()-o.startTime;switch(performance.now(),this.activePointers.delete(t),this.state){case a.UNDETERMINED:i<this.config.quickTapThreshold?this.handleQuickTap(e,i):this.cancelGesture("duration_exceeded");break;case a.HOLD:this.callbacks.onHoldEnd({...this.getGestureData(),duration:i}),this.transitionTo(a.IDLE);break;case a.DOUBLE_TAP_WAIT:break;default:this.transitionTo(a.IDLE)}this.activePointers.size===0&&this.state!==a.DOUBLE_TAP_WAIT&&this.resetGesture()}cancelGesture(e="unknown"){this.clearDetectionTimers();const t=this.state;this.transitionTo(a.CANCELLED),this.callbacks.onGestureCancel({previousState:t,reason:e,gestureData:this.getGestureData()}),this.reset()}handleQuickTap(e,t){const o=performance.now(),i={x:e.x,y:e.y};if(this.lastTapTime&&this.lastTapPosition){const s=o-this.lastTapTime,r=this.calculateDistance(i.x,i.y,this.lastTapPosition.x,this.lastTapPosition.y);if(s<this.config.doubleTapThreshold&&r<50){this.clearDetectionTimers(),this.callbacks.onDoubleTap({...this.getGestureData(),duration:t,timeBetweenTaps:s}),this.lastTapTime=0,this.lastTapPosition=null,this.transitionTo(a.IDLE);return}}this.callbacks.onQuickTap({...this.getGestureData(),duration:t,originalEvent:e.originalEvent}),this.lastTapTime=o,this.lastTapPosition=i,this.transitionTo(a.DOUBLE_TAP_WAIT),this.doubleTapTimer=setTimeout(()=>{this.transitionTo(a.IDLE),this.resetGesture()},this.config.doubleTapThreshold)}startDetectionTimers(){this.quickTapTimer=setTimeout(()=>{this.state===a.UNDETERMINED&&this.startHoldDetection()},this.config.quickTapThreshold)}startHoldDetection(){const e=this.config.holdThreshold-this.config.quickTapThreshold;this.holdTimer=setTimeout(()=>{this.state===a.UNDETERMINED&&(this.transitionTo(a.HOLD),this.callbacks.onHoldStart(this.getGestureData()))},e)}clearDetectionTimers(){this.quickTapTimer&&(clearTimeout(this.quickTapTimer),this.quickTapTimer=null),this.holdTimer&&(clearTimeout(this.holdTimer),this.holdTimer=null),this.doubleTapTimer&&(clearTimeout(this.doubleTapTimer),this.doubleTapTimer=null)}transitionTo(e){this.state!==e&&(this.previousState=this.state,this.state=e,this.log(`State transition: ${this.previousState} → ${e}`))}getGestureData(){return this.gestureData?{...this.gestureData,state:this.state,duration:performance.now()-this.gestureStartTime,distance:this.calculateDistance(this.gestureData.currentX,this.gestureData.currentY,this.gestureData.startX,this.gestureData.startY)}:null}calculateDistance(e,t,o,i){const s=o-e,r=i-t;return Math.sqrt(s*s+r*r)}reset(){this.state=a.IDLE,this.previousState=null,this.gestureData=null,this.gestureStartTime=0,this.clearDetectionTimers()}resetGesture(){this.gestureData=null,this.gestureStartTime=0,this.activePointers.clear(),this.clearDetectionTimers()}log(...e){this.config.debug&&console.log("[GestureStateMachine]",...e)}getState(){return this.state}isActive(){return this.state!==a.IDLE&&this.state!==a.CANCELLED}destroy(){this.clearDetectionTimers(),this.activePointers.clear(),this.reset()}}class D{constructor(e={}){this.eventCoordinator=e.eventCoordinator,this.viewer=e.viewer,this.onQuickTap=e.onQuickTap||(()=>{}),this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.gestureStateMachine=new R({quickTapThreshold:200,movementThreshold:this.isMobile?20:10,debug:window.DEBUG_GESTURES||!1,onQuickTap:this.handleQuickTap.bind(this),onDoubleTap:this.handleDoubleTap.bind(this),onHoldStart:this.handleHoldStart.bind(this),onHoldEnd:this.handleHoldEnd.bind(this),onPanStart:this.handlePanStart.bind(this),onPinchStart:this.handlePinchStart.bind(this)}),this.isIntercepting=!1,this.originalHandlers={},this.lastEventTime=0,this.eventThrottle=16,this.enabled=!1,this.setupEventListeners()}setupEventListeners(){if(!this.eventCoordinator){console.warn("[TemporalEchoAdapter] No EventCoordinator provided");return}this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_DOWN,this.handlePointerDown.bind(this)),this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_MOVE,this.handlePointerMove.bind(this)),this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_UP,this.handlePointerUp.bind(this)),console.log("[TemporalEchoAdapter] Event listeners setup complete")}handlePointerDown(e){if(console.log("[TemporalEchoAdapter] Pointer down, state:",this.gestureStateMachine.getState()),e.activePointers>1){this.gestureStateMachine.cancelGesture("multi_touch");return}this.enabled&&(this.gestureStateMachine.startGesture({x:e.x,y:e.y,pointerId:e.pointerId,originalEvent:e.event}),this.isIntercepting=!1)}handlePointerMove(e){const t=performance.now();t-this.lastEventTime<this.eventThrottle||(this.lastEventTime=t,this.gestureStateMachine.updateGesture({x:e.x,y:e.y,pointerId:e.pointerId}),this.gestureStateMachine.getState()==="pan"&&(this.isIntercepting=!1))}handlePointerUp(e){this.gestureStateMachine.endGesture({x:e.x,y:e.y,pointerId:e.pointerId,originalEvent:e.event}),this.isIntercepting=!1}handleQuickTap(e){console.log("[TemporalEchoAdapter] Quick tap detected!",{x:e.startX,y:e.startY,duration:e.duration});const t=this.viewer.viewport.pointFromPixel(new w.Point(e.startX,e.startY));this.isIntercepting=!0;const o=this.onQuickTap({x:e.startX,y:e.startY,viewportX:t.x,viewportY:t.y,duration:e.duration});return o?(e.originalEvent&&(e.originalEvent.preventDefault(),e.originalEvent.stopPropagation()),this.handledQuickTap=!0,this.lastQuickTapTime=performance.now(),setTimeout(()=>{this.isIntercepting=!1,this.handledQuickTap=!1},100)):this.isIntercepting=!1,o}handleDoubleTap(e){console.log("[TemporalEchoAdapter] Double tap detected, passing to viewer")}handleHoldStart(e){console.log("[TemporalEchoAdapter] Hold started, delegating to normal system"),this.isIntercepting=!1,this.gestureStateMachine.cancelGesture("hold_detected")}handleHoldEnd(e){}handlePanStart(e){console.log("[TemporalEchoAdapter] Pan detected, delegating to viewer"),this.isIntercepting=!1}handlePinchStart(e){console.log("[TemporalEchoAdapter] Pinch detected, delegating to viewer"),this.isIntercepting=!1}shouldIntercept(){return this.isIntercepting&&this.gestureStateMachine.isActive()&&this.gestureStateMachine.getState()!=="pan"&&this.gestureStateMachine.getState()!=="pinch"}enable(){console.log("[TemporalEchoAdapter] Enabling temporal echo gestures"),this.enabled=!0}disable(){console.log("[TemporalEchoAdapter] Disabling temporal echo gestures"),this.enabled=!1,this.gestureStateMachine.cancelGesture("disabled"),this.isIntercepting=!1}updateConfig(e){e.quickTapThreshold!==void 0&&(this.gestureStateMachine.config.quickTapThreshold=e.quickTapThreshold),e.movementThreshold!==void 0&&(this.gestureStateMachine.config.movementThreshold=e.movementThreshold)}destroy(){this.gestureStateMachine.destroy(),this.isIntercepting=!1}}class M{constructor(e={}){this.targetFPS=e.targetFPS||30,this.sampleRate=e.sampleRate||100,this.warningThreshold=e.warningThreshold||25,this.criticalThreshold=e.criticalThreshold||20,this.metrics={fps:{current:60,average:60,min:60,max:60,samples:[]},frameTime:{current:16.67,average:16.67,max:16.67,samples:[]},memory:{used:0,limit:0,percentage:0},ripples:{active:0,created:0,completed:0}},this.performanceState="optimal",this.lastFrameTime=performance.now(),this.frameCount=0,this.isMonitoring=!1,this.onPerformanceChange=e.onPerformanceChange||(()=>{}),this.onCriticalPerformance=e.onCriticalPerformance||(()=>{}),console.log("[PerformanceMonitor] Initialized with target FPS:",this.targetFPS)}start(){this.isMonitoring||(this.isMonitoring=!0,this.lastFrameTime=performance.now(),this.rafLoop(),this.startSampling(),console.log("[PerformanceMonitor] Started monitoring"))}rafLoop(){if(!this.isMonitoring)return;const e=performance.now(),t=e-this.lastFrameTime;this.metrics.frameTime.current=t,this.frameCount++,t>0&&(this.metrics.fps.current=Math.round(1e3/t)),this.lastFrameTime=e,requestAnimationFrame(()=>this.rafLoop())}startSampling(){this.samplingInterval=setInterval(()=>{this.sampleMetrics(),this.evaluatePerformance()},this.sampleRate)}sampleMetrics(){performance.now();const e=this.metrics.fps.samples;e.push(this.metrics.fps.current),e.length>10&&e.shift(),this.metrics.fps.average=Math.round(e.reduce((o,i)=>o+i,0)/e.length),this.metrics.fps.min=Math.min(...e),this.metrics.fps.max=Math.max(...e);const t=this.metrics.frameTime.samples;t.push(this.metrics.frameTime.current),t.length>10&&t.shift(),this.metrics.frameTime.average=t.reduce((o,i)=>o+i,0)/t.length,this.metrics.frameTime.max=Math.max(...t),performance.memory&&(this.metrics.memory.used=Math.round(performance.memory.usedJSHeapSize/1048576),this.metrics.memory.limit=Math.round(performance.memory.jsHeapSizeLimit/1048576),this.metrics.memory.percentage=Math.round(performance.memory.usedJSHeapSize/performance.memory.jsHeapSizeLimit*100))}evaluatePerformance(){const e=this.metrics.fps.average,t=this.performanceState;e>=this.targetFPS?this.performanceState="optimal":e>=this.warningThreshold?this.performanceState="degraded":this.performanceState="critical",t!==this.performanceState&&(console.log(`[PerformanceMonitor] State changed: ${t} → ${this.performanceState}`),this.onPerformanceChange(this.performanceState,this.metrics),this.performanceState==="critical"&&this.onCriticalPerformance(this.metrics)),this.performanceState!=="optimal"&&this.frameCount%60===0&&console.warn("[PerformanceMonitor] Performance below target:",{state:this.performanceState,avgFPS:e,targetFPS:this.targetFPS})}rippleCreated(){this.metrics.ripples.created++,this.metrics.ripples.active++}rippleCompleted(){this.metrics.ripples.completed++,this.metrics.ripples.active=Math.max(0,this.metrics.ripples.active-1)}getMetrics(){return{...this.metrics,performanceState:this.performanceState,isTargetMet:this.metrics.fps.average>=this.targetFPS}}getRecommendations(){const e=[];return this.performanceState==="critical"?(e.push("Reduce animation complexity"),e.push("Disable visual effects"),e.push("Limit concurrent ripples to 1")):this.performanceState==="degraded"&&(e.push("Consider reducing ripple radius"),e.push("Simplify animation easing")),this.metrics.memory.percentage>80&&(e.push("High memory usage detected"),e.push("Clear completed animations")),e}stop(){this.isMonitoring=!1,this.samplingInterval&&(clearInterval(this.samplingInterval),this.samplingInterval=null),console.log("[PerformanceMonitor] Stopped monitoring")}reset(){this.metrics.fps.samples=[],this.metrics.frameTime.samples=[],this.metrics.ripples={active:0,created:0,completed:0},this.frameCount=0}destroy(){this.stop(),this.reset()}}class I{constructor(e={}){this.viewer=e.viewer,this.radius=e.radius||200,this.duration=e.duration||800,this.maxRipples=e.maxRipples||3,this.onRippleComplete=e.onRippleComplete||(()=>{}),this.safariOptimizations={useWillChange:!0,use3DTransform:!0,useWebkitPrefix:!0,compositeLayerHints:!0},this.container=null,this.activeRipples=new Map,this.rippleIdCounter=0,this.performanceMonitor=new M({targetFPS:30,warningThreshold:25,criticalThreshold:20,onPerformanceChange:this.handlePerformanceChange.bind(this),onCriticalPerformance:this.handleCriticalPerformance.bind(this)}),this.isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent),this.isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1,console.log("[CSSRippleRenderer] Initialized",{safari:this.isSafari,iOS:this.isIOS,mobile:x()})}initialize(){this.createContainer(),this.injectStyles(),this.performanceMonitor.start(),console.log("[CSSRippleRenderer] Initialized container and styles")}createContainer(){this.container||(this.container=document.createElement("div"),this.container.className="css-ripple-container",this.container.style.cssText=`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
            ${this.safariOptimizations.use3DTransform?"transform: translate3d(0, 0, 0);":""}
            ${this.safariOptimizations.useWillChange?"will-change: transform;":""}
            ${this.safariOptimizations.compositeLayerHints?"-webkit-transform: translateZ(0);":""}
        `,document.body.appendChild(this.container))}injectStyles(){if(document.getElementById("css-ripple-styles"))return;const e=document.createElement("style");e.id="css-ripple-styles";const t=`
            @keyframes ripple-expand {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 1;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(1);
                    opacity: 0;
                }
            }
            
            @-webkit-keyframes ripple-expand {
                0% {
                    -webkit-transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 1;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    -webkit-transform: translate3d(-50%, -50%, 0) scale(1);
                    opacity: 0;
                }
            }
        `,o=`
            .css-ripple {
                position: absolute;
                border-radius: 50%;
                background: transparent;
                border: 2px solid rgba(255, 255, 255, 0.8);
                /* Simplified box-shadow for better mobile performance */
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                pointer-events: none;
                ${this.safariOptimizations.use3DTransform?"transform: translate3d(-50%, -50%, 0) scale(0);":"transform: translate(-50%, -50%) scale(0);"}
                ${this.safariOptimizations.useWillChange?"will-change: transform, opacity;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-transform: translate3d(-50%, -50%, 0) scale(0);":""}
                animation: ripple-expand ${this.duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation: ripple-expand "+this.duration+"ms cubic-bezier(0.4, 0, 0.2, 1) forwards;":""}
            }
            
            .css-ripple.low-performance {
                box-shadow: none;
                background: rgba(255, 255, 255, 0.3);
                animation-duration: ${this.duration*.7}ms;
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-duration: "+this.duration*.7+"ms;":""}
            }
        `,i=`
            /* Override any LOD or visibility class during reveal */
            .hotspot-echo-reveal.hotspot-hidden,
            .hotspot-hidden.hotspot-echo-reveal,
            .hotspot-echo-reveal.hotspot-visible,
            .hotspot-visible.hotspot-echo-reveal {
                opacity: 0 !important;
                visibility: visible !important;
                pointer-events: none !important;
                display: block !important;
            }
            
            /* Default reveal style (white/visible) - optimized duration */
            .hotspot-echo-reveal {
                visibility: visible !important;
                display: block !important;
                z-index: 1000 !important;
                pointer-events: none !important;
                animation-name: hotspot-simple-fade-in !important;
                animation-duration: 0.4s !important;
                animation-timing-function: ease-out !important;
                animation-fill-mode: both !important;
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-name: hotspot-simple-fade-in !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-duration: 0.4s !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-timing-function: ease-out !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-fill-mode: both !important;":""}
            }
            
            /* Black mode specific styling - optimized for mobile */
            .hotspot-echo-reveal.black-mode {
                visibility: visible !important;
            }
            
            .hotspot-echo-reveal.black-mode path,
            .hotspot-echo-reveal.black-mode polygon,
            .hotspot-echo-reveal.black-mode polyline {
                stroke: #000000 !important;
                fill: none !important;
                stroke-width: 6 !important;
                /* Reduced filter complexity for better mobile performance */
                filter: drop-shadow(0 0 15px rgba(0, 0, 0, 0.7));
                animation-name: hotspot-simple-fade-in !important;
                animation-duration: 0.4s !important;
                animation-timing-function: ease-out !important;
                animation-fill-mode: both !important;
                animation-delay: inherit !important;
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-name: hotspot-simple-fade-in !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-duration: 0.4s !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-timing-function: ease-out !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-fill-mode: both !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-delay: inherit !important;":""}
            }
            
            /* Removed multiple glow layers for better performance on mobile */
            
            /* Ensure g elements are visible and override LOD */
            g.hotspot-echo-reveal,
            g.hotspot-echo-reveal.hotspot-hidden,
            g.hotspot-echo-reveal.hotspot-visible {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                z-index: 1000 !important;
            }
            
            /* Override any LOD hiding during reveal */
            .hotspot-echo-reveal.hotspot-visible,
            .hotspot-visible.hotspot-echo-reveal {
                opacity: 0 !important;
                animation-name: hotspot-simple-fade-in !important;
                animation-duration: 0.6s !important;
                animation-fill-mode: forwards !important;
            }
            
            /* Force visibility for all child elements */
            .hotspot-echo-reveal path,
            .hotspot-echo-reveal polygon,
            .hotspot-echo-reveal polyline {
                visibility: visible !important;
            }
            
            /* Simple fade for default mode - with forced start from 0 */
            @keyframes hotspot-simple-fade-in {
                0% { 
                    opacity: 0 !important;
                    visibility: visible;
                }
                1% {
                    opacity: 0 !important;
                    visibility: visible;
                }
                100% { 
                    opacity: 1;
                    visibility: visible;
                }
            }
            
            @-webkit-keyframes hotspot-simple-fade-in {
                0% { 
                    opacity: 0 !important;
                    visibility: visible;
                }
                1% {
                    opacity: 0 !important;
                    visibility: visible;
                }
                100% { 
                    opacity: 1;
                    visibility: visible;
                }
            }
            
            /* Removed complex black mode animation - using simple fade for performance */
            
            /* Fade-out animation - simplified */
            .hotspot-echo-fade-out {
                animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;":""}
            }
            
            .hotspot-echo-fade-out.black-mode path {
                animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation: hotspot-simple-fade-out 0.3s ease-out forwards !important;":""}
            }
            
            @keyframes hotspot-simple-fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @-webkit-keyframes hotspot-simple-fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;e.textContent=t+o+i,document.head.appendChild(e)}createRipple(e,t){if(this.activeRipples.size>=this.maxRipples){const l=this.activeRipples.values().next().value;l&&this.removeRipple(l.id)}const o=`ripple-${this.rippleIdCounter++}`,i=document.createElement("div");i.className="css-ripple",i.id=o,this.performanceMonitor.getMetrics().performanceState!=="optimal"&&i.classList.add("low-performance");const r=this.radius*2;return i.style.width=`${r}px`,i.style.height=`${r}px`,i.style.left=`${e}px`,i.style.top=`${t}px`,this.container.appendChild(i),this.activeRipples.set(o,{id:o,element:i,startTime:performance.now()}),setTimeout(()=>{this.removeRipple(o)},this.duration),this.performanceMonitor.rippleCreated(),console.log("[CSSRippleRenderer] Created ripple at",{x:e,y:t},"id:",o),o}removeRipple(e){const t=this.activeRipples.get(e);t&&(t.element&&t.element.parentNode&&t.element.remove(),this.activeRipples.delete(e),this.performanceMonitor.rippleCompleted(),this.onRippleComplete(e))}handlePerformanceChange(e,t){console.log(`[CSSRippleRenderer] Performance state: ${e}`,t.fps),e==="critical"?(this.maxRipples=1,this.duration=600):e==="degraded"?(this.maxRipples=2,this.duration=700):(this.maxRipples=3,this.duration=800)}handleCriticalPerformance(e){console.warn("[CSSRippleRenderer] Critical performance detected!",e),this.activeRipples.size>1&&Array.from(this.activeRipples.keys()).slice(0,-1).forEach(o=>this.removeRipple(o))}getFPS(){return this.performanceMonitor.getMetrics().fps.current}getPerformanceMetrics(){return this.performanceMonitor.getMetrics()}cleanup(){this.activeRipples.forEach(e=>{e.element&&e.element.parentNode&&e.element.remove()}),this.activeRipples.clear(),this.performanceMonitor.stop()}destroy(){this.cleanup(),this.performanceMonitor.destroy(),this.container&&this.container.parentNode&&(this.container.remove(),this.container=null);const e=document.getElementById("css-ripple-styles");e&&e.remove(),console.log("[CSSRippleRenderer] Destroyed")}}class H{constructor(e={}){this.viewer=e.viewer,this.eventCoordinator=e.eventCoordinator,this.hotspotRenderer=e.hotspotRenderer,this.stateManager=e.stateManager,this.config={echoRadius:e.echoRadius||200,echoDelay:e.echoDelay||0,echoDuration:e.echoDuration||800,maxSimultaneous:e.maxSimultaneous||10,staggerDelay:e.staggerDelay||30,revealDuration:e.revealDuration||2e3,enabled:e.enabled!==!1,mobileMaxHotspots:e.mobileMaxHotspots||10},this.activeEchoes=new Set,this.echoAnimations=new Map,this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.initializeGestureAdapter(),this.initializeRippleRenderer(),this.frameCount=0,this.lastFPSCheck=performance.now(),this.currentFPS=60,console.log("[TemporalEchoController] Initialized",this.config),window.temporalEchoController=this,window.debugRevealHotspot=t=>{const i={hotspot:{id:t},centerX:100,centerY:100};this.revealSingleHotspot(i,{},0)},window.debugShowAllHotspots=()=>{const t=document.querySelectorAll("[data-hotspot-id]");console.log(`[Debug] Found ${t.length} hotspot elements`),t.forEach((o,i)=>{i<5&&console.log(`[Debug] Hotspot ${i}:`,{id:o.getAttribute("data-hotspot-id"),tagName:o.tagName,className:o.className,opacity:window.getComputedStyle(o).opacity,visibility:window.getComputedStyle(o).visibility,display:window.getComputedStyle(o).display})})}}initializeGestureAdapter(){this.gestureAdapter=new D({eventCoordinator:this.eventCoordinator,viewer:this.viewer,onQuickTap:this.handleQuickTap.bind(this)}),this.config.enabled&&this.gestureAdapter.enable()}initializeRippleRenderer(){this.rippleRenderer=new I({viewer:this.viewer,radius:this.config.echoRadius,duration:this.config.echoDuration,maxRipples:3,onRippleComplete:this.handleRippleComplete.bind(this)}),this.config.enabled&&this.rippleRenderer.initialize(),window.cssRippleRenderer=this.rippleRenderer}handleQuickTap(e){if(console.log("[TemporalEchoController] handleQuickTap called, enabled:",this.config.enabled),!this.config.enabled)return console.log("[TemporalEchoController] Echo disabled, skipping"),!1;if(!this.isMobile)return console.log("[TemporalEchoController] Not on mobile, skipping echo"),!1;console.log("[TemporalEchoController] Quick tap detected on mobile, triggering echo",e),this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_TAP,{x:e.x,y:e.y,viewportX:e.viewportX,viewportY:e.viewportY});const t=this.findHotspotsInRadius(e,this.config.echoRadius);return this.rippleRenderer.createRipple(e.x,e.y),t.length>0?(console.log(`[TemporalEchoController] Found ${t.length} hotspots in radius`),this.revealHotspots(t,e)):console.log("[TemporalEchoController] No hotspots found in echo radius"),this.updateFPS(),!0}findHotspotsInRadius(e,t){return this.linearHotspotSearch(e,t)}linearHotspotSearch(e,t){const o=[],i=this.viewer.element.getBoundingClientRect(),s=new w.Point(e.x-i.left,e.y-i.top),r=this.viewer.viewport.pointFromPixel(s),l=this.viewer.viewport.viewportToImageCoordinates(r);console.log("[TemporalEchoController] Searching for hotspots at:",{pixelCoords:{x:e.x,y:e.y},viewportCoords:{x:r.x,y:r.y},imageCoords:{x:l.x,y:l.y}});const T=this.stateManager.getAllOverlays();console.log("[TemporalEchoController] Total overlays available:",T.size);let u=0;T.forEach((f,d)=>{const c=f.hotspot;if(!c||!c.coordinates||c.coordinates.length===0)return;u++;let p=0,n=0;const h=c.shape==="multipolygon"?c.coordinates[0]:c.coordinates;h.forEach(([E,b])=>{p+=E,n+=b}),p/=h.length,n/=h.length;const g=p-l.x,m=n-l.y,y=Math.sqrt(g*g+m*m),C=this.viewer.viewport.pointFromPixel(new w.Point(t,0)),k=this.viewer.viewport.viewportToImageCoordinates(C),P=Math.abs(k.x);if(u<=3&&console.log(`[TemporalEchoController] Hotspot ${d}:`,{hotspotCenter:{x:p,y:n},tapImagePoint:{x:l.x,y:l.y},distanceInImageSpace:y,radiusInImageSpace:P,inRadius:y<=P}),y<=P){const E=this.viewer.viewport.imageToViewportCoordinates(new w.Point(p,n)),b=this.viewer.viewport.pixelFromPoint(E);o.push({hotspot:c,distance:y,centerX:b.x+i.left,centerY:b.y+i.top})}}),console.log(`[TemporalEchoController] Checked ${u} hotspots, found ${o.length} in radius`),o.sort((f,d)=>f.distance-d.distance);const S=this.isMobile?this.config.mobileMaxHotspots:this.config.maxSimultaneous;return o.slice(0,S)}revealHotspots(e,t){this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_START,{count:e.length,origin:t});const o=e,i=o.map(r=>r.hotspot.id);window.nativeHotspotRenderer&&window.nativeHotspotRenderer.activeHotspotManager&&(console.log("[TemporalEchoController] Preparing",i.length,"hotspots for reveal animation"),window.nativeHotspotRenderer.activeHotspotManager.forceShowHotspots(i,{maxForceShow:this.isMobile?this.config.mobileMaxHotspots:this.config.maxSimultaneous})),o.forEach((r,l)=>{setTimeout(()=>{this.revealSingleHotspot(r,t,l)},l*this.config.staggerDelay)});const s=this.config.revealDuration+300+o.length*this.config.staggerDelay;setTimeout(()=>{this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_END,{count:o.length})},s)}revealSingleHotspot(e,t,o){var p;const i=e.hotspot||e;console.log("[TemporalEchoController] revealSingleHotspot called for:",i.id);let s=null;const r=this.stateManager.getOverlay(i.id);if(r&&r.element&&(s=r.element,console.log("[TemporalEchoController] Found element via state manager")),!s){const n=document.querySelectorAll(".openseadragon-svg-overlay, .hotspot-overlay-svg, svg");for(const h of n)if(s=h.querySelector(`[data-hotspot-id="${i.id}"]`),s){console.log("[TemporalEchoController] Found element in container:",h.className);break}}if(s||(s=document.getElementById(`hotspot-${i.id}`),s&&console.log("[TemporalEchoController] Found element by ID")),!s){const n=document.querySelectorAll(`g[data-hotspot-id="${i.id}"]`);n.length>0&&(s=n[0],console.log("[TemporalEchoController] Found g element with hotspot id"))}if(!s){console.warn("[TemporalEchoController] No element found for hotspot",i.id);return}const l=s.style.opacity||"",T=s.style.visibility||"",u=s.classList.contains("hotspot-hidden"),S=s.classList.contains("hotspot-visible"),f=["blackOnBlack","pigmentLinerNeutral","pigmentLinerWarm","pigmentLinerCool"],d=(p=window.nativeHotspotRenderer)==null?void 0:p.currentPalette,c=f.includes(d);if(console.log("[TemporalEchoController] Current palette:",d,"isDarkMode:",c),this.activeEchoes.has(i.id)){console.log("[TemporalEchoController] Hotspot already animating, skipping:",i.id);return}s.classList.remove("hotspot-echo-reveal","hotspot-echo-fade-out","black-mode"),s.style.animationDelay="",s.tagName.toLowerCase()==="g"&&s.querySelectorAll("path, polygon, polyline").forEach(h=>{h.style.animationDelay=""}),requestAnimationFrame(()=>{s.classList.add("hotspot-echo-reveal"),c&&s.classList.add("black-mode");const n=o*this.config.staggerDelay;s.style.animationDelay=`${n}ms`,console.log(`[TemporalEchoController] Hotspot ${i.id} animation delay: ${n}ms (index: ${o})`),s.tagName.toLowerCase()==="g"&&s.querySelectorAll("path, polygon, polyline").forEach(g=>{g.style.animationDelay=`${n}ms`}),s.offsetHeight,console.log("[TemporalEchoController] Classes added:",s.classList.toString()),this.activeEchoes.add(i.id),this.echoAnimations.set(i.id,{element:s,originalOpacity:l,originalVisibility:T,wasHidden:u,wasVisible:S})}),setTimeout(()=>{s.classList.remove("hotspot-echo-reveal"),s.style.animationDelay="",s.classList.add("hotspot-echo-fade-out"),setTimeout(()=>{s.classList.remove("hotspot-echo-fade-out","black-mode");const n=this.stateManager.getSelectedHotspot();if(!n||n.id!==i.id){const h=this.echoAnimations.get(i.id);h&&(s.style.opacity=h.originalOpacity,s.style.visibility=h.originalVisibility,s.style.display="",h.wasHidden&&s.classList.add("hotspot-hidden"),h.wasVisible&&s.classList.add("hotspot-visible"),s.tagName.toLowerCase()==="g"&&s.querySelectorAll("path, polygon, polyline").forEach(m=>{m.style.animationDelay="",m.style.opacity="",m.style.visibility=""})),window.nativeHotspotRenderer&&window.nativeHotspotRenderer.updateVisibility&&setTimeout(()=>{window.nativeHotspotRenderer.updateVisibility()},100)}this.activeEchoes.delete(i.id),this.echoAnimations.delete(i.id)},300)},this.config.revealDuration)}handleRippleComplete(e){console.log("[TemporalEchoController] Ripple completed:",e)}updateFPS(){this.frameCount++;const e=performance.now(),t=e-this.lastFPSCheck;t>=1e3&&(this.currentFPS=Math.round(this.frameCount*1e3/t),this.frameCount=0,this.lastFPSCheck=e,this.currentFPS<30&&this.activeEchoes.size>0&&console.warn("[TemporalEchoController] Low FPS detected:",this.currentFPS))}enable(){this.config.enabled=!0,this.gestureAdapter.enable(),this.rippleRenderer.initialize(),console.log("[TemporalEchoController] Enabled")}disable(){this.config.enabled=!1,this.gestureAdapter.disable(),this.rippleRenderer.cleanup(),this.clearActiveEchoes(),console.log("[TemporalEchoController] Disabled")}clearActiveEchoes(){this.activeEchoes.forEach(e=>{const t=this.echoAnimations.get(e);t&&t.element&&(t.element.classList.remove("hotspot-echo-reveal","hotspot-echo-fade-out","black-mode"),t.element.style.animationDelay="",t.element.style.opacity=t.originalOpacity,t.element.style.visibility=t.originalVisibility,t.element.style.display="",t.element.tagName.toLowerCase()==="g"&&t.element.querySelectorAll("path, polygon, polyline").forEach(i=>{i.style.animationDelay="",i.style.opacity="",i.style.visibility=""}))}),this.activeEchoes.clear(),this.echoAnimations.clear()}updateConfig(e){Object.assign(this.config,e),(e.quickTapThreshold!==void 0||e.movementThreshold!==void 0)&&this.gestureAdapter.updateConfig(e)}getFPS(){return this.rippleRenderer?this.rippleRenderer.getFPS():60}getPerformanceMetrics(){return this.rippleRenderer?this.rippleRenderer.getPerformanceMetrics():null}destroy(){this.disable(),this.gestureAdapter.destroy(),this.rippleRenderer.destroy(),this.clearActiveEchoes()}}export{H as default};

import{O as C,i as k}from"./main-DBb4MnIM.js";const h={IDLE:"idle",UNDETERMINED:"undetermined",DOUBLE_TAP_WAIT:"double_tap_wait",HOLD:"hold",PAN:"pan",PINCH:"pinch",CANCELLED:"cancelled"};class R{constructor(e={}){this.config={quickTapThreshold:e.quickTapThreshold||200,doubleTapThreshold:e.doubleTapThreshold||300,holdThreshold:e.holdThreshold||400,movementThreshold:e.movementThreshold||10,mobileMovementThreshold:e.mobileMovementThreshold||20,velocityThreshold:e.velocityThreshold||5,debug:e.debug||!1},this.state=h.IDLE,this.previousState=null,this.gestureData=null,this.activePointers=new Map,this.gestureStartTime=0,this.lastTapTime=0,this.lastTapPosition=null,this.quickTapTimer=null,this.holdTimer=null,this.doubleTapTimer=null,this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.callbacks={onQuickTap:e.onQuickTap||(()=>{}),onDoubleTap:e.onDoubleTap||(()=>{}),onHoldStart:e.onHoldStart||(()=>{}),onHoldEnd:e.onHoldEnd||(()=>{}),onPanStart:e.onPanStart||(()=>{}),onPinchStart:e.onPinchStart||(()=>{}),onGestureCancel:e.onGestureCancel||(()=>{})},this.startGesture=this.startGesture.bind(this),this.updateGesture=this.updateGesture.bind(this),this.endGesture=this.endGesture.bind(this),this.cancelGesture=this.cancelGesture.bind(this)}startGesture(e){const t=e.pointerId||0,s=performance.now();if(this.activePointers.set(t,{startX:e.x,startY:e.y,currentX:e.x,currentY:e.y,startTime:s}),this.activePointers.size>=2){this.transitionTo(h.PINCH),this.callbacks.onPinchStart(this.getGestureData());return}this.gestureStartTime=s,this.gestureData={startX:e.x,startY:e.y,currentX:e.x,currentY:e.y,pointerId:t},this.transitionTo(h.UNDETERMINED),this.startDetectionTimers(),this.log("Gesture started",this.gestureData)}updateGesture(e){const t=e.pointerId||0,s=this.activePointers.get(t);if(!s||this.state===h.IDLE)return;s.currentX=e.x,s.currentY=e.y,this.gestureData&&this.gestureData.pointerId===t&&(this.gestureData.currentX=e.x,this.gestureData.currentY=e.y);const i=e.x-s.startX,o=e.y-s.startY,r=Math.sqrt(i*i+o*o),a=this.isMobile?this.config.mobileMovementThreshold:this.config.movementThreshold;r>a&&this.state===h.UNDETERMINED&&(this.clearDetectionTimers(),this.transitionTo(h.PAN),this.callbacks.onPanStart(this.getGestureData()))}endGesture(e){const t=e.pointerId||0,s=this.activePointers.get(t);if(!s)return;const i=performance.now()-s.startTime;switch(performance.now(),this.activePointers.delete(t),this.state){case h.UNDETERMINED:i<this.config.quickTapThreshold?this.handleQuickTap(e,i):this.cancelGesture("duration_exceeded");break;case h.HOLD:this.callbacks.onHoldEnd({...this.getGestureData(),duration:i}),this.transitionTo(h.IDLE);break;case h.DOUBLE_TAP_WAIT:break;default:this.transitionTo(h.IDLE)}this.activePointers.size===0&&this.state!==h.DOUBLE_TAP_WAIT&&this.resetGesture()}cancelGesture(e="unknown"){this.clearDetectionTimers();const t=this.state;this.transitionTo(h.CANCELLED),this.callbacks.onGestureCancel({previousState:t,reason:e,gestureData:this.getGestureData()}),this.reset()}handleQuickTap(e,t){const s=performance.now(),i={x:e.x,y:e.y};if(this.lastTapTime&&this.lastTapPosition){const o=s-this.lastTapTime,r=this.calculateDistance(i.x,i.y,this.lastTapPosition.x,this.lastTapPosition.y);if(o<this.config.doubleTapThreshold&&r<50){this.clearDetectionTimers(),this.callbacks.onDoubleTap({...this.getGestureData(),duration:t,timeBetweenTaps:o}),this.lastTapTime=0,this.lastTapPosition=null,this.transitionTo(h.IDLE);return}}this.callbacks.onQuickTap({...this.getGestureData(),duration:t,originalEvent:e.originalEvent}),this.lastTapTime=s,this.lastTapPosition=i,this.transitionTo(h.DOUBLE_TAP_WAIT),this.doubleTapTimer=setTimeout(()=>{this.transitionTo(h.IDLE),this.resetGesture()},this.config.doubleTapThreshold)}startDetectionTimers(){this.quickTapTimer=setTimeout(()=>{this.state===h.UNDETERMINED&&this.startHoldDetection()},this.config.quickTapThreshold)}startHoldDetection(){const e=this.config.holdThreshold-this.config.quickTapThreshold;this.holdTimer=setTimeout(()=>{this.state===h.UNDETERMINED&&(this.transitionTo(h.HOLD),this.callbacks.onHoldStart(this.getGestureData()))},e)}clearDetectionTimers(){this.quickTapTimer&&(clearTimeout(this.quickTapTimer),this.quickTapTimer=null),this.holdTimer&&(clearTimeout(this.holdTimer),this.holdTimer=null),this.doubleTapTimer&&(clearTimeout(this.doubleTapTimer),this.doubleTapTimer=null)}transitionTo(e){this.state!==e&&(this.previousState=this.state,this.state=e,this.log(`State transition: ${this.previousState} → ${e}`))}getGestureData(){return this.gestureData?{...this.gestureData,state:this.state,duration:performance.now()-this.gestureStartTime,distance:this.calculateDistance(this.gestureData.currentX,this.gestureData.currentY,this.gestureData.startX,this.gestureData.startY)}:null}calculateDistance(e,t,s,i){const o=s-e,r=i-t;return Math.sqrt(o*o+r*r)}reset(){this.state=h.IDLE,this.previousState=null,this.gestureData=null,this.gestureStartTime=0,this.clearDetectionTimers()}resetGesture(){this.gestureData=null,this.gestureStartTime=0,this.activePointers.clear(),this.clearDetectionTimers()}log(...e){this.config.debug&&console.log("[GestureStateMachine]",...e)}getState(){return this.state}isActive(){return this.state!==h.IDLE&&this.state!==h.CANCELLED}destroy(){this.clearDetectionTimers(),this.activePointers.clear(),this.reset()}}class D{constructor(e={}){this.eventCoordinator=e.eventCoordinator,this.viewer=e.viewer,this.onQuickTap=e.onQuickTap||(()=>{}),this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.gestureStateMachine=new R({quickTapThreshold:200,movementThreshold:this.isMobile?20:10,debug:window.DEBUG_GESTURES||!1,onQuickTap:this.handleQuickTap.bind(this),onDoubleTap:this.handleDoubleTap.bind(this),onHoldStart:this.handleHoldStart.bind(this),onHoldEnd:this.handleHoldEnd.bind(this),onPanStart:this.handlePanStart.bind(this),onPinchStart:this.handlePinchStart.bind(this)}),this.isIntercepting=!1,this.originalHandlers={},this.lastEventTime=0,this.eventThrottle=16,this.enabled=!1,this.setupEventListeners()}setupEventListeners(){if(!this.eventCoordinator){console.warn("[TemporalEchoAdapter] No EventCoordinator provided");return}this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_DOWN,this.handlePointerDown.bind(this)),this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_MOVE,this.handlePointerMove.bind(this)),this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_UP,this.handlePointerUp.bind(this))}handlePointerDown(e){if(e.activePointers>1){this.gestureStateMachine.cancelGesture("multi_touch");return}this.enabled&&(this.gestureStateMachine.startGesture({x:e.x,y:e.y,pointerId:e.pointerId,originalEvent:e.event}),this.isIntercepting=!1)}handlePointerMove(e){const t=performance.now();t-this.lastEventTime<this.eventThrottle||(this.lastEventTime=t,this.gestureStateMachine.updateGesture({x:e.x,y:e.y,pointerId:e.pointerId}),this.gestureStateMachine.getState()==="pan"&&(this.isIntercepting=!1))}handlePointerUp(e){this.gestureStateMachine.endGesture({x:e.x,y:e.y,pointerId:e.pointerId,originalEvent:e.event}),this.isIntercepting=!1}handleQuickTap(e){const t=this.viewer.viewport.pointFromPixel(new C.Point(e.startX,e.startY)),s=this.onQuickTap({x:e.startX,y:e.startY,viewportX:t.x,viewportY:t.y,duration:e.duration});return s?(this.isIntercepting=!0,e.originalEvent&&(e.originalEvent.preventDefault(),e.originalEvent.stopPropagation()),this.handledQuickTap=!0,this.lastQuickTapTime=performance.now(),setTimeout(()=>{this.isIntercepting=!1,this.handledQuickTap=!1},100)):(this.isIntercepting=!1,this.gestureStateMachine.cancelGesture("not_handled")),s}handleDoubleTap(e){}handleHoldStart(e){this.isIntercepting=!1,this.gestureStateMachine.cancelGesture("hold_detected")}handleHoldEnd(e){}handlePanStart(e){this.isIntercepting=!1}handlePinchStart(e){this.isIntercepting=!1}shouldIntercept(){return this.isIntercepting&&this.gestureStateMachine.isActive()&&this.gestureStateMachine.getState()!=="pan"&&this.gestureStateMachine.getState()!=="pinch"}enable(){this.enabled=!0}disable(){this.enabled=!1,this.gestureStateMachine.cancelGesture("disabled"),this.isIntercepting=!1}updateConfig(e){e.quickTapThreshold!==void 0&&(this.gestureStateMachine.config.quickTapThreshold=e.quickTapThreshold),e.movementThreshold!==void 0&&(this.gestureStateMachine.config.movementThreshold=e.movementThreshold)}destroy(){this.gestureStateMachine.destroy(),this.isIntercepting=!1}}class M{constructor(e={}){this.targetFPS=e.targetFPS||30,this.sampleRate=e.sampleRate||100,this.warningThreshold=e.warningThreshold||25,this.criticalThreshold=e.criticalThreshold||20,this.metrics={fps:{current:60,average:60,min:60,max:60,samples:[]},frameTime:{current:16.67,average:16.67,max:16.67,samples:[]},memory:{used:0,limit:0,percentage:0},ripples:{active:0,created:0,completed:0}},this.performanceState="optimal",this.lastFrameTime=performance.now(),this.frameCount=0,this.isMonitoring=!1,this.onPerformanceChange=e.onPerformanceChange||(()=>{}),this.onCriticalPerformance=e.onCriticalPerformance||(()=>{}),console.log("[PerformanceMonitor] Initialized with target FPS:",this.targetFPS)}start(){this.isMonitoring||(this.isMonitoring=!0,this.lastFrameTime=performance.now(),this.rafLoop(),this.startSampling(),console.log("[PerformanceMonitor] Started monitoring"))}rafLoop(){if(!this.isMonitoring)return;const e=performance.now(),t=e-this.lastFrameTime;this.metrics.frameTime.current=t,this.frameCount++,t>0&&(this.metrics.fps.current=Math.round(1e3/t)),this.lastFrameTime=e,requestAnimationFrame(()=>this.rafLoop())}startSampling(){this.samplingInterval=setInterval(()=>{this.sampleMetrics(),this.evaluatePerformance()},this.sampleRate)}sampleMetrics(){performance.now();const e=this.metrics.fps.samples;e.push(this.metrics.fps.current),e.length>10&&e.shift(),this.metrics.fps.average=Math.round(e.reduce((s,i)=>s+i,0)/e.length),this.metrics.fps.min=Math.min(...e),this.metrics.fps.max=Math.max(...e);const t=this.metrics.frameTime.samples;t.push(this.metrics.frameTime.current),t.length>10&&t.shift(),this.metrics.frameTime.average=t.reduce((s,i)=>s+i,0)/t.length,this.metrics.frameTime.max=Math.max(...t),performance.memory&&(this.metrics.memory.used=Math.round(performance.memory.usedJSHeapSize/1048576),this.metrics.memory.limit=Math.round(performance.memory.jsHeapSizeLimit/1048576),this.metrics.memory.percentage=Math.round(performance.memory.usedJSHeapSize/performance.memory.jsHeapSizeLimit*100))}evaluatePerformance(){const e=this.metrics.fps.average,t=this.performanceState;e>=this.targetFPS?this.performanceState="optimal":e>=this.warningThreshold?this.performanceState="degraded":this.performanceState="critical",t!==this.performanceState&&(console.log(`[PerformanceMonitor] State changed: ${t} → ${this.performanceState}`),this.onPerformanceChange(this.performanceState,this.metrics),this.performanceState==="critical"&&this.onCriticalPerformance(this.metrics)),this.performanceState!=="optimal"&&this.frameCount%60===0&&console.warn("[PerformanceMonitor] Performance below target:",{state:this.performanceState,avgFPS:e,targetFPS:this.targetFPS})}rippleCreated(){this.metrics.ripples.created++,this.metrics.ripples.active++}rippleCompleted(){this.metrics.ripples.completed++,this.metrics.ripples.active=Math.max(0,this.metrics.ripples.active-1)}getMetrics(){return{...this.metrics,performanceState:this.performanceState,isTargetMet:this.metrics.fps.average>=this.targetFPS}}getRecommendations(){const e=[];return this.performanceState==="critical"?(e.push("Reduce animation complexity"),e.push("Disable visual effects"),e.push("Limit concurrent ripples to 1")):this.performanceState==="degraded"&&(e.push("Consider reducing ripple radius"),e.push("Simplify animation easing")),this.metrics.memory.percentage>80&&(e.push("High memory usage detected"),e.push("Clear completed animations")),e}stop(){this.isMonitoring=!1,this.samplingInterval&&(clearInterval(this.samplingInterval),this.samplingInterval=null),console.log("[PerformanceMonitor] Stopped monitoring")}reset(){this.metrics.fps.samples=[],this.metrics.frameTime.samples=[],this.metrics.ripples={active:0,created:0,completed:0},this.frameCount=0}destroy(){this.stop(),this.reset()}}class A{constructor(e={}){this.viewer=e.viewer,this.radius=e.radius||200,this.duration=e.duration||800,this.maxRipples=e.maxRipples||3,this.onRippleComplete=e.onRippleComplete||(()=>{}),this.safariOptimizations={useWillChange:!0,use3DTransform:!0,useWebkitPrefix:!0,compositeLayerHints:!0},this.container=null,this.activeRipples=new Map,this.rippleIdCounter=0,this.performanceMonitor=new M({targetFPS:30,warningThreshold:25,criticalThreshold:20,onPerformanceChange:this.handlePerformanceChange.bind(this),onCriticalPerformance:this.handleCriticalPerformance.bind(this)}),this.isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent),this.isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1,console.log("[CSSRippleRenderer] Initialized",{safari:this.isSafari,iOS:this.isIOS,mobile:k()})}initialize(){this.createContainer(),this.injectStyles(),this.performanceMonitor.start(),console.log("[CSSRippleRenderer] Initialized container and styles")}createContainer(){this.container||(this.container=document.createElement("div"),this.container.className="css-ripple-container",this.container.style.cssText=`
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
        `,s=`
            @keyframes ripple-outer {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0.5);
                    opacity: 0.25;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(1.2);
                    opacity: 0;
                }
            }
            
            @keyframes ripple-inner {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 0.5;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(1);
                    opacity: 0;
                }
            }
            
            @keyframes ripple-core {
                0% {
                    transform: translate3d(-50%, -50%, 0) scale(0);
                    opacity: 0.9;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    transform: translate3d(-50%, -50%, 0) scale(0.8);
                    opacity: 0;
                }
            }
        `,i=`
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
            
            /* Multi-layer ripple structure */
            .css-ripple-multi {
                position: absolute;
                pointer-events: none;
                ${this.safariOptimizations.use3DTransform?"transform: translate3d(-50%, -50%, 0);":"transform: translate(-50%, -50%);"}
            }
            
            .ripple-layer {
                position: absolute;
                top: 50%;
                left: 50%;
                border-radius: 50%;
                pointer-events: none;
            }
            
            .ripple-layer-outer {
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: radial-gradient(circle, transparent 60%, rgba(255, 255, 255, 0.1) 100%);
                animation: ripple-outer ${this.duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .ripple-layer-inner {
                border: 2px solid rgba(255, 255, 255, 0.4);
                background: transparent;
                animation: ripple-inner ${this.duration*.85}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .ripple-layer-core {
                border: 3px solid rgba(255, 255, 255, 0.8);
                background: rgba(255, 255, 255, 0.1);
                animation: ripple-core ${this.duration*.7}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
        `,o=`
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
        `,r=`
            /* Adaptive contrast styles based on background luminance */
            .hotspot-echo-reveal.contrast-adaptive-dark path {
                stroke: rgba(255, 255, 255, 0.95) !important;
                stroke-width: 2px !important;
                filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) !important;
            }
            
            .hotspot-echo-reveal.contrast-adaptive-light path {
                stroke: rgba(0, 0, 0, 0.95) !important;
                stroke-width: 2px !important;
                filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.9)) !important;
            }
            
            .hotspot-echo-reveal.contrast-adaptive-medium path {
                stroke: rgba(255, 255, 255, 1) !important;
                stroke-width: 2.5px !important;
                filter: 
                    drop-shadow(0 0 2px rgba(0, 0, 0, 1))
                    drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) !important;
            }
            
            .hotspot-echo-reveal.contrast-adaptive-complex path {
                stroke: rgba(255, 255, 255, 1) !important;
                stroke-width: 3px !important;
                filter: 
                    drop-shadow(1px 1px 1px rgba(0, 0, 0, 1))
                    drop-shadow(-1px -1px 1px rgba(0, 0, 0, 1))
                    drop-shadow(0 0 8px rgba(255, 255, 255, 1)) !important;
            }
            
            /* Mobile optimizations */
            @media (max-width: 768px) {
                .hotspot-echo-reveal.contrast-adaptive-complex path {
                    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1)) !important;
                }
            }
        `;e.textContent=t+s+i+o+r,document.head.appendChild(e)}createRipple(e,t,s=!1){if(s)return this.createMultiLayerRipple(e,t);if(this.activeRipples.size>=this.maxRipples){const l=this.activeRipples.values().next().value;l&&this.removeRipple(l.id)}const i=`ripple-${this.rippleIdCounter++}`,o=document.createElement("div");o.className="css-ripple",o.id=i,this.performanceMonitor.getMetrics().performanceState!=="optimal"&&o.classList.add("low-performance");const a=this.radius*2;return o.style.width=`${a}px`,o.style.height=`${a}px`,o.style.left=`${e}px`,o.style.top=`${t}px`,this.container.appendChild(o),this.activeRipples.set(i,{id:i,element:o,startTime:performance.now()}),setTimeout(()=>{this.removeRipple(i)},this.duration),this.performanceMonitor.rippleCreated(),console.log("[CSSRippleRenderer] Created ripple at",{x:e,y:t},"id:",i),i}createMultiLayerRipple(e,t){if(this.activeRipples.size>=this.maxRipples){const r=this.activeRipples.values().next().value;r&&this.removeRipple(r.id)}const s=`ripple-multi-${this.rippleIdCounter++}`,i=document.createElement("div");return i.className="css-ripple-multi",i.id=s,[{class:"ripple-layer ripple-layer-outer",size:this.radius*2.2},{class:"ripple-layer ripple-layer-inner",size:this.radius*2},{class:"ripple-layer ripple-layer-core",size:this.radius*1.5}].forEach(r=>{const a=document.createElement("div");a.className=r.class,a.style.width=`${r.size}px`,a.style.height=`${r.size}px`,i.appendChild(a)}),i.style.left=`${e}px`,i.style.top=`${t}px`,this.container.appendChild(i),this.activeRipples.set(s,{id:s,element:i,startTime:performance.now()}),setTimeout(()=>{this.removeRipple(s)},this.duration),this.performanceMonitor.rippleCreated(),console.log("[CSSRippleRenderer] Created multi-layer ripple at",{x:e,y:t},"id:",s),s}removeRipple(e){const t=this.activeRipples.get(e);t&&(t.element&&t.element.parentNode&&t.element.remove(),this.activeRipples.delete(e),this.performanceMonitor.rippleCompleted(),this.onRippleComplete(e))}handlePerformanceChange(e,t){console.log(`[CSSRippleRenderer] Performance state: ${e}`,t.fps),e==="critical"?(this.maxRipples=1,this.duration=600):e==="degraded"?(this.maxRipples=2,this.duration=700):(this.maxRipples=3,this.duration=800)}handleCriticalPerformance(e){console.warn("[CSSRippleRenderer] Critical performance detected!",e),this.activeRipples.size>1&&Array.from(this.activeRipples.keys()).slice(0,-1).forEach(s=>this.removeRipple(s))}getFPS(){return this.performanceMonitor.getMetrics().fps.current}getPerformanceMetrics(){return this.performanceMonitor.getMetrics()}cleanup(){this.activeRipples.forEach(e=>{e.element&&e.element.parentNode&&e.element.remove()}),this.activeRipples.clear(),this.performanceMonitor.stop()}destroy(){this.cleanup(),this.performanceMonitor.destroy(),this.container&&this.container.parentNode&&(this.container.remove(),this.container=null);const e=document.getElementById("css-ripple-styles");e&&e.remove(),console.log("[CSSRippleRenderer] Destroyed")}}class I{constructor(e){this.viewer=e,this.canvas=null,this.context=null,this.cache=new Map,this.initializeCanvas()}initializeCanvas(){this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d",{willReadFrequently:!0})}calculateLuminance(e,t,s){const[i,o,r]=[e,t,s].map(a=>(a/=255,a<=.03928?a/12.92:Math.pow((a+.055)/1.055,2.4)));return i*.2126+o*.7152+r*.0722}calculateContrastRatio(e,t){const s=Math.max(e,t),i=Math.min(e,t);return(s+.05)/(i+.05)}async sampleBackgroundLuminance(e,t,s=50){const i=`${Math.round(e)}_${Math.round(t)}_${s}`;if(this.cache.has(i))return this.cache.get(i);try{if(!await this.captureViewportArea(e,t,s))return this.getDefaultLuminanceData();const r=this.getSamplePoints(s),a=[];for(const p of r){const u=s+p.x,n=s+p.y,c=this.context.getImageData(u,n,1,1).data,f=this.calculateLuminance(c[0],c[1],c[2]);a.push(f)}const l=a.reduce((p,u)=>p+u,0)/a.length,m=Math.min(...a),g=Math.max(...a),b=this.calculateVariance(a,l),v={averageLuminance:l,minLuminance:m,maxLuminance:g,variance:b,isDark:l<.5,isHighContrast:g-m>.5,recommendedEffect:this.selectHotspotEffect(l,b)};return this.cache.set(i,v),v}catch(o){return console.error("Error sampling background luminance:",o),this.getDefaultLuminanceData()}}async captureViewportArea(e,t,s){return null}getSamplePoints(e){const t=[];t.push({x:0,y:0});for(let o=1;o<=3;o++){const r=e*o/3;for(let a=0;a<8;a++){const l=a/8*Math.PI*2;t.push({x:Math.cos(l)*r,y:Math.sin(l)*r})}}return t}calculateVariance(e,t){return e.map(i=>Math.pow(i-t,2)).reduce((i,o)=>i+o,0)/e.length}selectHotspotEffect(e,t){return t>.1?"contrast-adaptive-complex":e<.3?"contrast-adaptive-dark":e>.7?"contrast-adaptive-light":"contrast-adaptive-medium"}getDefaultLuminanceData(){return{averageLuminance:.5,minLuminance:0,maxLuminance:1,variance:.1,isDark:!1,isHighContrast:!0,recommendedEffect:"contrast-adaptive-medium"}}clearCache(){this.cache.clear()}getCacheSize(){return this.cache.size}}class H{constructor(e={}){this.viewer=e.viewer,this.eventCoordinator=e.eventCoordinator,this.hotspotRenderer=e.hotspotRenderer,this.stateManager=e.stateManager,this.config={echoRadius:e.echoRadius||200,echoDelay:e.echoDelay||0,echoDuration:e.echoDuration||800,maxSimultaneous:e.maxSimultaneous||10,staggerDelay:e.staggerDelay||30,revealDuration:e.revealDuration||2e3,enabled:e.enabled!==!1,mobileMaxHotspots:e.mobileMaxHotspots||8,useAquaticEffect:!1},this.activeEchoes=new Set,this.echoAnimations=new Map,this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.initializeGestureAdapter(),this.initializeRippleRenderer(),this.initializeContrastDetection(),this.frameCount=0,this.lastFPSCheck=performance.now(),this.currentFPS=60,console.log("[TemporalEchoController] Initialized",this.config),window.temporalEchoController=this,window.debugRevealHotspot=t=>{const i={hotspot:{id:t},centerX:100,centerY:100};this.revealSingleHotspot(i,{},0)},window.debugShowAllHotspots=()=>{const t=document.querySelectorAll("[data-hotspot-id]");console.log(`[Debug] Found ${t.length} hotspot elements`),t.forEach((s,i)=>{i<5&&console.log(`[Debug] Hotspot ${i}:`,{id:s.getAttribute("data-hotspot-id"),tagName:s.tagName,className:s.className,opacity:window.getComputedStyle(s).opacity,visibility:window.getComputedStyle(s).visibility,display:window.getComputedStyle(s).display})})}}initializeGestureAdapter(){this.gestureAdapter=new D({eventCoordinator:this.eventCoordinator,viewer:this.viewer,onQuickTap:this.handleQuickTap.bind(this)}),this.config.enabled&&this.gestureAdapter.enable()}initializeRippleRenderer(){this.rippleRenderer=new A({viewer:this.viewer,radius:this.config.echoRadius,duration:this.config.echoDuration,maxRipples:3,onRippleComplete:this.handleRippleComplete.bind(this)}),this.config.enabled&&this.rippleRenderer.initialize(),window.cssRippleRenderer=this.rippleRenderer}initializeContrastDetection(){this.contrastDetection=new I(this.viewer),window.contrastDetection=this.contrastDetection}handleQuickTap(e){if(console.log("[TemporalEchoController] handleQuickTap called, enabled:",this.config.enabled),!this.config.enabled)return console.log("[TemporalEchoController] Echo disabled, skipping"),!1;if(!this.isMobile)return console.log("[TemporalEchoController] Not on mobile, skipping echo"),!1;const t=this.viewer.element.getBoundingClientRect(),s=new C.Point(e.x-t.left,e.y-t.top),i=this.viewer.viewport.pointFromPixel(s),o=this.viewer.viewport.viewportToImageCoordinates(i),r=window.nativeHotspotRenderer&&window.nativeHotspotRenderer.engine.findSmallestHotspotAtPoint(o);if(r&&this.isHotspotRevealed(r.id))return console.log("[TemporalEchoController] Tapped on revealed hotspot, letting click handler take over:",r.id),!1;console.log("[TemporalEchoController] Quick tap detected on mobile, triggering echo",e),this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_TAP,{x:e.x,y:e.y,viewportX:e.viewportX,viewportY:e.viewportY});const a=this.findHotspotsInRadius(e,this.config.echoRadius);return this.rippleRenderer.createRipple(e.x,e.y),a.length>0?(console.log(`[TemporalEchoController] Found ${a.length} hotspots in radius`),this.revealHotspots(a,e)):console.log("[TemporalEchoController] No hotspots found in echo radius"),this.updateFPS(),!0}findHotspotsInRadius(e,t){return this.linearHotspotSearch(e,t)}linearHotspotSearch(e,t){const s=[],i=this.viewer.element.getBoundingClientRect(),o=new C.Point(e.x-i.left,e.y-i.top),r=this.viewer.viewport.pointFromPixel(o),a=this.viewer.viewport.viewportToImageCoordinates(r);console.log("[TemporalEchoController] Searching for hotspots at:",{pixelCoords:{x:e.x,y:e.y},viewportCoords:{x:r.x,y:r.y},imageCoords:{x:a.x,y:a.y}});const l=this.stateManager.getAllOverlays();console.log("[TemporalEchoController] Total overlays available:",l.size);let m=0;l.forEach((b,v)=>{const p=b.hotspot;if(!p||!p.coordinates||p.coordinates.length===0)return;m++;let u=0,n=0;const c=p.shape==="multipolygon"?p.coordinates[0]:p.coordinates;c.forEach(([S,P])=>{u+=S,n+=P}),u/=c.length,n/=c.length;const f=u-a.x,d=n-a.y,y=Math.sqrt(f*f+d*d),x=this.viewer.viewport.pointFromPixel(new C.Point(t,0)),E=this.viewer.viewport.viewportToImageCoordinates(x),T=Math.abs(E.x);if(m<=3&&console.log(`[TemporalEchoController] Hotspot ${v}:`,{hotspotCenter:{x:u,y:n},tapImagePoint:{x:a.x,y:a.y},distanceInImageSpace:y,radiusInImageSpace:T,inRadius:y<=T}),y<=T){const S=this.viewer.viewport.imageToViewportCoordinates(new C.Point(u,n)),P=this.viewer.viewport.pixelFromPoint(S);s.push({hotspot:p,distance:y,centerX:P.x+i.left,centerY:P.y+i.top})}}),console.log(`[TemporalEchoController] Checked ${m} hotspots, found ${s.length} in radius`),s.sort((b,v)=>b.distance-v.distance);const g=this.isMobile?this.config.mobileMaxHotspots:this.config.maxSimultaneous;return s.slice(0,g)}revealHotspots(e,t){this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_START,{count:e.length,origin:t});const s=e,i=s.map(r=>r.hotspot.id);window.nativeHotspotRenderer&&window.nativeHotspotRenderer.activeHotspotManager&&(console.log("[TemporalEchoController] Preparing",i.length,"hotspots for reveal animation"),window.nativeHotspotRenderer.activeHotspotManager.forceShowHotspots(i,{maxForceShow:this.isMobile?this.config.mobileMaxHotspots:this.config.maxSimultaneous})),console.log("[TemporalEchoController] Using standard staggered animation"),s.forEach((r,a)=>{setTimeout(()=>{this.revealSingleHotspot(r,t,a)},a*this.config.staggerDelay)});const o=this.config.revealDuration+300+s.length*this.config.staggerDelay;setTimeout(()=>{this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_END,{count:s.length})},o)}findHotspotElement(e){let t=null;const s=this.stateManager.getOverlay(e);if(s&&s.element&&(t=s.element),!t){const i=document.querySelectorAll(".openseadragon-svg-overlay, .hotspot-overlay-svg, svg");for(const o of i)if(t=o.querySelector(`[data-hotspot-id="${e}"]`),t)break}if(t||(t=document.getElementById(`hotspot-${e}`)),!t){const i=document.querySelectorAll(`g[data-hotspot-id="${e}"]`);i.length>0&&(t=i[0])}return t}revealSingleHotspot(e,t,s){var u;const i=e.hotspot||e;console.log("[TemporalEchoController] revealSingleHotspot called for:",i.id);let o=null;const r=this.stateManager.getOverlay(i.id);if(r&&r.element&&(o=r.element,console.log("[TemporalEchoController] Found element via state manager")),!o){const n=document.querySelectorAll(".openseadragon-svg-overlay, .hotspot-overlay-svg, svg");for(const c of n)if(o=c.querySelector(`[data-hotspot-id="${i.id}"]`),o){console.log("[TemporalEchoController] Found element in container:",c.className);break}}if(o||(o=document.getElementById(`hotspot-${i.id}`),o&&console.log("[TemporalEchoController] Found element by ID")),!o){const n=document.querySelectorAll(`g[data-hotspot-id="${i.id}"]`);n.length>0&&(o=n[0],console.log("[TemporalEchoController] Found g element with hotspot id"))}if(!o){console.warn("[TemporalEchoController] No element found for hotspot",i.id);return}const a=o.style.opacity||"",l=o.style.visibility||"",m=o.classList.contains("hotspot-hidden"),g=o.classList.contains("hotspot-visible"),b=["blackOnBlack","pigmentLinerNeutral","pigmentLinerWarm","pigmentLinerCool"],v=(u=window.nativeHotspotRenderer)==null?void 0:u.currentPalette,p=b.includes(v);if(console.log("[TemporalEchoController] Current palette:",v,"isDarkMode:",p),this.activeEchoes.has(i.id)){console.log("[TemporalEchoController] Hotspot already animating, skipping:",i.id);return}o.classList.remove("hotspot-echo-reveal","hotspot-echo-fade-out","black-mode"),o.style.animationDelay="",o.tagName.toLowerCase()==="g"&&o.querySelectorAll("path, polygon, polyline").forEach(c=>{c.style.animationDelay=""}),requestAnimationFrame(async()=>{o.classList.add("hotspot-echo-reveal"),p&&o.classList.add("black-mode");let n=localStorage.getItem("borderStyle")||"default";if(console.log("[TemporalEchoController] Initial borderStyle from localStorage:",n),console.log("[TemporalEchoController] isMobile:",this.isMobile),console.log("[TemporalEchoController] isBlackMode:",p),this.isMobile&&n==="default"&&(n="emboss",console.log("[TemporalEchoController] Overriding to emboss for mobile")),p&&(n==="default"||n==="pigment")&&(n="emboss",console.log("[TemporalEchoController] Forcing emboss style for dark palette visibility")),console.log("[TemporalEchoController] Final borderStyle to apply:",n),n!=="default")o.classList.add(`border-${n}`),console.log("[TemporalEchoController] Applied border style:",n),console.log("[TemporalEchoController] Element classes:",o.className),setTimeout(()=>{o.querySelectorAll("path").forEach((E,T)=>{const S=window.getComputedStyle(E);console.log(`[TemporalEchoController] Path ${T} classes:`,E.className),console.log(`[TemporalEchoController] Path ${T} stroke:`,S.stroke),console.log(`[TemporalEchoController] Path ${T} strokeWidth:`,S.strokeWidth),console.log(`[TemporalEchoController] Path ${T} filter:`,S.filter)});const d=document.createElement("div");d.className="hotspot-echo-reveal border-gradient",document.body.appendChild(d);const y=document.createElement("div");y.className="main-path",d.appendChild(y);const x=window.getComputedStyle(y);console.log("[TemporalEchoController] Test element filter:",x.filter),document.body.removeChild(d)},100),n==="gradient"&&!document.getElementById("adaptive-gradient")&&this.injectGradientDef(),n==="double"&&o.querySelector("path")&&this.createDoubleContour(o),n==="pigment"&&console.log("[TemporalEchoController] Applied pigment liner style");else if(this.contrastDetection&&e.centerX&&e.centerY)try{const f=await this.contrastDetection.sampleBackgroundLuminance(e.centerX,e.centerY,50);o.classList.add(f.recommendedEffect),console.log("[TemporalEchoController] Applied contrast effect:",f.recommendedEffect)}catch{console.warn("[TemporalEchoController] Contrast detection failed, using default"),o.classList.add("contrast-adaptive-medium")}const c=s*this.config.staggerDelay;o.style.animationDelay=`${c}ms`,console.log(`[TemporalEchoController] Hotspot ${i.id} animation delay: ${c}ms (index: ${s})`),o.tagName.toLowerCase()==="g"&&o.querySelectorAll("path, polygon, polyline").forEach(d=>{d.style.animationDelay=`${c}ms`}),o.offsetHeight,console.log("[TemporalEchoController] Classes added:",o.classList.toString()),this.activeEchoes.add(i.id),this.echoAnimations.set(i.id,{element:o,originalOpacity:a,originalVisibility:l,wasHidden:m,wasVisible:g,isRevealed:!0}),o.setAttribute("data-hotspot-revealed","true")}),setTimeout(()=>{o.classList.remove("hotspot-echo-reveal"),o.style.animationDelay="",o.classList.add("hotspot-echo-fade-out"),setTimeout(()=>{o.classList.remove("hotspot-echo-fade-out","black-mode"),o.classList.remove("contrast-adaptive-dark","contrast-adaptive-light","contrast-adaptive-medium","contrast-adaptive-complex"),o.classList.remove("border-gradient","border-double","border-emboss","border-pulse","border-pigment");const n=this.stateManager.getSelectedHotspot();if(!n||n.id!==i.id){const c=this.echoAnimations.get(i.id);c&&(o.style.opacity=c.originalOpacity,o.style.visibility=c.originalVisibility,o.style.display="",c.wasHidden&&o.classList.add("hotspot-hidden"),c.wasVisible&&o.classList.add("hotspot-visible"),o.tagName.toLowerCase()==="g"&&o.querySelectorAll("path, polygon, polyline").forEach(d=>{d.style.animationDelay="",d.style.opacity="",d.style.visibility=""})),window.nativeHotspotRenderer&&window.nativeHotspotRenderer.updateVisibility&&setTimeout(()=>{window.nativeHotspotRenderer.updateVisibility()},100)}o.removeAttribute("data-hotspot-revealed"),this.activeEchoes.delete(i.id),this.echoAnimations.delete(i.id)},300)},this.config.revealDuration)}isHotspotRevealed(e){const t=this.echoAnimations.get(e);return t&&t.isRevealed===!0}handleRippleComplete(e){console.log("[TemporalEchoController] Ripple completed:",e)}updateFPS(){this.frameCount++;const e=performance.now(),t=e-this.lastFPSCheck;t>=1e3&&(this.currentFPS=Math.round(this.frameCount*1e3/t),this.frameCount=0,this.lastFPSCheck=e,this.currentFPS<30&&this.activeEchoes.size>0&&console.warn("[TemporalEchoController] Low FPS detected:",this.currentFPS))}enable(){this.config.enabled=!0,this.gestureAdapter.enable(),this.rippleRenderer.initialize(),console.log("[TemporalEchoController] Enabled")}disable(){this.config.enabled=!1,this.gestureAdapter.disable(),this.rippleRenderer.cleanup(),this.clearActiveEchoes(),console.log("[TemporalEchoController] Disabled")}clearActiveEchoes(){this.activeEchoes.forEach(e=>{const t=this.echoAnimations.get(e);t&&t.element&&(t.element.classList.remove("hotspot-echo-reveal","hotspot-echo-fade-out","black-mode"),t.element.style.animationDelay="",t.element.style.opacity=t.originalOpacity,t.element.style.visibility=t.originalVisibility,t.element.style.display="",t.element.tagName.toLowerCase()==="g"&&t.element.querySelectorAll("path, polygon, polyline").forEach(i=>{i.style.animationDelay="",i.style.opacity="",i.style.visibility=""}))}),this.activeEchoes.clear(),this.echoAnimations.clear()}updateConfig(e){Object.assign(this.config,e),(e.quickTapThreshold!==void 0||e.movementThreshold!==void 0)&&this.gestureAdapter.updateConfig(e)}getFPS(){return this.rippleRenderer?this.rippleRenderer.getFPS():60}getPerformanceMetrics(){return this.rippleRenderer?this.rippleRenderer.getPerformanceMetrics():null}injectGradientDef(){if(document.getElementById("adaptive-gradient"))return;const e="http://www.w3.org/2000/svg",t=document.createElementNS(e,"svg");t.style.position="absolute",t.style.width="0",t.style.height="0",t.style.overflow="hidden";const s=document.createElementNS(e,"defs"),i=document.createElementNS(e,"linearGradient");i.id="adaptive-gradient",i.setAttribute("x1","0%"),i.setAttribute("y1","0%"),i.setAttribute("x2","100%"),i.setAttribute("y2","100%");const o=document.createElementNS(e,"stop");o.setAttribute("offset","0%"),o.setAttribute("stop-color","white"),o.setAttribute("stop-opacity","1");const r=document.createElementNS(e,"stop");r.setAttribute("offset","50%"),r.setAttribute("stop-color","gray"),r.setAttribute("stop-opacity","0.8");const a=document.createElementNS(e,"stop");a.setAttribute("offset","100%"),a.setAttribute("stop-color","black"),a.setAttribute("stop-opacity","1"),i.appendChild(o),i.appendChild(r),i.appendChild(a),s.appendChild(i),t.appendChild(s),document.body.appendChild(t)}createDoubleContour(e){e.querySelectorAll("path").forEach(s=>{if(s.nextSibling&&s.nextSibling.classList&&s.nextSibling.classList.contains("outer-stroke"))return;const i=s.cloneNode(!0);i.classList.add("outer-stroke"),i.style.zIndex="-1",s.parentNode.insertBefore(i,s)})}injectPigmentTextureFilter(){const e="http://www.w3.org/2000/svg",t=document.createElementNS(e,"svg");t.style.position="absolute",t.style.width="0",t.style.height="0",t.style.overflow="hidden",t.setAttribute("aria-hidden","true");const s=document.createElementNS(e,"defs"),i=document.createElementNS(e,"filter");i.id="pigmentTexture",i.setAttribute("x","-50%"),i.setAttribute("y","-50%"),i.setAttribute("width","200%"),i.setAttribute("height","200%"),i.setAttribute("color-interpolation-filters","sRGB");const o=document.createElementNS(e,"feTurbulence");o.setAttribute("type","turbulence"),o.setAttribute("baseFrequency","0.5 0.1"),o.setAttribute("numOctaves","2"),o.setAttribute("seed","5"),o.setAttribute("result","turbulence");const r=document.createElementNS(e,"feDisplacementMap");r.setAttribute("in","SourceGraphic"),r.setAttribute("in2","turbulence"),r.setAttribute("scale","2"),r.setAttribute("xChannelSelector","R"),r.setAttribute("yChannelSelector","G"),r.setAttribute("result","displaced");const a=document.createElementNS(e,"feMorphology");a.setAttribute("in","displaced"),a.setAttribute("operator","dilate"),a.setAttribute("radius","0.5"),a.setAttribute("result","dilated");const l=document.createElementNS(e,"feComposite");l.setAttribute("in","dilated"),l.setAttribute("in2","displaced"),l.setAttribute("operator","over"),l.setAttribute("result","final");const m=document.createElementNS(e,"feComponentTransfer");m.setAttribute("in","final");const g=document.createElementNS(e,"feFuncA");g.setAttribute("type","discrete"),g.setAttribute("tableValues","0 1"),m.appendChild(g),i.appendChild(o),i.appendChild(r),i.appendChild(a),i.appendChild(l),i.appendChild(m),s.appendChild(i),t.appendChild(s),document.body.appendChild(t),console.log("[TemporalEchoController] Injected pigment texture filter")}destroy(){this.disable(),this.gestureAdapter.destroy(),this.rippleRenderer.destroy(),this.clearActiveEchoes()}}window.updateBorderStyle=function(w){console.log("[TemporalEchoController] Border style updated to:",w)};export{H as default};

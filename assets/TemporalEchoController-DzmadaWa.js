import{O as x,i as A}from"./main-BYgKotJp.js";import{R as M}from"./viewerSetup-BY6l_H9C.js";const m={IDLE:"idle",UNDETERMINED:"undetermined",DOUBLE_TAP_WAIT:"double_tap_wait",HOLD:"hold",PAN:"pan",PINCH:"pinch",CANCELLED:"cancelled"};class I{constructor(e={}){this.config={quickTapThreshold:e.quickTapThreshold||50,doubleTapThreshold:e.doubleTapThreshold||300,holdThreshold:e.holdThreshold||400,movementThreshold:e.movementThreshold||10,mobileMovementThreshold:e.mobileMovementThreshold||20,velocityThreshold:e.velocityThreshold||5,debug:e.debug||!1},this.state=m.IDLE,this.previousState=null,this.gestureData=null,this.activePointers=new Map,this.gestureStartTime=0,this.lastTapTime=0,this.lastTapPosition=null,this.quickTapTimer=null,this.holdTimer=null,this.doubleTapTimer=null,this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.callbacks={onQuickTap:e.onQuickTap||(()=>{}),onDoubleTap:e.onDoubleTap||(()=>{}),onHoldStart:e.onHoldStart||(()=>{}),onHoldEnd:e.onHoldEnd||(()=>{}),onPanStart:e.onPanStart||(()=>{}),onPinchStart:e.onPinchStart||(()=>{}),onGestureCancel:e.onGestureCancel||(()=>{})},this.startGesture=this.startGesture.bind(this),this.updateGesture=this.updateGesture.bind(this),this.endGesture=this.endGesture.bind(this),this.cancelGesture=this.cancelGesture.bind(this)}startGesture(e){const t=e.pointerId||0,s=performance.now();if(this.activePointers.set(t,{startX:e.x,startY:e.y,currentX:e.x,currentY:e.y,startTime:s}),this.activePointers.size>=2){this.transitionTo(m.PINCH),this.callbacks.onPinchStart(this.getGestureData());return}this.gestureStartTime=s,this.gestureData={startX:e.x,startY:e.y,currentX:e.x,currentY:e.y,pointerId:t},this.transitionTo(m.UNDETERMINED),this.startDetectionTimers(),this.log("Gesture started",this.gestureData)}updateGesture(e){const t=e.pointerId||0,s=this.activePointers.get(t);if(!s||this.state===m.IDLE)return;s.currentX=e.x,s.currentY=e.y,this.gestureData&&this.gestureData.pointerId===t&&(this.gestureData.currentX=e.x,this.gestureData.currentY=e.y);const o=e.x-s.startX,i=e.y-s.startY,r=Math.sqrt(o*o+i*i),a=this.isMobile?this.config.mobileMovementThreshold:this.config.movementThreshold;r>a&&this.state===m.UNDETERMINED&&(this.clearDetectionTimers(),this.transitionTo(m.PAN),this.callbacks.onPanStart(this.getGestureData()))}endGesture(e){const t=e.pointerId||0,s=this.activePointers.get(t);if(!s)return;const o=performance.now()-s.startTime;switch(performance.now(),this.activePointers.delete(t),this.state){case m.UNDETERMINED:o<this.config.quickTapThreshold?this.handleQuickTap(e,o):this.cancelGesture("duration_exceeded");break;case m.HOLD:this.callbacks.onHoldEnd({...this.getGestureData(),duration:o}),this.transitionTo(m.IDLE);break;case m.DOUBLE_TAP_WAIT:break;default:this.transitionTo(m.IDLE)}this.activePointers.size===0&&this.state!==m.DOUBLE_TAP_WAIT&&this.resetGesture()}cancelGesture(e="unknown"){this.clearDetectionTimers();const t=this.state;this.transitionTo(m.CANCELLED),this.callbacks.onGestureCancel({previousState:t,reason:e,gestureData:this.getGestureData()}),this.reset()}handleQuickTap(e,t){const s=performance.now(),o={x:e.x,y:e.y};if(this.lastTapTime&&this.lastTapPosition){const i=s-this.lastTapTime,r=this.calculateDistance(o.x,o.y,this.lastTapPosition.x,this.lastTapPosition.y);if(i<this.config.doubleTapThreshold&&r<50){this.clearDetectionTimers(),this.callbacks.onDoubleTap({...this.getGestureData(),duration:t,timeBetweenTaps:i}),this.lastTapTime=0,this.lastTapPosition=null,this.transitionTo(m.IDLE);return}}this.callbacks.onQuickTap({...this.getGestureData(),duration:t,originalEvent:e.originalEvent}),this.lastTapTime=s,this.lastTapPosition=o,this.transitionTo(m.DOUBLE_TAP_WAIT),this.doubleTapTimer=setTimeout(()=>{this.transitionTo(m.IDLE),this.resetGesture()},this.config.doubleTapThreshold)}startDetectionTimers(){this.quickTapTimer=setTimeout(()=>{this.state===m.UNDETERMINED&&this.startHoldDetection()},this.config.quickTapThreshold)}startHoldDetection(){const e=this.config.holdThreshold-this.config.quickTapThreshold;this.holdTimer=setTimeout(()=>{this.state===m.UNDETERMINED&&(this.transitionTo(m.HOLD),this.callbacks.onHoldStart(this.getGestureData()))},e)}clearDetectionTimers(){this.quickTapTimer&&(clearTimeout(this.quickTapTimer),this.quickTapTimer=null),this.holdTimer&&(clearTimeout(this.holdTimer),this.holdTimer=null),this.doubleTapTimer&&(clearTimeout(this.doubleTapTimer),this.doubleTapTimer=null)}transitionTo(e){this.state!==e&&(this.previousState=this.state,this.state=e,this.log(`State transition: ${this.previousState} → ${e}`))}getGestureData(){return this.gestureData?{...this.gestureData,state:this.state,duration:performance.now()-this.gestureStartTime,distance:this.calculateDistance(this.gestureData.currentX,this.gestureData.currentY,this.gestureData.startX,this.gestureData.startY)}:null}calculateDistance(e,t,s,o){const i=s-e,r=o-t;return Math.sqrt(i*i+r*r)}reset(){this.state=m.IDLE,this.previousState=null,this.gestureData=null,this.gestureStartTime=0,this.clearDetectionTimers()}resetGesture(){this.gestureData=null,this.gestureStartTime=0,this.activePointers.clear(),this.clearDetectionTimers()}log(...e){this.config.debug&&console.log("[GestureStateMachine]",...e)}getState(){return this.state}isActive(){return this.state!==m.IDLE&&this.state!==m.CANCELLED}destroy(){this.clearDetectionTimers(),this.activePointers.clear(),this.reset()}}class D{constructor(e={}){this.eventCoordinator=e.eventCoordinator,this.viewer=e.viewer,this.onQuickTap=e.onQuickTap||(()=>{}),this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.gestureStateMachine=new I({quickTapThreshold:200,movementThreshold:this.isMobile?20:10,debug:window.DEBUG_GESTURES||!1,onQuickTap:this.handleQuickTap.bind(this),onDoubleTap:this.handleDoubleTap.bind(this),onHoldStart:this.handleHoldStart.bind(this),onHoldEnd:this.handleHoldEnd.bind(this),onPanStart:this.handlePanStart.bind(this),onPinchStart:this.handlePinchStart.bind(this)}),this.isIntercepting=!1,this.originalHandlers={},this.lastEventTime=0,this.eventThrottle=16,this.enabled=!1,this.setupEventListeners()}setupEventListeners(){if(!this.eventCoordinator){console.warn("[TemporalEchoAdapter] No EventCoordinator provided");return}this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_DOWN,this.handlePointerDown.bind(this)),this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_MOVE,this.handlePointerMove.bind(this)),this.eventCoordinator.on(this.eventCoordinator.eventTypes.POINTER_UP,this.handlePointerUp.bind(this))}handlePointerDown(e){if(e.activePointers>1){this.gestureStateMachine.cancelGesture("multi_touch");return}this.enabled&&(this.gestureStateMachine.startGesture({x:e.x,y:e.y,pointerId:e.pointerId,originalEvent:e.event}),this.isIntercepting=!1)}handlePointerMove(e){const t=performance.now();t-this.lastEventTime<this.eventThrottle||(this.lastEventTime=t,this.gestureStateMachine.updateGesture({x:e.x,y:e.y,pointerId:e.pointerId}),this.gestureStateMachine.getState()==="pan"&&(this.isIntercepting=!1))}handlePointerUp(e){this.gestureStateMachine.endGesture({x:e.x,y:e.y,pointerId:e.pointerId,originalEvent:e.event}),this.isIntercepting=!1}handleQuickTap(e){const t=this.viewer.viewport.pointFromPixel(new x.Point(e.startX,e.startY)),s=this.onQuickTap({x:e.startX,y:e.startY,viewportX:t.x,viewportY:t.y,duration:e.duration});return s?(this.isIntercepting=!0,e.originalEvent&&(e.originalEvent.preventDefault(),e.originalEvent.stopPropagation()),this.handledQuickTap=!0,this.lastQuickTapTime=performance.now(),setTimeout(()=>{this.isIntercepting=!1,this.handledQuickTap=!1},100)):(this.isIntercepting=!1,this.gestureStateMachine.cancelGesture("not_handled")),s}handleDoubleTap(e){}handleHoldStart(e){this.isIntercepting=!1,this.gestureStateMachine.cancelGesture("hold_detected")}handleHoldEnd(e){}handlePanStart(e){this.isIntercepting=!1}handlePinchStart(e){this.isIntercepting=!1}shouldIntercept(){return this.isIntercepting&&this.gestureStateMachine.isActive()&&this.gestureStateMachine.getState()!=="pan"&&this.gestureStateMachine.getState()!=="pinch"}enable(){this.enabled=!0}disable(){this.enabled=!1,this.gestureStateMachine.cancelGesture("disabled"),this.isIntercepting=!1}updateConfig(e){e.quickTapThreshold!==void 0&&(this.gestureStateMachine.config.quickTapThreshold=e.quickTapThreshold),e.movementThreshold!==void 0&&(this.gestureStateMachine.config.movementThreshold=e.movementThreshold)}destroy(){this.gestureStateMachine.destroy(),this.isIntercepting=!1}}class L{constructor(e={}){this.targetFPS=e.targetFPS||30,this.sampleRate=e.sampleRate||100,this.warningThreshold=e.warningThreshold||25,this.criticalThreshold=e.criticalThreshold||20,this.metrics={fps:{current:60,average:60,min:60,max:60,samples:[]},frameTime:{current:16.67,average:16.67,max:16.67,samples:[]},memory:{used:0,limit:0,percentage:0},ripples:{active:0,created:0,completed:0}},this.performanceState="optimal",this.lastFrameTime=performance.now(),this.frameCount=0,this.isMonitoring=!1,this.onPerformanceChange=e.onPerformanceChange||(()=>{}),this.onCriticalPerformance=e.onCriticalPerformance||(()=>{}),console.log("[PerformanceMonitor] Initialized with target FPS:",this.targetFPS)}start(){this.isMonitoring||(this.isMonitoring=!0,this.lastFrameTime=performance.now(),this.rafLoop(),this.startSampling(),console.log("[PerformanceMonitor] Started monitoring"))}rafLoop(){if(!this.isMonitoring)return;const e=performance.now(),t=e-this.lastFrameTime;this.metrics.frameTime.current=t,this.frameCount++,t>0&&(this.metrics.fps.current=Math.round(1e3/t)),this.lastFrameTime=e,requestAnimationFrame(()=>this.rafLoop())}startSampling(){this.samplingInterval=setInterval(()=>{this.sampleMetrics(),this.evaluatePerformance()},this.sampleRate)}sampleMetrics(){performance.now();const e=this.metrics.fps.samples;e.push(this.metrics.fps.current),e.length>10&&e.shift(),this.metrics.fps.average=Math.round(e.reduce((s,o)=>s+o,0)/e.length),this.metrics.fps.min=Math.min(...e),this.metrics.fps.max=Math.max(...e);const t=this.metrics.frameTime.samples;t.push(this.metrics.frameTime.current),t.length>10&&t.shift(),this.metrics.frameTime.average=t.reduce((s,o)=>s+o,0)/t.length,this.metrics.frameTime.max=Math.max(...t),performance.memory&&(this.metrics.memory.used=Math.round(performance.memory.usedJSHeapSize/1048576),this.metrics.memory.limit=Math.round(performance.memory.jsHeapSizeLimit/1048576),this.metrics.memory.percentage=Math.round(performance.memory.usedJSHeapSize/performance.memory.jsHeapSizeLimit*100))}evaluatePerformance(){const e=this.metrics.fps.average,t=this.performanceState;e>=this.targetFPS?this.performanceState="optimal":e>=this.warningThreshold?this.performanceState="degraded":this.performanceState="critical",t!==this.performanceState&&(console.log(`[PerformanceMonitor] State changed: ${t} → ${this.performanceState}`),this.onPerformanceChange(this.performanceState,this.metrics),this.performanceState==="critical"&&this.onCriticalPerformance(this.metrics)),this.performanceState!=="optimal"&&this.frameCount%60===0&&console.warn("[PerformanceMonitor] Performance below target:",{state:this.performanceState,avgFPS:e,targetFPS:this.targetFPS})}rippleCreated(){this.metrics.ripples.created++,this.metrics.ripples.active++}rippleCompleted(){this.metrics.ripples.completed++,this.metrics.ripples.active=Math.max(0,this.metrics.ripples.active-1)}getMetrics(){return{...this.metrics,performanceState:this.performanceState,isTargetMet:this.metrics.fps.average>=this.targetFPS}}getRecommendations(){const e=[];return this.performanceState==="critical"?(e.push("Reduce animation complexity"),e.push("Disable visual effects"),e.push("Limit concurrent ripples to 1")):this.performanceState==="degraded"&&(e.push("Consider reducing ripple radius"),e.push("Simplify animation easing")),this.metrics.memory.percentage>80&&(e.push("High memory usage detected"),e.push("Clear completed animations")),e}stop(){this.isMonitoring=!1,this.samplingInterval&&(clearInterval(this.samplingInterval),this.samplingInterval=null),console.log("[PerformanceMonitor] Stopped monitoring")}reset(){this.metrics.fps.samples=[],this.metrics.frameTime.samples=[],this.metrics.ripples={active:0,created:0,completed:0},this.frameCount=0}destroy(){this.stop(),this.reset()}}class N{constructor(e={}){this.viewer=e.viewer,this.radius=e.radius||200,this.duration=e.duration||800,this.maxRipples=e.maxRipples||3,this.onRippleComplete=e.onRippleComplete||(()=>{}),this.safariOptimizations={useWillChange:!0,use3DTransform:!0,useWebkitPrefix:!0,compositeLayerHints:!0,useContainment:!0,usePassiveListeners:!0,reduceCompositeLayersOnMobile:A()},this.container=null,this.activeRipples=new Map,this.rippleIdCounter=0,this.performanceMonitor=new L({targetFPS:30,warningThreshold:25,criticalThreshold:20,onPerformanceChange:this.handlePerformanceChange.bind(this),onCriticalPerformance:this.handleCriticalPerformance.bind(this)}),this.isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent),this.isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1,console.log("[CSSRippleRenderer] Initialized",{safari:this.isSafari,iOS:this.isIOS,mobile:A()})}initialize(){this.createContainer(),this.injectStyles(),this.performanceMonitor.start(),console.log("[CSSRippleRenderer] Initialized container and styles")}createContainer(){this.container||(this.container=document.createElement("div"),this.container.className="css-ripple-container",this.container.style.cssText=`
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
            ${this.safariOptimizations.useContainment?"contain: layout style paint;":""}
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
            
            /* Simplified mobile version for better performance */
            @media (max-width: 768px) {
                @keyframes ripple-expand {
                    0% {
                        transform: translate3d(-50%, -50%, 0) scale(0);
                        opacity: 0.6;
                    }
                    100% {
                        transform: translate3d(-50%, -50%, 0) scale(1);
                        opacity: 0;
                    }
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
                ${this.safariOptimizations.useContainment?"contain: layout;":""}
                /* GPU acceleration hints */
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                perspective: 1000px;
                -webkit-perspective: 1000px;
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
                /* CRITICAL: Set transform-origin to prevent position shifting */
                transform-origin: center center !important;
                -webkit-transform-origin: center center !important;
                /* GPU acceleration for mobile - removed translateZ to avoid conflicts with scale */
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                perspective: 1000px;
                -webkit-perspective: 1000px;
                /* Optimized animation */
                animation-name: hotspot-simple-fade-in !important;
                animation-duration: 0.3s !important;
                animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
                animation-fill-mode: both !important;
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-name: hotspot-simple-fade-in !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-duration: 0.3s !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;":""}
                ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-fill-mode: both !important;":""}
                ${this.safariOptimizations.useContainment?"contain: layout style;":""}
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
                
                /* Reduce animation complexity on mobile */
                .css-ripple {
                    animation-duration: ${this.duration*.8}ms !important;
                }
                
                .hotspot-echo-reveal {
                    animation-duration: 0.25s !important;
                    ${this.safariOptimizations.useWebkitPrefix?"-webkit-animation-duration: 0.25s !important;":""}
                }
                
                /* Force layer creation for smoother animations */
                .css-ripple {
                    transform: translate3d(0, 0, 0);
                    -webkit-transform: translate3d(0, 0, 0);
                }
                
                /* Hotspots use will-change instead to avoid transform conflicts */
                .hotspot-echo-reveal {
                    will-change: transform, opacity;
                    transform-origin: center center !important;
                    -webkit-transform-origin: center center !important;
                }
            }
        `;e.textContent=t+s+o+i+r,document.head.appendChild(e)}createRipple(e,t,s=!1){if(s)return this.createMultiLayerRipple(e,t);if(this.activeRipples.size>=this.maxRipples){const l=this.activeRipples.values().next().value;l&&this.removeRipple(l.id)}const o=`ripple-${this.rippleIdCounter++}`,i=document.createElement("div");i.className="css-ripple",i.id=o,this.performanceMonitor.getMetrics().performanceState!=="optimal"&&i.classList.add("low-performance");const a=this.radius*2;return i.style.width=`${a}px`,i.style.height=`${a}px`,i.style.left=`${e}px`,i.style.top=`${t}px`,this.container.appendChild(i),this.activeRipples.set(o,{id:o,element:i,startTime:performance.now()}),setTimeout(()=>{this.removeRipple(o)},this.duration),this.performanceMonitor.rippleCreated(),console.log("[CSSRippleRenderer] Created ripple at",{x:e,y:t},"id:",o),o}createMultiLayerRipple(e,t){if(this.activeRipples.size>=this.maxRipples){const r=this.activeRipples.values().next().value;r&&this.removeRipple(r.id)}const s=`ripple-multi-${this.rippleIdCounter++}`,o=document.createElement("div");return o.className="css-ripple-multi",o.id=s,[{class:"ripple-layer ripple-layer-outer",size:this.radius*2.2},{class:"ripple-layer ripple-layer-inner",size:this.radius*2},{class:"ripple-layer ripple-layer-core",size:this.radius*1.5}].forEach(r=>{const a=document.createElement("div");a.className=r.class,a.style.width=`${r.size}px`,a.style.height=`${r.size}px`,o.appendChild(a)}),o.style.left=`${e}px`,o.style.top=`${t}px`,this.container.appendChild(o),this.activeRipples.set(s,{id:s,element:o,startTime:performance.now()}),setTimeout(()=>{this.removeRipple(s)},this.duration),this.performanceMonitor.rippleCreated(),console.log("[CSSRippleRenderer] Created multi-layer ripple at",{x:e,y:t},"id:",s),s}removeRipple(e){const t=this.activeRipples.get(e);t&&(t.element&&t.element.parentNode&&t.element.remove(),this.activeRipples.delete(e),this.performanceMonitor.rippleCompleted(),this.onRippleComplete(e))}handlePerformanceChange(e,t){console.log(`[CSSRippleRenderer] Performance state: ${e}`,t.fps),e==="critical"?(this.maxRipples=1,this.duration=600):e==="degraded"?(this.maxRipples=2,this.duration=700):(this.maxRipples=3,this.duration=800)}handleCriticalPerformance(e){console.warn("[CSSRippleRenderer] Critical performance detected!",e),this.activeRipples.size>1&&Array.from(this.activeRipples.keys()).slice(0,-1).forEach(s=>this.removeRipple(s))}getFPS(){return this.performanceMonitor.getMetrics().fps.current}getPerformanceMetrics(){return this.performanceMonitor.getMetrics()}cleanup(){this.activeRipples.forEach(e=>{e.element&&e.element.parentNode&&e.element.remove()}),this.activeRipples.clear(),this.performanceMonitor.stop()}destroy(){this.cleanup(),this.performanceMonitor.destroy(),this.container&&this.container.parentNode&&(this.container.remove(),this.container=null);const e=document.getElementById("css-ripple-styles");e&&e.remove(),console.log("[CSSRippleRenderer] Destroyed")}}class H{constructor(e){this.viewer=e,this.canvas=null,this.context=null,this.cache=new Map,this.initializeCanvas()}initializeCanvas(){this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d",{willReadFrequently:!0})}calculateLuminance(e,t,s){const[o,i,r]=[e,t,s].map(a=>(a/=255,a<=.03928?a/12.92:Math.pow((a+.055)/1.055,2.4)));return o*.2126+i*.7152+r*.0722}calculateContrastRatio(e,t){const s=Math.max(e,t),o=Math.min(e,t);return(s+.05)/(o+.05)}async sampleBackgroundLuminance(e,t,s=50){const o=`${Math.round(e)}_${Math.round(t)}_${s}`;if(this.cache.has(o))return this.cache.get(o);try{if(!await this.captureViewportArea(e,t,s))return this.getDefaultLuminanceData();const r=this.getSamplePoints(s),a=[];for(const c of r){const b=s+c.x,T=s+c.y,v=this.context.getImageData(b,T,1,1).data,n=this.calculateLuminance(v[0],v[1],v[2]);a.push(n)}const l=a.reduce((c,b)=>c+b,0)/a.length,h=Math.min(...a),p=Math.max(...a),g=this.calculateVariance(a,l),u={averageLuminance:l,minLuminance:h,maxLuminance:p,variance:g,isDark:l<.5,isHighContrast:p-h>.5,recommendedEffect:this.selectHotspotEffect(l,g)};return this.cache.set(o,u),u}catch(i){return console.error("Error sampling background luminance:",i),this.getDefaultLuminanceData()}}async captureViewportArea(e,t,s){return null}getSamplePoints(e){const t=[];t.push({x:0,y:0});for(let i=1;i<=3;i++){const r=e*i/3;for(let a=0;a<8;a++){const l=a/8*Math.PI*2;t.push({x:Math.cos(l)*r,y:Math.sin(l)*r})}}return t}calculateVariance(e,t){return e.map(o=>Math.pow(o-t,2)).reduce((o,i)=>o+i,0)/e.length}selectHotspotEffect(e,t){return t>.1?"contrast-adaptive-complex":e<.3?"contrast-adaptive-dark":e>.7?"contrast-adaptive-light":"contrast-adaptive-medium"}getDefaultLuminanceData(){return{averageLuminance:.5,minLuminance:0,maxLuminance:1,variance:.1,isDark:!1,isHighContrast:!0,recommendedEffect:"contrast-adaptive-medium"}}clearCache(){this.cache.clear()}getCacheSize(){return this.cache.size}}class ${constructor(){this.shadowCache=new Map,this.svgNamespace="http://www.w3.org/2000/svg",this.initialized=!1,this.shadowConfigs={echoReveal:{blur:4,color:"rgba(255, 255, 255, 0.8)",id:"echo-reveal-shadow"},echoIntense:{blur:10,color:"rgba(255, 255, 255, 0.8)",id:"echo-intense-shadow"},hover:{blur:8,color:"rgba(255, 255, 255, 0.6)",id:"hover-shadow"}}}initialize(){this.initialized||(console.log("[ShadowSpriteManager] Initializing pre-rendered shadows"),this.createShadowContainer(),Object.entries(this.shadowConfigs).forEach(([e,t])=>{this.createShadowFilter(t),this.shadowCache.set(e,t.id)}),this.initialized=!0,console.log("[ShadowSpriteManager] Shadow sprites initialized"))}createShadowContainer(){if(document.getElementById("shadow-sprite-defs"))return;const e=document.createElementNS(this.svgNamespace,"svg");e.id="shadow-sprite-defs",e.style.position="absolute",e.style.width="0",e.style.height="0",e.style.visibility="hidden",e.setAttribute("aria-hidden","true");const t=document.createElementNS(this.svgNamespace,"defs");e.appendChild(t),document.body.appendChild(e),this.defsContainer=t}createShadowFilter(e){const t=document.createElementNS(this.svgNamespace,"filter");t.id=e.id,t.setAttribute("x","-50%"),t.setAttribute("y","-50%"),t.setAttribute("width","200%"),t.setAttribute("height","200%");const s=document.createElementNS(this.svgNamespace,"feGaussianBlur");s.setAttribute("in","SourceAlpha"),s.setAttribute("stdDeviation",e.blur),s.setAttribute("result","blur");const o=document.createElementNS(this.svgNamespace,"feColorMatrix");o.setAttribute("in","blur"),o.setAttribute("type","matrix");const i=this.parseRGBA(e.color),r=`0 0 0 0 ${i.r} 
                       0 0 0 0 ${i.g} 
                       0 0 0 0 ${i.b} 
                       0 0 0 ${i.a} 0`;o.setAttribute("values",r),o.setAttribute("result","coloredBlur");const a=document.createElementNS(this.svgNamespace,"feMerge"),l=document.createElementNS(this.svgNamespace,"feMergeNode");l.setAttribute("in","coloredBlur");const h=document.createElementNS(this.svgNamespace,"feMergeNode");h.setAttribute("in","SourceGraphic"),a.appendChild(l),a.appendChild(h),t.appendChild(s),t.appendChild(o),t.appendChild(a),this.defsContainer.appendChild(t)}parseRGBA(e){const t=e.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([0-9.]+)?\)/);return t?{r:parseInt(t[1])/255,g:parseInt(t[2])/255,b:parseInt(t[3])/255,a:t[4]?parseFloat(t[4]):1}:{r:1,g:1,b:1,a:1}}applyShadow(e,t){this.initialized||this.initialize();const s=this.shadowCache.get(t);if(!s){console.warn(`[ShadowSpriteManager] Unknown shadow type: ${t}`);return}e.style.filter=`url(#${s})`,e.dataset.willChangeApplied||(e.style.willChange="filter",e.dataset.willChangeApplied="true")}removeShadow(e){e.style.filter="",e.dataset.willChangeApplied&&setTimeout(()=>{e.style.willChange="auto",delete e.dataset.willChangeApplied},100)}applyShadowBatch(e,t){this.initialized||this.initialize();const s=this.shadowCache.get(t);s&&requestAnimationFrame(()=>{e.forEach(o=>{o.style.filter=`url(#${s})`})})}destroy(){const e=document.getElementById("shadow-sprite-defs");e&&e.remove(),this.shadowCache.clear(),this.initialized=!1}}const k=new $;function z(w,e){if(!w)return;const t=w.getBoundingClientRect(),s=t.left+t.width/2,o=t.top+t.height/2,i=document.createElement("div");i.className="hotspot-center-debug",i.style.cssText=`
        position: fixed;
        width: 10px;
        height: 10px;
        background: red;
        border: 2px solid white;
        border-radius: 50%;
        left: ${s-7}px;
        top: ${o-7}px;
        z-index: 99999;
        pointer-events: none;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
    `;const r=document.createElement("div");r.style.cssText=`
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        white-space: nowrap;
        border-radius: 3px;
    `,r.textContent=e.substring(0,8),i.appendChild(r),document.body.appendChild(i);let a=0;const l=()=>{a++;const h=w.getBoundingClientRect(),p=h.left+h.width/2,g=h.top+h.height/2;i.style.left=`${p-7}px`,i.style.top=`${g-7}px`;const u=Math.abs(p-s),c=Math.abs(g-o);(u>1||c>1)&&(console.warn(`[HotspotDebug] Position shift detected for ${e}:`,{deltaX:u.toFixed(2),deltaY:c.toFixed(2),frame:a,originalCenter:{x:s,y:o},newCenter:{x:p,y:g}}),i.style.background="yellow",i.style.boxShadow="0 0 10px red"),a<60?requestAnimationFrame(l):setTimeout(()=>{i.remove()},1e3)};requestAnimationFrame(l)}window.enableHotspotPositionDebug=()=>{window.hotspotPositionDebugEnabled=!0,console.log("[HotspotDebug] Position debugging enabled. Red dots will show hotspot centers during reveal.")};window.disableHotspotPositionDebug=()=>{window.hotspotPositionDebugEnabled=!1,document.querySelectorAll(".hotspot-center-debug").forEach(w=>w.remove()),console.log("[HotspotDebug] Position debugging disabled.")};class G{constructor(e={}){this.viewer=e.viewer,this.eventCoordinator=e.eventCoordinator,this.hotspotRenderer=e.hotspotRenderer,this.stateManager=e.stateManager,this.config={echoRadius:e.echoRadius||200,echoDelay:e.echoDelay||0,echoDuration:e.echoDuration||800,maxSimultaneous:e.maxSimultaneous||10,staggerDelay:e.staggerDelay||12,revealDuration:e.revealDuration||2e3,enabled:e.enabled!==!1,mobileMaxHotspots:e.mobileMaxHotspots||8,useAquaticEffect:!1},this.activeEchoes=new Set,this.echoAnimations=new Map,this.spatialIndex=new M,this.hotspotBounds=new Map,this.spatialIndexReady=!1,this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||"ontouchstart"in window,this.initializeGestureAdapter(),this.initializeRippleRenderer(),this.isMobile&&k.initialize(),this.initializeContrastDetection(),this.frameCount=0,this.lastFPSCheck=performance.now(),this.currentFPS=60,console.log("[TemporalEchoController] Initialized",this.config),window.temporalEchoController=this,window.debugRevealHotspot=t=>{const o={hotspot:{id:t},centerX:100,centerY:100};this.revealSingleHotspot(o,{},0)},window.debugShowAllHotspots=()=>{const t=document.querySelectorAll("[data-hotspot-id]");console.log(`[Debug] Found ${t.length} hotspot elements`),t.forEach((s,o)=>{o<5&&console.log(`[Debug] Hotspot ${o}:`,{id:s.getAttribute("data-hotspot-id"),tagName:s.tagName,className:s.className,opacity:window.getComputedStyle(s).opacity,visibility:window.getComputedStyle(s).visibility,display:window.getComputedStyle(s).display})})}}initializeGestureAdapter(){this.gestureAdapter=new D({eventCoordinator:this.eventCoordinator,viewer:this.viewer,onQuickTap:this.handleQuickTap.bind(this)}),this.config.enabled&&this.gestureAdapter.enable()}initializeRippleRenderer(){this.rippleRenderer=new N({viewer:this.viewer,radius:this.config.echoRadius,duration:this.config.echoDuration,maxRipples:3,onRippleComplete:this.handleRippleComplete.bind(this)}),this.config.enabled&&this.rippleRenderer.initialize(),window.cssRippleRenderer=this.rippleRenderer}initializeContrastDetection(){this.contrastDetection=new H(this.viewer),window.contrastDetection=this.contrastDetection}handleQuickTap(e){if(console.log("[TemporalEchoController] handleQuickTap called, enabled:",this.config.enabled),!this.config.enabled)return console.log("[TemporalEchoController] Echo disabled, skipping"),!1;if(!this.isMobile)return console.log("[TemporalEchoController] Not on mobile, skipping echo"),!1;const t=this.viewer.element.getBoundingClientRect(),s=new x.Point(e.x-t.left,e.y-t.top),o=this.viewer.viewport.pointFromPixel(s),i=this.viewer.viewport.viewportToImageCoordinates(o),r=window.nativeHotspotRenderer&&window.nativeHotspotRenderer.engine.findSmallestHotspotAtPoint(i);if(r&&this.isHotspotRevealed(r.id))return console.log("[TemporalEchoController] Tapped on revealed hotspot, letting click handler take over:",r.id),!1;console.log("[TemporalEchoController] Quick tap detected on mobile, triggering echo",e),this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_TAP,{x:e.x,y:e.y,viewportX:e.viewportX,viewportY:e.viewportY});const a=this.findHotspotsInRadius(e,this.config.echoRadius);return this.rippleRenderer.createRipple(e.x,e.y),a.length>0?(console.log(`[TemporalEchoController] Found ${a.length} hotspots in radius`),this.revealHotspots(a,e)):console.log("[TemporalEchoController] No hotspots found in echo radius"),this.updateFPS(),!0}buildSpatialIndex(){console.log("[TemporalEchoController] Building spatial index for hotspots");const e=performance.now();this.spatialIndex.clear(),this.hotspotBounds.clear();const t=this.stateManager.getAllOverlays(),s=[];t.forEach((i,r)=>{const a=i.hotspot;if(!a||!a.coordinates||a.coordinates.length===0)return;const l=a.shape==="multipolygon"?a.coordinates[0]:a.coordinates;let h=1/0,p=1/0,g=-1/0,u=-1/0,c=0,b=0;l.forEach(([v,n])=>{h=Math.min(h,v),p=Math.min(p,n),g=Math.max(g,v),u=Math.max(u,n),c+=v,b+=n}),c/=l.length,b/=l.length;const T={minX:h,minY:p,maxX:g,maxY:u,centerX:c,centerY:b,hotspotId:r,hotspot:a};this.hotspotBounds.set(r,T),s.push(T)}),this.spatialIndex.load(s),this.spatialIndexReady=!0;const o=performance.now()-e;console.log(`[TemporalEchoController] Spatial index built with ${s.length} hotspots in ${o.toFixed(2)}ms`)}findHotspotsInRadius(e,t){return this.spatialIndexReady&&this.spatialIndex.all().length>0?this.spatialIndexSearch(e,t):!this.spatialIndexReady&&(this.buildSpatialIndex(),this.spatialIndexReady)?this.spatialIndexSearch(e,t):this.linearHotspotSearch(e,t)}spatialIndexSearch(e,t){const s=performance.now(),o=this.viewer.element.getBoundingClientRect(),i=new x.Point(e.x-o.left,e.y-o.top),r=this.viewer.viewport.pointFromPixel(i),a=this.viewer.viewport.viewportToImageCoordinates(r),l=this.viewer.viewport.pointFromPixel(new x.Point(t,0)),h=this.viewer.viewport.viewportToImageCoordinates(l),p=Math.abs(h.x),g={minX:a.x-p,minY:a.y-p,maxX:a.x+p,maxY:a.y+p},u=this.spatialIndex.search(g),c=[],b=p*p;u.forEach(d=>{const f=d.centerX-a.x,y=d.centerY-a.y,S=f*f+y*y;S<=b&&c.push({id:d.hotspotId,distance:Math.sqrt(S),hotspot:d.hotspot})}),c.sort((d,f)=>d.distance-f.distance);const T=this.isMobile?this.config.mobileMaxHotspots:this.config.maxSimultaneous,v=c.slice(0,T),n=performance.now()-s;return console.log(`[TemporalEchoController] Spatial search found ${c.length} hotspots in ${n.toFixed(2)}ms (candidates: ${u.length}), limited to ${v.length}`),v}linearHotspotSearch(e,t){const s=[],o=this.viewer.element.getBoundingClientRect(),i=new x.Point(e.x-o.left,e.y-o.top),r=this.viewer.viewport.pointFromPixel(i),a=this.viewer.viewport.viewportToImageCoordinates(r);console.log("[TemporalEchoController] Searching for hotspots at:",{pixelCoords:{x:e.x,y:e.y},viewportCoords:{x:r.x,y:r.y},imageCoords:{x:a.x,y:a.y}});const l=this.stateManager.getAllOverlays();console.log("[TemporalEchoController] Total overlays available:",l.size);let h=0;l.forEach((g,u)=>{const c=g.hotspot;if(!c||!c.coordinates||c.coordinates.length===0)return;h++;let b=0,T=0;const v=c.shape==="multipolygon"?c.coordinates[0]:c.coordinates;v.forEach(([E,C])=>{b+=E,T+=C}),b/=v.length,T/=v.length;const n=b-a.x,d=T-a.y,f=Math.sqrt(n*n+d*d),y=this.viewer.viewport.pointFromPixel(new x.Point(t,0)),S=this.viewer.viewport.viewportToImageCoordinates(y),P=Math.abs(S.x);if(h<=3&&console.log(`[TemporalEchoController] Hotspot ${u}:`,{hotspotCenter:{x:b,y:T},tapImagePoint:{x:a.x,y:a.y},distanceInImageSpace:f,radiusInImageSpace:P,inRadius:f<=P}),f<=P){const E=this.viewer.viewport.imageToViewportCoordinates(new x.Point(b,T)),C=this.viewer.viewport.pixelFromPoint(E);s.push({hotspot:c,distance:f,centerX:C.x+o.left,centerY:C.y+o.top})}}),console.log(`[TemporalEchoController] Checked ${h} hotspots, found ${s.length} in radius`),s.sort((g,u)=>g.distance-u.distance);const p=this.isMobile?this.config.mobileMaxHotspots:this.config.maxSimultaneous;return s.slice(0,p)}revealHotspots(e,t){this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_START,{count:e.length,origin:t});const s=e,o=s.map(r=>r.hotspot.id);window.nativeHotspotRenderer&&window.nativeHotspotRenderer.activeHotspotManager&&(console.log("[TemporalEchoController] Preparing",o.length,"hotspots for reveal animation"),window.nativeHotspotRenderer.activeHotspotManager.forceShowHotspots(o,{maxForceShow:this.isMobile?this.config.mobileMaxHotspots:this.config.maxSimultaneous})),console.log("[TemporalEchoController] Using standard staggered animation"),s.forEach((r,a)=>{setTimeout(()=>{this.revealSingleHotspot(r,t,a)},a*this.config.staggerDelay)});const i=this.config.revealDuration+300+s.length*this.config.staggerDelay;setTimeout(()=>{this.eventCoordinator.emit(this.eventCoordinator.eventTypes.ECHO_REVEAL_END,{count:s.length})},i)}applyWillChange(e){e.dataset.willChangeApplied||(e.style.willChange="transform, opacity",e.dataset.willChangeApplied="true")}removeWillChange(e,t=100){e.dataset.willChangeApplied&&setTimeout(()=>{e.style.willChange="auto",delete e.dataset.willChangeApplied},t)}findHotspotElement(e){let t=null;const s=this.stateManager.getOverlay(e);if(s&&s.element&&(t=s.element),!t){const o=document.querySelectorAll(".openseadragon-svg-overlay, .hotspot-overlay-svg, svg");for(const i of o)if(t=i.querySelector(`[data-hotspot-id="${e}"]`),t)break}if(t||(t=document.getElementById(`hotspot-${e}`)),!t){const o=document.querySelectorAll(`g[data-hotspot-id="${e}"]`);o.length>0&&(t=o[0])}return t}revealSingleHotspot(e,t,s){var v;const o=e.hotspot||e;console.log("[TemporalEchoController] revealSingleHotspot called for:",o.id);let i=null;const r=this.stateManager.getOverlay(o.id);if(r&&r.element&&(i=r.element,console.log("[TemporalEchoController] Found element via state manager")),!i){const n=document.querySelectorAll(".openseadragon-svg-overlay, .hotspot-overlay-svg, svg");for(const d of n)if(i=d.querySelector(`[data-hotspot-id="${o.id}"]`),i){console.log("[TemporalEchoController] Found element in container:",d.className);break}}if(i||(i=document.getElementById(`hotspot-${o.id}`),i&&console.log("[TemporalEchoController] Found element by ID")),!i){const n=document.querySelectorAll(`g[data-hotspot-id="${o.id}"]`);n.length>0&&(i=n[0],console.log("[TemporalEchoController] Found g element with hotspot id"))}if(!i){console.warn("[TemporalEchoController] No element found for hotspot",o.id);return}const a=i.style.opacity||"",l=i.style.visibility||"",h=i.classList.contains("hotspot-hidden"),p=i.classList.contains("hotspot-visible"),g=["blackOnBlack","pigmentLinerNeutral","pigmentLinerWarm","pigmentLinerCool"],u=(v=window.nativeHotspotRenderer)==null?void 0:v.currentPalette,c=g.includes(u);if(console.log("[TemporalEchoController] Current palette:",u,"isDarkMode:",c),this.activeEchoes.has(o.id)){console.log("[TemporalEchoController] Hotspot already animating, skipping:",o.id);return}i.classList.remove("hotspot-echo-reveal","hotspot-echo-fade-out","black-mode"),i.style.animationDelay="",i.tagName.toLowerCase()==="g"&&i.querySelectorAll("path, polygon, polyline").forEach(d=>{d.style.animationDelay=""}),window.getComputedStyle(i).transform;const b=i.style.top||window.getComputedStyle(i).top,T=i.style.left||window.getComputedStyle(i).left;requestAnimationFrame(async()=>{if(this.applyWillChange(i),i.style.setProperty("--hotspot-top",b),i.style.setProperty("--hotspot-left",T),i.style.transformOrigin="center center",i.style.webkitTransformOrigin="center center",i.classList.add("hotspot-echo-reveal"),c&&i.classList.add("black-mode"),window.hotspotPositionDebugEnabled&&z(i,o.id),this.isMobile){const f=i.querySelector(".main-path")||i.querySelector("path");f&&k.applyShadow(f,"echoReveal")}let n=localStorage.getItem("borderStyle")||"default";if(console.log("[TemporalEchoController] Initial borderStyle from localStorage:",n),console.log("[TemporalEchoController] isMobile:",this.isMobile),console.log("[TemporalEchoController] isBlackMode:",c),this.isMobile&&n==="default"&&(n="emboss",console.log("[TemporalEchoController] Overriding to emboss for mobile")),c&&(n==="default"||n==="pigment")&&(n="emboss",console.log("[TemporalEchoController] Forcing emboss style for dark palette visibility")),console.log("[TemporalEchoController] Final borderStyle to apply:",n),n!=="default")i.classList.add(`border-${n}`),console.log("[TemporalEchoController] Applied border style:",n),console.log("[TemporalEchoController] Element classes:",i.className),setTimeout(()=>{i.querySelectorAll("path").forEach((E,C)=>{const R=window.getComputedStyle(E);console.log(`[TemporalEchoController] Path ${C} classes:`,E.className),console.log(`[TemporalEchoController] Path ${C} stroke:`,R.stroke),console.log(`[TemporalEchoController] Path ${C} strokeWidth:`,R.strokeWidth),console.log(`[TemporalEchoController] Path ${C} filter:`,R.filter)});const y=document.createElement("div");y.className="hotspot-echo-reveal border-gradient",document.body.appendChild(y);const S=document.createElement("div");S.className="main-path",y.appendChild(S);const P=window.getComputedStyle(S);console.log("[TemporalEchoController] Test element filter:",P.filter),document.body.removeChild(y)},100),n==="gradient"&&!document.getElementById("adaptive-gradient")&&this.injectGradientDef(),n==="double"&&i.querySelector("path")&&this.createDoubleContour(i),n==="pigment"&&console.log("[TemporalEchoController] Applied pigment liner style");else if(this.contrastDetection&&e.centerX&&e.centerY)try{const f=await this.contrastDetection.sampleBackgroundLuminance(e.centerX,e.centerY,50);i.classList.add(f.recommendedEffect),console.log("[TemporalEchoController] Applied contrast effect:",f.recommendedEffect)}catch{console.warn("[TemporalEchoController] Contrast detection failed, using default"),i.classList.add("contrast-adaptive-medium")}const d=s*this.config.staggerDelay;i.style.animationDelay=`${d}ms`,console.log(`[TemporalEchoController] Hotspot ${o.id} animation delay: ${d}ms (index: ${s})`),i.tagName.toLowerCase()==="g"&&i.querySelectorAll("path, polygon, polyline").forEach(y=>{y.style.animationDelay=`${d}ms`}),i.offsetHeight,console.log("[TemporalEchoController] Classes added:",i.classList.toString()),this.activeEchoes.add(o.id),this.echoAnimations.set(o.id,{element:i,originalOpacity:a,originalVisibility:l,wasHidden:h,wasVisible:p,isRevealed:!0}),i.setAttribute("data-hotspot-revealed","true")}),setTimeout(()=>{if(i.classList.remove("hotspot-echo-reveal"),i.style.animationDelay="",this.isMobile){const n=i.querySelector(".main-path")||i.querySelector("path");n&&k.removeShadow(n)}i.classList.add("hotspot-echo-fade-out"),setTimeout(()=>{i.classList.remove("hotspot-echo-fade-out","black-mode"),i.classList.remove("contrast-adaptive-dark","contrast-adaptive-light","contrast-adaptive-medium","contrast-adaptive-complex"),i.classList.remove("border-gradient","border-double","border-emboss","border-pulse","border-pigment"),this.removeWillChange(i,0);const n=this.stateManager.getSelectedHotspot();if(!n||n.id!==o.id){const d=this.echoAnimations.get(o.id);d&&(i.style.opacity=d.originalOpacity,i.style.visibility=d.originalVisibility,i.style.display="",d.wasHidden&&i.classList.add("hotspot-hidden"),d.wasVisible&&i.classList.add("hotspot-visible"),i.tagName.toLowerCase()==="g"&&i.querySelectorAll("path, polygon, polyline").forEach(y=>{y.style.animationDelay="",y.style.opacity="",y.style.visibility=""})),window.nativeHotspotRenderer&&window.nativeHotspotRenderer.updateVisibility&&setTimeout(()=>{window.nativeHotspotRenderer.updateVisibility()},100)}i.removeAttribute("data-hotspot-revealed"),this.activeEchoes.delete(o.id),this.echoAnimations.delete(o.id)},300)},this.config.revealDuration)}isHotspotRevealed(e){const t=this.echoAnimations.get(e);return t&&t.isRevealed===!0}handleRippleComplete(e){console.log("[TemporalEchoController] Ripple completed:",e)}updateFPS(){this.frameCount++;const e=performance.now(),t=e-this.lastFPSCheck;t>=1e3&&(this.currentFPS=Math.round(this.frameCount*1e3/t),this.frameCount=0,this.lastFPSCheck=e,this.currentFPS<30&&this.activeEchoes.size>0&&console.warn("[TemporalEchoController] Low FPS detected:",this.currentFPS))}enable(){this.config.enabled=!0,this.gestureAdapter.enable(),this.rippleRenderer.initialize(),this.fastPathListener=e=>{console.log("[TemporalEchoController] Fast-path ECHO_TAP received");const t=new x.Point(e.x-this.viewer.element.offsetLeft,e.y-this.viewer.element.offsetTop),s=this.viewer.viewport.pointFromPixel(t);this.handleQuickTap({x:e.x,y:e.y,viewportX:s.x,viewportY:s.y,timestamp:e.timestamp})},this.eventCoordinator.on(this.eventCoordinator.eventTypes.ECHO_TAP,this.fastPathListener),this.buildSpatialIndex(),console.log("[TemporalEchoController] Enabled with fast-path support and spatial index")}disable(){this.config.enabled=!1,this.gestureAdapter.disable(),this.rippleRenderer.cleanup(),this.clearActiveEchoes(),this.fastPathListener&&(this.eventCoordinator.off(this.eventCoordinator.eventTypes.ECHO_TAP,this.fastPathListener),this.fastPathListener=null),this.invalidateSpatialIndex(),console.log("[TemporalEchoController] Disabled")}invalidateSpatialIndex(){this.spatialIndexReady=!1,this.spatialIndex.clear(),this.hotspotBounds.clear()}clearActiveEchoes(){this.activeEchoes.forEach(e=>{const t=this.echoAnimations.get(e);if(t&&t.element){if(t.element.classList.remove("hotspot-echo-reveal","hotspot-echo-fade-out","black-mode"),t.element.style.animationDelay="",t.element.style.opacity=t.originalOpacity,t.element.style.visibility=t.originalVisibility,t.element.style.display="",this.isMobile){const s=t.element.querySelector(".main-path")||t.element.querySelector("path");s&&k.removeShadow(s)}t.element.tagName.toLowerCase()==="g"&&t.element.querySelectorAll("path, polygon, polyline").forEach(o=>{o.style.animationDelay="",o.style.opacity="",o.style.visibility=""})}}),this.activeEchoes.clear(),this.echoAnimations.clear()}updateConfig(e){Object.assign(this.config,e),(e.quickTapThreshold!==void 0||e.movementThreshold!==void 0)&&this.gestureAdapter.updateConfig(e)}getFPS(){return this.rippleRenderer?this.rippleRenderer.getFPS():60}getPerformanceMetrics(){return this.rippleRenderer?this.rippleRenderer.getPerformanceMetrics():null}injectGradientDef(){if(document.getElementById("adaptive-gradient"))return;const e="http://www.w3.org/2000/svg",t=document.createElementNS(e,"svg");t.style.position="absolute",t.style.width="0",t.style.height="0",t.style.overflow="hidden";const s=document.createElementNS(e,"defs"),o=document.createElementNS(e,"linearGradient");o.id="adaptive-gradient",o.setAttribute("x1","0%"),o.setAttribute("y1","0%"),o.setAttribute("x2","100%"),o.setAttribute("y2","100%");const i=document.createElementNS(e,"stop");i.setAttribute("offset","0%"),i.setAttribute("stop-color","white"),i.setAttribute("stop-opacity","1");const r=document.createElementNS(e,"stop");r.setAttribute("offset","50%"),r.setAttribute("stop-color","gray"),r.setAttribute("stop-opacity","0.8");const a=document.createElementNS(e,"stop");a.setAttribute("offset","100%"),a.setAttribute("stop-color","black"),a.setAttribute("stop-opacity","1"),o.appendChild(i),o.appendChild(r),o.appendChild(a),s.appendChild(o),t.appendChild(s),document.body.appendChild(t)}createDoubleContour(e){e.querySelectorAll("path").forEach(s=>{if(s.nextSibling&&s.nextSibling.classList&&s.nextSibling.classList.contains("outer-stroke"))return;const o=s.cloneNode(!0);o.classList.add("outer-stroke"),o.style.zIndex="-1",s.parentNode.insertBefore(o,s)})}injectPigmentTextureFilter(){const e="http://www.w3.org/2000/svg",t=document.createElementNS(e,"svg");t.style.position="absolute",t.style.width="0",t.style.height="0",t.style.overflow="hidden",t.setAttribute("aria-hidden","true");const s=document.createElementNS(e,"defs"),o=document.createElementNS(e,"filter");o.id="pigmentTexture",o.setAttribute("x","-50%"),o.setAttribute("y","-50%"),o.setAttribute("width","200%"),o.setAttribute("height","200%"),o.setAttribute("color-interpolation-filters","sRGB");const i=document.createElementNS(e,"feTurbulence");i.setAttribute("type","turbulence"),i.setAttribute("baseFrequency","0.5 0.1"),i.setAttribute("numOctaves","2"),i.setAttribute("seed","5"),i.setAttribute("result","turbulence");const r=document.createElementNS(e,"feDisplacementMap");r.setAttribute("in","SourceGraphic"),r.setAttribute("in2","turbulence"),r.setAttribute("scale","2"),r.setAttribute("xChannelSelector","R"),r.setAttribute("yChannelSelector","G"),r.setAttribute("result","displaced");const a=document.createElementNS(e,"feMorphology");a.setAttribute("in","displaced"),a.setAttribute("operator","dilate"),a.setAttribute("radius","0.5"),a.setAttribute("result","dilated");const l=document.createElementNS(e,"feComposite");l.setAttribute("in","dilated"),l.setAttribute("in2","displaced"),l.setAttribute("operator","over"),l.setAttribute("result","final");const h=document.createElementNS(e,"feComponentTransfer");h.setAttribute("in","final");const p=document.createElementNS(e,"feFuncA");p.setAttribute("type","discrete"),p.setAttribute("tableValues","0 1"),h.appendChild(p),o.appendChild(i),o.appendChild(r),o.appendChild(a),o.appendChild(l),o.appendChild(h),s.appendChild(o),t.appendChild(s),document.body.appendChild(t),console.log("[TemporalEchoController] Injected pigment texture filter")}destroy(){this.disable(),this.gestureAdapter.destroy(),this.rippleRenderer.destroy(),this.clearActiveEchoes()}}window.updateBorderStyle=function(w){console.log("[TemporalEchoController] Border style updated to:",w)};export{G as default};

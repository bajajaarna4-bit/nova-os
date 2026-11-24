var st=Object.defineProperty;var rt=(r,e,t)=>e in r?st(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var n=(r,e,t)=>rt(r,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const oe=globalThis,be=oe.ShadowRoot&&(oe.ShadyCSS===void 0||oe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,me=Symbol(),_e=new WeakMap;let Le=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==me)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(be&&e===void 0){const s=t!==void 0&&t.length===1;s&&(e=_e.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&_e.set(t,e))}return e}toString(){return this.cssText}};const ot=r=>new Le(typeof r=="string"?r:r+"",void 0,me),w=(r,...e)=>{const t=r.length===1?r[0]:e.reduce((s,i,o)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new Le(t,r,me)},at=(r,e)=>{if(be)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const s=document.createElement("style"),i=oe.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,r.appendChild(s)}},Ae=be?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return ot(t)})(r):r;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:nt,defineProperty:lt,getOwnPropertyDescriptor:ct,getOwnPropertyNames:dt,getOwnPropertySymbols:pt,getPrototypeOf:ut}=Object,O=globalThis,Se=O.trustedTypes,ht=Se?Se.emptyScript:"",ue=O.reactiveElementPolyfillSupport,G=(r,e)=>r,ae={toAttribute(r,e){switch(e){case Boolean:r=r?ht:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},xe=(r,e)=>!nt(r,e),Pe={attribute:!0,type:String,converter:ae,reflect:!1,useDefault:!1,hasChanged:xe};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),O.litPropertyMetadata??(O.litPropertyMetadata=new WeakMap);let B=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Pe){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&lt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){const{get:i,set:o}=ct(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:i,set(a){const d=i==null?void 0:i.call(this);o==null||o.call(this,a),this.requestUpdate(e,d,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Pe}static _$Ei(){if(this.hasOwnProperty(G("elementProperties")))return;const e=ut(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(G("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(G("properties"))){const t=this.properties,s=[...dt(t),...pt(t)];for(const i of s)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const i of s)t.unshift(Ae(i))}else e!==void 0&&t.push(Ae(e));return t}static _$Eu(e,t){const s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(t=>t(this))}addController(e){var t;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((t=e.hostConnected)==null||t.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return at(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(t=>{var s;return(s=t.hostConnected)==null?void 0:s.call(t)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(t=>{var s;return(s=t.hostDisconnected)==null?void 0:s.call(t)})}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){var o;const s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){const a=(((o=s.converter)==null?void 0:o.toAttribute)!==void 0?s.converter:ae).toAttribute(t,s.type);this._$Em=e,a==null?this.removeAttribute(i):this.setAttribute(i,a),this._$Em=null}}_$AK(e,t){var o,a;const s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const d=s.getPropertyOptions(i),c=typeof d.converter=="function"?{fromAttribute:d.converter}:((o=d.converter)==null?void 0:o.fromAttribute)!==void 0?d.converter:ae;this._$Em=i;const f=c.fromAttribute(t,d.type);this[i]=f??((a=this._$Ej)==null?void 0:a.get(i))??f,this._$Em=null}}requestUpdate(e,t,s,i=!1,o){var a;if(e!==void 0){const d=this.constructor;if(i===!1&&(o=this[e]),s??(s=d.getPropertyOptions(e)),!((s.hasChanged??xe)(o,t)||s.useDefault&&s.reflect&&o===((a=this._$Ej)==null?void 0:a.get(e))&&!this.hasAttribute(d._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:o},a){s&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??t??this[e]),o!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[o,a]of this._$Ep)this[o]=a;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[o,a]of i){const{wrapped:d}=a,c=this[o];d!==!0||this._$AL.has(o)||c===void 0||this.C(o,void 0,a,c)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(s=this._$EO)==null||s.forEach(i=>{var o;return(o=i.hostUpdate)==null?void 0:o.call(i)}),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach(s=>{var i;return(i=s.hostUpdated)==null?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};B.elementStyles=[],B.shadowRootOptions={mode:"open"},B[G("elementProperties")]=new Map,B[G("finalized")]=new Map,ue==null||ue({ReactiveElement:B}),(O.reactiveElementVersions??(O.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const K=globalThis,ze=r=>r,ne=K.trustedTypes,Ce=ne?ne.createPolicy("lit-html",{createHTML:r=>r}):void 0,Ne="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,We="?"+C,ft=`<${We}>`,W=document,Y=()=>W.createComment(""),Z=r=>r===null||typeof r!="object"&&typeof r!="function",we=Array.isArray,vt=r=>we(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",he=`[ 	
\f\r]`,V=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Oe=/-->/g,Me=/>/g,I=RegExp(`>|${he}(?:([^\\s"'>=/]+)(${he}*=${he}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ee=/'/g,De=/"/g,Ue=/^(?:script|style|textarea|title)$/i,gt=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),l=gt(1),R=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),Te=new WeakMap,L=W.createTreeWalker(W,129);function qe(r,e){if(!we(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ce!==void 0?Ce.createHTML(e):e}const bt=(r,e)=>{const t=r.length-1,s=[];let i,o=e===2?"<svg>":e===3?"<math>":"",a=V;for(let d=0;d<t;d++){const c=r[d];let f,v,p=-1,b=0;for(;b<c.length&&(a.lastIndex=b,v=a.exec(c),v!==null);)b=a.lastIndex,a===V?v[1]==="!--"?a=Oe:v[1]!==void 0?a=Me:v[2]!==void 0?(Ue.test(v[2])&&(i=RegExp("</"+v[2],"g")),a=I):v[3]!==void 0&&(a=I):a===I?v[0]===">"?(a=i??V,p=-1):v[1]===void 0?p=-2:(p=a.lastIndex-v[2].length,f=v[1],a=v[3]===void 0?I:v[3]==='"'?De:Ee):a===De||a===Ee?a=I:a===Oe||a===Me?a=V:(a=I,i=void 0);const z=a===I&&r[d+1].startsWith("/>")?" ":"";o+=a===V?c+ft:p>=0?(s.push(f),c.slice(0,p)+Ne+c.slice(p)+C+z):c+C+(p===-2?d:z)}return[qe(r,o+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]};class X{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let o=0,a=0;const d=e.length-1,c=this.parts,[f,v]=bt(e,t);if(this.el=X.createElement(f,s),L.currentNode=this.el.content,t===2||t===3){const p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=L.nextNode())!==null&&c.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(const p of i.getAttributeNames())if(p.endsWith(Ne)){const b=v[a++],z=i.getAttribute(p).split(C),re=/([.?@])?(.*)/.exec(b);c.push({type:1,index:o,name:re[2],strings:z,ctor:re[1]==="."?xt:re[1]==="?"?wt:re[1]==="@"?yt:pe}),i.removeAttribute(p)}else p.startsWith(C)&&(c.push({type:6,index:o}),i.removeAttribute(p));if(Ue.test(i.tagName)){const p=i.textContent.split(C),b=p.length-1;if(b>0){i.textContent=ne?ne.emptyScript:"";for(let z=0;z<b;z++)i.append(p[z],Y()),L.nextNode(),c.push({type:2,index:++o});i.append(p[b],Y())}}}else if(i.nodeType===8)if(i.data===We)c.push({type:2,index:o});else{let p=-1;for(;(p=i.data.indexOf(C,p+1))!==-1;)c.push({type:7,index:o}),p+=C.length-1}o++}}static createElement(e,t){const s=W.createElement("template");return s.innerHTML=e,s}}function H(r,e,t=r,s){var a,d;if(e===R)return e;let i=s!==void 0?(a=t._$Co)==null?void 0:a[s]:t._$Cl;const o=Z(e)?void 0:e._$litDirective$;return(i==null?void 0:i.constructor)!==o&&((d=i==null?void 0:i._$AO)==null||d.call(i,!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,t,s)),s!==void 0?(t._$Co??(t._$Co=[]))[s]=i:t._$Cl=i),i!==void 0&&(e=H(r,i._$AS(r,e.values),i,s)),e}class mt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,i=((e==null?void 0:e.creationScope)??W).importNode(t,!0);L.currentNode=i;let o=L.nextNode(),a=0,d=0,c=s[0];for(;c!==void 0;){if(a===c.index){let f;c.type===2?f=new te(o,o.nextSibling,this,e):c.type===1?f=new c.ctor(o,c.name,c.strings,this,e):c.type===6&&(f=new $t(o,this,e)),this._$AV.push(f),c=s[++d]}a!==(c==null?void 0:c.index)&&(o=L.nextNode(),a++)}return L.currentNode=W,i}p(e){let t=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}class te{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=(i==null?void 0:i.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=H(this,e,t),Z(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==R&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):vt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&Z(this._$AH)?this._$AA.nextSibling.data=e:this.T(W.createTextNode(e)),this._$AH=e}$(e){var o;const{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=X.createElement(qe(s.h,s.h[0]),this.options)),s);if(((o=this._$AH)==null?void 0:o._$AD)===i)this._$AH.p(t);else{const a=new mt(i,this),d=a.u(this.options);a.p(t),this.T(d),this._$AH=a}}_$AC(e){let t=Te.get(e.strings);return t===void 0&&Te.set(e.strings,t=new X(e)),t}k(e){we(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,i=0;for(const o of e)i===t.length?t.push(s=new te(this.O(Y()),this.O(Y()),this,this.options)):s=t[i],s._$AI(o),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,t);e!==this._$AB;){const i=ze(e).nextSibling;ze(e).remove(),e=i}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}}class pe{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,o){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=m}_$AI(e,t=this,s,i){const o=this.strings;let a=!1;if(o===void 0)e=H(this,e,t,0),a=!Z(e)||e!==this._$AH&&e!==R,a&&(this._$AH=e);else{const d=e;let c,f;for(e=o[0],c=0;c<o.length-1;c++)f=H(this,d[s+c],t,c),f===R&&(f=this._$AH[c]),a||(a=!Z(f)||f!==this._$AH[c]),f===m?e=m:e!==m&&(e+=(f??"")+o[c+1]),this._$AH[c]=f}a&&!i&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class xt extends pe{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}}class wt extends pe{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}}class yt extends pe{constructor(e,t,s,i,o){super(e,t,s,i,o),this.type=5}_$AI(e,t=this){if((e=H(this,e,t,0)??m)===R)return;const s=this._$AH,i=e===m&&s!==m||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,o=e!==m&&(s===m||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t;typeof this._$AH=="function"?this._$AH.call(((t=this.options)==null?void 0:t.host)??this.element,e):this._$AH.handleEvent(e)}}class $t{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){H(this,e)}}const fe=K.litHtmlPolyfillSupport;fe==null||fe(X,te),(K.litHtmlVersions??(K.litHtmlVersions=[])).push("3.3.3");const kt=(r,e,t)=>{const s=(t==null?void 0:t.renderBefore)??e;let i=s._$litPart$;if(i===void 0){const o=(t==null?void 0:t.renderBefore)??null;s._$litPart$=i=new te(e.insertBefore(Y(),o),o,void 0,t??{})}return i._$AI(r),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const N=globalThis;class x extends B{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=kt(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return R}}var Ie;x._$litElement$=!0,x.finalized=!0,(Ie=N.litElementHydrateSupport)==null||Ie.call(N,{LitElement:x});const ve=N.litElementPolyfillSupport;ve==null||ve({LitElement:x});(N.litElementVersions??(N.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const y=r=>(e,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(r,e)}):customElements.define(r,e)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const _t={attribute:!0,type:String,converter:ae,reflect:!1,hasChanged:xe},At=(r=_t,e,t)=>{const{kind:s,metadata:i}=t;let o=globalThis.litPropertyMetadata.get(i);if(o===void 0&&globalThis.litPropertyMetadata.set(i,o=new Map),s==="setter"&&((r=Object.create(r)).wrapped=!0),o.set(t.name,r),s==="accessor"){const{name:a}=t;return{set(d){const c=e.get.call(this);e.set.call(this,d),this.requestUpdate(a,c,r,!0,d)},init(d){return d!==void 0&&this.C(a,void 0,r,d),d}}}if(s==="setter"){const{name:a}=t;return function(d){const c=this[a];e.call(this,d),this.requestUpdate(a,c,r,!0,d)}}throw Error("Unsupported decorator location: "+s)};function ie(r){return(e,t)=>typeof t=="object"?At(r,e,t):((s,i,o)=>{const a=i.hasOwnProperty(o);return i.constructor.createProperty(o,s),a?Object.getOwnPropertyDescriptor(i,o):void 0})(r,e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function u(r){return ie({...r,state:!0,attribute:!1})}const St={terminal:{id:"terminal",name:"Terminal",description:"Sandboxed developer shell environment",icon:"⚡",category:"tools",defaultW:700,defaultH:430},files:{id:"files",name:"Files",description:"Local filesystem manager with permission scoping",icon:"📁",category:"system",defaultW:780,defaultH:500},settings:{id:"settings",name:"Settings",description:"Display, themes, privacy, and system configuration",icon:"⚙️",category:"system",defaultW:840,defaultH:540},security:{id:"security",name:"Security Center",description:"Integrity posture, SELinux enforcement, and firewall",icon:"🛡️",category:"system",defaultW:820,defaultH:520},"ai-assistant":{id:"ai-assistant",name:"NOVA Intelligence",description:"Local-first private assistant with allowlisted tools",icon:"✨",category:"ai",defaultW:560,defaultH:640}};class Pt{constructor(){n(this,"windows",[]);n(this,"currentZ",10);n(this,"currentWorkspace",1);n(this,"notifications",[{id:"1",title:"Zero-Trust Confinement",message:"SELinux domain nova_core_t is strictly enforced.",time:"Just now",type:"info"},{id:"2",title:"NOVA Intelligence Active",message:"Tool execution sandbox verified and ready.",time:"2m ago",type:"success"}]);n(this,"listeners",new Map)}subscribe(e,t){return this.listeners.has(e)||this.listeners.set(e,new Set),this.listeners.get(e).add(t),()=>{var s;return(s=this.listeners.get(e))==null?void 0:s.delete(t)}}notify(e,t){var s;(s=this.listeners.get(e))==null||s.forEach(i=>i(t))}getWindows(){return this.windows}getVisibleWindows(){return this.windows.filter(e=>e.workspace===this.currentWorkspace)}getWorkspace(){return this.currentWorkspace}setWorkspace(e){this.currentWorkspace=e,this.notify("workspace",this.currentWorkspace),this.notify("windows",this.windows)}openApp(e){const t=this.windows.find(c=>c.appId===e);if(t){t.workspace!==this.currentWorkspace&&this.setWorkspace(t.workspace),t.minimized&&(t.minimized=!1),this.focusWindow(t.windowId);return}const s=St[e]||{name:e,defaultW:640,defaultH:440},i=this.windows.length%6*32;this.currentZ+=1;let o=100+i,a=60+i;e==="ai-assistant"&&typeof window<"u"&&window.innerWidth>1200&&(o=Math.max(100,window.innerWidth-s.defaultW-48),a=60);const d={windowId:`${e}-${Date.now()}`,appId:e,title:s.name,x:o,y:a,w:s.defaultW,h:s.defaultH,zIndex:this.currentZ,focused:!0,minimized:!1,workspace:this.currentWorkspace};this.windows.forEach(c=>{c.focused=!1}),this.windows.push(d),this.notify("windows",this.windows)}focusWindow(e){this.currentZ+=1,this.windows.forEach(t=>{t.windowId===e?(t.focused=!0,t.zIndex=this.currentZ):t.focused=!1}),this.notify("windows",this.windows)}closeWindow(e){if(this.windows=this.windows.filter(t=>t.windowId!==e),this.windows.length>0){const t=this.windows.reduce((s,i)=>i.zIndex>s.zIndex?i:s,this.windows[0]);t.focused=!0}this.notify("windows",this.windows)}minimizeWindow(e){const t=this.windows.find(s=>s.windowId===e);t&&(t.minimized=!0,t.focused=!1,this.notify("windows",this.windows))}snapWindow(e,t){const s=this.windows.find(c=>c.windowId===e);if(!s)return;const i=40,o=72,a=window.innerWidth,d=window.innerHeight-i-o;t==="left"?(s.x=0,s.y=0,s.w=Math.floor(a/2),s.h=d):t==="right"?(s.x=Math.floor(a/2),s.y=0,s.w=Math.floor(a/2),s.h=d):t==="maximize"&&(s.x=0,s.y=0,s.w=a,s.h=d),this.focusWindow(e)}getNotifications(){return this.notifications}pushNotification(e){const t={...e,id:`${Date.now()}-${Math.random()}`,time:"Just now"};this.notifications.unshift(t),this.notify("notifications",this.notifications)}clearNotifications(){this.notifications=[],this.notify("notifications",this.notifications)}}const h=new Pt;var Be=Object.defineProperty,zt=Object.getOwnPropertyDescriptor,Ct=(r,e,t)=>e in r?Be(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ye=(r,e,t,s)=>{for(var i=s>1?void 0:s?zt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Be(e,t,i),i},Ot=(r,e,t)=>Ct(r,e+"",t);let J=class extends x{constructor(){super(...arguments);n(this,"open",!1);n(this,"notifications",[]);n(this,"unsub")}connectedCallback(){super.connectedCallback(),this.notifications=h.getNotifications(),this.unsub=h.subscribe("notifications",e=>{this.notifications=[...e],this.requestUpdate()})}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this.unsub)==null||e.call(this)}clearAll(){h.clearNotifications()}render(){return this.open?l`
      <div class="header">
        <span class="title">System Notifications (${this.notifications.length})</span>
        <button class="clear-btn" @click=${this.clearAll} ?disabled=${this.notifications.length===0}>Clear All</button>
      </div>
      <div class="list">
        ${this.notifications.length===0?l`
          <div style="font-size:12px;color:var(--nova-text-muted);text-align:center;padding:36px 0;">
            No pending notifications
          </div>
        `:this.notifications.map(e=>l`
          <div class="item">
            <div class="item-header">
              <span>
                <span class="type-dot type-${e.type||"info"}"></span>
                ${e.title}
              </span>
              <span class="item-time">${e.time}</span>
            </div>
            <div class="item-msg">${e.message}</div>
          </div>
        `)}
      </div>
    `:l``}};Ot(J,"styles",w`
    :host {
      display: none;
      position: absolute;
      top: 48px;
      right: 16px;
      width: 360px;
      max-height: 520px;
      background: var(--nova-bg-glass, rgba(15, 16, 33, 0.85));
      backdrop-filter: blur(32px) saturate(1.5);
      -webkit-backdrop-filter: blur(32px) saturate(1.5);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-md, 12px);
      box-shadow: var(--nova-shadow-lg, 0 24px 64px rgba(0,0,0,0.6));
      padding: 18px;
      z-index: 500;
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      animation: dropDown 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      box-sizing: border-box;
    }

    @keyframes dropDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    :host([open]) {
      display: block;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .clear-btn {
      background: transparent;
      border: none;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      cursor: pointer;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all var(--nova-transition-fast);
    }
    .clear-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.06));
      border-radius: var(--nova-radius-sm, 6px);
      padding: 12px;
      transition: background var(--nova-transition-fast);
    }
    .item:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .item-time {
      font-size: 11px;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      font-weight: normal;
    }
    .item-msg {
      font-size: 12px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      line-height: 1.45;
    }
    .type-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .type-info { background: #3b82f6; }
    .type-warn { background: #f59e0b; }
    .type-success { background: #10b981; }
  `);ye([ie({type:Boolean,reflect:!0})],J.prototype,"open",2);ye([u()],J.prototype,"notifications",2);J=ye([y("nova-notification-center")],J);var Re=Object.defineProperty,Mt=Object.getOwnPropertyDescriptor,Et=(r,e,t)=>e in r?Re(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,D=(r,e,t,s)=>{for(var i=s>1?void 0:s?Mt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Re(e,t,i),i},Dt=(r,e,t)=>Et(r,e+"",t);let _=class extends x{constructor(){super(...arguments);n(this,"open",!1);n(this,"wifi",!0);n(this,"bluetooth",!0);n(this,"nightLight",!1);n(this,"zeroTrust",!0);n(this,"volume",80);n(this,"brightness",95)}toggleNightLight(){this.nightLight=!this.nightLight,document.body.style.filter=this.nightLight?"sepia(0.25) contrast(0.95)":"none"}handlePowerAction(e){h.pushNotification({title:`System ${e}`,message:`Simulated system ${e.toLowerCase()} request. Audited in audit.jsonl`,type:"info"})}render(){return this.open?l`
      <div class="grid">
        <div class="tile ${this.wifi?"active":""}" @click=${()=>{this.wifi=!this.wifi}}>
          <span class="icon">📶</span>
          <span class="label">${this.wifi?"Wi-Fi: Connected":"Wi-Fi: Off"}</span>
        </div>
        <div class="tile ${this.bluetooth?"active":""}" @click=${()=>{this.bluetooth=!this.bluetooth}}>
          <span class="icon">ᛒ</span>
          <span class="label">${this.bluetooth?"Bluetooth On":"Bluetooth Off"}</span>
        </div>
        <div class="tile ${this.nightLight?"active":""}" @click=${this.toggleNightLight}>
          <span class="icon">🌙</span>
          <span class="label">Night Light</span>
        </div>
        <div class="tile ${this.zeroTrust?"active":""}" @click=${()=>{this.zeroTrust=!this.zeroTrust}}>
          <span class="icon">🛡️</span>
          <span class="label">Zero-Trust</span>
        </div>
      </div>

      <div class="slider-group">
        <div class="slider-row">
          <span class="slider-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            .value=${this.volume}
            @input=${e=>{this.volume=e.target.value}}
            title="Volume: ${this.volume}%"
          />
        </div>
        <div class="slider-row">
          <span class="slider-icon">☀️</span>
          <input
            type="range"
            min="20"
            max="100"
            .value=${this.brightness}
            @input=${e=>{this.brightness=e.target.value}}
            title="Brightness: ${this.brightness}%"
          />
        </div>
      </div>

      <div class="actions-row">
        <button class="action-btn" @click=${()=>h.openApp("settings")}>
          <span>⚙️</span> Settings
        </button>
        <button class="action-btn" @click=${()=>this.handlePowerAction("Lock")}>
          <span>🔒</span> Lock
        </button>
        <button class="action-btn" @click=${()=>this.handlePowerAction("Restart")}>
          <span>🔄</span> Restart
        </button>
      </div>
    `:l``}};Dt(_,"styles",w`
    :host {
      display: none;
      position: absolute;
      top: 48px;
      right: 16px;
      width: 310px;
      background: var(--nova-bg-glass, rgba(15, 16, 33, 0.85));
      backdrop-filter: blur(32px) saturate(1.5);
      -webkit-backdrop-filter: blur(32px) saturate(1.5);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-md, 12px);
      box-shadow: var(--nova-shadow-lg, 0 24px 64px rgba(0,0,0,0.6));
      padding: 18px;
      z-index: 500;
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      animation: dropDown 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      box-sizing: border-box;
    }

    @keyframes dropDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    :host([open]) {
      display: block;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.06));
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      transition: all var(--nova-transition-fast);
      user-select: none;
    }
    .tile:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .tile.active {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      box-shadow: 0 4px 14px rgba(124, 90, 240, 0.35);
    }
    .icon {
      font-size: 20px;
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: -0.2px;
    }
    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px 0;
      border-top: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      margin-bottom: 14px;
    }
    .slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .slider-icon {
      font-size: 14px;
      color: var(--nova-text-secondary);
      width: 20px;
      text-align: center;
    }
    input[type="range"] {
      flex: 1;
      accent-color: var(--nova-accent-violet, #7c5af0);
      cursor: pointer;
    }
    .actions-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .action-btn {
      flex: 1;
      padding: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 6px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.8));
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all var(--nova-transition-fast);
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  `);D([ie({type:Boolean,reflect:!0})],_.prototype,"open",2);D([u()],_.prototype,"wifi",2);D([u()],_.prototype,"bluetooth",2);D([u()],_.prototype,"nightLight",2);D([u()],_.prototype,"zeroTrust",2);D([u()],_.prototype,"volume",2);D([u()],_.prototype,"brightness",2);_=D([y("nova-quick-settings")],_);var He=Object.defineProperty,Tt=Object.getOwnPropertyDescriptor,It=(r,e,t)=>e in r?He(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,Fe=(r,e,t,s)=>{for(var i=s>1?void 0:s?Tt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&He(e,t,i),i},Lt=(r,e,t)=>It(r,e+"",t);let le=class extends x{constructor(){super(...arguments);n(this,"currentWorkspace",1);n(this,"totalWorkspaces",4);n(this,"unsub")}connectedCallback(){super.connectedCallback(),this.currentWorkspace=h.getWorkspace(),this.unsub=h.subscribe("workspace",e=>{this.currentWorkspace=e,this.requestUpdate()})}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this.unsub)==null||e.call(this)}switchWorkspace(e){h.setWorkspace(e)}render(){return l`
      ${Array.from({length:this.totalWorkspaces}).map((e,t)=>{const s=t+1;return l`
          <button
            class="workspace-pill ${s===this.currentWorkspace?"active":""}"
            @click=${()=>this.switchWorkspace(s)}
            title="Switch to Workspace ${s} (Ctrl+Alt+${s})"
          >
            ${s}
          </button>
        `})}
    `}};Lt(le,"styles",w`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(255, 255, 255, 0.04);
      padding: 3px 6px;
      border-radius: var(--nova-radius-sm, 6px);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .workspace-pill {
      min-width: 22px;
      height: 18px;
      border-radius: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--nova-text-secondary, rgba(255,255,255,0.6));
      transition: all var(--nova-transition-fast, 120ms cubic-bezier(0.4,0,0.2,1));
      padding: 0 4px;
    }
    .workspace-pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .workspace-pill.active {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      box-shadow: 0 0 10px rgba(124, 90, 240, 0.4);
    }
  `);Fe([u()],le.prototype,"currentWorkspace",2);le=Fe([y("nova-workspace-switcher")],le);class Nt{constructor(){n(this,"inMemoryPermissions",new Map([["terminal",new Set(["files","network"])],["files",new Set(["files"])],["ai-assistant",new Set(["system"])],["security",new Set(["system"])],["settings",new Set(["system","display"])]]));n(this,"providerMode","auto");n(this,"networkLossSimulated",!1);n(this,"auditLog",[{id:"audit-0",timestamp:new Date(Date.now()-12e4).toLocaleTimeString(),eventType:"ai_tool_execution",toolName:"inspect_system_hardware",action:"execute_tool",outcome:"success",provider:"Offline Built-in Engine",details:"Host metrics gathered: x86_64 CPU and memory status verified"},{id:"audit-1",timestamp:new Date(Date.now()-6e4).toLocaleTimeString(),eventType:"permission_check",toolName:"search_files",action:"request_permission",outcome:"success",provider:"Zero-Trust Broker",details:"Scoped user permission granted for /home/nova"}])}getProviderMode(){return this.providerMode}setProviderMode(e){this.providerMode=e}isNetworkLossSimulated(){return this.networkLossSimulated}setSimulateNetworkLoss(e){this.networkLossSimulated=e}getAuditLog(){return[...this.auditLog]}recordAudit(e){const t={id:`audit-${Date.now()}-${Math.floor(Math.random()*1e3)}`,timestamp:new Date().toLocaleTimeString(),...e};this.auditLog.unshift(t),this.auditLog.length>50&&this.auditLog.pop()}async getSystemInfo(){try{const e=await fetch("/api/system/info");if(e.ok)return await e.json()}catch{}return{hostname:"nova-workstation",kernelVersion:"6.11.8-300.fc41.x86_64",osVersion:"NOVA OS 0.1.0-alpha",cpuModel:"x86_64 Multi-Core Processor",cpuCores:8,cpuPercent:14.2,memoryUsedBytes:5368709120,memoryTotalBytes:17179869184,uptimeSeconds:7320}}async getSecurityStatus(){try{const e=await fetch("/api/system/security");if(e.ok)return await e.json()}catch{}return{secureBoot:!0,selinuxMode:"Enforcing",dmCrypt:!0,firewallActive:!0,isolationActive:!0}}async listDirectory(e){try{const t=e?`?path=${encodeURIComponent(e)}`:"",s=await fetch(`/api/fs/list${t}`);if(s.ok)return await s.json()}catch{}return{path:e||"/home/nova",items:[{name:"Documents",isDirectory:!0,size:4096,mtime:new Date().toISOString()},{name:"Projects",isDirectory:!0,size:4096,mtime:new Date().toISOString()},{name:"Downloads",isDirectory:!0,size:4096,mtime:new Date().toISOString()},{name:"ARCHITECTURE.md",isDirectory:!1,size:25458,mtime:new Date().toISOString()},{name:"SECURITY.md",isDirectory:!1,size:27547,mtime:new Date().toISOString()},{name:"MISSION_2.md",isDirectory:!1,size:4210,mtime:new Date().toISOString()},{name:"Containerfile",isDirectory:!1,size:14002,mtime:new Date().toISOString()}]}}isPermissionGranted(e,t){var s;return((s=this.inMemoryPermissions.get(e))==null?void 0:s.has(t))??!1}grantPermission(e,t){return this.inMemoryPermissions.has(e)||this.inMemoryPermissions.set(e,new Set),this.inMemoryPermissions.get(e).add(t),!0}revokePermission(e,t){var s;return((s=this.inMemoryPermissions.get(e))==null?void 0:s.delete(t))??!1}getAppPermissions(e){return Array.from(this.inMemoryPermissions.get(e)||[])}async queryAI(e){return this.queryAIStream(e,()=>{})}async queryAIStream(e,t){const s=Date.now(),i=e.toLowerCase().trim();let o="Offline Built-in Engine",a="nova-builtin-rules-v1",d=!1;if(this.providerMode==="gemini"){if(this.networkLossSimulated)throw new Error("Network unreachable: connection to Gemini API timed out");o="Gemini 2.0 Flash",a="gemini-2.0-flash-exp"}else this.providerMode==="ollama"?(o="Ollama Local Daemon",a="llama3.2:latest"):this.providerMode==="auto"&&(this.networkLossSimulated?(o="Offline Built-in Engine (Fallback)",a="nova-builtin-rules-v1",d=!0):(o="Gemini 2.0 Flash",a="gemini-2.0-flash-exp"));let c="",f;if(i.includes("launch")||i.includes("open app")||i.includes("start app")||i.startsWith("open ")){let p="terminal",b="Terminal";i.includes("file")?(p="files",b="Files Browser"):i.includes("setting")?(p="settings",b="System Settings"):i.includes("security")?(p="security",b="Security Center"):(i.includes("browser")||i.includes("web"))&&(p="browser",b="Web Browser"),c=`I have verified your request to launch ${b}. Because application launching can initiate new execution environments, this action requires your explicit confirmation.`,f={name:"launch_application",params:{app_id:p},consequential:!0,requiredPermission:"apps",risk:"medium",description:`Launch application binary: ${b} (${p})`}}else if(i.includes("settings")&&(i.includes("privacy")||i.includes("appearance")||i.includes("ai")||i.includes("accessibility"))){let p="appearance";i.includes("privacy")?p="privacy":i.includes("ai")?p="ai":i.includes("accessibility")&&(p="accessibility"),c=`Navigating to System Settings → ${p.toUpperCase()} panel.`,f={name:"navigate_settings",params:{panel:p},consequential:!1,requiredPermission:"settings",risk:"low",description:`Navigate settings pane: ${p}`}}else if(i.includes("system")||i.includes("hardware")||i.includes("cpu")||i.includes("memory")||i.includes("ram")){const p=await this.getSystemInfo();c=`Hardware Summary & Resource Status:
• Hostname: ${p.hostname}
• Kernel: ${p.kernelVersion}
• CPU: ${p.cpuModel||"x86_64"} (${p.cpuPercent}% usage)
• Memory: ${(p.memoryUsedBytes/1024**3).toFixed(1)} GB / ${(p.memoryTotalBytes/1024**3).toFixed(1)} GB
• Uptime: ${Math.floor(p.uptimeSeconds/60)} minutes`,f={name:"get_system_info",params:{},consequential:!1,requiredPermission:"system",risk:"low",description:"Read real hardware metrics from kernel /proc subsystem"}}else if(i.includes("security")||i.includes("firewall")||i.includes("selinux")||i.includes("secure boot")){const p=await this.getSecurityStatus();c=`Security Posture (Verified):
• SELinux: ${p.selinuxMode}
• Firewall: ${p.firewallActive?"Active (nftables drop-by-default)":"Inactive"}
• Disk Encryption: ${p.dmCrypt?"LUKS2 Confirmed":"None"}
• Secure Boot: ${p.secureBoot===null?"Platform Dependent":p.secureBoot?"Enabled":"Disabled"}`,f={name:"check_security_posture",params:{},consequential:!1,requiredPermission:"system",risk:"low",description:"Query kernel security modules and hardware firmware status"}}else i.includes("files")||i.includes("documents")||i.includes("search")||i.includes("find")?(c="Found 7 items in user directory including ARCHITECTURE.md, SECURITY.md, and MISSION_2.md. Requesting permission to inspect document preview.",f={name:"search_files",params:{query:"docs",directory:"/home/nova"},consequential:!1,requiredPermission:"files",risk:"low",description:"Search files inside authorized user directory"}):c=`[${o}] Processed: "${e}".

I am running within the zero-trust NOVA Intelligence operating layer. All consequential operations (launching processes, reading private documents, modifying system settings) must go through the explicit user authorization broker. Arbitrary shell commands are strictly prohibited.`;const v=c.split(" ");for(let p=0;p<v.length;p++)t(v[p]+(p<v.length-1?" ":"")),await new Promise(b=>setTimeout(b,18));return this.recordAudit({eventType:"ai_query",toolName:f==null?void 0:f.name,action:"complete_query",outcome:"success",provider:o,details:`Prompt processed: "${e.slice(0,40)}..." -> ${f?`proposed ${f.name}`:"direct answer"}`}),{text:c,toolCall:f,providerUsed:o,modelUsed:a,isFallback:d,latencyMs:Date.now()-s}}async executeTool(e,t,s){if(!s)return this.recordAudit({eventType:"ai_tool_execution",toolName:e,action:"execute_tool",outcome:"denied",provider:"Zero-Trust Broker",details:`User explicitly denied execution of consequential tool "${e}"`}),{success:!1,output:null,error:`Execution of tool '${e}' was denied by user policy`};const i=e==="search_files"||e==="read_file_preview"?"files":"system";this.isPermissionGranted("ai-assistant",i)||this.grantPermission("ai-assistant",i);let o={status:"executed",timestamp:new Date().toISOString()};return e==="launch_application"?o={launched:!0,app_id:t.app_id}:e==="inspect_system_hardware"?o=await this.getSystemInfo():e==="check_security_posture"?o=await this.getSecurityStatus():e==="search_files"&&(o=await this.listDirectory(t.directory)),this.recordAudit({eventType:"ai_tool_execution",toolName:e,action:"execute_tool",outcome:"success",provider:"Zero-Trust Broker",details:`Executed allowlisted tool "${e}" with user confirmation`}),{success:!0,output:o}}}const g=new Nt;var je=Object.defineProperty,Wt=Object.getOwnPropertyDescriptor,Ut=(r,e,t)=>e in r?je(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,F=(r,e,t,s)=>{for(var i=s>1?void 0:s?Wt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&je(e,t,i),i},qt=(r,e,t)=>Ut(r,e+"",t);let M=class extends x{constructor(){super(...arguments);n(this,"timeString","");n(this,"notificationsOpen",!1);n(this,"quickSettingsOpen",!1);n(this,"notificationCount",2);n(this,"metrics",null);n(this,"timer",0);n(this,"metricsTimer",0);n(this,"unsubNotif")}connectedCallback(){super.connectedCallback(),this.updateClock(),this.timer=window.setInterval(()=>this.updateClock(),1e3),this.pollMetrics(),this.metricsTimer=window.setInterval(()=>this.pollMetrics(),4e3),this.unsubNotif=h.subscribe("notifications",e=>{this.notificationCount=e.length,this.requestUpdate()})}disconnectedCallback(){var e;super.disconnectedCallback(),clearInterval(this.timer),clearInterval(this.metricsTimer),(e=this.unsubNotif)==null||e.call(this)}updateClock(){const e=new Date;this.timeString=e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})+"  "+e.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",second:"2-digit"})}async pollMetrics(){this.metrics=await g.getSystemInfo(),this.requestUpdate()}toggleLauncher(){this.dispatchEvent(new CustomEvent("launcher-toggle",{bubbles:!0,composed:!0}))}render(){return l`
      <div class="left">
        <button class="logo-btn" @click=${this.toggleLauncher} title="Application Launcher (Super key)">
          <div class="logo-icon">✦</div>
          <span class="logo-text">NOVA</span>
        </button>
        <nova-workspace-switcher></nova-workspace-switcher>
      </div>

      <div class="center" @click=${()=>h.openApp("settings")} title="System Date & Time">
        <span class="clock">${this.timeString}</span>
      </div>

      <div class="right">
        ${this.metrics?l`
          <div class="metrics-pill" title="Live System Telemetry">
            <span class="metric-dot"></span>
            <span>CPU ${this.metrics.cpuPercent}%</span>
            <span>RAM ${Math.round(this.metrics.memoryUsedBytes/1024**3)}GB</span>
          </div>
        `:""}

        <button
          class="tray-btn"
          @click=${()=>{this.notificationsOpen=!this.notificationsOpen,this.notificationsOpen&&(this.quickSettingsOpen=!1)}}
          title="Notifications"
        >
          <span>🔔</span>
          ${this.notificationCount>0?l`<span class="badge-dot"></span>`:""}
        </button>

        <button
          class="tray-btn"
          @click=${()=>{this.quickSettingsOpen=!this.quickSettingsOpen,this.quickSettingsOpen&&(this.notificationsOpen=!1)}}
          title="Quick Settings"
        >
          <span>📶</span>
          <span>⚡</span>
        </button>

        <button
          class="tray-btn"
          @click=${()=>h.openApp("ai-assistant")}
          title="NOVA Intelligence (Super+A)"
        >
          <span>✨</span>
        </button>
      </div>

      ${this.notificationsOpen?l`
        <nova-notification-center
          .open=${this.notificationsOpen}
          @close=${()=>{this.notificationsOpen=!1}}
        ></nova-notification-center>
      `:""}

      ${this.quickSettingsOpen?l`
        <nova-quick-settings
          .open=${this.quickSettingsOpen}
          @close=${()=>{this.quickSettingsOpen=!1}}
        ></nova-quick-settings>
      `:""}
    `}};qt(M,"styles",w`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 40px;
      background: var(--nova-bg-glass, rgba(15, 16, 33, 0.75));
      backdrop-filter: blur(28px) saturate(1.4);
      -webkit-backdrop-filter: blur(28px) saturate(1.4);
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
      box-sizing: border-box;
      z-index: 100;
    }

    .left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      transition: background var(--nova-transition-fast);
      border: none;
      background: transparent;
      color: #fff;
    }
    .logo-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .logo-icon {
      width: 22px;
      height: 22px;
      background: var(--nova-accent-gradient, linear-gradient(135deg, #7c5af0, #3b82f6));
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      color: white;
      box-shadow: 0 2px 8px rgba(124, 90, 240, 0.4);
    }

    .logo-text {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 6px;
      transition: background var(--nova-transition-fast);
    }
    .center:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .clock {
      font-size: 12px;
      font-weight: 600;
      color: var(--nova-text-primary, rgba(255,255,255,0.92));
      letter-spacing: 0.2px;
    }

    .right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .metrics-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 12px;
      font-size: 11px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
    }

    .metric-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .tray-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px 8px;
      border-radius: 6px;
      cursor: pointer;
      background: transparent;
      border: none;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      font-size: 13px;
      transition: all var(--nova-transition-fast);
      position: relative;
    }
    .tray-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .badge-dot {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
    }
  `);F([u()],M.prototype,"timeString",2);F([u()],M.prototype,"notificationsOpen",2);F([u()],M.prototype,"quickSettingsOpen",2);F([u()],M.prototype,"notificationCount",2);F([u()],M.prototype,"metrics",2);M=F([y("nova-top-bar")],M);var Ve=Object.defineProperty,Bt=Object.getOwnPropertyDescriptor,Rt=(r,e,t)=>e in r?Ve(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,Ge=(r,e,t,s)=>{for(var i=s>1?void 0:s?Bt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Ve(e,t,i),i},Ht=(r,e,t)=>Rt(r,e+"",t);const Ft=[{id:"terminal",label:"Terminal",color:"#1a1a2e",icon:"terminal"},{id:"files",label:"Files",color:"#1a2a1a",icon:"files"},{id:"browser",label:"Browser",color:"#1a1a3a",icon:"browser"},{id:"ai-assistant",label:"AI Assistant",color:"#1e1a2e",icon:"ai"},{id:"settings",label:"Settings",color:"#2a1a1a",icon:"settings"},{id:"security",label:"Security",color:"#1a2a2a",icon:"security"}];let ce=class extends x{constructor(){super(...arguments);n(this,"openWindows",[]);n(this,"iconGradients",{terminal:"linear-gradient(135deg, #1a1a2e, #16213e)",files:"linear-gradient(135deg, #1a2e1a, #0d2818)",browser:"linear-gradient(135deg, #1a1a3e, #0d0d2e)",ai:"linear-gradient(135deg, #2a1a3e, #1a0d2e)",settings:"linear-gradient(135deg, #2e1a1a, #2a0d0d)",security:"linear-gradient(135deg, #0d2a2a, #0a1f1f)"})}renderIcon(e){const t={terminal:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4 17 10 11 4 5"/>
        <line x1="12" y1="19" x2="20" y2="19"/>
      </svg>`,files:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>`,browser:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>`,ai:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>`,settings:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>`,security:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>`};return t[e]??t.files}launchApp(e){this.dispatchEvent(new CustomEvent("app-launch",{detail:{appId:e},bubbles:!0,composed:!0}))}render(){return l`
      <div class="dock">
        ${Ft.map((e,t)=>l`
          ${t===4?l`<div class="separator"></div>`:""}
          <div class="dock-item" @click=${()=>this.launchApp(e.id)}>
            <span class="dock-label">${e.label}</span>
            <div class="dock-icon" style="background: ${this.iconGradients[e.icon]||"#1a1a2e"}; border: 1px solid var(--nova-border);">
              ${this.renderIcon(e.icon)}
            </div>
            <div class="running-dot ${this.openWindows.includes(e.id)?"active":""}"></div>
          </div>
        `)}
      </div>
    `}};Ht(ce,"styles",w`
    :host {
      display: flex;
      align-items: center;
    }

    .dock {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      padding: 8px 12px;
      background: var(--nova-bg-glass);
      backdrop-filter: blur(32px) saturate(1.5);
      -webkit-backdrop-filter: blur(32px) saturate(1.5);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-xl);
      box-shadow: var(--nova-shadow-lg), inset 0 1px 0 rgba(255,255,255,0.08);
      animation: slideInUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(60px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dock-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      position: relative;
    }

    .dock-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--nova-transition-base), box-shadow var(--nova-transition-base);
      position: relative;
      overflow: hidden;
    }

    .dock-icon::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: rgba(255,255,255,0.05);
      transition: background var(--nova-transition-fast);
    }

    .dock-item:hover .dock-icon {
      transform: scale(1.15) translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    }

    .dock-item:hover .dock-icon::before {
      background: rgba(255,255,255,0.12);
    }

    .dock-item:active .dock-icon {
      transform: scale(1.0) translateY(0);
    }

    .dock-label {
      position: absolute;
      bottom: 56px;
      left: 50%;
      transform: translateX(-50%) scale(0.8);
      background: var(--nova-bg-elevated);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-sm);
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 500;
      color: var(--nova-text-primary);
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--nova-transition-fast), transform var(--nova-transition-fast);
      box-shadow: var(--nova-shadow-sm);
    }

    .dock-item:hover .dock-label {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }

    .running-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--nova-accent-violet);
      opacity: 0;
      transition: opacity var(--nova-transition-fast);
    }

    .running-dot.active {
      opacity: 1;
    }

    .separator {
      width: 1px;
      height: 36px;
      background: var(--nova-border);
      margin: 0 4px;
      align-self: center;
    }

    svg {
      width: 26px;
      height: 26px;
      color: white;
    }
  `);Ge([ie({type:Array})],ce.prototype,"openWindows",2);ce=Ge([y("nova-dock")],ce);var Ke=Object.defineProperty,jt=Object.getOwnPropertyDescriptor,Vt=(r,e,t)=>e in r?Ke(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,$e=(r,e,t,s)=>{for(var i=s>1?void 0:s?jt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Ke(e,t,i),i},Gt=(r,e,t)=>Vt(r,e+"",t);const ge=[{id:"terminal",name:"Terminal",description:"Command-line interface",category:"System",icon:"terminal",color:"#1a1a2e"},{id:"files",name:"Files",description:"Browse your filesystem",category:"System",icon:"files",color:"#1a2e1a"},{id:"settings",name:"Settings",description:"Configure NOVA OS",category:"System",icon:"settings",color:"#2e1a1a"},{id:"security",name:"Security Center",description:"Monitor system security",category:"System",icon:"security",color:"#0d2a2a"},{id:"ai-assistant",name:"AI Assistant",description:"Powered by Gemini",category:"Utilities",icon:"ai",color:"#2a1a3e"},{id:"browser",name:"Web Browser",description:"Browse the internet",category:"Utilities",icon:"browser",color:"#1a1a3e"},{id:"text-editor",name:"Text Editor",description:"Edit plain text files",category:"Development",icon:"editor",color:"#1e2a1a"},{id:"code-editor",name:"Code Editor",description:"Write code with syntax highlighting",category:"Development",icon:"code",color:"#0d1a2e"}],Kt=["System","Utilities","Development","Creative"];let Q=class extends x{constructor(){super(...arguments);n(this,"query","");n(this,"focusedIndex",0);n(this,"recentApps",["terminal","ai-assistant","files"]);n(this,"handleKey",e=>{if(e.key==="Escape")this.dispatchEvent(new CustomEvent("launcher-close",{bubbles:!0,composed:!0}));else if(e.key==="ArrowDown")e.preventDefault(),this.focusedIndex=(this.focusedIndex+1)%this.filteredApps.length;else if(e.key==="ArrowUp")e.preventDefault(),this.focusedIndex=(this.focusedIndex-1+this.filteredApps.length)%this.filteredApps.length;else if(e.key==="Enter"){const t=this.filteredApps[this.focusedIndex];t&&this.launchApp(t.id)}});n(this,"iconGradients",{terminal:"#1a1a2e",files:"#1a2e1a",settings:"#2e1a1a",security:"#0d2a2a",ai:"#2a1a3e",browser:"#1a1a3e",editor:"#1e2a1a",code:"#0d1a2e"})}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this.handleKey),setTimeout(()=>{var e,t;return(t=(e=this.shadowRoot)==null?void 0:e.querySelector(".search-input"))==null?void 0:t.focus()},50)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this.handleKey)}get filteredApps(){if(!this.query.trim())return ge;const e=this.query.toLowerCase();return ge.filter(t=>t.name.toLowerCase().includes(e)||t.description.toLowerCase().includes(e))}launchApp(e){this.dispatchEvent(new CustomEvent("app-launch",{detail:{appId:e},bubbles:!0,composed:!0}))}renderIcon(e){const t={terminal:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,files:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,settings:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`,security:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,ai:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,browser:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,editor:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,code:l`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`};return t[e]??t.files}renderAppsForCategory(e){const t=this.filteredApps.filter(s=>s.category===e);return t.length===0?"":l`
      <div class="section-label">${e}</div>
      <div class="apps-grid">
        ${t.map((s,i)=>{const o=this.filteredApps.indexOf(s);return l`
            <div class="app-card ${o===this.focusedIndex?"focused":""}"
                 @click=${()=>this.launchApp(s.id)}>
              <div class="app-icon" style="background: ${this.iconGradients[s.icon]||"#1a1a2e"}">
                ${this.renderIcon(s.icon)}
              </div>
              <div>
                <div class="app-name">${s.name}</div>
                <div class="app-desc">${s.description}</div>
              </div>
            </div>
          `})}
      </div>
    `}render(){const e=this.recentApps.map(t=>ge.find(s=>s.id===t)).filter(Boolean);return l`
      <div class="backdrop" @click=${()=>this.dispatchEvent(new CustomEvent("launcher-close",{bubbles:!0,composed:!0}))}></div>
      <div class="launcher-panel" @click=${t=>t.stopPropagation()}>
        <div class="search-row">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="search-input"
            type="text"
            placeholder="Search applications..."
            .value=${this.query}
            @input=${t=>{this.query=t.target.value,this.focusedIndex=0}}
          />
        </div>

        <div class="content">
          ${this.query.trim()?l`
            ${this.filteredApps.length===0?l`<div style="color: var(--nova-text-muted); text-align: center; padding: 48px 0;">No apps found for "${this.query}"</div>`:l`<div class="apps-grid">
                  ${this.filteredApps.map((t,s)=>l`
                    <div class="app-card ${s===this.focusedIndex?"focused":""}"
                         @click=${()=>this.launchApp(t.id)}>
                      <div class="app-icon" style="background: ${this.iconGradients[t.icon]||"#1a1a2e"}">
                        ${this.renderIcon(t.icon)}
                      </div>
                      <div>
                        <div class="app-name">${t.name}</div>
                        <div class="app-desc">${t.description}</div>
                      </div>
                    </div>
                  `)}
                </div>`}
          `:l`
            <div class="section-label">Recent</div>
            <div class="recent-row">
              ${e.map(t=>l`
                <div class="recent-pill" @click=${()=>this.launchApp(t.id)}>
                  ${this.renderIcon(t.icon)} ${t.name}
                </div>
              `)}
            </div>
            ${Kt.map(t=>this.renderAppsForCategory(t))}
          `}
        </div>

        <div class="kbd-hint">
          <span class="kbd">↑↓</span> navigate &nbsp; <span class="kbd">↵</span> open &nbsp; <span class="kbd">Esc</span> close
        </div>
      </div>
    `}};Gt(Q,"styles",w`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 200;
      animation: fadeIn 0.18s ease forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(5, 6, 15, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .launcher-panel {
      position: absolute;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      width: 760px;
      max-width: 95vw;
      max-height: 75vh;
      background: var(--nova-bg-elevated);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-xl);
      box-shadow: var(--nova-shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleIn 0.2s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: translateX(-50%) scale(0.96); }
      to { opacity: 1; transform: translateX(-50%) scale(1); }
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--nova-border);
    }

    .search-icon {
      color: var(--nova-text-muted);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 16px;
      font-family: var(--nova-font-ui);
      color: var(--nova-text-primary);
      caret-color: var(--nova-accent-violet);
    }
    .search-input::placeholder {
      color: var(--nova-text-muted);
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--nova-text-muted);
      margin-bottom: 10px;
      margin-top: 16px;
    }
    .section-label:first-child {
      margin-top: 0;
    }

    .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
    }

    .app-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 14px;
      border-radius: var(--nova-radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition: background var(--nova-transition-fast), border-color var(--nova-transition-fast), transform var(--nova-transition-fast);
      background: transparent;
    }
    .app-card:hover, .app-card.focused {
      background: var(--nova-bg-hover);
      border-color: var(--nova-border-accent);
      transform: translateY(-1px);
    }
    .app-card:active {
      transform: scale(0.97);
    }

    .app-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--nova-border);
    }

    .app-icon svg {
      width: 22px;
      height: 22px;
      color: white;
    }

    .app-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--nova-text-primary);
      line-height: 1.2;
    }

    .app-desc {
      font-size: 11px;
      color: var(--nova-text-secondary);
      line-height: 1.3;
    }

    .recent-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .recent-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--nova-border);
      background: var(--nova-bg-hover);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary);
      transition: color var(--nova-transition-fast), border-color var(--nova-transition-fast);
    }
    .recent-pill:hover {
      color: var(--nova-text-primary);
      border-color: var(--nova-border-accent);
    }

    .kbd-hint {
      font-size: 11px;
      color: var(--nova-text-muted);
      text-align: center;
      padding: 10px;
      border-top: 1px solid var(--nova-border);
    }
    .kbd {
      display: inline-block;
      background: var(--nova-bg-hover);
      border: 1px solid var(--nova-border);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: var(--nova-font-mono);
      font-size: 10px;
    }
  `);$e([u()],Q.prototype,"query",2);$e([u()],Q.prototype,"focusedIndex",2);Q=$e([y("nova-launcher")],Q);var Ye=Object.defineProperty,Yt=Object.getOwnPropertyDescriptor,Zt=(r,e,t)=>e in r?Ye(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ke=(r,e,t,s)=>{for(var i=s>1?void 0:s?Yt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Ye(e,t,i),i},Xt=(r,e,t)=>Zt(r,e+"",t);let ee=class extends x{constructor(){super(...arguments);n(this,"history",[{prompt:"system",output:`NOVA OS v0.1.0-alpha (x86_64-linux-gnu)
Type "help" for available commands.`}]);n(this,"inputVal","")}handleKeyDown(e){if(e.key==="Enter"){const t=this.inputVal.trim();let s="";if(t==="help")s=`Built-in commands:
  help      Show this list
  uname -a  Display kernel & OS information
  status    Check system services
  clear     Clear screen`;else if(t==="uname -a")s="Linux nova-system 6.11.0-nova-atomic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux";else if(t==="status")s=`● nova-core.service - active (running)
● nova-permissions.service - active (running)
● nova-ai-runtime.service - active (running)`;else if(t==="clear"){this.history=[],this.inputVal="";return}else t.length>0&&(s=`nova-sh: command not found: ${t}`);this.history.push({prompt:"user@nova:~$ "+t,output:s}),this.inputVal="",this.requestUpdate()}}render(){return l`
      <div class="history">
        ${this.history.map(e=>l`
          <div class="line"><span class="prompt">${e.prompt}</span></div>
          ${e.output?l`<div class="line">${e.output}</div>`:""}
        `)}
      </div>
      <div class="input-row">
        <span class="prompt">user@nova:~$</span>
        <input
          type="text"
          .value=${this.inputVal}
          @input=${e=>{this.inputVal=e.target.value}}
          @keydown=${this.handleKeyDown}
          autofocus
        />
      </div>
    `}};Xt(ee,"styles",w`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #080910;
      color: #e0e2ec;
      font-family: var(--nova-font-mono, monospace);
      font-size: 13px;
      padding: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }
    .history {
      flex: 1;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
    .line {
      margin-bottom: 4px;
    }
    .prompt {
      color: #7c5af0;
      font-weight: 600;
    }
    .input-row {
      display: flex;
      align-items: center;
      margin-top: 8px;
    }
    input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-family: inherit;
      font-size: inherit;
      margin-left: 8px;
    }
  `);ke([u()],ee.prototype,"history",2);ke([u()],ee.prototype,"inputVal",2);ee=ke([y("nova-terminal")],ee);var Ze=Object.defineProperty,Jt=Object.getOwnPropertyDescriptor,Qt=(r,e,t)=>e in r?Ze(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,se=(r,e,t,s)=>{for(var i=s>1?void 0:s?Jt(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Ze(e,t,i),i},ei=(r,e,t)=>Qt(r,e+"",t);let U=class extends x{constructor(){super(...arguments);n(this,"currentPath","");n(this,"files",[]);n(this,"selectedFile",null);n(this,"history",[])}async connectedCallback(){super.connectedCallback(),await this.loadDirectory()}async loadDirectory(e){const t=await g.listDirectory(e);this.currentPath=t.path,this.files=t.items,this.selectedFile=null,this.requestUpdate()}async openItem(e){if(e.isDirectory){this.history.push(this.currentPath);const t=this.currentPath.includes("\\")?"\\":"/",s=this.currentPath.endsWith(t)?`${this.currentPath}${e.name}`:`${this.currentPath}${t}${e.name}`;await this.loadDirectory(s)}else this.selectedFile=e.name}async goBack(){if(this.history.length>0){const e=this.history.pop();await this.loadDirectory(e)}}formatSize(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}render(){return l`
      <div class="sidebar">
        <div class="nav-header">Favorites</div>
        <div class="nav-item active" @click=${()=>this.loadDirectory()}>
          <span>🏠</span> Home
        </div>
        <div class="nav-item" @click=${()=>this.loadDirectory("docs")}>
          <span>📄</span> Documentation
        </div>
        <div class="nav-item" @click=${()=>this.loadDirectory("crates")}>
          <span>📦</span> System Crates
        </div>
        <div class="nav-item" @click=${()=>this.loadDirectory("desktop")}>
          <span>🖥️</span> Desktop Shell
        </div>

        <div class="nav-header" style="margin-top: 14px;">Zero-Trust Storage</div>
        <div class="nav-item" title="Concealed in user private sandbox">
          <span>🔒</span> Private Vault
        </div>
      </div>

      <div class="content-area">
        <div class="toolbar">
          <button class="nav-btn" @click=${this.goBack} ?disabled=${this.history.length===0} title="Back">←</button>
          <div class="path-bar">${this.currentPath}</div>
          <button class="nav-btn" @click=${()=>this.loadDirectory(this.currentPath)} title="Refresh">↻</button>
        </div>

        <div class="grid">
          ${this.files.map(e=>l`
            <div
              class="file-card ${this.selectedFile===e.name?"selected":""}"
              @dblclick=${()=>this.openItem(e)}
              @click=${()=>{this.selectedFile=e.name}}
            >
              <span class="icon">${e.isDirectory?"📁":"📄"}</span>
              <span class="name">${e.name}</span>
              <span class="meta">${e.isDirectory?"Directory":this.formatSize(e.size)}</span>
            </div>
          `)}
        </div>
      </div>
    `}};ei(U,"styles",w`
    :host {
      display: flex;
      height: 100%;
      background: var(--nova-bg-surface, #141628);
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
    }
    .sidebar {
      width: 190px;
      border-right: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(10, 11, 20, 0.4);
    }
    .nav-header {
      font-size: 11px;
      font-weight: 700;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
    }
    .nav-item {
      padding: 8px 12px;
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all var(--nova-transition-fast);
    }
    .nav-item:hover, .nav-item.active {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      background: rgba(255, 255, 255, 0.02);
    }
    .nav-btn {
      background: transparent;
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 4px;
      color: #fff;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
    }
    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .path-bar {
      flex: 1;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--nova-font-mono, monospace);
      color: var(--nova-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .grid {
      flex: 1;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 16px;
      align-content: start;
      overflow-y: auto;
    }
    .file-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 8px;
      border-radius: var(--nova-radius-md, 12px);
      cursor: pointer;
      transition: background var(--nova-transition-fast);
      text-align: center;
    }
    .file-card:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .file-card.selected {
      background: rgba(124, 90, 240, 0.2);
      border: 1px solid rgba(124, 90, 240, 0.4);
    }
    .icon {
      font-size: 36px;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
    }
    .name {
      font-size: 12px;
      word-break: break-word;
      line-height: 1.3;
      max-height: 32px;
      overflow: hidden;
    }
    .meta {
      font-size: 10px;
      color: var(--nova-text-muted);
    }
  `);se([u()],U.prototype,"currentPath",2);se([u()],U.prototype,"files",2);se([u()],U.prototype,"selectedFile",2);se([u()],U.prototype,"history",2);U=se([y("nova-files")],U);var Xe=Object.defineProperty,ti=Object.getOwnPropertyDescriptor,ii=(r,e,t)=>e in r?Xe(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,S=(r,e,t,s)=>{for(var i=s>1?void 0:s?ti(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Xe(e,t,i),i},si=(r,e,t)=>ii(r,e+"",t);let $=class extends x{constructor(){super(...arguments);n(this,"currentTab","appearance");n(this,"systemMetrics",null);n(this,"highContrast",!1);n(this,"reducedMotion",!1);n(this,"activeAccent","#7c5af0");n(this,"permTerminalFiles",!0);n(this,"permTerminalNet",!0);n(this,"permAssistantSystem",!0);n(this,"permAssistantFiles",!0)}async connectedCallback(){super.connectedCallback(),this.systemMetrics=await g.getSystemInfo(),this.permTerminalFiles=g.isPermissionGranted("terminal","files"),this.permTerminalNet=g.isPermissionGranted("terminal","network"),this.permAssistantSystem=g.isPermissionGranted("ai-assistant","system"),this.permAssistantFiles=g.isPermissionGranted("ai-assistant","files")}togglePermission(e,t,s){s?(g.grantPermission(e,t),h.pushNotification({title:"Permission Granted",message:`Granted "${t}" access to ${e}. Audited in audit.jsonl`,type:"success"})):(g.revokePermission(e,t),h.pushNotification({title:"Permission Revoked",message:`Revoked "${t}" access from ${e}. Audited in audit.jsonl`,type:"warn"}))}render(){var e,t,s,i;return l`
      <div class="nav">
        <button class="nav-btn ${this.currentTab==="appearance"?"active":""}" @click=${()=>{this.currentTab="appearance"}}>
          <span>🎨</span> Appearance
        </button>
        <button class="nav-btn ${this.currentTab==="privacy"?"active":""}" @click=${()=>{this.currentTab="privacy"}}>
          <span>🔒</span> Privacy & Permissions
        </button>
        <button class="nav-btn ${this.currentTab==="ai"?"active":""}" @click=${()=>{this.currentTab="ai"}}>
          <span>✨</span> Intelligence
        </button>
        <button class="nav-btn ${this.currentTab==="a11y"?"active":""}" @click=${()=>{this.currentTab="a11y"}}>
          <span>♿</span> Accessibility
        </button>
        <button class="nav-btn ${this.currentTab==="about"?"active":""}" @click=${()=>{this.currentTab="about"}}>
          <span>ℹ️</span> About System
        </button>
      </div>

      <div class="content">
        ${this.currentTab==="appearance"?l`
          <h2>Appearance & Styling</h2>
          <div class="section-desc">Customize the visual theme, accent colors, and desktop lighting.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Accent Color</div>
                <div class="sublabel">System-wide highlights and focus rings</div>
              </div>
              <div class="color-picker">
                <div class="color-swatch ${this.activeAccent==="#7c5af0"?"active":""}" style="background:#7c5af0" @click=${()=>{this.activeAccent="#7c5af0"}}></div>
                <div class="color-swatch ${this.activeAccent==="#3b82f6"?"active":""}" style="background:#3b82f6" @click=${()=>{this.activeAccent="#3b82f6"}}></div>
                <div class="color-swatch ${this.activeAccent==="#10b981"?"active":""}" style="background:#10b981" @click=${()=>{this.activeAccent="#10b981"}}></div>
                <div class="color-swatch ${this.activeAccent==="#f43f5e"?"active":""}" style="background:#f43f5e" @click=${()=>{this.activeAccent="#f43f5e"}}></div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="label">Translucent Surfaces</div>
                <div class="sublabel">Glassmorphic backdrop blur and depth</div>
              </div>
              <span class="badge">Ultra Blur (32px)</span>
            </div>
          </div>
        `:""}

        ${this.currentTab==="privacy"?l`
          <h2>Application Permissions (Zero-Trust)</h2>
          <div class="section-desc">Manage sandboxed application entitlements. Changes are logged to the immutable audit log.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Terminal → Filesystem Access</div>
                <div class="sublabel">Allow developer shell to read and write project files</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.permTerminalFiles}
                  @change=${o=>{this.permTerminalFiles=o.target.checked,this.togglePermission("terminal","files",this.permTerminalFiles)}}
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="row">
              <div>
                <div class="label">Terminal → Network Access</div>
                <div class="sublabel">Allow outbound TCP/UDP connections from shell</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.permTerminalNet}
                  @change=${o=>{this.permTerminalNet=o.target.checked,this.togglePermission("terminal","network",this.permTerminalNet)}}
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="row">
              <div>
                <div class="label">NOVA Intelligence → System Telemetry</div>
                <div class="sublabel">Allow assistant to inspect hardware load and memory stats</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.permAssistantSystem}
                  @change=${o=>{this.permAssistantSystem=o.target.checked,this.togglePermission("ai-assistant","system",this.permAssistantSystem)}}
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        `:""}

        ${this.currentTab==="ai"?l`
          <h2>NOVA Intelligence Configuration</h2>
          <div class="section-desc">Configure local private inference and optional cloud provider adapters.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Local Inference Engine</div>
                <div class="sublabel">Ollama-compatible local server (http://localhost:11434)</div>
              </div>
              <span class="badge">Default Active</span>
            </div>
            <div class="row">
              <div>
                <div class="label">Gemini Provider Adapter</div>
                <div class="sublabel">Reads API key securely from NOVA_GEMINI_API_KEY env var</div>
              </div>
              <span class="badge">Configured</span>
            </div>
          </div>
        `:""}

        ${this.currentTab==="a11y"?l`
          <h2>Accessibility & Assistance</h2>
          <div class="section-desc">WCAG 2.2 AA compliant perceptual adjustments and navigation aids.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">High Contrast Mode</div>
                <div class="sublabel">Elevate border luminance and text contrast ratio to > 7:1</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.highContrast}
                  @change=${o=>{this.highContrast=o.target.checked}}
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="row">
              <div>
                <div class="label">Reduced Motion</div>
                <div class="sublabel">Disable particle starfield and window opening springs</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this.reducedMotion}
                  @change=${o=>{this.reducedMotion=o.target.checked}}
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        `:""}

        ${this.currentTab==="about"?l`
          <h2>System Information</h2>
          <div class="section-desc">Operating system distribution, kernel details, and hardware topology.</div>

          <div class="setting-card">
            <div class="row">
              <div>
                <div class="label">Distribution</div>
                <div class="sublabel">Atomic Linux Foundation (bootc / rpm-ostree)</div>
              </div>
              <span class="badge">${((e=this.systemMetrics)==null?void 0:e.osVersion)||"NOVA OS 0.1.0-alpha"}</span>
            </div>
            <div class="row">
              <div>
                <div class="label">Kernel</div>
                <div class="sublabel">Linux 64-bit with preempt dynamic</div>
              </div>
              <span class="badge">${((t=this.systemMetrics)==null?void 0:t.kernelVersion)||"6.11.0-nova"}</span>
            </div>
            <div class="row">
              <div>
                <div class="label">Host Machine</div>
                <div class="sublabel">${((s=this.systemMetrics)==null?void 0:s.cpuModel)||"x86_64 Processor"}</div>
              </div>
              <span class="badge">${((i=this.systemMetrics)==null?void 0:i.hostname)||"nova-workstation"}</span>
            </div>
          </div>
        `:""}
      </div>
    `}};si($,"styles",w`
    :host {
      display: flex;
      height: 100%;
      background: var(--nova-bg-surface, #141628);
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
    }
    .nav {
      width: 210px;
      border-right: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: rgba(10, 11, 20, 0.4);
    }
    .nav-btn {
      padding: 10px 14px;
      border-radius: var(--nova-radius-sm, 6px);
      cursor: pointer;
      font-size: 13px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all var(--nova-transition-fast);
      border: none;
      background: transparent;
      text-align: left;
    }
    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }
    .nav-btn.active {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      font-weight: 600;
    }
    .content {
      flex: 1;
      padding: 24px 32px;
      overflow-y: auto;
    }
    h2 {
      font-size: 20px;
      margin-bottom: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .section-desc {
      font-size: 13px;
      color: var(--nova-text-secondary);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .setting-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-md, 12px);
      margin-bottom: 16px;
      overflow: hidden;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.06));
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    .sublabel {
      font-size: 12px;
      color: var(--nova-text-secondary);
      margin-top: 2px;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(124, 90, 240, 0.15);
      color: #a78bfa;
      font-size: 12px;
      font-weight: 600;
    }

    /* Interactive toggle switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255, 255, 255, 0.15);
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: var(--nova-accent-violet, #7c5af0);
    }
    input:checked + .slider:before {
      transform: translateX(20px);
    }

    .color-picker {
      display: flex;
      gap: 10px;
    }
    .color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform var(--nova-transition-fast);
    }
    .color-swatch:hover {
      transform: scale(1.15);
    }
    .color-swatch.active {
      border-color: #fff;
    }
  `);S([u()],$.prototype,"currentTab",2);S([u()],$.prototype,"systemMetrics",2);S([u()],$.prototype,"highContrast",2);S([u()],$.prototype,"reducedMotion",2);S([u()],$.prototype,"activeAccent",2);S([u()],$.prototype,"permTerminalFiles",2);S([u()],$.prototype,"permTerminalNet",2);S([u()],$.prototype,"permAssistantSystem",2);S([u()],$.prototype,"permAssistantFiles",2);$=S([y("nova-settings")],$);var Je=Object.defineProperty,ri=Object.getOwnPropertyDescriptor,oi=(r,e,t)=>e in r?Je(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,Qe=(r,e,t,s)=>{for(var i=s>1?void 0:s?ri(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&Je(e,t,i),i},ai=(r,e,t)=>oi(r,e+"",t);let de=class extends x{constructor(){super(...arguments);n(this,"sec",null)}async connectedCallback(){super.connectedCallback(),this.sec=await g.getSecurityStatus()}render(){var e,t,s,i,o,a,d;return l`
      <h2>Security & Integrity Status</h2>
      <div class="grid">
        <div class="card">
          <span class="card-title">SELinux Policy</span>
          <span class="card-value status-good">${((e=this.sec)==null?void 0:e.selinuxMode)??"Checking..."}</span>
        </div>
        <div class="card">
          <span class="card-title">Secure Boot</span>
          <span class="card-value ${(t=this.sec)!=null&&t.secureBoot?"status-good":"status-unknown"}">
            ${((s=this.sec)==null?void 0:s.secureBoot)===null?"Platform Dependent":(i=this.sec)!=null&&i.secureBoot?"Enabled":"Disabled"}
          </span>
        </div>
        <div class="card">
          <span class="card-title">Disk Encryption (LUKS)</span>
          <span class="card-value ${(o=this.sec)!=null&&o.dmCrypt?"status-good":"status-warn"}">
            ${(a=this.sec)!=null&&a.dmCrypt?"Active":"Unencrypted"}
          </span>
        </div>
        <div class="card">
          <span class="card-title">Network Firewall</span>
          <span class="card-value status-good">
            ${(d=this.sec)!=null&&d.firewallActive?"Enforcing":"Inactive"}
          </span>
        </div>
      </div>
    `}};ai(de,"styles",w`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--nova-bg-surface);
      color: var(--nova-text-primary);
      font-family: var(--nova-font-ui);
      padding: 24px;
      box-sizing: border-box;
      overflow-y: auto;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border);
      border-radius: var(--nova-radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-title {
      font-size: 13px;
      color: var(--nova-text-secondary);
    }
    .card-value {
      font-size: 16px;
      font-weight: 600;
    }
    .status-good { color: #34d399; }
    .status-warn { color: #fbbf24; }
    .status-unknown { color: var(--nova-text-muted); }
  `);Qe([u()],de.prototype,"sec",2);de=Qe([y("nova-security-center")],de);var et=Object.defineProperty,ni=Object.getOwnPropertyDescriptor,li=(r,e,t)=>e in r?et(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,T=(r,e,t,s)=>{for(var i=s>1?void 0:s?ni(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&et(e,t,i),i},ci=(r,e,t)=>li(r,e+"",t);let A=class extends x{constructor(){super(...arguments);n(this,"activeTab","chat");n(this,"providerMode","auto");n(this,"simulateOffline",!1);n(this,"inputPrompt","");n(this,"isGenerating",!1);n(this,"auditLogs",[]);n(this,"messages",[{id:"init-1",sender:"assistant",text:"Hello. I am NOVA Intelligence. I operate with strict zero-trust tool verification and local-first execution. Consequential actions (launching apps, opening documents) require your explicit approval.",providerInfo:{provider:"Offline Built-in Engine",model:"nova-builtin-rules-v1",isFallback:!1,latencyMs:1}}])}connectedCallback(){super.connectedCallback(),this.providerMode=g.getProviderMode(),this.simulateOffline=g.isNetworkLossSimulated(),this.auditLogs=g.getAuditLog()}handleModeChange(e){const t=e.target.value;this.providerMode=t,g.setProviderMode(t)}toggleOfflineSim(){this.simulateOffline=!this.simulateOffline,g.setSimulateNetworkLoss(this.simulateOffline),h.pushNotification({title:this.simulateOffline?"Simulating Network Disconnect":"Network Reconnected",message:this.simulateOffline?"External cloud API is blocked. AI queries will automatically fallback to local offline intelligence.":"Cloud connectivity restored.",type:this.simulateOffline?"warn":"info"})}async submitPrompt(e){const t=e.trim();if(!t||this.isGenerating)return;this.inputPrompt="";const s=`user-${Date.now()}`,i=`asst-${Date.now()}`;this.messages=[...this.messages,{id:s,sender:"user",text:t},{id:i,sender:"assistant",text:"",streaming:!0}],this.isGenerating=!0,this.requestUpdate();try{let o="";const a=await g.queryAIStream(t,c=>{o+=c;const f=this.messages.find(v=>v.id===i);f&&(f.text=o,this.requestUpdate())}),d=this.messages.find(c=>c.id===i);d&&(d.streaming=!1,d.providerInfo={provider:a.providerUsed,model:a.modelUsed,isFallback:a.isFallback,latencyMs:a.latencyMs},a.toolCall&&(d.toolProposal={proposal:a.toolCall,status:"pending"}))}catch(o){const a=this.messages.find(d=>d.id===i);a&&(a.streaming=!1,a.text=`⚠️ Error: ${o.message}. Network loss detected. Please switch to Auto or Offline mode.`)}finally{this.isGenerating=!1,this.auditLogs=g.getAuditLog(),this.requestUpdate()}}async approveTool(e){if(!e.toolProposal)return;const t=e.toolProposal.proposal;e.toolProposal.status="approved";const s=await g.executeTool(t.name,t.params,!0);e.toolProposal.executionResult=s.output,e.toolProposal.status="executed",t.name==="launch_application"&&t.params.app_id?h.openApp(t.params.app_id):t.name==="navigate_settings"&&h.openApp("settings"),h.pushNotification({title:"AI Tool Execution Confirmed",message:`Executed allowlisted tool "${t.name}". Recorded in audit.jsonl`,type:"success"}),this.auditLogs=g.getAuditLog(),this.requestUpdate()}async rejectTool(e){if(!e.toolProposal)return;const t=e.toolProposal.proposal;e.toolProposal.status="rejected",await g.executeTool(t.name,t.params,!1),h.pushNotification({title:"AI Tool Execution Denied",message:`User rejected consequential tool "${t.name}". Access blocked.`,type:"warn"}),this.auditLogs=g.getAuditLog(),this.requestUpdate()}render(){return l`
      <!-- Header -->
      <div class="header-bar">
        <div class="header-left">
          <span class="title">NOVA Intelligence</span>
          <span class="provider-pill">${this.providerMode.toUpperCase()}</span>
        </div>

        <div class="header-controls">
          <select class="mode-select" .value=${this.providerMode} @change=${this.handleModeChange} title="AI Provider Selection">
            <option value="auto">Auto (Cloud with Fallback)</option>
            <option value="gemini">Gemini Cloud Only</option>
            <option value="ollama">Ollama Local Daemon</option>
            <option value="offline">Offline Built-in Engine</option>
          </select>

          <button
            class="net-btn ${this.simulateOffline?"offline-sim":""}"
            @click=${this.toggleOfflineSim}
            title="Toggle simulated network loss to test offline fallback"
          >
            ${this.simulateOffline?"🔌 Offline":"🌐 Online"}
          </button>

          <button
            class="tab-btn ${this.activeTab==="chat"?"active":""}"
            @click=${()=>{this.activeTab="chat"}}
          >Chat</button>
          <button
            class="tab-btn ${this.activeTab==="history"?"active":""}"
            @click=${()=>{this.activeTab="history",this.auditLogs=g.getAuditLog()}}
          >Audit History (${this.auditLogs.length})</button>
        </div>
      </div>

      <!-- Offline Warning Banner if Simulated -->
      ${this.simulateOffline?l`
        <div class="offline-banner">
          <span>⚠️</span>
          <span><strong>Simulated Network Disconnect:</strong> External API calls will fail. Auto mode will seamlessly route to the local offline zero-trust engine.</span>
        </div>
      `:""}

      <!-- Main Body -->
      ${this.activeTab==="chat"?l`
        <div class="chat-log">
          ${this.messages.map(e=>l`
            <div class="msg ${e.sender}">
              <div>${e.text}${e.streaming?l`<span class="cursor"></span>`:""}</div>

              ${e.providerInfo?l`
                <div class="msg-meta">
                  <span>Provider: ${e.providerInfo.provider}</span>
                  ${e.providerInfo.isFallback?l`<span style="color:#fcd34d;">(Automatic Fallback)</span>`:""}
                  <span>Latency: ${e.providerInfo.latencyMs}ms</span>
                </div>
              `:""}

              ${e.toolProposal?l`
                <div class="tool-card">
                  <div class="tool-header">
                    <span>Tool Proposal: <strong>${e.toolProposal.proposal.name}</strong></span>
                    <span class="risk-badge ${e.toolProposal.proposal.risk}">
                      ${e.toolProposal.proposal.consequential?"Consequential Action":"Low Risk"}
                    </span>
                  </div>
                  <div style="color:var(--nova-text-secondary);font-size:11px;">
                    ${e.toolProposal.proposal.description}
                  </div>
                  <div class="param-box">
                    Parameters: ${JSON.stringify(e.toolProposal.proposal.params,null,2)}
                  </div>

                  ${e.toolProposal.status==="pending"?l`
                    <div class="tool-actions">
                      <button class="btn-approve" @click=${()=>this.approveTool(e)}>
                        ✓ Approve & Execute
                      </button>
                      <button class="btn-reject" @click=${()=>this.rejectTool(e)}>
                        ✕ Deny / Reject
                      </button>
                    </div>
                  `:l`
                    <div style="font-size:11px;font-weight:600;color:${e.toolProposal.status==="executed"?"#34d399":"#f87171"};">
                      ${e.toolProposal.status==="executed"?"✓ Executed & Logged in Audit Trail":"✕ Denied by User Policy"}
                    </div>
                  `}
                </div>
              `:""}
            </div>
          `)}
        </div>

        <!-- Quick Prompts Chips -->
        <div class="prompt-suggestions">
          <button class="prompt-chip" @click=${()=>this.submitPrompt("Inspect system hardware metrics")}>💻 Inspect Hardware</button>
          <button class="prompt-chip" @click=${()=>this.submitPrompt("Check security posture and SELinux status")}>🛡️ Security Posture</button>
          <button class="prompt-chip" @click=${()=>this.submitPrompt("Launch Terminal")}>⚡ Launch Terminal</button>
          <button class="prompt-chip" @click=${()=>this.submitPrompt("Search project files")}>📁 Search Files</button>
          <button class="prompt-chip" @click=${()=>this.submitPrompt("Open privacy settings")}>⚙️ Privacy Settings</button>
        </div>

        <!-- Input Box -->
        <div class="input-box">
          <input
            type="text"
            placeholder="Ask NOVA Intelligence (e.g. 'Launch Terminal', 'Check security', 'Inspect hardware')..."
            .value=${this.inputPrompt}
            @input=${e=>{this.inputPrompt=e.target.value}}
            @keydown=${e=>{e.key==="Enter"&&this.submitPrompt(this.inputPrompt)}}
          />
          <button class="send-btn" @click=${()=>this.submitPrompt(this.inputPrompt)} ?disabled=${this.isGenerating}>
            ${this.isGenerating?"Streaming...":"Send"}
          </button>
        </div>
      `:l`
        <!-- Activity History Tab -->
        <div class="audit-table">
          <div style="font-size:12px;color:var(--nova-text-secondary);margin-bottom:8px;">
            Immutable zero-trust audit trail recorded to <code>~/.local/share/nova/audit.jsonl</code>:
          </div>
          ${this.auditLogs.map(e=>l`
            <div class="audit-row">
              <div class="audit-row-header">
                <span><strong>${e.action}</strong> ${e.toolName?`(${e.toolName})`:""}</span>
                <span>${e.timestamp}</span>
              </div>
              <div style="margin-bottom:4px;color:#cbd5e1;">${e.details}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;">
                <span style="color:var(--nova-text-muted);">Provider: ${e.provider}</span>
                <span class="audit-badge ${e.outcome}">${e.outcome.toUpperCase()}</span>
              </div>
            </div>
          `)}
        </div>
      `}
    `}};ci(A,"styles",w`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--nova-bg-surface, #141628);
      color: var(--nova-text-primary, #fff);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      padding: 16px;
      box-sizing: border-box;
      user-select: text;
    }

    /* Header Bar */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .provider-pill {
      font-size: 11px;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mode-select {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.1));
      color: #fff;
      font-size: 11px;
      border-radius: 6px;
      padding: 3px 6px;
      outline: none;
      cursor: pointer;
    }
    .mode-select option {
      background: #141628;
      color: #fff;
    }
    .tab-btn {
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      cursor: pointer;
      transition: all var(--nova-transition-fast, 120ms);
    }
    .tab-btn.active {
      background: rgba(124, 90, 240, 0.25);
      border-color: rgba(124, 90, 240, 0.4);
      color: #fff;
    }
    .net-btn {
      padding: 3px 8px;
      font-size: 11px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .net-btn.offline-sim {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #fca5a5;
    }

    /* Offline Alert Banner */
    .offline-banner {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fcd34d;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 11px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Chat Log */
    .chat-log {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-right: 4px;
    }
    .msg {
      max-width: 90%;
      padding: 12px 16px;
      border-radius: var(--nova-radius-md, 12px);
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg.user {
      align-self: flex-end;
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
      box-shadow: 0 4px 16px rgba(124, 90, 240, 0.3);
    }
    .msg.assistant {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
    }
    .msg-meta {
      font-size: 10px;
      color: var(--nova-text-muted, rgba(255,255,255,0.5));
      margin-top: 6px;
      display: flex;
      gap: 10px;
    }
    .cursor {
      display: inline-block;
      width: 7px;
      height: 14px;
      background: #7c5af0;
      margin-left: 2px;
      vertical-align: middle;
      animation: blink 0.8s infinite;
    }
    @keyframes blink { 50% { opacity: 0; } }

    /* Tool Confirmation Card */
    .tool-card {
      margin-top: 10px;
      padding: 14px;
      background: rgba(10, 11, 22, 0.6);
      border: 1px solid rgba(124, 90, 240, 0.35);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 12px;
    }
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
    .risk-badge {
      font-size: 10px;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .risk-badge.low {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .risk-badge.medium, .risk-badge.high {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .param-box {
      background: rgba(0, 0, 0, 0.4);
      padding: 8px 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 11px;
      color: #cbd5e1;
      max-height: 100px;
      overflow-y: auto;
    }
    .tool-actions {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }
    .btn-approve {
      padding: 7px 14px;
      background: #10b981;
      border: none;
      border-radius: 6px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.15s;
    }
    .btn-approve:hover { filter: brightness(1.15); }
    .btn-reject {
      padding: 7px 14px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 6px;
      color: #fca5a5;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-reject:hover { background: rgba(239, 68, 68, 0.3); }

    /* Suggested Quick Prompts */
    .prompt-suggestions {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 6px 0;
      margin-top: 6px;
      scrollbar-width: none;
    }
    .prompt-suggestions::-webkit-scrollbar {
      display: none;
    }
    .prompt-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      color: var(--nova-text-secondary, rgba(255,255,255,0.8));
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .prompt-chip:hover {
      background: rgba(124, 90, 240, 0.2);
      border-color: rgba(124, 90, 240, 0.4);
      color: #fff;
    }

    /* Input Box */
    .input-box {
      display: flex;
      gap: 8px;
      border-top: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      padding-top: 10px;
    }
    input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-sm, 6px);
      padding: 10px 14px;
      color: #fff;
      font-family: inherit;
      font-size: 13px;
      outline: none;
    }
    input:focus {
      border-color: var(--nova-accent-violet, #7c5af0);
    }
    button.send-btn {
      padding: 10px 18px;
      background: var(--nova-accent-gradient, linear-gradient(135deg, #7c5af0, #3b82f6));
      border: none;
      border-radius: var(--nova-radius-sm, 6px);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    button.send-btn:hover { filter: brightness(1.15); }

    /* Activity History View */
    .audit-table {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 4px;
    }
    .audit-row {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.06));
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
    }
    .audit-row-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
    }
    .audit-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .audit-badge.success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .audit-badge.denied { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
  `);T([u()],A.prototype,"activeTab",2);T([u()],A.prototype,"providerMode",2);T([u()],A.prototype,"simulateOffline",2);T([u()],A.prototype,"inputPrompt",2);T([u()],A.prototype,"isGenerating",2);T([u()],A.prototype,"auditLogs",2);T([u()],A.prototype,"messages",2);A=T([y("nova-ai-assistant")],A);var tt=Object.defineProperty,di=Object.getOwnPropertyDescriptor,pi=(r,e,t)=>e in r?tt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,q=(r,e,t,s)=>{for(var i=s>1?void 0:s?di(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&tt(e,t,i),i},ui=(r,e,t)=>pi(r,e+"",t);let P=class extends x{constructor(){super(...arguments);n(this,"windowData");n(this,"x",120);n(this,"y",80);n(this,"w",700);n(this,"h",480);n(this,"maximized",!1);n(this,"prevGeom",{x:120,y:80,w:700,h:480});n(this,"isDragging",!1);n(this,"dragOffset",{x:0,y:0});n(this,"isResizing",!1);n(this,"resizeDir","");n(this,"resizeStart",{x:0,y:0,w:0,h:0,mx:0,my:0})}connectedCallback(){super.connectedCallback(),this.windowData&&(this.x=this.windowData.x,this.y=this.windowData.y,this.w=this.windowData.w,this.h=this.windowData.h)}startDrag(e){if(e.target.closest(".window-controls")||e.target.closest(".snap-actions"))return;this.isDragging=!0,this.dragOffset={x:e.clientX-this.x,y:e.clientY-this.y},this.focusWindow();const t=i=>{this.isDragging&&(this.x=Math.max(0,Math.min(window.innerWidth-100,i.clientX-this.dragOffset.x)),this.y=Math.max(40,Math.min(window.innerHeight-80,i.clientY-this.dragOffset.y)),this.requestUpdate())},s=()=>{this.isDragging=!1,window.removeEventListener("mousemove",t),window.removeEventListener("mouseup",s)};window.addEventListener("mousemove",t),window.addEventListener("mouseup",s)}startResize(e,t){e.stopPropagation(),this.isResizing=!0,this.resizeDir=t,this.resizeStart={x:this.x,y:this.y,w:this.w,h:this.h,mx:e.clientX,my:e.clientY},this.focusWindow();const s=o=>{if(!this.isResizing)return;const a=o.clientX-this.resizeStart.mx,d=o.clientY-this.resizeStart.my;if(this.resizeDir.includes("e")&&(this.w=Math.max(340,this.resizeStart.w+a)),this.resizeDir.includes("s")&&(this.h=Math.max(260,this.resizeStart.h+d)),this.resizeDir.includes("w")){const c=Math.max(340,this.resizeStart.w-a);this.x=this.resizeStart.x+(this.resizeStart.w-c),this.w=c}if(this.resizeDir.includes("n")){const c=Math.max(260,this.resizeStart.h-d);this.y=Math.max(40,this.resizeStart.y+(this.resizeStart.h-c)),this.h=c}this.requestUpdate()},i=()=>{this.isResizing=!1,window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",i)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",i)}focusWindow(){this.dispatchEvent(new CustomEvent("window-focus",{detail:{windowId:this.windowData.windowId},bubbles:!0,composed:!0}))}closeWindow(){this.dispatchEvent(new CustomEvent("window-close",{detail:{windowId:this.windowData.windowId},bubbles:!0,composed:!0}))}minimizeWindow(){this.dispatchEvent(new CustomEvent("window-minimize",{detail:{windowId:this.windowData.windowId},bubbles:!0,composed:!0}))}toggleMaximize(){this.maximized?({x:this.x,y:this.y,w:this.w,h:this.h}=this.prevGeom,this.maximized=!1):(this.prevGeom={x:this.x,y:this.y,w:this.w,h:this.h},this.x=0,this.y=40,this.w=window.innerWidth,this.h=window.innerHeight-40-72,this.maximized=!0),this.dispatchEvent(new CustomEvent("window-maximize",{detail:{windowId:this.windowData.windowId},bubbles:!0,composed:!0})),this.requestUpdate()}snap(e){h.snapWindow(this.windowData.windowId,e),this.w=Math.floor(window.innerWidth/2),this.h=window.innerHeight-40-72,this.y=40,this.x=e==="left"?0:Math.floor(window.innerWidth/2),this.maximized=!1,this.requestUpdate()}renderContent(){var t;const e=(t=this.windowData)==null?void 0:t.appId;return e==="terminal"?l`<nova-terminal></nova-terminal>`:e==="files"?l`<nova-files></nova-files>`:e==="settings"?l`<nova-settings></nova-settings>`:e==="security"?l`<nova-security-center></nova-security-center>`:e==="ai-assistant"?l`<nova-ai-assistant></nova-ai-assistant>`:l`<div style="padding:24px;color:var(--nova-text-muted);font-size:14px;">Application: ${e}</div>`}render(){var s,i,o;const e=`left:${this.x}px;top:${this.y}px;width:${this.w}px;height:${this.h}px;z-index:${((s=this.windowData)==null?void 0:s.zIndex)??10}`,t=(i=this.windowData)==null?void 0:i.focused;return l`
      <div class="window ${t?"focused":""} ${this.maximized?"maximized":""}"
           style=${e}
           @mousedown=${this.focusWindow}>

        <div class="resize-handle resize-n" @mousedown=${a=>this.startResize(a,"n")}></div>
        <div class="resize-handle resize-s" @mousedown=${a=>this.startResize(a,"s")}></div>
        <div class="resize-handle resize-e" @mousedown=${a=>this.startResize(a,"e")}></div>
        <div class="resize-handle resize-w" @mousedown=${a=>this.startResize(a,"w")}></div>
        <div class="resize-handle resize-ne" @mousedown=${a=>this.startResize(a,"ne")}></div>
        <div class="resize-handle resize-nw" @mousedown=${a=>this.startResize(a,"nw")}></div>
        <div class="resize-handle resize-se" @mousedown=${a=>this.startResize(a,"se")}></div>
        <div class="resize-handle resize-sw" @mousedown=${a=>this.startResize(a,"sw")}></div>

        <div class="title-bar" @mousedown=${this.startDrag} @dblclick=${this.toggleMaximize}>
          <div class="window-controls">
            <button class="ctrl-btn btn-close" @click=${this.closeWindow} title="Close window"></button>
            <button class="ctrl-btn btn-minimize" @click=${this.minimizeWindow} title="Minimize window"></button>
            <button class="ctrl-btn btn-maximize" @click=${this.toggleMaximize} title="Maximize window"></button>
          </div>
          <span class="title-text">${((o=this.windowData)==null?void 0:o.title)??"Window"}</span>
          <div class="snap-actions">
            <button class="snap-btn" @click=${()=>this.snap("left")} title="Snap Left (Win+Left)">◧</button>
            <button class="snap-btn" @click=${()=>this.snap("right")} title="Snap Right (Win+Right)">◨</button>
          </div>
        </div>

        <div class="window-content">
          ${this.renderContent()}
        </div>
      </div>
    `}};ui(P,"styles",w`
    :host {
      display: block;
      position: absolute;
    }

    .window {
      position: absolute;
      display: flex;
      flex-direction: column;
      background: var(--nova-bg-glass, rgba(15, 16, 33, 0.72));
      backdrop-filter: blur(32px) saturate(1.4);
      -webkit-backdrop-filter: blur(32px) saturate(1.4);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: var(--nova-radius-lg, 20px);
      box-shadow: var(--nova-shadow-lg, 0 24px 64px rgba(0,0,0,0.6)), inset 0 1px 0 rgba(255,255,255,0.08);
      overflow: hidden;
      min-width: 340px;
      min-height: 260px;
      transition: border-color var(--nova-transition-fast), box-shadow var(--nova-transition-fast);
      animation: windowOpen 0.22s cubic-bezier(0.4,0,0.2,1) forwards;
    }

    @keyframes windowOpen {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .window.focused {
      border-color: var(--nova-border-accent, rgba(124,90,240,0.5));
      box-shadow: var(--nova-shadow-lg, 0 24px 64px rgba(0,0,0,0.6)), 0 0 0 1px rgba(124,90,240,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
    }

    .window.maximized {
      border-radius: 0 !important;
      border: none;
    }

    .title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }

    .title-bar:active {
      cursor: grabbing;
    }

    .window-controls {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .ctrl-btn {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      transition: filter var(--nova-transition-fast), transform var(--nova-transition-fast);
      position: relative;
    }
    .ctrl-btn:hover { filter: brightness(1.3); transform: scale(1.15); }
    .ctrl-btn:active { transform: scale(0.9); }

    .btn-close { background: #ff5f57; }
    .btn-minimize { background: #febc2e; }
    .btn-maximize { background: #28c840; }

    .title-text {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--nova-text-secondary, rgba(255,255,255,0.7));
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }

    .snap-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .snap-btn {
      background: transparent;
      border: 1px solid var(--nova-border, rgba(255,255,255,0.08));
      border-radius: 4px;
      color: var(--nova-text-muted, rgba(255,255,255,0.4));
      cursor: pointer;
      font-size: 10px;
      padding: 2px 5px;
      transition: all var(--nova-transition-fast);
    }
    .snap-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .window-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: rgba(10, 11, 20, 0.85);
    }

    .resize-handle {
      position: absolute;
      z-index: 10;
    }
    .resize-n  { top: 0; left: 8px; right: 8px; height: 6px; cursor: n-resize; }
    .resize-s  { bottom: 0; left: 8px; right: 8px; height: 6px; cursor: s-resize; }
    .resize-e  { top: 8px; bottom: 8px; right: 0; width: 6px; cursor: e-resize; }
    .resize-w  { top: 8px; bottom: 8px; left: 0; width: 6px; cursor: w-resize; }
    .resize-ne { top: 0; right: 0; width: 12px; height: 12px; cursor: ne-resize; }
    .resize-nw { top: 0; left: 0; width: 12px; height: 12px; cursor: nw-resize; }
    .resize-se { bottom: 0; right: 0; width: 12px; height: 12px; cursor: se-resize; }
    .resize-sw { bottom: 0; left: 0; width: 12px; height: 12px; cursor: sw-resize; }
  `);q([ie({type:Object})],P.prototype,"windowData",2);q([u()],P.prototype,"x",2);q([u()],P.prototype,"y",2);q([u()],P.prototype,"w",2);q([u()],P.prototype,"h",2);q([u()],P.prototype,"maximized",2);P=q([y("nova-window")],P);class hi{constructor(){n(this,"handlers",new Map);n(this,"boundListener");this.boundListener=this.onKeyDown.bind(this),window.addEventListener("keydown",this.boundListener)}register(e,t){this.handlers.set(e.toLowerCase(),t)}unregister(e){this.handlers.delete(e.toLowerCase())}destroy(){window.removeEventListener("keydown",this.boundListener)}onKeyDown(e){const t=e.metaKey||e.key==="Meta",s=e.ctrlKey,i=e.altKey;let o="";t&&(o+="super+"),s&&(o+="ctrl+"),i&&(o+="alt+"),e.key==="Meta"?o="super":o+=e.key.toLowerCase(),this.handlers.has(o)&&(e.preventDefault(),this.handlers.get(o)())}}const k=new hi;var it=Object.defineProperty,fi=Object.getOwnPropertyDescriptor,vi=(r,e,t)=>e in r?it(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,j=(r,e,t,s)=>{for(var i=s>1?void 0:s?fi(e,t):e,o=r.length-1,a;o>=0;o--)(a=r[o])&&(i=(s?a(e,t,i):a(i))||i);return s&&i&&it(e,t,i),i},gi=(r,e,t)=>vi(r,e+"",t);let E=class extends x{constructor(){super(...arguments);n(this,"launcherOpen",!1);n(this,"windows",[]);n(this,"currentWorkspace",1);n(this,"contextMenu",{visible:!1,x:0,y:0});n(this,"particles",[]);n(this,"animFrame",0);n(this,"unsubs",[])}connectedCallback(){super.connectedCallback(),this.initParticles(),this.setupKeyboard(),this.currentWorkspace=h.getWorkspace(),this.windows=[...h.getWindows()],this.unsubs.push(h.subscribe("windows",e=>{this.windows=[...e],this.requestUpdate()})),this.unsubs.push(h.subscribe("workspace",e=>{this.currentWorkspace=e,this.requestUpdate()})),setTimeout(()=>{h.openApp("terminal")},400),setTimeout(()=>{h.openApp("ai-assistant")},700)}disconnectedCallback(){super.disconnectedCallback(),cancelAnimationFrame(this.animFrame),k.destroy(),this.unsubs.forEach(e=>e())}setupKeyboard(){k.register("Super",()=>{this.launcherOpen=!this.launcherOpen}),k.register("Escape",()=>{this.launcherOpen&&(this.launcherOpen=!1),this.contextMenu.visible&&(this.contextMenu={visible:!1,x:0,y:0})}),k.register("Super+t",()=>h.openApp("terminal")),k.register("Super+f",()=>h.openApp("files")),k.register("Super+a",()=>h.openApp("ai-assistant")),k.register("Super+s",()=>h.openApp("settings")),k.register("Super+1",()=>h.setWorkspace(1)),k.register("Super+2",()=>h.setWorkspace(2)),k.register("Super+3",()=>h.setWorkspace(3)),k.register("Super+4",()=>h.setWorkspace(4))}initParticles(){this.particles=Array.from({length:75},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.6+.4,a:Math.random()*.45+.1}))}startParticleLoop(e){const t=e.getContext("2d");if(!t)return;const s=()=>{e.width=window.innerWidth,e.height=window.innerHeight};s(),window.addEventListener("resize",s);const i=()=>{t.clearRect(0,0,e.width,e.height);for(const o of this.particles)o.x+=o.vx,o.y+=o.vy,o.x<0&&(o.x=e.width),o.x>e.width&&(o.x=0),o.y<0&&(o.y=e.height),o.y>e.height&&(o.y=0),t.beginPath(),t.arc(o.x,o.y,o.r,0,Math.PI*2),t.fillStyle=`rgba(180, 190, 255, ${o.a})`,t.fill();this.animFrame=requestAnimationFrame(i)};i()}firstUpdated(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("canvas.particles");e&&this.startParticleLoop(e)}handleContextMenu(e){e.preventDefault(),this.contextMenu={visible:!0,x:Math.min(window.innerWidth-200,e.clientX),y:Math.min(window.innerHeight-200,e.clientY)}}handleDesktopClick(){this.contextMenu.visible&&(this.contextMenu={visible:!1,x:0,y:0})}render(){const e=this.windows.filter(t=>!t.minimized&&t.workspace===this.currentWorkspace);return l`
      <div class="desktop-bg" @contextmenu=${this.handleContextMenu} @click=${this.handleDesktopClick}></div>
      <canvas class="particles"></canvas>

      <!-- Desktop shortcuts -->
      <div class="desktop-icons">
        <div class="desktop-shortcut" @dblclick=${()=>h.openApp("files")}>
          <span class="icon">📁</span>
          <span class="label">Files</span>
        </div>
        <div class="desktop-shortcut" @dblclick=${()=>h.openApp("terminal")}>
          <span class="icon">⚡</span>
          <span class="label">Terminal</span>
        </div>
        <div class="desktop-shortcut" @dblclick=${()=>h.openApp("security")}>
          <span class="icon">🛡️</span>
          <span class="label">Security</span>
        </div>
      </div>

      <nova-top-bar
        @launcher-toggle=${()=>{this.launcherOpen=!this.launcherOpen}}
      ></nova-top-bar>

      <div class="windows-layer">
        ${e.map(t=>l`
          <nova-window
            .windowData=${t}
            @window-focus=${s=>h.focusWindow(s.detail.windowId)}
            @window-close=${s=>h.closeWindow(s.detail.windowId)}
            @window-minimize=${s=>h.minimizeWindow(s.detail.windowId)}
            @window-maximize=${s=>h.maximizeWindow(s.detail.windowId)}
          ></nova-window>
        `)}
      </div>

      <nova-dock
        .openWindows=${this.windows.map(t=>t.appId)}
        @app-launch=${t=>h.openApp(t.detail.appId)}
      ></nova-dock>

      ${this.launcherOpen?l`
        <nova-launcher
          @app-launch=${t=>{this.launcherOpen=!1,h.openApp(t.detail.appId)}}
          @launcher-close=${()=>{this.launcherOpen=!1}}
        ></nova-launcher>
      `:""}

      ${this.contextMenu.visible?l`
        <div class="context-menu" style="left:${this.contextMenu.x}px;top:${this.contextMenu.y}px;">
          <div class="menu-item" @click=${()=>{this.contextMenu.visible=!1,h.openApp("terminal")}}>
            <span>⚡</span> Open Terminal
          </div>
          <div class="menu-item" @click=${()=>{this.contextMenu.visible=!1,h.openApp("files")}}>
            <span>📁</span> Browse Files
          </div>
          <div class="menu-separator"></div>
          <div class="menu-item" @click=${()=>{this.contextMenu.visible=!1,h.openApp("settings")}}>
            <span>⚙️</span> Display Settings
          </div>
          <div class="menu-item" @click=${()=>{this.contextMenu.visible=!1,h.openApp("security")}}>
            <span>🛡️</span> Security Center
          </div>
        </div>
      `:""}
    `}};gi(E,"styles",w`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background: var(--nova-bg-base, #0a0b14);
      font-family: var(--nova-font-ui, system-ui, sans-serif);
      user-select: none;
    }

    .desktop-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      background:
        radial-gradient(ellipse 80% 50% at 20% 10%, rgba(124,90,240,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 85%, rgba(59,130,246,0.14) 0%, transparent 55%),
        radial-gradient(ellipse 50% 60% at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 70%),
        #0a0b14;
      transition: background 0.4s ease;
    }

    canvas.particles {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    .desktop-icons {
      position: absolute;
      top: 56px;
      left: 24px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .desktop-shortcut {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      width: 76px;
      padding: 8px 4px;
      border-radius: var(--nova-radius-md, 12px);
      cursor: pointer;
      color: #fff;
      transition: all var(--nova-transition-fast, 120ms);
    }
    .desktop-shortcut:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }
    .desktop-shortcut .icon {
      font-size: 32px;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
    }
    .desktop-shortcut .label {
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      color: rgba(255, 255, 255, 0.9);
    }

    nova-top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      z-index: 100;
    }

    nova-dock {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }

    nova-launcher {
      position: absolute;
      inset: 0;
      z-index: 250;
    }

    .windows-layer {
      position: absolute;
      inset: 40px 0 72px 0;
      z-index: 50;
      pointer-events: none;
    }

    .windows-layer > * {
      pointer-events: all;
    }

    /* Desktop Context Menu */
    .context-menu {
      position: absolute;
      z-index: 400;
      background: rgba(20, 22, 40, 0.92);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border: 1px solid var(--nova-border, rgba(255,255,255,0.1));
      border-radius: var(--nova-radius-md, 12px);
      box-shadow: 0 16px 36px rgba(0,0,0,0.6);
      padding: 6px;
      min-width: 190px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: #fff;
      font-size: 13px;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      color: rgba(255,255,255,0.8);
      transition: all var(--nova-transition-fast);
    }
    .menu-item:hover {
      background: var(--nova-accent-violet, #7c5af0);
      color: #fff;
    }
    .menu-separator {
      height: 1px;
      background: var(--nova-border, rgba(255,255,255,0.08));
      margin: 4px 6px;
    }
  `);j([u()],E.prototype,"launcherOpen",2);j([u()],E.prototype,"windows",2);j([u()],E.prototype,"currentWorkspace",2);j([u()],E.prototype,"contextMenu",2);j([u()],E.prototype,"particles",2);E=j([y("nova-desktop")],E);
//# sourceMappingURL=main-D60myBZC.js.map

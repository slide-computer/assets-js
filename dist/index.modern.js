import{Actor as e}from"@dfinity/agent";import{fileTypeFromBuffer as t}from"file-type";import n from"p-limit";const c=({IDL:e})=>{const t=e.Record({}),n=e.Nat,c=e.Text,o=e.Record({key:c,content_type:e.Text}),i=e.Record({key:c,content_encoding:e.Text}),r=e.Record({key:c}),a=e.Nat,s=e.Record({key:c,sha256:e.Opt(e.Vec(e.Nat8)),chunk_ids:e.Vec(a),content_encoding:e.Text}),l=e.Variant({CreateAsset:o,UnsetAssetContent:i,DeleteAsset:r,SetAssetContent:s,Clear:t}),d=e.Tuple(e.Text,e.Text),u=e.Record({url:e.Text,method:e.Text,body:e.Vec(e.Nat8),headers:e.Vec(d)}),y=e.Record({key:c,sha256:e.Opt(e.Vec(e.Nat8)),index:e.Nat,content_encoding:e.Text}),h=e.Record({token:e.Opt(y),body:e.Vec(e.Nat8)}),p=e.Variant({Callback:e.Record({token:y,callback:e.Func([y],[e.Opt(h)],["query"])})}),_=e.Record({body:e.Vec(e.Nat8),headers:e.Vec(d),streaming_strategy:e.Opt(p),status_code:e.Nat16}),m=e.Int;return e.Service({authorize:e.Func([e.Principal],[],[]),clear:e.Func([t],[],[]),commit_batch:e.Func([e.Record({batch_id:n,operations:e.Vec(l)})],[],[]),create_asset:e.Func([o],[],[]),create_batch:e.Func([e.Record({})],[e.Record({batch_id:n})],[]),create_chunk:e.Func([e.Record({content:e.Vec(e.Nat8),batch_id:n})],[e.Record({chunk_id:a})],[]),delete_content:e.Func([r],[],[]),get:e.Func([e.Record({key:c,accept_encodings:e.Vec(e.Text)})],[e.Record({content:e.Vec(e.Nat8),sha256:e.Opt(e.Vec(e.Nat8)),content_type:e.Text,content_encoding:e.Text,total_length:e.Nat})],["query"]),get_chunk:e.Func([e.Record({key:c,sha256:e.Opt(e.Vec(e.Nat8)),index:e.Nat,content_encoding:e.Text})],[e.Record({content:e.Vec(e.Nat8)})],["query"]),http_request:e.Func([u],[_],["query"]),http_request_streaming_callback:e.Func([y],[e.Opt(h)],["query"]),list:e.Func([e.Record({})],[e.Vec(e.Record({key:c,encodings:e.Vec(e.Record({modified:m,sha256:e.Opt(e.Vec(e.Nat8)),length:e.Nat,content_encoding:e.Text})),content_type:e.Text}))],["query"]),set_asset_content:e.Func([s],[],[]),store:e.Func([e.Record({key:c,content:e.Vec(e.Nat8),sha256:e.Opt(e.Vec(e.Nat8)),content_type:e.Text,content_encoding:e.Text})],[],[]),unset_asset_content:e.Func([i],[],[])})},o=["concurrency","maxSingleFileSize","maxChunkSize","eventListener"],i="undefined"!=typeof window&&void 0!==window.document,r="undefined"!=typeof process&&null!=process.versions&&null!=process.versions.node,a="object"==typeof self&&self.constructor&&"DedicatedWorkerGlobalScope"===self.constructor.name,s=i?Promise.resolve(window.crypto):a?Promise.resolve(self.crypto):r?import("crypto"):Promise.resolve(),l=async(e,n)=>{var c,o,l;let d,u=null==n?void 0:n.fileName,y=null==n?void 0:n.contentType,h=null!=(c=null==n?void 0:n.path)?c:"/";if(e instanceof Uint8Array)d=Array.from(e);else if(Array.isArray(e)&&e.every(e=>"number"==typeof e))d=e;else{if(!(e instanceof Blob))throw"Asset could not be read (File, Blob, ArrayBuffer, Uint8Array and number[] are valid";if(d=await new Promise(t=>{const n=new FileReader;n.addEventListener("load",()=>{t(Array.from(Uint8Array.from(n.result)))}),n.readAsArrayBuffer(e)}),!u){if(!(e instanceof File))throw'"fileName" property is required in options';u=e.name}y||(y=e.type)}h.startsWith("/")||(h="/"+h),h.endsWith("/")||(h+="/");const p=null!=(o=null==n?void 0:n.contentEncoding)?o:"identity",_=null!=(l=null==n?void 0:n.sha256)?l:await(async e=>i||a?Array.from(new Uint8Array(await(await s).subtle.digest("SHA-256",new Uint8Array(e)))):r?Array.from((await s).createHash("sha256").update(new Uint8Array(e)).digest()):void 0)(d);if(!y){var m;const{mime:e="application/octet-stream"}=null!=(m=await t(Uint8Array.from(d)))?m:{};y=e}return{fileName:u,path:h,content:d,contentType:y,contentEncoding:p,sha256:_}};class d{constructor(t){var i=this;let{concurrency:r,maxSingleFileSize:a,maxChunkSize:s,eventListener:d}=t,u=function(e,t){if(null==e)return{};var n,c,o={},i=Object.keys(e);for(c=0;c<i.length;c++)t.indexOf(n=i[c])>=0||(o[n]=e[n]);return o}(t,o);this._actor=void 0,this._pLimit=void 0,this._maxSingleFileSize=void 0,this._maxChunkSize=void 0,this._eventListener=void 0,this.list=()=>this._pLimit(()=>this._actor.list({})),this.batch=()=>{const e=[];return{commit:async function(){const{batch_id:t}=await i._pLimit(()=>i._actor.create_batch({})),n=(await Promise.all(e.map(e=>e(t)))).flat();await i._pLimit(()=>i._actor.commit_batch({batch_id:t,operations:n})),n.forEach(e=>{"DeleteAsset"in e&&i._eventListener({key:e.DeleteAsset.key,type:"delete"})})},insert:async function(t,n){const c=await l(t,n),o=[c.path,c.fileName].join("");return i._eventListener({key:o,type:"insert",progress:{current:0,total:c.content.length}}),e.push(async function(e){const t=c.content.reduce((e,t,n)=>{const c=Math.floor(n/i._maxChunkSize);return e[c]||(e[c]=[]),e[c].push(t),e},[]);let n=0;const r=await Promise.all(t.map(async function(t){const{chunk_id:r}=await i._pLimit(()=>i._actor.create_chunk({content:t,batch_id:e}));return n+=t.length,i._eventListener({key:o,type:"insert",progress:{current:n,total:c.content.length}}),r}));return[{CreateAsset:{key:o,content_type:c.contentType}},{SetAssetContent:{key:o,sha256:c.sha256?[c.sha256]:[],chunk_ids:r,content_encoding:c.contentEncoding}}]}),o},delete:async function(t){e.push(async function(){return[{DeleteAsset:{key:t}}]})}}},this.insert=async function(e,t){const n=await l(e,t),c=[n.path,n.fileName].join("");if(n.content.length<=i._maxSingleFileSize)i._eventListener({key:c,type:"insert",progress:{current:0,total:n.content.length}}),await i._pLimit(()=>i._actor.store({key:c,content:n.content,content_type:n.contentType,sha256:n.sha256?[n.sha256]:[],content_encoding:n.contentEncoding}));else{const e=i.batch();await e.insert(n.content,n),await e.commit()}return c},this.delete=async function(e){await i._pLimit(()=>i._actor.delete_content({key:e})),i._eventListener({key:e,type:"delete"})},this._actor=e.createActor(c,u),this._pLimit=n(null!=r?r:32),this._maxSingleFileSize=null!=a?a:45e4,this._maxChunkSize=null!=s?s:19e5,this._eventListener=null!=d?d:()=>null}}export{d as AssetManager};
//# sourceMappingURL=index.modern.js.map

!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("@dfinity/agent"),require("mime-types"),require("p-limit")):"function"==typeof define&&define.amd?define(["exports","@dfinity/agent","mime-types","p-limit"],t):t((e||self).assets={},e.agent,e.mimeTypes,e.pLimit)}(this,function(e,t,n,r){function i(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var o=/*#__PURE__*/i(n),c=/*#__PURE__*/i(r),a=function(e){var t=e.IDL,n=t.Record({}),r=t.Nat,i=t.Text,o=t.Record({key:i,content_type:t.Text}),c=t.Record({key:i,content_encoding:t.Text}),a=t.Record({key:i}),s=t.Nat,u=t.Record({key:i,sha256:t.Opt(t.Vec(t.Nat8)),chunk_ids:t.Vec(s),content_encoding:t.Text}),l=t.Variant({CreateAsset:o,UnsetAssetContent:c,DeleteAsset:a,SetAssetContent:u,Clear:n}),h=t.Tuple(t.Text,t.Text),d=t.Record({url:t.Text,method:t.Text,body:t.Vec(t.Nat8),headers:t.Vec(h)}),f=t.Record({key:i,sha256:t.Opt(t.Vec(t.Nat8)),index:t.Nat,content_encoding:t.Text}),y=t.Record({token:t.Opt(f),body:t.Vec(t.Nat8)}),m=t.Variant({Callback:t.Record({token:f,callback:t.Func([f],[t.Opt(y)],["query"])})}),p=t.Record({body:t.Vec(t.Nat8),headers:t.Vec(h),streaming_strategy:t.Opt(m),status_code:t.Nat16}),_=t.Int;return t.Service({authorize:t.Func([t.Principal],[],[]),clear:t.Func([n],[],[]),commit_batch:t.Func([t.Record({batch_id:r,operations:t.Vec(l)})],[],[]),create_asset:t.Func([o],[],[]),create_batch:t.Func([t.Record({})],[t.Record({batch_id:r})],[]),create_chunk:t.Func([t.Record({content:t.Vec(t.Nat8),batch_id:r})],[t.Record({chunk_id:s})],[]),delete_content:t.Func([a],[],[]),get:t.Func([t.Record({key:i,accept_encodings:t.Vec(t.Text)})],[t.Record({content:t.Vec(t.Nat8),sha256:t.Opt(t.Vec(t.Nat8)),content_type:t.Text,content_encoding:t.Text,total_length:t.Nat})],["query"]),get_chunk:t.Func([t.Record({key:i,sha256:t.Opt(t.Vec(t.Nat8)),index:t.Nat,content_encoding:t.Text})],[t.Record({content:t.Vec(t.Nat8)})],["query"]),http_request:t.Func([d],[p],["query"]),http_request_streaming_callback:t.Func([f],[t.Opt(y)],["query"]),list:t.Func([t.Record({})],[t.Vec(t.Record({key:i,encodings:t.Vec(t.Record({modified:_,sha256:t.Opt(t.Vec(t.Nat8)),length:t.Nat,content_encoding:t.Text})),content_type:t.Text}))],["query"]),set_asset_content:t.Func([u],[],[]),store:t.Func([t.Record({key:i,content:t.Vec(t.Nat8),sha256:t.Opt(t.Vec(t.Nat8)),content_type:t.Text,content_encoding:t.Text})],[],[]),unset_asset_content:t.Func([c],[],[])})},s=["concurrency","maxSingleFileSize","maxChunkSize","eventListener"];"undefined"!=typeof process&&null!=process.versions&&process;var u=function(e,n){try{var r,i,c=function(e){var r,c;u.startsWith("/")||(u="/"+u),u.endsWith("/")||(u+="/");var l=null!=(r=null==n?void 0:n.contentEncoding)?r:"identity",h=null!=(c=null==n?void 0:n.sha256)?c:Array.from(new Uint8Array(t.hash(new Uint8Array(i))));return s||(s=o.default.lookup(a)||"application/octet-stream"),{fileName:a,path:u,content:i,contentType:s,contentEncoding:l,sha256:h}},a=null==n?void 0:n.fileName,s=null==n?void 0:n.contentType,u=null!=(r=null==n?void 0:n.path)?r:"/",l=function(){if(!(e instanceof Uint8Array))return function(){if(!Array.isArray(e)||!e.every(function(e){return"number"==typeof e}))return function(){if(e instanceof Blob)return Promise.resolve(new Promise(function(t){var n=new FileReader;n.addEventListener("load",function(){t(Array.from(Uint8Array.from(n.result)))}),n.readAsArrayBuffer(e)})).then(function(t){if(i=t,!a){if(!(e instanceof File))throw'"fileName" property is required in options';a=e.name}s||(s=e.type)});throw"Asset could not be read (File, Blob, ArrayBuffer, Uint8Array and number[] are valid"}();i=e}();i=Array.from(e)}();return Promise.resolve(l&&l.then?l.then(c):c())}catch(e){return Promise.reject(e)}};e.AssetManager=function(e){var n=this,r=this,i=this,o=e.concurrency,l=e.maxSingleFileSize,h=e.maxChunkSize,d=e.eventListener,f=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)t.indexOf(n=o[r])>=0||(i[n]=e[n]);return i}(e,s);this._actor=void 0,this._pLimit=void 0,this._maxSingleFileSize=void 0,this._maxChunkSize=void 0,this._eventListener=void 0,this.list=function(){return i._pLimit(function(){return i._actor.list({})})},this.batch=function(){var e=[];return{commit:function(){try{return Promise.resolve(i._pLimit(function(){return i._actor.create_batch({})})).then(function(t){var n=t.batch_id;return Promise.resolve(Promise.all(e.map(function(e){return e(n)}))).then(function(e){var t=e.flat();return Promise.resolve(i._pLimit(function(){return i._actor.commit_batch({batch_id:n,operations:t})})).then(function(){t.forEach(function(e){"DeleteAsset"in e&&i._eventListener({key:e.DeleteAsset.key,type:"delete"})})})})})}catch(e){return Promise.reject(e)}},insert:function(t,n){return Promise.resolve(u(t,n)).then(function(t){var n=[t.path,t.fileName].join("");return i._eventListener({key:n,type:"insert",progress:{current:0,total:t.content.length}}),e.push(function(e){try{var r=t.content.reduce(function(e,t,n){var r=Math.floor(n/i._maxChunkSize);return e[r]||(e[r]=[]),e[r].push(t),e},[]),o=0;return Promise.resolve(Promise.all(r.map(function(r){try{return Promise.resolve(i._pLimit(function(){return i._actor.create_chunk({content:r,batch_id:e})})).then(function(e){var c=e.chunk_id;return i._eventListener({key:n,type:"insert",progress:{current:o+=r.length,total:t.content.length}}),c})}catch(e){return Promise.reject(e)}}))).then(function(e){return[{CreateAsset:{key:n,content_type:t.contentType}},{SetAssetContent:{key:n,sha256:t.sha256?[t.sha256]:[],chunk_ids:e,content_encoding:t.contentEncoding}}]})}catch(e){return Promise.reject(e)}}),n})},delete:function(t){try{return e.push(function(){try{return Promise.resolve([{DeleteAsset:{key:t}}])}catch(e){return Promise.reject(e)}}),Promise.resolve()}catch(e){return Promise.reject(e)}}}},this.insert=function(e,t){return Promise.resolve(u(e,t)).then(function(e){var t=[e.path,e.fileName].join(""),r=function(){if(e.content.length<=n._maxSingleFileSize)return n._eventListener({key:t,type:"insert",progress:{current:0,total:e.content.length}}),Promise.resolve(n._pLimit(function(){return n._actor.store({key:t,content:e.content,content_type:e.contentType,sha256:e.sha256?[e.sha256]:[],content_encoding:e.contentEncoding})})).then(function(){});var r=n.batch();return Promise.resolve(r.insert(e.content,e)).then(function(){return Promise.resolve(r.commit()).then(function(){})})}();return r&&r.then?r.then(function(){return t}):t})},this.delete=function(e){try{return Promise.resolve(r._pLimit(function(){return r._actor.delete_content({key:e})})).then(function(){r._eventListener({key:e,type:"delete"})})}catch(e){return Promise.reject(e)}},this._actor=t.Actor.createActor(a,f),this._pLimit=c.default(null!=o?o:32),this._maxSingleFileSize=null!=l?l:45e4,this._maxChunkSize=null!=h?h:19e5,this._eventListener=null!=d?d:function(){return null}}});
//# sourceMappingURL=index.cjs.map

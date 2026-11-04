(() => {
  'use strict';
  const categories={vystavba:'Výstavba domů',leseni:'Lešení',fasady:'Fasádní práce',strechy:'Střechy a krovy',dlazba:'Zámková dlažba',beton:'Betonářské práce',zemni:'Zemní a výkopové práce',vzduchotechnika:'Vzduchotechnika',doprava:'Kontejnerová doprava'};
  const root='images/realizace/';
  const imageURL=path=>path.split('/').map(encodeURIComponent).join('/');
  const repo='fedyastoyka-ux/Mafelona';
  const grid=document.getElementById('gallery-grid'), status=document.getElementById('gallery-status'), filters=document.getElementById('gallery-filters');
  const viewer=document.getElementById('photo-viewer'), full=document.getElementById('photo-full'), caption=document.getElementById('photo-caption'), counter=document.getElementById('photo-counter');
  let photos=[], selected='all', visible=[], photoList=[], current=0, opener;
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);return b;};
  function render(){
    filters.replaceChildren();
    for(const [key,label] of [['all','Vše'],...Object.entries(categories)]){
      const n=photos.filter(p=>key==='all'||p.categories.includes(key)).length;
      const b=button(`${label} (${n})`,()=>{selected=key;render();document.querySelector(`[data-category="${key}"]`).focus();});
      b.dataset.category=key;b.setAttribute('aria-pressed',String(key===selected));filters.append(b);
    }
    visible=photos.filter(p=>selected==='all'||p.categories.includes(selected));grid.replaceChildren();
    status.textContent=visible.length?`${visible.length} fotografií · klepnutím zvětšíte`:'Fotografie v této kategorii připravujeme.';
    visible.forEach((p,index)=>{
      const b=button('',()=>openPhoto(index,b));b.className='realization';b.setAttribute('aria-label',`Zvětšit: ${p.alt}`);
      const img=document.createElement('img');img.src=imageURL(p.src);img.alt=p.alt;img.loading='lazy';img.decoding='async';
      const label=document.createElement('span');label.textContent=categories[p.categories[0]]||'Realizace';b.append(img,label);grid.append(b);
    });
  }
  function showPhoto(index){current=(index+photoList.length)%photoList.length;const p=photoList[current];full.src=imageURL(p.src);full.alt=p.alt;caption.textContent=p.alt;counter.textContent=`${current+1} / ${photoList.length}`;}
  function openPhoto(index,b,list=visible){opener=b;photoList=list;document.getElementById('photo-prev').hidden=list.length<2;document.getElementById('photo-next').hidden=list.length<2;showPhoto(index);viewer.showModal();document.body.classList.add('photo-open');document.getElementById('photo-close').focus();}
  document.querySelectorAll('.service-photo').forEach(b=>b.addEventListener('click',()=>{const img=b.querySelector('img');openPhoto(0,b,[{src:img.getAttribute('src'),alt:img.alt}]);}));
  document.getElementById('photo-close').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('close',()=>{document.body.classList.remove('photo-open');opener?.focus();});
  document.getElementById('photo-prev').addEventListener('click',()=>showPhoto(current-1));
  document.getElementById('photo-next').addEventListener('click',()=>showPhoto(current+1));
  viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(current-1);}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(current+1);}});
  viewer.addEventListener('click',e=>{if(e.target===viewer){const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close();}});
  let touchX=null;full.addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});full.addEventListener('touchend',e=>{if(touchX!==null){const d=e.changedTouches[0].clientX-touchX;if(Math.abs(d)>50)showPhoto(current+(d<0?1:-1));touchX=null;}},{passive:true});
  const select=document.getElementById('upload-category'), upload=document.getElementById('gallery-upload');
  Object.entries(categories).forEach(([key,label])=>{const o=document.createElement('option');o.value=key;o.textContent=label;select.append(o);});
  function uploadLink(){upload.href=`https://github.com/${repo}/upload/main/${root}${select.value}`;}
  select.addEventListener('change',uploadLink);uploadLink();
  const cacheKey='mafelona-gallery-tree-v2';
  function mergePaths(paths){const existing=new Set(photos.map(p=>p.src));for(const path of paths){if(existing.has(path)||path==='images/realizace/beton/realizace-11.jpg')continue;const cat=path.slice(root.length).split('/')[0];if(!categories[cat])continue;photos.push({src:path,categories:[cat],alt:`${categories[cat]} – ${path.split('/').pop().replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')}`});existing.add(path);}}
  async function discover(force=false){
    if(!force){try{const c=JSON.parse(localStorage.getItem(cacheKey));if(c&&Date.now()-c.time<300000){mergePaths(c.paths);render();return;}}catch{}}
    const response=await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('refresh');const data=await response.json();if(data.truncated)throw new Error('incomplete');
    const paths=data.tree.filter(f=>f.type==='blob'&&f.path.startsWith(root)&&/\.(jpe?g|png|webp)$/i.test(f.path)).map(f=>f.path);
    // Use the repository inventory so deleted photographs disappear as well.
    const available=new Set(paths);photos=photos.filter(p=>available.has(p.src));mergePaths(paths);
    try{localStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),paths}));}catch{}
    render();
  }
  document.getElementById('gallery-refresh').addEventListener('click',async e=>{
    const info=document.getElementById('gallery-refresh-status');e.target.disabled=true;info.textContent='Obnovování…';
    try{await discover(true);info.textContent='Galerie obnovena. Nové snímky se zobrazí po dokončení publikace.';}catch{info.textContent='Aktualizaci se nepodařilo načíst. Zkuste to za chvíli.';}finally{e.target.disabled=false;}
  });
  fetch('gallery-data.json?v=3').then(r=>{if(!r.ok)throw new Error('manifest');return r.json();}).then(data=>{photos=data;render();discover().catch(()=>{});}).catch(()=>{status.textContent='Galerii se nepodařilo načíst. Obnovte prosím stránku.';});
})();

/* Landing/header presentation only. Keep the existing upload/editor nodes live. */
(function(global){
  'use strict';
  const assetBase=new URL('webflow/assets/brand/',document.currentScript?.src||document.baseURI);
  function mount(){
    const hero=document.querySelector('.hero-section'),start=hero?.closest('.page-start'),header=start?.querySelector('.navbar');
    const destination=document.getElementById('section-input');
    if(!hero||!start||!header||!destination||hero.classList.contains('drafted-hero'))return;
    const el=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
    function graphic(file,className,alt){const image=el('img',className);image.src=new URL(file,assetBase).href;image.alt=alt;image.draggable=false;if(!alt){image.setAttribute('aria-hidden','true');}return image;}
    // This complete SVG already contains its point. Never append a second dot.
    const logo=className=>graphic('drafted-wordmark-reference-dot.svg',className,'Drafted');
    function anchor(link,href){
      link.href=href;
      link.addEventListener('click',event=>{
        if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        // Preserve native hash/focus semantics and avoid Webflow's legacy
        // window-scrolling delegate: the page uses an inner scroll container.
        requestAnimationFrame(()=>document.querySelector(href)?.scrollIntoView({behavior:'instant',block:'start'}));
      });
      return link;
    }
    start.id='drafted-start';start.classList.add('drafted-landing');
    start.addEventListener('click',event=>{if(event.target.closest('.drafted-home,.drafted-hero-action')&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey)event.stopPropagation();});
    // Retire the old empty responsive hamburger; keep the live header element.
    header.classList.remove('w-nav');header.classList.add('drafted-site-header');header.setAttribute('role','banner');
    const headerInner=el('div','drafted-header-inner'),home=anchor(el('a','drafted-home'),'#drafted-start');home.setAttribute('aria-label','Drafted home');home.append(logo('drafted-nav-wordmark'));
    headerInner.append(home);header.replaceChildren(headerInner);
    const inner=el('div','drafted-hero-inner');
    const brand=el('div','drafted-hero-brand'),registration=el('div','drafted-hero-registration');registration.setAttribute('aria-hidden','true');registration.append(graphic('drafted-registration-marks.svg','drafted-hero-marks',''));brand.append(logo('drafted-hero-wordmark'),graphic('drafted-measurement-rule.svg','drafted-hero-rule',''),registration);
    const content=el('div','drafted-hero-content'),heading=el('h1','drafted-hero-heading');heading.id='drafted-hero-heading';heading.append(el('span','','More substance.'),document.createTextNode(' '),el('span','','Less underselling.'));
    const direction=el('div','drafted-hero-direction'),description=el('p','drafted-hero-description','Build a CV that reflects the experience you bring to the role.');
    const action=hero.querySelector('a[href="#section-input"]')||document.createElement('a');action.className='drafted-hero-action';action.replaceChildren(document.createTextNode('Start with your CV'),el('span','drafted-action-arrow','→'));action.lastElementChild.setAttribute('aria-hidden','true');anchor(action,'#section-input');direction.append(description,action);content.append(heading,direction);
    inner.append(brand,content);hero.replaceChildren(inner);hero.classList.add('drafted-hero');hero.setAttribute('aria-labelledby',heading.id);
    if(location.hash==='#section-input'||location.hash==='#drafted-start')requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView({behavior:'instant',block:'start'}));
    global.DraftedHeroMotion?.mount(brand,assetBase);
  }
  global.DraftedHeroView={mount};
})(window);

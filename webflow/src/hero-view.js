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
    start.addEventListener('click',event=>{if(event.target.closest('.drafted-home,.drafted-get-started,.drafted-hero-action')&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey)event.stopPropagation();});
    // Retire the old empty responsive hamburger; keep the live header element.
    header.classList.remove('w-nav');header.classList.add('drafted-site-header');header.setAttribute('role','banner');
    const headerInner=el('div','drafted-header-inner'),home=anchor(el('a','drafted-home'),'#drafted-start');home.setAttribute('aria-label','Drafted home');home.append(logo('drafted-nav-wordmark'));
    const nav=el('nav','drafted-main-nav');nav.setAttribute('aria-label','Main navigation');
    const getStarted=anchor(el('a','drafted-get-started'),'#section-input');getStarted.append(document.createTextNode('Get started'),el('span','drafted-link-arrow','↗'));getStarted.lastElementChild.setAttribute('aria-hidden','true');nav.append(getStarted);headerInner.append(home,nav);header.replaceChildren(headerInner);
    const inner=el('div','drafted-hero-inner'),eyebrow=el('p','drafted-hero-eyebrow');eyebrow.append(el('span','','CAREER CLARITY /'),document.createTextNode(' '),el('span','','WITHOUT THE FLUFF'));
    const brand=el('div','drafted-hero-brand');brand.append(logo('drafted-hero-wordmark'),graphic('drafted-measurement-rule.svg','drafted-hero-rule',''),graphic('drafted-registration-marks.svg','drafted-hero-marks',''));
    const content=el('div','drafted-hero-content'),heading=el('h1','drafted-hero-heading');heading.id='drafted-hero-heading';heading.append(el('span','','More substance.'),document.createTextNode(' '),el('span','','Less underselling.'));
    const direction=el('div','drafted-hero-direction'),description=el('p','drafted-hero-description','Make the depth of your experience visible. Explore what matters for the role, sharpen how you present it, and stay in control of every change.');
    const action=hero.querySelector('a[href="#section-input"]')||document.createElement('a');action.className='drafted-hero-action';action.replaceChildren(document.createTextNode('Start with your CV'),el('span','drafted-action-arrow','→'));action.lastElementChild.setAttribute('aria-hidden','true');anchor(action,'#section-input');direction.append(description,action);content.append(heading,direction);
    const steps=el('ol','drafted-hero-steps');steps.setAttribute('role','list');
    for(const [index,title,copy] of [['01','Bring your experience','Start with your current CV.'],['02','Add the opportunity','Give your experience a context.'],['03','Refine your story','Decide what deserves the focus.']]){
      const item=el('li','drafted-hero-step'),number=el('span','drafted-hero-step-number',index+' /'),text=el('div','drafted-hero-step-text');number.setAttribute('aria-hidden','true');text.append(el('h2','',title),el('p','',copy));item.append(number,text);steps.append(item);
    }
    inner.append(eyebrow,brand,content,steps,el('p','drafted-hero-note','YOUR EXPERIENCE IS BIGGER THAN YOUR CV.'));hero.replaceChildren(inner);hero.classList.add('drafted-hero');hero.setAttribute('aria-labelledby',heading.id);
    if(location.hash==='#section-input'||location.hash==='#drafted-start')requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView({behavior:'instant',block:'start'}));
  }
  global.DraftedHeroView={mount};
})(window);

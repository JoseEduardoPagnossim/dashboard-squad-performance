(() => {
  const params = new URLSearchParams(window.location.search);
  const route = {
    enabled: params.get('view') === 'presentation',
    squad: (params.get('squad') || '').trim().toUpperCase(),
    direct: params.get('view') === 'presentation'
  };

  function directUrl(squad){
    const url = new URL(window.location.href);
    url.searchParams.set('view','presentation');
    if(squad && squad !== 'all') url.searchParams.set('squad',String(squad).toUpperCase());
    else if(squad === 'all') url.searchParams.set('squad','all');
    else url.searchParams.delete('squad');
    url.hash='';
    return url.toString();
  }

  function normalUrl(){
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('squad');
    url.hash='';
    return url.toString();
  }

  function setDirectMode(active){
    document.body.classList.toggle('presentation-direct',!!active);
  }

  function requestFullscreen(){
    const el=document.documentElement;
    if(document.fullscreenElement) return Promise.resolve();
    return el.requestFullscreen ? el.requestFullscreen() : Promise.resolve();
  }

  function exitFullscreen(){
    if(!document.fullscreenElement) return Promise.resolve();
    return document.exitFullscreen ? document.exitFullscreen() : Promise.resolve();
  }

  window.SoftenPresentation = {
    route,
    directUrl,
    normalUrl,
    setDirectMode,
    requestFullscreen,
    exitFullscreen
  };
})();

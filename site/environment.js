(function(){'use strict';
 const labels={simulated:['Simulerat lokalt','Inga riktiga AI-anrop'],'integration-blocked':['Integration · spärrad','Inga riktiga anrop tillåtna'],'integration-live':['Integration · riktiga anrop','Ditt CV skickas till n8n och AI']};
 window.DraftedEnvironment={show(mode){const bar=document.getElementById('drafted-environment'),label=labels[mode];if(!bar||!label)return;bar.dataset.mode=mode;bar.querySelector('[data-backend-label]').textContent=label[0];bar.querySelector('[data-backend-detail]').textContent=label[1];}};
})();

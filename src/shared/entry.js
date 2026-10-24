import {createTrainerAccounts,createTrainerPreview} from './accounts.js';

// One shared instance per page, loaded before either game's startup code.
if(document.getElementById('welcome-heading'))window.patternAccountsPreview=createTrainerPreview();
window.patternAccountsReady=createTrainerAccounts().then(accounts=>{
 window.patternAccounts=accounts;
 window.dispatchEvent(new Event('pattern-accounts-ready'));
 return accounts;
});
window.patternAccountsReady.catch(()=>{
 const status=document.getElementById('trainer-status');
 if(status)status.textContent='Could not load your trainer. Please reload this page.';
});

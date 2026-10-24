import {AsyncLocalStorage} from 'node:async_hooks';
import {betterAuth} from 'better-auth';
import {username} from 'better-auth/plugins/username';

// Reset tokens stay inside the verified recovery request; no email is sent.
export function createAuth(database, {baseURL, secret}) {
 const recovery = new AsyncLocalStorage();
 const auth = betterAuth({
  database, baseURL, secret,
  emailAndPassword: {
   enabled:true, minPasswordLength:8, maxPasswordLength:128,
   revokeSessionsOnPasswordReset:true,
   sendResetPassword:async ({token})=>{const context=recovery.getStore();if(context)context.token=token;}
  },
  session:{expiresIn:60*60*24*30,updateAge:60*60*24},
  rateLimit:{enabled:true,storage:'database',window:60,max:30},
  advanced:{ipAddress:{ipAddressHeaders:['x-real-ip']}},
  plugins:[username({minUsernameLength:3,maxUsernameLength:20,usernameValidator:value=>/^[a-zA-Z0-9_]+$/.test(value),immutableUsername:true})]
 });
 return {auth,recovery};
}

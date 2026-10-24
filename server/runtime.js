import pg from 'pg';
import {createAuth} from './auth.js';
import {createApp} from './app.js';
let runtime;
export function getRuntime(){
 if(runtime)return runtime;
 const {DATABASE_URL,BETTER_AUTH_SECRET,BETTER_AUTH_URL}=process.env;
 if(!DATABASE_URL||!BETTER_AUTH_SECRET||!BETTER_AUTH_URL)throw new Error('Trainer service needs DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL');
 if(BETTER_AUTH_SECRET.length<32)throw new Error('BETTER_AUTH_SECRET must have at least 32 characters');
 const database=new pg.Pool({connectionString:DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});
 const {auth,recovery}=createAuth(database,{baseURL:BETTER_AUTH_URL,secret:BETTER_AUTH_SECRET});
 runtime={database,auth,handle:createApp({database,auth,recovery,baseURL:BETTER_AUTH_URL})};return runtime;
}

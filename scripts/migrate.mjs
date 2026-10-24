import {readFile} from 'node:fs/promises';
import {getMigrations} from 'better-auth/db/migration';
import {getRuntime} from '../server/runtime.js';
const {database,auth}=getRuntime();
try{
 const migrations=await getMigrations(auth.options);await migrations.runMigrations();
 await database.query(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8'));
 console.log('Trainer account schema is ready.');
}finally{await database.end();}

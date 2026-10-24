import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import pg from 'pg';
import {getMigrations} from 'better-auth/db/migration';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createAuth} from '../server/auth.js';
import {createApp} from '../server/app.js';

// Real Postgres engine in WASM, with the production pg driver and Better Auth.
// No production credentials or external services are used in these tests.
export async function accountFixture(baseURL){
 const db=await PGlite.create();
 const socket=new PGLiteSocketServer({db,port:0,host:'127.0.0.1'});
 await socket.start();
 const database=new pg.Pool({connectionString:`postgresql://postgres@${socket.getServerConn()}/postgres`,max:1});
 const {auth,recovery}=createAuth(database,{baseURL,secret:randomBytes(32).toString('base64url')});
 const migration=await getMigrations(auth.options);await migration.runMigrations();
 await database.query(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8'));
 return {database,auth,handle:createApp({database,auth,recovery,baseURL}),async close(){await database.end();await socket.stop();await db.close();}};
}

import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
// Publish only playable assets, never source, tests, server files or credentials.
await rm('public',{recursive:true,force:true});await mkdir('public');
for(const path of ['index.html','beybattle.html','beyblade-climber.html','how-to-play.html','assets','css','js','THIRD_PARTY_NOTICES.txt'])await cp(path,`public/${path}`,{recursive:true});

await writeFile('public/beybattle.html',(await readFile('public/beybattle.html','utf8')).replace('name="trainer-service" content="disabled"','name="trainer-service" content="enabled"'));

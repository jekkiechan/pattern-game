import assert from 'node:assert/strict';
import autoMerge from '../.github/scripts/auto-merge.cjs';

const success = () => ({
 run: {id:9,event:'pull_request',conclusion:'success',path:'.github/workflows/ci.yml',
  head_repository:{full_name:'owner/game'},head_sha:'tested-head',head_branch:'feature'},
 jobs: ['Build and gameplay tests','Browser / browser_check','Browser / climber_check',
  'Browser / journey_check','CI passed'].map(name=>({name,conclusion:'success'})),
 pr: {number:16,state:'open',draft:false,base:{ref:'main'},author_association:'OWNER',
  head:{sha:'tested-head',ref:'feature',repo:{full_name:'owner/game'}},mergeable:true,mergeable_state:'clean'},
});
async function simulate(data) {
 const merges=[],builds=[];
 const jobsEndpoint=()=>{},prsEndpoint=()=>{};
 const github={
  paginate:async endpoint=>endpoint===jobsEndpoint?data.jobs:[{number:16}],
  rest:{
   actions:{getWorkflowRun:async()=>({data:data.run}),listJobsForWorkflowRun:jobsEndpoint},
   pulls:{get:async()=>({data:data.pr}),merge:async args=>{
    merges.push(args);if(data.mergeError)throw Object.assign(new Error('blocked'),{status:data.mergeError});
    return {data:{merged:true}};
   }},
   repos:{listPullRequestsAssociatedWithCommit:prsEndpoint,requestPagesBuild:async args=>{builds.push(args);}},
  },
 };
 await autoMerge({github,context:{repo:{owner:'owner',repo:'game'},payload:{workflow_run:{id:9}}},core:{info(){},notice(){}}});
 return {merges,builds};
}
const passed=await simulate(success());
assert.equal(passed.merges.length,1);
assert.equal(passed.merges[0].sha,'tested-head','Merge must atomically require the tested commit');
assert.equal(passed.merges[0].merge_method,'squash');
assert.equal(passed.builds.length,1,'Token-based merges must explicitly rebuild the Pages site');
for(const [name,change] of [
 ['failed CI',d=>d.run.conclusion='failure'],
 ['non-PR event',d=>d.run.event='push'],
 ['another workflow',d=>d.run.path='.github/workflows/other.yml'],
 ['foreign run',d=>d.run.head_repository.full_name='fork/game'],
 ['missing browser job',d=>d.jobs.splice(2,1)],
 ['skipped test',d=>d.jobs[0].conclusion='skipped'],
 ['failed browser',d=>d.jobs[1].conclusion='failure'],
 ['stale commit',d=>d.pr.head.sha='new-head'],
 ['different branch',d=>d.pr.head.ref='other'],
 ['fork PR',d=>d.pr.head.repo.full_name='fork/game'],
 ['draft PR',d=>d.pr.draft=true],
 ['closed PR',d=>d.pr.state='closed'],
 ['wrong target',d=>d.pr.base.ref='release'],
 ['external author',d=>d.pr.author_association='CONTRIBUTOR'],
 ['conflict',d=>d.pr.mergeable=false],
 ['protected/review-blocked',d=>d.pr.mergeable_state='blocked'],
 ]) {
 const d=success();change(d);const result=await simulate(d);
 assert.equal(result.merges.length,0,name+' must not merge');assert.equal(result.builds.length,0);
}
const race=success();race.mergeError=409;
assert.equal((await simulate(race)).builds.length,0,'Changed head at merge time must not trigger deployment');
console.log('Auto-merge checks passed: successful merge and Pages build; failures, skips, drafts, forks, stale heads, protected branches and merge races stay unmerged.');

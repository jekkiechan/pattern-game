// Executed only from the default branch by the workflow_run workflow.
// Never check out a PR, download its artifacts, or evaluate text from its metadata.
module.exports = async function autoMerge({ github, context, core }) {
  const { owner, repo } = context.repo;
  const repository = `${owner}/${repo}`;
  const { data: run } = await github.rest.actions.getWorkflowRun({
    owner, repo, run_id: context.payload.workflow_run.id,
  });
  if (run.event !== 'pull_request' || run.conclusion !== 'success' ||
      run.path !== '.github/workflows/ci.yml' ||
      run.head_repository?.full_name !== repository) {
    core.info('Not a successful pull-request run of this repository’s CI.');
    return;
  }

  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {
    owner, repo, run_id: run.id, filter: 'latest', per_page: 100,
  });
  // Require the actual jobs as well as the aggregate gate. Skips are not passes.
  const required = ['Build and gameplay tests', 'Browser / browser_check',
    'Browser / climber_check', 'Browser / journey_check', 'CI passed'];
  if (!required.every(name => jobs.some(job => job.name === name && job.conclusion === 'success'))) {
    core.info('The current CI run has not passed every required job.');
    return;
  }

  // GitHub can omit pull_requests on a workflow_run payload, so resolve from SHA.
  const candidates = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, {
    owner, repo, commit_sha: run.head_sha, per_page: 100,
  });
  for (const candidate of candidates) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: candidate.number });
    if (pr.state !== 'open' || pr.draft || pr.base.ref !== 'main' ||
        pr.head.repo?.full_name !== repository || pr.head.sha !== run.head_sha ||
        pr.head.ref !== run.head_branch ||
        !['OWNER', 'MEMBER', 'COLLABORATOR'].includes(pr.author_association)) {
      core.info(`Skipping PR #${pr.number}: draft, external, closed, or changed since CI ran.`);
      continue;
    }
    // Respect GitHub's current mergeability/protection state, including reviews.
    // SHA is an atomic guard: a new push between this read and merge cannot slip in.
    if (pr.mergeable !== true || pr.mergeable_state !== 'clean') {
      core.info(`PR #${pr.number} is not currently clean and mergeable.`);
      continue;
    }
    let merged;
    try {
      ({ data: merged } = await github.rest.pulls.merge({
        owner, repo, pull_number: pr.number, sha: run.head_sha, merge_method: 'squash',
      }));
    } catch (error) {
      if ([405, 409, 422].includes(error.status)) {
        core.info(`GitHub did not allow PR #${pr.number} to merge: ${error.message}`);
        continue;
      }
      throw error;
    }
    if (!merged.merged) {
      core.info(`PR #${pr.number} was not merged: ${merged.message}`);
      continue;
    }
    core.notice(`Merged PR #${pr.number} after CI passed at ${run.head_sha}.`);

    // GITHUB_TOKEN merges do not start the usual Pages build automatically.
    // Request the existing branch-based Pages build explicitly after the merge.
    try {
      await github.rest.repos.requestPagesBuild({ owner, repo });
      core.notice('Requested the GitHub Pages build for the merged game.');
    } catch (error) {
      if (error.status === 404) core.info('No branch-based GitHub Pages site is configured.');
      else throw error;
    }
  }
};

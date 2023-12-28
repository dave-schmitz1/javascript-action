const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const body = core.getInput('message_body', { required: true })

    console.log(`Input passed for pull request message body: ${body}`)

    const octokit = github.getOctokit(
      process.env.GITHUB_TOKEN || core.getInput('github_token')
    )

    core.startGroup('Logging github context')
    console.log(JSON.stringify(github.context, null, 2))
    core.endGroup()

    console.log(`Actor:  ${github.context.actor}`)
    console.log(`Action: ${github.context.eventName}`)
    console.log(`Workflow: ${github.context.workflow}`)

    try {
      const createCommentResponse = await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: github.context.issue.number,
        body: `Thanks for contributing! ${body}`
      })
    } catch (error) {
      core.error('Error occurred while trying to add pull request comment')
      core.setFailed(error.message)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.error('Error occurred before trying to add pull request comment')
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}

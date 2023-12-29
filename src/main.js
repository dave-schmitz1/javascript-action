const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const name = core.getInput('name', { required: true })

    console.log(`Input passed for name: ${name}`)

    const octokit = github.getOctokit(
      process.env.GITHUB_TOKEN || core.getInput('github_token')
    )

    core.startGroup('Logging github context')
    console.log(JSON.stringify(github.context, null, 2))
    core.endGroup()

    let output = `## Terraform Plan For \`${name}\``
    output += `\n#### Terraform Format and Style 🖌 \`steps.fmt.outcome\``
    output += `\n#### Terraform Initialization ⚙️ \`steps.init.outcome\``
    output += `\n#### Terraform Validation 🤖 \`steps.validate.outcome\``
    output += `\n<details><summary>Validation Output</summary> \
    \
    \n\`\`\`\n \
    \nSuccess! The configuration is valid. \
    \n\`\`\` \
    \
    </details>`

    output += `\n\n#### Terraform Plan 📖 \`steps.plan.outcome\``

    output += `\n<details><summary>Show Plan for ${name}</summary> \
    \
    \n\`\`\`\n \
    plan \
    \`\`\` \
    \
    </details>`
    output += `\ntruncated_message`

    output += `\n\n*Pusher: @${github.context.actor}, Action: \`${github.context.eventName}\`, Working Directory: \`${name}\`, Workflow: \`${github.context.workflow}\`*`

    console.log(`Actor:  ${github.context.actor}`)
    console.log(`Action: ${github.context.eventName}`)
    console.log(`Workflow: ${github.context.workflow}`)

    try {
      // Find existing bot comment for the PR
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: github.context.issue.number
      })
      const botComment = comments.find(comment => {
        return (
          comment.user.type === 'Bot' &&
          comment.body.includes(`Terraform Plan For \`${name}\``)
        )
      })

      console.log(`BotComment found: ${botComment}`)

      // Update existing or create comment
      if (botComment) {
        const updateCommentResponse = await octokit.rest.issues.updateComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          comment_id: botComment.id,
          body: `${output}`
        })
      } else {
        const createCommentResponse = await octokit.rest.issues.createComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: github.context.issue.number,
          body: `${output}`
        })
      }
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

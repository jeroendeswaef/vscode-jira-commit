// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as request from "request-promise-native";
import { GitExtension } from "./git";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jiracommit" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		"extension.helloWorld",
		async () => {
			// The code you place here will be executed every time your command is executed

			// Display a message box to the user
			const gitExtension =
				vscode.extensions &&
				vscode.extensions.getExtension<GitExtension>("vscode.git")!
					.exports;
			const git = gitExtension.getAPI(1);
			const jiraAccessToken = vscode.workspace
				.getConfiguration()
				.get("jiracommit.jiraAccessToken");
			const jiraEmail = vscode.workspace
				.getConfiguration()
				.get("jiracommit.email");
			const jiraBaseUrl = vscode.workspace
				.getConfiguration()
				.get("jiracommit.baseUrl");
			const issuePrefix = vscode.workspace
				.getConfiguration()
				.get("jiracommit.issuePrefix");
			const topicCustomField = vscode.workspace
				.getConfiguration()
				.get("jiracommit.topicCustomField");
			const issueNumber = await vscode.window.showInputBox({ prompt: 'Enter the number of the Jira issue you want to start' });
			const options = {
				uri: `${jiraBaseUrl}/rest/api/2/issue/${issuePrefix}-${issueNumber}`,
				auth: {
					user: String(jiraEmail),
					pass: String(jiraAccessToken)
				},
				json: true,
			};
			request.get(options, (error, response) => {
				if (error) {
					vscode.window.showErrorMessage(error.message);
				} else {
					if (response.statusCode !== 200) {
						vscode.window.showErrorMessage(
							"Request to Jira failed"
						);
					} else {
						const summary = response.body.fields.summary;
						const topic = response.body.fields[String(topicCustomField)] ? response.body.fields[String(topicCustomField)].value : '*';
						const message = `feature(${String(topic).toLowerCase()}): ${summary}\n\n${issuePrefix}-${issueNumber}`;
						for (let repo of git.repositories) {
							repo.inputBox.value = message;
						}
					}
				}
			});
		}
	);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

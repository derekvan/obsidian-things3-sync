import { App, Editor, MarkdownView, EditorPosition, FrontMatterCache, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';
import { stringify } from 'querystring';
import { urlToHttpOptions } from 'url';

function getCurrentLine(editor: Editor, view: MarkdownView) {
	const lineNumber = editor.getCursor().line
	const lineText = editor.getLine(lineNumber)
	return lineText
}

interface TodoInfo {
	title: string,
	tags: string,
	date: string,
	project: string,
	notes: string
}

interface PluginSettings {
	authToken: string,
	defaultTags: string
}

const DEFAULT_SETTINGS: PluginSettings = {
	authToken: '',
	defaultTags: ''
}

export class FrontMatterParser {
	static getAliases(frontMatter: FrontMatterCache): string[] {
	let proj: string[] = [];
  
	if (frontMatter) {
		proj = FrontMatterParser.getValueForKey(frontMatter, /^project?$/i);
	}
  
	return proj;
	}
  
	private static getValueForKey(
	frontMatter: FrontMatterCache,
	keyPattern: RegExp,
	): string[] {
	const retVal: string[] = [];
	const fmKeys = Object.keys(frontMatter);
	const key = fmKeys.find((val) => keyPattern.test(val));
  
	if (key) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		let value = frontMatter[key];
  
		if (typeof value === 'string') {
			value = value.split(',');
		}
  
		if (Array.isArray(value)) {
			value.forEach((val) => {
			if (typeof val === 'string') {
				retVal.push(val.trim());
			}
		});
		}
	}
  
	return retVal;
	}
  }

  export class FrontMatterContextParser {
	static getAliases(frontMatter: FrontMatterCache): string[] {
	let context: string[] = [];
  
	if (frontMatter) {
		context = FrontMatterContextParser.getValueForKey2(frontMatter, /^context?$/i);
	}
  
	return context;
	}
  
	private static getValueForKey2(
	frontMatter: FrontMatterCache,
	keyPattern: RegExp,
	): string[] {
	const retVal: string[] = [];
	const fmKeys = Object.keys(frontMatter);
	const key = fmKeys.find((val) => keyPattern.test(val));
  
	if (key) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		let value = frontMatter[key];
  
		if (typeof value === 'string') {
			value = value.split(',');
		}
  
		if (Array.isArray(value)) {
			value.forEach((val) => {
			if (typeof val === 'string') {
				retVal.push(val.trim());
			}
		});
		}
	}
  
	return retVal;
	}
  }

function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}

function constructTodo(line: string, settings: PluginSettings, fileName: string){
	line = line.trim();
	const tags = extractTags(line, settings.defaultTags);

	const line2 = line.replace(/#([^\s]+)/gs, '');

	const todo: TodoInfo = {
		title: extractTitle(line2),
		tags: tags,
		date: extractDate(fileName),
		project: extractProject(),
		notes: extractNotes(line)
	}

	return todo;
}

function extractProject(){
	const { metadataCache } = this.app;
	const workspace = this.app.workspace;
	const fileTitle = workspace.getActiveFile()
    const frontMatter = metadataCache.getFileCache(fileTitle)?.frontmatter;
	let proj;
    if (frontMatter) {
      const projs = FrontMatterParser.getAliases(frontMatter);
      let i = projs.length;
		while (i--) {
         proj = projs[i];
		}
	}
	return proj;
}

function extractDate(line:string) {
	const regex = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])/
	let date = '';
	const res = line.match(regex);
	if (res) {
    date = res[0];
  }
	return date;
}

function extractTitle(line: string) {
	const regex = /[^#\s\-\[\]*](.*)/gs
	const content = line.match(regex);
	let title = '';
	if (content != null) {
		title = content[0].split('\n')[0];
	}
	
	return title;
}

function extractTags(line: string, setting_tags: string){
	const regex = /#([^\s]+)/gs
	const array = [...line.matchAll(regex)]
	const tag_array = array.map(x => x[1])
	const { metadataCache } = this.app;
	const workspace = this.app.workspace;
	const fileTitle = workspace.getActiveFile()
    const frontMatter = metadataCache.getFileCache(fileTitle)?.frontmatter;
	let context;
	if (frontMatter) {
		const contexts = FrontMatterContextParser.getAliases(frontMatter);
		let i = contexts.length;
		while (i--) {
			context = contexts[i];
			}
		}
	if (context) {
		tag_array.push(context);
	}
	line = line.replace(regex, '');
	const tags = tag_array.join(',')
	
	return tags;
}

function extractNotes(line: string){
	let content = line
	content = content.replace(/^- /,"");
	const view = this.app.workspace.getActiveViewOfType(MarkdownView)
	const doc = view.getViewData();
	const tasks = doc.split("\n- ");
	const lines = tasks.find(a => a.includes(content))
	const notesArray = lines.split('\n')
	notesArray.shift();
 

	function filterItems(arr: Array<string>, query: string) {

		return arr.filter(function(el:string) {
		return el.toLowerCase().indexOf(query.toLowerCase()) !== -1
		})
	}
	const a = filterItems(notesArray,"\t- ");
	const subTasks = a.join('\n');
	
	const notes = subTasks

	return notes
}

function collectTodos(){
	const view = this.app.workspace.getActiveViewOfType(MarkdownView)
	const doc = view.getViewData();
	const now = /^# Now\n((.|\n)*?)(?=\n#+)/gm
	const block = doc.match(now)
	const re = /(?<=^# Now\n(?:(?!\n# \w)[^])*)-[ \t]*\[[^][]*].*(?:\n[ \t]+-.*)*/gm
	const things = doc.match(re)
	const thingTasks = things

	return [thingTasks, block]
}
// try to separate out the collectTodos function from the update function, so that I can also use it in a new "create bulk todos" function

function bulkUpdate(taskArray: Array<string>, block: Array<string>, fileName: string){
		const tasks = taskArray
		const tArray = {"things":[]}
		tasks.forEach(t => {
		const target = extractTarget(t)
		const re2 = /- \[(?: |x)\] (.*?) \[things\]\(things:\/\/\/show\?id=.*?\)/
		const name = t.match(re2)
		tArray.things.push({"task":name[1],"id":target.todoId,"status":target.afterStatus})
	});
	tArray["block"] = block[0]
	tArray["file"] = fileName
	
	return tArray
}

function extractTarget(line: string) {
	const regexId = /id=(\w+)/
	const id = line.match(regexId);
	let todoId: string;
	if (id != null) {
		todoId = id[1];	
	} else {
		todoId = ''
	}

	const regexStatus = /\[(.)\]/
	const status = line.match(regexStatus)
	let afterStatus: string;
	if (status && status[1] == ' ') {
		afterStatus = 'true'
	} else {
		afterStatus = 'false'
	}

	return  {todoId, afterStatus}
}

function createTodo(todo: TodoInfo, deepLink: string){
	const noter = todo.project + "\n\n" + todo.notes + "\n\n" + deepLink
	const n = urlEncode(noter)
	const url = `things:///add?title=${todo.title}&list=${todo.tags}&notes=${n}&when=${todo.date}&x-success=obsidian://things-sync-id&tags=week`;
	window.open(url);
}

function updateTodo(todoId: string, completed: string, authToken: string, fileName: string){
	const url = `shortcuts://run-shortcut?name=ThingsToggleSingle&input=text&text={"filename":"${fileName}","id":"${todoId}","completed":"${completed}"}`
	//const url = `things:///update?id=${todoId}&completed=${completed}&auth-token=${authToken}`;
	window.open(url);
}

export function constructDeeplink(fileName: string, vaultName: string){
	const url = `obsidian://open?vault=${vaultName}&file=${fileName}`;
	return url;
 }

export default class Things3Plugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		
		// Setup Settings Tab
		await this.loadSettings();
		this.addSettingTab(new Things3SyncSettingTab(this.app, this));

		// Register Protocol Handler
		this.registerObsidianProtocolHandler("things-sync-id", async (id) => {
			const todoID = id['x-things-id'];
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor
				const currentLine = getCurrentLine(editor, view)
				const firstLetterIndex = currentLine.search(/[^\s#\[\]*]/);
				const line = currentLine.substring(firstLetterIndex, currentLine.length)
				const editorPosition = view.editor.getCursor()
				const lineLength = view.editor.getLine(editorPosition.line).length
				const startRange: EditorPosition = {
					line: editorPosition.line,
					ch: firstLetterIndex
				}
				const endRange: EditorPosition = {
					line: editorPosition.line,
					ch: lineLength
				}
				
				if (firstLetterIndex > 0) {
					view.editor.replaceRange(`${line} [things](things:///show?id=${todoID})`, startRange, endRange);
				} else {
					const newLine = line.replace(/^- /,"").replace(/^\[ \] /,"");
					view.editor.replaceRange(`- [ ] ${newLine} [things](things:///show?id=${todoID})`, startRange, endRange);
				}
			}
		});

		// Register protocol for JSON return

		this.registerObsidianProtocolHandler("things-sync-ids", async (ids) => {
			const success = ids['x-things-ids']
			const sArray = JSON.parse(success)
			const bulk = collectTodos()
			const view = this.app.workspace.getActiveViewOfType(MarkdownView)
			const doc = view.getViewData();
			const block = bulk[1].toString()
			const newSplit = block.split((/\r?\n/))
			let newArray = []
			let x = 0
			newSplit.forEach(s => {
				const firstLetterIndex = s.search(/^- \[ \]/)
				if (firstLetterIndex === 0){
					if (!s.includes("[things](things:///show?id=")){
						s = `${s} [things](things:///show?id=${sArray[x]})`
						x++
					}
				}
				newArray.push(s)
			});
			const newBlock = newArray.join("\n")
			const newText = doc.replace(block,newBlock)
			view.setViewData(newText, false)
		});
	
		// Create TODO Command
		this.addCommand({
			id: 'create-things-todo',
			name: 'Create Things Todo',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const vault = this.app.vault
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = urlEncode(fileTitle.name)
					fileName = fileName.replace(/\.md$/, '')
					const vaultName = vault.getName();
					const obsidianDeepLink = constructDeeplink(fileName,vaultName)
					//const encodedLink = urlEncode(obsidianDeepLink)
					const line = getCurrentLine(editor, view)
					const todo = constructTodo(line, this.settings, fileName)
					createTodo(todo, obsidianDeepLink)
				}
			}
		});
		
		this.addCommand({
			id: 'bulk-things-todo',
			name: 'Bulk Create Things Todo',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const vault = this.app.vault
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = urlEncode(fileTitle.name)
					fileName = fileName.replace(/\.md$/, '')
					const vaultName = vault.getName();
					const obsidianDeepLink = constructDeeplink(fileName,vaultName)
					//const encodedLink = urlEncode(obsidianDeepLink)
					const todos = collectTodos()
					let tJson = []
					todos[0].forEach(t => {
						const regexId = /\[things\]\(things:/
						const id = t.match(regexId)
						if (id == null){
							const todo = constructTodo(t,this.settings,fileName)
							const noter = todo.project + "\n\n" + todo.notes + "\n\n" + obsidianDeepLink
							tJson.push({"type":"to-do","attributes":{"title":todo.title, "tags":["week"],"list":todo.tags,"notes": noter}})
							}
					});
					const json = urlEncode(JSON.stringify(tJson))
					const url = `things:///json?data=${json}&x-success=obsidian://things-sync-ids`
					window.open(url)
				}
			}
		});


		// Toggle task status and sync to things
		this.addCommand({
			id: 'toggle-things-todo',
			name: 'Toggle Single Things Todo',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = urlEncode(fileTitle.path);
          fileName = fileName.replace(/\.md$/, "");
          const line = getCurrentLine(editor, view);
          const target = extractTarget(line);
          if (target.todoId == "") {
            new Notice(`This is not a things3 todo`);
          } else {
            //view.app.commands.executeCommandById("editor:toggle-checklist-status");
            
            updateTodo(target.todoId, target.afterStatus, this.settings.authToken, fileName);
            //new import_obsidian.Notice(`${target.todoId} set completed:${target.afterStatus} on things3`);
					
				}
			}
			}
		});

		// Mark task complete in Obsidian and Things at once
		this.addCommand({
      id: "mark-things-complete",
      name: "Mark Things Todo Complete",
      editorCallback: (editor, view) => {
        const workspace = this.app.workspace;
        const fileTitle = workspace.getActiveFile();
        if (fileTitle == null) {
          return;
        } else {
          let fileName = urlEncode(fileTitle.path);
          fileName = fileName.replace(/\.md$/, "");
          const line = getCurrentLine(editor, view);
          const target = extractTarget(line);
          if (target.todoId == "") {
            new Notice(`This is not a things3 todo`);
          } else {
            view.app.commands.executeCommandById("editor:toggle-checklist-status");
            const url = `things:///update?id=${target.todoId}&completed=true&auth-token=${this.settings.authToken}`;
            window.open(url);
            //new import_obsidian.Notice(`${target.todoId} set completed:${target.afterStatus} on things3`);
          }
        }
      }
    });

	// Update all tasks in the # Now header
	this.addCommand({
		id: "things-bulk-update",
		name: "Update all things in # Now header",
		editorCallback: (editor, view) => {
			const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} 
				else {
					
					const fileName = fileTitle.path.replace(/\.md$/, "");
					const todos = collectTodos(fileName);
					const bulk = bulkUpdate(todos[0], todos[1], fileName)
					const stringT = urlEncode(JSON.stringify(bulk))

					const url = `shortcuts://run-shortcut?name=ThingsBulkUpdate&input=text&text=${stringT}`
					window.open(url);
				}
			}
		});
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class Things3SyncSettingTab extends PluginSettingTab {
	plugin: Things3Plugin;

	constructor(app: App, plugin: Things3Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for Obsidian Things3 Sync.'});

		new Setting(containerEl)
			.setName('Auth Token')
			.setDesc('Require Things3 Auth Token for syncing Todo status; Get Auth Token\
			via Things3 -> Preferece -> General -> Enable things URL -> Manage.')
			.addText(text => text
				.setPlaceholder('Leave Things3 Auth Token here')
				.setValue(this.plugin.settings.authToken)
				.onChange(async (value) => {
					this.plugin.settings.authToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default Tags')
			.setDesc('The default tags for Obsidian Todo; Using comma(,) \
			to separate multiple tags; Leave this in blank for no default tags')
			.addText(text => text
				.setPlaceholder('Leave your tags here')
				.setValue(this.plugin.settings.defaultTags)
				.onChange(async (value) => {
					this.plugin.settings.defaultTags = value;
					await this.plugin.saveSettings();
				}));
	}
}

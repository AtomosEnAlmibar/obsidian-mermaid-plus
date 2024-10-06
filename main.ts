import { App, Editor, MarkdownPostProcessorContext, MarkdownView, Menu, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
	theme: string;
}

interface Diagram {
	attributes: DiagramAttributes,
	body: string
}

class DiagramAttributes {
	width: string;
	height: string;

	constructor() {
		this.width = '100%';
		this.height = '100%';
	}

	parseAndOverwrite(keyValuePairs: string[]): void {
		for (const pair of keyValuePairs) {
			const [key, value] = pair.split(':');

			if (key && value) {
				const trimmedKey = key.trim();
				const trimmedValue = value.trim();

				(this as any)[trimmedKey] = trimmedValue;
			}
		}
	}
}


const DEFAULT_THEMES: Map<string, string> = new Map([
	['default', 'Default'],
	['neutral', 'Neutral'],
	['dark', 'Dark'],
	['forest', 'Forest']
]);

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	theme: 'default',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	parseInputToTheme(input: string): Diagram {
		const attributes = new DiagramAttributes();
		let attributesArray = input.split("diagram:");
		attributes.parseAndOverwrite(attributesArray[0].split(','));
		const body = attributesArray.pop() ?? '';

		return {
			attributes,
			body
		};
	}

	async processMermaidHTML(source: string, el: HTMLElement) {

		let diagram: Diagram = this.parseInputToTheme(source);
		if (diagram.body == '') {
			return null;
		}
		console.log("Comienza el renderizado del code block", el)
		// Create a container div to hold the HTML content		
		const container = document.createElement('div');

		container.style.overflowX = 'auto';
		// Insert the raw HTML into the container
		container.innerHTML = `<div class="mermaid-plus" style="width:${diagram.attributes.width};height:${diagram.attributes.height}">${diagram.body}</div>`;

		// Append the container to the rendered Markdown element
		el.appendChild(container);
		const initializeMermaid = () => {
			if ((window as any).mermaid) {
				const mermaidDiagram = container.querySelector('.mermaid-plus');
				const mermaidConfig = {
					theme: this.settings.theme,
				};
				console.log("Lo diagrama", mermaidDiagram, mermaidConfig);

				(window as any).mermaid.initialize(mermaidConfig);
				(window as any).mermaid.init(undefined, mermaidDiagram);
			} else {
				console.warn('Mermaid is not loaded yet, retrying...');
				setTimeout(initializeMermaid, 500);
			}
		};

		initializeMermaid();
	}

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("mermaid-plus", this.processMermaidHTML.bind(this));

		this.addSettingTab(new SampleSettingTab(this.app, this));
		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// this.addRibbonIcon("dice", "Open menu", (event) => {
		// 	const menu = new Menu();

		// 	menu.addItem((item) =>
		// 		item
		// 			.setTitle("Copy")
		// 			.setIcon("documents")
		// 			.onClick(() => {
		// 				new Notice("Copied");
		// 			})
		// 	);

		// 	menu.addItem((item) =>
		// 		item
		// 			.setTitle("Paste")
		// 			.setIcon("paste")
		// 			.onClick(() => {
		// 				new Notice("Pasted");
		// 			})
		// 	);

		// 	menu.showAtMouseEvent(event);
		// });

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Setting #2')
			.setDesc('It\'s a secret')
			.addDropdown(dropdown => {

				DEFAULT_THEMES.forEach((value, key) => {
					dropdown.addOption(key, value);
				})
				dropdown
					.setValue(this.plugin.settings.theme)  // Set current value
					.onChange(async (value: string) => {
						console.log('Default theme: ' + value);
						this.plugin.settings.theme = value;
						await this.plugin.saveSettings();  // Save the setting
					})
			});
	}
}
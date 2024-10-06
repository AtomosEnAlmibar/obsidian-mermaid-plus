import { App, Editor, MarkdownPostProcessorContext, MarkdownView, Menu, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
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

		const container = document.createElement('div');

		container.style.overflow = 'auto';
		container.innerHTML = `<div class="mermaid-plus" style="width:${diagram.attributes.width};height:${diagram.attributes.height}">${diagram.body}</div>`;

		el.appendChild(container);
		const initializeMermaid = () => {
			if ((window as any).mermaid) {
				const mermaidDiagram = container.querySelector('.mermaid-plus');
				const mermaidConfig = {
					theme: this.settings.theme,
				};

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
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
			.setName('Default theme')
			.setDesc('Theme that will be used in the Mermaid diagrams')
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
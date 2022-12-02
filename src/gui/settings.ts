import { Setting, PluginSettingTab, App } from 'obsidian';
import GitPlugin from 'src';

export class GitSettingTab extends PluginSettingTab {
  plugin: GitPlugin;

  constructor(app: App, plugin: GitPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    this.containerEl.empty();

    new Setting(this.containerEl).setName('Repository').setHeading();

    new Setting(this.containerEl)
      .setName('Owner')
      .setDesc('The name of the owner of the repository to sync.')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.owner)
          .onChange((value) => (this.plugin.settings.owner = value))
      );

    new Setting(this.containerEl)
      .setName('Repository')
      .setDesc('The name of the repository to sync.')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.repo)
          .onChange((value) => (this.plugin.settings.repo = value))
      );

    new Setting(this.containerEl)
      .setName('Branch')
      .setDesc('The name of the owner of the repository to sync.')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.branch)
          .onChange((value) => (this.plugin.settings.branch = value))
      );

    new Setting(this.containerEl)
      .setName('Commit')
      .setDesc(
        'The SHA of the commit the local vault is currently at. This will be updated automatically for you after each pull. Leave blank to pull the whole repo.'
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.commit)
          .onChange((value) => (this.plugin.settings.commit = value))
      );
  }
}

import { Notice, Plugin } from 'obsidian';
import { Octokit } from '@octokit/rest';
import axios from 'axios';
import { GitSettingTab } from './gui/settings';
export const octokit = new Octokit();

// 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
// e8a51ad46415628a6fd952a1b86fb6eb4cd702c6 -> cd6072fe3d1db0bac2aeb0d827d6325b3712ed56

interface Settings {
  owner: string;
  repo: string;
  branch: string;
  commit: string;
}

export default class GitPlugin extends Plugin {
  settings!: Settings;

  async onload() {
    this.addSettingTab(new GitSettingTab(this.app, this));

    this.settings = (await this.loadData()) ?? {
      owner: 'KIT-Vault',
      repo: 'brain',
      branch: 'main',
      commit: 'e8a51ad46415628a6fd952a1b86fb6eb4cd702c6',
    };

    const createFolders = async (path: string) => {
      const dirs = path.split('/');
      let p = '';
      for (let i = 0; i < dirs.length - 1; i++) {
        p += dirs[i];
        if (!(await app.vault.adapter.exists(p)))
          await app.vault.createFolder(p);
        p += '/';
      }
    };

    this.addCommand({
      id: 'pull',
      name: 'Pull from GitHub',
      callback: async () => {
        new Notice('Pulling changes...');

        const branch = await this.getBranch();

        const base = this.settings.commit;
        const head = branch.commit.sha;

        console.log(base, head);

        if (base === head) {
          new Notice('Already up-to-date');
          return;
        }

        new Notice('Pulling changes...');

        const diff = await this.compareCommits(base, head);

        const filesRemoved = [];
        const filesChanged = [];
        for (const file of diff.files ?? []) {
          if (
            file.status === 'added' ||
            file.status === 'changed' ||
            file.status === 'modified'
          )
            filesChanged.push(file);
          if (file.status === 'removed') filesRemoved.push(file);
        }

        const operations: Promise<void>[] = [];

        for (const file of filesRemoved) {
          operations.push(
            new Promise(async (resolve) => {
              if (await app.vault.adapter.exists(file.filename))
                await app.vault.adapter.remove(file.filename);
              resolve();
            })
          );
        }

        for (const file of filesChanged) {
          operations.push(
            new Promise(async (resolve) => {
              const parts = file.raw_url.split('/');
              parts[2] = 'raw.githubusercontent.com';
              parts.splice(5, 1);

              const res = await axios({
                method: 'GET',
                url: parts.join('/'),
                responseType: 'arraybuffer',
              });
              const data = res.data as ArrayBuffer;

              const path = 'sync/' + file.filename;
              await createFolders(path);

              const type = res.headers['content-type'];
              if (!type) return;

              if (type.startsWith('text/')) {
                await app.vault.adapter.write(
                  path,
                  new TextDecoder().decode(data)
                );
              } else {
                await app.vault.adapter.writeBinary(path, data);
              }
              resolve();
            })
          );
        }

        await Promise.all(operations);

        this.settings.commit = head;

        new Notice('Done!');
      },
    });
  }

  async onunload() {}

  listBranches() {
    return octokit.repos
      .listBranches({
        owner: this.settings.owner,
        repo: this.settings.repo,
      })
      .then((res) => res.data);
  }

  getBranch() {
    return octokit.repos
      .getBranch({
        owner: this.settings.owner,
        repo: this.settings.repo,
        branch: this.settings.branch,
      })
      .then((res) => res.data);
  }

  compareCommits(base: string, head: string) {
    return octokit.repos
      .compareCommits({
        owner: this.settings.owner,
        repo: this.settings.repo,
        branch: this.settings.branch,
        base: base.substring(0, 6),
        head: head.substring(0, 6),
      })
      .then((res) => res.data);
  }
}

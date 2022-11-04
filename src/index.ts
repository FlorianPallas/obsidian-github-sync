import { Plugin, TFile, normalizePath } from 'obsidian';
import axios from 'axios';

type GContents = GObject[];

type GObject = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
};

const downloadRepo = (owner: string, name: string): Promise<void> => {
  return downloadDir(`https://api.github.com/repos/${owner}/${name}/contents`);
};

const downloadDir = async (url: string): Promise<void> => {
  const contents = await axios(url).then((res) => res.data as GContents);
  for (const obj of contents) {
    if (obj.path.startsWith('.')) continue;
    if (obj.type === 'file') return downloadFile(obj);
    // if (obj.type === 'dir') return downloadDir(obj.url);
  }
};

const downloadFile = async (file: GObject): Promise<void> => {
  const data = await axios(file.download_url).then((res) => res.data as string);

  const path = normalizePath(file.path);

  const aFile = app.vault.getAbstractFileByPath(path);
  const tFile = aFile instanceof TFile ? (aFile as TFile) : undefined;

  if (!tFile) {
    await app.vault.create(path, data);
  } else {
    app.vault.modify(tFile, data);
  }
};

export default class GitPlugin extends Plugin {
  async onload() {
    await downloadRepo('KIT-Vault', 'brain');
  }
}

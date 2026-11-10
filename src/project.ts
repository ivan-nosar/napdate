import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import type { Section } from './arguments.js';

type Dependencies = Record<string, string>;
type Manifest = Record<string, unknown> & { dependencies: Dependencies };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class Project {
  private constructor(
    private readonly path: string,
    private readonly manifest: Manifest,
    private readonly source: string,
  ) {}

  static async load(location: string): Promise<Project> {
    let path = resolve(location);
    try {
      const info = await stat(path);
      if (info.isDirectory()) path = join(path, 'package.json');
      else if (!info.isFile() || basename(path) !== 'package.json') {
        throw new Error('Location must be a directory or package.json file');
      }
      const data = await readFile(path);
      const source = new TextDecoder('utf-8', { fatal: true }).decode(data);
      const value: unknown = JSON.parse(source);
      if (!isObject(value)) throw new Error('package.json must contain an object');
      for (const section of ['dependencies', 'devDependencies', 'optionalDependencies'] as const) {
        const deps = value[section];
        if (deps === undefined && section !== 'dependencies') continue;
        if (!isObject(deps) || Object.entries(deps).some(([name, version]) => !name || typeof version !== 'string')) {
          throw new Error(`${section} must be an object of package names and version strings`);
        }
      }
      return new Project(path, value as Manifest, source);
    } catch (error) {
      throw new Error(`Invalid project at ${location}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  entries(sections: Section[]): Array<{ name: string; version: string }> {
    return sections.flatMap((section) => Object.entries((this.manifest[section] ?? {}) as Dependencies)
      .map(([name, version]) => ({ name, version })));
  }

  async update(sections: Section[], versions: Map<string, string>): Promise<void> {
    for (const section of sections) {
      const deps = this.manifest[section] as Dependencies | undefined;
      if (!deps) continue;
      for (const name of Object.keys(deps)) {
        const version = versions.get(name);
        if (version !== undefined) deps[name] = version;
      }
    }
    const indentation = this.source.match(/^[ \t]+(?=")/m)?.[0] ?? '  ';
    const newline = this.source.includes('\r\n') ? '\r\n' : '\n';
    const output = JSON.stringify(this.manifest, null, indentation).replace(/\n/g, newline);
    await writeFile(this.path, output + (this.source.endsWith('\n') ? newline : ''), 'utf8');
  }
}

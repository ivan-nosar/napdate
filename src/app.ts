import { helpText, parseArguments } from './arguments.js';
import { parallelMap } from './parallel.js';
import { Project } from './project.js';
import { latestVersion } from './registry.js';

export async function run(args: string[], print: (message: string) => void = console.log): Promise<void> {
  const parsed = parseArguments(args);
  if ('help' in parsed) {
    print(helpText(parsed.help));
    return;
  }
  const { location, sections, dryRun, concurrent } = parsed.options;
  const project = await Project.load(location);
  const entries = project.entries(sections);
  const names = [...new Set(entries.map(({ name }) => name))];
  const resolved = await parallelMap(names, concurrent, latestVersion);
  const versions = new Map(names.map((name, index) => [name, resolved[index]]));
  if (dryRun) {
    for (const { name, version } of entries) {
      print(`${JSON.stringify(name)}: ${version} -> ${versions.get(name)};`);
    }
  } else if (entries.length > 0) {
    await project.update(sections, versions);
  }
}

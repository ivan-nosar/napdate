export type Section = 'dependencies' | 'devDependencies' | 'optionalDependencies';

export interface Options {
  location: string;
  dryRun: boolean;
  concurrent: number;
  sections: Section[];
}

export type Arguments = { help: 'generic' | 'npm' } | { options: Options };

export function parseArguments(args: string[]): Arguments {
  if (args.length === 1 && (args[0] === '-h' || args[0] === '--help')) {
    return { help: 'generic' };
  }
  const projectType = args[0];
  if (!projectType || projectType.toLowerCase() !== 'npm') {
    throw new Error('Expected project type: npm');
  }
  const options: Options = {
    location: '.',
    dryRun: false,
    concurrent: 8,
    sections: ['dependencies', 'devDependencies', 'optionalDependencies'],
  };
  let hasLocation = false;
  let help = false;
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      help = true;
    } else if (arg === '-d' || arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '-c' || arg === '--concurrent') {
      const value = args[++i];
      if (!value || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100) {
        throw new Error('Concurrency must be an integer between 1 and 100');
      }
      options.concurrent = Number(value);
    } else if (arg === '--no-deps' || arg === '--no-dev' || arg === '--no-optional') {
      const section = { '--no-deps': 'dependencies', '--no-dev': 'devDependencies', '--no-optional': 'optionalDependencies' }[arg] as Section;
      options.sections = options.sections.filter((item) => item !== section);
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!hasLocation) {
      options.location = arg;
      hasLocation = true;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return help ? { help: 'npm' } : { options };
}

export function helpText(mode: 'generic' | 'npm'): string {
  const usage = 'Usage: napdate <PROJECT_TYPE> [<LOCATION>] [...<OPTIONS>]\n\nProject types: npm';
  if (mode === 'generic') return `${usage}\n\nUse napdate npm --help for project-specific options.`;
  return `${usage}

LOCATION is a directory or a package.json file (default: current directory).
Options:
  -h, --help               Show this help
  -d, --dry-run            Print updates without modifying the file
  -c, --concurrent <1-100> Maximum concurrent registry requests (default: 8)
  --no-deps                Skip dependencies
  --no-dev                 Skip devDependencies
  --no-optional            Skip optionalDependencies`;
}

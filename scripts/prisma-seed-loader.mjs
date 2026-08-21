import { accessSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL && specifier.startsWith('./') && specifier.endsWith('.js')) {
      const tsSpecifier = `${specifier.slice(0, -3)}.ts`;
      const candidate = new URL(tsSpecifier, context.parentURL);

      try {
        accessSync(fileURLToPath(candidate));
        return nextResolve(candidate.href, context);
      } catch {
        // Fall through to the normal ESM resolver for real .js modules.
      }
    }

    return nextResolve(specifier, context);
  },
});

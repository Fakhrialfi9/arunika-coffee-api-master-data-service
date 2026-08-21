import { accessSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL && specifier.startsWith('./') && specifier.endsWith('.js')) {
      const candidate = new URL(`${specifier.slice(0, -3)}.ts`, context.parentURL);

      try {
        accessSync(fileURLToPath(candidate));
        return nextResolve(candidate.href, context);
      } catch {
        // Fall through when a real JavaScript module is being imported.
      }
    }

    return nextResolve(specifier, context);
  },
});

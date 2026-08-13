import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";

const cache = new Map();

function resolveModulePath(parentPath, request) {
  const unresolvedPath = resolve(dirname(parentPath), request);
  const directPath = unresolvedPath.endsWith(".ts") ? unresolvedPath : `${unresolvedPath}.ts`;
  if (existsSync(directPath)) return directPath;

  const indexPath = resolve(unresolvedPath, "index.ts");
  if (existsSync(indexPath)) return indexPath;

  return directPath;
}

function loadFile(filePath) {
  if (cache.has(filePath)) return cache.get(filePath).exports;

  const source = readFileSync(filePath, "utf8");
  const module = { exports: {} };
  cache.set(filePath, module);
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const execute = new Function("exports", "require", "module", compiled);
  execute(module.exports, (request) => {
    if (!request.startsWith(".")) throw new Error(`Unsupported core dependency: ${request}`);
    return loadFile(resolveModulePath(filePath, request));
  }, module);
  return module.exports;
}

export function loadTypeScriptModule(entryPath) {
  return loadFile(resolve(entryPath));
}

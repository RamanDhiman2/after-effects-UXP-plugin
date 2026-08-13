import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";
import { existsSync } from "node:fs";
import ts from "typescript";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(projectRoot, "src");
const modules = new Map();

function moduleId(filePath) {
  return relative(projectRoot, filePath).replaceAll("\\", "/");
}

async function collectModule(filePath) {
  const id = moduleId(filePath);
  if (modules.has(id)) return;

  const source = await readFile(filePath, "utf8");
  modules.set(id, "");
  const imports = [...source.matchAll(/from\s+["'](\.[^"']+)["']/g)].map((match) => match[1]);
  await Promise.all(imports.map((request) => collectModule(resolveModulePath(filePath, request))));

  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  modules.set(id, javascript);
}

function resolveModulePath(parentPath, request) {
  const unresolvedPath = resolve(dirname(parentPath), request);
  const directPath = unresolvedPath.endsWith(".ts") ? unresolvedPath : `${unresolvedPath}.ts`;
  if (existsSync(directPath)) return directPath;

  const indexPath = resolve(unresolvedPath, "index.ts");
  if (existsSync(indexPath)) return indexPath;

  return directPath;
}

await collectModule(resolve(sourceRoot, "main.ts"));

const bundledModules = [...modules.entries()]
  .map(([id, javascript]) => `${JSON.stringify(id)}: function (exports, require) {\n${javascript}\n}`)
  .join(",\n");

const bundle = `(() => {
  const modules = {${bundledModules}};
  const cache = {};
  const normalize = (path) => path.split("/").reduce((parts, segment) => {
    if (!segment || segment === ".") return parts;
    if (segment === "..") { parts.pop(); return parts; }
    parts.push(segment); return parts;
  }, []).join("/");
  const load = (id) => {
    if (cache[id]) return cache[id].exports;
    const factory = modules[id];
    if (!factory) throw new Error("Missing bundled module: " + id);
    const module = { exports: {} }; cache[id] = module;
    factory(module.exports, (request) => {
      if (!request.startsWith(".")) throw new Error("Unsupported external module: " + request);
      const base = id.slice(0, id.lastIndexOf("/") + 1);
      const directId = normalize(base + request) + ".ts";
      const indexId = normalize(base + request + "/index.ts");
      return load(modules[directId] ? directId : indexId);
    });
    return module.exports;
  };
  load("src/main.ts");
})();
`;

await mkdir(resolve(projectRoot, "dist"), { recursive: true });
await writeFile(resolve(projectRoot, "dist", "main.js"), bundle, "utf8");

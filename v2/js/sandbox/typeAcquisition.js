var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "./vendor/lzstring.min"], function (require, exports, lzstring_min_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    lzstring_min_1 = __importDefault(lzstring_min_1);
    const globalishObj = typeof globalThis !== 'undefined' ? globalThis : window || {};
    globalishObj.typeDefinitions = {};
    /**
     * Type Defs we've already got, and nulls when something has failed.
     * This is to make sure that it doesn't infinite loop.
     */
    exports.acquiredTypeDefs = globalishObj;
    const moduleJSONURL = (name) => 
    // prettier-ignore
    `https://ofcncog2cu-dsn.algolia.net/1/indexes/npm-search/${encodeURIComponent(name)}?attributes=types&x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%20(lite)%203.27.1&x-algolia-application-id=OFCNCOG2CU&x-algolia-api-key=f54e21fa3a2a0160595bb058179bfb1e`;
    const unpkgURL = (name, path) => `https://www.unpkg.com/${encodeURIComponent(name)}/${encodeURIComponent(path)}`;
    const packageJSONURL = (name) => unpkgURL(name, 'package.json');
    const errorMsg = (msg, response, config) => {
        config.logger.error(`${msg} - will not try again in this session`, response.status, response.statusText, response);
        debugger;
    };
    /**
     * Grab any import/requires from inside the code and make a list of
     * its dependencies
     */
    const parseFileForModuleReferences = (sourceCode) => {
        // https://regex101.com/r/Jxa3KX/4
        const requirePattern = /(const|let|var)(.|\n)*? require\(('|")(.*)('|")\);?$/;
        // this handle ths 'from' imports  https://regex101.com/r/hdEpzO/4
        const es6Pattern = /(import|export)((?!from)(?!require)(.|\n))*?(from|require\()\s?('|")(.*)('|")\)?;?$/gm;
        // https://regex101.com/r/hdEpzO/6
        const es6ImportOnly = /import\s?('|")(.*)('|")\)?;?/gm;
        const foundModules = new Set();
        var match;
        while ((match = es6Pattern.exec(sourceCode)) !== null) {
            if (match[6])
                foundModules.add(match[6]);
        }
        while ((match = requirePattern.exec(sourceCode)) !== null) {
            if (match[5])
                foundModules.add(match[5]);
        }
        while ((match = es6ImportOnly.exec(sourceCode)) !== null) {
            if (match[2])
                foundModules.add(match[2]);
        }
        return Array.from(foundModules);
    };
    /** Converts some of the known global imports to node so that we grab the right info */
    const mapModuleNameToModule = (name) => {
        // in node repl:
        // > require("module").builtinModules
        const builtInNodeMods = [
            'assert',
            'async_hooks',
            'base',
            'buffer',
            'child_process',
            'cluster',
            'console',
            'constants',
            'crypto',
            'dgram',
            'dns',
            'domain',
            'events',
            'fs',
            'globals',
            'http',
            'http2',
            'https',
            'index',
            'inspector',
            'module',
            'net',
            'os',
            'path',
            'perf_hooks',
            'process',
            'punycode',
            'querystring',
            'readline',
            'repl',
            'stream',
            'string_decoder',
            'timers',
            'tls',
            'trace_events',
            'tty',
            'url',
            'util',
            'v8',
            'vm',
            'worker_threads',
            'zlib',
        ];
        if (builtInNodeMods.includes(name)) {
            return 'node';
        }
        return name;
    };
    //** A really dumb version of path.resolve */
    const mapRelativePath = (moduleDeclaration, currentPath) => {
        // https://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript
        function absolute(base, relative) {
            if (!base)
                return relative;
            const stack = base.split('/');
            const parts = relative.split('/');
            stack.pop(); // remove current file name (or empty string)
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] == '.')
                    continue;
                if (parts[i] == '..')
                    stack.pop();
                else
                    stack.push(parts[i]);
            }
            return stack.join('/');
        }
        return absolute(currentPath, moduleDeclaration);
    };
    const convertToModuleReferenceID = (outerModule, moduleDeclaration, currentPath) => {
        const modIsScopedPackageOnly = moduleDeclaration.indexOf('@') === 0 && moduleDeclaration.split('/').length === 2;
        const modIsPackageOnly = moduleDeclaration.indexOf('@') === -1 && moduleDeclaration.split('/').length === 1;
        const isPackageRootImport = modIsPackageOnly || modIsScopedPackageOnly;
        if (isPackageRootImport) {
            return moduleDeclaration;
        }
        else {
            return `${outerModule}-${mapRelativePath(moduleDeclaration, currentPath)}`;
        }
    };
    /**
     * Takes an initial module and the path for the root of the typings and grab it and start grabbing its
     * dependencies then add those the to runtime.
     */
    const addModuleToRuntime = (mod, path, config) => __awaiter(void 0, void 0, void 0, function* () {
        const isDeno = path && path.indexOf('https://') === 0;
        const dtsFileURL = isDeno ? path : unpkgURL(mod, path);
        const content = yield getCachedDTSString(config, dtsFileURL);
        if (!content) {
            return errorMsg(`Could not get root d.ts file for the module '${mod}' at ${path}`, {}, config);
        }
        // Now look and grab dependent modules where you need the
        yield getDependenciesForModule(content, mod, path, config);
        if (isDeno) {
            const wrapped = `declare module "${path}" { ${content} }`;
            config.addLibraryToRuntime(wrapped, path);
        }
        else {
            const typelessModule = mod.split('@types/').slice(-1);
            const wrapped = `declare module "${typelessModule}" { ${content} }`;
            config.addLibraryToRuntime(wrapped, `node_modules/${mod}/${path}`);
        }
    });
    /**
     * Takes a module import, then uses both the algolia API and the the package.json to derive
     * the root type def path.
     *
     * @param {string} packageName
     * @returns {Promise<{ mod: string, path: string, packageJSON: any }>}
     */
    const getModuleAndRootDefTypePath = (packageName, config) => __awaiter(void 0, void 0, void 0, function* () {
        const url = moduleJSONURL(packageName);
        const response = yield config.fetcher(url);
        if (!response.ok) {
            return errorMsg(`Could not get Algolia JSON for the module '${packageName}'`, response, config);
        }
        const responseJSON = yield response.json();
        if (!responseJSON) {
            return errorMsg(`Could the Algolia JSON was un-parsable for the module '${packageName}'`, response, config);
        }
        if (!responseJSON.types) {
            return config.logger.log(`There were no types for '${packageName}' - will not try again in this session`);
        }
        if (!responseJSON.types.ts) {
            return config.logger.log(`There were no types for '${packageName}' - will not try again in this session`);
        }
        exports.acquiredTypeDefs[packageName] = responseJSON;
        if (responseJSON.types.ts === 'included') {
            const modPackageURL = packageJSONURL(packageName);
            const response = yield config.fetcher(modPackageURL);
            if (!response.ok) {
                return errorMsg(`Could not get Package JSON for the module '${packageName}'`, response, config);
            }
            const responseJSON = yield response.json();
            if (!responseJSON) {
                return errorMsg(`Could not get Package JSON for the module '${packageName}'`, response, config);
            }
            config.addLibraryToRuntime(JSON.stringify(responseJSON, null, '  '), `node_modules/${packageName}/package.json`);
            // Get the path of the root d.ts file
            // non-inferred route
            let rootTypePath = responseJSON.typing || responseJSON.typings || responseJSON.types;
            // package main is custom
            if (!rootTypePath && typeof responseJSON.main === 'string' && responseJSON.main.indexOf('.js') > 0) {
                rootTypePath = responseJSON.main.replace(/js$/, 'd.ts');
            }
            // Final fallback, to have got here it must have passed in algolia
            if (!rootTypePath) {
                rootTypePath = 'index.d.ts';
            }
            return { mod: packageName, path: rootTypePath, packageJSON: responseJSON };
        }
        else if (responseJSON.types.ts === 'definitely-typed') {
            return { mod: responseJSON.types.definitelyTyped, path: 'index.d.ts', packageJSON: responseJSON };
        }
        else {
            throw "This shouldn't happen";
        }
    });
    const getCachedDTSString = (config, url) => __awaiter(void 0, void 0, void 0, function* () {
        const cached = localStorage.getItem(url);
        if (cached) {
            const [dateString, text] = cached.split('-=-^-=-');
            const cachedDate = new Date(dateString);
            const now = new Date();
            const cacheTimeout = 604800000; // 1 week
            // const cacheTimeout = 60000 // 1 min
            if (now.getTime() - cachedDate.getTime() < cacheTimeout) {
                return lzstring_min_1.default.decompressFromUTF16(text);
            }
            else {
                config.logger.log('Skipping cache for ', url);
            }
        }
        const response = yield config.fetcher(url);
        if (!response.ok) {
            return errorMsg(`Could not get DTS response for the module at ${url}`, response, config);
        }
        // TODO: handle checking for a resolve to index.d.ts whens someone imports the folder
        let content = yield response.text();
        if (!content) {
            return errorMsg(`Could not get text for DTS response at ${url}`, response, config);
        }
        const now = new Date();
        const cacheContent = `${now.toISOString()}-=-^-=-${lzstring_min_1.default.compressToUTF16(content)}`;
        localStorage.setItem(url, cacheContent);
        return content;
    });
    const getReferenceDependencies = (sourceCode, mod, path, config) => __awaiter(void 0, void 0, void 0, function* () {
        var match;
        if (sourceCode.indexOf('reference path') > 0) {
            // https://regex101.com/r/DaOegw/1
            const referencePathExtractionPattern = /<reference path="(.*)" \/>/gm;
            while ((match = referencePathExtractionPattern.exec(sourceCode)) !== null) {
                const relativePath = match[1];
                if (relativePath) {
                    let newPath = mapRelativePath(relativePath, path);
                    if (newPath) {
                        const dtsRefURL = unpkgURL(mod, newPath);
                        const dtsReferenceResponseText = yield getCachedDTSString(config, dtsRefURL);
                        if (!dtsReferenceResponseText) {
                            return errorMsg(`Could not get root d.ts file for the module '${mod}' at ${path}`, {}, config);
                        }
                        yield getDependenciesForModule(dtsReferenceResponseText, mod, newPath, config);
                        const representationalPath = `node_modules/${mod}/${newPath}`;
                        config.addLibraryToRuntime(dtsReferenceResponseText, representationalPath);
                    }
                }
            }
        }
    });
    /**
     * Pseudo in-browser type acquisition tool, uses a
     */
    exports.detectNewImportsToAcquireTypeFor = (sourceCode, userAddLibraryToRuntime, fetcher = fetch, playgroundConfig) => __awaiter(void 0, void 0, void 0, function* () {
        // Wrap the runtime func with our own side-effect for visibility
        const addLibraryToRuntime = (code, path) => {
            globalishObj.typeDefinitions[path] = code;
            userAddLibraryToRuntime(code, path);
        };
        // Basically start the recursion with an undefined module
        const config = { sourceCode, addLibraryToRuntime, fetcher, logger: playgroundConfig.logger };
        return getDependenciesForModule(sourceCode, undefined, 'playground.ts', config);
    });
    /**
     * Looks at a JS/DTS file and recurses through all the dependencies.
     * It avoids
     */
    const getDependenciesForModule = (sourceCode, moduleName, path, config) => {
        // Get all the import/requires for the file
        const filteredModulesToLookAt = parseFileForModuleReferences(sourceCode);
        filteredModulesToLookAt.forEach((name) => __awaiter(void 0, void 0, void 0, function* () {
            // Support grabbing the hard-coded node modules if needed
            const moduleToDownload = mapModuleNameToModule(name);
            if (!moduleName && moduleToDownload.startsWith('.')) {
                return config.logger.log("[ATA] Can't resolve relative dependencies from the playground root");
            }
            const moduleID = convertToModuleReferenceID(moduleName, moduleToDownload, moduleName);
            if (exports.acquiredTypeDefs[moduleID] || exports.acquiredTypeDefs[moduleID] === null) {
                return;
            }
            config.logger.log(`[ATA] Looking at ${moduleToDownload}`);
            const modIsScopedPackageOnly = moduleToDownload.indexOf('@') === 0 && moduleToDownload.split('/').length === 2;
            const modIsPackageOnly = moduleToDownload.indexOf('@') === -1 && moduleToDownload.split('/').length === 1;
            const isPackageRootImport = modIsPackageOnly || modIsScopedPackageOnly;
            const isDenoModule = moduleToDownload.indexOf('https://') === 0;
            if (isPackageRootImport) {
                // So it doesn't run twice for a package
                exports.acquiredTypeDefs[moduleID] = null;
                // E.g. import danger from "danger"
                const packageDef = yield getModuleAndRootDefTypePath(moduleToDownload, config);
                if (packageDef) {
                    exports.acquiredTypeDefs[moduleID] = packageDef.packageJSON;
                    yield addModuleToRuntime(packageDef.mod, packageDef.path, config);
                }
            }
            else if (isDenoModule) {
                // E.g. import { serve } from "https://deno.land/std@v0.12/http/server.ts";
                yield addModuleToRuntime(moduleToDownload, moduleToDownload, config);
            }
            else {
                // E.g. import {Component} from "./MyThing"
                if (!moduleToDownload || !path)
                    throw `No outer module or path for a relative import: ${moduleToDownload}`;
                const absolutePathForModule = mapRelativePath(moduleToDownload, path);
                // So it doesn't run twice for a package
                exports.acquiredTypeDefs[moduleID] = null;
                const resolvedFilepath = absolutePathForModule.endsWith('.ts')
                    ? absolutePathForModule
                    : absolutePathForModule + '.d.ts';
                yield addModuleToRuntime(moduleName, resolvedFilepath, config);
            }
        }));
        // Also support the
        getReferenceDependencies(sourceCode, moduleName, path, config);
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZUFjcXVpc2l0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2FuZGJveC9zcmMvdHlwZUFjcXVpc2l0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHQSxNQUFNLFlBQVksR0FBUSxPQUFPLFVBQVUsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQTtJQUN2RixZQUFZLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQTtJQUVqQzs7O09BR0c7SUFDVSxRQUFBLGdCQUFnQixHQUFzQyxZQUFZLENBQUE7SUFJL0UsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtJQUNyQyxrQkFBa0I7SUFDbEIsMkRBQTJELGtCQUFrQixDQUFDLElBQUksQ0FBQyxpTEFBaUwsQ0FBQTtJQUV0USxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQVksRUFBRSxJQUFZLEVBQUUsRUFBRSxDQUM5Qyx5QkFBeUIsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQTtJQUVqRixNQUFNLGNBQWMsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUV2RSxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQVcsRUFBRSxRQUFhLEVBQUUsTUFBaUIsRUFBRSxFQUFFO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyx1Q0FBdUMsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbEgsUUFBUSxDQUFBO0lBQ1YsQ0FBQyxDQUFBO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSw0QkFBNEIsR0FBRyxDQUFDLFVBQWtCLEVBQUUsRUFBRTtRQUMx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cnQgbHpzdHJpbmcgZnJvbSAnLi92ZW5kb3IvbHpzdHJpbmcubWluJ1xuXG5jb25zdCBnbG9iYWxpc2hPYmo6IGFueSA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiB3aW5kb3cgfHwge31cbmdsb2JhbGlzaE9iai50eXBlRGVmaW5pdGlvbnMgPSB7fVxuXG4vKipcbiAqIFR5cGUgRGVmcyB3ZSd2ZSBhbHJlYWR5IGdvdCwgYW5kIG51bGxzIHdoZW4gc29tZXRoaW5nIGhhcyBmYWlsZWQuXG4gKiBUaGlzIGlzIHRvIG1ha2Ugc3VyZSB0aGF0IGl0IGRvZXNuJ3QgaW5maW5pdGUgbG9vcC5cbiAqL1xuZXhwb3J0IGNvbnN0IGFjcXVpcmVkVHlwZURlZnM6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB8IG51bGwgfSA9IGdsb2JhbGlzaE9ialxuXG5leHBvcnQgdHlwZSBBZGRMaWJUb1J1bnRpbWVGdW5jID0gKGNvZGU6IHN0cmluZywgcGF0aDogc3RyaW5nKSA9PiB2b2lkXG5cbmNvbnN0IG1vZHVsZUpTT05VUkwgPSAobmFtZTogc3RyaW5nKSA9PlxuICAvLyBwcmV0dGllci1pZ25vcmVcbiAgYGh0dHBzOi8vb2ZjbmNvZzJjdS1kc24uYWxnb2xpYS5uZXQvMS9pbmRleGVzL25wbS1zZWFyY2gvJHtlbmNvZGVVUklDb21wb25lbnQobmFtZSl9P2F0dHJpYnV0ZXM9dHlwZXMmeC1hbGdvbGlhLWFnZW50PUFsZ29saWElMjBmb3IlMjB2YW5pbGxhJTIwSmF2YVNjcmlwdCUyMChsaXRlKSUyMDMuMjcuMSZ4LWFsZ29saWEtYXBwbGljYXRpb24taWQ9T0ZDTkNPRzJDVSZ4LWFsZ29saWEtYXBpLWtleT1mNTRlMjFmYTNhMmEwMTYwNTk1YmIwNTgxNzliZmIxZWBcblxuY29uc3QgdW5wa2dVUkwgPSAobmFtZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpID0+XG4gIGBodHRwczovL3d3dy51bnBrZy5jb20vJHtlbmNvZGVVUklDb21wb25lbnQobmFtZSl9LyR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhdGgpfWBcblxuY29uc3QgcGFja2FnZUpTT05VUkwgPSAobmFtZTogc3RyaW5nKSA9PiB1bnBrZ1VSTChuYW1lLCAncGFja2FnZS5qc29uJylcblxuY29uc3QgZXJyb3JNc2cgPSAobXNnOiBzdHJpbmcsIHJlc3BvbnNlOiBhbnksIGNvbmZpZzogQVRBQ29uZmlnKSA9PiB7XG4gIGNvbmZpZy5sb2dnZXIuZXJyb3IoYCR7bXNnfSAtIHdpbGwgbm90IHRyeSBhZ2FpbiBpbiB0aGlzIHNlc3Npb25gLCByZXNwb25zZS5zdGF0dXMsIHJlc3BvbnNlLnN0YXR1c1RleHQsIHJlc3BvbnNlKVxuICBkZWJ1Z2dlclxufVxuXG4vKipcbiAqIEdyYWIgYW55IGltcG9ydC9yZXF1aXJlcyBmcm9tIGluc2lkZSB0aGUgY29kZSBhbmQgbWFrZSBhIGxpc3Qgb2ZcbiAqIGl0cyBkZXBlbmRlbmNpZXNcbiAqL1xuY29uc3QgcGFyc2VGaWxlRm9yTW9kdWxlUmVmZXJlbmNlcyA9IChzb3VyY2VDb2RlOiBzdHJpbmcpID0+IHtcbiAgLy8gaHR0cHM6Ly9yZWdleDEwMS5jb20vci9KeGEzS1gvNFxuICBjb25zdCByZXF1aXJlUGF0dGVybiA9IC8oY29uc3R8bGV0fHZhcikoLnxcXG4pKj8gcmVxdWlyZVxcKCgnfFwiKSguKikoJ3xcIilcXCk7PyQvXG4gIC8vIHRoaXMgaGFuZGxlIHRocyAnZnJvbScgaW1wb3J0cyAgaHR0cHM6Ly9yZWdleDEwMS5jb20vci9oZEVwek8vNFxuICBjb25zdCBlczZQYXR0ZXJuID0gLyhpbXBvcnR8ZXhwb3J0KSgoPyFmcm9tKSg/IXJlcXVpcmUpKC58XFxuKSkqPyhmcm9tfHJlcXVpcmVcXCgpXFxzPygnfFwiKSguKikoJ3xcIilcXCk/Oz8kL2dtXG4gIC8vIGh0dHBzOi8vcmVnZXgxMDEuY29tL3IvaGRFcHpPLzZcbiAgY29uc3QgZXM2SW1wb3J0T25seSA9IC9pbXBvcnRcXHM/KCd8XCIpKC4qKSgnfFwiKVxcKT87Py9nbVxuXG4gIGNvbnN0IGZvdW5kTW9kdWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gIHZhciBtYXRjaFxuXG4gIHdoaWxlICgobWF0Y2ggPSBlczZQYXR0ZXJuLmV4ZWMoc291cmNlQ29kZSkpICE9PSBudWxsKSB7XG4gICAgaWYgKG1hdGNoWzZdKSBmb3VuZE1vZHVsZXMuYWRkKG1hdGNoWzZdKVxuICB9XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJlcXVpcmVQYXR0ZXJuLmV4ZWMoc291cmNlQ29kZSkpICE9PSBudWxsKSB7XG4gICAgaWYgKG1hdGNoWzVdKSBmb3VuZE1vZHVsZXMuYWRkKG1hdGNoWzVdKVxuICB9XG5cbiAgd2hpbGUgKChtYXRjaCA9IGVzNkltcG9ydE9ubHkuZXhlYyhzb3VyY2VDb2RlKSkgIT09IG51bGwpIHtcbiAgICBpZiAobWF0Y2hbMl0pIGZvdW5kTW9kdWxlcy5hZGQobWF0Y2hbMl0pXG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShmb3VuZE1vZHVsZXMpXG59XG5cbi8qKiBDb252ZXJ0cyBzb21lIG9mIHRoZSBrbm93biBnbG9iYWwgaW1wb3J0cyB0byBub2RlIHNvIHRoYXQgd2UgZ3JhYiB0aGUgcmlnaHQgaW5mbyAqL1xuY29uc3QgbWFwTW9kdWxlTmFtZVRvTW9kdWxlID0gKG5hbWU6IHN0cmluZykgPT4ge1xuICAvLyBpbiBub2RlIHJlcGw6XG4gIC8vID4gcmVxdWlyZShcIm1vZHVsZVwiKS5idWlsdGluTW9kdWxlc1xuICBjb25zdCBidWlsdEluTm9kZU1vZHMgPSBbXG4gICAgJ2Fzc2VydCcsXG4gICAgJ2FzeW5jX2hvb2tzJyxcbiAgICAnYmFzZScsXG4gICAgJ2J1ZmZlcicsXG4gICAgJ2NoaWxkX3Byb2Nlc3MnLFxuICAgICdjbHVzdGVyJyxcbiAgICAnY29uc29sZScsXG4gICAgJ2NvbnN0YW50cycsXG4gICAgJ2NyeXB0bycsXG4gICAgJ2RncmFtJyxcbiAgICAnZG5zJyxcbiAgICAnZG9tYWluJyxcbiAgICAnZXZlbnRzJyxcbiAgICAnZnMnLFxuICAgICdnbG9iYWxzJyxcbiAgICAnaHR0cCcsXG4gICAgJ2h0dHAyJyxcbiAgICAnaHR0cHMnLFxuICAgICdpbmRleCcsXG4gICAgJ2luc3BlY3RvcicsXG4gICAgJ21vZHVsZScsXG4gICAgJ25ldCcsXG4gICAgJ29zJyxcbiAgICAncGF0aCcsXG4gICAgJ3BlcmZfaG9va3MnLFxuICAgICdwcm9jZXNzJyxcbiAgICAncHVueWNvZGUnLFxuICAgICdxdWVyeXN0cmluZycsXG4gICAgJ3JlYWRsaW5lJyxcbiAgICAncmVwbCcsXG4gICAgJ3N0cmVhbScsXG4gICAgJ3N0cmluZ19kZWNvZGVyJyxcbiAgICAndGltZXJzJyxcbiAgICAndGxzJyxcbiAgICAndHJhY2VfZXZlbnRzJyxcbiAgICAndHR5JyxcbiAgICAndXJsJyxcbiAgICAndXRpbCcsXG4gICAgJ3Y4JyxcbiAgICAndm0nLFxuICAgICd3b3JrZXJfdGhyZWFkcycsXG4gICAgJ3psaWInLFxuICBdXG5cbiAgaWYgKGJ1aWx0SW5Ob2RlTW9kcy5pbmNsdWRlcyhuYW1lKSkge1xuICAgIHJldHVybiAnbm9kZSdcbiAgfVxuICByZXR1cm4gbmFtZVxufVxuXG4vLyoqIEEgcmVhbGx5IGR1bWIgdmVyc2lvbiBvZiBwYXRoLnJlc29sdmUgKi9cbmNvbnN0IG1hcFJlbGF0aXZlUGF0aCA9IChtb2R1bGVEZWNsYXJhdGlvbjogc3RyaW5nLCBjdXJyZW50UGF0aDogc3RyaW5nKSA9PiB7XG4gIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0NzgwMzUwL2NvbnZlcnQtcmVsYXRpdmUtcGF0aC10by1hYnNvbHV0ZS11c2luZy1qYXZhc2NyaXB0XG4gIGZ1bmN0aW9uIGFic29sdXRlKGJhc2U6IHN0cmluZywgcmVsYXRpdmU6IHN0cmluZykge1xuICAgIGlmICghYmFzZSkgcmV0dXJuIHJlbGF0aXZlXG5cbiAgICBjb25zdCBzdGFjayA9IGJhc2Uuc3BsaXQoJy8nKVxuICAgIGNvbnN0IHBhcnRzID0gcmVsYXRpdmUuc3BsaXQoJy8nKVxuICAgIHN0YWNrLnBvcCgpIC8vIHJlbW92ZSBjdXJyZW50IGZpbGUgbmFtZSAob3IgZW1wdHkgc3RyaW5nKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBhcnRzW2ldID09ICcuJykgY29udGludWVcbiAgICAgIGlmIChwYXJ0c1tpXSA9PSAnLi4nKSBzdGFjay5wb3AoKVxuICAgICAgZWxzZSBzdGFjay5wdXNoKHBhcnRzW2ldKVxuICAgIH1cbiAgICByZXR1cm4gc3RhY2suam9pbignLycpXG4gIH1cblxuICByZXR1cm4gYWJzb2x1dGUoY3VycmVudFBhdGgsIG1vZHVsZURlY2xhcmF0aW9uKVxufVxuXG5jb25zdCBjb252ZXJ0VG9Nb2R1bGVSZWZlcmVuY2VJRCA9IChvdXRlck1vZHVsZTogc3RyaW5nLCBtb2R1bGVEZWNsYXJhdGlvbjogc3RyaW5nLCBjdXJyZW50UGF0aDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IG1vZElzU2NvcGVkUGFja2FnZU9ubHkgPSBtb2R1bGVEZWNsYXJhdGlvbi5pbmRleE9mKCdAJykgPT09IDAgJiYgbW9kdWxlRGVjbGFyYXRpb24uc3BsaXQoJy8nKS5sZW5ndGggPT09IDJcbiAgY29uc3QgbW9kSXNQYWNrYWdlT25seSA9IG1vZHVsZURlY2xhcmF0aW9uLmluZGV4T2YoJ0AnKSA9PT0gLTEgJiYgbW9kdWxlRGVjbGFyYXRpb24uc3BsaXQoJy8nKS5sZW5ndGggPT09IDFcbiAgY29uc3QgaXNQYWNrYWdlUm9vdEltcG9ydCA9IG1vZElzUGFja2FnZU9ubHkgfHwgbW9kSXNTY29wZWRQYWNrYWdlT25seVxuXG4gIGlmIChpc1BhY2thZ2VSb290SW1wb3J0KSB7XG4gICAgcmV0dXJuIG1vZHVsZURlY2xhcmF0aW9uXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGAke291dGVyTW9kdWxlfS0ke21hcFJlbGF0aXZlUGF0aChtb2R1bGVEZWNsYXJhdGlvbiwgY3VycmVudFBhdGgpfWBcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGFuIGluaXRpYWwgbW9kdWxlIGFuZCB0aGUgcGF0aCBmb3IgdGhlIHJvb3Qgb2YgdGhlIHR5cGluZ3MgYW5kIGdyYWIgaXQgYW5kIHN0YXJ0IGdyYWJiaW5nIGl0c1xuICogZGVwZW5kZW5jaWVzIHRoZW4gYWRkIHRob3NlIHRoZSB0byBydW50aW1lLlxuICovXG5jb25zdCBhZGRNb2R1bGVUb1J1bnRpbWUgPSBhc3luYyAobW9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgY29uZmlnOiBBVEFDb25maWcpID0+IHtcbiAgY29uc3QgaXNEZW5vID0gcGF0aCAmJiBwYXRoLmluZGV4T2YoJ2h0dHBzOi8vJykgPT09IDBcblxuICBjb25zdCBkdHNGaWxlVVJMID0gaXNEZW5vID8gcGF0aCA6IHVucGtnVVJMKG1vZCwgcGF0aClcblxuICBjb25zdCBjb250ZW50ID0gYXdhaXQgZ2V0Q2FjaGVkRFRTU3RyaW5nKGNvbmZpZywgZHRzRmlsZVVSTClcbiAgaWYgKCFjb250ZW50KSB7XG4gICAgcmV0dXJuIGVycm9yTXNnKGBDb3VsZCBub3QgZ2V0IHJvb3QgZC50cyBmaWxlIGZvciB0aGUgbW9kdWxlICcke21vZH0nIGF0ICR7cGF0aH1gLCB7fSwgY29uZmlnKVxuICB9XG5cbiAgLy8gTm93IGxvb2sgYW5kIGdyYWIgZGVwZW5kZW50IG1vZHVsZXMgd2hlcmUgeW91IG5lZWQgdGhlXG4gIGF3YWl0IGdldERlcGVuZGVuY2llc0Zvck1vZHVsZShjb250ZW50LCBtb2QsIHBhdGgsIGNvbmZpZylcblxuICBpZiAoaXNEZW5vKSB7XG4gICAgY29uc3Qgd3JhcHBlZCA9IGBkZWNsYXJlIG1vZHVsZSBcIiR7cGF0aH1cIiB7ICR7Y29udGVudH0gfWBcbiAgICBjb25maWcuYWRkTGlicmFyeVRvUnVudGltZSh3cmFwcGVkLCBwYXRoKVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHR5cGVsZXNzTW9kdWxlID0gbW9kLnNwbGl0KCdAdHlwZXMvJykuc2xpY2UoLTEpXG4gICAgY29uc3Qgd3JhcHBlZCA9IGBkZWNsYXJlIG1vZHVsZSBcIiR7dHlwZWxlc3NNb2R1bGV9XCIgeyAke2NvbnRlbnR9IH1gXG4gICAgY29uZmlnLmFkZExpYnJhcnlUb1J1bnRpbWUod3JhcHBlZCwgYG5vZGVfbW9kdWxlcy8ke21vZH0vJHtwYXRofWApXG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIG1vZHVsZSBpbXBvcnQsIHRoZW4gdXNlcyBib3RoIHRoZSBhbGdvbGlhIEFQSSBhbmQgdGhlIHRoZSBwYWNrYWdlLmpzb24gdG8gZGVyaXZlXG4gKiB0aGUgcm9vdCB0eXBlIGRlZiBwYXRoLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYWNrYWdlTmFtZVxuICogQHJldHVybnMge1Byb21pc2U8eyBtb2Q6IHN0cmluZywgcGF0aDogc3RyaW5nLCBwYWNrYWdlSlNPTjogYW55IH0+fVxuICovXG5jb25zdCBnZXRNb2R1bGVBbmRSb290RGVmVHlwZVBhdGggPSBhc3luYyAocGFja2FnZU5hbWU6IHN0cmluZywgY29uZmlnOiBBVEFDb25maWcpID0+IHtcbiAgY29uc3QgdXJsID0gbW9kdWxlSlNPTlVSTChwYWNrYWdlTmFtZSlcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNvbmZpZy5mZXRjaGVyKHVybClcbiAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgIHJldHVybiBlcnJvck1zZyhgQ291bGQgbm90IGdldCBBbGdvbGlhIEpTT04gZm9yIHRoZSBtb2R1bGUgJyR7cGFja2FnZU5hbWV9J2AsIHJlc3BvbnNlLCBjb25maWcpXG4gIH1cblxuICBjb25zdCByZXNwb25zZUpTT04gPSBhd2FpdCByZXNwb25zZS5qc29uKClcbiAgaWYgKCFyZXNwb25zZUpTT04pIHtcbiAgICByZXR1cm4gZXJyb3JNc2coYENvdWxkIHRoZSBBbGdvbGlhIEpTT04gd2FzIHVuLXBhcnNhYmxlIGZvciB0aGUgbW9kdWxlICcke3BhY2thZ2VOYW1lfSdgLCByZXNwb25zZSwgY29uZmlnKVxuICB9XG5cbiAgaWYgKCFyZXNwb25zZUpTT04udHlwZXMpIHtcbiAgICByZXR1cm4gY29uZmlnLmxvZ2dlci5sb2coYFRoZXJlIHdlcmUgbm8gdHlwZXMgZm9yICcke3BhY2thZ2VOYW1lfScgLSB3aWxsIG5vdCB0cnkgYWdhaW4gaW4gdGhpcyBzZXNzaW9uYClcbiAgfVxuICBpZiAoIXJlc3BvbnNlSlNPTi50eXBlcy50cykge1xuICAgIHJldHVybiBjb25maWcubG9nZ2VyLmxvZyhgVGhlcmUgd2VyZSBubyB0eXBlcyBmb3IgJyR7cGFja2FnZU5hbWV9JyAtIHdpbGwgbm90IHRyeSBhZ2FpbiBpbiB0aGlzIHNlc3Npb25gKVxuICB9XG5cbiAgYWNxdWlyZWRUeXBlRGVmc1twYWNrYWdlTmFtZV0gPSByZXNwb25zZUpTT05cblxuICBpZiAocmVzcG9uc2VKU09OLnR5cGVzLnRzID09PSAnaW5jbHVkZWQnKSB7XG4gICAgY29uc3QgbW9kUGFja2FnZVVSTCA9IHBhY2thZ2VKU09OVVJMKHBhY2thZ2VOYW1lKVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb25maWcuZmV0Y2hlcihtb2RQYWNrYWdlVVJMKVxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHJldHVybiBlcnJvck1zZyhgQ291bGQgbm90IGdldCBQYWNrYWdlIEpTT04gZm9yIHRoZSBtb2R1bGUgJyR7cGFja2FnZU5hbWV9J2AsIHJlc3BvbnNlLCBjb25maWcpXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2VKU09OID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgaWYgKCFyZXNwb25zZUpTT04pIHtcbiAgICAgIHJldHVybiBlcnJvck1zZyhgQ291bGQgbm90IGdldCBQYWNrYWdlIEpTT04gZm9yIHRoZSBtb2R1bGUgJyR7cGFja2FnZU5hbWV9J2AsIHJlc3BvbnNlLCBjb25maWcpXG4gICAgfVxuXG4gICAgY29uZmlnLmFkZExpYnJhcnlUb1J1bnRpbWUoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2VKU09OLCBudWxsLCAnICAnKSwgYG5vZGVfbW9kdWxlcy8ke3BhY2thZ2VOYW1lfS9wYWNrYWdlLmpzb25gKVxuXG4gICAgLy8gR2V0IHRoZSBwYXRoIG9mIHRoZSByb290IGQudHMgZmlsZVxuXG4gICAgLy8gbm9uLWluZmVycmVkIHJvdXRlXG4gICAgbGV0IHJvb3RUeXBlUGF0aCA9IHJlc3BvbnNlSlNPTi50eXBpbmcgfHwgcmVzcG9uc2VKU09OLnR5cGluZ3MgfHwgcmVzcG9uc2VKU09OLnR5cGVzXG5cbiAgICAvLyBwYWNrYWdlIG1haW4gaXMgY3VzdG9tXG4gICAgaWYgKCFyb290VHlwZVBhdGggJiYgdHlwZW9mIHJlc3BvbnNlSlNPTi5tYWluID09PSAnc3RyaW5nJyAmJiByZXNwb25zZUpTT04ubWFpbi5pbmRleE9mKCcuanMnKSA+IDApIHtcbiAgICAgIHJvb3RUeXBlUGF0aCA9IHJlc3BvbnNlSlNPTi5tYWluLnJlcGxhY2UoL2pzJC8sICdkLnRzJylcbiAgICB9XG5cbiAgICAvLyBGaW5hbCBmYWxsYmFjaywgdG8gaGF2ZSBnb3QgaGVyZSBpdCBtdXN0IGhhdmUgcGFzc2VkIGluIGFsZ29saWFcbiAgICBpZiAoIXJvb3RUeXBlUGF0aCkge1xuICAgICAgcm9vdFR5cGVQYXRoID0gJ2luZGV4LmQudHMnXG4gICAgfVxuXG4gICAgcmV0dXJuIHsgbW9kOiBwYWNrYWdlTmFtZSwgcGF0aDogcm9vdFR5cGVQYXRoLCBwYWNrYWdlSlNPTjogcmVzcG9uc2VKU09OIH1cbiAgfSBlbHNlIGlmIChyZXNwb25zZUpTT04udHlwZXMudHMgPT09ICdkZWZpbml0ZWx5LXR5cGVkJykge1xuICAgIHJldHVybiB7IG1vZDogcmVzcG9uc2VKU09OLnR5cGVzLmRlZmluaXRlbHlUeXBlZCwgcGF0aDogJ2luZGV4LmQudHMnLCBwYWNrYWdlSlNPTjogcmVzcG9uc2VKU09OIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBcIlRoaXMgc2hvdWxkbid0IGhhcHBlblwiXG4gIH1cbn1cblxuY29uc3QgZ2V0Q2FjaGVkRFRTU3RyaW5nID0gYXN5bmMgKGNvbmZpZzogQVRBQ29uZmlnLCB1cmw6IHN0cmluZykgPT4ge1xuICBjb25zdCBjYWNoZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSh1cmwpXG4gIGlmIChjYWNoZWQpIHtcbiAgICBjb25zdCBbZGF0ZVN0cmluZywgdGV4dF0gPSBjYWNoZWQuc3BsaXQoJy09LV4tPS0nKVxuICAgIGNvbnN0IGNhY2hlZERhdGUgPSBuZXcgRGF0ZShkYXRlU3RyaW5nKVxuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcblxuICAgIGNvbnN0IGNhY2hlVGltZW91dCA9IDYwNDgwMDAwMCAvLyAxIHdlZWtcbiAgICAvLyBjb25zdCBjYWNoZVRpbWVvdXQgPSA2MDAwMCAvLyAxIG1pblxuXG4gICAgaWYgKG5vdy5nZXRUaW1lKCkgLSBjYWNoZWREYXRlLmdldFRpbWUoKSA8IGNhY2hlVGltZW91dCkge1xuICAgICAgcmV0dXJuIGx6c3RyaW5nLmRlY29tcHJlc3NGcm9tVVRGMTYodGV4dClcbiAgICB9IGVsc2Uge1xuICAgICAgY29uZmlnLmxvZ2dlci5sb2coJ1NraXBwaW5nIGNhY2hlIGZvciAnLCB1cmwpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb25maWcuZmV0Y2hlcih1cmwpXG4gIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICByZXR1cm4gZXJyb3JNc2coYENvdWxkIG5vdCBnZXQgRFRTIHJlc3BvbnNlIGZvciB0aGUgbW9kdWxlIGF0ICR7dXJsfWAsIHJlc3BvbnNlLCBjb25maWcpXG4gIH1cblxuICAvLyBUT0RPOiBoYW5kbGUgY2hlY2tpbmcgZm9yIGEgcmVzb2x2ZSB0byBpbmRleC5kLnRzIHdoZW5zIHNvbWVvbmUgaW1wb3J0cyB0aGUgZm9sZGVyXG4gIGxldCBjb250ZW50ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gIGlmICghY29udGVudCkge1xuICAgIHJldHVybiBlcnJvck1zZyhgQ291bGQgbm90IGdldCB0ZXh0IGZvciBEVFMgcmVzcG9uc2UgYXQgJHt1cmx9YCwgcmVzcG9uc2UsIGNvbmZpZylcbiAgfVxuXG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgY29uc3QgY2FjaGVDb250ZW50ID0gYCR7bm93LnRvSVNPU3RyaW5nKCl9LT0tXi09LSR7bHpzdHJpbmcuY29tcHJlc3NUb1VURjE2KGNvbnRlbnQpfWBcbiAgbG9jYWxTdG9yYWdlLnNldEl0ZW0odXJsLCBjYWNoZUNvbnRlbnQpXG4gIHJldHVybiBjb250ZW50XG59XG5cbmNvbnN0IGdldFJlZmVyZW5jZURlcGVuZGVuY2llcyA9IGFzeW5jIChzb3VyY2VDb2RlOiBzdHJpbmcsIG1vZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGNvbmZpZzogQVRBQ29uZmlnKSA9PiB7XG4gIHZhciBtYXRjaFxuICBpZiAoc291cmNlQ29kZS5pbmRleE9mKCdyZWZlcmVuY2UgcGF0aCcpID4gMCkge1xuICAgIC8vIGh0dHBzOi8vcmVnZXgxMDEuY29tL3IvRGFPZWd3LzFcbiAgICBjb25zdCByZWZlcmVuY2VQYXRoRXh0cmFjdGlvblBhdHRlcm4gPSAvPHJlZmVyZW5jZSBwYXRoPVwiKC4qKVwiIFxcLz4vZ21cbiAgICB3aGlsZSAoKG1hdGNoID0gcmVmZXJlbmNlUGF0aEV4dHJhY3Rpb25QYXR0ZXJuLmV4ZWMoc291cmNlQ29kZSkpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBtYXRjaFsxXVxuICAgICAgaWYgKHJlbGF0aXZlUGF0aCkge1xuICAgICAgICBsZXQgbmV3UGF0aCA9IG1hcFJlbGF0aXZlUGF0aChyZWxhdGl2ZVBhdGgsIHBhdGgpXG4gICAgICAgIGlmIChuZXdQYXRoKSB7XG4gICAgICAgICAgY29uc3QgZHRzUmVmVVJMID0gdW5wa2dVUkwobW9kLCBuZXdQYXRoKVxuXG4gICAgICAgICAgY29uc3QgZHRzUmVmZXJlbmNlUmVzcG9uc2VUZXh0ID0gYXdhaXQgZ2V0Q2FjaGVkRFRTU3RyaW5nKGNvbmZpZywgZHRzUmVmVVJMKVxuICAgICAgICAgIGlmICghZHRzUmVmZXJlbmNlUmVzcG9uc2VUZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3JNc2coYENvdWxkIG5vdCBnZXQgcm9vdCBkLnRzIGZpbGUgZm9yIHRoZSBtb2R1bGUgJyR7bW9kfScgYXQgJHtwYXRofWAsIHt9LCBjb25maWcpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXdhaXQgZ2V0RGVwZW5kZW5jaWVzRm9yTW9kdWxlKGR0c1JlZmVyZW5jZVJlc3BvbnNlVGV4dCwgbW9kLCBuZXdQYXRoLCBjb25maWcpXG4gICAgICAgICAgY29uc3QgcmVwcmVzZW50YXRpb25hbFBhdGggPSBgbm9kZV9tb2R1bGVzLyR7bW9kfS8ke25ld1BhdGh9YFxuICAgICAgICAgIGNvbmZpZy5hZGRMaWJyYXJ5VG9SdW50aW1lKGR0c1JlZmVyZW5jZVJlc3BvbnNlVGV4dCwgcmVwcmVzZW50YXRpb25hbFBhdGgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuaW50ZXJmYWNlIEFUQUNvbmZpZyB7XG4gIHNvdXJjZUNvZGU6IHN0cmluZ1xuICBhZGRMaWJyYXJ5VG9SdW50aW1lOiBBZGRMaWJUb1J1bnRpbWVGdW5jXG4gIGZldGNoZXI6IHR5cGVvZiBmZXRjaFxuICBsb2dnZXI6IFBsYXlncm91bmRDb25maWdbJ2xvZ2dlciddXG59XG5cbi8qKlxuICogUHNldWRvIGluLWJyb3dzZXIgdHlwZSBhY3F1aXNpdGlvbiB0b29sLCB1c2VzIGFcbiAqL1xuZXhwb3J0IGNvbnN0IGRldGVjdE5ld0ltcG9ydHNUb0FjcXVpcmVUeXBlRm9yID0gYXN5bmMgKFxuICBzb3VyY2VDb2RlOiBzdHJpbmcsXG4gIHVzZXJBZGRMaWJyYXJ5VG9SdW50aW1lOiBBZGRMaWJUb1J1bnRpbWVGdW5jLFxuICBmZXRjaGVyID0gZmV0Y2gsXG4gIHBsYXlncm91bmRDb25maWc6IFBsYXlncm91bmRDb25maWdcbikgPT4ge1xuICAvLyBXcmFwIHRoZSBydW50aW1lIGZ1bmMgd2l0aCBvdXIgb3duIHNpZGUtZWZmZWN0IGZvciB2aXNpYmlsaXR5XG4gIGNvbnN0IGFkZExpYnJhcnlUb1J1bnRpbWUgPSAoY29kZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpID0+IHtcbiAgICBnbG9iYWxpc2hPYmoudHlwZURlZmluaXRpb25zW3BhdGhdID0gY29kZVxuICAgIHVzZXJBZGRMaWJyYXJ5VG9SdW50aW1lKGNvZGUsIHBhdGgpXG4gIH1cblxuICAvLyBCYXNpY2FsbHkgc3RhcnQgdGhlIHJlY3Vyc2lvbiB3aXRoIGFuIHVuZGVmaW5lZCBtb2R1bGVcbiAgY29uc3QgY29uZmlnOiBBVEFDb25maWcgPSB7IHNvdXJjZUNvZGUsIGFkZExpYnJhcnlUb1J1bnRpbWUsIGZldGNoZXIsIGxvZ2dlcjogcGxheWdyb3VuZENvbmZpZy5sb2dnZXIgfVxuICByZXR1cm4gZ2V0RGVwZW5kZW5jaWVzRm9yTW9kdWxlKHNvdXJjZUNvZGUsIHVuZGVmaW5lZCwgJ3BsYXlncm91bmQudHMnLCBjb25maWcpXG59XG5cbi8qKlxuICogTG9va3MgYXQgYSBKUy9EVFMgZmlsZSBhbmQgcmVjdXJzZXMgdGhyb3VnaCBhbGwgdGhlIGRlcGVuZGVuY2llcy5cbiAqIEl0IGF2b2lkc1xuICovXG5jb25zdCBnZXREZXBlbmRlbmNpZXNGb3JNb2R1bGUgPSAoXG4gIHNvdXJjZUNvZGU6IHN0cmluZyxcbiAgbW9kdWxlTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICBwYXRoOiBzdHJpbmcsXG4gIGNvbmZpZzogQVRBQ29uZmlnXG4pID0+IHtcbiAgLy8gR2V0IGFsbCB0aGUgaW1wb3J0L3JlcXVpcmVzIGZvciB0aGUgZmlsZVxuICBjb25zdCBmaWx0ZXJlZE1vZHVsZXNUb0xvb2tBdCA9IHBhcnNlRmlsZUZvck1vZHVsZVJlZmVyZW5jZXMoc291cmNlQ29kZSlcbiAgZmlsdGVyZWRNb2R1bGVzVG9Mb29rQXQuZm9yRWFjaChhc3luYyBuYW1lID0+IHtcbiAgICAvLyBTdXBwb3J0IGdyYWJiaW5nIHRoZSBoYXJkLWNvZGVkIG5vZGUgbW9kdWxlcyBpZiBuZWVkZWRcbiAgICBjb25zdCBtb2R1bGVUb0Rvd25sb2FkID0gbWFwTW9kdWxlTmFtZVRvTW9kdWxlKG5hbWUpXG5cbiAgICBpZiAoIW1vZHVsZU5hbWUgJiYgbW9kdWxlVG9Eb3dubG9hZC5zdGFydHNXaXRoKCcuJykpIHtcbiAgICAgIHJldHVybiBjb25maWcubG9nZ2VyLmxvZyhcIltBVEFdIENhbid0IHJlc29sdmUgcmVsYXRpdmUgZGVwZW5kZW5jaWVzIGZyb20gdGhlIHBsYXlncm91bmQgcm9vdFwiKVxuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZUlEID0gY29udmVydFRvTW9kdWxlUmVmZXJlbmNlSUQobW9kdWxlTmFtZSEsIG1vZHVsZVRvRG93bmxvYWQsIG1vZHVsZU5hbWUhKVxuICAgIGlmIChhY3F1aXJlZFR5cGVEZWZzW21vZHVsZUlEXSB8fCBhY3F1aXJlZFR5cGVEZWZzW21vZHVsZUlEXSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uZmlnLmxvZ2dlci5sb2coYFtBVEFdIExvb2tpbmcgYXQgJHttb2R1bGVUb0Rvd25sb2FkfWApXG5cbiAgICBjb25zdCBtb2RJc1Njb3BlZFBhY2thZ2VPbmx5ID0gbW9kdWxlVG9Eb3dubG9hZC5pbmRleE9mKCdAJykgPT09IDAgJiYgbW9kdWxlVG9Eb3dubG9hZC5zcGxpdCgnLycpLmxlbmd0aCA9PT0gMlxuICAgIGNvbnN0IG1vZElzUGFja2FnZU9ubHkgPSBtb2R1bGVUb0Rvd25sb2FkLmluZGV4T2YoJ0AnKSA9PT0gLTEgJiYgbW9kdWxlVG9Eb3dubG9hZC5zcGxpdCgnLycpLmxlbmd0aCA9PT0gMVxuICAgIGNvbnN0IGlzUGFja2FnZVJvb3RJbXBvcnQgPSBtb2RJc1BhY2thZ2VPbmx5IHx8IG1vZElzU2NvcGVkUGFja2FnZU9ubHlcbiAgICBjb25zdCBpc0Rlbm9Nb2R1bGUgPSBtb2R1bGVUb0Rvd25sb2FkLmluZGV4T2YoJ2h0dHBzOi8vJykgPT09IDBcblxuICAgIGlmIChpc1BhY2thZ2VSb290SW1wb3J0KSB7XG4gICAgICAvLyBTbyBpdCBkb2Vzbid0IHJ1biB0d2ljZSBmb3IgYSBwYWNrYWdlXG4gICAgICBhY3F1aXJlZFR5cGVEZWZzW21vZHVsZUlEXSA9IG51bGxcblxuICAgICAgLy8gRS5nLiBpbXBvcnQgZGFuZ2VyIGZyb20gXCJkYW5nZXJcIlxuICAgICAgY29uc3QgcGFja2FnZURlZiA9IGF3YWl0IGdldE1vZHVsZUFuZFJvb3REZWZUeXBlUGF0aChtb2R1bGVUb0Rvd25sb2FkLCBjb25maWcpXG5cbiAgICAgIGlmIChwYWNrYWdlRGVmKSB7XG4gICAgICAgIGFjcXVpcmVkVHlwZURlZnNbbW9kdWxlSURdID0gcGFja2FnZURlZi5wYWNrYWdlSlNPTlxuICAgICAgICBhd2FpdCBhZGRNb2R1bGVUb1J1bnRpbWUocGFja2FnZURlZi5tb2QsIHBhY2thZ2VEZWYucGF0aCwgY29uZmlnKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNEZW5vTW9kdWxlKSB7XG4gICAgICAvLyBFLmcuIGltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEB2MC4xMi9odHRwL3NlcnZlci50c1wiO1xuICAgICAgYXdhaXQgYWRkTW9kdWxlVG9SdW50aW1lKG1vZHVsZVRvRG93bmxvYWQsIG1vZHVsZVRvRG93bmxvYWQsIGNvbmZpZylcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRS5nLiBpbXBvcnQge0NvbXBvbmVudH0gZnJvbSBcIi4vTXlUaGluZ1wiXG4gICAgICBpZiAoIW1vZHVsZVRvRG93bmxvYWQgfHwgIXBhdGgpIHRocm93IGBObyBvdXRlciBtb2R1bGUgb3IgcGF0aCBmb3IgYSByZWxhdGl2ZSBpbXBvcnQ6ICR7bW9kdWxlVG9Eb3dubG9hZH1gXG5cbiAgICAgIGNvbnN0IGFic29sdXRlUGF0aEZvck1vZHVsZSA9IG1hcFJlbGF0aXZlUGF0aChtb2R1bGVUb0Rvd25sb2FkLCBwYXRoKVxuXG4gICAgICAvLyBTbyBpdCBkb2Vzbid0IHJ1biB0d2ljZSBmb3IgYSBwYWNrYWdlXG4gICAgICBhY3F1aXJlZFR5cGVEZWZzW21vZHVsZUlEXSA9IG51bGxcblxuICAgICAgY29uc3QgcmVzb2x2ZWRGaWxlcGF0aCA9IGFic29sdXRlUGF0aEZvck1vZHVsZS5lbmRzV2l0aCgnLnRzJylcbiAgICAgICAgPyBhYnNvbHV0ZVBhdGhGb3JNb2R1bGVcbiAgICAgICAgOiBhYnNvbHV0ZVBhdGhGb3JNb2R1bGUgKyAnLmQudHMnXG5cbiAgICAgIGF3YWl0IGFkZE1vZHVsZVRvUnVudGltZShtb2R1bGVOYW1lISwgcmVzb2x2ZWRGaWxlcGF0aCwgY29uZmlnKVxuICAgIH1cbiAgfSlcblxuICAvLyBBbHNvIHN1cHBvcnQgdGhlXG4gIGdldFJlZmVyZW5jZURlcGVuZGVuY2llcyhzb3VyY2VDb2RlLCBtb2R1bGVOYW1lISwgcGF0aCEsIGNvbmZpZylcbn1cbiJdfQ==
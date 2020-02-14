define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * These are the defaults, but they also act as the list of all compiler options
     * which are parsed in the query params.
     */
    function getDefaultSandboxCompilerOptions(config, monaco) {
        const settings = {
            noImplicitAny: true,
            strictNullChecks: !config.useJavaScript,
            strictFunctionTypes: true,
            strictPropertyInitialization: true,
            strictBindCallApply: true,
            noImplicitThis: true,
            noImplicitReturns: true,
            // 3.7 off, 3.8 on I think
            useDefineForClassFields: false,
            alwaysStrict: true,
            allowUnreachableCode: false,
            allowUnusedLabels: false,
            downlevelIteration: false,
            noEmitHelpers: false,
            noLib: false,
            noStrictGenericChecks: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            esModuleInterop: true,
            preserveConstEnums: false,
            removeComments: false,
            skipLibCheck: false,
            checkJs: config.useJavaScript,
            allowJs: config.useJavaScript,
            declaration: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            target: monaco.languages.typescript.ScriptTarget.ES2017,
            jsx: monaco.languages.typescript.JsxEmit.React,
            module: monaco.languages.typescript.ModuleKind.ESNext,
        };
        return settings;
    }
    exports.getDefaultSandboxCompilerOptions = getDefaultSandboxCompilerOptions;
    /**
     * Loop through all of the entries in the existing compiler options then compare them with the
     * query params and return an object which is the changed settings via the query params
     */
    exports.getCompilerOptionsFromParams = (options, params) => {
        const urlDefaults = Object.entries(options).reduce((acc, [key, value]) => {
            if (params.has(key)) {
                const urlValue = params.get(key);
                if (urlValue === 'true') {
                    acc[key] = true;
                }
                else if (urlValue === 'false') {
                    acc[key] = false;
                }
                else if (!isNaN(parseInt(urlValue, 10))) {
                    acc[key] = parseInt(urlValue, 10);
                }
            }
            return acc;
        }, {});
        return urlDefaults;
    };
    // Can't set sandbox to be the right type because the param would contain this function
    /** Gets a query string representation (hash + queries) */
    exports.getURLQueryWithCompilerOptions = (sandbox, paramOverrides) => {
        const compilerOptions = sandbox.getCompilerOptions();
        const compilerDefaults = sandbox.compilerDefaults;
        const diff = Object.entries(compilerOptions).reduce((acc, [key, value]) => {
            if (value !== compilerDefaults[key]) {
                // @ts-ignore
                acc[key] = compilerOptions[key];
            }
            return acc;
        }, {});
        // The text of the TS/JS as the hash
        const hash = `code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`;
        let urlParams = Object.assign({}, diff);
        for (const param of ['lib', 'ts']) {
            const params = new URLSearchParams(location.search);
            if (params.has(param)) {
                // Special case the nightly where it uses the TS version to hardcode
                // the nightly build
                if (param === 'ts' && params.get(param) === 'Nightly') {
                    urlParams['ts'] = sandbox.ts.version;
                }
                else {
                    urlParams['ts'] = params.get(param);
                }
            }
        }
        // Support sending the selection
        const s = sandbox.editor.getSelection();
        // TODO: when it's full
        if ((s && s.selectionStartLineNumber !== s.positionLineNumber) ||
            (s && s.selectionStartColumn !== s.positionColumn)) {
            urlParams['ssl'] = s.selectionStartLineNumber;
            urlParams['ssc'] = s.selectionStartColumn;
            urlParams['pln'] = s.positionLineNumber;
            urlParams['pc'] = s.positionColumn;
        }
        else {
            urlParams['ssl'] = undefined;
            urlParams['ssc'] = undefined;
            urlParams['pln'] = undefined;
            urlParams['pc'] = undefined;
        }
        if (sandbox.config.useJavaScript)
            urlParams['useJavaScript'] = true;
        if (paramOverrides) {
            urlParams = Object.assign(Object.assign({}, urlParams), paramOverrides);
        }
        if (Object.keys(urlParams).length > 0) {
            const queryString = Object.entries(urlParams)
                .filter(([_k, v]) => Boolean(v))
                .map(([key, value]) => {
                return `${key}=${encodeURIComponent(value)}`;
            })
                .join('&');
            return `?${queryString}#${hash}`;
        }
        else {
            return `#${hash}`;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJPcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2FuZGJveC9zcmMvY29tcGlsZXJPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQUtBOzs7T0FHRztJQUNILFNBQWdCLGdDQUFnQyxDQUFDLE1BQXdCLEVBQUUsTUFBYztRQUN2RixNQUFNLFFBQVEsR0FBb0I7WUFDaEMsYUFBYSxFQUFFLElBQUk7WUFDbkIsZ0JBQWdCLEVBQUUsQ0FBQyxNQUFNLENBQUMsYUFBYTtZQUN2QyxtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLDRCQUE0QixFQUFFLElBQUk7WUFDbEMsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixjQUFjLEVBQUUsSUFBSTtZQUNwQixpQkFBaUIsRUFBRSxJQUFJO1lBRXZCLDBCQUEwQjtZQUMxQix1QkFBdUIsRUFBRSxLQUFLO1lBRTlCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLG9CQUFvQixFQUFFLEtBQUs7WUFDM0IsaUJBQWlCLEVBQUUsS0FBSztZQUV4QixrQkFBa0IsRUFBRSxLQUFLO1lBQ3pCLGFBQWEsRUFBRSxLQUFLO1lBQ3BCLEtBQUssRUFBRSxLQUFLO1lBQ1oscUJBQXFCLEVBQUUsS0FBSztZQUM1QixjQUFjLEVBQUUsS0FBSztZQUNyQixrQkFBa0IsRUFBRSxLQUFLO1lBRXpCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsY0FBYyxFQUFFLEtBQUs7WUFDckIsWUFBWSxFQUFFLEtBQUs7WUFFbkIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxhQUFhO1lBQzdCLE9BQU8sRUFBRSxNQUFNLENBQUMsYUFBYTtZQUM3QixXQUFXLEVBQUUsSUFBSTtZQUVqQixzQkFBc0IsRUFBRSxJQUFJO1lBQzVCLHFCQUFxQixFQUFFLElBQUk7WUFDM0IsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsTUFBTTtZ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QUFLLGNBQWMsQ0FBRSxDQUFBO1NBQ2hEO1FBRUQsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7aUJBQzFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQy9CLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BCLE9BQU8sR0FBRyxHQUFHLElBQUksa0JBQWtCLENBQUMsS0FBZSxDQUFDLEVBQUUsQ0FBQTtZQUN4RCxDQUFDLENBQUM7aUJBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRVosT0FBTyxJQUFJLFdBQVcsSUFBSSxJQUFJLEVBQUUsQ0FBQTtTQUNqQzthQUFNO1lBQ0wsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFBO1NBQ2xCO0lBQ0gsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGxheWdyb3VuZENvbmZpZyB9IGZyb20gJy4nXG5cbnR5cGUgQ29tcGlsZXJPcHRpb25zID0gaW1wb3J0KCdtb25hY28tZWRpdG9yJykubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuQ29tcGlsZXJPcHRpb25zXG50eXBlIE1vbmFjbyA9IHR5cGVvZiBpbXBvcnQoJ21vbmFjby1lZGl0b3InKVxuXG4vKipcbiAqIFRoZXNlIGFyZSB0aGUgZGVmYXVsdHMsIGJ1dCB0aGV5IGFsc28gYWN0IGFzIHRoZSBsaXN0IG9mIGFsbCBjb21waWxlciBvcHRpb25zXG4gKiB3aGljaCBhcmUgcGFyc2VkIGluIHRoZSBxdWVyeSBwYXJhbXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0U2FuZGJveENvbXBpbGVyT3B0aW9ucyhjb25maWc6IFBsYXlncm91bmRDb25maWcsIG1vbmFjbzogTW9uYWNvKSB7XG4gIGNvbnN0IHNldHRpbmdzOiBDb21waWxlck9wdGlvbnMgPSB7XG4gICAgbm9JbXBsaWNpdEFueTogdHJ1ZSxcbiAgICBzdHJpY3ROdWxsQ2hlY2tzOiAhY29uZmlnLnVzZUphdmFTY3JpcHQsXG4gICAgc3RyaWN0RnVuY3Rpb25UeXBlczogdHJ1ZSxcbiAgICBzdHJpY3RQcm9wZXJ0eUluaXRpYWxpemF0aW9uOiB0cnVlLFxuICAgIHN0cmljdEJpbmRDYWxsQXBwbHk6IHRydWUsXG4gICAgbm9JbXBsaWNpdFRoaXM6IHRydWUsXG4gICAgbm9JbXBsaWNpdFJldHVybnM6IHRydWUsXG5cbiAgICAvLyAzLjcgb2ZmLCAzLjggb24gSSB0aGlua1xuICAgIHVzZURlZmluZUZvckNsYXNzRmllbGRzOiBmYWxzZSxcblxuICAgIGFsd2F5c1N0cmljdDogdHJ1ZSxcbiAgICBhbGxvd1VucmVhY2hhYmxlQ29kZTogZmFsc2UsXG4gICAgYWxsb3dVbnVzZWRMYWJlbHM6IGZhbHNlLFxuXG4gICAgZG93bmxldmVsSXRlcmF0aW9uOiBmYWxzZSxcbiAgICBub0VtaXRIZWxwZXJzOiBmYWxzZSxcbiAgICBub0xpYjogZmFsc2UsXG4gICAgbm9TdHJpY3RHZW5lcmljQ2hlY2tzOiBmYWxzZSxcbiAgICBub1VudXNlZExvY2FsczogZmFsc2UsXG4gICAgbm9VbnVzZWRQYXJhbWV0ZXJzOiBmYWxzZSxcblxuICAgIGVzTW9kdWxlSW50ZXJvcDogdHJ1ZSxcbiAgICBwcmVzZXJ2ZUNvbnN0RW51bXM6IGZhbHNlLFxuICAgIHJlbW92ZUNvbW1lbnRzOiBmYWxzZSxcbiAgICBza2lwTGliQ2hlY2s6IGZhbHNlLFxuXG4gICAgY2hlY2tKczogY29uZmlnLnVzZUphdmFTY3JpcHQsXG4gICAgYWxsb3dKczogY29uZmlnLnVzZUphdmFTY3JpcHQsXG4gICAgZGVjbGFyYXRpb246IHRydWUsXG5cbiAgICBleHBlcmltZW50YWxEZWNvcmF0b3JzOiB0cnVlLFxuICAgIGVtaXREZWNvcmF0b3JNZXRhZGF0YTogdHJ1ZSxcbiAgICBtb2R1bGVSZXNvbHV0aW9uOiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuTW9kdWxlUmVzb2x1dGlvbktpbmQuTm9kZUpzLFxuXG4gICAgdGFyZ2V0OiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuU2NyaXB0VGFyZ2V0LkVTMjAxNyxcbiAgICBqc3g6IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5Kc3hFbWl0LlJlYWN0LFxuICAgIG1vZHVsZTogbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0Lk1vZHVsZUtpbmQuRVNOZXh0LFxuICB9XG5cbiAgcmV0dXJuIHNldHRpbmdzXG59XG5cbi8qKlxuICogTG9vcCB0aHJvdWdoIGFsbCBvZiB0aGUgZW50cmllcyBpbiB0aGUgZXhpc3RpbmcgY29tcGlsZXIgb3B0aW9ucyB0aGVuIGNvbXBhcmUgdGhlbSB3aXRoIHRoZVxuICogcXVlcnkgcGFyYW1zIGFuZCByZXR1cm4gYW4gb2JqZWN0IHdoaWNoIGlzIHRoZSBjaGFuZ2VkIHNldHRpbmdzIHZpYSB0aGUgcXVlcnkgcGFyYW1zXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRDb21waWxlck9wdGlvbnNGcm9tUGFyYW1zID0gKG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucywgcGFyYW1zOiBVUkxTZWFyY2hQYXJhbXMpOiBDb21waWxlck9wdGlvbnMgPT4ge1xuICBjb25zdCB1cmxEZWZhdWx0cyA9IE9iamVjdC5lbnRyaWVzKG9wdGlvbnMpLnJlZHVjZSgoYWNjOiBhbnksIFtrZXksIHZhbHVlXSkgPT4ge1xuICAgIGlmIChwYXJhbXMuaGFzKGtleSkpIHtcbiAgICAgIGNvbnN0IHVybFZhbHVlID0gcGFyYW1zLmdldChrZXkpIVxuXG4gICAgICBpZiAodXJsVmFsdWUgPT09ICd0cnVlJykge1xuICAgICAgICBhY2Nba2V5XSA9IHRydWVcbiAgICAgIH0gZWxzZSBpZiAodXJsVmFsdWUgPT09ICdmYWxzZScpIHtcbiAgICAgICAgYWNjW2tleV0gPSBmYWxzZVxuICAgICAgfSBlbHNlIGlmICghaXNOYU4ocGFyc2VJbnQodXJsVmFsdWUsIDEwKSkpIHtcbiAgICAgICAgYWNjW2tleV0gPSBwYXJzZUludCh1cmxWYWx1ZSwgMTApXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY1xuICB9LCB7fSlcblxuICByZXR1cm4gdXJsRGVmYXVsdHNcbn1cblxuLy8gQ2FuJ3Qgc2V0IHNhbmRib3ggdG8gYmUgdGhlIHJpZ2h0IHR5cGUgYmVjYXVzZSB0aGUgcGFyYW0gd291bGQgY29udGFpbiB0aGlzIGZ1bmN0aW9uXG5cbi8qKiBHZXRzIGEgcXVlcnkgc3RyaW5nIHJlcHJlc2VudGF0aW9uIChoYXNoICsgcXVlcmllcykgKi9cbmV4cG9ydCBjb25zdCBnZXRVUkxRdWVyeVdpdGhDb21waWxlck9wdGlvbnMgPSAoc2FuZGJveDogYW55LCBwYXJhbU92ZXJyaWRlcz86IGFueSk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IHNhbmRib3guZ2V0Q29tcGlsZXJPcHRpb25zKClcbiAgY29uc3QgY29tcGlsZXJEZWZhdWx0cyA9IHNhbmRib3guY29tcGlsZXJEZWZhdWx0c1xuICBjb25zdCBkaWZmID0gT2JqZWN0LmVudHJpZXMoY29tcGlsZXJPcHRpb25zKS5yZWR1Y2UoKGFjYywgW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgaWYgKHZhbHVlICE9PSBjb21waWxlckRlZmF1bHRzW2tleV0pIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGFjY1trZXldID0gY29tcGlsZXJPcHRpb25zW2tleV1cbiAgICB9XG5cbiAgICByZXR1cm4gYWNjXG4gIH0sIHt9KVxuXG4gIC8vIFRoZSB0ZXh0IG9mIHRoZSBUUy9KUyBhcyB0aGUgaGFzaFxuICBjb25zdCBoYXNoID0gYGNvZGUvJHtzYW5kYm94Lmx6c3RyaW5nLmNvbXByZXNzVG9FbmNvZGVkVVJJQ29tcG9uZW50KHNhbmRib3guZ2V0VGV4dCgpKX1gXG5cbiAgbGV0IHVybFBhcmFtczogYW55ID0gT2JqZWN0LmFzc2lnbih7fSwgZGlmZilcbiAgZm9yIChjb25zdCBwYXJhbSBvZiBbJ2xpYicsICd0cyddKSB7XG4gICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpXG4gICAgaWYgKHBhcmFtcy5oYXMocGFyYW0pKSB7XG4gICAgICAvLyBTcGVjaWFsIGNhc2UgdGhlIG5pZ2h0bHkgd2hlcmUgaXQgdXNlcyB0aGUgVFMgdmVyc2lvbiB0byBoYXJkY29kZVxuICAgICAgLy8gdGhlIG5pZ2h0bHkgYnVpbGRcbiAgICAgIGlmIChwYXJhbSA9PT0gJ3RzJyAmJiBwYXJhbXMuZ2V0KHBhcmFtKSA9PT0gJ05pZ2h0bHknKSB7XG4gICAgICAgIHVybFBhcmFtc1sndHMnXSA9IHNhbmRib3gudHMudmVyc2lvblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsUGFyYW1zWyd0cyddID0gcGFyYW1zLmdldChwYXJhbSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTdXBwb3J0IHNlbmRpbmcgdGhlIHNlbGVjdGlvblxuICBjb25zdCBzID0gc2FuZGJveC5lZGl0b3IuZ2V0U2VsZWN0aW9uKClcbiAgLy8gVE9ETzogd2hlbiBpdCdzIGZ1bGxcbiAgaWYgKFxuICAgIChzICYmIHMuc2VsZWN0aW9uU3RhcnRMaW5lTnVtYmVyICE9PSBzLnBvc2l0aW9uTGluZU51bWJlcikgfHxcbiAgICAocyAmJiBzLnNlbGVjdGlvblN0YXJ0Q29sdW1uICE9PSBzLnBvc2l0aW9uQ29sdW1uKVxuICApIHtcbiAgICB1cmxQYXJhbXNbJ3NzbCddID0gcy5zZWxlY3Rpb25TdGFydExpbmVOdW1iZXJcbiAgICB1cmxQYXJhbXNbJ3NzYyddID0gcy5zZWxlY3Rpb25TdGFydENvbHVtblxuICAgIHVybFBhcmFtc1sncGxuJ10gPSBzLnBvc2l0aW9uTGluZU51bWJlclxuICAgIHVybFBhcmFtc1sncGMnXSA9IHMucG9zaXRpb25Db2x1bW5cbiAgfSBlbHNlIHtcbiAgICB1cmxQYXJhbXNbJ3NzbCddID0gdW5kZWZpbmVkXG4gICAgdXJsUGFyYW1zWydzc2MnXSA9IHVuZGVmaW5lZFxuICAgIHVybFBhcmFtc1sncGxuJ10gPSB1bmRlZmluZWRcbiAgICB1cmxQYXJhbXNbJ3BjJ10gPSB1bmRlZmluZWRcbiAgfVxuXG4gIGlmIChzYW5kYm94LmNvbmZpZy51c2VKYXZhU2NyaXB0KSB1cmxQYXJhbXNbJ3VzZUphdmFTY3JpcHQnXSA9IHRydWVcblxuICBpZiAocGFyYW1PdmVycmlkZXMpIHtcbiAgICB1cmxQYXJhbXMgPSB7IC4uLnVybFBhcmFtcywgLi4ucGFyYW1PdmVycmlkZXMgfVxuICB9XG5cbiAgaWYgKE9iamVjdC5rZXlzKHVybFBhcmFtcykubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHF1ZXJ5U3RyaW5nID0gT2JqZWN0LmVudHJpZXModXJsUGFyYW1zKVxuICAgICAgLmZpbHRlcigoW19rLCB2XSkgPT4gQm9vbGVhbih2KSlcbiAgICAgIC5tYXAoKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7a2V5fT0ke2VuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSBhcyBzdHJpbmcpfWBcbiAgICAgIH0pXG4gICAgICAuam9pbignJicpXG5cbiAgICByZXR1cm4gYD8ke3F1ZXJ5U3RyaW5nfSMke2hhc2h9YFxuICB9IGVsc2Uge1xuICAgIHJldHVybiBgIyR7aGFzaH1gXG4gIH1cbn1cbiJdfQ==
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createExporter = (sandbox, monaco, ui) => {
        function getScriptTargetText(option) {
            return monaco.languages.typescript.ScriptTarget[option];
        }
        function getJsxEmitText(option) {
            if (option === monaco.languages.typescript.JsxEmit.None) {
                return undefined;
            }
            return monaco.languages.typescript.JsxEmit[option];
        }
        function getModuleKindText(option) {
            if (option === monaco.languages.typescript.ModuleKind.None) {
                return undefined;
            }
            return monaco.languages.typescript.ModuleKind[option];
        }
        // These are the compiler's defaults, and we want a diff from
        // these before putting it in the issue
        const defaultCompilerOptionsForTSC = {
            esModuleInterop: false,
            strictNullChecks: false,
            strict: false,
            strictFunctionTypes: false,
            strictPropertyInitialization: false,
            strictBindCallApply: false,
            noImplicitAny: false,
            noImplicitThis: false,
            noImplicitReturns: false,
            checkJs: false,
            allowJs: false,
            experimentalDecorators: false,
            emitDecoratorMetadata: false,
        };
        function getValidCompilerOptions(options) {
            const { target: targetOption, jsx: jsxOption, module: moduleOption } = options, restOptions = __rest(options, ["target", "jsx", "module"]);
            const targetText = getScriptTargetText(targetOption);
            const jsxText = getJsxEmitText(jsxOption);
            const moduleText = getModuleKindText(moduleOption);
            const opts = Object.assign(Object.assign(Object.assign(Object.assign({}, restOptions), (targetText && { target: targetText })), (jsxText && { jsx: jsxText })), (moduleText && { module: moduleText }));
            const diffFromTSCDefaults = Object.entries(opts).reduce((acc, [key, value]) => {
                if (opts[key] && value != defaultCompilerOptionsForTSC[key]) {
                    // @ts-ignore
                    acc[key] = opts[key];
                }
                return acc;
            }, {});
            return diffFromTSCDefaults;
        }
        // Based on https://github.com/stackblitz/core/blob/master/sdk/src/generate.ts
        function createHiddenInput(name, value) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            return input;
        }
        function createProjectForm(project) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.setAttribute('style', 'display:none;');
            form.appendChild(createHiddenInput('project[title]', project.title));
            form.appendChild(createHiddenInput('project[description]', project.description));
            form.appendChild(createHiddenInput('project[template]', project.template));
            if (project.tags) {
                project.tags.forEach((tag) => {
                    form.appendChild(createHiddenInput('project[tags][]', tag));
                });
            }
            if (project.dependencies) {
                form.appendChild(createHiddenInput('project[dependencies]', JSON.stringify(project.dependencies)));
            }
            if (project.settings) {
                form.appendChild(createHiddenInput('project[settings]', JSON.stringify(project.settings)));
            }
            Object.keys(project.files).forEach(path => {
                form.appendChild(createHiddenInput(`project[files][${path}]`, project.files[path]));
            });
            return form;
        }
        const typescriptVersion = sandbox.ts.version;
        // prettier-ignore
        const stringifiedCompilerOptions = JSON.stringify({ compilerOptions: getValidCompilerOptions(sandbox.getCompilerOptions()) }, null, '  ');
        // TODO: pull deps
        function openProjectInStackBlitz() {
            const project = {
                title: 'Playground Export - ',
                description: '123',
                template: 'typescript',
                files: {
                    'index.ts': sandbox.getText(),
                    'tsconfig.json': stringifiedCompilerOptions,
                },
                dependencies: {
                    typescript: typescriptVersion,
                },
            };
            const form = createProjectForm(project);
            form.action = 'https://stackblitz.com/run?view=editor';
            // https://github.com/stackblitz/core/blob/master/sdk/src/helpers.ts#L9
            // + buildProjectQuery(options);
            form.target = '_blank';
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        }
        function openInTSAST() {
            const hash = `#code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`;
            document.location.assign(`https://ts-ast-viewer.com/${hash}`);
        }
        function openProjectInCodeSandbox() {
            const files = {
                'package.json': {
                    content: {
                        name: 'TypeScript Playground Export',
                        version: '0.0.0',
                        description: 'TypeScript playground exported Sandbox',
                        dependencies: {
                            typescript: typescriptVersion,
                        },
                    },
                },
                'index.ts': {
                    content: sandbox.getText(),
                },
                'tsconfig.json': {
                    content: stringifiedCompilerOptions,
                },
            };
            // Using the v1 get API
            const parameters = sandbox.lzstring
                .compressToBase64(JSON.stringify({ files }))
                .replace(/\+/g, '-') // Convert '+' to '-'
                .replace(/\//g, '_') // Convert '/' to '_'
                .replace(/=+$/, ''); // Remove ending '='
            const url = `https://codesandbox.io/api/v1/sandboxes/define?view=editor&parameters=${parameters}`;
            document.location.assign(url);
            // Alternative using the http URL API, which uses POST. This has the trade-off where
            // the async nature of the call means that the redirect at the end triggers
            // popup security mechanisms in browsers because the function isn't blessed as
            // being a direct result of a user action.
            // fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
            //   method: "POST",
            //   body: JSON.stringify({ files }),
            //   headers: {
            //     Accept: "application/json",
            //     "Content-Type": "application/json"
            //   }
            // })
            // .then(x => x.json())
            // .then(data => {
            //   window.open('https://codesandbox.io/s/' + data.sandbox_id, '_blank');
            // });
        }
        function codify(code, ext) {
            return '```' + ext + '\n' + code + '\n```\n';
        }
        function makeMarkdown() {
            return __awaiter(this, void 0, void 0, function* () {
                const query = sandbox.getURLQueryWithCompilerOptions(sandbox);
                const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
                const jsSection = sandbox.config.useJavaScript
                    ? ''
                    : `
<details><summary><b>Output</b></summary>

${codify(yield sandbox.getRunnableJS(), 'ts')}

</details>
`;
                return `
<!-- 🚨 STOP 🚨 𝗦𝗧𝗢𝗣 🚨 𝑺𝑻𝑶𝑷 🚨

Half of all issues filed here are duplicates, answered in the FAQ, or not appropriate for the bug tracker. Even if you think you've found a *bug*, please read the FAQ first, especially the Common "Bugs" That Aren't Bugs section!

Please help us by doing the following steps before logging an issue:
  * Search: https://github.com/Microsoft/TypeScript/search?type=Issues
  * Read the FAQ: https://github.com/Microsoft/TypeScript/wiki/FAQ

Please fill in the *entire* template below.
-->

**TypeScript Version:**  ${typescriptVersion}

<!-- Search terms you tried before logging this (so others can find this issue more easily) -->
**Search Terms:**

**Expected behavior:**

**Actual behavior:**

<!-- Did you find other bugs that looked similar? -->
**Related Issues:**

**Code**
${codify(sandbox.getText(), 'ts')}

${jsSection}

<details><summary><b>Compiler Options</b></summary>

${codify(stringifiedCompilerOptions, 'json')}

</details>

**Playground Link:** [Provided](${fullURL})
      `;
            });
        }
        function reportIssue() {
            return __awaiter(this, void 0, void 0, function* () {
                const body = yield makeMarkdown();
                if (body.length < 4000) {
                    window.open('https://github.com/Microsoft/TypeScript/issues/new?body=' + encodeURIComponent(body));
                }
                else {
                    ui.showModal(body, "Issue too long to post automatically. Copy this text, then click 'Create New Issue' to begin.", {
                        'Create New Issue': 'https://github.com/Microsoft/TypeScript/issues/new',
                    });
                }
            });
        }
        function copyAsMarkdownIssue() {
            return __awaiter(this, void 0, void 0, function* () {
                const markdown = yield makeMarkdown();
                ui.showModal(markdown, 'Markdown code');
            });
        }
        function copyForChat() {
            const query = sandbox.getURLQueryWithCompilerOptions(sandbox);
            const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
            const chat = `[Playground Link](${fullURL})`;
            ui.showModal(chat, 'Markdown for chat');
        }
        function copyForChatWithPreview() {
            const query = sandbox.getURLQueryWithCompilerOptions(sandbox);
            const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
            const ts = sandbox.getText();
            const preview = ts.length > 200 ? ts.substring(0, 200) + '...' : ts.substring(0, 200);
            const code = '```\n' + preview + '\n```\n';
            const chat = `${code}\n[Playground Link](${fullURL})`;
            ui.showModal(chat, 'Markdown code');
        }
        return {
            openProjectInStackBlitz,
            openProjectInCodeSandbox,
            reportIssue,
            copyAsMarkdownIssue,
            copyForChat,
            copyForChatWithPreview,
            openInTSAST,
        };
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9leHBvcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUthLFFBQUEsY0FBYyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxNQUFzQyxFQUFFLEVBQU0sRUFBRSxFQUFFO1FBQ2pHLFNBQVMsbUJBQW1CLENBQUMsTUFBVztZQUN0QyxPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN6RCxDQUFDO1FBRUQsU0FBUyxjQUFjLENBQUMsTUFBVztZQUNqQyxJQUFJLE1BQU0sS0FBSyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFO2dCQUN2RCxPQUFPLFNBQVMsQ0FBQTthQUNqQjtZQUNELE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3BELENBQUM7UUFFRCxTQUFTLGlCQUFpQixDQUFDLE1BQVc7WUFDcEMsSUFBSSxNQUFNLEtBQUssTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRTtnQkFDMUQsT0FBTyxTQUFTLENBQUE7YUFDakI7WUFDRCxPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RCxDQUFDO1FBRUQsNkRBQTZEO1FBQzdELHVDQUF1QztRQUN2QyxNQUFNLDRCQUE0QixHQUFvQjtZQUNwRCxlQUFlLEVBQUUsS0FBSztZQUN0QixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLE1BQU0sRUFBRSxLQUFLO1lBQ2IsbUJBQW1CLEVBQUUsS0FBSztZQUMxQiw0QkFBNEIsRUFBRSxLQUFLO1lBQ25DLG1CQUFtQixFQUFFLEtBQUs7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Ym94ID0gUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCd0eXBlc2NyaXB0LXNhbmRib3gnKS5jcmVhdGVUeXBlU2NyaXB0U2FuZGJveD5cbnR5cGUgQ29tcGlsZXJPcHRpb25zID0gaW1wb3J0KCdtb25hY28tZWRpdG9yJykubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuQ29tcGlsZXJPcHRpb25zXG5cbmV4cG9ydCBjb25zdCBjcmVhdGVFeHBvcnRlciA9IChzYW5kYm94OiBTYW5kYm94LCBtb25hY286IHR5cGVvZiBpbXBvcnQoJ21vbmFjby1lZGl0b3InKSwgdWk6IFVJKSA9PiB7XG4gIGZ1bmN0aW9uIGdldFNjcmlwdFRhcmdldFRleHQob3B0aW9uOiBhbnkpIHtcbiAgICByZXR1cm4gbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0LlNjcmlwdFRhcmdldFtvcHRpb25dXG4gIH1cblxuICBmdW5jdGlvbiBnZXRKc3hFbWl0VGV4dChvcHRpb246IGFueSkge1xuICAgIGlmIChvcHRpb24gPT09IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5Kc3hFbWl0Lk5vbmUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgcmV0dXJuIG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5Kc3hFbWl0W29wdGlvbl1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE1vZHVsZUtpbmRUZXh0KG9wdGlvbjogYW55KSB7XG4gICAgaWYgKG9wdGlvbiA9PT0gbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0Lk1vZHVsZUtpbmQuTm9uZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICByZXR1cm4gbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0Lk1vZHVsZUtpbmRbb3B0aW9uXVxuICB9XG5cbiAgLy8gVGhlc2UgYXJlIHRoZSBjb21waWxlcidzIGRlZmF1bHRzLCBhbmQgd2Ugd2FudCBhIGRpZmYgZnJvbVxuICAvLyB0aGVzZSBiZWZvcmUgcHV0dGluZyBpdCBpbiB0aGUgaXNzdWVcbiAgY29uc3QgZGVmYXVsdENvbXBpbGVyT3B0aW9uc0ZvclRTQzogQ29tcGlsZXJPcHRpb25zID0ge1xuICAgIGVzTW9kdWxlSW50ZXJvcDogZmFsc2UsXG4gICAgc3RyaWN0TnVsbENoZWNrczogZmFsc2UsXG4gICAgc3RyaWN0OiBmYWxzZSxcbiAgICBzdHJpY3RGdW5jdGlvblR5cGVzOiBmYWxzZSxcbiAgICBzdHJpY3RQcm9wZXJ0eUluaXRpYWxpemF0aW9uOiBmYWxzZSxcbiAgICBzdHJpY3RCaW5kQ2FsbEFwcGx5OiBmYWxzZSxcbiAgICBub0ltcGxpY2l0QW55OiBmYWxzZSxcbiAgICBub0ltcGxpY2l0VGhpczogZmFsc2UsXG4gICAgbm9JbXBsaWNpdFJldHVybnM6IGZhbHNlLFxuICAgIGNoZWNrSnM6IGZhbHNlLFxuICAgIGFsbG93SnM6IGZhbHNlLFxuICAgIGV4cGVyaW1lbnRhbERlY29yYXRvcnM6IGZhbHNlLFxuICAgIGVtaXREZWNvcmF0b3JNZXRhZGF0YTogZmFsc2UsXG4gIH1cblxuICBmdW5jdGlvbiBnZXRWYWxpZENvbXBpbGVyT3B0aW9ucyhvcHRpb25zOiBDb21waWxlck9wdGlvbnMpIHtcbiAgICBjb25zdCB7IHRhcmdldDogdGFyZ2V0T3B0aW9uLCBqc3g6IGpzeE9wdGlvbiwgbW9kdWxlOiBtb2R1bGVPcHRpb24sIC4uLnJlc3RPcHRpb25zIH0gPSBvcHRpb25zXG5cbiAgICBjb25zdCB0YXJnZXRUZXh0ID0gZ2V0U2NyaXB0VGFyZ2V0VGV4dCh0YXJnZXRPcHRpb24pXG4gICAgY29uc3QganN4VGV4dCA9IGdldEpzeEVtaXRUZXh0KGpzeE9wdGlvbilcbiAgICBjb25zdCBtb2R1bGVUZXh0ID0gZ2V0TW9kdWxlS2luZFRleHQobW9kdWxlT3B0aW9uKVxuXG4gICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgIC4uLnJlc3RPcHRpb25zLFxuICAgICAgLi4uKHRhcmdldFRleHQgJiYgeyB0YXJnZXQ6IHRhcmdldFRleHQgfSksXG4gICAgICAuLi4oanN4VGV4dCAmJiB7IGpzeDoganN4VGV4dCB9KSxcbiAgICAgIC4uLihtb2R1bGVUZXh0ICYmIHsgbW9kdWxlOiBtb2R1bGVUZXh0IH0pLFxuICAgIH1cblxuICAgIGNvbnN0IGRpZmZGcm9tVFNDRGVmYXVsdHMgPSBPYmplY3QuZW50cmllcyhvcHRzKS5yZWR1Y2UoKGFjYywgW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBpZiAoKG9wdHMgYXMgYW55KVtrZXldICYmIHZhbHVlICE9IGRlZmF1bHRDb21waWxlck9wdGlvbnNGb3JUU0Nba2V5XSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGFjY1trZXldID0gb3B0c1trZXldXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2NcbiAgICB9LCB7fSlcblxuICAgIHJldHVybiBkaWZmRnJvbVRTQ0RlZmF1bHRzXG4gIH1cblxuICAvLyBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vc3RhY2tibGl0ei9jb3JlL2Jsb2IvbWFzdGVyL3Nkay9zcmMvZ2VuZXJhdGUudHNcbiAgZnVuY3Rpb24gY3JlYXRlSGlkZGVuSW5wdXQobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpXG4gICAgaW5wdXQudHlwZSA9ICdoaWRkZW4nXG4gICAgaW5wdXQubmFtZSA9IG5hbWVcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlXG4gICAgcmV0dXJuIGlucHV0XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVQcm9qZWN0Rm9ybShwcm9qZWN0OiBhbnkpIHtcbiAgICBjb25zdCBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpXG5cbiAgICBmb3JtLm1ldGhvZCA9ICdQT1NUJ1xuICAgIGZvcm0uc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5Om5vbmU7JylcblxuICAgIGZvcm0uYXBwZW5kQ2hpbGQoY3JlYXRlSGlkZGVuSW5wdXQoJ3Byb2plY3RbdGl0bGVdJywgcHJvamVjdC50aXRsZSkpXG4gICAgZm9ybS5hcHBlbmRDaGlsZChjcmVhdGVIaWRkZW5JbnB1dCgncHJvamVjdFtkZXNjcmlwdGlvbl0nLCBwcm9qZWN0LmRlc2NyaXB0aW9uKSlcbiAgICBmb3JtLmFwcGVuZENoaWxkKGNyZWF0ZUhpZGRlbklucHV0KCdwcm9qZWN0W3RlbXBsYXRlXScsIHByb2plY3QudGVtcGxhdGUpKVxuXG4gICAgaWYgKHByb2plY3QudGFncykge1xuICAgICAgcHJvamVjdC50YWdzLmZvckVhY2goKHRhZzogc3RyaW5nKSA9PiB7XG4gICAgICAgIGZvcm0uYXBwZW5kQ2hpbGQoY3JlYXRlSGlkZGVuSW5wdXQoJ3Byb2plY3RbdGFnc11bXScsIHRhZykpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChwcm9qZWN0LmRlcGVuZGVuY2llcykge1xuICAgICAgZm9ybS5hcHBlbmRDaGlsZChjcmVhdGVIaWRkZW5JbnB1dCgncHJvamVjdFtkZXBlbmRlbmNpZXNdJywgSlNPTi5zdHJpbmdpZnkocHJvamVjdC5kZXBlbmRlbmNpZXMpKSlcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5zZXR0aW5ncykge1xuICAgICAgZm9ybS5hcHBlbmRDaGlsZChjcmVhdGVIaWRkZW5JbnB1dCgncHJvamVjdFtzZXR0aW5nc10nLCBKU09OLnN0cmluZ2lmeShwcm9qZWN0LnNldHRpbmdzKSkpXG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMocHJvamVjdC5maWxlcykuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIGZvcm0uYXBwZW5kQ2hpbGQoY3JlYXRlSGlkZGVuSW5wdXQoYHByb2plY3RbZmlsZXNdWyR7cGF0aH1dYCwgcHJvamVjdC5maWxlc1twYXRoXSkpXG4gICAgfSlcblxuICAgIHJldHVybiBmb3JtXG4gIH1cblxuICBjb25zdCB0eXBlc2NyaXB0VmVyc2lvbiA9IHNhbmRib3gudHMudmVyc2lvblxuICAvLyBwcmV0dGllci1pZ25vcmVcbiAgY29uc3Qgc3RyaW5naWZpZWRDb21waWxlck9wdGlvbnMgPSBKU09OLnN0cmluZ2lmeSh7IGNvbXBpbGVyT3B0aW9uczogZ2V0VmFsaWRDb21waWxlck9wdGlvbnMoc2FuZGJveC5nZXRDb21waWxlck9wdGlvbnMoKSkgfSwgbnVsbCwgJyAgJylcblxuICAvLyBUT0RPOiBwdWxsIGRlcHNcbiAgZnVuY3Rpb24gb3BlblByb2plY3RJblN0YWNrQmxpdHooKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IHtcbiAgICAgIHRpdGxlOiAnUGxheWdyb3VuZCBFeHBvcnQgLSAnLFxuICAgICAgZGVzY3JpcHRpb246ICcxMjMnLFxuICAgICAgdGVtcGxhdGU6ICd0eXBlc2NyaXB0JyxcbiAgICAgIGZpbGVzOiB7XG4gICAgICAgICdpbmRleC50cyc6IHNhbmRib3guZ2V0VGV4dCgpLFxuICAgICAgICAndHNjb25maWcuanNvbic6IHN0cmluZ2lmaWVkQ29tcGlsZXJPcHRpb25zLFxuICAgICAgfSxcbiAgICAgIGRlcGVuZGVuY2llczoge1xuICAgICAgICB0eXBlc2NyaXB0OiB0eXBlc2NyaXB0VmVyc2lvbixcbiAgICAgIH0sXG4gICAgfVxuICAgIGNvbnN0IGZvcm0gPSBjcmVhdGVQcm9qZWN0Rm9ybShwcm9qZWN0KVxuICAgIGZvcm0uYWN0aW9uID0gJ2h0dHBzOi8vc3RhY2tibGl0ei5jb20vcnVuP3ZpZXc9ZWRpdG9yJ1xuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zdGFja2JsaXR6L2NvcmUvYmxvYi9tYXN0ZXIvc2RrL3NyYy9oZWxwZXJzLnRzI0w5XG4gICAgLy8gKyBidWlsZFByb2plY3RRdWVyeShvcHRpb25zKTtcbiAgICBmb3JtLnRhcmdldCA9ICdfYmxhbmsnXG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZvcm0pXG4gICAgZm9ybS5zdWJtaXQoKVxuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZm9ybSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5JblRTQVNUKCkge1xuICAgIGNvbnN0IGhhc2ggPSBgI2NvZGUvJHtzYW5kYm94Lmx6c3RyaW5nLmNvbXByZXNzVG9FbmNvZGVkVVJJQ29tcG9uZW50KHNhbmRib3guZ2V0VGV4dCgpKX1gXG4gICAgZG9jdW1lbnQubG9jYXRpb24uYXNzaWduKGBodHRwczovL3RzLWFzdC12aWV3ZXIuY29tLyR7aGFzaH1gKVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlblByb2plY3RJbkNvZGVTYW5kYm94KCkge1xuICAgIGNvbnN0IGZpbGVzID0ge1xuICAgICAgJ3BhY2thZ2UuanNvbic6IHtcbiAgICAgICAgY29udGVudDoge1xuICAgICAgICAgIG5hbWU6ICdUeXBlU2NyaXB0IFBsYXlncm91bmQgRXhwb3J0JyxcbiAgICAgICAgICB2ZXJzaW9uOiAnMC4wLjAnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVHlwZVNjcmlwdCBwbGF5Z3JvdW5kIGV4cG9ydGVkIFNhbmRib3gnLFxuICAgICAgICAgIGRlcGVuZGVuY2llczoge1xuICAgICAgICAgICAgdHlwZXNjcmlwdDogdHlwZXNjcmlwdFZlcnNpb24sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAnaW5kZXgudHMnOiB7XG4gICAgICAgIGNvbnRlbnQ6IHNhbmRib3guZ2V0VGV4dCgpLFxuICAgICAgfSxcbiAgICAgICd0c2NvbmZpZy5qc29uJzoge1xuICAgICAgICBjb250ZW50OiBzdHJpbmdpZmllZENvbXBpbGVyT3B0aW9ucyxcbiAgICAgIH0sXG4gICAgfVxuXG4gICAgLy8gVXNpbmcgdGhlIHYxIGdldCBBUElcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0gc2FuZGJveC5senN0cmluZ1xuICAgICAgLmNvbXByZXNzVG9CYXNlNjQoSlNPTi5zdHJpbmdpZnkoeyBmaWxlcyB9KSlcbiAgICAgIC5yZXBsYWNlKC9cXCsvZywgJy0nKSAvLyBDb252ZXJ0ICcrJyB0byAnLSdcbiAgICAgIC5yZXBsYWNlKC9cXC8vZywgJ18nKSAvLyBDb252ZXJ0ICcvJyB0byAnXydcbiAgICAgIC5yZXBsYWNlKC89KyQvLCAnJykgLy8gUmVtb3ZlIGVuZGluZyAnPSdcblxuICAgIGNvbnN0IHVybCA9IGBodHRwczovL2NvZGVzYW5kYm94LmlvL2FwaS92MS9zYW5kYm94ZXMvZGVmaW5lP3ZpZXc9ZWRpdG9yJnBhcmFtZXRlcnM9JHtwYXJhbWV0ZXJzfWBcbiAgICBkb2N1bWVudC5sb2NhdGlvbi5hc3NpZ24odXJsKVxuXG4gICAgLy8gQWx0ZXJuYXRpdmUgdXNpbmcgdGhlIGh0dHAgVVJMIEFQSSwgd2hpY2ggdXNlcyBQT1NULiBUaGlzIGhhcyB0aGUgdHJhZGUtb2ZmIHdoZXJlXG4gICAgLy8gdGhlIGFzeW5jIG5hdHVyZSBvZiB0aGUgY2FsbCBtZWFucyB0aGF0IHRoZSByZWRpcmVjdCBhdCB0aGUgZW5kIHRyaWdnZXJzXG4gICAgLy8gcG9wdXAgc2VjdXJpdHkgbWVjaGFuaXNtcyBpbiBicm93c2VycyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpc24ndCBibGVzc2VkIGFzXG4gICAgLy8gYmVpbmcgYSBkaXJlY3QgcmVzdWx0IG9mIGEgdXNlciBhY3Rpb24uXG5cbiAgICAvLyBmZXRjaChcImh0dHBzOi8vY29kZXNhbmRib3guaW8vYXBpL3YxL3NhbmRib3hlcy9kZWZpbmU/anNvbj0xXCIsIHtcbiAgICAvLyAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgLy8gICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGZpbGVzIH0pLFxuICAgIC8vICAgaGVhZGVyczoge1xuICAgIC8vICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIC8vICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgIC8vICAgfVxuICAgIC8vIH0pXG4gICAgLy8gLnRoZW4oeCA9PiB4Lmpzb24oKSlcbiAgICAvLyAudGhlbihkYXRhID0+IHtcbiAgICAvLyAgIHdpbmRvdy5vcGVuKCdodHRwczovL2NvZGVzYW5kYm94LmlvL3MvJyArIGRhdGEuc2FuZGJveF9pZCwgJ19ibGFuaycpO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY29kaWZ5KGNvZGU6IHN0cmluZywgZXh0OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gJ2BgYCcgKyBleHQgKyAnXFxuJyArIGNvZGUgKyAnXFxuYGBgXFxuJ1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gbWFrZU1hcmtkb3duKCkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gc2FuZGJveC5nZXRVUkxRdWVyeVdpdGhDb21waWxlck9wdGlvbnMoc2FuZGJveClcbiAgICBjb25zdCBmdWxsVVJMID0gYCR7ZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2x9Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9JHtkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZX0ke3F1ZXJ5fWBcbiAgICBjb25zdCBqc1NlY3Rpb24gPSBzYW5kYm94LmNvbmZpZy51c2VKYXZhU2NyaXB0XG4gICAgICA/ICcnXG4gICAgICA6IGBcbjxkZXRhaWxzPjxzdW1tYXJ5PjxiPk91dHB1dDwvYj48L3N1bW1hcnk+XG5cbiR7Y29kaWZ5KGF3YWl0IHNhbmRib3guZ2V0UnVubmFibGVKUygpLCAndHMnKX1cblxuPC9kZXRhaWxzPlxuYFxuXG4gICAgcmV0dXJuIGBcbjwhLS0g8J+aqCBTVE9QIPCfmqgg8J2XpvCdl6fwnZei8J2XoyDwn5qoIPCdkbrwnZG78J2RtvCdkbcg8J+aqFxuXG5IYWxmIG9mIGFsbCBpc3N1ZXMgZmlsZWQgaGVyZSBhcmUgZHVwbGljYXRlcywgYW5zd2VyZWQgaW4gdGhlIEZBUSwgb3Igbm90IGFwcHJvcHJpYXRlIGZvciB0aGUgYnVnIHRyYWNrZXIuIEV2ZW4gaWYgeW91IHRoaW5rIHlvdSd2ZSBmb3VuZCBhICpidWcqLCBwbGVhc2UgcmVhZCB0aGUgRkFRIGZpcnN0LCBlc3BlY2lhbGx5IHRoZSBDb21tb24gXCJCdWdzXCIgVGhhdCBBcmVuJ3QgQnVncyBzZWN0aW9uIVxuXG5QbGVhc2UgaGVscCB1cyBieSBkb2luZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGJlZm9yZSBsb2dnaW5nIGFuIGlzc3VlOlxuICAqIFNlYXJjaDogaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L3NlYXJjaD90eXBlPUlzc3Vlc1xuICAqIFJlYWQgdGhlIEZBUTogaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L3dpa2kvRkFRXG5cblBsZWFzZSBmaWxsIGluIHRoZSAqZW50aXJlKiB0ZW1wbGF0ZSBiZWxvdy5cbi0tPlxuXG4qKlR5cGVTY3JpcHQgVmVyc2lvbjoqKiAgJHt0eXBlc2NyaXB0VmVyc2lvbn1cblxuPCEtLSBTZWFyY2ggdGVybXMgeW91IHRyaWVkIGJlZm9yZSBsb2dnaW5nIHRoaXMgKHNvIG90aGVycyBjYW4gZmluZCB0aGlzIGlzc3VlIG1vcmUgZWFzaWx5KSAtLT5cbioqU2VhcmNoIFRlcm1zOioqXG5cbioqRXhwZWN0ZWQgYmVoYXZpb3I6KipcblxuKipBY3R1YWwgYmVoYXZpb3I6KipcblxuPCEtLSBEaWQgeW91IGZpbmQgb3RoZXIgYnVncyB0aGF0IGxvb2tlZCBzaW1pbGFyPyAtLT5cbioqUmVsYXRlZCBJc3N1ZXM6KipcblxuKipDb2RlKipcbiR7Y29kaWZ5KHNhbmRib3guZ2V0VGV4dCgpLCAndHMnKX1cblxuJHtqc1NlY3Rpb259XG5cbjxkZXRhaWxzPjxzdW1tYXJ5PjxiPkNvbXBpbGVyIE9wdGlvbnM8L2I+PC9zdW1tYXJ5PlxuXG4ke2NvZGlmeShzdHJpbmdpZmllZENvbXBpbGVyT3B0aW9ucywgJ2pzb24nKX1cblxuPC9kZXRhaWxzPlxuXG4qKlBsYXlncm91bmQgTGluazoqKiBbUHJvdmlkZWRdKCR7ZnVsbFVSTH0pXG4gICAgICBgXG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiByZXBvcnRJc3N1ZSgpIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgbWFrZU1hcmtkb3duKClcbiAgICBpZiAoYm9keS5sZW5ndGggPCA0MDAwKSB7XG4gICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy9uZXc/Ym9keT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGJvZHkpKVxuICAgIH0gZWxzZSB7XG4gICAgICB1aS5zaG93TW9kYWwoXG4gICAgICAgIGJvZHksXG4gICAgICAgIFwiSXNzdWUgdG9vIGxvbmcgdG8gcG9zdCBhdXRvbWF0aWNhbGx5LiBDb3B5IHRoaXMgdGV4dCwgdGhlbiBjbGljayAnQ3JlYXRlIE5ldyBJc3N1ZScgdG8gYmVnaW4uXCIsXG4gICAgICAgIHtcbiAgICAgICAgICAnQ3JlYXRlIE5ldyBJc3N1ZSc6ICdodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzL25ldycsXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBjb3B5QXNNYXJrZG93bklzc3VlKCkge1xuICAgIGNvbnN0IG1hcmtkb3duID0gYXdhaXQgbWFrZU1hcmtkb3duKClcbiAgICB1aS5zaG93TW9kYWwobWFya2Rvd24sICdNYXJrZG93biBjb2RlJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHlGb3JDaGF0KCkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gc2FuZGJveC5nZXRVUkxRdWVyeVdpdGhDb21waWxlck9wdGlvbnMoc2FuZGJveClcbiAgICBjb25zdCBmdWxsVVJMID0gYCR7ZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2x9Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9JHtkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZX0ke3F1ZXJ5fWBcbiAgICBjb25zdCBjaGF0ID0gYFtQbGF5Z3JvdW5kIExpbmtdKCR7ZnVsbFVSTH0pYFxuICAgIHVpLnNob3dNb2RhbChjaGF0LCAnTWFya2Rvd24gZm9yIGNoYXQnKVxuICB9XG5cbiAgZnVuY3Rpb24gY29weUZvckNoYXRXaXRoUHJldmlldygpIHtcbiAgICBjb25zdCBxdWVyeSA9IHNhbmRib3guZ2V0VVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zKHNhbmRib3gpXG4gICAgY29uc3QgZnVsbFVSTCA9IGAke2RvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sfS8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fSR7ZG9jdW1lbnQubG9jYXRpb24ucGF0aG5hbWV9JHtxdWVyeX1gXG5cbiAgICBjb25zdCB0cyA9IHNhbmRib3guZ2V0VGV4dCgpXG4gICAgY29uc3QgcHJldmlldyA9IHRzLmxlbmd0aCA+IDIwMCA/IHRzLnN1YnN0cmluZygwLCAyMDApICsgJy4uLicgOiB0cy5zdWJzdHJpbmcoMCwgMjAwKVxuXG4gICAgY29uc3QgY29kZSA9ICdgYGBcXG4nICsgcHJldmlldyArICdcXG5gYGBcXG4nXG4gICAgY29uc3QgY2hhdCA9IGAke2NvZGV9XFxuW1BsYXlncm91bmQgTGlua10oJHtmdWxsVVJMfSlgXG4gICAgdWkuc2hvd01vZGFsKGNoYXQsICdNYXJrZG93biBjb2RlJylcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3BlblByb2plY3RJblN0YWNrQmxpdHosXG4gICAgb3BlblByb2plY3RJbkNvZGVTYW5kYm94LFxuICAgIHJlcG9ydElzc3VlLFxuICAgIGNvcHlBc01hcmtkb3duSXNzdWUsXG4gICAgY29weUZvckNoYXQsXG4gICAgY29weUZvckNoYXRXaXRoUHJldmlldyxcbiAgICBvcGVuSW5UU0FTVCxcbiAgfVxufVxuIl19
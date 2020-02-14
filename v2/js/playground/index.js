define(["require", "exports", "./sidebar/showJS", "./createElements", "./sidebar/showDTS", "./sidebar/runtime", "./exporter", "./createUI", "./getExample", "./monaco/ExampleHighlight", "./createConfigDropdown", "./sidebar/showErrors", "./sidebar/options"], function (require, exports, showJS_1, createElements_1, showDTS_1, runtime_1, exporter_1, createUI_1, getExample_1, ExampleHighlight_1, createConfigDropdown_1, showErrors_1, options_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultPluginFactories = [showJS_1.compiledJSPlugin, showDTS_1.showDTSPlugin, showErrors_1.showErrors, runtime_1.runPlugin, options_1.optionsPlugin];
    exports.setupPlayground = (sandbox, monaco, config, i) => {
        const playgroundParent = sandbox.getDomNode().parentElement.parentElement.parentElement;
        const dragBar = createElements_1.createDragBar();
        playgroundParent.appendChild(dragBar);
        const sidebar = createElements_1.createSidebar();
        playgroundParent.appendChild(sidebar);
        const tabBar = createElements_1.createTabBar();
        sidebar.appendChild(tabBar);
        const container = createElements_1.createPluginContainer();
        sidebar.appendChild(container);
        const plugins = [];
        const tabs = [];
        const registerPlugin = (plugin) => {
            plugins.push(plugin);
            const tab = createElements_1.createTabForPlugin(plugin);
            tabs.push(tab);
            const tabClicked = e => {
                const previousPlugin = currentPlugin();
                const newTab = e.target;
                const newPlugin = plugins.find(p => p.displayName == newTab.textContent);
                createElements_1.activatePlugin(newPlugin, previousPlugin, sandbox, tabBar, container);
            };
            tabBar.appendChild(tab);
            tab.onclick = tabClicked;
        };
        const currentPlugin = () => {
            const selectedTab = tabs.find(t => t.classList.contains('active'));
            return plugins[tabs.indexOf(selectedTab)];
        };
        const initialPlugins = defaultPluginFactories.map(f => f(i));
        initialPlugins.forEach(p => registerPlugin(p));
        // Choose which should be selected
        const priorityPlugin = plugins.find(plugin => plugin.shouldBeSelected && plugin.shouldBeSelected());
        const selectedPlugin = priorityPlugin || plugins[0];
        const selectedTab = tabs[plugins.indexOf(selectedPlugin)];
        selectedTab.onclick({ target: selectedTab });
        let debouncingTimer = false;
        sandbox.editor.onDidChangeModelContent(_event => {
            const plugin = currentPlugin();
            if (plugin.modelChanged)
                plugin.modelChanged(sandbox, sandbox.getModel());
            // This needs to be last in the function
            if (debouncingTimer)
                return;
            debouncingTimer = true;
            setTimeout(() => {
                debouncingTimer = false;
                playgroundDebouncedMainFunction();
                // Only call the plugin function once every 0.3s
                if (plugin.modelChangedDebounce && plugin.displayName === currentPlugin().displayName) {
                    plugin.modelChangedDebounce(sandbox, sandbox.getModel());
                }
            }, 300);
        });
        // Sets the URL and storage of the sandbox string
        const playgroundDebouncedMainFunction = () => {
            const alwaysUpdateURL = !localStorage.getItem('disable-save-on-type');
            if (alwaysUpdateURL) {
                const newURL = sandbox.getURLQueryWithCompilerOptions(sandbox);
                window.history.replaceState({}, '', newURL);
            }
            localStorage.setItem('sandbox-history', sandbox.getText());
        };
        // When any compiler flags are changed, trigger a potential change to the URL
        sandbox.setDidUpdateCompilerSettings(() => {
            playgroundDebouncedMainFunction();
            // @ts-ignore
            window.appInsights.trackEvent({ name: 'Compiler Settings changed' });
            const model = sandbox.editor.getModel();
            const plugin = currentPlugin();
            if (model && plugin.modelChanged)
                plugin.modelChanged(sandbox, model);
            if (model && plugin.modelChangedDebounce)
                plugin.modelChangedDebounce(sandbox, model);
        });
        // Setup working with the existing UI, once it's loaded
        // Versions of TypeScript
        // Set up the label for the dropdown
        document.querySelectorAll('#versions > a').item(0).innerHTML = 'v' + sandbox.ts.version + " <span class='caret'/>";
        // Add the versions to the dropdown
        const versionsMenu = document.querySelectorAll('#versions > ul').item(0);
        const allVersions = ['3.8.0-beta', ...sandbox.supportedVersions, 'Nightly'];
        allVersions.forEach((v) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = v;
            a.href = '#';
            li.onclick = () => {
                const currentURL = sandbox.getURLQueryWithCompilerOptions(sandbox);
                const params = new URLSearchParams(currentURL.split('#')[0]);
                const version = v === 'Nightly' ? 'next' : v;
                params.set('ts', version);
                const hash = document.location.hash.length ? document.location.hash : '';
                const newURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}?${params}${hash}`;
                // @ts-ignore - it is allowed
                document.location = newURL;
            };
            li.appendChild(a);
            versionsMenu.appendChild(li);
        });
        // Support dropdowns
        document.querySelectorAll('.navbar-sub li.dropdown > a').forEach(link => {
            const a = link;
            a.onclick = _e => {
                if (a.parentElement.classList.contains('open')) {
                    document.querySelectorAll('.navbar-sub li.open').forEach(i => i.classList.remove('open'));
                }
                else {
                    document.querySelectorAll('.navbar-sub li.open').forEach(i => i.classList.remove('open'));
                    a.parentElement.classList.toggle('open');
                    const exampleContainer = a
                        .closest('li')
                        .getElementsByTagName('ul')
                        .item(0);
                    // Set exact height and widths for the popovers for the main playground navigation
                    const isPlaygroundSubmenu = !!a.closest('nav');
                    if (isPlaygroundSubmenu) {
                        const playgroundContainer = document.getElementById('playground-container');
                        exampleContainer.style.height = `calc(${playgroundContainer.getBoundingClientRect().height + 26}px - 4rem)`;
                        const width = window.localStorage.getItem('dragbar-x');
                        exampleContainer.style.width = `calc(100% - ${width}px - 4rem)`;
                    }
                }
            };
        });
        window.addEventListener('keydown', (event) => {
            const S_KEY = 83;
            if (event.keyCode == S_KEY && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                window.navigator.clipboard.writeText(location.href.toString()).then(() => ui.flashInfo(i('play_export_clipboard')), (e) => alert(e));
            }
            if (event.keyCode === 13 &&
                (event.metaKey || event.ctrlKey) &&
                event.target instanceof Node &&
                event.target === document.body) {
                event.preventDefault();
                const runButton = document.getElementById('run-button');
                runButton.onclick && runButton.onclick({});
            }
        }, false);
        const runButton = document.getElementById('run-button');
        runButton.onclick = () => {
            const run = sandbox.getRunnableJS();
            const runPlugin = plugins.find(p => p.id === 'logs');
            createElements_1.activatePlugin(runPlugin, currentPlugin(), sandbox, tabBar, container);
            runtime_1.runWithCustomLogs(run, i);
            const isJS = sandbox.config.useJavaScript;
            ui.flashInfo(i(isJS ? 'play_run_js' : 'play_run_ts'));
        };
        // Handle the close buttons on the examples
        document.querySelectorAll('button.examples-close').forEach(b => {
            const button = b;
            button.onclick = (e) => {
                var _a;
                const button = e.target;
                const navLI = button.closest('li');
                (_a = navLI) === null || _a === void 0 ? void 0 : _a.classList.remove('open');
            };
        });
        createElements_1.setupSidebarToggle();
        createConfigDropdown_1.createConfigDropdown(sandbox, monaco);
        createConfigDropdown_1.updateConfigDropdownForCompilerOptions(sandbox, monaco);
        // Support grabbing examples from the location hash
        if (location.hash.startsWith('#example')) {
            const exampleName = location.hash.replace('#example/', '').trim();
            sandbox.config.logger.log('Loading example:', exampleName);
            getExample_1.getExampleSourceCode(config.prefix, config.lang, exampleName).then(ex => {
                if (ex.example && ex.code) {
                    const { example, code } = ex;
                    // Update the localstorage showing that you've seen this page
                    if (localStorage) {
                        const seenText = localStorage.getItem('examples-seen') || '{}';
                        const seen = JSON.parse(seenText);
                        seen[example.id] = example.hash;
                        localStorage.setItem('examples-seen', JSON.stringify(seen));
                    }
                    // Set the menu to be the same section as this current example
                    // this happens behind the scene and isn't visible till you hover
                    // const sectionTitle = example.path[0]
                    // const allSectionTitles = document.getElementsByClassName('section-name')
                    // for (const title of allSectionTitles) {
                    //   if (title.textContent === sectionTitle) {
                    //     title.onclick({})
                    //   }
                    // }
                    const allLinks = document.querySelectorAll('example-link');
                    // @ts-ignore
                    for (const link of allLinks) {
                        if (link.textContent === example.title) {
                            link.classList.add('highlight');
                        }
                    }
                    document.title = 'TypeScript Playground - ' + example.title;
                    sandbox.setText(code);
                }
                else {
                    sandbox.setText('// There was an issue getting the example, bad URL? Check the console in the developer tools');
                }
            });
        }
        // Sets up a way to click between examples
        monaco.languages.registerLinkProvider(sandbox.language, new ExampleHighlight_1.ExampleHighlighter());
        const languageSelector = document.getElementById('language-selector');
        const params = new URLSearchParams(location.search);
        languageSelector.options.selectedIndex = params.get('useJavaScript') ? 1 : 0;
        languageSelector.onchange = () => {
            const useJavaScript = languageSelector.value === 'JavaScript';
            const query = sandbox.getURLQueryWithCompilerOptions(sandbox, { useJavaScript: useJavaScript ? true : undefined });
            const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
            // @ts-ignore
            document.location = fullURL;
        };
        const ui = createUI_1.createUI();
        const exporter = exporter_1.createExporter(sandbox, monaco, ui);
        const playground = {
            exporter,
            ui,
            registerPlugin,
        };
        window.ts = sandbox.ts;
        window.sandbox = sandbox;
        window.playground = playground;
        console.log(`Using TypeScript ${window.ts.version}`);
        console.log('Available globals:');
        console.log('\twindow.ts', window.ts);
        console.log('\twindow.sandbox', window.sandbox);
        console.log('\twindow.playground', window.playground);
        // Dev mode plugin
        if (options_1.allowConnectingToLocalhost()) {
            window.exports = {};
            console.log('Connecting to dev plugin');
            try {
                // @ts-ignore
                const re = window.require;
                re(['local/index'], (devPlugin) => {
                    console.log('Set up dev plugin from localhost:5000');
                    console.log(devPlugin);
                    playground.registerPlugin(devPlugin);
                    // Auto-select the dev plugin
                    createElements_1.activatePlugin(devPlugin, currentPlugin(), sandbox, tabBar, container);
                });
            }
            catch (error) {
                console.error('Problem loading up the dev plugin');
                console.error(error);
            }
        }
        options_1.activePlugins().forEach(plugin => {
            try {
                // @ts-ignore
                const re = window.require;
                re([`unpkg/${plugin.module}@latest/dist/index`], (devPlugin) => {
                    playground.registerPlugin(devPlugin);
                    // Auto-select the dev plugin
                    if (devPlugin.shouldBeSelected && devPlugin.shouldBeSelected()) {
                        createElements_1.activatePlugin(devPlugin, currentPlugin(), sandbox, tabBar, container);
                    }
                });
            }
            catch (error) {
                console.error('Problem loading up the plugin:', plugin);
                console.error(error);
            }
        });
        if (location.hash.startsWith('#show-examples')) {
            setTimeout(() => {
                var _a;
                (_a = document.getElementById('examples-button')) === null || _a === void 0 ? void 0 : _a.click();
            }, 100);
        }
        if (location.hash.startsWith('#show-whatisnew')) {
            setTimeout(() => {
                var _a;
                (_a = document.getElementById('whatisnew-button')) === null || _a === void 0 ? void 0 : _a.click();
            }, 100);
        }
        return playground;
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUF3REEsTUFBTSxzQkFBc0IsR0FBb0IsQ0FBQyx5QkFBZ0IsRUFBRSx1QkFBYSxFQUFFLHVCQUFVLEVBQUUsbUJBQVMsRUFBRSx1QkFBYSxDQUFDLENBQUE7SUFFMUcsUUFBQSxlQUFlLEdBQUcsQ0FDN0IsT0FBZ0IsRUFDaEIsTUFBYyxFQUNkLE1BQXdCLEVBQ3hCLENBQTBCLEVBQzFCLEVBQUU7UUFDRixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxhQUFjLENBQUMsYUFBYyxDQUFDLGFBQWMsQ0FBQTtRQUMxRixNQUFNLE9BQU8sR0FBRyw4QkFBYSxFQUFFLENBQUE7UUFDL0IsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRXJDLE1BQU0sT0FBTyxHQUFHLDhCQUFhLEVBQUUsQ0FBQTtRQUMvQixnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFckMsTUFBTSxNQUFNLEdBQUcsNkJBQVksRUFBRSxDQUFBO1FBQzdCLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFM0IsTUFBTSxTQUFTLEdBQUcsc0NBQXFCLEVBQUUsQ0FBQTtRQUN6QyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBRTlCLE1BQU0sT0FBTyxHQUFHLEVBQXdCLENBQUE7UUFDeEMsTUFBTSxJQUFJLEdBQUcsRUFBeUIsQ0FBQTtRQUV0QyxNQUFNLGNBQWMsR0FBRyxDQUFDLE1BQXdCLEVBQUUsRUFBRTtZQUNsRCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXBCLE1BQU0sR0FBRyxHQUFHLG1DQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3RDLElBQUksQ0FBQyxJQUFJ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QyxDQUFBO1NBQ1I7UUFFRCxPQUFPLFVBQVUsQ0FBQTtJQUNuQixDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ0eXBlIFNhbmRib3ggPSBSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJ3R5cGVzY3JpcHQtc2FuZGJveCcpLmNyZWF0ZVR5cGVTY3JpcHRTYW5kYm94PlxudHlwZSBNb25hY28gPSB0eXBlb2YgaW1wb3J0KCdtb25hY28tZWRpdG9yJylcblxuZGVjbGFyZSBjb25zdCB3aW5kb3c6IGFueVxuXG5pbXBvcnQgeyBjb21waWxlZEpTUGx1Z2luIH0gZnJvbSAnLi9zaWRlYmFyL3Nob3dKUydcbmltcG9ydCB7XG4gIGNyZWF0ZVNpZGViYXIsXG4gIGNyZWF0ZVRhYkZvclBsdWdpbixcbiAgY3JlYXRlVGFiQmFyLFxuICBjcmVhdGVQbHVnaW5Db250YWluZXIsXG4gIGFjdGl2YXRlUGx1Z2luLFxuICBjcmVhdGVEcmFnQmFyLFxuICBzZXR1cFNpZGViYXJUb2dnbGUsXG59IGZyb20gJy4vY3JlYXRlRWxlbWVudHMnXG5pbXBvcnQgeyBzaG93RFRTUGx1Z2luIH0gZnJvbSAnLi9zaWRlYmFyL3Nob3dEVFMnXG5pbXBvcnQgeyBydW5XaXRoQ3VzdG9tTG9ncywgcnVuUGx1Z2luIH0gZnJvbSAnLi9zaWRlYmFyL3J1bnRpbWUnXG5pbXBvcnQgeyBjcmVhdGVFeHBvcnRlciB9IGZyb20gJy4vZXhwb3J0ZXInXG5pbXBvcnQgeyBjcmVhdGVVSSB9IGZyb20gJy4vY3JlYXRlVUknXG5pbXBvcnQgeyBnZXRFeGFtcGxlU291cmNlQ29kZSB9IGZyb20gJy4vZ2V0RXhhbXBsZSdcbmltcG9ydCB7IEV4YW1wbGVIaWdobGlnaHRlciB9IGZyb20gJy4vbW9uYWNvL0V4YW1wbGVIaWdobGlnaHQnXG5pbXBvcnQgeyBjcmVhdGVDb25maWdEcm9wZG93biwgdXBkYXRlQ29uZmlnRHJvcGRvd25Gb3JDb21waWxlck9wdGlvbnMgfSBmcm9tICcuL2NyZWF0ZUNvbmZpZ0Ryb3Bkb3duJ1xuaW1wb3J0IHsgc2hvd0Vycm9ycyB9IGZyb20gJy4vc2lkZWJhci9zaG93RXJyb3JzJ1xuaW1wb3J0IHsgb3B0aW9uc1BsdWdpbiwgYWxsb3dDb25uZWN0aW5nVG9Mb2NhbGhvc3QsIGFjdGl2ZVBsdWdpbnMgfSBmcm9tICcuL3NpZGViYXIvb3B0aW9ucydcblxuZXhwb3J0IHR5cGUgUGx1Z2luRmFjdG9yeSA9IHtcbiAgKGk6IChrZXk6IHN0cmluZywgY29tcG9uZW50cz86IGFueSkgPT4gc3RyaW5nKTogUGxheWdyb3VuZFBsdWdpblxufVxuXG4vKiogVGhlIGludGVyZmFjZSBvZiBhbGwgc2lkZWJhciBwbHVnaW5zICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXlncm91bmRQbHVnaW4ge1xuICAvKiogTm90IHB1YmxpYyBmYWNpbmcsIGJ1dCB1c2VkIGJ5IHRoZSBwbGF5Z3JvdW5kIHRvIHVuaXF1ZWx5IGlkZW50aWZ5IHBsdWdpbnMgKi9cbiAgaWQ6IHN0cmluZ1xuICAvKiogVG8gc2hvdyBpbiB0aGUgdGFicyAqL1xuICBkaXNwbGF5TmFtZTogc3RyaW5nXG4gIC8qKiBTaG91bGQgdGhpcyBwbHVnaW4gYmUgc2VsZWN0ZWQgd2hlbiB0aGUgcGx1Z2luIGlzIGZpcnN0IGxvYWRlZD8gTGV0J3MgeW91IGNoZWNrIGZvciBxdWVyeSB2YXJzIGV0YyB0byBsb2FkIGEgcGFydGljdWxhciBwbHVnaW4gKi9cbiAgc2hvdWxkQmVTZWxlY3RlZD86ICgpID0+IGJvb2xlYW5cbiAgLyoqIEJlZm9yZSB3ZSBzaG93IHRoZSB0YWIsIHVzZSB0aGlzIHRvIHNldCB1cCB5b3VyIEhUTUwgLSBpdCB3aWxsIGFsbCBiZSByZW1vdmVkIGJ5IHRoZSBwbGF5Z3JvdW5kIHdoZW4gc29tZW9uZSBuYXZpZ2F0ZXMgb2ZmIHRoZSB0YWIgKi9cbiAgd2lsbE1vdW50PzogKHNhbmRib3g6IFNhbmRib3gsIGNvbnRhaW5lcjogSFRNTERpdkVsZW1lbnQpID0+IHZvaWRcbiAgLyoqIEFmdGVyIHdlIHNob3cgdGhlIHRhYiAqL1xuICBkaWRNb3VudD86IChzYW5kYm94OiBTYW5kYm94LCBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50KSA9PiB2b2lkXG4gIC8qKiBNb2RlbCBjaGFuZ2VzIHdoaWxlIHRoaXMgcGx1Z2luIGlzIGFjdGl2ZWx5IHNlbGVjdGVkICAqL1xuICBtb2RlbENoYW5nZWQ/OiAoc2FuZGJveDogU2FuZGJveCwgbW9kZWw6IGltcG9ydCgnbW9uYWNvLWVkaXRvcicpLmVkaXRvci5JVGV4dE1vZGVsKSA9PiB2b2lkXG4gIC8qKiBEZWxheWVkIG1vZGVsIGNoYW5nZXMgd2hpbGUgdGhpcyBwbHVnaW4gaXMgYWN0aXZlbHkgc2VsZWN0ZWQsIHVzZWZ1bCB3aGVuIHlvdSBhcmUgd29ya2luZyB3aXRoIHRoZSBUUyBBUEkgYmVjYXVzZSBpdCB3b24ndCBydW4gb24gZXZlcnkga2V5cHJlc3MgKi9cbiAgbW9kZWxDaGFuZ2VkRGVib3VuY2U/OiAoc2FuZGJveDogU2FuZGJveCwgbW9kZWw6IGltcG9ydCgnbW9uYWNvLWVkaXRvcicpLmVkaXRvci5JVGV4dE1vZGVsKSA9PiB2b2lkXG4gIC8qKiBCZWZvcmUgd2UgcmVtb3ZlIHRoZSB0YWIgKi9cbiAgd2lsbFVubW91bnQ/OiAoc2FuZGJveDogU2FuZGJveCwgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudCkgPT4gdm9pZFxuICAvKiogQWZ0ZXIgd2UgcmVtb3ZlIHRoZSB0YWIgKi9cbiAgZGlkVW5tb3VudD86IChzYW5kYm94OiBTYW5kYm94LCBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50KSA9PiB2b2lkXG59XG5cbmludGVyZmFjZSBQbGF5Z3JvdW5kQ29uZmlnIHtcbiAgbGFuZzogc3RyaW5nXG4gIHByZWZpeDogc3RyaW5nXG59XG5cbmNvbnN0IGRlZmF1bHRQbHVnaW5GYWN0b3JpZXM6IFBsdWdpbkZhY3RvcnlbXSA9IFtjb21waWxlZEpTUGx1Z2luLCBzaG93RFRTUGx1Z2luLCBzaG93RXJyb3JzLCBydW5QbHVnaW4sIG9wdGlvbnNQbHVnaW5dXG5cbmV4cG9ydCBjb25zdCBzZXR1cFBsYXlncm91bmQgPSAoXG4gIHNhbmRib3g6IFNhbmRib3gsXG4gIG1vbmFjbzogTW9uYWNvLFxuICBjb25maWc6IFBsYXlncm91bmRDb25maWcsXG4gIGk6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nXG4pID0+IHtcbiAgY29uc3QgcGxheWdyb3VuZFBhcmVudCA9IHNhbmRib3guZ2V0RG9tTm9kZSgpLnBhcmVudEVsZW1lbnQhLnBhcmVudEVsZW1lbnQhLnBhcmVudEVsZW1lbnQhXG4gIGNvbnN0IGRyYWdCYXIgPSBjcmVhdGVEcmFnQmFyKClcbiAgcGxheWdyb3VuZFBhcmVudC5hcHBlbmRDaGlsZChkcmFnQmFyKVxuXG4gIGNvbnN0IHNpZGViYXIgPSBjcmVhdGVTaWRlYmFyKClcbiAgcGxheWdyb3VuZFBhcmVudC5hcHBlbmRDaGlsZChzaWRlYmFyKVxuXG4gIGNvbnN0IHRhYkJhciA9IGNyZWF0ZVRhYkJhcigpXG4gIHNpZGViYXIuYXBwZW5kQ2hpbGQodGFiQmFyKVxuXG4gIGNvbnN0IGNvbnRhaW5lciA9IGNyZWF0ZVBsdWdpbkNvbnRhaW5lcigpXG4gIHNpZGViYXIuYXBwZW5kQ2hpbGQoY29udGFpbmVyKVxuXG4gIGNvbnN0IHBsdWdpbnMgPSBbXSBhcyBQbGF5Z3JvdW5kUGx1Z2luW11cbiAgY29uc3QgdGFicyA9IFtdIGFzIEhUTUxCdXR0b25FbGVtZW50W11cblxuICBjb25zdCByZWdpc3RlclBsdWdpbiA9IChwbHVnaW46IFBsYXlncm91bmRQbHVnaW4pID0+IHtcbiAgICBwbHVnaW5zLnB1c2gocGx1Z2luKVxuXG4gICAgY29uc3QgdGFiID0gY3JlYXRlVGFiRm9yUGx1Z2luKHBsdWdpbilcbiAgICB0YWJzLnB1c2godGFiKVxuXG4gICAgY29uc3QgdGFiQ2xpY2tlZDogSFRNTEVsZW1lbnRbJ29uY2xpY2snXSA9IGUgPT4ge1xuICAgICAgY29uc3QgcHJldmlvdXNQbHVnaW4gPSBjdXJyZW50UGx1Z2luKClcbiAgICAgIGNvbnN0IG5ld1RhYiA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50XG4gICAgICBjb25zdCBuZXdQbHVnaW4gPSBwbHVnaW5zLmZpbmQocCA9PiBwLmRpc3BsYXlOYW1lID09IG5ld1RhYi50ZXh0Q29udGVudCkhXG4gICAgICBhY3RpdmF0ZVBsdWdpbihuZXdQbHVnaW4sIHByZXZpb3VzUGx1Z2luLCBzYW5kYm94LCB0YWJCYXIsIGNvbnRhaW5lcilcbiAgICB9XG5cbiAgICB0YWJCYXIuYXBwZW5kQ2hpbGQodGFiKVxuICAgIHRhYi5vbmNsaWNrID0gdGFiQ2xpY2tlZFxuICB9XG5cbiAgY29uc3QgY3VycmVudFBsdWdpbiA9ICgpID0+IHtcbiAgICBjb25zdCBzZWxlY3RlZFRhYiA9IHRhYnMuZmluZCh0ID0+IHQuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkhXG4gICAgcmV0dXJuIHBsdWdpbnNbdGFicy5pbmRleE9mKHNlbGVjdGVkVGFiKV1cbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxQbHVnaW5zID0gZGVmYXVsdFBsdWdpbkZhY3Rvcmllcy5tYXAoZiA9PiBmKGkpKVxuICBpbml0aWFsUGx1Z2lucy5mb3JFYWNoKHAgPT4gcmVnaXN0ZXJQbHVnaW4ocCkpXG5cbiAgLy8gQ2hvb3NlIHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZFxuICBjb25zdCBwcmlvcml0eVBsdWdpbiA9IHBsdWdpbnMuZmluZChwbHVnaW4gPT4gcGx1Z2luLnNob3VsZEJlU2VsZWN0ZWQgJiYgcGx1Z2luLnNob3VsZEJlU2VsZWN0ZWQoKSlcbiAgY29uc3Qgc2VsZWN0ZWRQbHVnaW4gPSBwcmlvcml0eVBsdWdpbiB8fCBwbHVnaW5zWzBdXG4gIGNvbnN0IHNlbGVjdGVkVGFiID0gdGFic1twbHVnaW5zLmluZGV4T2Yoc2VsZWN0ZWRQbHVnaW4pXSFcbiAgc2VsZWN0ZWRUYWIub25jbGljayEoeyB0YXJnZXQ6IHNlbGVjdGVkVGFiIH0gYXMgYW55KVxuXG4gIGxldCBkZWJvdW5jaW5nVGltZXIgPSBmYWxzZVxuICBzYW5kYm94LmVkaXRvci5vbkRpZENoYW5nZU1vZGVsQ29udGVudChfZXZlbnQgPT4ge1xuICAgIGNvbnN0IHBsdWdpbiA9IGN1cnJlbnRQbHVnaW4oKVxuICAgIGlmIChwbHVnaW4ubW9kZWxDaGFuZ2VkKSBwbHVnaW4ubW9kZWxDaGFuZ2VkKHNhbmRib3gsIHNhbmRib3guZ2V0TW9kZWwoKSlcblxuICAgIC8vIFRoaXMgbmVlZHMgdG8gYmUgbGFzdCBpbiB0aGUgZnVuY3Rpb25cbiAgICBpZiAoZGVib3VuY2luZ1RpbWVyKSByZXR1cm5cbiAgICBkZWJvdW5jaW5nVGltZXIgPSB0cnVlXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkZWJvdW5jaW5nVGltZXIgPSBmYWxzZVxuICAgICAgcGxheWdyb3VuZERlYm91bmNlZE1haW5GdW5jdGlvbigpXG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgcGx1Z2luIGZ1bmN0aW9uIG9uY2UgZXZlcnkgMC4zc1xuICAgICAgaWYgKHBsdWdpbi5tb2RlbENoYW5nZWREZWJvdW5jZSAmJiBwbHVnaW4uZGlzcGxheU5hbWUgPT09IGN1cnJlbnRQbHVnaW4oKS5kaXNwbGF5TmFtZSkge1xuICAgICAgICBwbHVnaW4ubW9kZWxDaGFuZ2VkRGVib3VuY2Uoc2FuZGJveCwgc2FuZGJveC5nZXRNb2RlbCgpKVxuICAgICAgfVxuICAgIH0sIDMwMClcbiAgfSlcblxuICAvLyBTZXRzIHRoZSBVUkwgYW5kIHN0b3JhZ2Ugb2YgdGhlIHNhbmRib3ggc3RyaW5nXG4gIGNvbnN0IHBsYXlncm91bmREZWJvdW5jZWRNYWluRnVuY3Rpb24gPSAoKSA9PiB7XG4gICAgY29uc3QgYWx3YXlzVXBkYXRlVVJMID0gIWxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkaXNhYmxlLXNhdmUtb24tdHlwZScpXG4gICAgaWYgKGFsd2F5c1VwZGF0ZVVSTCkge1xuICAgICAgY29uc3QgbmV3VVJMID0gc2FuZGJveC5nZXRVUkxRdWVyeVdpdGhDb21waWxlck9wdGlvbnMoc2FuZGJveClcbiAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgJycsIG5ld1VSTClcbiAgICB9XG5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2FuZGJveC1oaXN0b3J5Jywgc2FuZGJveC5nZXRUZXh0KCkpXG4gIH1cblxuICAvLyBXaGVuIGFueSBjb21waWxlciBmbGFncyBhcmUgY2hhbmdlZCwgdHJpZ2dlciBhIHBvdGVudGlhbCBjaGFuZ2UgdG8gdGhlIFVSTFxuICBzYW5kYm94LnNldERpZFVwZGF0ZUNvbXBpbGVyU2V0dGluZ3MoKCkgPT4ge1xuICAgIHBsYXlncm91bmREZWJvdW5jZWRNYWluRnVuY3Rpb24oKVxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB3aW5kb3cuYXBwSW5zaWdodHMudHJhY2tFdmVudCh7IG5hbWU6ICdDb21waWxlciBTZXR0aW5ncyBjaGFuZ2VkJyB9KVxuXG4gICAgY29uc3QgbW9kZWwgPSBzYW5kYm94LmVkaXRvci5nZXRNb2RlbCgpXG4gICAgY29uc3QgcGx1Z2luID0gY3VycmVudFBsdWdpbigpXG4gICAgaWYgKG1vZGVsICYmIHBsdWdpbi5tb2RlbENoYW5nZWQpIHBsdWdpbi5tb2RlbENoYW5nZWQoc2FuZGJveCwgbW9kZWwpXG4gICAgaWYgKG1vZGVsICYmIHBsdWdpbi5tb2RlbENoYW5nZWREZWJvdW5jZSkgcGx1Z2luLm1vZGVsQ2hhbmdlZERlYm91bmNlKHNhbmRib3gsIG1vZGVsKVxuICB9KVxuXG4gIC8vIFNldHVwIHdvcmtpbmcgd2l0aCB0aGUgZXhpc3RpbmcgVUksIG9uY2UgaXQncyBsb2FkZWRcblxuICAvLyBWZXJzaW9ucyBvZiBUeXBlU2NyaXB0XG5cbiAgLy8gU2V0IHVwIHRoZSBsYWJlbCBmb3IgdGhlIGRyb3Bkb3duXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyN2ZXJzaW9ucyA+IGEnKS5pdGVtKDApLmlubmVySFRNTCA9ICd2JyArIHNhbmRib3gudHMudmVyc2lvbiArIFwiIDxzcGFuIGNsYXNzPSdjYXJldCcvPlwiXG5cbiAgLy8gQWRkIHRoZSB2ZXJzaW9ucyB0byB0aGUgZHJvcGRvd25cbiAgY29uc3QgdmVyc2lvbnNNZW51ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3ZlcnNpb25zID4gdWwnKS5pdGVtKDApXG4gIGNvbnN0IGFsbFZlcnNpb25zID0gWyczLjguMC1iZXRhJywgLi4uc2FuZGJveC5zdXBwb3J0ZWRWZXJzaW9ucywgJ05pZ2h0bHknXVxuICBhbGxWZXJzaW9ucy5mb3JFYWNoKCh2OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gICAgYS50ZXh0Q29udGVudCA9IHZcbiAgICBhLmhyZWYgPSAnIydcblxuICAgIGxpLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50VVJMID0gc2FuZGJveC5nZXRVUkxRdWVyeVdpdGhDb21waWxlck9wdGlvbnMoc2FuZGJveClcbiAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoY3VycmVudFVSTC5zcGxpdCgnIycpWzBdKVxuICAgICAgY29uc3QgdmVyc2lvbiA9IHYgPT09ICdOaWdodGx5JyA/ICduZXh0JyA6IHZcbiAgICAgIHBhcmFtcy5zZXQoJ3RzJywgdmVyc2lvbilcblxuICAgICAgY29uc3QgaGFzaCA9IGRvY3VtZW50LmxvY2F0aW9uLmhhc2gubGVuZ3RoID8gZG9jdW1lbnQubG9jYXRpb24uaGFzaCA6ICcnXG4gICAgICBjb25zdCBuZXdVUkwgPSBgJHtkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbH0vLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH0ke2RvY3VtZW50LmxvY2F0aW9uLnBhdGhuYW1lfT8ke3BhcmFtc30ke2hhc2h9YFxuXG4gICAgICAvLyBAdHMtaWdub3JlIC0gaXQgaXMgYWxsb3dlZFxuICAgICAgZG9jdW1lbnQubG9jYXRpb24gPSBuZXdVUkxcbiAgICB9XG5cbiAgICBsaS5hcHBlbmRDaGlsZChhKVxuICAgIHZlcnNpb25zTWVudS5hcHBlbmRDaGlsZChsaSlcbiAgfSlcblxuICAvLyBTdXBwb3J0IGRyb3Bkb3duc1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubmF2YmFyLXN1YiBsaS5kcm9wZG93biA+IGEnKS5mb3JFYWNoKGxpbmsgPT4ge1xuICAgIGNvbnN0IGEgPSBsaW5rIGFzIEhUTUxBbmNob3JFbGVtZW50XG4gICAgYS5vbmNsaWNrID0gX2UgPT4ge1xuICAgICAgaWYgKGEucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcGVuJykpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdmJhci1zdWIgbGkub3BlbicpLmZvckVhY2goaSA9PiBpLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5uYXZiYXItc3ViIGxpLm9wZW4nKS5mb3JFYWNoKGkgPT4gaS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJykpXG4gICAgICAgIGEucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpXG5cbiAgICAgICAgY29uc3QgZXhhbXBsZUNvbnRhaW5lciA9IGFcbiAgICAgICAgICAuY2xvc2VzdCgnbGknKSFcbiAgICAgICAgICAuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3VsJylcbiAgICAgICAgICAuaXRlbSgwKSFcblxuICAgICAgICAvLyBTZXQgZXhhY3QgaGVpZ2h0IGFuZCB3aWR0aHMgZm9yIHRoZSBwb3BvdmVycyBmb3IgdGhlIG1haW4gcGxheWdyb3VuZCBuYXZpZ2F0aW9uXG4gICAgICAgIGNvbnN0IGlzUGxheWdyb3VuZFN1Ym1lbnUgPSAhIWEuY2xvc2VzdCgnbmF2JylcbiAgICAgICAgaWYgKGlzUGxheWdyb3VuZFN1Ym1lbnUpIHtcbiAgICAgICAgICBjb25zdCBwbGF5Z3JvdW5kQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXlncm91bmQtY29udGFpbmVyJykhXG4gICAgICAgICAgZXhhbXBsZUNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBgY2FsYygke3BsYXlncm91bmRDb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0ICsgMjZ9cHggLSA0cmVtKWBcblxuICAgICAgICAgIGNvbnN0IHdpZHRoID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkcmFnYmFyLXgnKVxuICAgICAgICAgIGV4YW1wbGVDb250YWluZXIuc3R5bGUud2lkdGggPSBgY2FsYygxMDAlIC0gJHt3aWR0aH1weCAtIDRyZW0pYFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFxuICAgICdrZXlkb3duJyxcbiAgICAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IFNfS0VZID0gODNcbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09IFNfS0VZICYmIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkpKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgICB3aW5kb3cubmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobG9jYXRpb24uaHJlZi50b1N0cmluZygpKS50aGVuKFxuICAgICAgICAgICgpID0+IHVpLmZsYXNoSW5mbyhpKCdwbGF5X2V4cG9ydF9jbGlwYm9hcmQnKSksXG4gICAgICAgICAgKGU6IGFueSkgPT4gYWxlcnQoZSlcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGV2ZW50LmtleUNvZGUgPT09IDEzICYmXG4gICAgICAgIChldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkpICYmXG4gICAgICAgIGV2ZW50LnRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgZXZlbnQudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5XG4gICAgICApIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBjb25zdCBydW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncnVuLWJ1dHRvbicpIVxuICAgICAgICBydW5CdXR0b24ub25jbGljayAmJiBydW5CdXR0b24ub25jbGljayh7fSBhcyBhbnkpXG4gICAgICB9XG4gICAgfSxcbiAgICBmYWxzZVxuICApXG5cbiAgY29uc3QgcnVuQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3J1bi1idXR0b24nKSFcbiAgcnVuQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgcnVuID0gc2FuZGJveC5nZXRSdW5uYWJsZUpTKClcbiAgICBjb25zdCBydW5QbHVnaW4gPSBwbHVnaW5zLmZpbmQocCA9PiBwLmlkID09PSAnbG9ncycpIVxuICAgIGFjdGl2YXRlUGx1Z2luKHJ1blBsdWdpbiwgY3VycmVudFBsdWdpbigpLCBzYW5kYm94LCB0YWJCYXIsIGNvbnRhaW5lcilcblxuICAgIHJ1bldpdGhDdXN0b21Mb2dzKHJ1biwgaSlcblxuICAgIGNvbnN0IGlzSlMgPSBzYW5kYm94LmNvbmZpZy51c2VKYXZhU2NyaXB0XG4gICAgdWkuZmxhc2hJbmZvKGkoaXNKUyA/ICdwbGF5X3J1bl9qcycgOiAncGxheV9ydW5fdHMnKSlcbiAgfVxuXG4gIC8vIEhhbmRsZSB0aGUgY2xvc2UgYnV0dG9ucyBvbiB0aGUgZXhhbXBsZXNcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYnV0dG9uLmV4YW1wbGVzLWNsb3NlJykuZm9yRWFjaChiID0+IHtcbiAgICBjb25zdCBidXR0b24gPSBiIGFzIEhUTUxCdXR0b25FbGVtZW50XG4gICAgYnV0dG9uLm9uY2xpY2sgPSAoZTogYW55KSA9PiB7XG4gICAgICBjb25zdCBidXR0b24gPSBlLnRhcmdldCBhcyBIVE1MQnV0dG9uRWxlbWVudFxuICAgICAgY29uc3QgbmF2TEkgPSBidXR0b24uY2xvc2VzdCgnbGknKVxuICAgICAgbmF2TEk/LmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKVxuICAgIH1cbiAgfSlcblxuICBzZXR1cFNpZGViYXJUb2dnbGUoKVxuXG4gIGNyZWF0ZUNvbmZpZ0Ryb3Bkb3duKHNhbmRib3gsIG1vbmFjbylcbiAgdXBkYXRlQ29uZmlnRHJvcGRvd25Gb3JDb21waWxlck9wdGlvbnMoc2FuZGJveCwgbW9uYWNvKVxuXG4gIC8vIFN1cHBvcnQgZ3JhYmJpbmcgZXhhbXBsZXMgZnJvbSB0aGUgbG9jYXRpb24gaGFzaFxuICBpZiAobG9jYXRpb24uaGFzaC5zdGFydHNXaXRoKCcjZXhhbXBsZScpKSB7XG4gICAgY29uc3QgZXhhbXBsZU5hbWUgPSBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyNleGFtcGxlLycsICcnKS50cmltKClcbiAgICBzYW5kYm94LmNvbmZpZy5sb2dnZXIubG9nKCdMb2FkaW5nIGV4YW1wbGU6JywgZXhhbXBsZU5hbWUpXG4gICAgZ2V0RXhhbXBsZVNvdXJjZUNvZGUoY29uZmlnLnByZWZpeCwgY29uZmlnLmxhbmcsIGV4YW1wbGVOYW1lKS50aGVuKGV4ID0+IHtcbiAgICAgIGlmIChleC5leGFtcGxlICYmIGV4LmNvZGUpIHtcbiAgICAgICAgY29uc3QgeyBleGFtcGxlLCBjb2RlIH0gPSBleFxuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbG9jYWxzdG9yYWdlIHNob3dpbmcgdGhhdCB5b3UndmUgc2VlbiB0aGlzIHBhZ2VcbiAgICAgICAgaWYgKGxvY2FsU3RvcmFnZSkge1xuICAgICAgICAgIGNvbnN0IHNlZW5UZXh0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2V4YW1wbGVzLXNlZW4nKSB8fCAne30nXG4gICAgICAgICAgY29uc3Qgc2VlbiA9IEpTT04ucGFyc2Uoc2VlblRleHQpXG4gICAgICAgICAgc2VlbltleGFtcGxlLmlkXSA9IGV4YW1wbGUuaGFzaFxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdleGFtcGxlcy1zZWVuJywgSlNPTi5zdHJpbmdpZnkoc2VlbikpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgdGhlIG1lbnUgdG8gYmUgdGhlIHNhbWUgc2VjdGlvbiBhcyB0aGlzIGN1cnJlbnQgZXhhbXBsZVxuICAgICAgICAvLyB0aGlzIGhhcHBlbnMgYmVoaW5kIHRoZSBzY2VuZSBhbmQgaXNuJ3QgdmlzaWJsZSB0aWxsIHlvdSBob3ZlclxuICAgICAgICAvLyBjb25zdCBzZWN0aW9uVGl0bGUgPSBleGFtcGxlLnBhdGhbMF1cbiAgICAgICAgLy8gY29uc3QgYWxsU2VjdGlvblRpdGxlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NlY3Rpb24tbmFtZScpXG4gICAgICAgIC8vIGZvciAoY29uc3QgdGl0bGUgb2YgYWxsU2VjdGlvblRpdGxlcykge1xuICAgICAgICAvLyAgIGlmICh0aXRsZS50ZXh0Q29udGVudCA9PT0gc2VjdGlvblRpdGxlKSB7XG4gICAgICAgIC8vICAgICB0aXRsZS5vbmNsaWNrKHt9KVxuICAgICAgICAvLyAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGNvbnN0IGFsbExpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnZXhhbXBsZS1saW5rJylcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgYWxsTGlua3MpIHtcbiAgICAgICAgICBpZiAobGluay50ZXh0Q29udGVudCA9PT0gZXhhbXBsZS50aXRsZSkge1xuICAgICAgICAgICAgbGluay5jbGFzc0xpc3QuYWRkKCdoaWdobGlnaHQnKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gJ1R5cGVTY3JpcHQgUGxheWdyb3VuZCAtICcgKyBleGFtcGxlLnRpdGxlXG4gICAgICAgIHNhbmRib3guc2V0VGV4dChjb2RlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2FuZGJveC5zZXRUZXh0KCcvLyBUaGVyZSB3YXMgYW4gaXNzdWUgZ2V0dGluZyB0aGUgZXhhbXBsZSwgYmFkIFVSTD8gQ2hlY2sgdGhlIGNvbnNvbGUgaW4gdGhlIGRldmVsb3BlciB0b29scycpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8vIFNldHMgdXAgYSB3YXkgdG8gY2xpY2sgYmV0d2VlbiBleGFtcGxlc1xuICBtb25hY28ubGFuZ3VhZ2VzLnJlZ2lzdGVyTGlua1Byb3ZpZGVyKHNhbmRib3gubGFuZ3VhZ2UsIG5ldyBFeGFtcGxlSGlnaGxpZ2h0ZXIoKSlcblxuICBjb25zdCBsYW5ndWFnZVNlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhbmd1YWdlLXNlbGVjdG9yJykhIGFzIEhUTUxTZWxlY3RFbGVtZW50XG4gIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKVxuICBsYW5ndWFnZVNlbGVjdG9yLm9wdGlvbnMuc2VsZWN0ZWRJbmRleCA9IHBhcmFtcy5nZXQoJ3VzZUphdmFTY3JpcHQnKSA/IDEgOiAwXG5cbiAgbGFuZ3VhZ2VTZWxlY3Rvci5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICBjb25zdCB1c2VKYXZhU2NyaXB0ID0gbGFuZ3VhZ2VTZWxlY3Rvci52YWx1ZSA9PT0gJ0phdmFTY3JpcHQnXG4gICAgY29uc3QgcXVlcnkgPSBzYW5kYm94LmdldFVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyhzYW5kYm94LCB7IHVzZUphdmFTY3JpcHQ6IHVzZUphdmFTY3JpcHQgPyB0cnVlIDogdW5kZWZpbmVkIH0pXG4gICAgY29uc3QgZnVsbFVSTCA9IGAke2RvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sfS8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fSR7ZG9jdW1lbnQubG9jYXRpb24ucGF0aG5hbWV9JHtxdWVyeX1gXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGRvY3VtZW50LmxvY2F0aW9uID0gZnVsbFVSTFxuICB9XG5cbiAgY29uc3QgdWkgPSBjcmVhdGVVSSgpXG4gIGNvbnN0IGV4cG9ydGVyID0gY3JlYXRlRXhwb3J0ZXIoc2FuZGJveCwgbW9uYWNvLCB1aSlcblxuICBjb25zdCBwbGF5Z3JvdW5kID0ge1xuICAgIGV4cG9ydGVyLFxuICAgIHVpLFxuICAgIHJlZ2lzdGVyUGx1Z2luLFxuICB9XG5cbiAgd2luZG93LnRzID0gc2FuZGJveC50c1xuICB3aW5kb3cuc2FuZGJveCA9IHNhbmRib3hcbiAgd2luZG93LnBsYXlncm91bmQgPSBwbGF5Z3JvdW5kXG5cbiAgY29uc29sZS5sb2coYFVzaW5nIFR5cGVTY3JpcHQgJHt3aW5kb3cudHMudmVyc2lvbn1gKVxuXG4gIGNvbnNvbGUubG9nKCdBdmFpbGFibGUgZ2xvYmFsczonKVxuICBjb25zb2xlLmxvZygnXFx0d2luZG93LnRzJywgd2luZG93LnRzKVxuICBjb25zb2xlLmxvZygnXFx0d2luZG93LnNhbmRib3gnLCB3aW5kb3cuc2FuZGJveClcbiAgY29uc29sZS5sb2coJ1xcdHdpbmRvdy5wbGF5Z3JvdW5kJywgd2luZG93LnBsYXlncm91bmQpXG5cbiAgLy8gRGV2IG1vZGUgcGx1Z2luXG4gIGlmIChhbGxvd0Nvbm5lY3RpbmdUb0xvY2FsaG9zdCgpKSB7XG4gICAgd2luZG93LmV4cG9ydHMgPSB7fVxuICAgIGNvbnNvbGUubG9nKCdDb25uZWN0aW5nIHRvIGRldiBwbHVnaW4nKVxuICAgIHRyeSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBjb25zdCByZSA9IHdpbmRvdy5yZXF1aXJlXG4gICAgICByZShbJ2xvY2FsL2luZGV4J10sIChkZXZQbHVnaW46IGFueSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnU2V0IHVwIGRldiBwbHVnaW4gZnJvbSBsb2NhbGhvc3Q6NTAwMCcpXG4gICAgICAgIGNvbnNvbGUubG9nKGRldlBsdWdpbilcbiAgICAgICAgcGxheWdyb3VuZC5yZWdpc3RlclBsdWdpbihkZXZQbHVnaW4pXG5cbiAgICAgICAgLy8gQXV0by1zZWxlY3QgdGhlIGRldiBwbHVnaW5cbiAgICAgICAgYWN0aXZhdGVQbHVnaW4oZGV2UGx1Z2luLCBjdXJyZW50UGx1Z2luKCksIHNhbmRib3gsIHRhYkJhciwgY29udGFpbmVyKVxuICAgICAgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignUHJvYmxlbSBsb2FkaW5nIHVwIHRoZSBkZXYgcGx1Z2luJylcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgYWN0aXZlUGx1Z2lucygpLmZvckVhY2gocGx1Z2luID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgcmUgPSB3aW5kb3cucmVxdWlyZVxuICAgICAgcmUoW2B1bnBrZy8ke3BsdWdpbi5tb2R1bGV9QGxhdGVzdC9kaXN0L2luZGV4YF0sIChkZXZQbHVnaW46IFBsYXlncm91bmRQbHVnaW4pID0+IHtcbiAgICAgICAgcGxheWdyb3VuZC5yZWdpc3RlclBsdWdpbihkZXZQbHVnaW4pXG5cbiAgICAgICAgLy8gQXV0by1zZWxlY3QgdGhlIGRldiBwbHVnaW5cbiAgICAgICAgaWYgKGRldlBsdWdpbi5zaG91bGRCZVNlbGVjdGVkICYmIGRldlBsdWdpbi5zaG91bGRCZVNlbGVjdGVkKCkpIHtcbiAgICAgICAgICBhY3RpdmF0ZVBsdWdpbihkZXZQbHVnaW4sIGN1cnJlbnRQbHVnaW4oKSwgc2FuZGJveCwgdGFiQmFyLCBjb250YWluZXIpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1Byb2JsZW0gbG9hZGluZyB1cCB0aGUgcGx1Z2luOicsIHBsdWdpbilcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgfVxuICB9KVxuXG4gIGlmIChsb2NhdGlvbi5oYXNoLnN0YXJ0c1dpdGgoJyNzaG93LWV4YW1wbGVzJykpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdleGFtcGxlcy1idXR0b24nKT8uY2xpY2soKVxuICAgIH0sIDEwMClcbiAgfVxuXG4gIGlmIChsb2NhdGlvbi5oYXNoLnN0YXJ0c1dpdGgoJyNzaG93LXdoYXRpc25ldycpKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2hhdGlzbmV3LWJ1dHRvbicpPy5jbGljaygpXG4gICAgfSwgMTAwKVxuICB9XG5cbiAgcmV0dXJuIHBsYXlncm91bmRcbn1cblxuZXhwb3J0IHR5cGUgUGxheWdyb3VuZCA9IFJldHVyblR5cGU8dHlwZW9mIHNldHVwUGxheWdyb3VuZD5cbiJdfQ==
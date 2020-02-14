define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const pluginRegistry = [
        {
            module: 'typescript-playground-presentation-mode',
            display: 'Presentation Mode',
            blurb: 'Create presentations inside the TypeScript playground, seamlessly jump between slides and live-code.',
            repo: 'https://github.com/orta/playground-slides/#README',
            author: {
                name: 'Orta',
                href: 'https://orta.io',
            },
        },
    ];
    /** Whether the playground should actively reach out to an existing plugin */
    exports.allowConnectingToLocalhost = () => {
        return !!localStorage.getItem('compiler-setting-connect-dev-plugin');
    };
    exports.activePlugins = () => {
        const existing = customPlugins().map(module => ({ module }));
        return existing.concat(pluginRegistry.filter(p => !!localStorage.getItem('plugin-' + p.module)));
    };
    const removeCustomPlugins = (mod) => {
        const newPlugins = customPlugins().filter(p => p !== mod);
        localStorage.setItem('custom-plugins-playground', JSON.stringify(newPlugins));
    };
    const addCustomPlugin = (mod) => {
        const newPlugins = customPlugins();
        newPlugins.push(mod);
        localStorage.setItem('custom-plugins-playground', JSON.stringify(newPlugins));
        // @ts-ignore
        window.appInsights &&
            // @ts-ignore
            window.appInsights.trackEvent({ name: 'Added Custom Module', properties: { id: mod } });
    };
    const customPlugins = () => {
        return JSON.parse(localStorage.getItem('custom-plugins-playground') || '[]');
    };
    exports.optionsPlugin = i => {
        const settings = [
            {
                display: i('play_sidebar_options_disable_ata'),
                blurb: i('play_sidebar_options_disable_ata_copy'),
                flag: 'disable-ata',
            },
            {
                display: i('play_sidebar_options_disable_save'),
                blurb: i('play_sidebar_options_disable_save_copy'),
                flag: 'disable-save-on-type',
            },
        ];
        const plugin = {
            id: 'options',
            displayName: i('play_sidebar_options'),
            // shouldBeSelected: () => true, // uncomment to make this the first tab on reloads
            willMount: (_sandbox, container) => {
                const categoryDiv = document.createElement('div');
                container.appendChild(categoryDiv);
                const p = document.createElement('p');
                p.id = 'restart-required';
                p.textContent = i('play_sidebar_options_restart_required');
                categoryDiv.appendChild(p);
                const ol = document.createElement('ol');
                ol.className = 'playground-options';
                createSection(i('play_sidebar_options'), categoryDiv);
                settings.forEach(setting => {
                    const settingButton = createButton(setting);
                    ol.appendChild(settingButton);
                });
                categoryDiv.appendChild(ol);
                createSection(i('play_sidebar_options_external'), categoryDiv);
                const pluginsOL = document.createElement('ol');
                pluginsOL.className = 'playground-plugins';
                pluginRegistry.forEach(plugin => {
                    const settingButton = createPlugin(plugin);
                    pluginsOL.appendChild(settingButton);
                });
                categoryDiv.appendChild(pluginsOL);
                const warning = document.createElement('p');
                warning.className = 'warning';
                warning.textContent = i('play_sidebar_options_external_warning');
                categoryDiv.appendChild(warning);
                createSection(i('play_sidebar_options_modules'), categoryDiv);
                const customModulesOL = document.createElement('ol');
                customModulesOL.className = 'custom-modules';
                const updateCustomModules = () => {
                    while (customModulesOL.firstChild) {
                        customModulesOL.removeChild(customModulesOL.firstChild);
                    }
                    customPlugins().forEach(module => {
                        const li = document.createElement('li');
                        li.innerHTML = module;
                        const a = document.createElement('a');
                        a.href = '#';
                        a.textContent = 'X';
                        a.onclick = () => {
                            removeCustomPlugins(module);
                            updateCustomModules();
                            announceWeNeedARestart();
                            return false;
                        };
                        li.appendChild(a);
                        customModulesOL.appendChild(li);
                    });
                };
                updateCustomModules();
                categoryDiv.appendChild(customModulesOL);
                const inputForm = createNewModuleInputForm(updateCustomModules, i);
                categoryDiv.appendChild(inputForm);
                createSection('Plugin Dev', categoryDiv);
                const pluginsDevOL = document.createElement('ol');
                pluginsDevOL.className = 'playground-options';
                const connectToDev = createButton({
                    display: i('play_sidebar_options_plugin_dev_option'),
                    blurb: i('play_sidebar_options_plugin_dev_copy'),
                    flag: 'connect-dev-plugin',
                });
                pluginsDevOL.appendChild(connectToDev);
                categoryDiv.appendChild(pluginsDevOL);
            },
        };
        return plugin;
    };
    const announceWeNeedARestart = () => {
        document.getElementById('restart-required').style.display = 'block';
    };
    const createSection = (title, container) => {
        const pluginDevTitle = document.createElement('h4');
        pluginDevTitle.textContent = title;
        container.appendChild(pluginDevTitle);
    };
    const createPlugin = (plugin) => {
        const li = document.createElement('li');
        const div = document.createElement('div');
        const label = document.createElement('label');
        const top = `<span>${plugin.display}</span> by <a href='${plugin.author.href}'>${plugin.author.name}</a><br/>${plugin.blurb}`;
        const bottom = `<a href='https://www.npmjs.com/package${plugin.module}'>npm</a> | <a href="${plugin.repo}">repo</a>`;
        label.innerHTML = `${top}<br/>${bottom}`;
        const key = 'plugin-' + plugin.module;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = key;
        input.checked = !!localStorage.getItem(key);
        input.onchange = () => {
            announceWeNeedARestart();
            if (input.checked) {
                // @ts-ignore
                window.appInsights &&
                    // @ts-ignore
                    window.appInsights.trackEvent({ name: 'Added Registry Plugin', properties: { id: key } });
                localStorage.setItem(key, 'true');
            }
            else {
                localStorage.removeItem(key);
            }
        };
        label.htmlFor = input.id;
        div.appendChild(input);
        div.appendChild(label);
        li.appendChild(div);
        return li;
    };
    const createButton = (setting) => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.innerHTML = `<span>${setting.display}</span><br/>${setting.blurb}`;
        const key = 'compiler-setting-' + setting.flag;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = key;
        input.checked = !!localStorage.getItem(key);
        input.onchange = () => {
            if (input.checked) {
                localStorage.setItem(key, 'true');
            }
            else {
                localStorage.removeItem(key);
            }
        };
        label.htmlFor = input.id;
        li.appendChild(input);
        li.appendChild(label);
        return li;
    };
    const createNewModuleInputForm = (updateOL, i) => {
        const form = document.createElement('form');
        const newModuleInput = document.createElement('input');
        newModuleInput.type = 'text';
        newModuleInput.id = 'gist-input';
        newModuleInput.placeholder = i('play_sidebar_options_modules_placeholder');
        form.appendChild(newModuleInput);
        form.onsubmit = e => {
            announceWeNeedARestart();
            addCustomPlugin(newModuleInput.value);
            e.stopPropagation();
            updateOL();
            return false;
        };
        return form;
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL3NpZGViYXIvb3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFFQSxNQUFNLGNBQWMsR0FBRztRQUNyQjtZQUNFLE1BQU0sRUFBRSx5Q0FBeUM7WUFDakQsT0FBTyxFQUFFLG1CQUFtQjtZQUM1QixLQUFLLEVBQUUsc0dBQXNHO1lBQzdHLElBQUksRUFBRSxtREFBbUQ7WUFDekQsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxpQkFBaUI7YUFDeEI7U0FDRjtLQUNGLENBQUE7SUFFRCw2RUFBNkU7SUFDaEUsUUFBQSwwQkFBMEIsR0FBRyxHQUFHLEVBQUU7UUFDN0MsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO0lBQ3RFLENBQUMsQ0FBQTtJQUVZLFFBQUEsYUFBYSxHQUFHLEdBQUcsRUFBRTtRQUNoQyxNQUFNLFFBQVEsR0FBRyxhQUFhLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzVELE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDbEcsQ0FBQyxDQUFBO0lBRUQsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFO1FBQzFDLE1BQU0sVUFBVSxHQUFHLGFBQWEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUN6RCxZQUFZLENBQUMsT0FB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QWMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLDBDQUEwQyxDQUFDLENBQUE7UUFDMUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQTtRQUVoQyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ2xCLHNCQUFzQixFQUFFLENBQUE7WUFDeEIsZUFBZSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNyQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUE7WUFDbkIsUUFBUSxFQUFFLENBQUE7WUFDVixPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUMsQ0FBQTtRQUVELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGxheWdyb3VuZFBsdWdpbiwgUGx1Z2luRmFjdG9yeSB9IGZyb20gJy4uJ1xuXG5jb25zdCBwbHVnaW5SZWdpc3RyeSA9IFtcbiAge1xuICAgIG1vZHVsZTogJ3R5cGVzY3JpcHQtcGxheWdyb3VuZC1wcmVzZW50YXRpb24tbW9kZScsXG4gICAgZGlzcGxheTogJ1ByZXNlbnRhdGlvbiBNb2RlJyxcbiAgICBibHVyYjogJ0NyZWF0ZSBwcmVzZW50YXRpb25zIGluc2lkZSB0aGUgVHlwZVNjcmlwdCBwbGF5Z3JvdW5kLCBzZWFtbGVzc2x5IGp1bXAgYmV0d2VlbiBzbGlkZXMgYW5kIGxpdmUtY29kZS4nLFxuICAgIHJlcG86ICdodHRwczovL2dpdGh1Yi5jb20vb3J0YS9wbGF5Z3JvdW5kLXNsaWRlcy8jUkVBRE1FJyxcbiAgICBhdXRob3I6IHtcbiAgICAgIG5hbWU6ICdPcnRhJyxcbiAgICAgIGhyZWY6ICdodHRwczovL29ydGEuaW8nLFxuICAgIH0sXG4gIH0sXG5dXG5cbi8qKiBXaGV0aGVyIHRoZSBwbGF5Z3JvdW5kIHNob3VsZCBhY3RpdmVseSByZWFjaCBvdXQgdG8gYW4gZXhpc3RpbmcgcGx1Z2luICovXG5leHBvcnQgY29uc3QgYWxsb3dDb25uZWN0aW5nVG9Mb2NhbGhvc3QgPSAoKSA9PiB7XG4gIHJldHVybiAhIWxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjb21waWxlci1zZXR0aW5nLWNvbm5lY3QtZGV2LXBsdWdpbicpXG59XG5cbmV4cG9ydCBjb25zdCBhY3RpdmVQbHVnaW5zID0gKCkgPT4ge1xuICBjb25zdCBleGlzdGluZyA9IGN1c3RvbVBsdWdpbnMoKS5tYXAobW9kdWxlID0+ICh7IG1vZHVsZSB9KSlcbiAgcmV0dXJuIGV4aXN0aW5nLmNvbmNhdChwbHVnaW5SZWdpc3RyeS5maWx0ZXIocCA9PiAhIWxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwbHVnaW4tJyArIHAubW9kdWxlKSkpXG59XG5cbmNvbnN0IHJlbW92ZUN1c3RvbVBsdWdpbnMgPSAobW9kOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgbmV3UGx1Z2lucyA9IGN1c3RvbVBsdWdpbnMoKS5maWx0ZXIocCA9PiBwICE9PSBtb2QpXG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjdXN0b20tcGx1Z2lucy1wbGF5Z3JvdW5kJywgSlNPTi5zdHJpbmdpZnkobmV3UGx1Z2lucykpXG59XG5cbmNvbnN0IGFkZEN1c3RvbVBsdWdpbiA9IChtb2Q6IHN0cmluZykgPT4ge1xuICBjb25zdCBuZXdQbHVnaW5zID0gY3VzdG9tUGx1Z2lucygpXG4gIG5ld1BsdWdpbnMucHVzaChtb2QpXG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjdXN0b20tcGx1Z2lucy1wbGF5Z3JvdW5kJywgSlNPTi5zdHJpbmdpZnkobmV3UGx1Z2lucykpXG4gIC8vIEB0cy1pZ25vcmVcbiAgd2luZG93LmFwcEluc2lnaHRzICYmXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHdpbmRvdy5hcHBJbnNpZ2h0cy50cmFja0V2ZW50KHsgbmFtZTogJ0FkZGVkIEN1c3RvbSBNb2R1bGUnLCBwcm9wZXJ0aWVzOiB7IGlkOiBtb2QgfSB9KVxufVxuXG5jb25zdCBjdXN0b21QbHVnaW5zID0gKCk6IHN0cmluZ1tdID0+IHtcbiAgcmV0dXJuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2N1c3RvbS1wbHVnaW5zLXBsYXlncm91bmQnKSB8fCAnW10nKVxufVxuXG5leHBvcnQgY29uc3Qgb3B0aW9uc1BsdWdpbjogUGx1Z2luRmFjdG9yeSA9IGkgPT4ge1xuICBjb25zdCBzZXR0aW5ncyA9IFtcbiAgICB7XG4gICAgICBkaXNwbGF5OiBpKCdwbGF5X3NpZGViYXJfb3B0aW9uc19kaXNhYmxlX2F0YScpLFxuICAgICAgYmx1cmI6IGkoJ3BsYXlfc2lkZWJhcl9vcHRpb25zX2Rpc2FibGVfYXRhX2NvcHknKSxcbiAgICAgIGZsYWc6ICdkaXNhYmxlLWF0YScsXG4gICAgfSxcbiAgICB7XG4gICAgICBkaXNwbGF5OiBpKCdwbGF5X3NpZGViYXJfb3B0aW9uc19kaXNhYmxlX3NhdmUnKSxcbiAgICAgIGJsdXJiOiBpKCdwbGF5X3NpZGViYXJfb3B0aW9uc19kaXNhYmxlX3NhdmVfY29weScpLFxuICAgICAgZmxhZzogJ2Rpc2FibGUtc2F2ZS1vbi10eXBlJyxcbiAgICB9LFxuICAgIC8vIHtcbiAgICAvLyAgIGRpc3BsYXk6ICdWZXJib3NlIExvZ2dpbmcnLFxuICAgIC8vICAgYmx1cmI6ICdUdXJuIG9uIHN1cGVyZmx1b3VzIGxvZ2dpbmcnLFxuICAgIC8vICAgZmxhZzogJ2VuYWJsZS1zdXBlcmZsdW91cy1sb2dnaW5nJyxcbiAgICAvLyB9LFxuICBdXG5cbiAgY29uc3QgcGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luID0ge1xuICAgIGlkOiAnb3B0aW9ucycsXG4gICAgZGlzcGxheU5hbWU6IGkoJ3BsYXlfc2lkZWJhcl9vcHRpb25zJyksXG4gICAgLy8gc2hvdWxkQmVTZWxlY3RlZDogKCkgPT4gdHJ1ZSwgLy8gdW5jb21tZW50IHRvIG1ha2UgdGhpcyB0aGUgZmlyc3QgdGFiIG9uIHJlbG9hZHNcbiAgICB3aWxsTW91bnQ6IChfc2FuZGJveCwgY29udGFpbmVyKSA9PiB7XG4gICAgICBjb25zdCBjYXRlZ29yeURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2F0ZWdvcnlEaXYpXG5cbiAgICAgIGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJylcbiAgICAgIHAuaWQgPSAncmVzdGFydC1yZXF1aXJlZCdcbiAgICAgIHAudGV4dENvbnRlbnQgPSBpKCdwbGF5X3NpZGViYXJfb3B0aW9uc19yZXN0YXJ0X3JlcXVpcmVkJylcbiAgICAgIGNhdGVnb3J5RGl2LmFwcGVuZENoaWxkKHApXG5cbiAgICAgIGNvbnN0IG9sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb2wnKVxuICAgICAgb2wuY2xhc3NOYW1lID0gJ3BsYXlncm91bmQtb3B0aW9ucydcblxuICAgICAgY3JlYXRlU2VjdGlvbihpKCdwbGF5X3NpZGViYXJfb3B0aW9ucycpLCBjYXRlZ29yeURpdilcblxuICAgICAgc2V0dGluZ3MuZm9yRWFjaChzZXR0aW5nID0+IHtcbiAgICAgICAgY29uc3Qgc2V0dGluZ0J1dHRvbiA9IGNyZWF0ZUJ1dHRvbihzZXR0aW5nKVxuICAgICAgICBvbC5hcHBlbmRDaGlsZChzZXR0aW5nQnV0dG9uKVxuICAgICAgfSlcblxuICAgICAgY2F0ZWdvcnlEaXYuYXBwZW5kQ2hpbGQob2wpXG5cbiAgICAgIGNyZWF0ZVNlY3Rpb24oaSgncGxheV9zaWRlYmFyX29wdGlvbnNfZXh0ZXJuYWwnKSwgY2F0ZWdvcnlEaXYpXG5cbiAgICAgIGNvbnN0IHBsdWdpbnNPTCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29sJylcbiAgICAgIHBsdWdpbnNPTC5jbGFzc05hbWUgPSAncGxheWdyb3VuZC1wbHVnaW5zJ1xuICAgICAgcGx1Z2luUmVnaXN0cnkuZm9yRWFjaChwbHVnaW4gPT4ge1xuICAgICAgICBjb25zdCBzZXR0aW5nQnV0dG9uID0gY3JlYXRlUGx1Z2luKHBsdWdpbilcbiAgICAgICAgcGx1Z2luc09MLmFwcGVuZENoaWxkKHNldHRpbmdCdXR0b24pXG4gICAgICB9KVxuICAgICAgY2F0ZWdvcnlEaXYuYXBwZW5kQ2hpbGQocGx1Z2luc09MKVxuXG4gICAgICBjb25zdCB3YXJuaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpXG4gICAgICB3YXJuaW5nLmNsYXNzTmFtZSA9ICd3YXJuaW5nJ1xuICAgICAgd2FybmluZy50ZXh0Q29udGVudCA9IGkoJ3BsYXlfc2lkZWJhcl9vcHRpb25zX2V4dGVybmFsX3dhcm5pbmcnKVxuICAgICAgY2F0ZWdvcnlEaXYuYXBwZW5kQ2hpbGQod2FybmluZylcblxuICAgICAgY3JlYXRlU2VjdGlvbihpKCdwbGF5X3NpZGViYXJfb3B0aW9uc19tb2R1bGVzJyksIGNhdGVnb3J5RGl2KVxuICAgICAgY29uc3QgY3VzdG9tTW9kdWxlc09MID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb2wnKVxuICAgICAgY3VzdG9tTW9kdWxlc09MLmNsYXNzTmFtZSA9ICdjdXN0b20tbW9kdWxlcydcblxuICAgICAgY29uc3QgdXBkYXRlQ3VzdG9tTW9kdWxlcyA9ICgpID0+IHtcbiAgICAgICAgd2hpbGUgKGN1c3RvbU1vZHVsZXNPTC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgY3VzdG9tTW9kdWxlc09MLnJlbW92ZUNoaWxkKGN1c3RvbU1vZHVsZXNPTC5maXJzdENoaWxkKVxuICAgICAgICB9XG4gICAgICAgIGN1c3RvbVBsdWdpbnMoKS5mb3JFYWNoKG1vZHVsZSA9PiB7XG4gICAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgICAgICAgbGkuaW5uZXJIVE1MID0gbW9kdWxlXG4gICAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICAgICAgICAgIGEuaHJlZiA9ICcjJ1xuICAgICAgICAgIGEudGV4dENvbnRlbnQgPSAnWCdcbiAgICAgICAgICBhLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICByZW1vdmVDdXN0b21QbHVnaW5zKG1vZHVsZSlcbiAgICAgICAgICAgIHVwZGF0ZUN1c3RvbU1vZHVsZXMoKVxuICAgICAgICAgICAgYW5ub3VuY2VXZU5lZWRBUmVzdGFydCgpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgICAgbGkuYXBwZW5kQ2hpbGQoYSlcblxuICAgICAgICAgIGN1c3RvbU1vZHVsZXNPTC5hcHBlbmRDaGlsZChsaSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUN1c3RvbU1vZHVsZXMoKVxuXG4gICAgICBjYXRlZ29yeURpdi5hcHBlbmRDaGlsZChjdXN0b21Nb2R1bGVzT0wpXG4gICAgICBjb25zdCBpbnB1dEZvcm0gPSBjcmVhdGVOZXdNb2R1bGVJbnB1dEZvcm0odXBkYXRlQ3VzdG9tTW9kdWxlcywgaSlcbiAgICAgIGNhdGVnb3J5RGl2LmFwcGVuZENoaWxkKGlucHV0Rm9ybSlcblxuICAgICAgY3JlYXRlU2VjdGlvbignUGx1Z2luIERldicsIGNhdGVnb3J5RGl2KVxuXG4gICAgICBjb25zdCBwbHVnaW5zRGV2T0wgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvbCcpXG4gICAgICBwbHVnaW5zRGV2T0wuY2xhc3NOYW1lID0gJ3BsYXlncm91bmQtb3B0aW9ucydcbiAgICAgIGNvbnN0IGNvbm5lY3RUb0RldiA9IGNyZWF0ZUJ1dHRvbih7XG4gICAgICAgIGRpc3BsYXk6IGkoJ3BsYXlfc2lkZWJhcl9vcHRpb25zX3BsdWdpbl9kZXZfb3B0aW9uJyksXG4gICAgICAgIGJsdXJiOiBpKCdwbGF5X3NpZGViYXJfb3B0aW9uc19wbHVnaW5fZGV2X2NvcHknKSxcbiAgICAgICAgZmxhZzogJ2Nvbm5lY3QtZGV2LXBsdWdpbicsXG4gICAgICB9KVxuICAgICAgcGx1Z2luc0Rldk9MLmFwcGVuZENoaWxkKGNvbm5lY3RUb0RldilcblxuICAgICAgY2F0ZWdvcnlEaXYuYXBwZW5kQ2hpbGQocGx1Z2luc0Rldk9MKVxuICAgIH0sXG4gIH1cblxuICByZXR1cm4gcGx1Z2luXG59XG5cbmNvbnN0IGFubm91bmNlV2VOZWVkQVJlc3RhcnQgPSAoKSA9PiB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXJ0LXJlcXVpcmVkJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG59XG5cbmNvbnN0IGNyZWF0ZVNlY3Rpb24gPSAodGl0bGU6IHN0cmluZywgY29udGFpbmVyOiBFbGVtZW50KSA9PiB7XG4gIGNvbnN0IHBsdWdpbkRldlRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDQnKVxuICBwbHVnaW5EZXZUaXRsZS50ZXh0Q29udGVudCA9IHRpdGxlXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChwbHVnaW5EZXZUaXRsZSlcbn1cblxuY29uc3QgY3JlYXRlUGx1Z2luID0gKHBsdWdpbjogdHlwZW9mIHBsdWdpblJlZ2lzdHJ5WzBdKSA9PiB7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKVxuICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXG4gIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKVxuXG4gIGNvbnN0IHRvcCA9IGA8c3Bhbj4ke3BsdWdpbi5kaXNwbGF5fTwvc3Bhbj4gYnkgPGEgaHJlZj0nJHtwbHVnaW4uYXV0aG9yLmhyZWZ9Jz4ke3BsdWdpbi5hdXRob3IubmFtZX08L2E+PGJyLz4ke3BsdWdpbi5ibHVyYn1gXG4gIGNvbnN0IGJvdHRvbSA9IGA8YSBocmVmPSdodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZSR7cGx1Z2luLm1vZHVsZX0nPm5wbTwvYT4gfCA8YSBocmVmPVwiJHtwbHVnaW4ucmVwb31cIj5yZXBvPC9hPmBcbiAgbGFiZWwuaW5uZXJIVE1MID0gYCR7dG9wfTxici8+JHtib3R0b219YFxuXG4gIGNvbnN0IGtleSA9ICdwbHVnaW4tJyArIHBsdWdpbi5tb2R1bGVcbiAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpXG4gIGlucHV0LnR5cGUgPSAnY2hlY2tib3gnXG4gIGlucHV0LmlkID0ga2V5XG4gIGlucHV0LmNoZWNrZWQgPSAhIWxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSlcblxuICBpbnB1dC5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICBhbm5vdW5jZVdlTmVlZEFSZXN0YXJ0KClcbiAgICBpZiAoaW5wdXQuY2hlY2tlZCkge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgd2luZG93LmFwcEluc2lnaHRzICYmXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgd2luZG93LmFwcEluc2lnaHRzLnRyYWNrRXZlbnQoeyBuYW1lOiAnQWRkZWQgUmVnaXN0cnkgUGx1Z2luJywgcHJvcGVydGllczogeyBpZDoga2V5IH0gfSlcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgJ3RydWUnKVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpXG4gICAgfVxuICB9XG5cbiAgbGFiZWwuaHRtbEZvciA9IGlucHV0LmlkXG5cbiAgZGl2LmFwcGVuZENoaWxkKGlucHV0KVxuICBkaXYuYXBwZW5kQ2hpbGQobGFiZWwpXG4gIGxpLmFwcGVuZENoaWxkKGRpdilcbiAgcmV0dXJuIGxpXG59XG5cbmNvbnN0IGNyZWF0ZUJ1dHRvbiA9IChzZXR0aW5nOiB7IGJsdXJiOiBzdHJpbmc7IGZsYWc6IHN0cmluZzsgZGlzcGxheTogc3RyaW5nIH0pID0+IHtcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKVxuICBsYWJlbC5pbm5lckhUTUwgPSBgPHNwYW4+JHtzZXR0aW5nLmRpc3BsYXl9PC9zcGFuPjxici8+JHtzZXR0aW5nLmJsdXJifWBcblxuICBjb25zdCBrZXkgPSAnY29tcGlsZXItc2V0dGluZy0nICsgc2V0dGluZy5mbGFnXG4gIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKVxuICBpbnB1dC50eXBlID0gJ2NoZWNrYm94J1xuICBpbnB1dC5pZCA9IGtleVxuICBpbnB1dC5jaGVja2VkID0gISFsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpXG5cbiAgaW5wdXQub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgaWYgKGlucHV0LmNoZWNrZWQpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgJ3RydWUnKVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpXG4gICAgfVxuICB9XG5cbiAgbGFiZWwuaHRtbEZvciA9IGlucHV0LmlkXG5cbiAgbGkuYXBwZW5kQ2hpbGQoaW5wdXQpXG4gIGxpLmFwcGVuZENoaWxkKGxhYmVsKVxuICByZXR1cm4gbGlcbn1cblxuY29uc3QgY3JlYXRlTmV3TW9kdWxlSW5wdXRGb3JtID0gKHVwZGF0ZU9MOiBGdW5jdGlvbiwgaTogYW55KSA9PiB7XG4gIGNvbnN0IGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJylcblxuICBjb25zdCBuZXdNb2R1bGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JylcbiAgbmV3TW9kdWxlSW5wdXQudHlwZSA9ICd0ZXh0J1xuICBuZXdNb2R1bGVJbnB1dC5pZCA9ICdnaXN0LWlucHV0J1xuICBuZXdNb2R1bGVJbnB1dC5wbGFjZWhvbGRlciA9IGkoJ3BsYXlfc2lkZWJhcl9vcHRpb25zX21vZHVsZXNfcGxhY2Vob2xkZXInKVxuICBmb3JtLmFwcGVuZENoaWxkKG5ld01vZHVsZUlucHV0KVxuXG4gIGZvcm0ub25zdWJtaXQgPSBlID0+IHtcbiAgICBhbm5vdW5jZVdlTmVlZEFSZXN0YXJ0KClcbiAgICBhZGRDdXN0b21QbHVnaW4obmV3TW9kdWxlSW5wdXQudmFsdWUpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHVwZGF0ZU9MKClcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiBmb3JtXG59XG4iXX0=
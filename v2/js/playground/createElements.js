define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDragBar = () => {
        const sidebar = document.createElement('div');
        sidebar.className = 'playground-dragbar';
        let left, right;
        const drag = (e) => {
            if (left && right) {
                // Get how far right the mouse is from the right
                const rightX = right.getBoundingClientRect().right;
                const offset = rightX - e.pageX;
                const screenClampLeft = window.innerWidth - 320;
                const clampedOffset = Math.min(Math.max(offset, 280), screenClampLeft);
                // Set the widths
                left.style.width = `calc(100% - ${clampedOffset}px)`;
                right.style.width = `${clampedOffset}px`;
                right.style.flexBasis = `${clampedOffset}px`;
                right.style.maxWidth = `${clampedOffset}px`;
                // Save the x coordinate of the
                if (window.localStorage) {
                    window.localStorage.setItem('dragbar-x', '' + clampedOffset);
                    window.localStorage.setItem('dragbar-window-width', '' + window.innerWidth);
                }
                // Don't allow selection
                e.stopPropagation();
                e.cancelBubble = true;
            }
        };
        sidebar.addEventListener('mousedown', e => {
            var _a;
            left = document.getElementById('editor-container');
            right = (_a = sidebar.parentElement) === null || _a === void 0 ? void 0 : _a.getElementsByClassName('playground-sidebar').item(0);
            // Handle dragging all over the screen
            document.addEventListener('mousemove', drag);
            // Remove it when you lt go anywhere
            document.addEventListener('mouseup', () => {
                document.removeEventListener('mousemove', drag);
                document.body.style.userSelect = 'auto';
            });
            // Don't allow the drag to select text accidentally
            document.body.style.userSelect = 'none';
            e.stopPropagation();
            e.cancelBubble = true;
        });
        return sidebar;
    };
    exports.sidebarHidden = () => !!window.localStorage.getItem('sidebar-hidden');
    exports.createSidebar = () => {
        const sidebar = document.createElement('div');
        sidebar.className = 'playground-sidebar';
        // This is independent of the sizing below so that you keep the same sized sidebar
        if (exports.sidebarHidden()) {
            sidebar.style.display = 'none';
        }
        if (window.localStorage && window.localStorage.getItem('dragbar-x')) {
            // Don't restore the x pos if the window isn't the same size
            if (window.innerWidth === Number(window.localStorage.getItem('dragbar-window-width'))) {
                // Set the dragger to the previous x pos
                const width = window.localStorage.getItem('dragbar-x');
                sidebar.style.width = `${width}px`;
                sidebar.style.flexBasis = `${width}px`;
                sidebar.style.maxWidth = `${width}px`;
                const left = document.getElementById('editor-container');
                left.style.width = `calc(100% - ${width}px)`;
            }
        }
        return sidebar;
    };
    exports.createTabBar = () => {
        const tabBar = document.createElement('div');
        tabBar.classList.add('playground-plugin-tabview');
        return tabBar;
    };
    exports.createPluginContainer = () => {
        const container = document.createElement('div');
        container.classList.add('playground-plugin-container');
        return container;
    };
    exports.createTabForPlugin = (plugin) => {
        const element = document.createElement('button');
        element.textContent = plugin.displayName;
        return element;
    };
    exports.activatePlugin = (plugin, previousPlugin, sandbox, tabBar, container) => {
        let newPluginTab, oldPluginTab;
        // @ts-ignore - This works at runtime
        for (const tab of tabBar.children) {
            if (tab.textContent === plugin.displayName)
                newPluginTab = tab;
            if (previousPlugin && tab.textContent === previousPlugin.displayName)
                oldPluginTab = tab;
        }
        // @ts-ignore
        if (!newPluginTab)
            throw new Error('Could not get a tab for the plugin: ' + plugin.displayName);
        // Tell the old plugin it's getting the boot
        // @ts-ignore
        if (previousPlugin && oldPluginTab) {
            if (previousPlugin.willUnmount)
                previousPlugin.willUnmount(sandbox, container);
            oldPluginTab.classList.remove('active');
        }
        // Wipe the sidebar
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        // Start booting up the new plugin
        newPluginTab.classList.add('active');
        // Tell the new plugin to start doing some work
        if (plugin.willMount)
            plugin.willMount(sandbox, container);
        if (plugin.modelChanged)
            plugin.modelChanged(sandbox, sandbox.getModel());
        if (plugin.modelChangedDebounce)
            plugin.modelChangedDebounce(sandbox, sandbox.getModel());
        if (plugin.didMount)
            plugin.didMount(sandbox, container);
        // Let the previous plugin do any slow work after it's all done
        if (previousPlugin && previousPlugin.didUnmount)
            previousPlugin.didUnmount(sandbox, container);
    };
    const toggleIconWhenOpen = '&#x21E5;';
    const toggleIconWhenClosed = '&#x21E4;';
    exports.setupSidebarToggle = () => {
        const toggle = document.getElementById('sidebar-toggle');
        const updateToggle = () => {
            const sidebarShowing = !exports.sidebarHidden();
            toggle.innerHTML = sidebarShowing ? toggleIconWhenOpen : toggleIconWhenClosed;
            toggle.setAttribute('aria-label', sidebarShowing ? 'Hide Sidebar' : 'Show Sidebar');
        };
        toggle.onclick = () => {
            const newState = !exports.sidebarHidden();
            const sidebar = window.document.querySelector('.playground-sidebar');
            if (newState) {
                localStorage.setItem('sidebar-hidden', 'true');
                sidebar.style.display = 'none';
            }
            else {
                localStorage.removeItem('sidebar-hidden');
                sidebar.style.display = 'block';
            }
            updateToggle();
            return false;
        };
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlRWxlbWVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9jcmVhdGVFbGVtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFJYSxRQUFBLGFBQWEsR0FBRyxHQUFHLEVBQUU7UUFDaEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM3QyxPQUFPLENBQUMsU0FBUyxHQUFHLG9CQUFvQixDQUFBO1FBRXhDLElBQUksSUFBaUIsRUFBRSxLQUFrQixDQUFBO1FBQ3pDLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBYSxFQUFFLEVBQUU7WUFDN0IsSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO2dCQUNqQixnREFBZ0Q7Z0JBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEtBQUssQ0FBQTtnQkFDbEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUE7Z0JBQy9CLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFBO2dCQUMvQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFBO2dCQUV0RSxpQkFBaUI7Z0JBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGVBQWUsYUFBYSxLQUFLLENBQUE7Z0JBQ3BELEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsYUFBYSxJQUFJLENBQUE7Z0JBQ3hDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEdBQUcsYUFBYSxJQUFJLENBQUE7Z0JBQzVDLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLEdBQUcsYUFBYSxJQUFJLENBQUE7Z0JBRTNDLCtC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QUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQbGF5Z3JvdW5kUGx1Z2luIH0gZnJvbSAnLidcblxudHlwZSBTYW5kYm94ID0gUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCd0eXBlc2NyaXB0LXNhbmRib3gnKS5jcmVhdGVUeXBlU2NyaXB0U2FuZGJveD5cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZURyYWdCYXIgPSAoKSA9PiB7XG4gIGNvbnN0IHNpZGViYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBzaWRlYmFyLmNsYXNzTmFtZSA9ICdwbGF5Z3JvdW5kLWRyYWdiYXInXG5cbiAgbGV0IGxlZnQ6IEhUTUxFbGVtZW50LCByaWdodDogSFRNTEVsZW1lbnRcbiAgY29uc3QgZHJhZyA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgaWYgKGxlZnQgJiYgcmlnaHQpIHtcbiAgICAgIC8vIEdldCBob3cgZmFyIHJpZ2h0IHRoZSBtb3VzZSBpcyBmcm9tIHRoZSByaWdodFxuICAgICAgY29uc3QgcmlnaHRYID0gcmlnaHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHRcbiAgICAgIGNvbnN0IG9mZnNldCA9IHJpZ2h0WCAtIGUucGFnZVhcbiAgICAgIGNvbnN0IHNjcmVlbkNsYW1wTGVmdCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gMzIwXG4gICAgICBjb25zdCBjbGFtcGVkT2Zmc2V0ID0gTWF0aC5taW4oTWF0aC5tYXgob2Zmc2V0LCAyODApLCBzY3JlZW5DbGFtcExlZnQpXG5cbiAgICAgIC8vIFNldCB0aGUgd2lkdGhzXG4gICAgICBsZWZ0LnN0eWxlLndpZHRoID0gYGNhbGMoMTAwJSAtICR7Y2xhbXBlZE9mZnNldH1weClgXG4gICAgICByaWdodC5zdHlsZS53aWR0aCA9IGAke2NsYW1wZWRPZmZzZXR9cHhgXG4gICAgICByaWdodC5zdHlsZS5mbGV4QmFzaXMgPSBgJHtjbGFtcGVkT2Zmc2V0fXB4YFxuICAgICAgcmlnaHQuc3R5bGUubWF4V2lkdGggPSBgJHtjbGFtcGVkT2Zmc2V0fXB4YFxuXG4gICAgICAvLyBTYXZlIHRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlXG4gICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZSkge1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2RyYWdiYXIteCcsICcnICsgY2xhbXBlZE9mZnNldClcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdkcmFnYmFyLXdpbmRvdy13aWR0aCcsICcnICsgd2luZG93LmlubmVyV2lkdGgpXG4gICAgICB9XG5cbiAgICAgIC8vIERvbid0IGFsbG93IHNlbGVjdGlvblxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlXG4gICAgfVxuICB9XG5cbiAgc2lkZWJhci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBlID0+IHtcbiAgICBsZWZ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRvci1jb250YWluZXInKSFcbiAgICByaWdodCA9IHNpZGViYXIucGFyZW50RWxlbWVudD8uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncGxheWdyb3VuZC1zaWRlYmFyJykuaXRlbSgwKSEgYXMgYW55XG4gICAgLy8gSGFuZGxlIGRyYWdnaW5nIGFsbCBvdmVyIHRoZSBzY3JlZW5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBkcmFnKVxuICAgIC8vIFJlbW92ZSBpdCB3aGVuIHlvdSBsdCBnbyBhbnl3aGVyZVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoKSA9PiB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBkcmFnKVxuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS51c2VyU2VsZWN0ID0gJ2F1dG8nXG4gICAgfSlcblxuICAgIC8vIERvbid0IGFsbG93IHRoZSBkcmFnIHRvIHNlbGVjdCB0ZXh0IGFjY2lkZW50YWxseVxuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUudXNlclNlbGVjdCA9ICdub25lJ1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBlLmNhbmNlbEJ1YmJsZSA9IHRydWVcbiAgfSlcblxuICByZXR1cm4gc2lkZWJhclxufVxuXG5leHBvcnQgY29uc3Qgc2lkZWJhckhpZGRlbiA9ICgpID0+ICEhd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzaWRlYmFyLWhpZGRlbicpXG5cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWRlYmFyID0gKCkgPT4ge1xuICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgc2lkZWJhci5jbGFzc05hbWUgPSAncGxheWdyb3VuZC1zaWRlYmFyJ1xuXG4gIC8vIFRoaXMgaXMgaW5kZXBlbmRlbnQgb2YgdGhlIHNpemluZyBiZWxvdyBzbyB0aGF0IHlvdSBrZWVwIHRoZSBzYW1lIHNpemVkIHNpZGViYXJcbiAgaWYgKHNpZGViYXJIaWRkZW4oKSkge1xuICAgIHNpZGViYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICB9XG5cbiAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UgJiYgd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkcmFnYmFyLXgnKSkge1xuICAgIC8vIERvbid0IHJlc3RvcmUgdGhlIHggcG9zIGlmIHRoZSB3aW5kb3cgaXNuJ3QgdGhlIHNhbWUgc2l6ZVxuICAgIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA9PT0gTnVtYmVyKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZHJhZ2Jhci13aW5kb3ctd2lkdGgnKSkpIHtcbiAgICAgIC8vIFNldCB0aGUgZHJhZ2dlciB0byB0aGUgcHJldmlvdXMgeCBwb3NcbiAgICAgIGNvbnN0IHdpZHRoID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkcmFnYmFyLXgnKVxuICAgICAgc2lkZWJhci5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YFxuICAgICAgc2lkZWJhci5zdHlsZS5mbGV4QmFzaXMgPSBgJHt3aWR0aH1weGBcbiAgICAgIHNpZGViYXIuc3R5bGUubWF4V2lkdGggPSBgJHt3aWR0aH1weGBcblxuICAgICAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0b3ItY29udGFpbmVyJykhXG4gICAgICBsZWZ0LnN0eWxlLndpZHRoID0gYGNhbGMoMTAwJSAtICR7d2lkdGh9cHgpYFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzaWRlYmFyXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVUYWJCYXIgPSAoKSA9PiB7XG4gIGNvbnN0IHRhYkJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIHRhYkJhci5jbGFzc0xpc3QuYWRkKCdwbGF5Z3JvdW5kLXBsdWdpbi10YWJ2aWV3JylcbiAgcmV0dXJuIHRhYkJhclxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlUGx1Z2luQ29udGFpbmVyID0gKCkgPT4ge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCgncGxheWdyb3VuZC1wbHVnaW4tY29udGFpbmVyJylcbiAgcmV0dXJuIGNvbnRhaW5lclxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVGFiRm9yUGx1Z2luID0gKHBsdWdpbjogUGxheWdyb3VuZFBsdWdpbikgPT4ge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgZWxlbWVudC50ZXh0Q29udGVudCA9IHBsdWdpbi5kaXNwbGF5TmFtZVxuICByZXR1cm4gZWxlbWVudFxufVxuXG5leHBvcnQgY29uc3QgYWN0aXZhdGVQbHVnaW4gPSAoXG4gIHBsdWdpbjogUGxheWdyb3VuZFBsdWdpbixcbiAgcHJldmlvdXNQbHVnaW46IFBsYXlncm91bmRQbHVnaW4gfCB1bmRlZmluZWQsXG4gIHNhbmRib3g6IFNhbmRib3gsXG4gIHRhYkJhcjogSFRNTERpdkVsZW1lbnQsXG4gIGNvbnRhaW5lcjogSFRNTERpdkVsZW1lbnRcbikgPT4ge1xuICBsZXQgbmV3UGx1Z2luVGFiOiBFbGVtZW50LCBvbGRQbHVnaW5UYWI6IEVsZW1lbnRcbiAgLy8gQHRzLWlnbm9yZSAtIFRoaXMgd29ya3MgYXQgcnVudGltZVxuICBmb3IgKGNvbnN0IHRhYiBvZiB0YWJCYXIuY2hpbGRyZW4pIHtcbiAgICBpZiAodGFiLnRleHRDb250ZW50ID09PSBwbHVnaW4uZGlzcGxheU5hbWUpIG5ld1BsdWdpblRhYiA9IHRhYlxuICAgIGlmIChwcmV2aW91c1BsdWdpbiAmJiB0YWIudGV4dENvbnRlbnQgPT09IHByZXZpb3VzUGx1Z2luLmRpc3BsYXlOYW1lKSBvbGRQbHVnaW5UYWIgPSB0YWJcbiAgfVxuXG4gIC8vIEB0cy1pZ25vcmVcbiAgaWYgKCFuZXdQbHVnaW5UYWIpIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGdldCBhIHRhYiBmb3IgdGhlIHBsdWdpbjogJyArIHBsdWdpbi5kaXNwbGF5TmFtZSlcblxuICAvLyBUZWxsIHRoZSBvbGQgcGx1Z2luIGl0J3MgZ2V0dGluZyB0aGUgYm9vdFxuICAvLyBAdHMtaWdub3JlXG4gIGlmIChwcmV2aW91c1BsdWdpbiAmJiBvbGRQbHVnaW5UYWIpIHtcbiAgICBpZiAocHJldmlvdXNQbHVnaW4ud2lsbFVubW91bnQpIHByZXZpb3VzUGx1Z2luLndpbGxVbm1vdW50KHNhbmRib3gsIGNvbnRhaW5lcilcbiAgICBvbGRQbHVnaW5UYWIuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJylcbiAgfVxuXG4gIC8vIFdpcGUgdGhlIHNpZGViYXJcbiAgd2hpbGUgKGNvbnRhaW5lci5maXJzdENoaWxkKSB7XG4gICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGNvbnRhaW5lci5maXJzdENoaWxkKVxuICB9XG5cbiAgLy8gU3RhcnQgYm9vdGluZyB1cCB0aGUgbmV3IHBsdWdpblxuICBuZXdQbHVnaW5UYWIuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJylcblxuICAvLyBUZWxsIHRoZSBuZXcgcGx1Z2luIHRvIHN0YXJ0IGRvaW5nIHNvbWUgd29ya1xuICBpZiAocGx1Z2luLndpbGxNb3VudCkgcGx1Z2luLndpbGxNb3VudChzYW5kYm94LCBjb250YWluZXIpXG4gIGlmIChwbHVnaW4ubW9kZWxDaGFuZ2VkKSBwbHVnaW4ubW9kZWxDaGFuZ2VkKHNhbmRib3gsIHNhbmRib3guZ2V0TW9kZWwoKSlcbiAgaWYgKHBsdWdpbi5tb2RlbENoYW5nZWREZWJvdW5jZSkgcGx1Z2luLm1vZGVsQ2hhbmdlZERlYm91bmNlKHNhbmRib3gsIHNhbmRib3guZ2V0TW9kZWwoKSlcbiAgaWYgKHBsdWdpbi5kaWRNb3VudCkgcGx1Z2luLmRpZE1vdW50KHNhbmRib3gsIGNvbnRhaW5lcilcblxuICAvLyBMZXQgdGhlIHByZXZpb3VzIHBsdWdpbiBkbyBhbnkgc2xvdyB3b3JrIGFmdGVyIGl0J3MgYWxsIGRvbmVcbiAgaWYgKHByZXZpb3VzUGx1Z2luICYmIHByZXZpb3VzUGx1Z2luLmRpZFVubW91bnQpIHByZXZpb3VzUGx1Z2luLmRpZFVubW91bnQoc2FuZGJveCwgY29udGFpbmVyKVxufVxuXG5jb25zdCB0b2dnbGVJY29uV2hlbk9wZW4gPSAnJiN4MjFFNTsnXG5jb25zdCB0b2dnbGVJY29uV2hlbkNsb3NlZCA9ICcmI3gyMUU0OydcblxuZXhwb3J0IGNvbnN0IHNldHVwU2lkZWJhclRvZ2dsZSA9ICgpID0+IHtcbiAgY29uc3QgdG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpZGViYXItdG9nZ2xlJykhXG5cbiAgY29uc3QgdXBkYXRlVG9nZ2xlID0gKCkgPT4ge1xuICAgIGNvbnN0IHNpZGViYXJTaG93aW5nID0gIXNpZGViYXJIaWRkZW4oKVxuICAgIHRvZ2dsZS5pbm5lckhUTUwgPSBzaWRlYmFyU2hvd2luZyA/IHRvZ2dsZUljb25XaGVuT3BlbiA6IHRvZ2dsZUljb25XaGVuQ2xvc2VkXG4gICAgdG9nZ2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIHNpZGViYXJTaG93aW5nID8gJ0hpZGUgU2lkZWJhcicgOiAnU2hvdyBTaWRlYmFyJylcbiAgfVxuXG4gIHRvZ2dsZS5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IG5ld1N0YXRlID0gIXNpZGViYXJIaWRkZW4oKVxuXG4gICAgY29uc3Qgc2lkZWJhciA9IHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGxheWdyb3VuZC1zaWRlYmFyJykgYXMgSFRNTERpdkVsZW1lbnRcbiAgICBpZiAobmV3U3RhdGUpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzaWRlYmFyLWhpZGRlbicsICd0cnVlJylcbiAgICAgIHNpZGViYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnc2lkZWJhci1oaWRkZW4nKVxuICAgICAgc2lkZWJhci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgIH1cbiAgICB1cGRhdGVUb2dnbGUoKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG4iXX0=
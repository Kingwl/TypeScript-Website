define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createUI = () => {
        return {
            flashInfo: (message) => {
                var _a;
                let flashBG = document.getElementById('flash-bg');
                if (flashBG) {
                    (_a = flashBG.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(flashBG);
                }
                flashBG = document.createElement('div');
                flashBG.id = 'flash-bg';
                const p = document.createElement('p');
                p.textContent = message;
                flashBG.appendChild(p);
                document.body.appendChild(flashBG);
                setTimeout(() => {
                    var _a, _b;
                    (_b = (_a = flashBG) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(flashBG);
                }, 1000);
            },
            showModal: (code, subtitle, links) => {
                document.querySelectorAll('.navbar-sub li.open').forEach(i => i.classList.remove('open'));
                const existingPopover = document.getElementById('popover-modal');
                if (existingPopover)
                    existingPopover.parentElement.removeChild(existingPopover);
                const modalBG = document.createElement('div');
                modalBG.id = 'popover-background';
                document.body.appendChild(modalBG);
                const modal = document.createElement('div');
                modal.id = 'popover-modal';
                if (subtitle) {
                    const titleElement = document.createElement('p');
                    titleElement.textContent = subtitle;
                    modal.appendChild(titleElement);
                }
                const pre = document.createElement('pre');
                modal.appendChild(pre);
                pre.textContent = code;
                const buttonContainer = document.createElement('div');
                const copyButton = document.createElement('button');
                copyButton.innerText = 'Copy';
                buttonContainer.appendChild(copyButton);
                const selectAllButton = document.createElement('button');
                selectAllButton.innerText = 'Select All';
                buttonContainer.appendChild(selectAllButton);
                const closeButton = document.createElement('button');
                closeButton.innerText = 'Close';
                closeButton.classList.add('close');
                modal.appendChild(closeButton);
                modal.appendChild(buttonContainer);
                if (links) {
                    Object.keys(links).forEach(name => {
                        const href = links[name];
                        const extraButton = document.createElement('button');
                        extraButton.innerText = name;
                        extraButton.onclick = () => (document.location = href);
                        buttonContainer.appendChild(extraButton);
                    });
                }
                document.body.appendChild(modal);
                const selectAll = () => {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(pre);
                    if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                };
                selectAll();
                // Keep track
                const oldOnkeyDown = document.onkeydown;
                const close = () => {
                    modalBG.parentNode.removeChild(modalBG);
                    modal.parentNode.removeChild(modal);
                    // @ts-ignore
                    document.onkeydown = oldOnkeyDown;
                };
                const copy = () => {
                    navigator.clipboard.writeText(code);
                };
                modalBG.onclick = close;
                closeButton.onclick = close;
                copyButton.onclick = copy;
                selectAllButton.onclick = selectAll;
                // Support hiding the modal via escape
                document.onkeydown = function (evt) {
                    evt = evt || window.event;
                    var isEscape = false;
                    if ('key' in evt) {
                        isEscape = evt.key === 'Escape' || evt.key === 'Esc';
                    }
                    else {
                        // @ts-ignore - this used to be the case
                        isEscape = evt.keyCode === 27;
                    }
                    if (isEscape) {
                        close();
                    }
                };
            },
        };
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlVUkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9jcmVhdGVVSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFLYSxRQUFBLFFBQVEsR0FBRyxHQUFPLEVBQUU7UUFDL0IsT0FBTztZQUNMLFNBQVMsRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFOztnQkFDN0IsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtnQkFDakQsSUFBSSxPQUFPLEVBQUU7b0JBQ1gsTUFBQSxPQUFPLENBQUMsYUFBYSwwQ0FBRSxXQUFXLENBQUMsT0FBTyxFQUFDO2lCQUM1QztnQkFFRCxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQkFDdkMsT0FBTyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUE7Z0JBRXZCLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ3JDLENBQUMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFBO2dCQUN2QixPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUN0QixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFFbEMsVUFBVSxDQUFDLEdBQUcsRUFBRTs7b0JBQ2QsWUFBQSxPQUFPLDBDQUFFLGFBQWEsMENBQUUsV0FBVyxDQUFDLE9BQU8sRUFBQztnQkFDOUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ1YsQ0FBQztZQUVELFNBQVMsRUFBRSxDQUFDLElBQVksRUFBRSxRQUFpQixFQUFFLEtBQVcsRUFBRSxFQUFFO2dCQUMxRCxRQUFRLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0s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R0FBRyxDQUFDLEdBQUcsS0FBSyxLQUFLLENBQUE7cUJBQ3JEO3lCQUFNO3dCQUNMLHdDQUF3Qzt3QkFDeEMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFBO3FCQUM5QjtvQkFDRCxJQUFJLFFBQVEsRUFBRTt3QkFDWixLQUFLLEVBQUUsQ0FBQTtxQkFDUjtnQkFDSCxDQUFDLENBQUE7WUFDSCxDQUFDO1NBQ0YsQ0FBQTtJQUNILENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBpbnRlcmZhY2UgVUkge1xuICBzaG93TW9kYWw6IChtZXNzYWdlOiBzdHJpbmcsIHN1YnRpdGxlPzogc3RyaW5nLCBidXR0b25zPzogYW55KSA9PiB2b2lkXG4gIGZsYXNoSW5mbzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVUkgPSAoKTogVUkgPT4ge1xuICByZXR1cm4ge1xuICAgIGZsYXNoSW5mbzogKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IGZsYXNoQkcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmxhc2gtYmcnKVxuICAgICAgaWYgKGZsYXNoQkcpIHtcbiAgICAgICAgZmxhc2hCRy5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChmbGFzaEJHKVxuICAgICAgfVxuXG4gICAgICBmbGFzaEJHID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGZsYXNoQkcuaWQgPSAnZmxhc2gtYmcnXG5cbiAgICAgIGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJylcbiAgICAgIHAudGV4dENvbnRlbnQgPSBtZXNzYWdlXG4gICAgICBmbGFzaEJHLmFwcGVuZENoaWxkKHApXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZsYXNoQkcpXG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBmbGFzaEJHPy5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChmbGFzaEJHKVxuICAgICAgfSwgMTAwMClcbiAgICB9LFxuXG4gICAgc2hvd01vZGFsOiAoY29kZTogc3RyaW5nLCBzdWJ0aXRsZT86IHN0cmluZywgbGlua3M/OiBhbnkpID0+IHtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5uYXZiYXItc3ViIGxpLm9wZW4nKS5mb3JFYWNoKGkgPT4gaS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJykpXG5cbiAgICAgIGNvbnN0IGV4aXN0aW5nUG9wb3ZlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwb3BvdmVyLW1vZGFsJylcbiAgICAgIGlmIChleGlzdGluZ1BvcG92ZXIpIGV4aXN0aW5nUG9wb3Zlci5wYXJlbnRFbGVtZW50IS5yZW1vdmVDaGlsZChleGlzdGluZ1BvcG92ZXIpXG5cbiAgICAgIGNvbnN0IG1vZGFsQkcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgbW9kYWxCRy5pZCA9ICdwb3BvdmVyLWJhY2tncm91bmQnXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1vZGFsQkcpXG5cbiAgICAgIGNvbnN0IG1vZGFsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIG1vZGFsLmlkID0gJ3BvcG92ZXItbW9kYWwnXG5cbiAgICAgIGlmIChzdWJ0aXRsZSkge1xuICAgICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJylcbiAgICAgICAgdGl0bGVFbGVtZW50LnRleHRDb250ZW50ID0gc3VidGl0bGVcbiAgICAgICAgbW9kYWwuYXBwZW5kQ2hpbGQodGl0bGVFbGVtZW50KVxuICAgICAgfVxuXG4gICAgICBjb25zdCBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKVxuICAgICAgbW9kYWwuYXBwZW5kQ2hpbGQocHJlKVxuICAgICAgcHJlLnRleHRDb250ZW50ID0gY29kZVxuXG4gICAgICBjb25zdCBidXR0b25Db250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXG4gICAgICBjb25zdCBjb3B5QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICAgIGNvcHlCdXR0b24uaW5uZXJUZXh0ID0gJ0NvcHknXG4gICAgICBidXR0b25Db250YWluZXIuYXBwZW5kQ2hpbGQoY29weUJ1dHRvbilcblxuICAgICAgY29uc3Qgc2VsZWN0QWxsQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICAgIHNlbGVjdEFsbEJ1dHRvbi5pbm5lclRleHQgPSAnU2VsZWN0IEFsbCdcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChzZWxlY3RBbGxCdXR0b24pXG5cbiAgICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICAgIGNsb3NlQnV0dG9uLmlubmVyVGV4dCA9ICdDbG9zZSdcbiAgICAgIGNsb3NlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2Nsb3NlJylcbiAgICAgIG1vZGFsLmFwcGVuZENoaWxkKGNsb3NlQnV0dG9uKVxuXG4gICAgICBtb2RhbC5hcHBlbmRDaGlsZChidXR0b25Db250YWluZXIpXG5cbiAgICAgIGlmIChsaW5rcykge1xuICAgICAgICBPYmplY3Qua2V5cyhsaW5rcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgICBjb25zdCBocmVmID0gbGlua3NbbmFtZV1cbiAgICAgICAgICBjb25zdCBleHRyYUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpXG4gICAgICAgICAgZXh0cmFCdXR0b24uaW5uZXJUZXh0ID0gbmFtZVxuICAgICAgICAgIGV4dHJhQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiAoZG9jdW1lbnQubG9jYXRpb24gPSBocmVmKVxuICAgICAgICAgIGJ1dHRvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChleHRyYUJ1dHRvbilcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtb2RhbClcblxuICAgICAgY29uc3Qgc2VsZWN0QWxsID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKClcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpXG4gICAgICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhwcmUpXG4gICAgICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKClcbiAgICAgICAgICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNlbGVjdEFsbCgpXG5cbiAgICAgIC8vIEtlZXAgdHJhY2tcbiAgICAgIGNvbnN0IG9sZE9ua2V5RG93biA9IGRvY3VtZW50Lm9ua2V5ZG93blxuXG4gICAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgICAgbW9kYWxCRy5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZChtb2RhbEJHKVxuICAgICAgICBtb2RhbC5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZChtb2RhbClcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkb2N1bWVudC5vbmtleWRvd24gPSBvbGRPbmtleURvd25cbiAgICAgIH1cblxuICAgICAgY29uc3QgY29weSA9ICgpID0+IHtcbiAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY29kZSlcbiAgICAgIH1cblxuICAgICAgbW9kYWxCRy5vbmNsaWNrID0gY2xvc2VcbiAgICAgIGNsb3NlQnV0dG9uLm9uY2xpY2sgPSBjbG9zZVxuICAgICAgY29weUJ1dHRvbi5vbmNsaWNrID0gY29weVxuICAgICAgc2VsZWN0QWxsQnV0dG9uLm9uY2xpY2sgPSBzZWxlY3RBbGxcblxuICAgICAgLy8gU3VwcG9ydCBoaWRpbmcgdGhlIG1vZGFsIHZpYSBlc2NhcGVcbiAgICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBldnQgPSBldnQgfHwgd2luZG93LmV2ZW50XG4gICAgICAgIHZhciBpc0VzY2FwZSA9IGZhbHNlXG4gICAgICAgIGlmICgna2V5JyBpbiBldnQpIHtcbiAgICAgICAgICBpc0VzY2FwZSA9IGV2dC5rZXkgPT09ICdFc2NhcGUnIHx8IGV2dC5rZXkgPT09ICdFc2MnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZSAtIHRoaXMgdXNlZCB0byBiZSB0aGUgY2FzZVxuICAgICAgICAgIGlzRXNjYXBlID0gZXZ0LmtleUNvZGUgPT09IDI3XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRXNjYXBlKSB7XG4gICAgICAgICAgY2xvc2UoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuIl19
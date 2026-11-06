\
(() => {
    'use strict';

    const TOOLBAR_ID = 'ui-enhancements-quick-insert';
    const TEXTAREA_SELECTOR = '#send_textarea';

    const WRAPPERS = [
        { id: 'quote', label: '""', title: 'ใส่เครื่องหมายคำพูด', open: '"', close: '"' },
        { id: 'bold', label: '**', title: 'ใส่ตัวหนา', open: '**', close: '**' },
        { id: 'ooc', label: '(OOC:)', title: 'ใส่คำสั่ง OOC', open: '(OOC: ', close: ')' }
    ];

    function getTextarea() {
        const el = document.querySelector(TEXTAREA_SELECTOR);
        return el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') ? el : null;
    }

    function insertWrapper(wrapper) {
        const textarea = getTextarea();
        if (!textarea || textarea.disabled || textarea.readOnly) return;

        textarea.focus();

        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? start;
        const value = textarea.value;
        const selected = value.slice(start, end);

        const before = value.slice(0, start);
        const after = value.slice(end);
        const replacement = wrapper.open + selected + wrapper.close;

        textarea.value = before + replacement + after;

        if (start !== end) {
            // Keep the wrapped selection selected so it can be replaced or edited immediately.
            textarea.setSelectionRange(
                start + wrapper.open.length,
                start + wrapper.open.length + selected.length
            );
        } else {
            // No selection: place the caret between the opening and closing markers.
            const caret = start + wrapper.open.length;
            textarea.setSelectionRange(caret, caret);
        }

        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = TOOLBAR_ID;
        toolbar.className = 'ui-enhancements-toolbar';
        toolbar.setAttribute('aria-label', 'Quick Insert Toolbar');

        const label = document.createElement('span');
        label.className = 'ui-enhancements-toolbar-label';
        label.textContent = 'แทรกด่วน';
        toolbar.appendChild(label);

        for (const wrapper of WRAPPERS) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ui-enhancements-button';
            button.textContent = wrapper.label;
            button.title = wrapper.title;
            button.setAttribute('aria-label', wrapper.title);
            button.addEventListener('mousedown', event => {
                // Keep the textarea selection/caret when the toolbar button receives the click.
                event.preventDefault();
            });
            button.addEventListener('click', () => insertWrapper(wrapper));
            toolbar.appendChild(button);
        }
        return toolbar;
    }

    function mountToolbar() {
        const textarea = getTextarea();
        if (!textarea) return;

        const existing = document.getElementById(TOOLBAR_ID);
        if (existing) {
            if (!existing.isConnected) existing.remove();
            else return;
        }

        const toolbar = createToolbar();

        // Place the toolbar immediately before the message input, within its existing layout.
        const anchor = textarea.closest('.text_pole') || textarea;
        anchor.parentNode.insertBefore(toolbar, anchor);
    }

    function init() {
        mountToolbar();

        const observer = new MutationObserver(() => {
            if (!document.getElementById(TOOLBAR_ID)) mountToolbar();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

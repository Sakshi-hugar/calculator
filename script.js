document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    // initialize
    display.value = '';

    function isOperator(ch) {
        return ['+', '-', '*', '/'].includes(ch);
    }
    // insert text at current caret position (replaces selection if any)
    function insertAtCursor(text) {
        const start = display.selectionStart ?? display.value.length;
        const end = display.selectionEnd ?? start;
        display.value = display.value.slice(0, start) + text + display.value.slice(end);
        const pos = start + text.length;
        display.setSelectionRange(pos, pos);
        display.focus();
    }

    window.appendNumber = function(number) {
        // prevent leading multiple zeros in a naive way (when whole value is single 0)
        if (display.value === '0' && number === '0') return;
        insertAtCursor(number);
    }

    window.appendOperator = function(operator) {
        const start = display.selectionStart ?? display.value.length;
        const end = display.selectionEnd ?? start;
        if (start === 0 && operator === '-') {
            // allow negative number at start
            insertAtCursor('-');
            return;
        }
        if (start === 0) return; // nothing to operate on

        const prev = display.value[start - 1];
        if (isOperator(prev)) {
            // replace previous operator with new one
            display.value = display.value.slice(0, start - 1) + operator + display.value.slice(end);
            const pos = start;
            display.setSelectionRange(pos, pos);
            display.focus();
        } else {
            insertAtCursor(operator);
        }
    }

    window.clearDisplay = function() {
        display.value = '';
        display.focus();
    }

    // C button: remove one character before caret (or selection), or remove trailing operator
    window.removeLastNumber = function() {
        const start = display.selectionStart ?? display.value.length;
        const end = display.selectionEnd ?? start;

        // If there's a selection, delete it
        if (start !== end) {
            display.value = display.value.slice(0, start) + display.value.slice(end);
            display.setSelectionRange(start, start);
            display.focus();
            return;
        }

        // nothing to delete
        if (start === 0) {
            display.focus();
            return;
        }

        const before = display.value[start - 1];
        if (isOperator(before)) {
            // remove the operator before caret
            display.value = display.value.slice(0, start - 1) + display.value.slice(start);
            const pos = start - 1;
            display.setSelectionRange(pos, pos);
            display.focus();
            return;
        }

        // remove a single character (last digit/char of current number)
        display.value = display.value.slice(0, start - 1) + display.value.slice(start);
        const pos = start - 1;
        display.setSelectionRange(pos, pos);
        display.focus();
    }

    window.deleteLast = function() {
        const start = display.selectionStart ?? display.value.length;
        const end = display.selectionEnd ?? start;
        if (start !== end) {
            // delete selection
            display.value = display.value.slice(0, start) + display.value.slice(end);
            display.setSelectionRange(start, start);
        } else if (start > 0) {
            // delete character before caret
            display.value = display.value.slice(0, start - 1) + display.value.slice(end);
            const pos = start - 1;
            display.setSelectionRange(pos, pos);
        }
        display.focus();
    }

    window.calculateResult = function() {
        const expr = display.value.trim();
        if (expr === '') return;
        // allow digits, operators, parentheses, decimal and spaces only
        if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
            display.value = 'Error';
            display.setSelectionRange(display.value.length, display.value.length);
            return;
        }
        try {
            const result = Function('return (' + expr + ')')();
            if (typeof result === 'number' && !Number.isFinite(result)) {
                display.value = 'Error';
                display.setSelectionRange(display.value.length, display.value.length);
                return;
            }
            if (typeof result === 'number') {
                display.value = Number.isInteger(result) ? String(result) : String(parseFloat(result.toFixed(10)).toString());
            } else {
                display.value = String(result);
            }
            // move caret to end
            const pos = display.value.length;
            display.setSelectionRange(pos, pos);
        } catch (e) {
            display.value = 'Error';
            display.setSelectionRange(display.value.length, display.value.length);
        }
        display.focus();
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        // when the display has focus allow natural editing; only handle Enter and Escape specially
        if (document.activeElement === display) {
            if (key === 'Enter') { e.preventDefault(); calculateResult(); }
            else if (key === 'Escape') { e.preventDefault(); deleteLast(); }
            // other keys should behave natively (arrow keys, backspace, typing, selection)
            return;
        }

        if ((/^[0-9]$/).test(key)) {
            appendNumber(key);
            e.preventDefault();
            return;
        }
        if (key === '.') { appendNumber('.'); e.preventDefault(); return; }
        if (['+', '-', '*', '/'].includes(key)) { appendOperator(key); e.preventDefault(); return; }
        if (key === 'Enter') { calculateResult(); e.preventDefault(); return; }
        if (key === 'Backspace') { deleteLast(); e.preventDefault(); return; }
        if (key === 'Escape') { deleteLast(); e.preventDefault(); return; }
    });

    // clicking the display focuses it (native caret placement will work)
    display.addEventListener('click', () => display.focus());
});

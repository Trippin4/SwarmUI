
class KeybindManager {
    constructor() {
        this.bindings = new Map();

        // Global event listener
        window.addEventListener('keydown', (e) => this.handleKeyEvent(e), true);
    }

    /**
     * Register a keybind
     * @param {string} settingKey - The getUserSetting key (e.g., 'keybinds.deletekeybind')
     * @param {Function} action - The function to execute
     * @param {Object} options - Optional configuration
     *   - contextCheck: Function that returns true if context is acti
     * ve (default: always true)
     *   - allowInTyping: Allow keybind while typing in input fields (default: false)
     *   - preventDefault: Prevent default browser behavior (default: true)
     */
    register(settingKey, action, options = {}) {
        this.bindings.set(settingKey, {
            action,
            contextCheck: options.contextCheck || (() => true),
            allowInTyping: options.allowInTyping || false,
            preventDefault: options.preventDefault !== false
        });
        return this;
    }

    /**
     * Handle keyboard events
     */
    handleKeyEvent(event) {
        let isTyping = this.isTypingContext(event.target);

        for (let [settingKey, binding] of this.bindings) {
            // Skip if typing and this binding doesn't allow it
            if (isTyping && !binding.allowInTyping) continue;

            // Skip if context check fails
            if (!binding.contextCheck()) continue;

            // Get the keybind string from settings
            let keybind = getUserSetting(settingKey);
            if (!keybind) continue;

            // Check if event matches the keybind
            if (this.matches(event, keybind)) {
                try {
                    binding.action(event);

                    if (binding.preventDefault) {
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    return true;
                } catch (error) {
                    console.error(`Keybind error for ${settingKey}:`, error);
                }
            }
        }

        return false;
    }

    /**
     * Check if a keyboard event matches a keybind string
     * Supports formats like: "Ctrl+Enter", "Alt+S", "Delete", "Shift+Ctrl+A"
     */
    matches(event, keybindString) {
        if (!keybindString) return false;

        let parts = keybindString.split('+');
        let expectedModifiers = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false
        };
        let expectedKey = null;

        for (let part of parts) {
            let lower = part.toLowerCase();
            if (lower === 'ctrl' || lower === 'control') {
                expectedModifiers.ctrl = true;
            }
            else if (lower === 'alt') {
                expectedModifiers.alt = true;
            }
            else if (lower === 'shift') {
                expectedModifiers.shift = true;
            }
            else if (lower === 'meta' || lower === 'cmd' || lower === 'win') {
                expectedModifiers.meta = true;
            }
            else {
                expectedKey = part;
            }
        }

        // Check if modifiers match
        if (event.ctrlKey !== expectedModifiers.ctrl ||
            event.altKey !== expectedModifiers.alt ||
            event.shiftKey !== expectedModifiers.shift ||
            event.metaKey !== expectedModifiers.meta) {
            return false;
        }

        // Check if the main key matches
        if (expectedKey) {
            let eventKey = event.key;
            if (eventKey === ' ') {
                eventKey = 'Space';
            }

            if (expectedKey.toLowerCase() === eventKey.toLowerCase()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user is typing in an input field
     */
    isTypingContext(target) {
        if (!target || !target.tagName) return false;
        let tagName = target.tagName.toLowerCase();
        return (
            tagName == 'input' ||
            tagName == 'textarea' ||
            target.isContentEditable
        );
    }
}

// Create global instance
const keybindManager = new KeybindManager();

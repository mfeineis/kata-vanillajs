(function (global, factory) {
    "use strict";

    global["$"] = factory(
        global.document,
        global.customElements
    );

}(self, function factory(document, customElements) {

    function Vanilla(selector, context) {
        return new Vanilla.fn.init(selector, context);
    }

    Vanilla.prototype = Vanilla.fn = {
        init: function (selector, context) {
            return (context || document).querySelectorAll(selector);
        },
    };

    Vanilla.define = function define(tag, Class) {
        return customElements.define(tag, Class);
    };

    Vanilla.log = function log(...args) {
        return console.log(...args);
    };

    return Vanilla;
}));

const h = (tag, props, children = []) => {
    const node = document.createElement(tag);
    for (let [key, value] of Object.entries(props || {})) {
        let isEvent = false;
        key.replace(/^on([A-Za-z]+)$/, (_, raw) => {
            const eventName = raw.toLowerCase();
            function handle(evt) {
                value.call(this, evt);
            }
            node.addEventListener(eventName, handle);
            isEvent = true;
        });
        if (isEvent) {
            continue;
        }
        if (/-/.test(key)) {
            node.setAttribute(key, value);
        } else {
            node[key] = value;
        }
    }
    for (let child of children) {
        if (typeof child === "undefined") {
            continue;
        }
        if (typeof child === "string" || typeof child === "number") {
            node.appendChild(document.createTextNode(child));
        } else {
            node.appendChild(child);
        }
    }
    return node;
};

const H = new Proxy({

}, {
    get: function (_, tag, _receiver) {
        // console.log(target, prop, receiver);
        return (props, ...children) => h(tag, props, children);
    }
});
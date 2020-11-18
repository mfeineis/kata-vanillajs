// * [x] HTML via tagged template literals and DOMParser
// * [x] Sneaky getters in props and state
// * [x] With event handling
// * [x] Support HTMLElement properties

(function (window) {
    "use strict";

    if (!Object.assign || !("Reflect" in window)) {
        throw new Error("I need a modern ES2015+ environment.");
    }

    /**
     * @param parts {TemplateStringsArray}
     */
    function html(parts, ...exprs) {
        const lookup = {};
        const result = [parts[0]];

        parts.slice(1).forEach((p, i) => {
            const gen = `__$gen${i}$__`;
            lookup[gen] = exprs[i];
            result.push(gen, p);
        });

        const parser = new DOMParser();
        const doc = parser.parseFromString(result.join(""), "text/html");
        //Core.log("doc", doc);
        const subs = [];

        let node = doc.querySelector("body > *:first-child");
        while (node) {
            Core.log("NODE", node);
            if (!node.hasChildNodes()) {
                node = node.nextSibling;
                continue;
            }

            for (let attr of node.attributes) {
                Core.log("        ATTR", attr);
                let { name, value } = attr;
                name.replace(/^on([\w]+)$/i, (m, eventNameUnsafe) => {
                    Core.log("          ON*", m, eventNameUnsafe);
                    let eventName = eventNameUnsafe.toLowerCase();
                    value.replace(/(__\$gen([\d]+)\$__)/, (_, tk, i, pos) => {
                        Core.log("            ON*", tk, i);
                        function handler(ev) {
                            //Core.log(m, "handler", ev, exprs[i], this);
                            exprs[i](ev);
                        };
                        node.addEventListener(eventName, handler);
                        subs.push(() => node.removeEventListener(eventName, handler));
                        node.removeAttributeNode(attr);
                        node.setAttribute(`x-${m}`, value);
                        return _;
                    });
                    return m;
                });
            }

            for (let child of node.childNodes) {
                Core.log("  CHILD", child);
                if (child.nodeType === Node.TEXT_NODE) {
                    Core.log("    TEXT_NODE", child);
                    child.textContent.replace(/(__\$gen([\d]+)\$__)/g, (_, tk, i, pos) => {
                        // TODO: Only update the text region where the symbol actually is
                        const value = typeof exprs[i] === "function" ? exprs[i]() : exprs[i];
                        Core.log("      found", tk, i, "@", pos, "<-", value);
                        child.textContent = value;
                        return _;
                    });
                }
                if (child.nodeType === Node.ATTRIBUTE_NODE) {
                    Core.log("     ATTRIBUTE_NODE", child);
                }

                if (child.nodeType === Node.ELEMENT_NODE) {
                    Core.log("     ELEMENT_NODE", child);
                }
            }

            // TODO: Traverse tree, not just siblings
            node = node.nextSibling;
        }

        const cleanup = () => {
            for (let sub of subs) {
                sub();
            }
        };

        Core.log("html", doc, lookup, result, "<-", parts, exprs);
        return [cleanup, doc.querySelectorAll("body > *")];
    }

    const useState = (init = {}) => {
        const state = init;
        return new Proxy(state, {
            get(target, name) {
                //Core.log("(get) useState", state, ".", name);
                const getter = () => target[name];
                // Using valueOf to allow easy read access for values
                getter.valueOf = function () {
                    // TODO: This might be too much magic
                    return this();
                };
                return getter;
            },
            //set(target, name, value) {
            //    //Core.log("(set) useState", state, ".", name, "=", value);
            //    target[name] = value;
            //    return true;
            //},
        });
    };

    const attr = name => ({
        attr: name,
    });

    const prop = name => ({
        prop: name,
    });

    const def = (name, view, ...mixins) => {
        const observedAttributes = [];
        const properties = {};
        const lensLookup = {};
        const lenses = [];

        for (let { attr, prop } of mixins) {
            if (attr) {
                observedAttributes.push(attr);
                const lens = {
                    //type: 'a',
                    //src: attr,
                    target: attr,
                    getter(host) {
                        const getter = () => host.getAttribute(attr);
                        // Using valueOf to allow easy read access for values
                        getter.valueOf = function () {
                            // TODO: This might be too much magic
                            return this();
                        };
                        return getter;
                    },
                    set(host, value) {
                        host.setAttribute(attr, value);
                    },
                };
                lenses.push(lens);
                lensLookup[`a-${attr}`] = lens;
            }
            if (prop) {
                const lens = {
                    target: prop,
                    getter(host) {
                        const value = host[`_p_${prop}`];
                        Core.log("lens", prop, "getter", value);
                        return value;
                    },
                    setter(host, value) {
                        Core.log("prop", prop, "setter", value);
                        const oldValue = host[`_p_${prop}`];
                        host[`_p_${prop}`] = value;
                        host._update(`p-${prop}`, value, oldValue);
                    },
                };
                properties[prop] = {
                    get() {
                        return lens.getter(this);
                    },
                    set(value) {
                        lens.setter(this, value);
                    },
                };
                lenses.push(lens);
                lensLookup[`p-${prop}`] = lens;
            }
        }

        class Component extends HTMLElement {
            static get observedAttributes() {
                return observedAttributes;
            }

            _update(name, newValue, oldValue) {
                Core.log("    _update", name, newValue, oldValue, this);
                //lensLookup[name].set()
            }

            attributeChangedCallback(name, newValue, oldValue) {
                Core.log("  attributeChangedCallback", name, newValue, oldValue, this);
                this._update(`a-${name}`, newValue, oldValue);
            }

            connectedCallback() {
                this._props = {};
                for (let lens of lenses) {
                    this._props[lens.target] = lens.getter(this);
                }

                const [cleanup, nodes] = view(this._props);
                this._cleanup = cleanup;

                for (let node of nodes) {
                    this.appendChild(node);
                }
            }

            disconnectedCallback() {
                Core.log("disconnectedCallback", this);
                this._cleanup();
            }

            adoptedCallback() {
                Core.log("adoptedCallback", this);
            }
        }

        Object.defineProperties(Component.prototype, properties);

        customElements.define(name, Component);
        return Component;
    };



    function CounterView(props) {
        Core.log("CounterView(", props, ")");
        const state = useState({ count: props.init || 0 });
        const onClick = ev => Core.log("ev.target", ev.target);
        return html`
            <b>${props.who}!</b>
            <button onClick=${onClick}>+ ${props.what}</button>
            <span>${state.count}</span>
            <span>${state.count + 1}</span>
        `;
    }

    def("x-counter", CounterView, attr("who"), attr("what"), prop("init"));

    def("x-hello", () => html`<b>Hello, World!</b>`);

}(self));
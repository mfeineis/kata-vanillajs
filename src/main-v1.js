// * [x] HTML via tagged template literals and DOMParser

(function () {
    "use strict";

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

        let node = doc.querySelector("body > *:first-child");
        while (node) {
            Core.log(node);
            for (let child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    Core.log("TEXT_NODE");
                    child.textContent.replace(/(__\$gen([\d]+)\$__)/g, (_, tk, i, pos) => {
                        const value = exprs[i]();
                        Core.log("found", tk, i, "@", pos, "substituting", value);
                        child.textContent = value;
                        return _;
                    });
                }
            }
            node = node.nextSibling;
        }

        Core.log("html", doc, lookup, result, "<-", parts, exprs);
        return doc.querySelectorAll("body > *");
    }

    class BaseElement extends HTMLElement {

    }

    function A(props, state, children) {

    }

    class FunComp {
        render(props) {

        }
    }

    const PlainComp = {
        render(props) {

        }
    }

    // TODO: Compose behaviors

    customElements.define("x-counter-v1", class extends HTMLElement {
        static get observedAttributes() {
            return ["init", "focus", "step"];
        }

        render() {
            const who = "World";
            const what = "Click Me!";
            const nodes = html`
            <b>${() => who}!</b>
            <button>${() => what}</button>
        `;
            for (let node of nodes) {
                this.appendChild(node);
            }
        }

        connectedCallback(...args) {
            Core.log(this, ".connectedCallback", args);
            this.render();
        }

        attributeChangedCallback(name, newValue, oldValue) {
            //Core.log(this, ".attributeChangedCallback", [name, newValue, oldValue]);
        }

        disconnectedCallback(...args) {
            //Core.log(this, ".disconnectedCallback", args);
        }

        adoptedCallback(...args) {
            //Core.log(this, ".adoptedCallback", args);
        }
    });

}());
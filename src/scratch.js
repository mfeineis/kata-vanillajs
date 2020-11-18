
function LegacyElement() {
    return Reflect.construct(HTMLElement, [], this.constructor);
}
LegacyElement.prototype = Object.create(HTMLElement.prototype);
LegacyElement.prototype.constructor = LegacyElement;
LegacyElement.prototype.connectedCallback = function () {
    this.appendChild(document.createTextNode("A little rusty!"));
};
Object.setPrototypeOf(LegacyElement, HTMLElement);

customElements.define("legacy-element", LegacyElement);


function Component() {
    return Reflect.construct(HTMLElement, [], this.constructor);
}
Component.prototype = Object.create(HTMLElement.prototype);
Component.prototype.constructor = Component;
Object.defineProperty(Component, "observedAttributes", {
    get() {
        return observedAttributes;
    },
});
Object.assign(Component.prototype, {
    attributeChangedCallback(name, newValue, oldValue) {
        Core.log("  attributeChangedCallback", name, newValue, oldValue, this);
        //this._update(`a-${name}`, newValue, oldValue);
    },
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
    },
    disconnectedCallback() {
        Core.log("disconnectedCallback", this);
        this._cleanup();
    },
    adoptedCallback() {
        Core.log("adoptedCallback", this);
    },
    //_update(name, newValue, oldValue) {
    //    Core.log("_update", name, newValue, oldValue, this);
    //    lensLookup[name].set()
    //},
});
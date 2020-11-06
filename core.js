(function (NAME, VERSION, window, factory) {
    "use strict";

    const document = window.document;

    function expose(host, name, it) {
        host[name] = Object.freeze(it);
    }

    if (typeof window.CustomEvent !== "function") {
        expose(window, "CustomEvent", function CustomEvent(event, params) {
            params = params || {
                bubbles: false,
                cancelable: false,
                detail: null
            };
            var evt = document.createEvent("CustomEvent");
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        });
    }

    expose(window, NAME, factory(VERSION, window, document, Object.freeze, expose));

}("Core", "0.1.1", self, function (VERSION, window, document, Object_freeze, expose) {
    const XMLHttpRequest = window.XMLHttpRequest;

    // Our baseline is IE11 compatible ES5 environments, no need for dependencies

    function noop() { }

    function delay(fn, ms) {
        window.setTimeout(function () {
            fn();
        }, ms);
    }

    function Sandbox() { }

    const proto = Sandbox.prototype;

    // Env Extension

    const env = {};
    env["window"] = window;
    env["document"] = document;
    expose(proto, "env", env);

    // Log Extension

    const supportsConsole = typeof console !== "undefined";
    const log = supportsConsole ? function log() {
        console.log.apply(console, arguments);
    } : noop;
    expose(log, "error", supportsConsole ? function error() {
        console.error.apply(console, arguments);
    } : noop);
    expose(proto, "log", log);

    // PubSub Extension
    const topicLog = {};

    function emit(topic, data) {
        if (!Array.isArray(topicLog[topic])) {
            topicLog[topic] = [];
        }
        topicLog[topic].push(data);
        window.postMessage([topic, data], window.location.origin);
    }

    function on(topic, fn, maybeOptions) {
        maybeOptions = maybeOptions || { replay: false };

        function handler(evt) {
            if (evt.origin !== window.location.origin) {
                return;
            }

            const msg = evt.data;
            if (Array.isArray(msg) && msg[0] === topic) {
                fn(msg[1], unsubscribe);
            }
        }

        window.addEventListener("message", handler);

        function unsubscribe() {
            window.removeEventListener("message", handler);
        }

        if (maybeOptions.replay && (topicLog[topic] || []).length) {
            delay(function () {
                fn(topicLog[topic][topicLog[topic].length - 1], unsubscribe);
            });
        }

        return unsubscribe;
    }

    expose(proto, "emit", emit);
    expose(proto, "on", on);

    // Request Extension

    function request(url, maybeOptions, maybeCallback) {
        if (arguments.length === 2) {
            maybeCallback = maybeOptions;
            maybeOptions = null;
        }

        const DONE = 4;

        const HTTP_LOCAL_OK = 0;
        const HTTP_OK = 200;
        const HTTP_BAD_REQUEST = 400;

        const ONE_HUNDRED = 100;
        const TEN_SECONDS = 10000;

        const EMPTY = 0;

        const options = maybeOptions || {};

        let callback = function (error, response) {
            callback = noop;
            (maybeCallback || noop)(error, response);
        };

        const async = !options.sync;
        const body = options.body || null;
        const headers = options.headers || {};
        const method = (options.method || "GET").toUpperCase();
        const onProgress = options.onProgress || noop;
        const params = options.params || {};
        const timeout = options.timeout || TEN_SECONDS;
        const withCredentials = !!options.withCredentials;
        const responseType = options.responseType || "text";

        try {
            const q = Object.keys(params).map(function (key) {
                return key + "=" + encodeURIComponent(params[key]);
            }).join("&");
            const query = url.indexOf("?") >= EMPTY ? "&" + q : "?" + q;

            let xhr = new XMLHttpRequest();
            xhr.open(method, q.length ? url + query : url, async);

            const abort = xhr.abort;
            let aborted = false;
            let hasContentType = false;

            const api = {
                abort: abort,
            };

            Object.keys(headers).forEach(function (key) {
                if (/^content-type/i.test(key)) {
                    hasContentType = true;
                }
                xhr.setRequestHeader(key, headers[key]);
            });

            if (!hasContentType && body !== null && typeof body === "object") {
                xhr.setRequestHeader(
                    "Content-Type", "application/json; charset=utf-8"
                );
            }

            xhr.abort = function () {
                aborted = true;
                abort.call(xhr);
                xhr = null;
            };

            xhr.onerror = function () {
                callback(new Error(xhr.responseText));
                xhr = null;
            };

            xhr.onprogress = function (evt) {
                if (evt.lengthComputable) {
                    onProgress({
                        loaded: evt.loaded,
                        percentage: ONE_HUNDRED * (evt.loaded / evt.total),
                        total: evt.total,
                    }, api);
                } else {
                    onProgress({
                        indeterminate: true,
                        loaded: NaN,
                        percentage: 0,
                        total: NaN,
                    }, api);
                }
            };

            xhr.onreadystatechange = function () {
                if (aborted) {
                    return;
                }

                if (xhr.readyState === DONE) {
                    const status = xhr.status;
                    const isDocument = responseType === "document";
                    api.responseText = isDocument ? null : xhr.responseText;
                    api.responseType = xhr.responseType;
                    api.responseXML = isDocument ? xhr.responseXML : null;
                    api.status = status;

                    if (status === HTTP_LOCAL_OK || (status >= HTTP_OK && status < HTTP_BAD_REQUEST)) {
                        xhr = null;
                        callback(null, api);
                        return;
                    }

                    const error = new Error(isDocument ? "Document could not be loaded" : xhr.responseText);
                    error.response = api;
                    error.status = status;
                    error.statusText = xhr.statusText;
                    xhr = null;
                    callback(error);
                }
            };

            xhr.ontimeout = function (error) {
                xhr = null;
                callback(error);
            };

            xhr.timeout = timeout;

            if (withCredentials) {
                xhr.withCredentials = Boolean(withCredentials);
            }

            xhr.responseType = responseType;

            xhr.send(body);

            return api;
        } catch (error) {
            callback(error);
            return {
                abort: noop,
            };
        }
    }

    expose(proto, "request", request);

    // Public API

    Object_freeze(Sandbox);
    Object_freeze(Sandbox.prototype);

    function use(fn) {
        const sandbox = new Sandbox();
        fn(Object_freeze(sandbox));
    }

    const publicApi = function () { };

    expose(publicApi, "log", log);
    expose(publicApi, "use", use);
    expose(publicApi, "VERSION", VERSION);

    return Object_freeze(publicApi);
}));
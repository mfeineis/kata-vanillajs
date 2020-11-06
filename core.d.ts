
interface LogHost {
    (...rest: any[]): void;
    error(...rest: any[]): void;
}

interface Unsubscribe {
    (): void;
}

interface SubscriptionOptions {
    replay?: boolean;
}

interface RequestProgressEvent {
    indeterminate?: boolean;
    loaded: number;
    percentage: number;
    total: number;
}

interface RequestOptions {
    sync?: boolean;
    body?: any;
    headers?: any;
    method?: "GET" | "POST" | "PATCH" | "OPTIONS" | "PUT" | "DELETE";
    onProgress?: (evt: RequestProgressEvent) => void;
    params?: any;
    responseType?: string;
    timeout?: number;
    withCredentials?: boolean;
}

interface Response {
    abort(): void;
    responseText?: string;
    responseType?: string;
    responseXML?: XMLDocument;
    status?: number;
}

interface RequestError extends Error {
    response?: Response;
    status?: number;
    statusText?: string;
}

interface RequestCallback {
    (error: RequestError | null, response: Response): void;
}

interface Sandbox extends LogExtension, EnvExtension {
    // Env
    env: {
        document: Document,
        window: Window & typeof globalThis,
    },

    // Logging
    log: LogHost;

    // PubSub
    emit<T>(topic: string, data: T): void;
    on<T>(topic: string, fn: (data: T, unsubscribe: Unsubscribe) => void, options?: SubscriptionOptions): Unsubscribe;

    // Request
    request(url: string, callback: RequestCallback): Response;
    request(url: string, options: RequestOptions, callback: RequestCallback): Response;
}

interface CoreStatic {
    log(...rest: any[]): void;
    use(fn: (sandbox: Sandbox) => void): void;
    VERSION: string;
}

declare const Core: CoreStatic;
import { Router } from "express";

export default function getRouterEndpoints(router: Router, path: string) {
    const endpoints: Array<string> = [];

    if (router && router.stack) {
        router.stack.forEach((layer) => {
            if (layer.route) {
                const subPath = layer.route.path;
                const methods = Object.keys(layer.route.methods);

                methods.forEach((method) => {
                    endpoints.push(`${method.toUpperCase().padEnd(6, " ")} ${path}${subPath}`);
                });
            }
        });
    }

    return endpoints;
}
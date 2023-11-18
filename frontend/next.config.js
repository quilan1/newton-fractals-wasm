/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    webpack: config => {
        config.module ??= {};
        config.module.rules ??= [];
        config.module.rules.push({
            test: /\.wasm$/,
            type: 'webassembly/async',
        });

        config.experiments ??= {};
        config.experiments.asyncWebAssembly = true;

        return config;
    }
}

module.exports = nextConfig;

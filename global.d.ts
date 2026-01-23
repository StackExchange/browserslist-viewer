declare module "@stackoverflow/browserslist-config" {
    const config: string[];
    export default config;
}

declare module "@stackoverflow/stacks/package.json" {
    const packageJson: {
        name: string;
        browserslist: string[];
        [key: string]: unknown;
    };
    export default packageJson;
}

module.exports = {
    root: true,
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
    },
    ignorePatterns: ["*.js"],
    extends: ["@stackoverflow"],
};

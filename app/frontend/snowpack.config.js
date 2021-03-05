const { compilerOptions: { paths } } = require('./tsconfig.json');

module.exports = {
    mount: {
        public: {
            url: '/',
            static: false,
        },
        src: {
            url: '/dist',
        },
    },
    plugins: [
        '@snowpack/plugin-react-refresh',
        '@snowpack/plugin-typescript',
        '@snowpack/plugin-dotenv',
    ],
    devOptions: {
        open: 'none',
        port: 3001,
    },
    alias: Object.fromEntries(
        Object.entries(paths || {}).map(([key, value]) =>
            [key.replace('*', ''), value[0].replace('*', '')],
        ),
    ),
    routes: [
        {
            match: 'routes',
            src: '.*',
            dest: '/index.html'
        },
    ],
    optimize: {
        treeshake: true,
        minify: true,
        target: 'es2020',
    },
};

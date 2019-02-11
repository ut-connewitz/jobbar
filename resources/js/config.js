var config = {
    production: {
        backend: {
            host: 'http://example.org',
            port: 80,
            path: '/'
        },
    },
    development: {
        backend: {
            host: 'http://localhost',
            port: 8085,
            path: '/api/'
        },
    },
    test: {
    }
};

module.exports = config;
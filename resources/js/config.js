var config = {
    production: {
        publicBasePath: "jobbar",
        backend: {
            host: 'https://utconnewitz.de/jobbar',
            // port: 443,
            path: '/api/'
        },
    },
    development: {
        publicBasePath: "",
        backend: {
            host: 'http://localhost:8080',
            // port: 8080,
            path: '/api/'
        },
    },
    test: {
    }
};

// console.log("config", config);
// console.log("process.env", process.env);

module.exports = config;
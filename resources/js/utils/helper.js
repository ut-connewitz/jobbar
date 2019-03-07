import axios from 'axios';

const env = process.env.NODE_ENV || 'production';
const config = require('../config')[env];

let accessToken = null;

export const getAccessToken = () => {
    return accessToken;
}

export const setAccessToken = (token = '') => {
    accessToken = token;
}


export const request = (model = '', path = '', type = 'get', data = {}) => {
    // let url = `${config.backend.host}:${config.backend.port}${config.backend.path}${model}`;
    let url = `${config.backend.host}${config.backend.path}${model}`;
    if (type.toUpperCase() === 'GET' && Object.keys(data).length > 0) {
        let params = "";
        for (const key in data) {
            // url = `${url}&${key}=${data[key]}`;
            params = `${key}=${data[key]}&${params}`;
        }
        url = `${url}?${params}`;
    }
    const token = getAccessToken();
    // data = token === null
    //     ? data
    //     : {...data, ...{'x-access-token': token}};

    // console.log("request data", data);

    // return axios({
    //     method: type,
    //     url: url,
    //     data: data,
    //     headers: {
    //         'x-access-token': token
    //     }
    // })

    return new Promise((resolve, reject) => {
        axios({
            method: type,
            url: url,
            data: data,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(res => {
            resolve(res);
        })
        .catch(error => {
            console.error("Axios error", error);

            if (error.response) {
                console.log("Axios response", error.response);
                const status = error.response.status ? error.response.status : "";

                if (error.response.data) {
                    let message = error.response.data;
                    if (error.response.data.message && error.response.data.message != "") {
                        message = error.response.data.message;
                    } else if (error.response.statusText) {
                        message = error.response.statusText;
                    }
                    reject({ message, status });
                } else {
                    reject(error.response);
                }
            } else if (error.request) {
                console.log("Axios request", error.request);
                reject(error.request);
            } else {
                reject(error.message);
            }
            console.log("Axios error.config", error.config);
        })
    });
}
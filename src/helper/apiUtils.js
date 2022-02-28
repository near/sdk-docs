import axios from "axios";
import Qs from 'qs';

const serializerConfig = {
    arrayFormat: 'brackets',
    encode: false,
};

function callAPI(path, params, method, data = null, options = {}, headersObj = {}) {
    // const API_ROOT = 'http://immosnapp.teamjft.com';
    // const url = API_ROOT + path;
    const url = path;
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headersObj,
    };

    return axios({
        method,
        url,
        params,
        paramsSerializer: (paramObject) => Qs.stringify(paramObject, serializerConfig),
        data,
        headers,
        ...options,
    });
}

async function fetchData(URL, method, data = null, requestOptions = null) {

    const options = {
        ...requestOptions,
        method
    };

    let fullUrl = URL;
    options.headers = {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type':'application/json'
    };
    options.body = JSON.stringify(data);
    const response = await fetch(fullUrl, options);
    return response.json();
}

export {callAPI, fetchData};

// http.client

const axios = require('axios');

export class HttpClient {
  static get(
    url: string,
    options: any = {},
  ) {
    return axios.get(url, options).then((response: any) => {
      return response;
    }).catch((error: any) => {
      return error;
    });
  }

  static delete(
    url: string,
    options: any = {},
  ) {
    return axios.delete(url, options).then((response: any) => {
      return response;
    }).catch((error: any) => {
      return error;
    });
  }

  static post(
    url: string,
    body: any,
    options: any = {},
  ) {
    return axios.post(url, body, options).then((response: any) => {
      return response;
    }).catch((error: any) => {
      return error;
    });
  }
}

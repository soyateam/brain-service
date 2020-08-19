// http.client

const axios = require('axios');

export class HttpClient {
  static get(
    url: string,
    options: any = {},
  ) {
    return axios.get(url, options).then((response: any) => {
      return response.data;
    });
  }

  static delete(
    url: string,
    options: any = {},
  ) {
    return axios.delete(url, options).then((response: any) => {
      return response.data;
    });
  }

  static post(
    url: string,
    body: any,
    options: any = {},
  ) {
    return axios.post(url, body, options).then((response: any) => {
      return response.data;
    });
  }

  static put(
    url: string,
    body: any,
    options: any = {},
  ) {
    return axios.put(url, body, options).then((response: any) => {
      return response.data;
    });
  }
}

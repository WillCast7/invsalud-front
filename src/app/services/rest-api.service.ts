import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { config } from '../../environment/aurea';

@Injectable({
  providedIn: 'root',
})
export class RestApiService {
  token: string = '';
  permission = null;

  constructor(private readonly httpClient: HttpClient) {}

  setHeaders(): HttpHeaders {
    // Crear y retornar los encabezados con el token de autorización
    const token = localStorage.getItem('jwt') ?? '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  //Get Method
  getRequest(url: string, params: any = null): Observable<any> {
    params = this.processParams(params);
    let headers = this.setHeaders();
    url = config.urlBackend + url;
    return this.httpClient.get<any>(url, { headers, params });
  }

  // Post Method
  postRequest(url: string, body: any): Observable<any> {
    let headers = this.setHeaders();
    body = JSON.stringify(body);
    url = config.urlBackend + url;
    return this.httpClient.post<any>(url, body, { headers });
  }

  // Get Method with files
  fileGetRequest(url: string, params: any = null): Observable<Blob> {
    params = this.processParams(params);
    let headers = this.setHeaders();
    url = config.urlBackend + url;
    return this.httpClient.get(url, { 
        headers,
        params,
        responseType: 'blob'
     });
  }

  // Put Method
  putRequest(url: string, body: any): Observable<any> {
    let headers = this.setHeaders();
    body = JSON.stringify(body);
    url = config.urlBackend + url;
    return this.httpClient.put<any>(url, body, { headers });
  }

  // Patch Method
  patchRequest(url: string, body: any): Observable<any> {
    let headers = this.setHeaders();
    body = JSON.stringify(body);
    url = config.urlBackend + url;
    return this.httpClient.patch<any>(url, body, { headers });
  }

  // Delete Method
  deleteRequest(url: string, body: any, params: any) {
    let headers = this.setHeaders();
    params = Object.assign(body, params);
    params = this.processParams(params);
    url = config.urlBackend + url;
    return this.httpClient.delete(url, { headers, params });
  }

  processParams(params: any) {
    let queryParams: Record<string, any> = {};
    for (let key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams[key] = params[key];
      }
    }
    return new HttpParams({ fromObject: queryParams });
  }

  // JSON Params
  processParamsFetch(params: any) {
    let p = new URLSearchParams(params);
    return '?' + p.toString();
  }

  //Login
  Login(body: any): Observable<any> {
    return this.httpClient.post<any>(config.urlBackend + '/login', body, { withCredentials: true });
  }

  //register
  register(body: any): Observable<any> {
    return this.httpClient.post<any>(config.urlBackend + '/register', body);
  }
}

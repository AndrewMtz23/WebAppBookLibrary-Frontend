import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuditDetail, AuditPage, AuditQuery } from './audit.models';
@Injectable({providedIn:'root'}) export class AuditApi { constructor(private http:HttpClient){} search(query:AuditQuery){let params=new HttpParams();Object.entries(query).forEach(([key,value])=>{if(value!==''&&value!==null){const safeValue=(key==='from'||key==='to')&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value))?`${value}:00.000Z`:String(value);params=params.set(key,safeValue);}});return this.http.get<AuditPage>('/api/log',{params});} detail(id:string){return this.http.get<AuditDetail>(`/api/log/${id}`);} }

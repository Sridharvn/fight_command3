import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  GlobalCompoundRule,
  CreateGlobalCompoundRuleDto,
  UpdateGlobalCompoundRuleDto,
} from '../models/rule-engine.models';

@Injectable({
  providedIn: 'root',
})
export class RuleService {
  private readonly apiService = inject(ApiService);
  private readonly endpoint = 'templates/global-compound-rules';

  getRules(): Observable<GlobalCompoundRule[]> {
    return this.apiService.get<GlobalCompoundRule[]>(this.endpoint);
  }

  createRule(dto: CreateGlobalCompoundRuleDto): Observable<GlobalCompoundRule> {
    return this.apiService.post<GlobalCompoundRule>(this.endpoint, dto);
  }

  updateRule(id: number, dto: UpdateGlobalCompoundRuleDto): Observable<GlobalCompoundRule> {
    return this.apiService.put<GlobalCompoundRule>(`${this.endpoint}/${id}`, dto);
  }

  deleteRule(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }
}

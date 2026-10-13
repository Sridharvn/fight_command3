import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  FieldDefinition,
  CreateFieldDefinitionDto,
  FormTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
} from '../models/form-definition.models';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FormDefinitionService {
  private readonly apiService = inject(ApiService);
  private readonly fieldsEndpoint = 'templates/field-definitions';
  private readonly templatesEndpoint = 'templates';

  // ── Field Definitions ──────────────────────────────────────────────────────
  getFieldDefinitions(isActive?: boolean): Observable<FieldDefinition[]> {
    let params: HttpParams | undefined;
    if (isActive !== undefined) {
      params = new HttpParams().set('isActive', isActive.toString());
    }
    return this.apiService.get<FieldDefinition[]>(this.fieldsEndpoint, { params });
  }

  createFieldDefinition(dto: CreateFieldDefinitionDto): Observable<FieldDefinition> {
    return this.apiService.post<FieldDefinition>(this.fieldsEndpoint, dto);
  }

  updateFieldDefinition(
    id: number,
    dto: Partial<CreateFieldDefinitionDto>,
  ): Observable<FieldDefinition> {
    return this.apiService.put<FieldDefinition>(`${this.fieldsEndpoint}/${id}`, dto);
  }

  deleteFieldDefinition(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`${this.fieldsEndpoint}/${id}`);
  }

  // ── Form Templates ─────────────────────────────────────────────────────────
  getTemplates(filterParams?: {
    page?: number;
    limit?: number;
    templateType?: string;
    sportType?: number;
    tournamentType?: number;
    isActive?: boolean;
  }): Observable<{ data: FormTemplate[]; total: number } | FormTemplate[]> {
    let params: HttpParams | undefined;
    if (filterParams) {
      params = new HttpParams();
      Object.entries(filterParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          params = params!.set(k, v.toString());
        }
      });
    }
    return this.apiService.get<{ data: FormTemplate[]; total: number } | FormTemplate[]>(
      this.templatesEndpoint,
      { params },
    );
  }

  getPresets(sportType?: number, tournamentType?: number): Observable<FormTemplate[]> {
    if (sportType !== undefined || tournamentType !== undefined) {
      let params = new HttpParams();
      if (sportType !== undefined) params = params.set('sportType', sportType.toString());
      if (tournamentType !== undefined)
        params = params.set('tournamentType', tournamentType.toString());
      return this.apiService.get<FormTemplate[]>(`${this.templatesEndpoint}/presets`, { params });
    }
    return this.apiService.get<FormTemplate[]>(`${this.templatesEndpoint}/presets`);
  }

  getTemplateById(templateId: number): Observable<FormTemplate> {
    return this.apiService.get<FormTemplate>(`${this.templatesEndpoint}/${templateId}`);
  }

  createTemplate(dto: CreateTemplateDto): Observable<FormTemplate> {
    return this.apiService.post<FormTemplate>(this.templatesEndpoint, dto);
  }

  updateTemplate(templateId: number, dto: UpdateTemplateDto): Observable<FormTemplate> {
    return this.apiService.put<FormTemplate>(`${this.templatesEndpoint}/${templateId}`, dto);
  }

  toggleTemplateStatus(templateId: number, isActive: boolean): Observable<FormTemplate> {
    return this.apiService.patch<FormTemplate>(`${this.templatesEndpoint}/${templateId}/status`, {
      isActive,
    });
  }

  deleteTemplate(templateId: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`${this.templatesEndpoint}/${templateId}`);
  }
}

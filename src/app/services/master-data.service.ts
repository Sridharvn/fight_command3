import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CountryItem, DistrictItem, StateItem } from '../models/master-data.models';

@Injectable({
  providedIn: 'root',
})
export class MasterDataService {
  private readonly api = inject(ApiService);

  getCountries(): Observable<CountryItem[]> {
    return this.api.get<CountryItem[]>('/master-data/countries');
  }

  getStates(countryId: number): Observable<StateItem[]> {
    return this.api.get<StateItem[]>(`/master-data/countries/${countryId}/states`);
  }

  getDistricts(stateId: number): Observable<DistrictItem[]> {
    return this.api.get<DistrictItem[]>(`/master-data/states/${stateId}/districts`);
  }
}

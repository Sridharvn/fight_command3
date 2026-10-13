import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MasterDataService } from './master-data.service';
import { ApiService } from './api.service';
import { API_BASE_URL } from '../constants/app-constants';
import { CountryItem, StateItem, DistrictItem } from '../models/master-data.models';

describe('MasterDataService', () => {
  let service: MasterDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MasterDataService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(MasterDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch countries', () => {
    const mockCountries: CountryItem[] = [{ countryId: 1, name: 'India', code: 'IN' }];

    service.getCountries().subscribe((res) => {
      expect(res).toEqual(mockCountries);
    });

    const req = httpTesting.expectOne('http://localhost:3000/master-data/countries');
    expect(req.request.method).toBe('GET');
    req.flush(mockCountries);
  });

  it('should fetch states for country', () => {
    const mockStates: StateItem[] = [{ stateId: 10, name: 'Kerala', countryId: 1 }];

    service.getStates(1).subscribe((res) => {
      expect(res).toEqual(mockStates);
    });

    const req = httpTesting.expectOne('http://localhost:3000/master-data/countries/1/states');
    expect(req.request.method).toBe('GET');
    req.flush(mockStates);
  });

  it('should fetch districts for state', () => {
    const mockDistricts: DistrictItem[] = [{ districtId: 100, name: 'Ernakulam', stateId: 10 }];

    service.getDistricts(10).subscribe((res) => {
      expect(res).toEqual(mockDistricts);
    });

    const req = httpTesting.expectOne('http://localhost:3000/master-data/states/10/districts');
    expect(req.request.method).toBe('GET');
    req.flush(mockDistricts);
  });
});

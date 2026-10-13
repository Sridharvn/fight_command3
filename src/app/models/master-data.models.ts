export interface CountryItem {
  countryId: number;
  name: string;
  code: string;
  isActive?: boolean;
}

export interface StateItem {
  stateId: number;
  name: string;
  countryId: number;
  isActive?: boolean;
}

export interface DistrictItem {
  districtId: number;
  name: string;
  stateId: number;
  isActive?: boolean;
}

export enum EventStatus {
  DRAFT = 1,
  PUBLISHED = 2,
  REGISTRATION_OPEN = 3,
  REGISTRATION_CLOSED = 4,
  COMPLETED = 5,
  CANCELLED = 6,
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: 'Draft',
  [EventStatus.PUBLISHED]: 'Published',
  [EventStatus.REGISTRATION_OPEN]: 'Registration Open',
  [EventStatus.REGISTRATION_CLOSED]: 'Registration Closed',
  [EventStatus.COMPLETED]: 'Completed',
  [EventStatus.CANCELLED]: 'Cancelled',
};

export enum SportType {
  SAMBO = 1,
  MMA = 2,
  BOXING = 3,
  KICKBOXING = 4,
  MUAY_THAI = 5,
  BRAZILIAN_JIU_JITSU = 6,
  JUDO = 7,
  WRESTLING = 8,
  KARATE = 9,
  TAEKWONDO = 10,
}

export const SPORT_TYPE_LABELS: Record<SportType, string> = {
  [SportType.SAMBO]: 'Sambo',
  [SportType.MMA]: 'MMA',
  [SportType.BOXING]: 'Boxing',
  [SportType.KICKBOXING]: 'Kickboxing',
  [SportType.MUAY_THAI]: 'Muay Thai',
  [SportType.BRAZILIAN_JIU_JITSU]: 'Brazilian Jiu-Jitsu',
  [SportType.JUDO]: 'Judo',
  [SportType.WRESTLING]: 'Wrestling',
  [SportType.KARATE]: 'Karate',
  [SportType.TAEKWONDO]: 'Taekwondo',
};

export enum TournamentType {
  NATIONAL = 1,
  STATE = 2,
  DISTRICT = 3,
  ZONAL = 4,
  CLUB = 5,
}

export const TOURNAMENT_TYPE_LABELS: Record<TournamentType, string> = {
  [TournamentType.NATIONAL]: 'National',
  [TournamentType.STATE]: 'State',
  [TournamentType.DISTRICT]: 'District',
  [TournamentType.ZONAL]: 'Zonal',
  [TournamentType.CLUB]: 'Club',
};

export interface RegistrationFormModel {
  formId: number;
  templateId?: number | null;
  formTitle?: string | null;
  formDescription?: string | null;
  isActive: boolean;
  shareLink?: string | null;
  registrationOpenDate?: string | Date | null;
  registrationCloseDate?: string | Date | null;
}

export interface EventListItem {
  eventId: number;
  eventName: string;
  sportType: SportType;
  tournamentType: TournamentType;
  status: EventStatus;
  eventStartDate?: string | Date | null;
  eventEndDate?: string | Date | null;
  location?: string | null;
  posterImageUrl?: string | null;
  countryId?: number | null;
  stateId?: number | null;
  districtId?: number | null;
  createdAt: string | Date;
  registrationForm?: RegistrationFormModel | null;
}

export interface CreateEventDto {
  eventName: string;
  sportType: SportType;
  tournamentType: TournamentType;
  eventStartDate?: string;
  eventEndDate?: string;
  location?: string;
  posterImageUrl?: string;
  countryId?: number;
  stateId?: number;
  districtId?: number;
  templateId?: number;
  formTitle?: string;
  formDescription?: string;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
}

export interface UpdateEventDto {
  eventName?: string;
  sportType?: SportType;
  tournamentType?: TournamentType;
  eventStartDate?: string;
  eventEndDate?: string;
  location?: string;
  status?: EventStatus;
  posterImageUrl?: string;
  countryId?: number;
  stateId?: number;
  districtId?: number;
}

export interface PublicEventTemplateField {
  templateFieldId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  customFieldName?: string | null;
  customFieldLabel?: string | null;
  fieldOptions?: any;
  helpText?: string | null;
  defaultValue?: any;
}

export interface PublicEventForm {
  eventId: number;
  eventName: string;
  sportType: SportType;
  tournamentType: TournamentType;
  status?: EventStatus;
  eventStartDate?: string | Date | null;
  eventEndDate?: string | Date | null;
  location?: string | null;
  posterImageUrl?: string | null;
  formTitle?: string | null;
  formDescription?: string | null;
  registrationOpenDate?: string | Date | null;
  registrationCloseDate?: string | Date | null;
  formSchema?: any | null;
  templateFields?: PublicEventTemplateField[] | null;
}

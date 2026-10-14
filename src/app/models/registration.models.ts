export enum RegistrationStatus {
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3,
}

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'Pending',
  [RegistrationStatus.APPROVED]: 'Approved',
  [RegistrationStatus.REJECTED]: 'Rejected',
};

export enum DuplicateAction {
  MERGE = 'MERGE',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

export interface FieldResponse {
  templateFieldId: number;
  fieldName: string;
  fieldLabel: string;
  value?: string | null;
  displayValue?: string | null;
}

export interface RegistrationListItem {
  registrationId: number;
  participantId: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  status: RegistrationStatus;
  registrationDate: string | Date;
}

export interface RegistrationDetail extends RegistrationListItem {
  responses: FieldResponse[];
}

export interface SubmitFieldResponseDto {
  templateFieldId: number;
  value?: string | null;
}

export interface SubmitRegistrationDto {
  fullName: string;
  email?: string;
  phone?: string;
  dob?: string;
  responses: SubmitFieldResponseDto[];
}

export interface UpdateRegistrationStatusDto {
  status: RegistrationStatus;
}

export interface BatchUpdateRegistrationStatusDto {
  registrationIds: number[];
  status: RegistrationStatus;
}

export interface DuplicateParticipant {
  participantId: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  dob?: string | null;
  state?: string | null;
  district?: string | null;
  weightCategory?: string | null;
  ageCategory?: string | null;
}

export interface DuplicateGroup {
  isCrossState: boolean;
  isCrossDistrict: boolean;
  participants: DuplicateParticipant[];
}

export interface ResolveDuplicateDto {
  participantIds: number[];
  action: DuplicateAction;
  keepParticipantId?: number;
}

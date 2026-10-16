import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormTemplatesPage } from './form-templates';
import { FormDefinitionStore } from '../../stores/form-definition.store';
import { FormDefinitionService } from '../../services/form-definition.service';
import { AuthStore } from '../../stores/auth.store';
import { LayoutStore } from '../../stores/layout.store';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { FormTemplate } from '../../models/form-definition.models';

describe('FormTemplatesPage', () => {
  let component: FormTemplatesPage;
  let fixture: ComponentFixture<FormTemplatesPage>;

  const mockTemplates: FormTemplate[] = [
    {
      templateId: 1,
      templateName: 'Standard Karate Registration',
      templateType: 'PRESET',
      sportType: 1,
      tournamentType: 1,
      isActive: true,
      fields: [],
      formSchema: {
        fields: [
          {
            key: 'belt_rank',
            label: 'Belt Rank',
            type: 'select',
            required: true,
            columnSpan: 1,
            options: [{ label: 'Black', value: 'black' }],
          },
        ],
        compoundRules: [],
      },
    },
    {
      templateId: 2,
      templateName: 'Custom BJJ Open Form',
      templateType: 'CUSTOM',
      sportType: 2,
      tournamentType: 2,
      isActive: false,
      fields: [],
      formSchema: {
        fields: [],
        compoundRules: [],
      },
    },
  ];

  const templatesSignal = signal<FormTemplate[]>(mockTemplates);
  const presetsSignal = signal<FormTemplate[]>([mockTemplates[0]]);
  const statusSignal = signal<'idle' | 'loading' | 'success' | 'error'>('success');
  const errorSignal = signal<string | null>(null);

  let toggleTemplateStatusMock: ReturnType<typeof vi.fn>;
  let deleteTemplateMock: ReturnType<typeof vi.fn>;
  let setSearchQueryMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    templatesSignal.set([...mockTemplates]);
    statusSignal.set('success');
    errorSignal.set(null);

    toggleTemplateStatusMock = vi.fn();
    deleteTemplateMock = vi.fn();
    setSearchQueryMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [FormTemplatesPage],
      providers: [
        provideRouter([]),
        {
          provide: FormDefinitionStore,
          useValue: {
            templates: templatesSignal,
            filteredTemplates: templatesSignal,
            presets: presetsSignal,
            status: statusSignal,
            error: errorSignal,
            loadTemplates: vi.fn(),
            loadPresets: vi.fn(),
            setSearchQuery: setSearchQueryMock,
            toggleTemplateStatus: toggleTemplateStatusMock,
            deleteTemplate: deleteTemplateMock,
          },
        },
        {
          provide: FormDefinitionService,
          useValue: {
            getTemplateById: vi.fn(() => of(mockTemplates[0])),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: signal(true),
            user: signal({ firstName: 'Super', lastName: 'Admin' }),
            userFullName: signal('Super Admin'),
            userEmail: signal('admin@test.com'),
            userRoleName: signal('SUPERADMIN'),
            userInitials: signal('SA'),
            logout: vi.fn(),
          },
        },
        {
          provide: LayoutStore,
          useValue: {
            isSidebarCollapsed: signal(false),
            toggleSidebar: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormTemplatesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render template cards (HF-NAV-011)', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.template-card');
    expect(cards.length).toBe(2);

    const title = compiled.querySelector('.page-title');
    expect(title?.textContent?.trim()).toBe('Form Templates');
    expect(compiled.textContent).toContain('Standard Karate Registration');
    expect(compiled.textContent).toContain('Custom BJJ Open Form');
  });

  it('should update search query via search input', () => {
    component.searchControl.setValue('Karate');
    expect(setSearchQueryMock).toHaveBeenCalledWith('Karate');
  });

  it('should open and close create template setup modal, and toggle preset selection', () => {
    expect(component.isCreateTemplateModalOpen()).toBe(false);

    component.openCreateTemplateModal();
    fixture.detectChanges();
    expect(component.isCreateTemplateModalOpen()).toBe(true);

    // Select preset
    component.onSelectBasePreset(1);
    expect(component.selectedBasePresetId()).toBe(1);

    component.onSelectBasePreset(null);
    expect(component.selectedBasePresetId()).toBeNull();

    component.closeCreateTemplateModal();
    expect(component.isCreateTemplateModalOpen()).toBe(false);
  });

  it('should open live preview modal with form simulation', () => {
    expect(component.previewingTemplate()).toBeNull();

    component.openPreviewModal(mockTemplates[0]);
    fixture.detectChanges();

    expect(component.previewingTemplate()).toEqual(mockTemplates[0]);
    expect(component.previewFormDefinition()).toBeTruthy();
    expect(component.previewFormDefinition()?.fields.some((f) => f.key === 'belt_rank')).toBe(true);
    expect(component.previewFormDefinition()?.fields.some((f) => f.key === 'fullName')).toBe(true);

    component.closePreviewModal();
    expect(component.previewingTemplate()).toBeNull();
  });

  it('should toggle template status when requested', () => {
    component.onToggleTemplateStatus(1, true);
    expect(toggleTemplateStatusMock).toHaveBeenCalledWith({ id: 1, isActive: false });

    component.onToggleTemplateStatus(2, false);
    expect(toggleTemplateStatusMock).toHaveBeenCalledWith({ id: 2, isActive: true });
  });

  it('should delete custom template when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.onDeleteTemplate(2);
    expect(deleteTemplateMock).toHaveBeenCalledWith(2);
  });
});

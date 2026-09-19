import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { OperationNotificationService } from '../../../core/services/operation-notification.service';
import { ReaderProfile, UpdateProfileRequest } from '../models/reader.models';
import { ProfileFacade } from './profile.facade';
import { ReaderService } from './reader.service';

describe('ProfileFacade editing', () => {
  const profile: ReaderProfile = { id: 'u1', username: 'ana', displayName: 'Ana', email: 'ana@example.test', role: 'admin', createdAt: '2026-01-01T00:00:00Z', lastLoginAt: null, updatedAt: '2026-01-01T00:00:00Z' };
  const request: UpdateProfileRequest = { displayName: 'Ana Nueva', email: profile.email, avatarUrl: null, expectedUpdatedAt: profile.updatedAt! };
  let reader: jasmine.SpyObj<ReaderService>;
  let auth: jasmine.SpyObj<AuthService>;
  let toast: jasmine.SpyObj<OperationNotificationService>;
  let response: Subject<ReaderProfile>;
  let facade: ProfileFacade;
  beforeEach(() => {
    reader = jasmine.createSpyObj('ReaderService', ['getProfile', 'updateProfile', 'getLoans', 'getFavorites']);
    auth = jasmine.createSpyObj('AuthService', ['syncCurrentUser']);
    toast = jasmine.createSpyObj('OperationNotificationService', ['success', 'error']);
    response = new Subject();
    reader.getProfile.and.returnValue(of(profile)); reader.updateProfile.and.returnValue(response);
    TestBed.configureTestingModule({ providers: [ProfileFacade, { provide: ReaderService, useValue: reader }, { provide: AuthService, useValue: auth }, { provide: OperationNotificationService, useValue: toast }] });
    facade = TestBed.inject(ProfileFacade);
  });
  it('does not request reader-only statistics for staff', () => {
    expect(reader.getLoans).not.toHaveBeenCalled(); expect(reader.getFavorites).not.toHaveBeenCalled();
    expect(facade.profile().data).toEqual(profile);
  });
  it('prevents duplicate submissions and syncs session only after a successful response', () => {
    facade.save(request); facade.save(request);
    expect(reader.updateProfile).toHaveBeenCalledTimes(1); expect(facade.saving()).toBeTrue();
    expect(auth.syncCurrentUser).not.toHaveBeenCalled();
    const updated = { ...profile, displayName: request.displayName, updatedAt: '2026-01-02T00:00:00Z' };
    response.next(updated);
    expect(facade.saving()).toBeFalse(); expect(facade.profile().data).toEqual(updated);
    expect(auth.syncCurrentUser).toHaveBeenCalledWith(updated); expect(toast.success).toHaveBeenCalled();
  });
  it('preserves saved identity on conflict and requires an explicit reload before resubmitting', () => {
    facade.save(request); response.error({ status: 409 });
    expect(facade.saving()).toBeFalse(); expect(facade.conflict()).toBeTrue();
    expect(facade.profile().data).toEqual(profile); expect(auth.syncCurrentUser).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled(); facade.save(request); expect(reader.updateProfile).toHaveBeenCalledTimes(1);
    facade.load(); expect(facade.conflict()).toBeFalse(); expect(reader.getProfile).toHaveBeenCalledTimes(2);
  });
});

import { Employee } from '../../models/Employee';

/**
 * Adapter to convert legacy `/employees` records to `Employee` domain model.
 * Implementation should be careful to preserve `id` and `matricule`.
 */
export class LegacyEmployeeAdapter {
  static toDomain(legacy: any): Employee {
    return {
      id: legacy.id,
      matricule: legacy.matricule,
      name: legacy.anarana,
      nationalId: legacy.cin || undefined,
      birthDate: legacy.date_naissance || undefined,
      departments: legacy.departments,
      position: legacy.poste,
      email: legacy.email_notification || undefined,
      telephone: legacy.telephone || undefined,
      photoUrl: legacy.photo || undefined,
      submittedAt: legacy.submitted_at || undefined,
      metadata: {}
    };
  }
}

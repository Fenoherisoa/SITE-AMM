import { Department } from '../../models/Department';

export interface IDepartmentRepository {
  list(): Promise<Department[]>;
  getById(id: string): Promise<Department | null>;
  create(dept: Department): Promise<void>;
  update(id: string, patch: Partial<Department>): Promise<void>;
}

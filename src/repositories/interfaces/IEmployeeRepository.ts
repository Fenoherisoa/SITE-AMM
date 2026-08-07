import { Employee } from '../../models/Employee';

export interface IEmployeeRepository {
  getById(id: string): Promise<Employee | null>;
  list(filter?: any, page?: number, pageSize?: number): Promise<Employee[]>;
  create(employee: Employee): Promise<void>;
  update(id: string, patch: Partial<Employee>): Promise<void>;
  archive(id: string, by: string): Promise<void>;
}

import { Member } from '../../models/Member';

export interface IMemberRepository {
  getById(id: string): Promise<Member | null>;
  search(query: string, options?: any): Promise<Member[]>;
  create(member: Member): Promise<void>;
  update(id: string, patch: Partial<Member>): Promise<void>;
}

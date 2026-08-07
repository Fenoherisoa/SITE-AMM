import { EventModel } from '../../models/Event';

export interface IEventRepository {
  getById(id: string): Promise<EventModel | null>;
  list(filter?: any): Promise<EventModel[]>;
  create(event: EventModel): Promise<void>;
  update(id: string, patch: Partial<EventModel>): Promise<void>;
}

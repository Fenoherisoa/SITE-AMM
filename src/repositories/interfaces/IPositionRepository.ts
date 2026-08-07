import { Position } from '../../models/Position';

export interface IPositionRepository {
  list(): Promise<Position[]>;
  getById(id: string): Promise<Position | null>;
}

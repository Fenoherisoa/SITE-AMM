import { PointageDay } from '../../models/Pointage';

export interface IPointageRepository {
  getByDate(date: string): Promise<PointageDay | null>;
  setDay(pointage: PointageDay): Promise<void>;
}

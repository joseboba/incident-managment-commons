import { Column } from 'typeorm';

export abstract class BaseEntity {
  @Column({ type: 'boolean', name: 'is_active' })
  public isActive: boolean;

  @Column({
    type: 'boolean',
    name: 'is_deleted',
  })
  public isDeleted: boolean;
}

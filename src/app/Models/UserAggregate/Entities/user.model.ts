import { Entity } from "../../EntityAggregate/Entities/Entity.model";

export class User {
  email: string = '';
  entities: Entity[] | undefined;
  status?: boolean; 
  IsActive?: boolean;
  claimType?: number;  
}
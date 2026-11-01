import { EntityRoleItem } from "../../EntityAggregate/Entities/Entity.model";

/** Usuário na tela de gestão de usuários. */
export interface User {
  userId: string;
  email: string;
  name?: string | null;
  isActive: boolean;
  createdAt: Date;
  claimType: number;
  cityName?: string | null;
  residenceEntityName?: string | null;
  roles: EntityRoleItem[];
}

export interface SaveUser {
  userId: string;
  isActive: boolean;
  isAdminGeral?: boolean | null;
  roles: EntityRoleItem[];
}

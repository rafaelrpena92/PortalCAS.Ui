import { City, Entity, EntityRoleItem } from "../../EntityAggregate/Entities/Entity.model";

export interface DomainUser {
    id: string;
    firebaseUid: string;
    email: string;
    name?: string | null;
    claimType: number;
    isAdminGeral: boolean;
    createdAt: Date;
    city?: City | null;
    residenceEntity?: Entity | null;
    roles: EntityRoleItem[];
    lastViewedEntity?: Entity | null;
}

export interface UpdateProfile {
    name?: string | null;
    cityId?: number | null;
}

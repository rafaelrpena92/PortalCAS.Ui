import { Entity } from "../../EntityAggregate/Entities/Entity.model";

export interface DomainUser {
    id: string;
    firebaseUid: string;
    email: string;
    claimType: number;
    createdAt: Date;
    entities : Entity[];
    lastSelectedEntity? : Entity;
    selectedEntity?: Entity;
}
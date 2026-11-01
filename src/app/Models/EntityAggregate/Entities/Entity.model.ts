/** CAS (unidade regional). */
export interface Entity {
    entityId: string;
    name: string;
}

/** Município do Paraná (id = código IBGE) e o CAS que o atende. */
export interface City {
    id: number;
    name: string;
    entityId?: string | null;
    entityName?: string | null;
}

export enum EntityRole {
    Avaliador = 1,
    AdminCas = 2
}

export const EntityRoleLabel: Record<EntityRole, string> = {
    [EntityRole.Avaliador]: 'Avaliador',
    [EntityRole.AdminCas]: 'Administrador do CAS'
};

/** Papel em um CAS. No salvar, role nulo remove o vínculo. */
export interface EntityRoleItem {
    entityId: string;
    entityName?: string;
    role: EntityRole | null;
}

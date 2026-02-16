export interface DomainUser {
    id: string;
    firebaseUid: string;
    email: string;
    claimType: number;
    createdAt: Date;
}
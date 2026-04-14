export declare class CreateMedicationDto {
    name: string;
    dose: string;
    frequency: number;
    intervalHours: number;
    instructions?: string;
    startDate: string;
    endDate?: string;
    schedule: string[];
}

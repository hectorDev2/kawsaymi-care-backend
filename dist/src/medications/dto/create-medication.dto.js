"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMedicationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateMedicationDto {
    name;
    dose;
    frequency;
    intervalHours;
    instructions;
    startDate;
    endDate;
    schedule;
}
exports.CreateMedicationDto = CreateMedicationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ibuprofeno' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '400mg' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicationDto.prototype, "dose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: 'Veces por día' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateMedicationDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8, description: 'Horas entre dosis' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateMedicationDto.prototype, "intervalHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Tomar con comida' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMedicationDto.prototype, "instructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-14T00:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMedicationDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-05-14T00:00:00.000Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMedicationDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['2026-04-14T08:00:00.000Z', '2026-04-14T16:00:00.000Z', '2026-04-14T22:00:00.000Z'],
        description: 'Horarios de toma en formato ISO 8601',
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMedicationDto.prototype, "schedule", void 0);
//# sourceMappingURL=create-medication.dto.js.map
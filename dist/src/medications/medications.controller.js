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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const medications_service_1 = require("./medications.service");
const create_medication_dto_1 = require("./dto/create-medication.dto");
const update_medication_dto_1 = require("./dto/update-medication.dto");
const update_medication_status_dto_1 = require("./dto/update-medication-status.dto");
let MedicationsController = class MedicationsController {
    medicationsService;
    constructor(medicationsService) {
        this.medicationsService = medicationsService;
    }
    list(user) {
        return this.medicationsService.list(user.id);
    }
    get(user, id) {
        return this.medicationsService.get(user.id, id);
    }
    create(user, dto) {
        return this.medicationsService.create(user.id, dto);
    }
    update(user, id, dto) {
        return this.medicationsService.update(user.id, id, dto);
    }
    updateStatus(user, id, dto) {
        return this.medicationsService.updateStatus(user.id, id, dto.status);
    }
    remove(user, id) {
        return this.medicationsService.remove(user.id, id);
    }
};
exports.MedicationsController = MedicationsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los medicamentos del usuario' }),
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MedicationsController.prototype, "list", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un medicamento' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MedicationsController.prototype, "get", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Crear medicamento — el campo schedule define los horarios de toma' }),
    (0, common_1.Post)(),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_medication_dto_1.CreateMedicationDto]),
    __metadata("design:returntype", void 0)
], MedicationsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos del medicamento' }),
    (0, common_1.Put)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_medication_dto_1.UpdateMedicationDto]),
    __metadata("design:returntype", void 0)
], MedicationsController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estado: ACTIVE | SUSPENDED | COMPLETED' }),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_medication_status_dto_1.UpdateMedicationStatusDto]),
    __metadata("design:returntype", void 0)
], MedicationsController.prototype, "updateStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar medicamento y sus eventos asociados' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MedicationsController.prototype, "remove", null);
exports.MedicationsController = MedicationsController = __decorate([
    (0, swagger_1.ApiTags)('Medications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('medications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [medications_service_1.MedicationsService])
], MedicationsController);
//# sourceMappingURL=medications.controller.js.map
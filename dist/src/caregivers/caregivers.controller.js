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
exports.CaregiversController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const caregivers_service_1 = require("./caregivers.service");
const invite_caregiver_dto_1 = require("./dto/invite-caregiver.dto");
const update_permissions_dto_1 = require("./dto/update-permissions.dto");
let CaregiversController = class CaregiversController {
    caregiversService;
    constructor(caregiversService) {
        this.caregiversService = caregiversService;
    }
    invite(user, dto) {
        return this.caregiversService.invite(user.id, dto);
    }
    myPatients(user) {
        return this.caregiversService.myPatients(user.id);
    }
    myCaregivers(user) {
        return this.caregiversService.myCaregivers(user.id);
    }
    updatePermissions(user, id, dto) {
        return this.caregiversService.updatePermissions(user.id, id, dto.permissions);
    }
    remove(user, id) {
        return this.caregiversService.remove(user.id, id);
    }
    alerts(user, patientId) {
        return this.caregiversService.patientAlerts(user.id, patientId);
    }
};
exports.CaregiversController = CaregiversController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Invitar cuidador por email — el cuidador debe estar registrado en la app' }),
    (0, common_1.Post)('invite'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, invite_caregiver_dto_1.InviteCaregiverDto]),
    __metadata("design:returntype", void 0)
], CaregiversController.prototype, "invite", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Listar mis pacientes (para cuidadores)' }),
    (0, common_1.Get)('my-patients'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CaregiversController.prototype, "myPatients", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Listar mis cuidadores (para pacientes)' }),
    (0, common_1.Get)('my-caregivers'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CaregiversController.prototype, "myCaregivers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar permisos de una relación — solo el paciente puede hacerlo' }),
    (0, common_1.Patch)(':id/permissions'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_permissions_dto_1.UpdatePermissionsDto]),
    __metadata("design:returntype", void 0)
], CaregiversController.prototype, "updatePermissions", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar relación cuidador-paciente — cualquiera de los dos puede hacerlo' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CaregiversController.prototype, "remove", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Ver alertas del paciente — eventos omitidos en los últimos 7 días' }),
    (0, common_1.Get)(':patientId/alerts'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CaregiversController.prototype, "alerts", null);
exports.CaregiversController = CaregiversController = __decorate([
    (0, swagger_1.ApiTags)('Caregivers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('caregivers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [caregivers_service_1.CaregiversService])
], CaregiversController);
//# sourceMappingURL=caregivers.controller.js.map
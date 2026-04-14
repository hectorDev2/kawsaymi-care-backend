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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const health_service_1 = require("./health.service");
const update_weight_dto_1 = require("./dto/update-weight.dto");
let HealthController = class HealthController {
    healthService;
    constructor(healthService) {
        this.healthService = healthService;
    }
    profile(user) {
        return this.healthService.profile(user.id);
    }
    updateWeight(user, dto) {
        return this.healthService.updateWeight(user.id, dto.weight);
    }
    imc(user) {
        return this.healthService.imc(user.id);
    }
    polypharmacy(user) {
        return this.healthService.polypharmacy(user.id);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Obtener perfil de salud — crea uno vacío si no existe' }),
    (0, common_1.Get)('profile'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "profile", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Registrar peso en kg — recalcula IMC automáticamente si hay talla' }),
    (0, common_1.Post)('weight'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_weight_dto_1.UpdateWeightDto]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "updateWeight", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Obtener IMC calculado — requiere tener peso y talla registrados' }),
    (0, common_1.Get)('imc'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "imc", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Detectar polifarmacia — true si el usuario tiene 5 o más medicamentos activos' }),
    (0, common_1.Get)('polypharmacy'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "polypharmacy", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('health'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [health_service_1.HealthService])
], HealthController);
//# sourceMappingURL=health.controller.js.map
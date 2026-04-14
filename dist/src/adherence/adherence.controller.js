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
exports.AdherenceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const adherence_service_1 = require("./adherence.service");
let AdherenceController = class AdherenceController {
    adherenceService;
    constructor(adherenceService) {
        this.adherenceService = adherenceService;
    }
    today(user) {
        return this.adherenceService.today(user.id);
    }
    week(user) {
        return this.adherenceService.week(user.id);
    }
    month(user) {
        return this.adherenceService.month(user.id);
    }
    stats(user) {
        return this.adherenceService.stats(user.id);
    }
};
exports.AdherenceController = AdherenceController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Adherencia de hoy — taken/missed/pending y porcentaje' }),
    (0, common_1.Get)('today'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdherenceController.prototype, "today", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Adherencia de la semana actual' }),
    (0, common_1.Get)('week'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdherenceController.prototype, "week", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Adherencia del mes actual' }),
    (0, common_1.Get)('month'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdherenceController.prototype, "month", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Stats generales: adherencia semanal + cantidad de medicamentos activos' }),
    (0, common_1.Get)('stats'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdherenceController.prototype, "stats", null);
exports.AdherenceController = AdherenceController = __decorate([
    (0, swagger_1.ApiTags)('Adherence'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('adherence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [adherence_service_1.AdherenceService])
], AdherenceController);
//# sourceMappingURL=adherence.controller.js.map
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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const events_service_1 = require("./events.service");
const events_range_query_dto_1 = require("./dto/events-range-query.dto");
let EventsController = class EventsController {
    eventsService;
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    list(user, query) {
        return this.eventsService.list(user.id, query);
    }
    today(user) {
        return this.eventsService.today(user.id);
    }
    week(user) {
        return this.eventsService.week(user.id);
    }
    markTaken(user, id) {
        return this.eventsService.mark(user.id, id, 'TAKEN');
    }
    markMissed(user, id) {
        return this.eventsService.mark(user.id, id, 'MISSED');
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Listar eventos con filtros opcionales de fecha, medicamento y estado' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, example: '2026-04-14T00:00:00.000Z' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, example: '2026-04-21T00:00:00.000Z' }),
    (0, swagger_1.ApiQuery)({ name: 'medicationId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'TAKEN', 'MISSED'] }),
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, events_range_query_dto_1.EventsRangeQueryDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "list", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Eventos de hoy — genera automáticamente si no existen' }),
    (0, common_1.Get)('today'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "today", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Eventos de la semana actual — genera automáticamente si no existen' }),
    (0, common_1.Get)('week'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "week", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Marcar evento como tomado' }),
    (0, common_1.Patch)(':id/mark-taken'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "markTaken", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Marcar evento como omitido' }),
    (0, common_1.Patch)(':id/mark-missed'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "markMissed", null);
exports.EventsController = EventsController = __decorate([
    (0, swagger_1.ApiTags)('Events'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map
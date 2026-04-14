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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const users_service_1 = require("./users.service");
const update_me_dto_1 = require("./dto/update-me.dto");
const update_allergies_dto_1 = require("./dto/update-allergies.dto");
const update_conditions_dto_1 = require("./dto/update-conditions.dto");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    me(user) {
        return this.usersService.getMe(user.id);
    }
    updateMe(user, dto) {
        return this.usersService.updateMe(user.id, dto);
    }
    updateAllergies(user, dto) {
        return this.usersService.updateAllergies(user.id, dto.allergies);
    }
    updateConditions(user, dto) {
        return this.usersService.updateConditions(user.id, dto.conditions);
    }
    deleteMe(user) {
        return this.usersService.deleteMe(user.id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Obtener perfil del usuario autenticado' }),
    (0, common_1.Get)('me'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "me", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar nombre, fecha de nacimiento, ubicación, idioma y timezone' }),
    (0, common_1.Put)('me'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_me_dto_1.UpdateMeDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar lista de alergias' }),
    (0, common_1.Put)('me/allergies'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_allergies_dto_1.UpdateAllergiesDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateAllergies", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar condiciones médicas' }),
    (0, common_1.Put)('me/conditions'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_conditions_dto_1.UpdateConditionsDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateConditions", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar cuenta y todos los datos asociados' }),
    (0, common_1.Delete)('me'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteMe", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map
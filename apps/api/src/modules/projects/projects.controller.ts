import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ContributeDto } from './dto/contribute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ProjectStatus } from '@prisma/client';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new savings project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiQuery({ name: 'status', enum: ProjectStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of projects' })
  findAll(@CurrentUser() user: JwtPayload, @Query('status') status?: ProjectStatus) {
    return this.projectsService.findAll(user.sub, status);
  }

  @Get('total-savings')
  @ApiOperation({ summary: 'Get total savings across active projects' })
  async getTotalSavings(@CurrentUser() user: JwtPayload) {
    const total = await this.projectsService.getTotalSavings(user.sub);
    return { total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project found' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.findOne(id, user.sub);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get project progress details' })
  getProgress(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.getProgress(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.sub, dto);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Contribute to project' })
  @ApiResponse({ status: 200, description: 'Contribution added' })
  contribute(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ContributeDto,
  ) {
    return this.projectsService.contribute(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.projectsService.remove(id, user.sub);
    return { message: 'Project deleted successfully' };
  }
}

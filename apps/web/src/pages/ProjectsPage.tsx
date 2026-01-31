import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Calendar, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProjectModal } from '../components/modals/ProjectModal';
import { ContributeModal } from '../components/modals/ContributeModal';
import { projectsService } from '../services/projects.service';
import { getApiErrorMessage } from '../services/api';
import { formatCurrency, formatDate, PROJECT_STATUS_LABELS, getDaysUntil } from '@moneystack/shared';
import { clsx } from 'clsx';
import type { Project } from '@moneystack/shared';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: projectsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Projet supprimé');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleOpenProjectModal = (project?: Project) => {
    setSelectedProject(project || null);
    setIsProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setSelectedProject(null);
    setIsProjectModalOpen(false);
  };

  const handleOpenContributeModal = (project: Project) => {
    setSelectedProject(project);
    setIsContributeModalOpen(true);
  };

  const handleCloseContributeModal = () => {
    setSelectedProject(null);
    setIsContributeModalOpen(false);
  };

  const handleDelete = (project: Project) => {
    if (window.confirm(`Supprimer le projet "${project.name}" ?`)) {
      deleteMutation.mutate(project.id);
    }
  };

  const totalSavings = projects?.reduce((sum, p) => sum + p.currentAmount, 0) || 0;
  const activeProjects = projects?.filter((p) => p.status === 'ACTIVE') || [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projets d'épargne</h1>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenProjectModal()}>
          Nouveau projet
        </Button>
      </div>

      {/* Summary card */}
      <Card className="bg-gradient-to-r from-violet-500 to-violet-600 text-white">
        <CardBody>
          <p className="text-violet-100">Épargne totale</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalSavings)}</p>
          <p className="text-violet-200 text-sm mt-2">
            {activeProjects.length} projet{activeProjects.length > 1 ? 's' : ''} en cours
          </p>
        </CardBody>
      </Card>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects?.map((project) => {
          const progress =
            project.targetAmount > 0
              ? (project.currentAmount / project.targetAmount) * 100
              : 0;
          const daysLeft = project.deadline ? getDaysUntil(project.deadline) : null;

          return (
            <Card key={project.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <Target className="w-6 h-6" style={{ color: project.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <span
                        className={clsx(
                          'badge mt-1',
                          project.status === 'ACTIVE'
                            ? 'badge-primary'
                            : project.status === 'COMPLETED'
                              ? 'badge-success'
                              : 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </div>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progression</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, progress)}%`,
                          backgroundColor: project.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-gray-500">Épargné</p>
                      <p className="text-xl font-bold" style={{ color: project.color }}>
                        {formatCurrency(project.currentAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Objectif</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatCurrency(project.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {project.deadline && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(project.deadline)}
                      </div>
                      {daysLeft !== null && (
                        <span
                          className={clsx(
                            'text-sm font-medium',
                            daysLeft < 0
                              ? 'text-danger-500'
                              : daysLeft < 30
                                ? 'text-warning-600'
                                : 'text-gray-600',
                          )}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} jours de retard`
                            : `${daysLeft} jours restants`}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenContributeModal(project)}
                    disabled={project.status !== 'ACTIVE'}
                  >
                    Contribuer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenProjectModal(project)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(project)}
                  >
                    <Trash2 className="w-4 h-4 text-danger-500" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}

        {/* Add project card */}
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-violet-300 transition-colors cursor-pointer"
          onClick={() => handleOpenProjectModal()}
        >
          <CardBody className="flex flex-col items-center justify-center h-full min-h-[240px]">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Créer un projet</p>
            <p className="text-xs text-gray-400 mt-1">
              Définissez un objectif d'épargne
            </p>
          </CardBody>
        </Card>
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={handleCloseProjectModal}
        project={selectedProject}
      />

      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={handleCloseContributeModal}
        project={selectedProject}
      />
    </div>
  );
}

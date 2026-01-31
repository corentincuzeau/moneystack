import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { projectsService, type CreateProjectDto } from '../../services/projects.service';
import { accountsService } from '../../services/accounts.service';
import { getApiErrorMessage } from '../../services/api';
import { DEFAULT_COLORS, PROJECT_STATUS_LABELS } from '@moneystack/shared';
import type { Project, Account } from '@moneystack/shared';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateProjectDto & { status?: string }>({
    accountId: '',
    name: '',
    description: '',
    targetAmount: 0,
    deadline: '',
    color: DEFAULT_COLORS[4], // Violet
    icon: 'target',
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        accountId: project.accountId || '',
        name: project.name,
        description: project.description || '',
        targetAmount: project.targetAmount,
        deadline: project.deadline
          ? new Date(project.deadline).toISOString().split('T')[0]
          : '',
        color: project.color || DEFAULT_COLORS[4],
        icon: project.icon || 'target',
        status: project.status,
      });
    } else {
      setFormData({
        accountId: accounts?.[0]?.id || '',
        name: '',
        description: '',
        targetAmount: 0,
        deadline: '',
        color: DEFAULT_COLORS[4],
        icon: 'target',
      });
    }
  }, [project, isOpen, accounts]);

  const createMutation = useMutation({
    mutationFn: projectsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("Projet d'épargne créé avec succès");
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProjectDto & { status?: string }> }) =>
      projectsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Projet mis à jour');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Veuillez entrer un nom pour le projet');
      return;
    }

    if (formData.targetAmount <= 0) {
      toast.error("L'objectif doit être supérieur à 0");
      return;
    }

    if (project) {
      updateMutation.mutate({ id: project.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const accountOptions = [
    { value: '', label: 'Non lié à un compte' },
    ...(accounts || []).map((acc: Account) => ({
      value: acc.id,
      label: acc.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Modifier le projet' : "Nouveau projet d'épargne"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Nom du projet"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Vacances été 2025"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre objectif..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Objectif"
              type="number"
              step="0.01"
              min="0"
              value={formData.targetAmount || ''}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })
              }
              placeholder="5000"
              required
            />

            <Input
              label="Date limite (optionnel)"
              type="date"
              value={formData.deadline || ''}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <Select
            label="Compte lié (optionnel)"
            value={formData.accountId || ''}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            options={accountOptions}
          />

          {project && (
            <Select
              label="Statut"
              value={formData.status || 'ACTIVE'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={STATUS_OPTIONS}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {project ? 'Mettre à jour' : 'Créer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

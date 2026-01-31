import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { projectsService, type AddContributionDto } from '../../services/projects.service';
import { accountsService } from '../../services/accounts.service';
import { getApiErrorMessage } from '../../services/api';
import { formatCurrency } from '@moneystack/shared';
import type { Project, Account } from '@moneystack/shared';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function ContributeModal({ isOpen, onClose, project }: ContributeModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AddContributionDto>({
    accountId: '',
    amount: 0,
    notes: '',
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        accountId: project?.accountId || accounts?.[0]?.id || '',
        amount: 0,
        notes: '',
      });
    }
  }, [isOpen, project, accounts]);

  const contributeMutation = useMutation({
    mutationFn: (data: AddContributionDto) => {
      if (!project) throw new Error('No project selected');
      return projectsService.addContribution(project.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Contribution ajoutée avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountId) {
      toast.error('Veuillez sélectionner un compte');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    contributeMutation.mutate(formData);
  };

  if (!project) return null;

  const remaining = project.targetAmount - project.currentAmount;
  const accountOptions = (accounts || []).map((acc: Account) => ({
    value: acc.id,
    label: `${acc.name} (${formatCurrency(acc.balance)})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Contribuer à "${project.name}"`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progression actuelle</span>
              <span className="font-medium">
                {Math.round((project.currentAmount / project.targetAmount) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (project.currentAmount / project.targetAmount) * 100)}%`,
                  backgroundColor: project.color,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatCurrency(project.currentAmount)} épargné</span>
              <span>{formatCurrency(remaining)} restant</span>
            </div>
          </div>

          <Select
            label="Depuis le compte"
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            options={accountOptions}
            required
          />

          <Input
            label="Montant"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount || ''}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
            }
            placeholder={remaining > 0 ? `Max: ${formatCurrency(remaining)}` : '0'}
            required
          />

          {remaining > 0 && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData({ ...formData, amount: remaining })}
              >
                Compléter ({formatCurrency(remaining)})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData({ ...formData, amount: Math.round(remaining / 2) })}
              >
                Moitié ({formatCurrency(Math.round(remaining / 2))})
              </Button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Raison de cette contribution..."
            />
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={contributeMutation.isPending}>
            Contribuer
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

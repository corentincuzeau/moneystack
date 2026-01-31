import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { creditsService, type CreateCreditDto } from '../../services/credits.service';
import { accountsService } from '../../services/accounts.service';
import { getApiErrorMessage } from '../../services/api';
import { CREDIT_TYPE_LABELS } from '@moneystack/shared';
import type { Credit, Account } from '@moneystack/shared';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit?: Credit | null;
}

const CREDIT_TYPES = Object.entries(CREDIT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function CreditModal({ isOpen, onClose, credit }: CreditModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateCreditDto & { remainingAmount?: number }>({
    accountId: '',
    name: '',
    type: 'PERSONAL',
    totalAmount: 0,
    remainingAmount: undefined,
    monthlyPayment: 0,
    interestRate: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    paymentDay: 1,
    reminderDays: 3,
    notes: '',
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  useEffect(() => {
    if (credit) {
      setFormData({
        accountId: credit.accountId,
        name: credit.name,
        type: credit.type,
        totalAmount: credit.totalAmount,
        remainingAmount: credit.remainingAmount,
        monthlyPayment: credit.monthlyPayment,
        interestRate: credit.interestRate,
        startDate: new Date(credit.startDate).toISOString().split('T')[0],
        endDate: new Date(credit.endDate).toISOString().split('T')[0],
        paymentDay: credit.paymentDay,
        reminderDays: credit.reminderDays || 3,
        notes: credit.notes || '',
      });
    } else {
      setFormData({
        accountId: accounts?.[0]?.id || '',
        name: '',
        type: 'PERSONAL',
        totalAmount: 0,
        remainingAmount: undefined,
        monthlyPayment: 0,
        interestRate: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        paymentDay: 1,
        reminderDays: 3,
        notes: '',
      });
    }
  }, [credit, isOpen, accounts]);

  const createMutation = useMutation({
    mutationFn: creditsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Crédit ajouté avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCreditDto> }) =>
      creditsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Crédit mis à jour');
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

    if (!formData.name.trim()) {
      toast.error('Veuillez entrer un nom pour le crédit');
      return;
    }

    if (formData.totalAmount <= 0) {
      toast.error('Le montant total doit être supérieur à 0');
      return;
    }

    if (formData.monthlyPayment <= 0) {
      toast.error('La mensualité doit être supérieure à 0');
      return;
    }

    if (!formData.endDate) {
      toast.error('Veuillez définir une date de fin');
      return;
    }

    if (credit) {
      updateMutation.mutate({ id: credit.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const accountOptions = (accounts || []).map((acc: Account) => ({
    value: acc.id,
    label: acc.name,
  }));

  // Generate payment day options (1-28)
  const paymentDayOptions = Array.from({ length: 28 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={credit ? 'Modifier le crédit' : 'Nouveau crédit'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Nom du crédit"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Prêt immobilier maison"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type de crédit"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={CREDIT_TYPES}
              required
            />

            <Select
              label="Compte associé"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              options={accountOptions}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Montant total"
              type="number"
              step="0.01"
              min="0"
              value={formData.totalAmount || ''}
              onChange={(e) =>
                setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
              }
              placeholder="150000"
              required
            />

            <Input
              label="Mensualité"
              type="number"
              step="0.01"
              min="0"
              value={formData.monthlyPayment || ''}
              onChange={(e) =>
                setFormData({ ...formData, monthlyPayment: parseFloat(e.target.value) || 0 })
              }
              placeholder="800"
              required
            />
          </div>

          {credit && (
            <Input
              label="Montant restant dû"
              type="number"
              step="0.01"
              min="0"
              value={formData.remainingAmount || ''}
              onChange={(e) =>
                setFormData({ ...formData, remainingAmount: parseFloat(e.target.value) || 0 })
              }
              placeholder="Capital restant à rembourser"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Taux d'intérêt (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.interestRate || ''}
              onChange={(e) =>
                setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })
              }
              placeholder="2.5"
              required
            />

            <Select
              label="Jour de prélèvement"
              value={String(formData.paymentDay)}
              onChange={(e) =>
                setFormData({ ...formData, paymentDay: parseInt(e.target.value, 10) })
              }
              options={paymentDayOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />

            <Input
              label="Date de fin"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Rappel (jours avant échéance)"
            type="number"
            min="0"
            max="30"
            value={formData.reminderDays || ''}
            onChange={(e) =>
              setFormData({ ...formData, reminderDays: parseInt(e.target.value, 10) || 0 })
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {credit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

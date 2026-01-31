import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import {
  subscriptionsService,
  type CreateSubscriptionDto,
} from '../../services/subscriptions.service';
import { accountsService } from '../../services/accounts.service';
import { categoriesService } from '../../services/categories.service';
import { getApiErrorMessage } from '../../services/api';
import { FREQUENCY_LABELS, SUBSCRIPTION_PRESETS } from '@moneystack/shared';
import type { Subscription, Account, Category } from '@moneystack/shared';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
}

const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function SubscriptionModal({ isOpen, onClose, subscription }: SubscriptionModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateSubscriptionDto>({
    accountId: '',
    categoryId: '',
    name: '',
    amount: 0,
    frequency: 'MONTHLY',
    reminderDays: 3,
    icon: '',
    color: '#3B82F6',
    notes: '',
    paymentDay: new Date().getDate(),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        accountId: subscription.accountId,
        categoryId: subscription.categoryId || '',
        name: subscription.name,
        amount: subscription.amount,
        frequency: subscription.frequency,
        reminderDays: subscription.reminderDays || 3,
        icon: subscription.icon || '',
        color: subscription.color || '#3B82F6',
        notes: subscription.notes || '',
        paymentDay: subscription.paymentDay || new Date().getDate(),
      });
    } else {
      setFormData({
        accountId: accounts?.[0]?.id || '',
        categoryId: '',
        name: '',
        amount: 0,
        frequency: 'MONTHLY',
        reminderDays: 3,
        icon: '',
        color: '#3B82F6',
        notes: '',
        paymentDay: new Date().getDate(),
      });
    }
  }, [subscription, isOpen, accounts]);

  const createMutation = useMutation({
    mutationFn: subscriptionsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Abonnement ajouté avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubscriptionDto> }) =>
      subscriptionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Abonnement mis à jour');
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
      toast.error("Veuillez entrer un nom pour l'abonnement");
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    if (!formData.paymentDay || formData.paymentDay < 1 || formData.paymentDay > 31) {
      toast.error('Le jour de prélèvement doit être entre 1 et 31');
      return;
    }

    if (subscription) {
      updateMutation.mutate({ id: subscription.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePresetSelect = (preset: (typeof SUBSCRIPTION_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      amount: preset.defaultAmount,
      icon: preset.icon,
      color: preset.color,
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const accountOptions = (accounts || []).map((acc: Account) => ({
    value: acc.id,
    label: acc.name,
  }));

  const expenseCategories = (categories || []).filter(
    (cat: Category) => cat.type === 'EXPENSE'
  );
  const categoryOptions = [
    { value: '', label: 'Sans catégorie' },
    ...expenseCategories.map((cat: Category) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? "Modifier l'abonnement" : 'Nouvel abonnement'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Presets */}
          {!subscription && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggestions rapides
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBSCRIPTION_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="px-3 py-1.5 text-sm rounded-full border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    style={{ borderColor: preset.color + '40' }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Nom de l'abonnement"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Netflix"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Montant"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="9.99"
              required
            />

            <Select
              label="Fréquence"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              options={FREQUENCY_OPTIONS}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Compte"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              options={accountOptions}
              required
            />

            <Select
              label="Catégorie"
              value={formData.categoryId || ''}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categoryOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jour de prélèvement (1-31)"
              type="number"
              min="1"
              max="31"
              value={formData.paymentDay || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentDay: parseInt(e.target.value, 10) || 1,
                })
              }
              placeholder="Ex: 15"
              required
            />

            <Input
              label="Rappel (jours avant)"
              type="number"
              min="0"
              max="30"
              value={formData.reminderDays || ''}
              onChange={(e) =>
                setFormData({ ...formData, reminderDays: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
            <div className="flex gap-2">
              {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
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
            {subscription ? 'Mettre à jour' : 'Créer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

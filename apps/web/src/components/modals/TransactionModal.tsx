import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { transactionsService } from '../../services/transactions.service';
import { accountsService } from '../../services/accounts.service';
import { categoriesService } from '../../services/categories.service';
import { getApiErrorMessage } from '../../services/api';
import { FREQUENCY_LABELS } from '@moneystack/shared';
import type { Transaction, Category, Account } from '@moneystack/shared';

const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

const TRANSACTION_TYPES = [
  { value: 'EXPENSE', label: 'Dépense' },
  { value: 'INCOME', label: 'Revenu' },
  { value: 'TRANSFER', label: 'Transfert' },
];

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    amount: 0,
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME' | 'TRANSFER',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    isRecurring: false,
    recurringFrequency: 'MONTHLY' as string,
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
    if (transaction) {
      setFormData({
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || '',
        amount: transaction.amount,
        type: transaction.type as 'EXPENSE' | 'INCOME' | 'TRANSFER',
        description: transaction.description,
        date: new Date(transaction.date).toISOString().split('T')[0],
        tags: transaction.tags || [],
        isRecurring: transaction.isRecurring || false,
        recurringFrequency: transaction.recurringFrequency || 'MONTHLY',
      });
    } else {
      setFormData({
        accountId: accounts?.[0]?.id || '',
        categoryId: '',
        amount: 0,
        type: 'EXPENSE',
        description: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        isRecurring: false,
        recurringFrequency: 'MONTHLY',
      });
    }
  }, [transaction, isOpen, accounts]);

  const createMutation = useMutation({
    mutationFn: transactionsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction créée avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof transactionsService.update>[1] }) =>
      transactionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction mise à jour');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ne pas envoyer categoryId si vide (sinon erreur de validation UUID)
    const dataToSubmit = {
      ...formData,
      categoryId: formData.categoryId || undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
    } as Parameters<typeof transactionsService.update>[1];
    if (transaction) {
      updateMutation.mutate({ id: transaction.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit as Parameters<typeof transactionsService.create>[0]);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const accountOptions = (accounts || []).map((acc: Account) => ({
    value: acc.id,
    label: acc.name,
  }));

  const filteredCategories = (categories || []).filter((cat: Category) => {
    if (formData.type === 'TRANSFER') return false;
    // Categories match transaction type (INCOME/EXPENSE)
    return cat.type === formData.type;
  });

  const categoryOptions = [
    { value: '', label: 'Sans catégorie' },
    ...filteredCategories.map((cat: Category) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Modifier la transaction' : 'Nouvelle transaction'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {TRANSACTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  formData.type === type.value
                    ? type.value === 'INCOME'
                      ? 'bg-success-100 text-success-700 border-2 border-success-500'
                      : type.value === 'EXPENSE'
                        ? 'bg-danger-100 text-danger-700 border-2 border-danger-500'
                        : 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                }`}
                onClick={() => setFormData({ ...formData, type: type.value as typeof formData.type, categoryId: '' })}
              >
                {type.label}
              </button>
            ))}
          </div>

          <Input
            label="Montant"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ex: Courses au supermarché"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Compte"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              options={accountOptions}
              required
            />

            {formData.type !== 'TRANSFER' && (
              <Select
                label="Catégorie"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={categoryOptions}
              />
            )}
          </div>

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          {/* Option récurrent */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Transaction récurrente
                </span>
                <p className="text-xs text-gray-500">
                  {formData.type === 'INCOME'
                    ? 'Ex: Salaire, loyer reçu...'
                    : 'Ex: Facture mensuelle...'}
                </p>
              </div>
            </label>

            {formData.isRecurring && (
              <div className="mt-3">
                <Select
                  label="Fréquence"
                  value={formData.recurringFrequency}
                  onChange={(e) =>
                    setFormData({ ...formData, recurringFrequency: e.target.value })
                  }
                  options={FREQUENCY_OPTIONS}
                />
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {transaction ? 'Mettre à jour' : 'Créer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

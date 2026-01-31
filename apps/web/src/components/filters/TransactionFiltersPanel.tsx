// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useQuery } from '@tanstack/react-query';
import { X, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { accountsService } from '../../services/accounts.service';
import { categoriesService } from '../../services/categories.service';
import { TransactionType, TRANSACTION_TYPE_LABELS } from '@moneystack/shared';

export interface TransactionFiltersState {
  search: string;
  accountId: string;
  categoryId: string;
  type: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

interface TransactionFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
}

const initialFilters: TransactionFiltersState = {
  search: '',
  accountId: '',
  categoryId: '',
  type: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
};

export function TransactionFiltersPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: TransactionFiltersPanelProps) {
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  if (!isOpen) return null;

  const accountOptions = [
    { value: '', label: 'Tous les comptes' },
    ...accounts.map((account) => ({
      value: account.id,
      label: account.name,
    })),
  ];

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: TransactionType.INCOME, label: TRANSACTION_TYPE_LABELS[TransactionType.INCOME] },
    { value: TransactionType.EXPENSE, label: TRANSACTION_TYPE_LABELS[TransactionType.EXPENSE] },
    { value: TransactionType.TRANSFER, label: TRANSACTION_TYPE_LABELS[TransactionType.TRANSFER] },
  ];

  const handleInputChange = (field: keyof TransactionFiltersState, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onFiltersChange(initialFilters);
    onReset();
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== '').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtres avancés</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
              {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Compte"
          value={filters.accountId}
          onChange={(e) => handleInputChange('accountId', e.target.value)}
          options={accountOptions}
        />

        <Select
          label="Catégorie"
          value={filters.categoryId}
          onChange={(e) => handleInputChange('categoryId', e.target.value)}
          options={categoryOptions}
        />

        <Select
          label="Type"
          value={filters.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          options={typeOptions}
        />

        <div className="flex gap-2">
          <Input
            label="Date début"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
          />
          <Input
            label="Date fin"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
          />
        </div>

        <Input
          label="Montant min"
          type="number"
          min="0"
          step="0.01"
          value={filters.minAmount}
          onChange={(e) => handleInputChange('minAmount', e.target.value)}
          placeholder="0.00"
        />

        <Input
          label="Montant max"
          type="number"
          min="0"
          step="0.01"
          value={filters.maxAmount}
          onChange={(e) => handleInputChange('maxAmount', e.target.value)}
          placeholder="10000.00"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
        <Button variant="ghost" onClick={handleReset}>
          Réinitialiser
        </Button>
        <Button onClick={onApply}>
          Appliquer les filtres
        </Button>
      </div>
    </div>
  );
}

export { initialFilters };

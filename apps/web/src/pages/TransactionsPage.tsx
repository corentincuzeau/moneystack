import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Search, Download, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TransactionModal } from '../components/modals/TransactionModal';
import {
  TransactionFiltersPanel,
  initialFilters,
  type TransactionFiltersState,
} from '../components/filters/TransactionFiltersPanel';
import { transactionsService } from '../services/transactions.service';
import { getApiErrorMessage } from '../services/api';
import { formatCurrency, formatDate } from '@moneystack/shared';
import { clsx } from 'clsx';
import type { Transaction, TransactionFilters } from '@moneystack/shared';

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>({});
  const queryClient = useQueryClient();

  // Build query filters
  const queryFilters: TransactionFilters = {
    search: search || undefined,
    page,
    limit: 20,
    ...appliedFilters,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', queryFilters],
    queryFn: () => transactionsService.getAll(queryFilters),
  });

  const deleteMutation = useMutation({
    mutationFn: transactionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction supprimée');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const transactions = data?.data || [];
  const meta = data?.meta;

  const handleOpenModal = (transaction?: Transaction) => {
    setSelectedTransaction(transaction || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleApplyFilters = useCallback(() => {
    const newFilters: TransactionFilters = {};

    if (filters.accountId) newFilters.accountId = filters.accountId;
    if (filters.categoryId) newFilters.categoryId = filters.categoryId;
    if (filters.type) newFilters.type = filters.type as TransactionFilters['type'];
    if (filters.startDate) newFilters.startDate = filters.startDate;
    if (filters.endDate) newFilters.endDate = filters.endDate;
    if (filters.minAmount) newFilters.minAmount = parseFloat(filters.minAmount);
    if (filters.maxAmount) newFilters.maxAmount = parseFloat(filters.maxAmount);

    setAppliedFilters(newFilters);
    setPage(1);
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setAppliedFilters({});
    setPage(1);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!transactions || transactions.length === 0) {
      toast.error('Aucune transaction à exporter');
      return;
    }

    // Generate CSV content
    const headers = ['Date', 'Description', 'Catégorie', 'Compte', 'Type', 'Montant'];
    const rows = transactions.map((tx: Transaction) => [
      formatDate(tx.date),
      tx.description,
      tx.category?.name || 'Sans catégorie',
      tx.account?.name || 'Compte',
      tx.type === 'INCOME' ? 'Revenu' : tx.type === 'EXPENSE' ? 'Dépense' : 'Transfert',
      tx.type === 'EXPENSE' ? -tx.amount : tx.amount,
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
      ),
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Export réussi');
  }, [transactions]);

  const activeFiltersCount = Object.values(appliedFilters).filter((v) => v !== undefined).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
          Nouvelle transaction
        </Button>
      </div>

      {/* Search and quick actions */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="secondary"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              Filtres
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
            >
              Exporter
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filters panel */}
      <TransactionFiltersPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Transactions list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {meta?.total || 0} transaction{(meta?.total || 0) > 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="animate-pulse p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune transaction trouvée</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => handleOpenModal()}
              >
                Créer votre première transaction
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group"
                  onClick={() => handleOpenModal(tx)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        tx.type === 'INCOME'
                          ? 'bg-success-50 text-success-600'
                          : tx.type === 'EXPENSE'
                            ? 'bg-danger-50 text-danger-500'
                            : 'bg-primary-50 text-primary-600',
                      )}
                    >
                      {tx.type === 'INCOME' ? '↓' : tx.type === 'EXPENSE' ? '↑' : '⇄'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {tx.category?.name || 'Sans catégorie'} •{' '}
                        {tx.account?.name || 'Compte'} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={clsx(
                        'text-lg font-semibold',
                        tx.type === 'INCOME'
                          ? 'text-success-600'
                          : tx.type === 'EXPENSE'
                            ? 'text-danger-500'
                            : 'text-gray-900',
                      )}
                    >
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        className="p-1 rounded hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(tx);
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-danger-100"
                        onClick={(e) => handleDelete(tx.id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-danger-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {meta.page} sur {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={selectedTransaction}
      />
    </div>
  );
}

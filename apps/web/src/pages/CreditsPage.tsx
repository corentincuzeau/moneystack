import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingDown, Calendar, Percent, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CreditModal } from '../components/modals/CreditModal';
import { creditsService } from '../services/credits.service';
import { getApiErrorMessage } from '../services/api';
import { formatCurrency, formatDate, CREDIT_TYPE_LABELS } from '@moneystack/shared';
import type { Credit } from '@moneystack/shared';

export default function CreditsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  const { data: credits, isLoading } = useQuery({
    queryKey: ['credits'],
    queryFn: creditsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: creditsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Crédit supprimé');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleOpenModal = (credit?: Credit) => {
    setSelectedCredit(credit || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCredit(null);
    setIsModalOpen(false);
  };

  const handleDelete = (credit: Credit) => {
    if (window.confirm(`Supprimer le crédit "${credit.name}" ?`)) {
      deleteMutation.mutate(credit.id);
    }
  };

  const totalDebt = credits?.reduce((sum, c) => sum + c.remainingAmount, 0) || 0;
  const totalMonthly = credits?.reduce((sum, c) => sum + c.monthlyPayment, 0) || 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Crédits</h1>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
          Nouveau crédit
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-danger-500 to-danger-600 text-white">
          <CardBody>
            <p className="text-danger-100">Capital restant dû</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalDebt)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <CardBody>
            <p className="text-primary-100">Mensualités totales</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthly)}/mois</p>
          </CardBody>
        </Card>
      </div>

      {/* Credits list */}
      <div className="space-y-4">
        {credits?.map((credit) => {
          const progress =
            ((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100;

          return (
            <Card key={credit.id}>
              <CardBody>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-danger-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{credit.name}</h3>
                        <p className="text-sm text-gray-500">
                          {CREDIT_TYPE_LABELS[credit.type]}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progression</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          Remboursé: {formatCurrency(credit.totalAmount - credit.remainingAmount)}
                        </span>
                        <span>Total: {formatCurrency(credit.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Restant</p>
                      <p className="text-xl font-bold text-danger-500">
                        {formatCurrency(credit.remainingAmount)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Mensualité</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(credit.monthlyPayment)}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-gray-500 justify-center">
                        <Percent className="w-3 h-3" />
                        Taux
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {credit.interestRate}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-gray-500 justify-center">
                        <Calendar className="w-3 h-3" />
                        Fin
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(credit.endDate)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(credit)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(credit)}
                      >
                        <Trash2 className="w-4 h-4 text-danger-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}

        {credits?.length === 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-gray-500">Aucun crédit enregistré</p>
              <Button
                className="mt-4"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => handleOpenModal()}
              >
                Ajouter un crédit
              </Button>
            </CardBody>
          </Card>
        )}
      </div>

      <CreditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        credit={selectedCredit}
      />
    </div>
  );
}

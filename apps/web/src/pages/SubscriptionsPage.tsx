import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Bell, Edit2, Trash2, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SubscriptionModal } from '../components/modals/SubscriptionModal';
import { subscriptionsService } from '../services/subscriptions.service';
import { getApiErrorMessage } from '../services/api';
import { formatCurrency, formatDate, FREQUENCY_LABELS } from '@moneystack/shared';
import type { Subscription } from '@moneystack/shared';

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptionsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: subscriptionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Abonnement supprimé');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      subscriptionsService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const processDueMutation = useMutation({
    mutationFn: subscriptionsService.processDue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Abonnements dus traités');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleOpenModal = (subscription?: Subscription) => {
    setSelectedSubscription(subscription || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedSubscription(null);
    setIsModalOpen(false);
  };

  const handleDelete = (subscription: Subscription) => {
    if (window.confirm(`Supprimer l'abonnement "${subscription.name}" ?`)) {
      deleteMutation.mutate(subscription.id);
    }
  };

  const handleToggleActive = (subscription: Subscription) => {
    toggleMutation.mutate({ id: subscription.id, isActive: !subscription.isActive });
  };

  const activeSubscriptions = subscriptions?.filter((s) => s.isActive) || [];
  const totalMonthly = activeSubscriptions.reduce((sum, s) => {
    const monthlyAmount =
      s.frequency === 'YEARLY'
        ? s.amount / 12
        : s.frequency === 'QUARTERLY'
          ? s.amount / 3
          : s.amount;
    return sum + monthlyAmount;
  }, 0);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Play className="w-4 h-4" />}
            onClick={() => processDueMutation.mutate()}
            isLoading={processDueMutation.isPending}
          >
            Traiter les paiements dus
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
            Nouvel abonnement
          </Button>
        </div>
      </div>

      {/* Summary card */}
      <Card className="bg-gradient-to-r from-warning-500 to-warning-600 text-white">
        <CardBody>
          <p className="text-warning-100">Coût mensuel total</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthly)}</p>
          <p className="text-warning-200 text-sm mt-2">
            {activeSubscriptions.length} abonnement
            {activeSubscriptions.length > 1 ? 's' : ''} actif
            {activeSubscriptions.length > 1 ? 's' : ''}
          </p>
        </CardBody>
      </Card>

      {/* Subscriptions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions?.map((subscription) => (
          <Card
            key={subscription.id}
            className={!subscription.isActive ? 'opacity-60' : ''}
          >
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: subscription.color
                        ? `${subscription.color}20`
                        : '#f3f4f6',
                    }}
                  >
                    <span className="text-lg">📺</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{subscription.name}</h3>
                    <p className="text-xs text-gray-500">
                      {FREQUENCY_LABELS[subscription.frequency]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(subscription)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title={subscription.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {subscription.isActive ? (
                      <ToggleRight className="w-5 h-5 text-success-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(subscription.amount)}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {formatDate(subscription.nextPaymentDate)}
                </div>
              </div>

              {subscription.reminderDays > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                  <Bell className="w-3 h-3" />
                  Rappel {subscription.reminderDays} jour
                  {subscription.reminderDays > 1 ? 's' : ''} avant
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenModal(subscription)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(subscription)}>
                  <Trash2 className="w-4 h-4 text-danger-500" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}

        {/* Add subscription card */}
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-warning-300 transition-colors cursor-pointer"
          onClick={() => handleOpenModal()}
        >
          <CardBody className="flex flex-col items-center justify-center h-full min-h-[160px]">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Ajouter un abonnement</p>
          </CardBody>
        </Card>
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        subscription={selectedSubscription}
      />
    </div>
  );
}

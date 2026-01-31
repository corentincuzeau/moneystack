import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { User, Shield, Globe, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useAuthStore } from '../stores/auth.store';
import api, { getApiErrorMessage } from '../services/api';

interface SettingsForm {
  currency: string;
  locale: string;
  timezone: string;
  lowBalanceThreshold: number;
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/users/settings');
      return response.data.data;
    },
  });

  const { register, handleSubmit, formState: { isDirty } } = useForm<SettingsForm>({
    values: settings,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SettingsForm>) => {
      const response = await api.put('/users/settings', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Paramètres enregistrés');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/account');
    },
    onSuccess: () => {
      toast.success('Compte supprimé avec succès');
      logout();
      window.location.href = '/';
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'SUPPRIMER') {
      deleteAccountMutation.mutate();
    } else {
      toast.error('Veuillez taper SUPPRIMER pour confirmer');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <CardTitle>Profil</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Regional settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" />
              <CardTitle>Préférences régionales</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Devise</label>
                <select
                  {...register('currency')}
                  className="input"
                >
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar US (USD)</option>
                  <option value="GBP">Livre Sterling (GBP)</option>
                  <option value="CHF">Franc Suisse (CHF)</option>
                </select>
              </div>
              <div>
                <label className="label">Langue</label>
                <select
                  {...register('locale')}
                  className="input"
                >
                  <option value="fr-FR">Français</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Fuseau horaire</label>
              <select
                {...register('timezone')}
                className="input"
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </CardBody>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <CardTitle>Alertes</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <Input
              type="number"
              label="Seuil de solde bas"
              {...register('lowBalanceThreshold', { valueAsNumber: true })}
              helperText="Recevez une alerte quand votre solde passe en dessous de ce montant"
            />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty} isLoading={updateMutation.isPending}>
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <Card className="border-danger-200">
        <CardHeader>
          <CardTitle className="text-danger-500">Zone de danger</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-600 mb-4">
            La suppression de votre compte est irréversible. Toutes vos données seront
            définitivement effacées.
          </p>
          <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
            Supprimer mon compte
          </Button>
        </CardBody>
      </Card>

      {/* Delete account confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        title="Supprimer votre compte"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-danger-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-danger-700">Cette action est irréversible</p>
              <p className="text-sm text-danger-600 mt-1">
                Toutes vos données seront définitivement supprimées : comptes, transactions,
                crédits, abonnements et projets d'épargne.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tapez <span className="font-bold text-danger-500">SUPPRIMER</span> pour confirmer
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-transparent"
              placeholder="SUPPRIMER"
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteConfirmText('');
            }}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            isLoading={deleteAccountMutation.isPending}
            disabled={deleteConfirmText !== 'SUPPRIMER'}
          >
            Supprimer définitivement
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

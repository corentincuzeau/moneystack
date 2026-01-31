import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { accountsService } from '../../services/accounts.service';
import { getApiErrorMessage } from '../../services/api';
import { formatCurrency } from '@moneystack/shared';
import type { Account } from '@moneystack/shared';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromAccount?: Account | null;
}

export function TransferModal({ isOpen, onClose, fromAccount }: TransferModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    description: '',
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  useEffect(() => {
    if (fromAccount) {
      setFormData((prev) => ({
        ...prev,
        fromAccountId: fromAccount.id,
      }));
    }
  }, [fromAccount, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amount: 0,
        description: '',
      });
    }
  }, [isOpen]);

  const transferMutation = useMutation({
    mutationFn: accountsService.transfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfert effectué avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromAccountId || !formData.toAccountId) {
      toast.error('Veuillez sélectionner les comptes');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast.error('Vous ne pouvez pas transférer vers le même compte');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    const sourceAccount = accounts.find((a) => a.id === formData.fromAccountId);
    if (sourceAccount && formData.amount > sourceAccount.balance) {
      toast.error('Solde insuffisant');
      return;
    }

    transferMutation.mutate({
      fromAccountId: formData.fromAccountId,
      toAccountId: formData.toAccountId,
      amount: formData.amount,
      description: formData.description || undefined,
    });
  };

  const sourceAccount = accounts.find((a) => a.id === formData.fromAccountId);
  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: `${account.name} (${formatCurrency(account.balance)})`,
  }));

  const availableToAccounts = accountOptions.filter(
    (opt) => opt.value !== formData.fromAccountId
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfert entre comptes">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Select
            label="Compte source"
            value={formData.fromAccountId}
            onChange={(e) =>
              setFormData({ ...formData, fromAccountId: e.target.value, toAccountId: '' })
            }
            options={[{ value: '', label: 'Sélectionner un compte' }, ...accountOptions]}
            required
          />

          {sourceAccount && (
            <p className="text-sm text-gray-500">
              Solde disponible: <span className="font-medium">{formatCurrency(sourceAccount.balance)}</span>
            </p>
          )}

          <Select
            label="Compte destination"
            value={formData.toAccountId}
            onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
            options={[
              { value: '', label: 'Sélectionner un compte' },
              ...availableToAccounts,
            ]}
            required
            disabled={!formData.fromAccountId}
          />

          <Input
            label="Montant"
            type="number"
            step="0.01"
            min="0.01"
            max={sourceAccount?.balance}
            value={formData.amount || ''}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.00"
            required
          />

          <Input
            label="Description (optionnel)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ex: Transfert vers épargne"
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={transferMutation.isPending}>
            Transférer
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

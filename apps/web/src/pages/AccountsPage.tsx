import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Edit2, Trash2, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AccountModal } from '../components/modals/AccountModal';
import { TransferModal } from '../components/modals/TransferModal';
import { accountsService } from '../services/accounts.service';
import { getApiErrorMessage } from '../services/api';
import { formatCurrency, ACCOUNT_TYPE_LABELS } from '@moneystack/shared';
import { clsx } from 'clsx';
import type { Account } from '@moneystack/shared';

export default function AccountsPage() {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromAccount, setTransferFromAccount] = useState<Account | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: accountsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Compte supprimé');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenModal = (account?: Account) => {
    setSelectedAccount(account || null);
    setIsModalOpen(true);
    setShowMenu(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleOpenTransferModal = (account: Account) => {
    setTransferFromAccount(account);
    setIsTransferModalOpen(true);
    setShowMenu(null);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
    setTransferFromAccount(null);
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <h1 className="text-2xl font-bold text-gray-900">Comptes</h1>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
          Nouveau compte
        </Button>
      </div>

      {/* Total balance card */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <CardBody>
          <p className="text-primary-100">Solde total</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
          <p className="text-primary-200 text-sm mt-2">
            {accounts?.length || 0} compte{(accounts?.length || 0) > 1 ? 's' : ''}
          </p>
        </CardBody>
      </Card>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.map((account) => (
          <Card key={account.id} className="relative">
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${account.color}20` }}
                  >
                    <span style={{ color: account.color }} className="text-lg">
                      💰
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{account.name}</h3>
                    <p className="text-xs text-gray-500">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setShowMenu(showMenu === account.id ? null : account.id)}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>

                  {showMenu === account.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => handleOpenModal(account)}
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => handleOpenTransferModal(account)}
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                        Transférer
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-danger-500 hover:bg-danger-50 flex items-center gap-2"
                        onClick={() => {
                          handleDelete(account.id);
                          setShowMenu(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p
                  className={clsx(
                    'text-2xl font-bold',
                    account.balance >= 0 ? 'text-gray-900' : 'text-danger-500',
                  )}
                >
                  {formatCurrency(account.balance)}
                </p>
              </div>

              {account.isDefault && (
                <span className="inline-block mt-3 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                  Compte principal
                </span>
              )}
            </CardBody>
          </Card>
        ))}

        {/* Add account card */}
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-primary-300 transition-colors cursor-pointer"
          onClick={() => handleOpenModal()}
        >
          <CardBody className="flex flex-col items-center justify-center h-full min-h-[160px]">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Ajouter un compte</p>
          </CardBody>
        </Card>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={handleCloseTransferModal}
        fromAccount={transferFromAccount}
      />
    </div>
  );
}

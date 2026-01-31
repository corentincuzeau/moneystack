import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calculator,
  Wallet,
  CreditCard,
  Landmark,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  PiggyBank,
  AlertTriangle,
  Info,
  Eye,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { MonthDetailModal } from '../components/modals/MonthDetailModal';
import { accountsService } from '../services/accounts.service';
import { subscriptionsService } from '../services/subscriptions.service';
import { creditsService } from '../services/credits.service';
import { transactionsService } from '../services/transactions.service';
import { formatCurrency } from '@moneystack/shared';
import { clsx } from 'clsx';
import type { Account, Subscription, Credit } from '@moneystack/shared';

interface BudgetItem {
  id: string;
  type: 'subscription' | 'credit' | 'income';
  name: string;
  amount: number;
  accountId: string;
  accountName?: string;
  frequency?: string;
  isActive: boolean;
  checked: boolean;
  color?: string;
  icon?: string;
}

export default function BudgetSimulatorPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showExpenses, setShowExpenses] = useState(true);
  const [showIncomes, setShowIncomes] = useState(true);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // Fetch data
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAll,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptionsService.getAll,
  });

  const { data: credits = [] } = useQuery({
    queryKey: ['credits'],
    queryFn: creditsService.getAll,
  });

  const { data: recurringTransactionsResponse } = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: () => transactionsService.getAll({ isRecurring: true }),
  });

  const recurringTransactions = recurringTransactionsResponse?.data || [];

  // Build budget items list
  const budgetItems = useMemo(() => {
    const items: BudgetItem[] = [];

    // Add subscriptions as expenses
    subscriptions.forEach((sub: Subscription) => {
      if (!sub.isActive) return;

      // Calculate monthly amount based on frequency
      let monthlyAmount = sub.amount;
      if (sub.frequency === 'YEARLY') monthlyAmount = sub.amount / 12;
      if (sub.frequency === 'QUARTERLY') monthlyAmount = sub.amount / 3;
      if (sub.frequency === 'WEEKLY') monthlyAmount = sub.amount * 4.33;
      if (sub.frequency === 'BIWEEKLY') monthlyAmount = sub.amount * 2.17;
      if (sub.frequency === 'DAILY') monthlyAmount = sub.amount * 30;

      items.push({
        id: `sub-${sub.id}`,
        type: 'subscription',
        name: sub.name,
        amount: monthlyAmount,
        accountId: sub.accountId,
        accountName: sub.account?.name,
        frequency: sub.frequency,
        isActive: sub.isActive,
        checked: checkedItems[`sub-${sub.id}`] ?? true,
        color: sub.color || undefined,
        icon: sub.icon || undefined,
      });
    });

    // Add credits as expenses
    credits.forEach((credit: Credit) => {
      items.push({
        id: `credit-${credit.id}`,
        type: 'credit',
        name: credit.name,
        amount: credit.monthlyPayment,
        accountId: credit.accountId,
        accountName: credit.account?.name,
        isActive: true,
        checked: checkedItems[`credit-${credit.id}`] ?? true,
      });
    });

    // Add recurring incomes
    recurringTransactions.forEach((tx: { id: string; type: string; description: string; amount: number; accountId: string; account?: { name: string }; recurringFrequency?: string }) => {
      if (tx.type !== 'INCOME') return;

      let monthlyAmount = tx.amount;
      if (tx.recurringFrequency === 'YEARLY') monthlyAmount = tx.amount / 12;
      if (tx.recurringFrequency === 'QUARTERLY') monthlyAmount = tx.amount / 3;
      if (tx.recurringFrequency === 'WEEKLY') monthlyAmount = tx.amount * 4.33;
      if (tx.recurringFrequency === 'BIWEEKLY') monthlyAmount = tx.amount * 2.17;
      if (tx.recurringFrequency === 'DAILY') monthlyAmount = tx.amount * 30;

      items.push({
        id: `income-${tx.id}`,
        type: 'income',
        name: tx.description,
        amount: monthlyAmount,
        accountId: tx.accountId,
        accountName: tx.account?.name,
        frequency: tx.recurringFrequency,
        isActive: true,
        checked: checkedItems[`income-${tx.id}`] ?? true,
      });
    });

    return items;
  }, [subscriptions, credits, recurringTransactions, checkedItems]);

  // Filter items by selected account
  const filteredItems = useMemo(() => {
    if (selectedAccountId === 'all') return budgetItems;
    return budgetItems.filter((item) => item.accountId === selectedAccountId);
  }, [budgetItems, selectedAccountId]);

  // Separate expenses and incomes
  const expenses = filteredItems.filter((item) => item.type !== 'income');
  const incomes = filteredItems.filter((item) => item.type === 'income');

  // Calculate totals
  const calculations = useMemo(() => {
    const totalIncome = incomes
      .filter((item) => item.checked)
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = expenses
      .filter((item) => item.checked)
      .reduce((sum, item) => sum + item.amount, 0);

    const subscriptionTotal = expenses
      .filter((item) => item.type === 'subscription' && item.checked)
      .reduce((sum, item) => sum + item.amount, 0);

    const creditTotal = expenses
      .filter((item) => item.type === 'credit' && item.checked)
      .reduce((sum, item) => sum + item.amount, 0);

    const netBudget = totalIncome - totalExpenses;

    // Get selected account balance
    let accountBalance = 0;
    if (selectedAccountId === 'all') {
      accountBalance = accounts.reduce((sum: number, acc: Account) => sum + acc.balance, 0);
    } else {
      const account = accounts.find((acc: Account) => acc.id === selectedAccountId);
      accountBalance = account?.balance || 0;
    }

    const projectedBalance = accountBalance + netBudget;

    return {
      totalIncome,
      totalExpenses,
      subscriptionTotal,
      creditTotal,
      netBudget,
      accountBalance,
      projectedBalance,
    };
  }, [incomes, expenses, accounts, selectedAccountId]);

  // Toggle item checked state
  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id] && prev[id] !== undefined ? true : prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Toggle all items in a category
  const toggleAllExpenses = () => {
    const allChecked = expenses.every((item) => item.checked);
    const newCheckedItems = { ...checkedItems };
    expenses.forEach((item) => {
      newCheckedItems[item.id] = !allChecked;
    });
    setCheckedItems(newCheckedItems);
  };

  const toggleAllIncomes = () => {
    const allChecked = incomes.every((item) => item.checked);
    const newCheckedItems = { ...checkedItems };
    incomes.forEach((item) => {
      newCheckedItems[item.id] = !allChecked;
    });
    setCheckedItems(newCheckedItems);
  };

  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case 'DAILY': return '/jour';
      case 'WEEKLY': return '/semaine';
      case 'BIWEEKLY': return '/2 sem.';
      case 'MONTHLY': return '/mois';
      case 'QUARTERLY': return '/trim.';
      case 'YEARLY': return '/an';
      default: return '/mois';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary-600" />
            Simulateur de Budget
          </h1>
          <p className="text-gray-600 mt-1">
            Cochez ou décochez les éléments pour simuler votre budget mensuel
          </p>
        </div>

        {/* Account selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Compte :</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="input py-2 min-w-[200px]"
          >
            <option value="all">Tous les comptes</option>
            {accounts.map((account: Account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({formatCurrency(account.balance)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solde actuel</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculations.accountBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus mensuels</p>
                <p className="text-2xl font-bold text-success-600">
                  +{formatCurrency(calculations.totalIncome)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-50 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Charges mensuelles</p>
                <p className="text-2xl font-bold text-danger-500">
                  -{formatCurrency(calculations.totalExpenses)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Abon.: {formatCurrency(calculations.subscriptionTotal)} • Crédits: {formatCurrency(calculations.creditTotal)}
                </p>
              </div>
              <div className="w-12 h-12 bg-danger-50 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-danger-500" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className={clsx(
          calculations.netBudget >= 0 ? 'ring-2 ring-success-500' : 'ring-2 ring-danger-500'
        )}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget net mensuel</p>
                <p className={clsx(
                  'text-2xl font-bold',
                  calculations.netBudget >= 0 ? 'text-success-600' : 'text-danger-500'
                )}>
                  {calculations.netBudget >= 0 ? '+' : ''}{formatCurrency(calculations.netBudget)}
                </p>
              </div>
              <div className={clsx(
                'w-12 h-12 rounded-full flex items-center justify-center',
                calculations.netBudget >= 0 ? 'bg-success-50' : 'bg-danger-50'
              )}>
                <PiggyBank className={clsx(
                  'w-6 h-6',
                  calculations.netBudget >= 0 ? 'text-success-600' : 'text-danger-500'
                )} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Projected balance alert */}
      {calculations.netBudget < 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-danger-700">Attention : Budget déficitaire</p>
            <p className="text-sm text-danger-600 mt-1">
              Avec la configuration actuelle, vous dépensez plus que vous ne gagnez.
              Solde projeté après un mois : <strong>{formatCurrency(calculations.projectedBalance)}</strong>
            </p>
          </div>
        </div>
      )}

      {calculations.netBudget >= 0 && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-success-700">Budget équilibré</p>
            <p className="text-sm text-success-600 mt-1">
              Solde projeté après un mois : <strong>{formatCurrency(calculations.projectedBalance)}</strong>
              {calculations.netBudget > 0 && (
                <span> • Épargne potentielle : <strong>{formatCurrency(calculations.netBudget)}</strong>/mois</span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomes section */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowIncomes(!showIncomes)}
          >
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success-600" />
                Revenus récurrents
                <span className="text-sm font-normal text-gray-500">
                  ({incomes.length})
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-success-600">
                  +{formatCurrency(calculations.totalIncome)}
                </span>
                {showIncomes ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>

          {showIncomes && (
            <CardBody className="pt-0">
              {incomes.length > 0 ? (
                <>
                  <button
                    onClick={toggleAllIncomes}
                    className="text-sm text-primary-600 hover:text-primary-700 mb-3"
                  >
                    {incomes.every((item) => item.checked) ? 'Tout décocher' : 'Tout cocher'}
                  </button>
                  <div className="space-y-2">
                    {incomes.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={clsx(
                          'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all',
                          item.checked
                            ? 'bg-success-50 border border-success-200'
                            : 'bg-gray-50 border border-gray-200 opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {item.checked ? (
                            <CheckCircle2 className="w-5 h-5 text-success-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <p className={clsx(
                              'font-medium',
                              item.checked ? 'text-gray-900' : 'text-gray-500 line-through'
                            )}>
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.accountName} {item.frequency && `• ${getFrequencyLabel(item.frequency)}`}
                            </p>
                          </div>
                        </div>
                        <span className={clsx(
                          'font-bold',
                          item.checked ? 'text-success-600' : 'text-gray-400'
                        )}>
                          +{formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p>Aucun revenu récurrent</p>
                  <p className="text-sm">Ajoutez des transactions récurrentes de type "Revenu"</p>
                </div>
              )}
            </CardBody>
          )}
        </Card>

        {/* Expenses section */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowExpenses(!showExpenses)}
          >
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-danger-500" />
                Charges fixes
                <span className="text-sm font-normal text-gray-500">
                  ({expenses.length})
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-danger-500">
                  -{formatCurrency(calculations.totalExpenses)}
                </span>
                {showExpenses ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>

          {showExpenses && (
            <CardBody className="pt-0">
              {expenses.length > 0 ? (
                <>
                  <button
                    onClick={toggleAllExpenses}
                    className="text-sm text-primary-600 hover:text-primary-700 mb-3"
                  >
                    {expenses.every((item) => item.checked) ? 'Tout décocher' : 'Tout cocher'}
                  </button>

                  {/* Subscriptions */}
                  {expenses.filter((e) => e.type === 'subscription').length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Abonnements ({expenses.filter((e) => e.type === 'subscription').length})
                      </p>
                      <div className="space-y-2">
                        {expenses
                          .filter((e) => e.type === 'subscription')
                          .map((item) => (
                            <div
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={clsx(
                                'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all',
                                item.checked
                                  ? 'bg-danger-50 border border-danger-200'
                                  : 'bg-gray-50 border border-gray-200 opacity-60'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {item.checked ? (
                                  <CheckCircle2 className="w-5 h-5 text-danger-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                                <div>
                                  <p className={clsx(
                                    'font-medium',
                                    item.checked ? 'text-gray-900' : 'text-gray-500 line-through'
                                  )}>
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.accountName} {item.frequency && `• ${getFrequencyLabel(item.frequency)}`}
                                  </p>
                                </div>
                              </div>
                              <span className={clsx(
                                'font-bold',
                                item.checked ? 'text-danger-500' : 'text-gray-400'
                              )}>
                                -{formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Credits */}
                  {expenses.filter((e) => e.type === 'credit').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Landmark className="w-4 h-4" />
                        Crédits ({expenses.filter((e) => e.type === 'credit').length})
                      </p>
                      <div className="space-y-2">
                        {expenses
                          .filter((e) => e.type === 'credit')
                          .map((item) => (
                            <div
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={clsx(
                                'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all',
                                item.checked
                                  ? 'bg-danger-50 border border-danger-200'
                                  : 'bg-gray-50 border border-gray-200 opacity-60'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {item.checked ? (
                                  <CheckCircle2 className="w-5 h-5 text-danger-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                                <div>
                                  <p className={clsx(
                                    'font-medium',
                                    item.checked ? 'text-gray-900' : 'text-gray-500 line-through'
                                  )}>
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.accountName} • /mois
                                  </p>
                                </div>
                              </div>
                              <span className={clsx(
                                'font-bold',
                                item.checked ? 'text-danger-500' : 'text-gray-400'
                              )}>
                                -{formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingDown className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p>Aucune charge fixe</p>
                  <p className="text-sm">Ajoutez des abonnements ou crédits</p>
                </div>
              )}
            </CardBody>
          )}
        </Card>
      </div>

      {/* Monthly projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary-600" />
            Projection sur 12 mois
            <span className="text-xs font-normal text-gray-500 ml-2 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Cliquez sur un mois pour voir le détail
            </span>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {Array.from({ length: 12 }, (_, i) => {
                const projectedBalance = calculations.accountBalance + (calculations.netBudget * (i + 1));
                const now = new Date();
                const futureMonth = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
                const monthName = futureMonth.toLocaleDateString('fr-FR', { month: 'short' });
                const year = futureMonth.getFullYear();
                const currentYear = now.getFullYear();

                return (
                  <button
                    key={`projection-${i}`}
                    onClick={() => setSelectedMonthIndex(i)}
                    className={clsx(
                      'flex-shrink-0 w-24 p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105 hover:shadow-md',
                      projectedBalance >= 0 ? 'bg-success-50 hover:bg-success-100' : 'bg-danger-50 hover:bg-danger-100'
                    )}
                  >
                    <p className="text-xs text-gray-500 capitalize">
                      {monthName}
                      {year !== currentYear && <span className="block text-[10px]">{year}</span>}
                    </p>
                    <p className={clsx(
                      'text-sm font-bold mt-1',
                      projectedBalance >= 0 ? 'text-success-600' : 'text-danger-500'
                    )}>
                      {formatCurrency(projectedBalance)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Month detail modal */}
      {selectedMonthIndex !== null && (
        <MonthDetailModal
          isOpen={selectedMonthIndex !== null}
          onClose={() => setSelectedMonthIndex(null)}
          month={new Date(new Date().getFullYear(), new Date().getMonth() + selectedMonthIndex + 1, 1)}
          startingBalance={calculations.accountBalance + (calculations.netBudget * selectedMonthIndex)}
          subscriptions={subscriptions.filter((sub: Subscription) =>
            sub.isActive && (selectedAccountId === 'all' || sub.accountId === selectedAccountId)
          )}
          credits={credits.filter((credit: Credit) =>
            selectedAccountId === 'all' || credit.accountId === selectedAccountId
          )}
          recurringIncomes={recurringTransactions
            .filter((tx: { type: string; accountId: string }) =>
              tx.type === 'INCOME' && (selectedAccountId === 'all' || tx.accountId === selectedAccountId)
            )
            .map((tx: { id: string; description: string; amount: number; recurringFrequency?: string }) => ({
              id: tx.id,
              description: tx.description,
              amount: tx.amount,
              recurringFrequency: tx.recurringFrequency,
            }))}
          onPreviousMonth={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
          onNextMonth={() => setSelectedMonthIndex(Math.min(11, selectedMonthIndex + 1))}
          hasPreviousMonth={selectedMonthIndex > 0}
          hasNextMonth={selectedMonthIndex < 11}
        />
      )}
    </div>
  );
}

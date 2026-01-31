import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Calendar,
  Target,
  PiggyBank,
  CreditCard,
  Receipt,
  Eye,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Bar,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { dashboardService } from '../services/dashboard.service';
import { formatCurrency, formatDateShort } from '@moneystack/shared';
import { clsx } from 'clsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getStats,
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ['monthlyStats'],
    queryFn: () => dashboardService.getMonthlyStats(),
  });

  const { data: budgetSummary } = useQuery({
    queryKey: ['budgetSummary'],
    queryFn: dashboardService.getBudgetSummary,
  });

  const { data: futureProjection } = useQuery({
    queryKey: ['futureProjection'],
    queryFn: () => dashboardService.getFutureProjection(6),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solde total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus du mois</p>
                <p className="text-2xl font-bold text-success-600">
                  +{formatCurrency(stats.totalIncome)}
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
                <p className="text-sm text-gray-600">Dépenses du mois</p>
                <p className="text-2xl font-bold text-danger-500">
                  -{formatCurrency(stats.totalExpenses)}
                </p>
              </div>
              <div className="w-12 h-12 bg-danger-50 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-danger-500" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solde net</p>
                <p
                  className={clsx(
                    'text-2xl font-bold',
                    stats.netFlow >= 0 ? 'text-success-600' : 'text-danger-500',
                  )}
                >
                  {stats.netFlow >= 0 ? '+' : ''}
                  {formatCurrency(stats.netFlow)}
                </p>
              </div>
              <div
                className={clsx(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  stats.netFlow >= 0 ? 'bg-success-50' : 'bg-danger-50',
                )}
              >
                {stats.netFlow >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-success-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-danger-500" />
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Budget Summary */}
      {budgetSummary && (
        <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary-200" />
                  <p className="text-primary-200 text-sm">Revenus attendus</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetSummary.expectedMonthlyIncome)}
                </p>
                {budgetSummary.recurringIncomes.length === 0 && (
                  <p className="text-xs text-primary-300 mt-1">
                    Aucun revenu récurrent configuré
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-5 h-5 text-primary-200" />
                  <p className="text-primary-200 text-sm">Charges fixes</p>
                </div>
                <p className="text-2xl font-bold">
                  -{formatCurrency(budgetSummary.fixedExpenses.total)}
                </p>
                <p className="text-xs text-primary-300 mt-1">
                  Abonnements: {formatCurrency(budgetSummary.fixedExpenses.subscriptions)} •
                  Crédits: {formatCurrency(budgetSummary.fixedExpenses.credits)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-5 h-5 text-primary-200" />
                  <p className="text-primary-200 text-sm">Budget disponible</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetSummary.availableBudget)}
                </p>
                <p className="text-xs text-primary-300 mt-1">par mois pour dépenses libres</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-primary-200" />
                  <p className="text-primary-200 text-sm">Reste ce mois</p>
                </div>
                <p
                  className={clsx(
                    'text-2xl font-bold',
                    budgetSummary.remainingBudget < 0 && 'text-warning-300',
                  )}
                >
                  {formatCurrency(budgetSummary.remainingBudget)}
                </p>
                <p className="text-xs text-primary-300 mt-1">
                  Dépensé: {formatCurrency(budgetSummary.actualSpentThisMonth)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Future Projection */}
      {futureProjection && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Projection des prochains mois
            </CardTitle>
            {selectedMonthIndex !== null && (
              <button
                onClick={() => setSelectedMonthIndex(null)}
                className="text-sm text-primary-600 hover:underline"
              >
                Retour au graphique
              </button>
            )}
          </CardHeader>
          <CardBody>
            {/* Month selection tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {futureProjection.projection.map((month, index) => (
                <button
                  key={`projection-${index}`}
                  onClick={() => setSelectedMonthIndex(index)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    selectedMonthIndex === index
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                >
                  {month.monthLabel}
                </button>
              ))}
            </div>

            {selectedMonthIndex === null ? (
              <>
                {/* Chart view */}
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={futureProjection.projection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="monthLabel"
                        tickFormatter={(v) => v.split(' ')[0].substring(0, 3)}
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => label}
                      />
                      <Legend />
                      <Bar dataKey="expectedIncome" name="Revenus" fill="#10b981" />
                      <Bar dataKey="expectedExpenses" name="Dépenses" fill="#ef4444" />
                      <Line
                        type="monotone"
                        dataKey="projectedBalance"
                        name="Solde projeté"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Revenus mensuels</p>
                    <p className="text-lg font-bold text-success-600">
                      +{formatCurrency(futureProjection.monthlyIncome)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Charges fixes</p>
                    <p className="text-lg font-bold text-danger-500">
                      -{formatCurrency(futureProjection.monthlyFixedExpenses)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Épargne mensuelle</p>
                    <p
                      className={clsx(
                        'text-lg font-bold',
                        futureProjection.monthlyIncome - futureProjection.monthlyFixedExpenses >= 0
                          ? 'text-success-600'
                          : 'text-danger-500',
                      )}
                    >
                      {futureProjection.monthlyIncome - futureProjection.monthlyFixedExpenses >= 0
                        ? '+'
                        : ''}
                      {formatCurrency(
                        futureProjection.monthlyIncome - futureProjection.monthlyFixedExpenses,
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Detailed month view */}
                {(() => {
                  const selectedMonth = futureProjection.projection[selectedMonthIndex];
                  return (
                    <div className="space-y-6">
                      {/* Month summary header */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">
                          {selectedMonth.monthLabel}
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Revenus prévus</p>
                            <p className="text-xl font-bold text-success-600">
                              +{formatCurrency(selectedMonth.expectedIncome)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Dépenses prévues</p>
                            <p className="text-xl font-bold text-danger-500">
                              -{formatCurrency(selectedMonth.expectedExpenses)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Solde projeté</p>
                            <p
                              className={clsx(
                                'text-xl font-bold',
                                selectedMonth.projectedBalance >= 0
                                  ? 'text-primary-600'
                                  : 'text-danger-500',
                              )}
                            >
                              {formatCurrency(selectedMonth.projectedBalance)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recurring incomes */}
                        <div>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                            <TrendingUp className="w-4 h-4 text-success-600" />
                            Revenus récurrents
                          </h4>
                          {futureProjection.recurringIncomes.length > 0 ? (
                            <div className="space-y-2">
                              {futureProjection.recurringIncomes.map((income) => (
                                <div
                                  key={income.id}
                                  className="flex items-center justify-between p-3 bg-success-50 rounded-lg"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {income.description}
                                    </p>
                                    <p className="text-xs text-gray-500">{income.frequency}</p>
                                  </div>
                                  <span className="text-sm font-bold text-success-600">
                                    +{formatCurrency(income.monthlyAmount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              Aucun revenu récurrent configuré
                            </p>
                          )}
                        </div>

                        {/* Subscriptions and credits */}
                        <div>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                            <Receipt className="w-4 h-4 text-danger-500" />
                            Charges fixes
                          </h4>
                          <div className="space-y-2">
                            {/* Subscriptions section */}
                            {futureProjection.subscriptions.length > 0 && (
                              <>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                  Abonnements
                                </p>
                                {futureProjection.subscriptions.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between p-3 bg-danger-50 rounded-lg"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                                      <p className="text-xs text-gray-500">
                                        Jour {sub.paymentDay} • {sub.frequency}
                                      </p>
                                    </div>
                                    <span className="text-sm font-bold text-danger-500">
                                      -{formatCurrency(sub.monthlyAmount)}
                                    </span>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Credits section */}
                            {futureProjection.credits && futureProjection.credits.length > 0 && (
                              <>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-3">
                                  Crédits
                                </p>
                                {futureProjection.credits.map((credit) => (
                                  <div
                                    key={credit.id}
                                    className="flex items-center justify-between p-3 bg-danger-50 rounded-lg"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {credit.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Jour {credit.paymentDay} • Restant:{' '}
                                        {formatCurrency(credit.remainingAmount)}
                                      </p>
                                    </div>
                                    <span className="text-sm font-bold text-danger-500">
                                      -{formatCurrency(credit.monthlyPayment)}
                                    </span>
                                  </div>
                                ))}
                              </>
                            )}

                            {futureProjection.subscriptions.length === 0 &&
                              (!futureProjection.credits || futureProjection.credits.length === 0) && (
                                <p className="text-sm text-gray-500 italic">Aucune charge fixe</p>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Net flow for this month */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Flux net du mois
                          </span>
                          <span
                            className={clsx(
                              'text-lg font-bold',
                              selectedMonth.netFlow >= 0 ? 'text-success-600' : 'text-danger-500',
                            )}
                          >
                            {selectedMonth.netFlow >= 0 ? '+' : ''}
                            {formatCurrency(selectedMonth.netFlow)}
                          </span>
                        </div>
                      </div>

                      {/* Navigation to next/prev month */}
                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() =>
                            setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))
                          }
                          disabled={selectedMonthIndex === 0}
                          className={clsx(
                            'flex items-center gap-1 text-sm',
                            selectedMonthIndex === 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-primary-600 hover:underline',
                          )}
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          Mois précédent
                        </button>
                        <button
                          onClick={() =>
                            setSelectedMonthIndex(
                              Math.min(
                                futureProjection.projection.length - 1,
                                selectedMonthIndex + 1,
                              ),
                            )
                          }
                          disabled={selectedMonthIndex === futureProjection.projection.length - 1}
                          className={clsx(
                            'flex items-center gap-1 text-sm',
                            selectedMonthIndex === futureProjection.projection.length - 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-primary-600 hover:underline',
                          )}
                        >
                          Mois suivant
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution mensuelle (historique)</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => v.substring(5)}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mois: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Revenus"
                    stroke="#10b981"
                    fill="#10b98120"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Dépenses"
                    stroke="#ef4444"
                    fill="#ef444420"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Accounts distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des comptes</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.accountBalances}
                    dataKey="balance"
                    nameKey="accountName"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {stats.accountBalances.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {stats.accountBalances.map((account, index) => (
                <div key={account.accountId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{account.accountName}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions récentes</CardTitle>
            <a
              href="/transactions"
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </a>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {tx.categoryName} • {formatDateShort(tx.date)}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      tx.type === 'INCOME' ? 'text-success-600' : 'text-danger-500',
                    )}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Upcoming payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Paiements à venir</CardTitle>
            <Calendar className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {stats.upcomingSubscriptions.map((sub) => (
                <div key={sub.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateShort(sub.nextPaymentDate)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(sub.amount)}
                  </span>
                </div>
              ))}
              {stats.upcomingSubscriptions.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  Aucun paiement à venir
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Savings goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projets d'épargne</CardTitle>
            <Target className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {stats.projectsProgress.map((project) => (
                <div key={project.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    <span className="text-xs text-gray-500">
                      {Math.round(project.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, project.progress)}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(project.currentAmount)} / {formatCurrency(project.targetAmount)}
                  </p>
                </div>
              ))}
              {stats.projectsProgress.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  Aucun projet en cours
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

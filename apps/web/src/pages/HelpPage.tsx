import {
  HelpCircle,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Landmark,
  Target,
  LayoutDashboard,
  CheckCircle2,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { clsx } from 'clsx';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips?: string[];
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Créez vos comptes',
    description:
      'Commencez par ajouter vos différents comptes bancaires, livrets d\'épargne, ou portefeuilles. Définissez le solde initial de chaque compte pour avoir une vue précise de votre situation financière.',
    icon: <Wallet className="w-6 h-6" />,
    tips: [
      'Ajoutez un compte pour chaque compte bancaire réel',
      'Utilisez des couleurs différentes pour les identifier facilement',
      'Définissez un compte par défaut pour vos transactions courantes',
    ],
  },
  {
    number: 2,
    title: 'Enregistrez vos transactions',
    description:
      'Ajoutez vos revenus et dépenses au fur et à mesure. Catégorisez-les pour mieux comprendre où va votre argent. Vous pouvez aussi créer des transactions récurrentes pour les opérations régulières.',
    icon: <ArrowLeftRight className="w-6 h-6" />,
    tips: [
      'Catégorisez chaque transaction pour un suivi précis',
      'Utilisez les transactions récurrentes pour votre salaire',
      'Ajoutez des tags pour filtrer facilement vos dépenses',
    ],
  },
  {
    number: 3,
    title: 'Gérez vos abonnements',
    description:
      'Listez tous vos abonnements mensuels (Netflix, Spotify, assurances, etc.). L\'application calculera automatiquement vos charges fixes et vous rappellera les prochains prélèvements.',
    icon: <CreditCard className="w-6 h-6" />,
    tips: [
      'Ajoutez la date de prélèvement pour chaque abonnement',
      'Vérifiez régulièrement les abonnements inutilisés',
      'Le total de vos abonnements apparaîtra dans le tableau de bord',
    ],
  },
  {
    number: 4,
    title: 'Suivez vos crédits',
    description:
      'Si vous avez des crédits en cours (immobilier, auto, consommation), ajoutez-les pour suivre le montant restant à rembourser et visualiser l\'impact sur votre budget mensuel.',
    icon: <Landmark className="w-6 h-6" />,
    tips: [
      'Renseignez le taux d\'intérêt pour un calcul précis',
      'Suivez l\'évolution du capital restant dû',
      'Planifiez vos remboursements anticipés',
    ],
  },
  {
    number: 5,
    title: 'Définissez vos projets d\'épargne',
    description:
      'Créez des objectifs d\'épargne pour vos projets (vacances, voiture, apport immobilier, etc.). Suivez votre progression et restez motivé pour atteindre vos objectifs financiers.',
    icon: <Target className="w-6 h-6" />,
    tips: [
      'Fixez des objectifs réalistes avec des échéances',
      'Contribuez régulièrement, même de petites sommes',
      'Célébrez chaque étape franchie !',
    ],
  },
  {
    number: 6,
    title: 'Consultez votre tableau de bord',
    description:
      'Votre tableau de bord vous donne une vue d\'ensemble de votre situation financière : solde total, évolution mensuelle, répartition des dépenses, et projections futures.',
    icon: <LayoutDashboard className="w-6 h-6" />,
    tips: [
      'Consultez-le régulièrement pour suivre votre progression',
      'Analysez les graphiques pour identifier les tendances',
      'Utilisez les projections pour anticiper votre budget',
    ],
  },
];

const faqs = [
  {
    question: 'Comment modifier une transaction ?',
    answer:
      'Rendez-vous dans la section "Transactions", cliquez sur la transaction que vous souhaitez modifier, puis utilisez le bouton d\'édition pour faire vos changements.',
  },
  {
    question: 'Comment faire un transfert entre comptes ?',
    answer:
      'Dans la section "Comptes", cliquez sur le bouton "Transfert". Sélectionnez le compte source, le compte destination, et le montant à transférer.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Oui, vos données sont stockées de manière sécurisée. Nous utilisons le chiffrement pour protéger vos informations et ne partageons jamais vos données avec des tiers.',
  },
  {
    question: 'Comment supprimer mon compte ?',
    answer:
      'Rendez-vous dans "Paramètres", puis dans la section "Zone de danger". Vous pourrez y supprimer définitivement votre compte et toutes vos données.',
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Guide d'utilisation</h1>
        <p className="text-gray-600 mt-2">
          Découvrez comment tirer le meilleur parti de MoneyStack en suivant ces étapes simples.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-primary-600" />
          Les étapes pour bien démarrer
        </h2>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.number} className="overflow-hidden">
              <div className="flex">
                {/* Step number */}
                <div
                  className={clsx(
                    'w-20 flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl',
                    index % 2 === 0 ? 'bg-primary-600' : 'bg-primary-500',
                  )}
                >
                  {step.number}
                </div>

                <div className="flex-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-3">
                      <span
                        className={clsx(
                          'p-2 rounded-lg',
                          index % 2 === 0 ? 'bg-primary-100 text-primary-600' : 'bg-primary-50 text-primary-500',
                        )}
                      >
                        {step.icon}
                      </span>
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <p className="text-gray-600 mb-4">{step.description}</p>

                    {step.tips && step.tips.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                          <Lightbulb className="w-4 h-4" />
                          Conseils
                        </div>
                        <ul className="space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm text-amber-800 flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardBody>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick summary */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <CardBody>
          <h3 className="text-lg font-bold mb-4">Résumé rapide</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                  {step.number}
                </span>
                <span className="text-sm text-primary-100">{step.title}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary-600" />
          Questions fréquentes
        </h2>

        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Card className="bg-gray-50 border-gray-200">
        <CardBody className="text-center">
          <HelpCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Besoin d'aide supplémentaire ?</h3>
          <p className="text-gray-600 text-sm">
            Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à consulter
            régulièrement cette page ou à explorer les différentes sections de l'application.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

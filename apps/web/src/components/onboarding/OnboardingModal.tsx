import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Calendar,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import api from '../../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: <Sparkles className="w-12 h-12" />,
    title: 'Bienvenue sur MoneyStack !',
    description:
      "Votre assistant personnel pour gérer vos finances. Découvrons ensemble les fonctionnalités principales.",
    features: [
      'Suivi de vos comptes bancaires',
      'Gestion de vos dépenses et revenus',
      'Planification de vos objectifs financiers',
    ],
    color: '#3B82F6',
  },
  {
    icon: <Wallet className="w-12 h-12" />,
    title: 'Gérez vos comptes',
    description:
      'Ajoutez tous vos comptes bancaires, espèces et cartes pour avoir une vue complète de vos finances.',
    features: [
      'Comptes courants et épargne',
      'Espèces et portefeuilles',
      'Soldes mis à jour automatiquement',
    ],
    color: '#10B981',
  },
  {
    icon: <TrendingUp className="w-12 h-12" />,
    title: 'Suivez vos transactions',
    description:
      'Enregistrez facilement vos dépenses et revenus pour comprendre où va votre argent.',
    features: [
      'Catégorisation automatique',
      'Filtres avancés et recherche',
      'Export CSV de vos données',
    ],
    color: '#8B5CF6',
  },
  {
    icon: <CreditCard className="w-12 h-12" />,
    title: 'Gérez vos crédits',
    description:
      'Suivez vos prêts et crédits en cours pour ne jamais manquer une échéance.',
    features: [
      'Suivi du capital restant dû',
      'Rappels avant échéance',
      'Historique des remboursements',
    ],
    color: '#EF4444',
  },
  {
    icon: <Calendar className="w-12 h-12" />,
    title: 'Abonnements et récurrences',
    description:
      'Gardez un oeil sur tous vos abonnements et paiements récurrents.',
    features: [
      'Netflix, Spotify, gym...',
      'Alertes avant prélèvement',
      'Coût mensuel total calculé',
    ],
    color: '#F59E0B',
  },
  {
    icon: <PiggyBank className="w-12 h-12" />,
    title: "Projets d'épargne",
    description:
      "Définissez vos objectifs et suivez votre progression vers vos rêves.",
    features: [
      'Vacances, voiture, maison...',
      'Contributions suivies',
      'Délais et progression visuelle',
    ],
    color: '#EC4899',
  },
];

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      await api.post('/users/complete-onboarding');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      onComplete();
    },
  });

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeMutation.mutate();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="" size="lg">
      <div className="text-center py-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary-500'
                  : index < currentStep
                    ? 'bg-primary-300'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center transition-colors"
          style={{ backgroundColor: `${step.color}15`, color: step.color }}
        >
          {step.icon}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{step.description}</p>

        {/* Features */}
        <div className="bg-gray-50 rounded-xl p-4 mb-8 max-w-sm mx-auto">
          <ul className="space-y-3 text-left">
            {step.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${step.color}20` }}
                >
                  <Check className="w-3 h-3" style={{ color: step.color }} />
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip}>
                Passer
              </Button>
            )}
          </div>

          <span className="text-sm text-gray-500">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </span>

          <Button onClick={handleNext} isLoading={completeMutation.isPending}>
            {isLastStep ? (
              <>
                Commencer
                <Sparkles className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

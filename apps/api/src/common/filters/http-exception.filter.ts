import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

// Mapping des messages d'erreur en français pour l'utilisateur
const ERROR_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Les données envoyées sont invalides',
  [HttpStatus.UNAUTHORIZED]: 'Vous devez être connecté pour accéder à cette ressource',
  [HttpStatus.FORBIDDEN]: 'Vous n\'avez pas les droits pour effectuer cette action',
  [HttpStatus.NOT_FOUND]: 'La ressource demandée n\'existe pas',
  [HttpStatus.CONFLICT]: 'Cette ressource existe déjà',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Une erreur interne est survenue. Veuillez réessayer plus tard',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Le service est temporairement indisponible',
};

// Mapping des messages de validation class-validator vers français
const VALIDATION_TRANSLATIONS: Record<string, string> = {
  // Général
  'must be a string': 'doit être un texte',
  'must be a number': 'doit être un nombre',
  'must be a boolean': 'doit être vrai ou faux',
  'must be an array': 'doit être une liste',
  'must be an email': 'doit être une adresse email valide',
  'must be a UUID': 'doit être un identifiant valide',
  'must be a valid ISO 8601 date string': 'doit être une date valide (format: AAAA-MM-JJ)',
  'should not be empty': 'ne doit pas être vide',
  'must not be empty': 'ne doit pas être vide',
  'must be longer than or equal to': 'doit contenir au moins',
  'must be shorter than or equal to': 'doit contenir au maximum',
  'must be a positive number': 'doit être un nombre positif',
  'must not be less than': 'doit être supérieur ou égal à',
  'must not be greater than': 'doit être inférieur ou égal à',
  'must be one of the following values': 'doit être une des valeurs suivantes',

  // Champs spécifiques
  'accountId': 'Le compte',
  'categoryId': 'La catégorie',
  'amount': 'Le montant',
  'type': 'Le type',
  'description': 'La description',
  'date': 'La date',
  'name': 'Le nom',
  'email': 'L\'email',
  'balance': 'Le solde',
  'color': 'La couleur',
  'icon': 'L\'icône',
  'targetAmount': 'Le montant cible',
  'currentAmount': 'Le montant actuel',
  'deadline': 'La date limite',
  'monthlyPayment': 'Le paiement mensuel',
  'interestRate': 'Le taux d\'intérêt',
  'totalAmount': 'Le montant total',
  'remainingAmount': 'Le montant restant',
  'nextPaymentDate': 'La prochaine échéance',
  'price': 'Le prix',
  'billingCycle': 'Le cycle de facturation',
};

function translateValidationMessage(message: string): string {
  let translated = message;

  // Traduire les noms de champs
  for (const [field, translation] of Object.entries(VALIDATION_TRANSLATIONS)) {
    const regex = new RegExp(`\\b${field}\\b`, 'gi');
    translated = translated.replace(regex, translation);
  }

  // Traduire les phrases de validation
  for (const [english, french] of Object.entries(VALIDATION_TRANSLATIONS)) {
    if (translated.toLowerCase().includes(english.toLowerCase())) {
      translated = translated.replace(new RegExp(english, 'gi'), french);
    }
  }

  return translated;
}

function getContextualErrorMessage(status: number, originalMessage: string, path: string): string {
  // Messages spécifiques par contexte
  const pathLower = path.toLowerCase();

  if (pathLower.includes('/transactions')) {
    if (status === HttpStatus.NOT_FOUND) return 'Transaction introuvable';
    if (status === HttpStatus.FORBIDDEN) return 'Vous n\'avez pas accès à cette transaction';
    if (originalMessage.includes('Invalid category')) return 'La catégorie sélectionnée est invalide';
    if (originalMessage.includes('account')) return 'Le compte sélectionné est invalide ou n\'existe pas';
  }

  if (pathLower.includes('/accounts')) {
    if (status === HttpStatus.NOT_FOUND) return 'Compte introuvable';
    if (status === HttpStatus.FORBIDDEN) return 'Vous n\'avez pas accès à ce compte';
    if (originalMessage.includes('default account')) return 'Impossible de supprimer le compte par défaut';
  }

  if (pathLower.includes('/categories')) {
    if (status === HttpStatus.NOT_FOUND) return 'Catégorie introuvable';
    if (status === HttpStatus.FORBIDDEN) return 'Vous n\'avez pas accès à cette catégorie';
    if (originalMessage.includes('default')) return 'Impossible de modifier les catégories par défaut';
  }

  if (pathLower.includes('/subscriptions')) {
    if (status === HttpStatus.NOT_FOUND) return 'Abonnement introuvable';
    if (status === HttpStatus.FORBIDDEN) return 'Vous n\'avez pas accès à cet abonnement';
  }

  if (pathLower.includes('/credits')) {
    if (status === HttpStatus.NOT_FOUND) return 'Crédit introuvable';
    if (status === HttpStatus.FORBIDDEN) return 'Vous n\'avez pas accès à ce crédit';
  }

  if (pathLower.includes('/projects')) {
    if (status === HttpStatus.NOT_FOUND) return 'Projet introuvable';
    if (status === HttpStatus.FORBIDDEN) return 'Vous n\'avez pas accès à ce projet';
  }

  if (pathLower.includes('/auth')) {
    if (status === HttpStatus.UNAUTHORIZED) return 'Identifiants incorrects ou session expirée';
    if (originalMessage.includes('token')) return 'Votre session a expiré, veuillez vous reconnecter';
  }

  if (pathLower.includes('/users')) {
    if (status === HttpStatus.NOT_FOUND) return 'Utilisateur introuvable';
    if (originalMessage.includes('email')) return 'Cette adresse email est déjà utilisée';
  }

  return originalMessage;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ERROR_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];
    let errors: string[] | undefined;
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as ExceptionResponse;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        // Récupérer le message original
        const originalMessage = exceptionResponse.message
          ? Array.isArray(exceptionResponse.message)
            ? exceptionResponse.message[0]
            : exceptionResponse.message
          : exceptionResponse.error || '';

        // Message contextualisé
        message = getContextualErrorMessage(status, originalMessage, request.url);

        // Pour les erreurs de validation, traduire tous les messages
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message.map(translateValidationMessage);
          message = errors[0];
        }
      }

      // Code d'erreur pour le debug
      errorCode = exception.constructor.name.replace('Exception', '').toUpperCase();
    } else if (exception instanceof Error) {
      // Erreur non gérée - ne pas exposer les détails au client
      message = ERROR_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    }

    // Si pas de message traduit, utiliser le message par défaut du status
    if (!message || message === 'Error') {
      message = ERROR_MESSAGES[status] || ERROR_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      ...(errors && errors.length > 1 && { errors }),
      ...(errorCode && { code: errorCode }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Logger les erreurs serveur
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        JSON.stringify({ ...errorResponse, stack: exception instanceof Error ? exception.stack : undefined }),
        'HttpExceptionFilter',
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${message}`,
        'HttpExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}

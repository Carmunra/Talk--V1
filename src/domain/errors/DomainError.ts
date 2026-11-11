export class DomainError extends Error {
  constructor(message: string, public readonly code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(required: number, available: number) {
    super(
      `Saldo insuficiente na carteira. Necessário: R$ ${required.toFixed(2)}, Disponível: R$ ${available.toFixed(2)}.`,
      'INSUFFICIENT_FUNDS'
    );
    this.name = 'InsufficientFundsError';
  }
}

export class ScheduleConflictError extends DomainError {
  constructor(message: string = 'Horário indisponível ou em conflito com outra aula agendada.') {
    super(message, 'SCHEDULE_CONFLICT');
    this.name = 'ScheduleConflictError';
  }
}

export class InvalidLessonStateError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_LESSON_STATE');
    this.name = 'InvalidLessonStateError';
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} com ID '${id}' não foi encontrado(a).`, 'ENTITY_NOT_FOUND');
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

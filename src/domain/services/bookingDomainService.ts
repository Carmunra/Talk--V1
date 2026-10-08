import {Teacher,Lesson,LessonStatus} from '../types';
import {ScheduleConflictError,ValidationError} from '../errors/DomainError';
export class BookingDomainService {
 static validateBookingSlot({teacher,existingTeacherLessons,existingStudentLessons=[],scheduledDate,startTime}:{
  teacher:Teacher;existingTeacherLessons:Lesson[];existingStudentLessons?:Lesson[];scheduledDate:string;startTime:string;
 }):void{
  const date=new Date(scheduledDate+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==scheduledDate||!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))
    throw new ValidationError('Data ou horário inválido.');
  if(Date.parse(scheduledDate+'T'+startTime+':00-03:00')<=Date.now())throw new ValidationError('Não é permitido reservar no passado.');
  const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
  const start=minutes(startTime),end=start+50;
  if(!teacher.availability.some(slot=>slot.dayOfWeek===date.getUTCDay()&&slot.isAvailable&&minutes(slot.startTime)<=start&&minutes(slot.endTime)>=end))
    throw new ScheduleConflictError('Horário fora da disponibilidade.');
  if([...existingTeacherLessons,...existingStudentLessons].some(lesson=>lesson.scheduledDate===scheduledDate&&lesson.status!==LessonStatus.Cancelled&&start<minutes(lesson.startTime)+lesson.durationMinutes&&end>minutes(lesson.startTime)))
    throw new ScheduleConflictError('Existe uma aula que ocupa este intervalo.');
 }
}

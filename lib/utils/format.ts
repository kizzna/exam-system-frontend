import { format, formatDistance, formatRelative } from 'date-fns';

export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  return format(new Date(date), formatStr);
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'PPP p');
}

export function formatRelativeTime(date: string | Date): string {
  return formatRelative(new Date(date), new Date());
}

export function formatDistanceTime(date: string | Date): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

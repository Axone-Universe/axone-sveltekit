import { format } from 'date-fns';

export function formattedDate(date: Date): string {
	return format(date, 'dd MMMM yyyy');
}

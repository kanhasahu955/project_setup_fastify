
import moment from 'moment';

export const formatDate = (date: any = new Date()): string => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

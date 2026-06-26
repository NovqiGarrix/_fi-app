import { Model } from '@nozbe/watermelondb';
import { date, field, text } from '@nozbe/watermelondb/decorators';

class Income extends Model {
    static table = 'incomes'

    @text('title') title!: string;
    @field('amount') amount!: number;
    @date('created_at') createdAt!: number;
}

export default Income
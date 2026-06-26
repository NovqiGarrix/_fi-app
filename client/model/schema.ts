import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'categories',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'color', type: 'string' },
            ],
        }),
        tableSchema({
            name: 'expenses',
            columns: [
                { name: 'title', type: 'string' },
                { name: 'amount', type: 'number' },
                { name: 'category_id', type: 'string', isIndexed: true }, // foreign key
                { name: 'created_at', type: 'number' }, // Unix timestamp
            ],
        }),
        tableSchema({
            name: 'incomes',
            columns: [
                { name: 'title', type: 'string' },
                { name: 'amount', type: 'number' },
                { name: 'created_at', type: 'number' }
            ],
        })
    ],
})
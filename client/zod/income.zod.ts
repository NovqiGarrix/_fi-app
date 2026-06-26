import { z } from 'zod';

export const addIncomeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    amount: z.number().min(1, "Amount must be a positive number"),
});

export type AddIncomeSchema = z.infer<typeof addIncomeSchema>;
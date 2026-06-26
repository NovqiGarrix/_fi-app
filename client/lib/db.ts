import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import Category from "@/model/Category.model";
import Expense from "@/model/Expense.model";
import Income from "@/model/Income.model";
import migrations from "../model/migrations";
import schema from "../model/schema";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // if using Hermes and modern Expo setup
  onSetUpError: (error) => {
    console.error("DB setup failed:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Category, Income, Expense],
});

export const categoryCollection =
  database.collections.get<Category>("categories");
export const incomeCollection = database.collections.get<Income>("incomes");
export const expenseCollection = database.collections.get<Expense>("expenses");
